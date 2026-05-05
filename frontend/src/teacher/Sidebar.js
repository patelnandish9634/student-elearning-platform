import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiBookOpen,
  FiLayers,
  FiFileText,
  FiClipboard,
  FiHelpCircle,
  FiUsers,
  FiBell,
  FiUser,
  FiLogOut,
  FiBarChart2,
  FiSettings,
  FiCalendar,
  FiCheckSquare
} from "react-icons/fi";
import logo from "../assets/lj.jpg";

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/teacher/dashboard", icon: <FiHome /> },
    { name: "My Subjects", path: "/teacher/subjects", icon: <FiBookOpen /> },
    { name: "Units", path: "/teacher/units", icon: <FiLayers /> },
    { name: "Content", path: "/teacher/content", icon: <FiFileText /> },
    { name: "Assignments", path: "/teacher/assignments", icon: <FiClipboard /> },
    { name: "Quizzes", path: "/teacher/quizzes", icon: <FiHelpCircle /> },
    { name: "Check Assignment", path: "/teacher/check-assignment", icon: <FiCheckSquare /> },
    { name: "Schedule", path: "/teacher/schedule", icon: <FiCalendar /> },
    { name: "Students", path: "/teacher/students", icon: <FiUsers /> },
    { name: "Profile", path: "/teacher/profile", icon: <FiUser /> },
  ];

  // Original styles - unchanged
  const sidebarStyles = {
    container: {
      width: "280px",
      height: "100vh",
      background: "linear-gradient(180deg, #0B2A4A 0%, #1A3F5C 100%)",
      color: "#fff",
      padding: "24px 16px",
      position: "fixed",
      top: 0,
      left: 0,
      boxShadow: "4px 0 20px rgba(0, 0, 0, 0.08)",
      overflowY: "auto",
      zIndex: 1000,
      fontFamily: "'Inter', sans-serif"
    },
    logoContainer: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "40px",
      padding: "0 12px"
    },
    logo: {
      width: "50px",
      height: "50px",
      borderRadius: "12px",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
      fontWeight: "bold",
      color: "#0B2A4A",
      overflow: "hidden"
    },
    logoImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "12px"
    },
    universityName: {
      fontSize: "18px",
      fontWeight: "600",
      lineHeight: "1.3"
    },
    subText: {
      fontSize: "12px",
      opacity: "0.8",
      fontWeight: "400"
    },
    menuContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    menuItem: (isActive) => ({
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      textDecoration: "none",
      color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
      background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
      borderRadius: "12px",
      transition: "all 0.3s ease",
      borderLeft: isActive ? "4px solid #FFB800" : "4px solid transparent",
      fontWeight: isActive ? "500" : "400",
      fontSize: "15px",
      backdropFilter: isActive ? "blur(10px)" : "none",
      cursor: "pointer"
    }),
    logoutContainer: {
      marginTop: "40px",
      paddingTop: "20px",
      borderTop: "1px solid rgba(255,255,255,0.1)"
    },
    logoutButton: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      color: "rgba(255,255,255,0.7)",
      textDecoration: "none",
      borderRadius: "12px",
      transition: "all 0.3s ease",
      fontSize: "15px",
      cursor: "pointer"
    }
  };

  return (
    <div style={sidebarStyles.container}>
      {/* Logo Section - Updated with image */}
      <div style={sidebarStyles.logoContainer}>
        <div style={sidebarStyles.logo}>
          <img src={logo} alt="LJ University" style={sidebarStyles.logoImage} />
        </div>
        <div style={sidebarStyles.universityName}>
          LJ University
          <div style={sidebarStyles.subText}>Faculty Portal</div>
        </div>
      </div>

      {/* Menu Items */}
      <div style={sidebarStyles.menuContainer}>
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            style={sidebarStyles.menuItem(location.pathname === item.path)}
            onMouseEnter={(e) => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span style={{ fontSize: "20px" }}>{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </div>

      {/* Logout Button */}
      <div style={sidebarStyles.logoutContainer}>
        <Link
          to="/"
          style={sidebarStyles.logoutButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <FiLogOut size={20} />
          Logout
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;