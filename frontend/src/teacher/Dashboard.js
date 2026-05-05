// teacher/Dashboard.js
import React, { useState, useEffect } from "react";
import {
  FiBookOpen,
  FiUsers,
  FiClipboard,
  FiTrendingUp,
  FiCalendar,
  FiClock,
  FiAward,
  FiVideo,
  FiMessageCircle,
  FiFileText,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiBarChart2,
  FiStar,
  FiActivity,
  FiChevronRight,
  FiDownload,
  FiEye
} from "react-icons/fi";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Dashboard = ({ teacher }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [completeData, setCompleteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Get teacher data
  const getTeacherData = () => {
    if (teacher && teacher._id) {
      return teacher;
    }
    const storedTeacher = localStorage.getItem("teacher");
    if (storedTeacher) {
      return JSON.parse(storedTeacher);
    }
    return null;
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teacherData = getTeacherData();
      
      if (!teacherData || !teacherData._id) {
        setError("Teacher information not found");
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem("token");
      
      // Fetch complete dashboard data
      const response = await axios.get(
        `${API_BASE_URL}/api/progress/teacher/complete-dashboard/${teacherData._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setCompleteData(response.data.data);
        setDashboardData(response.data.data.summary);
        console.log("Complete dashboard data loaded:", response.data.data);
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

  const summary = dashboardData || {
    totalStudents: 0,
    totalSubjects: 0,
    totalAssignments: 0,
    totalQuizzes: 0,
    totalContent: 0,
    pendingTasks: 0,
    overallAverageProgress: 0
  };

  const teacherData = getTeacherData();
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div style={styles.dashboard}>
      {/* Welcome Section */}
      <div style={styles.welcomeSection}>
        <div>
          <h1 style={styles.welcomeTitle}>
            Welcome back, {teacherData?.name?.split(" ")[0] || "Professor"}! 👋
          </h1>
          <p style={styles.welcomeSubtitle}>
            Here's what's happening with your courses today.
          </p>
        </div>
        <div style={styles.dateBadge}>
          <FiCalendar size={18} />
          {currentDate}
          <button onClick={refreshData} disabled={refreshing} style={styles.refreshIcon}>
            <FiRefreshCw size={14} className={refreshing ? "spin" : ""} />
          </button>
        </div>
      </div>

      {/* Teacher Info Banner */}
      <div style={styles.teacherBanner}>
        <div style={styles.teacherInfo}>
          <div style={styles.teacherAvatar}>
            {teacherData?.name?.charAt(0) || "T"}
          </div>
          <div>
            <div style={styles.teacherName}>{teacherData?.name}</div>
            <div style={styles.teacherDetails}>
              {teacherData?.department} • {teacherData?.course} • {completeData?.teacher?.divisions?.join(", ")} Division
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid - 6 cards */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderBottomColor: "#0B2A4A" }}>
          <div style={{ ...styles.statIconBox, background: "#0B2A4A10", color: "#0B2A4A" }}>
            <FiUsers size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{summary.totalStudents}</div>
            <div style={styles.statLabel}>Total Students</div>
            <div style={styles.statTrend}>Enrolled</div>
          </div>
        </div>

        <div style={{ ...styles.statCard, borderBottomColor: "#8B5CF6" }}>
          <div style={{ ...styles.statIconBox, background: "#8B5CF610", color: "#8B5CF6" }}>
            <FiBookOpen size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{summary.totalSubjects}</div>
            <div style={styles.statLabel}>Active Subjects</div>
            <div style={styles.statTrend}>Teaching</div>
          </div>
        </div>

        <div style={{ ...styles.statCard, borderBottomColor: "#D97706" }}>
          <div style={{ ...styles.statIconBox, background: "#D9770610", color: "#D97706" }}>
            <FiClipboard size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{summary.totalAssignments}</div>
            <div style={styles.statLabel}>Assignments</div>
            <div style={styles.statTrend}>Approved</div>
          </div>
        </div>

        <div style={{ ...styles.statCard, borderBottomColor: "#059669" }}>
          <div style={{ ...styles.statIconBox, background: "#05966910", color: "#059669" }}>
            <FiAward size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{summary.totalQuizzes}</div>
            <div style={styles.statLabel}>Quizzes</div>
            <div style={styles.statTrend}>Approved</div>
          </div>
        </div>

        <div style={{ ...styles.statCard, borderBottomColor: "#EC4899" }}>
          <div style={{ ...styles.statIconBox, background: "#EC489910", color: "#EC4899" }}>
            <FiVideo size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{summary.totalContent}</div>
            <div style={styles.statLabel}>Content Items</div>
            <div style={styles.statTrend}>Videos & Files</div>
          </div>
        </div>

        <div style={{ ...styles.statCard, borderBottomColor: "#EF4444" }}>
          <div style={{ ...styles.statIconBox, background: "#EF444410", color: "#EF4444" }}>
            <FiActivity size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{summary.pendingTasks}</div>
            <div style={styles.statLabel}>Pending Tasks</div>
            <div style={styles.statTrend}>To Grade</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button 
          style={{ ...styles.tab, background: activeTab === "overview" ? "#0B2A4A" : "transparent", color: activeTab === "overview" ? "white" : "#64748B" }}
          onClick={() => setActiveTab("overview")}
        >
          <FiBarChart2 size={16} /> Overview
        </button>
        <button 
          style={{ ...styles.tab, background: activeTab === "subjects" ? "#0B2A4A" : "transparent", color: activeTab === "subjects" ? "white" : "#64748B" }}
          onClick={() => setActiveTab("subjects")}
        >
          <FiBookOpen size={16} /> Subjects
        </button>
        <button 
          style={{ ...styles.tab, background: activeTab === "students" ? "#0B2A4A" : "transparent", color: activeTab === "students" ? "white" : "#64748B" }}
          onClick={() => setActiveTab("students")}
        >
          <FiUsers size={16} /> Students
        </button>
        <button 
          style={{ ...styles.tab, background: activeTab === "assignments" ? "#0B2A4A" : "transparent", color: activeTab === "assignments" ? "white" : "#64748B" }}
          onClick={() => setActiveTab("assignments")}
        >
          <FiClipboard size={16} /> Assignments
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && completeData && (
        <>
          {/* Overall Progress */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>
                <FiTrendingUp size={20} /> Overall Progress
              </h3>
            </div>
            <div style={styles.overallProgressContainer}>
              <div style={styles.overallProgressCircle}>
                <div style={styles.overallProgressValue}>{summary.overallAverageProgress || 0}%</div>
                <div style={styles.overallProgressLabel}>Average Progress</div>
              </div>
              <div style={styles.overallStats}>
                <div style={styles.overallStatItem}>
                  <div style={styles.overallStatValue}>{summary.totalSubjects}</div>
                  <div style={styles.overallStatLabel}>Subjects</div>
                </div>
                <div style={styles.overallStatItem}>
                  <div style={styles.overallStatValue}>{summary.totalUnits || 0}</div>
                  <div style={styles.overallStatLabel}>Units</div>
                </div>
                <div style={styles.overallStatItem}>
                  <div style={styles.overallStatValue}>{summary.totalAssignments + summary.totalQuizzes + summary.totalContent}</div>
                  <div style={styles.overallStatLabel}>Total Items</div>
                </div>
              </div>
            </div>
          </div>

          {/* Subject Progress Section */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>
                <FiBarChart2 size={20} /> Subject Progress Overview
              </h3>
            </div>
            {completeData.subjects && completeData.subjects.length > 0 ? (
              completeData.subjects.map((subject, index) => (
                <div key={index} style={styles.progressItem}>
                  <div style={styles.progressHeader}>
                    <div>
                      <span style={styles.subjectName}>{subject.subjectName}</span>
                      <span style={styles.subjectMeta}>
                        {subject.stats.totalStudents} students | {subject.stats.completedStudents} completed | {subject.stats.totalUnits} units
                      </span>
                    </div>
                    <span style={styles.progressPercent}>{subject.stats.averageProgress}%</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={styles.progressFill(subject.stats.averageProgress, "#0B2A4A")} />
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.noDataMessage}>
                <FiBookOpen size={32} style={{ opacity: 0.5 }} />
                <p>No subjects assigned yet</p>
              </div>
            )}
          </div>

          {/* Recent Activity & Upcoming Deadlines */}
          <div style={styles.bottomGrid}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <FiClock size={20} /> Recent Activity
                </h3>
              </div>
              {completeData.recentActivities && completeData.recentActivities.length > 0 ? (
                completeData.recentActivities.map((activity, index) => (
                  <div key={index} style={styles.activityItem}>
                    <div style={styles.activityDot("active")} />
                    <div style={styles.activityContent}>
                      <div style={styles.activityAction}>{activity.action}</div>
                      <div style={styles.activityMeta}>
                        <span>{activity.course}</span>
                        <span>•</span>
                        <span>{activity.student}</span>
                      </div>
                    </div>
                    <div style={styles.activityTime}>{activity.time}</div>
                  </div>
                ))
              ) : (
                <div style={styles.noDataMessage}>
                  <FiActivity size={32} style={{ opacity: 0.5 }} />
                  <p>No recent activities</p>
                </div>
              )}
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <FiFileText size={20} /> Upcoming Deadlines
                </h3>
              </div>
              {completeData.upcomingDeadlines && completeData.upcomingDeadlines.length > 0 ? (
                completeData.upcomingDeadlines.map((deadline, index) => (
                  <div key={index} style={styles.deadlineItem}>
                    <div style={styles.deadlineIcon}>
                      <FiClipboard size={18} />
                    </div>
                    <div style={styles.deadlineContent}>
                      <div style={styles.deadlineTask}>{deadline.title}</div>
                      <div style={styles.deadlineMeta}>
                        {deadline.course} • {deadline.totalMarks} marks
                      </div>
                    </div>
                    <div style={deadline.due === "Today" ? styles.deadlineBadgeUrgent : styles.deadlineBadge}>
                      {deadline.due}
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.noDataMessage}>
                  <FiCheckCircle size={32} style={{ opacity: 0.5 }} />
                  <p>No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Subjects Tab */}
      {activeTab === "subjects" && completeData?.subjects && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <FiBookOpen size={20} /> All Subjects
            </h3>
          </div>
          {completeData.subjects.map((subject, idx) => (
            <div key={idx} style={styles.subjectCard}>
              <div style={styles.subjectCardHeader}>
                <div>
                  <h4 style={styles.subjectCardTitle}>{subject.subjectName}</h4>
                  <p style={styles.subjectCardCode}>{subject.subjectCode}</p>
                </div>
                <div style={styles.subjectCardBadge}>Div {subject.division}</div>
              </div>
              <div style={styles.subjectStats}>
                <div style={styles.subjectStat}>
                  <FiUsers size={14} />
                  <span>{subject.stats.totalStudents} Students</span>
                </div>
                <div style={styles.subjectStat}>
                  <FiBookOpen size={14} />
                  <span>{subject.stats.totalUnits} Units</span>
                </div>
                <div style={styles.subjectStat}>
                  <FiClipboard size={14} />
                  <span>{subject.stats.totalAssignments} Assignments</span>
                </div>
                <div style={styles.subjectStat}>
                  <FiAward size={14} />
                  <span>{subject.stats.totalQuizzes} Quizzes</span>
                </div>
                <div style={styles.subjectStat}>
                  <FiVideo size={14} />
                  <span>{subject.stats.totalContent} Content</span>
                </div>
              </div>
              <div style={styles.subjectProgress}>
                <div style={styles.subjectProgressLabel}>
                  <span>Average Progress</span>
                  <span>{subject.stats.averageProgress}%</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill(subject.stats.averageProgress, "#0B2A4A")} />
                </div>
              </div>
              <div style={styles.subjectFooter}>
                <span style={styles.subjectCompletion}>
                  {subject.stats.completedStudents}/{subject.stats.totalStudents} students completed
                </span>
                <button style={styles.viewDetailsBtn}>
                  View Details <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Students Tab */}
      {activeTab === "students" && completeData?.students && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <FiUsers size={20} /> All Students ({completeData.students.length})
            </h3>
          </div>
          <div style={styles.studentsList}>
            {completeData.students.map((student, idx) => (
              <div key={idx} style={styles.studentCard}>
                <div style={styles.studentInfo}>
                  <div style={styles.studentAvatar}>
                    {student.photo ? (
                      <img src={`${API_BASE_URL}/uploads/students/${student.photo}`} alt={student.name} style={styles.studentAvatarImg} />
                    ) : (
                      <span>{student.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <div style={styles.studentName}>{student.name}</div>
                    <div style={styles.studentDetail}>
                      {student.enrollmentNumber} • {student.rollNumber}
                    </div>
                    <div style={styles.studentContact}>
                      {student.email} • {student.mobile}
                    </div>
                  </div>
                </div>
                <div style={styles.studentSubjects}>
                  <FiBookOpen size={12} />
                  <span>{student.subjects?.length || 0} Subjects</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === "assignments" && completeData?.assignments && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <FiClipboard size={20} /> All Assignments ({completeData.assignments.length})
            </h3>
          </div>
          <div style={styles.assignmentsList}>
            {completeData.assignments.map((assignment, idx) => (
              <div key={idx} style={styles.assignmentCard}>
                <div style={styles.assignmentHeader}>
                  <div>
                    <div style={styles.assignmentTitle}>{assignment.title}</div>
                    <div style={styles.assignmentMeta}>
                      <span>{assignment.subjectName}</span>
                      <span>•</span>
                      <span>{assignment.subjectCode}</span>
                    </div>
                  </div>
                  <div style={styles.assignmentMarks}>
                    {assignment.totalMarks} marks
                  </div>
                </div>
                <div style={styles.assignmentFooter}>
                  <div style={styles.assignmentDeadline}>
                    <FiClock size={12} />
                    <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                  </div>
                  <div style={assignment.isExpired ? styles.expiredBadge : styles.activeBadge}>
                    {assignment.isExpired ? "Expired" : "Active"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
  dashboard: {
    padding: "24px",
    fontFamily: "'Inter', sans-serif",
    background: "#F8FAFC",
    minHeight: "100vh"
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
    borderTopColor: "#0B2A4A",
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
    background: "#0B2A4A",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },
  welcomeSection: {
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px"
  },
  welcomeTitle: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#0B2A4A",
    marginBottom: "8px"
  },
  welcomeSubtitle: {
    color: "#64748B",
    fontSize: "16px"
  },
  dateBadge: {
    background: "white",
    padding: "10px 20px",
    borderRadius: "50px",
    border: "1px solid #E5E9F0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#0B2A4A",
    fontWeight: "500"
  },
  refreshIcon: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    color: "#64748B"
  },
  teacherBanner: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "24px",
    border: "1px solid #E5E9F0"
  },
  teacherInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  teacherAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "28px",
    background: "#0B2A4A",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "600"
  },
  teacherName: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0B2A4A"
  },
  teacherDetails: {
    fontSize: "13px",
    color: "#64748B",
    marginTop: "4px"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginBottom: "32px"
  },
  statCard: {
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    borderBottom: "3px solid",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  statIconBox: {
    width: "54px",
    height: "54px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0F172A"
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748B",
    marginTop: "2px"
  },
  statTrend: {
    fontSize: "11px",
    marginTop: "6px",
    color: "#64748B"
  },
  tabsContainer: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    background: "white",
    padding: "4px",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    width: "fit-content"
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid #E2E8F0"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0F172A",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  overallProgressContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: "32px",
    padding: "20px 0"
  },
  overallProgressCircle: {
    textAlign: "center"
  },
  overallProgressValue: {
    fontSize: "48px",
    fontWeight: "700",
    color: "#0B2A4A"
  },
  overallProgressLabel: {
    fontSize: "12px",
    color: "#64748B",
    marginTop: "8px"
  },
  overallStats: {
    display: "flex",
    gap: "32px"
  },
  overallStatItem: {
    textAlign: "center"
  },
  overallStatValue: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#0F172A"
  },
  overallStatLabel: {
    fontSize: "11px",
    color: "#64748B"
  },
  progressItem: {
    marginBottom: "20px"
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
    flexWrap: "wrap",
    gap: "8px"
  },
  subjectName: {
    fontWeight: "600",
    color: "#1E293B",
    fontSize: "14px",
    display: "block"
  },
  subjectMeta: {
    fontSize: "11px",
    color: "#64748B",
    display: "block",
    marginTop: "2px"
  },
  progressPercent: {
    fontWeight: "600",
    color: "#0B2A4A",
    fontSize: "14px"
  },
  progressBar: {
    width: "100%",
    height: "8px",
    background: "#F1F5F9",
    borderRadius: "50px",
    overflow: "hidden"
  },
  progressFill: (progress, color) => ({
    width: `${progress}%`,
    height: "100%",
    background: color,
    borderRadius: "50px",
    transition: "width 0.3s ease"
  }),
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px"
  },
  activityItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px 0",
    borderBottom: "1px solid #E5E9F0"
  },
  activityDot: (status) => ({
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#059669",
    boxShadow: "0 0 0 3px #E7F5E9"
  }),
  activityContent: {
    flex: 1
  },
  activityAction: {
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: "4px",
    fontSize: "14px"
  },
  activityMeta: {
    fontSize: "12px",
    color: "#64748B",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  activityTime: {
    fontSize: "11px",
    color: "#94A3B8",
    background: "#F8FAFC",
    padding: "4px 8px",
    borderRadius: "50px"
  },
  deadlineItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid #E5E9F0"
  },
  deadlineIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#FEF3C7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#D97706"
  },
  deadlineContent: {
    flex: 1
  },
  deadlineTask: {
    fontWeight: "600",
    color: "#1E293B",
    fontSize: "14px",
    marginBottom: "2px"
  },
  deadlineMeta: {
    fontSize: "11px",
    color: "#64748B"
  },
  deadlineBadge: {
    background: "#E8F0FE",
    color: "#0B2A4A",
    padding: "4px 8px",
    borderRadius: "50px",
    fontSize: "10px",
    fontWeight: "500"
  },
  deadlineBadgeUrgent: {
    background: "#FEE2E2",
    color: "#DC2626",
    padding: "4px 8px",
    borderRadius: "50px",
    fontSize: "10px",
    fontWeight: "500"
  },
  subjectCard: {
    background: "#F8FAFC",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "16px",
    border: "1px solid #E2E8F0"
  },
  subjectCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px"
  },
  subjectCardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "4px"
  },
  subjectCardCode: {
    fontSize: "11px",
    color: "#64748B"
  },
  subjectCardBadge: {
    padding: "4px 12px",
    background: "#667eea15",
    color: "#667eea",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500"
  },
  subjectStats: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "16px"
  },
  subjectStat: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#64748B"
  },
  subjectProgress: {
    marginBottom: "16px"
  },
  subjectProgressLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: "#64748B",
    marginBottom: "6px"
  },
  subjectFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "12px",
    borderTop: "1px solid #E2E8F0"
  },
  subjectCompletion: {
    fontSize: "11px",
    color: "#10B981"
  },
  viewDetailsBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    background: "white",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    fontSize: "11px",
    cursor: "pointer"
  },
  studentsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  studentCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    background: "#F8FAFC",
    borderRadius: "12px",
    border: "1px solid #E2E8F0"
  },
  studentInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  studentAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "24px",
    background: "#667eea",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "600",
    overflow: "hidden"
  },
  studentAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  studentName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0F172A"
  },
  studentDetail: {
    fontSize: "11px",
    color: "#64748B",
    marginTop: "2px"
  },
  studentContact: {
    fontSize: "10px",
    color: "#94A3B8",
    marginTop: "2px"
  },
  studentSubjects: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#667eea",
    background: "#667eea15",
    padding: "4px 10px",
    borderRadius: "20px"
  },
  assignmentsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  assignmentCard: {
    padding: "16px",
    background: "#F8FAFC",
    borderRadius: "12px",
    border: "1px solid #E2E8F0"
  },
  assignmentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px"
  },
  assignmentTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "4px"
  },
  assignmentMeta: {
    fontSize: "11px",
    color: "#64748B",
    display: "flex",
    gap: "6px"
  },
  assignmentMarks: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#F59E0B",
    background: "#FEF3C7",
    padding: "4px 10px",
    borderRadius: "20px"
  },
  assignmentFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  assignmentDeadline: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#64748B"
  },
  activeBadge: {
    padding: "2px 8px",
    background: "#10B98115",
    color: "#10B981",
    borderRadius: "12px",
    fontSize: "10px"
  },
  expiredBadge: {
    padding: "2px 8px",
    background: "#EF444415",
    color: "#EF4444",
    borderRadius: "12px",
    fontSize: "10px"
  },
  noDataMessage: {
    textAlign: "center",
    padding: "40px",
    color: "#94A3B8"
  }
};

export default Dashboard;