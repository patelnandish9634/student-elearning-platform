const express = require("express");
const router = express.Router();
const StudentProgress = require("../models/StudentProgress");
const auth = require("../middleware/verifytoken");

/* ================= HELPER FUNCTION - FIXED ================= */
async function getTotalItemsCount(subjectId) {
  try {
    // Get all units for this subject from the Unit model
    const Unit = require("../models/Unit");
    const units = await Unit.find({ subjectId: subjectId });
    
    console.log(`Fetching total items for subject: ${subjectId}`);
    console.log(`Found ${units.length} units for this subject`);
    
    if (!units || units.length === 0) {
      console.log(`No units found for subject: ${subjectId}`);
      return 0;
    }
    
    let total = 0;
    for (const unit of units) {
      const contentCount = unit.contents?.length || 0;
      const assignmentCount = unit.assignments?.length || 0;
      const quizCount = unit.quizzes?.length || 0;
      
      console.log(`Unit ${unit.unitNumber}: ${contentCount} contents, ${assignmentCount} assignments, ${quizCount} quizzes`);
      
      total += contentCount;
      total += assignmentCount;
      total += quizCount;
    }
    
    console.log(`Total items for subject: ${total}`);
    return total;
  } catch (error) {
    console.error("Error getting total items count:", error);
    return 0;
  }
}

/* ================= GET STUDENT CERTIFICATES - MUST BE BEFORE :subjectId ROUTE ================= */
router.get("/student-certificates", auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    console.log("Fetching certificates for student:", studentId);
    
    const Certificate = require("../models/Certificate");
    const certificates = await Certificate.find({ studentId })
      .sort({ issueDate: -1 });
    
    console.log(`Found ${certificates.length} certificates`);
    
    const formattedCertificates = certificates.map(cert => ({
      _id: cert._id,
      certificateId: cert.certificateId,
      studentName: cert.studentName,
      courseName: cert.courseName,
      issueDate: cert.issueDate,
      status: cert.status
    }));
    
    res.json({
      success: true,
      certificates: formattedCertificates
    });
    
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch certificates" 
    });
  }
});

/* ================= GET VIDEO PROGRESS - MUST BE BEFORE :subjectId ROUTE ================= */
router.get("/video-progress/:subjectId", auth, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const studentId = req.user.id;

    const progressRecord = await StudentProgress.findOne({
      studentId,
      subjectId
    });

    if (!progressRecord || !progressRecord.videoProgress) {
      return res.json({
        success: true,
        videoProgress: {}
      });
    }

    const videoProgress = progressRecord.videoProgress ? 
      Object.fromEntries(progressRecord.videoProgress) : {};

    res.json({
      success: true,
      videoProgress
    });

  } catch (error) {
    console.error("Error fetching video progress:", error);
    res.status(500).json({ success: false, message: "Failed to fetch video progress" });
  }
});

/* ================= GET ALL PROGRESS FOR STUDENT DASHBOARD ================= */
router.get("/dashboard/all", auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const progressRecords = await StudentProgress.find({ studentId })
      .populate('subjectId', 'name code credits semester');
    
    const dashboardData = progressRecords.map(record => ({
      subjectId: record.subjectId._id,
      subjectName: record.subjectId.name,
      subjectCode: record.subjectId.code,
      credits: record.subjectId.credits,
      semester: record.subjectId.semester,
      overallProgress: record.overallProgress,
      completedItems: record.completedItems?.size || 0,
      lastAccessed: record.lastAccessed
    }));
    
    res.json({
      success: true,
      progress: dashboardData
    });
    
  } catch (error) {
    console.error("Error fetching dashboard progress:", error);
    res.status(500).json({ success: false, message: "Failed to fetch progress" });
  }
});

/* ================= GET STUDENT PROGRESS FOR A SUBJECT - FIXED ================= */
router.get("/:subjectId", auth, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const studentId = req.user.id;
    const { division } = req.query;

    let progress = await StudentProgress.findOne({
      studentId,
      subjectId
    });

    if (!progress) {
      progress = new StudentProgress({
        studentId,
        subjectId,
        division: division || "A",
        completedItems: new Map(),
        quizScores: new Map(),
        assignmentSubmissions: new Map(),
        overallProgress: 0
      });
      await progress.save();
    }

    // Recalculate overall progress to ensure accuracy
    const totalItems = await getTotalItemsCount(subjectId);
    const completedCount = progress.completedItems?.size || 0;
    const recalculatedProgress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
    
    // Update if different
    if (recalculatedProgress !== progress.overallProgress) {
      progress.overallProgress = recalculatedProgress;
      await progress.save();
      console.log(`Progress recalculated: ${recalculatedProgress}% (${completedCount}/${totalItems})`);
    }

    const completedItemsObj = progress.completedItems ? 
      Object.fromEntries(progress.completedItems) : {};
    const quizScoresObj = progress.quizScores ? 
      Object.fromEntries(progress.quizScores) : {};
    const assignmentSubmissionsObj = progress.assignmentSubmissions ? 
      Object.fromEntries(progress.assignmentSubmissions) : {};

    res.json({
      success: true,
      progress: {
        completedItems: completedItemsObj,
        quizScores: quizScoresObj,
        assignmentSubmissions: assignmentSubmissionsObj,
        overallProgress: recalculatedProgress,
        lastAccessed: progress.lastAccessed,
        totalItems: totalItems,
        completedCount: completedCount
      }
    });

  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ success: false, message: "Failed to fetch progress" });
  }
});

