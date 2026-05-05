const express = require("express");
const router = express.Router();
const Department = require("../models/Department");
const User = require("../models/User");
const Subject = require("../models/Subject");

/* ================= GET ALL DEPARTMENTS (FOR ADMIN TABLE) ================= */
router.get("/department", async (req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });
    
    // Get counts for students and courses
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const deptObj = dept.toObject();
        
        // Count students in this department
        const studentCount = await User.countDocuments({ 
          role: "student", 
          department: dept.name 
        });
        
        // Count courses/subjects in this department
        const courseCount = await Subject.countDocuments({ 
          department: dept.name 
        });
        
        deptObj.students = studentCount;
        deptObj.courses = courseCount;
        
        return deptObj;
      })
    );
    
    res.json(departmentsWithCounts);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Failed to load departments" });
  }
});

/* ================= GET ACTIVE DEPARTMENTS (FOR DROPDOWNS) ================= */
router.get("/active", async (req, res) => {
  try {
    const departments = await Department.find({ status: "active" }).sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    console.error("Error fetching active departments:", error);
    res.status(500).json({ message: "Failed to load departments" });
  }
});

/* ================= ADD DEPARTMENT ================= */
router.post("/add", async (req, res) => {
  try {
    const { code, name, head } = req.body;
    
    if (!code || !name || !head) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Check if department already exists
    const existingDept = await Department.findOne({ 
      $or: [{ code: code.toUpperCase() }, { name: name }] 
    });
    
    if (existingDept) {
      return res.status(409).json({ 
        message: "Department with this code or name already exists" 
      });
    }
    
    const department = new Department({
      code: code.toUpperCase(),
      name: name,
      head: head,
      status: "active"
    });
    
    await department.save();
    res.status(201).json(department);
    
  } catch (error) {
    console.error("Error adding department:", error);
    res.status(500).json({ message: "Failed to add department" });
  }
});

/* ================= UPDATE DEPARTMENT ================= */
router.put("/update/:id", async (req, res) => {
  try {
    const { code, name, head } = req.body;
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    
    // Check for duplicate code (excluding current department)
    if (code && code !== department.code) {
      const existingCode = await Department.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingCode) {
        return res.status(409).json({ message: "Department code already exists" });
      }
      department.code = code.toUpperCase();
    }
    
    // Check for duplicate name (excluding current department)
    if (name && name !== department.name) {
      const existingName = await Department.findOne({ 
        name: name,
        _id: { $ne: req.params.id }
      });
      if (existingName) {
        return res.status(409).json({ message: "Department name already exists" });
      }
      department.name = name;
    }
    
    if (head) department.head = head;
    
    await department.save();
    res.json(department);
    
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({ message: "Failed to update department" });
  }
});

/* ================= DELETE DEPARTMENT ================= */
router.delete("/delete/:id", async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    
    // Check if department has any students
    const studentCount = await User.countDocuments({ 
      role: "student", 
      department: department.name 
    });
    
    // Check if department has any courses
    const courseCount = await Subject.countDocuments({ 
      department: department.name 
    });
    
    if (studentCount > 0 || courseCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete department with ${studentCount} student(s) and ${courseCount} course(s). Please reassign or delete them first.` 
      });
    }
    
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: "Department deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ message: "Failed to delete department" });
  }
});

/* ================= TOGGLE DEPARTMENT STATUS ================= */
router.put("/status/:id", async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    
    department.status = department.status === "active" ? "inactive" : "active";
    await department.save();
    
    res.json(department);
    
  } catch (error) {
    console.error("Error toggling department status:", error);
    res.status(500).json({ message: "Failed to update department status" });
  }
});

module.exports = router;