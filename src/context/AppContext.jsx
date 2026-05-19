import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { queriesAPI, messagesAPI, agentsAPI, activityAPI } from "../services/api";
import { connectSocket, disconnectSocket, joinQueryRoom, leaveQueryRoom } from "../services/socket";

const AppContext = createContext();

// Fallback mock data (used when backend is offline)
import { mockQueries, mockAgents, mockActivityLogs } from "../data/mockData";

export const AppProvider = ({ children }) => {
  const [queries, setQueries]           = useState([]);
  const [agents, setAgents]             = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [currentUser, setCurrentUser]   = useState(null);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [activeTab, setActiveTab]       = useState("queries");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading]           = useState(true);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.play().catch(() => {});
  }, [soundEnabled]);

  // ── Load data from backend or fallback to mock ─────────────
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("crm_token");

        if (token) {
          // Fetch real data from backend
          const [qRes, aRes, logRes] = await Promise.all([
            queriesAPI.getAll({ limit: 50 }),
            agentsAPI.getAll(),
            activityAPI.getAll({ limit: 50 }),
          ]);
          setQueries(qRes.data || []);
          setAgents(aRes.agents || []);
          setActivityLogs(logRes.data || []);
          setBackendOnline(true);

          // Set current user from stored agent info
          const storedUser = localStorage.getItem("crm_user");
          if (storedUser) setCurrentUser(JSON.parse(storedUser));
          else setCurrentUser((aRes.agents || [])[0]);
        } else {
          // No token — use mock data so the UI still works
          setQueries(mockQueries);
          setAgents(mockAgents);
          setActivityLogs(mockActivityLogs);
          setCurrentUser(mockAgents.find((a) => a.id === "agent1") || mockAgents[0]);
          setBackendOnline(false);
        }
      } catch (err) {
        console.warn("Backend offline, using mock data:", err.message);
        setQueries(mockQueries);
        setAgents(mockAgents);
        setActivityLogs(mockActivityLogs);
        setCurrentUser(mockAgents.find((a) => a.id === "agent1") || mockAgents[0]);
        setBackendOnline(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Socket.io real-time connection ──────────────────────────
  useEffect(() => {
    if (!backendOnline || !currentUser) return;

    const socket = connectSocket(currentUser.id);

    // New query incoming (from WhatsApp webhook or simulation)
    socket.on("query:new", (newQuery) => {
      setQueries((prev) => {
        if (prev.find((q) => q.id === newQuery.id)) return prev;
        return [newQuery, ...prev];
      });
      setNewMessageAlert(true);
      playNotificationSound();
      setTimeout(() => setNewMessageAlert(false), 3000);
    });

    // New incoming customer message
    socket.on("query:newIncoming", ({ queryId, query, message }) => {
      setQueries((prev) => {
        const exists = prev.find((q) => q.id === queryId);
        if (!exists && query) return [query, ...prev];
        return prev.map((q) =>
          q.id === queryId
            ? { ...q, unread: (q.unread || 0) + 1, message: message?.text || q.message }
            : q
        );
      });
      setNewMessageAlert(true);
      playNotificationSound();
      setTimeout(() => setNewMessageAlert(false), 3000);
    });

    // Query assigned
    socket.on("query:assigned", ({ queryId, agentId, acceptedAt }) => {
      setQueries((prev) =>
        prev.map((q) =>
          q.id === queryId 
            ? { ...q, assignedTo: agentId, status: "in_progress", acceptedAt: acceptedAt || new Date().toISOString() } 
            : q
        )
      );
    });

    // Query resolved
    socket.on("query:resolved", ({ queryId }) => {
      setQueries((prev) =>
        prev.map((q) => (q.id === queryId ? { ...q, status: "resolved" } : q))
      );
    });

    // Agent status changed
    socket.on("agent:statusChanged", ({ agentId, status }) => {
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, status } : a))
      );
    });

    // Real-time message in open chat
    socket.on("message:new", (msg) => {
      setQueries((prev) =>
        prev.map((q) => {
          if (q.id !== msg.queryId) return q;
          
          const existing = q.messages || [];
          // Deduplicate: replace optimistic message (which has timestamp ID > 1000000000000)
          // with the real database message
          const cleanedMessages = existing.filter(m => {
            const isOptimisticMatch = 
              m.sender === msg.sender && 
              m.text === msg.text && 
              typeof m.id === 'number' && 
              m.id > 1000000000000;
            return !isOptimisticMatch && m.id !== msg.id;
          });
          
          return { 
            ...q, 
            message: msg.text,
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            messages: [...cleanedMessages, msg],
            unread: msg.sender === "customer" ? (q.unread || 0) + 1 : q.unread
          };
        })
      );

      if (msg.sender === "customer") {
        setNewMessageAlert(true);
        playNotificationSound();
        setTimeout(() => setNewMessageAlert(false), 3000);
      }
    });

    // Auto-unlock audio on first click anywhere on the page
    const unlockAudio = () => {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().then(() => {
        console.log("Audio Unlocked");
        document.removeEventListener('click', unlockAudio);
      }).catch(() => {});
    };
    document.addEventListener('click', unlockAudio);

    return () => {
      disconnectSocket();
      document.removeEventListener('click', unlockAudio);
    };
  }, [backendOnline, currentUser?.id]);

  // Join/leave query room when selected query changes
  useEffect(() => {
    if (!backendOnline) return;
    if (selectedQuery) joinQueryRoom(selectedQuery.id);
    return () => {
      if (selectedQuery) leaveQueryRoom(selectedQuery.id);
    };
  }, [selectedQuery?.id, backendOnline]);

  // ── Simulate incoming message (mock mode only) ─────────────
  useEffect(() => {
    if (backendOnline) return; // skip if real backend is running
    const names = ["Deepak Rao", "Sunita Jain", "Abhishek Nair", "Pooja Agarwal", "Ravi Dixit"];
    const messages = ["I need help", "Want to track my order", "What is my refund status?", "When will I get a reply?", "I have an urgent problem"];
    const priorities = ["high", "medium", "low"];
    const interval = setInterval(() => {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const initials = randomName.split(" ").map((n) => n[0]).join("");
      const newQuery = {
        id: `q_${Date.now()}`,
        from: `+91 ${Math.floor(Math.random() * 90000 + 10000)} ${Math.floor(Math.random() * 90000 + 10000)}`,
        name: randomName, avatar: initials, message: randomMsg,
        time: new Date().toISOString(), status: "open", assignedTo: null,
        unread: 1, priority: priorities[Math.floor(Math.random() * priorities.length)],
        messages: [{ id: 1, sender: "customer", text: randomMsg, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }],
      };
      setQueries((prev) => [newQuery, ...prev]);
      setNewMessageAlert(true);
      setTimeout(() => setNewMessageAlert(false), 3000);
    }, 30000);
    return () => clearInterval(interval);
  }, [backendOnline]);

  // ── Actions ────────────────────────────────────────────────

  const sendMessage = useCallback(async (queryId, text) => {
    if (!text.trim()) return;
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const newMsg = { id: Date.now(), sender: "agent", text, time, agentName: currentUser?.name };

    // Optimistic update
    setQueries((prev) =>
      prev.map((q) =>
        q.id === queryId
          ? { ...q, messages: [...(q.messages || []), newMsg], message: text, assignedTo: currentUser?.id }
          : q
      )
    );
    setActivityLogs((prev) => [{
      id: Date.now(), agentId: currentUser?.id, agentName: currentUser?.name,
      action: "Sent a message", customer: queries.find((q) => q.id === queryId)?.name || "Unknown",
      time, type: "message", date: new Date().toISOString().split("T")[0],
    }, ...prev]);

    // Real backend call
    if (backendOnline) {
      try {
        await messagesAPI.send(queryId, text);
      } catch (err) {
        console.error("Send message failed:", err.message);
        // Revert optimistic update on failure
        setQueries((prev) =>
          prev.map((q) =>
            q.id === queryId
              ? { ...q, messages: (q.messages || []).filter((m) => m.id !== newMsg.id) }
              : q
          )
        );
        throw err;
      }
    }
  }, [currentUser, queries, backendOnline]);

  const resolveQuery = useCallback(async (queryId) => {
    setQueries((prev) =>
      prev.map((q) => (q.id === queryId ? { ...q, status: "resolved" } : q))
    );
    const q = queries.find((q) => q.id === queryId);
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setActivityLogs((prev) => [{
      id: Date.now(), agentId: currentUser?.id, agentName: currentUser?.name,
      action: "Resolved the query", customer: q?.name || "Unknown",
      time, type: "resolved", date: new Date().toISOString().split("T")[0],
    }, ...prev]);
    setSelectedQuery(null);

    if (backendOnline) {
      try { await queriesAPI.resolve(queryId); } catch (err) { console.error(err.message); }
    }
  }, [currentUser, queries, backendOnline]);

  const assignQuery = useCallback(async (queryId) => {
    const q = queries.find((q) => q.id === queryId);
    setQueries((prev) =>
      prev.map((q) =>
        q.id === queryId ? { ...q, assignedTo: currentUser?.id, status: "in_progress", unread: 0 } : q
      )
    );
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setActivityLogs((prev) => [{
      id: Date.now(), agentId: currentUser?.id, agentName: currentUser?.name,
      action: "Assigned to self", customer: q?.name || "Unknown",
      time, type: "assigned", date: new Date().toISOString().split("T")[0],
    }, ...prev]);

    if (backendOnline) {
      try { await queriesAPI.assign(queryId, currentUser?.id); } catch (err) { console.error(err.message); }
    }
  }, [currentUser, queries, backendOnline]);

  const getFilteredQueries = useCallback(() => {
    const role = currentUser?.role?.toLowerCase() || "";
    const isAdmin = role.includes("admin") || role.includes("senior");
    
    // 1. Filter based on activeTab
    let visible = [];
    if (activeTab === "pool") {
      // In the Query Pool, show only UNASSIGNED queries (assignedTo is null/undefined)
      visible = queries.filter((q) => !q.assignedTo && q.status !== "resolved");
    } else if (activeTab === "queries") {
      // In normal Queries, show queries assigned to the logged-in agent (admins see all assigned queries)
      visible = isAdmin
        ? queries.filter((q) => q.assignedTo)
        : queries.filter((q) => q.assignedTo === currentUser?.id);
    } else {
      visible = queries;
    }
    
    // 2. Filter based on status (All, Open, In Progress, etc.)
    if (filterStatus !== "all") {
      visible = visible.filter((q) => q.status === filterStatus);
    }

    // 3. SORT by time (Most recent first) - This ensures new messages jump to the top
    return [...visible].sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [queries, currentUser, filterStatus, activeTab]);

  // Login action
  const login = (agent, token) => {
    localStorage.setItem("crm_token", token);
    localStorage.setItem("crm_user", JSON.stringify(agent));
    setCurrentUser(agent);
    setBackendOnline(true);
  };

  return (
    <AppContext.Provider value={{
      queries, setQueries,
      agents,
      activityLogs, setActivityLogs,
      selectedQuery, setSelectedQuery,
      activeTab, setActiveTab,
      filterStatus, setFilterStatus,
      newMessageAlert,
      soundEnabled, setSoundEnabled,
      sendMessage, resolveQuery, assignQuery,
      getFilteredQueries,
      currentUser, setCurrentUser,
      backendOnline,
      loading,
      login,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
