import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ClipboardList, CheckCircle, Link, MessageSquare, TrendingUp, Award, Loader } from "lucide-react";
import { reportsAPI, activityAPI } from "../../services/api";
import "./ActivityLog.css";

const typeConfig = {
  resolved: { Icon: CheckCircle, color: "#25d366", bg: "#e6f9ee", label: "Resolved" },
  assigned: { Icon: Link, color: "#667eea", bg: "#ede9fe", label: "Assigned" },
  message: { Icon: MessageSquare, color: "#f59e0b", bg: "#fef3c7", label: "Message" },
  login: { Icon: Link, color: "#10b981", bg: "#d1fae5", label: "Login" },
};

const ActivityLog = () => {
  const { activityLogs, agents, backendOnline } = useApp();

  // Live States
  const [performanceList, setPerformanceList] = useState([]);
  const [loadingPerformance, setLoadingPerformance] = useState(true);
  const [liveLogs, setLiveLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Fetch performance and live logs
  useEffect(() => {
    if (!backendOnline) {
      setLoadingPerformance(false);
      setLoadingLogs(false);
      return;
    }
    
    setLoadingPerformance(true);
    reportsAPI.getAgentPerformance()
      .then((res) => {
        if (res.success && res.agents) {
          setPerformanceList(res.agents);
        }
      })
      .catch((err) => console.error("Failed to fetch agent performance leaderboard:", err))
      .finally(() => setLoadingPerformance(false));

    setLoadingLogs(true);
    activityAPI.getAll({ limit: 100 })
      .then((res) => {
        if (res.success && res.data) {
          setLiveLogs(res.data);
        }
      })
      .catch((err) => console.error("Failed to fetch live timeline logs:", err))
      .finally(() => setLoadingLogs(false));
  }, [backendOnline]);

  // Leaders calculations
  const displayAgents = backendOnline && performanceList.length > 0 ? performanceList : agents;
  
  const agentSummary = displayAgents.map((agent) => {
    if (backendOnline && performanceList.length > 0) {
      return {
        ...agent,
        resolved: agent.resolvedToday || 0,
        messages: agent.sentToday || 0,
        assigned: agent.activeChats || 0,
      };
    } else {
      const logs = activityLogs.filter((l) => l.agentId === agent.id);
      return {
        ...agent,
        resolved: logs.filter((l) => l.type === "resolved").length,
        messages: logs.filter((l) => l.type === "message").length,
        assigned: logs.filter((l) => l.type === "assigned").length,
      };
    }
  }).sort((a, b) => b.resolved - a.resolved);

  // Timeline logs selection
  const displayLogs = backendOnline && liveLogs.length > 0 ? liveLogs : activityLogs;

  return (
    <div className="activity-log">
      <div className="activity-log-inner">
        {/* Leaderboard */}
        <div className="log-section">
          <div className="section-title">
            <TrendingUp size={18} color="#1a202c" />
            <h2>Agent Performance</h2>
            {loadingPerformance && backendOnline && (
              <Loader className="spin" size={16} style={{ color: "#6366f1", marginLeft: "10px" }} />
            )}
          </div>
          
          <div className="summary-table-wrap">
            {loadingPerformance && backendOnline ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                <Loader className="spin" size={24} style={{ display: "inline-block", color: "#6366f1" }} />
                <p style={{ marginTop: "10px" }}>Loading agent performance ratings...</p>
              </div>
            ) : agentSummary.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No agents found.</div>
            ) : (
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>#</th><th>Agent</th><th>Status</th>
                    <th>Resolved</th><th>Messages</th><th>Assigned (Active)</th><th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {agentSummary.map((agent, idx) => {
                    const score = Math.min(100, agent.resolved * 8 + agent.messages * 2);
                    return (
                      <tr key={agent.id} className={idx === 0 ? "top-agent" : ""}>
                        <td>
                          {idx === 0 ? <Award size={16} color="#f59e0b" /> : <span className="rank">#{idx + 1}</span>}
                        </td>
                        <td>
                          <div className="table-agent">
                            <div className="table-avatar">{agent.avatar || agent.name.split(" ").map(n => n[0]).join("")}</div>
                            <div>
                              <div className="table-name">{agent.name}</div>
                              <div className="table-role">{agent.role || "Support Agent"}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className={`status-badge ${agent.status}`}>{agent.status}</span></td>
                        <td><span className="count-resolved">{agent.resolved}</span></td>
                        <td><span className="count-msg">{agent.messages}</span></td>
                        <td><span className="count-assigned">{agent.assigned}</span></td>
                        <td>
                          <div className="score-wrap">
                            <div className="score-bar"><div className="score-fill" style={{ width: `${score}%` }}></div></div>
                            <span className="score-num">{score}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="log-section">
          <div className="section-title">
            <ClipboardList size={18} color="#1a202c" />
            <h2>Activity Timeline</h2>
            {loadingLogs && backendOnline && (
              <Loader className="spin" size={16} style={{ color: "#6366f1", marginLeft: "10px" }} />
            )}
          </div>

          <div className="timeline">
            {loadingLogs && backendOnline ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                <Loader className="spin" size={24} style={{ display: "inline-block", color: "#6366f1" }} />
                <p style={{ marginTop: "10px" }}>Loading live activity timeline...</p>
              </div>
            ) : displayLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>No actions logged yet.</div>
            ) : (
              displayLogs.map((log) => {
                const tc = typeConfig[log.type] || typeConfig.message;
                const { Icon } = tc;
                return (
                  <div key={log.id} className="timeline-item" style={{ "--accent": tc.color }}>
                    <div className="tl-icon" style={{ background: tc.bg, color: tc.color }}>
                      <Icon size={15} />
                    </div>
                    <div className="tl-content">
                      <div className="tl-main">
                        <span className="tl-agent">{log.agentName}</span>
                        {log.customer && (
                          <>
                            <span className="tl-sep"> for </span>
                            <span className="tl-customer">{log.customer}</span>
                          </>
                        )}
                        <span className="tl-sep">: </span>
                        <span className="tl-action">{log.action || "Interacted"}</span>
                      </div>
                      <span className="tl-time">🕐 {log.time}</span>
                    </div>
                    <span className="tl-type-badge" style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
