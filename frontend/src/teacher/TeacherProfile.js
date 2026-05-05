// teacher/TeacherProfile.js
import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiBookOpen,
  FiAward,
  FiCalendar,
  FiStar,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiTrendingUp,
  FiInfo,
  FiHash,
  FiFileText,
  FiTool,
  FiMapPin
} from "react-icons/fi";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const TeacherProfile = ({ teacher }) => {
  const [teacherData, setTeacherData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get teacher data from props or localStorage
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

  const fetchTeacherProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teacherInfo = getTeacherData();
      
      if (!teacherInfo || !teacherInfo._id) {
        setError("Teacher information not found");
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem("token");
      
      // Fetch complete teacher details
      const response = await axios.get(
        `${API_BASE_URL}/api/teachers/${teacherInfo._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Teacher API Response:", response.data);
      
      if (response.data) {
        setTeacherData(response.data);
        
        // Fetch subjects separately if needed
        try {
          const subjectsResponse = await axios.get(
            `${API_BASE_URL}/api/teachers/${teacherInfo._id}/with-subjects`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSubjects(subjectsResponse.data || []);
          console.log("Subjects loaded:", subjectsResponse.data);
        } catch (subErr) {
          console.log("No subjects endpoint, using from main data");
          // Extract subjects from main teacher data
          const teacherSubjects = response.data.subjects || [];
          const formattedSubjects = await Promise.all(teacherSubjects.map(async (s) => {
            if (s.subjectId && typeof s.subjectId === 'object') {
              return {
                _id: s.subjectId._id,
                name: s.subjectId.name,
                code: s.subjectId.code,
                course: s.subjectId.course,
                semester: s.subjectId.semester,
                division: s.division,
                status: s.subjectId.status
              };
            } else if (s.subjectId && typeof s.subjectId === 'string') {
              try {
                const subjectRes = await axios.get(`${API_BASE_URL}/api/subjects/${s.subjectId}`);
                return {
                  _id: subjectRes.data._id,
                  name: subjectRes.data.name,
                  code: subjectRes.data.code,
                  course: subjectRes.data.course,
                  semester: subjectRes.data.semester,
                  division: s.division,
                  status: subjectRes.data.status
                };
              } catch (err) {
                return null;
              }
            }
            return null;
          }));
          setSubjects(formattedSubjects.filter(s => s !== null));
        }
      } else {
        setError("Failed to load teacher profile");
      }
    } catch (err) {
      console.error("Error fetching teacher profile:", err);
      setError(err.response?.data?.message || "Failed to load teacher profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeacherProfile();
  }, []);

  const refreshData = () => {
    setRefreshing(true);
    fetchTeacherProfile();
  };

  // Function to handle image error
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.parentElement.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    e.target.parentElement.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="48" width="48" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <FiAlertCircle size={48} color="#EF4444" />
        <h3>Unable to Load Profile</h3>
        <p>{error}</p>
        <button style={styles.retryBtn} onClick={refreshData}>Try Again</button>
      </div>
    );
  }

  const data = teacherData || {};
  const displaySubjects = subjects.length > 0 ? subjects : (data.subjects || []);

  // Get teacher's division info
  const teacherDivisions = [...new Set(displaySubjects.map(s => s.division).filter(Boolean))];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.headerBadge}>TEACHER PORTAL</div>
          <h1 style={styles.headerTitle}>My Profile</h1>
          <p style={styles.headerSubtitle}>View your professional information</p>
        </div>
        <button style={styles.refreshBtn} onClick={refreshData} disabled={refreshing}>
          <FiRefreshCw size={16} style={refreshing ? { animation: "spin 0.8s linear infinite" } : {}} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Profile Header with Avatar */}
      <div style={styles.profileHeader}>
        <div style={styles.avatarSection}>
          <div style={styles.avatarContainer}>
            {data.photo ? (
              <img 
                src={`${API_BASE_URL}/uploads/teachers/${data.photo}`} 
                alt={data.name} 
                style={styles.avatarImg}
                onError={handleImageError}
              />
            ) : (
              <div style={styles.avatarPlaceholder}>
                <FiUser size={60} />
              </div>
            )}
          </div>
          <div style={styles.statusBadge}>
            <div style={{ ...styles.statusDot, background: data.status === "active" ? "#10B981" : "#EF4444" }} />
            <span>{data.status === "active" ? "Active" : "Inactive"}</span>
          </div>
        </div>
        <div style={styles.profileInfo}>
          <h1 style={styles.teacherName}>{data.name || "Teacher Name"}</h1>
          <p style={styles.teacherDesignation}>{data.designation || "Professor"}</p>
          <div style={styles.teacherStats}>
            <div style={styles.statItem}>
              <FiUsers size={16} />
              <span>{displaySubjects.length} Subjects</span>
            </div>
            <div style={styles.statItem}>
              <FiAward size={16} />
              <span>{data.experience || 0}+ Years Exp</span>
            </div>
            <div style={styles.statItem}>
              <FiBookOpen size={16} />
              <span>{data.qualification?.split(',')[0] || "Qualified"}</span>
            </div>
            <div style={styles.statItem}>
              <FiMapPin size={16} />
              <span>Divisions: {teacherDivisions.join(", ") || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.contentGrid}>
        {/* Personal Information */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <FiUser size={20} /> Personal Information
            </h3>
          </div>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>
                <FiUser size={18} />
              </div>
              <div>
                <label style={styles.infoLabel}>Full Name</label>
                <p style={styles.infoValue}>{data.name || "Not Provided"}</p>
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>
                <FiHash size={18} />
              </div>
              <div>
                <label style={styles.infoLabel}>Employee ID</label>
                <p style={styles.infoValue}>{data.employeeId || "Not Provided"}</p>
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>
                <FiMail size={18} />
              </div>
              <div>
                <label style={styles.infoLabel}>Email Address</label>
                <p style={styles.infoValue}>{data.email || "Not Provided"}</p>
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>
                <FiPhone size={18} />
              </div>
              <div>
                <label style={styles.infoLabel}>Mobile Number</label>
                <p style={styles.infoValue}>{data.mobile || "Not Provided"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <FiBriefcase size={20} /> Professional Information
            </h3>
          </div>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>
                <FiBriefcase size={18} />
              </div>
              <div>
                <label style={styles.infoLabel}>Department</label>
                <p style={styles.infoValue}>{data.department || "Not Provided"}</p>
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>
                <FiTrendingUp size={18} />
              </div>
              <div>
                <label style={styles.infoLabel}>Course</label>
                <p style={styles.infoValue}>{data.courses?.[0] || data.course || "Not Provided"}</p>
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>
                <FiStar size={18} />
              </div>
              <div>
                <label style={styles.infoLabel}>Designation</label>
                <p style={styles.infoValue}>{data.designation || "Not Provided"}</p>
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoIcon}>
                <FiClock size={18} />
              </div>
              <div>
                <label style={styles.infoLabel}>Experience</label>
                <p style={styles.infoValue}>{data.experience || 0} Years</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Qualification & Specialization */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <FiTool size={20} /> Academic Qualifications
          </h3>
        </div>
        <div style={styles.twoColumnGrid}>
          <div style={styles.infoItem}>
            <div style={styles.infoIcon}>
              <FiAward size={18} />
            </div>
            <div>
              <label style={styles.infoLabel}>Qualification</label>
              <p style={styles.infoValue}>{data.qualification || "Not Provided"}</p>
            </div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoIcon}>
              <FiFileText size={18} />
            </div>
            <div>
              <label style={styles.infoLabel}>Specialization</label>
              <p style={styles.infoValue}>{data.specialization || "Not Provided"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Teaching */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <FiBookOpen size={20} /> Subjects Teaching
          </h3>
          <div style={styles.subjectCount}>
            Total: {displaySubjects.length} Subjects
          </div>
        </div>
        {displaySubjects.length > 0 ? (
          <div style={styles.subjectsGrid}>
            {displaySubjects.map((subject, index) => (
              <div key={index} style={styles.subjectCard}>
                <div style={styles.subjectHeader}>
                  <div style={styles.subjectIcon}>
                    <FiBookOpen size={20} />
                  </div>
                  <div>
                    <h4 style={styles.subjectName}>{subject.name || "Unknown Subject"}</h4>
                    <p style={styles.subjectCode}>{subject.code || "N/A"}</p>
                  </div>
                </div>
                <div style={styles.subjectDetails}>
                  <div style={styles.subjectDetail}>
                    <FiTrendingUp size={12} />
                    <span>{subject.course || data.courses?.[0] || "N/A"}</span>
                  </div>
                  <div style={styles.subjectDetail}>
                    <FiCalendar size={12} />
                    <span>Semester {subject.semester || "N/A"}</span>
                  </div>
                  <div style={styles.subjectDetail}>
                    <FiUsers size={12} />
                    <span>Division {subject.division || "N/A"}</span>
                  </div>
                  <div style={styles.subjectStatus(subject.status)}>
                    {subject.status === "active" ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.noDataMessage}>
            <FiBookOpen size={32} style={{ opacity: 0.5 }} />
            <p>No subjects assigned yet</p>
          </div>
        )}
      </div>

      {/* Account Information */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <FiInfo size={20} /> Account Information
          </h3>
        </div>
        <div style={styles.twoColumnGrid}>
          <div style={styles.infoItem}>
            <div style={styles.infoIcon}>
              <FiCheckCircle size={18} />
            </div>
            <div>
              <label style={styles.infoLabel}>Account Status</label>
              <p style={{ ...styles.infoValue, color: data.status === "active" ? "#10B981" : "#EF4444" }}>
                {data.status === "active" ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoIcon}>
              <FiCalendar size={18} />
            </div>
            <div>
              <label style={styles.infoLabel}>Member Since</label>
              <p style={styles.infoValue}>
                {data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "Not Available"}
              </p>
            </div>
          </div>
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
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px",
    minHeight: "100vh",
    background: "#F8FAFC"
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px"
  },
  headerBadge: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#0B2A4A",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "8px"
  },
  headerTitle: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: "8px"
  },
  headerSubtitle: {
    fontSize: "14px",
    color: "#64748B"
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    background: "white",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s ease"
  },
  profileHeader: {
    background: "white",
    borderRadius: "24px",
    padding: "32px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "32px",
    flexWrap: "wrap",
    border: "1px solid #E2E8F0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  avatarSection: {
    position: "relative"
  },
  avatarContainer: {
    width: "120px",
    height: "120px",
    borderRadius: "60px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white"
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  statusBadge: {
    position: "absolute",
    bottom: "8px",
    right: "8px",
    background: "white",
    padding: "4px 10px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: "500",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "4px"
  },
  profileInfo: {
    flex: 1
  },
  teacherName: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: "8px"
  },
  teacherDesignation: {
    fontSize: "16px",
    color: "#667eea",
    marginBottom: "16px"
  },
  teacherStats: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap"
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#64748B"
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "24px"
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "24px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px"
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0F172A",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px"
  },
  infoItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#F8FAFC",
    borderRadius: "12px"
  },
  infoIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "#667eea15",
    color: "#667eea",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  infoLabel: {
    fontSize: "10px",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#0F172A",
    marginTop: "2px"
  },
  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px"
  },
  subjectsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "16px"
  },
  subjectCard: {
    background: "#F8FAFC",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #E2E8F0",
    transition: "all 0.3s ease"
  },
  subjectHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px"
  },
  subjectIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#667eea15",
    color: "#667eea",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  subjectName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "2px"
  },
  subjectCode: {
    fontSize: "11px",
    color: "#64748B"
  },
  subjectDetails: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "8px",
    paddingTop: "12px",
    borderTop: "1px solid #E2E8F0"
  },
  subjectDetail: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    color: "#64748B"
  },
  subjectStatus: (status) => ({
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "500",
    background: status === "active" ? "#10B98115" : "#EF444415",
    color: status === "active" ? "#10B981" : "#EF4444"
  }),
  subjectCount: {
    fontSize: "12px",
    fontWeight: "500",
    padding: "4px 10px",
    background: "#667eea15",
    color: "#667eea",
    borderRadius: "20px"
  },
  noDataMessage: {
    textAlign: "center",
    padding: "40px",
    color: "#94A3B8"
  }
};

export default TeacherProfile;