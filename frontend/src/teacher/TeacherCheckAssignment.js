import React, { useState, useEffect } from "react";
import {
  FiClipboard,
  FiDownload,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiStar,
  FiUser,
  FiCalendar,
  FiAlertCircle,
  FiRefreshCw,
  FiSend,
  FiEye,
  FiMessageSquare,
  FiFileText,
  FiUsers,
  FiTrendingUp,
  FiAward
} from "react-icons/fi";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const TeacherCheckAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradingMarks, setGradingMarks] = useState({});
  const [gradingFeedback, setGradingFeedback] = useState({});
  const [gradingLoading, setGradingLoading] = useState({});
  const [teacher, setTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Get teacher data from localStorage
  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        console.log("=== Loading Teacher Data ===");
        
        let teacherData = localStorage.getItem("teacher");
        
        if (!teacherData) {
          teacherData = localStorage.getItem("user");
        }
        
        console.log("Raw teacher data from localStorage:", teacherData);
        
        if (teacherData) {
          try {
            const parsed = JSON.parse(teacherData);
            console.log("Parsed teacher data:", parsed);
            setTeacher(parsed);
          } catch (e) {
            console.error("Error parsing teacher data:", e);
          }
        }
        
        const userId = localStorage.getItem("userId");
        const role = localStorage.getItem("role");
        
        if (!teacherData && userId && role === "teacher") {
          console.log("Fetching teacher from API with userId:", userId);
          const token = localStorage.getItem("token");
          const response = await axios.get(`${API_BASE_URL}/teachers/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data) {
            console.log("Teacher from API:", response.data);
            setTeacher(response.data);
            localStorage.setItem("teacher", JSON.stringify(response.data));
          }
        }
      } catch (err) {
        console.error("Error loading teacher data:", err);
      }
    };
    
    loadTeacherData();
  }, []);

  // Fetch teacher's assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        toast.error("Please login again");
        setLoading(false);
        return;
      }
      
      const teacherId = teacher?.id || teacher?._id || teacher?.teacherId;
      
      console.log("Teacher ID for fetching assignments:", teacherId);
      
      if (!teacherId) {
        console.error("No teacher ID found");
        toast.error("Teacher ID not found. Please login again.");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/assignments/teacher/${teacherId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log("Assignments response:", response.data);
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to load assignments: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch submissions for a specific assignment
  const fetchSubmissions = async (assignmentId) => {
    try {
      setSubmissionsLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `${API_BASE_URL}/assignments/submissions/assignment/${assignmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log("Submissions response:", response.data);
      setSubmissions(response.data.submissions || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions: " + (error.response?.data?.message || error.message));
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Handle assignment selection
  const handleAssignmentClick = async (assignment) => {
    setSelectedAssignment(assignment);
    await fetchSubmissions(assignment._id);
  };

  // Initialize grading states when submissions change
  useEffect(() => {
    const marksInit = {};
    const feedbackInit = {};
    submissions.forEach(sub => {
      marksInit[sub._id] = sub.marks || "";
      feedbackInit[sub._id] = sub.feedback || "";
    });
    setGradingMarks(marksInit);
    setGradingFeedback(feedbackInit);
  }, [submissions]);

  // Handle grading submission
  const handleGradeSubmit = async (submissionId, assignmentId) => {
    const marks = gradingMarks[submissionId];
    const feedback = gradingFeedback[submissionId];

    if (marks === undefined || marks === "") {
      toast.error("Please enter marks");
      return;
    }

    if (marks < 0 || marks > selectedAssignment?.totalMarks) {
      toast.error(`Marks should be between 0 and ${selectedAssignment?.totalMarks}`);
      return;
    }

    setGradingLoading(prev => ({ ...prev, [submissionId]: true }));

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/assignments/submissions/${submissionId}/grade`,
        {
          marks: parseInt(marks),
          feedback: feedback || "",
          assignmentId: assignmentId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success("Assignment graded successfully!");
        
        setSubmissions(prev => prev.map(sub => 
          sub._id === submissionId 
            ? { ...sub, marks: parseInt(marks), feedback: feedback || "", status: "graded", gradedAt: new Date() }
            : sub
        ));
        
        fetchAssignments();
      } else {
        toast.error(response.data.message || "Failed to grade assignment");
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error(error.response?.data?.message || "Failed to grade assignment");
    } finally {
      setGradingLoading(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  // Download submission file
  const downloadSubmission = (filename, originalName) => {
    window.open(`${API_BASE_URL}/assignments/download-submission/${filename}`, '_blank');
  };

  // Download assignment file
  const downloadAssignmentFile = (filename, originalName) => {
    window.open(`${API_BASE_URL}/assignments/download/${filename}`, '_blank');
  };

  // Calculate statistics for selected assignment
  const getAssignmentStats = () => {
    if (!submissions.length) return { total: 0, submitted: 0, graded: 0, pending: 0, averageMarks: 0, passRate: 0 };
    
    const submitted = submissions.length;
    const graded = submissions.filter(s => s.status === "graded").length;
    const pending = submitted - graded;
    
    const gradedSubmissions = submissions.filter(s => s.marks !== null && s.marks !== undefined);
    const totalMarks = gradedSubmissions.reduce((sum, s) => sum + (s.marks || 0), 0);
    const averageMarks = gradedSubmissions.length > 0 ? (totalMarks / gradedSubmissions.length).toFixed(1) : 0;
    
    const passingMarks = selectedAssignment?.totalMarks * 0.4;
    const passedCount = gradedSubmissions.filter(s => s.marks >= passingMarks).length;
    const passRate = gradedSubmissions.length > 0 ? ((passedCount / gradedSubmissions.length) * 100).toFixed(1) : 0;
    
    return {
      total: submitted,
      submitted,
      graded,
      pending,
      averageMarks,
      passRate
    };
  };

  // Filter submissions based on search term and status
  const getFilteredSubmissions = () => {
    let filtered = [...submissions];
    
    if (filterStatus === "graded") {
      filtered = filtered.filter(s => s.status === "graded");
    } else if (filterStatus === "pending") {
      filtered = filtered.filter(s => s.status === "submitted");
    }
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch assignments when teacher is loaded
  useEffect(() => {
    if (teacher?.id || teacher?._id) {
      console.log("Teacher loaded, fetching assignments...");
      fetchAssignments();
    }
  }, [teacher]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading assignments...</p>
      </div>
    );
  }

  const stats = selectedAssignment ? getAssignmentStats() : null;
  const filteredSubmissions = getFilteredSubmissions();

  return (
    <div style={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📝 Assignment Grading</h1>
          <p style={styles.subtitle}>View student submissions and grade assignments</p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchAssignments}>
          <FiRefreshCw size={16} /> Refresh
        </button>
      </div>

      <div style={styles.twoColumnLayout}>
        {/* Left Sidebar - Assignments List */}
        <div style={styles.assignmentsSidebar}>
          <h3 style={styles.sidebarTitle}>
            <FiClipboard size={18} /> My Assignments
            <span style={styles.assignmentCount}>{assignments.length}</span>
          </h3>
          
          {assignments.length === 0 ? (
            <div style={styles.noAssignments}>
              <FiFileText size={48} style={{ opacity: 0.5 }} />
              <p>No assignments created yet</p>
              <p style={{ fontSize: "12px", color: "#94A3B8" }}>
                Create assignments from the Assignments tab
              </p>
            </div>
          ) : (
            <div style={styles.assignmentsList}>
              {assignments.map(assignment => {
                const isSelected = selectedAssignment?._id === assignment._id;
                const isExpired = new Date(assignment.deadline) < new Date();
                
                return (
                  <div
                    key={assignment._id}
                    style={{
                      ...styles.assignmentItem,
                      background: isSelected ? "#667eea15" : "white",
                      borderLeft: isSelected ? "4px solid #667eea" : "4px solid transparent"
                    }}
                    onClick={() => handleAssignmentClick(assignment)}
                  >
                    <div style={styles.assignmentItemHeader}>
                      <div style={styles.assignmentTitle}>{assignment.title}</div>
                      {isExpired && (
                        <div style={styles.expiredBadge}>Expired</div>
                      )}
                    </div>
                    <div style={styles.assignmentMeta}>
                      <span style={styles.assignmentSubject}>
                        {assignment.subjectId?.name || "Unknown Subject"}
                      </span>
                      <span style={styles.assignmentDeadline}>
                        <FiClock size={10} /> Due: {new Date(assignment.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={styles.assignmentStats}>
                      <span style={styles.assignmentStat}>
                        <FiStar size={10} /> Marks: {assignment.totalMarks}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel - Submissions and Grading - FIXED SIZING */}
        <div style={styles.gradingPanel}>
          {!selectedAssignment ? (
            <div style={styles.noSelection}>
              <FiClipboard size={64} style={{ opacity: 0.5, marginBottom: "20px" }} />
              <h3>Select an Assignment</h3>
              <p>Choose an assignment from the left to view and grade submissions</p>
            </div>
          ) : (
            <div style={styles.gradingContent}>
              {/* Assignment Details Header */}
              <div style={styles.assignmentDetailsHeader}>
                <div>
                  <h2 style={styles.assignmentDetailsTitle}>{selectedAssignment.title}</h2>
                  <div style={styles.assignmentDetailsMeta}>
                    <span>📖 {selectedAssignment.subjectId?.name}</span>
                    <span>⭐ Total Marks: {selectedAssignment.totalMarks}</span>
                    <span>🕐 Due: {new Date(selectedAssignment.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                {selectedAssignment.assignmentFile && (
                  <button 
                    style={styles.downloadAssignmentBtn}
                    onClick={() => downloadAssignmentFile(
                      selectedAssignment.assignmentFile.filename,
                      selectedAssignment.assignmentFile.originalName
                    )}
                  >
                    <FiDownload size={14} /> Download Assignment
                  </button>
                )}
              </div>

              {/* Statistics Cards */}
              {stats && (
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, background: "#667eea15", color: "#667eea" }}>
                      <FiUsers size={20} />
                    </div>
                    <div>
                      <div style={styles.statValue}>{stats.submitted}</div>
                      <div style={styles.statLabel}>Total Submissions</div>
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, background: "#10B98115", color: "#10B981" }}>
                      <FiCheckCircle size={20} />
                    </div>
                    <div>
                      <div style={styles.statValue}>{stats.graded}</div>
                      <div style={styles.statLabel}>Graded</div>
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, background: "#F59E0B15", color: "#F59E0B" }}>
                      <FiClock size={20} />
                    </div>
                    <div>
                      <div style={styles.statValue}>{stats.pending}</div>
                      <div style={styles.statLabel}>Pending</div>
                    </div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={{ ...styles.statIcon, background: "#8B5CF615", color: "#8B5CF6" }}>
                      <FiTrendingUp size={20} />
                    </div>
                    <div>
                      <div style={styles.statValue}>{stats.averageMarks}</div>
                      <div style={styles.statLabel}>Average Marks</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div style={styles.filtersContainer}>
                <div style={styles.searchBox}>
                  <FiUser size={14} style={{ color: "#94A3B8" }} />
                  <input
                    type="text"
                    placeholder="Search by student name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>
                <div style={styles.statusFilters}>
                  <button
                    style={{ ...styles.filterBtn, background: filterStatus === "all" ? "#667eea" : "#F1F5F9", color: filterStatus === "all" ? "white" : "#64748B" }}
                    onClick={() => setFilterStatus("all")}
                  >
                    All ({stats?.total || 0})
                  </button>
                  <button
                    style={{ ...styles.filterBtn, background: filterStatus === "pending" ? "#F59E0B" : "#F1F5F9", color: filterStatus === "pending" ? "white" : "#64748B" }}
                    onClick={() => setFilterStatus("pending")}
                  >
                    Pending ({stats?.pending || 0})
                  </button>
                  <button
                    style={{ ...styles.filterBtn, background: filterStatus === "graded" ? "#10B981" : "#F1F5F9", color: filterStatus === "graded" ? "white" : "#64748B" }}
                    onClick={() => setFilterStatus("graded")}
                  >
                    Graded ({stats?.graded || 0})
                  </button>
                </div>
              </div>

              {/* Submissions List - Scrollable Area */}
              <div style={styles.submissionsContainer}>
                {submissionsLoading ? (
                  <div style={styles.submissionsLoading}>
                    <div style={styles.smallSpinner} />
                    <p>Loading submissions...</p>
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div style={styles.noSubmissions}>
                    <FiUsers size={48} style={{ opacity: 0.5 }} />
                    <h4>No submissions yet</h4>
                    <p>Students haven't submitted this assignment yet</p>
                  </div>
                ) : (
                  <div style={styles.submissionsList}>
                    {filteredSubmissions.map((submission) => (
                      <div key={submission._id} style={styles.submissionCard}>
                        <div style={styles.submissionHeader}>
                          <div style={styles.studentInfo}>
                            <div style={styles.studentAvatar}>
                              {submission.studentId?.name?.charAt(0) || "S"}
                            </div>
                            <div>
                              <div style={styles.studentName}>
                                {submission.studentId?.name || "Unknown Student"}
                              </div>
                              <div style={styles.studentEmail}>
                                {submission.studentId?.email || "No email"}
                              </div>
                            </div>
                          </div>
                          <div style={styles.submissionStatus}>
                            {submission.status === "graded" ? (
                              <div style={styles.gradedBadge}>
                                <FiCheckCircle size={12} /> Graded
                              </div>
                            ) : (
                              <div style={styles.pendingBadge}>
                                <FiClock size={12} /> Pending
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={styles.submissionDetails}>
                          <div style={styles.submissionMeta}>
                            <span><FiCalendar size={12} /> Submitted: {formatDate(submission.submittedAt)}</span>
                            <span><FiFileText size={12} /> {submission.originalName}</span>
                          </div>
                          
                          <button
                            style={styles.viewSubmissionBtn}
                            onClick={() => downloadSubmission(submission.fileName, submission.originalName)}
                          >
                            <FiDownload size={14} /> Download
                          </button>
                        </div>

                        {/* Grading Section */}
                        <div style={styles.gradingSection}>
                          <div style={styles.gradingRow}>
                            <div style={styles.marksInputGroup}>
                              <label style={styles.gradingLabel}>Marks</label>
                              <div style={styles.marksWrapper}>
                                <input
                                  type="number"
                                  value={gradingMarks[submission._id] || ""}
                                  onChange={(e) => setGradingMarks(prev => ({ ...prev, [submission._id]: e.target.value }))}
                                  placeholder={`0-${selectedAssignment.totalMarks}`}
                                  style={styles.marksInput}
                                  min="0"
                                  max={selectedAssignment.totalMarks}
                                  disabled={submission.status === "graded"}
                                />
                                <span style={styles.maxMarks}>/ {selectedAssignment.totalMarks}</span>
                              </div>
                            </div>
                            <div style={styles.feedbackInputGroup}>
                              <label style={styles.gradingLabel}>Feedback</label>
                              <textarea
                                value={gradingFeedback[submission._id] || ""}
                                onChange={(e) => setGradingFeedback(prev => ({ ...prev, [submission._id]: e.target.value }))}
                                placeholder="Enter feedback for student..."
                                style={styles.feedbackInput}
                                rows="2"
                                disabled={submission.status === "graded"}
                              />
                            </div>
                            <button
                              style={{
                                ...styles.gradeBtn,
                                background: submission.status === "graded" ? "#10B981" : "#667eea",
                                opacity: gradingLoading[submission._id] ? 0.7 : 1
                              }}
                              onClick={() => handleGradeSubmit(submission._id, selectedAssignment._id)}
                              disabled={gradingLoading[submission._id] || submission.status === "graded"}
                            >
                              {gradingLoading[submission._id] ? (
                                <>
                                  <div style={styles.smallSpinner} />
                                  Saving...
                                </>
                              ) : submission.status === "graded" ? (
                                <>
                                  <FiCheckCircle size={14} /> Graded
                                </>
                              ) : (
                                <>
                                  <FiSend size={14} /> Submit
                                </>
                              )}
                            </button>
                          </div>
                          
                          {submission.status === "graded" && submission.marks !== null && (
                            <div style={styles.gradedInfo}>
                              <div style={styles.marksDisplay}>
                                <FiAward size={14} color="#10B981" />
                                <span>Marks: <strong>{submission.marks}/{selectedAssignment.totalMarks}</strong></span>
                              </div>
                              {submission.feedback && (
                                <div style={styles.feedbackDisplay}>
                                  <FiMessageSquare size={12} />
                                  <span>{submission.feedback}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// FIXED STYLES - Proper sizing and scrolling
const styles = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "32px 28px",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)"
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "32px"
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: "8px"
  },
  subtitle: {
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
  twoColumnLayout: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "24px",
    height: "calc(100vh - 160px)"
  },
  assignmentsSidebar: {
    background: "white",
    borderRadius: "20px",
    border: "1px solid #E2E8F0",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "100%"
  },
  sidebarTitle: {
    padding: "20px",
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#0F172A",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "space-between",
    flexShrink: 0
  },
  assignmentCount: {
    background: "#667eea15",
    color: "#667eea",
    padding: "2px 10px",
    borderRadius: "20px",
    fontSize: "12px"
  },
  assignmentsList: {
    padding: "12px",
    overflowY: "auto",
    flex: 1
  },
  assignmentItem: {
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid #E2E8F0"
  },
  assignmentItemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },
  assignmentTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0F172A"
  },
  expiredBadge: {
    fontSize: "10px",
    padding: "2px 8px",
    background: "#EF444415",
    color: "#EF4444",
    borderRadius: "20px"
  },
  assignmentMeta: {
    display: "flex",
    gap: "12px",
    fontSize: "11px",
    color: "#64748B",
    marginBottom: "8px"
  },
  assignmentSubject: {
    color: "#667eea"
  },
  assignmentDeadline: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  assignmentStats: {
    display: "flex",
    gap: "12px",
    fontSize: "11px",
    color: "#94A3B8"
  },
  assignmentStat: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  noAssignments: {
    textAlign: "center",
    padding: "48px 20px",
    color: "#94A3B8"
  },
  gradingPanel: {
    background: "white",
    borderRadius: "20px",
    border: "1px solid #E2E8F0",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  gradingContent: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    padding: "24px"
  },
  noSelection: {
    textAlign: "center",
    padding: "80px 20px",
    color: "#94A3B8",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  assignmentDetailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #E2E8F0",
    flexShrink: 0
  },
  assignmentDetailsTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: "8px"
  },
  assignmentDetailsMeta: {
    display: "flex",
    gap: "16px",
    fontSize: "12px",
    color: "#64748B",
    flexWrap: "wrap"
  },
  downloadAssignmentBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    background: "#F1F5F9",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    color: "#667eea"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    marginBottom: "20px",
    flexShrink: 0
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    background: "#F8FAFC",
    borderRadius: "12px",
    border: "1px solid #E2E8F0"
  },
  statIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0F172A"
  },
  statLabel: {
    fontSize: "10px",
    color: "#64748B"
  },
  filtersContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "16px",
    flexShrink: 0
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    flex: 1,
    maxWidth: "260px"
  },
  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "12px",
    width: "100%"
  },
  statusFilters: {
    display: "flex",
    gap: "8px"
  },
  filterBtn: {
    padding: "4px 12px",
    borderRadius: "16px",
    border: "none",
    fontSize: "11px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  submissionsContainer: {
    flex: 1,
    overflowY: "auto",
    minHeight: 0
  },
  submissionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingBottom: "8px"
  },
  submissionsLoading: {
    textAlign: "center",
    padding: "40px",
    color: "#64748B"
  },
  noSubmissions: {
    textAlign: "center",
    padding: "40px",
    color: "#94A3B8"
  },
  submissionCard: {
    background: "#F8FAFC",
    borderRadius: "14px",
    padding: "16px",
    border: "1px solid #E2E8F0"
  },
  submissionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  studentInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  studentAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#667eea",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "14px"
  },
  studentName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0F172A"
  },
  studentEmail: {
    fontSize: "10px",
    color: "#64748B"
  },
  submissionStatus: {
    display: "flex",
    gap: "8px"
  },
  gradedBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    background: "#10B98115",
    color: "#10B981",
    borderRadius: "16px",
    fontSize: "10px",
    fontWeight: "500"
  },
  pendingBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    background: "#F59E0B15",
    color: "#F59E0B",
    borderRadius: "16px",
    fontSize: "10px",
    fontWeight: "500"
  },
  submissionDetails: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "12px",
    padding: "8px",
    background: "white",
    borderRadius: "10px"
  },
  submissionMeta: {
    display: "flex",
    gap: "12px",
    fontSize: "10px",
    color: "#64748B"
  },
  viewSubmissionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    background: "#667eea15",
    color: "#667eea",
    border: "none",
    borderRadius: "6px",
    fontSize: "10px",
    cursor: "pointer"
  },
  gradingSection: {
    borderTop: "1px solid #E2E8F0",
    paddingTop: "12px"
  },
  gradingRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    flexWrap: "wrap"
  },
  marksInputGroup: {
    flex: 1,
    minWidth: "120px"
  },
  feedbackInputGroup: {
    flex: 2,
    minWidth: "160px"
  },
  gradingLabel: {
    display: "block",
    fontSize: "10px",
    fontWeight: "500",
    color: "#64748B",
    marginBottom: "4px"
  },
  marksWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  marksInput: {
    width: "70px",
    padding: "6px 10px",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    fontSize: "12px",
    outline: "none"
  },
  maxMarks: {
    fontSize: "11px",
    color: "#64748B"
  },
  feedbackInput: {
    width: "100%",
    padding: "6px 10px",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    fontSize: "11px",
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none"
  },
  gradeBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 16px",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: "500",
    fontSize: "11px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    height: "34px"
  },
  gradedInfo: {
    marginTop: "10px",
    padding: "8px 12px",
    background: "#10B98108",
    borderRadius: "8px",
    border: "1px solid #10B98120"
  },
  marksDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    marginBottom: "6px"
  },
  feedbackDisplay: {
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    fontSize: "11px",
    color: "#475569"
  }
};

export default TeacherCheckAssignment;