const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
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
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  studentName: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  completionDate: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["issued", "revoked"],
    default: "issued"
  }
}, {
  timestamps: true
});

certificateSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model("Certificate", certificateSchema);