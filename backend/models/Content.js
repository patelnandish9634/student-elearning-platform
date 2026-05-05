const mongoose = require("mongoose");

const contentItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  video: {
    type: String,
    default: ""
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  description: {
    type: String,
    default: ""
  }
}, { _id: true });

const contentSchema = new mongoose.Schema({
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
  topic: {
    type: String,
    required: true
  },
  items: [contentItemSchema],
  files: [{
    filename: String,
    originalName: String,
    fileType: String,
    fileSize: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
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
contentSchema.index({ teacherId: 1, status: 1 });
contentSchema.index({ subjectId: 1, teacherId: 1 });
contentSchema.index({ unitId: 1, teacherId: 1 });
contentSchema.index({ status: 1, reVerificationRequested: 1 });
contentSchema.index({ teacherId: 1, createdAt: -1 });
contentSchema.index({ topic: 1, teacherId: 1 });

// ========== VIRTUAL FIELDS ==========
contentSchema.virtual('isRejected').get(function() {
  return this.status === 'rejected';
});

contentSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

contentSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

contentSchema.virtual('hasReVerificationRequest').get(function() {
  return this.reVerificationRequested === true;
});

contentSchema.virtual('itemCount').get(function() {
  return this.items?.length || 0;
});

contentSchema.virtual('filesCount').get(function() {
  return this.files?.length || 0;
});

contentSchema.virtual('totalDuration').get(function() {
  return this.items?.reduce((sum, item) => sum + (item.duration || 0), 0) || 0;
});

// ========== METHODS ==========
// Method: Add re-verification record
contentSchema.methods.addReVerification = function() {
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
contentSchema.methods.markAsApproved = function(feedback) {
  this.status = 'approved';
  if (feedback) this.adminFeedback = feedback;
  this.reVerificationRequested = false;
  this.lastUpdatedBy = 'admin';
  this.lastUpdatedAt = new Date();
  return this.save();
};

// Method: Mark as rejected
contentSchema.methods.markAsRejected = function(feedback) {
  this.status = 'rejected';
  if (feedback) this.adminFeedback = feedback;
  this.lastUpdatedBy = 'admin';
  this.lastUpdatedAt = new Date();
  return this.save();
};

// Method: Add a new content item
contentSchema.methods.addContentItem = function(itemData) {
  if (!this.items) this.items = [];
  this.items.push(itemData);
  this.lastUpdatedAt = new Date();
  return this.save();
};

// Method: Remove a content item by index
contentSchema.methods.removeContentItem = function(index) {
  if (this.items && this.items[index]) {
    this.items.splice(index, 1);
    this.lastUpdatedAt = new Date();
  }
  return this.save();
};

// Method: Update a content item by index
contentSchema.methods.updateContentItem = function(index, itemData) {
  if (this.items && this.items[index]) {
    this.items[index] = { ...this.items[index], ...itemData };
    this.lastUpdatedAt = new Date();
  }
  return this.save();
};

// Method: Add files to content
contentSchema.methods.addFiles = function(newFiles) {
  if (!this.files) this.files = [];
  this.files.push(...newFiles);
  this.lastUpdatedAt = new Date();
  return this.save();
};

// Method: Remove files by indices
contentSchema.methods.removeFiles = function(indices) {
  if (this.files && indices.length > 0) {
    this.files = this.files.filter((_, index) => !indices.includes(index));
    this.lastUpdatedAt = new Date();
  }
  return this.save();
};

// ========== STATIC METHODS ==========
// Find all content for a teacher that need re-verification
contentSchema.statics.findReVerificationRequests = function(teacherId) {
  return this.find({
    teacherId: teacherId,
    reVerificationRequested: true,
    status: 'pending'
  });
};

// Find all rejected content for a teacher
contentSchema.statics.findRejectedContent = function(teacherId) {
  return this.find({
    teacherId: teacherId,
    status: 'rejected'
  });
};

// Find all content for a teacher with pending status
contentSchema.statics.findPendingContent = function(teacherId) {
  return this.find({
    teacherId: teacherId,
    status: 'pending'
  });
};

// Get content statistics for a teacher
contentSchema.statics.getStatsForTeacher = async function(teacherId) {
  const content = await this.find({ teacherId });
  return {
    totalTopics: content.length,
    pending: content.filter(c => c.status === 'pending').length,
    approved: content.filter(c => c.status === 'approved').length,
    rejected: content.filter(c => c.status === 'rejected').length,
    reVerificationRequests: content.filter(c => c.reVerificationRequested === true).length,
    totalItems: content.reduce((acc, c) => acc + (c.items?.length || 0), 0),
    totalFiles: content.reduce((acc, c) => acc + (c.files?.length || 0), 0),
    totalDuration: content.reduce((acc, c) => acc + c.totalDuration, 0)
  };
};

// Find all content by topic for a teacher
contentSchema.statics.findByTopic = function(teacherId, topic) {
  return this.find({
    teacherId: teacherId,
    topic: { $regex: topic, $options: 'i' }
  });
};

// ========== PRE-SAVE MIDDLEWARE (FIXED) ==========
// Remove the next parameter - it's not needed
contentSchema.pre('save', function() {
  // Auto-update lastUpdatedAt on any changes
  if (this.isModified()) {
    this.lastUpdatedAt = new Date();
  }
});

// ========== POST-SAVE MIDDLEWARE ==========
contentSchema.post('save', function(doc) {
  console.log(`Content ${doc._id} saved. Topic: ${doc.topic}, Status: ${doc.status}, Re-verification: ${doc.reVerificationRequested}`);
});

// ========== POST-REMOVE MIDDLEWARE ==========
contentSchema.post('remove', function(doc) {
  console.log(`Content ${doc._id} removed. Topic: ${doc.topic}`);
});

module.exports = mongoose.model("Content", contentSchema);