const mongoose=require("mongoose")

mongoose.connect("mongodb://localhost:27017/studente-learningplatform")

mongoose.connection.on("connected",()=>{
    console.log("connected!!!!!")
})
mongoose.connection.on("error",(error)=>{
    console.log("error",error)
})
module.exports=mongoose