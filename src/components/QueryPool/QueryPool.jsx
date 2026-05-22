import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Inbox, UserPlus, Clock, Sparkles, AlertTriangle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
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
  const [expandedQueries, setExpandedQueries] = useState({});

  const toggleExpand = (queryId) => {
    setExpandedQueries(prev => ({
      ...prev,
      [queryId]: !prev[queryId]
    }));
  };

  // Filter, flag, and sort unassigned queries (escalated queries at the top, sorted by oldest first)
  const poolQueries = queries
    .filter((q) => !q.assignedTo && q.status !== "resolved")
    .map((q) => {
      const diffMs = Date.now() - new Date(q.time).getTime();
      const isEscalated = diffMs >= 5 * 60000;
      return { ...q, isEscalated, diffMs };
    })
    .sort((a, b) => {
      // Escalated queries to the top
      if (a.isEscalated && !b.isEscalated) return -1;
      if (!a.isEscalated && b.isEscalated) return 1;
      // Within same escalation status, sort by longest waiting time (oldest first)
      return b.diffMs - a.diffMs;
    });

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
                const isExpanded = !!expandedQueries[query.id];
                return (
                  <tr key={query.id} className={`pool-row ${query.isEscalated ? "pool-row-escalated" : ""}`}>
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
                        {query.messages && query.messages.length > 1 ? (
                          <>
                            {isExpanded ? (
                              <div className="mini-chat-thread">
                                <div className="thread-header">
                                  <span>Message History ({query.messages.length})</span>
                                </div>
                                <div className="thread-bubbles">
                                  {query.messages.map((msg, index) => {
                                    const isCustomer = msg.sender === "customer";
                                    return (
                                      <div key={msg.id || index} className={`mini-bubble-wrap ${isCustomer ? "customer" : "agent"}`}>
                                        <div className="mini-bubble">
                                          <p>{msg.text}</p>
                                          <span className="mini-time">{msg.time || "Just now"}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <button className="toggle-history-btn collapse" onClick={() => toggleExpand(query.id)}>
                                  <ChevronUp size={12} /> Hide History
                                </button>
                              </div>
                            ) : (
                              <div className="preview-collapsed">
                                <p>{query.message}</p>
                                <button className="toggle-history-btn expand" onClick={() => toggleExpand(query.id)}>
                                  <MessageSquare size={11} /> View all messages ({query.messages.length}) <ChevronDown size={11} />
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <p>{query.message}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="pool-time" style={query.isEscalated ? { color: "#dc2626", fontWeight: "700" } : {}}>
                        <Clock size={12} /> {getTimerLabel(query.time)}
                      </span>
                      {query.isEscalated && (
                        <div className="escalation-tag">
                          <AlertTriangle size={10} /> Escalated (5m+)
                        </div>
                      )}
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
