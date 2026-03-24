import { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ArrowLeft, CheckCircle, Send, Smile, Paperclip, MoreVertical, Phone, Tag, StickyNote } from "lucide-react";
import "./ChatWindow.css";

const quickReplies = [
  "Aapki query receive ho gayi hai, main abhi check karta hoon.",
  "Kripya thoda wait karein, 2 minute mein reply karta hoon.",
  "Aapka issue resolve ho gaya hai. Koi aur help chahiye?",
  "Order number bata sakte hain?",
  "Screenshot bhej sakte hain?",
];

const ChatWindow = () => {
  const { selectedQuery, queries, sendMessage, resolveQuery, setSelectedQuery, currentUser } = useApp();
  const [inputText, setInputText] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const query = queries.find((q) => q.id === selectedQuery?.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [query?.messages]);

  const handleSend = (text) => {
    const msg = text || inputText;
    if (!msg.trim() || !query) return;
    setSending(true);
    sendMessage(query.id, msg);
    setInputText("");
    setShowQuickReplies(false);
    setTimeout(() => setSending(false), 400);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const addNote = () => {
    if (!note.trim()) return;
    setNotes(prev => [...prev, { text: note, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), agent: currentUser.name }]);
    setNote("");
  };

  if (!query) {
    return (
      <div className="chat-window empty-chat">
        <div className="empty-chat-content">
          <div className="empty-chat-icon"><Send size={48} color="#cbd5e0" /></div>
          <h3>Koi query select karo</h3>
          <p>Left panel se customer query choose karo aur reply karna shuru karo</p>
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
          {query.messages.map((msg) => (
            <div key={msg.id} className={`message-wrap ${msg.sender === "agent" ? "agent-msg" : "customer-msg"}`}>
              {msg.sender === "agent" && <div className="agent-tag">{msg.agentName || currentUser.name}</div>}
              <div className={`message-bubble ${msg.sender}`}>
                <p>{msg.text}</p>
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
              {notes.length === 0 ? <p className="no-notes">Koi note nahi hai</p> : notes.map((n, i) => (
                <div key={i} className="note-item">
                  <div className="note-agent">{n.agent} • {n.time}</div>
                  <div className="note-text">{n.text}</div>
                </div>
              ))}
            </div>
            <div className="note-input-wrap">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note likhein..." onKeyDown={e => e.key === "Enter" && addNote()} />
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

      {/* Input */}
      {query.status !== "resolved" ? (
        <div className="chat-input-area">
          <div className="input-toolbar">
            <button className="toolbar-btn" onClick={() => setShowQuickReplies(!showQuickReplies)} title="Quick Replies">
              <Smile size={18} />
            </button>
            <button className="toolbar-btn" title="Attach File"><Paperclip size={18} /></button>
          </div>
          <div className="input-wrap">
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Reply likhein... (Enter to send)" rows={1} />
            <button className={`send-btn ${sending ? "sending" : ""}`} onClick={() => handleSend()} disabled={!inputText.trim()}>
              <Send size={16} />
            </button>
          </div>
          <div className="input-hint">Enter = Send &nbsp;•&nbsp; Shift+Enter = New line &nbsp;•&nbsp; 😊 = Quick Replies</div>
        </div>
      ) : (
        <div className="resolved-banner"><CheckCircle size={16} /> Yeh query resolve ho gayi hai</div>
      )}
    </div>
  );
};

export default ChatWindow;
