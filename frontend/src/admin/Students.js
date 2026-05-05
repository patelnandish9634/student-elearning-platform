import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx"; // Import XLSX library
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiX,
  FiMail,
  FiPhone,
  FiEye,
  FiUser,
  FiBookOpen,
  FiCalendar,
  FiHash,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiChevronDown,
  FiSave,
  FiAlertCircle,
  FiDownload, // Add download icon
} from "react-icons/fi";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Students = () => {
  const [showModal, setShowModal] = useState(false);
  const [animateModal, setAnimateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  /* ================= DYNAMIC DROPDOWNS ================= */
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [batches, setBatches] = useState([]);
  const [divisions, setDivisions] = useState([]);

  /* ================= FILTER STATES ================= */
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [filterDivision, setFilterDivision] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  /* ================= FORM STATES ================= */
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [batch, setBatch] = useState("");

  /* ================= FORM STATES ================= */
  const [name, setName] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [division, setDivision] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const[role,setRole]=useState("student")

  /* ================= EDIT FORM STATES ================= */
  const [editName, setEditName] = useState("");
  const [editEnrollmentNumber, setEditEnrollmentNumber] = useState("");
  const [editRollNumber, setEditRollNumber] = useState("");
  const [editDivision, setEditDivision] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [editSemester, setEditSemester] = useState("");
  const [editBatch, setEditBatch] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  /* ================= STUDENT LIST ================= */
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);

  /* ================= FETCH STUDENTS ================= */
  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/students");
      setStudents(res.data);
      setFilteredStudents(res.data);
    } catch (error) {
      toast.error("Failed to load students", { theme: "colored" });
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  /* ================= FETCH DEPARTMENTS ================= */
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/departments/active")
      .then((res) => setDepartments(res.data))
      .catch(() =>
        toast.error("Failed to load departments", { theme: "colored" })
      );
  }, []);

  /* ================= FETCH ALL COURSES ================= */
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/courses")
      .then((res) => setAllCourses(res.data))
      .catch(() =>
        toast.error("Failed to load courses", { theme: "colored" })
      );
  }, []);

  /* ================= FETCH COURSES FOR ADD MODAL ================= */
  useEffect(() => {
    if (!department) {
      setCourses([]);
      setCourse("");
      return;
    }

    axios
      .get(`http://localhost:5000/api/courses/by-department/${department}`)
      .then((res) => setCourses(res.data))
      .catch(() =>
        toast.error("Failed to load courses", { theme: "colored" })
      );
  }, [department]);

  /* ================= FETCH COURSES FOR EDIT MODAL ================= */
  useEffect(() => {
    if (!editDepartment) {
      setCourses([]);
      setEditCourse("");
      return;
    }

    axios
      .get(`http://localhost:5000/api/courses/by-department/${editDepartment}`)
      .then((res) => setCourses(res.data))
      .catch(() =>
        toast.error("Failed to load courses", { theme: "colored" })
      );
  }, [editDepartment]);

  /* ================= FETCH SEMESTERS & BATCHES FOR ADD MODAL ================= */
  useEffect(() => {
    if (!course) {
      setSemesters([]);
      setBatches([]);
      setSemester("");
      setBatch("");
      return;
    }

    axios
      .get(
        `http://localhost:5000/api/semesters/by-course/${department}/${course}`
      )
      .then((res) => setSemesters(res.data))
      .catch(() =>
        toast.error("Failed to load semesters", { theme: "colored" })
      );

    axios
      .get(
        `http://localhost:5000/api/batches/by-course/${department}/${course}`
      )
      .then((res) => setBatches(res.data))
      .catch(() =>
        toast.error("Failed to load batches", { theme: "colored" })
      );
  }, [course, department]);

  /* ================= FETCH SEMESTERS & BATCHES FOR EDIT MODAL ================= */
  useEffect(() => {
    if (!editCourse) {
      setSemesters([]);
      setBatches([]);
      setEditSemester("");
      setEditBatch("");
      return;
    }

    axios
      .get(
        `http://localhost:5000/api/semesters/by-course/${editDepartment}/${editCourse}`
      )
      .then((res) => setSemesters(res.data))
      .catch(() =>
        toast.error("Failed to load semesters", { theme: "colored" })
      );

    axios
      .get(
        `http://localhost:5000/api/batches/by-course/${editDepartment}/${editCourse}`
      )
      .then((res) => setBatches(res.data))
      .catch(() =>
        toast.error("Failed to load batches", { theme: "colored" })
      );
  }, [editCourse, editDepartment]);

  /* ================= RESET DEPENDENT FILTERS ================= */
  useEffect(() => {
    // Reset course filter when department changes
    if (filterDepartment === "all") {
      setFilterCourse("all");
    }
    // Reset batch filter when department or course changes
    if (filterDepartment === "all" || filterCourse === "all") {
      setFilterBatch("all");
    }
  }, [filterDepartment, filterCourse]);

  /* ================= GET COURSES FOR SELECTED DEPARTMENT ================= */
  const getCoursesForDepartment = (deptName) => {
    if (!deptName || deptName === "all") return [];
    return allCourses.filter(course => course.department === deptName);
  };

  /* ================= GET BATCHES FOR FILTER ================= */
  const getBatchesForFilter = () => {
    let filtered = [...students];
    
    // Filter by selected department
    if (filterDepartment !== "all") {
      filtered = filtered.filter(student => student.department === filterDepartment);
    }
    
    // Filter by selected course
    if (filterCourse !== "all") {
      filtered = filtered.filter(student => student.course === filterCourse);
    }
    
    // Get unique batches from filtered students
    const uniqueBatches = [...new Set(filtered.map(student => student.batch))];
    return uniqueBatches.filter(batch => batch).sort();
  };

  /* ================= GET DIVISIONS FOR FILTER ================= */
  const getDivisionsForFilter = () => {
    let filtered = [...students];
    
    // Filter by selected department
    if (filterDepartment !== "all") {
      filtered = filtered.filter(student => student.department === filterDepartment);
    }
    
    // Filter by selected course
    if (filterCourse !== "all") {
      filtered = filtered.filter(student => student.course === filterCourse);
    }
    
    // Filter by selected batch
    if (filterBatch !== "all") {
      filtered = filtered.filter(student => student.batch === filterBatch);
    }
    
    // Get unique divisions from filtered students
    const uniqueDivisions = [...new Set(filtered.map(student => student.division))];
    return uniqueDivisions.filter(division => division).sort();
  };

  /* ================= GET SEMESTERS FOR FILTER ================= */
  const getSemestersForFilter = () => {
    let filtered = [...students];
    
    // Filter by selected department
    if (filterDepartment !== "all") {
      filtered = filtered.filter(student => student.department === filterDepartment);
    }
    
    // Filter by selected course
    if (filterCourse !== "all") {
      filtered = filtered.filter(student => student.course === filterCourse);
    }
    
    // Filter by selected batch
    if (filterBatch !== "all") {
      filtered = filtered.filter(student => student.batch === filterBatch);
    }
    
    // Get unique semesters from filtered students
    const allSemesters = filtered.map(student => student.semester);
    const uniqueSemesters = [...new Set(allSemesters.filter(sem => sem))];
    
    return uniqueSemesters.sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return String(a).localeCompare(String(b));
    });
  };

  /* ================= APPLY FILTERS ================= */
  useEffect(() => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.mobile.includes(searchTerm)
      );
    }

    // Apply department filter
    if (filterDepartment !== "all") {
      filtered = filtered.filter(student => student.department === filterDepartment);
    }

    // Apply course filter
    if (filterCourse !== "all") {
      filtered = filtered.filter(student => student.course === filterCourse);
    }

    // Apply semester filter
    if (filterSemester !== "all") {
      filtered = filtered.filter(student => 
        String(student.semester) === String(filterSemester)
      );
    }

    // Apply batch filter
    if (filterBatch !== "all") {
      filtered = filtered.filter(student => student.batch === filterBatch);
    }

    // Apply division filter
    if (filterDivision !== "all") {
      filtered = filtered.filter(student => student.division === filterDivision);
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(student => student.status === filterStatus);
    }

    setFilteredStudents(filtered);
  }, [searchTerm, filterDepartment, filterCourse, filterSemester, filterBatch, filterDivision, filterStatus, students]);

  /* ================= DOWNLOAD EXCEL FUNCTION ================= */
  const downloadExcel = () => {
    if (filteredStudents.length === 0) {
      toast.warning("No students data to download", { theme: "colored" });
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = filteredStudents.map(student => ({
        "Enrollment No": student.enrollmentNumber,
        "Name": student.name,
        "Email": student.email,
        "Roll No": student.rollNumber || "N/A",
        "Division": student.division || "N/A",
         "Semester": typeof student.semester === 'object' 
          ? student.semester.semesterName || student.semester.semesterNumber 
          : `Semester ${student.semester}`,
        "Password": student.password || "N/A",
        "Status": student.status
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const wscols = [
        { wch: 20 }, // Enrollment No
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 10 }, // Roll No
        { wch: 10 }, // Division
         { wch: 10 }, // Semester
        { wch: 15 }, // Password
        { wch: 10 }, // Status
      ];
      worksheet["!cols"] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

      // Generate filename with timestamp
      const date = new Date();
      const timestamp = `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}_${date.getHours()}-${date.getMinutes()}`;
      const filename = `Students_${timestamp}.xlsx`;

      // Write and download file
      XLSX.writeFile(workbook, filename);
      
      toast.success(`Excel file downloaded: ${filename}`, { theme: "colored" });
    } catch (error) {
      console.error("Error downloading Excel file:", error);
      toast.error("Failed to download Excel file", { theme: "colored" });
    }
  };

  /* ================= ADD STUDENT ================= */
  const handleAddStudent = async () => {
    if (!department || !course || !semester || !batch) {
      return toast.warning(
        "Please select Department, Course, Semester and Batch"
      );
    }

    if (!name.trim()) return toast.warning("Student name is required");
    if (!enrollmentNumber.trim())
      return toast.warning("Enrollment number is required");

    if (!mobile.match(/^[0-9]{10}$/))
      return toast.warning("Enter valid 10-digit mobile number");

    if (!email.match(/^\S+@\S+\.\S+$/))
      return toast.warning("Enter valid email address");

    if (password.length < 6)
      return toast.warning("Password must be at least 6 characters");

    try {
      const formData = new FormData();
      formData.append("department", department);
      formData.append("course", course);
      formData.append("semester", semester);
      formData.append("batch", batch);
      formData.append("name", name);
      formData.append("enrollmentNumber", enrollmentNumber);
      formData.append("rollNumber", rollNumber);
      formData.append("division", division);
      formData.append("mobile", mobile);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);
      formData.append("status", "active");

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput && fileInput.files.length > 0) {
        formData.append("photo", fileInput.files[0]);
      }

      await axios.post(
        "http://localhost:5000/api/students/add",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Student added successfully 🎉", {
        theme: "colored",
      });

      fetchStudents();

      // Reset form
      setName("");
      setEnrollmentNumber("");
      setRollNumber("");
      setDivision("");
      setMobile("");
      setEmail("");
      setPassword("");
      setDepartment("");
      setCourse("");
      setSemester("");
      setBatch("");

      setAnimateModal(false);
      setTimeout(() => setShowModal(false), 200);
    } catch (err) {
      toast.error("Failed to add student ❌", { theme: "colored" });
    }
  };

  /* ================= VIEW STUDENT DETAILS ================= */
  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  /* ================= CLOSE DETAILS MODAL ================= */
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedStudent(null);
  };

  /* ================= OPEN EDIT MODAL ================= */
  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setEditName(student.name);
    setEditEnrollmentNumber(student.enrollmentNumber);
    setEditRollNumber(student.rollNumber || "");
    setEditDivision(student.division || "");
    setEditMobile(student.mobile);
    setEditEmail(student.email);
    setEditDepartment(student.department);
    setEditCourse(student.course);
    setEditSemester(student.semester);
    setEditBatch(student.batch);
    setEditStatus(student.status);
    setShowEditModal(true);
  };

  /* ================= CLOSE EDIT MODAL ================= */
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedStudent(null);
    setEditName("");
    setEditEnrollmentNumber("");
    setEditRollNumber("");
    setEditDivision("");
    setEditMobile("");
    setEditEmail("");
    setEditDepartment("");
    setEditCourse("");
    setEditSemester("");
    setEditBatch("");
    setEditStatus("active");
  };

  /* ================= UPDATE STUDENT ================= */
  const handleUpdateStudent = async () => {
    if (!editDepartment || !editCourse || !editSemester || !editBatch) {
      return toast.warning(
        "Please select Department, Course, Semester and Batch"
      );
    }

    if (!editName.trim()) return toast.warning("Student name is required");
    if (!editEnrollmentNumber.trim())
      return toast.warning("Enrollment number is required");

    if (!editMobile.match(/^[0-9]{10}$/))
      return toast.warning("Enter valid 10-digit mobile number");

    if (!editEmail.match(/^\S+@\S+\.\S+$/))
      return toast.warning("Enter valid email address");

    try {
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("enrollmentNumber", editEnrollmentNumber);
      formData.append("rollNumber", editRollNumber);
      formData.append("division", editDivision);
      formData.append("mobile", editMobile);
      formData.append("email", editEmail);
      formData.append("department", editDepartment);
      formData.append("course", editCourse);
      formData.append("semester", editSemester);
      formData.append("batch", editBatch);
      formData.append("status", editStatus);

      const fileInput = document.querySelector('#editPhoto');
      if (fileInput && fileInput.files.length > 0) {
        formData.append("photo", fileInput.files[0]);
      }

      await axios.put(
        `http://localhost:5000/api/students/${selectedStudent._id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Student updated successfully ", {
        theme: "colored",
      });

      fetchStudents();
      closeEditModal();
    } catch (err) {
      toast.error("Failed to update student ❌", { theme: "colored" });
    }
  };

  /* ================= OPEN DELETE CONFIRMATION ================= */
  const handleDeleteStudent = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  /* ================= CLOSE DELETE MODAL ================= */
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setStudentToDelete(null);
  };

  /* ================= CONFIRM DELETE STUDENT ================= */
  const confirmDeleteStudent = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/students/${studentToDelete._id}`);

      toast.success("Student deleted successfully ", {
        theme: "colored",
      });

      fetchStudents();
      closeDeleteModal();
    } catch (err) {
      toast.error("Failed to delete student ❌", { theme: "colored" });
    }
  };

  /* ================= TOGGLE STUDENT STATUS ================= */
  const toggleStudentStatus = async (student) => {
    try {
      const newStatus = student.status === "active" ? "inactive" : "active";
      
      await axios.put(`http://localhost:5000/api/students/${student._id}/status`, {
        status: newStatus
      });

      toast.success(`Student ${newStatus === "active" ? "activated" : "deactivated"} successfully`, {
        theme: "colored",
      });

      fetchStudents();
      
      if (selectedStudent && selectedStudent._id === student._id) {
        setSelectedStudent(prev => ({...prev, status: newStatus}));
      }
    } catch (error) {
      toast.error("Failed to update student status", { theme: "colored" });
    }
  };

  /* ================= RESET ALL FILTERS ================= */
  const resetFilters = () => {
    setSearchTerm("");
    setFilterDepartment("all");
    setFilterCourse("all");
    setFilterSemester("all");
    setFilterBatch("all");
    setFilterDivision("all");
    setFilterStatus("all");
  };

  return (
    <>
      <ToastContainer />

      <div style={{ padding: "28px" }}>
        {/* HEADER */}
        <div style={headerStyle}>
          <div>
            <h1 style={{ fontSize: "26px", marginBottom: "6px" }}>Students</h1>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Manage student records ({filteredStudents.length} students)
            </p>
          </div>

          <div style={headerActions}>
            <button
              style={filterBtn}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter /> Filters {showFilters ? <FiChevronDown style={{ transform: "rotate(180deg)" }} /> : <FiChevronDown />}
            </button>
            <button
              style={addBtn}
              onClick={() => {
                setShowModal(true);
                setTimeout(() => setAnimateModal(true), 10);
              }}
            >
              <FiPlus /> Add Student
            </button>
          </div>
        </div>

        {/* FILTERS SECTION */}
        {showFilters && (
          <div style={filtersCard}>
            <div style={filtersHeader}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
                <FiFilter style={{ marginRight: "8px" }} />
                Filter Students
              </h3>
              <div style={filtersHeaderActions}>
                <button 
                  style={downloadBtn}
                  onClick={downloadExcel}
                  disabled={filteredStudents.length === 0}
                  title="Download Excel file of filtered students"
                >
                  <FiDownload /> Download Excel ({filteredStudents.length})
                </button>
                <button 
                  style={resetFiltersBtn}
                  onClick={resetFilters}
                >
                  Reset Filters
                </button>
              </div>
            </div>
            
            <div style={filtersGrid}>
              {/* Search Filter */}
              <div style={filterGroup}>
                <label style={filterLabel}>Search</label>
                <div style={searchBox}>
                  <FiSearch color="#64748b" />
                  <input
                    placeholder="Search by name, email, enrollment..."
                    style={searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Department Filter */}
              <div style={filterGroup}>
                <label style={filterLabel}>Department</label>
                <select
                  style={filterSelect}
                  value={filterDepartment}
                  onChange={(e) => {
                    setFilterDepartment(e.target.value);
                    // Course will be reset in useEffect
                  }}
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Course Filter */}
              <div style={filterGroup}>
                <label style={filterLabel}>Course</label>
                <select
                  style={filterSelect}
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  disabled={filterDepartment === "all"}
                >
                  <option value="all">All Courses</option>
                  {getCoursesForDepartment(filterDepartment).map((crs) => (
                    <option key={crs._id} value={crs.name}>{crs.name}</option>
                  ))}
                </select>
              </div>

              {/* Semester Filter */}
              <div style={filterGroup}>
                <label style={filterLabel}>Semester</label>
                <select
                  style={filterSelect}
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
                >
                  <option value="all">All Semesters</option>
                  {getSemestersForFilter().map((sem, index) => (
                    <option key={index} value={sem}>
                      {typeof sem === 'object' ? sem.semesterName || sem.semesterNumber : `Semester ${sem}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Filter */}
              <div style={filterGroup}>
                <label style={filterLabel}>Batch</label>
                <select
                  style={filterSelect}
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                >
                  <option value="all">All Batches</option>
                  {getBatchesForFilter().map((batch, index) => (
                    <option key={index} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>

              {/* Division Filter */}
              <div style={filterGroup}>
                <label style={filterLabel}>Division</label>
                <select
                  style={filterSelect}
                  value={filterDivision}
                  onChange={(e) => setFilterDivision(e.target.value)}
                >
                  <option value="all">All Divisions</option>
                  {getDivisionsForFilter().map((div, index) => (
                    <option key={index} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div style={filterGroup}>
                <label style={filterLabel}>Status</label>
                <select
                  style={filterSelect}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* CARD */}
        <div style={card}>
          <div style={tableHeader}>
            <div>Enrollment ID</div>
            <div style={{marginLeft:"70px"}}>Name</div>
            <div style={{marginLeft:"50px"}}>Contact</div>
            <div style={{marginLeft:"-10px"}}>Department</div>
            <div>Semester</div>
            <div style={{marginLeft:"20px"}}>Batch</div>
            <div style={{marginLeft:"10px"}}>Status</div>
            <div>Actions</div>
          </div>

          {filteredStudents.length === 0 ? (
            <div style={noResults}>
              <div style={noResultsIcon}>📋</div>
              <h3 style={{ margin: "10px 0", color: "#475569" }}>No students found</h3>
              <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
                {students.length === 0 ? "No students added yet" : "No students match your filters"}
              </p>
              {students.length > 0 && (
                <button style={clearFiltersBtn} onClick={resetFilters}>
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            filteredStudents.map((s) => (
              <div key={s._id} style={tableRow}>
                <div style={link}>{s.enrollmentNumber}</div>

                <div style={nameCell}>
                  <div style={avatar}>
                    <img
                      src={`http://localhost:5000/uploads/students/${s.photo}`}
                      alt={s.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "50%",
                      }}
                    />
                  </div>
                  <strong>{s.name}</strong>
                </div>

                <div style={contactCell}>
                  <div style={contactRow}>
                    <FiMail size={13} /> {s.email}
                  </div>
                  <div style={contactRow}>
                    <FiPhone size={13} /> {s.mobile}
                  </div>
                </div>

                <span style={deptBadge}>{s.department}</span>
                <div style={{marginLeft:"20px"}}>
                  {typeof s.semester === 'object' 
                    ? s.semester.semesterName || s.semester.semesterNumber 
                    : ` ${s.semester}`}
                </div>
                <div>{s.batch}</div>
                
                <div onClick={() => toggleStudentStatus(s)} style={{ cursor: "pointer" }}>
                  {s.status === "active" ? (
                    <span style={activeBadge}>
                      <FiCheckCircle style={{ marginRight: "4px" }} />
                      Active
                    </span>
                  ) : (
                    <span style={inactiveBadge}>
                      <FiXCircle style={{ marginRight: "4px" }} />
                      Inactive
                    </span>
                  )}
                </div>

                <div style={actionsCell}>
                  <FiEye 
                    color="#10b981" 
                    style={{ cursor: "pointer" }} 
                    onClick={() => handleViewDetails(s)}
                    title="View Details"
                  />
                  <FiEdit 
                    color="#2563eb" 
                    style={{ cursor: "pointer" }} 
                    onClick={() => handleEditStudent(s)}
                    title="Edit Student"
                  />
                  <FiTrash2 
                    color="#ef4444" 
                    style={{ cursor: "pointer" }} 
                    onClick={() => handleDeleteStudent(s)}
                    title="Delete Student"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= ADD STUDENT MODAL ================= */}
      {showModal && (
        <div style={overlay} onClick={() => setShowModal(false)}>
          <div
            style={{
              ...modal,
              transform: animateModal ? "scale(1)" : "scale(0.95)",
              opacity: animateModal ? 1 : 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeader}>
              <h2 style={{ margin: 0 }}>Add New Student</h2>
              <FiX onClick={() => setShowModal(false)} />
            </div>

            <div style={form}>
              <div style={row}>
                <div style={field}>
                  <label style={label}>Department</label>
                  <select
                    style={input}
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      setCourse("");
                    }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div style={field}>
                  <label style={label}>Course</label>
                  <select
                    style={input}
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    disabled={!department}
                  >
                    <option value="">Select Course</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={row}>
                <div style={field}>
                  <label style={label}>Batch</label>
                  <select
                    style={input}
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    disabled={!course}
                  >
                    <option value="">Select Batch</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b.batchName}>{b.batchName}</option>
                    ))}
                  </select>
                </div>

                <div style={field}>
                  <label style={label}>Semester</label>
                  <select
                    style={input}
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    disabled={!course}
                  >
                    <option value="">Select Semester</option>
                    {semesters.map((s) => (
                      <option key={s._id} value={s.semesterNumber}>
                        {s.semesterName || `Semester ${s.semesterNumber}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={roww}>
                <div style={field}>
                  <label style={label}>Student Name</label>
                  <input
                    style={input}
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div style={field}>
                  <label style={label}>Enrollment Number</label>
                  <input
                    style={input}
                    placeholder="e.g. BCA2021001"
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                  />
                </div>
              </div>

              <div style={roww}>
                <div style={field}>
                  <label style={label}>Roll Number</label>
                  <input
                    style={input}
                    placeholder="e.g. 23"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                  />
                </div>

                <div style={field}>
                  <label style={label}>Division</label>
                  <input
                    style={input}
                    placeholder="e.g. A"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                  />
                </div>
              </div>

              <div style={roww}>
                <div style={field}>
                  <label style={label}>Mobile Number</label>
                  <input
                    style={input}
                    placeholder="10-digit mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>

                <div style={field}>
                  <label style={label}>Email</label>
                  <input
                    style={input}
                    placeholder="student@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={roww}>
                <div style={field}>
                  <label style={label}>Password</label>
                  <input
                    type="password"
                    style={input}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div style={field}>
                  <label style={label}>Photo</label>
                  <input type="file" style={input} />
                </div>
              </div>
            </div>

            <div style={modalActions}>
              <button style={cancelBtn} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button style={saveBtn} onClick={handleAddStudent}>
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT STUDENT MODAL ================= */}
      {showEditModal && selectedStudent && (
        <div style={overlay} onClick={closeEditModal}>
          <div
            style={editModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeader}>
              <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <FiEdit /> Edit Student
              </h2>
              <FiX onClick={closeEditModal} />
            </div>

            <div style={form}>
              <div style={row}>
                <div style={field}>
                  <label style={label}>Department</label>
                  <select
                    style={input}
                    value={editDepartment}
                    onChange={(e) => {
                      setEditDepartment(e.target.value);
                      setEditCourse("");
                    }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div style={field}>
                  <label style={label}>Course</label>
                  <select
                    style={input}
                    value={editCourse}
                    onChange={(e) => setEditCourse(e.target.value)}
                    disabled={!editDepartment}
                  >
                    <option value="">Select Course</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={row}>
                <div style={field}>
                  <label style={label}>Batch</label>
                  <select
                    style={input}
                    value={editBatch}
                    onChange={(e) => setEditBatch(e.target.value)}
                    disabled={!editCourse}
                  >
                    <option value="">Select Batch</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b.batchName}>{b.batchName}</option>
                    ))}
                  </select>
                </div>

                <div style={field}>
                  <label style={label}>Semester</label>
                  <select
                    style={input}
                    value={editSemester}
                    onChange={(e) => setEditSemester(e.target.value)}
                    disabled={!editCourse}
                  >
                    <option value="">Select Semester</option>
                    {semesters.map((s) => (
                      <option key={s._id} value={s.semesterNumber}>
                        {s.semesterName || `Semester ${s.semesterNumber}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={row}>
                <div style={field}>
                  <label style={label}>Status</label>
                  <select
                    style={input}
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div style={field}>
                  <label style={label}>Roll Number</label>
                  <input
                    style={input}
                    placeholder="e.g. 23"
                    value={editRollNumber}
                    onChange={(e) => setEditRollNumber(e.target.value)}
                  />
                </div>
              </div>

              <div style={roww}>
                <div style={field}>
                  <label style={label}>Student Name</label>
                  <input
                    style={input}
                    placeholder="Full Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div style={field}>
                  <label style={label}>Enrollment Number</label>
                  <input
                    style={input}
                    placeholder="e.g. BCA2021001"
                    value={editEnrollmentNumber}
                    onChange={(e) => setEditEnrollmentNumber(e.target.value)}
                  />
                </div>
              </div>

              <div style={roww}>
                <div style={field}>
                  <label style={label}>Division</label>
                  <input
                    style={input}
                    placeholder="e.g. A"
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value)}
                  />
                </div>

                <div style={field}>
                  <label style={label}>Mobile Number</label>
                  <input
                    style={input}
                    placeholder="10-digit mobile"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                  />
                </div>
              </div>

              <div style={roww}>
                <div style={field}>
                  <label style={label}>Email</label>
                  <input
                    style={input}
                    placeholder="student@email.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>

                <div style={field}>
                  <label style={label}>Photo</label>
                  <input type="file" id="editPhoto" style={input} />
                </div>
              </div>
            </div>

            <div style={modalActions}>
              <button style={cancelBtn} onClick={closeEditModal}>
                Cancel
              </button>
              <button style={saveBtn} onClick={handleUpdateStudent}>
                <FiSave style={{ marginRight: "8px" }} /> Update Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {showDeleteModal && studentToDelete && (
        <div style={overlay} onClick={closeDeleteModal}>
          <div
            style={deleteModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={deleteModalHeader}>
              <div style={deleteIcon}>
                <FiAlertCircle size={24} />
              </div>
              <h3 style={{ margin: "10px 0", fontSize: "18px" }}>Delete Student</h3>
              <p style={{ color: "#64748b", textAlign: "center", margin: "0 0 20px 0" }}>
                Are you sure you want to delete <strong>{studentToDelete.name}</strong>?<br />
                This action cannot be undone.
              </p>
            </div>

            <div style={deleteModalActions}>
              <button style={cancelBtn} onClick={closeDeleteModal}>
                Cancel
              </button>
              <button style={deleteConfirmBtn} onClick={confirmDeleteStudent}>
                <FiTrash2 style={{ marginRight: "8px" }} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STUDENT DETAILS MODAL ================= */}
      {showDetailsModal && selectedStudent && (
        <div style={overlay} onClick={closeDetailsModal}>
          <div
            style={detailsModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeader}>
              <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <FiUser /> Student Details
              </h2>
              <FiX onClick={closeDetailsModal} />
            </div>

            <div style={detailsContent}>
              <div style={detailsRow}>
                <div style={detailsAvatar}>
                  <img
                    src={`http://localhost:5000/uploads/students/${selectedStudent.photo}`}
                    alt={selectedStudent.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                </div>
                
                <div style={detailsInfo}>
                  <h3 style={{ margin: "0 0 5px 0", fontSize: "22px" }}>
                    {selectedStudent.name}
                  </h3>
                  <p style={{ color: "#64748b", margin: "0 0 15px 0" }}>
                    {selectedStudent.enrollmentNumber}
                  </p>
                  <div onClick={() => toggleStudentStatus(selectedStudent)} style={{ cursor: "pointer", display: "inline-block" }}>
                    {selectedStudent.status === "active" ? (
                      <span style={activeBadge}>
                        <FiCheckCircle style={{ marginRight: "4px" }} />
                        Active
                      </span>
                    ) : (
                      <span style={inactiveBadge}>
                        <FiXCircle style={{ marginRight: "4px" }} />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={detailsGrid}>
                <div style={detailItem}>
                  <div style={detailIcon}>
                    <FiHash />
                  </div>
                  <div>
                    <div style={detailLabel}>Roll Number</div>
                    <div style={detailValue}>{selectedStudent.rollNumber || "N/A"}</div>
                  </div>
                </div>

                <div style={detailItem}>
                  <div style={detailIcon}>
                    <FiBookOpen />
                  </div>
                  <div>
                    <div style={detailLabel}>Department</div>
                    <div style={detailValue}>{selectedStudent.department}</div>
                  </div>
                </div>

                <div style={detailItem}>
                  <div style={detailIcon}>
                    <FiBookOpen />
                  </div>
                  <div>
                    <div style={detailLabel}>Course</div>
                    <div style={detailValue}>{selectedStudent.course}</div>
                  </div>
                </div>

                <div style={detailItem}>
                  <div style={detailIcon}>
                    <FiCalendar />
                  </div>
                  <div>
                    <div style={detailLabel}>Semester</div>
                    <div style={detailValue}>
                      {typeof selectedStudent.semester === 'object' 
                        ? selectedStudent.semester.semesterName || selectedStudent.semester.semesterNumber 
                        : `Semester ${selectedStudent.semester}`}
                    </div>
                  </div>
                </div>

                <div style={detailItem}>
                  <div style={detailIcon}>
                    <FiCalendar />
                  </div>
                  <div>
                    <div style={detailLabel}>Batch</div>
                    <div style={detailValue}>{selectedStudent.batch}</div>
                  </div>
                </div>

                <div style={detailItem}>
                  <div style={detailIcon}>
                    <FiHash />
                  </div>
                  <div>
                    <div style={detailLabel}>Division</div>
                    <div style={detailValue}>{selectedStudent.division || "N/A"}</div>
                  </div>
                </div>
              </div>

              <div style={contactDetails}>
                <h4 style={{ margin: "20px 0 15px 0", color: "#475569" }}>Contact Information</h4>
                <div style={contactGrid}>
                  <div style={contactItem}>
                    <FiMail size={16} color="#64748b" />
                    <div>
                      <div style={detailLabel}>Email</div>
                      <div style={detailValue}>{selectedStudent.email}</div>
                    </div>
                  </div>
                  <div style={contactItem}>
                    <FiPhone size={16} color="#64748b" />
                    <div>
                      <div style={detailLabel}>Mobile</div>
                      <div style={detailValue}>{selectedStudent.mobile}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={modalActions}>
              <button style={cancelBtn} onClick={closeDetailsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ================= CSS STYLES =================
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "26px",
};

const headerActions = {
  display: "flex",
  gap: "12px",
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

const filterBtn = {
  background: "#f8fafc",
  color: "#475569",
  border: "1px solid #e2e8f0",
  padding: "12px 18px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  height: "40px",
  fontWeight: "500",
};

const filtersCard = {
  background: "#fff",
  borderRadius: "18px",
  padding: "22px",
  border: "1px solid #e2e8f0",
  marginBottom: "22px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const filtersHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  paddingBottom: "16px",
  borderBottom: "1px solid #e2e8f0",
};

const filtersHeaderActions = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
};

const downloadBtn = {
  background: "#10b981",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  fontSize: "14px",
  cursor: "pointer",
  fontWeight: "500",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "all 0.2s ease",
};

const resetFiltersBtn = {
  background: "transparent",
  color: "#ef4444",
  border: "1px solid #ef4444",
  padding: "10px 16px",
  borderRadius: "8px",
  fontSize: "14px",
  cursor: "pointer",
  fontWeight: "500",
};

const clearFiltersBtn = {
  background: "transparent",
  color: "#2563eb",
  border: "1px solid #2563eb",
  padding: "10px 20px",
  borderRadius: "8px",
  fontSize: "14px",
  cursor: "pointer",
  fontWeight: "500",
};

const filtersGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "20px",
};

const filterGroup = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const filterLabel = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#475569",
};

const filterSelect = {
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  background: "#fff",
  fontSize: "14px",
  cursor: "pointer",
};

const card = {
  background: "#fff",
  borderRadius: "18px",
  padding: "22px",
  border: "1px solid #e2e8f0",
};

const noResults = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "60px 20px",
  textAlign: "center",
};

const noResultsIcon = {
  fontSize: "48px",
  marginBottom: "16px",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns:
    "1.2fr 2fr 2.5fr 1fr 1fr 1.2fr 1fr 1fr",
  padding: "16px 12px",
  fontWeight: "600",
  fontSize: "13px",
  color: "#475569",
  borderBottom: "1px solid #e2e8f0",
};

const tableRow = {
  display: "grid",
  gridTemplateColumns:
    "1.2fr 2fr 2.5fr 1fr 1fr 1.2fr 1fr 1fr",
  padding: "18px 12px",
  alignItems: "center",
  borderBottom: "1px solid #f1f5f9",
};

const link = {
  color: "#2563eb",
  fontWeight: "600",
};

const nameCell = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginLeft:"20px",
};

const avatar = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "#e0e7ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "600",
  flexShrink: 0,
};

const contactCell = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "13px",
  color: "#475569",
  marginLeft:"20px"
};

const contactRow = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const deptBadge = {
  background: "#eef2ff",
  color: "#1d4ed8",
  padding: "6px 14px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "600",
  display: "inline-flex",
  marginLeft:"-30px",
  justifyContent: "center",
};

const activeBadge = {
  background: "#dcfce7",
  color: "#16a34a",
  padding: "7px 16px",
  borderRadius: "999px",
  fontSize: "12px",
  width: "fit-content",
  display: "flex",
  alignItems: "center",
  gap: "5px",
  cursor: "pointer",
  marginLeft:"-15px",
  transition: "all 0.2s ease",
};

const inactiveBadge = {
  background: "#fee2e2",
  color: "#dc2626",
  padding: "7px 16px",
  borderRadius: "999px",
  marginLeft:"-15px",
  fontSize: "12px",
  width: "fit-content",
  display: "flex",
  alignItems: "center",
  gap: "5px",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const actionsCell = {
  display: "flex",
  gap: "16px",
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
  width: "700px",
  background: "#fff",
  borderRadius: "18px",
  padding: "28px",
  boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
  transition: "all 0.25s ease",
};

const editModal = {
  width: "700px",
  background: "#fff",
  borderRadius: "18px",
  padding: "28px",
  boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
};

const deleteModal = {
  width: "400px",
  background: "#fff",
  borderRadius: "18px",
  padding: "28px",
  boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
  textAlign: "center",
};

const deleteModalHeader = {
  marginBottom: "24px",
};

const deleteIcon = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  background: "#fee2e2",
  color: "#dc2626",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 16px",
};

const deleteModalActions = {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
};

const deleteConfirmBtn = {
  padding: "12px 24px",
  borderRadius: "10px",
  border: "none",
  background: "#ef4444",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "500",
};

const detailsModal = {
  width: "480px",
  background: "#fff",
  borderRadius: "14px",
  padding: "22px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #e2e8f0",
  paddingBottom: "14px",
  marginBottom: "22px",
};

const form = {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
  maxHeight: "500px",
  overflowY: "auto",
  paddingRight: "10px",
};

const row = {
  display: "flex",
  gap: "18px",
};

const roww = {
  display: "flex",
  gap: "50px",
};

const field = {
  flex: 1,
};

const label = {
  fontSize: "13px",
  fontWeight: "600",
  marginBottom: "6px",
  display: "block",
};

const input = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
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
  background: "#fff",
  cursor: "pointer",
  fontWeight: "500",
};

const saveBtn = {
  padding: "12px 20px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "500",
};

const detailsContent = {
  maxHeight: "420px",
  overflowY: "auto",
  paddingRight: "6px",
};

const detailsRow = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  marginBottom: "22px",
};

const detailsAvatar = {
  width: "120px",
  height: "120px",
  borderRadius: "50%",
  background: "#e0e7ff",
  overflow: "hidden",
  flexShrink: 0,
};

const detailsInfo = {
  flex: 1,
};

const detailsGrid = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "14px",
  marginBottom: "18px",
};

const detailItem = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px",
  background: "#f8fafc",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
};

const detailIcon = {
  width: "34px",
  height: "34px",
  borderRadius: "8px",
  background: "#eef2ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#2563eb",
  flexShrink: 0,
};

const detailLabel = {
  fontSize: "12px",
  color: "#64748b",
  marginBottom: "4px",
  fontWeight: "600",
};

const detailValue = {
  fontSize: "14px",
  color: "#1e293b",
  fontWeight: "500",
};

const contactDetails = {
  marginTop: "20px",
};

const contactGrid = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "15px",
};

const contactItem = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px",
  background: "#f8fafc",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
};

const searchBox = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
};

const searchInput = {
  border: "none",
  outline: "none",
  width: "100%",
  background: "transparent",
  fontSize: "14px",
};

export default Students;

