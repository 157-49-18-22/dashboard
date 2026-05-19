import { useApp } from "../../context/AppContext";
import {
  MessageSquare, Inbox, Users, ClipboardList, BarChart2, Send,
  Wifi, Zap, Bell, BellOff, LogOut, Volume2, VolumeX
} from "lucide-react";
import "./Sidebar.css";

const navItems = [
  { id: "queries", label: "Queries", icon: MessageSquare },
  { id: "pool", label: "Query Pool", icon: Inbox },
  { id: "agents", label: "Agents", icon: Users },
  { id: "sent", label: "Sent", icon: Send },
  { id: "activity", label: "Activity Log", icon: ClipboardList },
  { id: "reports", label: "Reports", icon: BarChart2 },
  { id: "stats", label: "Overview", icon: Zap },
];

const Sidebar = ({ onLogout }) => {
  const { activeTab, setActiveTab, queries, currentUser, setCurrentUser, agents, newMessageAlert, soundEnabled, setSoundEnabled, playNotificationSound } = useApp();
  const openCount = queries.filter((q) => q.status === "open").length;
  
  // Calculate unread count for queries assigned to the current agent
  const myQueries = queries.filter((q) => q.assignedTo === currentUser?.id);
  const myTotalUnread = myQueries.reduce((sum, q) => sum + q.unread, 0);

  // Calculate unassigned queries count for the Query Pool
  const poolCount = queries.filter((q) => !q.assignedTo && q.status !== "resolved").length;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <MessageSquare size={20} color="#fff" />
        </div>
        <div className="brand-text">
          <h2>WA Dashboard</h2>
          <span>WhatsApp CRM</span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{currentUser?.avatar || "??"}</div>
        <div className="user-info">
          <select 
            className="agent-switcher" 
            value={currentUser?.id || ""} 
            onChange={(e) => {
              const selected = agents.find(a => a.id === e.target.value);
              if (selected) setCurrentUser(selected);
            }}
          >
            {!currentUser && <option value="">Loading...</option>}
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
          <p className="user-role">{currentUser?.role || "Agent"}</p>
        </div>
        <div className="user-status online"></div>
      </div>

      <style>{`
        @keyframes heartbeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.04); }
          28% { transform: scale(1); }
          42% { transform: scale(1.04); }
          70% { transform: scale(1); }
        }
      `}</style>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isPoolActiveWithQueries = item.id === "pool" && poolCount > 0;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
              style={isPoolActiveWithQueries ? {
                animation: 'heartbeat 1.5s infinite ease-in-out',
                background: 'rgba(245, 158, 11, 0.08)',
                borderLeft: '3px solid #f59e0b',
                color: '#d97706',
                fontWeight: '700'
              } : {}}
            >
              <Icon size={18} className="nav-icon" style={isPoolActiveWithQueries ? { color: '#f59e0b' } : {}} />
              <span className="nav-label">{item.label}</span>
              {item.id === "queries" && myTotalUnread > 0 && (
                <span className={`nav-badge ${newMessageAlert ? "pulse" : ""}`}>{myTotalUnread}</span>
              )}
              {item.id === "pool" && poolCount > 0 && (
                <span className="nav-badge pool-badge" style={{ background: '#f59e0b', color: '#fff', boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)' }}>{poolCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-actions">
        <button
          className="sound-toggle"
          onClick={() => {
            const newState = !soundEnabled;
            setSoundEnabled(newState);
            if (newState) playNotificationSound(true);
          }}
          title={soundEnabled ? "Sound On" : "Sound Off"}
        >
          {soundEnabled ? <Bell size={16} /> : <BellOff size={16} />}
          <span>{soundEnabled ? "Sound On" : "Sound Off"}</span>
        </button>
        <button
          className="sound-toggle logout-btn"
          onClick={onLogout}
          title="Logout"
          style={{ marginTop: '8px' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="footer-stat">
          <span className="stat-num">{openCount}</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="footer-divider"></div>
        <div className="footer-stat">
          <Wifi size={14} className="wifi-icon" />
          <span className="stat-label">API Live</span>
        </div>
        <div className="footer-divider"></div>
        <div className="footer-stat">
          <Zap size={14} className="zap-icon" />
          <span className="stat-label">Active</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
