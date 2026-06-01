import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar/Sidebar";
import QueryList from "./components/QueryList/QueryList";
import ChatWindow from "./components/ChatWindow/ChatWindow";
import AgentPanel from "./components/AgentPanel/AgentPanel";
import ActivityLog from "./components/ActivityLog/ActivityLog";
import StatsOverview from "./components/StatsOverview/StatsOverview";
import MobileNav from "./components/MobileNav/MobileNav";
import Reports from "./components/Reports/Reports";
import SentMessages from "./components/SentMessages/SentMessages";
import LoginPage from "./components/LoginPage/LoginPage";
import QueryPool from "./components/QueryPool/QueryPool";
import AllChat from "./components/AllChat/AllChat";
import ContactBook from "./components/ContactBook/ContactBook";
import "./App.css";

const DashboardContent = ({ onLogout }) => {
  const { activeTab, newMessageAlert, selectedQuery } = useApp();

  return (
    <div className="app-layout">
      {/* Sidebar — desktop only */}
      <Sidebar onLogout={onLogout} />

      {/* Main area */}
      {activeTab === "queries" && (
        <div className="main-content queries-view">
          {newMessageAlert && (
            <div className="toast-alert">📱 New WhatsApp message received!</div>
          )}
          {/* On mobile: show only chat when query selected, else show list */}
          <div className={`query-list-wrapper ${selectedQuery ? "mobile-hidden" : ""}`}>
            <QueryList />
          </div>
          <div className={`chat-wrapper ${!selectedQuery ? "mobile-hidden" : ""}`}>
            <ChatWindow />
          </div>
        </div>
      )}

      {activeTab === "all_chats" && (
        <div className="main-content full-view"><AllChat /></div>
      )}

      {["pool", "department", "specific"].includes(activeTab) && (
        <div className="main-content full-view">
          <QueryPool />
        </div>
      )}

      {activeTab === "agents" && (
        <div className="main-content full-view"><AgentPanel /></div>
      )}
      {activeTab === "contacts" && (
        <div className="main-content full-view"><ContactBook /></div>
      )}
      {activeTab === "activity" && (
        <div className="main-content full-view"><ActivityLog /></div>
      )}
      {activeTab === "reports" && (
        <div className="main-content full-view"><Reports /></div>
      )}
      {activeTab === "sent" && (
        <div className="main-content full-view"><SentMessages /></div>
      )}
      {activeTab === "stats" && (
        <div className="main-content full-view"><StatsOverview /></div>
      )}

      {/* Bottom nav — mobile only */}
      <MobileNav />
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("crm_token"));

  const handleLogin = (agent, token) => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AppProvider>
      <DashboardContent onLogout={handleLogout} />
    </AppProvider>
  );
}

export default App;
