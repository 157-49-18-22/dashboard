import { useApp } from "../../context/AppContext";
import { Users, Circle, MessageSquare, CheckCircle, Clock, TrendingUp } from "lucide-react";
import "./AgentPanel.css";

const statusConfig = {
  online: { color: "#25d366", label: "Online", Icon: Circle },
  busy: { color: "#f59e0b", label: "Busy", Icon: Circle },
  away: { color: "#a0aec0", label: "Away", Icon: Circle },
  offline: { color: "#e2e8f0", label: "Offline", Icon: Circle },
};

const AgentPanel = () => {
  const { agents, queries } = useApp();
  const onlineCount = agents.filter(a => a.status === "online").length;

  return (
    <div className="agent-panel">
      <div className="agent-panel-header">
        <div className="aph-left">
          <Users size={20} color="#1a202c" />
          <h2>Logged-in Agents</h2>
        </div>
        <span className="agent-count-badge">{onlineCount} Online</span>
      </div>

      <div className="agents-grid">
        {agents.map((agent) => {
          const sc = statusConfig[agent.status];
          const assignedQueries = queries.filter(q => q.assignedTo === agent.id).length;
          const resolvedQueries = queries.filter(q => q.assignedTo === agent.id && q.status === "resolved").length;
          const perfPct = Math.min(100, Math.round((agent.resolvedToday / 15) * 100));
          return (
            <div key={agent.id} className={`agent-card ${agent.status}`}>
              <div className="agent-card-top">
                <div className="agent-avatar-wrap">
                  <div className="agent-avatar">{agent.avatar}</div>
                  <div className="agent-status-dot" style={{ background: sc.color }}></div>
                </div>
                <div className="agent-info">
                  <h3>{agent.name}</h3>
                  <span className="agent-role">{agent.role}</span>
                  <span className="agent-status-label" style={{ color: sc.color }}>
                    <Circle size={8} fill={sc.color} /> {sc.label}
                  </span>
                </div>
                <div className="agent-email">{agent.email}</div>
              </div>

              <div className="agent-stats">
                <div className="stat-box">
                  <CheckCircle size={14} color="#25d366" />
                  <span className="stat-value">{agent.resolvedToday}</span>
                  <span className="stat-key">Resolved</span>
                </div>
                <div className="stat-box">
                  <MessageSquare size={14} color="#667eea" />
                  <span className="stat-value">{agent.totalMessages}</span>
                  <span className="stat-key">Messages</span>
                </div>
                <div className="stat-box">
                  <Users size={14} color="#f59e0b" />
                  <span className="stat-value">{agent.activeChats}</span>
                  <span className="stat-key">Active</span>
                </div>
                <div className="stat-box">
                  <Clock size={14} color="#a78bfa" />
                  <span className="stat-value">{agent.avgResponseTime}</span>
                  <span className="stat-key">Avg. Time</span>
                </div>
              </div>

              <div className="agent-progress">
                <div className="progress-label">
                  <span><TrendingUp size={11} /> Today's Goal</span>
                  <span className="perf-pct">{perfPct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${perfPct}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentPanel;
