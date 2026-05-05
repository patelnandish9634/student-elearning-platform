import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Departments = () => {
  const [showModal, setShowModal] = useState(false);
  const [animateModal, setAnimateModal] = useState(false);

  const [deptCode, setDeptCode] = useState("");
  const [deptName, setDeptName] = useState("");
  const [deptHead, setDeptHead] = useState("");

  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  /* ================= DEPARTMENTS ================= */
  const [departments, setDepartments] = useState([]);

  /* ================= FETCH DEPARTMENTS ================= */
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/departments/department"
      );
      setDepartments(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load departments");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  /* ================= ADD / UPDATE ================= */
  const handleAddDepartment = async () => {
    try {
      if (editId) {
        await axios.put(
          `http://localhost:5000/api/departments/update/${editId}`,
          {
            code: deptCode,
            name: deptName,
            head: deptHead,
          }
        );

        toast.success("Department updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/departments/add", {
          code: deptCode,
          name: deptName,
          head: deptHead,
        });

        toast.success("Department added successfully");
      }

      setDeptCode("");
      setDeptName("");
      setDeptHead("");
      setEditId(null);

      fetchDepartments();

      setAnimateModal(false);
      setTimeout(() => setShowModal(false), 200);
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
    }
  };

  /* ================= DELETE ================= */
  const handleDeleteDepartment = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/departments/delete/${id}`
      );
      toast.success("Department deleted successfully");
      fetchDepartments();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete department");
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (d) => {
    setEditId(d._id);
    setDeptCode(d.code);
    setDeptName(d.name);
    setDeptHead(d.head);
    setShowModal(true);
    setTimeout(() => setAnimateModal(true), 10);
  };

  /* ================= TOGGLE STATUS ================= */
  const toggleDepartmentStatus = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/departments/status/${id}`
      );
      fetchDepartments();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update department status");
    }
  };

  /* ================= SEARCH ================= */
  const filteredDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

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
            marginBottom: "26px",
            marginTop: "-20px",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "6px", fontSize: "26px" }}>
              Departments
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Manage and monitor university departments
            </p>
          </div>

          <button
            onClick={() => {
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
            <FiPlus /> Add Department
          </button>
        </div>

        {/* CARD */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "22px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          {/* SEARCH */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "22px",
              background: "#f8fafc",
            }}
          >
            <FiSearch color="#64748b" />
            <input
              placeholder="Search department by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                background: "transparent",
                fontSize: "14px",
              }}
            />
          </div>

          {/* TABLE HEADER */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 3fr 2fr 1fr 1fr 1fr 1fr",
              padding: "12px 10px",
              color: "#64748b",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            <div>Code</div>
            <div>Department</div>
            <div>Head</div>
            <div>Students</div>
            <div>Courses</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {/* ROWS */}
          {filteredDepartments.map((d) => (
            <div
              key={d._id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 3fr 2fr 1fr 1fr 1fr 1fr",
                alignItems: "center",
                padding: "16px 10px",
                borderRadius: "14px",
                marginBottom: "10px",
                background: "#f8fafc",
              }}
            >
              <div style={{ fontWeight: "600", color: "#2563eb" }}>
                {d.code}
              </div>

              <div>
                <strong style={{ fontSize: "14px" }}>{d.name}</strong>
              </div>

              <div style={{ color: "#475569" }}>{d.head}</div>
              <div>{d.students}</div>
              <div>{d.courses}</div>

              <div>
                <span
                  onClick={() => toggleDepartmentStatus(d._id)}
                  title="Click to change status"
                  style={{
                    cursor: "pointer",
                    background:
                      d.status === "active" ? "#dcfce7" : "#fee2e2",
                    color:
                      d.status === "active" ? "#16a34a" : "#dc2626",
                    padding: "6px 14px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {d.status}
                </span>
              </div>

              <div style={{ display: "flex", gap: "14px" }}>
                <FiEdit
                  color="#2563eb"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleEdit(d)}
                />
                <FiTrash2
                  color="#ef4444"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleDeleteDepartment(d._id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          onClick={() => {
            setAnimateModal(false);
            setTimeout(() => setShowModal(false), 200);
            setEditId(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "420px",
              background: "#ffffff",
              borderRadius: "14px",
              padding: "24px 26px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              transform: animateModal ? "scale(1)" : "scale(0.95)",
              opacity: animateModal ? 1 : 0,
              transition: "all 0.25s ease",
            }}
          >
            <h2
              style={{
                marginBottom: "20px",
                fontSize: "22px",
                fontWeight: "700",
              }}
            >
              {editId ? "Update Department" : "Add New Department"}
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Department Code</label>
              <input
                style={inputStyle}
                placeholder="e.g., CSE, MECH, ECE, CIVIL"
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Department Name</label>
              <input
                style={inputStyle}
                placeholder="e.g., Computer Science Engineering, Mechanical Engineering"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Department Head</label>
              <input
                style={inputStyle}
                placeholder="e.g., Dr. John Smith, Prof. Jane Doe"
                value={deptHead}
                onChange={(e) => setDeptHead(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                style={cancelBtn}
                onClick={() => {
                  setAnimateModal(false);
                  setTimeout(() => setShowModal(false), 200);
                  setEditId(null);
                }}
              >
                Cancel
              </button>

              <button style={saveBtn} onClick={handleAddDepartment}>
                {editId ? "Update Department" : "Add Department"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  fontWeight: "600",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  marginLeft: "-12px",
  outline: "none",
  fontSize: "14px",
};

const cancelBtn = {
  flex: 1,
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  cursor: "pointer",
  background: "#f1f5f9",
  fontWeight: "500",
};

const saveBtn = {
  flex: 1,
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "500",
};

export default Departments;