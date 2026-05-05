const express = require("express");
const router = express.Router();
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const Subject = require("../models/Subject");
const auth = require("../middleware/verifytoken");

/* ================= ENROLL STUDENT IN A COURSE ================= */
router.post("/add", auth, async (req, res) => {
  try {
    const { studentId, subjectId, teacherId, division, academicYear, semester } = req.body;
    
    // Validate required fields
    if (!studentId || !subjectId || !division) {
      return res.status(400).json({ message: "Student ID, Subject ID, and Division are required" });
    }
    
    // Verify user is authorized (student enrolling themselves or admin)
    if (req.user.role !== "admin" && req.user.id !== studentId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    // Check if student exists
    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    // Verify student's division matches the enrollment division
    if (student.division !== division) {
      return res.status(400).json({ 
        message: `You can only enroll in courses for your division (${student.division}). This course is for division ${division}.` 
      });
    }
    
    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    
    // Check if already enrolled (same student, subject, division)
    const existingEnrollment = await Enrollment.findOne({
      studentId,
      subjectId,
      division,
      status: { $in: ["active", "pending"] }
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ 
        message: `You are already enrolled in ${subject.name} for division ${division}`,
        enrollment: existingEnrollment
      });
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      studentId,
      subjectId,
      teacherId: teacherId || null,
      division: division.toUpperCase(),
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      semester: semester || student.semester,
      status: "active",
      enrollmentDate: new Date()
    });
    
    await enrollment.save();
    await enrollment.populate('subjectId');
    await enrollment.populate('teacherId', 'name email');
    
    res.status(201).json({
      success: true,
      message: `Successfully enrolled in ${subject.name} (Division ${division})`,
      enrollment
    });
    
  } catch (error) {
    console.error("Error in enrollment:", error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "You are already enrolled in this course for this division" 
      });
    }
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

/* ================= GET ALL ENROLLMENTS FOR A STUDENT ================= */
router.get("/student/:studentId", auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Verify authorization
    if (req.user.role !== "admin" && req.user.id !== studentId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const enrollments = await Enrollment.find({ 
      studentId,
      status: { $ne: "dropped" }
    })
    .populate('subjectId')
    .populate('teacherId', 'name email')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: enrollments.length,
      enrollments
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET STUDENT'S ACTIVE ENROLLMENTS ================= */
router.get("/student/:studentId/active", auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (req.user.role !== "admin" && req.user.id !== studentId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const enrollments = await Enrollment.find({ 
      studentId,
      status: "active"
    })
    .populate('subjectId')
    .populate('teacherId', 'name email')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: enrollments.length,
      enrollments
    });
    
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET STUDENT'S ENROLLMENTS BY DIVISION ================= */
router.get("/student/:studentId/division/:division", auth, async (req, res) => {
  try {
    const { studentId, division } = req.params;
    
    if (req.user.role !== "admin" && req.user.id !== studentId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const enrollments = await Enrollment.find({ 
      studentId,
      division: division.toUpperCase(),
      status: "active"
    })
    .populate('subjectId')
    .populate('teacherId', 'name email')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: enrollments.length,
      enrollments
    });
    
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET ENROLLMENT DETAILS BY ID ================= */
router.get("/:id", auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('studentId', 'name email enrollmentNumber division')
      .populate('subjectId')
      .populate('teacherId', 'name email');
    
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    
    // Verify authorization
    if (req.user.role !== "admin" && req.user.id !== enrollment.studentId._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    res.json({
      success: true,
      enrollment
    });
    
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= DROP/UNENROLL FROM A COURSE ================= */
router.put("/:id/drop", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const enrollment = await Enrollment.findById(id);
    
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    
    // Verify authorization
    if (req.user.role !== "admin" && req.user.id !== enrollment.studentId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    if (enrollment.status === "completed") {
      return res.status(400).json({ message: "Cannot drop a completed course" });
    }
    
    await enrollment.drop(reason || "Student requested drop");
    
    res.json({
      success: true,
      message: `Successfully dropped from ${enrollment.subjectId?.name || 'course'} (Division ${enrollment.division})`,
      enrollment
    });
    
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= MARK COURSE AS COMPLETED ================= */
router.put("/:id/complete", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, marks } = req.body;
    
    // Only admin can mark courses as completed
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can mark courses as completed" });
    }
    
    const enrollment = await Enrollment.findById(id);
    
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    
    if (enrollment.status === "completed") {
      return res.status(400).json({ message: "Course already marked as completed" });
    }
    
    await enrollment.markAsCompleted(grade, marks);
    
    res.json({
      success: true,
      message: `Course marked as completed for division ${enrollment.division}`,
      enrollment
    });
    
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET ENROLLMENT STATISTICS ================= */
router.get("/stats/student/:studentId", auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (req.user.role !== "admin" && req.user.id !== studentId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const stats = await Enrollment.getStudentStats(studentId);
    
    // Get division-wise stats
    const divisionStats = await Enrollment.aggregate([
      { $match: { studentId: mongoose.Types.ObjectId(studentId), status: "active" } },
      { $group: { _id: "$division", count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      stats,
      divisionStats
    });
    
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= CHECK IF STUDENT IS ENROLLED IN A SUBJECT ================= */
router.get("/check/:studentId/:subjectId/:division", auth, async (req, res) => {
  try {
    const { studentId, subjectId, division } = req.params;
    
    if (req.user.role !== "admin" && req.user.id !== studentId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const isEnrolled = await Enrollment.isEnrolled(studentId, subjectId, division);
    
    res.json({
      success: true,
      isEnrolled
    });
    
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= ADMIN: GET ALL ENROLLMENTS ================= */
router.get("/admin/all", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const { status, semester, academicYear, division } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;
    if (division) query.division = division.toUpperCase();
    
    const enrollments = await Enrollment.find(query)
      .populate('studentId', 'name email enrollmentNumber division')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: enrollments.length,
      enrollments
    });
    
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;