// CourseContentView.js - Automatic Progress Tracking with Database and Certificate Generation
import React, { useState, useEffect, useRef } from "react";
import {
  FiBookOpen,
  FiVideo,
  FiFileText,
  FiClipboard,
  FiHelpCircle,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiCircle,
  FiDownload,
  FiClock,
  FiCalendar,
  FiUser,
  FiStar,
  FiPlay,
  FiPaperclip,
  FiSend,
  FiX,
  FiAlertCircle,
  FiRefreshCw,
  FiMenu,
  FiMaximize2,
  FiMinimize2,
  FiAward,
  FiTrendingUp,
  FiCheckSquare,
  FiSquare,
  FiEye,
  FiEyeOff
} from "react-icons/fi";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const token = localStorage.getItem("token");

const axiosConfig = {
  headers: { Authorization: `Bearer ${token}` }
};

const CourseContentView = ({ course, student, onBack, darkMode }) => {
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [expandedUnits, setExpandedUnits] = useState({});
  const [completedItems, setCompletedItems] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentSubmitted, setAssignmentSubmitted] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [animateProgress, setAnimateProgress] = useState(false);
  const [videoProgress, setVideoProgress] = useState({});
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const certificateRef = useRef(null);
  const videoRefs = useRef({});
  const progressSaveTimeout = useRef({});

  useEffect(() => {
    fetchCourseDetails();
    loadProgressFromDatabase();
    loadVideoProgressFromDatabase();
  }, [course.id]);

  // Force check certificate when overallProgress becomes 100
  useEffect(() => {
    const overallProgress = calculateOverallProgress();
    if (overallProgress === 100 && !certificateGenerated && courseData) {
      console.log("Force checking certificate on progress change - Progress is 100%");
      checkAndGenerateCertificate(100);
    }
  }, [completedItems, courseData]);

  // Check and generate certificate if course is completed
  const checkAndGenerateCertificate = async (overallProgress) => {
    console.log("checkAndGenerateCertificate called with progress:", overallProgress);
    console.log("Current certificateGenerated state:", certificateGenerated);
    
    if (overallProgress === 100 && !certificateGenerated) {
      console.log("Course completed! Checking certificate from backend...");
      
      try {
        const response = await axios.post(
          `${API_BASE_URL}/progress/check-certificate`,
          {
            subjectId: course.id,
            overallProgress: overallProgress
          },
          axiosConfig
        );
        
        console.log("Certificate check response:", response.data);
        
        if (response.data.success && response.data.certificateGenerated) {
          console.log("Certificate generated/retrieved:", response.data.certificate);
          setCertificateData(response.data.certificate);
          setCertificateGenerated(true);
          setShowCertificateModal(true);
          
          toast.success(
            <div>
              🎉🎓 CONGRATULATIONS! 🎓🎉
              <br />
              <strong>You've completed the course!</strong>
              <br />
              A professional certificate has been issued to you.
            </div>,
            { autoClose: 8000 }
          );
        } else if (response.data.certificateGenerated) {
          setCertificateGenerated(true);
          setCertificateData(response.data.certificate);
          setShowCertificateModal(true);
        }
      } catch (error) {
        console.error("Error checking certificate:", error);
        toast.success(
          <div>
            🎉🎓 CONGRATULATIONS! 🎓🎉
            <br />
            <strong>You've completed the course!</strong>
          </div>,
          { autoClose: 5000 }
        );
      }
    } else if (overallProgress === 100 && certificateGenerated) {
      console.log("Certificate already generated, showing modal");
      setShowCertificateModal(true);
    }
  };

  // Load progress from database
  const loadProgressFromDatabase = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/progress/${course.id}`,
        { params: { division: student?.division }, ...axiosConfig }
      );
      
      if (response.data.success) {
        const progress = response.data.progress;
        setCompletedItems(progress.completedItems || {});
        console.log("Progress loaded from database:", progress.completedItems);
        console.log("Overall progress from DB:", progress.overallProgress);
        
        await checkAndGenerateCertificate(progress.overallProgress);
      }
    } catch (error) {
      console.error("Error loading progress from database:", error);
      const saved = localStorage.getItem(`course_progress_${course.id}`);
      if (saved) {
        const savedProgress = JSON.parse(saved);
        setCompletedItems(savedProgress);
      }
    }
  };

  // Load video progress from database
  const loadVideoProgressFromDatabase = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/progress/video-progress/${course.id}`,
        { params: { division: student?.division }, ...axiosConfig }
      );
      
      if (response.data.success && response.data.videoProgress) {
        const savedProgress = {};
        Object.entries(response.data.videoProgress).forEach(([key, value]) => {
          savedProgress[key] = value.progress || 0;
        });
        setVideoProgress(savedProgress);
        console.log("Video progress loaded from database:", savedProgress);
      }
    } catch (error) {
      console.error("Error loading video progress:", error);
      const saved = localStorage.getItem(`video_progress_${course.id}`);
      if (saved) {
        setVideoProgress(JSON.parse(saved));
      }
    }
  };

  // Save progress to database
  const saveProgressToDatabase = async (itemId, completed, itemType) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/progress/toggle-complete`,
        {
          subjectId: course.id,
          itemId: itemId,
          completed: completed,
          itemType: itemType,
          division: student?.division
        },
        axiosConfig
      );
      
      if (response.data.success) {
        console.log("Progress saved to database:", response.data);
        setAnimateProgress(true);
        setTimeout(() => setAnimateProgress(false), 500);
        
        setCompletedItems(prev => ({ ...prev, [itemId]: completed }));
        
        if (response.data.overallProgress === 100) {
          await checkAndGenerateCertificate(100);
        }
      }
    } catch (error) {
      console.error("Error saving progress to database:", error);
      saveCompletedItemsToLocal({ ...completedItems, [itemId]: completed });
    }
  };

  // Save video progress to database
  const saveVideoProgressToDatabase = async (contentId, videoIndex, progress, isCompleted) => {
    try {
      console.log(`Saving video progress: ${contentId}_${videoIndex} - ${progress}% - Completed: ${isCompleted}`);
      
      const response = await axios.post(
        `${API_BASE_URL}/progress/video-progress`,
        {
          subjectId: course.id,
          contentId: contentId,
          videoIndex: videoIndex,
          progress: progress,
          isCompleted: isCompleted
        },
        { params: { division: student?.division }, ...axiosConfig }
      );
      
      if (response.data.success) {
        console.log(`Video progress saved successfully:`, response.data);
        const savedProgress = { ...videoProgress, [`${contentId}_${videoIndex}`]: progress };
        localStorage.setItem(`video_progress_${course.id}`, JSON.stringify(savedProgress));
      }
    } catch (error) {
      console.error("Error saving video progress:", error);
      const savedProgress = { ...videoProgress, [`${contentId}_${videoIndex}`]: progress };
      localStorage.setItem(`video_progress_${course.id}`, JSON.stringify(savedProgress));
    }
  };

  const saveCompletedItemsToLocal = (items) => {
    localStorage.setItem(`course_progress_${course.id}`, JSON.stringify(items));
  };

  const downloadCertificateAsHTML = () => {
    if (!certificateRef.current) return;
    
    const certificateHTML = certificateRef.current.outerHTML;
    const blob = new Blob([certificateHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificate_${course.name.replace(/\s/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Certificate downloaded as HTML!");
  };

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/subjects/${course.id}/details`,
        { params: { division: student?.division }, ...axiosConfig }
      );
      
      console.log("Course details:", response.data);
      setCourseData(response.data);
      
      if (response.data.units && response.data.units.length > 0) {
        const firstUnitId = response.data.units[0]._id;
        setExpandedUnits({ [firstUnitId]: true });
        
        const firstUnit = response.data.units[0];
        if (firstUnit.contents && firstUnit.contents.length > 0) {
          setSelectedItem(firstUnit.contents[0]);
          setSelectedItemType("content");
        } else if (firstUnit.assignments && firstUnit.assignments.length > 0) {
          setSelectedItem(firstUnit.assignments[0]);
          setSelectedItemType("assignment");
        } else if (firstUnit.quizzes && firstUnit.quizzes.length > 0) {
          setSelectedItem(firstUnit.quizzes[0]);
          setSelectedItemType("quiz");
        }
      }
      
    } catch (err) {
      console.error("Error fetching course details:", err);
      setError(err.response?.data?.message || "Failed to load course content");
    } finally {
      setLoading(false);
    }
  };

  const toggleUnit = (unitId) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  const expandAllUnits = () => {
    const allExpanded = {};
    courseData?.units?.forEach(unit => {
      allExpanded[unit._id] = true;
    });
    setExpandedUnits(allExpanded);
  };

  const collapseAllUnits = () => {
    setExpandedUnits({});
  };

  const selectItem = (item, type, unit) => {
    setSelectedItem(item);
    setSelectedItemType(type);
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizAnswers({});
  };

  const handleVideoProgress = (contentId, videoIndex, progress) => {
    const videoKey = `${contentId}_${videoIndex}`;
    setVideoProgress(prev => ({
      ...prev,
      [videoKey]: progress
    }));
    
    if (progressSaveTimeout.current[videoKey]) {
      clearTimeout(progressSaveTimeout.current[videoKey]);
    }
    
    progressSaveTimeout.current[videoKey] = setTimeout(() => {
      if (Math.floor(progress) % 10 === 0 || progress === 100) {
        saveVideoProgressToDatabase(contentId, videoIndex, progress, false);
      }
    }, 1000);
  };

  const handleVideoComplete = async (contentId, videoIndex, totalVideos) => {
    const videoKey = `${contentId}_${videoIndex}`;
    
    console.log(`Video ${videoIndex} completed! Total videos: ${totalVideos}`);
    
    setVideoProgress(prev => {
      const updated = { ...prev, [videoKey]: 100 };
      
      let allCompleted = true;
      for (let i = 0; i < totalVideos; i++) {
        if (updated[`${contentId}_${i}`] !== 100) {
          allCompleted = false;
          break;
        }
      }
      
      console.log(`All videos completed: ${allCompleted}`);
      
      if (allCompleted && !completedItems[contentId]) {
        console.log(`Marking content ${contentId} as complete`);
        setTimeout(async () => {
          setCompletedItems(prevItems => ({ ...prevItems, [contentId]: true }));
          await saveProgressToDatabase(contentId, true, "content");
          toast.success(`🎉 "${selectedItem?.topic}" completed! All videos watched.`);
          
          setAnimateProgress(true);
          setTimeout(() => setAnimateProgress(false), 500);
        }, 100);
      } else if (!allCompleted) {
        const completedCount = Object.keys(updated).filter(key => 
          key.startsWith(`${contentId}_`) && updated[key] === 100
        ).length;
        toast.success(`✅ Video completed! ${completedCount}/${totalVideos} videos watched.`);
      }
      
      return updated;
    });
    
    await saveVideoProgressToDatabase(contentId, videoIndex, 100, true);
  };

  const handleQuizSubmit = async () => {
    if (!selectedItem || !selectedItem.questions || selectedItem.questions.length === 0) {
      toast.error("No questions available for this quiz");
      return;
    }
    
    let score = 0;
    let total = 0;
    
    selectedItem.questions.forEach((question, idx) => {
      const marks = question.marks || 1;
      total += marks;
      if (quizAnswers[idx] !== undefined && quizAnswers[idx] === question.correctAnswer) {
        score += marks;
      }
    });
    
    const percentage = total > 0 ? (score / total) * 100 : 0;
    const passingScore = selectedItem.passingScore || 70;
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/progress/quiz-score`,
        {
          subjectId: course.id,
          quizId: selectedItem.id,
          score: score,
          total: total,
          percentage: percentage
        },
        axiosConfig
      );
      
      setQuizScore({ score, total, percentage });
      setQuizSubmitted(true);
      
      if (percentage >= passingScore && !completedItems[selectedItem.id]) {
        setCompletedItems(prev => ({ ...prev, [selectedItem.id]: true }));
        await saveProgressToDatabase(selectedItem.id, true, "quiz");
        toast.success(`🎉 Quiz passed with ${Math.round(percentage)}%! Great job!`);
      } else if (percentage >= passingScore) {
        toast.success(`You scored ${score}/${total} (${Math.round(percentage)}%) - Passed!`);
      } else {
        toast.warning(`You scored ${score}/${total} (${Math.round(percentage)}%) - Need ${passingScore}% to pass. Try again!`);
      }
      
      setAnimateProgress(true);
      setTimeout(() => setAnimateProgress(false), 500);
      
    } catch (error) {
      console.error("Error saving quiz score:", error);
      toast.error("Failed to save quiz score");
      setQuizScore({ score, total, percentage });
      setQuizSubmitted(true);
    }
  };

  const handleAssignmentSubmit = async (assignmentId) => {
    if (!assignmentFile) {
      toast.error("Please select a file to submit");
      return;
    }
    
    if (assignmentFile.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }
    
    setAssignmentSubmitting(true);
    
    const formData = new FormData();
    formData.append("assignment", assignmentFile);
    formData.append("assignmentId", assignmentId);
    formData.append("subjectId", course.id);
    
    try {
      const uploadResponse = await axios.post(
        `${API_BASE_URL}/assignments/submit`,
        formData,
        {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000
        }
      );
      
      if (uploadResponse.data.success) {
        setAssignmentSubmitted(prev => ({ ...prev, [assignmentId]: true }));
        setAssignmentFile(null);
        
        if (!completedItems[assignmentId]) {
          setCompletedItems(prev => ({ ...prev, [assignmentId]: true }));
          await saveProgressToDatabase(assignmentId, true, "assignment");
          toast.success("🎉 Assignment submitted and marked as complete!");
        } else {
          toast.success("Assignment submitted successfully!");
        }
        
        setAnimateProgress(true);
        setTimeout(() => setAnimateProgress(false), 500);
        
        const fileInput = document.getElementById('assignmentFile');
        if (fileInput) fileInput.value = '';
      }
      
    } catch (error) {
      console.error("Error submitting assignment:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to submit assignment";
      toast.error(errorMessage);
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const calculateOverallProgress = () => {
    if (!courseData || !courseData.units) return 0;
    
    let totalItems = 0;
    let completedCount = 0;
    
    courseData.units.forEach(unit => {
      if (unit.contents) {
        unit.contents.forEach(content => {
          totalItems++;
          if (completedItems[content.id]) completedCount++;
        });
      }
      if (unit.assignments) {
        unit.assignments.forEach(assignment => {
          totalItems++;
          if (completedItems[assignment.id]) completedCount++;
        });
      }
      if (unit.quizzes) {
        unit.quizzes.forEach(quiz => {
          totalItems++;
          if (completedItems[quiz.id]) completedCount++;
        });
      }
    });
    
    return totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  };

  const getItemTypeIcon = (type) => {
    switch(type) {
      case 'content': return <FiVideo size={16} color="#667eea" />;
      case 'assignment': return <FiClipboard size={16} color="#F59E0B" />;
      case 'quiz': return <FiHelpCircle size={16} color="#10B981" />;
      default: return <FiFileText size={16} color="#94A3B8" />;
    }
  };

  const getItemTypeLabel = (type) => {
    switch(type) {
      case 'content': return "Video";
      case 'assignment': return "Assignment";
      case 'quiz': return "Quiz";
      default: return "Resource";
    }
  };

  const getVideoUrl = (videoFilename) => {
    if (!videoFilename) return null;
    return `${API_BASE_URL}/content/download/${videoFilename}`;
  };

  const getFileUrl = (filename) => {
    if (!filename) return null;
    return `${API_BASE_URL}/content/download/${filename}`;
  };

  const getAssignmentFileUrl = (filename) => {
    if (!filename) return null;
    return `${API_BASE_URL}/assignments/download/${filename}`;
  };

  const overallProgress = calculateOverallProgress();
  const completedCount = Object.values(completedItems).filter(v => v === true).length;
  const totalItems = courseData?.units?.reduce((acc, unit) => {
    return acc + (unit.contents?.length || 0) + (unit.assignments?.length || 0) + (unit.quizzes?.length || 0);
  }, 0) || 0;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading course content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <FiAlertCircle size={48} color="#EF4444" />
        <h3>Unable to Load Content</h3>
        <p>{error}</p>
        <button style={styles.retryBtn} onClick={fetchCourseDetails}>Try Again</button>
        <button style={styles.backBtn} onClick={onBack}>Go Back</button>
      </div>
    );
  }

  if (!courseData || !courseData.units) return null;

  return (
    <div style={styles.container}>
      <ToastContainer />
      
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backButton} onClick={onBack}>
            <FiChevronLeft size={20} /> Back to Courses
          </button>
          <div style={styles.headerInfo}>
            <h1 style={styles.courseTitle}>{course.name}</h1>
            <div style={styles.courseMeta}>
              <span><FiUser size={14} /> {courseData.subject?.teacher?.name || course.instructor}</span>
              <span><FiStar size={14} /> {course.credits || 3} Credits</span>
              <span><FiCalendar size={14} /> Semester {course.semester}</span>
              <span><FiAward size={14} /> {completedCount}/{totalItems} Completed</span>
            </div>
          </div>
        </div>
        <button 
          style={styles.collapseBtn}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <FiMaximize2 size={18} /> : <FiMinimize2 size={18} />}
        </button>
      </div>

      <div style={styles.progressSection}>
        <div style={styles.progressHeader}>
          <div style={styles.progressTitle}>
            <FiTrendingUp size={18} color="#667eea" />
            <span>Course Progress</span>
          </div>
          <div style={styles.progressStats}>
            <span style={styles.progressPercentage}>{overallProgress}%</span>
            <span style={styles.progressCount}>Complete</span>
          </div>
        </div>
        <div style={styles.progressBarContainer}>
          <div 
            style={{ 
              ...styles.progressBar, 
              width: `${overallProgress}%`,
              transition: animateProgress ? "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" : "width 0.3s ease"
            }} 
          />
          <div style={styles.progressGlow} />
        </div>
        <div style={styles.progressDetails}>
          <div style={styles.progressDetailItem}>
            <FiCheckSquare size={12} color="#10B981" />
            <span>{completedCount} of {totalItems} items completed</span>
          </div>
          <div style={styles.progressDetailItem}>
            <FiAward size={12} color="#F59E0B" />
            <span>{Math.floor(overallProgress / 10)} of 10 badges earned</span>
          </div>
        </div>
      </div>

      <div style={{ ...styles.mainLayout, gridTemplateColumns: sidebarCollapsed ? "0px 1fr" : "380px 1fr" }}>
        
        <div style={{ ...styles.sidebar, display: sidebarCollapsed ? "none" : "flex" }}>
          <div style={styles.sidebarHeader}>
            <div>
              <h3 style={styles.sidebarTitle}>Course Content</h3>
              <p style={styles.sidebarSubtitle}>{courseData.units.length} units • {totalItems} items</p>
            </div>
            <div style={styles.expandButtons}>
              <button onClick={expandAllUnits} style={styles.expandBtn} title="Expand All">
                <FiChevronDown size={14} />
              </button>
              <button onClick={collapseAllUnits} style={styles.expandBtn} title="Collapse All">
                <FiChevronUp size={14} />
              </button>
            </div>
          </div>
          
          <div style={styles.unitsList}>
            {courseData.units.map((unit, unitIdx) => {
              const unitItems = (unit.contents?.length || 0) + (unit.assignments?.length || 0) + (unit.quizzes?.length || 0);
              const unitCompleted = (unit.contents?.filter(c => completedItems[c.id]).length || 0) +
                                    (unit.assignments?.filter(a => completedItems[a.id]).length || 0) +
                                    (unit.quizzes?.filter(q => completedItems[q.id]).length || 0);
              const unitProgress = unitItems > 0 ? Math.round((unitCompleted / unitItems) * 100) : 0;
              
              return (
              <div key={unit._id} style={styles.unitContainer}>
                <div 
                  style={styles.unitHeader}
                  onClick={() => toggleUnit(unit._id)}
                >
                  <div style={styles.unitHeaderLeft}>
                    <div style={styles.unitNumberBadge}>Unit {unit.unitNumber}</div>
                    <div>
                      <div style={styles.unitTitle}>{unit.unitTitle}</div>
                      <div style={styles.unitProgressBar}>
                        <div style={{ ...styles.unitProgressFill, width: `${unitProgress}%` }} />
                      </div>
                    </div>
                  </div>
                  <div style={styles.unitHeaderRight}>
                    <span style={styles.unitProgressText}>{unitProgress}%</span>
                    {expandedUnits[unit._id] ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                  </div>
                </div>
                
                {expandedUnits[unit._id] && (
                  <div style={styles.unitContentList}>
                    {unit.contents && unit.contents.map((content, contentIdx) => (
                      <div key={content.id}>
                        <div style={styles.contentGroupHeader}>
                          <FiVideo size={14} color="#667eea" />
                          <span style={styles.contentGroupTitle}>{content.topic}</span>
                          {completedItems[content.id] && (
                            <span style={styles.completedTag}>
                              <FiCheckCircle size={12} /> Completed
                            </span>
                          )}
                        </div>
                        
                        {content.items && content.items.map((video, videoIdx) => (
                          <div
                            key={`${content.id}_video_${videoIdx}`}
                            style={{
                              ...styles.videoItem,
                              background: selectedItem?.id === content.id && selectedItemType === "content" ? "#667eea08" : "transparent",
                              borderLeft: selectedItem?.id === content.id && selectedItemType === "content" ? "3px solid #667eea" : "3px solid transparent"
                            }}
                            onMouseEnter={() => setHoveredItem(`${content.id}_${videoIdx}`)}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <div style={styles.videoItemLeft} onClick={() => selectItem(content, "content", unit)}>
                              <div style={styles.videoItemIcon}>
                                <FiPlay size={14} color="#667eea" />
                              </div>
                              <div style={styles.videoItemInfo}>
                                <div style={styles.videoItemTitle}>
                                  {video.title || `Video ${videoIdx + 1}`}
                                </div>
                                <div style={styles.videoItemDuration}>
                                  {video.duration > 0 ? `${video.duration} min` : "Video"}
                                </div>
                              </div>
                            </div>
                            <div style={styles.videoItemRight}>
                              {videoProgress[`${content.id}_${videoIdx}`] === 100 ? (
                                <FiCheckCircle size={16} color="#10B981" />
                              ) : videoProgress[`${content.id}_${videoIdx}`] > 0 ? (
                                <div style={styles.videoProgressRing}>
                                  <div style={{ 
                                    width: "24px", 
                                    height: "24px", 
                                    borderRadius: "50%",
                                    background: `conic-gradient(#10B981 ${videoProgress[`${content.id}_${videoIdx}`] * 3.6}deg, #E2E8F0 0deg)`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "10px",
                                    fontWeight: "600",
                                    color: "#10B981"
                                  }}>
                                    {Math.round(videoProgress[`${content.id}_${videoIdx}`])}%
                                  </div>
                                </div>
                              ) : (
                                <FiCircle size={16} color="#94A3B8" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                    
                    {unit.assignments && unit.assignments.map(assignment => (
                      <div
                        key={assignment.id}
                        style={{
                          ...styles.contentItem,
                          background: selectedItem?.id === assignment.id && selectedItemType === "assignment" ? "#F59E0B08" : "transparent",
                          borderLeft: selectedItem?.id === assignment.id && selectedItemType === "assignment" ? "3px solid #F59E0B" : "3px solid transparent"
                        }}
                        onMouseEnter={() => setHoveredItem(assignment.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <div style={styles.contentItemLeft} onClick={() => selectItem(assignment, "assignment", unit)}>
                          <div style={styles.contentItemIcon}>
                            {getItemTypeIcon("assignment")}
                          </div>
                          <div style={styles.contentItemInfo}>
                            <div style={styles.contentItemTitle}>{assignment.title}</div>
                            <div style={styles.contentItemType}>Assignment • {assignment.totalMarks} marks</div>
                          </div>
                        </div>
                        <div style={styles.contentItemRight}>
                          {completedItems[assignment.id] ? (
                            <FiCheckCircle size={18} color="#10B981" />
                          ) : assignmentSubmitted[assignment.id] ? (
                            <FiCheckCircle size={18} color="#10B981" />
                          ) : (
                            <FiCircle size={18} color="#94A3B8" />
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {unit.quizzes && unit.quizzes.map(quiz => (
                      <div
                        key={quiz.id}
                        style={{
                          ...styles.contentItem,
                          background: selectedItem?.id === quiz.id && selectedItemType === "quiz" ? "#10B98108" : "transparent",
                          borderLeft: selectedItem?.id === quiz.id && selectedItemType === "quiz" ? "3px solid #10B981" : "3px solid transparent"
                        }}
                        onMouseEnter={() => setHoveredItem(quiz.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <div style={styles.contentItemLeft} onClick={() => selectItem(quiz, "quiz", unit)}>
                          <div style={styles.contentItemIcon}>
                            {getItemTypeIcon("quiz")}
                          </div>
                          <div style={styles.contentItemInfo}>
                            <div style={styles.contentItemTitle}>Quiz: {quiz.title || `Unit ${unit.unitNumber} Quiz`}</div>
                            <div style={styles.contentItemType}>Quiz • {quiz.questions?.length || 0} questions • Passing: 70%</div>
                          </div>
                        </div>
                        <div style={styles.contentItemRight}>
                          {completedItems[quiz.id] ? (
                            <FiCheckCircle size={18} color="#10B981" />
                          ) : (
                            <FiCircle size={18} color="#94A3B8" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>

        <div style={styles.mainContent}>
          {selectedItem ? (
            <div style={styles.contentViewer}>
              <div style={styles.contentViewerHeader}>
                <div style={styles.contentViewerIcon}>
                  {getItemTypeIcon(selectedItemType)}
                </div>
                <div style={styles.contentViewerInfo}>
                  <div style={styles.contentViewerType}>{getItemTypeLabel(selectedItemType)}</div>
                  <h2 style={styles.contentViewerTitle}>
                    {selectedItemType === "content" ? selectedItem.topic : 
                     selectedItemType === "assignment" ? selectedItem.title : 
                     `Quiz: ${selectedItem.title || "Knowledge Check"}`}
                  </h2>
                  {selectedItemType === "content" && (
                    <p style={styles.contentViewerMeta}>
                      {selectedItem.items?.length || 0} videos • {selectedItem.files?.length || 0} resources
                    </p>
                  )}
                  {selectedItemType === "assignment" && (
                    <p style={styles.contentViewerMeta}>
                      {selectedItem.totalMarks} marks • Due: {selectedItem.deadline ? new Date(selectedItem.deadline).toLocaleDateString() : 'No deadline'}
                    </p>
                  )}
                  {selectedItemType === "quiz" && (
                    <p style={styles.contentViewerMeta}>
                      {selectedItem.questions?.length || 0} questions • {selectedItem.totalMarks} marks • {selectedItem.duration} minutes • Passing: 70%
                    </p>
                  )}
                </div>
                {completedItems[selectedItem.id] && (
                  <div style={styles.completedBadge}>
                    <FiCheckCircle size={16} /> Completed
                  </div>
                )}
              </div>

              <div style={styles.contentViewerBody}>
                {selectedItemType === "content" && (
                  <div>
                    {selectedItem.items && selectedItem.items.length > 0 ? (
                      <div style={styles.videosSection}>
                        <h3 style={styles.sectionTitle}>
                          <FiVideo size={18} /> Lecture Videos ({selectedItem.items.length})
                        </h3>
                        {selectedItem.items.map((video, idx) => (
                          <div key={idx} style={styles.videoCard}>
                            <div style={styles.videoHeader}>
                              <div style={styles.videoTitleWrapper}>
                                <div style={styles.videoPlayIcon}>
                                  <FiPlay size={20} color="#667eea" />
                                </div>
                                <div>
                                  <div style={styles.videoTitle}>{video.title || `Video ${idx + 1}`}</div>
                                  {video.duration > 0 && (
                                    <div style={styles.videoDuration}>
                                      <FiClock size={12} /> {video.duration} minutes
                                    </div>
                                  )}
                                </div>
                              </div>
                              {videoProgress[`${selectedItem.id}_${idx}`] === 100 && (
                                <div style={styles.videoCompletedBadge}>
                                  <FiCheckCircle size={14} color="#10B981" /> Watched
                                </div>
                              )}
                            </div>
                            {video.description && <p style={styles.videoDescription}>{video.description}</p>}
                            {video.video ? (
                              <video 
                                controls 
                                style={styles.videoPlayer}
                                src={getVideoUrl(video.video)}
                                onTimeUpdate={(e) => {
                                  const progress = (e.target.currentTime / e.target.duration) * 100;
                                  handleVideoProgress(selectedItem.id, idx, progress);
                                }}
                                onEnded={() => {
                                  console.log(`Video ${idx} ended, marking as completed`);
                                  handleVideoComplete(selectedItem.id, idx, selectedItem.items.length);
                                }}
                                ref={el => videoRefs.current[`${selectedItem.id}_${idx}`] = el}
                              >
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <div style={styles.noVideoPlaceholder}>
                                <FiVideo size={48} color="#94A3B8" />
                                <p>Video content will be added soon</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={styles.noContentMessage}>
                        <FiVideo size={48} color="#CBD5E1" />
                        <p>No video content available for this topic</p>
                      </div>
                    )}
                    
                    {selectedItem.files && selectedItem.files.length > 0 && (
                      <div style={styles.resourcesSection}>
                        <h3 style={styles.sectionTitle}>
                          <FiPaperclip size={18} /> Resources ({selectedItem.files.length})
                        </h3>
                        <div style={styles.resourcesList}>
                          {selectedItem.files.map((file, idx) => (
                            <div key={idx} style={styles.resourceItem}>
                              <FiPaperclip size={16} color="#667eea" />
                              <span style={styles.resourceName}>{file.originalName || file.filename}</span>
                              <span style={styles.fileSize}>
                                {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                              </span>
                              <a href={getFileUrl(file.filename)} download style={styles.downloadLink}>
                                <FiDownload size={14} /> Download
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedItemType === "assignment" && (
                  <div>
                    {selectedItem.description && (
                      <div style={styles.assignmentDescription}>
                        <h3>Description</h3>
                        <p>{selectedItem.description}</p>
                      </div>
                    )}
                    
                    {selectedItem.assignmentFile && (
                      <div style={styles.assignmentFileSection}>
                        <h3>Assignment File</h3>
                        <a href={getAssignmentFileUrl(selectedItem.assignmentFile.filename)} download style={styles.downloadAssignmentBtn}>
                          <FiDownload size={16} /> Download {selectedItem.assignmentFile.originalName || 'Assignment File'}
                        </a>
                      </div>
                    )}
                    
                    {!assignmentSubmitted[selectedItem.id] && !completedItems[selectedItem.id] && (
                      <div style={styles.submissionSection}>
                        <h3>Submit Your Work</h3>
                        <div style={styles.fileInputWrapper}>
                          <input type="file" id="assignmentFile" style={styles.fileInput} onChange={(e) => setAssignmentFile(e.target.files[0])} />
                          <label htmlFor="assignmentFile" style={styles.fileLabel}>
                            {assignmentFile ? assignmentFile.name : "Choose File"}
                          </label>
                        </div>
                        <button style={styles.submitBtn} onClick={() => handleAssignmentSubmit(selectedItem.id)} disabled={assignmentSubmitting || !assignmentFile}>
                          {assignmentSubmitting ? (
                            <><div style={styles.smallSpinner} /> Submitting...</>
                          ) : (
                            <><FiSend size={16} /> Submit Assignment</>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {(assignmentSubmitted[selectedItem.id] || completedItems[selectedItem.id]) && (
                      <div style={styles.submissionSuccess}>
                        <FiCheckCircle size={48} color="#10B981" />
                        <h3>Assignment Submitted!</h3>
                        <p>Your assignment has been submitted and marked as complete.</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedItemType === "quiz" && !quizSubmitted && (
                  <div>
                    <div style={styles.quizInfoBar}>
                      <div><FiHelpCircle size={14} /> {selectedItem.questions?.length || 0} Questions</div>
                      <div><FiStar size={14} /> {selectedItem.totalMarks} Total Marks</div>
                      <div><FiClock size={14} /> {selectedItem.duration} Minutes</div>
                      <div><FiAward size={14} /> Passing: 70%</div>
                    </div>
                    
                    {selectedItem.questions && selectedItem.questions.length > 0 ? (
                      <div style={styles.questionsList}>
                        {selectedItem.questions.map((question, idx) => (
                          <div key={idx} style={styles.questionCard}>
                            <div style={styles.questionHeader}>
                              <span style={styles.questionNumber}>Q{idx + 1}</span>
                              <span style={styles.questionText}>{question.question}</span>
                              <span style={styles.questionMarks}>({question.marks || 1} marks)</span>
                            </div>
                            <div style={styles.optionsList}>
                              {question.options.map((option, optIdx) => (
                                <label key={optIdx} style={styles.optionLabel}>
                                  <input type="radio" name={`q${idx}`} value={optIdx} checked={quizAnswers[idx] === optIdx} onChange={() => setQuizAnswers({ ...quizAnswers, [idx]: optIdx })} />
                                  <span style={styles.optionText}>{option}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={styles.noContentMessage}>
                        <FiHelpCircle size={48} color="#CBD5E1" />
                        <p>No questions available for this quiz</p>
                      </div>
                    )}
                    
                    <button style={styles.submitQuizBtn} onClick={handleQuizSubmit} disabled={!selectedItem.questions || selectedItem.questions.length === 0}>
                      Submit Quiz
                    </button>
                  </div>
                )}

                {quizSubmitted && quizScore && (
                  <div style={styles.quizResult}>
                    <div style={styles.resultIcon}>
                      {quizScore.percentage >= 70 ? <div style={styles.passIcon}>🎉</div> : <div style={styles.failIcon}>📚</div>}
                    </div>
                    <h2>Quiz Completed!</h2>
                    <div style={styles.scoreCircle}>
                      <div style={styles.scoreNumber}>{Math.round(quizScore.percentage)}%</div>
                      <div style={styles.scoreLabel}>Score</div>
                    </div>
                    <div style={styles.scoreDisplay}>Your Score: {quizScore.score} / {quizScore.total}</div>
                    <div style={styles.resultMessage}>
                      {quizScore.percentage >= 70 
                        ? "🎉 Congratulations! You passed the quiz. Great job!" 
                        : "📚 You scored below 70%. Review the material and try again."}
                    </div>
                    {quizScore.percentage < 70 && (
                      <button style={styles.retakeQuizBtn} onClick={() => { setQuizSubmitted(false); setQuizScore(null); setQuizAnswers({}); }}>
                        Retake Quiz
                      </button>
                    )}
                    {quizScore.percentage >= 70 && (
                      <button style={styles.closeResultBtn} onClick={() => { setQuizSubmitted(false); setQuizScore(null); setQuizAnswers({}); }}>
                        Continue
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={styles.noSelectionMessage}>
              <div style={styles.noSelectionIcon}>
                <FiBookOpen size={64} color="#CBD5E1" />
              </div>
              <h3>Select a topic to begin</h3>
              <p>Choose a video, assignment, or quiz from the sidebar to start learning</p>
            </div>
          )}
        </div>
      </div>

      {showCertificateModal && (
        <div style={certificateStyles.overlay} onClick={() => setShowCertificateModal(false)}>
          <div style={certificateStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={certificateStyles.closeBtn} onClick={() => setShowCertificateModal(false)}>×</div>
            
            <div ref={certificateRef} style={certificateStyles.certificateWrapper}>
              <div style={certificateStyles.certificate}>
                <div style={certificateStyles.topBorder}></div>
                
                <div style={certificateStyles.logoContainer}>
                  <div style={certificateStyles.logoIcon}>🎓</div>
                  <div style={certificateStyles.universityName}>LJ UNIVERSITY</div>
                  <div style={certificateStyles.universityTagline}>Empowering Minds, Shaping Futures</div>
                </div>
                
                <div style={certificateStyles.watermark}>LJ UNIVERSITY</div>
                
                <h1 style={certificateStyles.title}>CERTIFICATE OF COMPLETION</h1>
                
                <p style={certificateStyles.awardedTo}>This certificate is proudly presented to</p>
                <h2 style={certificateStyles.studentName}>{student?.name || "Student"}</h2>
                
                <p style={certificateStyles.completionText}>for successfully completing the course</p>
                <h3 style={certificateStyles.courseName}>{course.name}</h3>
                
                <div style={certificateStyles.gradeSection}>
                  <span style={certificateStyles.gradeLabel}>Final Grade:</span>
                  <span style={certificateStyles.gradeValue}>Completed with Distinction</span>
                </div>
                
                <div style={certificateStyles.dateSection}>
                  <span style={certificateStyles.dateLabel}>Date of Issue:</span>
                  <span style={certificateStyles.dateValue}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                
                <div style={certificateStyles.certIdSection}>
                  <span style={certificateStyles.certIdLabel}>Certificate ID:</span>
                  <span style={certificateStyles.certIdValue}>
                    {certificateData?.certificateId || `LJ-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`}
                  </span>
                </div>
                
                <div style={certificateStyles.signatureSection}>
                  <div style={certificateStyles.signatureLeft}>
                    <div style={certificateStyles.signatureLine}></div>
                    <p style={certificateStyles.signatureName}>Dr. Sarah Johnson</p>
                    <p style={certificateStyles.signatureTitle}>Dean of Academics</p>
                  </div>
                  <div style={certificateStyles.signatureRight}>
                    <div style={certificateStyles.signatureLine}></div>
                    <p style={certificateStyles.signatureName}>Prof. Michael Chen</p>
                    <p style={certificateStyles.signatureTitle}>Course Director</p>
                  </div>
                </div>
                
                <div style={certificateStyles.footer}>
                  <p>This certificate is issued by LJ University and verifies the successful completion of all course requirements.</p>
                  <p style={certificateStyles.verifyLink}>Verify at: https://www.ljuniversity.edu/verify/{Date.now().toString().slice(-8)}</p>
                </div>
                
                <div style={certificateStyles.bottomBorder}></div>
              </div>
            </div>
            
            <div style={certificateStyles.buttons}>
              <button style={certificateStyles.downloadBtn} onClick={downloadCertificateAsHTML}>
                <FiDownload size={16} /> Download Certificate
              </button>
              <button style={certificateStyles.closeBtnModal} onClick={() => setShowCertificateModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles object (keep all your existing styles here)
const styles = {
  container: { minHeight: "100vh", background: "#F8FAFC", padding: "20px 32px" },
  loadingContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" },
  spinner: { width: "50px", height: "50px", border: "3px solid #E2E8F0", borderTopColor: "#667eea", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  errorContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" },
  retryBtn: { marginTop: "16px", padding: "10px 24px", background: "#667eea", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" },
  backBtn: { marginTop: "12px", padding: "10px 24px", background: "transparent", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: "10px", cursor: "pointer" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  headerLeft: { flex: 1 },
  backButton: { display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "white", border: "1px solid #E2E8F0", borderRadius: "10px", cursor: "pointer", fontSize: "14px", color: "#475569", marginBottom: "20px", transition: "all 0.2s ease" },
  collapseBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", background: "white", border: "1px solid #E2E8F0", borderRadius: "10px", cursor: "pointer", color: "#64748B", transition: "all 0.2s ease" },
  headerInfo: { marginTop: "8px" },
  courseTitle: { fontSize: "28px", fontWeight: "700", color: "#0F172A", marginBottom: "8px" },
  courseMeta: { display: "flex", gap: "20px", fontSize: "13px", color: "#64748B", flexWrap: "wrap" },
  progressSection: { background: "white", borderRadius: "16px", padding: "20px 24px", marginBottom: "24px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  progressTitle: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", color: "#334155" },
  progressStats: { display: "flex", alignItems: "baseline", gap: "8px" },
  progressPercentage: { fontSize: "24px", fontWeight: "700", color: "#667eea" },
  progressCount: { fontSize: "12px", color: "#64748B" },
  progressBarContainer: { position: "relative", height: "8px", background: "#E2E8F0", borderRadius: "4px", overflow: "hidden", marginBottom: "12px" },
  progressBar: { height: "100%", background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)", borderRadius: "4px", position: "relative", transition: "width 0.3s ease" },
  progressGlow: { position: "absolute", top: 0, right: 0, width: "100px", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3))", animation: "shine 2s infinite" },
  progressDetails: { display: "flex", gap: "24px", fontSize: "12px", color: "#64748B" },
  progressDetailItem: { display: "flex", alignItems: "center", gap: "6px" },
  mainLayout: { display: "grid", gap: "24px", transition: "all 0.3s ease" },
  sidebar: { background: "white", borderRadius: "20px", border: "1px solid #E2E8F0", overflow: "hidden", height: "calc(100vh - 240px)", position: "sticky", top: "20px", display: "flex", flexDirection: "column" },
  sidebarHeader: { padding: "20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sidebarTitle: { fontSize: "16px", fontWeight: "600", color: "#0F172A", margin: 0 },
  sidebarSubtitle: { fontSize: "12px", color: "#64748B", marginTop: "4px" },
  expandButtons: { display: "flex", gap: "4px" },
  expandBtn: { width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" },
  unitsList: { flex: 1, overflowY: "auto", padding: "12px" },
  unitContainer: { marginBottom: "12px", border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" },
  unitHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#F8FAFC", cursor: "pointer", transition: "all 0.2s ease" },
  unitHeaderLeft: { display: "flex", gap: "12px", alignItems: "center", flex: 1 },
  unitNumberBadge: { background: "#667eea", color: "white", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "600" },
  unitTitle: { fontSize: "14px", fontWeight: "600", color: "#0F172A", marginBottom: "4px" },
  unitProgressBar: { width: "120px", height: "3px", background: "#E2E8F0", borderRadius: "2px", overflow: "hidden" },
  unitProgressFill: { height: "100%", background: "#10B981", borderRadius: "2px" },
  unitHeaderRight: { display: "flex", alignItems: "center", gap: "12px" },
  unitProgressText: { fontSize: "11px", fontWeight: "600", color: "#10B981" },
  unitContentList: { padding: "8px 0", background: "white" },
  contentGroupHeader: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", marginTop: "8px" },
  contentGroupTitle: { fontSize: "12px", fontWeight: "600", color: "#475569", flex: 1 },
  completedTag: { display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", background: "#10B98115", color: "#10B981", borderRadius: "20px", fontSize: "10px", fontWeight: "500" },
  videoItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px 10px 32px", cursor: "pointer", transition: "all 0.2s ease", margin: "2px 0" },
  videoItemLeft: { display: "flex", alignItems: "center", gap: "10px", flex: 1 },
  videoItemIcon: { width: "28px", height: "28px", borderRadius: "6px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" },
  videoItemInfo: { flex: 1 },
  videoItemTitle: { fontSize: "12px", fontWeight: "500", color: "#0F172A" },
  videoItemDuration: { fontSize: "10px", color: "#64748B", marginTop: "2px" },
  videoItemRight: { display: "flex", alignItems: "center" },
  videoProgressRing: { display: "flex", alignItems: "center", justifyContent: "center" },
  videoCompletedBadge: { display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", background: "#10B98115", borderRadius: "20px", fontSize: "11px", color: "#10B981" },
  contentItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", cursor: "pointer", transition: "all 0.2s ease", margin: "2px 0" },
  contentItemLeft: { display: "flex", alignItems: "center", gap: "12px", flex: 1 },
  contentItemIcon: { width: "32px", height: "32px", borderRadius: "8px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" },
  contentItemInfo: { flex: 1 },
  contentItemTitle: { fontSize: "13px", fontWeight: "500", color: "#0F172A" },
  contentItemType: { fontSize: "10px", color: "#64748B", marginTop: "2px" },
  contentItemRight: { display: "flex", alignItems: "center", gap: "8px" },
  mainContent: { background: "white", borderRadius: "20px", border: "1px solid #E2E8F0", minHeight: "calc(100vh - 240px)", overflow: "hidden" },
  contentViewer: { display: "flex", flexDirection: "column", height: "100%" },
  contentViewerHeader: { padding: "24px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" },
  contentViewerIcon: { width: "48px", height: "48px", background: "#F1F5F9", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
  contentViewerInfo: { flex: 1 },
  contentViewerType: { fontSize: "11px", fontWeight: "600", color: "#667eea", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" },
  contentViewerTitle: { fontSize: "20px", fontWeight: "700", color: "#0F172A", marginBottom: "8px" },
  contentViewerMeta: { fontSize: "12px", color: "#64748B" },
  completedBadge: { display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#10B98115", color: "#10B981", borderRadius: "20px", fontSize: "12px", fontWeight: "500" },
  contentViewerBody: { padding: "24px", flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 380px)" },
  noSelectionMessage: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "400px", textAlign: "center", color: "#94A3B8" },
  noSelectionIcon: { marginBottom: "20px" },
  videosSection: { marginBottom: "32px" },
  sectionTitle: { fontSize: "16px", fontWeight: "600", color: "#0F172A", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" },
  videoCard: { background: "#F8FAFC", borderRadius: "16px", padding: "20px", marginBottom: "20px", border: "1px solid #E2E8F0" },
  videoHeader: { marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  videoTitleWrapper: { display: "flex", alignItems: "center", gap: "12px" },
  videoPlayIcon: { width: "36px", height: "36px", borderRadius: "50%", background: "#667eea15", display: "flex", alignItems: "center", justifyContent: "center" },
  videoTitle: { fontWeight: "600", color: "#0F172A" },
  videoDuration: { fontSize: "11px", color: "#64748B", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" },
  videoDescription: { fontSize: "13px", color: "#64748B", marginBottom: "16px", lineHeight: "1.5" },
  videoPlayer: { width: "100%", borderRadius: "12px", marginTop: "12px" },
  noVideoPlaceholder: { background: "#F1F5F9", borderRadius: "12px", padding: "60px", textAlign: "center", color: "#94A3B8" },
  resourcesSection: { marginTop: "32px" },
  resourcesList: { display: "flex", flexDirection: "column", gap: "10px" },
  resourceItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" },
  resourceName: { flex: 1, fontSize: "13px", color: "#0F172A" },
  fileSize: { fontSize: "11px", color: "#64748B" },
  downloadLink: { display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "white", border: "1px solid #E2E8F0", borderRadius: "8px", textDecoration: "none", fontSize: "12px", color: "#667eea", cursor: "pointer" },
  noContentMessage: { textAlign: "center", padding: "60px", color: "#94A3B8" },
  assignmentDescription: { marginBottom: "24px", padding: "20px", background: "#F8FAFC", borderRadius: "16px" },
  assignmentFileSection: { marginBottom: "24px" },
  downloadAssignmentBtn: { display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "#667eea", color: "white", textDecoration: "none", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "500" },
  submissionSection: { padding: "24px", background: "#F8FAFC", borderRadius: "16px", marginTop: "24px" },
  fileInputWrapper: { marginBottom: "16px" },
  fileInput: { display: "none" },
  fileLabel: { display: "inline-block", padding: "10px 16px", background: "white", border: "1px solid #E2E8F0", borderRadius: "10px", cursor: "pointer", fontSize: "13px", color: "#475569" },
  submitBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "#10B981", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", width: "100%", justifyContent: "center", fontSize: "13px", fontWeight: "500" },
  submissionSuccess: { textAlign: "center", padding: "40px" },
  quizInfoBar: { display: "flex", gap: "20px", padding: "14px 16px", background: "#F8FAFC", borderRadius: "12px", marginBottom: "24px", flexWrap: "wrap", fontSize: "12px", color: "#475569" },
  questionsList: { display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" },
  questionCard: { padding: "20px", background: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0" },
  questionHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" },
  questionNumber: { background: "#667eea", color: "white", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" },
  questionText: { flex: 1, fontSize: "14px", fontWeight: "500", color: "#0F172A" },
  questionMarks: { fontSize: "11px", color: "#64748B" },
  optionsList: { display: "flex", flexDirection: "column", gap: "10px", marginLeft: "20px" },
  optionLabel: { display: "flex", alignItems: "center", gap: "12px", padding: "8px", cursor: "pointer" },
  optionText: { fontSize: "13px", color: "#475569" },
  submitQuizBtn: { width: "100%", padding: "12px", background: "#667eea", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginTop: "24px" },
  quizResult: { textAlign: "center", padding: "40px" },
  resultIcon: { marginBottom: "20px" },
  passIcon: { fontSize: "64px" },
  failIcon: { fontSize: "64px" },
  scoreCircle: { width: "120px", height: "120px", borderRadius: "50%", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "20px auto", color: "white" },
  scoreNumber: { fontSize: "32px", fontWeight: "700" },
  scoreLabel: { fontSize: "12px", opacity: 0.8 },
  scoreDisplay: { fontSize: "16px", fontWeight: "500", marginBottom: "12px", color: "#0F172A" },
  resultMessage: { fontSize: "14px", marginBottom: "24px", color: "#475569", maxWidth: "400px", margin: "0 auto 24px" },
  closeResultBtn: { padding: "10px 24px", background: "#667eea", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "500" },
  retakeQuizBtn: { padding: "10px 24px", background: "#F59E0B", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "500", marginTop: "10px" },
  smallSpinner: { width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }
};

const certificateStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "20px"
  },
  modal: {
    background: "white",
    borderRadius: "20px",
    maxWidth: "900px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative",
    padding: "30px"
  },
  closeBtn: {
    position: "absolute",
    top: "20px",
    right: "25px",
    fontSize: "30px",
    cursor: "pointer",
    color: "#94A3B8",
    zIndex: 10,
    transition: "color 0.2s ease"
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

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;
document.head.appendChild(styleSheet);

export default CourseContentView;