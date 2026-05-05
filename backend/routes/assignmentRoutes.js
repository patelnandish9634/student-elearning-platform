const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/verifytoken");
const Assignment = require("../models/Assignment");
const Unit = require("../models/Unit");
const AssignmentSubmission = require("../models/AssignmentSubmission");

/* ================= MULTER CONFIG FOR TEACHER FILE UPLOADS ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/assignments";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|zip|rar|txt/;
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, ZIP, RAR and TXT files are allowed"));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/* ================= MULTER CONFIG FOR STUDENT SUBMISSIONS ================= */
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/assignments/submissions";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  }
});

const submissionUpload = multer({ 
  storage: submissionStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/* ================= ADD NEW ASSIGNMENT ================= */
router.post("/add", upload.single("assignmentFile"), async (req, res) => {
  try {
    const {
      subjectId,
      unitId,
      title,
      description,
      totalMarks,
      deadline,
      teacherId,
      status
    } = req.body;

    console.log("Received assignment data:", { 
      subjectId, unitId, title, totalMarks, deadline, teacherId 
    });

    // Validation
    if (!subjectId || !unitId || !title || !totalMarks || !deadline || !teacherId) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        const filePath = path.join("uploads/assignments", req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(400).json({ 
        message: "Subject, Unit, Title, Total Marks, Deadline and Teacher are required" 
      });
    }

    // Check if unit exists
    const unit = await Unit.findById(unitId);
    if (!unit) {
      // Clean up uploaded file
      if (req.file) {
        const filePath = path.join("uploads/assignments", req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(404).json({ message: "Unit not found" });
    }

    // Process uploaded file
    let fileData = null;
    if (req.file) {
      fileData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      };
    }

    const assignment = new Assignment({
      subjectId,
      unitId,
      title,
      description: description || "",
      assignmentFile: fileData,
      totalMarks: parseInt(totalMarks),
      deadline: new Date(deadline),
      teacherId,
      status: status || "pending"
    });

    await assignment.save();

    const unitForAssignment = await Unit.findById(unitId);
    if (unitForAssignment) {
      if (!unitForAssignment.assignments) unitForAssignment.assignments = [];
      unitForAssignment.assignments.push(assignment._id);
      await unitForAssignment.save();
      console.log(`✅ Added assignment ${assignment._id} to unit ${unitId} assignments array`);
    }
    
    // Populate references
    await assignment.populate("subjectId");
    await assignment.populate("unitId");
    await assignment.populate("teacherId", "name email");

    res.status(201).json({
      message: "Assignment added successfully",
      assignment
    });

  } catch (error) {
    console.error("Error adding assignment:", error);
    // Clean up uploaded file if error occurs
    if (req.file) {
      const filePath = path.join("uploads/assignments", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

/* ================= GET ALL ASSIGNMENTS FOR A TEACHER ================= */
router.get("/teacher/:teacherId", async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacherId: req.params.teacherId })
      .populate("subjectId")
      .populate("unitId")
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET ALL ASSIGNMENTS FOR A UNIT WITH TEACHER FILTER ================= */
router.get("/unit/:unitId", async (req, res) => {
  try {
    const { teacherId } = req.query;
    
    let query = { unitId: req.params.unitId };
    
    // Add teacher filter if provided
    if (teacherId) {
      query.teacherId = teacherId;
    }
    
    const assignments = await Assignment.find(query)
      .populate("subjectId")
      .populate("unitId")
      .populate("teacherId", "name email")
      .sort({ deadline: 1 });

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET SINGLE ASSIGNMENT ================= */
router.get("/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("subjectId")
      .populate("unitId")
      .populate("teacherId", "name email");
    
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json(assignment);
  } catch (error) {
    console.error("Error fetching assignment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE ASSIGNMENT ================= */
// IMPORTANT: This endpoint DOES NOT change the status
// Only updates assignment data, status remains the same
router.put("/:id", upload.single("assignmentFile"), async (req, res) => {
  try {
    const {
      title,
      description,
      totalMarks,
      deadline
    } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      // Clean up newly uploaded file if assignment not found
      if (req.file) {
        const filePath = path.join("uploads/assignments", req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(404).json({ message: "Assignment not found" });
    }

    const originalStatus = assignment.status; // Store original status

    // Handle file update
    if (req.file) {
      // Delete old file if exists
      if (assignment.assignmentFile && assignment.assignmentFile.filename) {
        const oldFilePath = path.join("uploads/assignments", assignment.assignmentFile.filename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      // Add new file
      assignment.assignmentFile = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      };
    }

    // Update fields ONLY - DO NOT CHANGE STATUS
    assignment.title = title || assignment.title;
    assignment.description = description !== undefined ? description : assignment.description;
    assignment.totalMarks = totalMarks ? parseInt(totalMarks) : assignment.totalMarks;
    assignment.deadline = deadline ? new Date(deadline) : assignment.deadline;
    // Status remains unchanged - if it was 'rejected', it stays 'rejected'

    await assignment.save();
    await assignment.populate("subjectId");
    await assignment.populate("unitId");
    await assignment.populate("teacherId", "name email");

    console.log(`Assignment ${assignment._id} updated. Status unchanged: ${originalStatus} -> ${assignment.status}`);

    res.json({
      message: "Assignment updated successfully. Status unchanged.",
      assignment,
      statusUnchanged: true,
      originalStatus: originalStatus,
      currentStatus: assignment.status
    });

  } catch (error) {
    console.error("Error updating assignment:", error);
    // Clean up newly uploaded file if error occurs
    if (req.file) {
      const filePath = path.join("uploads/assignments", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

/* ================= DELETE ASSIGNMENT ================= */
router.delete("/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Delete associated file from server
    if (assignment.assignmentFile && assignment.assignmentFile.filename) {
      const filePath = path.join("uploads/assignments", assignment.assignmentFile.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE ASSIGNMENT STATUS (ADMIN ONLY) ================= */
router.put("/:id/status", async (req, res) => {
  try {
    const { status, adminFeedback } = req.body;
    
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    assignment.status = status;
    if (adminFeedback) {
      assignment.adminFeedback = adminFeedback;
    }
    
    await assignment.save();

    console.log(`Assignment ${assignment._id} status updated by admin: ${status}`);

    res.json({
      message: `Assignment ${status}`,
      assignment
    });

  } catch (error) {
    console.error("Error updating assignment status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET ASSIGNMENT STATS FOR A TEACHER ================= */
router.get("/stats/teacher/:teacherId", async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacherId: req.params.teacherId });
    
    const now = new Date();
    const stats = {
      totalAssignments: assignments.length,
      pending: assignments.filter(a => a.status === "pending").length,
      approved: assignments.filter(a => a.status === "approved").length,
      rejected: assignments.filter(a => a.status === "rejected").length,
      active: assignments.filter(a => new Date(a.deadline) > now).length,
      expired: assignments.filter(a => new Date(a.deadline) <= now).length
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching assignment stats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= DOWNLOAD ASSIGNMENT FILE (TEACHER UPLOADED) ================= */
router.get("/download/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join("uploads/assignments", filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= DOWNLOAD STUDENT SUBMISSION FILE ================= */
router.get("/download-submission/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "..", "uploads/assignments/submissions", filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath);
  } catch (error) {
    console.error("Error downloading submission:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= STUDENT SUBMIT ASSIGNMENT (WITH DATABASE STORAGE & AUTH) ================= */
router.post("/submit", auth, submissionUpload.single("assignment"), async (req, res) => {
  try {
    const { assignmentId, subjectId } = req.body;
    const studentId = req.user.id; // Now works because of auth middleware
    
    console.log("Assignment submission request:", { assignmentId, subjectId, studentId });
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded. Please select a file to submit." 
      });
    }
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: "Student ID is required. Please login again." 
      });
    }
    
    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      const filePath = path.join("uploads/assignments/submissions", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(404).json({ 
        success: false, 
        message: "Assignment not found" 
      });
    }
    
    // Check if already submitted
    const existingSubmission = await AssignmentSubmission.findOne({
      studentId,
      assignmentId,
      subjectId
    });
    
    if (existingSubmission) {
      const oldFilePath = path.join(__dirname, "..", "uploads/assignments/submissions", existingSubmission.fileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      await AssignmentSubmission.findByIdAndDelete(existingSubmission._id);
    }
    
    // Create submission directory if not exists
    const submissionDir = path.join(__dirname, "..", "uploads/assignments/submissions");
    if (!fs.existsSync(submissionDir)) {
      fs.mkdirSync(submissionDir, { recursive: true });
    }
    
    // Save submission record to database
    const submission = new AssignmentSubmission({
      studentId,
      assignmentId,
      subjectId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      status: "submitted",
      submittedAt: new Date()
    });
    
    await submission.save();
    
    console.log(`Assignment ${assignmentId} submitted successfully by student ${studentId}`);
    console.log(`Submission saved to database with ID: ${submission._id}`);
    console.log(`File saved: ${req.file.filename} (${req.file.originalname})`);
    
    res.json({
      success: true,
      message: "Assignment submitted successfully!",
      submissionId: submission._id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      submittedAt: submission.submittedAt
    });
    
  } catch (error) {
    console.error("Error submitting assignment:", error);
    if (req.file) {
      const filePath = path.join("uploads/assignments/submissions", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.status(500).json({ 
      success: false, 
      message: "Failed to submit assignment: " + error.message 
    });
  }
});

/* ================= CHECK SUBMISSION STATUS ================= */
router.get("/submission-status/:assignmentId", auth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { subjectId } = req.query;
    const studentId = req.user.id;
    
    const submission = await AssignmentSubmission.findOne({
      studentId,
      assignmentId,
      subjectId
    });
    
    res.json({
      success: true,
      submitted: !!submission,
      submission: submission ? {
        id: submission._id,
        fileName: submission.fileName,
        originalName: submission.originalName,
        submittedAt: submission.submittedAt,
        status: submission.status,
        marks: submission.marks,
        feedback: submission.feedback
      } : null
    });
    
  } catch (error) {
    console.error("Error checking submission status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to check submission status" 
    });
  }
});

/* ================= RE-VERIFY ASSIGNMENT ENDPOINT ================= */
// PUT /api/assignments/:id/reverify - Update assignment from rejected to pending for re-verification
router.put("/:id/reverify", async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, teacherName } = req.body;
    
    console.log(`Re-verify request received for assignment: ${id}`);
    console.log(`Teacher ID: ${teacherId}`);
    
    const assignment = await Assignment.findById(id);
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false,
        message: "Assignment not found" 
      });
    }
    
    console.log(`Current assignment status: ${assignment.status}`);
    console.log(`Assignment teacher ID: ${assignment.teacherId}`);
    
    // Verify that this assignment belongs to the teacher
    if (assignment.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false,
        message: "You can only re-verify your own assignments" 
      });
    }
    
    const oldStatus = assignment.status;
    
    // Update status to pending for re-verification
    assignment.status = 'pending';
    assignment.adminFeedback = null; // Clear previous rejection feedback
    assignment.reVerificationRequested = true;
    assignment.reVerificationDate = new Date();
    assignment.reVerificationCount = (assignment.reVerificationCount || 0) + 1;
    
    await assignment.save();
    
    console.log(`Assignment ${id} re-verification: ${oldStatus} -> pending`);
    
    res.json({ 
      success: true, 
      message: `Assignment re-verification requested. Status changed from ${oldStatus} to pending`,
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        oldStatus: oldStatus,
        newStatus: assignment.status,
        reVerificationRequested: assignment.reVerificationRequested,
        reVerificationDate: assignment.reVerificationDate,
        reVerificationCount: assignment.reVerificationCount
      }
    });
    
  } catch (error) {
    console.error("Error in re-verify assignment:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error: " + error.message 
    });
  }
});

// DEBUG: Check assignment status endpoint
router.get("/debug/:id/status", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    res.json({
      id: assignment._id,
      title: assignment.title,
      status: assignment.status,
      reVerificationRequested: assignment.reVerificationRequested,
      adminFeedback: assignment.adminFeedback,
      reVerificationCount: assignment.reVerificationCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assignments/student/:studentId
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get student's enrolled subjects
    const Student = require("../models/User");
    const student = await Student.findById(studentId).populate('enrolledSubjects');
    
    // Get assignments for those subjects
    const assignments = await Assignment.find({
      subjectId: { $in: student.enrolledSubjects?.map(s => s._id) || [] },
      status: "approved"
    }).populate('subjectId');
    
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching student assignments:", error);
    res.status(500).json({ message: "Server error" });
  }
});


/* ================= GET ASSIGNMENTS FOR STUDENT'S ENROLLED COURSES ================= */
/* ================= GET ASSIGNMENTS FOR STUDENT'S ENROLLED COURSES (FULLY DYNAMIC) ================= */
router.post("/student-assignments", auth, async (req, res) => {
  try {
    const { subjectIds } = req.body;
    const studentId = req.user.id;
    
    if (!subjectIds || subjectIds.length === 0) {
      return res.json({ success: true, assignments: [] });
    }
    
    // Get student's enrollment to know their division
    const Enrollment = require("../models/Enrollment");
    const enrollments = await Enrollment.find({ 
      studentId: studentId,
      subjectId: { $in: subjectIds },
      status: "active"
    });
    
    if (enrollments.length === 0) {
      return res.json({ success: true, assignments: [] });
    }
    
    // Get student's division from enrollment
    const studentDivision = enrollments[0].division;
    console.log("Student Division:", studentDivision);
    
    // Get all teachers and their assigned subjects & divisions
    const User = require("../models/User");
    const teachers = await User.find({ 
      role: "teacher",
      "subjects.subjectId": { $in: subjectIds }
    }).populate("subjects.subjectId", "name code");
    
    console.log(`Found ${teachers.length} teachers for these subjects`);
    
    // Build a dynamic map: subjectId -> teacherId based on division
    const subjectTeacherMap = {};
    for (const teacher of teachers) {
      for (const subject of teacher.subjects) {
        const subjectId = subject.subjectId?._id?.toString() || subject.subjectId?.toString();
        const teacherDivision = subject.division;
        
        // If this teacher teaches this subject for the student's division
        if (teacherDivision === studentDivision) {
          subjectTeacherMap[subjectId] = teacher._id.toString();
          console.log(`✅ Subject ${subjectId} → Teacher ${teacher.name} (Division ${teacherDivision})`);
        }
      }
    }
    
    console.log("Subject-Teacher Map:", subjectTeacherMap);
    
    // Get assignments for each subject with the mapped teacher
    let allAssignments = [];
    for (const subjectId of subjectIds) {
      const teacherId = subjectTeacherMap[subjectId];
      
      if (!teacherId) {
        console.log(`⚠️ No teacher found for subject ${subjectId} in division ${studentDivision}`);
        continue;
      }
      
      const assignments = await Assignment.find({
        subjectId: subjectId,
        teacherId: teacherId,
        status: "approved"
      })
        .populate("subjectId", "name code")
        .populate("unitId", "unitTitle unitNumber")
        .populate("teacherId", "name email");
      
      console.log(`📋 Found ${assignments.length} assignments for subject ${subjectId} from teacher ${teacherId}`);
      allAssignments.push(...assignments);
    }
    
    console.log(`📊 Total assignments: ${allAssignments.length}`);
    
    // Get submission status for each assignment
    const assignmentsWithStatus = await Promise.all(allAssignments.map(async (assignment) => {
      const submission = await AssignmentSubmission.findOne({
        studentId,
        assignmentId: assignment._id
      });
      
      return {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        totalMarks: assignment.totalMarks,
        deadline: assignment.deadline,
        assignmentFile: assignment.assignmentFile,
        subjectId: assignment.subjectId,
        unitId: assignment.unitId,
        teacherId: assignment.teacherId,
        teacherName: assignment.teacherId?.name,
        submitted: !!submission,
        submission: submission ? {
          _id: submission._id,
          fileName: submission.fileName,
          originalName: submission.originalName,
          submittedAt: submission.submittedAt,
          status: submission.status,
          marks: submission.marks,
          feedback: submission.feedback
        } : null
      };
    }));
    
    res.json({
      success: true,
      assignments: assignmentsWithStatus
    });
    
  } catch (error) {
    console.error("Error fetching student assignments:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch assignments: " + error.message 
    });
  }
});

/* ================= GET UPCOMING ASSIGNMENTS FOR STUDENT (BASED ON DIVISION) ================= */
router.get("/student/upcoming/:studentId", auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get student's enrolled subjects with division
    const Enrollment = require("../models/Enrollment");
    const enrollments = await Enrollment.find({ 
      studentId: studentId,
      status: "active"
    }).populate("subjectId");
    
    if (enrollments.length === 0) {
      return res.json({ success: true, assignments: [] });
    }
    
    // Get student's division from enrollment
    const studentDivision = enrollments[0].division;
    console.log("Student Division for upcoming assignments:", studentDivision);
    
    // Get all teachers and their assigned subjects & divisions
    const User = require("../models/User");
    const subjectIds = enrollments.map(e => e.subjectId?._id || e.subjectId);
    
    const teachers = await User.find({ 
      role: "teacher",
      "subjects.subjectId": { $in: subjectIds }
    }).populate("subjects.subjectId", "name code");
    
    // Build a dynamic map: subjectId -> teacherId based on division
    const subjectTeacherMap = {};
    for (const teacher of teachers) {
      for (const subject of teacher.subjects) {
        const subjectId = subject.subjectId?._id?.toString() || subject.subjectId?.toString();
        const teacherDivision = subject.division;
        
        // If this teacher teaches this subject for the student's division
        if (teacherDivision === studentDivision) {
          subjectTeacherMap[subjectId] = teacher._id.toString();
          console.log(`✅ Upcoming: Subject ${subjectId} → Teacher ${teacher.name} (Division ${teacherDivision})`);
        }
      }
    }
    
    const now = new Date();
    let allUpcomingAssignments = [];
    
    // Get assignments for each subject with the mapped teacher
    for (const enrollment of enrollments) {
      const subjectId = enrollment.subjectId?._id || enrollment.subjectId;
      const teacherId = subjectTeacherMap[subjectId];
      
      if (!teacherId) {
        console.log(`⚠️ No teacher found for subject ${subjectId} in division ${studentDivision}`);
        continue;
      }
      
      const assignments = await Assignment.find({
        subjectId: subjectId,
        teacherId: teacherId,
        status: "approved",
        deadline: { $gte: now }
      })
        .populate("subjectId", "name code")
        .populate("unitId", "unitTitle unitNumber")
        .sort({ deadline: 1 });
      
      // Check submission status for each assignment
      for (const assignment of assignments) {
        const submission = await AssignmentSubmission.findOne({
          studentId,
          assignmentId: assignment._id
        });
        
        const daysRemaining = Math.ceil((new Date(assignment.deadline) - now) / (1000 * 60 * 60 * 24));
        
        if (!submission) {
          allUpcomingAssignments.push({
            _id: assignment._id,
            title: assignment.title,
            description: assignment.description,
            totalMarks: assignment.totalMarks,
            deadline: assignment.deadline,
            daysRemaining: daysRemaining,
            subjectId: assignment.subjectId,
            unitId: assignment.unitId,
            teacherId: assignment.teacherId,
            submitted: false
          });
        }
      }
    }
    
    // Sort by days remaining (closest first)
    allUpcomingAssignments.sort((a, b) => a.daysRemaining - b.daysRemaining);
    
    console.log(`📊 Found ${allUpcomingAssignments.length} upcoming assignments for division ${studentDivision}`);
    
    res.json({
      success: true,
      assignments: allUpcomingAssignments,
      totalPending: allUpcomingAssignments.length
    });
    
  } catch (error) {
    console.error("Error fetching upcoming assignments:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});


// ================= GET SUBMISSIONS FOR AN ASSIGNMENT (TEACHER VIEW) =================
router.get("/submissions/assignment/:assignmentId", auth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user.id;
    
    // Verify this assignment belongs to the teacher
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: "Assignment not found" 
      });
    }
    
    // Check if teacher owns this assignment
    if (assignment.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to view submissions for this assignment" 
      });
    }
    
    // Get all submissions for this assignment
    const submissions = await AssignmentSubmission.find({ assignmentId })
      .populate("studentId", "name email enrollmentNumber")
      .sort({ submittedAt: -1 });
    
    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length
    });
    
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch submissions: " + error.message 
    });
  }
});

// ================= GRADE A SUBMISSION =================
router.post("/submissions/:submissionId/grade", auth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback, assignmentId } = req.body;
    const teacherId = req.user.id;
    
    // Find the submission
    const submission = await AssignmentSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: "Submission not found" 
      });
    }
    
    // Find the assignment to verify teacher ownership
    const assignment = await Assignment.findById(assignmentId || submission.assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: "Assignment not found" 
      });
    }
    
    // Verify teacher owns this assignment
    if (assignment.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to grade this submission" 
      });
    }
    
    // Validate marks
    if (marks < 0 || marks > assignment.totalMarks) {
      return res.status(400).json({ 
        success: false, 
        message: `Marks must be between 0 and ${assignment.totalMarks}` 
      });
    }
    
    // Update submission with grade
    submission.marks = marks;
    submission.feedback = feedback || "";
    submission.status = "graded";
    submission.gradedAt = new Date();
    
    await submission.save();
    
    console.log(`✅ Submission ${submissionId} graded: ${marks}/${assignment.totalMarks}`);
    
    res.json({
      success: true,
      message: "Assignment graded successfully",
      submission: {
        _id: submission._id,
        marks: submission.marks,
        feedback: submission.feedback,
        status: submission.status,
        gradedAt: submission.gradedAt
      }
    });
    
  } catch (error) {
    console.error("Error grading submission:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to grade submission: " + error.message 
    });
  }
});

