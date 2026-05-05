const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    department: String,
    employeeId: String,
    name: String,
    courses: [
      {
        type: String,
        required: true,
      },
    ],
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    designation: String,
    qualification: String,
    experience: Number,
    specialization: String,
    email: String,
    mobile: String,
    password: String,
    role: String,
    photo: String,
    status: {
      type: String,
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);