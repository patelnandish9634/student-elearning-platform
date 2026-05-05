import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { 
  FiBell, 
  FiSearch, 
  FiChevronDown, 
  FiCheckCircle, 
  FiXCircle, 
  FiInfo,
  FiTrash2,
  FiCheck
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Topbar = () => {
  const [teacher, setTeacher] = useState({
    name: "",
    photo: "",
    email: "",
    department: ""
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef(null);

  const getAuthToken = () => localStorage.getItem("token");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchTeacherProfile(userId);
      fetchNotifications(userId);
      
      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications(userId);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, []);

  // Handle click outside to close notification panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTeacherProfile = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/teachers/profile/${userId}`);
      setTeacher(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchNotifications = async (teacherId) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(
        `http://localhost:5000/api/notifications/teacher/${teacherId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = getAuthToken();
      await axios.put(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const teacherId = localStorage.getItem("userId");
      const token = getAuthToken();
      await axios.put(
        `http://localhost:5000/api/notifications/teacher/${teacherId}/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = getAuthToken();
      await axios.delete(
        `http://localhost:5000/api/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'approval':
        return <FiCheckCircle size={18} color="#059669" />;
      case 'rejection':
        return <FiXCircle size={18} color="#DC2626" />;
      default:
        return <FiInfo size={18} color="#0B2A4A" />;
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  };

  const topbarStyles = {
    container: {
      height: "80px",
      background: "#ffffff",
      borderBottom: "1px solid #E5E9F0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 32px",
      marginLeft: "280px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      fontFamily: "'Inter', sans-serif"
    },
    leftSection: {
      display: "flex",
      alignItems: "center",
      gap: "40px"
    },
    pageTitle: {
      fontSize: "24px",
      fontWeight: "600",
      color: "#0B2A4A",
      margin: 0
    },
    searchBox: {
      display: "flex",
      alignItems: "center",
      background: "#F8FAFC",
      padding: "8px 16px",
      borderRadius: "12px",
      gap: "12px",
      width: "300px"
    },
    searchInput: {
      border: "none",
      background: "transparent",
      outline: "none",
      fontSize: "14px",
      width: "100%",
      color: "#1E293B",
      fontFamily: "'Inter', sans-serif"
    },
    rightSection: {
      display: "flex",
      alignItems: "center",
      gap: "24px"
    },
    notificationContainer: {
      position: "relative"
    },
    notificationIcon: {
      position: "relative",
      cursor: "pointer",
      padding: "8px",
      borderRadius: "10px",
      transition: "background 0.2s ease",
      background: showNotifications ? "#F8FAFC" : "transparent"
    },
    notificationBadge: {
      position: "absolute",
      top: "0px",
      right: "0px",
      background: "#EF4444",
      color: "white",
      borderRadius: "50%",
      width: "18px",
      height: "18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "10px",
      fontWeight: "600"
    },
    notificationDropdown: {
      position: "absolute",
      top: "50px",
      right: "0",
      width: "380px",
      maxHeight: "480px",
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)",
      zIndex: 1000,
      overflow: "hidden",
      border: "1px solid #E5E9F0"
    },
    notificationHeader: {
      padding: "16px 20px",
      borderBottom: "1px solid #E5E9F0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    notificationTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#0B2A4A"
    },
    markAllReadBtn: {
      fontSize: "12px",
      color: "#0B2A4A",
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "4px 8px",
      borderRadius: "6px",
      transition: "background 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    notificationList: {
      maxHeight: "400px",
      overflowY: "auto"
    },
    notificationItem: (isRead) => ({
      padding: "14px 20px",
      borderBottom: "1px solid #F1F5F9",
      cursor: "pointer",
      transition: "background 0.2s ease",
      background: isRead ? "white" : "#F0F9FF",
      position: "relative"
    }),
    notificationItemContent: {
      display: "flex",
      gap: "12px"
    },
    notificationIconWrapper: {
      flexShrink: 0
    },
    notificationTextWrapper: {
      flex: 1
    },
    notificationTitleText: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#0B2A4A",
      marginBottom: "4px"
    },
    notificationMessage: {
      fontSize: "13px",
      color: "#475569",
      marginBottom: "6px",
      lineHeight: "1.4"
    },
    notificationTime: {
      fontSize: "11px",
      color: "#94A3B8"
    },
    deleteBtn: {
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "6px",
      borderRadius: "6px",
      opacity: 0,
      transition: "opacity 0.2s ease"
    },
    emptyState: {
      padding: "40px",
      textAlign: "center",
      color: "#94A3B8"
    },
    profileSection: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      cursor: "pointer",
      padding: "4px 8px",
      borderRadius: "50px",
      background: showProfileMenu ? "#F8FAFC" : "transparent",
      transition: "all 0.3s ease"
    },
    profileImage: {
      width: "45px",
      height: "45px",
      borderRadius: "50%",
      objectFit: "cover",
      border: "2px solid #0B2A4A"
    },
    profileInitials: {
      width: "45px",
      height: "45px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #0B2A4A 0%, #1A3F5C 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "600",
      fontSize: "18px",
      border: "2px solid #FFB800"
    },
    profileInfo: {
      display: "flex",
      flexDirection: "column"
    },
    profileName: {
      fontWeight: "600",
      color: "#0B2A4A",
      fontSize: "15px"
    },
    profileRole: {
      fontSize: "12px",
      color: "#64748B"
    }
  };

  return (
    <div style={topbarStyles.container}>
      <ToastContainer position="top-right" theme="colored" />
      
      <div style={topbarStyles.leftSection}>
        <h1 style={topbarStyles.pageTitle}>Dashboard</h1>
        
        <div style={topbarStyles.searchBox}>
          <FiSearch color="#94A3B8" size={18} />
          <input 
            style={topbarStyles.searchInput}
            placeholder="Search courses, students..."
          />
        </div>
      </div>

      <div style={topbarStyles.rightSection}>
        {/* Notifications */}
        <div style={topbarStyles.notificationContainer} ref={notificationRef}>
          <div 
            style={topbarStyles.notificationIcon}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FiBell size={22} color="#475569" />
            {unreadCount > 0 && (
              <span style={topbarStyles.notificationBadge}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>

          {showNotifications && (
            <div style={topbarStyles.notificationDropdown}>
              <div style={topbarStyles.notificationHeader}>
                <span style={topbarStyles.notificationTitle}>
                  Notifications
                  {unreadCount > 0 && (
                    <span style={{ 
                      marginLeft: "8px", 
                      fontSize: "11px", 
                      color: "#EF4444",
                      fontWeight: "normal"
                    }}>
                      ({unreadCount} unread)
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button 
                    style={topbarStyles.markAllReadBtn}
                    onClick={markAllAsRead}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#F1F5F9"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    <FiCheck size={12} />
                    Mark all read
                  </button>
                )}
              </div>
              
              <div style={topbarStyles.notificationList}>
                {notifications.length === 0 ? (
                  <div style={topbarStyles.emptyState}>
                    <FiBell size={32} color="#CBD5E1" />
                    <p style={{ marginTop: "12px", fontSize: "14px" }}>
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      style={topbarStyles.notificationItem(notification.isRead)}
                      onMouseEnter={(e) => {
                        const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                        if (deleteBtn) deleteBtn.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        const deleteBtn = e.currentTarget.querySelector('.delete-btn');
                        if (deleteBtn) deleteBtn.style.opacity = '0';
                      }}
                    >
                      <div style={topbarStyles.notificationItemContent}>
                        <div style={topbarStyles.notificationIconWrapper}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div style={topbarStyles.notificationTextWrapper}>
                          <div style={topbarStyles.notificationTitleText}>
                            {notification.title}
                          </div>
                          <div style={topbarStyles.notificationMessage}>
                            {notification.message}
                          </div>
                          <div style={topbarStyles.notificationTime}>
                            {getTimeAgo(notification.createdAt)}
                          </div>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <button
                          className="delete-btn"
                          style={topbarStyles.deleteBtn}
                          onClick={() => markAsRead(notification._id)}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#E2E8F0"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                          title="Mark as read"
                        >
                          <FiCheck size={14} color="#059669" />
                        </button>
                      )}
                      <button
                        className="delete-btn"
                        style={{ ...topbarStyles.deleteBtn, right: "40px" }}
                        onClick={() => deleteNotification(notification._id)}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#FEE2E2"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        title="Delete"
                      >
                        <FiTrash2 size={14} color="#DC2626" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div 
          style={topbarStyles.profileSection}
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          {teacher.photo ? (
            <img
              src={`http://localhost:5000/uploads/teachers/${teacher.photo}`}
              alt="teacher"
              style={topbarStyles.profileImage}
            />
          ) : (
            <div style={topbarStyles.profileInitials}>
              {teacher.name ? teacher.name.charAt(0) : "T"}
            </div>
          )}
          
          <div style={topbarStyles.profileInfo}>
            <span style={topbarStyles.profileName}>
              {teacher.name || "Teacher Name"}
            </span>
            <span style={topbarStyles.profileRole}>
              {teacher.department || "Faculty"}
            </span>
          </div>
          <FiChevronDown color="#64748B" size={18} />
        </div>
      </div>
    </div>
  );
};

export default Topbar;