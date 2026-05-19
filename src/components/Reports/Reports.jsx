import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Calendar, Filter, Users, MessageSquare, CheckCircle, Search, X, Eye, ChevronLeft, Loader } from "lucide-react";
import { reportsAPI, activityAPI, messagesAPI } from "../../services/api";
import "./Reports.css";

const Reports = () => {
  const { agents, activityLogs, queries, backendOnline } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchAgent, setSearchAgent] = useState("");
  const [viewHistoryAgent, setViewHistoryAgent] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);

  // States for real backend data
  const [reportAgents, setReportAgents] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [modalLogs, setModalLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // Fetch report data on date change
  useEffect(() => {
    if (!backendOnline) {
      setLoadingReports(false);
      return;
    }
    setLoadingReports(true);
    reportsAPI.getAgentPerformance(selectedDate)
      .then((res) => {
        if (res.success && res.agents) {
          const formatted = res.agents.map(agent => ({
            ...agent,
            messagesSent: agent.sentToday || 0,
            queriesResolved: agent.resolvedToday || 0,
            dailyLogs: []
          }));
          setReportAgents(formatted);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch agent performance:", err);
      })
      .finally(() => setLoadingReports(false));
  }, [selectedDate, backendOnline]);

  // Load chat messages when log is expanded
  useEffect(() => {
    if (!expandedLog?.queryId || !backendOnline) {
      setChatMessages([]);
      return;
    }
    setLoadingChat(true);
    messagesAPI.getByQuery(expandedLog.queryId)
      .then((res) => {
        setChatMessages(res.messages || []);
      })
      .catch((err) => {
        console.error("Failed to load chat history:", err);
        setChatMessages([]);
      })
      .finally(() => setLoadingChat(false));
  }, [expandedLog?.queryId, backendOnline]);

  // Determine which agent list to display (real reports vs mock fallback)
  const displayAgents = backendOnline ? reportAgents : agents.map(agent => {
    const agentLogs = activityLogs.filter(l => {
      const logDate = l.date || new Date().toISOString().split("T")[0];
      return l.agentId === agent.id && logDate === selectedDate;
    });
    const msgs = agentLogs.filter(l => l.type === "message").length;
    const resolved = agentLogs.filter(l => l.type === "resolved").length;
    return {
      ...agent,
      messagesSent: msgs,
      queriesResolved: resolved,
      dailyLogs: agentLogs
    };
  });

  const filteredAgents = displayAgents.filter(a => a.name.toLowerCase().includes(searchAgent.toLowerCase()));

  const handleOpenHistory = (agent) => {
    setViewHistoryAgent(agent);
    setExpandedLog(null);
    if (!backendOnline) return;

    setLoadingLogs(true);
    activityAPI.getAll({ agentId: agent.id, date: selectedDate, limit: 100 })
      .then((res) => {
        setModalLogs(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch agent activity logs:", err);
        setModalLogs([]);
      })
      .finally(() => setLoadingLogs(false));
  };

  const displayLogs = backendOnline ? modalLogs : (viewHistoryAgent?.dailyLogs || []);

  const getChatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return timeStr;
    }
  };

  // Modern Export Report function to CSV
  const handleExport = () => {
    if (filteredAgents.length === 0) {
      alert("No data available to export.");
      return;
    }
    const headers = ["Agent Name", "Email", "Role", "Queries Replied", "Resolved Queries"];
    const rows = filteredAgents.map(a => [
      `"${a.name}"`,
      `"${a.email || "N/A"}"`,
      `"${a.role || "Support Agent"}"`,
      a.messagesSent,
      a.queriesResolved
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Superadmin_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <button className="export-btn" onClick={handleExport}>
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
            {loadingReports ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>
                  <Loader className="spin" size={24} style={{ display: "inline-block", color: "#6366f1" }} />
                  <p style={{ marginTop: "10px", color: "#64748b", fontWeight: 600 }}>Loading real-time performance reports...</p>
                </td>
              </tr>
            ) : filteredAgents.length === 0 ? (
              <tr><td colSpan="5" className="empty-msg">No data found for this date.</td></tr>
            ) : (
              filteredAgents.map(agent => (
                <tr key={agent.id}>
                  <td>
                    <div className="agent-profile">
                      <div className="agent-avatar">{agent.avatar || agent.name.split(" ").map(n => n[0]).join("")}</div>
                      <span className="agent-name">{agent.name}</span>
                    </div>
                  </td>
                  <td><span className="badge-role">{agent.role || "Support Agent"}</span></td>
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
                    <div className="customer-avatar">{(expandedLog.customer || "C").charAt(0)}</div>
                    <div>
                      <h4>{expandedLog.customer || "Customer"}</h4>
                      <p>Full Conversation Log</p>
                    </div>
                  </div>
                  <div className="chat-log-container">
                    {loadingChat ? (
                      <div style={{ display: "flex", justifyContent: "center", padding: "40px", color: "#64748b" }}>
                        <Loader className="spin" size={24} /> &nbsp; Loading conversation history...
                      </div>
                    ) : (
                      (() => {
                        const msgs = backendOnline 
                          ? chatMessages 
                          : (queries.find(q => q.id === expandedLog.queryId)?.messages || []);
                        
                        return msgs.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                            No messages found.
                          </div>
                        ) : (
                          msgs.map((msg, idx) => (
                            <div key={msg.id || idx} className={`log-msg-wrap ${msg.sender}`}>
                              <div className="log-bubble">
                                <p>{msg.text}</p>
                                <span className="log-time">
                                  {backendOnline ? getChatTime(msg.createdAt || msg.time) : msg.time}
                                </span>
                              </div>
                            </div>
                          ))
                        );
                      })()
                    )}
                  </div>
                </div>
              ) : (
                <div className="timeline-container">
                  {loadingLogs ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "40px", color: "#64748b" }}>
                      <Loader className="spin" size={24} /> &nbsp; Loading agent logs...
                    </div>
                  ) : displayLogs.length === 0 ? (
                    <div className="no-data-vibe" style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "14px" }}>
                      No interactions found for this date.
                    </div>
                  ) : (
                    displayLogs.map(log => (
                      <div 
                        key={log.id} 
                        className="log-card" 
                        onClick={() => log.queryId && setExpandedLog(log)}
                        style={{ cursor: log.queryId ? "pointer" : "default" }}
                      >
                        <div className="log-card-header">
                          <span className="log-timestamp">{log.time}</span>
                          <span className={`log-tag ${log.type}`}>{log.type}</span>
                        </div>
                        <div className="log-card-body">
                          <p><strong>Customer:</strong> {log.customer}</p>
                          <p><strong>Event:</strong> {log.action}</p>
                          {log.details && <p className="log-details-preview">"{log.details.substring(0, 80)}"</p>}
                        </div>
                        {log.queryId && (
                          <div className="log-card-footer">
                            <span>Click for full chat history →</span>
                          </div>
                        )}
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
