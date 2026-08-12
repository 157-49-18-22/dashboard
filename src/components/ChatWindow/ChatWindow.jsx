import { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { 
  ArrowLeft, CheckCircle, AlertCircle, Send, Smile, Phone, Tag, StickyNote, Search, Loader, User, Paperclip, FileText, Download, Reply, X, Forward
} from "lucide-react";
import { messagesAPI, queriesAPI } from "../../services/api";
import { getMessageType, getReplyPreviewText, buildReplyToPayload, formatMessageDisplay } from "./messageUtils";
import "./ChatWindow.css";

const quickReplies = [
  "Your query has been received, I'm checking it now.",
  "Please wait a moment, I'll reply in 2 minutes.",
  "Your issue has been resolved. Anything else I can help with?",
  "Could you provide your order number?",
  "Could you send a screenshot please?",
];

const ChatWindow = () => {
  const { 
    selectedQuery, queries, sendMessage, resolveQuery, setSelectedQuery, 
    currentUser, backendOnline, assignQuery, setActiveTab, agents, agentGroups, transferQuery 
  } = useApp();
  
  const [inputText, setInputText] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [fetchedMessages, setFetchedMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [pastedImage, setPastedImage] = useState(null); // { file, previewUrl }
  
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState("department");
  const [transferTarget, setTransferTarget] = useState("");
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const query = queries.find((q) => q.id === selectedQuery?.id);

  // Load recent messages only (not entire history) so heavy chats open instantly
  useEffect(() => {
    if (!query?.id || !backendOnline) {
      setFetchedMessages([]);
      return;
    }
    setHasMoreOlder(false);
    setNextCursor(null);
    setLoadingOlder(false);
    // Keep showing optimistic/state messages while fetch runs — don't blank the chat
    const hasLocal = (query.messages || []).length > 0;
    if (!hasLocal) setLoadingMessages(true);
    let cancelled = false;
    messagesAPI.getByQuery(query.id, { limit: 80 })
      .then((res) => {
        if (!cancelled) {
          setFetchedMessages(res.messages || []);
          setHasMoreOlder(Boolean(res.hasMore));
          setNextCursor(res.nextCursor || null);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchedMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => { cancelled = true; };
  }, [query?.id, backendOnline]);

  useEffect(() => {
    setReplyingTo(null);
  }, [query?.id]);

  const isAdmin = currentUser?.role?.toLowerCase().includes("admin") || currentUser?.role?.toLowerCase().includes("senior");
  const canReply = (query?.assignedTo === currentUser?.id || isAdmin) && query?.status !== "resolved";

  const renderQuotedBlock = (msg) => {
    if (!msg.replyToText && !msg.replyToMessageId) return null;
    const isCustomer = msg.replyToSender === "customer";
    const previewType = msg.replyToMessageType || "text";
    const isImageQuote = previewType === "image" && msg.replyToText?.startsWith("http");
    return (
      <div
        className={`quoted-message ${isCustomer ? "quoted-customer" : "quoted-agent"}`}
        role="button"
        tabIndex={0}
        onClick={() => {
          const el = document.getElementById(`msg-${msg.replyToMessageId}`);
          el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }}
        onKeyDown={(e) => e.key === "Enter" && document.getElementById(`msg-${msg.replyToMessageId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })}
      >
        <span className="quoted-author">{isCustomer ? query?.name || "Customer" : "You"}</span>
        {isImageQuote ? (
          <img src={msg.replyToText} alt="" className="quoted-thumb" />
        ) : (
          <span className="quoted-text">
            {previewType === "image" ? "Photo" : previewType === "document" ? "Document" : msg.replyToText}
          </span>
        )}
      </div>
    );
  };

  // Merge fetched messages with optimistic messages from state
  const { messages } = (() => {
    const stateMessages = query?.messages || [];
    if (!backendOnline) return { messages: stateMessages };
    
    const combined = [...fetchedMessages, ...stateMessages];
    
    // Proactive robust sort
    const sorted = combined.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : (typeof a.id === 'number' && a.id > 1000000000000 ? new Date(a.id) : new Date(a.time || Date.now()));
      const dateB = b.createdAt ? new Date(b.createdAt) : (typeof b.id === 'number' && b.id > 1000000000000 ? new Date(b.id) : new Date(b.time || Date.now()));
      return dateA - dateB;
    });
    
    // Proximity and key-based deduplicator
    const unique = [];
    const seenIds = new Set();
    const seenContent = new Set();
    
    sorted.forEach((m) => {
      const isOptimistic = 
        (typeof m.id === 'number' && m.id > 1000000000000) || 
        (typeof m.id === 'string' && m.id.length === 13 && /^\d+$/.test(m.id));
        
      if (!isOptimistic) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          // Mark the content as seen so any matching optimistic message is filtered out
          seenContent.add(`${m.sender}_${m.text}`);
          unique.push(m);
        }
      } else {
        const contentKey = `${m.sender}_${m.text}`;
        if (!seenContent.has(contentKey)) {
          seenContent.add(contentKey);
          unique.push(m);
        }
      }
    });

    return { messages: unique };
  })();

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
  useEffect(() => {
    // Scroll only inside messages panel — never the whole page (that was cutting off the top header)
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [lastMessageId]);

  // Handle direct reply sending (Calls /whatsapp-message directly)
  const handleSend = async (text) => {
    const msg = text || inputText;
    if (!msg.trim() || !query) return;
    const replyTo = replyingTo ? buildReplyToPayload(replyingTo) : undefined;
    // Clear input immediately so chat feels instant (optimistic bubble comes from AppContext)
    setInputText("");
    setReplyingTo(null);
    setShowQuickReplies(false);
    setSending(true);
    try {
      await sendMessage(query.id, { text: msg, messageType: "text", replyTo });
    } catch (err) {
      console.error("Direct send failed:", err);
      setInputText(msg);
      alert(err.message || "Failed to send message. Please ensure Alponix active plan is configured.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleAttachmentPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !query) return;
    setUploading(true);
    try {
      const uploadRes = await messagesAPI.uploadAttachment(file);
      const lowerType = (file.type || "").toLowerCase();
      const messageType = lowerType.startsWith("image/") ? "image" : "document";
      const replyTo = replyingTo ? buildReplyToPayload(replyingTo) : undefined;
      await sendMessage(query.id, {
        text: inputText.trim(),
        messageType,
        attachmentUrl: uploadRes.attachmentUrl,
        fileName: uploadRes.fileName,
        replyTo,
      });
      setReplyingTo(null);
      setInputText("");
    } catch (err) {
      alert(err.message || "Attachment upload failed");
    } finally {
      e.target.value = "";
      setUploading(false);
    }
  };

  // Handle Ctrl+V image paste in textarea
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setPastedImage({ file, previewUrl });
        return;
      }
    }
  };

  const handleSendPastedImage = async () => {
    if (!pastedImage || !query) return;
    setUploading(true);
    try {
      const uploadRes = await messagesAPI.uploadAttachment(pastedImage.file);
      const replyTo = replyingTo ? buildReplyToPayload(replyingTo) : undefined;
      await sendMessage(query.id, {
        text: "",
        messageType: "image",
        attachmentUrl: uploadRes.attachmentUrl,
        fileName: uploadRes.fileName,
        replyTo,
      });
      setReplyingTo(null);
      URL.revokeObjectURL(pastedImage.previewUrl);
      setPastedImage(null);
    } catch (err) {
      alert(err.message || "Pasted image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!query?.id || !backendOnline || !hasMoreOlder || !nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await messagesAPI.getByQuery(query.id, {
        limit: 80,
        beforeCreatedAt: nextCursor,
      });
      const older = res.messages || [];
      setFetchedMessages((prev) => [...older, ...prev]);
      setHasMoreOlder(Boolean(res.hasMore));
      setNextCursor(res.nextCursor || null);
    } catch (err) {
      console.error("Older message load failed:", err);
    } finally {
      setLoadingOlder(false);
    }
  };

  const addNote = () => {
    if (!note.trim()) return;
    setNotes(prev => [...prev, { text: note, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), agent: currentUser.name }]);
    setNote("");
  };

  const handleAcceptQuery = (queryId) => {
    assignQuery(queryId);
    setActiveTab("queries");
  };

  const handleSetPriority = async (priority) => {
    if (!query?.id) return;
    try {
      await queriesAPI.assign(query.id, query.assignedTo, query.assignedToGroup, query.status);
      // Update priority via direct patch
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/queries/${query.id}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('crm_token')}` },
        body: JSON.stringify({ priority })
      });
    } catch(e) {
      console.error('Priority update failed:', e);
    }
    setShowPriorityMenu(false);
  };

  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (query?.status !== "in_progress" || !query?.acceptedAt) {
      setTimeLeft("");
      return;
    }

    const calculateTimeLeft = () => {
      const acceptedTime = new Date(query.acceptedAt).getTime();
      // Default is 30 minutes. (For testing, if you change backend timeout in .env to 1 min, you can change 30 to 1 here!)
      const timeoutMinutes = 30; 
      const timeoutMs = timeoutMinutes * 60 * 1000; 
      const expiryTime = acceptedTime + timeoutMs;
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        return "00:00";
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Set initial
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining === "00:00") {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [query?.acceptedAt, query?.status]);

  if (!query) {
    return (
      <div className="chat-window empty-chat">
        <div className="empty-chat-content">
          <div className="empty-state">
            <Search size={36} color="#cbd5e0" />
            <p>No queries found</p>
          </div>
          <p>Choose a customer query from the left panel to start replying</p>
          <div className="wa-badge"><Phone size={14} /> WhatsApp Business API Connected</div>
        </div>
      </div>
    );
  }

  const formatMessageTime = (msg) => {
    const timestamp = msg.createdAt || msg.time;
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) return msg.time || ""; 
      return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return msg.time || "";
    }
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <button className="back-btn" onClick={() => setSelectedQuery(null)}><ArrowLeft size={18} /></button>
        <div className="chat-avatar-wrap">
          <div className="chat-avatar">{query.avatar}</div>
          <div className="online-indicator"></div>
        </div>
        <div className="chat-header-info">
          <h3>{query.name}</h3>
          <span>{query.from} • WhatsApp</span>
        </div>
        <div className="chat-header-actions">
          <span className={`status-chip ${query.status}`}>
            {query.status === "open" ? "Open" : query.status === "in_progress" ? "In Progress" : "Resolved"}
          </span>
          {query.status === "in_progress" && timeLeft && (
            <span 
              className="timer-badge animate-pulse" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fee2e2',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: '700',
                marginLeft: '8px',
                letterSpacing: '0.5px',
                boxShadow: '0 1px 2px rgba(239, 68, 68, 0.05)'
              }}
            >
              ⏳ SLA: {timeLeft}
            </span>
          )}
          <button className="icon-btn" title="Internal Notes" onClick={() => setShowNotes(!showNotes)}>
            <StickyNote size={16} />
          </button>
          <button className="icon-btn" title="Tag Priority" onClick={() => setShowPriorityMenu(p => !p)} style={{ position: 'relative' }}>
            <Tag size={16} />
            {showPriorityMenu && (
              <div className="priority-dropdown" onClick={e => e.stopPropagation()}>
                <div className="pd-title">Set Priority</div>
                {['low','medium','high','urgent'].map(p => (
                  <button
                    key={p}
                    className={`pd-item pd-${p} ${query.priority === p ? 'active' : ''}`}
                    onClick={() => handleSetPriority(p)}
                  >
                    {p === 'low' && '🟢'} {p === 'medium' && '🟡'} {p === 'high' && '🟠'} {p === 'urgent' && '🔴'}
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                    {query.priority === p && ' ✓'}
                  </button>
                ))}
              </div>
            )}
          </button>
          {query.status !== "resolved" && (
            <>
              <button className="resolve-btn" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', marginRight: '4px' }} onClick={() => { setTransferType("department"); setTransferTarget(""); setShowTransferModal(true); }}>
                 <Forward size={14} style={{ marginRight: '4px' }} /> Assign to Other
              </button>
              <button className="resolve-btn" onClick={() => resolveQuery(query.id)}>
                <CheckCircle size={15} /> Resolve
              </button>
            </>
          )}
        </div>
      </div>

      <div className="chat-body">
        {/* Messages */}
        <div className="messages-container" ref={messagesContainerRef}>
          <div className="date-divider"><span>Today</span></div>
          {hasMoreOlder && (
             <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <button 
                  onClick={loadOlderMessages}
                  disabled={loadingOlder}
                  style={{
                    background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569',
                    padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', 
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.target.style.background = '#e2e8f0'; }}
                  onMouseOut={(e) => { e.target.style.background = '#f1f5f9'; }}
                >
                  {loadingOlder ? "Loading older..." : "Load Old Chat"}
                </button>
             </div>
          )}
          {loadingMessages && messages.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px', color: '#94a3b8' }}>
              <Loader size={20} className="spin" /> &nbsp; Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
              No messages yet. Start the conversation!
            </div>
          ) : messages.map((msg) => (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`message-wrap ${msg.sender === "agent" ? "agent-msg" : "customer-msg"}`}
            >
              {canReply && (
                <>
                  <button
                    type="button"
                    className="message-reply-btn"
                    title="Reply"
                    style={{ [msg.sender === "agent" ? 'left' : 'right']: '-36px' }}
                    onClick={() => setReplyingTo(msg)}
                  >
                    <Reply size={14} />
                  </button>
                  <button
                    type="button"
                    className="message-reply-btn"
                    title="Forward to Agent for Mapping"
                    style={{ [msg.sender === "agent" ? 'left' : 'right']: '-70px' }}
                    onClick={() => {
                      const textToForward = msg.messageType === 'image' || msg.messageType === 'document' ? msg.text : formatMessageDisplay(msg.text);
                      const encodedText = encodeURIComponent(`*Mapping Task:*\n\n${textToForward}`);
                      window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
                    }}
                  >
                    <Forward size={14} />
                  </button>
                </>
              )}
              {msg.sender === "agent" && <div className="agent-tag">{msg.agentName || currentUser?.name}</div>}
              <div className={`message-bubble ${msg.sender}`}>
                {renderQuotedBlock(msg)}
                {getMessageType(msg) === "image" ? (
                  <a href={msg.text} target="_blank" rel="noreferrer" className="attachment-image-link">
                    <img src={msg.text} alt="attachment" className="attachment-image" />
                  </a>
                ) : getMessageType(msg) === "document" ? (
                  <a href={msg.text} target="_blank" rel="noreferrer" className="attachment-doc">
                    <FileText size={16} />
                    <span>Open document</span>
                    <Download size={14} />
                  </a>
                ) : (
                  <p className="message-text">{formatMessageDisplay(msg.text)}</p>
                )}
                <span className="msg-time">{formatMessageTime(msg)}{msg.sender === "agent" && <span className="msg-ticks"> ✓✓</span>}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Internal Notes Panel */}
        {showNotes && (
          <div className="notes-panel">
            <div className="notes-header"><StickyNote size={14} /> Internal Notes (Agent only)</div>
            <div className="notes-list">
              {notes.length === 0 ? <p className="no-notes">No notes yet</p> : notes.map((n, i) => (
                <div key={i} className="note-item">
                  <div className="note-agent">{n.agent} • {n.time}</div>
                  <div className="note-text">{n.text}</div>
                </div>
              ))}
            </div>
            <div className="note-input-wrap">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Type a note..." onKeyDown={e => e.key === "Enter" && addNote()} />
              <button onClick={addNote}>Add</button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Replies */}
      {showQuickReplies && (
        <div className="quick-replies">
          <div className="qr-header">⚡ Quick Replies</div>
          {quickReplies.map((qr, i) => (
            <button key={i} className="qr-item" onClick={() => handleSend(qr)}>{qr}</button>
          ))}
        </div>
      )}

      {/* Input or Accept Banner */}
      {!query.assignedTo ? (
        <div className="accept-query-banner">
          <div className="accept-banner-content">
            <AlertCircle size={22} className="accept-icon animate-pulse" />
            <div className="accept-text-wrap">
              <h4>Unassigned Query</h4>
              <p>Accept this query to start replying and interacting with the customer.</p>
            </div>
            <button className="accept-cta-btn" onClick={() => handleAcceptQuery(query.id)}>
              Accept Query
            </button>
          </div>
        </div>
      ) : (query.assignedTo !== currentUser?.id && !isAdmin) ? (
        <div className="assigned-elsewhere-banner">
          <div className="assigned-elsewhere-content">
            <User size={20} className="assigned-icon" />
            <div className="assigned-text-wrap">
              <h4>Assigned to {agents.find(a => a.id === query.assignedTo)?.name || "Another Agent"}</h4>
              <p>Only the assigned agent can reply. You are currently viewing in read-only mode.</p>
            </div>
          </div>
        </div>
      ) : query.status !== "resolved" ? (
        <div className="chat-input-area">
          {/* Pasted Image Preview */}
          {pastedImage && (
            <div className="paste-preview-bar">
              <img src={pastedImage.previewUrl} alt="Pasted" className="paste-preview-thumb" />
              <div className="paste-preview-info">
                <span>📋 Pasted image ready to send</span>
              </div>
              <button
                type="button"
                className="paste-preview-send"
                onClick={handleSendPastedImage}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : <><Send size={14} /> Send Image</>}
              </button>
              <button
                type="button"
                className="paste-preview-cancel"
                onClick={() => { URL.revokeObjectURL(pastedImage.previewUrl); setPastedImage(null); }}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {replyingTo && (
            <div className="reply-preview-bar">
              <div className="reply-preview-accent" />
              <div className="reply-preview-body">
                <span className="reply-preview-label">
                  Replying to {replyingTo.sender === "customer" ? query.name : "yourself"}
                </span>
                <span className="reply-preview-snippet">{getReplyPreviewText(replyingTo)}</span>
              </div>
              <button type="button" className="reply-preview-close" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">
                <X size={18} />
              </button>
            </div>
          )}
          <div className="input-toolbar">
            <button className="toolbar-btn" onClick={() => setShowQuickReplies(!showQuickReplies)} title="Quick Replies">
              <Smile size={18} />
            </button>
            <button className="toolbar-btn" onClick={() => fileInputRef.current?.click()} title="Attach File" disabled={uploading}>
              <Paperclip size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleAttachmentPick}
            />
          </div>
          <div className="input-wrap">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={replyingTo ? "Type your reply..." : "Type a reply... (Enter to send, Ctrl+V = paste image)"}
              rows={1}
            />
            <button className={`send-btn ${sending ? "sending" : ""}`} onClick={() => handleSend()} disabled={!inputText.trim() || uploading}>
              <Send size={16} />
            </button>
          </div>
          <div className="input-hint">Enter = Send &nbsp;•&nbsp; Shift+Enter = New line &nbsp;•&nbsp; 📎 = Attach &nbsp;•&nbsp; Ctrl+V = Paste Image</div>
        </div>
      ) : (
        <div className="resolved-banner"><CheckCircle size={16} /> This query has been resolved</div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="agent-modal-overlay" onClick={() => setShowTransferModal(false)} style={{ zIndex: 1000}}>
          <div className="agent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="agent-modal-header">
              <div>
                <h3>Transfer Query</h3>
                <p>Assign this query to a different department or agent</p>
              </div>
              <button className="agent-modal-close" onClick={() => setShowTransferModal(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="agent-modal-body">
              <div className="agent-form-group">
                <label>Transfer Destination</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button 
                     type="button"
                     style={{ flex: 1, padding: '8px', borderRadius: '6px', border: transferType === 'department' ? '1px solid #667eea' : '1px solid #e2e8f0', background: transferType === 'department' ? '#ebf4ff' : '#fff', color: transferType === 'department' ? '#4c51bf' : '#64748b', cursor: 'pointer' }}
                     onClick={() => { setTransferType("department"); setTransferTarget(""); }}
                  >
                     Department
                  </button>
                  <button 
                     type="button"
                     style={{ flex: 1, padding: '8px', borderRadius: '6px', border: transferType === 'specific' ? '1px solid #667eea' : '1px solid #e2e8f0', background: transferType === 'specific' ? '#ebf4ff' : '#fff', color: transferType === 'specific' ? '#4c51bf' : '#64748b', cursor: 'pointer' }}
                     onClick={() => { setTransferType("specific"); setTransferTarget(""); }}
                  >
                     Specific Agent
                  </button>
                </div>
              </div>

              {transferType === "department" && (
                 <div className="agent-form-group">
                   <label>Select Department</label>
                   <select className="agent-switcher" style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #e2e8f0', borderRadius: '6px' }} value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)}>
                     <option value="">Select a Group...</option>
                     {agentGroups.map(g => (
                       <option key={g.id} value={g.id}>{g.name}</option>
                     ))}
                   </select>
                 </div>
              )}

              {transferType === "specific" && (
                 <div className="agent-form-group">
                   <label>Select Agent</label>
                   <select className="agent-switcher" style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #e2e8f0', borderRadius: '6px' }} value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)}>
                     <option value="">Select an Agent...</option>
                     {agents.map(a => (
                       <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                     ))}
                   </select>
                 </div>
              )}
            </div>

            <div className="agent-modal-footer">
               <button type="button" className="agent-btn-cancel" onClick={() => setShowTransferModal(false)}>Cancel</button>
               <button type="button" className="agent-btn-submit" disabled={!transferTarget} onClick={() => {
                  if (transferType === "department") {
                     transferQuery(query.id, transferTarget, null);
                  } else {
                     transferQuery(query.id, null, transferTarget);
                  }
                  setShowTransferModal(false);
               }}>
                 Transfer Query
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
