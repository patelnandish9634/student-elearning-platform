import React, { useState, useEffect } from "react";
import {
  FiUsers,
  FiUserCheck,
  FiBookOpen,
  FiCheckSquare,
  FiRefreshCw,
  FiAlertCircle,
  FiTrendingUp,
  FiAward,
  FiClock,
  FiActivity,
  FiFileText,
  FiBriefcase,
  FiMapPin,
  FiStar,
  FiBarChart2
} from "react-icons/fi";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/dashboard-stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setDashboardData(response.data.stats);
        console.log("Dashboard data loaded:", response.data.stats);
      } else {
        setError(response.data.message || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const refreshData = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  const statCard = (title, value, icon, bgColor, subText = null, subValue = null) => (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
        transition: "all 0.3s ease",
        cursor: "pointer",
        border: "1px solid #f1f5f9"
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
          {title}
        </p>
        <h2 style={{ margin: "6px 0 0", fontSize: "28px", fontWeight: "700" }}>{value}</h2>
        {subText && (
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: subValue === "Active" ? "#10B981" : "#64748B" }}>
            {subText}: {subValue}
          </p>
        )}
      </div>
      <div
        style={{
          width: "44px",
          height: "44px",
          background: bgColor,
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: "20px",
        }}
      >
        {icon}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <FiAlertCircle size={48} color="#EF4444" />
        <h3>Unable to Load Dashboard</h3>
        <p>{error}</p>
        <button style={styles.retryBtn} onClick={refreshData}>Try Again</button>
      </div>
    );
  }

  const data = dashboardData || {
    students: { total: 0, active: 0, inactive: 0 },
    teachers: { total: 0, active: 0, inactive: 0 },
    subjects: { total: 0, active: 0, inactive: 0 },
    courses: { total: 0, active: 0, inactive: 0 },
    departments: { total: 0, active: 0, inactive: 0 },
    pendingApprovals: { total: 0, assignments: 0, approved: 0, rejected: 0 },
    enrollments: 0,
    departmentOverview: [],
    recentActivities: []
  };

  return (
    <div style={{ padding: "28px" }}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={{ marginBottom: "4px", marginTop: "-10px", fontSize: "28px", fontWeight: "700" }}>Dashboard</h1>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>
            Welcome back, Admin
          </p>
        </div>
        <button style={styles.refreshBtn} onClick={refreshData} disabled={refreshing}>
          <FiRefreshCw size={16} className={refreshing ? "spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Row 1 - Main Stats */}
      <div style={styles.statsGrid}>
        {statCard("Total Students", data.students.total || 0, <FiUsers />, "#3b82f6", "Active", data.students.active || 0)}
        {statCard("Total Teachers", data.teachers.total || 0, <FiUserCheck />, "#22c55e", "Active", data.teachers.active || 0)}
        {statCard("Total Subjects", data.subjects.total || 0, <FiBookOpen />, "#a855f7", "Active", data.subjects.active || 0)}
        {statCard("Pending Approvals", data.pendingApprovals?.total || 0, <FiCheckSquare />, "#f97316", "Awaiting Review")}
      </div>

      {/* Stats Row 2 - Additional Stats */}
      <div style={styles.statsGrid2}>
        {statCard("Total Courses", data.courses.total || 0, <FiBriefcase />, "#6366F1", "Active", data.courses.active || 0)}
        {statCard("Total Departments", data.departments.total || 0, <FiMapPin />, "#F59E0B", "Active", data.departments.active || 0)}
        {statCard("Total Enrollments", data.enrollments || 0, <FiTrendingUp />, "#EC4899")}
        {statCard("Approved Assignments", data.pendingApprovals?.approved || 0, <FiAward />, "#10B981")}
      </div>

      {/* Bottom Section - Department Overview & Recent Activities */}
      <div style={styles.bottomGrid}>
        {/* Department Overview */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <FiBarChart2 size={18} /> Department Overview
          </h3>
          {data.departmentOverview && data.departmentOverview.length > 0 ? (
            data.departmentOverview.map((dept) => (
              <div key={dept.id} style={styles.deptItem}>
                <div style={styles.deptInfo}>
                  <div>
                    <strong style={styles.deptName}>{dept.name}</strong>
                    <p style={styles.deptMeta}>
                      {dept.students} Students • {dept.courses} Courses • {dept.subjects} Subjects
                    </p>
                  </div>
                  <span style={{ ...styles.deptBadge, background: dept.status === "active" ? "#dcfce7" : "#fee2e2", color: dept.status === "active" ? "#16a34a" : "#dc2626" }}>
                    {dept.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
                <div style={styles.deptHead}>
                  <FiUserCheck size={12} /> Head: {dept.head || "Not Assigned"}
                </div>
                <div style={styles.deptCode}>
                  <FiStar size={12} /> Code: {dept.code || "N/A"}
                </div>
              </div>
            ))
          ) : (
            <div style={styles.noDataMessage}>No departments found</div>
          )}
        </div>

        {/* Recent Activities */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <FiActivity size={18} /> Recent Activities
          </h3>
          {data.recentActivities && data.recentActivities.length > 0 ? (
            data.recentActivities.map((activity, idx) => (
              <div key={idx}>
                <div style={styles.activityItem}>
                  <div style={styles.activityIcon}>{activity.icon || "📌"}</div>
                  <div style={styles.activityContent}>
                    <strong style={styles.activityTitle}>{activity.title}</strong>
                    <p style={styles.activityDesc}>{activity.description}</p>
                    <span style={styles.activityTime}>{activity.time}</span>
                  </div>
                </div>
                {idx < data.recentActivities.length - 1 && <hr style={styles.divider} />}
              </div>
            ))
          ) : (
            <div style={styles.noDataMessage}>No recent activities</div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
};

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px"
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    background: "white",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s ease"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "16px"
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "3px solid #E2E8F0",
    borderTopColor: "#3B82F6",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    textAlign: "center",
    gap: "16px"
  },
  retryBtn: {
    padding: "10px 24px",
    background: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
    marginBottom: "20px"
  },
  statsGrid2: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
    marginBottom: "24px"
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "22px"
  },
  card: {
    background: "#fff",
    padding: "22px",
    borderRadius: "14px",
    border: "1px solid #f1f5f9"
  },
  sectionTitle: {
    marginBottom: "16px",
    fontSize: "16px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#0F172A"
  },
  deptItem: {
    background: "#f8fafc",
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "12px",
    border: "1px solid #e2e8f0"
  },
  deptInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    flexWrap: "wrap",
    gap: "8px"
  },
  deptName: {
    fontSize: "14px",
    fontWeight: "600"
  },
  deptMeta: {
    margin: "4px 0 0",
    fontSize: "11px",
    color: "#64748b"
  },
  deptBadge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500"
  },
  deptHead: {
    fontSize: "11px",
    color: "#64748B",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "6px"
  },
  deptCode: {
    fontSize: "11px",
    color: "#64748B",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "4px"
  },
  activityItem: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px"
  },
  activityIcon: {
    fontSize: "20px"
  },
  activityContent: {
    flex: 1
  },
  activityTitle: {
    fontSize: "14px",
    color: "#0F172A"
  },
  activityDesc: {
    margin: "2px 0",
    color: "#64748b",
    fontSize: "12px"
  },
  activityTime: {
    fontSize: "11px",
    color: "#94a3b8"
  },
  divider: {
    border: "none",
    borderTop: "1px solid #f1f5f9",
    margin: "12px 0"
  },
  noDataMessage: {
    textAlign: "center",
    padding: "40px",
    color: "#94A3B8"
  }
};

export default Dashboard;