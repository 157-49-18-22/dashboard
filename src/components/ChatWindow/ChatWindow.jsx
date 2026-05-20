import { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { 
  ArrowLeft, CheckCircle, AlertCircle, Send, Smile, Phone, Tag, StickyNote, Search, Loader, User, Paperclip, FileText, Download
} from "lucide-react";
import { messagesAPI } from "../../services/api";
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
    currentUser, backendOnline, assignQuery, setActiveTab, agents 
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
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const query = queries.find((q) => q.id === selectedQuery?.id);

  // Load messages from backend when query is selected
  useEffect(() => {
    if (!query?.id || !backendOnline) {
      setFetchedMessages([]);
      return;
    }
    setLoadingMessages(true);
    messagesAPI.getByQuery(query.id)
      .then((res) => setFetchedMessages(res.messages || []))
      .catch(() => setFetchedMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [query?.id, backendOnline]);

  // Merge fetched messages with optimistic messages from state
  const messages = (() => {
    const stateMessages = query?.messages || [];
    if (!backendOnline) return stateMessages;
    
    const combined = [...fetchedMessages, ...stateMessages];
    
    // Proactive robust sort
    const sorted = combined.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : (typeof a.id === 'number' && a.id > 1000000000000 ? new Date(a.id) : new Date());
      const dateB = b.createdAt ? new Date(b.createdAt) : (typeof b.id === 'number' && b.id > 1000000000000 ? new Date(b.id) : new Date());
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
    
    return unique;
  })();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle direct reply sending (Calls /whatsapp-message directly)
  const handleSend = async (text) => {
    const msg = text || inputText;
    if (!msg.trim() || !query) return;
    setSending(true);
    try {
      await sendMessage(query.id, { text: msg, messageType: "text" });
      setInputText("");
      setShowQuickReplies(false);
    } catch (err) {
      console.error("Direct send failed:", err);
      alert(err.message || "Failed to send message. Please ensure Alponix active plan is configured.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const getMessageType = (msg) => {
    if (msg?.messageType) return msg.messageType;
    const text = (msg?.text || "").toLowerCase();
    const isUrl = /^https?:\/\//.test(text);
    if (!isUrl) return "text";
    if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(text)) return "image";
    if (/\.(pdf|doc|docx|xls|xlsx|txt)(\?|$)/i.test(text)) return "document";
    return "text";
  };

  const handleAttachmentPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !query) return;
    setUploading(true);
    try {
      const uploadRes = await messagesAPI.uploadAttachment(file);
      const lowerType = (file.type || "").toLowerCase();
      const messageType = lowerType.startsWith("image/") ? "image" : "document";
      await sendMessage(query.id, {
        text: "",
        messageType,
        attachmentUrl: uploadRes.attachmentUrl,
        fileName: uploadRes.fileName,
      });
    } catch (err) {
      alert(err.message || "Attachment upload failed");
    } finally {
      e.target.value = "";
      setUploading(false);
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
          <button className="icon-btn" title="Tag Priority">
            <Tag size={16} />
          </button>
          {query.status !== "resolved" && (
            <button className="resolve-btn" onClick={() => resolveQuery(query.id)}>
              <CheckCircle size={15} /> Resolve
            </button>
          )}
        </div>
      </div>

      <div className="chat-body">
        {/* Messages */}
        <div className="messages-container">
          <div className="date-divider"><span>Today</span></div>
          {loadingMessages ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px', color: '#94a3b8' }}>
              <Loader size={20} className="spin" /> &nbsp; Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
              No messages yet. Start the conversation!
            </div>
          ) : messages.map((msg) => (
            <div key={msg.id} className={`message-wrap ${msg.sender === "agent" ? "agent-msg" : "customer-msg"}`}>
              {msg.sender === "agent" && <div className="agent-tag">{msg.agentName || currentUser?.name}</div>}
              <div className={`message-bubble ${msg.sender}`}>
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
                  <p>{msg.text}</p>
                )}
                <span className="msg-time">{msg.time}{msg.sender === "agent" && <span className="msg-ticks"> ✓✓</span>}</span>
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
      ) : query.assignedTo !== currentUser?.id ? (
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
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type a reply... (Enter to send)" rows={1} />
            <button className={`send-btn ${sending ? "sending" : ""}`} onClick={() => handleSend()} disabled={!inputText.trim() || uploading}>
              <Send size={16} />
            </button>
          </div>
          <div className="input-hint">Enter = Send &nbsp;•&nbsp; Shift+Enter = New line &nbsp;•&nbsp; 📎 = Attachment</div>
        </div>
      ) : (
        <div className="resolved-banner"><CheckCircle size={16} /> This query has been resolved</div>
      )}
    </div>
  );
};

export default ChatWindow;
