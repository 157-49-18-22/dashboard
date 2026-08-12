/** Preserve and restore line breaks for multi-line WhatsApp / forwarded email messages */
export const formatMessageDisplay = (text) => {
  if (text == null) return "";
  let s = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!s) return "";

  // Already formatted with line breaks
  if (s.includes("\n")) return s;

  // Email-style header: "to me" on its own line
  s = s.replace(/\s+to\s+me\s+/i, "\nto me\n\n");

  // FMC / Fastag ID pairs: put each ID on its own line
  s = s.replace(/(\d{6}-\d{3}-\d{7})\s+(\d{6}-\d{3}-\d{7})/g, "$1\n$2");

  // Section labels like "VC. 6. 10 fastag"
  s = s.replace(/\s+(VC\.\s*[\d.]+\s*(?:[Ff]astag)?)/g, "\n\n$1");

  // Collapse excessive blank lines
  return s.replace(/\n{3,}/g, "\n\n").trim();
};

export const getMessageType = (msg) => {
  if (msg?.messageType) return msg.messageType;
  const text = (msg?.text || "").toLowerCase();
  const isUrl = /^https?:\/\//.test(text);
  if (!isUrl) return "text";
  if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(text)) return "image";
  if (/\.(pdf|doc|docx|xls|xlsx|txt)(\?|$)/i.test(text)) return "document";
  return "text";
};

export const getReplyPreviewText = (msg) => {
  const type = getMessageType(msg);
  if (type === "image") return "Photo";
  if (type === "document") return msg.fileName || "Document";
  const text = (msg?.text || "").trim();
  if (text.length > 80) return `${text.slice(0, 80)}…`;
  return text || "Message";
};

export const buildReplyToPayload = (msg) => ({
  messageId: msg.id,
  text: msg.text,
  sender: msg.sender,
  messageType: getMessageType(msg),
});