/* ================= UPDATE ITEM COMPLETION STATUS - FIXED ================= */
router.post("/toggle-complete", auth, async (req, res) => {
  try {
    const { subjectId, itemId, completed, itemType, division } = req.body;
    const studentId = req.user.id;

    console.log(`Toggling completion: ${itemId} to ${completed} for student ${studentId}`);

    let progress = await StudentProgress.findOne({
      studentId,
      subjectId
    });

    if (!progress) {
      progress = new StudentProgress({
        studentId,
        subjectId,
        division: division || "A",
        completedItems: new Map(),
        quizScores: new Map(),
        assignmentSubmissions: new Map(),
        overallProgress: 0
      });
    }

    if (!progress.completedItems) {
      progress.completedItems = new Map();
    }

    progress.completedItems.set(itemId, completed);

    const totalItems = await getTotalItemsCount(subjectId);
    const completedCount = progress.completedItems.size;
    const newProgress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
    progress.overallProgress = newProgress;

    progress.lastAccessed = new Date();
    await progress.save();

    console.log(`Progress updated: ${completedCount}/${totalItems} items completed (${newProgress}%)`);

    res.json({
      success: true,
      message: completed ? "Item marked as complete" : "Item marked as incomplete",
      overallProgress: newProgress,
      completedCount,
      totalItems
    });

  } catch (error) {
    console.error("Error toggling completion:", error);
    res.status(500).json({ success: false, message: "Failed to update progress" });
  }
});

/* ================= FORCE COMPLETE CONTENT ================= */
router.post("/force-complete-content", auth, async (req, res) => {
  try {
    const { subjectId, contentId, completed, division } = req.body;
    const studentId = req.user.id;

    console.log(`Force completing content ${contentId} for student ${studentId}`);

    let progress = await StudentProgress.findOne({
      studentId,
      subjectId
    });

    if (!progress) {
      progress = new StudentProgress({
        studentId,
        subjectId,
        division: division || "A",
        completedItems: new Map(),
        quizScores: new Map(),
        assignmentSubmissions: new Map(),
        overallProgress: 0
      });
    }

    if (!progress.completedItems) {
      progress.completedItems = new Map();
    }

    progress.completedItems.set(contentId, completed);
    
    const totalItems = await getTotalItemsCount(subjectId);
    const completedCount = progress.completedItems.size;
    progress.overallProgress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
    
    progress.lastAccessed = new Date();
    await progress.save();

    console.log(`Content ${contentId} completed status: ${completed}`);
    console.log(`Overall progress: ${progress.overallProgress}% (${completedCount}/${totalItems})`);

    res.json({
      success: true,
      message: completed ? "Content marked as complete" : "Content marked as incomplete",
      overallProgress: progress.overallProgress,
      completedCount,
      totalItems
    });

  } catch (error) {
    console.error("Error force completing content:", error);
    res.status(500).json({ success: false, message: "Failed to update content completion" });
  }
});

/* ================= SAVE QUIZ SCORE ================= */
router.post("/quiz-score", auth, async (req, res) => {
  try {
    const { subjectId, quizId, score, total, percentage } = req.body;
    const studentId = req.user.id;

    let progress = await StudentProgress.findOne({
      studentId,
      subjectId
    });

    if (!progress) {
      progress = new StudentProgress({
        studentId,
        subjectId,
        completedItems: new Map(),
        quizScores: new Map(),
        assignmentSubmissions: new Map(),
        overallProgress: 0
      });
    }

    if (!progress.quizScores) {
      progress.quizScores = new Map();
    }

    progress.quizScores.set(quizId, {
      score,
      total,
      percentage,
      submittedAt: new Date()
    });

    if (percentage >= 70) {
      if (!progress.completedItems) {
        progress.completedItems = new Map();
      }
      progress.completedItems.set(quizId, true);
      
      const totalItems = await getTotalItemsCount(subjectId);
      const completedCount = progress.completedItems.size;
      progress.overallProgress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
    }

    progress.lastAccessed = new Date();
    await progress.save();

    res.json({
      success: true,
      message: "Quiz score saved successfully",
      quizScore: { score, total, percentage },
      overallProgress: progress.overallProgress
    });

  } catch (error) {
    console.error("Error saving quiz score:", error);
    res.status(500).json({ success: false, message: "Failed to save quiz score" });
  }
});

/* ================= SUBMIT ASSIGNMENT ================= */
router.post("/submit-assignment", auth, async (req, res) => {
  try {
    const { subjectId, assignmentId, fileName } = req.body;
    const studentId = req.user.id;

    let progress = await StudentProgress.findOne({
      studentId,
      subjectId
    });

    if (!progress) {
      progress = new StudentProgress({
        studentId,
        subjectId,
        completedItems: new Map(),
        quizScores: new Map(),
        assignmentSubmissions: new Map(),
        overallProgress: 0
      });
    }

    if (!progress.assignmentSubmissions) {
      progress.assignmentSubmissions = new Map();
    }

    progress.assignmentSubmissions.set(assignmentId, {
      submittedAt: new Date(),
      fileName: fileName,
      status: "submitted",
      marks: null,
      feedback: null
    });

    if (!progress.completedItems) {
      progress.completedItems = new Map();
    }
    if (!progress.completedItems.get(assignmentId)) {
      progress.completedItems.set(assignmentId, true);
    }
    
    const totalItems = await getTotalItemsCount(subjectId);
    const completedCount = progress.completedItems.size;
    progress.overallProgress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    progress.lastAccessed = new Date();
    await progress.save();

    res.json({
      success: true,
      message: "Assignment submission recorded successfully",
      overallProgress: progress.overallProgress
    });

  } catch (error) {
    console.error("Error recording assignment submission:", error);
    res.status(500).json({ success: false, message: "Failed to record assignment submission" });
  }
});

