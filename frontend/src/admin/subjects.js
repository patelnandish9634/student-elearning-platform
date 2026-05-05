import React, { useState, useEffect } from "react";
import { FiPlus, FiBookOpen, FiEdit, FiTrash2, FiX } from "react-icons/fi";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Subjects = () => {

const [subjects,setSubjects] = useState([]);
const [departments,setDepartments] = useState([]);
const [courses,setCourses] = useState([]);
const [semesters,setSemesters] = useState([]);

const [showModal,setShowModal] = useState(false);

/* NEW STATES */

const [isEdit,setIsEdit] = useState(false);
const [editId,setEditId] = useState(null);
const [deleteId,setDeleteId] = useState(null);

const [formData,setFormData] = useState({
code:"",
name:"",
department:"",
course:"",
semester:"",
});

useEffect(()=>{
loadSubjects();
loadDepartments();
},[]);

const loadSubjects = async ()=>{
const res = await axios.get("http://localhost:5000/api/subjects");
setSubjects(res.data);
};

const loadDepartments = async ()=>{
const res = await axios.get("http://localhost:5000/api/departments/active");
setDepartments(res.data);
};

const handleDepartmentChange = async (e)=>{
const department = e.target.value;

setFormData({
...formData,
department,
course:"",
semester:"",
});

const res = await axios.get(
`http://localhost:5000/api/courses/by-department/${department}`
);

setCourses(res.data);
};

const handleCourseChange = async (e)=>{
const course = e.target.value;

setFormData({
...formData,
course,
semester:"",
});

const res = await axios.get(
`http://localhost:5000/api/semesters/by-course/${formData.department}/${course}`
);

setSemesters(res.data);
};

const handleChange = (e)=>{
setFormData({
...formData,
[e.target.name]:e.target.value,
});
};

/* ADD SUBJECT */

const addSubject = async () => {

if(!formData.code || !formData.name || !formData.department || !formData.course || !formData.semester){
toast.error("All fields are required")
return
}

const duplicate = subjects.find(
s =>
s.code.toLowerCase() === formData.code.toLowerCase() ||
s.name.toLowerCase() === formData.name.toLowerCase()
)

if(duplicate){
toast.error("Subject Code or Subject Name already exists")
return
}

await axios.post("http://localhost:5000/api/subjects/add",formData)

toast.success("Subject added successfully")

setShowModal(false)

setFormData({
code:"",
name:"",
department:"",
course:"",
semester:"",
})

loadSubjects()
}

/* EDIT SUBJECT */

const openEdit = (subject)=>{

setIsEdit(true)
setEditId(subject._id)
setShowModal(true)

setFormData({
code:subject.code,
name:subject.name,
department:subject.department,
course:subject.course,
semester:subject.semester
})

}

/* UPDATE SUBJECT */

const updateSubject = async ()=>{

await axios.put(`http://localhost:5000/api/subjects/${editId}`,formData)

toast.success("Subject updated successfully")

setShowModal(false)
setIsEdit(false)

setFormData({
code:"",
name:"",
department:"",
course:"",
semester:"",
})

loadSubjects()

}

/* DELETE SUBJECT */

const confirmDelete = (id)=>{
setDeleteId(id)
}

const deleteSubject = async ()=>{

await axios.delete(`http://localhost:5000/api/subjects/${deleteId}`)

toast.success("Subject deleted successfully")

setDeleteId(null)

loadSubjects()

}

/* TOGGLE STATUS */

const toggleStatus = async (id) => {

try{

const res = await axios.put(`http://localhost:5000/api/subjects/toggle-status/${id}`)

loadSubjects()

if(res.data.status === "active"){
toast.success("Subject activated")
}else{
toast.error("Subject deactivated")
}

}catch(err){

toast.error("Something went wrong")

}

}

return (

<div style={{padding:"30px"}}>

{/* HEADER */}

<div style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"30px"
}}>

<div>
<h2 style={{margin:0}}>Subjects</h2>
<p style={{margin:0,color:"#64748b"}}>
Manage course subjects
</p>
</div>

