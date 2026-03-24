import { useApp } from "../../context/AppContext";
import { MessageSquare, Users, ClipboardList, BarChart2 } from "lucide-react";
import "./MobileNav.css";

const navItems = [
  { id: "queries", label: "Queries", icon: MessageSquare },
  { id: "agents", label: "Agents", icon: Users },
  { id: "activity", label: "Activity", icon: ClipboardList },
  { id: "stats", label: "Overview", icon: BarChart2 },
];

const MobileNav = () => {
  const { activeTab, setActiveTab, queries } = useApp();
  const totalUnread = queries.reduce((sum, q) => sum + q.unread, 0);

  return (
    <nav className="mobile-nav">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`mobile-nav-item ${activeTab === id ? "active" : ""}`}
          onClick={() => setActiveTab(id)}
        >
          <div className="mobile-nav-icon-wrap">
            <Icon size={20} />
            {id === "queries" && totalUnread > 0 && (
              <span className="mobile-badge">{totalUnread}</span>
            )}
          </div>
          <span className="mobile-nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileNav;
