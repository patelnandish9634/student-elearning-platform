const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
{
code: {
type: String,
required: true,
},

name: {
type: String,
required: true,
},

department: {
type: String,
required: true,
},

course: {
type: String,
required: true,
},

semester: {
type: Number,
required: true,
},

status: {
type: String,
default: "active",
},
},
{ timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);