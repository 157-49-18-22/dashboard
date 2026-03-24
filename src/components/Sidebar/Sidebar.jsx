import { useApp } from "../../context/AppContext";
import {
  MessageSquare, Users, ClipboardList, BarChart2,
  Wifi, Zap, Bell, BellOff
} from "lucide-react";
import "./Sidebar.css";

const navItems = [
  { id: "queries", label: "Queries", icon: MessageSquare },
  { id: "agents", label: "Agents", icon: Users },
  { id: "activity", label: "Activity Log", icon: ClipboardList },
  { id: "stats", label: "Overview", icon: BarChart2 },
];

const Sidebar = () => {
  const { activeTab, setActiveTab, queries, currentUser, newMessageAlert, soundEnabled, setSoundEnabled } = useApp();
  const openCount = queries.filter((q) => q.status === "open").length;
  const totalUnread = queries.reduce((sum, q) => sum + q.unread, 0);

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
        <div className="user-avatar">{currentUser.avatar}</div>
        <div className="user-info">
          <p className="user-name">{currentUser.name}</p>
          <p className="user-role">{currentUser.role}</p>
        </div>
        <div className="user-status online"></div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              {item.id === "queries" && totalUnread > 0 && (
                <span className={`nav-badge ${newMessageAlert ? "pulse" : ""}`}>{totalUnread}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-extras">
        <button
          className="sound-toggle"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? "Sound On" : "Sound Off"}
        >
          {soundEnabled ? <Bell size={16} /> : <BellOff size={16} />}
          <span>{soundEnabled ? "Sound On" : "Sound Off"}</span>
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
