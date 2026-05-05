import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiHelpCircle,
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
  FiAward,
  FiList
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TeacherQuizzes = () => {
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [animateModal, setAnimateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editQuiz, setEditQuiz] = useState(null);
  const [viewQuiz, setViewQuiz] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  const [cachedQuizzes, setCachedQuizzes] = useState([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalQuestions: 0
  });

  // Form state for adding/editing quizzes
  const [formData, setFormData] = useState({
    subjectId: "",
    unitId: "",
    duration: "",
    questions: []
  });

  // Current question being edited
  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    marks: 1
  });

  // For edit mode
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);

  // Get teacher ID from localStorage on mount
  useEffect(() => {
    const id = localStorage.getItem("userId");
    setTeacherId(id);
  }, []);

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

  // Load saved selections from localStorage on component mount
  useEffect(() => {
    const savedSubject = localStorage.getItem("teacherQuiz_subjectId");
    const savedUnit = localStorage.getItem("teacherQuiz_unitId");
    
    const id = localStorage.getItem("userId");
    if (id) {
      setTeacherId(id);
      fetchTeacherSubjects(id, savedSubject, savedUnit);
      fetchQuizStats(id);
    } else {
      setIsLoadingSubjects(false);
    }
  }, []);

  // Save selections to localStorage whenever they change
  useEffect(() => {
    if (selectedSubject) {
      localStorage.setItem("teacherQuiz_subjectId", selectedSubject);
    } else {
      localStorage.removeItem("teacherQuiz_subjectId");
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedUnit) {
      localStorage.setItem("teacherQuiz_unitId", selectedUnit);
    } else {
      localStorage.removeItem("teacherQuiz_unitId");
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

  // Fetch quizzes when unit changes AND units are loaded
  useEffect(() => {
    if (selectedUnit && !isLoadingUnits && teacherId) {
      fetchQuizzesByUnit(selectedUnit, teacherId);
    } else if (!selectedUnit) {
      setQuizzes([]);
    }
  }, [selectedUnit, isLoadingUnits, teacherId]);


  useEffect(() => {
  const queryParams = new URLSearchParams(window.location.search);
  const editId = queryParams.get('editId');
  const subjectId = queryParams.get('subjectId');
  
  if (editId && subjectId && !loading && cachedQuizzes.length > 0) {
    const quizToEdit = cachedQuizzes.find(quiz => quiz._id === editId);
    if (quizToEdit) {
      setTimeout(() => {
        openEditModal(quizToEdit);
      }, 500);
    }
    window.history.replaceState({}, '', window.location.pathname + `?subjectId=${subjectId}&subjectName=${encodeURIComponent(queryParams.get('subjectName') || '')}`);
  }
}, [loading, cachedQuizzes]);

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

  const fetchQuizzesByUnit = async (unitId, teacherId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/quizzes/unit/${unitId}?teacherId=${teacherId}`,
        {
          headers: {
            'x-teacher-id': teacherId
          }
        }
      );
      setQuizzes(res.data);
      setCachedQuizzes(res.data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizStats = async (teacherId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/quizzes/stats/teacher/${teacherId}`,
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
      duration: "",
      questions: []
    });
  };

  const handleUnitChange = (e) => {
    const unitId = e.target.value;
    setSelectedUnit(unitId);
    setFormData({
      ...formData,
      unitId,
      duration: "",
      questions: []
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuestionChange = (e) => {
    setCurrentQuestion({
      ...currentQuestion,
      question: e.target.value
    });
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions
    });
  };

  const handleCorrectAnswerChange = (index) => {
    setCurrentQuestion({
      ...currentQuestion,
      correctAnswer: index
    });
  };

  const handleMarksChange = (e) => {
    setCurrentQuestion({
      ...currentQuestion,
      marks: parseInt(e.target.value) || 1
    });
  };

  const addQuestion = () => {
    // Validation
    if (!currentQuestion.question) {
      toast.error("Please enter the question");
      return;
    }

    // Check if all options are filled
    for (let i = 0; i < currentQuestion.options.length; i++) {
      if (!currentQuestion.options[i].trim()) {
        toast.error(`Option ${i + 1} is required`);
        return;
      }
    }

    if (editingQuestionIndex >= 0) {
      // Update existing question
      const updatedQuestions = [...formData.questions];
      updatedQuestions[editingQuestionIndex] = { ...currentQuestion };
      setFormData({
        ...formData,
        questions: updatedQuestions
      });
      setEditingQuestionIndex(-1);
      toast.success("Question updated");
    } else {
      // Add new question
      setFormData({
        ...formData,
        questions: [...formData.questions, { ...currentQuestion }]
      });
      toast.success("Question added");
    }

    // Reset current question
    setCurrentQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      marks: 1
    });
  };

  const editQuestion = (index) => {
    setCurrentQuestion({ ...formData.questions[index] });
    setEditingQuestionIndex(index);
  };

  const removeQuestion = (index) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
    
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(-1);
      setCurrentQuestion({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        marks: 1
      });
    }
    
    toast.success("Question removed");
  };

  const cancelEdit = () => {
    setEditingQuestionIndex(-1);
    setCurrentQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      marks: 1
    });
  };

  const handleAddQuiz = async () => {
    try {
      // Validation
      if (!formData.subjectId || !formData.unitId || !formData.duration) {
        toast.error("Please select subject, unit and enter duration");
        return;
      }

      if (formData.questions.length === 0) {
        toast.error("Please add at least one question");
        return;
      }

      const teacherId = localStorage.getItem("userId");
      if (!teacherId) {
        toast.error("Teacher ID not found. Please login again.");
        return;
      }
      
      const quizData = {
        subjectId: formData.subjectId,
        unitId: formData.unitId,
        teacherId: teacherId,
        questions: formData.questions,
        duration: parseInt(formData.duration),
        status: "pending"
      };

      await axios.post(
        "http://localhost:5000/api/quizzes/add",
        quizData,
        {
          headers: {
            'x-teacher-id': teacherId
          }
        }
      );

      toast.success("🎉 Quiz added successfully and sent for approval!");

      setShowAddModal(false);
      resetForm();
      
      // Refresh the quizzes list if a unit is selected
      if (selectedUnit && teacherId) {
        await fetchQuizzesByUnit(selectedUnit, teacherId);
      }
      
      // Refresh stats
      await fetchQuizStats(teacherId);
      
    } catch (error) {
      console.error("Error adding quiz:", error);
      if (error.response) {
        toast.error(error.response.data?.message || "Failed to add quiz");
      } else {
        toast.error("Error: " + error.message);
      }
    }
  };

  const handleEditQuiz = async () => {
    try {
      const teacherId = localStorage.getItem("userId");
      const quizData = {
        questions: formData.questions,
        duration: parseInt(formData.duration)
      };

      await axios.put(
        `http://localhost:5000/api/quizzes/${editQuiz._id}`,
        quizData,
        {
          headers: {
            'x-teacher-id': teacherId
          }
        }
      );

      toast.success("✏️ Quiz updated successfully!");

      setShowEditModal(false);
      setEditQuiz(null);
      resetForm();
      
      // Refresh the quizzes list
      if (selectedUnit && teacherId) {
        await fetchQuizzesByUnit(selectedUnit, teacherId);
      }
      
    } catch (error) {
      console.error("Error updating quiz:", error);
      toast.error(error.response?.data?.message || "Failed to update quiz");
    }
  };

  const handleDeleteQuiz = async () => {
    try {
      const teacherId = localStorage.getItem("userId");
      await axios.delete(`http://localhost:5000/api/quizzes/${deleteId}`, {
        headers: {
          'x-teacher-id': teacherId
        }
      });
      
      toast.success("🗑️ Quiz deleted successfully!");

      setDeleteId(null);
      
      // Refresh the quizzes list
      if (selectedUnit && teacherId) {
        await fetchQuizzesByUnit(selectedUnit, teacherId);
      }
      
      // Refresh stats
      await fetchQuizStats(teacherId);
      
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  const openEditModal = (quiz) => {
    setEditQuiz(quiz);
    setFormData({
      subjectId: quiz.subjectId?._id || quiz.subjectId,
      unitId: quiz.unitId?._id || quiz.unitId,
      duration: quiz.duration,
      questions: quiz.questions || []
    });
    setShowEditModal(true);
    setTimeout(() => setAnimateModal(true), 10);
  };

  const openViewModal = (quiz) => {
    setViewQuiz(quiz);
    setShowViewModal(true);
    setTimeout(() => setAnimateModal(true), 10);
  };

  const resetForm = () => {
    setFormData({
      subjectId: selectedSubject,
      unitId: selectedUnit,
      duration: "",
      questions: []
    });
    setCurrentQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      marks: 1
    });
    setEditingQuestionIndex(-1);
  };

  // Filter quizzes
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz._id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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
    quizzesGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
      gap: "20px"
    },
    quizCard: {
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
      marginBottom: "8px",
      display: "flex",
      alignItems: "center",
      gap: "8px"
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
    questionsPreview: {
      marginTop: "8px",
      padding: "8px",
      background: "#F8FAFC",
      borderRadius: "8px",
      fontSize: "12px"
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
    questionSection: {
      background: "#F8FAFC",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "20px",
      border: "1px solid #E5E9F0"
    },
    questionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px"
    },
    questionTitle: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#0B2A4A"
    },
    optionsContainer: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
      marginBottom: "12px"
    },
    optionItem: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    radioInput: {
      width: "16px",
      height: "16px",
      cursor: "pointer"
    },
    marksInput: {
      width: "80px",
      padding: "8px",
      borderRadius: "6px",
      border: "1px solid #E5E9F0"
    },
    questionList: {
      marginTop: "20px",
      maxHeight: "300px",
      overflowY: "auto"
    },
    questionItem: {
      background: "white",
      borderRadius: "8px",
      padding: "12px",
      marginBottom: "8px",
      border: "1px solid #E5E9F0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    questionText: {
      fontSize: "13px",
      fontWeight: "500",
      color: "#1E293B",
      flex: 1
    },
    questionActions: {
      display: "flex",
      gap: "8px"
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
      width: "700px",
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
      fontSize: "16px",
      fontWeight: "600",
      color: "#0B2A4A",
      marginBottom: "12px"
    },
    questionCard: {
      background: "#F8FAFC",
      borderRadius: "8px",
      padding: "16px",
      marginBottom: "12px"
    },
    questionNumber: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#0B2A4A",
      marginBottom: "8px"
    },
    viewQuestion: {
      fontSize: "15px",
      color: "#1E293B",
      marginBottom: "12px"
    },
    optionsList: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "8px",
      marginBottom: "8px"
    },
    optionText: (isCorrect) => ({
      padding: "8px",
      background: isCorrect ? "#DCFCE7" : "white",
      border: "1px solid",
      borderColor: isCorrect ? "#059669" : "#E5E9F0",
      borderRadius: "6px",
      fontSize: "13px",
      color: isCorrect ? "#059669" : "#1E293B",
      fontWeight: isCorrect ? "500" : "normal"
    }),
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

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.headerTitle}>
            <FiHelpCircle size={28} />
            Quizzes
          </h1>
        </div>
        <p style={styles.headerSubtitle}>
          Create and manage quizzes for your subjects
        </p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon("#0B2A4A", "#E8F0FE")}>
            <FiHelpCircle size={20} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Total Quizzes</div>
            <div style={styles.statValue}>{stats.totalQuizzes}</div>
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

      {/* Filters and Add Button */}
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
              placeholder="Search quizzes..."
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
              duration: "",
              questions: []
            });
            setCurrentQuestion({
              question: "",
              options: ["", "", "", ""],
              correctAnswer: 0,
              marks: 1
            });
            setEditingQuestionIndex(-1);
            setShowAddModal(true);
            setTimeout(() => setAnimateModal(true), 10);
          }}
          disabled={!selectedSubject || !selectedUnit}
        >
          <FiPlus size={18} />
          Add Quiz
        </button>
      </div>

      {/* Quizzes Grid */}
      {!selectedSubject || !selectedUnit ? (
        <div style={styles.emptyState}>
          <FiBookOpen size={48} color="#94A3B8" style={{ marginBottom: "16px" }} />
          <h3 style={{ color: "#0B2A4A", marginBottom: "8px" }}>Select Subject and Unit</h3>
          <p style={{ color: "#64748B" }}>
            Please select a subject and unit to view and manage quizzes
          </p>
        </div>
      ) : loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div style={styles.emptyState}>
          <FiHelpCircle size={48} color="#94A3B8" style={{ marginBottom: "16px" }} />
          <h3 style={{ color: "#0B2A4A", marginBottom: "8px" }}>No Quizzes Found</h3>
          <p style={{ color: "#64748B" }}>
            {searchTerm
              ? "No quizzes match your search"
              : "Click the 'Add Quiz' button to create your first quiz"}
          </p>
        </div>
      ) : (
        <div style={styles.quizzesGrid}>
          {filteredQuizzes.map(quiz => {
            const statusBadge = getStatusBadge(quiz.status);
            
            return (
              <div
                key={quiz._id}
                style={styles.quizCard}
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
                  <span style={styles.statusBadge(quiz.status)}>
                    {statusBadge.icon}
                    {statusBadge.label}
                  </span>
                </div>

                <div style={styles.cardTitle}>
                  <FiList size={16} />
                  Quiz #{quiz._id.slice(-6)}
                </div>

                <div style={styles.cardMeta}>
                  <div style={styles.metaItem}>
                    <FiAward size={14} /> Total Marks: {quiz.totalMarks}
                  </div>
                  <div style={styles.metaItem}>
                    <FiClock size={14} /> Duration: {quiz.duration} minutes
                  </div>
                  <div style={styles.metaItem}>
                    <FiList size={14} /> Questions: {quiz.questions?.length || 0}
                  </div>
                </div>

                <div style={styles.questionsPreview}>
                  <strong>Preview:</strong> {quiz.questions?.slice(0, 2).map((q, i) => (
                    <div key={i} style={{ marginTop: "4px" }}>
                      {i+1}. {q.question.substring(0, 50)}
                      {q.question.length > 50 ? '...' : ''}
                    </div>
                  ))}
                  {quiz.questions?.length > 2 && (
                    <div style={{ marginTop: "4px", color: "#64748B" }}>
                      +{quiz.questions.length - 2} more questions
                    </div>
                  )}
                </div>

                <div style={styles.cardFooter}>
                  <div style={styles.actionButtons}>
                    <button
                      style={styles.iconButton("#64748B", "#F1F5F9")}
                      onClick={() => openViewModal(quiz)}
                      title="View"
                    >
                      <FiEye size={16} />
                    </button>
                    <button
                      style={styles.iconButton("#2563EB", "#EFF6FF")}
                      onClick={() => openEditModal(quiz)}
                      title="Edit"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      style={styles.iconButton("#DC2626", "#FEE2E2")}
                      onClick={() => setDeleteId(quiz._id)}
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                {quiz.adminFeedback && quiz.status === "rejected" && (
                  <div style={{
                    marginTop: "12px",
                    padding: "8px",
                    background: "#FEF3C7",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#92400E"
                  }}>
                    <strong>Feedback:</strong> {quiz.adminFeedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Quiz Modal */}
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
              <h3 style={styles.modalTitle}>Add New Quiz</h3>
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

            {/* Duration */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Duration (minutes) *</label>
              <input
                type="number"
                name="duration"
                style={styles.input}
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 30, 60, 90"
                min="1"
              />
            </div>

            {/* Add Question Section */}
            <div style={styles.questionSection}>
              <div style={styles.questionHeader}>
                <span style={styles.questionTitle}>
                  {editingQuestionIndex >= 0 ? `Edit Question ${editingQuestionIndex + 1}` : 'Add New Question'}
                </span>
                {editingQuestionIndex >= 0 && (
                  <button
                    onClick={cancelEdit}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748B",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {/* Question Input */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Question</label>
                <input
                  type="text"
                  style={styles.input}
                  value={currentQuestion.question}
                  onChange={handleQuestionChange}
                  placeholder="Enter your question"
                />
              </div>

              {/* Options */}
              <div style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} style={styles.optionItem}>
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={currentQuestion.correctAnswer === index}
                      onChange={() => handleCorrectAnswerChange(index)}
                      style={styles.radioInput}
                    />
                    <input
                      type="text"
                      style={styles.input}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Marks */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Marks for this question</label>
                <input
                  type="number"
                  style={styles.marksInput}
                  value={currentQuestion.marks}
                  onChange={handleMarksChange}
                  min="1"
                />
              </div>

              {/* Add Question Button */}
              <button
                onClick={addQuestion}
                style={{
                  ...styles.addButton,
                  marginLeft: 0,
                  width: "100%",
                  justifyContent: "center"
                }}
              >
                <FiPlus size={16} />
                {editingQuestionIndex >= 0 ? 'Update Question' : 'Add Question'}
              </button>
            </div>

            {/* Question List */}
            {formData.questions.length > 0 && (
              <div style={styles.questionList}>
                <label style={styles.label}>Added Questions ({formData.questions.length})</label>
                {formData.questions.map((q, index) => (
                  <div key={index} style={styles.questionItem}>
                    <div style={styles.questionText}>
                      <strong>Q{index + 1}:</strong> {q.question.substring(0, 50)}
                      {q.question.length > 50 ? '...' : ''} ({q.marks} marks)
                    </div>
                    <div style={styles.questionActions}>
                      <FiEdit
                        size={14}
                        color="#2563EB"
                        style={{ cursor: "pointer" }}
                        onClick={() => editQuestion(index)}
                      />
                      <FiTrash2
                        size={14}
                        color="#DC2626"
                        style={{ cursor: "pointer" }}
                        onClick={() => removeQuestion(index)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

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
              <button style={styles.saveBtn} onClick={handleAddQuiz}>
                <FiSave size={16} />
                Add Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quiz Modal */}
      {showEditModal && editQuiz && (
        <div style={styles.modalOverlay} onClick={() => {
          setAnimateModal(false);
          setTimeout(() => {
            setShowEditModal(false);
            setEditQuiz(null);
            resetForm();
          }, 200);
        }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Quiz</h3>
              <div
                style={styles.closeIcon}
                onClick={() => {
                  setAnimateModal(false);
                  setTimeout(() => {
                    setShowEditModal(false);
                    setEditQuiz(null);
                    resetForm();
                  }, 200);
                }}
              >
                <FiX size={20} />
              </div>
            </div>

            {/* Duration */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Duration (minutes) *</label>
              <input
                type="number"
                name="duration"
                style={styles.input}
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 30, 60, 90"
                min="1"
              />
            </div>

            {/* Add Question Section */}
            <div style={styles.questionSection}>
              <div style={styles.questionHeader}>
                <span style={styles.questionTitle}>
                  {editingQuestionIndex >= 0 ? `Edit Question ${editingQuestionIndex + 1}` : 'Add New Question'}
                </span>
                {editingQuestionIndex >= 0 && (
                  <button
                    onClick={cancelEdit}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748B",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              {/* Question Input */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Question</label>
                <input
                  type="text"
                  style={styles.input}
                  value={currentQuestion.question}
                  onChange={handleQuestionChange}
                  placeholder="Enter your question"
                />
              </div>

              {/* Options */}
              <div style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} style={styles.optionItem}>
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={currentQuestion.correctAnswer === index}
                      onChange={() => handleCorrectAnswerChange(index)}
                      style={styles.radioInput}
                    />
                    <input
                      type="text"
                      style={styles.input}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Marks */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Marks for this question</label>
                <input
                  type="number"
                  style={styles.marksInput}
                  value={currentQuestion.marks}
                  onChange={handleMarksChange}
                  min="1"
                />
              </div>

              {/* Add Question Button */}
              <button
                onClick={addQuestion}
                style={{
                  ...styles.addButton,
                  marginLeft: 0,
                  width: "100%",
                  justifyContent: "center"
                }}
              >
                <FiPlus size={16} />
                {editingQuestionIndex >= 0 ? 'Update Question' : 'Add Question'}
              </button>
            </div>

            {/* Question List */}
            {formData.questions.length > 0 && (
              <div style={styles.questionList}>
                <label style={styles.label}>Added Questions ({formData.questions.length})</label>
                {formData.questions.map((q, index) => (
                  <div key={index} style={styles.questionItem}>
                    <div style={styles.questionText}>
                      <strong>Q{index + 1}:</strong> {q.question.substring(0, 50)}
                      {q.question.length > 50 ? '...' : ''} ({q.marks} marks)
                    </div>
                    <div style={styles.questionActions}>
                      <FiEdit
                        size={14}
                        color="#2563EB"
                        style={{ cursor: "pointer" }}
                        onClick={() => editQuestion(index)}
                      />
                      <FiTrash2
                        size={14}
                        color="#DC2626"
                        style={{ cursor: "pointer" }}
                        onClick={() => removeQuestion(index)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => {
                  setAnimateModal(false);
                  setTimeout(() => {
                    setShowEditModal(false);
                    setEditQuiz(null);
                    resetForm();
                  }, 200);
                }}
              >
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={handleEditQuiz}>
                <FiRefreshCw size={16} />
                Update Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Quiz Modal */}
      {showViewModal && viewQuiz && (
        <div style={styles.modalOverlay} onClick={() => {
          setAnimateModal(false);
          setTimeout(() => setShowViewModal(false), 200);
        }}>
          <div style={styles.viewModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.viewHeader}>
              <div style={styles.viewTitle}>
                <h2 style={styles.viewName}>Quiz Details</h2>
                <p style={styles.viewMeta}>
                  Created on {new Date(viewQuiz.createdAt).toLocaleDateString()}
                </p>
                <p style={styles.viewMeta}>
                  Duration: {viewQuiz.duration} minutes | Total Marks: {viewQuiz.totalMarks}
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

            {/* Questions */}
            {viewQuiz.questions && viewQuiz.questions.length > 0 && (
              <div style={styles.viewSection}>
                <div style={styles.viewLabel}>Questions ({viewQuiz.questions.length})</div>
                {viewQuiz.questions.map((q, qIndex) => (
                  <div key={qIndex} style={styles.questionCard}>
                    <div style={styles.questionNumber}>Question {qIndex + 1} (Marks: {q.marks})</div>
                    <div style={styles.viewQuestion}>{q.question}</div>
                    <div style={styles.optionsList}>
                      {q.options.map((option, oIndex) => (
                        <div 
                          key={oIndex} 
                          style={styles.optionText(q.correctAnswer === oIndex)}
                        >
                          {String.fromCharCode(65 + oIndex)}. {option}
                          {q.correctAnswer === oIndex && " ✓"}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewQuiz.adminFeedback && viewQuiz.status === "rejected" && (
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
                <p style={{ color: "#92400E", margin: 0 }}>{viewQuiz.adminFeedback}</p>
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
              Delete Quiz
            </h3>
            
            <p style={{
              margin: "0 0 28px 0",
              color: "#475569",
              fontSize: "15px",
              lineHeight: "1.6",
              textAlign: "center"
            }}>
              Are you sure you want to delete this quiz?<br />
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
                onClick={handleDeleteQuiz}
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

export default TeacherQuizzes;