const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const fs = require('fs');

/* ================= MULTER CONFIG ================= */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/students";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

/* ================= ADD STUDENT ================= */
router.post("/add", upload.single("photo"), async (req, res) => {
  try {
    const {
      department,
      course,
      batch,
      semester,
      name,
      enrollmentNumber,
      rollNumber,
      division,
      mobile,
      email,
      password,
      role = "student",
    } = req.body;

    // Check for duplicate
    const existingUser = await User.findOne({
      $or: [{ email }, { enrollmentNumber }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: "Student with this email or enrollment number already exists" 
      });
    }

    const student = new User({
      role: "student",
      department,
      course,
      batch,
      semester,
      name,
      enrollmentNumber,
      rollNumber,
      division,
      mobile,
      email,
      password, // Remember to hash this in production
      photo: req.file ? req.file.filename : null,
      status: "active",
    });

    await student.save();

    res.status(201).json({
      message: "Student added successfully",
      student,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add student" });
  }
});

/* ================= GET ALL STUDENTS ================= */
router.get("/", async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).sort({ createdAt: -1 });
    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

/* ================= GET SINGLE STUDENT BY ID ================= */
router.get("/:id", async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: "student" })
      .select('-password'); // Exclude password from response
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    // Return all student data including email
    res.status(200).json({
      _id: student._id,
      name: student.name,
      email: student.email,
      enrollmentNumber: student.enrollmentNumber,
      rollNumber: student.rollNumber,
      division: student.division,
      mobile: student.mobile,
      department: student.department,
      course: student.course,
      semester: student.semester,
      batch: student.batch,
      photo: student.photo,
      status: student.status,
      role: student.role,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ message: "Failed to fetch student" });
  }
});

/* ================= UPDATE STUDENT STATUS ================= */
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be either "active" or "inactive"' 
      });
    }

    const student = await User.findOne({ _id: req.params.id, role: "student" });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.status = status;
    await student.save();
    
    res.json({ 
      message: `Student status updated to ${status}`, 
      student 
    });
  } catch (error) {
    console.error('Error updating student status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ================= UPDATE STUDENT ================= */
router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const {
      name,
      enrollmentNumber,
      rollNumber,
      division,
      mobile,
      email,
      department,
      course,
      semester,
      batch,
      status
    } = req.body;

    let student = await User.findOne({ _id: req.params.id, role: "student" });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check for duplicate enrollment number
    if (enrollmentNumber && enrollmentNumber !== student.enrollmentNumber) {
      const existingEnrollment = await User.findOne({ 
        enrollmentNumber,
        role: "student",
        _id: { $ne: req.params.id }
      });
      
      if (existingEnrollment) {
        return res.status(400).json({ 
          message: 'Enrollment number already exists' 
        });
      }
    }

    // Check for duplicate email
    if (email && email !== student.email) {
      const existingEmail = await User.findOne({ 
        email,
        role: "student",
        _id: { $ne: req.params.id }
      });
      
      if (existingEmail) {
        return res.status(400).json({ 
          message: 'Email already exists' 
        });
      }
    }

    // Update fields
    student.name = name || student.name;
    student.enrollmentNumber = enrollmentNumber || student.enrollmentNumber;
    student.rollNumber = rollNumber !== undefined ? rollNumber : student.rollNumber;
    student.division = division !== undefined ? division : student.division;
    student.mobile = mobile || student.mobile;
    student.email = email || student.email;
    student.department = department || student.department;
    student.course = course || student.course;
    student.semester = semester || student.semester;
    student.batch = batch || student.batch;
    student.status = status || student.status;
    
    if (req.file) {
      if (student.photo) {
        const oldPhotoPath = path.join(__dirname, '..', 'uploads', 'students', student.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      student.photo = req.file.filename;
    }

    await student.save();
    
    res.json({ 
      message: 'Student updated successfully', 
      student
    });
  } catch (error) {
    console.error('Error updating student:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

/* ================= DELETE STUDENT ================= */
router.delete('/:id', async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: "student" });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.photo) {
      const photoPath = path.join(__dirname, '..', 'uploads', 'students', student.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await User.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'Student deleted successfully',
      deletedStudentId: student._id
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;