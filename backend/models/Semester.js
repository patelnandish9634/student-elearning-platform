const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
      trim: true,
    },

    course: {
      type: String,
      required: true,
      trim: true,
    },

    semesterNumber: {
      type: Number,
      required: true,
    },

    semesterName: {
      type: String,
      required: true,
      trim: true,
    },

   
  },
  { timestamps: true }
);

// Prevent duplicate semester for same course
semesterSchema.index(
  { department: 1, course: 1, semesterNumber: 1  },
  { unique: true }
);

module.exports = mongoose.model("Semester", semesterSchema);
