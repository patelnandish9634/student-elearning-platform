const mongoose = require("mongoose");

const verificationRequestSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  subjectCode: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  teacherEmail: {
    type: String,
    required: true
  },
  // Summary statistics
  summary: {
    totalUnits: { type: Number, default: 0 },
    totalContent: { type: Number, default: 0 },
    totalAssignments: { type: Number, default: 0 },
    totalQuizzes: { type: Number, default: 0 },
    pendingUnits: { type: Number, default: 0 },
    pendingContent: { type: Number, default: 0 },
    pendingAssignments: { type: Number, default: 0 },
    pendingQuizzes: { type: Number, default: 0 }
  },
  // Store IDs of items being verified
  items: {
    units: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit"
    }],
    content: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content"
    }],
    assignments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment"
    }],
    quizzes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz"
    }]
  },
  status: {
    type: String,
    enum: ["pending_review", "under_review", "approved", "rejected", "changes_requested"],
    default: "pending_review"
  },
  adminFeedback: {
    type: String,
    default: ""
  },
  adminComments: [{
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    adminName: String
  }],
  reviewedBy: {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    adminName: String,
    reviewedAt: Date
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Add index for faster queries
verificationRequestSchema.index({ subjectId: 1, status: 1 });
verificationRequestSchema.index({ teacherId: 1, status: 1 });
verificationRequestSchema.index({ requestedAt: -1 });

module.exports = mongoose.model("VerificationRequest", verificationRequestSchema);