import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiFileText,
  FiVideo,
  FiLink,
  FiDownload,
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
  FiPaperclip,
  FiCopy,
  FiMinusCircle,
  FiWatch,
  FiFile
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TeacherContent = () => {
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [animateModal, setAnimateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editContent, setEditContent] = useState(null);
  const [viewContent, setViewContent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filesToRemove, setFilesToRemove] = useState([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  const [cachedContent, setCachedContent] = useState([]);
  const [stats, setStats] = useState({
    totalContent: 0,
    topics: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalFiles: 0,
    totalDuration: 0
  });

  // Form state for adding/editing content
  const [formData, setFormData] = useState({
    subjectId: "",
    unitId: "",
    topic: "",
    items: [] // Array of { title, videoFile, description, duration }
  });

  // For file uploads (general files for the topic)
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Get teacher ID from localStorage on mount
  useEffect(() => {
    const id = localStorage.getItem("userId");
    setTeacherId(id);
  }, []);

  // Load saved selections from localStorage on component mount
  useEffect(() => {
    const savedSubject = localStorage.getItem("teacherContent_subjectId");
    const savedUnit = localStorage.getItem("teacherContent_unitId");
    
    const id = localStorage.getItem("userId");
    if (id) {
      setTeacherId(id);
      fetchTeacherSubjects(id, savedSubject, savedUnit);
    } else {
      setIsLoadingSubjects(false);
    }
  }, []);

  // Save selections to localStorage whenever they change
  useEffect(() => {
    if (selectedSubject) {
      localStorage.setItem("teacherContent_subjectId", selectedSubject);
    } else {
      localStorage.removeItem("teacherContent_subjectId");
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedUnit) {
      localStorage.setItem("teacherContent_unitId", selectedUnit);
    } else {
      localStorage.removeItem("teacherContent_unitId");
    }
  }, [selectedUnit]);

  // Fetch units when subject changes - FIXED to filter by teacher
  useEffect(() => {
    if (selectedSubject && teacherId) {
      fetchUnitsBySubject(selectedSubject, teacherId);
    } else {
      setUnits([]);
      setIsLoadingUnits(false);
    }
  }, [selectedSubject, teacherId]);

  // Fetch content when unit changes AND units are loaded
  useEffect(() => {
    if (selectedUnit && !isLoadingUnits && teacherId) {
      fetchContentByUnit(selectedUnit, teacherId);
    } else if (!selectedUnit) {
      setContent([]);
      setStats({
        totalContent: 0,
        topics: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalFiles: 0,
        totalDuration: 0
      });
      setLoading(false);
    }
  }, [selectedUnit, isLoadingUnits, teacherId]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const editId = queryParams.get('editId');
    const subjectId = queryParams.get('subjectId');
    
    if (editId && subjectId && !loading && cachedContent.length > 0) {
      const contentToEdit = cachedContent.find(content => content._id === editId);
      if (contentToEdit) {
        setTimeout(() => {
          openEditModal(contentToEdit);
        }, 500);
      }
      window.history.replaceState({}, '', window.location.pathname + `?subjectId=${subjectId}&subjectName=${encodeURIComponent(queryParams.get('subjectName') || '')}`);
    }
  }, [loading, cachedContent]);

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

  // FIXED: Fetch only units created by this teacher for the selected subject
  const fetchUnitsBySubject = async (subjectId, teacherId) => {
    try {
      setIsLoadingUnits(true);
      // Updated API call to include teacherId filter
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

  const fetchContentByUnit = async (unitId, teacherId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/content/unit/${unitId}?teacherId=${teacherId}`,
        {
          headers: {
            'x-teacher-id': teacherId
          }
        }
      );
      setContent(res.data);
      setCachedContent(res.data);

      
      // Calculate stats
      const topics = [...new Set(res.data.map(c => c.topic))];
      const totalDuration = res.data.reduce((acc, c) => {
        return acc + (c.items?.reduce((itemAcc, item) => {
          return itemAcc + (parseInt(item.duration) || 0);
        }, 0) || 0);
      }, 0);
      
      setStats({
        totalContent: res.data.length,
        topics: topics.length,
        pending: res.data.filter(c => c.status === "pending").length,
        approved: res.data.filter(c => c.status === "approved").length,
        rejected: res.data.filter(c => c.status === "rejected").length,
        totalFiles: res.data.reduce((acc, c) => acc + (c.files?.length || 0), 0),
        totalDuration: totalDuration
      });
      
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    setSelectedSubject(subjectId);
    setSelectedUnit("");
    setSelectedTopic("all");
    setFormData({
      ...formData,
      subjectId,
      unitId: "",
      topic: "",
      items: []
    });
    setSelectedFiles([]);
  };

  const handleUnitChange = (e) => {
    const unitId = e.target.value;
    setSelectedUnit(unitId);
    setSelectedTopic("all");
    setFormData({
      ...formData,
      unitId,
      topic: "",
      items: []
    });
    setSelectedFiles([]);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const handleItemVideoFileChange = (index, file) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      videoFile: file,
      videoFileName: file?.name || ''
    };
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const addNewItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          title: "",
          videoFile: null,
          videoFileName: "",
          description: "",
          duration: ""
        }
      ]
    });
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const handleFileChange = (e) => {
    setSelectedFiles([...e.target.files]);
  };

  const handleAddContent = async () => {
    try {
      // Validation
      if (!formData.subjectId || !formData.unitId || !formData.topic) {
        toast.error("Please select subject, unit and enter topic");
        return;
      }

      if (formData.items.length === 0) {
        toast.error("Please add at least one content item");
        return;
      }

      // Validate each item
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        if (!item.title) {
          toast.error(`Item ${i + 1}: Title is required`);
          return;
        }
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
      formDataToSend.append("topic", formData.topic);
      
      // Process items and append video files
      const itemsWithoutFiles = formData.items.map((item, index) => {
        const { videoFile, videoFileName, ...itemData } = item;
        return {
          ...itemData,
          videoFileIndex: videoFile ? index : -1
        };
      });
      
      formDataToSend.append("items", JSON.stringify(itemsWithoutFiles));
      
      // Append video files for each item
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        if (item.videoFile) {
          formDataToSend.append(`video_${i}`, item.videoFile);
        }
      }
      
      // Append general files
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          formDataToSend.append("files", selectedFiles[i]);
        }
      }

      const res = await axios.post(
        "http://localhost:5000/api/content/add",
        formDataToSend,
        {
          headers: { 
            "Content-Type": "multipart/form-data",
            "x-teacher-id": teacherId
          }
        }
      );

      toast.success("🎉 Content added successfully and sent for approval!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
        icon: "✅"
      });

      setShowAddModal(false);
      resetForm();
      
      // Refresh the content list if a unit is selected
      if (selectedUnit && teacherId) {
        await fetchContentByUnit(selectedUnit, teacherId);
      }
      
    } catch (error) {
      console.error("Error adding content:", error);
      if (error.response) {
        toast.error(error.response.data?.message || "Failed to add content");
      } else if (error.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error("Error: " + error.message);
      }
    }
  };

  const handleEditContent = async () => {
    try {
      const teacherId = localStorage.getItem("userId");
      const formDataToSend = new FormData();
      formDataToSend.append("topic", formData.topic);
      
      // Process items and append video files
      const itemsWithoutFiles = formData.items.map((item, index) => {
        const { videoFile, videoFileName, ...itemData } = item;
        return {
          ...itemData,
          videoFileIndex: videoFile && !item._id ? index : -1
        };
      });
      
      formDataToSend.append("items", JSON.stringify(itemsWithoutFiles));
      
      // Append new video files for items
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        if (item.videoFile && !item._id) {
          formDataToSend.append(`video_${i}`, item.videoFile);
        }
      }
      
      // Add files to remove
      if (filesToRemove.length > 0) {
        formDataToSend.append("removeFiles", JSON.stringify(filesToRemove));
      }
      
      // Append new general files
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          formDataToSend.append("files", selectedFiles[i]);
        }
      }
      
      // Check if content is approved - if yes, change status to pending
      const isApproved = editContent.status === 'approved';
      
      if (isApproved) {
        formDataToSend.append("status", "pending");
        formDataToSend.append("adminFeedback", ""); // Clear previous feedback
      }

      const res = await axios.put(
        `http://localhost:5000/api/content/${editContent._id}`,
        formDataToSend,
        {
          headers: { 
            "Content-Type": "multipart/form-data",
            "x-teacher-id": teacherId
          }
        }
      );

      if (isApproved) {
        toast.success("✏️ Content updated successfully and sent for re-approval!", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
          icon: "🔄"
        });
      } else {
        toast.success("✏️ Content updated successfully!", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
          icon: "📝"
        });
      }

      setShowEditModal(false);
      setEditContent(null);
      resetForm();
      
      // Refresh the content list
      if (selectedUnit && teacherId) {
        await fetchContentByUnit(selectedUnit, teacherId);
      }
      
    } catch (error) {
      console.error("Error updating content:", error);
      toast.error(error.response?.data?.message || "Failed to update content");
    }
  };

  const handleDeleteContent = async () => {
    try {
      const teacherId = localStorage.getItem("userId");
      await axios.delete(`http://localhost:5000/api/content/${deleteId}`, {
        headers: {
          'x-teacher-id': teacherId
        }
      });
      
      toast.success("🗑️ Content deleted successfully!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
        icon: "✅"
      });

      setDeleteId(null);
      
      // Refresh the content list
      if (selectedUnit && teacherId) {
        await fetchContentByUnit(selectedUnit, teacherId);
      }
      
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content");
    }
  };

  const openEditModal = (content) => {
    setEditContent(content);
    // Map existing items to include video file info
    const itemsWithVideo = (content.items || []).map(item => ({
      _id: item._id,
      title: item.title,
      video: item.video,
      videoFile: null,
      videoFileName: item.video ? item.video.split('/').pop() : '',
      description: item.description || '',
      duration: item.duration || ''
    }));
    
    setFormData({
      subjectId: content.subjectId?._id || content.subjectId,
      unitId: content.unitId?._id || content.unitId,
      topic: content.topic,
      items: itemsWithVideo
    });
    setFilesToRemove([]);
    setSelectedFiles([]);
    setShowEditModal(true);
    setTimeout(() => setAnimateModal(true), 10);
  };

  const openViewModal = (content) => {
    setViewContent(content);
    setShowViewModal(true);
    setTimeout(() => setAnimateModal(true), 10);
  };

  const resetForm = () => {
    setFormData({
      subjectId: selectedSubject,
      unitId: selectedUnit,
      topic: "",
      items: []
    });
    setSelectedFiles([]);
    setFilesToRemove([]);
  };

  const handleFileRemove = (index) => {
    setFilesToRemove([...filesToRemove, index]);
  };

  const handleDownloadFile = async (filename) => {
    try {
      const response = await axios({
        url: `http://localhost:5000/api/content/download/${filename}`,
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

  const handleDownloadVideo = async (filename) => {
    try {
      const response = await axios({
        url: `http://localhost:5000/api/content/download/${filename}`,
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
      console.error("Error downloading video:", error);
      toast.error("Failed to download video");
    }
  };

  // Format duration for display
  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const mins = parseInt(minutes);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  // Get unique topics for filter
  const topics = [...new Set(content.map(c => c.topic))];

  // Filter content
  const filteredContent = content.filter(item => {
    const matchesSearch = item.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.items && item.items.some(i => 
                           i.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           i.description?.toLowerCase().includes(searchTerm.toLowerCase())
                         ));
    const matchesTopic = selectedTopic === "all" || item.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  // Get status badge
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
      gridTemplateColumns: "repeat(4, 1fr)",
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
    topicFilter: {
      flex: 1,
      minWidth: "180px",
      padding: "8px 12px",
      background: "#F8FAFC",
      borderRadius: "10px",
      border: "1px solid #E5E9F0",
      fontSize: "14px",
      color: "#1E293B",
      cursor: "pointer"
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
      boxShadow: "0 4px 15px rgba(11, 42, 74, 0.2)",
      ":hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 8px 25px rgba(11, 42, 74, 0.3)"
      },
      ":disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
        transform: "none",
        boxShadow: "none"
      }
    },
    contentGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
      gap: "20px"
    },
    contentCard: {
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
    topicBadge: {
      background: "#0B2A4A",
      color: "white",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600"
    },
    itemsList: {
      marginTop: "12px",
      marginBottom: "12px"
    },
    itemCard: {
      background: "#F8FAFC",
      borderRadius: "8px",
      padding: "12px",
      marginBottom: "8px"
    },
    itemTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#1E293B",
      marginBottom: "4px"
    },
    itemVideo: {
      fontSize: "12px",
      color: "#2563EB",
      marginBottom: "4px",
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    itemDuration: {
      fontSize: "11px",
      color: "#64748B",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      marginTop: "2px"
    },
    itemDescription: {
      fontSize: "12px",
      color: "#64748B",
      marginTop: "4px"
    },
    filesList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginTop: "8px"
    },
    fileItem: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 8px",
      background: "#F8FAFC",
      borderRadius: "6px",
      fontSize: "11px",
      color: "#475569"
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
      border: "none",
      ":hover": {
        transform: "scale(1.1)"
      }
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
      width: "700px",
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
      transition: "all 0.2s ease",
      ":hover": {
        background: "#F1F5F9",
        color: "#0B2A4A"
      }
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
      transition: "all 0.2s ease",
      ":focus": {
        borderColor: "#0B2A4A",
        boxShadow: "0 0 0 3px rgba(11, 42, 74, 0.1)"
      }
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid #E5E9F0",
      fontSize: "14px",
      outline: "none",
      transition: "all 0.2s ease",
      background: "#F8FAFC",
      ":focus": {
        borderColor: "#0B2A4A",
        boxShadow: "0 0 0 3px rgba(11, 42, 74, 0.1)",
        background: "white"
      }
    },
    textarea: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid #E5E9F0",
      fontSize: "14px",
      minHeight: "60px",
      resize: "vertical",
      background: "#F8FAFC",
      ":focus": {
        borderColor: "#0B2A4A",
        boxShadow: "0 0 0 3px rgba(11, 42, 74, 0.1)",
        background: "white"
      }
    },
    fileInput: {
      width: "100%",
      padding: "10px",
      borderRadius: "12px",
      border: "1px dashed #E5E9F0",
      background: "#F8FAFC",
      cursor: "pointer"
    },
    videoFileInput: {
      width: "100%",
      padding: "8px",
      borderRadius: "8px",
      border: "1px dashed #C7D2FE",
      background: "#EFF6FF",
      cursor: "pointer",
      fontSize: "12px"
    },
    itemContainer: {
      background: "#F8FAFC",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "16px",
      border: "1px solid #E5E9F0"
    },
    itemHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px"
    },
    itemTitleText: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#0B2A4A"
    },
    removeItemBtn: {
      color: "#DC2626",
      cursor: "pointer",
      padding: "4px",
      ":hover": {
        transform: "scale(1.1)"
      }
    },
    addItemBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 16px",
      background: "white",
      color: "#0B2A4A",
      border: "2px dashed #0B2A4A",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      width: "100%",
      justifyContent: "center",
      marginBottom: "20px",
      transition: "all 0.3s ease",
      ":hover": {
        background: "#F8FAFC",
        transform: "translateY(-2px)"
      }
    },
    fileList: {
      marginTop: "10px",
      padding: "10px",
      background: "#F8FAFC",
      borderRadius: "8px"
    },
    fileListItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px",
      borderBottom: "1px solid #E5E9F0"
    },
    removeFileBtn: {
      color: "#DC2626",
      cursor: "pointer",
      padding: "4px",
      ":hover": {
        transform: "scale(1.1)"
      }
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
      transition: "all 0.2s ease",
      ":hover": {
        background: "#F1F5F9",
        borderColor: "#94A3B8"
      }
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
      gap: "8px",
      ":hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 8px 25px rgba(11, 42, 74, 0.3)"
      }
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
    viewTopic: {
      fontSize: "14px",
      color: "#64748B",
      marginBottom: "4px"
    },
    viewMeta: {
      fontSize: "13px",
      color: "#64748B"
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
    viewItemsList: {
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    },
    viewItemCard: {
      background: "#F8FAFC",
      borderRadius: "8px",
      padding: "12px"
    },
    viewItemTitle: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#1E293B",
      marginBottom: "8px"
    },
    viewItemVideo: {
      fontSize: "13px",
      color: "#2563EB",
      marginTop: "6px",
      marginBottom: "4px",
      wordBreak: "break-all",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap"
    },
    viewItemDuration: {
      fontSize: "12px",
      color: "#64748B",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      marginTop: "4px"
    },
    viewItemDescription: {
      fontSize: "13px",
      color: "#64748B",
      marginTop: "4px"
    },
    viewFiles: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
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
      transition: "all 0.2s ease",
      ":hover": {
        background: "#1A3F5C",
        transform: "translateY(-2px)"
      }
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

  // Add keyframes animation
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

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.headerTitle}>
            <FiFileText size={28} />
            Content Management
          </h1>
        </div>
        <p style={styles.headerSubtitle}>
          Manage topic-wise content with multiple items per topic (Upload video files for each item)
        </p>
      </div>

      {/* Stats Cards - Only show if unit is selected */}
      {selectedUnit ? (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon("#0B2A4A", "#E8F0FE")}>
              <FiFileText size={20} />
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statLabel}>Total Topics</div>
              <div style={styles.statValue}>{stats.topics}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon("#D97706", "#FEF3C7")}>
              <FiCopy size={20} />
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statLabel}>Total Items</div>
              <div style={styles.statValue}>{stats.totalContent}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon("#059669", "#DCFCE7")}>
              <FiWatch size={20} />
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statLabel}>Total Duration</div>
              <div style={styles.statValue}>{formatDuration(stats.totalDuration)}</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon("#7C3AED", "#EDE9FE")}>
              <FiPaperclip size={20} />
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statLabel}>Total Files</div>
              <div style={styles.statValue}>{stats.totalFiles}</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Filters and Add Button */}
      <div style={styles.filtersSection}>
        <div style={{ ...styles.selectGroup, flex: 1, minWidth: "200px" }}>
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

        <div style={{ ...styles.selectGroup, flex: 1, minWidth: "200px" }}>
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
          <>
            <div style={styles.searchBox}>
              <FiSearch color="#94A3B8" size={18} />
              <input
                style={styles.searchInput}
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              style={styles.topicFilter}
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="all">All Topics</option>
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </>
        )}

        <button
          style={styles.addButton}
          onClick={() => {
            setFormData({
              subjectId: selectedSubject,
              unitId: selectedUnit,
              topic: "",
              items: []
            });
            setSelectedFiles([]);
            setShowAddModal(true);
            setTimeout(() => setAnimateModal(true), 10);
          }}
          disabled={!selectedSubject || !selectedUnit}
        >
          <FiPlus size={18} />
          Add Content
        </button>
      </div>

      {/* Content Grid */}
      {!selectedSubject || !selectedUnit ? (
        <div style={styles.emptyState}>
          <FiBookOpen size={48} color="#94A3B8" style={{ marginBottom: "16px" }} />
          <h3 style={{ color: "#0B2A4A", marginBottom: "8px" }}>Select Subject and Unit</h3>
          <p style={{ color: "#64748B" }}>
            Please select a subject and unit to view and manage content
          </p>
        </div>
      ) : loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
        </div>
      ) : filteredContent.length === 0 ? (
        <div style={styles.emptyState}>
          <FiFileText size={48} color="#94A3B8" style={{ marginBottom: "16px" }} />
          <h3 style={{ color: "#0B2A4A", marginBottom: "8px" }}>No Content Found</h3>
          <p style={{ color: "#64748B" }}>
            {searchTerm || selectedTopic !== "all"
              ? "No content matches your filters"
              : "Click the 'Add Content' button to create your first content"}
          </p>
        </div>
      ) : (
        <div style={styles.contentGrid}>
          {filteredContent.map(item => {
            const statusBadge = getStatusBadge(item.status);
            const itemCount = item.items?.length || 0;
            
            return (
              <div
                key={item._id}
                style={styles.contentCard}
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
                  <span style={styles.topicBadge}>{item.topic}</span>
                  <span style={styles.statusBadge(item.status)}>
                    {statusBadge.icon}
                    {statusBadge.label}
                  </span>
                </div>

                <div style={styles.itemsList}>
                  <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "8px" }}>
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </div>
                  {item.items && item.items.slice(0, 2).map((contentItem, idx) => (
                    <div key={idx} style={styles.itemCard}>
                      <div style={styles.itemTitle}>{contentItem.title}</div>
                      {contentItem.video && (
                        <div style={styles.itemVideo}>
                          <FiVideo size={12} /> Video Available
                        </div>
                      )}
                      {contentItem.duration && (
                        <div style={styles.itemDuration}>
                          <FiWatch size={10} /> {formatDuration(contentItem.duration)}
                        </div>
                      )}
                    </div>
                  ))}
                  {itemCount > 2 && (
                    <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                      +{itemCount - 2} more items
                    </div>
                  )}
                </div>

                {item.files && item.files.length > 0 && (
                  <div style={styles.filesList}>
                    <div style={{ fontSize: "12px", fontWeight: "500", color: "#475569" }}>
                      {item.files.length} File{item.files.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                <div style={styles.cardFooter}>
                  <div style={styles.actionButtons}>
                    <button
                      style={styles.iconButton("#64748B", "#F1F5F9")}
                      onClick={() => openViewModal(item)}
                      title="View"
                    >
                      <FiEye size={16} />
                    </button>
                    <button
                      style={styles.iconButton("#2563EB", "#EFF6FF")}
                      onClick={() => openEditModal(item)}
                      title="Edit"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      style={styles.iconButton("#DC2626", "#FEE2E2")}
                      onClick={() => setDeleteId(item._id)}
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                {item.adminFeedback && item.status === "rejected" && (
                  <div style={{
                    marginTop: "12px",
                    padding: "8px",
                    background: "#FEF3C7",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#92400E"
                  }}>
                    <strong>Feedback:</strong> {item.adminFeedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Content Modal */}
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
              <h3 style={styles.modalTitle}>Add New Content</h3>
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

            {/* Subject Selection */}
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

            {/* Unit Selection */}
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

            {/* Topic */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Topic *</label>
              <input
                type="text"
                name="topic"
                style={styles.input}
                value={formData.topic}
                onChange={handleInputChange}
                placeholder="Enter topic name"
              />
            </div>

            {/* Content Items */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Content Items</label>
              
              {formData.items.map((item, index) => (
                <div key={index} style={styles.itemContainer}>
                  <div style={styles.itemHeader}>
                    <span style={styles.itemTitleText}>Item {index + 1}</span>
                    <FiMinusCircle
                      size={20}
                      style={styles.removeItemBtn}
                      onClick={() => removeItem(index)}
                      title="Remove this item"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Title *</label>
                    <input
                      type="text"
                      style={styles.input}
                      value={item.title}
                      onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                      placeholder="Enter title"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Video File (Upload)</label>
                    <input
                      type="file"
                      style={styles.videoFileInput}
                      onChange={(e) => handleItemVideoFileChange(index, e.target.files[0])}
                      accept=".mp4,.webm,.mov,.avi,.mkv"
                    />
                    {item.videoFileName && (
                      <div style={{ fontSize: "12px", color: "#059669", marginTop: "4px" }}>
                        Selected: {item.videoFileName}
                      </div>
                    )}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Duration (minutes)</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={item.duration || ''}
                      onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                      placeholder="e.g., 15, 30, 45"
                      min="1"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Description</label>
                    <textarea
                      style={styles.textarea}
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Enter description"
                    />
                  </div>
                </div>
              ))}

              <button
                style={styles.addItemBtn}
                onClick={addNewItem}
              >
                <FiPlus size={18} />
                Add Another Item
              </button>
            </div>

            {/* File Uploads (General files for the topic) */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Upload Additional Files (PDF, PPT, DOC, etc.)</label>
              <input
                type="file"
                style={styles.fileInput}
                onChange={handleFileChange}
                multiple
                accept=".pdf,.ppt,.pptx,.doc,.docx"
              />
              {selectedFiles.length > 0 && (
                <div style={styles.fileList}>
                  <p style={{ fontSize: "13px", fontWeight: "500", marginBottom: "8px" }}>
                    Selected Files:
                  </p>
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} style={styles.fileListItem}>
                      <span style={{ fontSize: "12px" }}>{file.name}</span>
                      <span style={{ fontSize: "11px", color: "#64748B" }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
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
              <button style={styles.saveBtn} onClick={handleAddContent}>
                <FiSave size={16} />
                Add Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Content Modal */}
      {showEditModal && editContent && (
        <div style={styles.modalOverlay} onClick={() => {
          setAnimateModal(false);
          setTimeout(() => {
            setShowEditModal(false);
            setEditContent(null);
            resetForm();
          }, 200);
        }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Content</h3>
              <div
                style={styles.closeIcon}
                onClick={() => {
                  setAnimateModal(false);
                  setTimeout(() => {
                    setShowEditModal(false);
                    setEditContent(null);
                    resetForm();
                  }, 200);
                }}
              >
                <FiX size={20} />
              </div>
            </div>

            {/* Topic (Read-only) */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Topic</label>
              <input
                type="text"
                style={styles.input}
                value={formData.topic}
                readOnly
                disabled
              />
            </div>

            {/* Content Items */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Content Items</label>
              
              {formData.items.map((item, index) => (
                <div key={index} style={styles.itemContainer}>
                  <div style={styles.itemHeader}>
                    <span style={styles.itemTitleText}>Item {index + 1}</span>
                    {formData.items.length > 1 && (
                      <FiMinusCircle
                        size={20}
                        style={styles.removeItemBtn}
                        onClick={() => removeItem(index)}
                        title="Remove this item"
                      />
                    )}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Title *</label>
                    <input
                      type="text"
                      style={styles.input}
                      value={item.title}
                      onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                      placeholder="Enter title"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      {item.video && !item.videoFile ? 'Current Video File' : 'Upload New Video File'}
                    </label>
                    {item.video && !item.videoFile && (
                      <div style={{
                        padding: "8px",
                        background: "#EFF6FF",
                        borderRadius: "8px",
                        marginBottom: "8px",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}>
                        <span style={{ color: "#2563EB" }}>
                          <FiVideo size={14} style={{ marginRight: "4px" }} />
                          {item.video.split('/').pop()}
                        </span>
                        <button
                          onClick={() => handleDownloadVideo(item.video)}
                          style={{
                            background: "#2563EB",
                            color: "white",
                            border: "none",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            cursor: "pointer"
                          }}
                        >
                          <FiDownload size={12} /> Download
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      style={styles.videoFileInput}
                      onChange={(e) => handleItemVideoFileChange(index, e.target.files[0])}
                      accept=".mp4,.webm,.mov,.avi,.mkv"
                    />
                    {item.videoFileName && (
                      <div style={{ fontSize: "12px", color: "#059669", marginTop: "4px" }}>
                        New file selected: {item.videoFileName}
                      </div>
                    )}
                    <p style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
                      {item.video && !item.videoFile 
                        ? "Upload a new video to replace the existing one" 
                        : item.videoFile 
                          ? "New video selected - will replace existing" 
                          : "Upload a video file (MP4, WebM, MOV, AVI, MKV)"}
                    </p>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Duration (minutes)</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={item.duration || ''}
                      onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                      placeholder="e.g., 15, 30, 45"
                      min="1"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Description</label>
                    <textarea
                      style={styles.textarea}
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Enter description"
                    />
                  </div>
                </div>
              ))}

              <button
                style={styles.addItemBtn}
                onClick={addNewItem}
              >
                <FiPlus size={18} />
                Add Another Item
              </button>
            </div>

            {/* Existing Files */}
            {editContent.files && editContent.files.length > 0 && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Existing Files</label>
                <div style={styles.fileList}>
                  {editContent.files.map((file, index) => {
                    if (filesToRemove.includes(index)) return null;
                    return (
                      <div key={index} style={styles.fileListItem}>
                        <span style={{ fontSize: "12px" }}>{file.originalName}</span>
                        <FiX
                          size={16}
                          color="#DC2626"
                          style={styles.removeFileBtn}
                          onClick={() => handleFileRemove(index)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload New Files */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Upload New Files</label>
              <input
                type="file"
                style={styles.fileInput}
                onChange={handleFileChange}
                multiple
                accept=".pdf,.ppt,.pptx,.doc,.docx"
              />
              {selectedFiles.length > 0 && (
                <div style={styles.fileList}>
                  <p style={{ fontSize: "13px", fontWeight: "500", marginBottom: "8px" }}>
                    New Files:
                  </p>
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} style={styles.fileListItem}>
                      <span style={{ fontSize: "12px" }}>{file.name}</span>
                      <span style={{ fontSize: "11px", color: "#64748B" }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
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
                    setEditContent(null);
                    resetForm();
                  }, 200);
                }}
              >
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={handleEditContent}>
                <FiRefreshCw size={16} />
                Update Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Content Modal */}
      {showViewModal && viewContent && (
        <div style={styles.modalOverlay} onClick={() => {
          setAnimateModal(false);
          setTimeout(() => setShowViewModal(false), 200);
        }}>
          <div style={styles.viewModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.viewHeader}>
              <div style={styles.viewTitle}>
                <h2 style={styles.viewName}>{viewContent.topic}</h2>
                <p style={styles.viewMeta}>
                  Added on {new Date(viewContent.createdAt).toLocaleDateString()}
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

            {/* Content Items */}
            {viewContent.items && viewContent.items.length > 0 && (
              <div style={styles.viewSection}>
                <div style={styles.viewLabel}>Content Items</div>
                <div style={styles.viewItemsList}>
                  {viewContent.items.map((item, index) => (
                    <div key={index} style={styles.viewItemCard}>
                      <div style={styles.viewItemTitle}>{item.title}</div>
                      {item.video && (
                        <div style={styles.viewItemVideo}>
                          <FiVideo size={12} />
                          <a href={`http://localhost:5000/api/content/download/${item.video}`} target="_blank" rel="noopener noreferrer">
                            Watch Video
                          </a>
                          <button
                            onClick={() => handleDownloadVideo(item.video)}
                            style={{
                              background: "#2563EB",
                              color: "white",
                              border: "none",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              cursor: "pointer",
                              marginLeft: "8px"
                            }}
                          >
                            <FiDownload size={12} /> Download
                          </button>
                        </div>
                      )}
                      {item.duration && (
                        <div style={styles.viewItemDuration}>
                          <FiWatch size={12} /> Duration: {formatDuration(item.duration)}
                        </div>
                      )}
                      {item.description && (
                        <div style={styles.viewItemDescription}>{item.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {viewContent.files && viewContent.files.length > 0 && (
              <div style={styles.viewSection}>
                <div style={styles.viewLabel}>Additional Files</div>
                <div style={styles.viewFiles}>
                  {viewContent.files.map((file, index) => (
                    <div key={index} style={styles.viewFileItem}>
                      <span style={{ fontSize: "13px" }}>{file.originalName}</span>
                      <button
                        style={styles.downloadBtn}
                        onClick={() => handleDownloadFile(file.filename)}
                      >
                        <FiDownload size={14} />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewContent.adminFeedback && viewContent.status === "rejected" && (
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
                <p style={{ color: "#92400E", margin: 0 }}>{viewContent.adminFeedback}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div style={styles.modalOverlay} onClick={() => setDeleteId(null)}>
          <div style={{...styles.modal, width: "400px"}} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ color: "#DC2626", margin: 0 }}>Delete Content</h3>
              <div style={styles.closeIcon} onClick={() => setDeleteId(null)}>
                <FiX size={20} />
              </div>
            </div>
            
            <div style={{ textAlign: "center", margin: "20px 0" }}>
              <FiAlertCircle size={50} color="#DC2626" style={{ marginBottom: "16px" }} />
              <p style={{ color: "#475569", lineHeight: "1.6" }}>
                Are you sure you want to delete this content?<br />
                <span style={{ fontWeight: "600", color: "#DC2626" }}>This action cannot be undone.</span>
              </p>
            </div>
            
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button
                style={{...styles.saveBtn, background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)"}}
                onClick={handleDeleteContent}
              >
                <FiTrash2 size={16} />
                Delete Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherContent;