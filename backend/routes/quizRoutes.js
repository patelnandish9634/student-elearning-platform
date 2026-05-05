const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const Unit = require("../models/Unit");

/* ================= ADD NEW QUIZ ================= */
router.post("/add", async (req, res) => {
  try {
    const {
      subjectId,
      unitId,
      questions,
      duration,
      teacherId,
      status
    } = req.body;

    console.log("Received quiz data:", { 
      subjectId, unitId, questionsCount: questions?.length, duration, teacherId 
    });

    // Validation
    if (!subjectId || !unitId || !questions || !duration || !teacherId) {
      return res.status(400).json({ 
        message: "Subject, Unit, Questions, Duration and Teacher are required" 
      });
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({ 
        message: "At least one question is required" 
      });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || !q.options || q.options.length < 2 || q.correctAnswer === undefined) {
        return res.status(400).json({ 
          message: `Question ${i + 1}: Question, options (at least 2), and correct answer are required` 
        });
      }
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        return res.status(400).json({ 
          message: `Question ${i + 1}: Correct answer index is invalid` 
        });
      }
      if (!q.marks || q.marks < 1) {
        return res.status(400).json({ 
          message: `Question ${i + 1}: Marks are required and must be at least 1` 
        });
      }
    }

    // Check if unit exists
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // Calculate total marks
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    // Create quiz WITHOUT using pre-save middleware
    const quiz = new Quiz({
      subjectId,
      unitId,
      questions,
      totalMarks, // Set totalMarks explicitly
      duration: parseInt(duration),
      teacherId,
      status: status || "pending"
    });

    // Save the quiz
    await quiz.save();
    
    // ✅ FIX: Add quiz ID to unit's quizzes array
    if (!unit.quizzes) unit.quizzes = [];
    unit.quizzes.push(quiz._id);
    await unit.save();
    console.log(`✅ Added quiz ${quiz._id} to unit ${unitId} quizzes array. Total quizzes now: ${unit.quizzes.length}`);
    
    // Populate references
    await quiz.populate("subjectId");
    await quiz.populate("unitId");
    await quiz.populate("teacherId", "name email");

    res.status(201).json({
      message: "Quiz added successfully",
      quiz
    });

  } catch (error) {
    console.error("Error adding quiz:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

/* ================= GET ALL QUIZZES FOR A TEACHER ================= */
router.get("/teacher/:teacherId", async (req, res) => {
  try {
    const quizzes = await Quiz.find({ teacherId: req.params.teacherId })
      .populate("subjectId")
      .populate("unitId")
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET ALL QUIZZES FOR A UNIT WITH TEACHER FILTER ================= */
router.get("/unit/:unitId", async (req, res) => {
  try {
    const { teacherId } = req.query;
    
    let query = { unitId: req.params.unitId };
    
    // Add teacher filter if provided
    if (teacherId) {
      query.teacherId = teacherId;
    }
    
    const quizzes = await Quiz.find(query)
      .populate("subjectId")
      .populate("unitId")
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET SINGLE QUIZ ================= */
router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("subjectId")
      .populate("unitId")
      .populate("teacherId", "name email");
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE QUIZ ================= */
// IMPORTANT: This endpoint DOES NOT change the status
// Only updates quiz data, status remains the same
router.put("/:id", async (req, res) => {
  try {
    const {
      questions,
      duration
    } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const originalStatus = quiz.status; // Store original status

    // Validate questions if provided
    if (questions) {
      if (questions.length === 0) {
        return res.status(400).json({ message: "At least one question is required" });
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question || !q.options || q.options.length < 2 || q.correctAnswer === undefined) {
          return res.status(400).json({ 
            message: `Question ${i + 1}: Question, options (at least 2), and correct answer are required` 
          });
        }
        if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
          return res.status(400).json({ 
            message: `Question ${i + 1}: Correct answer index is invalid` 
          });
        }
        if (!q.marks || q.marks < 1) {
          return res.status(400).json({ 
            message: `Question ${i + 1}: Marks are required and must be at least 1` 
          });
        }
      }
    }

    // Update fields ONLY - DO NOT CHANGE STATUS
    if (questions) {
      quiz.questions = questions;
      quiz.totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    }
    
    quiz.duration = duration ? parseInt(duration) : quiz.duration;
    // Status remains unchanged - if it was 'rejected', it stays 'rejected'

    await quiz.save();
    await quiz.populate("subjectId");
    await quiz.populate("unitId");
    await quiz.populate("teacherId", "name email");

    console.log(`Quiz ${quiz._id} updated. Status unchanged: ${originalStatus} -> ${quiz.status}`);

    res.json({
      message: "Quiz updated successfully. Status unchanged.",
      quiz,
      statusUnchanged: true,
      originalStatus: originalStatus,
      currentStatus: quiz.status
    });

  } catch (error) {
    console.error("Error updating quiz:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

/* ================= DELETE QUIZ ================= */
router.delete("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    await Quiz.findByIdAndDelete(req.params.id);

    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE QUIZ STATUS (ADMIN ONLY) ================= */
router.put("/:id/status", async (req, res) => {
  try {
    const { status, adminFeedback } = req.body;
    
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    quiz.status = status;
    if (adminFeedback) {
      quiz.adminFeedback = adminFeedback;
    }
    
    await quiz.save();

    console.log(`Quiz ${quiz._id} status updated by admin: ${status}`);

    res.json({
      message: `Quiz ${status}`,
      quiz
    });

  } catch (error) {
    console.error("Error updating quiz status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET QUIZ STATS FOR A TEACHER ================= */
router.get("/stats/teacher/:teacherId", async (req, res) => {
  try {
    const quizzes = await Quiz.find({ teacherId: req.params.teacherId });
    
    const stats = {
      totalQuizzes: quizzes.length,
      pending: quizzes.filter(q => q.status === "pending").length,
      approved: quizzes.filter(q => q.status === "approved").length,
      rejected: quizzes.filter(q => q.status === "rejected").length,
      totalQuestions: quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0)
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching quiz stats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all quizzes by teacher (duplicate endpoint removed - keeping one)
router.get("/teacher/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const quizzes = await Quiz.find({ teacherId })
      .populate('subjectId', 'name code semester')
      .populate('unitId', 'unitNumber unitTitle')
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= RE-VERIFY QUIZ ENDPOINT ================= */
// PUT /api/quizzes/:id/reverify - Update quiz from rejected to pending for re-verification
router.put("/:id/reverify", async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, teacherName } = req.body;
    
    console.log(`Re-verify request received for quiz: ${id}`);
    console.log(`Teacher ID: ${teacherId}`);
    
    const quiz = await Quiz.findById(id);
    
    if (!quiz) {
      return res.status(404).json({ 
        success: false,
        message: "Quiz not found" 
      });
    }
    
    console.log(`Current quiz status: ${quiz.status}`);
    console.log(`Quiz teacher ID: ${quiz.teacherId}`);
    
    // Verify that this quiz belongs to the teacher
    if (quiz.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false,
        message: "You can only re-verify your own quizzes" 
      });
    }
    
    const oldStatus = quiz.status;
    
    // Update status to pending for re-verification
    quiz.status = 'pending';
    quiz.adminFeedback = null; // Clear previous rejection feedback
    quiz.reVerificationRequested = true;
    quiz.reVerificationDate = new Date();
    quiz.reVerificationCount = (quiz.reVerificationCount || 0) + 1;
    
    await quiz.save();
    
    console.log(`Quiz ${id} re-verification: ${oldStatus} -> pending`);
    
    res.json({ 
      success: true, 
      message: `Quiz re-verification requested. Status changed from ${oldStatus} to pending`,
      quiz: {
        _id: quiz._id,
        oldStatus: oldStatus,
        newStatus: quiz.status,
        totalQuestions: quiz.questions?.length || 0,
        totalMarks: quiz.totalMarks,
        reVerificationRequested: quiz.reVerificationRequested,
        reVerificationDate: quiz.reVerificationDate,
        reVerificationCount: quiz.reVerificationCount
      }
    });
    
  } catch (error) {
    console.error("Error in re-verify quiz:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error: " + error.message 
    });
  }
});

// DEBUG: Check quiz status endpoint
router.get("/debug/:id/status", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.json({
      id: quiz._id,
      status: quiz.status,
      reVerificationRequested: quiz.reVerificationRequested,
      adminFeedback: quiz.adminFeedback,
      reVerificationCount: quiz.reVerificationCount,
      totalQuestions: quiz.questions?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/all", async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('subjectId teacherId');
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;