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
