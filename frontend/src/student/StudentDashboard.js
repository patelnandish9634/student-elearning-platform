import React, { useState, useEffect, useRef } from "react";
import {
  FiBookOpen,
  FiClipboard,
  FiCalendar,
  FiClock,
  FiAward,
  FiTrendingUp,
  FiStar,
  FiAlertCircle,
  FiThumbsUp,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiUser,
  FiActivity,
  FiLoader,
  FiRefreshCw,
  FiUsers,
  FiBookmark,
  FiGrid,
  FiList,
  FiMail,
  FiTarget,
  FiFileText,
  FiArrowUp,
  FiArrowRight,
  FiX,
  FiBarChart2,
  FiDatabase,
  FiServer,
  FiCpu,
  FiGlobe,
  FiCode,
  FiShield,
  FiCloud,
  FiPlusCircle,
  FiPlayCircle,
  FiXCircle,
  FiTerminal,
  FiDownload,
  FiLock,
  FiUnlock,
  FiSend,
  FiCopy,
  FiBell
} from "react-icons/fi";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CourseContentView from "./CourseContentView";
import UniversalCompiler from "../components/UniversalCompiler";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const token = localStorage.getItem("token");

const axiosConfig = {
  headers: { Authorization: `Bearer ${token}` }
};

// ==================== ENROLLMENT HOOK ====================
const useEnrollment = (student, onEnrollmentChange) => {
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [enrolling, setEnrolling] = useState(null);
  const [dropping, setDropping] = useState(null);

  const fetchEnrolledCourses = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/enrollments/student/${student?.id}`,
        axiosConfig
      );
      
      const enrolledIds = [];
      response.data.enrollments.forEach(enrollment => {
        let subjectId = enrollment.subjectId?._id || enrollment.subjectId;
        if (subjectId) {
          enrolledIds.push(subjectId);
        }
      });
      
      setEnrolledCourseIds(enrolledIds);
      if (onEnrollmentChange) onEnrollmentChange(enrolledIds.length);
      
    } catch (err) {
      console.error("Error fetching enrolled courses:", err);
      setEnrolledCourseIds([]);
    }
  };

  const handleEnroll = async (course, onSuccess) => {
    setEnrolling(course.id);
    
    try {
      if (enrolledCourseIds.includes(course.id)) {
        toast.info(`You are already enrolled in ${course.name}`);
        setEnrolling(null);
        return false;
      }
      
      const enrollmentData = {
        studentId: student?.id,
        subjectId: course.id,
        division: student?.division,
        academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        semester: student?.semester
      };
      
      const response = await axios.post(
        `${API_BASE_URL}/enrollments/add`,
        enrollmentData,
        axiosConfig
      );
      
      if (response.data.success) {
        setEnrolledCourseIds(prev => [...prev, course.id]);
        toast.success(response.data.message || `Successfully enrolled in ${course.name}! 🎉`);
        await fetchEnrolledCourses();
        if (onSuccess) onSuccess(course);
        return true;
      }
      
    } catch (err) {
      console.error("Error enrolling:", err);
      toast.error(err.response?.data?.message || "Failed to enroll. Please try again.");
      return false;
    } finally {
      setEnrolling(null);
    }
  };

  const handleDrop = async (course) => {
    setDropping(course.id);
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/enrollments/student/${student?.id}`,
        axiosConfig
      );
      
      const enrollment = response.data.enrollments.find(
        e => (e.subjectId?._id || e.subjectId) === course.id
      );
      
      if (enrollment) {
        await axios.put(
          `${API_BASE_URL}/enrollments/${enrollment._id}/drop`,
          { reason: "Student requested drop" },
          axiosConfig
        );
        
        setEnrolledCourseIds(prev => prev.filter(id => id !== course.id));
        toast.info(`Successfully dropped from ${course.name}`);
        await fetchEnrolledCourses();
      }
    } catch (err) {
      console.error("Error dropping course:", err);
      toast.error(err.response?.data?.message || "Failed to drop course");
    } finally {
      setDropping(null);
    }
  };

  useEffect(() => {
    if (student?.id) {
      fetchEnrolledCourses();
    }
  }, [student?.id]);

  return {
    enrolledCourseIds,
    enrolling,
    dropping,
    handleEnroll,
    handleDrop,
    refreshEnrollments: fetchEnrolledCourses
  };
};