// ================= GET SUBMISSION COUNT FOR ASSIGNMENTS (For sidebar stats) =================
router.get("/submissions/count/:assignmentId", auth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const submissionCount = await AssignmentSubmission.countDocuments({ assignmentId });
    
    res.json({
      success: true,
      count: submissionCount
    });
    
  } catch (error) {
    console.error("Error fetching submission count:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch submission count" 
    });
  }
});

// ================= GET SUBMISSIONS FOR AN ASSIGNMENT (TEACHER VIEW) =================
router.get("/submissions/assignment/:assignmentId", auth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const teacherId = req.user.id;
    
    console.log(`Fetching submissions for assignment: ${assignmentId}, Teacher: ${teacherId}`);
    
    // Verify this assignment belongs to the teacher
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: "Assignment not found" 
      });
    }
    
    // Check if teacher owns this assignment
    if (assignment.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to view submissions for this assignment" 
      });
    }
    
    // Get all submissions for this assignment
    const submissions = await AssignmentSubmission.find({ assignmentId })
      .populate("studentId", "name email enrollmentNumber")
      .sort({ submittedAt: -1 });
    
    console.log(`Found ${submissions.length} submissions for assignment ${assignmentId}`);
    
    res.json({
      success: true,
      submissions: submissions,
      total: submissions.length
    });
    
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch submissions: " + error.message 
    });
  }
});

