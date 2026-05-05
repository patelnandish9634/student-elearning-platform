// StudentCourses.js (Fixed version)
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiBookOpen,
  FiUser,
  FiStar,
  FiBookmark,
  FiGrid,
  FiList,
  FiChevronRight,
  FiAlertCircle,
  FiRefreshCw,
  FiUsers,
  FiPlusCircle,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiInfo,
  FiCalendar,
  FiAward,
  FiPlayCircle,
  FiArrowRight
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StudentCourses = ({ darkMode, student, onNavigateToCourse }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolling, setEnrolling] = useState(null);
  const [dropping, setDropping] = useState(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [enrolledCourseDetails, setEnrolledCourseDetails] = useState({});
  const [enrollmentStats, setEnrollmentStats] = useState(null);
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedActionCourse, setSelectedActionCourse] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [dropReason, setDropReason] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successfullyEnrolledCourse, setSuccessfullyEnrolledCourse] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("token");

  // Configure axios with auth header
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // Fetch enrolled courses for the student
  const fetchEnrolledCourses = useCallback(async () => {
    try {
      console.log("Fetching enrolled courses for student:", student?.id);
      
      const response = await axios.get(
        `${API_BASE_URL}/enrollments/student/${student?.id}`,
        axiosConfig
      );
      
      console.log("Enrollments response:", response.data);
      
      const enrolledIds = [];
      const enrolledMap = {};
      
      // Fix: Handle both cases where subjectId is an object or string
      response.data.enrollments.forEach(enrollment => {
        // Get subject ID correctly
        let subjectId = null;
        if (enrollment.subjectId) {
          if (typeof enrollment.subjectId === 'object') {
            subjectId = enrollment.subjectId._id || enrollment.subjectId;
          } else {
            subjectId = enrollment.subjectId;
          }
        }
        
        if (subjectId) {
          enrolledIds.push(subjectId);
          enrolledMap[subjectId] = {
            id: enrollment._id,
            status: enrollment.status,
            enrollmentDate: enrollment.enrollmentDate,
            progress: enrollment.progress || 0,
            subjectName: enrollment.subjectId?.name || 'Unknown'
          };
        }
      });
      
      console.log("Enrolled course IDs:", enrolledIds);
      console.log("Enrolled map:", enrolledMap);
      
      setEnrolledCourseIds(enrolledIds);
      setEnrolledCourseDetails(enrolledMap);
      
      // Fetch enrollment stats
      try {
        const statsResponse = await axios.get(
          `${API_BASE_URL}/enrollments/stats/student/${student?.id}`,
          axiosConfig
        );
        console.log("Stats response:", statsResponse.data);
        setEnrollmentStats(statsResponse.data.stats);
      } catch (statsErr) {
        console.error("Error fetching stats:", statsErr);
        // Set default stats
        setEnrollmentStats({
          totalEnrollments: enrolledIds.length,
          active: enrolledIds.length,
          completed: 0,
          dropped: 0,
          averageMarks: 0,
          totalAttendance: 0
        });
      }
      
    } catch (err) {
      console.error("Error fetching enrolled courses:", err);
      setEnrolledCourseIds([]);
      setEnrolledCourseDetails({});
    }
  }, [student?.id, axiosConfig]);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching courses for student:", {
        department: student?.department,
        course: student?.course,
        semester: student?.semester,
        division: student?.division
      });
      
      const response = await axios.get(`${API_BASE_URL}/subjects/student-dashboard`, {
        params: {
          department: student?.department,
          course: student?.course,
          semester: student?.semester,
          division: student?.division
        }
      });
      
      console.log("Courses response:", response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch courses");
      }
      
      const approvedSubjects = response.data.fullyApproved || [];
      
      const formattedCourses = approvedSubjects.map((subject, idx) => ({
        id: subject._id,
        name: subject.name,
        code: subject.code,
        instructor: subject.teacher?.name || subject.instructor,
        instructorEmail: subject.teacher?.email,
        teacherId: subject.teacher?.id,
        credits: subject.credits || 3,
        semester: subject.semester,
        unitsCount: subject.unitsCount || 0,
        assignedDivision: subject.assignedDivision || student?.division,
        gradient: getGradient(idx),
        icon: getSubjectIcon(subject.name),
        description: subject.description || `Learn ${subject.name} with comprehensive curriculum and hands-on projects.`,
        schedule: `Semester ${subject.semester} • ${subject.unitsCount || 4} Units`,
        prerequisites: subject.prerequisites || "None",
        totalHours: subject.unitsCount * 10 || 40
      }));
      
      setCourses(formattedCourses);
      
      // Fetch enrolled courses after courses are loaded
      await fetchEnrolledCourses();
      
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [student, fetchEnrolledCourses]);

  useEffect(() => {
    if (student) {
      fetchCourses();
    }
  }, [student, refreshKey]);

  const refreshAllData = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleEnrollClick = (course) => {
    setSelectedActionCourse(course);
    setActionType("enroll");
    setShowConfirmModal(true);
  };

  const handleDropClick = (course) => {
    setSelectedActionCourse(course);
    setActionType("drop");
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (actionType === "enroll") {
      await handleEnroll(selectedActionCourse);
    } else if (actionType === "drop") {
      await handleDropCourse(selectedActionCourse);
    }
    setShowConfirmModal(false);
    setSelectedActionCourse(null);
    setActionType(null);
    setDropReason("");
  };

  const handleEnroll = async (course) => {
    setEnrolling(course.id);
    
    try {
      // Check if already enrolled
      if (enrolledCourseIds.includes(course.id)) {
        toast.info(`You are already enrolled in ${course.name}`, {
          position: "top-right",
          autoClose: 3000,
        });
        setEnrolling(null);
        return;
      }
      
      // API call to enroll student
      const enrollmentData = {
        studentId: student?.id,
        subjectId: course.id,
        division: student?.division,
        academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        semester: student?.semester
      };
      
      console.log("Enrollment data:", enrollmentData);
      
      const response = await axios.post(
        `${API_BASE_URL}/enrollments/add`,
        enrollmentData,
        axiosConfig
      );
      
      console.log("Enrollment response:", response.data);
      
      if (response.data.success) {
        // IMPORTANT: Update enrolled courses immediately
        setEnrolledCourseIds(prev => [...prev, course.id]);
        setEnrolledCourseDetails(prev => ({
          ...prev,
          [course.id]: {
            id: response.data.enrollment?._id,
            status: "active",
            enrollmentDate: new Date(),
            progress: 0,
            subjectName: course.name
          }
        }));
        
        // Update stats
        setEnrollmentStats(prev => ({
          ...prev,
          active: (prev?.active || 0) + 1,
          totalEnrollments: (prev?.totalEnrollments || 0) + 1
        }));
        
        // Show success modal
        setSuccessfullyEnrolledCourse(course);
        setShowSuccessModal(true);
        
        toast.success(response.data.message || `Successfully enrolled in ${course.name}! 🎉`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
      
    } catch (err) {
      console.error("Error enrolling:", err);
      toast.error(err.response?.data?.message || "Failed to enroll. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setEnrolling(null);
    }
  };

  const handleDropCourse = async (course) => {
    setDropping(course.id);
    
    try {
      // Find enrollment ID for this course
      const response = await axios.get(
        `${API_BASE_URL}/enrollments/student/${student?.id}`,
        axiosConfig
      );
      
      const enrollment = response.data.enrollments.find(
        e => {
          let subjectId = e.subjectId?._id || e.subjectId;
          return subjectId === course.id;
        }
      );
      
      if (enrollment) {
        await axios.put(
          `${API_BASE_URL}/enrollments/${enrollment._id}/drop`,
          { reason: dropReason || "Student requested drop" },
          axiosConfig
        );
        
        // IMPORTANT: Update enrolled courses immediately
        setEnrolledCourseIds(prev => prev.filter(id => id !== course.id));
        setEnrolledCourseDetails(prev => {
          const newDetails = { ...prev };
          delete newDetails[course.id];
          return newDetails;
        });
        
        // Update stats
        setEnrollmentStats(prev => ({
          ...prev,
          active: Math.max((prev?.active || 0) - 1, 0),
          dropped: (prev?.dropped || 0) + 1
        }));
        
        toast.info(`Successfully dropped from ${course.name}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error dropping course:", err);
      toast.error(err.response?.data?.message || "Failed to drop course", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setDropping(null);
    }
  };

  const handleGoToCourse = (course) => {
    if (onNavigateToCourse) {
      onNavigateToCourse(course);
    } else {
      setSelectedCourse(course);
    }
  };

  const isEnrolled = (courseId) => {
    return enrolledCourseIds.includes(courseId);
  };

  const getEnrollmentProgress = (courseId) => {
    return enrolledCourseDetails[courseId]?.progress || 0;
  };

  // Filter courses based on showEnrolledOnly
  const displayedCourses = showEnrolledOnly
    ? courses.filter(course => isEnrolled(course.id))
    : courses;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading your courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorCard}>
        <FiAlertCircle size={40} color="#EF4444" />
        <h3>Unable to Load Courses</h3>
        <p>{error}</p>
        <button style={styles.retryBtn} onClick={refreshAllData}>Try Again</button>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div style={styles.emptyCard}>
        <FiBookOpen size={48} style={{ opacity: 0.5 }} />
        <h3>No Courses Available</h3>
        <p>You don't have any available courses for Semester {student?.semester} - Division {student?.division}</p>
        <button style={styles.retryBtn} onClick={refreshAllData}>Refresh</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <ToastContainer />
      
      {/* Success Enrollment Modal */}
      {showSuccessModal && successfullyEnrolledCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowSuccessModal(false)}>
          <div style={styles.successModalContainer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.successIcon}>
              <FiCheckCircle size={48} color="#10B981" />
            </div>
            <h2 style={styles.successTitle}>Enrollment Successful! 🎉</h2>
            <p style={styles.successMessage}>
              You have successfully enrolled in <strong>{successfullyEnrolledCourse.name}</strong>
            </p>
            <div style={styles.successDetails}>
              <div style={styles.successDetailItem}>
                <FiCalendar size={14} />
                <span>Semester {successfullyEnrolledCourse.semester}</span>
              </div>
              <div style={styles.successDetailItem}>
                <FiUsers size={14} />
                <span>Division {successfullyEnrolledCourse.assignedDivision}</span>
              </div>
              <div style={styles.successDetailItem}>
                <FiStar size={14} />
                <span>{successfullyEnrolledCourse.credits} Credits</span>
              </div>
            </div>
            <div style={styles.successButtons}>
              <button 
                style={styles.startLearningBtn}
                onClick={() => {
                  setShowSuccessModal(false);
                  handleGoToCourse(successfullyEnrolledCourse);
                }}
              >
                <FiPlayCircle size={16} /> Start Learning Now
              </button>
              <button 
                style={styles.closeSuccessBtn}
                onClick={() => setShowSuccessModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedActionCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
          <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}>
              {actionType === "enroll" ? (
                <FiPlusCircle size={32} color="#667eea" />
              ) : (
                <FiXCircle size={32} color="#EF4444" />
              )}
            </div>
            <h3 style={styles.modalTitle}>
              {actionType === "enroll" ? "Confirm Enrollment" : "Drop Course"}
            </h3>
            <p style={styles.modalMessage}>
              {actionType === "enroll" 
                ? `Are you sure you want to enroll in ${selectedActionCourse.name} (Division ${student?.division})?`
                : `Are you sure you want to drop ${selectedActionCourse.name}? This action can be undone by re-enrolling.`
              }
            </p>
            {actionType === "drop" && (
              <div style={styles.dropReasonContainer}>
                <label style={styles.dropReasonLabel}>Reason (Optional):</label>
                <select 
                  style={styles.dropReasonSelect}
                  value={dropReason}
                  onChange={(e) => setDropReason(e.target.value)}
                >
                  <option value="">Select a reason...</option>
                  <option value="Schedule conflict">Schedule conflict</option>
                  <option value="Change of major">Change of major</option>
                  <option value="Course too difficult">Course too difficult</option>
                  <option value="Instructor change">Instructor change</option>
                  <option value="Personal reasons">Personal reasons</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}
            <div style={styles.modalButtons}>
              <button style={styles.cancelModalBtn} onClick={() => setShowConfirmModal(false)}>
                Cancel
              </button>
              <button 
                style={actionType === "enroll" ? styles.confirmEnrollBtn : styles.confirmDropBtn}
                onClick={confirmAction}
                disabled={enrolling === selectedActionCourse?.id || dropping === selectedActionCourse?.id}
              >
                {actionType === "enroll" ? "Yes, Enroll Now" : "Yes, Drop Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Stats */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📚 {showEnrolledOnly ? "My Enrolled Courses" : "Available Courses"}</h2>
          <p style={styles.subtitle}>
            {showEnrolledOnly 
              ? `${displayedCourses.length} enrolled courses • Division ${student?.division}`
              : `${courses.length} courses available • ${enrolledCourseIds.length} enrolled • Division ${student?.division}`
            }
          </p>
        </div>
        <div style={styles.headerRight}>
          <button
            style={{
              ...styles.filterBtn,
              background: showEnrolledOnly ? "#667eea" : "white",
              color: showEnrolledOnly ? "white" : "#64748B",
              border: showEnrolledOnly ? "none" : "1px solid #E2E8F0"
            }}
            onClick={() => setShowEnrolledOnly(!showEnrolledOnly)}
          >
            <FiCheckCircle size={14} />
            {showEnrolledOnly ? "Show All Courses" : "Show My Enrolled"}
          </button>
          <button
            style={styles.refreshDataBtn}
            onClick={refreshAllData}
            title="Refresh data"
          >
            <FiRefreshCw size={14} />
          </button>
          <div style={styles.viewControls}>
            <button 
              style={{ ...styles.viewBtn, background: viewMode === "grid" ? "#667eea" : "transparent", color: viewMode === "grid" ? "white" : "#64748B" }}
              onClick={() => setViewMode("grid")}
            >
              <FiGrid size={14} /> Grid
            </button>
            <button 
              style={{ ...styles.viewBtn, background: viewMode === "list" ? "#667eea" : "transparent", color: viewMode === "list" ? "white" : "#64748B" }}
              onClick={() => setViewMode("list")}
            >
              <FiList size={14} /> List
            </button>
          </div>
        </div>
      </div>

      {/* Enrollment Stats Cards - only show when not in enrolled only view */}
      {!showEnrolledOnly && enrollmentStats && (
        <div style={styles.statsRow}>
          <div style={styles.statMiniCard}>
            <div style={styles.statMiniValue}>{enrollmentStats.active || 0}</div>
            <div style={styles.statMiniLabel}>Active Courses</div>
          </div>
          <div style={styles.statMiniCard}>
            <div style={styles.statMiniValue}>{enrollmentStats.completed || 0}</div>
            <div style={styles.statMiniLabel}>Completed</div>
          </div>
          <div style={styles.statMiniCard}>
            <div style={styles.statMiniValue}>{Math.round(enrollmentStats.averageMarks || 0)}%</div>
            <div style={styles.statMiniLabel}>Avg. Marks</div>
          </div>
          <div style={styles.statMiniCard}>
            <div style={styles.statMiniValue}>{Math.round(enrollmentStats.totalAttendance || 0)}%</div>
            <div style={styles.statMiniLabel}>Attendance</div>
          </div>
        </div>
      )}

      {/* No Enrolled Courses Message */}
      {showEnrolledOnly && displayedCourses.length === 0 && (
        <div style={styles.noEnrolledCard}>
          <div style={styles.noEnrolledIcon}>📚</div>
          <h3 style={styles.noEnrolledTitle}>No Enrolled Courses Yet</h3>
          <p style={styles.noEnrolledMessage}>
            You haven't enrolled in any courses yet. Browse available courses and start your learning journey!
          </p>
          <button 
            style={styles.browseCoursesBtn}
            onClick={() => setShowEnrolledOnly(false)}
          >
            Browse Available Courses
          </button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && displayedCourses.length > 0 && (
        <div style={styles.grid}>
          {displayedCourses.map((course) => {
            const enrolled = isEnrolled(course.id);
            const progress = getEnrollmentProgress(course.id);
            return (
              <div 
                key={course.id} 
                style={{
                  ...styles.courseCard,
                  transform: hoveredCard === course.id ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                  border: enrolled ? "2px solid #10B981" : "1px solid #E2E8F0"
                }}
                onMouseEnter={() => setHoveredCard(course.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ ...styles.cardHeader, background: course.gradient }}>
                  <div style={styles.headerTop}>
                    <div style={styles.cardIcon}>{course.icon}</div>
                    {enrolled ? (
                      <div style={styles.enrolledBadge}>
                        <FiCheckCircle size={12} /> Enrolled
                      </div>
                    ) : (
                      <div style={styles.availableBadge}>Available</div>
                    )}
                  </div>
                  <h3 style={styles.cardTitle}>{course.name}</h3>
                  <p style={styles.cardCode}>{course.code}</p>
                  <div style={styles.divisionBadge}>
                    <FiUsers size={10} /> Division {course.assignedDivision}
                  </div>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.instructorInfo}>
                    <FiUser size={14} />
                    <span>{course.instructor}</span>
                  </div>
                  <div style={styles.cardMeta}>
                    <div style={styles.metaItem}>
                      <FiBookmark size={12} />
                      <span>{course.unitsCount} Units</span>
                    </div>
                    <div style={styles.metaItem}>
                      <FiStar size={12} />
                      <span>{course.credits} Credits</span>
                    </div>
                    <div style={styles.metaItem}>
                      <FiCalendar size={12} />
                      <span>Sem {course.semester}</span>
                    </div>
                  </div>
                  
                  {enrolled && progress > 0 && (
                    <div style={styles.progressSection}>
                      <div style={styles.progressLabel}>
                        <span>Course Progress</span>
                        <span style={{ fontWeight: "bold" }}>{progress}%</span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                  
                  <p style={styles.courseDescription}>
                    {course.description.length > 100 
                      ? course.description.substring(0, 100) + "..." 
                      : course.description}
                  </p>
                  
                  <div style={styles.cardFooter}>
                    {enrolled ? (
                      <div style={styles.enrolledActions}>
                        <button
                          style={styles.continueBtn}
                          onClick={() => handleGoToCourse(course)}
                        >
                          <FiPlayCircle size={16} /> Continue
                        </button>
                        <button
                          style={styles.dropSmallBtn}
                          onClick={() => handleDropClick(course)}
                          disabled={dropping === course.id}
                          title="Drop Course"
                        >
                          {dropping === course.id ? (
                            <div style={styles.smallSpinner} />
                          ) : (
                            <FiXCircle size={14} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        style={styles.enrollBtn}
                        onClick={() => handleEnrollClick(course)}
                        disabled={enrolling === course.id}
                      >
                        {enrolling === course.id ? (
                          <>
                            <div style={styles.smallSpinner} />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <FiPlusCircle size={16} /> Enroll Now
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && displayedCourses.length > 0 && (
        <div style={styles.list}>
          {displayedCourses.map((course) => {
            const enrolled = isEnrolled(course.id);
            const progress = getEnrollmentProgress(course.id);
            return (
              <div 
                key={course.id} 
                style={{
                  ...styles.listItem,
                  borderLeft: enrolled ? "4px solid #10B981" : "4px solid transparent"
                }}
              >
                <div style={{ ...styles.listIcon, background: course.gradient }}>{course.icon}</div>
                <div style={styles.listInfo}>
                  <h4 style={styles.listTitle}>{course.name}</h4>
                  <p style={styles.listCode}>{course.code}</p>
                  <div style={styles.listMeta}>
                    <span><FiUser size={12} /> {course.instructor}</span>
                    <span><FiBookmark size={12} /> {course.unitsCount} Units</span>
                    <span><FiStar size={12} /> {course.credits} Credits</span>
                    <span><FiUsers size={12} /> Div {course.assignedDivision}</span>
                  </div>
                  {enrolled && progress > 0 && (
                    <div style={styles.listProgressContainer}>
                      <div style={styles.listProgressBar}>
                        <div style={{ ...styles.listProgressFill, width: `${progress}%` }} />
                      </div>
                      <span style={styles.listProgressText}>{progress}%</span>
                    </div>
                  )}
                </div>
                <div style={styles.listActions}>
                  {enrolled ? (
                    <>
                      <button
                        style={styles.listContinueBtn}
                        onClick={() => handleGoToCourse(course)}
                      >
                        <FiPlayCircle size={14} /> Continue
                      </button>
                      <button
                        style={styles.listDropBtn}
                        onClick={() => handleDropClick(course)}
                        disabled={dropping === course.id}
                        title="Drop Course"
                      >
                        {dropping === course.id ? (
                          <div style={styles.smallSpinner} />
                        ) : (
                          <FiXCircle size={14} />
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      style={styles.listEnrollBtn}
                      onClick={() => handleEnrollClick(course)}
                      disabled={enrolling === course.id}
                    >
                      {enrolling === course.id ? (
                        <>
                          <div style={styles.smallSpinner} />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          <FiPlusCircle size={14} /> Enroll
                        </>
                      )}
                    </button>
                  )}
                </div>
                <FiChevronRight size={20} style={{ color: "#CBD5E1" }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Styles (keeping all existing styles)
const styles = {
  container: {
    padding: "28px",
    maxWidth: "1400px",
    margin: "0 auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px"
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap"
  },
  refreshDataBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "white",
    border: "1px solid #E2E8F0",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  filterBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: "4px"
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748B"
  },
  statsRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "28px",
    flexWrap: "wrap"
  },
  statMiniCard: {
    background: "white",
    borderRadius: "16px",
    padding: "16px 24px",
    textAlign: "center",
    minWidth: "120px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid #E2E8F0"
  },
  statMiniValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#667eea"
  },
  statMiniLabel: {
    fontSize: "12px",
    color: "#64748B",
    marginTop: "4px"
  },
  viewControls: {
    display: "flex",
    gap: "8px",
    background: "white",
    padding: "4px",
    borderRadius: "12px",
    border: "1px solid #E2E8F0"
  },
  viewBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 18px",
    borderRadius: "8px",
    border: "none",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: "24px"
  },
  courseCard: {
    background: "white",
    borderRadius: "24px",
    overflow: "hidden",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
    cursor: "pointer"
  },
  cardHeader: {
    padding: "24px",
    color: "white"
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  cardIcon: {
    width: "56px",
    height: "56px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)"
  },
  enrolledBadge: {
    padding: "4px 10px",
    background: "rgba(16,185,129,0.9)",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  availableBadge: {
    padding: "4px 10px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500"
  },
  divisionBadge: {
    display: "inline-block",
    padding: "2px 8px",
    background: "rgba(255,255,255,0.15)",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "500",
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    width: "fit-content"
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "6px",
    letterSpacing: "-0.3px"
  },
  cardCode: {
    fontSize: "12px",
    opacity: 0.85
  },
  cardBody: {
    padding: "20px"
  },
  instructorInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#475569",
    marginBottom: "14px"
  },
  cardMeta: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
    flexWrap: "wrap"
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#64748B",
    padding: "4px 10px",
    background: "#F1F5F9",
    borderRadius: "20px"
  },
  progressSection: {
    marginBottom: "12px"
  },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: "#475569",
    marginBottom: "6px"
  },
  progressBar: {
    height: "4px",
    background: "#E2E8F0",
    borderRadius: "2px",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    background: "#10B981",
    borderRadius: "2px",
    transition: "width 0.3s ease"
  },
  courseDescription: {
    fontSize: "13px",
    color: "#64748B",
    lineHeight: "1.5",
    marginBottom: "16px"
  },
  cardFooter: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: "14px",
    borderTop: "1px solid #F1F5F9"
  },
  enrolledActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  continueBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#10B981",
    color: "white",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s ease",
    cursor: "pointer"
  },
  dropSmallBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    border: "1px solid #EF4444",
    background: "white",
    color: "#EF4444",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  enrollBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#667eea",
    color: "white",
    fontWeight: "600",
    fontSize: "13px",
    transition: "all 0.2s ease",
    cursor: "pointer"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background: "white",
    borderRadius: "18px",
    padding: "16px 20px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  listIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white"
  },
  listInfo: {
    flex: 1
  },
  listTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "4px"
  },
  listCode: {
    fontSize: "11px",
    color: "#64748B",
    marginBottom: "8px"
  },
  listMeta: {
    display: "flex",
    gap: "16px",
    fontSize: "11px",
    color: "#94A3B8",
    flexWrap: "wrap"
  },
  listProgressContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "8px"
  },
  listProgressBar: {
    flex: 1,
    height: "4px",
    background: "#E2E8F0",
    borderRadius: "2px",
    overflow: "hidden"
  },
  listProgressFill: {
    height: "100%",
    background: "#10B981",
    borderRadius: "2px",
    transition: "width 0.3s ease"
  },
  listProgressText: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#10B981"
  },
  listActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  listEnrollBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  listContinueBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    background: "#10B981",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  listDropBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    background: "white",
    color: "#EF4444",
    border: "1px solid #EF4444",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh"
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "3px solid #E2E8F0",
    borderTopColor: "#667eea",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  smallSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite"
  },
  errorCard: {
    textAlign: "center",
    padding: "60px",
    background: "white",
    borderRadius: "20px",
    margin: "28px"
  },
  retryBtn: {
    marginTop: "20px",
    padding: "10px 24px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer"
  },
  emptyCard: {
    textAlign: "center",
    padding: "80px",
    background: "white",
    borderRadius: "20px",
    margin: "28px"
  },
  noEnrolledCard: {
    textAlign: "center",
    padding: "60px",
    background: "white",
    borderRadius: "20px",
    margin: "28px",
    border: "1px solid #E2E8F0"
  },
  noEnrolledIcon: {
    fontSize: "64px",
    marginBottom: "20px"
  },
  noEnrolledTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: "12px"
  },
  noEnrolledMessage: {
    fontSize: "14px",
    color: "#64748B",
    marginBottom: "24px",
    maxWidth: "400px",
    marginLeft: "auto",
    marginRight: "auto"
  },
  browseCoursesBtn: {
    padding: "12px 28px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  // Modal Styles
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
    background: "white",
    borderRadius: "28px",
    width: "420px",
    maxWidth: "90%",
    padding: "32px",
    textAlign: "center",
    animation: "scaleIn 0.3s ease",
    boxShadow: "0 25px 50px rgba(0,0,0,0.3)"
  },
  successModalContainer: {
    background: "white",
    borderRadius: "28px",
    width: "450px",
    maxWidth: "90%",
    padding: "40px",
    textAlign: "center",
    animation: "scaleIn 0.3s ease",
    boxShadow: "0 25px 50px rgba(0,0,0,0.3)"
  },
  successIcon: {
    animation: "checkmark 0.5s ease forwards",
    marginBottom: "20px"
  },
  successTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: "12px"
  },
  successMessage: {
    fontSize: "14px",
    color: "#64748B",
    marginBottom: "24px"
  },
  successDetails: {
    background: "#F8FAFC",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "24px",
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    flexWrap: "wrap"
  },
  successDetailItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#475569"
  },
  successButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center"
  },
  startLearningBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    background: "#10B981",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  closeSuccessBtn: {
    padding: "12px 24px",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    background: "white",
    color: "#64748B",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  modalIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#EEF2FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px"
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: "12px"
  },
  modalMessage: {
    fontSize: "14px",
    color: "#64748B",
    marginBottom: "20px",
    lineHeight: "1.6"
  },
  dropReasonContainer: {
    marginBottom: "24px",
    textAlign: "left"
  },
  dropReasonLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "8px",
    display: "block"
  },
  dropReasonSelect: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    fontSize: "13px",
    background: "white"
  },
  modalButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center"
  },
  cancelModalBtn: {
    padding: "10px 20px",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    background: "white",
    color: "#64748B",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  confirmEnrollBtn: {
    padding: "10px 24px",
    borderRadius: "12px",
    border: "none",
    background: "#667eea",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  confirmDropBtn: {
    padding: "10px 24px",
    borderRadius: "12px",
    border: "none",
    background: "#EF4444",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  }
};

// Helper functions
const getGradient = (index) => {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
  ];
  return gradients[index % gradients.length];
};

const getSubjectIcon = (subjectName) => {
  return <FiBookOpen size={32} />;
};

export default StudentCourses;