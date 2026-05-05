// src/student/StudentProfile.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBook,
  FiCalendar,
  FiAward,
  FiEdit2,
  FiSave,
  FiX,
  FiCamera,
  FiCheckCircle,
  FiAlertCircle,
  FiHash,
  FiUsers,
  FiMapPin,
  FiClock,
  FiTrendingUp,
  FiTarget,
  FiZap,
  FiShield,
  FiStar,
  FiActivity,
  FiPercent,
  FiBriefcase,
  FiCode,
  FiDatabase,
  FiCpu,
  FiGlobe,
  FiSmartphone,
  FiHome,
  FiMail as FiMailIcon,
  FiPhoneCall,
  FiCreditCard,
  FiFlag,
  FiCalendar as FiCalendarIcon
} from "react-icons/fi";
import { MdSchool, MdWork, MdLocationOn, MdVerified } from "react-icons/md";

const StudentProfile = ({ darkMode, student: propStudent, onUpdate }) => {
  const [student, setStudent] = useState(propStudent || {});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (propStudent) {
      setStudent(propStudent);
      setFormData(propStudent);
    }
  }, [propStudent]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("mobile", formData.mobile);
      formDataToSend.append("department", formData.department);
      formDataToSend.append("course", formData.course);
      formDataToSend.append("batch", formData.batch);
      formDataToSend.append("semester", formData.semester);
      formDataToSend.append("rollNumber", formData.rollNumber);
      formDataToSend.append("enrollmentNumber", formData.enrollmentNumber);
      formDataToSend.append("division", formData.division);
      
      if (selectedFile) {
        formDataToSend.append("photo", selectedFile);
      }
      
      const response = await axios.put(
        `http://localhost:5000/api/students/${userId}`,
        formDataToSend,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      
      setStudent(response.data.student);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      
      if (onUpdate) {
        onUpdate(response.data.student);
      }
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(student);
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
    setError("");
  };

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase() || "S";
  };

  const styles = {
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "32px"
    },
    profileHeader: {
      background: darkMode ? "#1E293B" : "white",
      borderRadius: "28px",
      padding: "0",
      marginBottom: "28px",
      border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0",
      overflow: "hidden",
      boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.05)"
    },
    profileCover: {
      height: "140px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
      position: "relative"
    },
    profileContent: {
      padding: "0 32px 32px 32px",
      marginTop: "-60px"
    },
    avatarSection: {
      display: "flex",
      alignItems: "flex-end",
      gap: "28px",
      flexWrap: "wrap",
      marginBottom: "24px"
    },
    avatarContainer: {
      position: "relative"
    },
    avatar: {
      width: "140px",
      height: "140px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: "56px",
      fontWeight: "600",
      border: "5px solid white",
      boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
      overflow: "hidden",
      transition: "all 0.3s ease"
    },
    avatarImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    },
    changePhotoBtn: {
      position: "absolute",
      bottom: "8px",
      right: "8px",
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      background: "#3B82F6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      border: "3px solid white",
      transition: "all 0.2s ease",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
    },
    studentInfo: {
      flex: 1,
      marginBottom: "16px"
    },
    studentName: {
      fontSize: "32px",
      fontWeight: "700",
      color: darkMode ? "white" : "#0F172A",
      marginBottom: "12px",
      letterSpacing: "-0.5px"
    },
    studentBadge: {
      display: "flex",
      gap: "12px",
      flexWrap: "wrap"
    },
    badge: (bgColor, color, icon) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 14px",
      borderRadius: "30px",
      fontSize: "12px",
      fontWeight: "500",
      background: bgColor,
      color: color
    }),
    editButton: {
      padding: "10px 28px",
      borderRadius: "14px",
      border: "none",
      background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
      color: "white",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 12px rgba(59,130,246,0.3)"
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "24px",
      marginBottom: "32px"
    },
    statCard: {
      background: darkMode ? "#1E293B" : "white",
      borderRadius: "20px",
      padding: "20px",
      border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      transition: "all 0.3s ease"
    },
    statIcon: (bgColor, color) => ({
      width: "52px",
      height: "52px",
      borderRadius: "16px",
      background: bgColor,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: color,
      fontSize: "24px"
    }),
    statInfo: {
      flex: 1
    },
    statLabel: {
      fontSize: "13px",
      fontWeight: "500",
      color: darkMode ? "#94A3B8" : "#64748B",
      marginBottom: "4px"
    },
    statValue: {
      fontSize: "28px",
      fontWeight: "700",
      color: darkMode ? "white" : "#0F172A"
    },
    profileSection: {
      background: darkMode ? "#1E293B" : "white",
      borderRadius: "24px",
      padding: "32px",
      border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0"
    },
    sectionTitle: {
      fontSize: "20px",
      fontWeight: "600",
      color: darkMode ? "white" : "#0F172A",
      marginBottom: "28px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      paddingBottom: "16px",
      borderBottom: darkMode ? "2px solid #334155" : "2px solid #E2E8F0"
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "28px"
    },
    infoCard: {
      background: darkMode ? "#0F172A" : "#F8FAFC",
      borderRadius: "16px",
      padding: "16px 20px",
      border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0",
      transition: "all 0.2s ease"
    },
    infoRow: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      padding: "12px 0"
    },
    infoIcon: (bgColor, color) => ({
      width: "40px",
      height: "40px",
      borderRadius: "12px",
      background: bgColor,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: color,
      fontSize: "18px"
    }),
    infoContent: {
      flex: 1
    },
    infoLabel: {
      fontSize: "12px",
      fontWeight: "500",
      color: darkMode ? "#94A3B8" : "#64748B",
      marginBottom: "4px"
    },
    infoValue: {
      fontSize: "15px",
      fontWeight: "600",
      color: darkMode ? "white" : "#0F172A",
      wordBreak: "break-word"
    },
    inputField: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "12px",
      border: `1.5px solid ${darkMode ? "#475569" : "#E2E8F0"}`,
      background: darkMode ? "#334155" : "white",
      color: darkMode ? "white" : "#0F172A",
      fontSize: "14px",
      fontWeight: "500",
      outline: "none",
      transition: "all 0.2s ease"
    },
    actionButtons: {
      display: "flex",
      gap: "16px",
      justifyContent: "flex-end",
      marginTop: "32px",
      paddingTop: "24px",
      borderTop: darkMode ? "2px solid #334155" : "2px solid #E2E8F0"
    },
    saveButton: {
      padding: "12px 28px",
      borderRadius: "14px",
      border: "none",
      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      color: "white",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.3s ease"
    },
    cancelButton: {
      padding: "12px 28px",
      borderRadius: "14px",
      border: `1.5px solid ${darkMode ? "#475569" : "#E2E8F0"}`,
      background: "transparent",
      color: darkMode ? "white" : "#64748B",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s ease"
    },
    alert: {
      padding: "14px 20px",
      borderRadius: "14px",
      marginBottom: "24px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      fontSize: "14px",
      fontWeight: "500"
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ width: "50px", height: "50px", border: "3px solid #E2E8F0", borderTop: "3px solid #3B82F6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Profile Header */}
      <div style={styles.profileHeader}>
        <div style={styles.profileCover} />
        <div style={styles.profileContent}>
          <div style={styles.avatarSection}>
            <div style={styles.avatarContainer}>
              <div style={styles.avatar}>
                {previewUrl || student.photo ? (
                  <img 
                    src={previewUrl || `http://localhost:5000/uploads/students/${student.photo}`}
                    alt="Profile"
                    style={styles.avatarImage}
                  />
                ) : (
                  getInitials(student.name)
                )}
              </div>
              {isEditing && (
                <label style={styles.changePhotoBtn}>
                  <FiCamera size={16} color="white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>
            
            <div style={styles.studentInfo}>
              {!isEditing ? (
                <>
                  <div style={styles.studentName}>{student.name}</div>
                  <div style={styles.studentBadge}>
                    <span style={styles.badge("#EFF6FF", "#3B82F6")}>
                      <FiShield size={12} /> Student
                    </span>
                    <span style={styles.badge("#DCFCE7", "#10B981")}>
                      <FiAward size={12} /> Semester {student.semester}
                    </span>
                    <span style={styles.badge("#FEF3C7", "#D97706")}>
                      <FiUsers size={12} /> {student.division} Division
                    </span>
                    <span style={styles.badge("#EDE9FE", "#7C3AED")}>
                      <MdVerified size={12} /> Verified
                    </span>
                  </div>
                </>
              ) : (
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  style={styles.inputField}
                  placeholder="Full Name"
                />
              )}
            </div>
            
          
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon("#EFF6FF", "#3B82F6")}>
            <FiBook size={24} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Enrolled Courses</div>
            <div style={styles.statValue}>4</div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon("#DCFCE7", "#10B981")}>
            <FiTrendingUp size={24} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Completion Rate</div>
            <div style={styles.statValue}>65%</div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon("#FEF3C7", "#D97706")}>
            <FiStar size={24} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Current CGPA</div>
            <div style={styles.statValue}>8.7</div>
          </div>
        </div>
        
      
      </div>

      {/* Profile Details Section */}
      <div style={styles.profileSection}>
        {error && (
          <div style={{ ...styles.alert, background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA" }}>
            <FiAlertCircle size={18} /> {error}
          </div>
        )}
        
        {success && (
          <div style={{ ...styles.alert, background: "#DCFCE7", color: "#059669", border: "1px solid #BBF7D0" }}>
            <FiCheckCircle size={18} /> {success}
          </div>
        )}

        <div style={styles.sectionTitle}>
          <FiUser size={22} /> Personal Information
        </div>

        <div style={styles.infoGrid}>
          {/* Academic Information Card */}
          <div style={styles.infoCard}>
            <div style={styles.infoRow}>
              <div style={styles.infoIcon("#EFF6FF", "#3B82F6")}>
                <FiHash size={18} />
              </div>
              <div style={styles.infoContent}>
                <div style={styles.infoLabel}>Enrollment Number</div>
                {!isEditing ? (
                  <div style={styles.infoValue}>{student.enrollmentNumber || "Not Set"}</div>
                ) : (
                  <input type="text" name="enrollmentNumber" value={formData.enrollmentNumber || ""} onChange={handleInputChange} style={styles.inputField} placeholder="Enrollment Number" />
                )}
              </div>
            </div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoIcon("#DCFCE7", "#10B981")}>
                <FiHash size={18} />
              </div>
              <div style={styles.infoContent}>
                <div style={styles.infoLabel}>Roll Number</div>
                {!isEditing ? (
                  <div style={styles.infoValue}>{student.rollNumber || "Not Set"}</div>
                ) : (
                  <input type="text" name="rollNumber" value={formData.rollNumber || ""} onChange={handleInputChange} style={styles.inputField} placeholder="Roll Number" />
                )}
              </div>
            </div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoIcon("#FEF3C7", "#D97706")}>
                <FiBook size={18} />
              </div>
              <div style={styles.infoContent}>
                <div style={styles.infoLabel}>Department</div>
                {!isEditing ? (
                  <div style={styles.infoValue}>{student.department || "Computer Science"}</div>
                ) : (
                  <input type="text" name="department" value={formData.department || ""} onChange={handleInputChange} style={styles.inputField} placeholder="Department" />
                )}
              </div>
            </div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoIcon("#EDE9FE", "#7C3AED")}>
                <FiBriefcase size={18} />
              </div>
              <div style={styles.infoContent}>
                <div style={styles.infoLabel}>Course</div>
                {!isEditing ? (
                  <div style={styles.infoValue}>{student.course || "B.Tech"}</div>
                ) : (
                  <input type="text" name="course" value={formData.course || ""} onChange={handleInputChange} style={styles.inputField} placeholder="Course" />
                )}
              </div>
            </div>
          </div>

          {/* Contact Information Card */}
          <div style={styles.infoCard}>
            <div style={styles.infoRow}>
              <div style={styles.infoIcon("#EFF6FF", "#3B82F6")}>
                <FiMail size={18} />
              </div>
              <div style={styles.infoContent}>
                <div style={styles.infoLabel}>Email Address</div>
                <div style={styles.infoValue}>{student.email}</div>
              </div>
            </div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoIcon("#DCFCE7", "#10B981")}>
                <FiPhoneCall size={18} />
              </div>
              <div style={styles.infoContent}>
                <div style={styles.infoLabel}>Mobile Number</div>
                {!isEditing ? (
                  <div style={styles.infoValue}>{student.mobile || "Not Set"}</div>
                ) : (
                  <input type="tel" name="mobile" value={formData.mobile || ""} onChange={handleInputChange} style={styles.inputField} placeholder="Mobile Number" />
                )}
              </div>
            </div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoIcon("#FEF3C7", "#D97706")}>
                <FiCalendar size={18} />
              </div>
              <div style={styles.infoContent}>
                <div style={styles.infoLabel}>Batch</div>
                {!isEditing ? (
                  <div style={styles.infoValue}>{student.batch || "2024-2028"}</div>
                ) : (
                  <input type="text" name="batch" value={formData.batch || ""} onChange={handleInputChange} style={styles.inputField} placeholder="Batch" />
                )}
              </div>
            </div>
            
            <div style={styles.infoRow}>
              <div style={styles.infoIcon("#EDE9FE", "#7C3AED")}>
                <FiUsers size={18} />
              </div>
              <div style={styles.infoContent}>
                <div style={styles.infoLabel}>Division</div>
                {!isEditing ? (
                  <div style={styles.infoValue}>{student.division || "A"}</div>
                ) : (
                  <input type="text" name="division" value={formData.division || ""} onChange={handleInputChange} style={styles.inputField} placeholder="Division" maxLength="1" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Academic Progress Information */}
        <div style={{ ...styles.sectionTitle, marginTop: "20px" }}>
          <FiTrendingUp size={22} /> Academic Progress
        </div>

        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoRow}>
              <div style={styles.infoIcon("#EFF6FF", "#3B82F6")}>
                <FiCalendar size={18} />
              </div>
              <div style={styles.infoContent}>
                <div style={styles.infoLabel}>Current Semester</div>
                {!isEditing ? (
                  <div style={styles.infoValue}>Semester {student.semester || "4"}</div>
                ) : (
                  <input type="number" name="semester" value={formData.semester || ""} onChange={handleInputChange} style={styles.inputField} placeholder="Semester" min="1" max="8" />
                )}
              </div>
            </div>
          </div>
          
          <div style={styles.infoCard}>
            <div style={styles.infoRow}>
              <div style={styles.infoIcon("#DCFCE7", "#10B981")}>
                <FiTarget size={18} />
              </div>
              <div style={styles.infoContent}>
                <div style={styles.infoLabel}>Credits Completed</div>
                <div style={styles.infoValue}>78 / 120</div>
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div style={styles.actionButtons}>
            <button style={styles.cancelButton} onClick={handleCancel}>
              <FiX size={16} /> Cancel
            </button>
            <button style={styles.saveButton} onClick={handleSave} disabled={saving}>
              <FiSave size={16} /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StudentProfile;