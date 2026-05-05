const express = require("express");
const router = express.Router();
const Unit = require("../models/Unit");
const Content = require("../models/Content");
const Assignment = require("../models/Assignment");
const Quiz = require("../models/Quiz");
const Verification = require("../models/VerificationRequest");
const fs = require("fs");
const path = require("path");

// Add new unit
router.post("/add", async (req, res) => {
  try {
    const {
      subjectId,
      teacherId,
      unitNumber,
      unitTitle,
      description,
      status,
      isActive,
      createdBy
    } = req.body;

    // Check if unit number already exists for this subject AND this teacher
    const existingUnit = await Unit.findOne({ 
      subjectId, 
      unitNumber,
      teacherId
    });
    
    if (existingUnit) {
      return res.status(400).json({ 
        message: `Unit ${unitNumber} already exists for this subject` 
      });
    }

    const unit = new Unit({
      subjectId,
      teacherId,
      unitNumber,
      unitTitle,
      description: description || "",
      status: status || "pending",
      isActive: isActive !== undefined ? isActive : true,
      createdBy: createdBy || teacherId
    });

    await unit.save();
    await unit.populate("subjectId");

    res.status(201).json({
      message: "Unit created successfully",
      unit
    });

  } catch (error) {
    console.error("Error creating unit:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all units for a teacher
router.get("/teacher/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const units = await Unit.find({ teacherId })
      .populate("subjectId")
      .sort({ createdAt: -1 });
    res.json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get units by subject (with teacher filter)
router.get("/subject/:subjectId", async (req, res) => {
  try {
    const { teacherId } = req.query;
    let query = { subjectId: req.params.subjectId };
    
    // If teacherId is provided, only return units created by that teacher
    if (teacherId) {
      query.teacherId = teacherId;
    }
    
    const units = await Unit.find(query).sort({ unitNumber: 1 });
    res.json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check if unit has related content before deletion
router.get("/:id/check-related", async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];
    const unitId = req.params.id;
    
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }
    
    // Verify ownership
    if (unit.teacherId.toString() !== teacherId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const content = await Content.find({ unitId });
    const assignments = await Assignment.find({ unitId });
    const quizzes = await Quiz.find({ unitId });
    const pendingVerifications = await Verification.find({
      $or: [
        { unitId },
        { contentId: { $in: content.map(c => c._id) } },
        { assignmentId: { $in: assignments.map(a => a._id) } },
        { quizId: { $in: quizzes.map(q => q._id) } }
      ],
      status: { $in: ['pending_review', 'under_review'] }
    });
    
    res.json({
      hasContent: content.length > 0 || assignments.length > 0 || quizzes.length > 0,
      counts: {
        content: content.length,
        assignments: assignments.length,
        quizzes: quizzes.length,
        pendingVerifications: pendingVerifications.length
      }
    });
  } catch (error) {
    console.error("Error checking related content:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single unit
router.get("/:id", async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id).populate("subjectId");
    
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    res.json(unit);
  } catch (error) {
    console.error("Error fetching unit:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE UNIT ================= */
// IMPORTANT: This endpoint DOES NOT change the status
// Only updates unit data, status remains the same
router.put("/:id", async (req, res) => {
  try {
    const { unitNumber, unitTitle, description } = req.body;
    const teacherId = req.headers['x-teacher-id'];
    
    const unit = await Unit.findById(req.params.id);
    
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }
    
    // Verify that this unit belongs to the teacher
    if (unit.teacherId.toString() !== teacherId) {
      return res.status(403).json({ message: "You can only edit your own units" });
    }

    const originalStatus = unit.status; // Store original status

    // Check if updating unit number and if it's already taken by this teacher
    if (unitNumber && unitNumber !== unit.unitNumber) {
      const existingUnit = await Unit.findOne({ 
        subjectId: unit.subjectId, 
        unitNumber,
        teacherId 
      });
      if (existingUnit) {
        return res.status(400).json({ 
          message: `Unit ${unitNumber} already exists for this subject` 
        });
      }
    }

    // Update fields ONLY - DO NOT CHANGE STATUS
    unit.unitNumber = unitNumber || unit.unitNumber;
    unit.unitTitle = unitTitle || unit.unitTitle;
    unit.description = description !== undefined ? description : unit.description;
    // Status remains unchanged - if it was 'rejected', it stays 'rejected'

    await unit.save();
    await unit.populate("subjectId");

    console.log(`Unit ${unit._id} updated. Status unchanged: ${originalStatus} -> ${unit.status}`);

    res.json({
      message: "Unit updated successfully. Status unchanged.",
      unit,
      statusUnchanged: true,
      originalStatus: originalStatus,
      currentStatus: unit.status
    });

  } catch (error) {
    console.error("Error updating unit:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete unit with cascade delete
router.delete("/:id", async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];
    
    const unit = await Unit.findById(req.params.id);
    
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }
    
    // Verify that this unit belongs to the teacher
    if (unit.teacherId.toString() !== teacherId) {
      return res.status(403).json({ message: "You can only delete your own units" });
    }

    // Get all related content, assignments, and quizzes
    const contentItems = await Content.find({ unitId: unit._id });
    const assignments = await Assignment.find({ unitId: unit._id });
    const quizzes = await Quiz.find({ unitId: unit._id });
    
    // Check for pending verification requests
    const pendingVerifications = await Verification.find({
      $or: [
        { unitId: unit._id },
        { contentId: { $in: contentItems.map(c => c._id) } },
        { assignmentId: { $in: assignments.map(a => a._id) } },
        { quizId: { $in: quizzes.map(q => q._id) } }
      ],
      status: { $in: ['pending_review', 'under_review'] }
    });

    if (pendingVerifications.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete unit with pending verification requests. Please wait for admin approval.",
        pendingCount: pendingVerifications.length
      });
    }

    // Update verification records to mark as deleted
    await Verification.updateMany(
      { 
        $or: [
          { unitId: unit._id },
          { contentId: { $in: contentItems.map(c => c._id) } },
          { assignmentId: { $in: assignments.map(a => a._id) } },
          { quizId: { $in: quizzes.map(q => q._id) } }
        ]
      },
      { 
        status: 'deleted',
        adminFeedback: 'Content was deleted by teacher before verification',
        deletedAt: new Date()
      }
    );

    // Delete all related content files from server
    for (const content of contentItems) {
      if (content.files && content.files.length > 0) {
        content.files.forEach(file => {
          const filePath = path.join("uploads/content", file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      await Content.findByIdAndDelete(content._id);
    }

    // Delete all related assignments files
    for (const assignment of assignments) {
      if (assignment.assignmentFile) {
        const filePath = path.join("uploads/assignments", assignment.assignmentFile.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      await Assignment.findByIdAndDelete(assignment._id);
    }

    // Delete all related quizzes
    for (const quiz of quizzes) {
      await Quiz.findByIdAndDelete(quiz._id);
    }

    // Delete the unit itself
    await Unit.findByIdAndDelete(req.params.id);

    res.json({ 
      message: "Unit and all related content deleted successfully",
      deletedCount: {
        unit: 1,
        content: contentItems.length,
        assignments: assignments.length,
        quizzes: quizzes.length
      }
    });
    
  } catch (error) {
    console.error("Error deleting unit:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Toggle unit active status
router.put("/:id/toggle-status", async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];
    
    const unit = await Unit.findById(req.params.id);
    
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }
    
    // Verify that this unit belongs to the teacher
    if (unit.teacherId.toString() !== teacherId) {
      return res.status(403).json({ message: "You can only modify your own units" });
    }

    unit.isActive = !unit.isActive;
    await unit.save();

    res.json({
      message: `Unit ${unit.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: unit.isActive
    });

  } catch (error) {
    console.error("Error toggling unit status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update unit status and feedback (for admin use - no teacher verification needed)
router.put("/:id/status", async (req, res) => {
  try {
    const { status, adminFeedback } = req.body;
    
    const unit = await Unit.findById(req.params.id);
    
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    unit.status = status;
    if (adminFeedback) {
      unit.adminFeedback = adminFeedback;
    }
    
    await unit.save();

    console.log(`Unit ${unit._id} status updated by admin: ${status}`);

    res.json({
      message: `Unit ${status}`,
      unit
    });

  } catch (error) {
    console.error("Error updating unit status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= RE-VERIFY UNIT ENDPOINT ================= */
// PUT /api/units/:id/reverify - Update unit from rejected to pending for re-verification
router.put("/:id/reverify", async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, teacherName } = req.body;
    
    console.log(`Re-verify request received for unit: ${id}`);
    console.log(`Teacher ID: ${teacherId}`);
    
    const unit = await Unit.findById(id);
    
    if (!unit) {
      return res.status(404).json({ 
        success: false,
        message: "Unit not found" 
      });
    }
    
    console.log(`Current unit status: ${unit.status}`);
    console.log(`Unit teacher ID: ${unit.teacherId}`);
    
    // Verify that this unit belongs to the teacher
    if (unit.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false,
        message: "You can only re-verify your own units" 
      });
    }
    
    const oldStatus = unit.status;
    
    // Update status to pending for re-verification
    unit.status = 'pending';
    unit.adminFeedback = null; // Clear previous rejection feedback
    unit.reVerificationRequested = true;
    unit.reVerificationDate = new Date();
    unit.reVerificationCount = (unit.reVerificationCount || 0) + 1;
    
    await unit.save();
    
    console.log(`Unit ${id} re-verification: ${oldStatus} -> pending`);
    
    res.json({ 
      success: true, 
      message: `Unit re-verification requested. Status changed from ${oldStatus} to pending`,
      unit: {
        _id: unit._id,
        unitTitle: unit.unitTitle,
        unitNumber: unit.unitNumber,
        oldStatus: oldStatus,
        newStatus: unit.status,
        reVerificationRequested: unit.reVerificationRequested,
        reVerificationDate: unit.reVerificationDate,
        reVerificationCount: unit.reVerificationCount
      }
    });
    
  } catch (error) {
    console.error("Error in re-verify unit:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error: " + error.message 
    });
  }
});

// DEBUG: Check unit status endpoint
router.get("/debug/:id/status", async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }
    res.json({
      id: unit._id,
      unitTitle: unit.unitTitle,
      unitNumber: unit.unitNumber,
      status: unit.status,
      reVerificationRequested: unit.reVerificationRequested,
      adminFeedback: unit.adminFeedback,
      reVerificationCount: unit.reVerificationCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;