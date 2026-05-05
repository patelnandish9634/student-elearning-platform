import React, { useState } from "react";
import {
  FiBell,
  FiSearch,
  FiChevronDown,
  FiUser,
  FiSettings,
  FiMessageSquare,
  FiLogOut,
  FiSun,
  FiMoon,
  FiBookOpen,
  FiClipboard,
  FiHelpCircle,
  FiBarChart2,
  FiAward,
  FiGrid,
  FiList,
  FiMenu,
  FiCheckCircle,
  FiTerminal,
  FiVideo
} from "react-icons/fi";
import { MdDashboard, MdAssignment, MdAnalytics } from "react-icons/md";
// REMOVED: MdQuiz import
import ljLogo from "../assets/lj.jpg";

const TopBar = ({ darkMode, setDarkMode, student, activeTab, setActiveTab, onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [toast, setToast] = useState(null);

  // Notifications
  const notifications = [
    { id: 1, title: "New Assignment Posted", message: "DSA Assignment 4 has been posted", time: "1 hour ago", read: false },
    { id: 2, title: "New Course Available", message: "Advanced Web Development course added", time: "3 hours ago", read: false },
    { id: 3, title: "Certificate Generated", message: "Your Python course certificate is ready", time: "1 day ago", read: true }
  ];

  // UPDATED navItems - ADDED Live Classes
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <MdDashboard size={20} /> },
    { id: "courses", label: "My Courses", icon: <FiBookOpen size={18} /> },
    { id: "compiler", label: "Compiler", icon: <FiTerminal size={18} /> },
    { id: "liveclasses", label: "Live Classes", icon: <FiVideo size={18} /> },
    { id: "assignments", label: "Assignments", icon: <MdAssignment size={20} /> },
    { id: "certificates", label: "Certificates", icon: <FiAward size={18} /> },
    { id: "progress", label: "Progress", icon: <MdAnalytics size={20} /> },
    { id: "profile", label: "Profile", icon: <FiUser size={18} /> }
  ];

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleLogoutClick = () => {
    setShowUserMenu(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    
    setTimeout(() => {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
      showToast("success", "🎉 Logged out successfully! See you soon!");
      
      setTimeout(() => {
        if (onLogout) {
          onLogout();
        }
      }, 1000);
    }, 800);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const styles = {
    topbar: {
      background: darkMode ? "#1E293B" : "white",
      borderBottom: darkMode ? "1px solid #334155" : "1px solid #E2E8F0",
      padding: "0 32px",
      height: "70px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: darkMode 
        ? "0 1px 3px rgba(0,0,0,0.3)" 
        : "0 4px 20px rgba(0, 0, 0, 0.05)",
      backdropFilter: "blur(10px)",
      "@media (max-width: 768px)": {
        padding: "0 16px"
      }
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      cursor: "pointer"
    },
    logoImage: {
      width: "45px",
      height: "45px",
      borderRadius: "12px",
      objectFit: "cover",
      border: darkMode ? "2px solid #334155" : "2px solid #E2E8F0",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    },
    logoText: {
      display: "flex",
      flexDirection: "column",
      "@media (max-width: 768px)": {
        display: "none"
      }
    },
    logoMain: {
      fontSize: "18px",
      fontWeight: "700",
      background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      letterSpacing: "-0.3px"
    },
    logSub: {
      fontSize: "10px",
      color: darkMode ? "#94A3B8" : "#64748B",
      marginTop: "2px"
    },
    mobileMenuBtn: {
      display: "none",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: darkMode ? "white" : "#0F172A",
      "@media (max-width: 768px)": {
        display: "flex"
      }
    },
    searchBox: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "8px 18px",
      background: darkMode ? "#334155" : "#F8FAFC",
      borderRadius: "40px",
      width: "360px",
      transition: "all 0.3s ease",
      border: darkMode ? "1px solid #475569" : "1px solid #E2E8F0",
      ":focus-within": {
        background: darkMode ? "#475569" : "white",
        boxShadow: "0 0 0 3px rgba(59,130,246,0.1)",
        borderColor: "#3B82F6"
      },
      "@media (max-width: 768px)": {
        width: "200px",
        padding: "6px 12px"
      },
      "@media (max-width: 480px)": {
        display: "none"
      }
    },
    searchInput: {
      border: "none",
      background: "transparent",
      outline: "none",
      width: "100%",
      fontSize: "14px",
      color: darkMode ? "white" : "#0F172A",
      "::placeholder": {
        color: darkMode ? "#94A3B8" : "#94A3B8"
      }
    },
    topbarRight: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      "@media (max-width: 480px)": {
        gap: "8px"
      }
    },
    iconButton: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      background: darkMode ? "#334155" : "#F1F5F9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.3s ease",
      position: "relative",
      ":hover": {
        transform: "translateY(-2px)",
        background: darkMode ? "#475569" : "#E2E8F0"
      },
      "@media (max-width: 480px)": {
        width: "35px",
        height: "35px"
      }
    },
    notificationBadge: {
      position: "absolute",
      top: "-2px",
      right: "-2px",
      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
      color: "white",
      fontSize: "9px",
      fontWeight: "700",
      padding: "2px 6px",
      borderRadius: "20px",
      minWidth: "16px",
      textAlign: "center",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
    },
    userSection: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      cursor: "pointer",
      padding: "6px 12px",
      borderRadius: "40px",
      background: darkMode ? "#334155" : "#F1F5F9",
      position: "relative",
      transition: "all 0.3s ease",
      ":hover": {
        background: darkMode ? "#475569" : "#E2E8F0"
      },
      "@media (max-width: 480px)": {
        padding: "4px 8px"
      }
    },
    userAvatar: {
      width: "36px",
      height: "36px",
      background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "600",
      fontSize: "14px",
      boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
      "@media (max-width: 480px)": {
        width: "30px",
        height: "30px",
        fontSize: "12px"
      }
    },
    userInfo: {
      "@media (max-width: 480px)": {
        display: "none"
      }
    },
    userName: {
      fontSize: "14px",
      fontWeight: "600",
      color: darkMode ? "white" : "#0F172A",
      lineHeight: "1.3"
    },
    userRole: {
      fontSize: "10px",
      color: darkMode ? "#94A3B8" : "#64748B"
    },
    dropdown: {
      position: "absolute",
      top: "55px",
      right: 0,
      background: darkMode ? "#1E293B" : "white",
      borderRadius: "16px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
      padding: "8px 0",
      minWidth: "240px",
      zIndex: 101,
      border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0",
      animation: "fadeInDown 0.2s ease"
    },
    dropdownItem: {
      padding: "10px 18px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      color: darkMode ? "#E2E8F0" : "#475569",
      fontSize: "13px",
      fontWeight: "500",
      ":hover": {
        background: darkMode ? "#334155" : "#F8FAFC",
        paddingLeft: "22px"
      }
    },
    navBar: {
      background: darkMode ? "#1E293B" : "white",
      borderBottom: darkMode ? "1px solid #334155" : "1px solid #E2E8F0",
      padding: "0 32px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      "@media (max-width: 768px)": {
        position: "fixed",
        top: "70px",
        left: 0,
        right: 0,
        flexDirection: "column",
        alignItems: "stretch",
        padding: "16px",
        gap: "4px",
        transform: showMobileMenu ? "translateY(0)" : "translateY(-100%)",
        opacity: showMobileMenu ? 1 : 0,
        visibility: showMobileMenu ? "visible" : "hidden",
        transition: "all 0.3s ease",
        zIndex: 99,
        maxHeight: "calc(100vh - 70px)",
        overflowY: "auto"
      }
    },
    navItem: (isActive) => ({
      padding: "10px 16px",
      cursor: "pointer",
      color: isActive ? "#3B82F6" : (darkMode ? "#94A3B8" : "#64748B"),
      background: isActive ? (darkMode ? "#334155" : "#EFF6FF") : "transparent",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "14px",
      fontWeight: isActive ? "600" : "500",
      transition: "all 0.2s ease",
      ":hover": {
        background: darkMode ? "#334155" : "#F8FAFC",
        color: "#3B82F6",
        transform: "translateX(4px)"
      },
      "@media (min-width: 769px)": {
        borderBottom: isActive ? "2px solid #3B82F6" : "2px solid transparent",
        borderRadius: 0,
        padding: "12px 0",
        margin: "0 12px"
      }
    }),
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      animation: "fadeIn 0.3s ease"
    },
    modalContainer: {
      background: darkMode ? "#1E293B" : "white",
      borderRadius: "28px",
      width: "400px",
      maxWidth: "90%",
      padding: "32px",
      textAlign: "center",
      animation: "slideUp 0.3s ease",
      boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
      border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0"
    },
    modalIcon: {
      width: "70px",
      height: "70px",
      borderRadius: "50%",
      background: "#FEE2E2",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 20px"
    },
    modalTitle: {
      fontSize: "24px",
      fontWeight: "700",
      color: darkMode ? "white" : "#0F172A",
      marginBottom: "12px"
    },
    modalMessage: {
      fontSize: "14px",
      color: darkMode ? "#94A3B8" : "#64748B",
      marginBottom: "28px",
      lineHeight: "1.6"
    },
    modalButtons: {
      display: "flex",
      gap: "12px",
      justifyContent: "center"
    },
    cancelBtn: {
      padding: "12px 24px",
      borderRadius: "14px",
      border: `1.5px solid ${darkMode ? "#475569" : "#E2E8F0"}`,
      background: "transparent",
      color: darkMode ? "white" : "#64748B",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease"
    },
    confirmBtn: {
      padding: "12px 28px",
      borderRadius: "14px",
      border: "none",
      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
      color: "white",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.3s ease",
      position: "relative",
      overflow: "hidden"
    },
    toast: {
      position: "fixed",
      bottom: "30px",
      right: "30px",
      background: "#10B981",
      color: "white",
      padding: "14px 24px",
      borderRadius: "16px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
      zIndex: 1001,
      animation: "slideInRight 0.3s ease",
      fontSize: "14px",
      fontWeight: "500"
    },
    spinner: {
      width: "16px",
      height: "16px",
      border: "2px solid rgba(255,255,255,0.3)",
      borderTop: "2px solid white",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div style={styles.toast}>
          <FiCheckCircle size={20} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={styles.modalOverlay} onClick={cancelLogout}>
          <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}>
              <FiLogOut size={32} color="#DC2626" />
            </div>
            <div style={styles.modalTitle}>Ready to Leave?</div>
            <div style={styles.modalMessage}>
              Are you sure you want to logout? You'll need to login again to access your account.
            </div>
            <div style={styles.modalButtons}>
              <button style={styles.cancelBtn} onClick={cancelLogout}>
                Cancel
              </button>
              <button 
                style={styles.confirmBtn} 
                onClick={confirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <div style={styles.spinner} />
                    Logging out...
                  </>
                ) : (
                  <>
                    <FiLogOut size={16} />
                    Yes, Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div style={styles.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            style={styles.mobileMenuBtn}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <FiMenu size={22} />
          </button>
          
          <div style={styles.logo}>
            <img src={ljLogo} alt="LJ University" style={styles.logoImage} />
            <div style={styles.logoText}>
              <div style={styles.logoMain}>LJ University</div>
              <div style={styles.logoSub}>Student Portal</div>
            </div>
          </div>
        </div>

        <div style={styles.searchBox}>
          <FiSearch size={18} color={darkMode ? "#94A3B8" : "#64748B"} />
          <input
            style={styles.searchInput}
            placeholder="Search courses, assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={styles.topbarRight}>
          
          
          
          
          {showNotifications && (
            <div style={styles.dropdown}>
              <div style={{ 
                padding: "12px 18px", 
                fontWeight: "700", 
                borderBottom: darkMode ? "1px solid #334155" : "1px solid #E2E8F0",
                fontSize: "14px",
                color: darkMode ? "white" : "#0F172A"
              }}>
                Notifications
              </div>
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  style={{ 
                    ...styles.dropdownItem, 
                    opacity: notif.read ? 0.6 : 1,
                    background: !notif.read && (darkMode ? "#33415520" : "#EFF6FF")
                  }}
                >
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: notif.read ? "#94A3B8" : "#3B82F6",
                    marginRight: "4px"
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600" }}>{notif.title}</div>
                    <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>{notif.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.userSection} onClick={() => setShowUserMenu(!showUserMenu)}>
            <div style={styles.userAvatar}>{student.avatar || student.name?.charAt(0) || "S"}</div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{student.name?.split(" ")[0] || "Student"}</div>
              <div style={styles.userRole}>Student</div>
            </div>
            <FiChevronDown size={14} color={darkMode ? "#94A3B8" : "#64748B"} />
          </div>
          
          {showUserMenu && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownItem}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white"
                }}>
                  {student.avatar || student.name?.charAt(0) || "S"}
                </div>
                <div>
                  <div style={{ fontWeight: "600", color: darkMode ? "white" : "#0F172A" }}>
                    {student.name || "Student"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94A3B8" }}>{student.email || "student@ljuniversity.edu"}</div>
                </div>
              </div>
              <div style={{ borderTop: darkMode ? "1px solid #334155" : "1px solid #E2E8F0", margin: "6px 0" }} />
              <div style={styles.dropdownItem} onClick={() => { setActiveTab("profile"); setShowUserMenu(false); }}><FiUser size={14} /> My Profile</div>
              <div style={styles.dropdownItem}><FiSettings size={14} /> Settings</div>
              <div style={styles.dropdownItem}><FiMessageSquare size={14} /> Help Center</div>
              <div style={{ borderTop: darkMode ? "1px solid #334155" : "1px solid #E2E8F0", margin: "6px 0" }} />
              <div style={{ ...styles.dropdownItem, color: "#EF4444" }} onClick={handleLogoutClick}>
                <FiLogOut size={14} /> Logout
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <div style={styles.navBar}>
        {navItems.map(item => (
          <div
            key={item.id}
            style={styles.navItem(activeTab === item.id)}
            onClick={() => {
              setActiveTab(item.id);
              setShowMobileMenu(false);
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        button:active {
          transform: scale(0.98);
        }
      `}</style>
    </>
  );
};

export default TopBar;