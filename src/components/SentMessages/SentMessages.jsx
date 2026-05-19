import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Send, ExternalLink, Search, CheckCheck, Loader } from "lucide-react";
import { messagesAPI } from "../../services/api";
import "./SentMessages.css";

const SentMessages = () => {
  const { activityLogs, setSelectedQuery, setActiveTab, backendOnline } = useApp();
  
  // Real-time states
  const [sentList, setSentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("all");

  // Fetch live sent messages
  useEffect(() => {
    if (!backendOnline) {
      setLoading(false);
      return;
    }
    setLoading(true);
    messagesAPI.getSent()
      .then((res) => {
        if (res.success && res.messages) {
          setSentList(res.messages);
        }
      })
      .catch((err) => {
        console.error("Failed to load sent outbox logs:", err);
      })
      .finally(() => setLoading(false));
  }, [backendOnline]);

  const handleNavigateToChat = (queryId) => {
    if (!queryId) return;
    setSelectedQuery({ id: queryId });
    setActiveTab("queries");
  };

  // Standard local mock sent messages fallback
  const sentLogs = activityLogs.filter(log => log.type === "message");

  const displayMessages = backendOnline ? sentList : sentLogs;

  // Calculate sent messages today
  const todayStr = new Date().toISOString().split("T")[0];
  const messagesSentToday = backendOnline 
    ? sentList.filter(m => m.createdAt && m.createdAt.split("T")[0] === todayStr).length
    : sentLogs.length;

  // Extract unique agents present in logs for dynamic filters
  const uniqueAgents = Array.from(new Set(displayMessages.map(m => m.agentName))).filter(Boolean);

  // Apply filters
  const filteredMessages = displayMessages.filter(m => {
    // 1. Agent Filter
    if (selectedAgent !== "all" && m.agentName !== selectedAgent) {
      return false;
    }
    // 2. Search Query
    const name = (m.customerName || m.customer || "").toLowerCase();
    const content = (m.text || m.details || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || content.includes(query);
  });

  const formatMsgTime = (createdAt) => {
    if (!createdAt) return "";
    try {
      const d = new Date(createdAt);
      if (isNaN(d.getTime())) return createdAt;
      const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      const date = d.toISOString().split("T")[0];
      return `${time} • ${date}`;
    } catch {
      return createdAt;
    }
  };

  return (
    <div className="sent-messages-panel">
      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <header className="sent-header">
        <div className="sh-left">
          <h1>Message Outbox</h1>
          <p>Real-time log of every response sent by your team</p>
        </div>
        <div className="sh-right">
          <div className="stat-card">
            <span className="sc-label">Messages Sent Today</span>
            <div className="sc-val-wrap">
              <span className="sc-value">{messagesSentToday}</span>
              <div className="sc-icon-bg"><Send size={20} /></div>
            </div>
          </div>
        </div>
      </header>

      <div className="sent-toolbar">
        <div className="sent-search">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by recipient or content..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sent-filters">
          <button 
            className={`pill-btn ${selectedAgent === "all" ? "active" : ""}`}
            onClick={() => setSelectedAgent("all")}
          >
            All Agents
          </button>
          {uniqueAgents.map(agent => (
            <button
              key={agent}
              className={`pill-btn ${selectedAgent === agent ? "active" : ""}`}
              onClick={() => setSelectedAgent(agent)}
            >
              {agent}
            </button>
          ))}
        </div>
      </div>

      <div className="sent-list-container">
        {loading && backendOnline ? (
          <div style={{ textAlign: "center", padding: "80px", color: "#64748b" }}>
            <Loader className="spin" size={28} style={{ display: "inline-block", color: "#6366f1" }} />
            <p style={{ marginTop: "12px", fontSize: "15px", fontWeight: 600 }}>Loading real-time message outbox...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="no-sent-vibe">
            <div className="empty-illust">🕊️</div>
            <h3>Outbox is empty</h3>
            <p>No messages matching the filter or search query were found.</p>
          </div>
        ) : (
          <div className="sent-grid">
            {filteredMessages.map((log) => {
              const agentName = log.agentName || "Agent";
              const recipientName = log.customerName || log.customer || "Unknown";
              const messageText = log.text || log.details || "No message content available";
              const timeDisplay = backendOnline ? formatMsgTime(log.createdAt) : `${log.time} • ${log.date}`;

              return (
                <div key={log.id} className="sent-card">
                  <div className="card-top">
                    <div className="agent-tag-sm">
                      <div className="at-avatar">{agentName.charAt(0)}</div>
                      <span>{agentName}</span>
                    </div>
                    <span className="card-date">{timeDisplay}</span>
                  </div>
                  
                  <div className="card-content">
                    <div className="recipient-info">
                      <div className="rec-label">RECIPIENT</div>
                      <div className="rec-name">{recipientName}</div>
                    </div>
                    
                    <div className="message-bubble-preview">
                      <p>{messageText}</p>
                      <div className="bubble-meta">
                        <CheckCheck size={14} color="#25d366" /> <span>Delivered</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="channel-tag">WhatsApp API</div>
                    <button className="jump-btn" onClick={() => handleNavigateToChat(log.queryId)}>
                      View Conversation <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SentMessages;
