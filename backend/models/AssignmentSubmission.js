const mongoose = require("mongoose");

const assignmentSubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  fileType: {
    type: String
  },
  status: {
    type: String,
    enum: ["submitted", "graded", "returned"],
    default: "submitted"
  },
  marks: {
    type: Number,
    default: null
  },
  feedback: {
    type: String,
    default: ""
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
assignmentSubmissionSchema.index({ studentId: 1, assignmentId: 1, subjectId: 1 });
assignmentSubmissionSchema.index({ assignmentId: 1, status: 1 });
assignmentSubmissionSchema.index({ studentId: 1, status: 1 });

// Method to grade submission
assignmentSubmissionSchema.methods.grade = function(marks, feedback) {
  this.marks = marks;
  this.feedback = feedback;
  this.status = 'graded';
  this.gradedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);