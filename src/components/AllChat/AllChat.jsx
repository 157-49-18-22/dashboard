import { useState, useEffect, useRef, useCallback } from "react";
import { queriesAPI, messagesAPI } from "../../services/api";
import { getSocket } from "../../services/socket";
import { Search, Loader2, MessageSquare, User, CheckCircle2, Clock, X, ZoomIn, Send, Reply, Forward, Download } from "lucide-react";
import { useApp } from "../../context/AppContext";
import "./AllChat.css";
import { getMessageType, getReplyPreviewText, buildReplyToPayload, formatMessageDisplay } from "../ChatWindow/messageUtils";
const AllChat = () => {
  const { currentUser, sendMessage, agents, setQueries: setGlobalQueries } = useApp();
  const isAdmin = currentUser?.role?.toLowerCase().includes("admin") || currentUser?.role?.toLowerCase().includes("senior");

  // AllChat has its OWN local queries state (separate from global QueryPool)
  const [queries, setQueries] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [selectedQuery, setSelectedQuery] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMsg, setHasMoreMsg] = useState(false);
  const [msgCursor, setMsgCursor] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [chatFilter, setChatFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [pastedImage, setPastedImage] = useState(null); // { file, previewUrl }
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardTargetAgent, setForwardTargetAgent] = useState("");
  const [forwardMessageData, setForwardMessageData] = useState(null);

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
    setHasMoreMsg(false);
    setMsgCursor(null);
    setLoadingOlder(false);
    setLoadingMessages(true);
    setMessages([]);
    setReplyingTo(null);
    try {
      const res = await messagesAPI.getByQuery(q.id, { limit: 80 });
      if (res && res.messages) {
        setMessages(res.messages);
        setHasMoreMsg(Boolean(res.hasMore));
        setMsgCursor(res.nextCursor || null);
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

  // Live append for open AllChat thread (same as main chat)
  useEffect(() => {
    if (!selectedQuery?.id) return;
    const socket = getSocket();
    if (!socket) return;

    const onNew = (msg) => {
      if (msg.queryId !== selectedQuery.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const cleaned = prev.filter((m) => {
          const isOptimistic =
            m.sender === msg.sender &&
            m.text === msg.text &&
            typeof m.id === "number" &&
            m.id > 1000000000000;
          return !isOptimistic;
        });
        return [...cleaned, msg];
      });
    };

    const onIncoming = ({ queryId, message }) => {
      if (queryId !== selectedQuery.id || !message) return;
      onNew(typeof message === "object" ? message : { id: Date.now(), text: message, sender: "customer", queryId });
    };

    socket.on("message:new", onNew);
    socket.on("query:newIncoming", onIncoming);
    return () => {
      socket.off("message:new", onNew);
      socket.off("query:newIncoming", onIncoming);
    };
  }, [selectedQuery?.id]);

  const handleLoadMoreMsgs = async () => {
    if (!selectedQuery?.id || !hasMoreMsg || !msgCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await messagesAPI.getByQuery(selectedQuery.id, {
        limit: 80,
        beforeCreatedAt: msgCursor,
      });
      const older = res.messages || [];
      setMessages((prev) => [...older, ...prev]);
      setHasMoreMsg(Boolean(res.hasMore));
      setMsgCursor(res.nextCursor || null);
    } catch (err) {
      console.error("Load older failed:", err);
    } finally {
      setLoadingOlder(false);
    }
  };
  const displayMsgs = messages;
  const showMsgLoadMore = hasMoreMsg;

  const getStatusBadge = (status) => {
    if (status === 'resolved') return <span className="stat-badge resolved"><CheckCircle2 size={12}/> Resolved</span>
    if (status === 'in_progress') return <span className="stat-badge in_progress"><Clock size={12}/> In Progress</span>
    return <span className="stat-badge open">Open</span>
  }

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
          const el = document.getElementById(`ac-msg-${msg.replyToMessageId}`);
          el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }}
        onKeyDown={(e) => e.key === "Enter" && document.getElementById(`ac-msg-${msg.replyToMessageId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })}
      >
        <span className="quoted-author">{isCustomer ? selectedQuery?.name || "Customer" : "You"}</span>
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
    const text = replyText;
    const replyTo = replyingTo ? buildReplyToPayload(replyingTo) : undefined;
    const optimistic = {
      id: Date.now(),
      sender: "agent",
      agentName: currentUser?.name || "Admin",
      text,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
      messageType: "text",
      replyToText: replyTo?.text,
      replyToSender: replyTo?.sender,
      replyToMessageType: replyTo?.messageType,
      replyToMessageId: replyTo?.messageId,
    };
    setMessages((prev) => [...prev, optimistic]);
    setReplyText("");
    setReplyingTo(null);
    setSending(true);
    try {
      await sendMessage(selectedQuery.id, { text, messageType: "text", replyTo });
      setTimeout(() => {
        const container = document.querySelector('.ac-messages');
        if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }, 50);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setReplyText(text);
      alert("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  // Handle Ctrl+V image paste
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
    if (!pastedImage || !selectedQuery) return;
    setSending(true);
    try {
      const { messagesAPI } = await import("../../services/api");
      const uploadRes = await messagesAPI.uploadAttachment(pastedImage.file);
      const replyTo = replyingTo ? buildReplyToPayload(replyingTo) : undefined;
      await sendMessage(selectedQuery.id, {
        text: "",
        messageType: "image",
        attachmentUrl: uploadRes.attachmentUrl,
        fileName: uploadRes.fileName,
        replyTo,
      });
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: "agent",
        agentName: currentUser?.name || "Admin",
        text: uploadRes.attachmentUrl,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        messageType: "image",
      }]);
      setReplyingTo(null);
      URL.revokeObjectURL(pastedImage.previewUrl);
      setPastedImage(null);
      setTimeout(() => {
        const container = document.querySelector('.ac-messages');
        if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      alert("Pasted image upload failed");
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
                    <button className="ac-load-more-msgs" onClick={handleLoadMoreMsgs} disabled={loadingOlder}>
                      {loadingOlder ? "Loading older..." : "Load older messages"}
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
                      <div key={msg.id} id={`ac-msg-${msg.id}`} className={`msg-bubble ${isAgent ? 'agent-msg' : 'user-msg'}`} style={{ position: 'relative' }}>
                        {isAdmin && (
                          <div className="message-actions-container">
                            <button
                              type="button"
                              className="action-icon-btn"
                              title="Reply"
                              onClick={() => setReplyingTo(msg)}
                            >
                              <Reply size={14} />
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn"
                              title="Forward to Agent for Mapping"
                              onClick={() => {
                                setForwardMessageData(msg);
                                setShowForwardModal(true);
                              }}
                            >
                              <Forward size={14} />
                            </button>
                          </div>
                        )}
                        {isAgent && <span className="agent-tag">{msg.agentName || 'Agent'}</span>}
                        <div className="msg-box">
                          {renderQuotedBlock(msg)}
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
                            <span>{formatMessageDisplay(msg.text)}</span>
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
              <div className="ac-chat-footer admin-reply-footer" style={{ display: 'flex', flexDirection: 'column', padding: '10px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
                {/* Pasted Image Preview */}
                {pastedImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '8px', border: '1px solid #bbf7d0' }}>
                    <img src={pastedImage.previewUrl} alt="Pasted" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #d1fae5' }} />
                    <span style={{ flex: 1, fontSize: '13px', color: '#166534' }}>📋 Pasted image ready to send</span>
                    <button
                      type="button"
                      onClick={handleSendPastedImage}
                      disabled={sending}
                      style={{ background: '#25d366', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                    >
                      <Send size={14} /> {sending ? "Uploading..." : "Send Image"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { URL.revokeObjectURL(pastedImage.previewUrl); setPastedImage(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {replyingTo && (
                  <div className="ac-reply-preview-bar" style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px', borderLeft: '4px solid #6366f1' }}>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#6366f1', fontWeight: 'bold' }}>
                        Replying to {replyingTo.sender === "customer" ? selectedQuery.name : "yourself"}
                      </span>
                      <span style={{ display: 'block', fontSize: '12px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {getReplyPreviewText(replyingTo)}
                      </span>
                    </div>
                    <button type="button" onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                      <X size={16} />
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                  <input 
                    type="text" 
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    onPaste={handlePaste}
                    placeholder={replyingTo ? "Type your reply..." : "Type a reply as admin... (Ctrl+V = paste image)"}
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
        <div className="lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
          <a
            href={lightboxImg}
            download
            target="_blank"
            rel="noreferrer"
            className="lightbox-download-btn"
            title="Download Image"
            onClick={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch(lightboxImg);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `image_${Date.now()}.jpg`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                window.open(lightboxImg, '_blank');
              }
            }}
          >
            <Download size={20} />
            Download
          </a>
          <button className="lightbox-close" onClick={() => setLightboxImg(null)}>
            <X size={24} />
          </button>
        </div>
        <img
          src={lightboxImg}
          alt="Full view"
          className="lightbox-img"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}

      {/* Internal Forward Modal */}
      {showForwardModal && (
        <div className="lightbox-overlay" onClick={() => setShowForwardModal(false)} style={{ zIndex: 1000}}>
          <div className="ac-card" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px', cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#1a202c', fontSize: '16px' }}>Forward to Agent</h3>
              <button onClick={() => setShowForwardModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
               <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#4a5568', marginBottom: '8px' }}>Select Agent</label>
               <select style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} value={forwardTargetAgent} onChange={(e) => setForwardTargetAgent(e.target.value)}>
                 <option value="">Select an Agent...</option>
                 {agents.map(a => (
                   <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                 ))}
               </select>
               
               {forwardMessageData && (
                 <div style={{ marginTop: '16px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569', maxHeight: '100px', overflowY: 'auto' }}>
                    <strong>Message Preview:</strong><br/>
                    {forwardMessageData.messageType === 'image' ? '[Image]' : forwardMessageData.text}
                 </div>
               )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
               <button type="button" onClick={() => setShowForwardModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', background: '#edf2f7', border: 'none', color: '#4a5568', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
               <button type="button" disabled={!forwardTargetAgent} onClick={async () => {
                 const agentName = agents.find(a => a.id === forwardTargetAgent)?.name || "Agent";
                 const textToForward = forwardMessageData.messageType === 'image' || forwardMessageData.messageType === 'document' ? forwardMessageData.text : formatMessageDisplay(forwardMessageData.text);
                 
                 try {
                   const created = await queriesAPI.create({
                     name: `Mapping: ${selectedQuery?.name || 'Customer'}`,
                     from: selectedQuery?.from || 'forwarded',
                     message: textToForward,
                     status: 'open',
                     assignedTo: forwardTargetAgent,
                     priority: 'high',
                     isForwarded: true,
                   });
                   if (created && created.query) {
                     setGlobalQueries(prev => [created.query, ...prev]);
                   }
                 } catch (err) {
                   // Backend failed — still add locally so it works in offline mode
                   const newQuery = {
                     id: `q_fwd_${Date.now()}`,
                     from: selectedQuery?.from || 'forwarded',
                     name: `Mapping: ${selectedQuery?.name || 'Customer'}`,
                     avatar: "MT",
                     message: textToForward,
                     time: new Date().toISOString(),
                     status: "open",
                     assignedTo: forwardTargetAgent,
                     assignedToGroup: null,
                     unread: 1,
                     priority: "high",
                     messages: [{ 
                       id: Date.now(), 
                       sender: "customer",
                       text: textToForward, 
                       messageType: forwardMessageData.messageType,
                       time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) 
                     }],
                   };
                   setGlobalQueries(prev => [newQuery, ...prev]);
                 }

                 alert(`Message forwarded to ${agentName}'s Team Member Pool successfully!`);
                 setShowForwardModal(false);
                 setForwardTargetAgent("");
                 setForwardMessageData(null);
               }} style={{ padding: '8px 16px', borderRadius: '6px', background: '#25d366', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', opacity: forwardTargetAgent ? 1 : 0.5 }}>
                 Forward
               </button>
            </div>
          </div>
        </div>
      )}
  </>
  );
}


export default AllChat;
