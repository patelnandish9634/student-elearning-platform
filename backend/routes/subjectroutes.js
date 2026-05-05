const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");
const Unit = require("../models/Unit");
const Content = require("../models/Content");
const Assignment = require("../models/Assignment");
const Quiz = require("../models/Quiz");
const User = require("../models/User");

/* ================= HELPER: FIND TEACHER FOR A SUBJECT AND DIVISION ================= */
const findTeacherForSubjectAndDivision = async (subjectId, division) => {
  try {
    const teacher = await User.findOne({
      role: "teacher",
      status: "active",
      "subjects": {
        $elemMatch: {
          subjectId: subjectId,
          division: division
        }
      }
    }).select("name email qualification designation mobile");
    
    return teacher;
  } catch (error) {
    console.error("Error finding teacher:", error);
    return null;
  }
};

/* ================= CHECK IF SPECIFIC TEACHER HAS FULLY APPROVED CONTENT ================= */
const hasTeacherFullyApprovedContent = async (subjectId, teacherId) => {
  try {
    // Find all units created by this teacher for this subject
    const units = await Unit.find({ 
      subjectId: subjectId,
      teacherId: teacherId,
      status: "approved"  // Only consider approved units
    });
    
    if (units.length === 0) {
      console.log(`   No approved units found for teacher ${teacherId}`);
      return false;
    }
    
    let totalContent = 0;
    let approvedContent = 0;
    
    for (const unit of units) {
      // Content created by this teacher for this unit
      const contents = await Content.find({
        unitId: unit._id,
        teacherId: teacherId,
        status: "approved"
      });
      
      const assignments = await Assignment.find({
        unitId: unit._id,
        teacherId: teacherId,
        status: "approved"
      });
      
      const quizzes = await Quiz.find({
        unitId: unit._id,
        teacherId: teacherId,
        status: "approved"
      });
      
      totalContent += contents.length + assignments.length + quizzes.length;
      approvedContent += contents.length + assignments.length + quizzes.length; // all are approved because we filtered by status
    }
    
    if (totalContent === 0) {
      console.log(`   Teacher has approved units but no approved content items`);
      return false;
    }
    
    console.log(`   Teacher has ${totalContent} approved content items across ${units.length} units`);
    return true;
    
  } catch (error) {
    console.error("Error checking teacher content:", error);
    return false;
  }
};

// In subjectroutes.js, replace the getUnitsForTeacher function with this:

