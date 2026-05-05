const express = require("express");
const router = express.Router();
const Meeting = require("../models/Meeting");
const auth = require("../middleware/verifytoken");

// Add new meeting
router.post("/add", auth, async (req, res) => {
  try {
    const {
      teacherId,
      subjectId,
      unitId,
      division,
      title,
      description,
      date,
      time,
      duration,
      meetingLink,
      attendees,
      classType
    } = req.body;

    console.log("Adding meeting:", { teacherId, subjectId, unitId, division, title, date, time });

    if (!teacherId || !title || !date || !time || !meetingLink || !division) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields. Teacher ID, Title, Date, Time, Meeting Link, and Division are required." 
      });
    }

    const meeting = new Meeting({
      teacherId,
      subjectId: subjectId || null,
      unitId: unitId || null,
      division: division,
      title,
      description: description || "",
      date: new Date(date),
      time,
      duration: duration || "60",
      meetingLink,
      attendees: attendees || "",
      classType: classType || "live",
      status: "scheduled"
    });

    await meeting.save();
    await meeting.populate("subjectId", "name code");
    await meeting.populate("unitId", "unitTitle unitNumber");

    res.json({
      success: true,
      message: "Meeting scheduled successfully",
      meeting
    });

  } catch (error) {
    console.error("Error adding meeting:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get all meetings for a teacher
router.get("/teacher/:teacherId", auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const meetings = await Meeting.find({ teacherId })
      .populate("subjectId", "name code")
      .populate("unitId", "unitTitle unitNumber")
      .sort({ date: -1, time: -1 });

    res.json({
      success: true,
      meetings
    });

  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get meetings for students by division
router.get("/student/division/:division", auth, async (req, res) => {
  try {
    const { division } = req.params;
    
    console.log(`Fetching meetings for division: ${division}`);
    
    // Get current date for filtering (only future and today's meetings)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const meetings = await Meeting.find({
      division: division,
      status: "scheduled",
      date: { $gte: today }
    })
      .populate("subjectId", "name code")
      .populate("unitId", "unitTitle unitNumber")
      .sort({ date: 1, time: 1 });
    
    console.log(`Found ${meetings.length} meetings for division ${division}`);
    
    res.json({
      success: true,
      meetings: meetings
    });

  } catch (error) {
    console.error("Error fetching meetings by division:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get all meetings (admin only - optional)
router.get("/all", auth, async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate("teacherId", "name email")
      .populate("subjectId", "name code")
      .populate("unitId", "unitTitle unitNumber")
      .sort({ date: -1, time: -1 });

    res.json({
      success: true,
      meetings
    });

  } catch (error) {
    console.error("Error fetching all meetings:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Update meeting
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const meeting = await Meeting.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).populate("subjectId", "name code")
     .populate("unitId", "unitTitle unitNumber");

    if (!meeting) {
      return res.status(404).json({ 
        success: false, 
        message: "Meeting not found" 
      });
    }

    res.json({
      success: true,
      message: "Meeting updated successfully",
      meeting
    });

  } catch (error) {
    console.error("Error updating meeting:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Delete meeting
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findByIdAndDelete(id);
    
    if (!meeting) {
      return res.status(404).json({ 
        success: false, 
        message: "Meeting not found" 
      });
    }

    res.json({
      success: true,
      message: "Meeting deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get single meeting by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findById(id)
      .populate("teacherId", "name email")
      .populate("subjectId", "name code")
      .populate("unitId", "unitTitle unitNumber");
    
    if (!meeting) {
      return res.status(404).json({ 
        success: false, 
        message: "Meeting not found" 
      });
    }

    res.json({
      success: true,
      meeting
    });

  } catch (error) {
    console.error("Error fetching meeting:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get meetings by date range
router.get("/date-range", auth, async (req, res) => {
  try {
    const { startDate, endDate, teacherId } = req.query;
    
    let query = {};
    
    if (teacherId) {
      query.teacherId = teacherId;
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const meetings = await Meeting.find(query)
      .populate("subjectId", "name code")
      .populate("unitId", "unitTitle unitNumber")
      .sort({ date: 1, time: 1 });

    res.json({
      success: true,
      meetings
    });

  } catch (error) {
    console.error("Error fetching meetings by date range:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Cancel meeting
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({ 
        success: false, 
        message: "Meeting not found" 
      });
    }
    
    meeting.status = "cancelled";
    meeting.cancellationReason = cancellationReason || "No reason provided";
    meeting.cancelledAt = new Date();
    
    await meeting.save();

    res.json({
      success: true,
      message: "Meeting cancelled successfully",
      meeting
    });

  } catch (error) {
    console.error("Error cancelling meeting:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Complete meeting (mark as completed)
router.put("/:id/complete", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { recordingLink, notes } = req.body;
    
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({ 
        success: false, 
        message: "Meeting not found" 
      });
    }
    
    meeting.status = "completed";
    if (recordingLink) meeting.recordingLink = recordingLink;
    if (notes) meeting.notes = notes;
    meeting.completedAt = new Date();
    
    await meeting.save();

    res.json({
      success: true,
      message: "Meeting marked as completed",
      meeting
    });

  } catch (error) {
    console.error("Error completing meeting:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;