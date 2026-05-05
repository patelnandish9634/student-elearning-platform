import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const getAuthToken = () => localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");

  const fetchNotifications = async () => {
    console.log("=== FETCHING NOTIFICATIONS ===");
    console.log("userId:", userId);
    console.log("userRole:", userRole);
    
    // Check if user is teacher (case insensitive)
    const isTeacher = userRole && userRole.toLowerCase() === 'teacher';
    
    if (!userId || !isTeacher) {
      console.log("Not fetching notifications - not a teacher or no userId");
      return;
    }
    
    try {
      const token = getAuthToken();
      console.log(`Fetching from: http://localhost:5000/api/notifications/${userId}`);
      
      const response = await axios.get(
        `http://localhost:5000/api/notifications/${userId}`,
        { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        }
      );
      
      console.log("Notifications API Response:", response.data);
      console.log("Number of notifications:", response.data.length);
      
      setNotifications(response.data);
      const newUnreadCount = response.data.filter(n => !n.isRead).length;
      setUnreadCount(newUnreadCount);
      console.log("Unread count:", newUnreadCount);
      
    } catch (error) {
      console.error("Error fetching notifications:", error);
      console.error("Error response:", error.response?.data);
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
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = getAuthToken();
      await axios.put(
        `http://localhost:5000/api/notifications/mark-all-read/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  useEffect(() => {
    console.log("NotificationProvider mounted - fetching notifications");
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId, userRole]);

  const value = {
    notifications,
    unreadCount,
    showDropdown,
    setShowDropdown,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};