import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { queriesAPI, messagesAPI, agentsAPI, activityAPI } from "../services/api";
import { connectSocket, disconnectSocket, joinQueryRoom, leaveQueryRoom } from "../services/socket";

const AppContext = createContext();

// Synthesized high-fidelity Consonant Double Chime WAV Base64 (100% offline, zero CORS, zero latency)
const CHIME_WAV_BASE64 = "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";

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
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("crm_sound_enabled") !== "false";
  });
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading]           = useState(true);

  // Ref to hold soundEnabled to prevent stale closures in socket listeners
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    localStorage.setItem("crm_sound_enabled", String(soundEnabled));
  }, [soundEnabled]);

  // Ref to keep the latest queries list for socket sound rules (prevent stale closures)
  const queriesRef = useRef([]);
  useEffect(() => {
    queriesRef.current = queries;
  }, [queries]);

  // Helper to check if sound should play (simplified: always play if sound is enabled)
  const shouldPlaySound = useCallback(() => {
    return true;
  }, []);

  const playNotificationSound = useCallback((forcePlay = false) => {
    if (!soundEnabledRef.current && !forcePlay) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const now = ctx.currentTime;
      
      // Chime 1: soft high bell (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);
      
      // Chime 2: warm higher bell (C6) after 80ms
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1046.5, now + 0.08);
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
      
    } catch (err) {
      console.warn("Could not play notification sound via Web Audio Synth:", err);
    }
  }, []);

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
          const storedMockAgents = localStorage.getItem("crm_mock_agents");
          const initialAgents = storedMockAgents ? JSON.parse(storedMockAgents) : mockAgents;
          setAgents(initialAgents);
          setActivityLogs(mockActivityLogs);
          setCurrentUser(initialAgents.find((a) => a.id === "agent1") || initialAgents[0]);
          setBackendOnline(false);
        }
      } catch (err) {
        console.warn("Backend offline, using mock data:", err.message);
        setQueries(mockQueries);
        const storedMockAgents = localStorage.getItem("crm_mock_agents");
        const initialAgents = storedMockAgents ? JSON.parse(storedMockAgents) : mockAgents;
        setAgents(initialAgents);
        setActivityLogs(mockActivityLogs);
        setCurrentUser(initialAgents.find((a) => a.id === "agent1") || initialAgents[0]);
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
      if (shouldPlaySound(newQuery.id, newQuery)) {
        playNotificationSound();
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("New Query Received", {
            body: `${newQuery.name}: ${newQuery.message}`,
          });
        }
      }
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
      if (shouldPlaySound(queryId, query)) {
        playNotificationSound();
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("New Message from " + (query?.name || "Customer"), {
            body: message?.text || "New message received",
          });
        }
      }
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

    socket.on("agent:created", (newAgent) => {
      setAgents((prev) => {
        if (prev.find((a) => a.id === newAgent.id)) return prev;
        return [...prev, newAgent];
      });
    });

    socket.on("agent:updated", (updatedAgent) => {
      setAgents((prev) =>
        prev.map((a) => (a.id === updatedAgent.id ? { ...a, ...updatedAgent } : a))
      );
    });

    socket.on("agent:deleted", ({ agentId }) => {
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
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
        if (shouldPlaySound(msg.queryId)) {
          playNotificationSound();
        }
        setTimeout(() => setNewMessageAlert(false), 3000);
      }
    });

    // Auto-unlock audio on first click anywhere on the page
    const unlockAudio = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        ctx.resume().then(() => {
          console.log("AudioContext Unlocked");
          document.removeEventListener('click', unlockAudio);
        }).catch(() => {});
      } catch {}
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
      if (shouldPlaySound()) {
        playNotificationSound();
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("New Query Received (Mock)", {
            body: `${newQuery.name}: ${newQuery.message}`,
          });
        }
      }
      setTimeout(() => setNewMessageAlert(false), 3000);
    }, 30000);
    return () => clearInterval(interval);
  }, [backendOnline, playNotificationSound]);

  // ── Actions ────────────────────────────────────────────────

  const sendMessage = useCallback(async (queryId, payload) => {
    const text = payload?.text || "";
    const attachmentUrl = payload?.attachmentUrl || "";
    const messageType = payload?.messageType || "text";
    if (!text.trim() && !attachmentUrl.trim()) return;
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const messageText = attachmentUrl || text;
    const previewText = messageType === "image" ? "[Image]" : messageType === "document" ? "[Document]" : messageText;
    const newMsg = {
      id: Date.now(),
      sender: "agent",
      text: messageText,
      time,
      agentName: currentUser?.name,
      messageType,
      replyToMessageId: payload?.replyTo?.messageId || null,
      replyToText: payload?.replyTo?.text || null,
      replyToSender: payload?.replyTo?.sender || null,
      replyToMessageType: payload?.replyTo?.messageType || null,
    };

    // Optimistic update
    setQueries((prev) =>
      prev.map((q) =>
        q.id === queryId
          ? { ...q, messages: [...(q.messages || []), newMsg], message: previewText, assignedTo: currentUser?.id }
          : q
      )
    );
    setActivityLogs((prev) => [{
      id: Date.now(), agentId: currentUser?.id, agentName: currentUser?.name,
      action: "Sent a message", customer: queries.find((q) => q.id === queryId)?.name || "Unknown",
      time, type: "message", date: new Date().toISOString().split("T")[0],
    }, ...prev]);

    // Real backend call or mock auto-reply
    if (backendOnline) {
      try {
        await messagesAPI.send(queryId, payload);
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
    } else {
      // Mock mode auto-reply simulation to test sound immediately!
      setTimeout(() => {
        const replies = [
          "Okay, thank you!",
          "Can you please check my issue?",
          "Yes, that sounds perfect.",
          "I am waiting.",
          "Got it, thanks!",
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const replyMsg = {
          id: Date.now() + 1,
          sender: "customer",
          text: randomReply,
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        };
        setQueries((prev) =>
          prev.map((q) =>
            q.id === queryId
              ? {
                  ...q,
                  messages: [...(q.messages || []), replyMsg],
                  message: randomReply,
                  unread: (q.unread || 0) + 1,
                  time: new Date().toISOString(),
                }
              : q
          )
        );
        setNewMessageAlert(true);
        if (shouldPlaySound()) {
          playNotificationSound();
          const targetQ = queries.find(item => item.id === queryId);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("New Message from " + (targetQ?.name || "Customer"), {
              body: randomReply,
            });
          }
        }
        setTimeout(() => setNewMessageAlert(false), 3000);
      }, 2000);
    }
  }, [currentUser, queries, backendOnline, playNotificationSound]);

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

  const createAgent = useCallback(async (agentData) => {
    if (backendOnline) {
      const res = await agentsAPI.create(agentData);
      if (res.success) {
        setAgents((prev) => {
          if (prev.find((a) => a.id === res.agent.id)) return prev;
          return [...prev, res.agent];
        });
        return res.agent;
      }
      throw new Error(res.message || "Failed to create agent");
    } else {
      // Mock mode
      const initials = agentData.name.split(" ").map((n) => n[0]).join("").toUpperCase();
      const mockNewAgent = {
        id: `agent_${Date.now()}`,
        name: agentData.name,
        avatar: initials,
        email: agentData.email,
        role: agentData.role || "Support Agent",
        status: "offline",
        resolvedToday: 0,
        totalMessages: 0,
        avgResponseTime: "0 min",
        activeChats: 0,
      };
      setAgents((prev) => {
        const updated = [...prev, mockNewAgent];
        localStorage.setItem("crm_mock_agents", JSON.stringify(updated));
        return updated;
      });
      return mockNewAgent;
    }
  }, [backendOnline]);

  const deleteAgent = useCallback(async (agentId) => {
    if (backendOnline) {
      const res = await agentsAPI.delete(agentId);
      if (res.success) {
        setAgents((prev) => prev.filter((a) => a.id !== agentId));
        return true;
      }
      throw new Error(res.message || "Failed to delete agent");
    } else {
      // Mock mode
      setAgents((prev) => {
        const updated = prev.filter((a) => a.id !== agentId);
        localStorage.setItem("crm_mock_agents", JSON.stringify(updated));
        return updated;
      });
      return true;
    }
  }, [backendOnline]);

  const resetAgentPassword = useCallback(async (agentId, newPassword) => {
    if (backendOnline) {
      const res = await agentsAPI.resetPassword(agentId, newPassword);
      if (res.success) return res;
      throw new Error(res.message || "Failed to reset password");
    } else {
      // Mock mode — just return success (no real auth in mock)
      return { success: true, message: "Password reset successfully (mock mode)" };
    }
  }, [backendOnline]);

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
      agents, setAgents,
      activityLogs, setActivityLogs,
      selectedQuery, setSelectedQuery,
      activeTab, setActiveTab,
      filterStatus, setFilterStatus,
      newMessageAlert,
      soundEnabled, setSoundEnabled,
      playNotificationSound,
      sendMessage, resolveQuery, assignQuery,
      getFilteredQueries,
      currentUser, setCurrentUser,
      backendOnline,
      loading,
      login,
      createAgent,
      deleteAgent,
      resetAgentPassword,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
