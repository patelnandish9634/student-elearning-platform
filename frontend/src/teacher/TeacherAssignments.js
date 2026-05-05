import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiClipboard,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiBookOpen,
  FiLayers,
  FiSearch,
  FiX,
  FiSave,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiUpload,
  FiDownload,
  FiCalendar,
  FiAward
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TeacherAssignments = () => {
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [animateModal, setAnimateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  const [viewAssignment, setViewAssignment] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  const [cachedAssignments, setCachedAssignments] = useState([]);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    active: 0,
    expired: 0
  });

  // Form state for adding/editing assignments
  const [formData, setFormData] = useState({
    subjectId: "",
    unitId: "",
    title: "",
    description: "",
    totalMarks: "",
    deadline: "",
    assignmentFile: null
  });

  // For file upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingFile, setExistingFile] = useState(null);

  // Get teacher ID from localStorage on mount
  useEffect(() => {
    const id = localStorage.getItem("userId");
    setTeacherId(id);
  }, []);

  // Load saved selections from localStorage on component mount
  useEffect(() => {
    const savedSubject = localStorage.getItem("teacherAssignment_subjectId");
    const savedUnit = localStorage.getItem("teacherAssignment_unitId");
    
    const id = localStorage.getItem("userId");
    if (id) {
      setTeacherId(id);
      fetchTeacherSubjects(id, savedSubject, savedUnit);
      fetchAssignmentStats(id);
    } else {
      setIsLoadingSubjects(false);
    }
  }, []);

  // Save selections to localStorage whenever they change
  useEffect(() => {
    if (selectedSubject) {
      localStorage.setItem("teacherAssignment_subjectId", selectedSubject);
    } else {
      localStorage.removeItem("teacherAssignment_subjectId");
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedUnit) {
      localStorage.setItem("teacherAssignment_unitId", selectedUnit);
    } else {
      localStorage.removeItem("teacherAssignment_unitId");
    }
  }, [selectedUnit]);

  // Fetch units when subject changes - FIXED with teacher filter
  useEffect(() => {
    if (selectedSubject && teacherId) {
      fetchUnitsBySubject(selectedSubject, teacherId);
    } else {
      setUnits([]);
      setIsLoadingUnits(false);
    }
  }, [selectedSubject, teacherId]);


  useEffect(() => {
  const queryParams = new URLSearchParams(window.location.search);
  const editId = queryParams.get('editId');
  const subjectId = queryParams.get('subjectId');
  
  if (editId && subjectId && !loading && cachedAssignments.length > 0) {
    const assignmentToEdit = cachedAssignments.find(assignment => assignment._id === editId);
    if (assignmentToEdit) {
      setTimeout(() => {
        openEditModal(assignmentToEdit);
      }, 500);
    }
    window.history.replaceState({}, '', window.location.pathname + `?subjectId=${subjectId}&subjectName=${encodeURIComponent(queryParams.get('subjectName') || '')}`);
  }
}, [loading, cachedAssignments]);

  // Fetch assignments when unit changes AND units are loaded
  useEffect(() => {
    if (selectedUnit && !isLoadingUnits && teacherId) {
      fetchAssignmentsByUnit(selectedUnit, teacherId);
    } else if (!selectedUnit) {
      setAssignments([]);
    }
  }, [selectedUnit, isLoadingUnits, teacherId]);

  const fetchTeacherSubjects = async (teacherId, savedSubject, savedUnit) => {
  try {
    setIsLoadingSubjects(true);
    const res = await axios.get(
      `http://localhost:5000/api/teachers/${teacherId}/with-subjects`
    );
    
    // Handle both response formats (array directly or object with subjects property)
    let subjectsList = [];
    if (Array.isArray(res.data)) {
      subjectsList = res.data;
    } else if (res.data && Array.isArray(res.data.subjects)) {
      subjectsList = res.data.subjects;
    } else if (res.data && res.data.teacher && Array.isArray(res.data.subjects)) {
      subjectsList = res.data.subjects;
    } else {
      subjectsList = [];
    }
    
    setSubjects(subjectsList);
    
    // After subjects are loaded, set the saved selections
    if (savedSubject) {
      setSelectedSubject(savedSubject);
    }
    if (savedUnit) {
      setSelectedUnit(savedUnit);
    }
    
  } catch (error) {
    console.error("Error fetching subjects:", error);
    toast.error("Failed to load subjects");
  } finally {
    setIsLoadingSubjects(false);
  }
};
  // FIXED: Fetch only units created by this teacher
  const fetchUnitsBySubject = async (subjectId, teacherId) => {
    try {
      setIsLoadingUnits(true);
      const res = await axios.get(
        `http://localhost:5000/api/units/subject/${subjectId}?teacherId=${teacherId}`
      );
      setUnits(res.data);
    } catch (error) {
      console.error("Error fetching units:", error);
      toast.error("Failed to load units");
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const fetchAssignmentsByUnit = async (unitId, teacherId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/assignments/unit/${unitId}?teacherId=${teacherId}`,
        {
          headers: {
            'x-teacher-id': teacherId
          }
        }
      );
      setAssignments(res.data);
      setCachedAssignments(res.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentStats = async (teacherId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/assignments/stats/teacher/${teacherId}`,
        {
          headers: {
            'x-teacher-id': teacherId
          }
        }
      );
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    setSelectedUnit("");
    setFormData({
      ...formData,
      subjectId,
      unitId: "",
      title: "",
      description: "",
      totalMarks: "",
      deadline: ""
    });
    setSelectedFile(null);
  };

  const handleUnitChange = (e) => {
    const unitId = e.target.value;
    setSelectedUnit(unitId);
    setFormData({
      ...formData,
      unitId,
      title: "",
      description: "",
      totalMarks: "",
      deadline: ""
    });
    setSelectedFile(null);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleAddAssignment = async () => {
    try {
      if (!formData.subjectId || !formData.unitId || !formData.title || !formData.totalMarks || !formData.deadline) {
        toast.error("Please fill all required fields");
        return;
      }

      if (!selectedFile) {
        toast.error("Please upload an assignment file");
        return;
      }

      const teacherId = localStorage.getItem("userId");
      if (!teacherId) {
        toast.error("Teacher ID not found. Please login again.");
        return;
      }
      
      const formDataToSend = new FormData();
      formDataToSend.append("subjectId", formData.subjectId);
      formDataToSend.append("unitId", formData.unitId);
      formDataToSend.append("teacherId", teacherId);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("totalMarks", formData.totalMarks);
      formDataToSend.append("deadline", formData.deadline);
      formDataToSend.append("assignmentFile", selectedFile);

      await axios.post(
        "http://localhost:5000/api/assignments/add",
        formDataToSend,
        {
          headers: { 
            "Content-Type": "multipart/form-data",
            "x-teacher-id": teacherId
          }
        }
      );

      toast.success("🎉 Assignment added successfully and sent for approval!");
      setShowAddModal(false);
      resetForm();
      
      if (selectedUnit && teacherId) {
        await fetchAssignmentsByUnit(selectedUnit, teacherId);
      }
      
      await fetchAssignmentStats(teacherId);
      
    } catch (error) {
      console.error("Error adding assignment:", error);
      if (error.response) {
        toast.error(error.response.data?.message || "Failed to add assignment");
      } else {
        toast.error("Error: " + error.message);
      }
    }
  };

  const handleEditAssignment = async () => {
    try {
      const teacherId = localStorage.getItem("userId");
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("totalMarks", formData.totalMarks);
      formDataToSend.append("deadline", formData.deadline);
      
      if (selectedFile) {
        formDataToSend.append("assignmentFile", selectedFile);
      }

      await axios.put(
        `http://localhost:5000/api/assignments/${editAssignment._id}`,
        formDataToSend,
        {
          headers: { 
            "Content-Type": "multipart/form-data",
            "x-teacher-id": teacherId
          }
        }
      );

      toast.success("✏️ Assignment updated successfully!");
      setShowEditModal(false);
      setEditAssignment(null);
      resetForm();
      
      if (selectedUnit && teacherId) {
        await fetchAssignmentsByUnit(selectedUnit, teacherId);
      }
      
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error(error.response?.data?.message || "Failed to update assignment");
    }
  };

  const handleDeleteAssignment = async () => {
    try {
      const teacherId = localStorage.getItem("userId");
      await axios.delete(`http://localhost:5000/api/assignments/${deleteId}`, {
        headers: {
          'x-teacher-id': teacherId
        }
      });
      
      toast.success("🗑️ Assignment deleted successfully!");
      setDeleteId(null);
      
      if (selectedUnit && teacherId) {
        await fetchAssignmentsByUnit(selectedUnit, teacherId);
      }
      
      await fetchAssignmentStats(teacherId);
      
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Failed to delete assignment");
    }
  };

  const openEditModal = (assignment) => {
    setEditAssignment(assignment);
    
    const deadlineDate = new Date(assignment.deadline);
    const formattedDate = deadlineDate.toISOString().split('T')[0];
    
    setFormData({
      subjectId: assignment.subjectId?._id || assignment.subjectId,
      unitId: assignment.unitId?._id || assignment.unitId,
      title: assignment.title,
      description: assignment.description || "",
      totalMarks: assignment.totalMarks,
      deadline: formattedDate
    });
    
    setExistingFile(assignment.assignmentFile);
    setSelectedFile(null);
    setShowEditModal(true);
    setTimeout(() => setAnimateModal(true), 10);
  };

  const openViewModal = (assignment) => {
    setViewAssignment(assignment);
    setShowViewModal(true);
    setTimeout(() => setAnimateModal(true), 10);
  };

  const resetForm = () => {
    setFormData({
      subjectId: selectedSubject,
      unitId: selectedUnit,
      title: "",
      description: "",
      totalMarks: "",
      deadline: ""
    });
    setSelectedFile(null);
    setExistingFile(null);
  };

  const handleDownloadFile = async (filename) => {
    try {
      const response = await axios({
        url: `http://localhost:5000/api/assignments/download/${filename}`,
        method: 'GET',
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isDeadlinePassed = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return { icon: <FiClock size={14} />, label: 'Pending', color: '#D97706', bgColor: '#FEF3C7' };
      case 'approved':
        return { icon: <FiCheckCircle size={14} />, label: 'Approved', color: '#059669', bgColor: '#DCFCE7' };
      case 'rejected':
        return { icon: <FiXCircle size={14} />, label: 'Rejected', color: '#DC2626', bgColor: '#FEE2E2' };
      default:
        return { icon: <FiAlertCircle size={14} />, label: 'Pending', color: '#D97706', bgColor: '#FEF3C7' };
    }
  };

  // Add keyframes animation
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes fadeInScale {
        0% { opacity: 0; transform: scale(0.9); }
        100% { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const styles = {
    container: {
      padding: "28px",
      fontFamily: "'Inter', sans-serif",
      background: "#F8FAFC",
      minHeight: "100vh"
    },
    header: {
      marginBottom: "28px"
    },
    headerTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px"
    },
    headerTitle: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#0B2A4A",
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    headerSubtitle: {
      fontSize: "15px",
      color: "#64748B",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "20px",
      marginBottom: "24px"
    },
    statCard: {
      background: "white",
      borderRadius: "16px",
      padding: "16px",
      border: "1px solid #E5E9F0",
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    statIcon: (color, bgColor) => ({
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      background: bgColor,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: color
    }),
    statInfo: {
      flex: 1
    },
    statLabel: {
      fontSize: "12px",
      color: "#64748B",
      marginBottom: "2px"
    },
    statValue: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#0B2A4A"
    },
    filtersSection: {
      background: "white",
      borderRadius: "16px",
      padding: "16px",
      marginBottom: "24px",
      border: "1px solid #E5E9F0",
      display: "flex",
      gap: "12px",
      alignItems: "center",
      flexWrap: "wrap"
    },
    searchBox: {
      flex: 2,
      minWidth: "250px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 12px",
      background: "#F8FAFC",
      borderRadius: "10px",
      border: "1px solid #E5E9F0"
    },
    searchInput: {
      border: "none",
      background: "transparent",
      outline: "none",
      width: "100%",
      fontSize: "14px",
      color: "#1E293B"
    },
    addButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 20px",
      background: "linear-gradient(135deg, #0B2A4A 0%, #1A3F5C 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      marginLeft: "auto",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(11, 42, 74, 0.2)"
    },
    assignmentsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
      gap: "20px"
    },
    assignmentCard: {
      background: "white",
      borderRadius: "16px",
      padding: "20px",
      border: "1px solid #E5E9F0",
      transition: "all 0.3s ease"
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "12px"
    },
    cardTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#1E293B",
      marginBottom: "8px"
    },
    cardDescription: {
      fontSize: "13px",
      color: "#64748B",
      marginBottom: "12px",
      lineHeight: "1.5"
    },
    cardMeta: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      fontSize: "12px",
      color: "#94A3B8",
      marginBottom: "12px"
    },
    metaItem: {
      display: "flex",
      alignItems: "center",
      gap: "6px"
    },
    deadlinePassed: {
      color: "#DC2626",
      fontWeight: "500"
    },
    deadlineActive: {
      color: "#059669",
      fontWeight: "500"
    },
    cardFooter: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: "12px",
      borderTop: "1px solid #E5E9F0",
      marginTop: "12px"
    },
    actionButtons: {
      display: "flex",
      gap: "8px"
    },
    iconButton: (color, bgColor) => ({
      padding: "8px",
      borderRadius: "8px",
      cursor: "pointer",
      color: color,
      background: bgColor,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
      border: "none"
    }),
    statusBadge: (status) => {
      const badge = getStatusBadge(status);
      return {
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "500",
        background: badge.bgColor,
        color: badge.color
      };
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(5px)"
    },
    modal: {
      background: "white",
      borderRadius: "20px",
      padding: "28px",
      width: "600px",
      maxWidth: "90vw",
      maxHeight: "90vh",
      overflowY: "auto",
      transform: animateModal ? "scale(1)" : "scale(0.95)",
      opacity: animateModal ? 1 : 0,
      transition: "all 0.3s ease",
      boxShadow: "0 25px 50px rgba(0,0,0,0.2)"
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px"
    },
    modalTitle: {
      fontSize: "22px",
      fontWeight: "600",
      color: "#0B2A4A"
    },
    closeIcon: {
      width: "32px",
      height: "32px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "#64748B",
      transition: "all 0.2s ease"
    },
    formGroup: {
      marginBottom: "20px"
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "#475569",
      marginBottom: "8px"
    },
    select: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid #E5E9F0",
      fontSize: "14px",
      background: "#F8FAFC",
      cursor: "pointer",
      outline: "none",
      transition: "all 0.2s ease"
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid #E5E9F0",
      fontSize: "14px",
      outline: "none",
      transition: "all 0.2s ease",
      background: "#F8FAFC"
    },
    textarea: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid #E5E9F0",
      fontSize: "14px",
      minHeight: "80px",
      resize: "vertical",
      background: "#F8FAFC"
    },
    fileInput: {
      width: "100%",
      padding: "10px",
      borderRadius: "12px",
      border: "1px dashed #E5E9F0",
      background: "#F8FAFC",
      cursor: "pointer"
    },
    fileInfo: {
      marginTop: "8px",
      padding: "8px",
      background: "#F1F5F9",
      borderRadius: "6px",
      fontSize: "12px",
      color: "#475569",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    modalActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      marginTop: "24px"
    },
    cancelBtn: {
      padding: "12px 24px",
      borderRadius: "12px",
      border: "1px solid #E5E9F0",
      background: "white",
      color: "#64748B",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease"
    },
    saveBtn: {
      padding: "12px 24px",
      borderRadius: "12px",
      border: "none",
      background: "linear-gradient(135deg, #0B2A4A 0%, #1A3F5C 100%)",
      color: "white",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(11, 42, 74, 0.2)",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    viewModal: {
      background: "white",
      borderRadius: "20px",
      padding: "28px",
      width: "600px",
      maxWidth: "90vw",
      maxHeight: "90vh",
      overflowY: "auto"
    },
    viewHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "20px",
      paddingBottom: "16px",
      borderBottom: "1px solid #E5E9F0"
    },
    viewTitle: {
      flex: 1
    },
    viewName: {
      fontSize: "22px",
      fontWeight: "600",
      color: "#0B2A4A",
      marginBottom: "8px"
    },
    viewMeta: {
      fontSize: "14px",
      color: "#64748B",
      marginBottom: "4px"
    },
    viewSection: {
      marginBottom: "20px"
    },
    viewLabel: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#475569",
      marginBottom: "8px"
    },
    viewText: {
      fontSize: "15px",
      color: "#1E293B",
      lineHeight: "1.6"
    },
    viewFileItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px",
      background: "#F8FAFC",
      borderRadius: "8px"
    },
    downloadBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 12px",
      background: "#0B2A4A",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      transition: "all 0.2s ease"
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "400px"
    },
    loadingSpinner: {
      width: "50px",
      height: "50px",
      border: "3px solid #F1F5F9",
      borderTop: "3px solid #0B2A4A",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    },
    emptyState: {
      textAlign: "center",
      padding: "60px 20px",
      background: "white",
      borderRadius: "16px",
      border: "1px solid #E5E9F0"
    }
  };

  if (loading && selectedUnit) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <ToastContainer position="top-right" theme="colored" />

      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.headerTitle}>
            <FiClipboard size={28} />
            Assignments
          </h1>
        </div>
        <p style={styles.headerSubtitle}>
          Create and manage assignments for your subjects
        </p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon("#0B2A4A", "#E8F0FE")}>
            <FiClipboard size={20} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Total Assignments</div>
            <div style={styles.statValue}>{stats.totalAssignments}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon("#059669", "#DCFCE7")}>
            <FiCheckCircle size={20} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Approved</div>
            <div style={styles.statValue}>{stats.approved}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon("#D97706", "#FEF3C7")}>
            <FiClock size={20} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Pending</div>
            <div style={styles.statValue}>{stats.pending}</div>
          </div>
        </div>
      </div>

      <div style={styles.filtersSection}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <select
            style={styles.select}
            value={selectedSubject}
            onChange={handleSubjectChange}
          >
            <option value="">Select Subject</option>
            {subjects.map(subject => (
              <option key={subject._id} value={subject._id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: "200px" }}>
          <select
            style={styles.select}
            value={selectedUnit}
            onChange={handleUnitChange}
            disabled={!selectedSubject}
          >
            <option value="">Select Unit</option>
            {units.map(unit => (
              <option key={unit._id} value={unit._id}>
                Unit {unit.unitNumber}: {unit.unitTitle}
              </option>
            ))}
          </select>
        </div>

        {selectedUnit && (
          <div style={styles.searchBox}>
            <FiSearch color="#94A3B8" size={18} />
            <input
              style={styles.searchInput}
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        <button
          style={styles.addButton}
          onClick={() => {
            setFormData({
              subjectId: selectedSubject,
              unitId: selectedUnit,
              title: "",
              description: "",
              totalMarks: "",
              deadline: ""
            });
            setSelectedFile(null);
            setShowAddModal(true);
            setTimeout(() => setAnimateModal(true), 10);
          }}
          disabled={!selectedSubject || !selectedUnit}
        >
          <FiPlus size={18} />
          Add Assignment
        </button>
      </div>

      {!selectedSubject || !selectedUnit ? (
        <div style={styles.emptyState}>
          <FiBookOpen size={48} color="#94A3B8" style={{ marginBottom: "16px" }} />
          <h3 style={{ color: "#0B2A4A", marginBottom: "8px" }}>Select Subject and Unit</h3>
          <p style={{ color: "#64748B" }}>
            Please select a subject and unit to view and manage assignments
          </p>
        </div>
      ) : loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div style={styles.emptyState}>
          <FiClipboard size={48} color="#94A3B8" style={{ marginBottom: "16px" }} />
          <h3 style={{ color: "#0B2A4A", marginBottom: "8px" }}>No Assignments Found</h3>
          <p style={{ color: "#64748B" }}>
            {searchTerm
              ? "No assignments match your search"
              : "Click the 'Add Assignment' button to create your first assignment"}
          </p>
        </div>
      ) : (
        <div style={styles.assignmentsGrid}>
          {filteredAssignments.map(assignment => {
            const statusBadge = getStatusBadge(assignment.status);
            const deadlinePassed = isDeadlinePassed(assignment.deadline);
            
            return (
              <div
                key={assignment._id}
                style={styles.assignmentCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.02)";
                }}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.statusBadge(assignment.status)}>
                    {statusBadge.icon}
                    {statusBadge.label}
                  </span>
                </div>

                <h4 style={styles.cardTitle}>{assignment.title}</h4>
                
                {assignment.description && (
                  <p style={styles.cardDescription}>
                    {assignment.description.substring(0, 100)}
                    {assignment.description.length > 100 ? '...' : ''}
                  </p>
                )}

                <div style={styles.cardMeta}>
                  <div style={styles.metaItem}>
                    <FiAward size={14} /> Total Marks: {assignment.totalMarks}
                  </div>
                  <div style={styles.metaItem}>
                    <FiCalendar size={14} /> 
                    <span className={deadlinePassed ? styles.deadlinePassed : styles.deadlineActive}>
                      Deadline: {formatDate(assignment.deadline)}
                      {deadlinePassed && " (Passed)"}
                    </span>
                  </div>
                  {assignment.assignmentFile && (
                    <div style={styles.metaItem}>
                      <FiUpload size={14} /> File: {assignment.assignmentFile.originalName}
                    </div>
                  )}
                </div>

                <div style={styles.cardFooter}>
                  <div style={styles.actionButtons}>
                    <button
                      style={styles.iconButton("#64748B", "#F1F5F9")}
                      onClick={() => openViewModal(assignment)}
                      title="View"
                    >
                      <FiEye size={16} />
                    </button>
                    <button
                      style={styles.iconButton("#2563EB", "#EFF6FF")}
                      onClick={() => openEditModal(assignment)}
                      title="Edit"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      style={styles.iconButton("#DC2626", "#FEE2E2")}
                      onClick={() => setDeleteId(assignment._id)}
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                  {assignment.assignmentFile && (
                    <button
                      style={styles.iconButton("#0B2A4A", "#E8F0FE")}
                      onClick={() => handleDownloadFile(assignment.assignmentFile.filename)}
                      title="Download"
                    >
                      <FiDownload size={16} />
                    </button>
                  )}
                </div>

                {assignment.adminFeedback && assignment.status === "rejected" && (
                  <div style={{
                    marginTop: "12px",
                    padding: "8px",
                    background: "#FEF3C7",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#92400E"
                  }}>
                    <strong>Feedback:</strong> {assignment.adminFeedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Assignment Modal - Keep your existing modal JSX */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => {
          setAnimateModal(false);
          setTimeout(() => {
            setShowAddModal(false);
            resetForm();
          }, 200);
        }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Assignment</h3>
              <div
                style={styles.closeIcon}
                onClick={() => {
                  setAnimateModal(false);
                  setTimeout(() => {
                    setShowAddModal(false);
                    resetForm();
                  }, 200);
                }}
              >
                <FiX size={20} />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Subject</label>
              <select
                style={styles.select}
                value={formData.subjectId}
                onChange={handleSubjectChange}
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code}) - Sem {subject.semester}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Unit</label>
              <select
                style={styles.select}
                value={formData.unitId}
                onChange={handleUnitChange}
                disabled={!formData.subjectId}
              >
                <option value="">Select Unit</option>
                {units.map(unit => (
                  <option key={unit._id} value={unit._id}>
                    Unit {unit.unitNumber}: {unit.unitTitle}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Title *</label>
              <input
                type="text"
                name="title"
                style={styles.input}
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter assignment title"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                style={styles.textarea}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter assignment description"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Total Marks *</label>
              <input
                type="number"
                name="totalMarks"
                style={styles.input}
                value={formData.totalMarks}
                onChange={handleInputChange}
                placeholder="e.g., 100"
                min="1"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Deadline *</label>
              <input
                type="datetime-local"
                name="deadline"
                style={styles.input}
                value={formData.deadline}
                onChange={handleInputChange}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Assignment File *</label>
              <input
                type="file"
                style={styles.fileInput}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.zip,.rar,.txt"
              />
              {selectedFile && (
                <div style={styles.fileInfo}>
                  <span>{selectedFile.name}</span>
                  <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => {
                  setAnimateModal(false);
                  setTimeout(() => {
                    setShowAddModal(false);
                    resetForm();
                  }, 200);
                }}
              >
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={handleAddAssignment}>
                <FiSave size={16} />
                Add Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && editAssignment && (
        <div style={styles.modalOverlay} onClick={() => {
          setAnimateModal(false);
          setTimeout(() => {
            setShowEditModal(false);
            setEditAssignment(null);
            resetForm();
          }, 200);
        }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Assignment</h3>
              <div
                style={styles.closeIcon}
                onClick={() => {
                  setAnimateModal(false);
                  setTimeout(() => {
                    setShowEditModal(false);
                    setEditAssignment(null);
                    resetForm();
                  }, 200);
                }}
              >
                <FiX size={20} />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Title *</label>
              <input
                type="text"
                name="title"
                style={styles.input}
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter assignment title"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                style={styles.textarea}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter assignment description"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Total Marks *</label>
              <input
                type="number"
                name="totalMarks"
                style={styles.input}
                value={formData.totalMarks}
                onChange={handleInputChange}
                placeholder="e.g., 100"
                min="1"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Deadline *</label>
              <input
                type="datetime-local"
                name="deadline"
                style={styles.input}
                value={formData.deadline}
                onChange={handleInputChange}
              />
            </div>

            {existingFile && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Current File</label>
                <div style={styles.fileInfo}>
                  <span>{existingFile.originalName}</span>
                  <button
                    style={styles.iconButton("#0B2A4A", "#E8F0FE")}
                    onClick={() => handleDownloadFile(existingFile.filename)}
                    title="Download"
                  >
                    <FiDownload size={14} />
                  </button>
                </div>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Upload New File (Optional)</label>
              <input
                type="file"
                style={styles.fileInput}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.zip,.rar,.txt"
              />
              {selectedFile && (
                <div style={styles.fileInfo}>
                  <span>{selectedFile.name}</span>
                  <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => {
                  setAnimateModal(false);
                  setTimeout(() => {
                    setShowEditModal(false);
                    setEditAssignment(null);
                    resetForm();
                  }, 200);
                }}
              >
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={handleEditAssignment}>
                <FiRefreshCw size={16} />
                Update Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Assignment Modal */}
      {showViewModal && viewAssignment && (
        <div style={styles.modalOverlay} onClick={() => {
          setAnimateModal(false);
          setTimeout(() => setShowViewModal(false), 200);
        }}>
          <div style={styles.viewModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.viewHeader}>
              <div style={styles.viewTitle}>
                <h2 style={styles.viewName}>{viewAssignment.title}</h2>
                <p style={styles.viewMeta}>
                  Added on {new Date(viewAssignment.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div
                style={styles.closeIcon}
                onClick={() => {
                  setAnimateModal(false);
                  setTimeout(() => setShowViewModal(false), 200);
                }}
              >
                <FiX size={20} />
              </div>
            </div>

            {viewAssignment.description && (
              <div style={styles.viewSection}>
                <div style={styles.viewLabel}>Description</div>
                <p style={styles.viewText}>{viewAssignment.description}</p>
              </div>
            )}

            <div style={styles.viewSection}>
              <div style={styles.viewLabel}>Details</div>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div>
                  <strong>Total Marks:</strong> {viewAssignment.totalMarks}
                </div>
                <div>
                  <strong>Deadline:</strong> {formatDate(viewAssignment.deadline)}
                </div>
                <div>
                  <strong>Status:</strong> {viewAssignment.status}
                </div>
              </div>
            </div>

            {viewAssignment.assignmentFile && (
              <div style={styles.viewSection}>
                <div style={styles.viewLabel}>Assignment File</div>
                <div style={styles.viewFileItem}>
                  <span style={{ fontSize: "13px" }}>{viewAssignment.assignmentFile.originalName}</span>
                  <button
                    style={styles.downloadBtn}
                    onClick={() => handleDownloadFile(viewAssignment.assignmentFile.filename)}
                  >
                    <FiDownload size={14} />
                    Download
                  </button>
                </div>
              </div>
            )}

            {viewAssignment.adminFeedback && viewAssignment.status === "rejected" && (
              <div style={{
                marginTop: "20px",
                padding: "16px",
                background: "#FEF3C7",
                borderRadius: "12px",
                borderLeft: "4px solid #D97706"
              }}>
                <div style={{ fontWeight: "600", marginBottom: "4px", color: "#92400E" }}>
                  Admin Feedback
                </div>
                <p style={{ color: "#92400E", margin: 0 }}>{viewAssignment.adminFeedback}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          backdropFilter: "blur(5px)"
        }} onClick={() => setDeleteId(null)}>
          <div style={{
            background: "white",
            borderRadius: "24px",
            padding: "32px",
            width: "400px",
            maxWidth: "90%",
            boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
            animation: "fadeInScale 0.3s ease-out",
            position: "relative"
          }} onClick={(e) => e.stopPropagation()}>
            
            <button
              onClick={() => setDeleteId(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748B",
                fontSize: "20px",
                padding: "4px"
              }}
            >
              <FiX size={20} />
            </button>
            
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto"
            }}>
              <FiAlertCircle size={48} color="#DC2626" />
            </div>
            
            <h3 style={{
              color: "#DC2626",
              fontSize: "24px",
              fontWeight: "600",
              margin: "0 0 12px 0",
              textAlign: "center"
            }}>
              Delete Assignment
            </h3>
            
            <p style={{
              margin: "0 0 28px 0",
              color: "#475569",
              fontSize: "15px",
              lineHeight: "1.6",
              textAlign: "center"
            }}>
              Are you sure you want to delete this assignment?<br />
              <span style={{ fontWeight: "600", color: "#DC2626" }}>This action cannot be undone.</span>
            </p>
            
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center"
            }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  padding: "12px 28px",
                  borderRadius: "12px",
                  border: "2px solid #E5E9F0",
                  background: "white",
                  color: "#64748B",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  flex: 1,
                  maxWidth: "140px"
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleDeleteAssignment}
                style={{
                  padding: "12px 28px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 8px 20px rgba(220, 38, 38, 0.3)",
                  flex: 1,
                  maxWidth: "140px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <FiTrash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;