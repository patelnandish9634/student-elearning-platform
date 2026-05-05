const express = require("express");
const router = express.Router();
const auth = require("../middleware/verifytoken");

/* ================= GET ADMIN DASHBOARD STATS ================= */
router.get("/dashboard-stats", auth, async (req, res) => {
  try {
    // Only admin can access
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    const User = require("../models/User");
    const Subject = require("../models/Subject");
    const Course = require("../models/Course");
    const Department = require("../models/Department");
    const Enrollment = require("../models/Enrollment");
    const Assignment = require("../models/Assignment");
    
    // ========== STUDENT STATS ==========
    const totalStudents = await User.countDocuments({ role: "student" });
    const activeStudents = await User.countDocuments({ role: "student", status: "active" });
    const inactiveStudents = await User.countDocuments({ role: "student", status: "inactive" });
    
    // ========== TEACHER STATS ==========
    const totalTeachers = await User.countDocuments({ role: "teacher" });
    const activeTeachers = await User.countDocuments({ role: "teacher", status: "active" });
    const inactiveTeachers = await User.countDocuments({ role: "teacher", status: "inactive" });
    
    // ========== SUBJECT STATS ==========
    const totalSubjects = await Subject.countDocuments();
    const activeSubjects = await Subject.countDocuments({ status: "active" });
    const inactiveSubjects = await Subject.countDocuments({ status: "inactive" });
    
    // ========== COURSE STATS ==========
    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ status: "active" });
    const inactiveCourses = await Course.countDocuments({ status: "inactive" });
    
    // ========== DEPARTMENT STATS ==========
    const totalDepartments = await Department.countDocuments();
    const activeDepartments = await Department.countDocuments({ status: "active" });
    const inactiveDepartments = await Department.countDocuments({ status: "inactive" });
    
    // ========== PENDING APPROVALS (Assignments only - based on your schema) ==========
    const pendingAssignments = await Assignment.countDocuments({ status: "pending" });
    const approvedAssignments = await Assignment.countDocuments({ status: "approved" });
    const rejectedAssignments = await Assignment.countDocuments({ status: "rejected" });
    
    // ========== ENROLLMENT STATS ==========
    const totalEnrollments = await Enrollment.countDocuments({ status: "active" });
    
    // ========== DEPARTMENT WISE STATS ==========
    const departments = await Department.find();
    
    const departmentOverview = await Promise.all(departments.map(async (dept) => {
      // Get students in this department
      const studentCount = await User.countDocuments({ 
        role: "student", 
        department: dept.name,
        status: "active"
      });
      
      // Get courses in this department
      const courseCount = await Course.countDocuments({ 
        department: dept.name,
        status: "active"
      });
      
      // Get subjects in this department
      const subjectCount = await Subject.countDocuments({ 
        department: dept.name,
        status: "active"
      });
      
      return {
        id: dept._id,
        name: dept.name,
        code: dept.code,
        students: studentCount,
        courses: courseCount,
        subjects: subjectCount,
        status: dept.status,
        head: dept.head
      };
    }));
    
    // ========== RECENT ACTIVITIES ==========
    const recentActivities = [];
    
    // Recent student enrollments
    const recentEnrollments = await Enrollment.find({ status: "active" })
      .populate("studentId", "name email")
      .populate("subjectId", "name code")
      .sort({ createdAt: -1 })
      .limit(5);
    
    for (const enrollment of recentEnrollments) {
      recentActivities.push({
        type: "enrollment",
        title: "New student enrolled",
        description: `${enrollment.studentId?.name || "Student"} enrolled in ${enrollment.subjectId?.name || "Course"} (Division ${enrollment.division})`,
        time: formatRelativeTime(enrollment.createdAt),
        timestamp: enrollment.createdAt,
        icon: "📚"
      });
    }
    
    // Recent pending assignments
    const recentAssignments = await Assignment.find({ status: "pending" })
      .populate("teacherId", "name")
      .populate("subjectId", "name")
      .sort({ createdAt: -1 })
      .limit(5);
    
    for (const assignment of recentAssignments) {
      recentActivities.push({
        type: "assignment",
        title: "Assignment pending approval",
        description: `"${assignment.title}" submitted by ${assignment.teacherId?.name || "Teacher"} for ${assignment.subjectId?.name || "Subject"}`,
        time: formatRelativeTime(assignment.createdAt),
        timestamp: assignment.createdAt,
        icon: "📝"
      });
    }
    
    // Sort by newest first and take top 10
    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latestActivities = recentActivities.slice(0, 10);
    
    res.json({
      success: true,
      stats: {
        students: {
          total: totalStudents,
          active: activeStudents,
          inactive: inactiveStudents
        },
        teachers: {
          total: totalTeachers,
          active: activeTeachers,
          inactive: inactiveTeachers
        },
        subjects: {
          total: totalSubjects,
          active: activeSubjects,
          inactive: inactiveSubjects
        },
        courses: {
          total: totalCourses,
          active: activeCourses,
          inactive: inactiveCourses
        },
        departments: {
          total: totalDepartments,
          active: activeDepartments,
          inactive: inactiveDepartments
        },
        pendingApprovals: {
          total: pendingAssignments,
          assignments: pendingAssignments,
          approved: approvedAssignments,
          rejected: rejectedAssignments
        },
        enrollments: totalEnrollments,
        departmentOverview,
        recentActivities: latestActivities
      }
    });
    
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to format relative time
function formatRelativeTime(date) {
  const diff = Math.floor((new Date() - new Date(date)) / 1000);
  if (diff < 60) return `${diff} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return new Date(date).toLocaleDateString();
}

module.exports = router;