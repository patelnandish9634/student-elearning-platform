const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: true,
    },
    course: {
      type: String,
      required: true,
    },
    batchName: {          // ✅ CHANGED
      type: String,
      required: true,
     
    },
    startYear: {
      type: Number,
      required: true,
    },
    endYear: {
      type: Number,
      required: true,
    },
     status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);
batchSchema.index(
  { department: 1, course: 1, batchName: 1 },
  { unique: true }
);
module.exports = mongoose.model("Batch", batchSchema);
