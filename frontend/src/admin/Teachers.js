import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiX,
  FiEye,
  FiUser,
  FiBriefcase,
  FiAward,
  FiGrid,
  FiStar,
  FiClock,
  FiCreditCard,
  FiBook,
} from "react-icons/fi";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Detail Item Component
const DetailItem = ({ icon, label, value }) => (
  <div style={detailItemStyle}>
    <span style={detailIconStyle}>{icon}</span>
    <div style={detailTextStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <span style={detailValueStyle}>{value || '—'}</span>
    </div>
  </div>
);

const Teachers = () => {
  const [showModal, setShowModal] = useState(false);
  const [animateModal, setAnimateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [animateEditModal, setAnimateEditModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  
  // Selected values for add form (with division)
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]); // [{ subjectId, division }]
  
  // Selected values for edit form
  const [editSelectedDepartment, setEditSelectedDepartment] = useState("");
  const [editSelectedCourse, setEditSelectedCourse] = useState("");
  const [editSelectedSubjects, setEditSelectedSubjects] = useState([]);
  
  const [viewTeacher, setViewTeacher] = useState(null);
  const [editTeacher, setEditTeacher] = useState(null);
  const [animateViewModal, setAnimateViewModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [role] = useState("teacher");

  // Divisions options
  const divisions = ["A", "B", "C", "D", "E", "F"];

  /* ================= LOCK BODY SCROLL ================= */
  useEffect(() => {
    document.body.style.overflow = (showModal || showEditModal || viewTeacher) ? "hidden" : "auto";
  }, [showModal, showEditModal, viewTeacher]);

  /* ================= FETCH DEPARTMENTS ================= */
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/departments/active")
      .then((res) => setDepartments(res.data))
      .catch(() =>
        toast.error("Failed to load departments", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        })
      );
  }, []);

  /* ================= FETCH TEACHERS ================= */
  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/teachers");
      setTeachers(res.data);
    } catch (error) {
      toast.error("Failed to load teachers", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    }
  };

  /* ================= TOGGLE STATUS ================= */
  const toggleStatus = async (id) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/teachers/toggle-status/${id}`
      );
      toast.success(res.data.message, {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      fetchTeachers();
    } catch (error) {
      toast.error("Failed to update teacher status", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    }
  };

  /* ================= FETCH COURSES BY DEPARTMENT ================= */
  const handleDepartmentChange = (dept, isEdit = false) => {
    if (!dept) {
      if (isEdit) {
        setEditSelectedDepartment("");
        setEditSelectedCourse("");
        setEditSelectedSubjects([]);
        setCourses([]);
        setSubjects([]);
      } else {
        setSelectedDepartment("");
        setSelectedCourse("");
        setSelectedSubjects([]);
        setCourses([]);
        setSubjects([]);
      }
      return;
    }

    if (isEdit) {
      setEditSelectedDepartment(dept);
      setEditSelectedCourse("");
      setEditSelectedSubjects([]);
    } else {
      setSelectedDepartment(dept);
      setSelectedCourse("");
      setSelectedSubjects([]);
    }

    axios
      .get(`http://localhost:5000/api/courses/by-department/${dept}`)
      .then((res) => {
        setCourses(res.data);
      })
      .catch(() =>
        toast.error("Failed to load courses", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        })
      );
  };

  /* ================= FETCH SUBJECTS BY COURSE ================= */
  const handleCourseChange = (course, isEdit = false) => {
    if (!course) {
      if (isEdit) {
        setEditSelectedCourse("");
        setEditSelectedSubjects([]);
        setSubjects([]);
      } else {
        setSelectedCourse("");
        setSelectedSubjects([]);
        setSubjects([]);
      }
      return;
    }

    if (isEdit) {
      setEditSelectedCourse(course);
    } else {
      setSelectedCourse(course);
    }

    const department = isEdit ? editSelectedDepartment : selectedDepartment;
    
    if (!department) return;

    axios
      .get(`http://localhost:5000/api/subjects/by-course/${department}/${course}`)
      .then((res) => {
        setSubjects(res.data);
      })
      .catch(() =>
        toast.error("Failed to load subjects", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        })
      );
  };

  /* ================= HANDLE SUBJECT SELECTION WITH DIVISION ================= */
  const handleSubjectToggle = (subjectId, division, isEdit = false) => {
    if (isEdit) {
      const existing = editSelectedSubjects.find(s => s.subjectId === subjectId);
      if (existing) {
        setEditSelectedSubjects(editSelectedSubjects.filter(s => s.subjectId !== subjectId));
      } else {
        setEditSelectedSubjects([...editSelectedSubjects, { subjectId, division: division || "A" }]);
      }
    } else {
      const existing = selectedSubjects.find(s => s.subjectId === subjectId);
      if (existing) {
        setSelectedSubjects(selectedSubjects.filter(s => s.subjectId !== subjectId));
      } else {
        setSelectedSubjects([...selectedSubjects, { subjectId, division: division || "A" }]);
      }
    }
  };

  const handleDivisionChange = (subjectId, division, isEdit = false) => {
    if (isEdit) {
      setEditSelectedSubjects(editSelectedSubjects.map(s => 
        s.subjectId === subjectId ? { ...s, division } : s
      ));
    } else {
      setSelectedSubjects(selectedSubjects.map(s => 
        s.subjectId === subjectId ? { ...s, division } : s
      ));
    }
  };

  const getSubjectDivision = (subjectId, isEdit = false) => {
    if (isEdit) {
      const found = editSelectedSubjects.find(s => s.subjectId === subjectId);
      return found ? found.division : "A";
    } else {
      const found = selectedSubjects.find(s => s.subjectId === subjectId);
      return found ? found.division : "A";
    }
  };

  const isSubjectSelected = (subjectId, isEdit = false) => {
    if (isEdit) {
      return editSelectedSubjects.some(s => s.subjectId === subjectId);
    } else {
      return selectedSubjects.some(s => s.subjectId === subjectId);
    }
  };

  /* ================= ADD TEACHER ================= */
  const handleAddTeacher = async () => {
    try {
      const inputs = document.querySelectorAll(
        "#add-teacher-form select, #add-teacher-form input:not([type='file']):not([type='checkbox'])"
      );

      const [
        department,
        course,
        employeeId,
        name,
        designation,
        qualification,
        experience,
        specialization,
        email,
        mobile,
        password,
      ] = Array.from(inputs).map((i) => i.value);

      if (
        !department || !course || !employeeId || !name || !designation ||
        !qualification || !experience || !specialization || !email || !mobile || !password
      ) {
        toast.error("Please fill all required fields");
        return;
      }

      if (!/^[0-9]{10}$/.test(mobile)) {
        toast.error("Enter valid 10-digit mobile number");
        return;
      }

      if (selectedSubjects.length === 0) {
        toast.error("Please select at least one subject with division");
        return;
      }

      const formData = new FormData();
      formData.append("department", department);
      formData.append("course", course);
      formData.append("employeeId", employeeId);
      formData.append("name", name);
      formData.append("designation", designation);
      formData.append("qualification", qualification);
      formData.append("experience", experience);
      formData.append("specialization", specialization);
      formData.append("email", email);
      formData.append("mobile", mobile);
      formData.append("password", password);
      formData.append("role", role);
      
      formData.append("subjects", JSON.stringify(selectedSubjects));

      const fileInput = document.querySelector(
        "#add-teacher-form input[type='file']"
      );
      if (fileInput && fileInput.files.length > 0) {
        formData.append("photo", fileInput.files[0]);
      }

      const response = await axios.post("http://localhost:5000/api/teachers/add", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.status === 201 || response.status === 200) {
        toast.success("✓ Teacher added successfully");
        fetchTeachers();
        
        setSelectedDepartment("");
        setSelectedCourse("");
        setSelectedSubjects([]);
        document.querySelector("#add-teacher-form").reset();
        
        setAnimateModal(false);
        setTimeout(() => setShowModal(false), 200);
      }
    } catch (error) {
      console.error("Error adding teacher:", error);
      const errorMessage = error.response?.data?.message || "Failed to add teacher";
      toast.error(`✗ ${errorMessage}`);
    }
  };

  /* ================= EDIT TEACHER ================= */
  const handleEditClick = (teacher) => {
    setEditTeacher(teacher);
    setEditSelectedDepartment(teacher.department);
    setEditSelectedCourse(teacher.course || teacher.courses?.[0] || "");
    
    const subjectsWithDivision = teacher.subjects?.map(s => ({
      subjectId: s.subjectId?._id || s.subjectId,
      division: s.division || "A"
    })) || [];
    
    setEditSelectedSubjects(subjectsWithDivision);
    
    setShowEditModal(true);
    setTimeout(() => setAnimateEditModal(true), 10);
    
    if (teacher.department) {
      handleDepartmentChange(teacher.department, true);
      setTimeout(() => {
        if (teacher.course || teacher.courses?.[0]) {
          handleCourseChange(teacher.course || teacher.courses?.[0], true);
        }
      }, 100);
    }
  };

  const handleUpdateTeacher = async () => {
    try {
      const inputs = document.querySelectorAll(
        "#edit-teacher-form select, #edit-teacher-form input:not([type='file']):not([type='checkbox'])"
      );

      const [
        department,
        course,
        employeeId,
        name,
        designation,
        qualification,
        experience,
        specialization,
        email,
        mobile,
        password,
      ] = Array.from(inputs).map((i) => i.value);

      if (
        !department || !course || !employeeId || !name || !designation ||
        !qualification || !experience || !specialization || !email || !mobile
      ) {
        toast.error("Please fill all required fields");
        return;
      }

      if (!/^[0-9]{10}$/.test(mobile)) {
        toast.error("Enter valid 10-digit mobile number");
        return;
      }

      if (editSelectedSubjects.length === 0) {
        toast.error("Please select at least one subject with division");
        return;
      }

      const formData = new FormData();
      formData.append("department", department);
      formData.append("course", course);
      formData.append("employeeId", employeeId);
      formData.append("name", name);
      formData.append("designation", designation);
      formData.append("qualification", qualification);
      formData.append("experience", experience);
      formData.append("specialization", specialization);
      formData.append("email", email);
      formData.append("mobile", mobile);
      
      formData.append("subjects", JSON.stringify(editSelectedSubjects));
      
      if (password) {
        formData.append("password", password);
      }

      const fileInput = document.querySelector(
        "#edit-teacher-form input[type='file']"
      );
      if (fileInput && fileInput.files.length > 0) {
        formData.append("photo", fileInput.files[0]);
      }

      const response = await axios.put(
        `http://localhost:5000/api/teachers/${editTeacher._id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200) {
        toast.success("✓ Teacher updated successfully");
        fetchTeachers();
        setAnimateEditModal(false);
        setTimeout(() => {
          setShowEditModal(false);
          setEditTeacher(null);
          setEditSelectedDepartment("");
          setEditSelectedCourse("");
          setEditSelectedSubjects([]);
        }, 200);
      }
    } catch (error) {
      console.error("Error updating teacher:", error);
      const errorMessage = error.response?.data?.message || "Failed to update teacher";
      toast.error(`✗ ${errorMessage}`);
    }
  };

  /* ================= DELETE TEACHER ================= */
  const confirmDeleteTeacher = (teacherId, teacherName) => {
    setDeleteId(teacherId);

    toast.info(
      <div>
        <p style={{ fontWeight: "600", marginBottom: "10px", color: "#1e293b" }}>
          Delete "{teacherName}"?
        </p>
        <p style={{ fontSize: "13px", marginBottom: "15px", color: "#475569" }}>
          This action will permanently delete the teacher and all associated data.
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={async () => {
              try {
                const response = await axios.delete(
                  `http://localhost:5000/api/teachers/${teacherId}`
                );
                toast.dismiss();
                
                if (response.status === 200) {
                  toast.success("✓ Teacher deleted successfully");
                  fetchTeachers();
                }
                setDeleteId(null);
              } catch (error) {
                toast.dismiss();
                toast.error(error.response?.data?.message || "Failed to delete teacher");
                setDeleteId(null);
              }
            }}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
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
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Cancel
          </button>
        </div>
      </div>,
      { 
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        style: {
          borderRadius: "12px",
          background: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
        }
      }
    );
  };

  /* ================= VIEW TEACHER HANDLER ================= */
  const handleViewClick = (teacher) => {
    setViewTeacher(teacher);
    setTimeout(() => setAnimateViewModal(true), 10);
  };

  /* ================= SEARCH FILTER ================= */
  const filteredTeachers = teachers.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{
          width: "auto",
          minWidth: "300px",
        }}
      />

      <div style={{ padding: "28px" }}>
        <div style={header}>
          <div>
            <h1 style={{ marginBottom: "6px", fontSize: "26px" }}>Teachers</h1>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Manage faculty members and assign subjects with divisions
            </p>
          </div>

          <button
            style={addBtn}
            onClick={() => {
              setShowModal(true);
              setTimeout(() => setAnimateModal(true), 10);
            }}
          >
            <FiPlus /> Add Teacher
          </button>
        </div>

        <div style={card}>
          <div style={searchRow}>
            <div style={searchBox}>
              <FiSearch />
              <input
                placeholder="Search by name, email or employee ID..."
                style={searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={tableHeader}>
            <div>Employee ID</div>
            <div style={{ marginLeft: "40px" }}>Name</div>
            <div style={{ marginLeft: "40px" }}>Contact</div>
            <div style={{ marginLeft: "-40px" }}>Department</div>
            <div>Specialization</div>
            <div style={{ marginLeft: "-15px" }}>Subjects</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {filteredTeachers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              {search ? "No teachers match your search" : "No teachers found"}
            </div>
          ) : (
            filteredTeachers.map((t) => (
              <div key={t._id} style={tableRow}>
                <div style={empId}>{t.employeeId}</div>

                <div style={nameCell}>
                  <div style={avatar}>
                    {t.photo ? (
                      <img
                        src={`http://localhost:5000/uploads/teachers/${t.photo}`}
                        alt={t.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      t.name?.charAt(0)
                    )}
                  </div>
                  <strong>{t.name}</strong>
                </div>

                <div style={contact}>
                  <div style={contactRow}>
                    <FiMail size={14} /> {t.email}
                  </div>
                  <div style={contactRow}>
                    <FiPhone size={14} /> {t.mobile}
                  </div>
                </div>

                <span style={deptBadge}>{t.department}</span>

                <div style={{ fontSize: "14px", paddingLeft: "30px" }}>{t.specialization}</div>

                <div style={courseCell}>
                  <FiBook /> {t.subjects?.length || 0}
                </div>

                <span
                  style={{
                    ...statusBadge,
                    cursor: "pointer",
                    background: t.status === "active" ? "#dcfce7" : "#fee2e2",
                    color: t.status === "active" ? "#16a34a" : "#b91c1c",
                  }}
                  onClick={() => toggleStatus(t._id)}
                >
                  {t.status}
                </span>

                <div style={actions}>
                  <FiEye
                    color="#0ea5e9"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleViewClick(t)}
                  />
                  <FiEdit
                    color="#2563eb"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleEditClick(t)}
                  />
                  <FiTrash2
                    color="#ef4444"
                    style={{ cursor: "pointer" }}
                    onClick={() => confirmDeleteTeacher(t._id, t.name)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= VIEW TEACHER MODAL ================= */}
      {viewTeacher && (
        <div style={overlay} onClick={() => {
          setAnimateViewModal(false);
          setTimeout(() => setViewTeacher(null), 200);
        }}>
          <div 
            style={{
              ...modal,
              width: "600px",
              transform: animateViewModal ? "scale(1)" : "scale(0.95)",
              opacity: animateViewModal ? 1 : 0,
              transition: "all 0.2s ease-in-out",
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={profileSection}>
              <div style={profileImageContainer}>
                {viewTeacher.photo ? (
                  <img
                    src={`http://localhost:5000/uploads/teachers/${viewTeacher.photo}`}
                    alt={viewTeacher.name}
                    style={profileImage}
                  />
                ) : (
                  <div style={profileImagePlaceholder}>
                    {viewTeacher.name?.charAt(0)}
                  </div>
                )}
              </div>
              
              <div style={profileInfo}>
                <h2 style={modalTitle}>{viewTeacher.name}</h2>
                <div style={badgeContainer}>
                  <span style={{
                    ...statusBadgeSmall,
                    background: viewTeacher.status === "active" ? "#dcfce7" : "#fee2e2",
                    color: viewTeacher.status === "active" ? "#16a34a" : "#b91c1c",
                  }}>
                    {viewTeacher.status?.toUpperCase()}
                  </span>
                  <span style={empIdBadge}>
                    <FiCreditCard size={12} /> {viewTeacher.employeeId}
                  </span>
                </div>
                <p style={designationText}>
                  {viewTeacher.designation || "Faculty Member"}
                </p>
              </div>
            </div>

            <div style={modalGrid}>
              <div style={modalCard}>
                <div style={cardHeader}>
                  <FiUser size={16} color="#2563eb" />
                  <h4 style={cardTitle}>Personal Information</h4>
                </div>
                <div style={cardContent}>
                  <DetailItem icon={<FiUser size={12} />} label="Full Name" value={viewTeacher.name} />
                  <DetailItem icon={<FiCreditCard size={12} />} label="Employee ID" value={viewTeacher.employeeId} />
                  <DetailItem icon={<FiBriefcase size={12} />} label="Designation" value={viewTeacher.designation} />
                  <DetailItem icon={<FiAward size={12} />} label="Qualification" value={viewTeacher.qualification} />
                </div>
              </div>

              <div style={modalCard}>
                <div style={cardHeader}>
                  <FiMail size={16} color="#ea580c" />
                  <h4 style={cardTitle}>Contact Information</h4>
                </div>
                <div style={cardContent}>
                  <DetailItem icon={<FiMail size={12} />} label="Email Address" value={viewTeacher.email} />
                  <DetailItem icon={<FiPhone size={12} />} label="Mobile Number" value={viewTeacher.mobile} />
                </div>
              </div>

              <div style={modalCard}>
                <div style={cardHeader}>
                  <FiBookOpen size={16} color="#7c3aed" />
                  <h4 style={cardTitle}>Academic Information</h4>
                </div>
                <div style={cardContent}>
                  <DetailItem icon={<FiGrid size={12} />} label="Department" value={viewTeacher.department} />
                  <DetailItem icon={<FiStar size={12} />} label="Specialization" value={viewTeacher.specialization} />
                  <DetailItem icon={<FiClock size={12} />} label="Experience" value={viewTeacher.experience ? `${viewTeacher.experience} Years` : 'Not specified'} />
                  <DetailItem icon={<FiBook size={12} />} label="Subjects" value={`${viewTeacher.subjects?.length || 0} Assigned`} />
                </div>
              </div>
            </div>

            {viewTeacher.subjects && viewTeacher.subjects.length > 0 && (
              <div style={subjectsSection}>
                <h4 style={subjectsTitle}>Assigned Subjects with Divisions</h4>
                <div style={subjectsList}>
                  {viewTeacher.subjects.map((subject, index) => {
                    let subjectName = "";
                    let division = "";
                    
                    if (subject.subjectId) {
                      subjectName = subject.subjectId.name || subject.subjectId;
                      division = subject.division || "";
                    } else if (subject.name) {
                      subjectName = subject.name;
                      division = subject.division || "";
                    } else if (typeof subject === 'string') {
                      subjectName = subject;
                    } else if (subject._id && subject.name) {
                      subjectName = subject.name;
                      division = subject.division || "";
                    }
                    
                    return (
                      <span key={index} style={subjectBadge}>
                        <FiBook size={12} /> {subjectName}
                        {division && ` - Division ${division}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={modalFooter}>
              <button style={closeButton} onClick={() => {
                setAnimateViewModal(false);
                setTimeout(() => setViewTeacher(null), 200);
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD TEACHER MODAL ================= */}
      {showModal && (
        <div
          style={overlay}
          onClick={() => {
            setAnimateModal(false);
            setTimeout(() => setShowModal(false), 200);
          }}
        >
          <div
            style={{
              ...modal,
              width: "700px",
              transform: animateModal ? "scale(1)" : "scale(0.95)",
              opacity: animateModal ? 1 : 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeader}>
              <h3>Add New Teacher</h3>
              <FiX
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setAnimateModal(false);
                  setTimeout(() => setShowModal(false), 200);
                }}
              />
            </div>

            <form id="add-teacher-form" onSubmit={(e) => e.preventDefault()}>
              <div style={formGrid}>
                <select 
                  style={input} 
                  onChange={(e) => handleDepartmentChange(e.target.value, false)}
                  value={selectedDepartment}
                >
                  <option value="">Select Department *</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>

                <select 
                  style={input} 
                  onChange={(e) => handleCourseChange(e.target.value, false)}
                  value={selectedCourse}
                  disabled={!selectedDepartment}
                >
                  <option value="">Select Course *</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <input placeholder="Employee ID *" style={input} required />
                <input placeholder="Full Name *" style={input} required />
                <input placeholder="Designation *" style={input} required />
                <input placeholder="Qualification *" style={input} required />
                <input placeholder="Experience (Years) *" type="number" min="0" style={input} required />
                <input placeholder="Specialization *" style={input} required />
                <input placeholder="Email *" type="email" style={input} required />
                <input placeholder="Mobile (10 digits) *" type="tel" maxLength="10" style={input} required />
                <input placeholder="Password *" type="password" minLength="6" style={input} required />
                
                <div style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
                  <label style={subjectsLabel}>Select Subjects with Division *</label>
                  {subjects.length > 0 ? (
                    <div style={subjectsCheckboxGrid}>
                      {subjects.map((subject) => (
                        <div key={subject._id} style={subjectAssignmentRow}>
                          <label style={checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={isSubjectSelected(subject._id, false)}
                              onChange={() => handleSubjectToggle(subject._id, "A", false)}
                              style={checkbox}
                            />
                            <span style={checkboxText}>{subject.name} ({subject.code})</span>
                          </label>
                          {isSubjectSelected(subject._id, false) && (
                            <select
                              value={getSubjectDivision(subject._id, false)}
                              onChange={(e) => handleDivisionChange(subject._id, e.target.value, false)}
                              style={divisionSelect}
                            >
                              {divisions.map(div => (
                                <option key={div} value={div}>Division {div}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={noSubjectsText}>
                      {selectedCourse ? "No subjects available for this course" : "Select a course first"}
                    </p>
                  )}
                </div>

                <input type="file" accept="image/*" style={{ ...input, gridColumn: "1 / -1", marginTop: "10px" }} />
              </div>

              <div style={modalActions}>
                <button 
                  style={cancelBtn} 
                  type="button"
                  onClick={() => {
                    setAnimateModal(false);
                    setTimeout(() => setShowModal(false), 200);
                    setSelectedDepartment("");
                    setSelectedCourse("");
                    setSelectedSubjects([]);
                  }}
                >
                  Cancel
                </button>
                <button style={saveBtn} type="button" onClick={handleAddTeacher}>Add Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT TEACHER MODAL ================= */}
      {showEditModal && editTeacher && (
        <div
          style={overlay}
          onClick={() => {
            setAnimateEditModal(false);
            setTimeout(() => {
              setShowEditModal(false);
              setEditTeacher(null);
              setEditSelectedDepartment("");
              setEditSelectedCourse("");
              setEditSelectedSubjects([]);
            }, 200);
          }}
        >
          <div
            style={{
              ...modal,
              width: "700px",
              transform: animateEditModal ? "scale(1)" : "scale(0.95)",
              opacity: animateEditModal ? 1 : 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeader}>
              <h3>Edit Teacher</h3>
              <FiX
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setAnimateEditModal(false);
                  setTimeout(() => {
                    setShowEditModal(false);
                    setEditTeacher(null);
                    setEditSelectedDepartment("");
                    setEditSelectedCourse("");
                    setEditSelectedSubjects([]);
                  }, 200);
                }}
              />
            </div>

            <form id="edit-teacher-form" onSubmit={(e) => e.preventDefault()}>
              <div style={formGrid}>
                <select 
                  style={input} 
                  value={editSelectedDepartment}
                  onChange={(e) => handleDepartmentChange(e.target.value, true)}
                >
                  <option value="">Select Department *</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>

                <select 
                  style={input} 
                  value={editSelectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value, true)}
                  disabled={!editSelectedDepartment}
                >
                  <option value="">Select Course *</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <input placeholder="Employee ID *" defaultValue={editTeacher.employeeId} style={input} required />
                <input placeholder="Full Name *" defaultValue={editTeacher.name} style={input} required />
                <input placeholder="Designation *" defaultValue={editTeacher.designation} style={input} required />
                <input placeholder="Qualification *" defaultValue={editTeacher.qualification} style={input} required />
                <input placeholder="Experience (Years) *" type="number" min="0" defaultValue={editTeacher.experience} style={input} required />
                <input placeholder="Specialization *" defaultValue={editTeacher.specialization} style={input} required />
                <input placeholder="Email *" type="email" defaultValue={editTeacher.email} style={input} required />
                <input placeholder="Mobile (10 digits) *" type="tel" maxLength="10" defaultValue={editTeacher.mobile} style={input} required />
                <input placeholder="New Password (leave blank to keep current)" type="password" style={input} />
                
                <div style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
                  <label style={subjectsLabel}>Select Subjects with Division *</label>
                  {subjects.length > 0 ? (
                    <div style={subjectsCheckboxGrid}>
                      {subjects.map((subject) => (
                        <div key={subject._id} style={subjectAssignmentRow}>
                          <label style={checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={isSubjectSelected(subject._id, true)}
                              onChange={() => handleSubjectToggle(subject._id, "A", true)}
                              style={checkbox}
                            />
                            <span style={checkboxText}>{subject.name} ({subject.code})</span>
                          </label>
                          {isSubjectSelected(subject._id, true) && (
                            <select
                              value={getSubjectDivision(subject._id, true)}
                              onChange={(e) => handleDivisionChange(subject._id, e.target.value, true)}
                              style={divisionSelect}
                            >
                              {divisions.map(div => (
                                <option key={div} value={div}>Division {div}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={noSubjectsText}>
                      {editSelectedCourse ? "No subjects available for this course" : "Select a course first"}
                    </p>
                  )}
                </div>

                <input type="file" accept="image/*" style={{ ...input, gridColumn: "1 / -1", marginTop: "10px" }} />
              </div>

              <div style={modalActions}>
                <button 
                  style={cancelBtn} 
                  type="button"
                  onClick={() => {
                    setAnimateEditModal(false);
                    setTimeout(() => {
                      setShowEditModal(false);
                      setEditTeacher(null);
                      setEditSelectedDepartment("");
                      setEditSelectedCourse("");
                      setEditSelectedSubjects([]);
                    }, 200);
                  }}
                >
                  Cancel
                </button>
                <button style={saveBtn} type="button" onClick={handleUpdateTeacher}>Update Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

/* ================= STYLES ================= */
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

const card = {
  background: "#fff",
  borderRadius: "18px",
  padding: "24px",
  border: "1px solid #e2e8f0",
};

const searchRow = {
  display: "flex",
  gap: "16px",
  marginBottom: "22px",
};

const searchBox = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
};

const searchInput = {
  border: "none",
  outline: "none",
  width: "100%",
  background: "transparent",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "1.2fr 2fr 3fr 1.2fr 2fr 1fr 1fr 1fr",
  padding: "14px 16px",
  background: "#f1f5f9",
  borderRadius: "12px",
  fontWeight: "600",
  fontSize: "13px",
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "1.2fr 2fr 3fr 1.2fr 2fr 1fr 1fr 1fr",
  padding: "16px",
  marginTop: "12px",
  borderRadius: "12px",
  background: "#fff",
  border: "1px solid #e2e8f0",
  alignItems: "center",
};

const empId = { color: "#2563eb", fontWeight: "600" };
const nameCell = { display: "flex", alignItems: "center", gap: "10px" };

const avatar = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "#dcfce7",
  color: "#16a34a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "600",
};

const contact = { fontSize: "13px", color: "#475569", marginLeft: "10px" };
const contactRow = { display: "flex", gap: "6px", alignItems: "center" };

const deptBadge = {
  background: "#eef2ff",
  color: "#1d4ed8",
  padding: "6px 14px 6px 20px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "600",
  display: "inline-flex",
  marginLeft: "-30px",
  marginRight: "10px",
  justifyContent: "center",
};

const courseCell = {
  display: "flex",
  gap: "6px",
  alignItems: "center",
  marginLeft: "25px",
};

const statusBadge = {
  padding: "6px 18px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "500",
  width: "60px",
  marginRight: "10px",
  textAlign: "center",
};

const actions = { display: "flex", gap: "14px" };

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modal = {
  background: "#fff",
  borderRadius: "18px",
  padding: "24px",
  transition: "all 0.2s ease-in-out",
  maxHeight: "90vh",
  overflowY: "auto",
};

const profileSection = {
  display: "flex",
  gap: "20px",
  marginBottom: "20px",
  alignItems: "center",
};

const profileImageContainer = {
  flexShrink: 0,
};

const profileImage = {
  width: "70px",
  height: "70px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "3px solid #fff",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
};

const profileImagePlaceholder = {
  width: "70px",
  height: "70px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #2563eb, #1e40af)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  fontWeight: "600",
  border: "3px solid #fff",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
};

const profileInfo = {
  flex: 1,
};

const modalTitle = {
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 6px 0",
  color: "#0f172a",
};

const badgeContainer = {
  display: "flex",
  gap: "8px",
  marginBottom: "4px",
  flexWrap: "wrap",
};

const statusBadgeSmall = {
  padding: "4px 10px",
  borderRadius: "40px",
  fontSize: "11px",
  fontWeight: "600",
  display: "inline-block",
};

const empIdBadge = {
  padding: "4px 10px",
  background: "#f1f5f9",
  borderRadius: "40px",
  fontSize: "11px",
  fontWeight: "500",
  color: "#475569",
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const designationText = {
  fontSize: "13px",
  color: "#64748b",
  margin: 0,
};

const modalGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "12px",
  marginBottom: "20px",
};

const modalCard = {
  background: "#f8fafc",
  borderRadius: "12px",
  padding: "14px",
  border: "1px solid #e2e8f0",
};

const cardHeader = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginBottom: "10px",
  paddingBottom: "6px",
  borderBottom: "1px solid #e2e8f0",
};

const cardTitle = {
  fontSize: "13px",
  fontWeight: "600",
  margin: 0,
  color: "#0f172a",
};

const cardContent = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const detailItemStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "6px",
};

const detailIconStyle = {
  width: "20px",
  height: "20px",
  background: "#fff",
  borderRadius: "5px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  border: "1px solid #e2e8f0",
  fontSize: "11px",
};

const detailTextStyle = {
  flex: 1,
};

const detailLabelStyle = {
  display: "block",
  fontSize: "9px",
  fontWeight: "500",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.2px",
  marginBottom: "1px",
};

const detailValueStyle = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#0f172a",
  lineHeight: "1.3",
};

const subjectsSection = {
  marginTop: "20px",
  padding: "16px",
  background: "#f8fafc",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
};

const subjectsTitle = {
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 12px 0",
  color: "#0f172a",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const subjectsList = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const subjectBadge = {
  background: "#e0e7ff",
  color: "#1d4ed8",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "500",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
};

const modalFooter = {
  display: "flex",
  justifyContent: "center",
  marginTop: "20px",
};

const closeButton = {
  padding: "8px 24px",
  borderRadius: "30px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s",
  boxShadow: "0 4px 6px rgba(37,99,235,0.2)",
  minWidth: "100px",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "20px",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const input = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  outline: "none",
};

const subjectsLabel = {
  display: "block",
  marginBottom: "10px",
  fontSize: "13px",
  fontWeight: "600",
  color: "#475569",
};

const subjectsCheckboxGrid = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  maxHeight: "250px",
  overflowY: "auto",
  padding: "10px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  background: "#f8fafc",
};

const subjectAssignmentRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px",
  borderBottom: "1px solid #e2e8f0",
};

const checkboxLabel = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  fontSize: "13px",
  flex: 1,
};

const checkbox = {
  width: "16px",
  height: "16px",
  cursor: "pointer",
};

const checkboxText = {
  color: "#334155",
};

const divisionSelect = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  fontSize: "12px",
  background: "#fff",
  cursor: "pointer",
  width: "100px",
};

const noSubjectsText = {
  color: "#94a3b8",
  fontSize: "13px",
  padding: "10px",
  textAlign: "center",
  border: "1px dashed #cbd5e1",
  borderRadius: "10px",
  background: "#f1f5f9",
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  marginTop: "24px",
};

const cancelBtn = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  background: "#fff",
  cursor: "pointer",
  fontWeight: "500",
};

const saveBtn = {
  padding: "12px 18px",
  borderRadius: "10px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: "500",
};

export default Teachers;