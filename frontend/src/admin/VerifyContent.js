import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEye,
  FiUser,
  FiBookOpen,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiMessageSquare,
  FiDownload,
  FiTrendingUp,
  FiThumbsUp,
  FiThumbsDown,
  FiRefreshCw,
  FiFileText,
  FiClipboard,
  FiHelpCircle,
  FiLayers,
  FiBarChart2,
  FiInfo,
  FiCalendar,
  FiClock as FiClockIcon,
  FiVideo,
  FiFile,
  FiAward,
  FiFolder,
  FiSend,
  FiCheck,
  FiAlertTriangle,
  FiStar,
  FiTrendingDown,
  FiLink
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VerifyContent = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminComment, setAdminComment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [expandedSections, setExpandedSections] = useState({});
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [itemDetails, setItemDetails] = useState({});
  const [loadingItems, setLoadingItems] = useState({});
  const [expandedUnits, setExpandedUnits] = useState({});
  const [bulkActionLoading, setBulkActionLoading] = useState({});
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    changesRequested: 0,
    totalUnits: 0,
    totalContent: 0,
    totalAssignments: 0,
    totalQuizzes: 0
  });

  const getAuthToken = () => localStorage.getItem("token");

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  const fetchVerificationRequests = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get("http://localhost:5000/api/verification/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Fetched requests:", response.data);
      setRequests(response.data);
      applyFilters(response.data, searchTerm, statusFilter, dateFilter);
      calculateStats(response.data);
      
      setItemDetails({});
      for (const request of response.data) {
        await fetchDetailedItems(request);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load verification requests");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    toast.info("Refreshing verification data...");
    await fetchVerificationRequests();
    toast.success("Verification data refreshed successfully");
    setRefreshing(false);
  };

  const fetchDetailedItems = async (request) => {
    try {
      setLoadingItems(prev => ({ ...prev, [request._id]: true }));
      
      const token = getAuthToken();
      const items = {
        units: [],
        content: [],
        assignments: [],
        quizzes: []
      };
      
      const requestItems = request.items || {};
      
      try {
        const teacherId = request.teacherId?._id || request.teacherId;
        const subjectId = request.subjectId?._id || request.subjectId;
        
        if (!teacherId || !subjectId) {
          console.error("Missing teacherId or subjectId", { teacherId, subjectId });
          throw new Error("Missing required IDs");
        }
        
        const allUnitsResponse = await axios.get(
          `http://localhost:5000/api/units/subject/${subjectId}/teacher/${teacherId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const allUnits = allUnitsResponse.data || [];
        
        const unitIdsInRequest = new Set();
        if (requestItems.units && Array.isArray(requestItems.units)) {
          requestItems.units.forEach(unit => {
            const id = typeof unit === 'object' && unit._id ? unit._id : unit;
            if (id) unitIdsInRequest.add(id.toString());
          });
        }
        
        console.log('Unit IDs in request:', Array.from(unitIdsInRequest));
        
        const unitsInRequestMap = new Map();
        
        allUnits.forEach(unit => {
          if (unitIdsInRequest.has(unit._id.toString())) {
            unitsInRequestMap.set(unit._id, {
              ...unit,
              content: [],
              assignments: [],
              quizzes: []
            });
          }
        });
        
        const standaloneItems = {
          content: [],
          assignments: [],
          quizzes: []
        };
        
        if (requestItems.content && requestItems.content.length > 0) {
          for (const contentItem of requestItems.content) {
            try {
              const contentId = typeof contentItem === 'object' && contentItem._id ? contentItem._id : contentItem;
              const response = await axios.get(`http://localhost:5000/api/content/${contentId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const contentData = response.data;
              const contentUnitId = contentData.unitId?._id || contentData.unitId;
              
              if (contentUnitId && unitsInRequestMap.has(contentUnitId)) {
                const unit = unitsInRequestMap.get(contentUnitId);
                unit.content.push(contentData);
                unitsInRequestMap.set(contentUnitId, unit);
              } else {
                standaloneItems.content.push(contentData);
              }
            } catch (err) {
              console.error(`Error fetching content:`, err);
            }
          }
        }
        
        if (requestItems.assignments && requestItems.assignments.length > 0) {
          for (const assignmentItem of requestItems.assignments) {
            try {
              const assignmentId = typeof assignmentItem === 'object' && assignmentItem._id ? assignmentItem._id : assignmentItem;
              const response = await axios.get(`http://localhost:5000/api/assignments/${assignmentId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const assignmentData = response.data;
              const assignmentUnitId = assignmentData.unitId?._id || assignmentData.unitId;
              
              if (assignmentUnitId && unitsInRequestMap.has(assignmentUnitId)) {
                const unit = unitsInRequestMap.get(assignmentUnitId);
                unit.assignments.push(assignmentData);
                unitsInRequestMap.set(assignmentUnitId, unit);
              } else {
                standaloneItems.assignments.push(assignmentData);
              }
            } catch (err) {
              console.error(`Error fetching assignment:`, err);
            }
          }
        }
        
        if (requestItems.quizzes && requestItems.quizzes.length > 0) {
          for (const quizItem of requestItems.quizzes) {
            try {
              const quizId = typeof quizItem === 'object' && quizItem._id ? quizItem._id : quizItem;
              const response = await axios.get(`http://localhost:5000/api/quizzes/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const quizData = response.data;
              const quizUnitId = quizData.unitId?._id || quizData.unitId;
              
              if (quizUnitId && unitsInRequestMap.has(quizUnitId)) {
                const unit = unitsInRequestMap.get(quizUnitId);
                unit.quizzes.push(quizData);
                unitsInRequestMap.set(quizUnitId, unit);
              } else {
                standaloneItems.quizzes.push(quizData);
              }
            } catch (err) {
              console.error(`Error fetching quiz:`, err);
            }
          }
        }
        
        items.units = Array.from(unitsInRequestMap.values());
        items.units.sort((a, b) => (a.unitNumber || 0) - (b.unitNumber || 0));
        items.content = standaloneItems.content;
        items.assignments = standaloneItems.assignments;
        items.quizzes = standaloneItems.quizzes;
        
      } catch (unitError) {
        console.error("Error fetching units:", unitError);
      }
      
      setItemDetails(prev => ({ ...prev, [request._id]: items }));
    } catch (error) {
      console.error("Error fetching detailed items:", error);
      toast.error("Failed to fetch item details");
    } finally {
      setLoadingItems(prev => ({ ...prev, [request._id]: false }));
    }
  };

  const updateItemStatus = async (itemType, itemId, status, comment = "") => {
    try {
      const token = getAuthToken();
      const adminId = localStorage.getItem("adminId");
      const adminName = localStorage.getItem("adminName") || "Admin";
      
      let endpoint = "";
      switch(itemType) {
        case 'unit':
          endpoint = `http://localhost:5000/api/units/${itemId}/status`;
          break;
        case 'content':
          endpoint = `http://localhost:5000/api/content/${itemId}/status`;
          break;
        case 'assignment':
          endpoint = `http://localhost:5000/api/assignments/${itemId}/status`;
          break;
        case 'quiz':
          endpoint = `http://localhost:5000/api/quizzes/${itemId}/status`;
          break;
        default:
          return;
      }
      
      await axios.put(
        endpoint,
        { status, adminFeedback: comment, adminId, adminName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} ${status} successfully`);
      await refreshData();
    } catch (error) {
      console.error(`Error updating ${itemType}:`, error);
      toast.error(`Failed to update ${itemType}`);
    }
  };

  const handleDownloadVideo = async (filename) => {
    try {
      const token = getAuthToken();
      const response = await axios({
        url: `http://localhost:5000/api/content/download/${filename}`,
        method: 'GET',
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Video downloaded successfully");
    } catch (error) {
      console.error("Error downloading video:", error);
      toast.error("Failed to download video");
    }
  };

  const handleDownloadFile = async (filename) => {
    try {
      const token = getAuthToken();
      const response = await axios({
        url: `http://localhost:5000/api/content/download/${filename}`,
        method: 'GET',
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const handleDownloadAssignmentFile = async (filename) => {
    try {
      const token = getAuthToken();
      const response = await axios({
        url: `http://localhost:5000/api/assignments/download/${filename}`,
        method: 'GET',
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const isVideoFile = (videoPath) => {
    if (!videoPath) return false;
    const urlPattern = /^(https?:\/\/|www\.|youtube\.com|youtu\.be)/i;
    return !urlPattern.test(videoPath);
  };

  const bulkApprove = async (requestId, requestName) => {
    const confirmMsg = `Are you sure you want to approve ALL pending items for "${requestName}"?`;
    if (!window.confirm(confirmMsg)) return;
    
    setBulkActionLoading(prev => ({ ...prev, [requestId]: true }));
    
    try {
      const token = getAuthToken();
      const adminId = localStorage.getItem("adminId");
      const adminName = localStorage.getItem("adminName") || "Admin";
      
      const request = requests.find(r => r._id === requestId);
      if (!request) throw new Error("Request not found");
      
      const items = itemDetails[requestId] || { units: [], content: [], assignments: [], quizzes: [] };
      
      let approvedCount = 0;
      let failedCount = 0;
      
      for (const unit of items.units) {
        if (unit.status === 'pending') {
          try {
            await axios.put(
              `http://localhost:5000/api/units/${unit._id}/status`,
              { status: 'approved', adminFeedback: 'Bulk approved', adminId, adminName },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            approvedCount++;
          } catch (err) {
            failedCount++;
          }
        }
      }
      
      const allContent = [...items.content];
      items.units.forEach(unit => {
        allContent.push(...(unit.content || []));
      });
      
      for (const content of allContent) {
        if (content.status === 'pending') {
          try {
            await axios.put(
              `http://localhost:5000/api/content/${content._id}/status`,
              { status: 'approved', adminFeedback: 'Bulk approved', adminId, adminName },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            approvedCount++;
          } catch (err) {
            failedCount++;
          }
        }
      }
      
      const allAssignments = [...items.assignments];
      items.units.forEach(unit => {
        allAssignments.push(...(unit.assignments || []));
      });
      
      for (const assignment of allAssignments) {
        if (assignment.status === 'pending') {
          try {
            await axios.put(
              `http://localhost:5000/api/assignments/${assignment._id}/status`,
              { status: 'approved', adminFeedback: 'Bulk approved', adminId, adminName },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            approvedCount++;
          } catch (err) {
            failedCount++;
          }
        }
      }
      
      const allQuizzes = [...items.quizzes];
      items.units.forEach(unit => {
        allQuizzes.push(...(unit.quizzes || []));
      });
      
      for (const quiz of allQuizzes) {
        if (quiz.status === 'pending') {
          try {
            await axios.put(
              `http://localhost:5000/api/quizzes/${quiz._id}/status`,
              { status: 'approved', adminFeedback: 'Bulk approved', adminId, adminName },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            approvedCount++;
          } catch (err) {
            failedCount++;
          }
        }
      }
      
      await axios.put(
        `http://localhost:5000/api/verification/${requestId}`,
        { status: 'approved', adminFeedback: 'Bulk approved', adminId, adminName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Bulk approval complete! Approved ${approvedCount} items. ${failedCount > 0 ? `Failed: ${failedCount}` : ''}`);
      await refreshData();
      
    } catch (error) {
      console.error("Error in bulk approve:", error);
      toast.error("Failed to complete bulk approval");
    } finally {
      setBulkActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const bulkReject = async (requestId, requestName) => {
    const comment = prompt("Please provide reason for rejection (optional):");
    
    const confirmMsg = `Are you sure you want to reject ALL pending items for "${requestName}"?`;
    if (!window.confirm(confirmMsg)) return;
    
    setBulkActionLoading(prev => ({ ...prev, [requestId]: true }));
    
    try {
      const token = getAuthToken();
      const adminId = localStorage.getItem("adminId");
      const adminName = localStorage.getItem("adminName") || "Admin";
      const adminFeedback = comment || "Bulk rejected";
      
      const request = requests.find(r => r._id === requestId);
      if (!request) throw new Error("Request not found");
      
      const items = itemDetails[requestId] || { units: [], content: [], assignments: [], quizzes: [] };
      
      let rejectedCount = 0;
      let failedCount = 0;
      
      for (const unit of items.units) {
        if (unit.status === 'pending') {
          try {
            await axios.put(
              `http://localhost:5000/api/units/${unit._id}/status`,
              { status: 'rejected', adminFeedback, adminId, adminName },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            rejectedCount++;
          } catch (err) {
            failedCount++;
          }
        }
      }
      
      const allContent = [...items.content];
      items.units.forEach(unit => {
        allContent.push(...(unit.content || []));
      });
      
      for (const content of allContent) {
        if (content.status === 'pending') {
          try {
            await axios.put(
              `http://localhost:5000/api/content/${content._id}/status`,
              { status: 'rejected', adminFeedback, adminId, adminName },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            rejectedCount++;
          } catch (err) {
            failedCount++;
          }
        }
      }
      
      const allAssignments = [...items.assignments];
      items.units.forEach(unit => {
        allAssignments.push(...(unit.assignments || []));
      });
      
      for (const assignment of allAssignments) {
        if (assignment.status === 'pending') {
          try {
            await axios.put(
              `http://localhost:5000/api/assignments/${assignment._id}/status`,
              { status: 'rejected', adminFeedback, adminId, adminName },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            rejectedCount++;
          } catch (err) {
            failedCount++;
          }
        }
      }
      
      const allQuizzes = [...items.quizzes];
      items.units.forEach(unit => {
        allQuizzes.push(...(unit.quizzes || []));
      });
      
      for (const quiz of allQuizzes) {
        if (quiz.status === 'pending') {
          try {
            await axios.put(
              `http://localhost:5000/api/quizzes/${quiz._id}/status`,
              { status: 'rejected', adminFeedback, adminId, adminName },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            rejectedCount++;
          } catch (err) {
            failedCount++;
          }
        }
      }
      
      await axios.put(
        `http://localhost:5000/api/verification/${requestId}`,
        { status: 'rejected', adminFeedback, adminId, adminName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Bulk rejection complete! Rejected ${rejectedCount} items. ${failedCount > 0 ? `Failed: ${failedCount}` : ''}`);
      await refreshData();
      
    } catch (error) {
      console.error("Error in bulk reject:", error);
      toast.error("Failed to complete bulk rejection");
    } finally {
      setBulkActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const calculateStats = (data) => {
    const newStats = {
      total: data.length,
      pending: data.filter(r => r.status === 'pending_review').length,
      approved: data.filter(r => r.status === 'approved').length,
      rejected: data.filter(r => r.status === 'rejected').length,
      changesRequested: data.filter(r => r.status === 'changes_requested').length,
      totalUnits: data.reduce((sum, r) => sum + (r.summary?.totalUnits || 0), 0),
      totalContent: data.reduce((sum, r) => sum + (r.summary?.totalContent || 0), 0),
      totalAssignments: data.reduce((sum, r) => sum + (r.summary?.totalAssignments || 0), 0),
      totalQuizzes: data.reduce((sum, r) => sum + (r.summary?.totalQuizzes || 0), 0)
    };
    setStats(newStats);
  };

  const applyFilters = (data, search, status, date) => {
    let filtered = [...data];
    
    if (search) {
      filtered = filtered.filter(req =>
        req.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
        req.subjectCode?.toLowerCase().includes(search.toLowerCase()) ||
        req.teacherName?.toLowerCase().includes(search.toLowerCase()) ||
        req.teacherEmail?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status !== "all") {
      filtered = filtered.filter(req => req.status === status);
    }
    
    if (date !== "all") {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      
      filtered = filtered.filter(req => {
        const reqDate = new Date(req.requestedAt);
        if (date === "today") return reqDate >= today;
        if (date === "week") return reqDate >= weekAgo;
        if (date === "month") return reqDate >= monthAgo;
        return true;
      });
    }
    
    setFilteredRequests(filtered);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    applyFilters(requests, value, statusFilter, dateFilter);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    applyFilters(requests, searchTerm, value, dateFilter);
  };

  const handleDateFilter = (value) => {
    setDateFilter(value);
    applyFilters(requests, searchTerm, statusFilter, value);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending_review: { icon: <FiClock size={14} />, color: "#D97706", bg: "#FEF3C7", text: "Pending Review" },
      approved: { icon: <FiCheckCircle size={14} />, color: "#059669", bg: "#DCFCE7", text: "Approved" },
      rejected: { icon: <FiXCircle size={14} />, color: "#DC2626", bg: "#FEE2E2", text: "Rejected" },
      changes_requested: { icon: <FiMessageSquare size={14} />, color: "#7C3AED", bg: "#EDE9FE", text: "Changes Requested" }
    };
    const badge = badges[status] || badges.pending_review;
    return (
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        borderRadius: "50px",
        fontSize: "13px",
        fontWeight: "600",
        background: badge.bg,
        color: badge.color,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}>
        {badge.icon}
        {badge.text}
      </div>
    );
  };

  const getItemStatusBadge = (status) => {
    const badges = {
      pending: { color: "#D97706", bg: "#FEF3C7", text: "Pending" },
      approved: { color: "#059669", bg: "#DCFCE7", text: "Approved" },
      rejected: { color: "#DC2626", bg: "#FEE2E2", text: "Rejected" }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span style={{
        padding: "2px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "500",
        background: badge.bg,
        color: badge.color
      }}>
        {badge.text}
      </span>
    );
  };

  const toggleUnit = (requestId, unitId) => {
    setExpandedUnits(prev => ({
      ...prev,
      [`${requestId}-${unitId}`]: !prev[`${requestId}-${unitId}`]
    }));
  };

  const isUnitExpanded = (requestId, unitId) => {
    return expandedUnits[`${requestId}-${unitId}`] === true;
  };

  const toggleSection = (requestId, section) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${requestId}-${section}`]: !prev[`${requestId}-${section}`]
    }));
  };

  const isSectionExpanded = (requestId, section) => {
    return expandedSections[`${requestId}-${section}`] !== false;
  };

  const exportToCSV = () => {
    const csvData = filteredRequests.map(req => ({
      'Subject': req.subjectName,
      'Code': req.subjectCode,
      'Teacher': req.teacherName,
      'Email': req.teacherEmail,
      'Status': req.status,
      'Units': req.summary?.totalUnits || 0,
      'Content': req.summary?.totalContent || 0,
      'Assignments': req.summary?.totalAssignments || 0,
      'Quizzes': req.summary?.totalQuizzes || 0,
      'Submitted': new Date(req.requestedAt).toLocaleDateString(),
      'Reviewed': req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : '-'
    }));
    
    const headers = Object.keys(csvData[0]);
    const csvRows = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => JSON.stringify(row[h])).join(','))
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification_requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Report exported successfully");
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#F8FAFC"
      }}>
        <div style={{
          width: "50px",
          height: "50px",
          border: "3px solid #F1F5F9",
          borderTop: "3px solid #0B2A4A",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
      </div>
    );
  }

  const styles = {
    container: {
      padding: "28px",
      background: "#F8FAFC",
      minHeight: "100vh",
      fontFamily: "'Inter', sans-serif"
    },
    header: {
      marginBottom: "28px"
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
      color: "#64748B"
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "20px",
      marginBottom: "28px"
    },
    statCard: {
      background: "white",
      borderRadius: "20px",
      padding: "20px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
      border: "1px solid #E5E9F0",
      transition: "all 0.3s ease",
      cursor: "pointer"
    },
    statHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px"
    },
    statLabel: {
      fontSize: "13px",
      fontWeight: "500",
      color: "#64748B",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    statValue: {
      fontSize: "32px",
      fontWeight: "700",
      color: "#0B2A4A",
      marginBottom: "8px"
    },
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
      minWidth: "250px",
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
      fontSize: "14px"
    },
    filterSelect: {
      padding: "10px 16px",
      background: "#F8FAFC",
      borderRadius: "12px",
      border: "1px solid #E5E9F0",
      fontSize: "14px",
      cursor: "pointer",
      outline: "none"
    },
    exportBtn: {
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
      transition: "all 0.3s ease"
    },
    refreshBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 20px",
      background: "white",
      color: "#0B2A4A",
      border: "1px solid #E5E9F0",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.3s ease"
    },
    bulkApproveBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      background: "#059669",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.3s ease"
    },
    bulkRejectBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      background: "#DC2626",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.3s ease"
    },
    requestsGrid: {
      display: "grid",
      gap: "24px"
    },
    requestCard: {
      background: "white",
      borderRadius: "20px",
      padding: "24px",
      border: "1px solid #E5E9F0",
      transition: "all 0.3s ease"
    },
    requestHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "20px",
      flexWrap: "wrap",
      gap: "12px"
    },
    subjectInfo: {
      flex: 1
    },
    subjectName: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#0B2A4A",
      marginBottom: "8px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      flexWrap: "wrap"
    },
    subjectCode: {
      background: "#F1F5F9",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      color: "#475569"
    },
    teacherInfo: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
      color: "#64748B",
      marginTop: "6px"
    },
    requestMeta: {
      display: "flex",
      gap: "16px",
      fontSize: "12px",
      color: "#94A3B8",
      marginTop: "8px"
    },
    bulkActions: {
      display: "flex",
      gap: "12px",
      marginBottom: "20px",
      paddingBottom: "16px",
      borderBottom: "1px solid #E5E9F0"
    },
    unitCard: {
      marginBottom: "20px",
      border: "1px solid #E5E9F0",
      borderRadius: "16px",
      overflow: "hidden"
    },
    unitHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
      background: "#F8FAFC",
      cursor: "pointer",
      transition: "all 0.2s ease"
    },
    unitTitle: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "16px",
      fontWeight: "600",
      color: "#0B2A4A"
    },
    unitContent: {
      padding: "20px",
      borderTop: "1px solid #E5E9F0"
    },
    sectionCard: {
      marginBottom: "16px",
      border: "1px solid #E5E9F0",
      borderRadius: "12px",
      overflow: "hidden"
    },
    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 16px",
      background: "#F8FAFC",
      cursor: "pointer",
      transition: "all 0.2s ease"
    },
    sectionTitle: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
      fontWeight: "600",
      color: "#0B2A4A"
    },
    sectionContent: {
      padding: "16px"
    },
    itemCard: {
      background: "white",
      border: "1px solid #E5E9F0",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "12px",
      transition: "all 0.2s ease"
    },
    itemHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "12px",
      flexWrap: "wrap",
      gap: "12px"
    },
    itemTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#0B2A4A",
      marginBottom: "4px"
    },
    itemDescription: {
      fontSize: "13px",
      color: "#64748B",
      marginTop: "6px",
      lineHeight: "1.5",
      background: "#F8FAFC",
      padding: "10px",
      borderRadius: "8px"
    },
    itemDetails: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px",
      marginTop: "12px",
      padding: "12px",
      background: "#F8FAFC",
      borderRadius: "8px"
    },
    detailRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      color: "#475569",
      padding: "6px 0"
    },
    detailLink: {
      color: "#2563EB",
      textDecoration: "none",
      wordBreak: "break-all"
    },
    filesList: {
      marginTop: "12px",
      padding: "12px",
      background: "#F8FAFC",
      borderRadius: "8px"
    },
    fileItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px",
      borderBottom: "1px solid #E5E9F0"
    },
    fileName: {
      fontSize: "13px",
      color: "#475569",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    itemActions: {
      display: "flex",
      gap: "10px",
      marginTop: "12px"
    },
    actionButton: (color, bgColor) => ({
      padding: "6px 14px",
      borderRadius: "8px",
      border: "none",
      fontSize: "12px",
      fontWeight: "500",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      background: bgColor,
      color: color,
      transition: "all 0.2s ease"
    }),
    disabledActionButton: (color, bgColor) => ({
      padding: "6px 14px",
      borderRadius: "8px",
      border: "none",
      fontSize: "12px",
      fontWeight: "500",
      opacity: 0.6,
      cursor: "not-allowed",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      background: bgColor,
      color: color
    }),
    noItemsMessage: {
      textAlign: "center",
      padding: "40px",
      color: "#94A3B8",
      fontSize: "14px"
    },
    summaryStats: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "12px",
      marginBottom: "20px",
      padding: "16px",
      background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
      borderRadius: "12px"
    },
    summaryItem: {
      textAlign: "center"
    },
    summaryValue: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#0B2A4A"
    },
    summaryLabel: {
      fontSize: "11px",
      color: "#64748B",
      marginTop: "4px"
    },
    videoDownloadBtn: {
      background: "#2563EB",
      color: "white",
      border: "none",
      padding: "4px 12px",
      borderRadius: "6px",
      fontSize: "12px",
      cursor: "pointer",
      marginLeft: "8px",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      transition: "all 0.2s ease"
    },
    nestedItemCard: {
      background: "#F8FAFC",
      borderRadius: "10px",
      padding: "12px",
      marginBottom: "12px",
      border: "1px solid #E5E9F0"
    },
    nestedItemTitle: {
      fontWeight: "600",
      fontSize: "14px",
      color: "#0B2A4A",
      marginBottom: "8px"
    },
    nestedItemDescription: {
      fontSize: "12px",
      color: "#64748B",
      marginBottom: "8px"
    },
    sectionSubheader: {
      fontSize: "13px",
      fontWeight: "600",
      marginBottom: "12px",
      color: "#0B2A4A"
    }
  };

  return (
    <div style={styles.container}>
      <ToastContainer position="top-right" theme="colored" />
      
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <FiShield size={32} color="#0B2A4A" />
          Content Verification Dashboard
          <button
            onClick={() => setShowStatsModal(true)}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <FiBarChart2 size={16} />
            Analytics
          </button>
        </div>
        <div style={styles.headerSubtitle}>
          Review and manage teacher content verification requests
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard} onClick={() => handleStatusFilter("pending_review")}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Pending Review</span>
            <FiClock size={22} color="#D97706" />
          </div>
          <div style={styles.statValue}>{stats.pending}</div>
          <div style={{ fontSize: "12px", color: "#D97706" }}>Awaiting Approval</div>
        </div>
        
        <div style={styles.statCard} onClick={() => handleStatusFilter("approved")}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Approved</span>
            <FiCheckCircle size={22} color="#059669" />
          </div>
          <div style={styles.statValue}>{stats.approved}</div>
          <div style={{ fontSize: "12px", color: "#059669" }}>Content Published</div>
        </div>
        
        <div style={styles.statCard} onClick={() => handleStatusFilter("rejected")}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Rejected</span>
            <FiXCircle size={22} color="#DC2626" />
          </div>
          <div style={styles.statValue}>{stats.rejected}</div>
          <div style={{ fontSize: "12px", color: "#DC2626" }}>Needs Revision</div>
        </div>
        
        <div style={styles.statCard} onClick={() => handleStatusFilter("changes_requested")}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Changes Requested</span>
            <FiMessageSquare size={22} color="#7C3AED" />
          </div>
          <div style={styles.statValue}>{stats.changesRequested}</div>
          <div style={{ fontSize: "12px", color: "#7C3AED" }}>Action Required</div>
        </div>
      </div>

      <div style={{ ...styles.statsGrid, marginTop: "10px" }}>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Total Units</span>
            <FiFolder size={22} color="#0B2A4A" />
          </div>
          <div style={styles.statValue}>{stats.totalUnits}</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Total Content</span>
            <FiFileText size={22} color="#D97706" />
          </div>
          <div style={styles.statValue}>{stats.totalContent}</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Total Assignments</span>
            <FiClipboard size={22} color="#7C3AED" />
          </div>
          <div style={styles.statValue}>{stats.totalAssignments}</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <span style={styles.statLabel}>Total Quizzes</span>
            <FiHelpCircle size={22} color="#059669" />
          </div>
          <div style={styles.statValue}>{stats.totalQuizzes}</div>
        </div>
      </div>

      <div style={styles.filtersSection}>
        <div style={styles.searchBox}>
          <FiSearch color="#94A3B8" size={18} />
          <input
            style={styles.searchInput}
            placeholder="Search by subject, teacher, or email..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <select style={styles.filterSelect} value={statusFilter} onChange={(e) => handleStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="changes_requested">Changes Requested</option>
        </select>
        <select style={styles.filterSelect} value={dateFilter} onChange={(e) => handleDateFilter(e.target.value)}>
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
        <button style={styles.exportBtn} onClick={exportToCSV}>
          <FiDownload size={16} />
          Export Report
        </button>
        <button 
          style={{
            ...styles.refreshBtn,
            opacity: refreshing ? 0.7 : 1,
            cursor: refreshing ? "not-allowed" : "pointer"
          }}
          onClick={refreshData}
          disabled={refreshing}
        >
          <FiRefreshCw size={16} className={refreshing ? "spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={styles.requestsGrid}>
        {filteredRequests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "20px" }}>
            <FiShield size={48} color="#94A3B8" />
            <h3 style={{ marginTop: "16px", color: "#0B2A4A" }}>No Verification Requests</h3>
            <p style={{ color: "#64748B" }}>All caught up! No pending verification requests.</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const items = itemDetails[request._id] || { units: [], content: [], assignments: [], quizzes: [] };
            const isLoading = loadingItems[request._id];
            const summary = request.summary || {};
            const isBulkLoading = bulkActionLoading[request._id];
            
            let pendingUnitCount = 0;
            let pendingContentCount = 0;
            let pendingAssignmentCount = 0;
            let pendingQuizCount = 0;
            
            items.units.forEach(unit => {
              if (unit.status === 'pending') pendingUnitCount++;
              if (unit.content) pendingContentCount += unit.content.filter(c => c.status === 'pending').length;
              if (unit.assignments) pendingAssignmentCount += unit.assignments.filter(a => a.status === 'pending').length;
              if (unit.quizzes) pendingQuizCount += unit.quizzes.filter(q => q.status === 'pending').length;
            });
            pendingContentCount += items.content.filter(c => c.status === 'pending').length;
            pendingAssignmentCount += items.assignments.filter(a => a.status === 'pending').length;
            pendingQuizCount += items.quizzes.filter(q => q.status === 'pending').length;
            
            const totalPending = pendingUnitCount + pendingContentCount + pendingAssignmentCount + pendingQuizCount;
            
            return (
              <div key={request._id} style={styles.requestCard}>
                <div style={styles.requestHeader}>
                  <div style={styles.subjectInfo}>
                    <div style={styles.subjectName}>
                      {request.subjectName}
                      <span style={styles.subjectCode}>{request.subjectCode}</span>
                    </div>
                    <div style={styles.teacherInfo}>
                      <FiUser size={14} />
                      <span>{request.teacherName}</span>
                      <span>•</span>
                      <span>{request.teacherEmail}</span>
                    </div>
                    <div style={styles.requestMeta}>
                      <FiCalendar size={12} />
                      <span>Submitted: {new Date(request.requestedAt).toLocaleString()}</span>
                      {request.reviewedAt && (
                        <>
                          <FiCheck size={12} />
                          <span>Reviewed: {new Date(request.reviewedAt).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                {request.status === 'pending_review' && totalPending > 0 && (
                  <div style={styles.bulkActions}>
                    <button
                      style={styles.bulkApproveBtn}
                      onClick={() => bulkApprove(request._id, request.subjectName)}
                      disabled={isBulkLoading}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <FiCheckCircle size={16} />
                      {isBulkLoading ? "Processing..." : `Approve All (${totalPending})`}
                    </button>
                    <button
                      style={styles.bulkRejectBtn}
                      onClick={() => bulkReject(request._id, request.subjectName)}
                      disabled={isBulkLoading}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <FiXCircle size={16} />
                      {isBulkLoading ? "Processing..." : `Reject All (${totalPending})`}
                    </button>
                  </div>
                )}

                <div style={styles.summaryStats}>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryValue}>{summary.totalUnits || 0}</div>
                    <div style={styles.summaryLabel}>Units</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryValue}>{summary.totalContent || 0}</div>
                    <div style={styles.summaryLabel}>Content</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryValue}>{summary.totalAssignments || 0}</div>
                    <div style={styles.summaryLabel}>Assignments</div>
                  </div>
                  <div style={styles.summaryItem}>
                    <div style={styles.summaryValue}>{summary.totalQuizzes || 0}</div>
                    <div style={styles.summaryLabel}>Quizzes</div>
                  </div>
                </div>

                {isLoading ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ width: "30px", height: "30px", border: "2px solid #F1F5F9", borderTop: "2px solid #0B2A4A", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }}></div>
                    <p style={{ marginTop: "12px", color: "#64748B" }}>Loading items...</p>
                  </div>
                ) : (
                  <>
                    {items.units && items.units.length > 0 && (
                      <div>
                        {items.units.map((unit, idx) => {
                          const contentCount = unit.content?.length || 0;
                          const assignmentCount = unit.assignments?.length || 0;
                          const quizCount = unit.quizzes?.length || 0;
                          const hasAnyItems = contentCount > 0 || assignmentCount > 0 || quizCount > 0;
                          
                          return (
                            <div key={idx} style={styles.unitCard}>
                              <div style={styles.unitHeader} onClick={() => toggleUnit(request._id, unit._id)}>
                                <div style={styles.unitTitle}>
                                  <FiFolder size={18} color="#0B2A4A" />
                                  <span>Unit {unit.unitNumber}: {unit.unitTitle}</span>
                                  <span style={{ fontSize: "12px", color: "#64748B", marginLeft: "8px" }}>
                                    ({contentCount} content, {assignmentCount} assignments, {quizCount} quizzes)
                                  </span>
                                </div>
                                {isUnitExpanded(request._id, unit._id) ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                              </div>
                              
                              {isUnitExpanded(request._id, unit._id) && (
                                <div style={styles.unitContent}>
                                  {unit.description && (
                                    <div style={{ marginBottom: "16px", padding: "12px", background: "#F8FAFC", borderRadius: "8px", fontSize: "14px", color: "#475569" }}>
                                      <strong>Description:</strong> {unit.description}
                                    </div>
                                  )}
                                  
                                  {unit.status === 'pending' && (
                                    <div style={{ ...styles.itemActions, marginBottom: "16px" }}>
                                      <button style={styles.actionButton("#059669", "#DCFCE7")} onClick={() => updateItemStatus('unit', unit._id, 'approved', adminComment)}>
                                        <FiCheckCircle size={14} /> Approve Unit
                                      </button>
                                      <button style={styles.actionButton("#DC2626", "#FEE2E2")} onClick={() => {
                                        const comment = prompt("Please provide reason for rejection:");
                                        if (comment) updateItemStatus('unit', unit._id, 'rejected', comment);
                                      }}>
                                        <FiXCircle size={14} /> Reject Unit
                                      </button>
                                    </div>
                                  )}
                                  
                                  {contentCount > 0 && (
                                    <div style={styles.sectionCard}>
                                      <div style={styles.sectionHeader} onClick={() => toggleSection(request._id, `unit-${unit._id}-content`)}>
                                        <div style={styles.sectionTitle}>
                                          <FiFileText size={16} color="#D97706" />
                                          <span>Content ({contentCount})</span>
                                        </div>
                                        {isSectionExpanded(request._id, `unit-${unit._id}-content`) ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                                      </div>
                                      {isSectionExpanded(request._id, `unit-${unit._id}-content`) && (
                                        <div style={styles.sectionContent}>
                                          {unit.content.map((content, cIdx) => (
                                            <div key={cIdx} style={styles.itemCard}>
                                              <div style={styles.itemHeader}>
                                                <div>
                                                  {/* Display Topic (main heading) */}
                                                  <div style={styles.itemTitle}>{content.topic}</div>
                                                  {content.description && (
                                                    <div style={styles.itemDescription}>
                                                      {content.description}
                                                    </div>
                                                  )}
                                                </div>
                                                {getItemStatusBadge(content.status)}
                                              </div>

                                              {/* Display nested items (title, video, duration, description for each item) */}
                                              {content.items && content.items.length > 0 && (
                                                <div style={{ marginTop: "16px" }}>
                                                  <div style={styles.sectionSubheader}>
                                                    Content Items ({content.items.length})
                                                  </div>
                                                  {content.items.map((item, itemIdx) => (
                                                    <div key={itemIdx} style={styles.nestedItemCard}>
                                                      {/* Item Title */}
                                                      <div style={styles.nestedItemTitle}>
                                                        {item.title || `Item ${itemIdx + 1}`}
                                                      </div>
                                                      
                                                      {/* Item Description */}
                                                      {item.description && (
                                                        <div style={styles.nestedItemDescription}>
                                                          {item.description}
                                                        </div>
                                                      )}
                                                      
                                                      {/* Item Video */}
                                                      {item.video && (
                                                        <div style={styles.detailRow}>
                                                          <FiVideo size={14} />
                                                          {isVideoFile(item.video) ? (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                                              <span>Video File: {item.video}</span>
                                                              <button
                                                                onClick={() => handleDownloadVideo(item.video)}
                                                                style={styles.videoDownloadBtn}
                                                              >
                                                                <FiDownload size={12} /> Download Video
                                                              </button>
                                                            </div>
                                                          ) : (
                                                            <a href={item.video} target="_blank" rel="noopener noreferrer" style={styles.detailLink}>
                                                              Watch Video
                                                            </a>
                                                          )}
                                                        </div>
                                                      )}
                                                      
                                                      {/* Item Duration */}
                                                      {item.duration > 0 && (
                                                        <div style={styles.detailRow}>
                                                          <FiClockIcon size={14} />
                                                          <span>Duration: {item.duration} minutes</span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}

                                              {/* Root level files (if any) */}
                                              {content.files && content.files.length > 0 && (
                                                <div style={styles.filesList}>
                                                  <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "#475569" }}>
                                                    Attached Files ({content.files.length})
                                                  </div>
                                                  {content.files.map((file, fIdx) => (
                                                    <div key={fIdx} style={styles.fileItem}>
                                                      <div style={styles.fileName}>
                                                        <FiFile size={14} />
                                                        <span>{file.originalName}</span>
                                                      </div>
                                                      <button
                                                        onClick={() => handleDownloadFile(file.filename)}
                                                        style={styles.actionButton("#0B2A4A", "#E8F0FE")}
                                                      >
                                                        <FiDownload size={12} /> Download
                                                      </button>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                              
                                              {/* Root level video (legacy support) */}
                                              {content.video && (!content.items || content.items.length === 0) && (
                                                <div style={styles.itemDetails}>
                                                  <div style={styles.detailRow}>
                                                    <FiVideo size={14} />
                                                    {isVideoFile(content.video) ? (
                                                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                                        <span>Video File: {content.video}</span>
                                                        <button
                                                          onClick={() => handleDownloadVideo(content.video)}
                                                          style={styles.videoDownloadBtn}
                                                        >
                                                          <FiDownload size={12} /> Download Video
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <a href={content.video} target="_blank" rel="noopener noreferrer" style={styles.detailLink}>
                                                        Watch Video
                                                      </a>
                                                    )}
                                                  </div>
                                                  {content.duration > 0 && (
                                                    <div style={styles.detailRow}>
                                                      <FiClockIcon size={14} />
                                                      <span>Duration: {content.duration} minutes</span>
                                                    </div>
                                                  )}
                                                </div>
                                              )}

                                              {content.status === 'pending' && (
                                                <div style={styles.itemActions}>
                                                  <button style={styles.actionButton("#059669", "#DCFCE7")} onClick={() => updateItemStatus('content', content._id, 'approved', adminComment)}>
                                                    <FiCheckCircle size={14} /> Approve
                                                  </button>
                                                  <button style={styles.actionButton("#DC2626", "#FEE2E2")} onClick={() => {
                                                    const comment = prompt("Please provide reason for rejection:");
                                                    if (comment) updateItemStatus('content', content._id, 'rejected', comment);
                                                  }}>
                                                    <FiXCircle size={14} /> Reject
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {assignmentCount > 0 && (
                                    <div style={styles.sectionCard}>
                                      <div style={styles.sectionHeader} onClick={() => toggleSection(request._id, `unit-${unit._id}-assignments`)}>
                                        <div style={styles.sectionTitle}>
                                          <FiClipboard size={16} color="#7C3AED" />
                                          <span>Assignments ({assignmentCount})</span>
                                        </div>
                                        {isSectionExpanded(request._id, `unit-${unit._id}-assignments`) ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                                      </div>
                                      {isSectionExpanded(request._id, `unit-${unit._id}-assignments`) && (
                                        <div style={styles.sectionContent}>
                                          {unit.assignments.map((assignment, aIdx) => (
                                            <div key={aIdx} style={styles.itemCard}>
                                              <div style={styles.itemHeader}>
                                                <div>
                                                  <div style={styles.itemTitle}>{assignment.title}</div>
                                                  {assignment.description && (
                                                    <div style={styles.itemDescription}>
                                                      {assignment.description}
                                                    </div>
                                                  )}
                                                </div>
                                                {getItemStatusBadge(assignment.status)}
                                              </div>
                                              
                                              <div style={styles.itemDetails}>
                                                <div style={styles.detailRow}>
                                                  <FiAward size={14} />
                                                  <span>Total Marks: {assignment.totalMarks}</span>
                                                </div>
                                                <div style={styles.detailRow}>
                                                  <FiCalendar size={14} />
                                                  <span>Deadline: {new Date(assignment.deadline).toLocaleDateString()}</span>
                                                </div>
                                              </div>
                                              
                                              {assignment.assignmentFile && (
                                                <div style={styles.filesList}>
                                                  <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "#475569" }}>
                                                    Assignment File
                                                  </div>
                                                  <div style={styles.fileItem}>
                                                    <div style={styles.fileName}>
                                                      <FiFile size={14} />
                                                      <span>{assignment.assignmentFile.originalName}</span>
                                                    </div>
                                                    <button
                                                      onClick={() => handleDownloadAssignmentFile(assignment.assignmentFile.filename)}
                                                      style={styles.actionButton("#0B2A4A", "#E8F0FE")}
                                                    >
                                                      <FiDownload size={12} /> Download
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                              
                                              {assignment.status === 'pending' && (
                                                <div style={styles.itemActions}>
                                                  <button style={styles.actionButton("#059669", "#DCFCE7")} onClick={() => updateItemStatus('assignment', assignment._id, 'approved', adminComment)}>
                                                    <FiCheckCircle size={14} /> Approve
                                                  </button>
                                                  <button style={styles.actionButton("#DC2626", "#FEE2E2")} onClick={() => {
                                                    const comment = prompt("Please provide reason for rejection:");
                                                    if (comment) updateItemStatus('assignment', assignment._id, 'rejected', comment);
                                                  }}>
                                                    <FiXCircle size={14} /> Reject
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {quizCount > 0 && (
                                    <div style={styles.sectionCard}>
                                      <div style={styles.sectionHeader} onClick={() => toggleSection(request._id, `unit-${unit._id}-quizzes`)}>
                                        <div style={styles.sectionTitle}>
                                          <FiHelpCircle size={16} color="#059669" />
                                          <span>Quizzes ({quizCount})</span>
                                        </div>
                                        {isSectionExpanded(request._id, `unit-${unit._id}-quizzes`) ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                                      </div>
                                      {isSectionExpanded(request._id, `unit-${unit._id}-quizzes`) && (
                                        <div style={styles.sectionContent}>
                                          {unit.quizzes.map((quiz, qIdx) => (
                                            <div key={qIdx} style={styles.itemCard}>
                                              <div style={styles.itemHeader}>
                                                <div>
                                                  <div style={styles.itemTitle}>Quiz {qIdx + 1}</div>
                                                  <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                                                    {quiz.questions?.length || 0} questions
                                                  </div>
                                                </div>
                                                {getItemStatusBadge(quiz.status)}
                                              </div>
                                              
                                              <div style={styles.itemDetails}>
                                                <div style={styles.detailRow}>
                                                  <FiAward size={14} />
                                                  <span>Total Marks: {quiz.totalMarks}</span>
                                                </div>
                                                <div style={styles.detailRow}>
                                                  <FiClockIcon size={14} />
                                                  <span>Duration: {quiz.duration} minutes</span>
                                                </div>
                                              </div>
                                              
                                              {quiz.questions && quiz.questions.length > 0 && (
                                                <details style={{ marginTop: "12px" }}>
                                                  <summary style={{ fontSize: "13px", fontWeight: "500", cursor: "pointer", color: "#0B2A4A" }}>
                                                    View Questions ({quiz.questions.length})
                                                  </summary>
                                                  <div style={{ marginTop: "8px" }}>
                                                    {quiz.questions.map((q, qsIdx) => (
                                                      <div key={qsIdx} style={{ padding: "8px", background: "#F8FAFC", borderRadius: "8px", marginBottom: "6px", fontSize: "12px" }}>
                                                        <strong>Q{qsIdx + 1}:</strong> {q.question}
                                                        <div style={{ marginTop: "4px", color: "#64748B" }}>Marks: {q.marks}</div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </details>
                                              )}
                                              
                                              {quiz.status === 'pending' && (
                                                <div style={styles.itemActions}>
                                                  <button style={styles.actionButton("#059669", "#DCFCE7")} onClick={() => updateItemStatus('quiz', quiz._id, 'approved', adminComment)}>
                                                    <FiCheckCircle size={14} /> Approve
                                                  </button>
                                                  <button style={styles.actionButton("#DC2626", "#FEE2E2")} onClick={() => {
                                                    const comment = prompt("Please provide reason for rejection:");
                                                    if (comment) updateItemStatus('quiz', quiz._id, 'rejected', comment);
                                                  }}>
                                                    <FiXCircle size={14} /> Reject
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {!hasAnyItems && (
                                    <div style={styles.noItemsMessage}>
                                      <FiInfo size={24} />
                                      <p style={{ marginTop: "8px" }}>No content, assignments, or quizzes in this unit</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {items.content && items.content.length > 0 && (
                      <div style={styles.sectionCard}>
                        <div style={styles.sectionHeader} onClick={() => toggleSection(request._id, 'standalone-content')}>
                          <div style={styles.sectionTitle}>
                            <FiFileText size={18} color="#D97706" />
                            <span>Standalone Content ({items.content.length})</span>
                          </div>
                          {isSectionExpanded(request._id, 'standalone-content') ? <FiChevronUp /> : <FiChevronDown />}
                        </div>
                        {isSectionExpanded(request._id, 'standalone-content') && (
                          <div style={styles.sectionContent}>
                            {items.content.map((content, idx) => (
                              <div key={idx} style={styles.itemCard}>
                                <div style={styles.itemHeader}>
                                  <div>
                                    {/* Display Topic (main heading) */}
                                    <div style={styles.itemTitle}>{content.topic}</div>
                                    {content.description && (
                                      <div style={styles.itemDescription}>
                                        {content.description}
                                      </div>
                                    )}
                                  </div>
                                  {getItemStatusBadge(content.status)}
                                </div>

                                {/* Display nested items (title, video, duration, description for each item) */}
                                {content.items && content.items.length > 0 && (
                                  <div style={{ marginTop: "16px" }}>
                                    <div style={styles.sectionSubheader}>
                                      Content Items ({content.items.length})
                                    </div>
                                    {content.items.map((item, itemIdx) => (
                                      <div key={itemIdx} style={styles.nestedItemCard}>
                                        {/* Item Title */}
                                        <div style={styles.nestedItemTitle}>
                                          {item.title || `Item ${itemIdx + 1}`}
                                        </div>
                                        
                                        {/* Item Description */}
                                        {item.description && (
                                          <div style={styles.nestedItemDescription}>
                                            {item.description}
                                          </div>
                                        )}
                                        
                                        {/* Item Video */}
                                        {item.video && (
                                          <div style={styles.detailRow}>
                                            <FiVideo size={14} />
                                            {isVideoFile(item.video) ? (
                                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                                <span>Video File: {item.video}</span>
                                                <button
                                                  onClick={() => handleDownloadVideo(item.video)}
                                                  style={styles.videoDownloadBtn}
                                                >
                                                  <FiDownload size={12} /> Download Video
                                                </button>
                                              </div>
                                            ) : (
                                              <a href={item.video} target="_blank" rel="noopener noreferrer" style={styles.detailLink}>
                                                Watch Video
                                              </a>
                                            )}
                                          </div>
                                        )}
                                        
                                        {/* Item Duration */}
                                        {item.duration > 0 && (
                                          <div style={styles.detailRow}>
                                            <FiClockIcon size={14} />
                                            <span>Duration: {item.duration} minutes</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Root level files */}
                                {content.files && content.files.length > 0 && (
                                  <div style={styles.filesList}>
                                    <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "#475569" }}>
                                      Attached Files ({content.files.length})
                                    </div>
                                    {content.files.map((file, fIdx) => (
                                      <div key={fIdx} style={styles.fileItem}>
                                        <div style={styles.fileName}>
                                          <FiFile size={14} />
                                          <span>{file.originalName}</span>
                                        </div>
                                        <button
                                          onClick={() => handleDownloadFile(file.filename)}
                                          style={styles.actionButton("#0B2A4A", "#E8F0FE")}
                                        >
                                          <FiDownload size={12} /> Download
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Root level video (legacy support) */}
                                {content.video && (!content.items || content.items.length === 0) && (
                                  <div style={styles.itemDetails}>
                                    <div style={styles.detailRow}>
                                      <FiVideo size={14} />
                                      {isVideoFile(content.video) ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                          <span>Video File: {content.video}</span>
                                          <button
                                            onClick={() => handleDownloadVideo(content.video)}
                                            style={styles.videoDownloadBtn}
                                          >
                                            <FiDownload size={12} /> Download Video
                                          </button>
                                        </div>
                                      ) : (
                                        <a href={content.video} target="_blank" rel="noopener noreferrer" style={styles.detailLink}>
                                          Watch Video
                                        </a>
                                      )}
                                    </div>
                                    {content.duration > 0 && (
                                      <div style={styles.detailRow}>
                                        <FiClockIcon size={14} />
                                        <span>Duration: {content.duration} minutes</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {content.status === 'pending' && (
                                  <div style={styles.itemActions}>
                                    <button style={styles.actionButton("#059669", "#DCFCE7")} onClick={() => updateItemStatus('content', content._id, 'approved', adminComment)}>
                                      <FiCheckCircle size={14} /> Approve
                                    </button>
                                    <button style={styles.actionButton("#DC2626", "#FEE2E2")} onClick={() => {
                                      const comment = prompt("Please provide reason for rejection:");
                                      if (comment) updateItemStatus('content', content._id, 'rejected', comment);
                                    }}>
                                      <FiXCircle size={14} /> Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {items.assignments && items.assignments.length > 0 && (
                      <div style={styles.sectionCard}>
                        <div style={styles.sectionHeader} onClick={() => toggleSection(request._id, 'standalone-assignments')}>
                          <div style={styles.sectionTitle}>
                            <FiClipboard size={18} color="#7C3AED" />
                            <span>Standalone Assignments ({items.assignments.length})</span>
                          </div>
                          {isSectionExpanded(request._id, 'standalone-assignments') ? <FiChevronUp /> : <FiChevronDown />}
                        </div>
                        {isSectionExpanded(request._id, 'standalone-assignments') && (
                          <div style={styles.sectionContent}>
                            {items.assignments.map((assignment, idx) => (
                              <div key={idx} style={styles.itemCard}>
                                <div style={styles.itemHeader}>
                                  <div>
                                    <div style={styles.itemTitle}>{assignment.title}</div>
                                    {assignment.description && (
                                      <div style={styles.itemDescription}>
                                        {assignment.description}
                                      </div>
                                    )}
                                  </div>
                                  {getItemStatusBadge(assignment.status)}
                                </div>
                                
                                <div style={styles.itemDetails}>
                                  <div style={styles.detailRow}>
                                    <FiAward size={14} />
                                    <span>Total Marks: {assignment.totalMarks}</span>
                                  </div>
                                  <div style={styles.detailRow}>
                                    <FiCalendar size={14} />
                                    <span>Deadline: {new Date(assignment.deadline).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                
                                {assignment.assignmentFile && (
                                  <div style={styles.filesList}>
                                    <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "#475569" }}>
                                      Assignment File
                                    </div>
                                    <div style={styles.fileItem}>
                                      <div style={styles.fileName}>
                                        <FiFile size={14} />
                                        <span>{assignment.assignmentFile.originalName}</span>
                                      </div>
                                      <button
                                        onClick={() => handleDownloadAssignmentFile(assignment.assignmentFile.filename)}
                                        style={styles.actionButton("#0B2A4A", "#E8F0FE")}
                                      >
                                        <FiDownload size={12} /> Download
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
                                {assignment.status === 'pending' && (
                                  <div style={styles.itemActions}>
                                    <button style={styles.actionButton("#059669", "#DCFCE7")} onClick={() => updateItemStatus('assignment', assignment._id, 'approved', adminComment)}>
                                      <FiCheckCircle size={14} /> Approve
                                    </button>
                                    <button style={styles.actionButton("#DC2626", "#FEE2E2")} onClick={() => {
                                      const comment = prompt("Please provide reason for rejection:");
                                      if (comment) updateItemStatus('assignment', assignment._id, 'rejected', comment);
                                    }}>
                                      <FiXCircle size={14} /> Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {items.quizzes && items.quizzes.length > 0 && (
                      <div style={styles.sectionCard}>
                        <div style={styles.sectionHeader} onClick={() => toggleSection(request._id, 'standalone-quizzes')}>
                          <div style={styles.sectionTitle}>
                            <FiHelpCircle size={18} color="#059669" />
                            <span>Standalone Quizzes ({items.quizzes.length})</span>
                          </div>
                          {isSectionExpanded(request._id, 'standalone-quizzes') ? <FiChevronUp /> : <FiChevronDown />}
                        </div>
                        {isSectionExpanded(request._id, 'standalone-quizzes') && (
                          <div style={styles.sectionContent}>
                            {items.quizzes.map((quiz, idx) => (
                              <div key={idx} style={styles.itemCard}>
                                <div style={styles.itemHeader}>
                                  <div>
                                    <div style={styles.itemTitle}>Quiz {idx + 1}</div>
                                    <div style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>
                                      {quiz.questions?.length || 0} questions
                                    </div>
                                  </div>
                                  {getItemStatusBadge(quiz.status)}
                                </div>
                                
                                <div style={styles.itemDetails}>
                                  <div style={styles.detailRow}>
                                    <FiAward size={14} />
                                    <span>Total Marks: {quiz.totalMarks}</span>
                                  </div>
                                  <div style={styles.detailRow}>
                                    <FiClockIcon size={14} />
                                    <span>Duration: {quiz.duration} minutes</span>
                                  </div>
                                </div>
                                
                                {quiz.questions && quiz.questions.length > 0 && (
                                  <details style={{ marginTop: "12px" }}>
                                    <summary style={{ fontSize: "13px", fontWeight: "500", cursor: "pointer", color: "#0B2A4A" }}>
                                      View Questions ({quiz.questions.length})
                                    </summary>
                                    <div style={{ marginTop: "8px" }}>
                                      {quiz.questions.map((q, qsIdx) => (
                                        <div key={qsIdx} style={{ padding: "8px", background: "#F8FAFC", borderRadius: "8px", marginBottom: "6px", fontSize: "12px" }}>
                                          <strong>Q{qsIdx + 1}:</strong> {q.question}
                                          <div style={{ marginTop: "4px", color: "#64748B" }}>Marks: {q.marks}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                )}
                                
                                {quiz.status === 'pending' && (
                                  <div style={styles.itemActions}>
                                    <button style={styles.actionButton("#059669", "#DCFCE7")} onClick={() => updateItemStatus('quiz', quiz._id, 'approved', adminComment)}>
                                      <FiCheckCircle size={14} /> Approve
                                    </button>
                                    <button style={styles.actionButton("#DC2626", "#FEE2E2")} onClick={() => {
                                      const comment = prompt("Please provide reason for rejection:");
                                      if (comment) updateItemStatus('quiz', quiz._id, 'rejected', comment);
                                    }}>
                                      <FiXCircle size={14} /> Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {(!items.units || items.units.length === 0) && 
                     (!items.content || items.content.length === 0) && 
                     (!items.assignments || items.assignments.length === 0) && 
                     (!items.quizzes || items.quizzes.length === 0) && (
                      <div style={styles.noItemsMessage}>
                        <FiInfo size={32} />
                        <p>No items found for this verification request</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {showStatsModal && (
        <div style={{
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
          backdropFilter: "blur(4px)"
        }} onClick={() => setShowStatsModal(false)}>
          <div style={{
            background: "white",
            borderRadius: "24px",
            padding: "32px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <FiBarChart2 size={28} color="#0B2A4A" />
              <h3 style={{ margin: 0, color: "#0B2A4A" }}>Verification Statistics</h3>
            </div>
            <div style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #E5E9F0" }}>
                <span><FiClock size={14} color="#D97706" /> Total Requests:</span>
                <strong>{stats.total}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #E5E9F0" }}>
                <span><FiClock size={14} color="#D97706" /> Pending:</span>
                <strong style={{ color: "#D97706" }}>{stats.pending}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #E5E9F0" }}>
                <span><FiCheckCircle size={14} color="#059669" /> Approved:</span>
                <strong style={{ color: "#059669" }}>{stats.approved}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #E5E9F0" }}>
                <span><FiXCircle size={14} color="#DC2626" /> Rejected:</span>
                <strong style={{ color: "#DC2626" }}>{stats.rejected}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #E5E9F0" }}>
                <span><FiMessageSquare size={14} color="#7C3AED" /> Changes Requested:</span>
                <strong style={{ color: "#7C3AED" }}>{stats.changesRequested}</strong>
              </div>
            </div>
            <hr style={{ margin: "20px 0", borderColor: "#E5E9F0" }} />
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                <span><FiFolder size={14} /> Total Units:</span>
                <strong>{stats.totalUnits}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                <span><FiFileText size={14} /> Total Content:</span>
                <strong>{stats.totalContent}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                <span><FiClipboard size={14} /> Total Assignments:</span>
                <strong>{stats.totalAssignments}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                <span><FiHelpCircle size={14} /> Total Quizzes:</span>
                <strong>{stats.totalQuizzes}</strong>
              </div>
            </div>
            <button onClick={() => setShowStatsModal(false)} style={{
              marginTop: "24px",
              padding: "12px 20px",
              background: "linear-gradient(135deg, #0B2A4A 0%, #1A3F5C 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              width: "100%",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
              Close
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          details summary::-webkit-details-marker {
            display: none;
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default VerifyContent;