export const mockQueries = [
  {
    id: "q1", from: "+91 98765 43210", name: "Rahul Sharma", avatar: "RS",
    message: "Mujhe apne account ke baare mein jaankari chahiye",
    time: "2026-03-24T21:10:00", status: "open", assignedTo: null,
    unread: 3, priority: "high",
    messages: [
      { id: 1, sender: "customer", text: "Hello, koi hai?", time: "21:05" },
      { id: 2, sender: "customer", text: "Mujhe apne account ke baare mein jaankari chahiye", time: "21:08" },
      { id: 3, sender: "customer", text: "Urgent hai please reply karo", time: "21:10" },
    ],
  },
  {
    id: "q2", from: "+91 87654 32109", name: "Priya Verma", avatar: "PV",
    message: "Payment nahi hua mera, please check karo",
    time: "2026-03-24T21:05:00", status: "open", assignedTo: "agent2",
    unread: 1, priority: "high",
    messages: [
      { id: 1, sender: "customer", text: "Hi, mera payment stuck hai", time: "20:55" },
      { id: 2, sender: "agent", text: "Haan ji, aapka order number kya hai?", time: "21:00", agentName: "Amit Kumar" },
      { id: 3, sender: "customer", text: "Payment nahi hua mera, please check karo", time: "21:05" },
    ],
  },
  {
    id: "q3", from: "+91 76543 21098", name: "Suresh Gupta", avatar: "SG",
    message: "Delivery kab tak hogi?",
    time: "2026-03-24T20:50:00", status: "resolved", assignedTo: "agent1",
    unread: 0, priority: "low",
    messages: [
      { id: 1, sender: "customer", text: "Delivery kab tak hogi?", time: "20:45" },
      { id: 2, sender: "agent", text: "2-3 business days mein delivery ho jaayegi", time: "20:50", agentName: "Sneha Singh" },
      { id: 3, sender: "customer", text: "Thank you!", time: "20:52" },
    ],
  },
  {
    id: "q4", from: "+91 65432 10987", name: "Anjali Mehta", avatar: "AM",
    message: "Refund process kaise hoga?",
    time: "2026-03-24T20:30:00", status: "open", assignedTo: null,
    unread: 5, priority: "medium",
    messages: [
      { id: 1, sender: "customer", text: "Mujhe refund chahiye", time: "20:25" },
      { id: 2, sender: "customer", text: "Refund process kaise hoga?", time: "20:30" },
    ],
  },
  {
    id: "q5", from: "+91 54321 09876", name: "Vikram Patel", avatar: "VP",
    message: "Product quality se main khush nahi hoon",
    time: "2026-03-24T19:45:00", status: "in_progress", assignedTo: "agent3",
    unread: 2, priority: "medium",
    messages: [
      { id: 1, sender: "customer", text: "Mera product damaged aaya", time: "19:40" },
      { id: 2, sender: "customer", text: "Product quality se main khush nahi hoon", time: "19:45" },
      { id: 3, sender: "agent", text: "Photo bhejo please", time: "19:50", agentName: "Rohan Joshi" },
    ],
  },
];

export const mockAgents = [
  { id: "agent1", name: "Sneha Singh", avatar: "SS", email: "sneha@company.com", role: "Senior Agent", status: "online", resolvedToday: 12, totalMessages: 48, avgResponseTime: "2.3 min", activeChats: 2 },
  { id: "agent2", name: "Amit Kumar", avatar: "AK", email: "amit@company.com", role: "Support Agent", status: "online", resolvedToday: 8, totalMessages: 31, avgResponseTime: "3.1 min", activeChats: 1 },
  { id: "agent3", name: "Rohan Joshi", avatar: "RJ", email: "rohan@company.com", role: "Support Agent", status: "busy", resolvedToday: 5, totalMessages: 22, avgResponseTime: "4.7 min", activeChats: 3 },
  { id: "agent4", name: "Kavya Reddy", avatar: "KR", email: "kavya@company.com", role: "Junior Agent", status: "away", resolvedToday: 3, totalMessages: 14, avgResponseTime: "5.2 min", activeChats: 0 },
];

export const mockActivityLogs = [
  { id: 1, agentId: "agent1", agentName: "Sneha Singh", action: "Query resolve ki", customer: "Suresh Gupta", time: "21:15", type: "resolved" },
  { id: 2, agentId: "agent2", agentName: "Amit Kumar", action: "Query assign hui", customer: "Priya Verma", time: "21:00", type: "assigned" },
  { id: 3, agentId: "agent3", agentName: "Rohan Joshi", action: "Message bheja", customer: "Vikram Patel", time: "19:50", type: "message" },
  { id: 4, agentId: "agent1", agentName: "Sneha Singh", action: "Query resolve ki", customer: "Manoj Tiwari", time: "19:30", type: "resolved" },
  { id: 5, agentId: "agent2", agentName: "Amit Kumar", action: "Message bheja", customer: "Priya Verma", time: "19:00", type: "message" },
  { id: 6, agentId: "agent1", agentName: "Sneha Singh", action: "Query assign li", customer: "Anita Sharma", time: "18:45", type: "assigned" },
  { id: 7, agentId: "agent4", agentName: "Kavya Reddy", action: "Message bheja", customer: "Deepak Rao", time: "18:30", type: "message" },
  { id: 8, agentId: "agent3", agentName: "Rohan Joshi", action: "Query resolve ki", customer: "Sonia Patel", time: "18:00", type: "resolved" },
];

export const currentUser = { id: "agent1", name: "Sneha Singh", avatar: "SS", role: "Senior Agent" };