/* ================= UPDATE VIDEO PROGRESS ================= */
router.post("/video-progress", auth, async (req, res) => {
  try {
    const { subjectId, contentId, videoIndex, progress, isCompleted } = req.body;
    const studentId = req.user.id;
    const { division } = req.query;

    let progressRecord = await StudentProgress.findOne({
      studentId,
      subjectId
    });

    if (!progressRecord) {
      progressRecord = new StudentProgress({
        studentId,
        subjectId,
        division: division || "A",
        completedItems: new Map(),
        quizScores: new Map(),
        assignmentSubmissions: new Map(),
        videoProgress: new Map(),
        overallProgress: 0
      });
    }

    if (!progressRecord.videoProgress) {
      progressRecord.videoProgress = new Map();
    }
    
    const videoKey = `${contentId}_${videoIndex}`;
    progressRecord.videoProgress.set(videoKey, {
      progress: Math.min(100, progress),
      completed: isCompleted === true || progress === 100,
      lastUpdated: new Date()
    });

    await progressRecord.save();

    res.json({
      success: true,
      message: isCompleted ? "Video marked as completed" : "Video progress saved",
      videoKey,
      progress,
      completed: isCompleted || progress === 100
    });

  } catch (error) {
    console.error("Error saving video progress:", error);
    res.status(500).json({ success: false, message: "Failed to save video progress" });
  }
});

/* ================= DEBUG: GET RAW PROGRESS DATA ================= */
router.get("/debug/:subjectId", auth, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const studentId = req.user.id;

    const progress = await StudentProgress.findOne({
      studentId,
      subjectId
    });

    if (!progress) {
      return res.json({
        success: true,
        message: "No progress record found",
        completedItems: {},
        videoProgress: {},
        overallProgress: 0
      });
    }

    const completedItemsObj = progress.completedItems ? 
      Object.fromEntries(progress.completedItems) : {};
    const videoProgressObj = progress.videoProgress ? 
      Object.fromEntries(progress.videoProgress) : {};

    res.json({
      success: true,
      completedItems: completedItemsObj,
      videoProgress: videoProgressObj,
      overallProgress: progress.overallProgress,
      completedItemsCount: progress.completedItems?.size || 0
    });

  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ success: false, message: "Debug failed" });
  }
});

