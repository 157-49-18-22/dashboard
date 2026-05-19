import { useApp } from "../../context/AppContext";
import { MessageSquare, Inbox, Users, ClipboardList, BarChart2 } from "lucide-react";
import "./MobileNav.css";

const navItems = [
  { id: "queries", label: "Queries", icon: MessageSquare },
  { id: "pool", label: "Pool", icon: Inbox },
  { id: "agents", label: "Agents", icon: Users },
  { id: "activity", label: "Activity", icon: ClipboardList },
  { id: "stats", label: "Overview", icon: BarChart2 },
];

const MobileNav = () => {
  const { activeTab, setActiveTab, queries, currentUser } = useApp();
  
  // Calculate unread count for queries assigned to the current agent
  const myQueries = queries.filter((q) => q.assignedTo === currentUser?.id);
  const myTotalUnread = myQueries.reduce((sum, q) => sum + q.unread, 0);

  // Calculate unassigned queries count for the Query Pool
  const poolCount = queries.filter((q) => !q.assignedTo && q.status !== "resolved").length;

  return (
    <nav className="mobile-nav">
      <style>{`
        @keyframes heartbeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.08); }
          28% { transform: scale(1); }
          42% { transform: scale(1.08); }
          70% { transform: scale(1); }
        }
      `}</style>
      {navItems.map(({ id, label, icon: Icon }) => {
        const isPoolActive = id === "pool" && poolCount > 0;
        return (
          <button
            key={id}
            className={`mobile-nav-item ${activeTab === id ? "active" : ""}`}
            onClick={() => setActiveTab(id)}
            style={isPoolActive ? {
              animation: 'heartbeat 1.5s infinite ease-in-out',
              color: '#f59e0b',
              fontWeight: '700'
            } : {}}
          >
            <div className="mobile-nav-icon-wrap">
              <Icon size={20} style={isPoolActive ? { color: '#f59e0b' } : {}} />
              {id === "queries" && myTotalUnread > 0 && (
                <span className="mobile-badge">{myTotalUnread}</span>
              )}
              {id === "pool" && poolCount > 0 && (
                <span className="mobile-badge pool-badge" style={{ backgroundColor: "#f59e0b", boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)' }}>{poolCount}</span>
              )}
            </div>
            <span className="mobile-nav-label" style={isPoolActive ? { color: '#f59e0b' } : {}}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;
