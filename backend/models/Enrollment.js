// models/Enrollment.js
const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
    index: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  division: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["active", "dropped", "completed", "pending"],
    default: "active"
  },
  enrollmentNumber: {
    type: String,
    unique: true
  },
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  grade: {
    type: String,
    default: null
  },
  marks: {
    type: Number,
    default: null
  },
  attendance: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date,
    default: null
  },
  droppedAt: {
    type: Date,
    default: null
  },
  dropReason: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate enrollments
enrollmentSchema.index({ studentId: 1, subjectId: 1, division: 1 }, { unique: true });

// FIXED: Generate enrollment number before saving
enrollmentSchema.pre('save', async function() {
  // Use function() instead of arrow function to have access to 'this'
  if (!this.enrollmentNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Enrollment').countDocuments();
    this.enrollmentNumber = `ENR-${year}-${(count + 1).toString().padStart(6, '0')}`;
  }
});

// Virtual field to check if enrollment is active
enrollmentSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Virtual field to check if enrollment is completed
enrollmentSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Method to mark enrollment as completed
enrollmentSchema.methods.markAsCompleted = function(grade, marks) {
  this.status = 'completed';
  this.grade = grade;
  this.marks = marks;
  this.completedAt = new Date();
  return this.save();
};

// Method to drop enrollment
enrollmentSchema.methods.drop = function(reason) {
  this.status = 'dropped';
  this.dropReason = reason;
  this.droppedAt = new Date();
  return this.save();
};

// Static method to get enrollment statistics for a student
enrollmentSchema.statics.getStudentStats = async function(studentId) {
  const enrollments = await this.find({ studentId });
  return {
    totalEnrollments: enrollments.length,
    active: enrollments.filter(e => e.status === 'active').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    dropped: enrollments.filter(e => e.status === 'dropped').length
  };
};

// Static method to check if student is enrolled
enrollmentSchema.statics.isEnrolled = async function(studentId, subjectId, division) {
  const enrollment = await this.findOne({ 
    studentId, 
    subjectId,
    division,
    status: 'active' 
  });
  return !!enrollment;
};

module.exports = mongoose.model("Enrollment", enrollmentSchema);