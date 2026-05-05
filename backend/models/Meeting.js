const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    default: null
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unit",
    default: null
  },
  division: {
    type: String,
    required: true,
    default: ""
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    default: "60"
  },
  meetingLink: {
    type: String,
    required: true
  },
  attendees: {
    type: String,
    default: ""
  },
  classType: {
    type: String,
    enum: ["live", "doubt", "revision", "meeting"],
    default: "live"
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled"
  },
  recordingLink: {
    type: String,
    default: ""
  },
  notes: {
    type: String,
    default: ""
  },
  cancellationReason: {
    type: String,
    default: ""
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
meetingSchema.index({ teacherId: 1, date: 1 });
meetingSchema.index({ subjectId: 1 });
meetingSchema.index({ division: 1, date: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ date: 1, time: 1 });

module.exports = mongoose.model("Meeting", meetingSchema);