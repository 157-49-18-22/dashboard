import { useApp } from "../../context/AppContext";
import { Send, Clock, User, MessageCircle, ExternalLink, Search, CheckCheck } from "lucide-react";
import "./SentMessages.css";

const SentMessages = () => {
  const { activityLogs, setSelectedQuery, setActiveTab } = useApp();
  
  const sentLogs = activityLogs.filter(log => log.type === "message");

  const handleNavigateToChat = (queryId) => {
    setSelectedQuery({ id: queryId });
    setActiveTab("queries");
  };

  return (
    <div className="sent-messages-panel">
      <header className="sent-header">
        <div className="sh-left">
          <h1>Message Outbox</h1>
          <p>Real-time log of every response sent by your team</p>
        </div>
        <div className="sh-right">
          <div className="stat-card">
            <span className="sc-label">Messages Sent Today</span>
            <div className="sc-val-wrap">
              <span className="sc-value">{sentLogs.length}</span>
              <div className="sc-icon-bg"><Send size={20} /></div>
            </div>
          </div>
        </div>
      </header>

      <div className="sent-toolbar">
        <div className="sent-search">
          <Search size={18} />
          <input type="text" placeholder="Search by recipient or content..." />
        </div>
        <div className="sent-filters">
          <button className="pill-btn active">All Agents</button>
          <button className="pill-btn">WhatsApp</button>
        </div>
      </div>

      <div className="sent-list-container">
        {sentLogs.length === 0 ? (
          <div className="no-sent-vibe">
            <div className="empty-illust">🕊️</div>
            <h3>Outbox is empty</h3>
            <p>Once your team starts replying to queries, they will appear here.</p>
          </div>
        ) : (
          <div className="sent-grid">
            {sentLogs.map((log) => (
              <div key={log.id} className="sent-card">
                <div className="card-top">
                  <div className="agent-tag-sm">
                    <div className="at-avatar">{log.agentName.charAt(0)}</div>
                    <span>{log.agentName}</span>
                  </div>
                  <span className="card-date">{log.time} • {log.date}</span>
                </div>
                
                <div className="card-content">
                  <div className="recipient-info">
                    <div className="rec-label">RECIPIENT</div>
                    <div className="rec-name">{log.customer}</div>
                  </div>
                  
                  <div className="message-bubble-preview">
                    <p>{log.details || "No message content available"}</p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SentMessages;
