import { createContext, useContext, useState, useEffect } from "react";
import { mockQueries, mockAgents, mockActivityLogs, currentUser } from "../data/mockData";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [queries, setQueries] = useState(mockQueries);
  const [agents] = useState(mockAgents);
  const [activityLogs, setActivityLogs] = useState(mockActivityLogs);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [activeTab, setActiveTab] = useState("queries");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Simulate incoming WhatsApp message every 30 seconds
  useEffect(() => {
    const names = ["Deepak Rao", "Sunita Jain", "Abhishek Nair", "Pooja Agarwal", "Ravi Dixit"];
    const messages = ["Mujhe help chahiye", "Order track karna hai", "Refund status kya hai?", "Kab tak reply milega?", "Urgent problem hai"];
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
  }, []);

  const sendMessage = (queryId, text) => {
    if (!text.trim()) return;
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const newMsg = { id: Date.now(), sender: "agent", text, time, agentName: currentUser.name };
    setQueries((prev) => prev.map((q) => q.id === queryId ? { ...q, messages: [...q.messages, newMsg], message: text, assignedTo: currentUser.id } : q));
    const query = queries.find((q) => q.id === queryId);
    setActivityLogs((prev) => [{ id: Date.now(), agentId: currentUser.id, agentName: currentUser.name, action: "Message bheja", customer: query?.name || "Unknown", time, type: "message" }, ...prev]);
  };

  const resolveQuery = (queryId) => {
    const query = queries.find((q) => q.id === queryId);
    setQueries((prev) => prev.map((q) => (q.id === queryId ? { ...q, status: "resolved" } : q)));
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setActivityLogs((prev) => [{ id: Date.now(), agentId: currentUser.id, agentName: currentUser.name, action: "Query resolve ki", customer: query?.name || "Unknown", time, type: "resolved" }, ...prev]);
    setSelectedQuery(null);
  };

  const assignQuery = (queryId) => {
    const query = queries.find((q) => q.id === queryId);
    setQueries((prev) => prev.map((q) => q.id === queryId ? { ...q, assignedTo: currentUser.id, status: "in_progress", unread: 0 } : q));
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setActivityLogs((prev) => [{ id: Date.now(), agentId: currentUser.id, agentName: currentUser.name, action: "Query assign li", customer: query?.name || "Unknown", time, type: "assigned" }, ...prev]);
  };

  const getFilteredQueries = () => filterStatus === "all" ? queries : queries.filter((q) => q.status === filterStatus);

  return (
    <AppContext.Provider value={{ queries, agents, activityLogs, selectedQuery, setSelectedQuery, activeTab, setActiveTab, filterStatus, setFilterStatus, newMessageAlert, soundEnabled, setSoundEnabled, sendMessage, resolveQuery, assignQuery, getFilteredQueries, currentUser }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
