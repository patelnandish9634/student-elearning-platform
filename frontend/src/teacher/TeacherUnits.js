import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiLayers,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiX,
  FiEye,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiToggleLeft,
  FiToggleRight,
  FiSave,
  FiRefreshCw
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TeacherUnits = () => {
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [animateModal, setAnimateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUnit, setEditUnit] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [cachedUnits, setCachedUnits] = useState([]);
  const [stats, setStats] = useState({
    totalUnits: 0,
    activeUnits: 0,
    inactiveUnits: 0,
    pendingUnits: 0,
    approvedUnits: 0,
    rejectedUnits: 0
  });

  // Form state for adding/editing units
  const [formData, setFormData] = useState({
    subjectId: "",
    unitNumber: "",
    unitTitle: "",
    description: ""
  });

  // Handle URL parameters on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const subjectId = queryParams.get('subjectId');
    const subjectName = queryParams.get('subjectName');
    const view = queryParams.get('view');
    
    if (subjectId) {
      setSelectedSubject(subjectId);
      setFormData(prev => ({ ...prev, subjectId }));
      
      if (view === 'all') {
        toast.info(`Showing units for: ${decodeURIComponent(subjectName || 'selected subject')}`, {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.info(`Creating new unit for: ${decodeURIComponent(subjectName || 'selected subject')}`, {
          position: "top-right",
          autoClose: 3000,
        });
        
        setTimeout(() => {
          setShowAddModal(true);
          setTimeout(() => setAnimateModal(true), 10);
        }, 1000);
      }
    }
  }, []);

  useEffect(() => {
  const queryParams = new URLSearchParams(window.location.search);
  const editId = queryParams.get('editId');
  const subjectId = queryParams.get('subjectId');
  
  if (editId && subjectId && !loading && cachedUnits.length > 0) {
    const unitToEdit = cachedUnits.find(unit => unit._id === editId);
    if (unitToEdit) {
      // Small delay to ensure component is fully loaded
      setTimeout(() => {
        openEditModal(unitToEdit);
      }, 500);
    }
    // Remove editId from URL without refreshing
    window.history.replaceState({}, '', window.location.pathname + `?subjectId=${subjectId}&subjectName=${encodeURIComponent(queryParams.get('subjectName') || '')}`);
  }
}, [loading, cachedUnits]);

  useEffect(() => {
    const teacherId = localStorage.getItem("userId");
    if (teacherId) {
      fetchTeacherSubjects(teacherId);
      fetchAllUnits(teacherId);
    }
  }, []);

  // FIXED: fetchTeacherSubjects to handle direct array response
  const fetchTeacherSubjects = async (teacherId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/teachers/${teacherId}/with-subjects`
      );
      
      // Handle both response formats (array directly or object with subjects property)
      let subjectsList = [];
      if (Array.isArray(res.data)) {
        subjectsList = res.data;
      } else if (res.data && Array.isArray(res.data.subjects)) {
        subjectsList = res.data.subjects;
      } else {
        subjectsList = [];
      }
      
      setSubjects(subjectsList);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
    }
  };

  const fetchAllUnits = async (teacherId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/units/teacher/${teacherId}`,
        {
          headers: {
            'x-teacher-id': teacherId
          }
        }
      );
      setUnits(res.data);
      setCachedUnits(res.data);
      
      setStats({
        totalUnits: res.data.length,
        activeUnits: res.data.filter(u => u.isActive === true).length,
        inactiveUnits: res.data.filter(u => u.isActive === false).length,
        pendingUnits: res.data.filter(u => u.status === "pending").length,
        approvedUnits: res.data.filter(u => u.status === "approved").length,
        rejectedUnits: res.data.filter(u => u.status === "rejected").length
      });
      
    } catch (error) {
      console.error("Error fetching units:", error);
      toast.error("Failed to load units");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddUnit = async () => {
    try {
      if (!formData.subjectId || !formData.unitNumber || !formData.unitTitle) {
        toast.error("Please fill all required fields");
        return;
      }

      const teacherId = localStorage.getItem("userId");
      
      const unitData = {
        subjectId: formData.subjectId,
        teacherId: teacherId,
        unitNumber: parseInt(formData.unitNumber),
        unitTitle: formData.unitTitle,
        description: formData.description || "",
        status: "pending",
        isActive: true,
        createdBy: teacherId
      };

      await axios.post(
        "http://localhost:5000/api/units/add",
        unitData
      );

      toast.success("🎉 Unit created successfully and sent for approval!");
      setShowAddModal(false);
      resetForm();
      fetchAllUnits(teacherId);
      
    } catch (error) {
      console.error("Error adding unit:", error);
      toast.error(error.response?.data?.message || "Failed to add unit");
    }
  };

  const handleEditUnit = async () => {
    try {
      const teacherId = localStorage.getItem("userId");
      
      const unitData = {
        unitNumber: parseInt(formData.unitNumber),
        unitTitle: formData.unitTitle,
        description: formData.description || ""
      };

      await axios.put(
        `http://localhost:5000/api/units/${editUnit._id}`,
        unitData,
        {
          headers: {
            'x-teacher-id': teacherId
          }
        }
      );

      toast.success("✏️ Unit updated successfully!");
      setShowEditModal(false);
      setEditUnit(null);
      resetForm();
      fetchAllUnits(teacherId);
      
    } catch (error) {
      console.error("Error updating unit:", error);
      toast.error(error.response?.data?.message || "Failed to update unit");
    }
  };

  const handleDeleteUnit = async () => {
  try {
    const teacherId = localStorage.getItem("userId");
    
    // First, check if unit has any content
    const checkResponse = await axios.get(
      `http://localhost:5000/api/units/${deleteId}/check-related`,
      {
        headers: {
          'x-teacher-id': teacherId
        }
      }
    );
    
    const hasRelatedContent = checkResponse.data.hasContent;
    const relatedCounts = checkResponse.data.counts;
    
    let confirmMessage = "Are you sure you want to delete this unit?";
    
    if (hasRelatedContent) {
      confirmMessage = `⚠️ WARNING: This unit contains:
• ${relatedCounts.content} content item(s)
• ${relatedCounts.assignments} assignment(s)
• ${relatedCounts.quizzes} quiz(es)

Deleting this unit will permanently delete ALL of the above items.

This action CANNOT be undone.

Are you sure you want to proceed?`;
    }
    
    if (window.confirm(confirmMessage)) {
      const response = await axios.delete(
        `http://localhost:5000/api/units/${deleteId}`,
        {
          headers: {
            'x-teacher-id': teacherId
          }
        }
      );
      
      toast.success(`✅ Unit deleted successfully!`);
      if (response.data.deletedCount) {
        toast.info(`Deleted: ${response.data.deletedCount.content} content, ${response.data.deletedCount.assignments} assignments, ${response.data.deletedCount.quizzes} quizzes`);
      }
      setDeleteId(null);
      fetchAllUnits(teacherId);
    }
    
  } catch (error) {
    console.error("Error deleting unit:", error);
    if (error.response?.status === 400) {
      toast.error(error.response.data?.message || "Cannot delete unit with pending verification");
    } else {
      toast.error(error.response?.data?.message || "Failed to delete unit");
    }
  }
};

  const toggleUnitStatus = async (unitId, currentStatus) => {
    try {
      const teacherId = localStorage.getItem("userId");
      
      const res = await axios.put(
        `http://localhost:5000/api/units/${unitId}/toggle-status`,
        {},
        {
          headers: {
            'x-teacher-id': teacherId
          }
        }
      );

      const newStatus = res.data.isActive;
      
      if (newStatus) {
        toast.success("🟢 Unit activated successfully!");
      } else {
        toast.info("🔴 Unit deactivated");
      }

      fetchAllUnits(teacherId);
      
    } catch (error) {
      console.error("Error toggling unit status:", error);
      toast.error(error.response?.data?.message || "Failed to update unit status");
    }
  };

  const openEditModal = (unit) => {
    setEditUnit(unit);
    setFormData({
      subjectId: unit.subjectId?._id || unit.subjectId,
      unitNumber: unit.unitNumber,
      unitTitle: unit.unitTitle,
      description: unit.description || ""
    });
    setShowEditModal(true);
    setTimeout(() => setAnimateModal(true), 10);
  };

  const resetForm = () => {
    setFormData({
      subjectId: "",
      unitNumber: "",
      unitTitle: "",
      description: ""
    });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return {
          icon: <FiClock size={14} />,
          label: 'Pending Approval',
          color: '#D97706',
          bgColor: '#FEF3C7'
        };
      case 'approved':
        return {
          icon: <FiCheckCircle size={14} />,
          label: 'Approved',
          color: '#059669',
          bgColor: '#DCFCE7'
        };
      case 'rejected':
        return {
          icon: <FiXCircle size={14} />,
          label: 'Rejected',
          color: '#DC2626',
          bgColor: '#FEE2E2'
        };
      default:
        return {
          icon: <FiAlertCircle size={14} />,
          label: 'Pending',
          color: '#D97706',
          bgColor: '#FEF3C7'
        };
    }
  };

  // Filter units based on selected subject and search
  const filteredUnits = units.filter(unit => {
    const matchesSubject = selectedSubject === "" || unit.subjectId?._id === selectedSubject;
    const matchesSearch = unit.unitTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  // Group units by subject
  const unitsBySubject = {};
  filteredUnits.forEach(unit => {
    const subjectId = unit.subjectId?._id || 'unknown';
    if (!unitsBySubject[subjectId]) {
      unitsBySubject[subjectId] = {
        subject: unit.subjectId,
        units: []
      };
    }
    unitsBySubject[subjectId].units.push(unit);
  });

  const styles = {
    container: {
      padding: "28px",
      fontFamily: "'Inter', sans-serif",
      background: "#F8FAFC",
      minHeight: "100vh"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "28px"
    },
    headerLeft: {
      flex: 1
    },
    headerTitle: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#0B2A4A",
      marginBottom: "8px",
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
      marginBottom: "28px"
    },
    statCard: {
      background: "white",
      borderRadius: "16px",
      padding: "20px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
      border: "1px solid #E5E9F0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      transition: "all 0.3s ease",
      cursor: "pointer",
      ":hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.1)"
      }
    },
    statInfo: {
      flex: 1
    },
    statLabel: {
      fontSize: "13px",
      color: "#64748B",
      marginBottom: "6px"
    },
    statValue: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#0B2A4A"
    },
    statIcon: (color, bgColor) => ({
      width: "48px",
      height: "48px",
      borderRadius: "12px",
      background: bgColor,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: color,
      fontSize: "24px"
    }),
    filtersSection: {
      background: "white",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "24px",
      border: "1px solid #E5E9F0",
      display: "flex",
      gap: "16px",
      alignItems: "center",
      flexWrap: "wrap"
    },
    searchBox: {
      flex: 2,
      minWidth: "300px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 16px",
      background: "#F8FAFC",
      borderRadius: "12px",
      border: "1px solid #E5E9F0"
    },
    searchInput: {
      border: "none",
      background: "transparent",
      outline: "none",
      width: "100%",
      fontSize: "14px",
      color: "#1E293B",
      "::placeholder": {
        color: "#94A3B8"
      }
    },
    subjectSelect: {
      flex: 1,
      minWidth: "200px",
      padding: "10px 16px",
      background: "#F8FAFC",
      borderRadius: "12px",
      border: "1px solid #E5E9F0",
      fontSize: "14px",
      color: "#1E293B",
      cursor: "pointer"
    },
    viewToggle: {
      display: "flex",
      gap: "8px",
      padding: "4px",
      background: "#F1F5F9",
      borderRadius: "10px"
    },
    viewButton: (active) => ({
      padding: "8px 12px",
      borderRadius: "8px",
      border: "none",
      background: active ? "white" : "transparent",
      color: active ? "#0B2A4A" : "#64748B",
      cursor: "pointer",
      boxShadow: active ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
      transition: "all 0.2s ease"
    }),
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
    subjectSection: {
      marginBottom: "32px"
    },
    subjectHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px",
      padding: "16px",
      background: "white",
      borderRadius: "12px",
      border: "1px solid #E5E9F0",
      boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
    },
    subjectIcon: {
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      background: "linear-gradient(135deg, #0B2A4A 0%, #1A3F5C 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: "20px"
    },
    subjectInfo: {
      flex: 1
    },
    subjectName: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#0B2A4A",
      marginBottom: "4px"
    },
    subjectMeta: {
      fontSize: "13px",
      color: "#64748B",
      display: "flex",
      gap: "16px"
    },
    unitsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
      gap: "20px",
      marginLeft: "20px"
    },
    unitsList: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      marginLeft: "20px"
    },
    unitCard: {
      background: "white",
      borderRadius: "16px",
      padding: "20px",
      border: "1px solid #E5E9F0",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)"
    },
    unitListItem: {
      background: "white",
      borderRadius: "12px",
      padding: "16px",
      border: "1px solid #E5E9F0",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      transition: "all 0.3s ease"
    },
    unitHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "12px"
    },
    unitNumber: {
      background: "#0B2A4A",
      color: "white",
      padding: "6px 14px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      boxShadow: "0 2px 8px rgba(11, 42, 74, 0.2)"
    },
    unitTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#1E293B",
      marginBottom: "8px"
    },
    unitDescription: {
      fontSize: "13px",
      color: "#64748B",
      marginBottom: "12px",
      lineHeight: "1.5"
    },
    badgesContainer: {
      display: "flex",
      gap: "8px",
      marginBottom: "12px",
      flexWrap: "wrap"
    },
    badge: (color, bgColor) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 12px",
      borderRadius: "50px",
      fontSize: "12px",
      fontWeight: "500",
      background: bgColor,
      color: color,
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    }),
    adminFeedback: {
      marginTop: "12px",
      padding: "12px",
      background: "#FEF3C7",
      borderRadius: "8px",
      fontSize: "13px",
      color: "#92400E",
      borderLeft: "4px solid #D97706",
      boxShadow: "0 2px 8px rgba(217, 119, 6, 0.1)"
    },
    metaInfo: {
      display: "flex",
      gap: "16px",
      fontSize: "12px",
      color: "#94A3B8",
      marginBottom: "12px"
    },
    cardFooter: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "16px",
      paddingTop: "16px",
      borderTop: "1px solid #E5E9F0"
    },
    actionButtons: {
      display: "flex",
      gap: "10px",
      alignItems: "center",
      flexWrap: "wrap"
    },
    toggleButton: (isActive) => ({
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 12px",
      borderRadius: "8px",
      border: "none",
      background: isActive ? "linear-gradient(135deg, #059669 0%, #10B981 100%)" : "linear-gradient(135deg, #64748B 0%, #94A3B8 100%)",
      color: "white",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: isActive ? "0 4px 12px rgba(5, 150, 105, 0.3)" : "0 4px 12px rgba(100, 116, 139, 0.3)"
    }),
    editButton: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 16px",
      borderRadius: "8px",
      border: "none",
      background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
      color: "white",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
    },
    deleteButton: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "8px 16px",
      borderRadius: "8px",
      border: "none",
      background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
      color: "white",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)"
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
      width: "500px",
      maxWidth: "90vw",
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
      minHeight: "100px",
      resize: "vertical",
      outline: "none",
      transition: "all 0.2s ease",
      background: "#F8FAFC"
    },
    select: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid #E5E9F0",
      fontSize: "14px",
      background: "#F8FAFC",
      outline: "none",
      transition: "all 0.2s ease",
      cursor: "pointer"
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
      boxShadow: "0 4px 15px rgba(11, 42, 74, 0.2)"
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

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>
            <FiLayers size={28} />
            Units Management
          </h1>
          <p style={styles.headerSubtitle}>
            Create and manage units for your subjects
          </p>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Total Units</div>
            <div style={styles.statValue}>{stats.totalUnits}</div>
          </div>
          <div style={styles.statIcon("#0B2A4A", "#E8F0FE")}>
            <FiLayers />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Active Units</div>
            <div style={styles.statValue}>{stats.activeUnits}</div>
          </div>
          <div style={styles.statIcon("#059669", "#DCFCE7")}>
            <FiToggleRight />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Inactive Units</div>
            <div style={styles.statValue}>{stats.inactiveUnits}</div>
          </div>
          <div style={styles.statIcon("#64748B", "#F1F5F9")}>
            <FiToggleLeft />
          </div>
        </div>
      </div>

      <div style={{...styles.statsGrid, marginTop: "20px"}}>
        <div style={styles.statCard}>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Pending Approval</div>
            <div style={styles.statValue}>{stats.pendingUnits}</div>
          </div>
          <div style={styles.statIcon("#D97706", "#FEF3C7")}>
            <FiClock />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Approved</div>
            <div style={styles.statValue}>{stats.approvedUnits}</div>
          </div>
          <div style={styles.statIcon("#059669", "#DCFCE7")}>
            <FiCheckCircle />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Rejected</div>
            <div style={styles.statValue}>{stats.rejectedUnits}</div>
          </div>
          <div style={styles.statIcon("#DC2626", "#FEE2E2")}>
            <FiXCircle />
          </div>
        </div>
      </div>

      <div style={styles.filtersSection}>
        <div style={styles.searchBox}>
          <FiSearch color="#94A3B8" size={18} />
          <input
            style={styles.searchInput}
            placeholder="Search units by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          style={styles.subjectSelect}
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject._id} value={subject._id}>
              {subject.name} ({subject.code}) - Sem {subject.semester}
            </option>
          ))}
        </select>

        <div style={styles.viewToggle}>
          <button
            style={styles.viewButton(viewMode === "grid")}
            onClick={() => setViewMode("grid")}
          >
            Grid View
          </button>
          <button
            style={styles.viewButton(viewMode === "list")}
            onClick={() => setViewMode("list")}
          >
            List View
          </button>
        </div>

        <button
          style={styles.addButton}
          onClick={() => {
            setShowAddModal(true);
            setTimeout(() => setAnimateModal(true), 10);
          }}
        >
          <FiPlus size={18} />
          Create New Unit
        </button>
      </div>

      {Object.keys(unitsBySubject).length === 0 ? (
        <div style={styles.emptyState}>
          <FiLayers size={48} color="#94A3B8" style={{ marginBottom: "16px" }} />
          <h3 style={{ color: "#0B2A4A", margin: "0 0 8px 0", fontSize: "18px" }}>
            No Units Created Yet
          </h3>
          <p style={{ color: "#64748B", margin: 0 }}>
            Start creating units for your subjects by clicking the "Create New Unit" button above.
          </p>
        </div>
      ) : (
        Object.values(unitsBySubject).map(({ subject, units }) => (
          <div key={subject?._id || 'unknown'} style={styles.subjectSection}>
            <div style={styles.subjectHeader}>
              <div style={styles.subjectIcon}>
                <FiBookOpen />
              </div>
              <div style={styles.subjectInfo}>
                <h3 style={styles.subjectName}>
                  {subject?.name || 'Unknown Subject'} ({subject?.code || 'N/A'})
                </h3>
                <div style={styles.subjectMeta}>
                  <span>📚 {units.length} Units</span>
                  <span>📅 Semester: {subject?.semester || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div style={viewMode === "grid" ? styles.unitsGrid : styles.unitsList}>
              {units.map(unit => {
                const statusBadge = getStatusBadge(unit.status);
                
                return viewMode === "grid" ? (
                  <div
                    key={unit._id}
                    style={{
                      ...styles.unitCard,
                      opacity: unit.isActive === false ? 0.8 : 1,
                      background: unit.isActive === false ? '#F8FAFC' : 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 20px 30px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.02)";
                    }}
                  >
                    <div style={styles.unitHeader}>
                      <span style={styles.unitNumber}>Unit {unit.unitNumber}</span>
                      <div style={styles.actionButtons}>
                        <button
                          style={styles.toggleButton(unit.isActive)}
                          onClick={() => toggleUnitStatus(unit._id, unit.isActive)}
                          title={unit.isActive ? 'Click to deactivate unit' : 'Click to activate unit'}
                        >
                          {unit.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                          {unit.isActive ? 'Active' : 'Inactive'}
                        </button>
                        
                        <button
                          style={styles.editButton}
                          onClick={() => openEditModal(unit)}
                          title="Edit unit details"
                        >
                          <FiEdit size={16} />
                          Edit
                        </button>
                        
                        <button
                          style={styles.deleteButton}
                          onClick={() => setDeleteId(unit._id)}
                          title="Delete unit"
                        >
                          <FiTrash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>

                    <h4 style={styles.unitTitle}>{unit.unitTitle}</h4>
                    
                    {unit.description && (
                      <p style={styles.unitDescription}>
                        {unit.description.substring(0, 120)}
                        {unit.description.length > 120 ? '...' : ''}
                      </p>
                    )}

                    <div style={styles.badgesContainer}>
                      <span style={styles.badge(statusBadge.color, statusBadge.bgColor)}>
                        {statusBadge.icon}
                        {statusBadge.label}
                      </span>
                    </div>

                    <div style={styles.metaInfo}>
                      <span>📅 {new Date(unit.createdAt).toLocaleDateString()}</span>
                    </div>

                    {unit.adminFeedback && unit.status === "rejected" && (
                      <div style={styles.adminFeedback}>
                        <strong>Admin Feedback:</strong> {unit.adminFeedback}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    key={unit._id}
                    style={{
                      ...styles.unitListItem,
                      opacity: unit.isActive === false ? 0.8 : 1,
                      background: unit.isActive === false ? '#F8FAFC' : 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                    }}
                  >
                    <span style={styles.unitNumber}>Unit {unit.unitNumber}</span>
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px", color: "#1E293B" }}>
                        {unit.unitTitle}
                      </h4>
                      {unit.description && (
                        <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "8px" }}>
                          {unit.description.substring(0, 100)}
                          {unit.description.length > 100 ? '...' : ''}
                        </p>
                      )}
                      <div style={styles.badgesContainer}>
                        <span style={styles.badge(statusBadge.color, statusBadge.bgColor)}>
                          {statusBadge.icon}
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>

                    <div style={styles.actionButtons}>
                      <button
                        style={styles.toggleButton(unit.isActive)}
                        onClick={() => toggleUnitStatus(unit._id, unit.isActive)}
                        title={unit.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {unit.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                      </button>
                      
                      <button
                        style={styles.editButton}
                        onClick={() => openEditModal(unit)}
                        title="Edit"
                      >
                        <FiEdit size={16} />
                      </button>
                      
                      <button
                        style={styles.deleteButton}
                        onClick={() => setDeleteId(unit._id)}
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Add Unit Modal */}
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
              <h3 style={styles.modalTitle}>Create New Unit</h3>
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
              <label style={styles.label}>Select Subject *</label>
              <select
                style={styles.select}
                value={formData.subjectId}
                onChange={handleInputChange}
                name="subjectId"
              >
                <option value="">Choose a subject</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code}) - Semester {subject.semester}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Unit Number *</label>
              <input
                type="number"
                name="unitNumber"
                style={styles.input}
                value={formData.unitNumber}
                onChange={handleInputChange}
                placeholder="e.g., 1, 2, 3..."
                min="1"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Unit Title *</label>
              <input
                type="text"
                name="unitTitle"
                style={styles.input}
                value={formData.unitTitle}
                onChange={handleInputChange}
                placeholder="Enter unit title"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                style={styles.textarea}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter unit description (optional)"
              />
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
              <button style={styles.saveBtn} onClick={handleAddUnit}>
                <FiSave size={16} style={{ marginRight: "8px" }} />
                Create Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Unit Modal */}
      {showEditModal && (
        <div style={styles.modalOverlay} onClick={() => {
          setAnimateModal(false);
          setTimeout(() => {
            setShowEditModal(false);
            setEditUnit(null);
            resetForm();
          }, 200);
        }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Unit</h3>
              <div
                style={styles.closeIcon}
                onClick={() => {
                  setAnimateModal(false);
                  setTimeout(() => {
                    setShowEditModal(false);
                    setEditUnit(null);
                    resetForm();
                  }, 200);
                }}
              >
                <FiX size={20} />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Unit Number *</label>
              <input
                type="number"
                name="unitNumber"
                style={styles.input}
                value={formData.unitNumber}
                onChange={handleInputChange}
                placeholder="e.g., 1, 2, 3..."
                min="1"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Unit Title *</label>
              <input
                type="text"
                name="unitTitle"
                style={styles.input}
                value={formData.unitTitle}
                onChange={handleInputChange}
                placeholder="Enter unit title"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                style={styles.textarea}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter unit description"
              />
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => {
                  setAnimateModal(false);
                  setTimeout(() => {
                    setShowEditModal(false);
                    setEditUnit(null);
                    resetForm();
                  }, 200);
                }}
              >
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={handleEditUnit}>
                <FiRefreshCw size={16} style={{ marginRight: "8px" }} />
                Update Unit
              </button>
            </div>
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
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(8px)"
        }} onClick={() => setDeleteId(null)}>
          <div style={{
            background: "white",
            borderRadius: "24px",
            padding: "32px",
            width: "400px",
            maxWidth: "90vw",
            boxShadow: "0 30px 60px rgba(0,0,0,0.3)"
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto"
            }}>
              <FiAlertCircle size={40} color="#DC2626" />
            </div>
            
            <h3 style={{
              color: "#DC2626",
              fontSize: "24px",
              fontWeight: "600",
              margin: "0 0 12px 0",
              textAlign: "center"
            }}>
              Delete Unit
            </h3>
            
            <p style={{
              margin: "0 0 28px 0",
              color: "#475569",
              fontSize: "15px",
              lineHeight: "1.6",
              textAlign: "center"
            }}>
              Are you sure you want to delete this unit?<br />
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
                onClick={handleDeleteUnit}
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

export default TeacherUnits;