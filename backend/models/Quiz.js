const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number, // index of correct option (0-based)
    required: true
  },
  marks: {
    type: Number,
    required: true,
    default: 1
  }
}, { _id: true });

const quizSchema = new mongoose.Schema({
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
  questions: [questionSchema],
  totalMarks: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in minutes
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
quizSchema.index({ teacherId: 1, status: 1 });
quizSchema.index({ subjectId: 1, teacherId: 1 });
quizSchema.index({ unitId: 1, teacherId: 1 });
quizSchema.index({ status: 1, reVerificationRequested: 1 });
quizSchema.index({ teacherId: 1, createdAt: -1 });

// ========== VIRTUAL FIELDS ==========
quizSchema.virtual('isRejected').get(function() {
  return this.status === 'rejected';
});

quizSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

quizSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

quizSchema.virtual('hasReVerificationRequest').get(function() {
  return this.reVerificationRequested === true;
});

quizSchema.virtual('questionCount').get(function() {
  return this.questions?.length || 0;
});

// ========== METHODS ==========
// Method: Add re-verification record
quizSchema.methods.addReVerification = function() {
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
quizSchema.methods.markAsApproved = function(feedback) {
  this.status = 'approved';
  if (feedback) this.adminFeedback = feedback;
  this.reVerificationRequested = false;
  this.lastUpdatedBy = 'admin';
  this.lastUpdatedAt = new Date();
  return this.save();
};

// Method: Mark as rejected
quizSchema.methods.markAsRejected = function(feedback) {
  this.status = 'rejected';
  if (feedback) this.adminFeedback = feedback;
  this.lastUpdatedBy = 'admin';
  this.lastUpdatedAt = new Date();
  return this.save();
};

// Method: Recalculate total marks based on questions
quizSchema.methods.recalculateTotalMarks = function() {
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  }
  return this.save();
};

// Method: Add a new question
quizSchema.methods.addQuestion = function(questionData) {
  if (!this.questions) this.questions = [];
  this.questions.push(questionData);
  this.recalculateTotalMarks();
  this.lastUpdatedAt = new Date();
  return this.save();
};

// Method: Remove a question by index
quizSchema.methods.removeQuestion = function(index) {
  if (this.questions && this.questions[index]) {
    this.questions.splice(index, 1);
    this.recalculateTotalMarks();
    this.lastUpdatedAt = new Date();
  }
  return this.save();
};

// Method: Update a question by index
quizSchema.methods.updateQuestion = function(index, questionData) {
  if (this.questions && this.questions[index]) {
    this.questions[index] = { ...this.questions[index], ...questionData };
    this.recalculateTotalMarks();
    this.lastUpdatedAt = new Date();
  }
  return this.save();
};

// ========== STATIC METHODS ==========
// Find all quizzes for a teacher that need re-verification
quizSchema.statics.findReVerificationRequests = function(teacherId) {
  return this.find({
    teacherId: teacherId,
    reVerificationRequested: true,
    status: 'pending'
  });
};

// Find all rejected quizzes for a teacher
quizSchema.statics.findRejectedQuizzes = function(teacherId) {
  return this.find({
    teacherId: teacherId,
    status: 'rejected'
  });
};

// Find all quizzes for a teacher with pending status
quizSchema.statics.findPendingQuizzes = function(teacherId) {
  return this.find({
    teacherId: teacherId,
    status: 'pending'
  });
};

// Get quiz statistics for a teacher
quizSchema.statics.getStatsForTeacher = async function(teacherId) {
  const quizzes = await this.find({ teacherId });
  return {
    totalQuizzes: quizzes.length,
    pending: quizzes.filter(q => q.status === 'pending').length,
    approved: quizzes.filter(q => q.status === 'approved').length,
    rejected: quizzes.filter(q => q.status === 'rejected').length,
    reVerificationRequests: quizzes.filter(q => q.reVerificationRequested === true).length,
    totalQuestions: quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0),
    totalMarks: quizzes.reduce((acc, q) => acc + (q.totalMarks || 0), 0)
  };
};

// ========== PRE-SAVE MIDDLEWARE ==========
// Fix the pre-save middleware
quizSchema.pre('save', function() {
  if (this.isModified()) {
    this.lastUpdatedAt = new Date();
  }
  
  // Recalculate total marks if questions changed and status is not rejected
  if (this.isModified('questions') && this.status !== 'rejected') {
    if (this.questions && this.questions.length > 0) {
      this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    }
  }
});

// ========== POST-SAVE MIDDLEWARE ==========
quizSchema.post('save', function(doc) {
  console.log(`Quiz ${doc._id} saved. Status: ${doc.status}, Re-verification: ${doc.reVerificationRequested}`);
});

// No pre-save middleware for totalMarks - we'll calculate in the route (keeping original behavior)

module.exports = mongoose.model("Quiz", quizSchema);