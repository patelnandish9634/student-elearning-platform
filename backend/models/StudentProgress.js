const mongoose = require("mongoose");

const studentProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  division: {
    type: String,
    required: true,
    default: "A"
  },
  completedItems: {
    type: Map,
    of: Boolean,
    default: new Map()
  },
  videoProgress: {
    type: Map,
    of: {
      progress: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      lastUpdated: { type: Date, default: Date.now }
    },
    default: new Map()
  },
  quizScores: {
    type: Map,
    of: {
      score: Number,
      total: Number,
      percentage: Number,
      submittedAt: Date
    },
    default: new Map()
  },
  assignmentSubmissions: {
    type: Map,
    of: {
      submittedAt: Date,
      fileName: String,
      status: String,
      marks: Number,
      feedback: String
    },
    default: new Map()
  },
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure unique progress per student per subject
studentProgressSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

// Add index for faster queries
studentProgressSchema.index({ studentId: 1 });
studentProgressSchema.index({ subjectId: 1 });
studentProgressSchema.index({ overallProgress: -1 });

module.exports = mongoose.model("StudentProgress", studentProgressSchema);