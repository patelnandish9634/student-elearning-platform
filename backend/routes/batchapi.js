const express = require("express");
const router = express.Router();
const Batch = require("../models/Batch");
const User = require("../models/User"); // Replace Student with User

// ADD BATCH
router.post("/add", async (req, res) => {
  try {
    const { department, course, batchName, startYear, endYear } = req.body;

    if (!department || !course || !batchName || !startYear || !endYear) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await Batch.findOne({
      department,
      course,
      batchName,
    });
    
    if (exists) {
      return res.status(409).json({ message: "Batch already exists" });
    }

    const batch = new Batch({
      department,
      course,
      batchName,
      startYear,
      endYear,
      status: "active", // Default status
    });

    await batch.save();

    res.status(201).json({
      message: "Batch added successfully",
      batch,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL BATCHES WITH STUDENT COUNTS
router.get("/", async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 }).lean();

    const result = await Promise.all(
      batches.map(async (batch) => {
        // Count students in this batch from User model
        const studentsCount = await User.countDocuments({
          role: "student",
          department: batch.department,
          course: batch.course,
          batch: batch.batchName,
          status: "active",
        });

        return {
          ...batch,
          students: studentsCount,
        };
      })
    );

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch batches" });
  }
});

/* ===============================
   TOGGLE STATUS (ACTIVE / INACTIVE)
   Updates both batch and its students
================================ */
router.put("/toggle-status/:id", async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const newStatus = batch.status === "active" ? "inactive" : "active";
    batch.status = newStatus;
    await batch.save();

    // UPDATE STUDENTS OF THIS BATCH (User model)
    await User.updateMany(
      {
        role: "student",
        department: batch.department,
        course: batch.course,
        batch: batch.batchName,
      },
      {
        $set: { status: newStatus }
      }
    );

    res.status(200).json({
      message: "Batch and related students status updated",
      status: newStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// GET ACTIVE BATCHES BY COURSE (FOR STUDENTS)
// ==========================================
router.get("/by-course/:department/:course", async (req, res) => {
  try {
    const { department, course } = req.params;

    const batches = await Batch.find({
      department,
      course,
      status: "active",
    }).sort({ startYear: -1 });

    res.status(200).json(batches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch batches" });
  }
});

// UPDATE BATCH (WITH CASCADE TO STUDENTS)
router.put("/edit/:id", async (req, res) => {
  try {
    const { batchName, startYear, endYear } = req.body;

    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const oldBatchName = batch.batchName;

    // Update batch
    batch.batchName = batchName;
    batch.startYear = startYear;
    batch.endYear = endYear;
    await batch.save();

    // UPDATE STUDENTS WITH OLD BATCH NAME (User model)
    await User.updateMany(
      {
        role: "student",
        department: batch.department,
        course: batch.course,
        batch: oldBatchName,
      },
      { 
        $set: { batch: batchName } 
      }
    );

    res.status(200).json({ 
      message: "Batch updated successfully",
      batch 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update batch" });
  }
});

/* =========================
   DELETE BATCH (CASCADE DELETE)
   Deletes batch and all its students
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // DELETE RELATED STUDENTS (User model)
    await User.deleteMany({
      role: "student",
      department: batch.department,
      course: batch.course,
      batch: batch.batchName,
    });

    // DELETE THE BATCH
    await Batch.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      message: "Batch and all its students deleted permanently",
      deletedBatch: batch.batchName,
      department: batch.department,
      course: batch.course
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete batch" });
  }
});

// OPTIONAL: GET BATCH STATISTICS
router.get("/stats/:id", async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const [totalStudents, activeStudents, inactiveStudents] = await Promise.all([
      User.countDocuments({ 
        role: "student",
        department: batch.department,
        course: batch.course,
        batch: batch.batchName
      }),
      User.countDocuments({ 
        role: "student",
        department: batch.department,
        course: batch.course,
        batch: batch.batchName,
        status: "active"
      }),
      User.countDocuments({ 
        role: "student",
        department: batch.department,
        course: batch.course,
        batch: batch.batchName,
        status: "inactive"
      })
    ]);

    res.json({
      batch: batch.batchName,
      department: batch.department,
      course: batch.course,
      duration: `${batch.startYear} - ${batch.endYear}`,
      totalStudents,
      activeStudents,
      inactiveStudents,
      status: batch.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get batch statistics" });
  }
});

// OPTIONAL: GET STUDENTS IN THIS BATCH
router.get("/:id/students", async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const students = await User.find({
      role: "student",
      department: batch.department,
      course: batch.course,
      batch: batch.batchName
    }).select('name email enrollmentNumber rollNumber status photo');

    res.json({
      batch: batch.batchName,
      totalStudents: students.length,
      students
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

module.exports = router;