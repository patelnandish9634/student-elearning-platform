const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Content = require("../models/Content");
const Unit = require("../models/Unit");

/* ================= MULTER CONFIG FOR FILE UPLOADS ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine if this is a video file for an item or a general file
    let dir = "uploads/content";
    
    // Check if this is a video file (coming with field name starting with 'video_')
    if (file.fieldname && file.fieldname.startsWith('video_')) {
      dir = "uploads/content/videos";
    }
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Check if this is a video file
  if (file.fieldname && file.fieldname.startsWith('video_')) {
    const allowedVideoTypes = /mp4|webm|mov|avi|mkv|wmv|flv/;
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    if (allowedVideoTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only video files (MP4, WebM, MOV, AVI, MKV) are allowed for videos"));
    }
  } else {
    // General files
    const allowedTypes = /pdf|ppt|pptx|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, PPT, DOC files are allowed"));
    }
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit for videos
});

/* ================= MIDDLEWARE FOR TEACHER VERIFICATION ================= */
const verifyTeacherOwnership = async (req, res, next) => {
  try {
    const userRole = req.headers['user-role'] || req.query.role;
    if (userRole === 'admin') {
      req.isAdmin = true;
      return next();
    }
    
    const { id } = req.params;
    const teacherId = req.headers['x-teacher-id'] || req.query.teacherId || req.body.teacherId;
    
    if (!teacherId) {
      return res.status(401).json({ message: "Teacher ID required for authorization" });
    }
    
    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }
    
    if (content.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        message: "Access denied. You can only access your own content" 
      });
    }
    
    req.content = content;
    req.teacherId = teacherId;
    next();
  } catch (error) {
    console.error("Error in teacher ownership verification:", error);
    res.status(500).json({ message: "Server error during verification" });
  }
};

const verifyUnitOwnership = async (req, res, next) => {
  try {
    const userRole = req.headers['user-role'] || req.query.role;
    if (userRole === 'admin') {
      req.isAdmin = true;
      return next();
    }
    
    const { unitId } = req.params;
    const { teacherId } = req.query;
    
    if (!teacherId) {
      return res.status(401).json({ message: "Teacher ID required" });
    }
    
    const unit = await Unit.findOne({ _id: unitId, teacherId });
    if (!unit) {
      return res.status(403).json({ 
        message: "Access denied. This unit does not belong to you" 
      });
    }
    
    req.unit = unit;
    req.teacherId = teacherId;
    next();
  } catch (error) {
    console.error("Error in unit ownership verification:", error);
    res.status(500).json({ message: "Server error during verification" });
  }
};

/* ================= HELPER FUNCTION TO DELETE FILES ================= */
const deleteFileIfExists = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

