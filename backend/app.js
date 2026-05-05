const express= require("express")
const cors = require("cors")
const bodyparser=require("body-parser")
const authRoutes = require("./routes/auth");
const departmentRoutes = require("./routes/departmentRoutes")
const courseApi = require("./routes/courseApi");
const semesterApi = require("./routes/semesterRouter")
const batchApi = require("./routes/batchapi")
const studentApi = require("./routes/studentApi");
const teacherApi = require("./routes/teacherapi")
const subjectRoutes = require("./routes/subjectroutes")
const unitRoutes = require("./routes/unitRoutes");
const contentRoutes = require("./routes/contentRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const quizRoutes = require("./routes/quizRoutes");
const verificationRoutes = require('./routes/verificationRoutes');
const notificationRoutes = require('./routes/notifications')
const adminNotificationRoutes = require('./routes/adminNotification')
const enrollmentRoutes = require("./routes/enrollmentRoutes")
const compilerRoutes = require("./routes/compilerRoutes")
const progressRoutes = require("./routes/progressRoutes")
const certificateRoutes = require("./routes/certificateRoutes")
const meetingRoutes = require("./routes/meetingRoutes")
const adminRoutes = require("./routes/adminRoutes")
const path = require("path");


const app=express()
const db= require("./db")




app.use(express.json())
app.use(cors())
app.use(bodyparser.json())

app.use("/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/courses", courseApi);
app.use("/api/semesters", semesterApi);
app.use("/api/batches", batchApi);
app.use("/api/students", studentApi);
 app.use("/api/teachers", teacherApi);
 app.use("/api/subjects", subjectRoutes);
 app.use("/api/units", unitRoutes);
 app.use("/api/content", contentRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use('/api', verificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', adminNotificationRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/compiler", compilerRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/certificates", certificateRoutes); 
app.use("/api/meetings", meetingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));



const port =5000||process.env.PORT

app.listen(port,()=>{
console.log(`connected ${port}`)
})

