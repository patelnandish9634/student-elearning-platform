const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  unitNumber: {
    type: Number,
    required: true
  },
  unitTitle: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  // ========== FIELDS FOR PROGRESS TRACKING ==========
  contents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Content",
    default: []
  }],
  assignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    default: []
  }],
  quizzes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    default: []
  }],
  // ========== END OF PROGRESS TRACKING FIELDS ==========
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  adminFeedback: {
    type: String,
    default: ""
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
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

// ✅ FIXED: Ensure unique unit numbers per subject AND per teacher
// This allows different teachers to have same unit number for same subject
unitSchema.index({ subjectId: 1, unitNumber: 1, teacherId: 1 }, { unique: true });

// ========== ADDITIONAL INDEXES FOR BETTER QUERY PERFORMANCE ==========
unitSchema.index({ teacherId: 1, status: 1 });
unitSchema.index({ subjectId: 1, teacherId: 1 });
unitSchema.index({ status: 1, reVerificationRequested: 1 });
unitSchema.index({ teacherId: 1, isActive: 1 });

// ========== VIRTUAL FIELDS ==========
unitSchema.virtual('isRejected').get(function() {
  return this.status === 'rejected';
});

unitSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

unitSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

unitSchema.virtual('isActiveUnit').get(function() {
  return this.isActive === true;
});

// ========== VIRTUAL: Get total items count for progress ==========
unitSchema.virtual('totalItemsCount').get(function() {
  const contentCount = this.contents?.length || 0;
  const assignmentCount = this.assignments?.length || 0;
  const quizCount = this.quizzes?.length || 0;
  return contentCount + assignmentCount + quizCount;
});

// ========== METHODS ==========
// Method: Add re-verification record
unitSchema.methods.addReVerification = function() {
  this.reVerificationRequested = true;
  this.reVerificationDate = new Date();
  this.reVerificationCount = (this.reVerificationCount || 0) + 1;
  this.status = 'pending';
  this.adminFeedback = null;
  this.lastUpdatedBy = 'teacher';
  this.lastUpdatedAt = new Date();
  return this.save();
};

// Method: Mark as approved
unitSchema.methods.markAsApproved = function(feedback) {
  this.status = 'approved';
  if (feedback) this.adminFeedback = feedback;
  this.reVerificationRequested = false;
  this.lastUpdatedBy = 'admin';
  this.lastUpdatedAt = new Date();
  return this.save();
};

// Method: Mark as rejected
unitSchema.methods.markAsRejected = function(feedback) {
  this.status = 'rejected';
  if (feedback) this.adminFeedback = feedback;
  this.lastUpdatedBy = 'admin';
  this.lastUpdatedAt = new Date();
  return this.save();
};

// Method: Toggle active status
unitSchema.methods.toggleActive = function() {
  this.isActive = !this.isActive;
  this.lastUpdatedAt = new Date();
  return this.save();
};

// ========== METHOD: Add content to unit ==========
unitSchema.methods.addContent = function(contentId) {
  if (!this.contents) this.contents = [];
  if (!this.contents.includes(contentId)) {
    this.contents.push(contentId);
    this.lastUpdatedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// ========== METHOD: Add assignment to unit ==========
unitSchema.methods.addAssignment = function(assignmentId) {
  if (!this.assignments) this.assignments = [];
  if (!this.assignments.includes(assignmentId)) {
    this.assignments.push(assignmentId);
    this.lastUpdatedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// ========== METHOD: Add quiz to unit ==========
unitSchema.methods.addQuiz = function(quizId) {
  if (!this.quizzes) this.quizzes = [];
  if (!this.quizzes.includes(quizId)) {
    this.quizzes.push(quizId);
    this.lastUpdatedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// ========== PRE-SAVE MIDDLEWARE - FIXED ==========
// Remove the pre-save middleware entirely if it's causing issues
// Or use this corrected version
unitSchema.pre('save', function(next) {
  // Only update if there are actual changes
  if (this.isModified()) {
    this.lastUpdatedAt = new Date();
  }
  // Always call next to proceed
  if (next && typeof next === 'function') {
    next();
  }
  return;
});

// ========== STATIC METHODS ==========
// Find all units for a teacher that need re-verification
unitSchema.statics.findReVerificationRequests = function(teacherId) {
  return this.find({
    teacherId: teacherId,
    reVerificationRequested: true,
    status: 'pending'
  });
};

// Find all rejected units for a teacher
unitSchema.statics.findRejectedUnits = function(teacherId) {
  return this.find({
    teacherId: teacherId,
    status: 'rejected'
  });
};

module.exports = mongoose.model("Unit", unitSchema);