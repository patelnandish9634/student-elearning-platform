const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const User = require("../models/User"); // Replace Student & Teacher with User
const Department = require("../models/Department");
const Batch = require("../models/Batch");
const Semester = require("../models/Semester");

// ADD COURSE
router.post("/add", async (req, res) => {
  try {
    const {
      department,
      code,
      name,
      duration,
      totalSemesters,
    } = req.body;

    if (!department || !code || !name || !duration || !totalSemesters) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const codeExists = await Course.findOne({ code });
    if (codeExists) {
      return res.status(409).json({
        message: "Course code already exists",
      });
    }

    // CHECK DUPLICATE NAME IN SAME DEPARTMENT
    const nameExists = await Course.findOne({ name, department });
    if (nameExists) {
      return res.status(409).json({
        message: "Course already exists in this department",
      });
    }
    
    const course = new Course({
      department,
      code,
      name,
      duration,
      totalSemesters,
      status: "active",
    });

    await course.save();

    res.status(201).json({
      message: "Course added successfully",
      course,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET COURSES BY DEPARTMENT
router.get("/by-department/:department", async (req, res) => {
  try {
    const { department } = req.params;

    const courses = await Course.find({
      department,
      status: "active",
    }).sort({ name: 1 });

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL COURSES WITH STUDENT COUNTS
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find()
      .sort({ createdAt: -1 })
      .lean();

    const result = await Promise.all(
      courses.map(async (course) => {
        // Count students in this course from User model
        const studentsCount = await User.countDocuments({
          role: "student",
          department: course.department,
          course: course.name,
          status: "active",
        });

        return {
          ...course,
          students: studentsCount,
        };
      })
    );

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

// TOGGLE COURSE STATUS
router.put("/toggle-status/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.status = course.status === "active" ? "inactive" : "active";
    await course.save();

    res.status(200).json({
      message: "Course status updated",
      status: course.status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE COURSE (WITH CASCADE)
router.put("/:id", async (req, res) => {
  try {
    const { department, code, name, duration, totalSemesters } = req.body;

    if (!department || !code || !name || !duration || !totalSemesters) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // CHECK DUPLICATE CODE
    const codeExists = await Course.findOne({
      code,
      _id: { $ne: course._id },
    });
    if (codeExists) {
      return res.status(409).json({ message: "Course code already exists" });
    }

    // CHECK DUPLICATE NAME IN SAME DEPARTMENT
    const nameExists = await Course.findOne({
      name,
      department,
      _id: { $ne: course._id },
    });
    if (nameExists) {
      return res
        .status(409)
        .json({ message: "Course already exists in this department" });
    }

    // STORE OLD VALUES
    const oldCourseName = course.name;
    const oldDepartment = course.department;

    // UPDATE COURSE
    course.department = department;
    course.code = code;
    course.name = name;
    course.duration = duration;
    course.totalSemesters = totalSemesters;

    await course.save();

    // ================= UPDATE STUDENTS (User model) =================
    await User.updateMany(
      {
        role: "student",
        course: oldCourseName,
        department: oldDepartment,
      },
      {
        $set: {
          course: name,
          department: department,
        },
      }
    );

    // ================= UPDATE TEACHERS (User model) =================
    await User.updateMany(
      {
        role: "teacher",
        course: oldCourseName,
        department: oldDepartment,
      },
      {
        $set: {
          course: name,
          department: department,
        },
      }
    );

    // Note: Teachers might have courses array instead of single course
    // If teachers store multiple courses in an array, update like this:
    await User.updateMany(
      {
        role: "teacher",
        department: oldDepartment,
        courses: oldCourseName, // If courses is an array
      },
      {
        $set: {
          "courses.$": name, // Update the matched array element
          department: department,
        }
      }
    );

    // ================= UPDATE BATCHES =================
    await Batch.updateMany(
      {
        course: oldCourseName,
        department: oldDepartment,
      },
      {
        $set: {
          course: name,
          department: department,
        },
      }
    );

    // ================= UPDATE SEMESTERS =================
    await Semester.updateMany(
      {
        course: oldCourseName,
        department: oldDepartment,
      },
      {
        $set: {
          course: name,
          department: department,
        },
      }
    );

    res.status(200).json({
      message: "Course updated successfully across all records",
      course,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE COURSE (PERMANENT WITH CASCADE)
router.delete("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const courseName = course.name;
    const departmentName = course.department;

    // DELETE RELATED STUDENTS (User model)
    await User.deleteMany({
      role: "student",
      course: courseName,
      department: departmentName,
    });

    // DELETE RELATED TEACHERS (User model)
    await User.deleteMany({
      role: "teacher",
      course: courseName,
      department: departmentName,
    });

    // If teachers store courses in array, handle differently:
    // Option 1: Remove the course from teachers' courses array
    await User.updateMany(
      {
        role: "teacher",
        department: departmentName,
        courses: courseName,
      },
      {
        $pull: { courses: courseName } // Remove course from array
      }
    );

    // Option 2: If you want to delete teachers entirely when course is deleted
    // await User.deleteMany({
    //   role: "teacher",
    //   department: departmentName,
    //   courses: courseName,
    // });

    // DELETE RELATED BATCHES
    await Batch.deleteMany({
      course: courseName,
      department: departmentName,
    });

    // DELETE RELATED SEMESTERS
    await Semester.deleteMany({
      course: courseName,
      department: departmentName,
    });

    // FINALLY DELETE COURSE
    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Course and all related data deleted permanently",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// OPTIONAL: Get course statistics
router.get("/stats/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const [studentCount, teacherCount, batchCount, semesterCount] = await Promise.all([
      User.countDocuments({ 
        role: "student", 
        course: course.name,
        department: course.department 
      }),
      User.countDocuments({ 
        role: "teacher", 
        course: course.name,
        department: course.department 
      }),
      Batch.countDocuments({ 
        course: course.name,
        department: course.department 
      }),
      Semester.countDocuments({ 
        course: course.name,
        department: course.department 
      })
    ]);

    res.json({
      course: course.name,
      code: course.code,
      department: course.department,
      students: studentCount,
      teachers: teacherCount,
      batches: batchCount,
      semesters: semesterCount,
      status: course.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get stats" });
  }
});

module.exports = router;