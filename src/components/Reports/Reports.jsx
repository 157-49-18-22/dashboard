import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Calendar, Filter, Users, MessageSquare, CheckCircle, Search, X, Eye, ChevronLeft } from "lucide-react";
import "./Reports.css";

const Reports = () => {
  const { agents, activityLogs, queries } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchAgent, setSearchAgent] = useState("");
  const [viewHistoryAgent, setViewHistoryAgent] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);

  const selectedDateStr = selectedDate;
  
  const reportData = agents.map(agent => {
    const agentLogs = activityLogs.filter(l => {
      const logDate = l.date || new Date().toISOString().split("T")[0];
      return l.agentId === agent.id && logDate === selectedDateStr;
    });
    const msgs = agentLogs.filter(l => l.type === "message").length;
    const resolved = agentLogs.filter(l => l.type === "resolved").length;
    return {
      ...agent,
      messagesSent: msgs,
      queriesResolved: resolved,
      dailyLogs: agentLogs
    };
  }).filter(a => a.name.toLowerCase().includes(searchAgent.toLowerCase()));

  const handleOpenHistory = (agent) => {
    setViewHistoryAgent(agent);
    setExpandedLog(null);
  };

  const getActivityChat = (queryId) => {
    return queries.find(q => q.id === queryId)?.messages || [];
  };

  return (
    <div className="reports-panel">
      <header className="reports-header">
        <div className="header-info">
          <h1>Superadmin Reports</h1>
          <p>Track agent performance and monitor quality</p>
        </div>
        <div className="header-actions">
          <div className="date-input-container">
            <Calendar size={16} />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <button className="export-btn">
            <Filter size={16} /> <span>Export Report</span>
          </button>
        </div>
      </header>

      <section className="reports-toolbar">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by agent name..."
            value={searchAgent}
            onChange={(e) => setSearchAgent(e.target.value)}
          />
        </div>
      </section>

      <div className="table-card">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Designation</th>
              <th>Queries Replied</th>
              <th>Resolved</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {reportData.length === 0 ? (
              <tr><td colSpan="5" className="empty-msg">No data found for this date.</td></tr>
            ) : (
              reportData.map(agent => (
                <tr key={agent.id}>
                  <td>
                    <div className="agent-profile">
                      <div className="agent-avatar">{agent.avatar}</div>
                      <span className="agent-name">{agent.name}</span>
                    </div>
                  </td>
                  <td><span className="badge-role">{agent.role}</span></td>
                  <td>
                    <div className="stat-pill message">
                      <MessageSquare size={14} /> {agent.messagesSent}
                    </div>
                  </td>
                  <td>
                    <div className="stat-pill success">
                      <CheckCircle size={14} /> {agent.queriesResolved}
                    </div>
                  </td>
                  <td className="text-right">
                    <button className="btn-view" onClick={() => handleOpenHistory(agent)}>
                      <Eye size={16} /> Chats
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modern Modal Overlay */}
      {viewHistoryAgent && (
        <div className="modal-overlay" onClick={() => setViewHistoryAgent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <div className="modal-header-left">
                {expandedLog ? (
                  <button className="btn-back" onClick={() => setExpandedLog(null)}>
                    <ChevronLeft size={20} /> Back to History
                  </button>
                ) : (
                  <div>
                    <h2>{viewHistoryAgent.name}'s Activity</h2>
                    <p>{new Date(selectedDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                )}
              </div>
              <button className="btn-close" onClick={() => setViewHistoryAgent(null)}><X size={20}/></button>
            </header>

            <div className="modal-body-scroll">
              {expandedLog ? (
                <div className="chat-preview-safe">
                  <div className="chat-info-bar">
                    <div className="customer-avatar">{expandedLog.customer.charAt(0)}</div>
                    <div>
                      <h4>{expandedLog.customer}</h4>
                      <p>Full Conversation Log</p>
                    </div>
                  </div>
                  <div className="chat-log-container">
                    {getActivityChat(expandedLog.queryId).map((msg, idx) => (
                      <div key={idx} className={`log-msg-wrap ${msg.sender}`}>
                        <div className="log-bubble">
                          <p>{msg.text}</p>
                          <span className="log-time">{msg.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="timeline-container">
                  {viewHistoryAgent.dailyLogs.length === 0 ? (
                    <div className="no-data-vibe">No interactions found for this date.</div>
                  ) : (
                    viewHistoryAgent.dailyLogs.map(log => (
                      <div 
                        key={log.id} 
                        className="log-card" 
                        onClick={() => log.queryId && setExpandedLog(log)}
                      >
                        <div className="log-card-header">
                          <span className="log-timestamp">{log.time}</span>
                          <span className={`log-tag ${log.type}`}>{log.type}</span>
                        </div>
                        <div className="log-card-body">
                          <p><strong>Customer:</strong> {log.customer}</p>
                          <p><strong>Event:</strong> {log.action}</p>
                          {log.details && <p className="log-details-preview">"{log.details.substring(0, 50)}..."</p>}
                        </div>
                        <div className="log-card-footer">
                          <span>Click for full chat history →</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
