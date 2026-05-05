const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unit",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  assignmentFile: {
    filename: String,
    originalName: String,
    fileType: String,
    fileSize: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  deadline: {
    type: Date,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  adminFeedback: {
    type: String,
    default: ""
  },
  // ========== NEW RE-VERIFICATION FIELDS ==========
  reVerificationRequested: {
    type: Boolean,
    default: false
  },
  reVerificationDate: {
    type: Date,
    default: null
  },
  reVerificationCount: {
    type: Number,
    default: 0
  },
  lastUpdatedBy: {
    type: String,
    enum: ["teacher", "admin"],
    default: "teacher"
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ========== INDEXES FOR BETTER QUERY PERFORMANCE ==========
assignmentSchema.index({ teacherId: 1, status: 1 });
assignmentSchema.index({ subjectId: 1, teacherId: 1 });
assignmentSchema.index({ unitId: 1, teacherId: 1 });
assignmentSchema.index({ status: 1, reVerificationRequested: 1 });

// ========== VIRTUAL FIELD: Check if assignment is rejected ==========
assignmentSchema.virtual('isRejected').get(function() {
  return this.status === 'rejected';
});

// ========== VIRTUAL FIELD: Check if assignment is pending ==========
assignmentSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

// ========== VIRTUAL FIELD: Check if assignment is approved ==========
assignmentSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

// ========== VIRTUAL FIELD: Check if deadline has passed ==========
assignmentSchema.virtual('isDeadlinePassed').get(function() {
  return new Date(this.deadline) < new Date();
});

// ========== METHOD: Add re-verification record ==========
assignmentSchema.methods.addReVerification = function() {
  this.reVerificationRequested = true;
  this.reVerificationDate = new Date();
  this.reVerificationCount = (this.reVerificationCount || 0) + 1;
  this.status = 'pending';
  this.adminFeedback = null;
  this.lastUpdatedBy = 'teacher';
  this.lastUpdatedAt = new Date();
  return this.save();
};

// ========== METHOD: Mark as approved ==========
assignmentSchema.methods.markAsApproved = function(feedback) {
  this.status = 'approved';
  if (feedback) this.adminFeedback = feedback;
  this.reVerificationRequested = false;
  this.lastUpdatedBy = 'admin';
  this.lastUpdatedAt = new Date();
  return this.save();
};

// ========== METHOD: Mark as rejected ==========
assignmentSchema.methods.markAsRejected = function(feedback) {
  this.status = 'rejected';
  if (feedback) this.adminFeedback = feedback;
  this.lastUpdatedBy = 'admin';
  this.lastUpdatedAt = new Date();
  return this.save();
};

// ========== PRE-SAVE MIDDLEWARE ==========
assignmentSchema.pre('save', function(next) {
  // Auto-update lastUpdatedAt on any changes
  if (this.isModified()) {
    this.lastUpdatedAt = new Date();
  }
  
});

module.exports = mongoose.model("Assignment", assignmentSchema);