<button
onClick={()=>{
setShowModal(true)
setIsEdit(false)
}}
style={{
display:"flex",
alignItems:"center",
gap:"6px",
padding:"10px 16px",
borderRadius:"10px",
border:"none",
background:"#2563eb",
color:"#fff",
cursor:"pointer",
boxShadow:"0 8px 18px rgba(37,99,235,0.25)"
}}
>
<FiPlus/> Add Subject
</button>

</div>


{/* SUBJECT CARDS */}

<div
style={{
display:"grid",

gridTemplateColumns:"repeat(auto-fill, 460px)",
gap:"24px"
}}
>

{subjects.map(subject=>(

<div key={subject._id}
style={{
background:"#fff",
borderRadius:"14px",
padding:"22px",
border:"1px solid #e2e8f0",
boxShadow:"0 10px 20px rgba(0,0,0,0.05)"
}}
>

{/* TOP */}

<div style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"14px"
}}>

<div style={{display:"flex",gap:"12px",alignItems:"center"}}>

<div style={{
background:"#eef2ff",
padding:"10px",
borderRadius:"10px"
}}>
<FiBookOpen size={18} color="#4f46e5"/>
</div>

<div>
<h4 style={{margin:0}}>{subject.name}</h4>
<p style={{margin:0,fontSize:"13px",color:"#64748b"}}>
{subject.department}
</p>
</div>

</div>

<span
onClick={()=>toggleStatus(subject._id)}
style={{
background: subject.status === "active" ? "#dcfce7" : "#fee2e2",
color: subject.status === "active" ? "#16a34a" : "#dc2626",
fontSize:"12px",
padding:"5px 12px",
borderRadius:"20px",
fontWeight:"600",
cursor:"pointer"
}}
>
{subject.status}
</span>

</div>


{/* DETAILS */}

<div style={{fontSize:"14px",color:"#64748b"}}>

<p>
<b>Course:</b>
<span style={{float:"right",color:"black"}}>
{subject.course}
</span>
</p>

<p>
<b>Semester:</b>
<span style={{float:"right",color:"black"}}>
Semester {subject.semester}
</span>
</p>

<p>
<b>Subject Code:</b>
<span style={{float:"right",color:"black"}}>
{subject.code}
</span>
</p>

</div>

<hr style={{
border:"none",
borderTop:"1px solid #e2e8f0",
margin:"14px 0"
}}/>

{/* ACTIONS */}

<div style={{
display:"flex",
justifyContent:"space-between",
fontSize:"14px",
fontWeight:"500"
}}>

<span
onClick={()=>openEdit(subject)}
style={{
color:"#2563eb",
cursor:"pointer",
display:"flex",
alignItems:"center",
gap:"6px"
}}>
<FiEdit/> Edit
</span>

<span
onClick={()=>confirmDelete(subject._id)}
style={{
color:"#ef4444",
cursor:"pointer",
display:"flex",
alignItems:"center",
gap:"6px"
}}>
<FiTrash2/> Delete
</span>

</div>

</div>

))}

</div>


{/* DELETE CONFIRMATION */}

{deleteId && (

<div style={{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
background:"rgba(0,0,0,0.45)",
display:"flex",
alignItems:"center",
justifyContent:"center",
zIndex:2000
}}>

<div style={{
background:"#fff",
padding:"24px",
borderRadius:"12px",
width:"340px",
textAlign:"center",
boxShadow:"0 20px 50px rgba(0,0,0,0.25)"
}}>

<h4>This action will permanently delete the subject.</h4>

<div style={{marginTop:"20px",display:"flex",justifyContent:"center",gap:"10px"}}>

<button
onClick={deleteSubject}
style={{
background:"#ef4444",
color:"#fff",
border:"none",
padding:"8px 18px",
borderRadius:"6px",
cursor:"pointer"
}}>
Delete
</button>

<button
onClick={()=>setDeleteId(null)}
style={{
background:"#e5e7eb",
border:"none",
padding:"8px 18px",
borderRadius:"6px",
cursor:"pointer"
}}>
Cancel
</button>

</div>

</div>

</div>

)}


