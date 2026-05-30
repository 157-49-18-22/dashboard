import { useState } from "react";
import { MessageSquare, Lock, Mail, Eye, EyeOff, Loader } from "lucide-react";
import { authAPI } from "../../services/api";
import "./LoginPage.css";

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await authAPI.login(email, password);
      if (data.token && data.agent) {
        localStorage.setItem("crm_token", data.token);
        localStorage.setItem("crm_user", JSON.stringify(data.agent));
        onLogin(data.agent, data.token);
      }
    } catch (err) {
      setError(err.message || "Login failed. Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-gradient" />
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <MessageSquare size={28} color="#fff" />
          </div>
          <h1>WA Dashboard</h1>
          <p>WhatsApp CRM — Agent Login</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Email Address</label>
            <div className="login-input-wrap">
              <Mail size={16} className="login-input-icon" />
              <input
                type="email"
                placeholder="sneha@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="login-field">
            <label>Password</label>
            <div className="login-input-wrap">
              <Lock size={16} className="login-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <><Loader size={16} className="spin" /> Logging in...</> : "Login →"}
          </button>
        </form>


      </div>
    </div>
  );
};

export default LoginPage;
