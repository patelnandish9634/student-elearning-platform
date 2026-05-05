import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Dashboard from "./Dashboard";
import Departments from "./Departments";
import Courses from "./Courses";
import Semesters from "./Semesters";
import Batches from "./Batches";
import Students from "./Students";
import Teachers from "./Teachers";
import Subjects from "./subjects";
import VerifyContent from "./VerifyContent";
import CertificateTemplate from "./CertificateTemplate"

const AdminLayout = () => {
  const token = localStorage.getItem("token");

  // Protect admin routes
  if (!token) {
    return <Navigate to="/" />;
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#f6f8fc",
        overflow: "hidden", // 🔑 stop whole-page scroll
      }}
    >
      {/* Sidebar (fixed) */}
      <Sidebar />

      {/* Right Section */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        {/* Topbar (fixed height) */}
        <Topbar />

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto", // 🔑 only content scrolls
            paddingBottom: "20px",
          }}
        >
          <Routes>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="departments" element={<Departments />} />
            <Route path="courses" element={<Courses />} />
             <Route path="semesters" element={<Semesters />} />
               <Route path="batches" element={<Batches />} />
               <Route path="students" element={<Students />} />
                    <Route path="teachers" element={<Teachers />} />
                    <Route path="subjects" element={<Subjects />} />
                     <Route path="verify-content" element={<VerifyContent />} />
                     <Route path="certificates" element={<CertificateTemplate />} />
                    
            {/* add more routes later */}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