/* ================= ADD NEW CONTENT (WITH UNIT ARRAY UPDATE) ================= */
router.post("/add", upload.any(), async (req, res) => {
  try {
    const {
      subjectId,
      unitId,
      teacherId,
      topic,
      items
    } = req.body;

    console.log("Received data:", { subjectId, unitId, teacherId, topic });

    // Validation
    if (!subjectId || !unitId || !topic || !teacherId) {
      // Clean up uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          const filePath = path.join(file.destination || "uploads/content", file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      return res.status(400).json({ 
        message: "Subject, Unit, Topic and Teacher are required" 
      });
    }

    // Parse items if they came as string
    let parsedItems = [];
    if (items) {
      try {
        parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      } catch (e) {
        console.error("Error parsing items:", e);
        parsedItems = [];
      }
    }

    // Validate items
    if (!parsedItems || parsedItems.length === 0) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          const filePath = path.join(file.destination || "uploads/content", file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      return res.status(400).json({ 
        message: "At least one content item is required" 
      });
    }

    // Check if each item has title
    for (let i = 0; i < parsedItems.length; i++) {
      if (!parsedItems[i].title) {
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            const filePath = path.join(file.destination || "uploads/content", file.filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });
        }
        return res.status(400).json({ 
          message: `Item ${i + 1}: Title is required` 
        });
      }
    }

    // Check if unit exists AND belongs to this teacher
    const unit = await Unit.findOne({ _id: unitId, teacherId });
    if (!unit) {
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          const filePath = path.join(file.destination || "uploads/content", file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      return res.status(403).json({ 
        message: "You can only add content to your own units" 
      });
    }

    // Process video files and assign to items
    const videoFilesMap = {};
    if (req.files) {
      req.files.forEach(file => {
        if (file.fieldname && file.fieldname.startsWith('video_')) {
          const itemIndex = parseInt(file.fieldname.split('_')[1]);
          if (!isNaN(itemIndex)) {
            videoFilesMap[itemIndex] = file.filename;
          }
        }
      });
    }

    // Build items with video filenames
    const processedItems = parsedItems.map((item, index) => {
      const processedItem = {
        title: item.title,
        description: item.description || '',
        duration: item.duration || 0
      };
      
      // If there's a video file for this item, add it
      if (videoFilesMap[index]) {
        processedItem.video = videoFilesMap[index];
      } else if (item.video) {
        processedItem.video = item.video;
      }
      
      return processedItem;
    });

    // Process general files
    const files = [];
    if (req.files) {
      req.files.forEach(file => {
        if (!file.fieldname || !file.fieldname.startsWith('video_')) {
          files.push({
            filename: file.filename,
            originalName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size
          });
        }
      });
    }

    const content = new Content({
      subjectId,
      unitId,
      topic,
      items: processedItems,
      files,
      teacherId,
      status: "pending"
    });

    await content.save();
    
    // ✅ FIX: Add content ID to unit's contents array
    if (!unit.contents) unit.contents = [];
    unit.contents.push(content._id);
    await unit.save();
    console.log(`✅ Added content ${content._id} to unit ${unitId} contents array. Total contents now: ${unit.contents.length}`);
    
    await content.populate("subjectId");
    await content.populate("unitId");
    await content.populate("teacherId", "name email");

    res.status(201).json({
      message: "Content added successfully",
      content
    });

  } catch (error) {
    console.error("Error adding content:", error);
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(file.destination || "uploads/content", file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

/* ================= GET ALL CONTENT FOR A UNIT WITH TEACHER FILTER ================= */
router.get("/unit/:unitId", verifyUnitOwnership, async (req, res) => {
  try {
    const { unitId } = req.params;
    const { teacherId } = req.query;
    
    let query = { unitId };
    
    if (teacherId) {
      query.teacherId = teacherId;
    }
    
    const content = await Content.find(query)
      .populate("subjectId")
      .populate("unitId")
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 });

    res.json(content);
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET CONTENT BY TOPIC ================= */
router.get("/topic/:unitId/:topic", verifyUnitOwnership, async (req, res) => {
  try {
    const { unitId, topic } = req.params;
    const { teacherId } = req.query;
    
    let query = { 
      unitId,
      topic 
    };
    
    if (teacherId) {
      query.teacherId = teacherId;
    }
    
    const content = await Content.find(query)
      .populate("subjectId")
      .populate("unitId")
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 });

    res.json(content);
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET SINGLE CONTENT ================= */
router.get("/:id", async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate("subjectId")
      .populate("unitId")
      .populate("teacherId", "name email");
    
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.json(content);
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE CONTENT ================= */
router.put("/:id", upload.any(), verifyTeacherOwnership, async (req, res) => {
  try {
    const {
      topic,
      items,
      removeFiles
    } = req.body;
    
    const content = req.content;
    const originalStatus = content.status;

    // Parse items
    let parsedItems = [];
    if (items) {
      try {
        parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      } catch (e) {
        console.error("Error parsing items:", e);
        parsedItems = content.items;
      }
    } else {
      parsedItems = content.items;
    }

    // Validate items
    if (parsedItems && parsedItems.length > 0) {
      for (let i = 0; i < parsedItems.length; i++) {
        if (!parsedItems[i].title) {
          if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
              const filePath = path.join(file.destination || "uploads/content", file.filename);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            });
          }
          return res.status(400).json({ 
            message: `Item ${i + 1}: Title is required` 
          });
        }
      }
    }

    // Process new video files
    const videoFilesMap = {};
    if (req.files) {
      req.files.forEach(file => {
        if (file.fieldname && file.fieldname.startsWith('video_')) {
          const itemIndex = parseInt(file.fieldname.split('_')[1]);
          if (!isNaN(itemIndex)) {
            videoFilesMap[itemIndex] = file.filename;
          }
        }
      });
    }

    // Build updated items
    const updatedItems = parsedItems.map((item, index) => {
      const updatedItem = {
        _id: item._id,
        title: item.title,
        description: item.description || '',
        duration: item.duration || 0
      };
      
      // Remove old video file if a new one is uploaded
      if (videoFilesMap[index]) {
        const oldVideo = content.items[index]?.video;
        if (oldVideo) {
          const oldVideoPath = path.join("uploads/content/videos", oldVideo);
          deleteFileIfExists(oldVideoPath);
        }
        updatedItem.video = videoFilesMap[index];
      } else if (item.video) {
        updatedItem.video = item.video;
      }
      
      return updatedItem;
    });

    // Handle file removals
    let updatedFiles = [...content.files];
    if (removeFiles) {
      try {
        const filesToRemove = JSON.parse(removeFiles);
        if (Array.isArray(filesToRemove) && filesToRemove.length > 0) {
          filesToRemove.forEach(fileIndex => {
            if (content.files[fileIndex]) {
              const filePath = path.join("uploads/content", content.files[fileIndex].filename);
              deleteFileIfExists(filePath);
            }
          });
          updatedFiles = content.files.filter((_, index) => !filesToRemove.includes(index));
        }
      } catch (e) {
        console.error("Error parsing removeFiles:", e);
      }
    }

    // Add new general files
    if (req.files) {
      req.files.forEach(file => {
        if (!file.fieldname || !file.fieldname.startsWith('video_')) {
          updatedFiles.push({
            filename: file.filename,
            originalName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size
          });
        }
      });
    }

    // Update content
    content.topic = topic || content.topic;
    content.items = updatedItems;
    content.files = updatedFiles;

    await content.save();
    await content.populate("subjectId");
    await content.populate("unitId");
    await content.populate("teacherId", "name email");

    res.json({
      message: "Content updated successfully",
      content,
      originalStatus: originalStatus,
      currentStatus: content.status
    });

  } catch (error) {
    console.error("Error updating content:", error);
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(file.destination || "uploads/content", file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

/* ================= DELETE CONTENT ================= */
router.delete("/:id", verifyTeacherOwnership, async (req, res) => {
  try {
    const content = req.content;

    // Delete all associated files
    if (content.items) {
      content.items.forEach(item => {
        if (item.video) {
          const videoPath = path.join("uploads/content/videos", item.video);
          deleteFileIfExists(videoPath);
        }
      });
    }
    
    if (content.files && content.files.length > 0) {
      content.files.forEach(file => {
        const filePath = path.join("uploads/content", file.filename);
        deleteFileIfExists(filePath);
      });
    }

    await Content.findByIdAndDelete(req.params.id);

    res.json({ message: "Content deleted successfully" });
  } catch (error) {
    console.error("Error deleting content:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE CONTENT STATUS (ADMIN ONLY) ================= */
router.put("/:id/status", async (req, res) => {
  try {
    const { status, adminFeedback } = req.body;
    
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    content.status = status;
    if (adminFeedback) {
      content.adminFeedback = adminFeedback;
    }
    
    await content.save();

    res.json({
      message: `Content ${status}`,
      content
    });

  } catch (error) {
    console.error("Error updating content status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET CONTENT STATS ================= */
router.get("/stats/unit/:unitId", verifyUnitOwnership, async (req, res) => {
  try {
    const { unitId } = req.params;
    const { teacherId } = req.query;
    
    let query = { unitId };
    
    if (teacherId) {
      query.teacherId = teacherId;
    }
    
    const content = await Content.find(query);
    
    const stats = {
      totalContent: content.length,
      pending: content.filter(c => c.status === "pending").length,
      approved: content.filter(c => c.status === "approved").length,
      rejected: content.filter(c => c.status === "rejected").length,
      topics: [...new Set(content.map(c => c.topic))].length,
      totalFiles: content.reduce((acc, c) => acc + (c.files?.length || 0), 0),
      totalItems: content.reduce((acc, c) => acc + (c.items?.length || 0), 0),
      totalDuration: content.reduce((acc, c) => {
        return acc + (c.items?.reduce((itemAcc, item) => {
          return itemAcc + (parseInt(item.duration) || 0);
        }, 0) || 0);
      }, 0)
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching content stats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= DOWNLOAD FILE ================= */
router.get("/download/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Check in videos folder first
    let filePath = path.join("uploads/content/videos", filename);
    if (!fs.existsSync(filePath)) {
      // Check in general content folder
      filePath = path.join("uploads/content", filename);
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET ALL CONTENT BY TEACHER ================= */
router.get("/teacher/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const content = await Content.find({ teacherId })
      .populate('subjectId', 'name code semester')
      .populate('unitId', 'unitNumber unitTitle')
      .sort({ createdAt: -1 });
    res.json(content);
  } catch (error) {
    console.error("Error fetching teacher content:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET CONTENT BY SUBJECT ================= */
router.get("/subject/:subjectId", async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { teacherId } = req.query;
    
    if (!teacherId) {
      return res.status(401).json({ message: "Teacher ID required" });
    }
    
    const content = await Content.find({ 
      subjectId, 
      teacherId 
    })
      .populate('subjectId', 'name code semester')
      .populate('unitId', 'unitNumber unitTitle')
      .sort({ createdAt: -1 });
    
    res.json(content);
  } catch (error) {
    console.error("Error fetching content by subject:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= RE-VERIFY CONTENT ================= */
router.put("/:id/reverify", async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, teacherName } = req.body;
    
    const content = await Content.findById(id);
    
    if (!content) {
      return res.status(404).json({ 
        success: false,
        message: "Content not found" 
      });
    }
    
    if (content.teacherId.toString() !== teacherId) {
      return res.status(403).json({ 
        success: false,
        message: "You can only re-verify your own content" 
      });
    }
    
    const oldStatus = content.status;
    
    content.status = 'pending';
    content.adminFeedback = null;
    content.reVerificationRequested = true;
    content.reVerificationDate = new Date();
    content.reVerificationCount = (content.reVerificationCount || 0) + 1;
    
    await content.save();
    
    res.json({ 
      success: true, 
      message: `Content re-verification requested. Status changed from ${oldStatus} to pending`,
      content: {
        _id: content._id,
        topic: content.topic,
        oldStatus: oldStatus,
        newStatus: content.status,
        reVerificationRequested: content.reVerificationRequested,
        reVerificationDate: content.reVerificationDate,
        reVerificationCount: content.reVerificationCount
      }
    });
    
  } catch (error) {
    console.error("Error in re-verify content:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error: " + error.message 
    });
  }
});

router.get("/all", async (req, res) => {
  try {
    const content = await Content.find().populate('subjectId teacherId');
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;