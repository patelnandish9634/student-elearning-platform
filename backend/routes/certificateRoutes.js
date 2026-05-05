const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const CertificateTemplate = require("../models/Certificate");
const auth = require("../middleware/verifytoken");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = "uploads/certificates";
    if (file.fieldname === "backgroundImage") {
      dir = "uploads/certificates/backgrounds";
    } else if (file.fieldname === "logoImage") {
      dir = "uploads/certificates/logos";
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

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET all templates
router.get("/templates", auth, async (req, res) => {
  try {
    const templates = await CertificateTemplate.find().sort({ createdAt: -1 });
    res.json({ success: true, templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ success: false, message: "Failed to fetch templates" });
  }
});

// GET single template
router.get("/templates/:id", auth, async (req, res) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch template" });
  }
});

// POST create template
router.post("/templates", auth, upload.fields([
  { name: "backgroundImage", maxCount: 1 },
  { name: "logoImage", maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      name,
      description,
      isActive,
      watermark,
      watermarkOpacity,
      logoX,
      logoY,
      logoWidth,
      textFields
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Template name is required" });
    }

    let backgroundUrl = null;
    let logoUrl = null;

    if (req.files && req.files.backgroundImage) {
      backgroundUrl = `/uploads/certificates/backgrounds/${req.files.backgroundImage[0].filename}`;
    }

    if (req.files && req.files.logoImage) {
      logoUrl = `/uploads/certificates/logos/${req.files.logoImage[0].filename}`;
    }

    const template = new CertificateTemplate({
      name,
      description: description || "",
      backgroundUrl,
      logoUrl,
      logoX: parseInt(logoX) || 50,
      logoY: parseInt(logoY) || 50,
      logoWidth: parseInt(logoWidth) || 100,
      watermark: watermark || "",
      watermarkOpacity: parseInt(watermarkOpacity) || 30,
      isActive: isActive === "true",
      textFields: textFields ? JSON.parse(textFields) : undefined
    });

    await template.save();
    res.status(201).json({ success: true, message: "Template created successfully", template });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ success: false, message: "Failed to create template" });
  }
});

// PUT update template
router.put("/templates/:id", auth, upload.fields([
  { name: "backgroundImage", maxCount: 1 },
  { name: "logoImage", maxCount: 1 }
]), async (req, res) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    const {
      name,
      description,
      isActive,
      watermark,
      watermarkOpacity,
      logoX,
      logoY,
      logoWidth,
      textFields
    } = req.body;

    if (req.files && req.files.backgroundImage) {
      if (template.backgroundUrl) {
        const oldPath = path.join(__dirname, "..", template.backgroundUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      template.backgroundUrl = `/uploads/certificates/backgrounds/${req.files.backgroundImage[0].filename}`;
    }

    if (req.files && req.files.logoImage) {
      if (template.logoUrl) {
        const oldPath = path.join(__dirname, "..", template.logoUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      template.logoUrl = `/uploads/certificates/logos/${req.files.logoImage[0].filename}`;
    }

    template.name = name || template.name;
    template.description = description || template.description;
    template.logoX = parseInt(logoX) || template.logoX;
    template.logoY = parseInt(logoY) || template.logoY;
    template.logoWidth = parseInt(logoWidth) || template.logoWidth;
    template.watermark = watermark || template.watermark;
    template.watermarkOpacity = parseInt(watermarkOpacity) || template.watermarkOpacity;
    template.isActive = isActive === "true";
    
    if (textFields) {
      template.textFields = JSON.parse(textFields);
    }

    await template.save();
    res.json({ success: true, message: "Template updated successfully", template });
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ success: false, message: "Failed to update template" });
  }
});

// DELETE template
router.delete("/templates/:id", auth, async (req, res) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    if (template.backgroundUrl) {
      const bgPath = path.join(__dirname, "..", template.backgroundUrl);
      if (fs.existsSync(bgPath)) fs.unlinkSync(bgPath);
    }

    if (template.logoUrl) {
      const logoPath = path.join(__dirname, "..", template.logoUrl);
      if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
    }

    await CertificateTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ success: false, message: "Failed to delete template" });
  }
});

// DUPLICATE template
router.post("/templates/:id/duplicate", auth, async (req, res) => {
  try {
    const original = await CertificateTemplate.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    const duplicated = new CertificateTemplate({
      name: `${original.name} (Copy)`,
      description: original.description,
      backgroundUrl: original.backgroundUrl,
      logoUrl: original.logoUrl,
      logoX: original.logoX,
      logoY: original.logoY,
      logoWidth: original.logoWidth,
      watermark: original.watermark,
      watermarkOpacity: original.watermarkOpacity,
      isActive: false,
      textFields: original.textFields
    });

    await duplicated.save();
    res.json({ success: true, message: "Template duplicated successfully", template: duplicated });
  } catch (error) {
    console.error("Error duplicating template:", error);
    res.status(500).json({ success: false, message: "Failed to duplicate template" });
  }
});

module.exports = router;