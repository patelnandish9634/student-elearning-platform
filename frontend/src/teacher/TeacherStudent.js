import React, { useState, useEffect } from "react";
import {
  FiUsers,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiStar,
  FiTrendingUp,
  FiAward,
  FiAlertCircle,
  FiRefreshCw,
  FiSearch,
  FiEye,
  FiMessageSquare,
  FiBarChart2,
  FiUserCheck,
  FiGrid,
  FiList,
  FiX,
  FiBookOpen,
  FiFilter,
  FiChevronDown,
  FiMapPin,
  FiHash,
  FiClock,
  FiCheckCircle,
  FiInfo,
  FiTrendingDown,
  FiActivity,
  FiEdit2
} from "react-icons/fi";
import axios from "axios";

const TeacherStudent = ({ teacher }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [teacherDivisions, setTeacherDivisions] = useState([]);
  const [studentsProgress, setStudentsProgress] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalDivisions: 0,
    averageProgress: 0,
    struggling: 0
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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

  // Function to get progress color based on percentage
  const getProgressColor = (progress) => {
    if (progress >= 80) return "#10B981";
    if (progress >= 60) return "#3B82F6";
    if (progress >= 40) return "#F59E0B";
    return "#EF4444";
  };

  // Function to get progress label
  const getProgressLabel = (progress) => {
    if (progress >= 80) return "Excellent";
    if (progress >= 60) return "Good";
    if (progress >= 40) return "Average";
    return "Needs Improvement";
  };

  // Function to handle image error
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.parentElement.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    e.target.parentElement.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="28" width="28" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teacherData = getTeacherData();
      
      console.log("Teacher data:", teacherData);
      
      if (!teacherData || !teacherData._id) {
        setError("Teacher information not found. Please login again.");
        setLoading(false);
        return;
      }
      
      // Fetch students progress data
      const token = localStorage.getItem("token");
      const progressResponse = await axios.get(
        `${API_BASE_URL}/api/progress/teacher/students-progress/${teacherData._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (progressResponse.data.success) {
        const { studentsProgress: progressData, teacherInfo: tInfo } = progressResponse.data;
        setStudentsProgress(progressData);
        
        // Extract teacher info - IMPROVED to get course from teacher data
        const teacherCourse = teacherData.course || teacherData.courses?.[0] || "Not Assigned";
        const teacherDepartment = teacherData.department || "Not Assigned";
        const teacherName = teacherData.name || "N/A";
        
        setTeacherInfo({
          name: teacherName,
          department: teacherDepartment,
          course: teacherCourse,
          divisions: tInfo?.divisions || teacherData.divisions || []
        });
        setTeacherDivisions(tInfo?.divisions || teacherData.divisions || []);
        
        // Transform progress data to student format with proper field mapping
        const enrichedStudents = progressData.map(item => {
          const studentData = item.student;
          return {
            ...studentData,
            _id: studentData._id,
            name: studentData.name || "Unknown",
            email: studentData.email || "Not Available",
            rollNumber: studentData.rollNumber || "N/A",
            enrollmentNumber: studentData.enrollmentNumber || "N/A",
            department: studentData.department || teacherDepartment || "Not Assigned",
            course: studentData.course || teacherCourse || "Not Assigned",
            semester: studentData.semester || "Not Assigned",
            batch: studentData.batch || "Not Assigned",
            division: studentData.division || "Not Assigned",
            mobile: studentData.mobile || "Not Available",
            mobileNumber: studentData.mobile || "Not Available",
            photo: studentData.photo || null,
            averageProgress: item.averageProgress || 0,
            subjects: item.subjects || [],
            totalSubjects: item.totalSubjects || 0
          };
        });
        
        setStudents(enrichedStudents);
        setFilteredStudents(enrichedStudents);
        
        // Calculate stats
        const total = enrichedStudents.length;
        const totalDivisions = [...new Set(enrichedStudents.map(s => s.division).filter(d => d && d !== "Not Assigned"))].length;
        const avgProgress = total > 0 
          ? Math.round(enrichedStudents.reduce((acc, s) => acc + (s.averageProgress || 0), 0) / total)
          : 0;
        const struggling = enrichedStudents.filter(s => (s.averageProgress || 0) < 40).length;
        
        setStats({
          totalStudents: total,
          totalDivisions: totalDivisions,
          averageProgress: avgProgress,
          struggling: struggling
        });
      } else {
        throw new Error(progressResponse.data.message || "Failed to fetch progress");
      }
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || err.message || "Failed to load students");
      loadMockData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const loadMockData = () => {
    const mockStudents = [
      {
        _id: "1",
        name: "Aarav Sharma",
        email: "aarav.sharma@example.com",
        rollNumber: "BCA2024001",
        enrollmentNumber: "EN2024001",
        department: "Computer Application",
        course: "BCA",
        semester: 3,
        division: "C",
        mobile: "+91 98765 43210",
        photo: null,
        averageProgress: 85,
        subjects: [
          { subjectName: "Data Structures", progress: 90 },
          { subjectName: "Database Management", progress: 80 },
          { subjectName: "Web Development", progress: 85 }
        ]
      },
      {
        _id: "2",
        name: "Priya Patel",
        email: "priya.patel@example.com",
        rollNumber: "BCA2024002",
        enrollmentNumber: "EN2024002",
        department: "Computer Application",
        course: "BCA",
        semester: 3,
        division: "C",
        mobile: "+91 98765 43212",
        photo: null,
        averageProgress: 92,
        subjects: [
          { subjectName: "Data Structures", progress: 95 },
          { subjectName: "Database Management", progress: 90 },
          { subjectName: "Web Development", progress: 92 }
        ]
      },
      {
        _id: "3",
        name: "Rahul Verma",
        email: "rahul.verma@example.com",
        rollNumber: "BCA2024003",
        enrollmentNumber: "EN2024003",
        department: "Computer Application",
        course: "BCA",
        semester: 3,
        division: "C",
        mobile: "+91 98765 43213",
        photo: null,
        averageProgress: 45,
        subjects: [
          { subjectName: "Data Structures", progress: 40 },
          { subjectName: "Database Management", progress: 50 },
          { subjectName: "Web Development", progress: 45 }
        ]
      },
      {
        _id: "4",
        name: "Sneha Reddy",
        email: "sneha.reddy@example.com",
        rollNumber: "BCA2024004",
        enrollmentNumber: "EN2024004",
        department: "Computer Application",
        course: "BCA",
        semester: 3,
        division: "C",
        mobile: "+91 98765 43216",
        photo: null,
        averageProgress: 78,
        subjects: [
          { subjectName: "Data Structures", progress: 75 },
          { subjectName: "Database Management", progress: 80 },
          { subjectName: "Web Development", progress: 80 }
        ]
      }
    ];
    setStudents(mockStudents);
    setFilteredStudents(mockStudents);
    setTeacherDivisions(["C"]);
    setTeacherInfo({
      department: "Computer Application",
      course: "BCA",
      divisions: ["C"],
      name: "Gita Joshi"
    });
    setStats({
      totalStudents: mockStudents.length,
      totalDivisions: 1,
      averageProgress: 75,
      struggling: 1
    });
  };
  
  useEffect(() => {
    let filtered = [...students];
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.enrollmentNumber && s.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedDivision !== "all") {
      filtered = filtered.filter(s => s.division === selectedDivision);
    }
    
    setFilteredStudents(filtered);
  }, [searchTerm, selectedDivision, students]);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const refreshData = () => {
    setRefreshing(true);
    fetchData();
  };
  
  const getUniqueDivisions = () => {
    const divisions = [...new Set(students.map(s => s.division).filter(d => d && d !== "Not Assigned"))];
    return divisions;
  };
  
  if (loading && students.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading your students...</p>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.headerBadge}>TEACHER PORTAL</div>
          <h1 style={styles.headerTitle}>My Students</h1>
          <p style={styles.headerSubtitle}>
            Track student progress and performance
          </p>
        </div>
        <button style={styles.refreshBtn} onClick={refreshData} disabled={refreshing}>
          <FiRefreshCw size={16} style={refreshing ? { animation: "spin 0.8s linear infinite" } : {}} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      
      {/* Teacher Info Banner - FIXED to show course properly */}
      <div style={styles.teacherInfoBanner}>
        <div style={styles.bannerItem}>
          <FiUser size={16} />
          <span><strong>Teacher:</strong> {teacherInfo.name || teacher?.name || "N/A"}</span>
        </div>
        <div style={styles.bannerItem}>
          <FiBookOpen size={16} />
          <span><strong>Department:</strong> {teacherInfo.department || teacher?.department || "Not Assigned"}</span>
        </div>
        <div style={styles.bannerItem}>
          <FiTrendingUp size={16} />
          <span><strong>Course:</strong> {teacherInfo.course || teacher?.course || "Not Assigned"}</span>
        </div>
        <div style={styles.bannerItem}>
          <FiUsers size={16} />
          <span><strong>Divisions:</strong> {teacherInfo.divisions?.length > 0 ? teacherInfo.divisions.join(", ") : teacher?.divisions?.join(", ") || "N/A"}</span>
        </div>
      </div>
      
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderBottomColor: "#3B82F6" }}>
          <div style={{ ...styles.statIconBox, background: "#3B82F610", color: "#3B82F6" }}>
            <FiUsers size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalStudents}</div>
            <div style={styles.statLabel}>Total Students</div>
          </div>
        </div>
        
        <div style={{ ...styles.statCard, borderBottomColor: "#8B5CF6" }}>
          <div style={{ ...styles.statIconBox, background: "#8B5CF610", color: "#8B5CF6" }}>
            <FiBookOpen size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalDivisions}</div>
            <div style={styles.statLabel}>Divisions</div>
          </div>
        </div>
        
        <div style={{ ...styles.statCard, borderBottomColor: "#10B981" }}>
          <div style={{ ...styles.statIconBox, background: "#10B98110", color: "#10B981" }}>
            <FiTrendingUp size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.averageProgress}%</div>
            <div style={styles.statLabel}>Avg Progress</div>
          </div>
        </div>
      </div>
      
      <div style={styles.searchSection}>
        <div style={styles.searchBar}>
          <FiSearch size={18} style={{ color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Search by name, roll number, enrollment number or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        
        <div style={styles.filters}>
          <button style={styles.filterToggleBtn} onClick={() => setShowFilters(!showFilters)}>
            <FiFilter size={14} /> Filters 
            <FiChevronDown size={14} style={{ transform: showFilters ? "rotate(180deg)" : "none" }} />
          </button>
          
          <div style={styles.viewToggle}>
            <button
              style={{ ...styles.viewBtn, background: viewMode === "grid" ? "#3B82F6" : "transparent", color: viewMode === "grid" ? "white" : "#64748B" }}
              onClick={() => setViewMode("grid")}
            >
              <FiGrid size={14} /> Grid
            </button>
            <button
              style={{ ...styles.viewBtn, background: viewMode === "list" ? "#3B82F6" : "transparent", color: viewMode === "list" ? "white" : "#64748B" }}
              onClick={() => setViewMode("list")}
            >
              <FiList size={14} /> List
            </button>
          </div>
        </div>
      </div>
      
      {showFilters && (
        <div style={styles.expandedFilters}>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Division</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Divisions</option>
                {getUniqueDivisions().map(div => (
                  <option key={div} value={div}>Division {div}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      
      <div style={styles.resultsCount}>
        <span>{filteredStudents.length} students found</span>
      </div>
      
      {error && (
        <div style={styles.errorCard}>
          <FiAlertCircle size={40} color="#EF4444" />
          <h3 style={styles.errorTitle}>Unable to Load Students</h3>
          <p style={styles.errorMessage}>{error}</p>
          <button style={styles.retryBtn} onClick={refreshData}>Try Again</button>
        </div>
      )}
      
      {filteredStudents.length === 0 && !error && (
        <div style={styles.emptyCard}>
          <FiUsers size={48} style={{ opacity: 0.5 }} />
          <h3 style={styles.emptyTitle}>No Students Found</h3>
          <p style={styles.emptyText}>No students found with matching criteria.</p>
        </div>
      )}
      
      {/* LIST VIEW - Default view with Progress Column */}
      {filteredStudents.length > 0 && viewMode === "list" && (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.tableHeaderTh}>Student</th>
                <th style={styles.tableHeaderTh}>Enrollment No</th>
                <th style={styles.tableHeaderTh}>Roll No</th>
                <th style={styles.tableHeaderTh}>Division</th>
                <th style={styles.tableHeaderTh}>Progress</th>
                <th style={styles.tableHeaderTh}>Email</th>
                <th style={styles.tableHeaderTh}>Mobile</th>
                <th style={styles.tableHeaderTh}>Actions</th>
               </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id} style={styles.tableRow} onClick={() => setSelectedStudent(student)}>
                  <td style={styles.tableCell}>
                    <div style={styles.studentInfo}>
                      <div style={styles.smallAvatar}>
                        {student.photo ? (
                          <img 
                            src={`${API_BASE_URL}/uploads/students/${student.photo}`} 
                            alt={student.name} 
                            style={styles.smallAvatarImg}
                            onError={handleImageError}
                          />
                        ) : (
                          <FiUser size={16} />
                        )}
                      </div>
                      <div>
                        <div style={styles.studentNameCell}>{student.name}</div>
                      </div>
                    </div>
                   </td>
                  <td style={styles.tableCell}>{student.enrollmentNumber || "N/A"}</td>
                  <td style={styles.tableCell}>{student.rollNumber || "N/A"}</td>
                  <td style={styles.tableCell}>
                    <span style={styles.divisionBadge}>
                      {student.division && student.division !== "Not Assigned" ? `Div ${student.division}` : "N/A"}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.progressCell}>
                      <div style={styles.progressBarContainer}>
                        <div style={{
                          ...styles.progressBarFill,
                          width: `${student.averageProgress || 0}%`,
                          backgroundColor: getProgressColor(student.averageProgress || 0)
                        }} />
                      </div>
                      <div style={styles.progressPercentage}>
                        {student.averageProgress || 0}%
                      </div>
                    </div>
                  </td>
                  <td style={styles.tableCell}>{student.email}</td>
                  <td style={styles.tableCell}>
                    {student.mobile && student.mobile !== "Not Available" && student.mobile !== "null" 
                      ? student.mobile 
                      : "Not Available"}
                  </td>
                  <td style={styles.tableCell}>
                    <button style={styles.actionBtn}>
                      <FiEye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* GRID VIEW with Progress */}
      {filteredStudents.length > 0 && viewMode === "grid" && (
        <div style={styles.gridContainer}>
          {filteredStudents.map((student) => (
            <div
              key={student._id}
              style={styles.studentCard}
              onClick={() => setSelectedStudent(student)}
            >
              <div style={styles.studentHeader}>
                <div style={styles.studentAvatar}>
                  {student.photo ? (
                    <img 
                      src={`${API_BASE_URL}/uploads/students/${student.photo}`} 
                      alt={student.name} 
                      style={styles.avatarImg}
                      onError={handleImageError}
                    />
                  ) : (
                    <FiUser size={28} />
                  )}
                </div>
                <div style={styles.studentBadge}>
                  {student.division && student.division !== "Not Assigned" ? `Div ${student.division}` : "N/A"} | {student.rollNumber || "N/A"}
                </div>
              </div>
              
              <h3 style={styles.studentName}>{student.name}</h3>
              <p style={styles.studentRoll}>{student.enrollmentNumber || "N/A"}</p>
              
              {/* Progress Section */}
              <div style={styles.gridProgressSection}>
                <div style={styles.gridProgressLabel}>
                  <FiTrendingUp size={12} />
                  <span>Overall Progress</span>
                </div>
                <div style={styles.progressBarContainer}>
                  <div style={{
                    ...styles.progressBarFill,
                    width: `${student.averageProgress || 0}%`,
                    backgroundColor: getProgressColor(student.averageProgress || 0)
                  }} />
                </div>
                <div style={styles.gridProgressValue}>
                  {student.averageProgress || 0}% - {getProgressLabel(student.averageProgress || 0)}
                </div>
              </div>
              
              <div style={styles.studentContactInfo}>
                <div style={styles.contactItem}>
                  <FiMail size={12} />
                  <span>{student.email}</span>
                </div>
                <div style={styles.contactItem}>
                  <FiPhone size={12} />
                  <span>
                    {student.mobile && student.mobile !== "Not Available" && student.mobile !== "null" 
                      ? student.mobile 
                      : "Not Available"}
                  </span>
                </div>
              </div>
              
              <div style={styles.studentFooter}>
                <button style={styles.viewBtnSmall}>
                  <FiEye size={14} /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Student Details Modal with Subject-wise Progress */}
      {selectedStudent && (
        <div style={styles.modalOverlay} onClick={() => setSelectedStudent(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <button style={styles.modalClose} onClick={() => setSelectedStudent(null)}>
                <FiX size={20} />
              </button>
              <div style={styles.modalAvatar}>
                {selectedStudent.photo ? (
                  <img 
                    src={`${API_BASE_URL}/uploads/students/${selectedStudent.photo}`} 
                    alt={selectedStudent.name} 
                    style={styles.modalAvatarImg}
                    onError={handleImageError}
                  />
                ) : (
                  <FiUser size={40} />
                )}
              </div>
              <h2 style={styles.modalTitle}>{selectedStudent.name}</h2>
              <p style={styles.modalSubtitle}>
                {selectedStudent.enrollmentNumber || "N/A"} • Division {selectedStudent.division || "N/A"}
              </p>
            </div>
            
            <div style={styles.modalBody}>
              {/* Student Basic Information */}
              <div style={styles.infoSection}>
                <h3 style={styles.infoSectionH3}>
                  <FiInfo size={16} /> Basic Information
                </h3>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <FiUser size={16} />
                    <div>
                      <label style={styles.infoItemLabel}>Full Name</label>
                      <p style={styles.infoItemP}>{selectedStudent.name}</p>
                    </div>
                  </div>
                  <div style={styles.infoItem}>
                    <FiHash size={16} />
                    <div>
                      <label style={styles.infoItemLabel}>Enrollment Number</label>
                      <p style={styles.infoItemP}>{selectedStudent.enrollmentNumber || "N/A"}</p>
                    </div>
                  </div>
                  <div style={styles.infoItem}>
                    <FiHash size={16} />
                    <div>
                      <label style={styles.infoItemLabel}>Roll Number</label>
                      <p style={styles.infoItemP}>{selectedStudent.rollNumber || "N/A"}</p>
                    </div>
                  </div>
                  <div style={styles.infoItem}>
                    <FiBookOpen size={16} />
                    <div>
                      <label style={styles.infoItemLabel}>Division</label>
                      <p style={styles.infoItemP}>
                        {selectedStudent.division && selectedStudent.division !== "Not Assigned" 
                          ? `Division ${selectedStudent.division}` 
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact Information */}
              <div style={styles.infoSection}>
                <h3 style={styles.infoSectionH3}>
                  <FiMail size={16} /> Contact Information
                </h3>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <FiMail size={16} />
                    <div>
                      <label style={styles.infoItemLabel}>Email Address</label>
                      <p style={styles.infoItemP}>{selectedStudent.email}</p>
                    </div>
                  </div>
                  <div style={styles.infoItem}>
                    <FiPhone size={16} />
                    <div>
                      <label style={styles.infoItemLabel}>Mobile Number</label>
                      <p style={styles.infoItemP}>
                        {selectedStudent.mobile && selectedStudent.mobile !== "Not Available" && selectedStudent.mobile !== "null" 
                          ? selectedStudent.mobile 
                          : "Not Available"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Academic Information with Subject-wise Progress */}
              <div style={styles.infoSection}>
                <h3 style={styles.infoSectionH3}>
                  <FiTrendingUp size={16} /> Academic Progress
                </h3>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <FiActivity size={16} />
                    <div>
                      <label style={styles.infoItemLabel}>Overall Progress</label>
                      <div style={styles.modalProgressContainer}>
                        <div style={styles.progressBarContainer}>
                          <div style={{
                            ...styles.progressBarFill,
                            width: `${selectedStudent.averageProgress || 0}%`,
                            backgroundColor: getProgressColor(selectedStudent.averageProgress || 0)
                          }} />
                        </div>
                        <div style={styles.modalProgressValue}>
                          {selectedStudent.averageProgress || 0}% - {getProgressLabel(selectedStudent.averageProgress || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Subject-wise Progress */}
                {selectedStudent.subjects && selectedStudent.subjects.length > 0 && (
                  <div style={styles.subjectsProgressSection}>
                    <label style={styles.infoItemLabel}>Subject-wise Progress</label>
                    {selectedStudent.subjects.map((subject, idx) => (
                      <div key={idx} style={styles.subjectProgressItem}>
                        <div style={styles.subjectProgressHeader}>
                          <span style={styles.subjectName}>{subject.subjectName}</span>
                          <span style={{ ...styles.subjectProgress, color: getProgressColor(subject.progress) }}>
                            {subject.progress}%
                          </span>
                        </div>
                        <div style={styles.progressBarContainer}>
                          <div style={{
                            ...styles.progressBarFill,
                            width: `${subject.progress}%`,
                            backgroundColor: getProgressColor(subject.progress)
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Academic Information */}
              <div style={styles.infoSection}>
                <h3 style={styles.infoSectionH3}>
                  <FiBookOpen size={16} /> Academic Information
                </h3>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <FiTrendingUp size={16} />
                    <div>
                      <label style={styles.infoItemLabel}>Department</label>
                      <p style={styles.infoItemP}>{selectedStudent.department || "Not Assigned"}</p>
                    </div>
                  </div>
                  <div style={styles.infoItem}>
                    <FiBookOpen size={16} />
                    <div>
                      <label style={styles.infoItemLabel}>Course</label>
                      <p style={styles.infoItemP}>{selectedStudent.course || "Not Assigned"}</p>
                    </div>
                  </div>
                  <div style={styles.infoItem}>
                    <FiCalendar size={16} />
                    <div>
                      <label style={styles.infoItemLabel}>Semester</label>
                      <p style={styles.infoItemP}>{selectedStudent.semester || "Not Assigned"}</p>
                    </div>
                  </div>
                  <div style={styles.infoItem}>
                    <FiClock size={16} />
                    <div>
                      <label style={styles.infoItemLabel}>Batch</label>
                      <p style={styles.infoItemP}>{selectedStudent.batch || "Not Assigned"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Styles (same as before)
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "24px"
  },
  headerBadge: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#3B82F6",
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
    fontWeight: "500"
  },
  teacherInfoBanner: {
    display: "flex",
    gap: "24px",
    padding: "16px 20px",
    background: "white",
    borderRadius: "16px",
    marginBottom: "24px",
    border: "1px solid #E2E8F0",
    flexWrap: "wrap"
  },
  bannerItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#475569"
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
    width: "52px",
    height: "52px",
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
    fontSize: "13px",
    color: "#64748B",
    marginTop: "4px"
  },
  searchSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "20px"
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "white",
    padding: "10px 18px",
    borderRadius: "14px",
    border: "1px solid #E2E8F0",
    flex: 1,
    minWidth: "250px"
  },
  searchInput: {
    border: "none",
    outline: "none",
    flex: 1,
    fontSize: "14px",
    background: "transparent"
  },
  filters: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },
  filterToggleBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    background: "white",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500"
  },
  viewToggle: {
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
    padding: "6px 16px",
    borderRadius: "8px",
    border: "none",
    fontSize: "13px",
    cursor: "pointer"
  },
  expandedFilters: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
    border: "1px solid #E2E8F0"
  },
  filterRow: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap"
  },
  filterGroup: {
    flex: 1,
    minWidth: "200px"
  },
  filterLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#475569"
  },
  filterSelect: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    fontSize: "13px",
    background: "white",
    cursor: "pointer"
  },
  resultsCount: {
    marginBottom: "20px",
    fontSize: "13px",
    color: "#64748B"
  },
  errorCard: {
    textAlign: "center",
    padding: "60px",
    background: "white",
    borderRadius: "20px"
  },
  errorTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginTop: "12px",
    marginBottom: "8px",
    color: "#0F172A"
  },
  errorMessage: {
    fontSize: "14px",
    color: "#64748B",
    marginBottom: "20px"
  },
  retryBtn: {
    marginTop: "16px",
    padding: "10px 24px",
    background: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer"
  },
  emptyCard: {
    textAlign: "center",
    padding: "80px",
    background: "white",
    borderRadius: "20px"
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#0F172A"
  },
  emptyText: {
    fontSize: "14px",
    color: "#64748B"
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "24px"
  },
  studentCard: {
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid #E2E8F0",
    transition: "all 0.3s ease"
  },
  studentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  studentAvatar: {
    width: "56px",
    height: "56px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    overflow: "hidden"
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "16px"
  },
  studentBadge: {
    padding: "4px 10px",
    background: "#F1F5F9",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "500",
    color: "#475569"
  },
  studentName: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "4px"
  },
  studentRoll: {
    fontSize: "12px",
    color: "#64748B",
    marginBottom: "12px"
  },
  gridProgressSection: {
    background: "#F8FAFC",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "12px"
  },
  gridProgressLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#64748B",
    marginBottom: "8px"
  },
  gridProgressValue: {
    fontSize: "12px",
    fontWeight: "500",
    marginTop: "6px",
    textAlign: "center"
  },
  studentContactInfo: {
    marginBottom: "16px"
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#64748B",
    marginBottom: "6px"
  },
  studentFooter: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: "12px",
    borderTop: "1px solid #F1F5F9"
  },
  viewBtnSmall: {
    padding: "6px 14px",
    background: "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  tableContainer: {
    background: "white",
    borderRadius: "20px",
    overflow: "auto",
    border: "1px solid #E2E8F0"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1000px"
  },
  tableHeader: {
    background: "#F8FAFC",
    borderBottom: "1px solid #E2E8F0"
  },
  tableHeaderTh: {
    padding: "16px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569"
  },
  tableRow: {
    borderBottom: "1px solid #F1F5F9",
    cursor: "pointer",
    transition: "background 0.2s ease"
  },
  tableCell: {
    padding: "14px 16px",
    fontSize: "13px",
    color: "#334155"
  },
  studentInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  smallAvatar: {
    width: "36px",
    height: "36px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    overflow: "hidden"
  },
  smallAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "10px"
  },
  studentNameCell: {
    fontWeight: "500",
    color: "#0F172A"
  },
  divisionBadge: {
    padding: "4px 10px",
    background: "#667eea15",
    color: "#667eea",
    borderRadius: "16px",
    fontSize: "11px",
    fontWeight: "500"
  },
  progressCell: {
    minWidth: "120px"
  },
  progressBarContainer: {
    width: "100%",
    height: "6px",
    background: "#E2E8F0",
    borderRadius: "3px",
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s ease"
  },
  progressPercentage: {
    fontSize: "11px",
    fontWeight: "500",
    marginTop: "4px",
    textAlign: "center"
  },
  actionBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#3B82F6"
  },
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
    padding: "20px"
  },
  modal: {
    background: "white",
    borderRadius: "28px",
    maxWidth: "750px",
    width: "100%",
    maxHeight: "85vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  },
  modalHeader: {
    padding: "28px",
    textAlign: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    position: "relative"
  },
  modalClose: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "rgba(255,255,255,0.2)",
    border: "none",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "white",
    fontSize: "16px"
  },
  modalAvatar: {
    width: "80px",
    height: "80px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
    overflow: "hidden"
  },
  modalAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "4px",
    color: "white"
  },
  modalSubtitle: {
    fontSize: "13px",
    opacity: 0.9,
    color: "white"
  },
  modalBody: {
    padding: "24px",
    overflowY: "auto",
    flex: 1
  },
  infoSection: {
    marginBottom: "24px"
  },
  infoSectionH3: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "12px"
  },
  infoItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#F8FAFC",
    borderRadius: "12px"
  },
  infoItemLabel: {
    fontSize: "10px",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  infoItemP: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#0F172A",
    marginTop: "2px"
  },
  modalProgressContainer: {
    marginTop: "8px",
    minWidth: "200px"
  },
  modalProgressValue: {
    fontSize: "13px",
    fontWeight: "600",
    marginTop: "6px"
  },
  subjectsProgressSection: {
    marginTop: "16px",
    paddingTop: "12px",
    borderTop: "1px solid #E2E8F0"
  },
  subjectProgressItem: {
    marginBottom: "12px"
  },
  subjectProgressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px"
  },
  subjectName: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#0F172A"
  },
  subjectProgress: {
    fontSize: "12px",
    fontWeight: "600"
  }
};

export default TeacherStudent;