/* ================= GET UNITS AND CONTENT FOR A SPECIFIC TEACHER ================= */
const getUnitsForTeacher = async (subjectId, teacherId) => {
  try {
    const units = await Unit.find({
      subjectId: subjectId,
      teacherId: teacherId,
      status: "approved"
    }).sort({ unitNumber: 1 });
    
    const unitDetails = [];
    
    for (const unit of units) {
      // Get ALL content (not just approved) for this teacher
      // Since content is already filtered by teacherId, we can get all
      const contents = await Content.find({
        unitId: unit._id,
        teacherId: teacherId
      }).sort({ createdAt: 1 });
      
      const assignments = await Assignment.find({
        unitId: unit._id,
        teacherId: teacherId,
        status: "approved"
      }).sort({ createdAt: 1 });
      
      const quizzes = await Quiz.find({
        unitId: unit._id,
        teacherId: teacherId,
        status: "approved"
      }).sort({ createdAt: 1 });
      
      unitDetails.push({
        _id: unit._id,
        unitNumber: unit.unitNumber,
        unitTitle: unit.unitTitle,
        description: unit.description,
        totalContent: contents.length + assignments.length + quizzes.length,
        approvedContent: contents.filter(c => c.status === 'approved').length + 
                         assignments.filter(a => a.status === 'approved').length + 
                         quizzes.filter(q => q.status === 'approved').length,
        // IMPORTANT: Include FULL content with items and files
        contents: contents.map(c => ({
          id: c._id,
          topic: c.topic,
          status: c.status,
          itemsCount: c.items?.length || 0,
          items: c.items || [],  // Include full items array with videos
          files: c.files || [],   // Include full files array
          createdAt: c.createdAt
        })),
        assignments: assignments.map(a => ({
          id: a._id,
          title: a.title,
          description: a.description,
          status: a.status,
          totalMarks: a.totalMarks,
          deadline: a.deadline,
          assignmentFile: a.assignmentFile
        })),
        quizzes: quizzes.map(q => ({
          id: q._id,
          title: q.title,
          status: q.status,
          totalQuestions: q.questions?.length || 0,
          totalMarks: q.totalMarks,
          duration: q.duration,
          questions: q.questions || []  // Include full questions array
        }))
      });
    }
    
    return unitDetails;
  } catch (error) {
    console.error("Error getting units:", error);
    return [];
  }
};
/* ================= GET STUDENT DASHBOARD SUBJECTS ================= */
router.get("/student-dashboard", async (req, res) => {
  try {
    const { department, course, semester, division } = req.query;
    
    console.log("\n========================================");
    console.log("🎓 STUDENT DASHBOARD REQUEST:");
    console.log("   Department:", department);
    console.log("   Course:", course);
    console.log("   Student Semester:", semester);
    console.log("   Student Division:", division);
    console.log("========================================\n");
    
    if (!division || division === "undefined" || division === "null") {
      return res.json({ success: true, fullyApproved: [], partiallyApproved: [] });
    }
    
    let query = { status: "active" };
    if (department && department !== "undefined") query.department = department;
    if (course && course !== "undefined") query.course = course;
    if (semester && semester !== "undefined") query.semester = parseInt(semester);
    
    const allSubjects = await Subject.find(query);
    console.log(`📚 Found ${allSubjects.length} total subjects\n`);
    
    const subjectsToShow = [];
    
    for (const subject of allSubjects) {
      console.log(`\n📖 Subject: ${subject.name} (${subject.code})`);
      
      // Find teacher for this division
      const teacher = await findTeacherForSubjectAndDivision(subject._id, division);
      
      if (!teacher) {
        console.log(`   ❌ No teacher assigned to Division ${division} - SKIPPING`);
        continue;
      }
      
      console.log(`   👨‍🏫 Teacher for Division ${division}: ${teacher.name} (ID: ${teacher._id})`);
      
      // Check if THIS TEACHER has fully approved content
      const hasApproved = await hasTeacherFullyApprovedContent(subject._id, teacher._id);
      
      if (!hasApproved) {
        console.log(`   ❌ ${teacher.name} does NOT have fully approved content - SKIPPING`);
        continue;
      }
      
      console.log(`   ✅ ${teacher.name} HAS fully approved content`);
      
      // Get teacher-specific units and content
      const units = await getUnitsForTeacher(subject._id, teacher._id);
      
      const subjectData = {
        _id: subject._id,
        code: subject.code,
        name: subject.name,
        department: subject.department,
        course: subject.course,
        semester: subject.semester,
        credits: subject.credits || 3,
        description: subject.description || "",
        teacher: {
          name: teacher.name,
          email: teacher.email,
          qualification: teacher.qualification,
          designation: teacher.designation
        },
        instructor: teacher.name,
        assignedDivision: division,
        units: units,
        unitsCount: units.length,
        isFullyApproved: true,
        progress: 100,
        approvalPercentage: 100
      };
      
      console.log(`   ✅ ADDING to dashboard for Division ${division}\n`);
      subjectsToShow.push(subjectData);
    }
    
    console.log(`\n📊 FINAL: ${subjectsToShow.length} subject(s) for Division ${division}`);
    subjectsToShow.forEach(s => {
      console.log(`   → ${s.name} (Teacher: ${s.teacher.name})`);
    });
    console.log("========================================\n");
    
    res.json({
      success: true,
      fullyApproved: subjectsToShow,
      partiallyApproved: []
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ================= DEBUG ENDPOINT ================= */
router.get("/debug/teacher-assignments", async (req, res) => {
  try {
    const { course, semester } = req.query;
    
    let query = { status: "active" };
    if (course && course !== "undefined") query.course = course;
    if (semester && semester !== "undefined") query.semester = parseInt(semester);
    
    const subjects = await Subject.find(query);
    const teachers = await User.find({ role: "teacher", status: "active" });
    
    const debugData = [];
    
    for (const subject of subjects) {
      console.log(`\n📖 Subject: ${subject.name}`);
      const divisions = ["A", "B", "C", "D", "E", "F"];
      const divisionResults = [];
      
      for (const div of divisions) {
        const teacher = await findTeacherForSubjectAndDivision(subject._id, div);
        
        if (teacher) {
          const hasContent = await hasTeacherFullyApprovedContent(subject._id, teacher._id);
          divisionResults.push({
            division: div,
            teacher: teacher.name,
            hasApprovedContent: hasContent,
            showsToStudents: hasContent
          });
          console.log(`   Division ${div}: ${teacher.name} - Content Approved: ${hasContent ? 'YES ✅' : 'NO ❌'} → ${hasContent ? 'SHOWS' : 'NO SHOW'}`);
        } else {
          console.log(`   Division ${div}: No teacher assigned`);
        }
      }
      
      debugData.push({
        subjectName: subject.name,
        subjectCode: subject.code,
        divisions: divisionResults
      });
    }
    
    res.json({ success: true, data: debugData });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= GET SUBJECT DETAILS ================= */
router.get("/:id/details", async (req, res) => {
  try {
    const { id } = req.params;
    const { division } = req.query;
    
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    
    const teacher = await findTeacherForSubjectAndDivision(id, division);
    if (!teacher) {
      return res.status(404).json({ message: `No teacher assigned for division ${division}` });
    }
    
    const units = await getUnitsForTeacher(id, teacher._id);
    
    res.json({
      subject: {
        ...subject.toObject(),
        teacher: { name: teacher.name, email: teacher.email },
        instructor: teacher.name,
        assignedDivision: division
      },
      units: units,
      totalUnits: units.length
    });
    
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= CRUD ENDPOINTS (unchanged) ================= */
router.post("/add", async (req, res) => {
  try {
    const { code, name, department, course, semester } = req.body;
    if (!code || !name || !department || !course || !semester) {
      return res.status(400).json({ message: "All fields required" });
    }
    const exists = await Subject.findOne({ department, course, semester, name });
    if (exists) {
      return res.status(409).json({ message: "Subject already exists" });
    }
    const subject = new Subject({ code, name, department, course, semester: parseInt(semester), status: "active" });
    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { code, name, department, course, semester } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    subject.code = code;
    subject.name = name;
    subject.department = department;
    subject.course = course;
    subject.semester = parseInt(semester);
    await subject.save();
    res.json({ message: "Subject updated successfully", subject });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: "Subject deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/toggle-status/:id", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    subject.status = subject.status === "active" ? "inactive" : "active";
    await subject.save();
    res.json({ message: `Subject ${subject.status === "active" ? "activated" : "deactivated"}`, status: subject.status });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/by-course/:department/:course", async (req, res) => {
  try {
    const { department, course } = req.params;
    const subjects = await Subject.find({ department, course, status: "active" }).sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET SUBJECTS FOR A SPECIFIC TEACHER ================= */
router.get("/teacher/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    console.log(`📚 Fetching subjects for teacher: ${teacherId}`);
    
    // Find the teacher
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ 
        success: false, 
        message: "Teacher not found" 
      });
    }
    
    // Get subjects from teacher's subjects array
    const teacherSubjects = teacher.subjects || [];
    
    if (teacherSubjects.length === 0) {
      console.log("No subjects assigned to this teacher");
      return res.json({
        success: true,
        subjects: []
      });
    }
    
    // Get subject details for each subject ID
    const subjectIds = teacherSubjects.map(s => s.subjectId);
    const subjects = await Subject.find({ 
      _id: { $in: subjectIds },
      status: "active"
    }).sort({ name: 1 });
    
    // Add division information to each subject
    const subjectsWithDivision = subjects.map(subject => {
      const teacherSubject = teacherSubjects.find(
        ts => ts.subjectId.toString() === subject._id.toString()
      );
      return {
        _id: subject._id,
        code: subject.code,
        name: subject.name,
        department: subject.department,
        course: subject.course,
        semester: subject.semester,
        division: teacherSubject?.division || "",
        credits: subject.credits || 3
      };
    });
    
    console.log(`✅ Found ${subjectsWithDivision.length} subjects for teacher ${teacher.name}`);
    
    res.json({
      success: true,
      subjects: subjectsWithDivision
    });
    
  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});


/* ================= GET UNITS FOR A SUBJECT AND TEACHER ================= */
router.get("/units/subject/:subjectId", async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { teacherId } = req.query;
    
    console.log(`📚 Fetching units for subject: ${subjectId}, teacher: ${teacherId}`);
    
    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID is required"
      });
    }
    
    // Find units for this subject and teacher
    const units = await Unit.find({
      subjectId: subjectId,
      teacherId: teacherId,
      status: "approved"
    }).sort({ unitNumber: 1 });
    
    console.log(`✅ Found ${units.length} units`);
    
    res.json({
      success: true,
      units: units
    });
    
  } catch (error) {
    console.error("Error fetching units:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;