import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiBookOpen,
  FiX,
} from "react-icons/fi";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Courses = () => {
  const [showModal, setShowModal] = useState(false);
  const [animateModal, setAnimateModal] = useState(false);

  // FORM STATES
  const [department, setDepartment] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [totalSemesters, setTotalSemesters] = useState("");

  // EDIT STATE
  const [editId, setEditId] = useState(null);

  // DELETE STATE
  const [deleteId, setDeleteId] = useState(null);

  // DATA STATES
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);

  // ================= FETCH DEPARTMENTS =================
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/departments/active")
      .then((res) => setDepartments(res.data))
      .catch(() => toast.error("Failed to load departments"));
  }, []);

  // ================= FETCH COURSES =================
  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/courses");
      setCourses(res.data);
    } catch {
      toast.error("Failed to load courses");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // ================= ADD / UPDATE COURSE =================
  const handleSaveCourse = async () => {
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/courses/${editId}`, {
          department,
          code,
          name,
          duration,
          totalSemesters,
        });
        toast.success("Course updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/courses/add", {
          department,
          code,
          name,
          duration,
          totalSemesters,
        });
        toast.success("Course added successfully");
      }

      setDepartment("");
      setCode("");
      setName("");
      setDuration("");
      setTotalSemesters("");
      setEditId(null);

      fetchCourses();
      setAnimateModal(false);
      setTimeout(() => setShowModal(false), 200);
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  // ================= TOGGLE STATUS =================
  const handleToggleStatus = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/courses/toggle-status/${id}`
      );
      fetchCourses();
      toast.success("Course status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  // ================= DELETE COURSE (CONFIRMATION TOAST) =================
  const confirmDelete = (courseId) => {
    setDeleteId(courseId);

    toast.info(
      <div>
        <p style={{ fontWeight: "600", marginBottom: "10px" }}>
          This action will permanently delete the course.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={async () => {
              try {
                await axios.delete(
                  `http://localhost:5000/api/courses/${courseId}`
                );
                toast.dismiss();
                toast.success("Course deleted permanently");
                fetchCourses();
                setDeleteId(null);
              } catch {
                toast.dismiss();
                toast.error("Failed to delete course");
              }
            }}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Delete
          </button>

          <button
            onClick={() => {
              toast.dismiss();
              setDeleteId(null);
            }}
            style={{
              background: "#e5e7eb",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>,
      { autoClose: false }
    );
  };

  return (
    <>
      <ToastContainer />

      <div style={{ padding: "28px" }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            marginTop: "-20px",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "6px", fontSize: "26px" }}>
              Courses
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Manage courses by department
            </p>
          </div>

          <button
            onClick={() => {
              setEditId(null);
              setShowModal(true);
              setTimeout(() => setAnimateModal(true), 10);
            }}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "12px 18px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontWeight: "500",
              boxShadow: "0 8px 20px rgba(37,99,235,0.3)",
            }}
          >
            <FiPlus /> Add Course
          </button>
        </div>

        {/* TABLE */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "22px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <div style={tableHeaderStyle}>
            <div>Code</div>
            <div>Course Name</div>
            <div>Department</div>
            <div>Duration</div>
            <div>Total Semesters</div>
            <div>Students</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {courses.map((c) => (
            <div key={c._id} style={tableRowStyle}>
              <div style={{ color: "#2563eb", fontWeight: "600" }}>
                {c.code}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FiBookOpen color="#64748b" />
                <strong>{c.name}</strong>
              </div>

              <span style={deptBadge}>{c.department}</span>
              <div style={{ marginLeft: "20px" }}>{c.duration}</div>
              <div>{c.totalSemesters}</div>
              <div>{c.students || 0}</div>

              <span
                onClick={() => handleToggleStatus(c._id)}
                style={{
                  ...statusBadge,
                  background:
                    c.status === "active" ? "#dcfce7" : "#fee2e2",
                  color:
                    c.status === "active" ? "#16a34a" : "#dc2626",
                  cursor: "pointer",
                }}
              >
                {c.status}
              </span>

              <div style={{ display: "flex", gap: "14px" }}>
                <FiEdit
                  size={18}
                  color="#2563eb"
                  onClick={() => {
                    setEditId(c._id);
                    setDepartment(c.department);
                    setCode(c.code);
                    setName(c.name);
                    setDuration(c.duration);
                    setTotalSemesters(c.totalSemesters);
                    setShowModal(true);
                    setTimeout(() => setAnimateModal(true), 10);
                  }}
                />
                <FiTrash2
                  size={18}
                  color="#ef4444"
                  onClick={() => confirmDelete(c._id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div
          style={overlayStyle}
          onClick={() => {
            setEditId(null);
            setAnimateModal(false);
            setTimeout(() => setShowModal(false), 200);
          }}
        >
          <div
            style={{
              ...modalStyle,
              transform: animateModal ? "scale(1)" : "scale(0.9)",
              opacity: animateModal ? 1 : 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeader}>
              <h3 style={{ fontSize: "20px" }}>
                {editId ? "Edit Course" : "Add New Course"}
              </h3>
              <FiX
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setEditId(null);
                  setAnimateModal(false);
                  setTimeout(() => setShowModal(false), 200);
                }}
              />
            </div>

            <div style={{ marginTop: "20px", display: "grid", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Department</label>
                <select
                  style={inputStyle}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Course Code</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. BCA101"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>Course Name</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Bachelor of Computer Applications"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "80px", width: "400px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Duration</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. 3 Years"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Total Semesters</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. 6"
                    value={totalSemesters}
                    onChange={(e) => setTotalSemesters(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={modalActions}>
              <button
                style={cancelBtn}
                onClick={() => {
                  setEditId(null);
                  setAnimateModal(false);
                  setTimeout(() => setShowModal(false), 200);
                }}
              >
                Cancel
              </button>
              <button style={saveBtn} onClick={handleSaveCourse}>
                {editId ? "Update Course" : "Save Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ================= STYLES (UNCHANGED) ================= */

const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns:
    "1fr 2.2fr 1.5fr 1fr 1.2fr 1fr 1fr 0.8fr",
  padding: "12px 10px",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "600",
};

const tableRowStyle = {
  display: "grid",
  gridTemplateColumns:
    "1fr 2.2fr 1.5fr 1fr 1.2fr 1fr 1fr 0.8fr",
  alignItems: "center",
  padding: "16px 10px",
  borderRadius: "14px",
  marginBottom: "10px",
  background: "#f8fafc",
};

const deptBadge = {
  background: "#eef2ff",
  color: "#1d4ed8",
  padding: "6px 14px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "600",
  display: "inline-flex",
  marginLeft: "-20px",
  justifyContent: "center",
};

const statusBadge = {
  padding: "6px 14px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "500",
  width: "40px",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.35)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
};

const modalStyle = {
  width: "480px",
  background: "#fff",
  borderRadius: "18px",
  padding: "26px",
  transition: "all 0.2s ease",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  marginTop: "28px",
};

const labelStyle = {
  fontSize: "13px",
  color: "#475569",
  marginBottom: "6px",
  display: "block",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  marginLeft: "-12px",
  border: "1px solid #e2e8f0",
  outline: "none",
};

const cancelBtn = {
  padding: "10px 18px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  background: "#fff",
  cursor: "pointer",
};

const saveBtn = {
  padding: "10px 20px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
};

export default Courses;