// ==================== CERTIFICATE MODAL COMPONENT (UPDATED WITH SIGNATURE AND TEACHER NAME) ====================
const CertificateModal = ({ certificate, onClose }) => {
  const certificateRef = useRef(null);

  const downloadCertificateAsHTML = () => {
    if (!certificateRef.current) return;
    
    const certificateHTML = certificateRef.current.outerHTML;
    const blob = new Blob([certificateHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificate_${certificate.courseName?.replace(/\s/g, '_') || 'Course'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Certificate downloaded successfully!");
  };

  return (
    <div style={certificateModalStyles.overlay} onClick={onClose}>
      <div style={certificateModalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={certificateModalStyles.closeBtn} onClick={onClose}>×</div>
        
        <div ref={certificateRef} style={certificateModalStyles.certificateWrapper}>
          <div style={certificateModalStyles.certificate}>
            <div style={certificateModalStyles.topBorder}></div>
            
            <div style={certificateModalStyles.logoContainer}>
              <div style={certificateModalStyles.logoIcon}>🎓</div>
              <div style={certificateModalStyles.universityName}>LJ UNIVERSITY</div>
              <div style={certificateModalStyles.universityTagline}>Empowering Minds, Shaping Futures</div>
            </div>
            
            <div style={certificateModalStyles.watermark}>LJ UNIVERSITY</div>
            
            <h1 style={certificateModalStyles.title}>CERTIFICATE OF COMPLETION</h1>
            
            <p style={certificateModalStyles.awardedTo}>This certificate is proudly presented to</p>
            <h2 style={certificateModalStyles.studentName}>{certificate.studentName || "Student"}</h2>
            
            <p style={certificateModalStyles.completionText}>for successfully completing the course</p>
            <h3 style={certificateModalStyles.courseName}>{certificate.courseName}</h3>
            
            {/* Teacher Name Section */}
            <div style={certificateModalStyles.teacherSection}>
              <span style={certificateModalStyles.teacherLabel}>Course Instructor:</span>
              <span style={certificateModalStyles.teacherValue}>{certificate.teacherName || "Prof. Sarah Johnson"}</span>
            </div>
            
            <div style={certificateModalStyles.gradeSection}>
              <span style={certificateModalStyles.gradeLabel}>Final Grade:</span>
              <span style={certificateModalStyles.gradeValue}>Completed with Distinction</span>
            </div>
            
            <div style={certificateModalStyles.dateSection}>
              <span style={certificateModalStyles.dateLabel}>Date of Issue:</span>
              <span style={certificateModalStyles.dateValue}>
                {certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString()}
              </span>
            </div>
            
            <div style={certificateModalStyles.certIdSection}>
              <span style={certificateModalStyles.certIdLabel}>Certificate ID:</span>
              <span style={certificateModalStyles.certIdValue}>{certificate.certificateId}</span>
            </div>
            
            <div style={certificateModalStyles.signatureSection}>
              <div style={certificateModalStyles.signatureLeft}>
                <div style={certificateModalStyles.signatureLine}></div>
                <p style={certificateModalStyles.signatureName}>Dr. Sarah Johnson</p>
                <p style={certificateModalStyles.signatureTitle}>Dean of Academics</p>
              </div>
              <div style={certificateModalStyles.signatureRight}>
                <div style={certificateModalStyles.signatureLine}></div>
                <p style={certificateModalStyles.signatureName}>Prof. Michael Chen</p>
                <p style={certificateModalStyles.signatureTitle}>Course Director</p>
              </div>
            </div>
            
            <div style={certificateModalStyles.footer}>
              <p>This certificate is issued by LJ University and verifies the successful completion of all course requirements.</p>
              <p style={certificateModalStyles.verifyLink}>Verify at: https://www.ljuniversity.edu/verify/{certificate.certificateId}</p>
            </div>
            
            <div style={certificateModalStyles.bottomBorder}></div>
          </div>
        </div>
        
        <div style={certificateModalStyles.buttons}>
          <button style={certificateModalStyles.downloadBtn} onClick={downloadCertificateAsHTML}>
            <FiDownload size={16} /> Download Certificate
          </button>
          <button style={certificateModalStyles.closeBtnModal} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== CERTIFICATES TAB COMPONENT ====================
const CertificatesTab = ({ darkMode, student }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/progress/student-certificates`,
        axiosConfig
      );
      
      if (response.data.success) {
        setCertificates(response.data.certificates);
      } else {
        setError(response.data.message || "Failed to fetch certificates");
      }
    } catch (err) {
      console.error("Error fetching certificates:", err);
      setError(err.response?.data?.message || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  if (loading) {
    return (
      <div style={certificatesStyles.loadingContainer}>
        <div style={certificatesStyles.spinner}></div>
        <p>Loading your certificates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={certificatesStyles.errorContainer}>
        <FiAlertCircle size={48} color="#EF4444" />
        <h3>Unable to Load Certificates</h3>
        <p>{error}</p>
        <button style={certificatesStyles.retryBtn} onClick={fetchCertificates}>Try Again</button>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div style={certificatesStyles.emptyContainer}>
        <FiAward size={64} style={{ opacity: 0.5, marginBottom: "20px" }} />
        <h3>No Certificates Yet</h3>
        <p>Complete your courses to earn certificates!</p>
        <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "8px" }}>
          Certificates are automatically generated when you complete a course with 100% progress.
        </p>
      </div>
    );
  }

  return (
    <div style={certificatesStyles.container}>
      {selectedCertificate && (
        <CertificateModal 
          certificate={selectedCertificate} 
          onClose={() => setSelectedCertificate(null)} 
        />
      )}
      
      <div style={certificatesStyles.header}>
        <div>
          <h2 style={certificatesStyles.title}>🏆 My Certificates</h2>
          <p style={certificatesStyles.subtitle}>
            You have earned {certificates.length} certificate(s) for completed courses
          </p>
        </div>
      </div>

      <div style={certificatesStyles.grid}>
        {certificates.map((cert, index) => (
          <div 
            key={cert._id || index} 
            style={certificatesStyles.certificateCard}
            onClick={() => setSelectedCertificate(cert)}
          >
            <div style={certificatesStyles.cardHeader}>
              <div style={certificatesStyles.cardIcon}>🎓</div>
              <div style={certificatesStyles.cardBadge}>
                <FiCheckCircle size={12} /> Completed
              </div>
            </div>
            <h3 style={certificatesStyles.courseName}>{cert.courseName}</h3>
            <p style={certificatesStyles.certId}>ID: {cert.certificateId}</p>
            <div style={certificatesStyles.cardFooter}>
              <div style={certificatesStyles.issueDate}>
                <FiCalendar size={12} />
                <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
              </div>
              <button 
                style={certificatesStyles.viewBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCertificate(cert);
                }}
              >
                View Certificate →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== ASSIGNMENTS TAB COMPONENT ====================
const AssignmentsTab = ({ darkMode, student }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const [selectedFile, setSelectedFile] = useState({});

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      const enrollResponse = await axios.get(
        `${API_BASE_URL}/enrollments/student/${student?.id}`,
        axiosConfig
      );
      
      const enrolledSubjects = enrollResponse.data.enrollments.map(e => e.subjectId?._id || e.subjectId);
      
      if (enrolledSubjects.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }
      
      const assignmentsResponse = await axios.post(
        `${API_BASE_URL}/assignments/student-assignments`,
        { subjectIds: enrolledSubjects },
        axiosConfig
      );
      
      if (assignmentsResponse.data.success) {
        setAssignments(assignmentsResponse.data.assignments);
      } else {
        setError(assignmentsResponse.data.message);
      }
      
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError(err.response?.data?.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (assignmentId, file) => {
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }
    setSelectedFile(prev => ({ ...prev, [assignmentId]: file }));
  };

  const handleSubmit = async (assignment) => {
    if (!selectedFile[assignment._id]) {
      toast.error("Please select a file to submit");
      return;
    }
    
    setSubmitting(assignment._id);
    
    const formData = new FormData();
    formData.append("assignment", selectedFile[assignment._id]);
    formData.append("assignmentId", assignment._id);
    formData.append("subjectId", assignment.subjectId?._id || assignment.subjectId);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/assignments/submit`,
        formData,
        {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success("Assignment submitted successfully!");
        setSelectedFile(prev => ({ ...prev, [assignment._id]: null }));
        
        try {
          await axios.post(
            `${API_BASE_URL}/progress/toggle-complete`,
            {
              subjectId: assignment.subjectId?._id || assignment.subjectId,
              itemId: assignment._id,
              completed: true,
              itemType: "assignment",
              division: student?.division
            },
            axiosConfig
          );
          console.log("Assignment progress marked as complete");
        } catch (progressErr) {
          console.error("Error updating progress:", progressErr);
        }
        
        fetchAssignments();
        
        const fileInput = document.getElementById(`file-input-${assignment._id}`);
        if (fileInput) fileInput.value = '';
      }
    } catch (err) {
      console.error("Error submitting assignment:", err);
      toast.error(err.response?.data?.message || "Failed to submit assignment");
    } finally {
      setSubmitting(null);
    }
  };

  const downloadAssignmentFile = (filename, originalName) => {
    window.open(`${API_BASE_URL}/assignments/download/${filename}`, '_blank');
  };

  const downloadSubmissionFile = (filename, originalName) => {
    window.open(`${API_BASE_URL}/assignments/download-submission/${filename}`, '_blank');
  };

  useEffect(() => {
    if (student?.id) {
      fetchAssignments();
    }
  }, [student?.id]);

  if (loading) {
    return (
      <div style={assignmentsStyles.loadingContainer}>
        <div style={assignmentsStyles.spinner}></div>
        <p>Loading assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={assignmentsStyles.errorContainer}>
        <FiAlertCircle size={48} color="#EF4444" />
        <h3>Unable to Load Assignments</h3>
        <p>{error}</p>
        <button style={assignmentsStyles.retryBtn} onClick={fetchAssignments}>Try Again</button>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div style={assignmentsStyles.emptyContainer}>
        <FiClipboard size={64} style={{ opacity: 0.5, marginBottom: "20px" }} />
        <h3>No Assignments Yet</h3>
        <p>When teachers post assignments, they will appear here.</p>
      </div>
    );
  }

  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const subjectName = assignment.subjectId?.name || "Unknown Subject";
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(assignment);
    return acc;
  }, {});

  return (
    <div style={assignmentsStyles.container}>
      <div style={assignmentsStyles.header}>
        <div>
          <h2 style={assignmentsStyles.title}>📝 My Assignments</h2>
          <p style={assignmentsStyles.subtitle}>
            You have {assignments.length} assignment(s) to complete
          </p>
        </div>
        <button style={assignmentsStyles.refreshBtn} onClick={fetchAssignments}>
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {Object.entries(groupedAssignments).map(([subjectName, subjectAssignments]) => (
        <div key={subjectName} style={assignmentsStyles.subjectSection}>
          <h3 style={assignmentsStyles.subjectTitle}>{subjectName}</h3>
          <div style={assignmentsStyles.assignmentsGrid}>
            {subjectAssignments.map((assignment) => (
              <div key={assignment._id} style={assignmentsStyles.assignmentCard}>
                <div style={assignmentsStyles.cardHeader}>
                  <div style={assignmentsStyles.unitBadge}>
                    Unit {assignment.unitId?.unitNumber}
                  </div>
                  {assignment.submitted ? (
                    <div style={assignmentsStyles.submittedBadge}>
                      <FiCheckCircle size={12} /> {assignment.submission?.status === "graded" ? "Graded" : "Submitted"}
                    </div>
                  ) : (
                    <div style={assignmentsStyles.pendingBadge}>Pending</div>
                  )}
                </div>
                
                <h4 style={assignmentsStyles.assignmentTitle}>{assignment.title}</h4>
                <p style={assignmentsStyles.assignmentDescription}>
                  {assignment.description || "No description provided"}
                </p>
                
                <div style={assignmentsStyles.assignmentMeta}>
                  <div style={assignmentsStyles.metaItem}>
                    <FiStar size={12} />
                    <span>{assignment.totalMarks} Marks</span>
                  </div>
                  <div style={assignmentsStyles.metaItem}>
                    <FiClock size={12} />
                    <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {assignment.assignmentFile && (
                  <div style={assignmentsStyles.fileSection}>
                    <button 
                      style={assignmentsStyles.downloadBtn}
                      onClick={() => downloadAssignmentFile(assignment.assignmentFile.filename, assignment.assignmentFile.originalName)}
                    >
                      <FiDownload size={12} /> Download Assignment
                    </button>
                  </div>
                )}
                
                {assignment.submitted ? (
                  <div style={assignmentsStyles.submissionInfo}>
                    <div style={assignmentsStyles.submissionStatus}>
                      <FiCheckCircle size={14} color="#10B981" />
                      <span>Submitted on {new Date(assignment.submission.submittedAt).toLocaleDateString()}</span>
                    </div>
                    {assignment.submission.marks !== null && (
                      <div style={assignmentsStyles.marksInfo}>
                        <span>Marks: {assignment.submission.marks}/{assignment.totalMarks}</span>
                        {assignment.submission.feedback && (
                          <p style={assignmentsStyles.feedback}>{assignment.submission.feedback}</p>
                        )}
                      </div>
                    )}
                    {assignment.submission.fileName && (
                      <button 
                        style={assignmentsStyles.viewSubmissionBtn}
                        onClick={() => downloadSubmissionFile(assignment.submission.fileName, assignment.submission.originalName)}
                      >
                        <FiDownload size={12} /> View Submission
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={assignmentsStyles.submitSection}>
                    <div style={assignmentsStyles.fileInputWrapper}>
                      <input
                        type="file"
                        id={`file-input-${assignment._id}`}
                        style={{ display: "none" }}
                        onChange={(e) => handleFileSelect(assignment._id, e.target.files[0])}
                      />
                      <label 
                        htmlFor={`file-input-${assignment._id}`}
                        style={assignmentsStyles.fileLabel}
                      >
                        {selectedFile[assignment._id] ? selectedFile[assignment._id].name : "Choose File"}
                      </label>
                    </div>
                    <button
                      style={assignmentsStyles.submitBtn}
                      onClick={() => handleSubmit(assignment)}
                      disabled={submitting === assignment._id || !selectedFile[assignment._id]}
                    >
                      {submitting === assignment._id ? (
                        <>
                          <div style={assignmentsStyles.smallSpinner} />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FiSend size={14} /> Submit Assignment
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== LIVE CLASSES TAB COMPONENT ====================
const LiveClassesTab = ({ darkMode, student }) => {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/meetings/student/division/${student?.division}`,
        axiosConfig
      );
      
      if (response.data.success) {
        setLiveClasses(response.data.meetings);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error("Error fetching live classes:", err);
      setError(err.response?.data?.message || "Failed to load live classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (student?.division) {
      fetchLiveClasses();
    }
  }, [student?.division]);

  const isMeetingLive = (meeting) => {
    const meetingDateTime = new Date(`${meeting.date.split('T')[0]}T${meeting.time}`);
    const timeDiff = meetingDateTime - currentTime;
    return timeDiff <= 15 * 60 * 1000 && timeDiff > -parseInt(meeting.duration) * 60 * 1000;
  };

  const isMeetingUpcoming = (meeting) => {
    const meetingDateTime = new Date(`${meeting.date.split('T')[0]}T${meeting.time}`);
    return meetingDateTime > currentTime && !isMeetingLive(meeting);
  };

  const formatMeetingTime = (date, time) => {
    const meetingDate = new Date(date);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return `${meetingDate.toLocaleDateString(undefined, options)} at ${time}`;
  };

  const getTimeRemaining = (meeting) => {
    const meetingDateTime = new Date(`${meeting.date.split('T')[0]}T${meeting.time}`);
    const diff = meetingDateTime - currentTime;
    
    if (diff <= 0) return "Starting soon";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const upcomingClasses = liveClasses.filter(m => isMeetingUpcoming(m));
  const liveNowClasses = liveClasses.filter(m => isMeetingLive(m));

  const handleJoinMeeting = (meetingLink) => {
    if (meetingLink) {
      window.open(meetingLink, '_blank');
    } else {
      toast.error("Meeting link not available");
    }
  };

  if (loading) {
    return (
      <div style={liveClassesStyles.loadingContainer}>
        <div style={liveClassesStyles.spinner}></div>
        <p>Loading live classes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={liveClassesStyles.errorContainer}>
        <FiAlertCircle size={48} color="#EF4444" />
        <h3>Unable to Load Live Classes</h3>
        <p>{error}</p>
        <button style={liveClassesStyles.retryBtn} onClick={fetchLiveClasses}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={liveClassesStyles.container}>
      <div style={liveClassesStyles.header}>
        <div>
          <h2 style={liveClassesStyles.title}>🎥 Live Classes</h2>
          <p style={liveClassesStyles.subtitle}>Join your scheduled live sessions</p>
        </div>
        <button style={liveClassesStyles.refreshBtn} onClick={fetchLiveClasses}>
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {liveNowClasses.length > 0 && (
        <div style={liveClassesStyles.section}>
          <div style={liveClassesStyles.liveBadge}>
            <span style={liveClassesStyles.liveDot}></span>
            LIVE NOW
          </div>
          <div style={liveClassesStyles.meetingsGrid}>
            {liveNowClasses.map(meeting => (
              <div key={meeting._id} style={{ ...liveClassesStyles.meetingCard, ...liveClassesStyles.liveCard }}>
                <div style={liveClassesStyles.cardHeader}>
                  <div style={liveClassesStyles.liveTag}>
                    <span style={liveClassesStyles.liveDotSmall}></span>
                    LIVE
                  </div>
                  {meeting.subjectId && (
                    <div style={liveClassesStyles.subjectBadge}>
                      {meeting.subjectId.name || meeting.subjectName}
                    </div>
                  )}
                </div>
                <h3 style={liveClassesStyles.meetingTitle}>{meeting.title}</h3>
                {meeting.description && (
                  <p style={liveClassesStyles.meetingDescription}>{meeting.description}</p>
                )}
                <div style={liveClassesStyles.meetingDetails}>
                  <div style={liveClassesStyles.detailItem}>
                    <FiCalendar size={14} />
                    <span>{formatMeetingTime(meeting.date, meeting.time)}</span>
                  </div>
                  <div style={liveClassesStyles.detailItem}>
                    <FiClock size={14} />
                    <span>{meeting.duration} minutes</span>
                  </div>
                </div>
                <div style={liveClassesStyles.cardFooter}>
                  <button style={liveClassesStyles.joinBtn} onClick={() => handleJoinMeeting(meeting.meetingLink)}>
                    <FiPlayCircle size={16} /> Join Live Class
                  </button>
                  <button style={liveClassesStyles.copyBtn} onClick={() => {
                    navigator.clipboard.writeText(meeting.meetingLink);
                    toast.success("Meeting link copied!");
                  }}>
                    <FiCopy size={14} /> Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingClasses.length > 0 && (
        <div style={liveClassesStyles.section}>
          <h2 style={liveClassesStyles.sectionTitle}>
            <i className="fas fa-clock" style={liveClassesStyles.sectionIcon}></i>
            Upcoming Classes
          </h2>
          <div style={liveClassesStyles.meetingsGrid}>
            {upcomingClasses.map(meeting => (
              <div key={meeting._id} style={liveClassesStyles.meetingCard}>
                <div style={liveClassesStyles.cardHeader}>
                  <div style={liveClassesStyles.upcomingTag}>Upcoming</div>
                  {meeting.subjectId && (
                    <div style={liveClassesStyles.subjectBadge}>
                      {meeting.subjectId.name || meeting.subjectName}
                    </div>
                  )}
                </div>
                <h3 style={liveClassesStyles.meetingTitle}>{meeting.title}</h3>
                {meeting.description && (
                  <p style={liveClassesStyles.meetingDescription}>{meeting.description}</p>
                )}
                <div style={liveClassesStyles.meetingDetails}>
                  <div style={liveClassesStyles.detailItem}>
                    <FiCalendar size={14} />
                    <span>{formatMeetingTime(meeting.date, meeting.time)}</span>
                  </div>
                  <div style={liveClassesStyles.detailItem}>
                    <FiClock size={14} />
                    <span>{getTimeRemaining(meeting)}</span>
                  </div>
                  <div style={liveClassesStyles.detailItem}>
                    <FiClock size={14} />
                    <span>Duration: {meeting.duration} min</span>
                  </div>
                </div>
                <div style={liveClassesStyles.cardFooter}>
                  <button style={liveClassesStyles.reminderBtn} onClick={() => {
                    toast.info(`Reminder set for ${meeting.title} at ${meeting.time}`);
                  }}>
                    <FiBell size={14} /> Set Reminder
                  </button>
                  <button style={liveClassesStyles.copyBtn} onClick={() => {
                    navigator.clipboard.writeText(meeting.meetingLink);
                    toast.success("Meeting link copied!");
                  }}>
                    <FiCopy size={14} /> Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {liveClasses.length === 0 && (
        <div style={liveClassesStyles.emptyState}>
          <FiCalendar size={64} style={{ marginBottom: "20px", opacity: 0.5 }} />
          <h3>No Live Classes Scheduled</h3>
          <p>Check back later for upcoming live sessions</p>
        </div>
      )}
    </div>
  );
};

// ==================== UPCOMING ASSIGNMENTS SECTION ====================
const UpcomingAssignmentsSection = ({ student }) => {
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUpcomingAssignments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/assignments/student/upcoming/${student?.id}`,
        axiosConfig
      );
      
      if (response.data.success) {
        setUpcomingAssignments(response.data.assignments);
      }
    } catch (err) {
      console.error("Error fetching upcoming assignments:", err);
      setUpcomingAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (student?.id) {
      fetchUpcomingAssignments();
    }
  }, [student?.id]);

  if (loading) {
    return (
      <div style={upcomingStyles.loadingContainer}>
        <div style={upcomingStyles.spinnerSmall}></div>
        <span>Loading upcoming assignments...</span>
      </div>
    );
  }

  if (upcomingAssignments.length === 0) {
    return (
      <div style={upcomingStyles.emptyContainer}>
        <FiClipboard size={24} color="#94A3B8" />
        <span>No upcoming assignments</span>
      </div>
    );
  }

  return (
    <div style={upcomingStyles.container}>
      <div style={upcomingStyles.header}>
        <h3 style={upcomingStyles.title}>
          <FiClipboard size={18} /> Upcoming Assignments
        </h3>
        <span style={upcomingStyles.count}>{upcomingAssignments.length} pending</span>
      </div>
      <div style={upcomingStyles.list}>
        {upcomingAssignments.slice(0, 5).map((assignment) => (
          <div key={assignment._id} style={upcomingStyles.assignmentItem}>
            <div style={upcomingStyles.assignmentInfo}>
              <div style={upcomingStyles.assignmentTitle}>{assignment.title}</div>
              <div style={upcomingStyles.assignmentMeta}>
                <span style={upcomingStyles.subjectName}>
                  {assignment.subjectId?.name || "Unknown Subject"}
                </span>
                <span style={upcomingStyles.marks}>📝 {assignment.totalMarks} marks</span>
              </div>
            </div>
            <div style={upcomingStyles.deadlineInfo}>
              <div style={upcomingStyles.deadlineBadge(assignment.daysRemaining)}>
                <FiClock size={12} />
                <span>
                  {assignment.daysRemaining === 0 ? "Due today" : 
                   assignment.daysRemaining < 0 ? "Overdue" : 
                   `${assignment.daysRemaining} days left`}
                </span>
              </div>
              <div style={upcomingStyles.deadlineDate}>
                {new Date(assignment.deadline).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      {upcomingAssignments.length > 5 && (
        <div style={upcomingStyles.viewAll}>
          <span>+{upcomingAssignments.length - 5} more assignments</span>
        </div>
      )}
    </div>
  );
};

// ==================== COURSE CARD COMPONENT ====================
const CourseCard = ({ course, enrolled, enrolling, dropping, onEnroll, onDrop, onView, gradient, icon }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={{
        ...styles.courseCard,
        transform: isHovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: isHovered 
          ? "0 25px 40px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(102,126,234,0.2)" 
          : "0 10px 25px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)",
        border: enrolled ? "2px solid #10B981" : "1px solid #E2E8F0"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ ...styles.cardHeader, background: gradient }}>
        <div style={styles.headerTop}>
          <div style={styles.cardIcon}>{icon}</div>
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
        <div style={styles.divisionBadge}>Division {course.assignedDivision}</div>
        <div style={styles.progressWrapper}>
          <div style={styles.progressLabel}>
            <span>Course Progress</span>
            <span style={{ fontWeight: "bold", color: "#fff" }}>{course.progress || 0}%</span>
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${course.progress || 0}%` }} />
          </div>
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
        </div>
        <div style={styles.cardFooter}>
          {enrolled ? (
            <div style={styles.enrolledActions}>
              <button
                style={styles.continueBtn}
                onClick={() => onView(course)}
              >
                <FiPlayCircle size={16} /> Continue
              </button>
              <button
                style={styles.dropSmallBtn}
                onClick={() => onDrop(course)}
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
              onClick={() => onEnroll(course)}
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
};

// ==================== LIST COURSE ITEM COMPONENT ====================
const ListCourseItem = ({ course, enrolled, enrolling, dropping, onEnroll, onDrop, onView, gradient, icon }) => {
  return (
    <div 
      style={{
        ...styles.listItem,
        borderLeft: enrolled ? "4px solid #10B981" : "4px solid transparent"
      }}
    >
      <div style={{ ...styles.listIcon, background: gradient }}>{icon}</div>
      <div style={styles.listInfo}>
        <h4 style={styles.listTitle}>{course.name}</h4>
        <p style={styles.listCode}>{course.code}</p>
        <div style={styles.listMeta}>
          <span><FiUser size={12} /> {course.instructor}</span>
          <span><FiBookmark size={12} /> {course.unitsCount} Units</span>
          <span><FiStar size={12} /> {course.credits} Credits</span>
          <span><FiUsers size={12} /> Div {course.assignedDivision}</span>
        </div>
        <div style={styles.listProgressContainer}>
          <div style={styles.listProgressBar}>
            <div style={{ ...styles.listProgressFill, width: `${course.progress || 0}%` }} />
          </div>
          <span style={styles.listProgressText}>{course.progress || 0}%</span>
        </div>
      </div>
      <div style={styles.listActions}>
        {enrolled ? (
          <>
            <button
              style={styles.listContinueBtn}
              onClick={() => onView(course)}
            >
              <FiPlayCircle size={14} /> Continue
            </button>
            <button
              style={styles.listDropBtn}
              onClick={() => onDrop(course)}
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
            onClick={() => onEnroll(course)}
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
};

// ==================== MY COURSES COMPONENT ====================
const MyCourses = ({ darkMode, student, activeTab, setActiveTab, enrolledCourseIds, enrolling, dropping, onEnroll, onDrop, onViewCourse }) => {
  const [viewMode, setViewMode] = useState("grid");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getSubjectIcon = (subjectName) => {
    const name = subjectName.toLowerCase();
    if (name.includes("data") || name.includes("database")) return <FiDatabase size={32} />;
    if (name.includes("server") || name.includes("network")) return <FiServer size={32} />;
    if (name.includes("operating") || name.includes("system")) return <FiCpu size={32} />;
    if (name.includes("web") || name.includes("internet")) return <FiGlobe size={32} />;
    if (name.includes("programming") || name.includes("coding")) return <FiCode size={32} />;
    if (name.includes("security")) return <FiShield size={32} />;
    if (name.includes("cloud")) return <FiCloud size={32} />;
    return <FiBookOpen size={32} />;
  };

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

  const getGradient = (index) => gradients[index % gradients.length];

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/subjects/student-dashboard`, {
        params: {
          department: student?.department,
          course: student?.course,
          semester: student?.semester,
          division: student?.division
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch courses");
      }
      
      const approvedSubjects = response.data.fullyApproved || [];
      
      if (approvedSubjects.length === 0) {
        setError(`No courses found for Semester ${student?.semester || "N/A"} - Division ${student?.division || "N/A"}.`);
        setCourses([]);
        setLoading(false);
        return;
      }
      
      const formattedCourses = await Promise.all(approvedSubjects.map(async (subject, idx) => {
        let progress = 0;
        try {
          const progressResponse = await axios.get(
            `${API_BASE_URL}/progress/${subject._id}`,
            { params: { division: student?.division }, ...axiosConfig }
          );
          if (progressResponse.data.success) {
            progress = progressResponse.data.progress.overallProgress || 0;
            console.log(`📊 Progress for ${subject.name}: ${progress}%`);
          }
        } catch (err) {
          console.error(`Error fetching progress for ${subject.name}:`, err);
        }
        
        return {
          id: subject._id,
          name: subject.name,
          code: subject.code,
          instructor: subject.teacher?.name || subject.instructor || "To be assigned",
          instructorEmail: subject.teacher?.email,
          teacherId: subject.teacher?.id,
          credits: subject.credits || 3,
          semester: subject.semester,
          progress: progress,
          icon: getSubjectIcon(subject.name),
          gradient: getGradient(idx),
          units: subject.units || [],
          unitsCount: subject.unitsCount || 0,
          assignedDivision: subject.assignedDivision || student?.division
        };
      }));
      
      setCourses(formattedCourses);
      
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (course) => {
    onViewCourse(course);
  };

  const isEnrolled = (courseId) => enrolledCourseIds.includes(courseId);

  useEffect(() => {
    if (activeTab === "courses" && student) {
      fetchCourses();
    }
  }, [activeTab, student, enrolledCourseIds]);

  if (activeTab !== "courses") return null;

  if (loading && courses.length === 0) {
    return (
      <div style={myCoursesStyles.loadingContainer}>
        <div style={myCoursesStyles.spinner}></div>
        <p>Loading your courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={myCoursesStyles.errorCard}>
        <FiAlertCircle size={40} color="#EF4444" />
        <h3>Unable to Load Courses</h3>
        <p>{error}</p>
        <button style={myCoursesStyles.retryBtn} onClick={fetchCourses}>Try Again</button>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div style={myCoursesStyles.emptyCard}>
        <FiBookOpen size={48} style={{ opacity: 0.5 }} />
        <h3>No Courses Available</h3>
        <p>You don't have any approved courses for Semester {student?.semester} - Division {student?.division}</p>
      </div>
    );
  }

  return (
    <div style={myCoursesStyles.container}>
      <ToastContainer />
      
      <div style={myCoursesStyles.header}>
        <div>
          <h2 style={myCoursesStyles.title}>📚 My Courses</h2>
          <p style={myCoursesStyles.subtitle}>
            {courses.length} approved courses • {enrolledCourseIds.length} enrolled • Semester {student?.semester} • Division {student?.division}
          </p>
        </div>
        <div style={myCoursesStyles.viewControls}>
          <button 
            style={{ ...myCoursesStyles.viewBtn, background: viewMode === "grid" ? "#667eea" : "transparent", color: viewMode === "grid" ? "white" : "#64748B" }}
            onClick={() => setViewMode("grid")}
          >
            <FiGrid size={14} /> Grid
          </button>
          <button 
            style={{ ...myCoursesStyles.viewBtn, background: viewMode === "list" ? "#667eea" : "transparent", color: viewMode === "list" ? "white" : "#64748B" }}
            onClick={() => setViewMode("list")}
          >
            <FiList size={14} /> List
          </button>
        </div>
      </div>

      {viewMode === "grid" && (
        <div style={myCoursesStyles.grid}>
          {courses.map((course) => {
            const enrolled = isEnrolled(course.id);
            return (
              <CourseCard
                key={course.id}
                course={course}
                enrolled={enrolled}
                enrolling={enrolling}
                dropping={dropping}
                onEnroll={onEnroll}
                onDrop={onDrop}
                onView={handleCourseClick}
                gradient={course.gradient}
                icon={course.icon}
              />
            );
          })}
        </div>
      )}

      {viewMode === "list" && (
        <div style={myCoursesStyles.list}>
          {courses.map((course) => {
            const enrolled = isEnrolled(course.id);
            return (
              <ListCourseItem
                key={course.id}
                course={course}
                enrolled={enrolled}
                enrolling={enrolling}
                dropping={dropping}
                onEnroll={onEnroll}
                onDrop={onDrop}
                onView={handleCourseClick}
                gradient={course.gradient}
                icon={course.icon}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==================== COMPILER TAB COMPONENT ====================
const CompilerTab = ({ darkMode, student }) => {
  return (
    <div style={compilerStyles.container}>
      <div style={compilerStyles.header}>
        <div>
          <h2 style={compilerStyles.title}>💻 Code Compiler</h2>
          <p style={compilerStyles.subtitle}>
            Write, run, and test your code in multiple programming languages
          </p>
        </div>
      </div>
      <UniversalCompiler 
        initialLanguage="python"
        onRunComplete={(result) => {
          console.log("Code execution completed:", result);
        }}
      />
    </div>
  );
};

// ==================== MAIN STUDENT DASHBOARD ====================
const StudentDashboard = ({ darkMode, activeTab, setActiveTab, student }) => {
  const [viewMode, setViewMode] = useState("grid");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successfullyEnrolledCourse, setSuccessfullyEnrolledCourse] = useState(null);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [completedCourseCount, setCompletedCourseCount] = useState(0);
  
  const [stats, setStats] = useState({
    totalCourses: 0,
    enrolledCourses: 0,
    completedCourses: 0,
    totalUnits: 0,
    pendingApproval: 0
  });

  const {
    enrolledCourseIds,
    enrolling,
    dropping,
    handleEnroll,
    handleDrop,
    refreshEnrollments
  } = useEnrollment(student, (count) => {
    setStats(prev => ({ ...prev, enrolledCourses: count }));
  });

  const getSubjectIcon = (subjectName) => {
    const name = subjectName.toLowerCase();
    if (name.includes("data") || name.includes("database")) return <FiDatabase size={32} />;
    if (name.includes("server") || name.includes("network")) return <FiServer size={32} />;
    if (name.includes("operating") || name.includes("system")) return <FiCpu size={32} />;
    if (name.includes("web") || name.includes("internet")) return <FiGlobe size={32} />;
    if (name.includes("programming") || name.includes("coding")) return <FiCode size={32} />;
    if (name.includes("security")) return <FiShield size={32} />;
    if (name.includes("cloud")) return <FiCloud size={32} />;
    return <FiBookOpen size={32} />;
  };

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

  const getGradient = (index) => gradients[index % gradients.length];

  const calculateCompletedCourses = (progressData) => {
    let completed = 0;
    progressData.forEach(course => {
      if (course.progress === 100) {
        completed++;
      }
    });
    return completed;
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/subjects/student-dashboard`, {
        params: {
          department: student?.department,
          course: student?.course,
          semester: student?.semester,
          division: student?.division
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch subjects");
      }
      
      const approvedSubjects = response.data.fullyApproved || [];
      const partiallyApproved = response.data.partiallyApproved || [];
      
      setPendingCourses(partiallyApproved);
      
      if (approvedSubjects.length === 0) {
        if (partiallyApproved.length > 0) {
          setError(`${partiallyApproved.length} subject(s) are pending approval. Only fully approved subjects will appear here.`);
        } else {
          setError(`No subjects found for Semester ${student?.semester || "N/A"} - Division ${student?.division || "N/A"}.`);
        }
        setCourses([]);
        setStats(prev => ({
          ...prev,
          totalCourses: 0,
          totalUnits: 0
        }));
        setLoading(false);
        return;
      }
      
      const formattedCourses = await Promise.all(approvedSubjects.map(async (subject, idx) => {
        let progress = 0;
        try {
          const progressResponse = await axios.get(
            `${API_BASE_URL}/progress/${subject._id}`,
            { params: { division: student?.division }, ...axiosConfig }
          );
          if (progressResponse.data.success) {
            progress = progressResponse.data.progress.overallProgress || 0;
            console.log(`📊 Dashboard Progress for ${subject.name}: ${progress}%`);
          }
        } catch (err) {
          console.error(`Error fetching progress for ${subject.name}:`, err);
        }
        
        return {
          id: subject._id,
          name: subject.name,
          code: subject.code,
          instructor: subject.teacher?.name || subject.instructor || "To be assigned",
          instructorEmail: subject.teacher?.email,
          teacherId: subject.teacher?.id,
          credits: subject.credits || 3,
          semester: subject.semester,
          progress: progress,
          icon: getSubjectIcon(subject.name),
          gradient: getGradient(idx),
          units: subject.units || [],
          unitsCount: subject.unitsCount || 0,
          assignedDivision: subject.assignedDivision || student?.division
        };
      }));
      
      setCourses(formattedCourses);
      
      const totalUnits = formattedCourses.reduce((acc, c) => acc + (c.unitsCount || 0), 0);
      const completedCount = formattedCourses.filter(c => c.progress === 100).length;
      
      setCompletedCourseCount(completedCount);
      
      setStats(prev => ({
        totalCourses: approvedSubjects.length,
        enrolledCourses: prev.enrolledCourses,
        completedCourses: completedCount,
        totalUnits: totalUnits,
        pendingApproval: partiallyApproved.length
      }));
      
      await refreshEnrollments();
      
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = () => {
    setRefreshing(true);
    fetchSubjects();
  };

  const handleEnrollWrapper = async (course) => {
    const success = await handleEnroll(course, (enrolledCourse) => {
      setSuccessfullyEnrolledCourse(enrolledCourse);
      setShowSuccessModal(true);
    });
    if (success) {
      fetchSubjects();
    }
  };

  const handleDropWrapper = async (course) => {
    await handleDrop(course);
    fetchSubjects();
  };

  const handleCourseClick = (course) => {
    setViewingCourse(course);
  };

  const handleBackFromCourse = () => {
    setViewingCourse(null);
    fetchSubjects();
  };

  const isEnrolled = (courseId) => enrolledCourseIds.includes(courseId);

  useEffect(() => {
    if (activeTab === "dashboard" && student) {
      fetchSubjects();
    }
  }, [activeTab, student]);

  if (viewingCourse) {
    return (
      <CourseContentView 
        course={viewingCourse}
        student={student}
        onBack={handleBackFromCourse}
        darkMode={darkMode}
      />
    );
  }

  if (activeTab === "compiler") {
    return <CompilerTab darkMode={darkMode} student={student} />;
  }

  if (activeTab === "certificates") {
    return <CertificatesTab darkMode={darkMode} student={student} />;
  }

  if (activeTab === "assignments") {
    return <AssignmentsTab darkMode={darkMode} student={student} />;
  }

  if (activeTab === "liveclasses") {
    return <LiveClassesTab darkMode={darkMode} student={student} />;
  }

  if (activeTab === "courses") {
    return <MyCourses 
      darkMode={darkMode} 
      student={student} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      enrolledCourseIds={enrolledCourseIds}
      enrolling={enrolling}
      dropping={dropping}
      onEnroll={handleEnrollWrapper}
      onDrop={handleDropWrapper}
      onViewCourse={handleCourseClick}
    />;
  }

  if (activeTab !== "dashboard") return null;

  if (loading && courses.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <ToastContainer />
      
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
                  handleCourseClick(successfullyEnrolledCourse);
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

      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>✨ STUDENT PORTAL</div>
          <h1 style={styles.heroTitle}>
            Welcome back, <span style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{student?.name?.split(" ")[0] || "Student"}</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Track your academic progress, access course materials, and stay updated with assignments
          </p>
          <div style={styles.statsRow}>
            <div style={styles.statPill}>
              <FiCalendar size={14} />
              <span>Semester {student?.semester || "N/A"}</span>
            </div>
            <div style={styles.statPill}>
              <FiUsers size={14} />
              <span>Division {student?.division || "N/A"}</span>
            </div>
          </div>
        </div>
        <button style={styles.refreshBtn} onClick={refreshData} disabled={refreshing}>
          <FiRefreshCw size={16} className={refreshing ? "spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {stats.pendingApproval > 0 && (
        <div style={styles.pendingBanner}>
          <FiAlertCircle size={20} color="#F59E0B" />
          <span>
            <strong>{stats.pendingApproval} subject(s)</strong> are pending admin approval. 
            Only fully approved subjects are shown below.
          </span>
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderBottomColor: "#667eea" }}>
          <div style={{ ...styles.statIconBox, background: "#667eea15", color: "#667eea" }}>
            <FiBookOpen size={24} />
          </div>
          <div>
            <div style={styles.statBigValue}>{stats.totalCourses}</div>
            <div style={styles.statSmallLabel}>Total Courses</div>
            <div style={styles.statTrend}>📚 Available in semester</div>
          </div>
        </div>

        <div style={{ ...styles.statCard, borderBottomColor: "#10B981" }}>
          <div style={{ ...styles.statIconBox, background: "#10B98115", color: "#10B981" }}>
            <FiCheckCircle size={24} />
          </div>
          <div>
            <div style={styles.statBigValue}>{stats.enrolledCourses}</div>
            <div style={styles.statSmallLabel}>Enrolled Courses</div>
            <div style={styles.statTrend}>✓ Currently enrolled</div>
          </div>
        </div>

        <div style={{ ...styles.statCard, borderBottomColor: "#8B5CF6" }}>
          <div style={{ ...styles.statIconBox, background: "#8B5CF615", color: "#8B5CF6" }}>
            <FiAward size={24} />
          </div>
          <div>
            <div style={styles.statBigValue}>{stats.completedCourses}</div>
            <div style={styles.statSmallLabel}>Completed Courses</div>
            <div style={styles.statTrend}>🏆 100% Progress</div>
          </div>
        </div>

        <div style={{ ...styles.statCard, borderBottomColor: "#F59E0B" }}>
          <div style={{ ...styles.statIconBox, background: "#F59E0B15", color: "#F59E0B" }}>
            <FiBookmark size={24} />
          </div>
          <div>
            <div style={styles.statBigValue}>{stats.totalUnits}</div>
            <div style={styles.statSmallLabel}>Total Units</div>
            <div style={styles.statTrend}>Across all courses</div>
          </div>
        </div>
      </div>

      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>📚 Available Courses</h2>
          <p style={styles.sectionSubtitle}>
            {courses.length} available courses • {stats.enrolledCourses} enrolled • {stats.totalUnits} learning units
          </p>
        </div>
        {courses.length > 0 && (
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
        )}
      </div>

      {error && (
        <div style={styles.errorCard}>
          <FiAlertCircle size={40} color="#EF4444" />
          <h3>Unable to Load Courses</h3>
          <p>{error}</p>
          <button style={styles.retryBtn} onClick={refreshData}>Try Again</button>
        </div>
      )}

      {courses.length === 0 && !error && (
        <div style={styles.emptyCard}>
          <FiBookOpen size={48} style={{ opacity: 0.5 }} />
          <h3>No Courses Available</h3>
          <p>Courses will appear here once content is approved by the admin.</p>
          {stats.pendingApproval > 0 && (
            <p style={{ fontSize: "12px", marginTop: "8px", color: "#F59E0B" }}>
              ⏳ {stats.pendingApproval} subject(s) are pending approval
            </p>
          )}
        </div>
      )}

      {courses.length > 0 && viewMode === "grid" && (
        <div style={styles.grid}>
          {courses.map((course) => {
            const enrolled = isEnrolled(course.id);
            return (
              <CourseCard
                key={course.id}
                course={course}
                enrolled={enrolled}
                enrolling={enrolling}
                dropping={dropping}
                onEnroll={handleEnrollWrapper}
                onDrop={handleDropWrapper}
                onView={handleCourseClick}
                gradient={course.gradient}
                icon={course.icon}
              />
            );
          })}
        </div>
      )}

      {courses.length > 0 && viewMode === "list" && (
        <div style={styles.list}>
          {courses.map((course) => {
            const enrolled = isEnrolled(course.id);
            return (
              <ListCourseItem
                key={course.id}
                course={course}
                enrolled={enrolled}
                enrolling={enrolling}
                dropping={dropping}
                onEnroll={handleEnrollWrapper}
                onDrop={handleDropWrapper}
                onView={handleCourseClick}
                gradient={course.gradient}
                icon={course.icon}
              />
            );
          })}
        </div>
      )}

      {/* Upcoming Assignments Section - Moved after course cards */}
      <div style={styles.upcomingAssignmentsWrapper}>
        <UpcomingAssignmentsSection student={student} />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .spin {
          animation: spin 0.8s linear infinite;
        }
        .course-card {
          animation: fadeInUp 0.5s ease forwards;
        }
        .list-item {
          animation: fadeInUp 0.4s ease forwards;
        }
        .modal-content {
          animation: scaleIn 0.3s ease forwards;
        }
      `}</style>
    </div>
  );
};

// ==================== STYLES ====================
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
  loadingText: {
    marginTop: "20px",
    color: "#64748B",
    fontSize: "14px"
  },
  heroSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "40px",
    padding: "24px 28px",
    background: "white",
    borderRadius: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    border: "1px solid rgba(102,126,234,0.1)"
  },
  heroContent: {
    flex: 1
  },
  heroBadge: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#667eea",
    textTransform: "uppercase",
    letterSpacing: "2px",
    marginBottom: "8px"
  },
  heroTitle: {
    fontSize: "34px",
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: "10px",
    lineHeight: 1.2
  },
  heroSubtitle: {
    fontSize: "15px",
    color: "#64748B",
    marginBottom: "20px",
    lineHeight: 1.5
  },
  statsRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },
  statPill: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    background: "#F1F5F9",
    borderRadius: "20px",
    fontSize: "12px",
    color: "#475569"
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
  pendingBanner: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 20px",
    background: "#FEF3C7",
    borderRadius: "12px",
    marginBottom: "24px",
    border: "1px solid #FDE68A",
    fontSize: "13px",
    color: "#92400E"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "48px"
  },
  statCard: {
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    borderBottom: "3px solid",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer"
  },
  statIconBox: {
    width: "54px",
    height: "54px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statBigValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0F172A"
  },
  statSmallLabel: {
    fontSize: "12px",
    color: "#64748B",
    marginTop: "2px"
  },
  statTrend: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    marginTop: "6px",
    color: "#64748B"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "28px"
  },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0F172A"
  },
  sectionSubtitle: {
    fontSize: "13px",
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
  errorCard: {
    textAlign: "center",
    padding: "60px",
    background: "white",
    borderRadius: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
  },
  retryBtn: {
    marginTop: "20px",
    padding: "10px 24px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "500"
  },
  emptyCard: {
    textAlign: "center",
    padding: "80px",
    background: "white",
    borderRadius: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
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
    cursor: "pointer",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
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
  enrolledBadge: {
    padding: "4px 10px",
    background: "#10B981",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  availableBadge: {
    padding: "4px 10px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500",
    backdropFilter: "blur(4px)"
  },
  divisionBadge: {
    display: "inline-block",
    padding: "2px 8px",
    background: "rgba(255,255,255,0.15)",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "500",
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
  cardTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "6px",
    letterSpacing: "-0.3px"
  },
  cardCode: {
    fontSize: "12px",
    opacity: 0.85,
    marginBottom: "20px"
  },
  progressWrapper: {
    marginTop: "16px"
  },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    marginBottom: "8px",
    fontWeight: "500"
  },
  progressBar: {
    height: "6px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "3px",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    background: "white",
    borderRadius: "3px",
    transition: "width 0.5s ease"
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
    gap: "16px",
    marginBottom: "18px"
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
    color: "#94A3B8"
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
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px"
  },
  smallSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite"
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
  upcomingAssignmentsWrapper: {
    marginTop: "48px",
    background: "white",
    borderRadius: "24px",
    border: "1px solid #E2E8F0",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
  }
};

// ==================== STYLES FOR UPCOMING ASSIGNMENTS ====================
const upcomingStyles = {
  container: {
    padding: "20px"
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "40px",
    color: "#64748B"
  },
  spinnerSmall: {
    width: "20px",
    height: "20px",
    border: "2px solid #E2E8F0",
    borderTopColor: "#667eea",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite"
  },
  emptyContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "40px",
    color: "#94A3B8",
    flexDirection: "column"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #E2E8F0"
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0F172A",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  count: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#10B981",
    background: "#10B98115",
    padding: "2px 8px",
    borderRadius: "20px"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  assignmentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    background: "#F8FAFC",
    borderRadius: "12px",
    transition: "all 0.2s ease"
  },
  assignmentInfo: {
    flex: 1
  },
  assignmentTitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#0F172A",
    marginBottom: "4px"
  },
  assignmentMeta: {
    display: "flex",
    gap: "12px",
    fontSize: "11px",
    color: "#64748B"
  },
  subjectName: {
    color: "#667eea"
  },
  marks: {
    color: "#F59E0B"
  },
  deadlineInfo: {
    textAlign: "right"
  },
  deadlineBadge: (daysRemaining) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500",
    background: daysRemaining === 0 ? "#EF444415" : daysRemaining < 0 ? "#EF444415" : "#10B98115",
    color: daysRemaining === 0 ? "#EF4444" : daysRemaining < 0 ? "#EF4444" : "#10B981",
    marginBottom: "4px"
  }),
  deadlineDate: {
    fontSize: "11px",
    color: "#94A3B8"
  },
  viewAll: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #F1F5F9",
    textAlign: "center",
    fontSize: "12px",
    color: "#667eea",
    cursor: "pointer"
  }
};

// ==================== STYLES FOR MY COURSES ====================
const myCoursesStyles = {
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "28px"
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
    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
    gap: "24px"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
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
  }
};

// ==================== STYLES FOR CERTIFICATES ====================
const certificatesStyles = {
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
  errorContainer: {
    textAlign: "center",
    padding: "80px",
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
  emptyContainer: {
    textAlign: "center",
    padding: "80px",
    background: "white",
    borderRadius: "20px",
    margin: "28px"
  },
  header: {
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "24px"
  },
  certificateCard: {
    background: "white",
    borderRadius: "20px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    border: "1px solid #E2E8F0"
  },
  cardHeader: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cardIcon: {
    fontSize: "40px"
  },
  cardBadge: {
    padding: "4px 10px",
    background: "#10B981",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  courseName: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0F172A",
    padding: "16px 20px 8px 20px",
    margin: 0
  },
  certId: {
    fontSize: "11px",
    color: "#94A3B8",
    padding: "0 20px",
    margin: 0,
    fontFamily: "monospace"
  },
  cardFooter: {
    padding: "16px 20px 20px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #F1F5F9",
    marginTop: "12px"
  },
  issueDate: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#64748B"
  },
  viewBtn: {
    padding: "6px 14px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  }
};

// ==================== STYLES FOR ASSIGNMENTS TAB ====================
const assignmentsStyles = {
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
  errorContainer: {
    textAlign: "center",
    padding: "80px",
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
  emptyContainer: {
    textAlign: "center",
    padding: "80px",
    background: "white",
    borderRadius: "20px",
    margin: "28px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "28px"
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
    fontWeight: "500"
  },
  subjectSection: {
    marginBottom: "32px"
  },
  subjectTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "2px solid #E2E8F0"
  },
  assignmentsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: "20px"
  },
  assignmentCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #E2E8F0",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  unitBadge: {
    padding: "4px 10px",
    background: "#667eea15",
    color: "#667eea",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500"
  },
  submittedBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    background: "#10B98115",
    color: "#10B981",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500"
  },
  pendingBadge: {
    padding: "4px 10px",
    background: "#F59E0B15",
    color: "#F59E0B",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500"
  },
  assignmentTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "8px"
  },
  assignmentDescription: {
    fontSize: "13px",
    color: "#64748B",
    marginBottom: "12px",
    lineHeight: "1.5"
  },
  assignmentMeta: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
    padding: "8px 0",
    borderTop: "1px solid #F1F5F9",
    borderBottom: "1px solid #F1F5F9"
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#64748B"
  },
  fileSection: {
    marginBottom: "16px"
  },
  downloadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    background: "#F1F5F9",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#667eea",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  submissionInfo: {
    marginTop: "12px",
    padding: "12px",
    background: "#F8FAFC",
    borderRadius: "10px"
  },
  submissionStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#10B981",
    marginBottom: "8px"
  },
  marksInfo: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#0F172A",
    marginBottom: "8px"
  },
  feedback: {
    fontSize: "12px",
    color: "#64748B",
    marginTop: "4px"
  },
  viewSubmissionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    background: "white",
    border: "1px solid #E2E8F0",
    borderRadius: "6px",
    fontSize: "11px",
    color: "#667eea",
    cursor: "pointer",
    marginTop: "8px"
  },
  submitSection: {
    marginTop: "16px"
  },
  fileInputWrapper: {
    marginBottom: "12px"
  },
  fileLabel: {
    display: "block",
    padding: "10px",
    background: "#F8FAFC",
    border: "1px dashed #CBD5E1",
    borderRadius: "8px",
    textAlign: "center",
    fontSize: "12px",
    color: "#64748B",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  submitBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "10px",
    background: "#10B981",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  smallSpinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite"
  }
};

// ==================== STYLES FOR LIVE CLASSES ====================
const liveClassesStyles = {
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
  errorContainer: {
    textAlign: "center",
    padding: "80px",
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
  emptyState: {
    textAlign: "center",
    padding: "80px",
    background: "white",
    borderRadius: "20px",
    margin: "28px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "28px"
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
    fontWeight: "500"
  },
  section: {
    marginBottom: "40px"
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  sectionIcon: {
    color: "#0B63E5",
    fontSize: "18px"
  },
  meetingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: "24px"
  },
  meetingCard: {
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
    border: "1px solid #E2E8F0",
    transition: "all 0.3s ease"
  },
  liveCard: {
    border: "2px solid #EF4444",
    background: "linear-gradient(135deg, #fff 0%, #FEF2F2 100%)"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "10px"
  },
  liveBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#EF4444",
    color: "white",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "16px"
  },
  liveDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "white",
    borderRadius: "50%",
    animation: "pulse 1.5s infinite"
  },
  liveTag: {
    background: "#EF4444",
    color: "white",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px"
  },
  liveDotSmall: {
    width: "6px",
    height: "6px",
    backgroundColor: "white",
    borderRadius: "50%",
    animation: "pulse 1.5s infinite"
  },
  upcomingTag: {
    background: "#F59E0B",
    color: "white",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600"
  },
  subjectBadge: {
    background: "#EFF6FF",
    color: "#0B63E5",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500"
  },
  meetingTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "8px"
  },
  meetingDescription: {
    fontSize: "13px",
    color: "#64748B",
    marginBottom: "16px",
    lineHeight: "1.5"
  },
  meetingDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
    paddingTop: "12px",
    borderTop: "1px solid #F1F5F9"
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    color: "#475569"
  },
  cardFooter: {
    display: "flex",
    gap: "12px"
  },
  joinBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
    border: "none",
    padding: "10px",
    borderRadius: "12px",
    color: "white",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s ease"
  },
  reminderBtn: {
    flex: 1,
    background: "#F59E0B",
    border: "none",
    padding: "10px",
    borderRadius: "12px",
    color: "white",
    fontWeight: "500",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s ease"
  },
  copyBtn: {
    flex: 1,
    background: "#F1F5F9",
    border: "1px solid #E2E8F0",
    padding: "10px",
    borderRadius: "12px",
    color: "#475569",
    fontWeight: "500",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s ease"
  }
};

// ==================== STYLES FOR CERTIFICATE MODAL ====================
const certificateModalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "20px"
  },
  modal: {
    background: "white",
    borderRadius: "24px",
    maxWidth: "900px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative",
    padding: "30px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.3)"
  },
  closeBtn: {
    position: "absolute",
    top: "20px",
    right: "25px",
    fontSize: "30px",
    cursor: "pointer",
    color: "#94A3B8",
    zIndex: 10,
    transition: "color 0.2s ease",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%"
  },
  certificateWrapper: {
    padding: "20px"
  },
  certificate: {
    position: "relative",
    background: "linear-gradient(135deg, #fff 0%, #fef3c7 100%)",
    padding: "50px",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    border: "1px solid #e2e8f0",
    fontFamily: "'Georgia', serif"
  },
  topBorder: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    height: "3px",
    background: "linear-gradient(90deg, #667eea, #f59e0b, #667eea)",
    borderRadius: "2px"
  },
  bottomBorder: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    height: "3px",
    background: "linear-gradient(90deg, #667eea, #f59e0b, #667eea)",
    borderRadius: "2px"
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "30px"
  },
  logoIcon: {
    fontSize: "60px",
    marginBottom: "10px"
  },
  universityName: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1E3A8A",
    letterSpacing: "2px"
  },
  universityTagline: {
    fontSize: "12px",
    color: "#64748B",
    marginTop: "5px"
  },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-25deg)",
    fontSize: "80px",
    color: "rgba(102, 126, 234, 0.08)",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    fontFamily: "Arial, sans-serif"
  },
  title: {
    textAlign: "center",
    fontSize: "32px",
    color: "#667eea",
    marginBottom: "30px",
    letterSpacing: "3px",
    borderBottom: "2px solid #f59e0b",
    display: "inline-block",
    width: "100%",
    paddingBottom: "15px"
  },
  awardedTo: {
    textAlign: "center",
    fontSize: "18px",
    color: "#64748B",
    marginBottom: "15px"
  },
  studentName: {
    textAlign: "center",
    fontSize: "42px",
    color: "#1E3A8A",
    marginBottom: "20px",
    fontFamily: "'Brush Script MT', cursive"
  },
  completionText: {
    textAlign: "center",
    fontSize: "16px",
    color: "#475569",
    marginBottom: "10px"
  },
  courseName: {
    textAlign: "center",
    fontSize: "28px",
    color: "#f59e0b",
    marginBottom: "30px",
    fontWeight: "600"
  },
  teacherSection: {
    textAlign: "center",
    marginBottom: "15px",
    padding: "8px",
    background: "#f0fdf4",
    borderRadius: "8px",
    display: "inline-block",
    width: "auto",
    marginLeft: "auto",
    marginRight: "auto"
  },
  teacherLabel: {
    fontSize: "13px",
    color: "#166534",
    marginRight: "8px",
    fontWeight: "500"
  },
  teacherValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#15803d"
  },
  gradeSection: {
    textAlign: "center",
    marginBottom: "15px",
    padding: "10px",
    background: "#f8fafc",
    borderRadius: "8px",
    display: "inline-block",
    width: "auto",
    marginLeft: "auto",
    marginRight: "auto"
  },
  gradeLabel: {
    fontSize: "14px",
    color: "#64748B",
    marginRight: "10px"
  },
  gradeValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#10b981"
  },
  dateSection: {
    textAlign: "center",
    marginBottom: "15px"
  },
  dateLabel: {
    fontSize: "14px",
    color: "#64748B",
    marginRight: "10px"
  },
  dateValue: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1E3A8A"
  },
  certIdSection: {
    textAlign: "center",
    marginBottom: "30px"
  },
  certIdLabel: {
    fontSize: "12px",
    color: "#64748B",
    marginRight: "10px"
  },
  certIdValue: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#94A3B8"
  },
  signatureSection: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "40px",
    marginBottom: "30px"
  },
  signatureLeft: {
    textAlign: "center",
    flex: 1
  },
  signatureRight: {
    textAlign: "center",
    flex: 1
  },
  signatureLine: {
    width: "200px",
    height: "1px",
    background: "#333",
    margin: "0 auto 10px auto"
  },
  signatureName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1E3A8A",
    margin: 0
  },
  signatureTitle: {
    fontSize: "11px",
    color: "#64748B",
    margin: 0
  },
  footer: {
    textAlign: "center",
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid #e2e8f0"
  },
  verifyLink: {
    fontSize: "10px",
    color: "#94A3B8",
    marginTop: "5px"
  },
  buttons: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #E2E8F0"
  },
  downloadBtn: {
    padding: "12px 28px",
    background: "#10B981",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s ease"
  },
  closeBtnModal: {
    padding: "12px 28px",
    background: "#E2E8F0",
    color: "#475569",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease"
  }
};

// ==================== STYLES FOR COMPILER TAB ====================
const compilerStyles = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "32px 28px",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)"
  },
  header: {
    marginBottom: "28px"
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
  }
};

// Add global styles for pulse animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
    100% { opacity: 1; transform: scale(1); }
  }
`;
document.head.appendChild(styleSheet);

export default StudentDashboard;