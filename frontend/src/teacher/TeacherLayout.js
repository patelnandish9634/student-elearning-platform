import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Dashboard from "./Dashboard";
import TeacherSubjects from "./TeacherSubjects";
import TeacherUnits from "./TeacherUnits";
import TeacherContent from "./TeacherContent";
import TeacherAssignments from "./TeacherAssignments";
import TeacherCheckAssignment from "./TeacherCheckAssignment"; // ✅ NEW IMPORT
import TeacherQuizzes from "./TeacherQuizzes";
import Metting from "./Meetings";
import TeacherStudent from "./TeacherStudent";
import TeacherProfile from "./TeacherProfile"
import axios from "axios";

// Other page components
const Analytics = () => (
  <div style={{padding: "24px", fontFamily: "'Inter', sans-serif"}}>
    <h2 style={{color: "#0B2A4A", fontSize: "24px"}}>Analytics</h2>
  </div>
);

const Announcements = () => (
  <div style={{padding: "24px", fontFamily: "'Inter', sans-serif"}}>
    <h2 style={{color: "#0B2A4A", fontSize: "24px"}}>Announcements</h2>
  </div>
);

const Profile = () => (
  <div style={{padding: "24px", fontFamily: "'Inter', sans-serif"}}>
    <h2 style={{color: "#0B2A4A", fontSize: "24px"}}>Profile</h2>
  </div>
);

const Settings = () => (
  <div style={{padding: "24px", fontFamily: "'Inter', sans-serif"}}>
    <h2 style={{color: "#0B2A4A", fontSize: "24px"}}>Settings</h2>
  </div>
);

const TeacherLayout = () => {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        const storedTeacher = localStorage.getItem("teacher");
        
        if (storedTeacher) {
          setTeacher(JSON.parse(storedTeacher));
        } else {
          const userId = localStorage.getItem("userId");
          const role = localStorage.getItem("role");
          
          if (userId && role === "teacher") {
            const response = await axios.get(`http://localhost:5000/api/teachers/${userId}`);
            if (response.data) {
              setTeacher(response.data);
              localStorage.setItem("teacher", JSON.stringify(response.data));
            }
          }
        }
      } catch (err) {
        console.error("Error loading teacher data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadTeacherData();
  }, []);

  const globalStyles = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', sans-serif;
        background: #F8FAFC;
        color: #1E293B;
      }
      
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: #F1F5F9;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #94A3B8;
        border-radius: 8px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #64748B;
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .fade-in {
        animation: fadeIn 0.5s ease-out;
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    </style>
  `;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #E2E8F0", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div style={{ display: "flex", background: "#F8FAFC" }}>
        <Sidebar />
        <div style={{ marginLeft: "280px", width: "100%" }}>
          <Topbar teacher={teacher} />
          <div style={{ 
            padding: "24px",
            background: "#F8FAFC",
            minHeight: "calc(100vh - 80px)"
          }}>
            <Routes>
              <Route path="dashboard" element={<Dashboard teacher={teacher} />} />
              <Route path="subjects" element={<TeacherSubjects teacher={teacher} />} />
              <Route path="units" element={<TeacherUnits teacher={teacher} />} />
              <Route path="content" element={<TeacherContent teacher={teacher} />} />
              <Route path="assignments" element={<TeacherAssignments teacher={teacher} />} />
              <Route path="check-assignment" element={<TeacherCheckAssignment />} /> {/* ✅ NEW ROUTE */}
              <Route path="quizzes" element={<TeacherQuizzes teacher={teacher} />} />
              <Route path="students" element={<TeacherStudent teacher={teacher} />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="schedule" element={<Metting teacherId={teacher?._id || teacher?.id} />} />
             <Route path="profile" element={<TeacherProfile teacher={teacher} />} />
              <Route path="settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherLayout;