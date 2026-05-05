const express = require("express");
const router = express.Router();
const Semester = require("../models/Semester");
const Batch = require("../models/Batch")
const Student = require("../models/Student")


/* ADD SEMESTER */
router.post("/add", async (req, res) => {
  try {
    const {
      department,
      course,
      semesterNumber,
      semesterName,
    } = req.body;

    if (!department || !course || !semesterNumber || !semesterName) {
      return res.status(400).json({ message: "All fields are required" });
    }

  const exists = await Semester.findOne({
      department,
      course,
      semesterNumber,
    });

    if (exists) {
      return res
        .status(409)
        .json({ message: "Semester already exists for this course" });
    }

    const semester = new Semester({
      department,
      course,
      semesterNumber,
      semesterName,
      
    });

    await semester.save();

    res.status(201).json(semester);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET SEMESTERS BY COURSE
router.get("/by-course/:department/:course", async (req, res) => {
  try {
    const semesters = await Semester.find({
      department: req.params.department,
      course: req.params.course,
    }).sort({ semesterNumber: 1 });

    res.status(200).json(semesters);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const semesters = await Semester.find()
      .sort({ department: 1, course: 1, semesterNumber: 1 });

    res.status(200).json(semesters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch semesters" });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { department, course, semesterNumber, semesterName } = req.body;

    if (!department || !course || !semesterNumber || !semesterName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const semester = await Semester.findById(req.params.id);

    if (!semester) {
      return res.status(404).json({ message: "Semester not found" });
    }

    // STORE OLD VALUES (CRITICAL)
    const oldDepartment = semester.department;
    const oldCourse = semester.course;
    const oldSemesterNumber = semester.semesterNumber;
    const oldSemesterName = semester.semesterName;

    // CHECK DUPLICATE
    const exists = await Semester.findOne({
      department,
      course,
      semesterNumber,
      _id: { $ne: semester._id },
    });

    if (exists) {
      return res.status(409).json({
        message: "Semester already exists for this course",
      });
    }

    // UPDATE SEMESTER
    semester.department = department;
    semester.course = course;
    semester.semesterNumber = semesterNumber;
    semester.semesterName = semesterName;

    await semester.save();

    // 🔁 UPDATE BATCHES
    await Batch.updateMany(
      {
        department: oldDepartment,
        course: oldCourse,
        semester: oldSemesterNumber,
      },
      {
        department,
        course,
        semester: semesterNumber,
      }
    );

    // 🔁 UPDATE STUDENTS
    await Student.updateMany(
      {
        department: oldDepartment,
        course: oldCourse,
        semester: oldSemesterNumber,
      },
      {
        department,
        course,
        semester: semesterNumber,
      }
    );

    res.status(200).json({
      message: "Semester updated successfully",
      semester,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);

    if (!semester) {
      return res.status(404).json({ message: "Semester not found" });
    }

    const department = semester.department;
    const course = semester.course;
    const semesterNumber = semester.semesterNumber;

    // 🗑 DELETE STUDENTS
    await Student.deleteMany({
      department,
      course,
      semester: semesterNumber,
    });

    // 🗑 DELETE BATCHES
    await Batch.deleteMany({
      department,
      course,
      semester: semesterNumber,
    });

    // 🗑 DELETE SEMESTER
    await Semester.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Semester and all related data deleted permanently",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
