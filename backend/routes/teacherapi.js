const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const Subject = require("../models/Subject");

/* ================= MULTER CONFIG ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/teachers";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* ================= ADD TEACHER ================= */
router.post("/add", upload.single("photo"), async (req, res) => {
  try {
    const {
      department,
      course,
      employeeId,
      name,
      designation,
      qualification,
      experience,
      specialization,
      email,
      mobile,
      password,
      role = "teacher",
      subjects,
    } = req.body;

    if (!department || !course || !employeeId || !name || !designation ||
        !qualification || !experience || !specialization || !email || !mobile || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (existingUser) {
      return res.status(400).json({ message: "Teacher already exists" });
    }

    let subjectArray = [];
    if (subjects) {
      if (typeof subjects === 'string') {
        try {
          subjectArray = JSON.parse(subjects);
        } catch (e) {
          subjectArray = [];
        }
      } else if (Array.isArray(subjects)) {
        subjectArray = subjects;
      }
    }

    for (const subject of subjectArray) {
      const existingAssignment = await User.findOne({
        role: "teacher",
        "subjects": {
          $elemMatch: {
            subjectId: subject.subjectId,
            division: subject.division
          }
        }
      });
      
      if (existingAssignment) {
        const existingTeacher = await User.findById(existingAssignment._id);
        return res.status(400).json({ 
          message: `"${subject.division}" division for this subject is already assigned to teacher: ${existingTeacher.name}.`
        });
      }
    }

    const teacher = new User({
      role: "teacher",
      department,
      courses: [course],
      employeeId,
      name,
      designation,
      qualification,
      experience: parseInt(experience),
      specialization,
      email,
      mobile,
      password,
      subjects: subjectArray,
      photo: req.file ? req.file.filename : null,
      status: "active"
    });

    await teacher.save();
    await teacher.populate('subjects.subjectId');

    res.status(201).json({
      message: "Teacher added successfully",
      teacher,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET ALL TEACHERS ================= */
router.get("/", async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" })
      .sort({ createdAt: -1 })
      .populate('subjects.subjectId');

    const formatted = teachers.map((t) => ({
      _id: t._id,
      employeeId: t.employeeId,
      name: t.name,
      email: t.email,
      mobile: t.mobile,
      department: t.department,
      designation: t.designation,
      qualification: t.qualification,
      experience: t.experience,
      specialization: t.specialization,
      courses: t.courses,
      course: t.courses?.[0],
      subjects: t.subjects.map(s => ({
        _id: s.subjectId?._id,
        name: s.subjectId?.name,
        code: s.subjectId?.code,
        division: s.division,
        status: s.subjectId?.status || "inactive"
      })),
      subjectsCount: t.subjects?.length || 0,
      status: t.status,
      photo: t.photo,
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch teachers" });
  }
});

/* ================= TOGGLE TEACHER STATUS ================= */
router.put("/toggle-status/:id", async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    teacher.status = teacher.status === "active" ? "inactive" : "active";
    await teacher.save();

    res.json({
      message: `Teacher marked as ${teacher.status}`,
      status: teacher.status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update status" });
  }
});

/* ================= UPDATE TEACHER ================= */
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const {
      department,
      course,
      employeeId,
      name,
      designation,
      qualification,
      experience,
      specialization,
      email,
      mobile,
      password,
      subjects,
    } = req.body;

    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });
    
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const existingUser = await User.findOne({
      _id: { $ne: req.params.id },
      role: "teacher",
      $or: [{ email }, { employeeId }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email or Employee ID already exists",
      });
    }

    let subjectArray = [];
    if (subjects) {
      if (typeof subjects === 'string') {
        try {
          subjectArray = JSON.parse(subjects);
        } catch (e) {
          subjectArray = [];
        }
      } else if (Array.isArray(subjects)) {
        subjectArray = subjects;
      }
    }

    for (const subject of subjectArray) {
      const existingAssignment = await User.findOne({
        _id: { $ne: req.params.id },
        role: "teacher",
        "subjects": {
          $elemMatch: {
            subjectId: subject.subjectId,
            division: subject.division
          }
        }
      });
      
      if (existingAssignment) {
        const existingTeacher = await User.findById(existingAssignment._id);
        return res.status(400).json({ 
          message: `"${subject.division}" division for this subject is already assigned to teacher: ${existingTeacher.name}.`
        });
      }
    }

    teacher.department = department || teacher.department;
    teacher.courses = course ? [course] : teacher.courses;
    teacher.employeeId = employeeId || teacher.employeeId;
    teacher.name = name || teacher.name;
    teacher.designation = designation || teacher.designation;
    teacher.qualification = qualification || teacher.qualification;
    teacher.experience = experience || teacher.experience;
    teacher.specialization = specialization || teacher.specialization;
    teacher.email = email || teacher.email;
    teacher.mobile = mobile || teacher.mobile;
    teacher.subjects = subjectArray.length ? subjectArray : teacher.subjects;
    
    if (password) {
      teacher.password = password;
    }
    
    if (req.file) {
      if (teacher.photo) {
        const oldPhotoPath = path.join("uploads/teachers", teacher.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      teacher.photo = req.file.filename;
    }

    await teacher.save();
    await teacher.populate('subjects.subjectId');

    res.json({
      message: "Teacher updated successfully",
      teacher,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= DELETE TEACHER ================= */
router.delete("/:id", async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });
    
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (teacher.photo) {
      const photoPath = path.join("uploads/teachers", teacher.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET TEACHER PROFILE (BASIC) ================= */
router.get("/profile/:id", async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({
      name: teacher.name,
      photo: teacher.photo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET TEACHER WITH SUBJECTS AND DIVISIONS ================= */
router.get("/:id/with-subjects", async (req, res) => {
  try {
    const teacher = await User.findOne({ 
      _id: req.params.id, 
      role: "teacher" 
    }).populate('subjects.subjectId');

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const subjectsWithDivision = teacher.subjects.map(assignment => {
      const subject = assignment.subjectId;
      return {
        _id: subject?._id,
        name: subject?.name,
        code: subject?.code,
        course: subject?.course,
        semester: subject?.semester,
        division: assignment.division,
        status: subject?.status || "inactive"
      };
    });

    res.json(subjectsWithDivision);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET SINGLE TEACHER BY ID (COMPLETE) - MUST BE LAST ================= */
router.get("/:id", async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" })
      .select('-password')
      .populate('subjects.subjectId');
    
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      mobile: teacher.mobile,
      department: teacher.department,
      employeeId: teacher.employeeId,
      designation: teacher.designation,
      qualification: teacher.qualification,
      experience: teacher.experience,
      specialization: teacher.specialization,
      courses: teacher.courses,
      course: teacher.courses?.[0],
      subjects: teacher.subjects.map(s => ({
        subjectId: s.subjectId,
        division: s.division
      })),
      status: teacher.status,
      photo: teacher.photo,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;