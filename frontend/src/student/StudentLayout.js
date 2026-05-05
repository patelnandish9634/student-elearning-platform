import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StudentDashboard from "./StudentDashboard";
import StudentProfile from "./StudentProfile";
import TopBar from "./TopBar";
import StudentCourses from "./StudentCourses";
import UniversalCompiler from "../components/UniversalCompiler";

const StudentLayout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [student, setStudent] = useState({
    id: "",
    name: "",
    email: "",
    rollNumber: "",
    semester: 4,
    branch: "Computer Science",
    avatar: ""
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("role");
      const userId = localStorage.getItem("userId");
      
      console.log("Auth Check - Token:", !!token, "Role:", userRole, "UserId:", userId);
      
      if (!token || !userRole || userRole !== "student") {
        console.log("Authentication failed - Redirecting to login");
        setIsAuthenticated(false);
        navigate("/");
        return;
      }
      
      try {
        const response = await axios.get(`http://localhost:5000/api/students/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const studentData = response.data;
        setStudent({
          id: studentData._id || userId,
          name: studentData.name || "Student",
          email: studentData.email || "",
          rollNumber: studentData.rollNumber || `CS${Math.floor(Math.random() * 10000)}`,
          semester: studentData.semester || 4,
          branch: studentData.department || "Computer Science",
          division: studentData.division || "A",
          enrollmentNumber: studentData.enrollmentNumber || "",
          mobile: studentData.mobile || "",
          course: studentData.course || "B.Tech",
          batch: studentData.batch || "2024-2028",
          photo: studentData.photo || null,
          avatar: (studentData.name || "S").charAt(0).toUpperCase()
        });
      } catch (error) {
        console.error("Error fetching student data:", error);
        const userEmail = localStorage.getItem("userEmail") || "";
        const userName = userEmail.split('@')[0] || "Student";
        setStudent({
          id: userId || "",
          name: userName,
          email: userEmail,
          rollNumber: localStorage.getItem("rollNumber") || `CS${Math.floor(Math.random() * 10000)}`,
          semester: 4,
          branch: "Computer Science",
          division: "A",
          enrollmentNumber: "",
          mobile: "",
          course: "B.Tech",
          batch: "2024-2028",
          photo: null,
          avatar: userName.charAt(0).toUpperCase()
        });
      }
      
      setIsAuthenticated(true);
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("rollNumber");
    navigate("/");
  };

  const handleUpdateStudent = (updatedStudent) => {
    setStudent(updatedStudent);
  };

  if (isAuthenticated === null) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: darkMode ? "#0F172A" : "#F8FAFC"
      }}>
        <div style={{
          width: "50px",
          height: "50px",
          border: "3px solid #E2E8F0",
          borderTop: "3px solid #3B82F6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: darkMode ? "#0F172A" : "#F8FAFC",
      transition: "all 0.3s ease"
    }}>
      <TopBar 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        student={student}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />
      <div style={{ paddingTop: "20px" }}>
        {activeTab === "dashboard" && (
          <StudentDashboard 
            darkMode={darkMode}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            student={student}
          />
        )}
        
        {activeTab === "compiler" && (
          <div style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "32px 28px",
            minHeight: "100vh",
            background: darkMode ? "#0F172A" : "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)"
          }}>
            <div style={{ marginBottom: "28px" }}>
              <h2 style={{
                fontSize: "28px",
                fontWeight: "700",
                color: darkMode ? "white" : "#0F172A",
                marginBottom: "8px"
              }}>
                💻 Online Code Compiler
              </h2>
              <p style={{
                fontSize: "14px",
                color: darkMode ? "#94A3B8" : "#64748B"
              }}>
                Write, run, and test your code in multiple programming languages
              </p>
            </div>
            <UniversalCompiler 
              initialLanguage="python"
              onRunComplete={(result) => {
                console.log("Code execution completed:", result);
              }}
            />
          </div>
        )}
        
        {activeTab === "profile" && (
          <StudentProfile 
            darkMode={darkMode}
            student={student}
            onUpdate={handleUpdateStudent}
          />
        )}
        
        {activeTab === "courses" && (
          <StudentCourses 
            darkMode={darkMode}
            student={student}
          />
        )}
        
        {activeTab === "assignments" && (
          <StudentDashboard 
            darkMode={darkMode}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            student={student}
          />
        )}
        
        {activeTab === "liveclasses" && (
          <StudentDashboard 
            darkMode={darkMode}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            student={student}
          />
        )}
        
        {activeTab === "certificates" && (
          <StudentDashboard 
            darkMode={darkMode}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            student={student}
          />
        )}
        
       
      </div>
    </div>
  );
};

export default StudentLayout;