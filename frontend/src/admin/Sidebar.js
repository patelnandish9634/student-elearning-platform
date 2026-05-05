import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/lj.jpg";

import {
  FiGrid,
  FiLayers,
  FiBook,
  FiCalendar,
  FiPackage,
  FiUsers,
  FiUserCheck,
  FiLogOut,
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiShield,
  FiAward
} from "react-icons/fi";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [logoutHover, setLogoutHover] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [animateModal, setAnimateModal] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

  const menuItem = (path) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: location.pathname === path ? "#ffffff" : "#334155",
    background: location.pathname === path ? "#2563eb" : "transparent",
    boxShadow:
      location.pathname === path
        ? "0 8px 20px rgba(37,99,235,0.25)"
        : "none",
    transition: "all 0.25s ease",
  });

  const iconStyle = { fontSize: "18px", transition: "transform 0.25s ease" };

  const handleLogout = () => {
    setAnimateModal(false);

    setTimeout(() => {
      setShowLogoutModal(false);
      setShowLogoutSuccess(true);

      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        navigate("/");
      }, 1800);
    }, 200);
  };

  return (
    <>
      {/* SIDEBAR */}
      <aside
        style={{
          width: "260px",
          background: "#ffffff",
          padding: "22px 22px 0 22px",
          borderRight: "1px solid #f1f5f9",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* LOGO */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "34px" }}>
          <img
            src={logo}
            alt="LJ University"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "10px",
              objectFit: "cover",
            }}
          />
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
              LJ Admin
            </h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
              University Portal
            </p>
          </div>
        </div>

        {/* MENU */}
        <ul style={{ 
          listStyle: "none", 
          padding: 0, 
          flex: 1,
          overflowY: "auto",
          marginBottom: "10px"
        }}>
          {/* DIVIDER */}
          <div
            style={{
              height: "1px",
              background: "#e5e7eb",
              boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
              margin: "0 0 20px 0",
            }}
          />

          <li
            style={menuItem("/admin/dashboard")}
            onClick={() => navigate("/admin/dashboard")}
          >
            <FiGrid style={iconStyle} /> Dashboard
          </li>

          <li
            style={menuItem("/admin/departments")}
            onClick={() => navigate("/admin/departments")}
          >
            <FiLayers style={iconStyle} /> Departments
          </li>

          <li
            style={menuItem("/admin/courses")}
            onClick={() => navigate("/admin/courses")}
          >
            <FiBook style={iconStyle} /> Courses
          </li>

          <li
            style={menuItem("/admin/semesters")}
            onClick={() => navigate("/admin/semesters")}
          >
            <FiCalendar style={iconStyle} /> Semesters
          </li>

          <li
            style={menuItem("/admin/batches")}
            onClick={() => navigate("/admin/batches")}
          >
            <FiPackage style={iconStyle} /> Batches
          </li>

          {/* SUBJECTS */}
          <li
            style={menuItem("/admin/subjects")}
            onClick={() => navigate("/admin/subjects")}
          >
            <FiFileText style={iconStyle} /> Subjects
          </li>

          {/* VERIFY CONTENT */}
          <li
            style={menuItem("/admin/verify-content")}
            onClick={() => navigate("/admin/verify-content")}
          >
            <FiShield style={iconStyle} /> Verify Content
          </li>

        
          <li
            style={menuItem("/admin/students")}
            onClick={() => navigate("/admin/students")}
          >
            <FiUsers style={iconStyle} /> Students
          </li>

          <li
            style={menuItem("/admin/teachers")}
            onClick={() => navigate("/admin/teachers")}
          >
            <FiUserCheck style={iconStyle} /> Teachers
          </li>
        </ul>

        {/* LOGOUT - Fixed at bottom */}
        <div style={{ 
          padding: "10px 0 20px 0",
          borderTop: "1px solid #e5e7eb",
          marginTop: "auto"
        }}>
          <li
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
            onClick={() => {
              setShowLogoutModal(true);
              setTimeout(() => setAnimateModal(true), 10);
            }}
            style={{
              listStyle: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              color: logoutHover ? "#dc2626" : "#ef4444",
              background: logoutHover ? "#fee2e2" : "#fff1f2",
              transition: "all 0.25s ease",
            }}
          >
            <FiLogOut style={{ fontSize: "18px" }} />
            Logout
          </li>
        </div>
      </aside>

      {/* CONFIRM LOGOUT MODAL */}
      {showLogoutModal && (
        <div
          onClick={() => {
            setAnimateModal(false);
            setTimeout(() => setShowLogoutModal(false), 200);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            opacity: animateModal ? 1 : 0,
            transition: "opacity 0.25s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "380px",
              background: "#fff",
              borderRadius: "16px",
              padding: "26px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              transform: animateModal ? "scale(1)" : "scale(0.9)",
              opacity: animateModal ? 1 : 0,
              transition: "all 0.25s ease",
              textAlign: "center",
            }}
          >
            <FiAlertTriangle size={38} color="#dc2626" />
            <h3 style={{ marginTop: "14px" }}>Confirm Logout</h3>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              You will be signed out of the admin panel.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "14px",
                marginTop: "26px",
              }}
            >
              <button
                onClick={() => {
                  setAnimateModal(false);
                  setTimeout(() => setShowLogoutModal(false), 200);
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT SUCCESS TOAST */}
      {showLogoutSuccess && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            background: "#16a34a",
            color: "#fff",
            padding: "14px 18px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 15px 30px rgba(0,0,0,0.25)",
            animation: "slideUp 0.4s ease",
            zIndex: 2000,
          }}
        >
          <FiCheckCircle size={22} />
          Logged out successfully
        </div>
      )}

      <style>
        {`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        aside li:hover {
          background: #f1f5f9;
          transform: translateX(6px);
          box-shadow: 0 6px 14px rgba(0,0,0,0.08);
        }

        aside li:hover svg {
          transform: scale(1.15);
        }

        aside li svg {
          transition: transform 0.25s ease;
        }

        aside li {
          transition: all 0.25s ease;
        }

        ul::-webkit-scrollbar {
          width: 4px;
        }

        ul::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        ul::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 4px;
        }

        ul::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        `}
      </style>
    </>
  );
};

export default Sidebar;