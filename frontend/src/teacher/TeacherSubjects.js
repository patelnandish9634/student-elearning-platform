import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiBookOpen,
  FiGrid,
  FiCalendar,
  FiUser,
  FiDownload,
  FiSearch,
  FiPlusCircle,
  FiEye,
  FiAlertCircle,
  FiLayers,
  FiFileText,
  FiClipboard,
  FiHelpCircle,
  FiCheckCircle,
  FiXCircle,
  FiClock as FiClockIcon,
  FiChevronDown,
  FiChevronUp,
  FiShield,
  FiSend,
  FiUsers,
  FiEdit2,
  FiRefreshCw,
  FiRotateCcw,
  FiX
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TeacherSubjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [subjectStats, setSubjectStats] = useState({});
  const [verificationData, setVerificationData] = useState({});
  const [pendingRequests, setPendingRequests] = useState({});
  const [pendingItemIds, setPendingItemIds] = useState({});
  const [reverifyLoading, setReverifyLoading] = useState({});
  const [reverifyAllLoading, setReverifyAllLoading] = useState(false);
  const [showReverifyAllDialog, setShowReverifyAllDialog] = useState(false);
  const [subjectReverifyLoading, setSubjectReverifyLoading] = useState({});
  
  const [stats, setStats] = useState({
    totalSubjects: 0,
    activeSubjects: 0,
    totalUnits: 0,
    totalContent: 0,
    totalAssignments: 0,
    totalQuizzes: 0,
    pendingApprovals: 0
  });

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  // Fetch pending verification requests for this teacher
  const fetchPendingVerificationRequests = async (teacherId) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await axios.get(
        `http://localhost:5000/api/verification/teacher/${teacherId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const requests = {};
      const itemIds = {};
      
      response.data.forEach(request => {
        if (request.status === 'pending_review' || request.status === 'under_review') {
          requests[request.subjectId] = request;
          
          if (!itemIds[request.subjectId]) {
            itemIds[request.subjectId] = {
              units: new Set(),
              content: new Set(),
              assignments: new Set(),
              quizzes: new Set()
            };
          }
          
          // Extract item IDs from the request
          if (request.items?.units) {
            request.items.units.forEach(item => {
              const id = item._id || item;
              itemIds[request.subjectId].units.add(id.toString());
            });
          }
          if (request.items?.content) {
            request.items.content.forEach(item => {
              const id = item._id || item;
              itemIds[request.subjectId].content.add(id.toString());
            });
          }
          if (request.items?.assignments) {
            request.items.assignments.forEach(item => {
              const id = item._id || item;
              itemIds[request.subjectId].assignments.add(id.toString());
            });
          }
          if (request.items?.quizzes) {
            request.items.quizzes.forEach(item => {
              const id = item._id || item;
              itemIds[request.subjectId].quizzes.add(id.toString());
            });
          }
        }
      });
      
      setPendingRequests(requests);
      setPendingItemIds(itemIds);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const fetchTeacherSubjects = async (teacherId) => {
    try {
      setLoading(true);
      
      let teacherName = "";
      let teacherEmail = "";
      
      try {
        const teacherRes = await axios.get(`http://localhost:5000/api/teachers/${teacherId}`);
        teacherName = teacherRes.data.name || "";
        teacherEmail = teacherRes.data.email || "";
        setTeacher({ name: teacherName, email: teacherEmail });
      } catch (err) {
        console.error("Error fetching teacher details:", err);
      }
      
      const response = await axios.get(
        `http://localhost:5000/api/teachers/${teacherId}/with-subjects`
      );
      
      let subjectsList = [];
      
      if (response.data && Array.isArray(response.data)) {
        subjectsList = response.data;
      } else if (response.data && response.data.subjects && Array.isArray(response.data.subjects)) {
        subjectsList = response.data.subjects;
        if (response.data.teacher) {
          setTeacher({
            name: response.data.teacher.name || teacherName,
            email: response.data.teacher.email || teacherEmail
          });
        }
      } else {
        subjectsList = [];
      }
      
      if (!Array.isArray(subjectsList)) {
        subjectsList = [];
      }
      
      setSubjects(subjectsList);
      
      await fetchAllSubjectData(teacherId, subjectsList);
      
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSubjectData = async (teacherId, subjectsList) => {
    const statsData = {};
    const verificationStats = {};
    
    subjectsList.forEach(subject => {
      statsData[subject._id] = {
        units: { total: 0, pending: 0, approved: 0, rejected: 0, data: [] },
        content: { total: 0, pending: 0, approved: 0, rejected: 0, data: [] },
        assignments: { total: 0, pending: 0, approved: 0, rejected: 0, data: [] },
        quizzes: { total: 0, pending: 0, approved: 0, rejected: 0, data: [] }
      };
    });

    try {
      // Fetch units
      try {
        const unitsRes = await axios.get(`http://localhost:5000/api/units/teacher/${teacherId}`);
        const allUnits = unitsRes.data || [];
        
        allUnits.forEach(unit => {
          const subjectId = unit.subjectId?._id || unit.subjectId;
          if (subjectId && statsData[subjectId]) {
            statsData[subjectId].units.total++;
            if (unit.status === 'pending') statsData[subjectId].units.pending++;
            else if (unit.status === 'approved') statsData[subjectId].units.approved++;
            else if (unit.status === 'rejected') statsData[subjectId].units.rejected++;
            statsData[subjectId].units.data.push(unit);
          }
        });
      } catch (error) {
        console.warn("Units endpoint error:", error.message);
      }

      // Fetch content
      try {
        const units = await axios.get(`http://localhost:5000/api/units/teacher/${teacherId}`);
        const allContent = [];
        
        for (const unit of units.data) {
          try {
            const contentRes = await axios.get(`http://localhost:5000/api/content/unit/${unit._id}?teacherId=${teacherId}`);
            allContent.push(...contentRes.data);
          } catch (err) {
            console.warn(`No content for unit ${unit._id}`);
          }
        }
        
        allContent.forEach(content => {
          const subjectId = content.subjectId?._id || content.subjectId;
          if (subjectId && statsData[subjectId]) {
            statsData[subjectId].content.total++;
            if (content.status === 'pending') statsData[subjectId].content.pending++;
            else if (content.status === 'approved') statsData[subjectId].content.approved++;
            else if (content.status === 'rejected') statsData[subjectId].content.rejected++;
            statsData[subjectId].content.data.push(content);
          }
        });
      } catch (error) {
        console.warn("Content endpoint error:", error.message);
      }

      // Fetch assignments
      try {
        const units = await axios.get(`http://localhost:5000/api/units/teacher/${teacherId}`);
        const allAssignments = [];
        
        for (const unit of units.data) {
          try {
            const assignmentsRes = await axios.get(`http://localhost:5000/api/assignments/unit/${unit._id}?teacherId=${teacherId}`);
            allAssignments.push(...assignmentsRes.data);
          } catch (err) {
            console.warn(`No assignments for unit ${unit._id}`);
          }
        }
        
        allAssignments.forEach(assignment => {
          const subjectId = assignment.subjectId?._id || assignment.subjectId;
          if (subjectId && statsData[subjectId]) {
            statsData[subjectId].assignments.total++;
            if (assignment.status === 'pending') statsData[subjectId].assignments.pending++;
            else if (assignment.status === 'approved') statsData[subjectId].assignments.approved++;
            else if (assignment.status === 'rejected') statsData[subjectId].assignments.rejected++;
            statsData[subjectId].assignments.data.push(assignment);
          }
        });
      } catch (error) {
        console.warn("Assignments endpoint error:", error.message);
      }

      // Fetch quizzes
      try {
        const units = await axios.get(`http://localhost:5000/api/units/teacher/${teacherId}`);
        const allQuizzes = [];
        
        for (const unit of units.data) {
          try {
            const quizzesRes = await axios.get(`http://localhost:5000/api/quizzes/unit/${unit._id}?teacherId=${teacherId}`);
            allQuizzes.push(...quizzesRes.data);
          } catch (err) {
            console.warn(`No quizzes for unit ${unit._id}`);
          }
        }
        
        allQuizzes.forEach(quiz => {
          const subjectId = quiz.subjectId?._id || quiz.subjectId;
          if (subjectId && statsData[subjectId]) {
            statsData[subjectId].quizzes.total++;
            if (quiz.status === 'pending') statsData[subjectId].quizzes.pending++;
            else if (quiz.status === 'approved') statsData[subjectId].quizzes.approved++;
            else if (quiz.status === 'rejected') statsData[subjectId].quizzes.rejected++;
            statsData[subjectId].quizzes.data.push(quiz);
          }
        });
      } catch (error) {
        console.warn("Quizzes endpoint error:", error.message);
      }

      // Calculate verification stats
      subjectsList.forEach(subject => {
        const subjectId = subject._id;
        verificationStats[subjectId] = {
          pending: statsData[subjectId].units.pending + 
                   statsData[subjectId].content.pending + 
                   statsData[subjectId].assignments.pending + 
                   statsData[subjectId].quizzes.pending,
          rejected: statsData[subjectId].units.rejected + 
                    statsData[subjectId].content.rejected + 
                    statsData[subjectId].assignments.rejected + 
                    statsData[subjectId].quizzes.rejected,
          approved: statsData[subjectId].units.approved + 
                    statsData[subjectId].content.approved + 
                    statsData[subjectId].assignments.approved + 
                    statsData[subjectId].quizzes.approved
        };
      });

      // Calculate overall stats
      const totalUnits = Object.values(statsData).reduce((sum, s) => sum + s.units.total, 0);
      const totalContent = Object.values(statsData).reduce((sum, s) => sum + s.content.total, 0);
      const totalAssignments = Object.values(statsData).reduce((sum, s) => sum + s.assignments.total, 0);
      const totalQuizzes = Object.values(statsData).reduce((sum, s) => sum + s.quizzes.total, 0);
      
      const pendingApprovals = Object.values(statsData).reduce((sum, s) => 
        sum + s.units.pending + s.content.pending + s.assignments.pending + s.quizzes.pending, 0);

      setStats({
        totalSubjects: subjectsList.length,
        activeSubjects: subjectsList.filter(s => s.status === "active").length,
        totalUnits,
        totalContent,
        totalAssignments,
        totalQuizzes,
        pendingApprovals
      });

      setSubjectStats(statsData);
      setVerificationData(verificationStats);

    } catch (error) {
      console.error("Unexpected error in fetchAllSubjectData:", error);
      toast.error("Failed to load some subject data");
    }
  };

  // Get rejected items for a specific subject
  const getSubjectRejectedItems = (subjectId) => {
    const stats = subjectStats[subjectId];
    if (!stats) return [];
    
    const rejectedItems = [];
    const subject = subjects.find(s => s._id === subjectId);
    
    if (!subject) return [];
    
    stats.units.data.forEach(unit => {
      if (unit.status === 'rejected') {
        rejectedItems.push({
          type: 'unit',
          id: unit._id,
          title: `Unit ${unit.unitNumber}: ${unit.unitTitle}`,
          subjectId: subjectId,
          subjectName: subject.name
        });
      }
    });
    
    stats.content.data.forEach(content => {
      if (content.status === 'rejected') {
        rejectedItems.push({
          type: 'content',
          id: content._id,
          title: `Content: ${content.topic}`,
          subjectId: subjectId,
          subjectName: subject.name
        });
      }
    });
    
    stats.assignments.data.forEach(assignment => {
      if (assignment.status === 'rejected') {
        rejectedItems.push({
          type: 'assignment',
          id: assignment._id,
          title: `Assignment: ${assignment.title}`,
          subjectId: subjectId,
          subjectName: subject.name
        });
      }
    });
    
    stats.quizzes.data.forEach(quiz => {
      if (quiz.status === 'rejected') {
        rejectedItems.push({
          type: 'quiz',
          id: quiz._id,
          title: `Quiz: ${quiz._id.slice(-6)}`,
          subjectId: subjectId,
          subjectName: subject.name
        });
      }
    });
    
    return rejectedItems;
  };

  // Get all rejected items across all subjects
  const getAllRejectedItems = () => {
    let allItems = [];
    Object.keys(subjectStats).forEach(subjectId => {
      allItems = [...allItems, ...getSubjectRejectedItems(subjectId)];
    });
    return allItems;
  };

  // Handle re-verify for a single subject
  const handleSubjectReverify = async (subjectId, subjectName) => {
    const rejectedItems = getSubjectRejectedItems(subjectId);
    
    if (rejectedItems.length === 0) {
      toast.info(`No rejected items found for ${subjectName}`, {
        position: "top-right",
        autoClose: 3000,
        theme: "colored"
      });
      return;
    }
    
    setSubjectReverifyLoading(prev => ({ ...prev, [subjectId]: true }));
    
    const token = getAuthToken();
    const teacherId = localStorage.getItem("userId");
    
    let teacherName = "";
    try {
      const teacherRes = await axios.get(`http://localhost:5000/api/teachers/${teacherId}`);
      teacherName = teacherRes.data.name || "";
    } catch (err) {
      console.error("Error fetching teacher details:", err);
    }
    
    const results = { success: 0, failed: 0 };
    
    for (const item of rejectedItems) {
      try {
        let endpoint = "";
        switch(item.type) {
          case 'unit':
            endpoint = `http://localhost:5000/api/units/${item.id}/reverify`;
            break;
          case 'content':
            endpoint = `http://localhost:5000/api/content/${item.id}/reverify`;
            break;
          case 'assignment':
            endpoint = `http://localhost:5000/api/assignments/${item.id}/reverify`;
            break;
          case 'quiz':
            endpoint = `http://localhost:5000/api/quizzes/${item.id}/reverify`;
            break;
        }
        
        await axios.put(
          endpoint,
          { teacherId: teacherId, teacherName: teacherName },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        results.success++;
      } catch (error) {
        console.error(`Error re-verifying ${item.type} ${item.id}:`, error);
        results.failed++;
      }
    }
    
    if (results.success > 0) {
      toast.success(
        <div>
          <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>✓ Re-verification Requests Sent!</p>
          <p>Successfully sent {results.success} items for {subjectName}</p>
          {results.failed > 0 && (
            <p style={{ fontSize: '12px', marginTop: '5px', color: '#DC2626' }}>
              Failed: {results.failed} items
            </p>
          )}
        </div>,
        { position: "top-right", autoClose: 4000, theme: "colored" }
      );
    }
    
    // Refresh data
    const teacherIdFromStorage = localStorage.getItem("userId");
    await fetchTeacherSubjects(teacherIdFromStorage);
    await fetchPendingVerificationRequests(teacherIdFromStorage);
    
    setSubjectReverifyLoading(prev => ({ ...prev, [subjectId]: false }));
  };

  // Handle re-verify for all subjects
  const handleReverifyAll = async () => {
    const rejectedItems = getAllRejectedItems();
    
    if (rejectedItems.length === 0) {
      toast.info("No rejected items found to re-verify", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored"
      });
      setShowReverifyAllDialog(false);
      return;
    }
    
    setReverifyAllLoading(true);
    setShowReverifyAllDialog(false);
    
    const token = getAuthToken();
    const teacherId = localStorage.getItem("userId");
    
    let teacherName = "";
    try {
      const teacherRes = await axios.get(`http://localhost:5000/api/teachers/${teacherId}`);
      teacherName = teacherRes.data.name || "";
    } catch (err) {
      console.error("Error fetching teacher details:", err);
    }
    
    const results = { success: 0, failed: [] };
    
    for (const item of rejectedItems) {
      try {
        let endpoint = "";
        switch(item.type) {
          case 'unit':
            endpoint = `http://localhost:5000/api/units/${item.id}/reverify`;
            break;
          case 'content':
            endpoint = `http://localhost:5000/api/content/${item.id}/reverify`;
            break;
          case 'assignment':
            endpoint = `http://localhost:5000/api/assignments/${item.id}/reverify`;
            break;
          case 'quiz':
            endpoint = `http://localhost:5000/api/quizzes/${item.id}/reverify`;
            break;
        }
        
        await axios.put(
          endpoint,
          { teacherId: teacherId, teacherName: teacherName },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        results.success++;
      } catch (error) {
        console.error(`Error re-verifying ${item.type} ${item.id}:`, error);
        results.failed.push(item);
      }
    }
    
    if (results.success > 0) {
      toast.success(
        <div>
          <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>✓ Re-verification Requests Sent!</p>
          <p>Successfully sent {results.success} out of {rejectedItems.length} items for re-verification.</p>
          {results.failed.length > 0 && (
            <p style={{ fontSize: '12px', marginTop: '5px', color: '#DC2626' }}>
              Failed: {results.failed.length} items
            </p>
          )}
        </div>,
        { position: "top-right", autoClose: 5000, theme: "colored" }
      );
    }
    
    // Refresh data
    const teacherIdFromStorage = localStorage.getItem("userId");
    await fetchTeacherSubjects(teacherIdFromStorage);
    await fetchPendingVerificationRequests(teacherIdFromStorage);
    
    setReverifyAllLoading(false);
  };

  // Function to handle re-verification request for a single item
  const handleReverifyItem = async (type, itemId, subjectId, subjectName, itemTitle) => {
    try {
      setReverifyLoading(prev => ({ ...prev, [itemId]: true }));
      
      const token = getAuthToken();
      const teacherId = localStorage.getItem("userId");
      
      let teacherName = "";
      try {
        const teacherRes = await axios.get(`http://localhost:5000/api/teachers/${teacherId}`);
        teacherName = teacherRes.data.name || "";
      } catch (err) {
        console.error("Error fetching teacher details:", err);
      }
      
      let endpoint = "";
      switch(type) {
        case 'unit':
          endpoint = `http://localhost:5000/api/units/${itemId}/reverify`;
          break;
        case 'content':
          endpoint = `http://localhost:5000/api/content/${itemId}/reverify`;
          break;
        case 'assignment':
          endpoint = `http://localhost:5000/api/assignments/${itemId}/reverify`;
          break;
        case 'quiz':
          endpoint = `http://localhost:5000/api/quizzes/${itemId}/reverify`;
          break;
        default:
          toast.error("Invalid item type");
          return;
      }
      
      const response = await axios.put(
        endpoint,
        { teacherId: teacherId, teacherName: teacherName },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success(
          <div>
            <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>✓ Re-verification Request Sent!</p>
            <p>Your updated {type} has been sent to admin for review.</p>
          </div>,
          { position: "top-right", autoClose: 4000, theme: "colored" }
        );
        
        const teacherIdFromStorage = localStorage.getItem("userId");
        await fetchTeacherSubjects(teacherIdFromStorage);
        await fetchPendingVerificationRequests(teacherIdFromStorage);
      }
      
    } catch (error) {
      console.error("Error requesting re-verification:", error);
      toast.error(error.response?.data?.message || "Failed to send re-verification request");
    } finally {
      setReverifyLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Function to handle update navigation for rejected items
  const handleUpdateItem = (type, itemId, subjectId, subjectName, itemTitle) => {
    localStorage.setItem('editItemId', itemId);
    localStorage.setItem('editItemType', type);
    localStorage.setItem('editItemSubjectId', subjectId);
    localStorage.setItem('editItemSubjectName', subjectName);
    localStorage.setItem('editItemTitle', itemTitle);
    
    switch(type) {
      case 'unit':
        navigate(`/teacher/units?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}&editId=${itemId}`);
        break;
      case 'content':
        navigate(`/teacher/content?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}&editId=${itemId}`);
        break;
      case 'assignment':
        navigate(`/teacher/assignments?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}&editId=${itemId}`);
        break;
      case 'quiz':
        navigate(`/teacher/quizzes?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}&editId=${itemId}`);
        break;
      default:
        break;
    }
  };

  // Function to send NEW items to existing verification request
  const sendNewItemsForVerification = async (subjectId, subjectName) => {
    try {
      const token = getAuthToken();
      const teacherId = localStorage.getItem("userId");
      
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const subject = subjects.find(s => s._id === subjectId);
      
      if (!subject) {
        toast.error("Subject not found");
        return;
      }

      let teacherName = "";
      let teacherEmail = "";
      
      try {
        const teacherRes = await axios.get(`http://localhost:5000/api/teachers/${teacherId}`);
        teacherName = teacherRes.data.name || "";
        teacherEmail = teacherRes.data.email || "";
        setTeacher({ name: teacherName, email: teacherEmail });
      } catch (err) {
        console.error("Error fetching teacher details:", err);
        teacherName = teacher?.name || "";
        teacherEmail = teacher?.email || "";
      }

      // Get existing pending request
      const existingRequest = pendingRequests[subjectId];
      
      if (!existingRequest) {
        // If no existing request, create new one
        await sendForVerification(subjectId, subjectName);
        return;
      }

      // Get only NEW pending items (not already in request)
      const subjectPendingItemIds = pendingItemIds[subjectId] || {
        units: new Set(),
        content: new Set(),
        assignments: new Set(),
        quizzes: new Set()
      };
      
      const subjectStat = subjectStats[subjectId];
      
      const newUnits = subjectStat?.units.data.filter(unit => 
        unit.status === 'pending' && !subjectPendingItemIds.units.has(unit._id?.toString())
      ) || [];
      
      const newContent = subjectStat?.content.data.filter(content => 
        content.status === 'pending' && !subjectPendingItemIds.content.has(content._id?.toString())
      ) || [];
      
      const newAssignments = subjectStat?.assignments.data.filter(assignment => 
        assignment.status === 'pending' && !subjectPendingItemIds.assignments.has(assignment._id?.toString())
      ) || [];
      
      const newQuizzes = subjectStat?.quizzes.data.filter(quiz => 
        quiz.status === 'pending' && !subjectPendingItemIds.quizzes.has(quiz._id?.toString())
      ) || [];
      
      const totalNew = newUnits.length + newContent.length + newAssignments.length + newQuizzes.length;
      
      if (totalNew === 0) {
        toast.info("No new items to add to verification request");
        return;
      }

      // Update existing request with new items
      const updateResponse = await axios.put(
        `http://localhost:5000/api/verification/update/${existingRequest._id}`,
        {
          subjectId,
          subjectName: subject.name,
          subjectCode: subject.code,
          semester: subject.semester,
          teacherId: teacherId,
          teacherName: teacherName,
          teacherEmail: teacherEmail,
          newUnits: newUnits.map(u => u._id),
          newContent: newContent.map(c => c._id),
          newAssignments: newAssignments.map(a => a._id),
          newQuizzes: newQuizzes.map(q => q._id)
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (updateResponse.data.success) {
        toast.success(
          <div>
            <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>✓ New Items Added to Verification Request!</p>
            <p>Successfully added {totalNew} new item(s) to your existing verification request.</p>
            <div style={{ 
              background: '#F0FDF4', 
              padding: '8px', 
              borderRadius: '6px',
              marginTop: '8px',
              fontSize: '12px'
            }}>
              <strong>New items added:</strong><br />
              {newUnits.length > 0 && <>📚 Units: {newUnits.length}<br /></>}
              {newContent.length > 0 && <>📄 Content: {newContent.length}<br /></>}
              {newAssignments.length > 0 && <>📋 Assignments: {newAssignments.length}<br /></>}
              {newQuizzes.length > 0 && <>❓ Quizzes: {newQuizzes.length}<br /></>}
            </div>
          </div>,
          {
            position: "top-right",
            autoClose: 5000,
            theme: "colored",
            icon: <FiSend size={20} />
          }
        );
        
        // Refresh data
        await fetchTeacherSubjects(teacherId);
        await fetchPendingVerificationRequests(teacherId);
      }
      
    } catch (error) {
      console.error("Error adding new items to verification request:", error);
      toast.error(error.response?.data?.message || "Failed to add new items to verification request");
    }
  };

  // Function to send data to admin for verification (new request)
  const sendForVerification = async (subjectId, subjectName) => {
    try {
      const token = getAuthToken();
      const teacherId = localStorage.getItem("userId");
      
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const subject = subjects.find(s => s._id === subjectId);
      
      if (!subject) {
        toast.error("Subject not found");
        return;
      }

      let teacherName = "";
      let teacherEmail = "";
      
      try {
        const teacherRes = await axios.get(`http://localhost:5000/api/teachers/${teacherId}`);
        teacherName = teacherRes.data.name || "";
        teacherEmail = teacherRes.data.email || "";
        setTeacher({ name: teacherName, email: teacherEmail });
      } catch (err) {
        console.error("Error fetching teacher details:", err);
        teacherName = teacher?.name || "";
        teacherEmail = teacher?.email || "";
      }

      // Get current pending items
      const subjectStat = subjectStats[subjectId];
      const pendingItems = {
        units: subjectStat?.units.pending || 0,
        content: subjectStat?.content.pending || 0,
        assignments: subjectStat?.assignments.pending || 0,
        quizzes: subjectStat?.quizzes.pending || 0
      };
      
      const totalPending = pendingItems.units + pendingItems.content + pendingItems.assignments + pendingItems.quizzes;
      
      if (totalPending === 0) {
        const totalItems = (subjectStat?.units.total || 0) + 
                          (subjectStat?.content.total || 0) + 
                          (subjectStat?.assignments.total || 0) + 
                          (subjectStat?.quizzes.total || 0);
        
        if (totalItems === 0) {
          toast.info(
            <div>
              <p style={{ marginBottom: '10px' }}>No content created yet. Please create units and content first.</p>
              <button 
                onClick={() => {
                  toast.dismiss();
                  navigate(`/teacher/units?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`);
                }}
                style={{
                  background: '#7C3AED',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <FiPlusCircle size={14} />
                Create Your First Unit
              </button>
            </div>,
            {
              position: "top-right",
              autoClose: false,
              closeOnClick: false,
              draggable: false,
              theme: "colored",
              style: { backgroundColor: '#FEF3C7', color: '#92400E' }
            }
          );
        } else {
          toast.info(
            <div>
              <p style={{ marginBottom: '10px' }}>
                All your items have already been reviewed!
              </p>
              <p style={{ fontSize: '12px', marginBottom: '10px', color: '#666' }}>
                Total items: {totalItems}
              </p>
              <button 
                onClick={() => {
                  toast.dismiss();
                }}
                style={{
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <FiCheckCircle size={14} />
                All items are approved!
              </button>
            </div>,
            {
              position: "top-right",
              autoClose: false,
              closeOnClick: false,
              draggable: false,
              theme: "colored",
              style: { backgroundColor: '#DCFCE7', color: '#059669' }
            }
          );
        }
        return;
      }

      // Create new verification request
      const dataToSend = {
        subjectId,
        subjectName: subject.name,
        subjectCode: subject.code,
        semester: subject.semester,
        teacherId: teacherId,
        teacherName: teacherName,
        teacherEmail: teacherEmail
      };

      const response = await axios.post(
        'http://localhost:5000/api/verification/request',
        dataToSend,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setPendingRequests(prev => ({
          ...prev,
          [subjectId]: response.data.data
        }));

        toast.success(
          <div>
            <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>✓ Verification Request Submitted!</p>
            <p>Your content has been sent to the admin for review.</p>
            {response.data.data.summary && (
              <div style={{ 
                background: '#F0FDF4', 
                padding: '8px', 
                borderRadius: '6px',
                marginTop: '8px',
                fontSize: '12px'
              }}>
                <strong>Items submitted for verification:</strong><br />
                📚 Units: {response.data.data.summary.pendingUnits || 0}<br />
                📄 Content: {response.data.data.summary.pendingContent || 0}<br />
                📋 Assignments: {response.data.data.summary.pendingAssignments || 0}<br />
                ❓ Quizzes: {response.data.data.summary.pendingQuizzes || 0}
              </div>
            )}
            <p style={{ fontSize: '11px', marginTop: '8px', color: '#666' }}>
              Request ID: {response.data.data._id.slice(-8)}
            </p>
          </div>,
          {
            position: "top-right",
            autoClose: 5000,
            theme: "colored",
            icon: <FiSend size={20} />
          }
        );
        
        // Refresh data
        await fetchTeacherSubjects(teacherId);
        await fetchPendingVerificationRequests(teacherId);
      }

    } catch (error) {
      console.error("Error sending for verification:", error);
      if (error.response) {
        const errorMessage = error.response.data.message;
        
        if (errorMessage && errorMessage.includes('No pending items')) {
          toast.info(
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#D97706' }}>📋 No Pending Items</p>
              <p>{errorMessage}</p>
              <div style={{ marginTop: '12px' }}>
                <button
                  onClick={() => {
                    toast.dismiss();
                    navigate(`/teacher/units?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`);
                  }}
                  style={{
                    background: '#0B2A4A',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Create More Content
                </button>
              </div>
            </div>,
            {
              position: "top-right",
              autoClose: false,
              theme: "colored",
              style: { backgroundColor: '#FEF3C7', color: '#92400E' }
            }
          );
        } else if (errorMessage && errorMessage.includes('already been reviewed')) {
          toast.info(
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>✅ All Content Reviewed</p>
              <p>{errorMessage}</p>
            </div>,
            {
              position: "top-right",
              autoClose: 5000,
              theme: "colored"
            }
          );
        } else if (errorMessage && errorMessage.includes('No content found')) {
          toast.info(
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>📝 No Content Yet</p>
              <p>{errorMessage}</p>
              <div style={{ marginTop: '12px' }}>
                <button
                  onClick={() => {
                    toast.dismiss();
                    navigate(`/teacher/units?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`);
                  }}
                  style={{
                    background: '#7C3AED',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Create Your First Unit
                </button>
              </div>
            </div>,
            {
              position: "top-right",
              autoClose: false,
              theme: "colored"
            }
          );
        } else if (errorMessage && errorMessage.includes('pending verification request')) {
          toast.info(
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#2563EB' }}>⏳ Request Pending</p>
              <p>{errorMessage}</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Please wait for admin to review your current request.</p>
            </div>,
            {
              position: "top-right",
              autoClose: 5000,
              theme: "colored"
            }
          );
        } else {
          toast.error(errorMessage || "Failed to send for verification");
        }
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("An error occurred. Please try again.");
      }
    }
  };

  // Filter subjects based on search and semester
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.course?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSemester = selectedSemester === "all" || 
                           subject.semester?.toString() === selectedSemester;
    
    return matchesSearch && matchesSemester;
  });

  // Get unique semesters for filter
  const semesters = [...new Set(subjects.map(s => s.semester))].sort();

  const handleCreateContent = (type, subjectId, subjectName) => {
    const currentSubject = subjects.find(s => s._id === subjectId);
    
    if (currentSubject && currentSubject.status !== "active") {
      toast.error(`Cannot add ${type} to inactive subject "${currentSubject.name}". Please contact admin.`, {
        position: "top-right",
        autoClose: 4000,
        theme: "colored",
      });
      return;
    }
    
    const subjectStat = subjectStats[subjectId];
    const hasUnits = subjectStat && subjectStat.units.total > 0;
    
    switch(type) {
      case 'unit':
        navigate(`/teacher/units?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`);
        break;
      case 'content':
        if (hasUnits) {
          navigate(`/teacher/content?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`);
        } else {
          toast.info(
            <div>
              <p>Please create units first before adding content.</p>
              <button onClick={() => {
                toast.dismiss();
                navigate(`/teacher/units?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`);
              }} style={{ background: '#0B2A4A', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>
                Create Units Now
              </button>
            </div>,
            { position: "top-right", autoClose: false, theme: "colored" }
          );
        }
        break;
      case 'assignment':
        if (hasUnits) {
          navigate(`/teacher/assignments?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`);
        } else {
          toast.info(
            <div>
              <p>Please create units first before adding assignments.</p>
              <button onClick={() => {
                toast.dismiss();
                navigate(`/teacher/units?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`);
              }} style={{ background: '#0B2A4A', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>
                Create Units Now
              </button>
            </div>,
            { position: "top-right", autoClose: false, theme: "colored" }
          );
        }
        break;
      case 'quiz':
        if (hasUnits) {
          navigate(`/teacher/quizzes?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`);
        } else {
          toast.info(
            <div>
              <p>Please create units first before adding quizzes.</p>
              <button onClick={() => {
                toast.dismiss();
                navigate(`/teacher/units?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`);
              }} style={{ background: '#0B2A4A', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>
                Create Units Now
              </button>
            </div>,
            { position: "top-right", autoClose: false, theme: "colored" }
          );
        }
        break;
      default:
        break;
    }
  };

  // Get status badge for verification
  const getVerificationBadge = (stats, subjectId) => {
    const hasPendingRequest = pendingRequests[subjectId];
    const subjectPendingItemIds = pendingItemIds[subjectId];
    const totalPending = stats.pending;
    
    // Calculate NEW pending items (not in any pending request)
    let newPendingCount = totalPending;
    if (hasPendingRequest && subjectPendingItemIds) {
      const itemsInRequest = (subjectPendingItemIds.units?.size || 0) + 
                              (subjectPendingItemIds.content?.size || 0) + 
                              (subjectPendingItemIds.assignments?.size || 0) + 
                              (subjectPendingItemIds.quizzes?.size || 0);
      newPendingCount = Math.max(0, totalPending - itemsInRequest);
    }
    
    if (newPendingCount > 0) {
      return {
        icon: <FiClockIcon size={14} />,
        label: `${newPendingCount} New Pending`,
        color: '#D97706',
        bgColor: '#FEF3C7'
      };
    }
    
    if (hasPendingRequest) {
      return {
        icon: <FiClockIcon size={14} />,
        label: 'Request Pending',
        color: '#2563EB',
        bgColor: '#DBEAFE'
      };
    }
    
    if (totalPending > 0) {
      return {
        icon: <FiClockIcon size={14} />,
        label: `${totalPending} Pending`,
        color: '#D97706',
        bgColor: '#FEF3C7'
      };
    }
    
    if (stats.rejected > 0) {
      return {
        icon: <FiXCircle size={14} />,
        label: `${stats.rejected} Rejected`,
        color: '#DC2626',
        bgColor: '#FEE2E2'
      };
    }
    
    if (stats.approved > 0 && stats.pending === 0 && stats.rejected === 0) {
      return {
        icon: <FiCheckCircle size={14} />,
        label: 'All Approved',
        color: '#059669',
        bgColor: '#DCFCE7'
      };
    }
    
    return {
      icon: <FiAlertCircle size={14} />,
      label: 'No Items',
      color: '#64748B',
      bgColor: '#F1F5F9'
    };
  };

  const handleVerifyClick = (subjectId, subjectName) => {
    const subjectStat = subjectStats[subjectId];
    const hasPendingRequest = pendingRequests[subjectId];
    const subjectPendingItemIds = pendingItemIds[subjectId];
    const totalPending = (subjectStat?.units.pending || 0) + 
                         (subjectStat?.content.pending || 0) + 
                         (subjectStat?.assignments.pending || 0) + 
                         (subjectStat?.quizzes.pending || 0);
    
    // Calculate NEW pending items
    let newPendingUnits = 0;
    let newPendingContent = 0;
    let newPendingAssignments = 0;
    let newPendingQuizzes = 0;
    
    if (subjectStat) {
      newPendingUnits = subjectStat.units.data.filter(unit => 
        unit.status === 'pending' && (!subjectPendingItemIds || !subjectPendingItemIds.units?.has(unit._id?.toString()))
      ).length;
      newPendingContent = subjectStat.content.data.filter(content => 
        content.status === 'pending' && (!subjectPendingItemIds || !subjectPendingItemIds.content?.has(content._id?.toString()))
      ).length;
      newPendingAssignments = subjectStat.assignments.data.filter(assignment => 
        assignment.status === 'pending' && (!subjectPendingItemIds || !subjectPendingItemIds.assignments?.has(assignment._id?.toString()))
      ).length;
      newPendingQuizzes = subjectStat.quizzes.data.filter(quiz => 
        quiz.status === 'pending' && (!subjectPendingItemIds || !subjectPendingItemIds.quizzes?.has(quiz._id?.toString()))
      ).length;
    }
    
    const totalNewPending = newPendingUnits + newPendingContent + newPendingAssignments + newPendingQuizzes;
    
    if (totalNewPending > 0) {
      toast.info(
        <div>
          <h4 style={{ margin: '0 0 10px 0', color: '#92400E' }}>New Pending Items</h4>
          <p>📚 New Units: {newPendingUnits}</p>
          <p>📄 New Content: {newPendingContent}</p>
          <p>📋 New Assignments: {newPendingAssignments}</p>
          <p>❓ New Quizzes: {newPendingQuizzes}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              onClick={() => {
                toast.dismiss();
                if (hasPendingRequest) {
                  sendNewItemsForVerification(subjectId, subjectName);
                } else {
                  sendForVerification(subjectId, subjectName);
                }
              }}
              style={{
                background: '#059669',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <FiSend size={14} />
              Send {hasPendingRequest ? 'New Items' : 'to Admin'}
            </button>
            <button 
              onClick={() => {
                toast.dismiss();
                navigate(`/teacher/units?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}&filter=pending`);
              }}
              style={{
                background: '#D97706',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <FiEye size={14} />
              View New Items
            </button>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          theme: "colored",
          style: { backgroundColor: '#FEF3C7', color: '#92400E' }
        }
      );
    } else if (!hasPendingRequest && totalPending > 0) {
      // No pending request but has pending items (all are new since no request exists)
      toast.info(
        <div>
          <h4 style={{ margin: '0 0 10px 0', color: '#92400E' }}>Pending Items</h4>
          <p>📚 Units: {subjectStat?.units.pending || 0}</p>
          <p>📄 Content: {subjectStat?.content.pending || 0}</p>
          <p>📋 Assignments: {subjectStat?.assignments.pending || 0}</p>
          <p>❓ Quizzes: {subjectStat?.quizzes.pending || 0}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              onClick={() => {
                toast.dismiss();
                sendForVerification(subjectId, subjectName);
              }}
              style={{
                background: '#2563EB',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <FiSend size={14} />
              Send to Admin
            </button>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          theme: "colored",
          style: { backgroundColor: '#FEF3C7', color: '#92400E' }
        }
      );
    }
  };

  const handleRequestVerification = (subjectId, subjectName) => {
    sendForVerification(subjectId, subjectName);
  };

  const toggleExpand = (subjectId) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(subjectId);
    }
  };

  const totalRejectedItems = getAllRejectedItems().length;

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
    teacherBadge: {
      background: "linear-gradient(135deg, #0B2A4A 0%, #1A3F5C 100%)",
      color: "white",
      padding: "8px 20px",
      borderRadius: "50px",
      fontSize: "14px",
      fontWeight: "500",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      boxShadow: "0 4px 15px rgba(11, 42, 74, 0.2)"
    },
    reverifyAllButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 24px",
      background: totalRejectedItems > 0 ? "linear-gradient(135deg, #059669 0%, #10B981 100%)" : "#CBD5E1",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: totalRejectedItems > 0 ? "pointer" : "not-allowed",
      transition: "all 0.3s ease",
      boxShadow: totalRejectedItems > 0 ? "0 4px 15px rgba(5, 150, 105, 0.3)" : "none",
      marginLeft: "16px"
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      animation: "fadeIn 0.3s ease-out"
    },
    modalContainer: {
      backgroundColor: "white",
      borderRadius: "24px",
      width: "500px",
      maxWidth: "90%",
      maxHeight: "80vh",
      overflow: "hidden",
      boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
      animation: "slideUp 0.3s ease-out"
    },
    modalHeader: {
      padding: "20px 24px",
      borderBottom: "1px solid #E5E9F0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
      color: "white"
    },
    modalTitle: {
      fontSize: "20px",
      fontWeight: "600",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "10px"
    },
    modalCloseBtn: {
      background: "rgba(255,255,255,0.2)",
      border: "none",
      borderRadius: "50%",
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "white",
      transition: "all 0.2s ease"
    },
    modalBody: {
      padding: "24px",
      maxHeight: "400px",
      overflowY: "auto"
    },
    modalFooter: {
      padding: "16px 24px",
      borderTop: "1px solid #E5E9F0",
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      background: "#F8FAFC"
    },
    cancelBtn: {
      padding: "10px 20px",
      borderRadius: "10px",
      border: "1px solid #E5E9F0",
      background: "white",
      color: "#64748B",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease"
    },
    confirmBtn: {
      padding: "10px 24px",
      borderRadius: "10px",
      border: "none",
      background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
      color: "white",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s ease"
    },
    itemList: {
      marginTop: "16px"
    },
    itemGroup: {
      marginBottom: "16px"
    },
    itemGroupTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#0B2A4A",
      marginBottom: "8px",
      paddingBottom: "4px",
      borderBottom: "2px solid #E5E9F0"
    },
    itemBadge: {
      display: "inline-block",
      padding: "6px 12px",
      margin: "4px 6px",
      borderRadius: "8px",
      fontSize: "12px",
      background: "#F8FAFC",
      color: "#475569",
      border: "1px solid #E5E9F0"
    },
    warningText: {
      fontSize: "13px",
      color: "#DC2626",
      marginTop: "16px",
      padding: "12px",
      background: "#FEE2E2",
      borderRadius: "8px",
      textAlign: "center"
    },
    subjectReverifyBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 12px",
      borderRadius: "8px",
      border: "none",
      fontSize: "12px",
      fontWeight: "500",
      background: "#DCFCE7",
      color: "#059669",
      cursor: "pointer",
      transition: "all 0.2s ease"
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
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
      alignItems: "center"
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
      color: color
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
      fontSize: "14px"
    },
    filterSelect: {
      flex: 1,
      minWidth: "180px",
      padding: "10px 16px",
      background: "#F8FAFC",
      borderRadius: "12px",
      border: "1px solid #E5E9F0",
      fontSize: "14px",
      color: "#1E293B",
      cursor: "pointer"
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
    subjectsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
      gap: "20px"
    },
    subjectCard: {
      background: "white",
      borderRadius: "20px",
      padding: "20px",
      border: "1px solid #E5E9F0",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
      transition: "all 0.3s ease",
      display: "flex",
      flexDirection: "column"
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "16px",
      cursor: "pointer"
    },
    subjectIcon: {
      width: "50px",
      height: "50px",
      borderRadius: "14px",
      background: "linear-gradient(135deg, #0B2A4A 0%, #1A3F5C 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: "24px"
    },
    subjectCode: {
      background: "#F1F5F9",
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      color: "#475569"
    },
    subjectName: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#0B2A4A",
      marginBottom: "8px"
    },
    subjectDetails: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
      marginBottom: "16px",
      padding: "12px",
      background: "#F8FAFC",
      borderRadius: "12px"
    },
    detailItem: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      color: "#475569"
    },
    statusContainer: {
      display: "flex",
      gap: "8px",
      marginBottom: "12px",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between"
    },
    statusBadge: (color, bgColor) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 12px",
      borderRadius: "50px",
      fontSize: "12px",
      fontWeight: "500",
      background: bgColor,
      color: color
    }),
    verificationBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 12px",
      borderRadius: "50px",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease"
    },
    contentStatsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "12px",
      marginBottom: "16px"
    },
    contentStatItem: {
      background: "#F8FAFC",
      borderRadius: "12px",
      padding: "12px",
      textAlign: "center",
      border: "1px solid #E5E9F0"
    },
    contentStatIcon: (color) => ({
      fontSize: "20px",
      color: color,
      marginBottom: "6px"
    }),
    contentStatLabel: {
      fontSize: "11px",
      color: "#64748B",
      marginBottom: "2px"
    },
    contentStatValue: {
      fontSize: "16px",
      fontWeight: "700",
      color: "#0B2A4A"
    },
    pendingBar: {
      marginTop: "8px",
      marginBottom: "16px",
      padding: "10px",
      background: "#FEF3C7",
      borderRadius: "8px",
      borderLeft: "4px solid #D97706",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      transition: "all 0.2s ease"
    },
    expandedSection: {
      marginTop: "16px",
      paddingTop: "16px",
      borderTop: "1px solid #E5E9F0"
    },
    itemRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 12px",
      background: "#F8FAFC",
      borderRadius: "8px",
      marginBottom: "6px"
    },
    itemType: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      fontWeight: "500"
    },
    itemStatus: (status) => {
      const colors = {
        pending: { color: '#D97706', bg: '#FEF3C7' },
        approved: { color: '#059669', bg: '#DCFCE7' },
        rejected: { color: '#DC2626', bg: '#FEE2E2' }
      };
      const style = colors[status] || colors.pending;
      return {
        fontSize: "11px",
        padding: "2px 8px",
        borderRadius: "12px",
        background: style.bg,
        color: style.color
      };
    },
    actionButtonsContainer: {
      display: "flex",
      gap: "10px",
      marginTop: "8px",
      flexWrap: "wrap"
    },
    actionButton: {
      flex: 1,
      padding: "10px",
      borderRadius: "10px",
      border: "none",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      transition: "all 0.3s ease",
      minWidth: "120px"
    },
    createButton: {
      background: "linear-gradient(135deg, #0B2A4A 0%, #1A3F5C 100%)",
      color: "white"
    },
    viewButton: {
      background: "#F1F5F9",
      color: "#0B2A4A"
    },
    verifyButton: {
      background: "#D97706",
      color: "white"
    },
    requestVerifyButton: {
      background: "#7C3AED",
      color: "white"
    },
    disabledButton: {
      background: "#DBEAFE",
      color: "#1E40AF",
      cursor: "default",
      opacity: 0.7
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
    },
    expandIcon: {
      color: "#64748B",
      cursor: "pointer",
      padding: "4px",
      borderRadius: "4px"
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    const teacherId = localStorage.getItem("userId");
    if (teacherId) {
      fetchTeacherSubjects(teacherId);
      fetchPendingVerificationRequests(teacherId);
    }
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
      </div>
    );
  }

  // Group rejected items by subject for the modal
  const rejectedItemsBySubject = {};
  const allRejectedItems = getAllRejectedItems();
  allRejectedItems.forEach(item => {
    if (!rejectedItemsBySubject[item.subjectName]) {
      rejectedItemsBySubject[item.subjectName] = [];
    }
    rejectedItemsBySubject[item.subjectName].push(item);
  });

  return (
    <div style={styles.container}>
      <ToastContainer position="top-right" theme="colored" />
      
      {/* Beautiful Confirmation Dialog */}
      {showReverifyAllDialog && (
        <div style={styles.modalOverlay} onClick={() => setShowReverifyAllDialog(false)}>
          <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>
                <FiRotateCcw size={20} />
                Re-verify All Items
              </div>
              <button
                style={styles.modalCloseBtn}
                onClick={() => setShowReverifyAllDialog(false)}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              >
                <FiX size={18} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#FEE2E2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <FiAlertCircle size={24} color="#DC2626" />
                </div>
                <div>
                  <p style={{ fontWeight: "600", fontSize: "16px", margin: 0, color: "#0B2A4A" }}>
                    You have {allRejectedItems.length} rejected item(s)
                  </p>
                  <p style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0 0" }}>
                    Select Continue to send all for re-verification
                  </p>
                </div>
              </div>
              
              <div style={styles.itemList}>
                {Object.keys(rejectedItemsBySubject).map(subjectName => (
                  <div key={subjectName} style={styles.itemGroup}>
                    <div style={styles.itemGroupTitle}>
                      📚 {subjectName}
                    </div>
                    <div>
                      {rejectedItemsBySubject[subjectName].map((item, idx) => (
                        <span key={idx} style={styles.itemBadge}>
                          {item.type === 'unit' && '📘'}
                          {item.type === 'content' && '📄'}
                          {item.type === 'assignment' && '📋'}
                          {item.type === 'quiz' && '❓'}
                          {' '}{item.title}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={styles.warningText}>
                ⚠️ This will send ALL rejected items above for admin review
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowReverifyAllDialog(false)}
                onMouseEnter={(e) => e.currentTarget.style.background = "#F1F5F9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "white"}
              >
                Cancel
              </button>
              <button
                style={styles.confirmBtn}
                onClick={handleReverifyAll}
                disabled={reverifyAllLoading}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                {reverifyAllLoading ? (
                  <>
                    <div style={{ width: "16px", height: "16px", border: "2px solid white", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <FiRotateCcw size={16} />
                    Continue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>
            <FiBookOpen size={28} />
            My Subjects
          </h1>
          <p style={styles.headerSubtitle}>
            Manage all your teaching materials in one place
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {teacher && (
            <div style={styles.teacherBadge}>
              <FiUser size={16} />
              <span>{teacher.name}</span>
            </div>
          )}
          
          {totalRejectedItems > 0 && (
            <button
              style={styles.reverifyAllButton}
              onClick={() => setShowReverifyAllDialog(true)}
              disabled={reverifyAllLoading}
              onMouseEnter={(e) => {
                if (totalRejectedItems > 0) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(5, 150, 105, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(5, 150, 105, 0.3)";
              }}
            >
              <FiRotateCcw size={16} />
              Re-verify All ({totalRejectedItems})
            </button>
          )}
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Total Subjects</div>
            <div style={styles.statValue}>{stats.totalSubjects}</div>
          </div>
          <div style={styles.statIcon("#0B2A4A", "#E8F0FE")}>
            <FiBookOpen size={22} />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Total Units</div>
            <div style={styles.statValue}>{stats.totalUnits}</div>
          </div>
          <div style={styles.statIcon("#059669", "#E7F5E9")}>
            <FiLayers size={22} />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Content Items</div>
            <div style={styles.statValue}>{stats.totalContent}</div>
          </div>
          <div style={styles.statIcon("#D97706", "#FEF3C7")}>
            <FiFileText size={22} />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Pending Approvals</div>
            <div style={styles.statValue}>{stats.pendingApprovals}</div>
          </div>
          <div style={styles.statIcon("#7C3AED", "#EDE9FE")}>
            <FiClockIcon size={22} />
          </div>
        </div>
      </div>

      <div style={styles.filtersSection}>
        <div style={styles.searchBox}>
          <FiSearch color="#94A3B8" size={18} />
          <input
            style={styles.searchInput}
            placeholder="Search by subject name, code or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          style={styles.filterSelect}
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          <option value="all">All Semesters</option>
          {semesters.map(sem => (
            <option key={sem} value={sem}>Semester {sem}</option>
          ))}
        </select>

        <button style={styles.exportBtn}>
          <FiDownload size={16} />
          Export Report
        </button>
      </div>

      {filteredSubjects.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: "48px", color: "#94A3B8", marginBottom: "16px" }}>📚</div>
          <h3 style={{ color: "#0B2A4A", marginBottom: "8px" }}>No Subjects Found</h3>
          <p style={{ color: "#64748B" }}>
            {searchTerm || selectedSemester !== "all"
              ? "No subjects match your search criteria. Try adjusting your filters."
              : "You haven't been assigned any subjects yet. Contact your admin to assign subjects."}
          </p>
        </div>
      ) : (
        <div style={styles.subjectsGrid}>
          {filteredSubjects.map((subject) => {
            const subjectId = subject._id;
            const stats = subjectStats[subjectId] || {
              units: { total: 0, pending: 0, approved: 0, rejected: 0, data: [] },
              content: { total: 0, pending: 0, approved: 0, rejected: 0, data: [] },
              assignments: { total: 0, pending: 0, approved: 0, rejected: 0, data: [] },
              quizzes: { total: 0, pending: 0, approved: 0, rejected: 0, data: [] }
            };
            
            const verificationStats = verificationData[subjectId] || { pending: 0, rejected: 0, approved: 0 };
            const verificationBadge = getVerificationBadge(verificationStats, subjectId);
            const isExpanded = expandedSubject === subjectId;
            
            const hasPendingRequest = pendingRequests[subjectId];
            const subjectPendingItemIds = pendingItemIds[subjectId] || {
              units: new Set(),
              content: new Set(),
              assignments: new Set(),
              quizzes: new Set()
            };
            
            // Calculate NEW pending items (not already in request)
            const newPendingUnits = stats.units.data.filter(unit => 
              unit.status === 'pending' && !subjectPendingItemIds.units.has(unit._id?.toString())
            ).length;
            const newPendingContent = stats.content.data.filter(content => 
              content.status === 'pending' && !subjectPendingItemIds.content.has(content._id?.toString())
            ).length;
            const newPendingAssignments = stats.assignments.data.filter(assignment => 
              assignment.status === 'pending' && !subjectPendingItemIds.assignments.has(assignment._id?.toString())
            ).length;
            const newPendingQuizzes = stats.quizzes.data.filter(quiz => 
              quiz.status === 'pending' && !subjectPendingItemIds.quizzes.has(quiz._id?.toString())
            ).length;
            
            const totalNewPending = newPendingUnits + newPendingContent + newPendingAssignments + newPendingQuizzes;
            const totalPending = stats.units.pending + stats.content.pending + stats.assignments.pending + stats.quizzes.pending;
            const subjectRejectedCount = getSubjectRejectedItems(subjectId).length;
            
            const hasAllData = stats.units.total > 0 && 
                              stats.content.total > 0 && 
                              stats.assignments.total > 0 && 
                              stats.quizzes.total > 0;
            
            const isSubjectInactive = subject.status !== "active";
            
            return (
              <div
                key={subject._id}
                style={styles.subjectCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 20px 30px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.02)";
                }}
              >
                <div style={styles.cardHeader} onClick={() => toggleExpand(subjectId)}>
                  <div style={styles.subjectIcon}>
                    {subject.name?.charAt(0)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={styles.subjectCode}>{subject.code}</span>
                    {isExpanded ? <FiChevronUp size={18} style={styles.expandIcon} /> : <FiChevronDown size={18} style={styles.expandIcon} />}
                  </div>
                </div>

                <h3 style={styles.subjectName}>{subject.name}</h3>

                <div style={styles.statusContainer}>
                  <span style={styles.statusBadge(
                    subject.status === "active" ? "#16A34A" : "#DC2626",
                    subject.status === "active" ? "#DCFCE7" : "#FEE2E2"
                  )}>
                    {subject.status === "active" ? "Active" : "Inactive"}
                  </span>
                  
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div 
                      style={{
                        ...styles.verificationBadge,
                        background: verificationBadge.bgColor,
                        color: verificationBadge.color
                      }}
                      onClick={() => {
                        if (totalNewPending > 0 || (!hasPendingRequest && totalPending > 0)) {
                          handleVerifyClick(subjectId, subject.name);
                        }
                      }}
                    >
                      {verificationBadge.icon}
                      {verificationBadge.label}
                    </div>
                    
                    {/* Subject-level Re-verify Button */}
                    {subjectRejectedCount > 0 && !hasPendingRequest && (
                      <button
                        style={styles.subjectReverifyBtn}
                        onClick={() => handleSubjectReverify(subjectId, subject.name)}
                        disabled={subjectReverifyLoading[subjectId]}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      >
                        {subjectReverifyLoading[subjectId] ? (
                          <div style={{ width: "12px", height: "12px", border: "2px solid #059669", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        ) : (
                          <FiRefreshCw size={12} />
                        )}
                        Re-verify ({subjectRejectedCount})
                      </button>
                    )}
                  </div>
                </div>

                <div style={styles.subjectDetails}>
                  <div style={styles.detailItem}>
                    <FiGrid size={14} color="#64748B" />
                    <span>Course: {subject.course}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <FiCalendar size={14} color="#64748B" />
                    <span>Semester: {subject.semester}</span>
                  </div>
                  {subject.division && (
                    <div style={styles.detailItem}>
                      <FiUsers size={14} color="#64748B" />
                      <span>Division: {subject.division}</span>
                    </div>
                  )}
                </div>

                <div style={styles.contentStatsGrid}>
                  <div style={styles.contentStatItem}>
                    <div style={styles.contentStatIcon("#0B2A4A")}>
                      <FiLayers />
                    </div>
                    <div style={styles.contentStatLabel}>Units</div>
                    <div style={styles.contentStatValue}>{stats.units.total}</div>
                    {stats.units.total === 0 && <div style={{ fontSize: '10px', color: '#DC2626' }}>Missing</div>}
                  </div>
                  <div style={styles.contentStatItem}>
                    <div style={styles.contentStatIcon("#D97706")}>
                      <FiFileText />
                    </div>
                    <div style={styles.contentStatLabel}>Content</div>
                    <div style={styles.contentStatValue}>{stats.content.total}</div>
                    {stats.content.total === 0 && <div style={{ fontSize: '10px', color: '#DC2626' }}>Missing</div>}
                  </div>
                  <div style={styles.contentStatItem}>
                    <div style={styles.contentStatIcon("#7C3AED")}>
                      <FiClipboard />
                    </div>
                    <div style={styles.contentStatLabel}>Assignments</div>
                    <div style={styles.contentStatValue}>{stats.assignments.total}</div>
                    {stats.assignments.total === 0 && <div style={{ fontSize: '10px', color: '#DC2626' }}>Missing</div>}
                  </div>
                  <div style={styles.contentStatItem}>
                    <div style={styles.contentStatIcon("#059669")}>
                      <FiHelpCircle />
                    </div>
                    <div style={styles.contentStatLabel}>Quizzes</div>
                    <div style={styles.contentStatValue}>{stats.quizzes.total}</div>
                    {stats.quizzes.total === 0 && <div style={{ fontSize: '10px', color: '#DC2626' }}>Missing</div>}
                  </div>
                </div>

                {totalNewPending > 0 && (
                  <div style={styles.pendingBar} onClick={() => handleVerifyClick(subjectId, subject.name)}>
                    <span style={{ fontWeight: "600", color: "#92400E" }}>
                      {totalNewPending} New Pending Item{totalNewPending !== 1 ? 's' : ''}
                    </span>
                    <FiEye size={16} color="#92400E" />
                  </div>
                )}

                {hasPendingRequest && totalNewPending === 0 && totalPending > 0 && (
                  <div style={{
                    ...styles.pendingBar,
                    background: '#DBEAFE',
                    borderLeftColor: '#2563EB'
                  }}>
                    <span style={{ fontWeight: "600", color: "#1E40AF" }}>
                      {totalPending} Item{totalPending !== 1 ? 's' : ''} Pending Review
                    </span>
                    <FiClockIcon size={16} color="#1E40AF" />
                  </div>
                )}

                {isExpanded && (
                  <div style={styles.expandedSection}>
                    {/* Units Section */}
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "600", fontSize: "14px", color: "#0B2A4A" }}>Units</span>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <span style={{ color: "#D97706", fontSize: "12px" }}>⏳ {stats.units.pending}</span>
                          <span style={{ color: "#059669", fontSize: "12px" }}>✓ {stats.units.approved}</span>
                          <span style={{ color: "#DC2626", fontSize: "12px" }}>✗ {stats.units.rejected}</span>
                        </div>
                      </div>
                      {stats.units.data.length > 0 ? (
                        stats.units.data.slice(0, 3).map((unit, idx) => (
                          <div key={idx} style={styles.itemRow}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                              <div style={styles.itemType}>
                                <FiLayers size={12} color="#64748B" />
                                <span>Unit {unit.unitNumber}: {unit.unitTitle}</span>
                                {unit.status === 'pending' && subjectPendingItemIds.units?.has(unit._id?.toString()) && (
                                  <span style={{ fontSize: '10px', color: '#2563EB', marginLeft: '8px' }}>(in review)</span>
                                )}
                                {unit.status === 'pending' && !subjectPendingItemIds.units?.has(unit._id?.toString()) && hasPendingRequest && (
                                  <span style={{ fontSize: '10px', color: '#D97706', marginLeft: '8px' }}>(new)</span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={styles.itemStatus(unit.status)}>{unit.status}</span>
                                {unit.status === 'rejected' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateItem('unit', unit._id, subject._id, subject.name, unit.unitTitle)}
                                      style={{
                                        padding: "4px 12px",
                                        borderRadius: "6px",
                                        border: "none",
                                        fontSize: "11px",
                                        fontWeight: "500",
                                        background: "#FEE2E2",
                                        color: "#DC2626",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FiEdit2 size={12} />
                                      Update
                                    </button>
                                    <button
                                      onClick={() => handleReverifyItem('unit', unit._id, subject._id, subject.name, unit.unitTitle)}
                                      disabled={reverifyLoading[unit._id]}
                                      style={{
                                        padding: "4px 12px",
                                        borderRadius: "6px",
                                        border: "none",
                                        fontSize: "11px",
                                        fontWeight: "500",
                                        background: "#DCFCE7",
                                        color: "#059669",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FiRefreshCw size={12} />
                                      Re-verify
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: "center", padding: "8px", color: "#64748B", fontSize: "12px" }}>
                          No units created yet
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "600", fontSize: "14px", color: "#0B2A4A" }}>Content Topics</span>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <span style={{ color: "#D97706", fontSize: "12px" }}>⏳ {stats.content.pending}</span>
                          <span style={{ color: "#059669", fontSize: "12px" }}>✓ {stats.content.approved}</span>
                          <span style={{ color: "#DC2626", fontSize: "12px" }}>✗ {stats.content.rejected}</span>
                        </div>
                      </div>
                      {stats.content.data.length > 0 ? (
                        stats.content.data.slice(0, 3).map((content, idx) => (
                          <div key={idx} style={styles.itemRow}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                              <div style={styles.itemType}>
                                <FiFileText size={12} color="#64748B" />
                                <span>{content.topic}</span>
                                {content.status === 'pending' && subjectPendingItemIds.content?.has(content._id?.toString()) && (
                                  <span style={{ fontSize: '10px', color: '#2563EB', marginLeft: '8px' }}>(in review)</span>
                                )}
                                {content.status === 'pending' && !subjectPendingItemIds.content?.has(content._id?.toString()) && hasPendingRequest && (
                                  <span style={{ fontSize: '10px', color: '#D97706', marginLeft: '8px' }}>(new)</span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={styles.itemStatus(content.status)}>{content.status}</span>
                                {content.status === 'rejected' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateItem('content', content._id, subject._id, subject.name, content.topic)}
                                      style={{
                                        padding: "4px 12px",
                                        borderRadius: "6px",
                                        border: "none",
                                        fontSize: "11px",
                                        fontWeight: "500",
                                        background: "#FEE2E2",
                                        color: "#DC2626",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FiEdit2 size={12} />
                                      Update
                                    </button>
                                    <button
                                      onClick={() => handleReverifyItem('content', content._id, subject._id, subject.name, content.topic)}
                                      disabled={reverifyLoading[content._id]}
                                      style={{
                                        padding: "4px 12px",
                                        borderRadius: "6px",
                                        border: "none",
                                        fontSize: "11px",
                                        fontWeight: "500",
                                        background: "#DCFCE7",
                                        color: "#059669",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FiRefreshCw size={12} />
                                      Re-verify
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: "center", padding: "8px", color: "#64748B", fontSize: "12px" }}>
                          No content created yet
                        </div>
                      )}
                    </div>

                    {/* Assignments Section */}
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "600", fontSize: "14px", color: "#0B2A4A" }}>Assignments</span>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <span style={{ color: "#D97706", fontSize: "12px" }}>⏳ {stats.assignments.pending}</span>
                          <span style={{ color: "#059669", fontSize: "12px" }}>✓ {stats.assignments.approved}</span>
                          <span style={{ color: "#DC2626", fontSize: "12px" }}>✗ {stats.assignments.rejected}</span>
                        </div>
                      </div>
                      {stats.assignments.data.length > 0 ? (
                        stats.assignments.data.slice(0, 3).map((assignment, idx) => (
                          <div key={idx} style={styles.itemRow}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                              <div style={styles.itemType}>
                                <FiClipboard size={12} color="#64748B" />
                                <span>{assignment.title}</span>
                                {assignment.status === 'pending' && subjectPendingItemIds.assignments?.has(assignment._id?.toString()) && (
                                  <span style={{ fontSize: '10px', color: '#2563EB', marginLeft: '8px' }}>(in review)</span>
                                )}
                                {assignment.status === 'pending' && !subjectPendingItemIds.assignments?.has(assignment._id?.toString()) && hasPendingRequest && (
                                  <span style={{ fontSize: '10px', color: '#D97706', marginLeft: '8px' }}>(new)</span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={styles.itemStatus(assignment.status)}>{assignment.status}</span>
                                {assignment.status === 'rejected' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateItem('assignment', assignment._id, subject._id, subject.name, assignment.title)}
                                      style={{
                                        padding: "4px 12px",
                                        borderRadius: "6px",
                                        border: "none",
                                        fontSize: "11px",
                                        fontWeight: "500",
                                        background: "#FEE2E2",
                                        color: "#DC2626",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FiEdit2 size={12} />
                                      Update
                                    </button>
                                    <button
                                      onClick={() => handleReverifyItem('assignment', assignment._id, subject._id, subject.name, assignment.title)}
                                      disabled={reverifyLoading[assignment._id]}
                                      style={{
                                        padding: "4px 12px",
                                        borderRadius: "6px",
                                        border: "none",
                                        fontSize: "11px",
                                        fontWeight: "500",
                                        background: "#DCFCE7",
                                        color: "#059669",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FiRefreshCw size={12} />
                                      Re-verify
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: "center", padding: "8px", color: "#64748B", fontSize: "12px" }}>
                          No assignments created yet
                        </div>
                      )}
                    </div>

                    {/* Quizzes Section */}
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "600", fontSize: "14px", color: "#0B2A4A" }}>Quizzes</span>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <span style={{ color: "#D97706", fontSize: "12px" }}>⏳ {stats.quizzes.pending}</span>
                          <span style={{ color: "#059669", fontSize: "12px" }}>✓ {stats.quizzes.approved}</span>
                          <span style={{ color: "#DC2626", fontSize: "12px" }}>✗ {stats.quizzes.rejected}</span>
                        </div>
                      </div>
                      {stats.quizzes.data.length > 0 ? (
                        stats.quizzes.data.slice(0, 3).map((quiz, idx) => (
                          <div key={idx} style={styles.itemRow}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                              <div style={styles.itemType}>
                                <FiHelpCircle size={12} color="#64748B" />
                                <span>Quiz {quiz._id.slice(-6)}</span>
                                {quiz.status === 'pending' && subjectPendingItemIds.quizzes?.has(quiz._id?.toString()) && (
                                  <span style={{ fontSize: '10px', color: '#2563EB', marginLeft: '8px' }}>(in review)</span>
                                )}
                                {quiz.status === 'pending' && !subjectPendingItemIds.quizzes?.has(quiz._id?.toString()) && hasPendingRequest && (
                                  <span style={{ fontSize: '10px', color: '#D97706', marginLeft: '8px' }}>(new)</span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={styles.itemStatus(quiz.status)}>{quiz.status}</span>
                                {quiz.status === 'rejected' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateItem('quiz', quiz._id, subject._id, subject.name, `Quiz ${quiz._id.slice(-6)}`)}
                                      style={{
                                        padding: "4px 12px",
                                        borderRadius: "6px",
                                        border: "none",
                                        fontSize: "11px",
                                        fontWeight: "500",
                                        background: "#FEE2E2",
                                        color: "#DC2626",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FiEdit2 size={12} />
                                      Update
                                    </button>
                                    <button
                                      onClick={() => handleReverifyItem('quiz', quiz._id, subject._id, subject.name, `Quiz ${quiz._id.slice(-6)}`)}
                                      disabled={reverifyLoading[quiz._id]}
                                      style={{
                                        padding: "4px 12px",
                                        borderRadius: "6px",
                                        border: "none",
                                        fontSize: "11px",
                                        fontWeight: "500",
                                        background: "#DCFCE7",
                                        color: "#059669",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FiRefreshCw size={12} />
                                      Re-verify
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: "center", padding: "8px", color: "#64748B", fontSize: "12px" }}>
                          No quizzes created yet
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={styles.actionButtonsContainer}>
                  {stats.units.total === 0 && (
                    <button
                      style={{
                        ...styles.actionButton, 
                        ...styles.createButton,
                        opacity: isSubjectInactive ? 0.5 : 1,
                        cursor: isSubjectInactive ? "not-allowed" : "pointer"
                      }}
                      onClick={() => !isSubjectInactive && handleCreateContent('unit', subject._id, subject.name)}
                      title={isSubjectInactive ? "Cannot add unit to inactive subject" : "Create Unit"}
                      disabled={isSubjectInactive}
                    >
                      <FiPlusCircle size={16} />
                      Create Unit
                    </button>
                  )}

                  {stats.units.total > 0 && (
                    <>
                      {stats.content.total === 0 && (
                        <button
                          style={{
                            ...styles.actionButton, 
                            ...styles.createButton,
                            opacity: isSubjectInactive ? 0.5 : 1,
                            cursor: isSubjectInactive ? "not-allowed" : "pointer"
                          }}
                          onClick={() => !isSubjectInactive && handleCreateContent('content', subject._id, subject.name)}
                          title={isSubjectInactive ? "Cannot add content to inactive subject" : "Add Content"}
                          disabled={isSubjectInactive}
                        >
                          <FiPlusCircle size={16} />
                          Add Content
                        </button>
                      )}
                      
                      {stats.assignments.total === 0 && (
                        <button
                          style={{
                            ...styles.actionButton, 
                            ...styles.createButton,
                            opacity: isSubjectInactive ? 0.5 : 1,
                            cursor: isSubjectInactive ? "not-allowed" : "pointer"
                          }}
                          onClick={() => !isSubjectInactive && handleCreateContent('assignment', subject._id, subject.name)}
                          title={isSubjectInactive ? "Cannot add assignment to inactive subject" : "Add Assignment"}
                          disabled={isSubjectInactive}
                        >
                          <FiPlusCircle size={16} />
                          Add Assignment
                        </button>
                      )}
                      
                      {stats.quizzes.total === 0 && (
                        <button
                          style={{
                            ...styles.actionButton, 
                            ...styles.createButton,
                            opacity: isSubjectInactive ? 0.5 : 1,
                            cursor: isSubjectInactive ? "not-allowed" : "pointer"
                          }}
                          onClick={() => !isSubjectInactive && handleCreateContent('quiz', subject._id, subject.name)}
                          title={isSubjectInactive ? "Cannot add quiz to inactive subject" : "Add Quiz"}
                          disabled={isSubjectInactive}
                        >
                          <FiPlusCircle size={16} />
                          Add Quiz
                        </button>
                      )}
                    </>
                  )}
                </div>

                {hasAllData && (
                  <div style={{ marginTop: '10px' }}>
                    {totalNewPending > 0 ? (
                      // Has NEW pending items - show Verify button for new items
                      <button
                        style={{
                          ...styles.actionButton,
                          ...styles.verifyButton,
                          width: '100%',
                          opacity: isSubjectInactive ? 0.5 : 1,
                          cursor: isSubjectInactive ? "not-allowed" : "pointer"
                        }}
                        onClick={() => {
                          if (isSubjectInactive) {
                            toast.error("Cannot request verification for inactive subject");
                            return;
                          }
                          handleVerifyClick(subject._id, subject.name);
                        }}
                        disabled={isSubjectInactive}
                      >
                        <FiShield size={16} />
                        Verify ({totalNewPending} new)
                      </button>
                    ) : hasPendingRequest ? (
                      // Has pending request but no NEW pending items - show disabled
                      <div
                        style={{
                          ...styles.actionButton,
                          background: '#DBEAFE',
                          color: '#1E40AF',
                          width: '100%',
                          cursor: 'default',
                          opacity: 0.7
                        }}
                      >
                        <FiClockIcon size={16} />
                        Request Pending
                      </div>
                    ) : totalPending > 0 ? (
                      // No pending request but has pending items - show Verify button
                      <button
                        style={{
                          ...styles.actionButton,
                          ...styles.verifyButton,
                          width: '100%',
                          opacity: isSubjectInactive ? 0.5 : 1,
                          cursor: isSubjectInactive ? "not-allowed" : "pointer"
                        }}
                        onClick={() => {
                          if (isSubjectInactive) {
                            toast.error("Cannot request verification for inactive subject");
                            return;
                          }
                          handleVerifyClick(subject._id, subject.name);
                        }}
                        disabled={isSubjectInactive}
                      >
                        <FiShield size={16} />
                        Verify ({totalPending} pending)
                      </button>
                    ) : (
                      // No pending request and no pending items - show Request Verification button
                      <button
                        style={{
                          ...styles.actionButton,
                          ...styles.requestVerifyButton,
                          width: '100%',
                          opacity: isSubjectInactive ? 0.5 : 1,
                          cursor: isSubjectInactive ? "not-allowed" : "pointer"
                        }}
                        onClick={() => {
                          if (isSubjectInactive) {
                            toast.error("Cannot request verification for inactive subject");
                            return;
                          }
                          handleRequestVerification(subject._id, subject.name);
                        }}
                        disabled={isSubjectInactive}
                      >
                        <FiShield size={16} />
                        Request Verification
                      </button>
                    )}
                  </div>
                )}

                {!hasAllData && stats.units.total === 0 && stats.content.total === 0 && stats.assignments.total === 0 && stats.quizzes.total === 0 && (
                  <div style={styles.actionButtonsContainer}>
                    <button
                      style={{
                        ...styles.actionButton, 
                        ...styles.createButton, 
                        width: "100%",
                        opacity: isSubjectInactive ? 0.5 : 1,
                        cursor: isSubjectInactive ? "not-allowed" : "pointer"
                      }}
                      onClick={() => !isSubjectInactive && handleCreateContent('unit', subject._id, subject.name)}
                      title={isSubjectInactive ? "Cannot add unit to inactive subject" : "Create Your First Unit"}
                      disabled={isSubjectInactive}
                    >
                      <FiPlusCircle size={18} />
                      Create Your First Unit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherSubjects;