import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiPlus, FiEdit, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Batches = () => {
  const [showModal, setShowModal] = useState(false);
  const [animateModal, setAnimateModal] = useState(false);

  // ==========================
  // FORM STATES
  // ==========================
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [batchName, setBatchName] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  // ==========================
  // EDIT STATES
  // ==========================
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // 🔹 DELETE CONFIRM STATE
  const [deleteId, setDeleteId] = useState(null);

  // ==========================
  // DYNAMIC DATA STATES
  // ==========================
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);

  // ==========================
  // FETCH DEPARTMENTS
  // ==========================
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/departments/active")
      .then((res) => setDepartments(res.data))
      .catch(() => toast.error("Failed to load departments"));
  }, []);

  // ==========================
  // FETCH COURSES BY DEPARTMENT
  // ==========================
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

  // ==========================
  // FETCH BATCHES
  // ==========================
  const fetchBatches = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/batches");
      setBatches(res.data);
    } catch {
      toast.error("Failed to load batches");
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // ==========================
  // ADD / UPDATE BATCH
  // ==========================
  const handleAddBatch = async () => {
    if (!department || !course || !batchName || !startYear || !endYear) {
      toast.warning("Please fill all fields");
      return;
    }

    try {
      if (isEditMode) {
        await axios.put(
          `http://localhost:5000/api/batches/edit/${editId}`,
          { batchName, startYear, endYear }
        );
        toast.success("Batch updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/batches/add", {
          department,
          course,
          batchName,
          startYear,
          endYear,
        });
        toast.success("Batch added successfully");
      }

      resetForm();
      fetchBatches();
      setAnimateModal(false);
      setTimeout(() => setShowModal(false), 200);
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  // ==========================
  // EDIT HANDLER
  // ==========================
  const handleEdit = (b) => {
    setIsEditMode(true);
    setEditId(b._id);

    setDepartment(b.department);
    setCourse(b.course);
    setBatchName(b.batchName);
    setStartYear(b.startYear);
    setEndYear(b.endYear);

    setShowModal(true);
    setTimeout(() => setAnimateModal(true), 10);
  };

  // ==========================
  // 🔥 TOAST CONFIRM DELETE
  // ==========================
  const confirmDeleteBatch = (batchId) => {
    setDeleteId(batchId);

    toast.info(
      <div>
        <p style={{ fontWeight: "600", marginBottom: "10px" }}>
          This action will permanently delete the batch.
        </p>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={async () => {
              try {
                await axios.delete(
                  `http://localhost:5000/api/batches/${batchId}`
                );
                toast.dismiss();
                toast.success("Batch deleted permanently");
                fetchBatches();
                setDeleteId(null);
              } catch {
                toast.dismiss();
                toast.error("Failed to delete batch");
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

  // ==========================
  // TOGGLE STATUS
  // ==========================
  const toggleBatchStatus = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/batches/toggle-status/${id}`);
      fetchBatches();
      toast.success("Batch status updated");
    } catch {
      toast.error("Failed to update batch status");
    }
  };

  const resetForm = () => {
    setDepartment("");
    setCourse("");
    setBatchName("");
    setStartYear("");
    setEndYear("");
    setIsEditMode(false);
    setEditId(null);
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div style={{ padding: "28px" }}>
        <div style={header}>
          <div>
            <h1 style={{ marginBottom: "6px", fontSize: "26px", marginTop: "-4px" }}>
              Batches
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Manage student batches by year
            </p>
          </div>

          <button
            style={addBtn}
            onClick={() => {
              resetForm();
              setShowModal(true);
              setTimeout(() => setAnimateModal(true), 10);
            }}
          >
            <FiPlus /> Add Batch
          </button>
        </div>

        <div style={grid}>
          {batches.map((b) => (
            <div key={b._id} style={card}>
              <div style={topRow}>
                <div style={iconBox}>
                  <FiUsers size={20} color="#7c3aed" />
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0 }}>{b.batchName}</h4>
                  <p style={dept}>{b.department}</p>
                </div>

                <span
                  style={{
                    ...status,
                    background:
                      b.status === "active" ? "#dcfce7" : "#fee2e2",
                    color:
                      b.status === "active" ? "#16a34a" : "#dc2626",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleBatchStatus(b._id)}
                >
                  {b.status}
                </span>
              </div>

              <div style={info}>
                <div style={row}>
                  <span style={label}>Academic Year:</span>
                  <span style={value}>
                    {b.startYear}-{b.endYear}
                  </span>
                </div>
                <div style={row}>
                  <span style={label}>Total Students:</span>
                  <span style={value}>{b.students || 0}</span>
                </div>
                <div style={row}>
                  <span style={label}>Start Year:</span>
                  <span style={value}>{b.startYear}</span>
                </div>
                <div style={row}>
                  <span style={label}>End Year:</span>
                  <span style={value}>{b.endYear}</span>
                </div>
              </div>

              <div style={actions}>
                <span style={edit} onClick={() => handleEdit(b)}>
                  <FiEdit /> Edit
                </span>
                <span
                  style={del}
                  onClick={() => confirmDeleteBatch(b._id)}
                >
                  <FiTrash2 /> Delete
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          style={overlay}
          onClick={() => {
            setAnimateModal(false);
            resetForm();
            setTimeout(() => setShowModal(false), 200);
          }}
        >
          <div
            style={{
              ...modal,
              transform: animateModal ? "scale(1)" : "scale(0.95)",
              opacity: animateModal ? 1 : 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeader}>
              <h3 style={{ margin: 0 }}>Add New Batch</h3>
              <FiX
                style={{ cursor: "pointer" }}
                onClick={() => setShowModal(false)}
              />
            </div>

            <div style={form}>
              <div style={{ width: "490px" }}>
                <label style={label}>Department</label>
                <select
                  style={input}
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

              <div style={{ width: "490px" }}>
                <label style={label}>Course</label>
                <select
                  style={input}
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  disabled={!department}
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={label}>Batch Name</label>
                <input
                  placeholder="e.g. BCA 2024-2027"
                  style={input}
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "70px", marginTop: "10px" }}>
                <div style={{ flex: "0 0 160px" }}>
                  <label style={label}>Admission Year</label>
                  <input
                    placeholder="e.g. 2024"
                    style={input}
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                  />
                </div>

                <div style={{ flex: "0 0 160px" }}>
                  <label style={label}>Passing Year</label>
                  <input
                    placeholder="e.g. 2027"
                    style={input}
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={modalActions}>
              <button style={cancelBtn}>Cancel</button>
              <button style={saveBtn} onClick={handleAddBatch}>
                Add Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ================= STYLES ================= */
/* 🔒 EXACTLY YOUR ORIGINAL STYLES – NOT TOUCHED */

const header = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "26px",
};

const addBtn = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  height: "40px",
  fontWeight: "500",
  boxShadow: "0 8px 20px rgba(37,99,235,0.3)",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "24px",
};

const card = {
  background: "#fff",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
};

const topRow = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginBottom: "18px",
};

const iconBox = {
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  background: "#f5f3ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const dept = {
  margin: 0,
  fontSize: "13px",
  color: "#64748b",
};

const status = {
  padding: "6px 14px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "500",
};

const info = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  fontSize: "14px",
};

const row = {
  display: "flex",
  justifyContent: "space-between",
};

const label = {
  color: "#64748b",
};

const value = {
  fontWeight: "600",
};

const actions = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "18px",
  paddingTop: "14px",
  borderTop: "1px solid #e2e8f0",
};

const edit = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: "500",
};

const del = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  color: "#ef4444",
  cursor: "pointer",
  fontWeight: "500",
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
  background: "#fff",
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

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  marginTop: "30px",
  paddingTop: "16px",
  borderTop: "1px solid #e2e8f0",
};

const input = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  outline: "none",
  marginLeft: "-12px",
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

export default Batches;
