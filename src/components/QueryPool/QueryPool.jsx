import { useApp } from "../../context/AppContext";
import { Inbox, UserPlus, Clock, Sparkles } from "lucide-react";
import "./QueryPool.css";

const priorityConfig = {
  high: { color: "#ef4444", bg: "#fef2f2", label: "High" },
  medium: { color: "#f59e0b", bg: "#fffbeb", label: "Medium" },
  low: { color: "#22c55e", bg: "#f0fdf4", label: "Low" },
};

const getTimerLabel = (isoString) => {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
};

const QueryPool = () => {
  const { queries, assignQuery, setActiveTab, setSelectedQuery } = useApp();

  // Filter for unassigned queries
  const poolQueries = queries.filter((q) => !q.assignedTo && q.status !== "resolved");

  const handleAccept = (query) => {
    assignQuery(query.id);
    setSelectedQuery(query);
    setActiveTab("queries");
  };

  return (
    <div className="query-pool-container">
      <div className="pool-header">
        <div className="pool-title-area">
          <div className="pool-icon-wrap">
            <Inbox size={22} className="pool-header-icon" />
          </div>
          <div>
            <h2>Open Query Pool</h2>
            <p>Claim incoming customer queries to start replying</p>
          </div>
        </div>
        <span className="pool-count-badge">
          {poolQueries.length} {poolQueries.length === 1 ? "Query" : "Queries"} Available
        </span>
      </div>

      {poolQueries.length === 0 ? (
        <div className="pool-empty-state">
          <div className="celebrate-circle">
            <Sparkles size={36} color="#10b981" className="animate-spin-slow" />
          </div>
          <h3>All caught up!</h3>
          <p>No unassigned queries left in the pool. Great job!</p>
        </div>
      ) : (
        <div className="pool-table-wrapper">
          <table className="pool-table">
            <thead>
              <tr>
                <th style={{ width: "240px" }}>Customer</th>
                <th>Last Message</th>
                <th style={{ width: "130px" }}>Waiting Time</th>
                <th style={{ width: "150px" }}>Priority</th>
                <th style={{ width: "130px" }} className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {poolQueries.map((query) => {
                const pc = priorityConfig[query.priority || "medium"];
                return (
                  <tr key={query.id} className="pool-row">
                    <td>
                      <div className="customer-meta">
                        <div className="customer-avatar">{query.avatar}</div>
                        <div>
                          <h4 className="customer-name">{query.name}</h4>
                          <span className="customer-phone">{query.from}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="message-preview-cell">
                        <p>{query.message}</p>
                      </div>
                    </td>
                    <td>
                      <span className="pool-time">
                        <Clock size={12} /> {getTimerLabel(query.time)}
                      </span>
                    </td>
                    <td>
                      <span className="priority-badge" style={{ background: pc.bg, color: pc.color }}>
                        <span className="priority-dot" style={{ background: pc.color }}></span>
                        {pc.label} Priority
                      </span>
                    </td>
                    <td className="text-right">
                      <button className="claim-btn-horizontal" onClick={() => handleAccept(query)}>
                        <UserPlus size={14} /> Accept
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QueryPool;
