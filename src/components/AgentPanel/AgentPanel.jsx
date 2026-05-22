import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Users, Circle, MessageSquare, CheckCircle, Clock, 
  TrendingUp, UserPlus, Trash2, X, Mail, Lock, Shield, User, AlertCircle, KeyRound, Eye, EyeOff, ChevronDown
} from "lucide-react";
import "./AgentPanel.css";

const statusConfig = {
  online: { color: "#25d366", label: "Online", Icon: Circle },
  busy: { color: "#f59e0b", label: "Busy", Icon: Circle },
  away: { color: "#a0aec0", label: "Away", Icon: Circle },
  offline: { color: "#e2e8f0", label: "Offline", Icon: Circle },
};

const AgentPanel = () => {
  const { agents, queries, createAgent, deleteAgent, resetAgentPassword, currentUser, agentGroups, createGroup, deleteGroup } = useApp();

  // ── Add Agent Modal State ──────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Support Agent");
  const [groupId, setGroupId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Add Group Modal State ──────────────────────────────────
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupError, setGroupError] = useState("");
  const [groupSuccess, setGroupSuccess] = useState("");
  const [isGroupSubmitting, setIsGroupSubmitting] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);

  // ── Reset Password Modal State ─────────────────────────────
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedAgentForReset, setSelectedAgentForReset] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  const onlineCount = agents.filter(a => a.status === "online").length;

  // ── Add Agent handlers ─────────────────────────────────────
  const handleOpenModal = () => {
    setName(""); setEmail(""); setPassword(""); setRole("Support Agent"); setGroupId("");
    setError(""); setSuccess("");
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!name.trim()) return setError("Name is required");
    if (!email.trim()) return setError("Email is required");
    if (!password || password.length < 6) return setError("Password must be at least 6 characters");

    setIsSubmitting(true);
    try {
      await createAgent({ name, email, password, role, groupId: groupId || null });
      setSuccess("Agent created successfully!");
      setTimeout(() => { setShowModal(false); setSuccess(""); }, 1500);
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

  // ── Add Group handlers ─────────────────────────────────────
  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    setGroupError(""); setGroupSuccess("");
    if (!groupName.trim()) return setGroupError("Group name is required");

    setIsGroupSubmitting(true);
    try {
      await createGroup({ name: groupName, description: groupDesc, agentIds: selectedAgents });
      setGroupSuccess("Group created successfully!");
      setGroupName(""); setGroupDesc(""); setSelectedAgents([]);
      setTimeout(() => { setShowGroupModal(false); setGroupSuccess(""); }, 1500);
    } catch (err) {
      setGroupError(err.message || "Failed to create group");
    } finally {
      setIsGroupSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete group "${name}"? Agents in this group will be unassigned.`)) {
      try {
        await deleteGroup(id);
      } catch (err) {
        alert(err.message || "Failed to delete group");
      }
    }
  };

  // ── Reset Password handlers ────────────────────────────────
  const handleOpenReset = (agent) => {
    setSelectedAgentForReset(agent);
    setNewPassword(""); setConfirmPassword("");
    setShowNewPwd(false); setShowConfirmPwd(false);
    setResetError(""); setResetSuccess("");
    setShowResetModal(true);
  };

  const handleCloseReset = () => {
    setShowResetModal(false);
    setSelectedAgentForReset(null);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError(""); setResetSuccess("");

    if (!newPassword || newPassword.length < 6)
      return setResetError("New password must be at least 6 characters");
    if (newPassword !== confirmPassword)
      return setResetError("Passwords do not match");

    setIsResetSubmitting(true);
    try {
      const res = await resetAgentPassword(selectedAgentForReset.id, newPassword);
      setResetSuccess(res.message || "Password reset successfully!");
      setNewPassword(""); setConfirmPassword("");
      setTimeout(() => { handleCloseReset(); }, 2000);
    } catch (err) {
      setResetError(err.message || "Failed to reset password");
    } finally {
      setIsResetSubmitting(false);
    }
  };

  // Show delete/add/reset buttons to Admin or Senior roles
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
          const perfPct = Math.min(100, Math.round((agent.resolvedToday / 15) * 100));
          const isCurrentUser = currentUser?.id === agent.id;
          const agGroup = agentGroups.find(g => g.id === agent.groupId);

          return (
            <div key={agent.id} className={`agent-card ${agent.status}`}>
              <div className="agent-card-top">
                <div className="agent-avatar-wrap">
                  <div className="agent-avatar">{agent.avatar}</div>
                  <div className="agent-status-dot" style={{ background: sc.color }}></div>
                </div>
                <div className="agent-info">
                  <h3>{agent.name} {isCurrentUser && <span style={{ color: "#764ba2", fontSize: "10px", fontWeight: "700" }}>(You)</span>}</h3>
                  <span className="agent-role">{agent.role} {agGroup && `• ${agGroup.name}`}</span>
                  <div className="agent-email">{agent.email}</div>
                  <span className="agent-status-label" style={{ color: sc.color }}>
                    <Circle size={8} fill={sc.color} /> {sc.label}
                  </span>
                </div>

                {canManageAgents && (
                  <div className="agent-card-actions">
                    <button
                      className="agent-action-btn reset-btn"
                      onClick={() => handleOpenReset(agent)}
                      title={`Reset password for ${agent.name}`}
                    >
                      <KeyRound size={16} />
                    </button>
                    {!isCurrentUser && (
                      <button
                        className="agent-action-btn delete-btn"
                        onClick={() => handleDelete(agent.id, agent.name)}
                        title={`Delete agent ${agent.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
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

      <div className="agent-panel-header" style={{ marginTop: '2rem' }}>
        <div className="aph-left">
          <Users size={20} color="#1a202c" />
          <h2>Agent Groups</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="agent-count-badge">{agentGroups.length} Groups</span>
          {canManageAgents && (
            <button className="add-agent-btn" onClick={() => { setGroupName(""); setGroupDesc(""); setGroupError(""); setGroupSuccess(""); setSelectedAgents([]); setAgentDropdownOpen(false); setShowGroupModal(true); }}>
              <UserPlus size={16} />
              <span>Create Group</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="agents-grid" style={{ paddingBottom: '2rem' }}>
         {agentGroups.length === 0 && <p style={{ color: '#64748b' }}>No groups created yet.</p>}
         {agentGroups.map(group => (
            <div key={group.id} className="agent-card online" style={{ minHeight: 'unset', paddingBottom: '16px' }}>
              <div className="agent-card-top" style={{ marginBottom: 0 }}>
                 <div className="agent-info">
                   <h3>{group.name}</h3>
                   <div className="agent-email">{group.description || 'No description'}</div>
                   <span className="agent-status-label" style={{ color: '#667eea', marginTop: '8px' }}>
                     <Users size={14} style={{ marginRight: '4px' }} /> {group.agentCount || 0} Agents assigned
                   </span>
                 </div>
                 {canManageAgents && (
                   <div className="agent-card-actions">
                     <button className="agent-action-btn delete-btn" onClick={() => handleDeleteGroup(group.id, group.name)} title="Delete Group">
                       <Trash2 size={16} />
                     </button>
                   </div>
                 )}
              </div>
            </div>
         ))}
      </div>

      {/* ── Add Agent Modal ── */}
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
                      id="agent-name" type="text" placeholder="e.g. Sneha Singh"
                      value={name} onChange={(e) => setName(e.target.value)} required
                    />
                  </div>
                </div>

                <div className="agent-form-group">
                  <label htmlFor="agent-email">Email Address</label>
                  <div className="agent-input-wrapper">
                    <Mail size={14} className="agent-input-icon" />
                    <input
                      id="agent-email" type="email" placeholder="e.g. sneha@company.com"
                      value={email} onChange={(e) => setEmail(e.target.value)} required
                    />
                  </div>
                </div>

                <div className="agent-form-group">
                  <label htmlFor="agent-password">Login Password</label>
                  <div className="agent-input-wrapper">
                    <Lock size={14} className="agent-input-icon" />
                    <input
                      id="agent-password" type="password" placeholder="Min 6 characters"
                      value={password} onChange={(e) => setPassword(e.target.value)} required
                    />
                  </div>
                </div>

                <div className="agent-form-group">
                  <label htmlFor="agent-role">System Role</label>
                  <div className="agent-input-wrapper">
                    <Shield size={14} className="agent-input-icon" />
                    <select id="agent-role" value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="Support Agent">Support Agent</option>
                      <option value="Senior Agent">Senior Agent</option>
                      <option value="Junior Agent">Junior Agent</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="agent-form-group">
                  <label htmlFor="agent-group">Agent Group (Optional)</label>
                  <div className="agent-input-wrapper">
                    <Users size={14} className="agent-input-icon" />
                    <select id="agent-group" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                      <option value="">None</option>
                      {agentGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
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

      {/* ── Add Group Modal ── */}
      {showGroupModal && (
        <div className="agent-modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="agent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="agent-modal-header">
              <div>
                <h3>Create New Group</h3>
                <p>Register a new Agent Group to route queries</p>
              </div>
              <button className="agent-modal-close" onClick={() => setShowGroupModal(false)}>
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleGroupSubmit}>
              <div className="agent-modal-body">
                {groupError && (
                  <div className="agent-modal-error">
                    <AlertCircle size={14} />
                    <span>{groupError}</span>
                  </div>
                )}
                {groupSuccess && (
                  <div className="agent-modal-success">
                    <CheckCircle size={14} />
                    <span>{groupSuccess}</span>
                  </div>
                )}

                <div className="agent-form-group">
                  <label htmlFor="group-name">Group Name</label>
                  <div className="agent-input-wrapper">
                    <Users size={14} className="agent-input-icon" />
                    <input
                      id="group-name" type="text" placeholder="e.g. Sales Team"
                      value={groupName} onChange={(e) => setGroupName(e.target.value)} required
                    />
                  </div>
                </div>
                
                <div className="agent-form-group">
                  <label htmlFor="group-desc">Description (Optional)</label>
                  <div className="agent-input-wrapper">
                    <MessageSquare size={14} className="agent-input-icon" />
                    <input
                      id="group-desc" type="text" placeholder="e.g. Handles sales and billing"
                      value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="agent-form-group" style={{ position: 'relative' }}>
                  <label>Assign Existing Agents</label>
                  <div 
                    className="agent-input-wrapper" 
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={14} className="agent-input-icon" style={{ position: 'relative', left: '0', transform: 'none' }} />
                      <span style={{ color: selectedAgents.length > 0 ? '#1e293b' : '#94a3b8', fontSize: '13px', marginLeft: '6px' }}>
                        {selectedAgents.length > 0 ? `${selectedAgents.length} agent(s) selected` : 'Select agents...'}
                      </span>
                    </div>
                    <ChevronDown size={14} style={{ color: '#94a3b8', transform: agentDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                  </div>
                  
                  {agentDropdownOpen && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', 
                      marginTop: '4px', maxHeight: '180px', overflowY: 'auto',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                    }}>
                      {agents.map(a => (
                        <label key={a.id} style={{ 
                          display: 'flex', alignItems: 'center', padding: '10px 12px', 
                          borderBottom: '1px solid #f1f5f9', cursor: 'pointer', margin: 0 
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <input 
                            type="checkbox" 
                            style={{ marginRight: '12px', marginTop: '0', width: '16px', height: '16px', cursor: 'pointer' }}
                            checked={selectedAgents.includes(a.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedAgents(prev => [...prev, a.id]);
                              else setSelectedAgents(prev => prev.filter(id => id !== a.id));
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{a.name}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{a.role}</span>
                          </div>
                        </label>
                      ))}
                      {agents.length === 0 && <div style={{ padding: '12px', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>No agents available</div>}
                    </div>
                  )}
                </div>

              </div>
              <div className="agent-modal-footer">
                <button type="button" className="agent-btn-cancel" onClick={() => setShowGroupModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="agent-btn-submit" disabled={isGroupSubmitting}>
                  {isGroupSubmitting ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {showResetModal && selectedAgentForReset && (
        <div className="agent-modal-overlay" onClick={handleCloseReset}>
          <div className="agent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="agent-modal-header reset-header">
              <div>
                <h3>Reset Password</h3>
                <p>Set a new password for <strong style={{ color: "#c6f6d5" }}>{selectedAgentForReset.name}</strong></p>
              </div>
              <button className="agent-modal-close" onClick={handleCloseReset}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResetSubmit}>
              <div className="agent-modal-body">
                {/* Agent info badge */}
                <div className="reset-agent-badge">
                  <div className="reset-agent-avatar">{selectedAgentForReset.avatar}</div>
                  <div className="reset-agent-info">
                    <span className="reset-agent-name">{selectedAgentForReset.name}</span>
                    <span className="reset-agent-role">{selectedAgentForReset.role}</span>
                  </div>
                  <div className="reset-agent-icon">
                    <KeyRound size={20} color="#667eea" />
                  </div>
                </div>

                {resetError && (
                  <div className="agent-modal-error">
                    <AlertCircle size={14} />
                    <span>{resetError}</span>
                  </div>
                )}
                {resetSuccess && (
                  <div className="agent-modal-success">
                    <CheckCircle size={14} />
                    <span>{resetSuccess}</span>
                  </div>
                )}

                <div className="agent-form-group">
                  <label htmlFor="reset-new-password">New Password</label>
                  <div className="agent-input-wrapper">
                    <Lock size={14} className="agent-input-icon" />
                    <input
                      id="reset-new-password"
                      type={showNewPwd ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ paddingRight: "42px" }}
                      required
                    />
                    <button
                      type="button"
                      className="pwd-toggle-btn"
                      onClick={() => setShowNewPwd((p) => !p)}
                      tabIndex={-1}
                    >
                      {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="agent-form-group">
                  <label htmlFor="reset-confirm-password">Confirm New Password</label>
                  <div className="agent-input-wrapper">
                    <Lock size={14} className="agent-input-icon" />
                    <input
                      id="reset-confirm-password"
                      type={showConfirmPwd ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ paddingRight: "42px" }}
                      required
                    />
                    <button
                      type="button"
                      className="pwd-toggle-btn"
                      onClick={() => setShowConfirmPwd((p) => !p)}
                      tabIndex={-1}
                    >
                      {showConfirmPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {/* Password match indicator */}
                  {confirmPassword && (
                    <div className={`pwd-match-hint ${newPassword === confirmPassword ? "match" : "no-match"}`}>
                      {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </div>
                  )}
                </div>
              </div>

              <div className="agent-modal-footer">
                <button type="button" className="agent-btn-cancel" onClick={handleCloseReset}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="agent-btn-submit reset-submit-btn"
                  disabled={isResetSubmitting}
                >
                  <KeyRound size={14} />
                  {isResetSubmitting ? "Resetting..." : "Reset Password"}
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