{/* ADD / EDIT MODAL */}

{showModal && (

<div style={{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
background:"rgba(0,0,0,0.35)",
display:"flex",
alignItems:"center",
justifyContent:"center",
zIndex:1000
}}>

<div style={{
width:"520px",
background:"#fff",
borderRadius:"18px",
padding:"28px",
boxShadow:"0 25px 60px rgba(0,0,0,0.25)"
}}>

<div style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"10px"
}}>

<h3 style={{margin:0}}>
{isEdit ? "Edit Subject" : "Add New Subject"}
</h3>

<FiX
onClick={()=>setShowModal(false)}
style={{cursor:"pointer",fontSize:"18px"}}
/>

</div>

<hr style={{border:"none",borderTop:"1px solid #e5e7eb",marginBottom:"20px"}}/>

<label style={{fontSize:"14px",color:"#64748b"}}>Subject Code</label>

<input
name="code"
value={formData.code}
placeholder="Enter subject code (e.g. BCA301)"
onChange={handleChange}
style={{
width:"100%",
padding:"12px",
marginTop:"6px",
marginBottom:"14px",
border:"1px solid #d1d5db",
borderRadius:"10px"
}}
/>

<label style={{fontSize:"14px",color:"#64748b"}}>Subject Name</label>

<input
name="name"
value={formData.name}
placeholder="Enter subject name (e.g. Data Structures)"
onChange={handleChange}
style={{
width:"100%",
padding:"12px",
marginTop:"6px",
marginBottom:"14px",
border:"1px solid #d1d5db",
borderRadius:"10px"
}}
/>

<label style={{fontSize:"14px",color:"#64748b"}}>Department</label>

<select
value={formData.department}
onChange={handleDepartmentChange}
style={{
width:"100%",
padding:"12px",
marginTop:"6px",
marginBottom:"14px",
border:"1px solid #d1d5db",
borderRadius:"10px"
}}
>

<option value="">Select Department</option>

{departments.map(dep=>(
<option key={dep._id} value={dep.name}>
{dep.name}
</option>
))}

</select>

<label style={{fontSize:"14px",color:"#64748b"}}>Course</label>

<select
value={formData.course}
onChange={handleCourseChange}
style={{
width:"100%",
padding:"12px",
marginTop:"6px",
marginBottom:"14px",
border:"1px solid #d1d5db",
borderRadius:"10px"
}}
>

<option value="">Select Course</option>

{courses.map(course=>(
<option key={course._id} value={course.name}>
{course.name}
</option>
))}

</select>

<label style={{fontSize:"14px",color:"#64748b"}}>Semester</label>

<select
name="semester"
value={formData.semester}
onChange={handleChange}
style={{
width:"100%",
padding:"12px",
marginTop:"6px",
marginBottom:"24px",
border:"1px solid #d1d5db",
borderRadius:"10px"
}}
>

<option value="">Select Semester</option>

{semesters.map(sem=>(
<option key={sem._id} value={sem.semesterNumber}>
{sem.semesterName}
</option>
))}

</select>

<hr style={{border:"none",borderTop:"1px solid #e5e7eb",marginBottom:"18px"}}/>

<div style={{
display:"flex",
justifyContent:"flex-end",
gap:"12px"
}}>

<button
onClick={()=>{
setShowModal(false)

setFormData({
code:"",
name:"",
department:"",
course:"",
semester:"",
})

}}
style={{
padding:"10px 20px",
borderRadius:"10px",
border:"1px solid #e5e7eb",
background:"#fff",
cursor:"pointer"
}}>
Cancel
</button>

<button
onClick={isEdit ? updateSubject : addSubject}
style={{
padding:"10px 20px",
borderRadius:"10px",
border:"none",
background:"#2563eb",
color:"#fff",
cursor:"pointer",
boxShadow:"0 8px 18px rgba(37,99,235,0.25)"
}}>
{isEdit ? "Update Subject" : "Add Subject"}
</button>

</div>

</div>

</div>

)}

<ToastContainer position="top-right" autoClose={2000} />

</div>

);
};

export default Subjects;