import { useState, useEffect, useRef, useCallback } from "react";
import { queriesAPI, messagesAPI } from "../../services/api";
import { Search, Loader2, MessageSquare, User, CheckCircle2, Clock, X, ZoomIn, Send } from "lucide-react";
import { useApp } from "../../context/AppContext";
import "./AllChat.css";

const AllChat = () => {
  const [queries, setQueries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [selectedQuery, setSelectedQuery] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [msgLimit, setMsgLimit] = useState(30);
  const [lightboxImg, setLightboxImg] = useState(null);
  
  const { currentUser, sendMessage, agents } = useApp();
  const isAdmin = currentUser?.role?.toLowerCase().includes("admin") || currentUser?.role?.toLowerCase().includes("senior");
  const [chatFilter, setChatFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  // Close lightbox on ESC key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setLightboxImg(null);
  }, []);

  useEffect(() => {
    if (lightboxImg) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxImg, handleKeyDown]);

  const loadQueries = async (p = 1, search = "", status = "all") => {
    try {
      setLoading(true);
      const res = await queriesAPI.getAll({ page: p, limit: 10, search, status });
      if (res && res.data) {
        if (p === 1) setQueries(res.data);
        else setQueries(prev => [...prev, ...res.data]);
        
        setHasMore(res.page < res.totalPages);
      }
    } catch (error) {
      console.error("Error loading queries:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search - 250ms for fast real-time feel
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1); // Reset page on new search
    }, 250);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    loadQueries(page, searchQuery, chatFilter);
  }, [page, searchQuery, chatFilter]);

  const handleSelectChat = async (q) => {
    setSelectedQuery(q);
    setMsgLimit(30);
    setLoadingMessages(true);
    setMessages([]);
    try {
      const res = await messagesAPI.getByQuery(q.id);
      if (res && res.messages) {
        setMessages(res.messages);
      }
    } catch (error) {
      console.error("Error loading msgs", error);
    } finally {
      setLoadingMessages(false);
      setTimeout(() => {
        const container = document.querySelector('.ac-messages');
        if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleLoadMoreMsgs = () => {
    setMsgLimit(prev => prev + 30);
  };

  const displayMsgs = messages.slice(Math.max(messages.length - msgLimit, 0));
  const showMsgLoadMore = messages.length > msgLimit;

  const getStatusBadge = (status) => {
    if (status === 'resolved') return <span className="stat-badge resolved"><CheckCircle2 size={12}/> Resolved</span>
    if (status === 'in_progress') return <span className="stat-badge in_progress"><Clock size={12}/> In Progress</span>
    return <span className="stat-badge open">Open</span>
  }

  const handleReassign = async (agentId) => {
    if (!selectedQuery) return;
    try {
      if (!agentId) return;
      // Change status to 'open' so it lands in their Team Member Pool for claiming
      await queriesAPI.assign(selectedQuery.id, agentId, null, "open");
      alert("Chat reassigned successfully!");
      // Optionally refresh query list and reset selection
      loadQueries(1, searchQuery, chatFilter);
      setSelectedQuery(null);
    } catch (err) {
      alert("Failed to reassign chat");
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedQuery) return;
    setSending(true);
    try {
      await sendMessage(selectedQuery.id, { text: replyText, messageType: "text" });
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: "agent",
        agentName: currentUser?.name || "Admin",
        text: replyText,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        messageType: "text"
      }]);
      setReplyText("");
      setTimeout(() => {
        const container = document.querySelector('.ac-messages');
        if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      alert("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
    <div className="allchat-container">
      {/* LEFT SIDEBAR OLL */}
      <div className="ac-sidebar">
        <div className="ac-header">
          <h2>All Chats (Read Only)</h2>
          <div className="ac-search">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search name or number..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="ac-filters" style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto' }}>
            {['all', 'open', 'in_progress'].map(f => (
              <button 
                key={f}
                style={{
                  padding: '6px 12px', borderRadius: '16px', border: '1px solid #e2e8f0',
                  background: chatFilter === f ? '#6366f1' : '#f8fafc',
                  color: chatFilter === f ? '#fff' : '#64748b',
                  fontSize: '12px', cursor: 'pointer', textTransform: 'capitalize',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => { setChatFilter(f); setPage(1); }}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        
        <div className="ac-list">
          {queries.map((q) => (
            <div 
              key={q.id} 
              className={`ac-card ${selectedQuery?.id === q.id ? 'active' : ''}`}
              onClick={() => handleSelectChat(q)}
            >
              <div className="ac-card-top">
                <div className="ac-card-name">
                  <div className="avt">{q.avatar || <User size={14}/>}</div>
                  <span className="nm">{q.name}</span>
                </div>
                <span className="tm">{new Date(q.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="ac-card-mid">
                <span className="pn">{q.from}</span>
                {getStatusBadge(q.status)}
              </div>
              <p className="last-msg">{q.message}</p>
            </div>
          ))}
          
          {hasMore && (
            <button className="ac-load-more" onClick={() => setPage(page + 1)} disabled={loading}>
              {loading ? <Loader2 className="spin" size={16} /> : "Load More (10)"}
            </button>
          )}

          {!loading && queries.length === 0 && (
            <div className="ac-empty">No chats found.</div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE CHAT AREA */}
      <div className="ac-chatarea">
        {selectedQuery ? (
          <div className="ac-chat-wrapper">
            <div className="ac-chat-header">
              <div className="ac-chat-header-info">
                <h3>{selectedQuery.name}</h3>
                <span>{selectedQuery.from}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isAdmin && (
                  <select 
                    onChange={(e) => handleReassign(e.target.value)} 
                    value=""
                    className="agent-assign-select"
                  >
                    <option value="" disabled>Assign to Agent...</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                )}
                <div className="readonly-badge">{isAdmin ? "ADMIN REPLY ENABLED" : "READ ONLY MODE"}</div>
              </div>
            </div>

            <div className="ac-messages">
              {loadingMessages ? (
                <div className="ac-msg-loader"><Loader2 className="spin" size={24} /></div>
              ) : (
                <>
                  {showMsgLoadMore && (
                    <button className="ac-load-more-msgs" onClick={handleLoadMoreMsgs}>
                      Load older messages (30+)
                    </button>
                  )}
                  {displayMsgs.map((msg) => {
                    const isAgent = msg.sender === 'agent' || msg.sender === 'bot';
                    const isImage = msg.messageType === 'image';
                    const isDocument = msg.messageType === 'document';
                    const isMedia = isImage || isDocument;
                    // For media, text field usually contains the URL
                    const mediaUrl = isMedia ? msg.text : null;

                    return (
                      <div key={msg.id} className={`msg-bubble ${isAgent ? 'agent-msg' : 'user-msg'}`}>
                        {isAgent && <span className="agent-tag">{msg.agentName || 'Agent'}</span>}
                        <div className="msg-box">
                          {isImage ? (
                            <div className="media-img-wrap" onClick={() => setLightboxImg(mediaUrl)}>
                              <img
                                src={mediaUrl}
                                alt="Shared image"
                                className="chat-img"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="img-zoom-hint"><ZoomIn size={14}/> Click to expand</div>
                              <div className="media-fallback" style={{display:'none'}}>
                                📷 Image (could not load)
                              </div>
                            </div>
                          ) : isDocument ? (
                            <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="doc-link">
                              📄 View Document
                            </a>
                          ) : (
                            <span>{msg.text}</span>
                          )}
                        </div>
                        <span className="msg-time">{msg.time}</span>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {isAdmin ? (
              <div className="ac-chat-footer admin-reply-footer" style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
                <input 
                  type="text" 
                  value={replyText} 
                  onChange={(e) => setReplyText(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  placeholder="Type a reply as admin..." 
                  style={{ flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
                />
                <button 
                  onClick={handleSendReply} 
                  disabled={!replyText.trim() || sending}
                  style={{ background: '#25d366', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={16} />
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            ) : (
              <div className="ac-chat-footer">
                <p>Chat is closed for reply in this viewer. Go to active pools to interact.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="ac-no-selection">
            <MessageSquare size={64} color="#cbd5e1" />
            <h3>No Chat Selected</h3>
            <p>Select a conversation from the left to view messages.</p>
          </div>
        )}
      </div>
    </div>

    {/* Lightbox Modal */}
    {lightboxImg && (
      <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
        <button className="lightbox-close" onClick={() => setLightboxImg(null)}>
          <X size={24} />
        </button>
        <img
          src={lightboxImg}
          alt="Full view"
          className="lightbox-img"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
  </>
  );
}


export default AllChat;
