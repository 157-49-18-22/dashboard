import { useApp } from "../../context/AppContext";
import { ClipboardList, CheckCircle, Link, MessageSquare, TrendingUp, Award } from "lucide-react";
import "./ActivityLog.css";

const typeConfig = {
  resolved: { Icon: CheckCircle, color: "#25d366", bg: "#e6f9ee", label: "Resolved" },
  assigned: { Icon: Link, color: "#667eea", bg: "#ede9fe", label: "Assigned" },
  message: { Icon: MessageSquare, color: "#f59e0b", bg: "#fef3c7", label: "Message" },
};

const ActivityLog = () => {
  const { activityLogs, agents } = useApp();

  const agentSummary = agents.map((agent) => {
    const logs = activityLogs.filter((l) => l.agentId === agent.id);
    return {
      ...agent,
      resolved: logs.filter((l) => l.type === "resolved").length,
      messages: logs.filter((l) => l.type === "message").length,
      assigned: logs.filter((l) => l.type === "assigned").length,
    };
  }).sort((a, b) => b.resolved - a.resolved);

  return (
    <div className="activity-log">
      <div className="activity-log-inner">
        {/* Leaderboard */}
        <div className="log-section">
          <div className="section-title">
            <TrendingUp size={18} color="#1a202c" />
            <h2>Agent Performance</h2>
          </div>
          <div className="summary-table-wrap">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>#</th><th>Agent</th><th>Status</th>
                  <th>Resolved</th><th>Messages</th><th>Assigned</th><th>Score</th>
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
                          <div className="table-avatar">{agent.avatar}</div>
                          <div>
                            <div className="table-name">{agent.name}</div>
                            <div className="table-role">{agent.role}</div>
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
          </div>
        </div>

        {/* Timeline */}
        <div className="log-section">
          <div className="section-title">
            <ClipboardList size={18} color="#1a202c" />
            <h2>Activity Timeline</h2>
          </div>
          <div className="timeline">
            {activityLogs.map((log) => {
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
                      <span className="tl-sep"> for </span>
                      <span className="tl-customer">{log.customer}</span>
                      <span className="tl-sep">: </span>
                      <span className="tl-action">{log.action}</span>
                    </div>
                    <span className="tl-time">🕐 {log.time}</span>
                  </div>
                  <span className="tl-type-badge" style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