/* ================= CHECK AND GENERATE CERTIFICATE ================= */
router.post("/check-certificate", auth, async (req, res) => {
  try {
    const { subjectId, overallProgress } = req.body;
    const studentId = req.user.id;

    console.log("=== CERTIFICATE CHECK STARTED ===");
    console.log("Student ID:", studentId);
    console.log("Subject ID:", subjectId);
    console.log("Overall Progress:", overallProgress);

    if (overallProgress !== 100) {
      console.log("Progress is not 100%, skipping certificate generation");
      return res.json({ success: true, certificateGenerated: false });
    }

    const Certificate = require("../models/Certificate");
    let existingCert = await Certificate.findOne({ studentId, subjectId });
    
    if (existingCert) {
      console.log("Certificate already exists");
      return res.json({ 
        success: true, 
        certificateGenerated: true, 
        certificate: existingCert
      });
    }
    
    const User = require("../models/User");
    const Subject = require("../models/Subject");
    
    const student = await User.findById(studentId);
    const subject = await Subject.findById(subjectId);
    
    if (!student || !subject) {
      console.log("Student or Subject not found");
      return res.json({ success: true, certificateGenerated: false });
    }
    
    const certificateId = `LJ-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    const certificate = new Certificate({
      studentId,
      subjectId,
      certificateId: certificateId,
      issueDate: new Date(),
      studentName: student.name,
      courseName: subject.name,
      completionDate: new Date().toLocaleDateString(),
      status: "issued"
    });
    
    await certificate.save();
    
    console.log("Certificate generated successfully:", certificateId);
    
    res.json({ 
      success: true, 
      certificateGenerated: true, 
      certificate
    });
    
  } catch (error) {
    console.error("Error checking certificate:", error);
    res.status(500).json({ success: false, message: "Failed to check certificate" });
  }
});

/* ================= GET RECENT ACTIVITIES FOR STUDENT ================= */
/* ================= GET RECENT ACTIVITIES FOR STUDENT (BASED ON DIVISION) ================= */
/* ================= GET RECENT ACTIVITIES FOR STUDENT (FIXED) ================= */
router.get("/recent-activities", auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    console.log("Fetching recent activities for student:", studentId);
    
    // Get student's division from enrollment
    const Enrollment = require("../models/Enrollment");
    const enrollments = await Enrollment.find({ 
      studentId: studentId,
      status: "active"
    }).populate("subjectId", "name");
    
    if (enrollments.length === 0) {
      console.log("No active enrollments found");
      return res.json({ success: true, activities: [] });
    }
    
    const studentDivision = enrollments[0].division;
    const subjectIds = enrollments.map(e => e.subjectId?._id?.toString() || e.subjectId);
    
    console.log("Student Division:", studentDivision);
    console.log("Enrolled Subject IDs:", subjectIds);
    
    // Get teachers for student's division
    const User = require("../models/User");
    const teachers = await User.find({ 
      role: "teacher",
      "subjects.subjectId": { $in: subjectIds }
    }).populate("subjects.subjectId", "name");
    
    // Build subject-teacher map for student's division
    const subjectTeacherMap = {};
    for (const teacher of teachers) {
      for (const subject of teacher.subjects) {
        const subjectId = subject.subjectId?._id?.toString() || subject.subjectId?.toString();
        const teacherDivision = subject.division;
        if (teacherDivision === studentDivision) {
          subjectTeacherMap[subjectId] = teacher._id.toString();
          console.log(`Subject ${subjectId} → Teacher ${teacher.name} (Division ${teacherDivision})`);
        }
      }
    }
    
    // Get progress records
    const progressRecords = await StudentProgress.find({ 
      studentId: studentId,
      subjectId: { $in: subjectIds }
    }).populate("subjectId", "name");
    
    console.log(`Found ${progressRecords.length} progress records`);
    
    let activities = [];
    
    for (const prog of progressRecords) {
      const subjectName = prog.subjectId?.name || "Unknown Course";
      const subjectId = prog.subjectId?._id?.toString();
      
      // Only include activities for subjects taught by student's division teacher
      const isRelevantTeacher = subjectTeacherMap[subjectId];
      
      if (!isRelevantTeacher && subjectId) {
        console.log(`Skipping subject ${subjectName} - not taught by division teacher`);
        continue;
      }
      
      console.log(`Processing subject: ${subjectName}`);
      
      // ========== QUIZ ACTIVITIES ==========
      if (prog.quizScores && prog.quizScores instanceof Map && prog.quizScores.size > 0) {
        console.log(`  Found ${prog.quizScores.size} quiz scores`);
        for (const [quizId, scoreData] of prog.quizScores) {
          if (scoreData && scoreData.submittedAt) {
            activities.push({
              type: "quiz",
              subjectName: subjectName,
              details: `Completed quiz with ${Math.round(scoreData.percentage)}% score`,
              timestamp: scoreData.submittedAt,
              icon: "📝",
              color: "#10B981"
            });
            console.log(`    Added quiz activity: ${Math.round(scoreData.percentage)}%`);
          }
        }
      }
      
      // ========== ASSIGNMENT SUBMISSION ACTIVITIES ==========
      if (prog.assignmentSubmissions && prog.assignmentSubmissions instanceof Map && prog.assignmentSubmissions.size > 0) {
        console.log(`  Found ${prog.assignmentSubmissions.size} assignment submissions`);
        for (const [assignmentId, submission] of prog.assignmentSubmissions) {
          if (submission && submission.submittedAt) {
            activities.push({
              type: "assignment",
              subjectName: subjectName,
              details: `Submitted assignment`,
              timestamp: submission.submittedAt,
              icon: "📎",
              color: "#F59E0B"
            });
            console.log(`    Added assignment activity`);
          }
        }
      }
      
      // ========== VIDEO/PROGRESS ACTIVITIES ==========
      if (prog.completedItems && prog.completedItems instanceof Map && prog.completedItems.size > 0) {
        console.log(`  Found ${prog.completedItems.size} completed items`);
        // Get the latest completed item
        let latestItemDate = null;
        for (const [itemId, isCompleted] of prog.completedItems) {
          if (isCompleted === true) {
            // Use lastAccessed as approximate time
            if (!latestItemDate || (prog.lastAccessed && prog.lastAccessed > latestItemDate)) {
              latestItemDate = prog.lastAccessed;
            }
          }
        }
        if (latestItemDate) {
          const completedCount = prog.completedItems.size;
          activities.push({
            type: "progress",
            subjectName: subjectName,
            details: `Completed ${completedCount} item${completedCount > 1 ? 's' : ''} in course`,
            timestamp: latestItemDate,
            icon: "✅",
            color: "#10B981"
          });
          console.log(`    Added progress activity: ${completedCount} items`);
        }
      }
      
      // ========== OVERALL PROGRESS ACTIVITY ==========
      if (prog.overallProgress > 0 && prog.lastAccessed) {
        activities.push({
          type: "progress_update",
          subjectName: subjectName,
          details: `Course progress: ${prog.overallProgress}% complete`,
          timestamp: prog.lastAccessed,
          icon: "📈",
          color: "#667eea"
        });
        console.log(`    Added progress update: ${prog.overallProgress}%`);
      }
    }
    
    // ========== ENROLLMENT ACTIVITIES ==========
    for (const enrollment of enrollments) {
      const subjectId = enrollment.subjectId?._id?.toString();
      const isRelevantTeacher = subjectTeacherMap[subjectId];
      
      if (isRelevantTeacher && enrollment.enrollmentDate) {
        activities.push({
          type: "enrollment",
          subjectName: enrollment.subjectId?.name || "Unknown Course",
          details: `Enrolled in course`,
          timestamp: enrollment.enrollmentDate,
          icon: "🎓",
          color: "#667eea"
        });
        console.log(`Added enrollment activity for ${enrollment.subjectId?.name}`);
      }
    }
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivities = activities.slice(0, 15);
    
    console.log(`Total activities found: ${activities.length}`);
    console.log(`Returning ${recentActivities.length} recent activities`);
    
    res.json({
      success: true,
      activities: recentActivities
    });
    
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/* ================= GET STUDENTS PROGRESS FOR TEACHER'S SUBJECTS ================= */
/* ================= GET STUDENTS PROGRESS FOR TEACHER'S SUBJECTS ================= */
router.get("/teacher/students-progress/:teacherId", auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    console.log("Fetching students progress for teacher:", teacherId);
    
    // Get teacher's subjects with divisions
    const User = require("../models/User");
    const teacher = await User.findById(teacherId).populate("subjects.subjectId", "name code");
    
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ 
        success: false, 
        message: "Teacher not found" 
      });
    }
    
    // Get all divisions and subjects teacher teaches
    const teacherSubjects = teacher.subjects || [];
    const teacherDivisions = [...new Set(teacherSubjects.map(s => s.division).filter(Boolean))];
    const subjectIds = teacherSubjects.map(s => s.subjectId?._id?.toString()).filter(Boolean);
    
    console.log("Teacher divisions:", teacherDivisions);
    console.log("Teacher subject IDs:", subjectIds);
    
    if (subjectIds.length === 0) {
      return res.json({ success: true, studentsProgress: [] });
    }
    
    // Get all enrolled students for these subjects and divisions
    const Enrollment = require("../models/Enrollment");
    const enrollments = await Enrollment.find({
      subjectId: { $in: subjectIds },
      division: { $in: teacherDivisions },
      status: "active"
    }).populate("studentId", "name email rollNumber enrollmentNumber division photo mobile department course semester batch status")  // ← ADDED ALL FIELDS HERE
      .populate("subjectId", "name code");
    
    console.log(`Found ${enrollments.length} enrollments`);
    
    // Group enrollments by student
    const studentMap = new Map();
    for (const enrollment of enrollments) {
      const student = enrollment.studentId;
      if (!student) continue;
      
      const studentId = student._id.toString();
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student: {
            _id: student._id,
            name: student.name || "Unknown",
            email: student.email || "Not Available",
            mobile: student.mobile || "Not Available",  // ← ADD MOBILE
            rollNumber: student.rollNumber || "N/A",
            enrollmentNumber: student.enrollmentNumber || "N/A",
            department: student.department || "Not Assigned",  // ← ADD DEPARTMENT
            course: student.course || "Not Assigned",  // ← ADD COURSE
            semester: student.semester || "Not Assigned",  // ← ADD SEMESTER
            batch: student.batch || "Not Assigned",  // ← ADD BATCH
            division: student.division || "Not Assigned",
            photo: student.photo || null,
            status: student.status || "active"
          },
          subjects: []
        });
      }
      
      studentMap.get(studentId).subjects.push({
        subjectId: enrollment.subjectId._id,
        subjectName: enrollment.subjectId.name,
        subjectCode: enrollment.subjectId.code,
        division: enrollment.division,
        enrollmentId: enrollment._id
      });
    }
    
    // Get progress for each student for each subject
    const StudentProgress = require("../models/StudentProgress");
    const studentsProgress = [];
    
    for (const [studentId, data] of studentMap) {
      const studentSubjectsProgress = [];
      
      for (const subject of data.subjects) {
        const progressRecord = await StudentProgress.findOne({
          studentId: studentId,
          subjectId: subject.subjectId
        });
        
        const overallProgress = progressRecord?.overallProgress || 0;
        
        studentSubjectsProgress.push({
          subjectId: subject.subjectId,
          subjectName: subject.subjectName,
          subjectCode: subject.subjectCode,
          division: subject.division,
          progress: overallProgress,
          completedItems: progressRecord?.completedItems?.size || 0,
          totalItems: await getTotalItemsCount(subject.subjectId)
        });
      }
      
      // Calculate overall average progress across all subjects
      const totalProgress = studentSubjectsProgress.reduce((sum, s) => sum + s.progress, 0);
      const averageProgress = studentSubjectsProgress.length > 0 
        ? Math.round(totalProgress / studentSubjectsProgress.length) 
        : 0;
      
      studentsProgress.push({
        student: data.student,
        subjects: studentSubjectsProgress,
        averageProgress: averageProgress,
        totalSubjects: studentSubjectsProgress.length
      });
    }
    
    console.log(`Returning progress for ${studentsProgress.length} students`);
    
    res.json({
      success: true,
      studentsProgress: studentsProgress,
      teacherInfo: {
        name: teacher.name,
        divisions: teacherDivisions,
        subjects: teacherSubjects.map(s => ({
          name: s.subjectId?.name,
          code: s.subjectId?.code,
          division: s.division
        }))
      }
    });
    
  } catch (error) {
    console.error("Error fetching students progress:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/* ================= GET TEACHER DASHBOARD STATS ================= */
router.get("/teacher/dashboard-stats/:teacherId", auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    console.log("Fetching dashboard stats for teacher:", teacherId);
    
    // Get teacher with subjects
    const User = require("../models/User");
    const Subject = require("../models/Subject");
    const Assignment = require("../models/Assignment");
    const Quiz = require("../models/Quiz");
    const Content = require("../models/Content");
    const Unit = require("../models/Unit");
    const Enrollment = require("../models/Enrollment");
    const StudentProgress = require("../models/StudentProgress");
    
    const teacher = await User.findById(teacherId);
    
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }
    
    // Get teacher's subjects with divisions
    const teacherSubjects = teacher.subjects || [];
    const subjectIds = teacherSubjects.map(s => s.subjectId).filter(Boolean);
    const teacherDivisions = [...new Set(teacherSubjects.map(s => s.division).filter(Boolean))];
    
    console.log("Teacher Divisions:", teacherDivisions);
    console.log("Subject IDs:", subjectIds);
    
    // Get all subjects details
    const subjects = await Subject.find({ _id: { $in: subjectIds }, status: "active" });
    
    // Get total students enrolled in teacher's subjects/divisions
    const totalStudents = await Enrollment.countDocuments({
      subjectId: { $in: subjectIds },
      division: { $in: teacherDivisions },
      status: "active"
    });
    
    // Get all units for these subjects
    const units = await Unit.find({ subjectId: { $in: subjectIds }, isActive: true });
    const unitIds = units.map(u => u._id);
    
    // Get counts for assignments, quizzes, content
    const totalAssignments = await Assignment.countDocuments({ 
      subjectId: { $in: subjectIds },
      status: "approved"
    });
    
    const totalQuizzes = await Quiz.countDocuments({ 
      subjectId: { $in: subjectIds },
      status: "approved"
    });
    
    const totalContent = await Content.countDocuments({ 
      subjectId: { $in: subjectIds },
      status: "approved"
    });
    
    // Get total active subjects
    const totalSubjects = subjects.length;
    
    // Get subject-wise progress for enrolled students
    const subjectProgress = await Promise.all(subjects.map(async (subject) => {
      // Get students enrolled in this subject for teacher's divisions
      const enrollments = await Enrollment.find({
        subjectId: subject._id,
        division: { $in: teacherDivisions },
        status: "active"
      }).populate("studentId");
      
      const studentIds = enrollments.map(e => e.studentId?._id).filter(Boolean);
      
      // Get progress for each student
      let totalProgress = 0;
      let completedCount = 0;
      
      for (const studentId of studentIds) {
        const progress = await StudentProgress.findOne({
          studentId: studentId,
          subjectId: subject._id
        });
        const progValue = progress?.overallProgress || 0;
        totalProgress += progValue;
        if (progValue === 100) completedCount++;
      }
      
      const avgProgress = studentIds.length > 0 ? Math.round(totalProgress / studentIds.length) : 0;
      
      return {
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        enrolledStudents: studentIds.length,
        averageProgress: avgProgress,
        completedStudents: completedCount
      };
    }));
    
    // Calculate pending tasks (assignments that need grading)
    const pendingTasks = await Assignment.countDocuments({
      teacherId: teacherId,
      status: "approved"
    });
    
    // Get recent activities (last 5)
    const recentEnrollments = await Enrollment.find({
      subjectId: { $in: subjectIds },
      division: { $in: teacherDivisions }
    })
      .populate("studentId", "name email")
      .populate("subjectId", "name")
      .sort({ enrollmentDate: -1 })
      .limit(5);
    
    const recentActivities = recentEnrollments.map(e => ({
      action: "Enrolled",
      course: e.subjectId?.name || "Unknown",
      student: e.studentId?.name || "Unknown",
      time: formatRelativeTime(e.enrollmentDate),
      status: "active"
    }));
    
    // Get upcoming deadlines (assignments with deadline in next 7 days)
    const upcomingDeadlines = await Assignment.find({
      teacherId: teacherId,
      deadline: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      status: "approved"
    })
      .populate("subjectId", "name")
      .sort({ deadline: 1 })
      .limit(5);
    
    const deadlines = upcomingDeadlines.map(a => ({
      task: a.title,
      course: a.subjectId?.name || "Unknown",
      due: formatDeadline(a.deadline),
      submissions: 0 // You can calculate submissions count if needed
    }));
    
    res.json({
      success: true,
      stats: {
        totalStudents,
        totalSubjects,
        totalAssignments,
        totalQuizzes,
        totalContent,
        pendingTasks,
        subjectProgress,
        recentActivities,
        upcomingDeadlines
      }
    });
    
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to format relative time
function formatRelativeTime(date) {
  const diff = Math.floor((new Date() - new Date(date)) / 1000);
  if (diff < 60) return `${diff} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// Helper function to format deadline
function formatDeadline(date) {
  const deadlineDate = new Date(date);
  const today = new Date();
  const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  return deadlineDate.toLocaleDateString();
}
/* ================= GET COMPLETE TEACHER DASHBOARD DATA ================= */
router.get("/teacher/complete-dashboard/:teacherId", auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    console.log("=========================================");
    console.log("Fetching COMPLETE dashboard data for teacher:", teacherId);
    console.log("=========================================");
    
    // Get teacher with subjects
    const User = require("../models/User");
    const Subject = require("../models/Subject");
    const Assignment = require("../models/Assignment");
    const Quiz = require("../models/Quiz");
    const Content = require("../models/Content");
    const Unit = require("../models/Unit");
    const Enrollment = require("../models/Enrollment");
    const StudentProgress = require("../models/StudentProgress");
    
    const teacher = await User.findById(teacherId);
    
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }
    
    // Get teacher's subjects with divisions
    const teacherSubjects = teacher.subjects || [];
    const subjectIds = teacherSubjects.map(s => s.subjectId).filter(Boolean);
    const teacherDivisions = [...new Set(teacherSubjects.map(s => s.division).filter(Boolean))];
    
    console.log("Teacher Name:", teacher.name);
    console.log("Teacher Divisions:", teacherDivisions);
    console.log("Subject IDs:", subjectIds);
    
    // ========== 1. GET ALL SUBJECTS WITH DETAILS ==========
    const subjects = await Subject.find({ _id: { $in: subjectIds }, status: "active" });
    
    const subjectsWithDetails = await Promise.all(subjects.map(async (subject) => {
      // Get teacher's division for this subject
      const teacherSubject = teacherSubjects.find(ts => ts.subjectId.toString() === subject._id.toString());
      const teacherDivision = teacherSubject?.division || "Not Assigned";
      
      // Get units for this subject
      const units = await Unit.find({ 
        subjectId: subject._id, 
        teacherId: teacherId,
        isActive: true 
      }).populate("contents assignments quizzes");
      
      // Get assignments for this subject
      const assignments = await Assignment.find({ 
        subjectId: subject._id, 
        teacherId: teacherId,
        status: "approved"
      });
      
      // Get quizzes for this subject
      const quizzes = await Quiz.find({ 
        subjectId: subject._id, 
        teacherId: teacherId,
        status: "approved"
      });
      
      // Get content for this subject
      const content = await Content.find({ 
        subjectId: subject._id, 
        teacherId: teacherId,
        status: "approved"
      });
      
      // Get students enrolled in this subject for teacher's division
      const enrollments = await Enrollment.find({
        subjectId: subject._id,
        division: teacherDivision,
        status: "active"
      }).populate("studentId", "name email rollNumber enrollmentNumber photo mobile");
      
      // Calculate student progress
      const studentsWithProgress = await Promise.all(enrollments.map(async (enrollment) => {
        const student = enrollment.studentId;
        if (!student) return null;
        
        const progress = await StudentProgress.findOne({
          studentId: student._id,
          subjectId: subject._id
        });
        
        // Get unit-wise progress
        const unitProgress = await Promise.all(units.map(async (unit) => {
          const unitContent = await Content.find({ _id: { $in: unit.contents || [] } });
          const unitAssignments = await Assignment.find({ _id: { $in: unit.assignments || [] } });
          const unitQuizzes = await Quiz.find({ _id: { $in: unit.quizzes || [] } });
          
          const totalItems = unitContent.length + unitAssignments.length + unitQuizzes.length;
          let completedItems = 0;
          
          if (progress && progress.completedItems) {
            for (const item of [...unitContent, ...unitAssignments, ...unitQuizzes]) {
              if (progress.completedItems.get(item._id.toString())) {
                completedItems++;
              }
            }
          }
          
          const unitProgressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
          
          return {
            unitId: unit._id,
            unitNumber: unit.unitNumber,
            unitTitle: unit.unitTitle,
            totalItems: totalItems,
            completedItems: completedItems,
            progress: unitProgressPercent,
            isComplete: unitProgressPercent === 100 && totalItems > 0
          };
        }));
        
        const overallProgress = progress?.overallProgress || 0;
        const isCompleted = overallProgress === 100;
        
        return {
          studentId: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          enrollmentNumber: student.enrollmentNumber,
          mobile: student.mobile || "Not Available",
          photo: student.photo,
          enrollmentDate: enrollment.enrollmentDate,
          overallProgress: overallProgress,
          unitProgress: unitProgress,
          isCompleted: isCompleted,
          completedAt: isCompleted ? progress?.lastAccessed : null
        };
      }));
      
      const validStudents = studentsWithProgress.filter(s => s !== null);
      
      // Calculate overall subject stats
      const totalStudents = validStudents.length;
      const completedStudents = validStudents.filter(s => s.isCompleted).length;
      const avgProgress = totalStudents > 0 
        ? Math.round(validStudents.reduce((acc, s) => acc + s.overallProgress, 0) / totalStudents)
        : 0;
      
      return {
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        department: subject.department,
        course: subject.course,
        semester: subject.semester,
        division: teacherDivision,
        stats: {
          totalUnits: units.length,
          totalAssignments: assignments.length,
          totalQuizzes: quizzes.length,
          totalContent: content.length,
          totalStudents: totalStudents,
          completedStudents: completedStudents,
          averageProgress: avgProgress
        },
        units: units.map(u => ({
          unitId: u._id,
          unitNumber: u.unitNumber,
          unitTitle: u.unitTitle,
          description: u.description,
          contents: u.contents?.length || 0,
          assignments: u.assignments?.length || 0,
          quizzes: u.quizzes?.length || 0,
          status: u.status,
          isActive: u.isActive
        })),
        assignments: assignments.map(a => ({
          assignmentId: a._id,
          title: a.title,
          totalMarks: a.totalMarks,
          deadline: a.deadline,
          status: a.status
        })),
        quizzes: quizzes.map(q => ({
          quizId: q._id,
          title: q.title || `Quiz ${q._id}`,
          totalMarks: q.totalMarks,
          duration: q.duration,
          questionCount: q.questions?.length || 0,
          status: q.status
        })),
        content: content.map(c => ({
          contentId: c._id,
          topic: c.topic,
          itemCount: c.items?.length || 0,
          fileCount: c.files?.length || 0,
          status: c.status
        })),
        students: validStudents
      };
    }));
    
    // ========== 2. GET ALL ASSIGNMENTS SUMMARY ==========
    const allAssignments = await Assignment.find({ 
      teacherId: teacherId,
      status: "approved"
    }).populate("subjectId", "name code");
    
    const assignmentsSummary = allAssignments.map(a => ({
      assignmentId: a._id,
      title: a.title,
      subjectName: a.subjectId?.name || "Unknown",
      subjectCode: a.subjectId?.code,
      totalMarks: a.totalMarks,
      deadline: a.deadline,
      isExpired: new Date(a.deadline) < new Date()
    }));
    
    // ========== 3. GET ALL QUIZZES SUMMARY ==========
    const allQuizzes = await Quiz.find({ 
      teacherId: teacherId,
      status: "approved"
    }).populate("subjectId", "name code");
    
    const quizzesSummary = allQuizzes.map(q => ({
      quizId: q._id,
      title: q.title || `Quiz`,
      subjectName: q.subjectId?.name || "Unknown",
      subjectCode: q.subjectId?.code,
      totalMarks: q.totalMarks,
      duration: q.duration,
      questionCount: q.questions?.length || 0
    }));
    
    // ========== 4. GET ALL CONTENT SUMMARY ==========
    const allContent = await Content.find({ 
      teacherId: teacherId,
      status: "approved"
    }).populate("subjectId", "name code");
    
    const contentSummary = allContent.map(c => ({
      contentId: c._id,
      topic: c.topic,
      subjectName: c.subjectId?.name || "Unknown",
      subjectCode: c.subjectId?.code,
      itemCount: c.items?.length || 0,
      fileCount: c.files?.length || 0,
      totalDuration: c.items?.reduce((sum, item) => sum + (item.duration || 0), 0) || 0
    }));
    
    // ========== 5. GET ALL STUDENTS SUMMARY ==========
    const allEnrollments = await Enrollment.find({
      subjectId: { $in: subjectIds },
      division: { $in: teacherDivisions },
      status: "active"
    }).populate("studentId", "name email rollNumber enrollmentNumber mobile photo")
      .populate("subjectId", "name code");
    
    const studentsMap = new Map();
    for (const enrollment of allEnrollments) {
      const student = enrollment.studentId;
      if (!student) continue;
      
      const studentId = student._id.toString();
      if (!studentsMap.has(studentId)) {
        studentsMap.set(studentId, {
          studentId: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          enrollmentNumber: student.enrollmentNumber,
          mobile: student.mobile || "Not Available",
          photo: student.photo,
          division: enrollment.division,
          subjects: []
        });
      }
      
      studentsMap.get(studentId).subjects.push({
        subjectId: enrollment.subjectId?._id,
        subjectName: enrollment.subjectId?.name,
        subjectCode: enrollment.subjectId?.code,
        enrollmentDate: enrollment.enrollmentDate,
        status: enrollment.status
      });
    }
    
    const studentsSummary = Array.from(studentsMap.values());
    
    // ========== 6. CALCULATE OVERALL STATS ==========
    const totalStudents = studentsSummary.length;
    const totalSubjects = subjectsWithDetails.length;
    const totalAssignments = allAssignments.length;
    const totalQuizzes = allQuizzes.length;
    const totalContent = allContent.length;
    const totalUnits = subjectsWithDetails.reduce((acc, s) => acc + s.stats.totalUnits, 0);
    
    // Calculate pending tasks (assignments with upcoming deadlines)
    const pendingTasks = allAssignments.filter(a => new Date(a.deadline) > new Date()).length;
    
    // Calculate overall average progress across all subjects
    let totalProgressSum = 0;
    let totalProgressCount = 0;
    for (const subject of subjectsWithDetails) {
      for (const student of subject.students) {
        totalProgressSum += student.overallProgress;
        totalProgressCount++;
      }
    }
    const overallAverageProgress = totalProgressCount > 0 ? Math.round(totalProgressSum / totalProgressCount) : 0;
    
    // Get recent activities (last 10 enrollments)
    const recentActivities = allEnrollments
      .sort((a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate))
      .slice(0, 10)
      .map(e => ({
        action: "Enrolled",
        course: e.subjectId?.name || "Unknown",
        student: e.studentId?.name || "Unknown",
        time: formatRelativeTime(e.enrollmentDate),
        date: e.enrollmentDate
      }));
    
    // Get upcoming deadlines (assignments due in next 14 days)
    const upcomingDeadlines = allAssignments
      .filter(a => new Date(a.deadline) > new Date() && new Date(a.deadline) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .map(a => ({
        taskId: a._id,
        title: a.title,
        course: a.subjectId?.name || "Unknown",
        due: formatDeadline(a.deadline),
        dueDate: a.deadline,
        totalMarks: a.totalMarks
      }));
    
    console.log("=========================================");
    console.log("Dashboard Summary:");
    console.log(`- Total Students: ${totalStudents}`);
    console.log(`- Total Subjects: ${totalSubjects}`);
    console.log(`- Total Units: ${totalUnits}`);
    console.log(`- Total Assignments: ${totalAssignments}`);
    console.log(`- Total Quizzes: ${totalQuizzes}`);
    console.log(`- Total Content: ${totalContent}`);
    console.log(`- Overall Progress: ${overallAverageProgress}%`);
    console.log("=========================================");
    
    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          department: teacher.department,
          course: teacher.course,
          divisions: teacherDivisions
        },
        summary: {
          totalStudents,
          totalSubjects,
          totalUnits,
          totalAssignments,
          totalQuizzes,
          totalContent,
          pendingTasks,
          overallAverageProgress
        },
        subjects: subjectsWithDetails,
        assignments: assignmentsSummary,
        quizzes: quizzesSummary,
        content: contentSummary,
        students: studentsSummary,
        recentActivities,
        upcomingDeadlines
      }
    });
    
  } catch (error) {
    console.error("Error fetching complete dashboard:", error);
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

// Helper function to format deadline
function formatDeadline(date) {
  const deadlineDate = new Date(date);
  const today = new Date();
  const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  return deadlineDate.toLocaleDateString();
}


module.exports = router;