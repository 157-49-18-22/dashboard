import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Search, Filter, AlertCircle, Clock, CheckCircle, Loader } from "lucide-react";
import "./QueryList.css";

const statusConfig = {
  open: { bg: "#fff3cd", text: "#856404", label: "Open", icon: AlertCircle },
  in_progress: { bg: "#cfe2ff", text: "#084298", label: "In Progress", icon: Loader },
  resolved: { bg: "#d1e7dd", text: "#0a3622", label: "Resolved", icon: CheckCircle },
};

const priorityConfig = {
  high: { color: "#ef4444", label: "High" },
  medium: { color: "#f59e0b", label: "Med" },
  low: { color: "#22c55e", label: "Low" },
};

const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const getTimerLabel = (isoString) => {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
};

const QueryList = () => {
  const { getFilteredQueries, selectedQuery, setSelectedQuery, filterStatus, setFilterStatus, assignQuery } = useApp();
  const [searchText, setSearchText] = useState("");

  const queries = getFilteredQueries().filter((q) =>
    q.name.toLowerCase().includes(searchText.toLowerCase()) ||
    q.message.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelectQuery = (query) => {
    setSelectedQuery(query);
    if (!query.assignedTo) assignQuery(query.id);
  };

  return (
    <div className="query-list-panel">
      <div className="query-list-header">
        <div className="qlh-top">
          <h2>Incoming Queries</h2>
          <span className="query-total-badge">{queries.length}</span>
        </div>

        <div className="filter-tabs">
          {["all", "open", "in_progress", "resolved"].map((status) => (
            <button
              key={status}
              className={`filter-tab ${filterStatus === status ? "active" : ""}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === "all" ? "All" : status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or message..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <div className="query-items">
        {queries.length === 0 ? (
          <div className="empty-state">
            <Search size={36} color="#cbd5e0" />
            <p>No queries found</p>
          </div>
        ) : (
          queries.map((query) => {
            const sc = statusConfig[query.status];
            const pc = priorityConfig[query.priority || "medium"];
            const StatusIcon = sc?.icon;
            return (
              <div
                key={query.id}
                className={`query-item ${selectedQuery?.id === query.id ? "selected" : ""} ${query.unread > 0 ? "has-unread" : ""}`}
                onClick={() => handleSelectQuery(query)}
              >
                <div className="query-avatar">
                  {query.avatar}
                  {query.unread > 0 && <span className="unread-dot">{query.unread}</span>}
                </div>
                <div className="query-content">
                  <div className="query-top">
                    <span className="query-name">{query.name}</span>
                    <span className="query-timer">
                      <Clock size={10} /> {getTimerLabel(query.time)}
                    </span>
                  </div>
                  <div className="query-phone">{query.from}</div>
                  <div className="query-preview-text">{query.message.substring(0, 42)}...</div>
                  <div className="query-bottom">
                    <span className="priority-dot" style={{ background: pc.color }} title={`Priority: ${pc.label}`}></span>
                    <span
                      className="query-status"
                      style={{ background: sc?.bg, color: sc?.text }}
                    >
                      {StatusIcon && <StatusIcon size={10} />} {sc?.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default QueryList;
