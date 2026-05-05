const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    department: String,
    course: String,
    batch: String,
    semester: Number,

    name: String,
    enrollmentNumber: String,
    rollNumber: String,
    division: String,

    mobile: String,
    email: String,
    password: String,
    role:String,

    photo: String, // multer filename

     status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active", // ✅ DEFAULT STATUS
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
