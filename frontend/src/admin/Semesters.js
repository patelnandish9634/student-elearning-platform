import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiX,
} from "react-icons/fi";

const Semesters = () => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // FORM STATES
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [semesterNumber, setSemesterNumber] = useState("");
  const [semesterName, setSemesterName] = useState("");

  // EDIT STATE
  const [editId, setEditId] = useState(null);

  // DELETE STATE
  const [deleteId, setDeleteId] = useState(null);

  // DATA STATES
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);

  // SEARCH STATE
  const [search, setSearch] = useState("");

  // ================= FETCH DEPARTMENTS =================
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/departments/active")
      .then((res) => setDepartments(res.data))
      .catch(() => toast.error("Failed to load departments"));
  }, []);

  // ================= FETCH COURSES BY DEPARTMENT =================
  useEffect(() => {
    if (!department) {
      setCourses([]);
      setCourse("");
      return;
    }

    axios
      .get(`http://localhost:5000/api/courses/by-department/${department}`)
      .then((res) => setCourses(res.data))
      .catch(() => toast.error("Failed to load courses"));
  }, [department]);

  // ================= FETCH SEMESTERS =================
  const fetchSemesters = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/semesters");
      setSemesters(res.data);
    } catch {
      toast.error("Failed to load semesters");
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  // ================= ADD SEMESTER =================
  const handleAddSemester = async () => {
    try {
      await axios.post("http://localhost:5000/api/semesters/add", {
        department,
        course,
        semesterNumber,
        semesterName,
      });

      toast.success("Semester added successfully");

      setDepartment("");
      setCourse("");
      setSemesterNumber("");
      setSemesterName("");

      fetchSemesters();
      setShowModal(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add semester");
    }
  };

  // ================= UPDATE SEMESTER =================
  const handleUpdateSemester = async () => {
    try {
      await axios.put(`http://localhost:5000/api/semesters/${editId}`, {
        department,
        course,
        semesterNumber,
        semesterName,
      });

      toast.success("Semester updated successfully");

      setEditId(null);
      setDepartment("");
      setCourse("");
      setSemesterNumber("");
      setSemesterName("");

      fetchSemesters();
      setShowEditModal(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update semester");
    }
  };

  // ================= DELETE CONFIRMATION (TOAST) =================
  const confirmDeleteSemester = (semesterId) => {
    setDeleteId(semesterId);

    toast.info(
      <div>
        <p style={{ fontWeight: "600", marginBottom: "10px" }}>
          This action will permanently delete the semester.
        </p>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={async () => {
              try {
                await axios.delete(
                  `http://localhost:5000/api/semesters/${semesterId}`
                );
                toast.dismiss();
                toast.success("Semester deleted permanently");
                fetchSemesters();
                setDeleteId(null);
              } catch {
                toast.dismiss();
                toast.error("Failed to delete semester");
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

  // ================= SEARCH FILTER =================
  const filteredSemesters = semesters.filter((s) =>
    `${s.department} ${s.course} ${s.semesterName} ${s.semesterNumber}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <>
      {/* ✅ REQUIRED FOR DELETE CONFIRMATION */}
      <ToastContainer />

      <div style={{ padding: "28px" }}>
        <div style={headerStyle}>
          <div>
            <h1 style={{ fontSize: "26px" }}>Semesters</h1>
            <p style={{ color: "#64748b" }}>
              Manage department & course semesters
            </p>
          </div>

          <button
            style={addBtn}
            onClick={() => {
              setDepartment("");
              setCourse("");
              setSemesterNumber("");
              setSemesterName("");
              setEditId(null);
              setShowModal(true);
            }}
          >
            <FiPlus /> Add Semester
          </button>
        </div>

        <div style={cardStyle}>
          <div style={searchBox}>
            <FiSearch />
            <input
              placeholder="Search semesters..."
              style={searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={tableHeader}>
            <div>Department</div>
            <div style={{ marginLeft: "40px" }}>Course</div>
            <div>Semester No.</div>
            <div>Semester Name</div>
            <div>Actions</div>
          </div>

          {filteredSemesters.map((s) => (
            <div key={s._id} style={tableRow}>
              <span style={courseBadge}>{s.department}</span>
              <span style={courseBadge}>{s.course}</span>
              <div style={{ marginLeft: "40px" }}>{s.semesterNumber}</div>
              <strong style={{ marginLeft: "10px" }}>
                {s.semesterName}
              </strong>
              <div style={{ display: "flex", gap: "14px" }}>
                <FiEdit
                  color="#2563eb"
                  onClick={() => {
                    setEditId(s._id);
                    setDepartment(s.department);
                    setCourse(s.course);
                    setSemesterNumber(s.semesterNumber);
                    setSemesterName(s.semesterName);
                    setShowEditModal(true);
                  }}
                />
                <FiTrash2
                  color="#ef4444"
                  onClick={() => confirmDeleteSemester(s._id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD MODAL */}
      {showModal && (
        <div style={overlay}>
          <div style={modal}>
            <div style={modalHeader}>
              <h2>Add Semester</h2>
              <FiX onClick={() => setShowModal(false)} />
            </div>

            <div style={form}>
              <select style={input} value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>

              <select style={input} value={course} onChange={(e) => setCourse(e.target.value)}>
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>

              <input style={input} placeholder="Semester Number" value={semesterNumber} onChange={(e) => setSemesterNumber(e.target.value)} />
              <input style={input} placeholder="Semester Name" value={semesterName} onChange={(e) => setSemesterName(e.target.value)} />
            </div>

            <div style={modalActions}>
              <button style={cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={saveBtn} onClick={handleAddSemester}>Add Semester</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div style={overlay}>
          <div style={modal}>
            <div style={modalHeader}>
              <h2>Edit Semester</h2>
              <FiX onClick={() => setShowEditModal(false)} />
            </div>

            <div style={form}>
              <select style={input} value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>

              <select style={input} value={course} onChange={(e) => setCourse(e.target.value)}>
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>

              <input style={input} value={semesterNumber} onChange={(e) => setSemesterNumber(e.target.value)} />
              <input style={input} value={semesterName} onChange={(e) => setSemesterName(e.target.value)} />
            </div>

            <div style={modalActions}>
              <button style={cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button style={saveBtn} onClick={handleUpdateSemester}>Update Semester</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};






/* ================= STYLES (UNCHANGED) ================= */

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "24px",
};

const addBtn = {
  background: "#2563eb",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: "12px",
  border: "none",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  fontWeight: "500",
  height: "40px",
  boxShadow: "0 8px 20px rgba(37,99,235,0.3)",
};

const cardStyle = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "24px",
  border: "1px solid #e2e8f0",
};

const searchBox = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  marginBottom: "22px",
};

const searchInput = {
  border: "none",
  outline: "none",
  width: "100%",
  background: "transparent",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1.2fr 1fr 2fr 1fr",
  padding: "14px 16px",
  background: "#f1f5f9",
  borderRadius: "12px",
  fontWeight: "600",
  fontSize: "13px",
  color: "#475569",
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1.2fr 1fr 2fr 1fr",
  background: "#ffffff",
  padding: "16px",
  borderRadius: "12px",
  marginTop: "12px",
  alignItems: "center",
  border: "1px solid #e2e8f0",
};

const courseBadge = {
  background: "#eef2ff",
  color: "#2563eb",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "500",
  width: "fit-content",
};

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal = {
  width: "460px",
  background: "#ffffff",
  borderRadius: "18px",
  padding: "28px",
  boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
  transition: "all 0.25s ease",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: "14px",
  marginBottom: "22px",
  borderBottom: "1px solid #e2e8f0",
};

const form = {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
};

const input = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  marginLeft: "-12px",
  outline: "none",
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  marginTop: "30px",
  paddingTop: "16px",
  borderTop: "1px solid #e2e8f0",
};

const cancelBtn = {
  padding: "12px 20px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  cursor: "pointer",
  fontWeight: "500",
};

const saveBtn = {
  padding: "12px 20px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: "500",
};

export default Semesters;
