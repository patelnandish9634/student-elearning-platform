const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Common fields for all users
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
    },
    
    name: {
      type: String,
      required: true,
      trim: true,
    },
    
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    
    password: {
      type: String,
      required: true,
    },
    
    mobile: {
      type: String,
      required: true,
    },
    
    photo: {
      type: String,
      default: null,
    },
    
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    
    // ======================
    // STUDENT-SPECIFIC FIELDS
    // ======================
    department: {
      type: String,
    },
    
    course: {
      type: String,
    },
    
    batch: {
      type: String,
    },
    
    semester: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    enrollmentNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    
    rollNumber: {
      type: String,
    },
    
    division: {
      type: String,
    },
    
    // ======================
    // TEACHER-SPECIFIC FIELDS
    // ======================
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
    
    designation: {
      type: String,
    },
    
    qualification: {
      type: String,
    },
    
    experience: {
      type: Number,
    },
    
    specialization: {
      type: String,
    },
    
    // Teacher's assigned subjects with division
    subjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true
        },
        division: {
          type: String,
          default: ""
        }
      }
    ],
    
    // Teacher's courses (can be multiple)
    courses: [
      {
        type: String,
      }
    ],
  },
  { 
    timestamps: true 
  }
);

// Create indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ department: 1 });
userSchema.index({ course: 1 });
userSchema.index({ enrollmentNumber: 1 });
userSchema.index({ employeeId: 1 });

// Method to check if user is a student
userSchema.methods.isStudent = function() {
  return this.role === 'student';
};

// Method to check if user is a teacher
userSchema.methods.isTeacher = function() {
  return this.role === 'teacher';
};

// Method to check if user is an admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Virtual for student's full academic info
userSchema.virtual('academicInfo').get(function() {
  if (this.role === 'student') {
    return {
      department: this.department,
      course: this.course,
      batch: this.batch,
      semester: this.semester,
      enrollmentNumber: this.enrollmentNumber,
      rollNumber: this.rollNumber,
      division: this.division
    };
  }
  return null;
});

// Virtual for teacher's professional info
userSchema.virtual('professionalInfo').get(function() {
  if (this.role === 'teacher') {
    return {
      employeeId: this.employeeId,
      designation: this.designation,
      qualification: this.qualification,
      experience: this.experience,
      specialization: this.specialization,
      courses: this.courses,
      subjects: this.subjects
    };
  }
  return null;
});

module.exports = mongoose.model("User", userSchema);