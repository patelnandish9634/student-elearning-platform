import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import Login from "./components/login";
import AdminLayout from "./admin/AdminLayout.js";
import TeacherLayout from "./teacher/TeacherLayout.js";

import { NotificationProvider } from "./context/NotificationContext";
import StudentLayout from "./student/StudentLayout.js";

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="/teacher/*" element={<TeacherLayout />} />
          
           <Route path="/student/*" element={<StudentLayout />} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;