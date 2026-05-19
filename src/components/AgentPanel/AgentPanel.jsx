import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Users, Circle, MessageSquare, CheckCircle, Clock, 
  TrendingUp, UserPlus, Trash2, X, Mail, Lock, Shield, User, AlertCircle
} from "lucide-react";
import "./AgentPanel.css";

const statusConfig = {
  online: { color: "#25d366", label: "Online", Icon: Circle },
  busy: { color: "#f59e0b", label: "Busy", Icon: Circle },
  away: { color: "#a0aec0", label: "Away", Icon: Circle },
  offline: { color: "#e2e8f0", label: "Offline", Icon: Circle },
};

const AgentPanel = () => {
  const { agents, queries, createAgent, deleteAgent, currentUser } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Support Agent");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onlineCount = agents.filter(a => a.status === "online").length;

  const handleOpenModal = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("Support Agent");
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!name.trim()) return setError("Name is required");
    if (!email.trim()) return setError("Email is required");
    if (!password || password.length < 6) return setError("Password must be at least 6 characters");

    setIsSubmitting(true);
    try {
      await createAgent({ name, email, password, role });
      setSuccess("Agent created successfully!");
      setName("");
      setEmail("");
      setPassword("");
      setRole("Support Agent");
      
      // Auto close modal after a short delay
      setTimeout(() => {
        setShowModal(false);
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to create agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (agentId, agentName) => {
    if (window.confirm(`Are you sure you want to delete agent "${agentName}"?`)) {
      try {
        await deleteAgent(agentId);
      } catch (err) {
        alert(err.message || "Failed to delete agent");
      }
    }
  };

  // Show delete/add buttons to Admin or Senior roles
  const canManageAgents = currentUser?.role?.toLowerCase()?.includes("admin") || 
                          currentUser?.role?.toLowerCase()?.includes("senior");

  return (
    <div className="agent-panel">
      <div className="agent-panel-header">
        <div className="aph-left">
          <Users size={20} color="#1a202c" />
          <h2>Logged-in Agents</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="agent-count-badge">{onlineCount} Online</span>
          {canManageAgents && (
            <button className="add-agent-btn" onClick={handleOpenModal}>
              <UserPlus size={16} />
              <span>Add Agent</span>
            </button>
          )}
        </div>
      </div>

      <div className="agents-grid">
        {agents.map((agent) => {
          const sc = statusConfig[agent.status] || statusConfig.offline;
          const assignedQueries = queries.filter(q => q.assignedTo === agent.id).length;
          const resolvedQueries = queries.filter(q => q.assignedTo === agent.id && q.status === "resolved").length;
          const perfPct = Math.min(100, Math.round((agent.resolvedToday / 15) * 100));
          const isCurrentUser = currentUser?.id === agent.id;

          return (
            <div key={agent.id} className={`agent-card ${agent.status}`}>
              <div className="agent-card-top">
                <div className="agent-avatar-wrap">
                  <div className="agent-avatar">{agent.avatar}</div>
                  <div className="agent-status-dot" style={{ background: sc.color }}></div>
                </div>
                <div className="agent-info">
                  <h3>{agent.name} {isCurrentUser && <span style={{ color: "#764ba2", fontSize: "10px", fontWeight: "700" }}>(You)</span>}</h3>
                  <span className="agent-role">{agent.role}</span>
                  <span className="agent-status-label" style={{ color: sc.color }}>
                    <Circle size={8} fill={sc.color} /> {sc.label}
                  </span>
                </div>
                <div className="agent-email">{agent.email}</div>
                
                {canManageAgents && !isCurrentUser && (
                  <button 
                    className="agent-delete-btn" 
                    onClick={() => handleDelete(agent.id, agent.name)}
                    title={`Delete agent ${agent.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
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

      {/* Add Agent Modal */}
      {showModal && (
        <div className="agent-modal-overlay" onClick={handleCloseModal}>
          <div className="agent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="agent-modal-header">
              <div>
                <h3>Create New Agent</h3>
                <p>Register a new WhatsApp support team member</p>
              </div>
              <button className="agent-modal-close" onClick={handleCloseModal}>
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="agent-modal-body">
                {error && (
                  <div className="agent-modal-error">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="agent-modal-success">
                    <CheckCircle size={14} />
                    <span>{success}</span>
                  </div>
                )}

                <div className="agent-form-group">
                  <label htmlFor="agent-name">Agent Name</label>
                  <div className="agent-input-wrapper">
                    <User size={14} className="agent-input-icon" />
                    <input
                      id="agent-name"
                      type="text"
                      placeholder="e.g. Sneha Singh"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="agent-form-group">
                  <label htmlFor="agent-email">Email Address</label>
                  <div className="agent-input-wrapper">
                    <Mail size={14} className="agent-input-icon" />
                    <input
                      id="agent-email"
                      type="email"
                      placeholder="e.g. sneha@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="agent-form-group">
                  <label htmlFor="agent-password">Login Password</label>
                  <div className="agent-input-wrapper">
                    <Lock size={14} className="agent-input-icon" />
                    <input
                      id="agent-password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="agent-form-group">
                  <label htmlFor="agent-role">System Role</label>
                  <div className="agent-input-wrapper">
                    <Shield size={14} className="agent-input-icon" />
                    <select
                      id="agent-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Support Agent">Support Agent</option>
                      <option value="Senior Agent">Senior Agent</option>
                      <option value="Junior Agent">Junior Agent</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="agent-modal-footer">
                <button type="button" className="agent-btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="agent-btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPanel;