// ================= GRADE A SUBMISSION =================
router.post("/submissions/:submissionId/grade", auth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback, assignmentId } = req.body;
    const teacherId = req.user.id;
    
    console.log(`Grading submission: ${submissionId}, Marks: ${marks}, Teacher: ${teacherId}`);
    
    // Find the submission
    const submission = await AssignmentSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: "Submission not found" 
      });
    }
    
    // Find the assignment to verify teacher ownership
    const assignment = await Assignment.findById(assignmentId || submission.assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: "Assignment not found" 
      });
    }
    
    // Verify teacher owns this assignment
    if (assignment.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to grade this submission" 
      });
    }
    
    // Validate marks
    if (marks < 0 || marks > assignment.totalMarks) {
      return res.status(400).json({ 
        success: false, 
        message: `Marks must be between 0 and ${assignment.totalMarks}` 
      });
    }
    
    // Update submission with grade
    submission.marks = marks;
    submission.feedback = feedback || "";
    submission.status = "graded";
    submission.gradedAt = new Date();
    
    await submission.save();
    
    console.log(`✅ Submission ${submissionId} graded: ${marks}/${assignment.totalMarks}`);
    
    res.json({
      success: true,
      message: "Assignment graded successfully",
      submission: {
        _id: submission._id,
        marks: submission.marks,
        feedback: submission.feedback,
        status: submission.status,
        gradedAt: submission.gradedAt
      }
    });
    
  } catch (error) {
    console.error("Error grading submission:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to grade submission: " + error.message 
    });
  }
});

router.get("/all", async (req, res) => {
  try {
    const assignments = await Assignment.find().populate('subjectId teacherId');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;