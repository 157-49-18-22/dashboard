import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { MessageSquare, Users, CheckCircle, Zap, Clock, Smile, Wifi, Award, TrendingUp, AlertTriangle, Loader } from "lucide-react";
import { reportsAPI } from "../../services/api";
import "./StatsOverview.css";

const StatsOverview = () => {
  const { queries, agents, activityLogs, backendOnline } = useApp();
  
  // Real-time API data states
  const [overviewReport, setOverviewReport] = useState(null);
  const [performanceAgents, setPerformanceAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch live stats from backend
  useEffect(() => {
    if (!backendOnline) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      reportsAPI.getOverview(),
      reportsAPI.getAgentPerformance()
    ])
      .then(([overRes, perfRes]) => {
        if (overRes.success) {
          setOverviewReport(overRes.report);
        }
        if (perfRes.success) {
          setPerformanceAgents(perfRes.agents || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load live overview reports:", err);
      })
      .finally(() => setLoading(false));
  }, [backendOnline]);

  // Calculations (Dynamic offline/online toggled)
  const totalQueries = backendOnline && overviewReport ? overviewReport.totalQueries : queries.length;
  const openQ = backendOnline && overviewReport ? overviewReport.openQueries : queries.filter(q => q.status === "open").length;
  const resolvedQ = backendOnline && overviewReport ? overviewReport.resolvedQueries : queries.filter(q => q.status === "resolved").length;
  const inProgressQ = backendOnline && overviewReport ? overviewReport.inProgressQueries : queries.filter(q => q.status === "in_progress").length;
  
  const onlineCount = backendOnline && overviewReport ? overviewReport.onlineAgents : agents.filter(a => a.status === "online").length;
  const totalAgentsCount = backendOnline && overviewReport ? overviewReport.totalAgents : agents.length;
  
  const totalMsgs = backendOnline && overviewReport ? overviewReport.messagesToday : activityLogs.filter(l => l.type === "message").length;

  // Active agents array for calculation
  const activeAgents = backendOnline && performanceAgents.length > 0 ? performanceAgents : agents;

  // Top Performer logic
  const topAgent = activeAgents.length > 0 
    ? activeAgents.reduce((p, c) => (p.resolvedToday ?? 0) > (c.resolvedToday ?? 0) ? p : c, activeAgents[0])
    : null;

  // Average response time
  const avgResponse = activeAgents.length > 0 
    ? (activeAgents.reduce((sum, a) => {
        const val = parseFloat(a.avgResponseTime || "3.2");
        return sum + (isNaN(val) ? 3.2 : val);
      }, 0) / activeAgents.length).toFixed(1) + " min"
    : "3.2 min";

  const kpis = [
    { icon: MessageSquare, label: "Total Queries", value: totalQueries, color: "#667eea", sub: "+12% this week" },
    { icon: AlertTriangle, label: "Open", value: openQ, color: "#ef4444", sub: "Needs attention" },
    { icon: Zap, label: "In Progress", value: inProgressQ, color: "#f59e0b", sub: "Being handled" },
    { icon: CheckCircle, label: "Resolved", value: resolvedQ, color: "#25d366", sub: "+8% from yesterday" },
    { icon: Users, label: "Online Agents", value: `${onlineCount}/${totalAgentsCount}`, color: "#4f46e5", sub: "Currently active" },
    { icon: MessageSquare, label: "Messages Sent", value: totalMsgs, color: "#0ea5e9", sub: "By all agents today" },
    { icon: Clock, label: "Avg. Response", value: avgResponse, color: "#f97316", sub: "Improving daily" },
    { icon: Smile, label: "Satisfaction", value: "94%", color: "#ec4899", sub: "Customer rating" },
  ];

  const statusBars = [
    { label: "Open", value: openQ, color: "#ef4444" },
    { label: "In Progress", value: inProgressQ, color: "#f59e0b" },
    { label: "Resolved", value: resolvedQ, color: "#25d366" },
  ];

  const getPercentage = (val) => {
    if (!totalQueries) return 0;
    return Math.round((val / totalQueries) * 100);
  };

  return (
    <div className="stats-overview">
      <div className="stats-inner">
        <div className="stats-header">
          <div className="sh-left">
            <TrendingUp size={20} color="#1a202c" />
            <h2>Dashboard Overview</h2>
            {loading && backendOnline && (
              <Loader className="spin" size={16} style={{ color: "#6366f1", marginLeft: "10px" }} />
            )}
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
                  <div className="bar-fill" style={{ width: `${getPercentage(item.value)}%`, background: item.color }}></div>
                </div>
                <div className="bar-nums">
                  <span style={{ color: item.color, fontWeight: 700 }}>{item.value}</span>
                  <span className="bar-pct">{getPercentage(item.value)}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Top Performer */}
          <div className="chart-card top-card">
            <h3><Award size={16} color="#f59e0b" /> Top Performer</h3>
            {topAgent ? (
              <div className="top-performer">
                <div className="tp-avatar">{topAgent.avatar || topAgent.name.split(" ").map(n => n[0]).join("")}</div>
                <div className="tp-name">{topAgent.name}</div>
                <div className="tp-role">{topAgent.role || "Support Agent"}</div>
                <div className="tp-stats">
                  <div className="tp-stat"><span>{topAgent.resolvedToday ?? 0}</span><small>Resolved</small></div>
                  <div className="tp-stat"><span>{backendOnline ? (topAgent.totalSent ?? topAgent.totalMessages ?? 0) : (topAgent.totalMessages ?? 0)}</span><small>Messages</small></div>
                  <div className="tp-stat"><span>{topAgent.avgResponseTime || "3.2 min"}</span><small>Avg Time</small></div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px", color: "#a0aec0" }}>No performer data</div>
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
                { label: "Real-time Sync", ok: backendOnline, note: backendOnline ? "Active" : "Mock Mode" },
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
