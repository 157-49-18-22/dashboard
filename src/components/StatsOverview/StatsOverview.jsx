import { useApp } from "../../context/AppContext";
import { MessageSquare, Users, CheckCircle, Zap, Clock, Smile, Wifi, Award, TrendingUp, AlertTriangle } from "lucide-react";
import "./StatsOverview.css";

const StatsOverview = () => {
  const { queries, agents, activityLogs } = useApp();
  const totalQueries = queries.length;
  const openQ = queries.filter(q => q.status === "open").length;
  const resolvedQ = queries.filter(q => q.status === "resolved").length;
  const inProgressQ = queries.filter(q => q.status === "in_progress").length;
  const onlineAgents = agents.filter(a => a.status === "online").length;
  const totalMsgs = activityLogs.filter(l => l.type === "message").length;
  const topAgent = agents.reduce((p, c) => p.resolvedToday > c.resolvedToday ? p : c, agents[0]);

  const kpis = [
    { icon: MessageSquare, label: "Total Queries", value: totalQueries, color: "#667eea", sub: "+12% this week" },
    { icon: AlertTriangle, label: "Open", value: openQ, color: "#ef4444", sub: "Needs attention" },
    { icon: Zap, label: "In Progress", value: inProgressQ, color: "#f59e0b", sub: "Being handled" },
    { icon: CheckCircle, label: "Resolved", value: resolvedQ, color: "#25d366", sub: "+8% from yesterday" },
    { icon: Users, label: "Online Agents", value: `${onlineAgents}/${agents.length}`, color: "#4f46e5", sub: "Currently active" },
    { icon: MessageSquare, label: "Messages Sent", value: totalMsgs, color: "#0ea5e9", sub: "By all agents today" },
    { icon: Clock, label: "Avg. Response", value: "3.2 min", color: "#f97316", sub: "Improving daily" },
    { icon: Smile, label: "Satisfaction", value: "94%", color: "#ec4899", sub: "Customer rating" },
  ];

  const statusBars = [
    { label: "Open", value: openQ, color: "#ef4444" },
    { label: "In Progress", value: inProgressQ, color: "#f59e0b" },
    { label: "Resolved", value: resolvedQ, color: "#25d366" },
  ];

  return (
    <div className="stats-overview">
      <div className="stats-inner">
        <div className="stats-header">
          <div className="sh-left">
            <TrendingUp size={20} color="#1a202c" />
            <h2>Dashboard Overview</h2>
          </div>
          <span className="stats-date">📅 {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </div>

        <div className="kpi-grid">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className="kpi-card" style={{ "--kc": kpi.color }}>
                <div className="kpi-icon-wrap" style={{ background: `${kpi.color}18` }}>
                  <Icon size={20} color={kpi.color} />
                </div>
                <div className="kpi-data">
                  <div className="kpi-value">{kpi.value}</div>
                  <div className="kpi-label">{kpi.label}</div>
                  <div className="kpi-sub">{kpi.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="stats-bottom">
          {/* Status Breakdown */}
          <div className="chart-card">
            <h3>Query Status Breakdown</h3>
            {statusBars.map(item => (
              <div key={item.label} className="bar-row">
                <span className="bar-label">{item.label}</span>
                <div className="bar-bg">
                  <div className="bar-fill" style={{ width: `${Math.round((item.value / totalQueries) * 100)}%`, background: item.color }}></div>
                </div>
                <div className="bar-nums">
                  <span style={{ color: item.color, fontWeight: 700 }}>{item.value}</span>
                  <span className="bar-pct">{Math.round((item.value / totalQueries) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Top Performer */}
          <div className="chart-card top-card">
            <h3><Award size={16} color="#f59e0b" /> Top Performer</h3>
            {topAgent && (
              <div className="top-performer">
                <div className="tp-avatar">{topAgent.avatar}</div>
                <div className="tp-name">{topAgent.name}</div>
                <div className="tp-role">{topAgent.role}</div>
                <div className="tp-stats">
                  <div className="tp-stat"><span>{topAgent.resolvedToday}</span><small>Resolved</small></div>
                  <div className="tp-stat"><span>{topAgent.totalMessages}</span><small>Messages</small></div>
                  <div className="tp-stat"><span>{topAgent.avgResponseTime}</span><small>Avg Time</small></div>
                </div>
              </div>
            )}
          </div>

          {/* API Status */}
          <div className="chart-card">
            <h3><Wifi size={16} color="#25d366" /> API Status</h3>
            <div className="api-list">
              {[
                { label: "WhatsApp Business API", ok: true },
                { label: "Webhook Listener", ok: true },
                { label: "Message Queue", ok: true },
                { label: "Real-time Sync", ok: false, note: "Mock Mode" },
              ].map((item, i) => (
                <div key={i} className="api-item">
                  <div className="api-dot" style={{ background: item.ok ? "#25d366" : "#f59e0b" }}></div>
                  <span className="api-label">{item.label}</span>
                  <span className="api-status" style={{ color: item.ok ? "#25d366" : "#f59e0b" }}>
                    {item.note || (item.ok ? "Active" : "Inactive")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
