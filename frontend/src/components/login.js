import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ljLogo from "../assets/lj.jpg";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/auth/login", {
        email,
        password,
      });

      // Clear any existing teacher data first
      localStorage.clear();
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.userId);
      
      console.log("Login response:", res.data);
      
      // ✅ IMPORTANT: Store full teacher data
      if (res.data.user) {
        console.log("User from login response:", res.data.user);
        localStorage.setItem("teacher", JSON.stringify(res.data.user));
      }

      // Also fetch full teacher details if not returned in login response
      if (res.data.role === "teacher" && res.data.userId) {
        try {
          const teacherRes = await axios.get(`http://localhost:5000/api/teachers/${res.data.userId}`);
          console.log("Teacher details from API:", teacherRes.data);
          if (teacherRes.data) {
            localStorage.setItem("teacher", JSON.stringify(teacherRes.data));
          }
        } catch (err) {
          console.error("Error fetching teacher details:", err);
        }
      }

      // Verify what was stored
      const storedTeacher = localStorage.getItem("teacher");
      console.log("Stored teacher after login:", storedTeacher);

      setTimeout(() => {
        const rolePaths = {
          admin: "/admin/dashboard",
          teacher: "/teacher/dashboard",
          student: "/student/dashboard"
        };
        navigate(rolePaths[res.data.role] || "/");
      }, 300);

    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of your login JSX remains exactly the same
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "16px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      background: "#f8fafc"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "340px",
        backgroundColor: "#ffffff",
        borderRadius: "18px",
        padding: "32px 28px",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)",
        border: "1px solid rgba(0, 0, 0, 0.05)"
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "80px",
          height: "3px",
          background: "linear-gradient(90deg, #0b3c5d 0%, #328cc1 100%)",
          borderRadius: "0 0 3px 3px"
        }}></div>

        <div style={{
          textAlign: "center",
          marginBottom: "28px",
          position: "relative"
        }}>
          <img 
            src={ljLogo} 
            alt="LJ University Logo" 
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              objectFit: "cover",
              margin: "0 auto 16px",
              border: "2.5px solid #0b3c5d",
              padding: "2px",
              background: "#ffffff",
              boxShadow: "0 6px 16px rgba(11, 60, 93, 0.12)"
            }} 
          />
          
          <h3 style={{
            color: "#0b3c5d",
            margin: "0 0 4px 0",
            fontSize: "20px",
            fontWeight: "700",
            letterSpacing: "-0.3px"
          }}>
            LJ University
          </h3>
          <p style={{
            fontSize: "12px",
            color: "#64748b",
            fontWeight: "500",
            margin: "0 0 2px 0",
            letterSpacing: "0.2px"
          }}>
            Academic Portal
          </p>
          <p style={{
            fontSize: "10px",
            color: "#94a3b8",
            margin: 0,
            fontWeight: "400"
          }}>
            Sarkhej Campus
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            padding: "10px 12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "12px",
            textAlign: "center",
            border: "1px solid #fecaca",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}>
            <span style={{ fontSize: "14px" }}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px", position: "relative" }}>
            <label style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#0b3c5d",
              display: "block",
              marginBottom: "6px",
              paddingLeft: "2px"
            }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                fontSize: "14px"
              }}>📧</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="university@email.com"
                required
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 38px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  fontSize: "13px",
                  color: "#1e293b",
                  transition: "all 0.2s ease",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'Inter', sans-serif"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#0b3c5d";
                  e.target.style.backgroundColor = "#ffffff";
                  e.target.style.boxShadow = "0 0 0 3px rgba(11, 60, 93, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.backgroundColor = "#f8fafc";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "26px", position: "relative" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px"
            }}>
              <label style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#0b3c5d",
                paddingLeft: "2px"
              }}>
                Password
              </label>
              <a 
                href="#" 
                style={{
                  fontSize: "11px",
                  color: "#328cc1",
                  textDecoration: "none",
                  fontWeight: "500",
                  transition: "color 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "#0b3c5d";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "#328cc1";
                }}
              >
               
              </a>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                fontSize: "14px"
              }}>🔒</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 38px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  fontSize: "13px",
                  color: "#1e293b",
                  transition: "all 0.2s ease",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "1.5px"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#0b3c5d";
                  e.target.style.backgroundColor = "#ffffff";
                  e.target.style.boxShadow = "0 0 0 3px rgba(11, 60, 93, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.backgroundColor = "#f8fafc";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px",
              background: "#0b3c5d",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              opacity: isLoading ? 0.7 : 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 6px 16px rgba(11, 60, 93, 0.2)"
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = "#0a2e4a";
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 8px 20px rgba(11, 60, 93, 0.25)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = "#0b3c5d";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 6px 16px rgba(11, 60, 93, 0.2)";
              }
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderRadius: "50%",
                  borderTopColor: "#ffffff",
                  animation: "spin 1s linear infinite"
                }}></div>
                Signing In...
              </>
            ) : (
              "Sign In to Portal"
            )}
          </button>
        </form>

        <div style={{
          textAlign: "center",
          marginTop: "28px",
          fontSize: "10px",
          color: "#94a3b8",
          borderTop: "1px solid #f1f5f9",
          paddingTop: "20px"
        }}>
          <p style={{ margin: "0 0 6px 0" }}>
            Secure Access Portal
          </p>
          <p style={{ margin: 0 }}>
            © 2026 LJ University
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 400px) {
          div[style*="maxWidth: 340px"] {
            padding: 28px 24px;
            margin: 12px;
            max-width: calc(100% - 24px);
          }
        }
      `}</style>
    </div>
  );
};

export default Login;