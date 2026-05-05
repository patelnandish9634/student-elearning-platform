import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiAward,
  FiUpload,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiX,
  FiSave,
  FiCopy,
  FiImage,
  FiType,
  FiMove,
  FiRefreshCw
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const token = localStorage.getItem("token");

const axiosConfig = {
  headers: { Authorization: `Bearer ${token}` }
};

const CertificateTemplate = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedElement, setSelectedElement] = useState(null);
  const [livePreview, setLivePreview] = useState(null);

  // Sample preview data
  const previewData = {
    student_name: "John Doe",
    course_name: "Full Stack Web Development",
    completion_date: new Date().toLocaleDateString(),
    certificate_id: "CERT-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
    instructor_name: "Dr. Sarah Johnson",
    grade: "92%"
  };

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    backgroundImage: null,
    backgroundPreview: null,
    logoImage: null,
    logoPreview: null,
    logoX: 50,
    logoY: 50,
    logoWidth: 100,
    isActive: true,
    watermark: "",
    watermarkOpacity: 30,
    textFields: [
      { id: "student_name", label: "Student Name", field: "student_name", x: 300, y: 400, fontSize: 28, color: "#1E3A8A", fontWeight: "bold" },
      { id: "course_name", label: "Course Name", field: "course_name", x: 300, y: 480, fontSize: 24, color: "#F59E0B", fontWeight: "bold" },
      { id: "completion_date", label: "Completion Date", field: "completion_date", x: 300, y: 560, fontSize: 16, color: "#64748B", fontWeight: "normal" },
      { id: "certificate_id", label: "Certificate ID", field: "certificate_id", x: 300, y: 640, fontSize: 12, color: "#94A3B8", fontWeight: "normal" }
    ]
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/certificates/templates`, axiosConfig);
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load certificate templates");
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          backgroundImage: file,
          backgroundPreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          logoImage: file,
          logoPreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateTextField = (index, field, value) => {
    const updated = [...formData.textFields];
    updated[index][field] = value;
    setFormData({ ...formData, textFields: updated });
  };

  const addTextField = () => {
    setFormData({
      ...formData,
      textFields: [
        ...formData.textFields,
        { id: `field_${Date.now()}`, label: "New Field", field: "new_field", x: 300, y: 700, fontSize: 16, color: "#333333", fontWeight: "normal" }
      ]
    });
  };

  const removeTextField = (index) => {
    const updated = formData.textFields.filter((_, i) => i !== index);
    setFormData({ ...formData, textFields: updated });
  };

  const moveElement = (type, index, axis, amount) => {
    if (type === "text") {
      const updated = [...formData.textFields];
      if (axis === "x") updated[index].x += amount;
      if (axis === "y") updated[index].y += amount;
      setFormData({ ...formData, textFields: updated });
    } else if (type === "logo") {
      if (axis === "x") setFormData({ ...formData, logoX: formData.logoX + amount });
      if (axis === "y") setFormData({ ...formData, logoY: formData.logoY + amount });
    }
  };

  const saveTemplate = async () => {
    if (!formData.name) {
      toast.error("Please enter template name");
      return;
    }

    setSaving(true);
    const dataToSend = new FormData();
    dataToSend.append("name", formData.name);
    dataToSend.append("description", formData.description);
    dataToSend.append("isActive", formData.isActive);
    dataToSend.append("watermark", formData.watermark);
    dataToSend.append("watermarkOpacity", formData.watermarkOpacity);
    dataToSend.append("logoX", formData.logoX);
    dataToSend.append("logoY", formData.logoY);
    dataToSend.append("logoWidth", formData.logoWidth);
    dataToSend.append("textFields", JSON.stringify(formData.textFields));
    
    if (formData.backgroundImage && formData.backgroundImage instanceof File) {
      dataToSend.append("backgroundImage", formData.backgroundImage);
    }
    if (formData.logoImage && formData.logoImage instanceof File) {
      dataToSend.append("logoImage", formData.logoImage);
    }

    try {
      if (isEdit && selectedTemplate) {
        await axios.put(
          `${API_BASE_URL}/api/certificates/templates/${selectedTemplate._id}`,
          dataToSend,
          { ...axiosConfig, headers: { ...axiosConfig.headers, "Content-Type": "multipart/form-data" } }
        );
        toast.success("Template updated!");
      } else {
        await axios.post(
          `${API_BASE_URL}/api/certificates/templates`,
          dataToSend,
          { ...axiosConfig, headers: { ...axiosConfig.headers, "Content-Type": "multipart/form-data" } }
        );
        toast.success("Template created!");
      }
      
      resetForm();
      fetchTemplates();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error(error.response?.data?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      backgroundImage: null,
      backgroundPreview: null,
      logoImage: null,
      logoPreview: null,
      logoX: 50,
      logoY: 50,
      logoWidth: 100,
      isActive: true,
      watermark: "",
      watermarkOpacity: 30,
      textFields: [
        { id: "student_name", label: "Student Name", field: "student_name", x: 300, y: 400, fontSize: 28, color: "#1E3A8A", fontWeight: "bold" },
        { id: "course_name", label: "Course Name", field: "course_name", x: 300, y: 480, fontSize: 24, color: "#F59E0B", fontWeight: "bold" },
        { id: "completion_date", label: "Completion Date", field: "completion_date", x: 300, y: 560, fontSize: 16, color: "#64748B", fontWeight: "normal" },
        { id: "certificate_id", label: "Certificate ID", field: "certificate_id", x: 300, y: 640, fontSize: 12, color: "#94A3B8", fontWeight: "normal" }
      ]
    });
    setIsEdit(false);
    setSelectedTemplate(null);
    setSelectedElement(null);
  };

  const editTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      backgroundImage: null,
      backgroundPreview: template.backgroundUrl ? `${API_BASE_URL}${template.backgroundUrl}` : null,
      logoImage: null,
      logoPreview: template.logoUrl ? `${API_BASE_URL}${template.logoUrl}` : null,
      logoX: template.logoX || 50,
      logoY: template.logoY || 50,
      logoWidth: template.logoWidth || 100,
      isActive: template.isActive !== false,
      watermark: template.watermark || "",
      watermarkOpacity: template.watermarkOpacity || 30,
      textFields: template.textFields || formData.textFields
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const deleteTemplate = async (id) => {
    if (window.confirm("Delete this template?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/certificates/templates/${id}`, axiosConfig);
        toast.success("Template deleted");
        fetchTemplates();
      } catch (error) {
        toast.error("Failed to delete");
      }
    }
  };

  const duplicateTemplate = async (template) => {
    try {
      await axios.post(`${API_BASE_URL}/api/certificates/templates/${template._id}/duplicate`, {}, axiosConfig);
      toast.success("Template duplicated");
      fetchTemplates();
    } catch (error) {
      toast.error("Failed to duplicate");
    }
  };

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('data:')) return url;
    return `${API_BASE_URL}${url}`;
  };

  // Live Preview Component
  const LivePreview = () => {
    const bgImage = formData.backgroundPreview;
    const logoImage = formData.logoPreview;
    
    return (
      <div style={{ 
        position: "relative", 
        width: "100%", 
        minHeight: "500px",
        background: bgImage ? `url(${bgImage})` : "#1E293B",
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: "12px",
        overflow: "visible",
        border: "1px solid #E2E8F0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}>
        {/* Logo */}
        {logoImage && (
          <img 
            src={logoImage} 
            alt="Logo" 
            style={{
              position: "absolute",
              left: formData.logoX,
              top: formData.logoY,
              width: formData.logoWidth,
              height: "auto",
              objectFit: "contain",
              zIndex: 10
            }}
          />
        )}
        
        {/* Watermark */}
        {formData.watermark && (
          <div style={{
            position: "absolute",
            bottom: "30%",
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: formData.watermarkOpacity / 100,
            fontSize: "32px",
            color: "#CBD5E1",
            transform: "rotate(-15deg)",
            pointerEvents: "none",
            fontWeight: "bold",
            zIndex: 5
          }}>
            {formData.watermark}
          </div>
        )}
        
        {/* Text Fields */}
        {formData.textFields.map((field, idx) => {
          const previewValue = previewData[field.field] || field.label;
          const isSelected = selectedElement === `text_${idx}`;
          
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: field.x,
                top: field.y,
                fontSize: field.fontSize,
                color: field.color,
                fontWeight: field.fontWeight,
                fontStyle: field.fontWeight === "italic" ? "italic" : "normal",
                fontFamily: "Poppins, sans-serif",
                whiteSpace: "nowrap",
                background: isSelected ? "rgba(37,99,235,0.2)" : "transparent",
                padding: isSelected ? "2px 6px" : "0",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                zIndex: 20,
                textShadow: field.color === "#FFFFFF" ? "1px 1px 0 #000" : "none",
                border: isSelected ? "1px dashed #2563EB" : "none"
              }}
              onClick={() => setSelectedElement(`text_${idx}`)}
            >
              {previewValue}
            </div>
          );
        })}
        
        {/* No background placeholder */}
        {!bgImage && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#94A3B8",
            textAlign: "center",
            zIndex: 1,
            background: "rgba(255,255,255,0.9)",
            padding: "20px",
            borderRadius: "8px"
          }}>
            <FiImage size={48} />
            <p>Upload a background image to see full preview</p>
          </div>
        )}
        
        {/* Helper text for empty text fields */}
        {formData.textFields.length === 0 && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#94A3B8",
            textAlign: "center",
            background: "rgba(255,255,255,0.9)",
            padding: "20px",
            borderRadius: "8px",
            zIndex: 2
          }}>
            <FiType size={32} />
            <p>Add text fields to display on certificate</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <ToastContainer />
      <div style={{ padding: "28px", minHeight: "100vh", background: "#F8FAFC" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0F172A", display: "flex", alignItems: "center", gap: "12px" }}>
              <FiAward size={28} color="#F59E0B" /> Certificate Templates
            </h1>
            <p style={{ fontSize: "14px", color: "#64748B", marginTop: "4px" }}>Design course completion certificates with live preview</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            style={{ background: "#2563EB", color: "white", border: "none", padding: "12px 20px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "500" }}
          >
            <FiPlus /> Create Template
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", maxWidth: "400px", padding: "12px 16px", borderRadius: "12px", border: "1px solid #E2E8F0", background: "white", marginBottom: "24px", outline: "none" }}
        />

        {/* Templates Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>Loading...</div>
        ) : filteredTemplates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", background: "white", borderRadius: "20px" }}>
            <FiAward size={64} color="#CBD5E1" />
            <h3>No Certificate Templates</h3>
            <p>Create your first certificate template</p>
            <button onClick={() => { resetForm(); setShowModal(true); }} style={{ marginTop: "20px", padding: "10px 20px", background: "#2563EB", color: "white", border: "none", borderRadius: "10px", cursor: "pointer" }}>
              <FiPlus /> Create Template
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {filteredTemplates.map((template) => (
              <div key={template._id} style={{ background: "white", borderRadius: "16px", overflow: "hidden", border: "1px solid #E2E8F0" }}>
                <div style={{ height: "160px", background: "#F1F5F9", position: "relative" }}>
                  {template.backgroundUrl ? (
                    <img 
                      src={getImageUrl(template.backgroundUrl)} 
                      alt={template.name} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94A3B8" }}>
                      <FiAward size={48} />
                    </div>
                  )}
                </div>
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>{template.name}</h3>
                      <span style={{ padding: "2px 8px", background: template.isActive ? "#DCFCE7" : "#FEE2E2", color: template.isActive ? "#16A34A" : "#DC2626", borderRadius: "20px", fontSize: "11px" }}>
                        {template.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handlePreview(template)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}><FiEye size={16} /></button>
                      <button onClick={() => editTemplate(template)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB" }}><FiEdit size={16} /></button>
                      <button onClick={() => duplicateTemplate(template)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}><FiCopy size={16} /></button>
                      <button onClick={() => deleteTemplate(template._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444" }}><FiTrash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal with Live Preview */}
        {showModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "white", borderRadius: "20px", width: "95%", maxWidth: "1200px", maxHeight: "90vh", overflow: "auto", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2>{isEdit ? "Edit Template" : "Create Template"}</h2>
                <FiX size={24} onClick={() => setShowModal(false)} style={{ cursor: "pointer" }} />
              </div>

              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                {/* Left Panel - Form Controls */}
                <div style={{ flex: 1, minWidth: "320px", maxHeight: "70vh", overflowY: "auto", paddingRight: "16px" }}>
                  {/* Basic Info */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Template Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Standard Certificate" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0" }} />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" rows="2" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0", resize: "vertical" }} />
                  </div>

                  {/* Background Image */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Background Image</label>
                    <div onClick={() => document.getElementById("bgUpload").click()} style={{ border: "2px dashed #E2E8F0", borderRadius: "12px", padding: "20px", textAlign: "center", cursor: "pointer" }}>
                      {formData.backgroundPreview ? (
                        <img src={formData.backgroundPreview} alt="Background" style={{ maxWidth: "100%", maxHeight: "100px", objectFit: "contain" }} />
                      ) : (
                        <><FiImage size={32} color="#94A3B8" /><p>Click to upload certificate background</p></>
                      )}
                      <input type="file" id="bgUpload" onChange={handleBackgroundUpload} accept="image/*" style={{ display: "none" }} />
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>University Logo</label>
                    <div onClick={() => document.getElementById("logoUpload").click()} style={{ border: "2px dashed #E2E8F0", borderRadius: "12px", padding: "20px", textAlign: "center", cursor: "pointer" }}>
                      {formData.logoPreview ? (
                        <img src={formData.logoPreview} alt="Logo" style={{ maxWidth: "100%", maxHeight: "80px", objectFit: "contain" }} />
                      ) : (
                        <><FiUpload size={32} color="#94A3B8" /><p>Click to upload logo</p></>
                      )}
                      <input type="file" id="logoUpload" onChange={handleLogoUpload} accept="image/*" style={{ display: "none" }} />
                    </div>
                    
                    {formData.logoPreview && (
                      <div style={{ marginTop: "12px", padding: "12px", background: "#F8FAFC", borderRadius: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "12px", fontWeight: "500" }}>Logo Position:</span>
                          <button onClick={() => moveElement("logo", 0, "x", -10)} style={{ padding: "4px 8px", background: "#E2E8F0", border: "none", borderRadius: "4px", cursor: "pointer" }}>←</button>
                          <button onClick={() => moveElement("logo", 0, "x", 10)} style={{ padding: "4px 8px", background: "#E2E8F0", border: "none", borderRadius: "4px", cursor: "pointer" }}>→</button>
                          <button onClick={() => moveElement("logo", 0, "y", -10)} style={{ padding: "4px 8px", background: "#E2E8F0", border: "none", borderRadius: "4px", cursor: "pointer" }}>↑</button>
                          <button onClick={() => moveElement("logo", 0, "y", 10)} style={{ padding: "4px 8px", background: "#E2E8F0", border: "none", borderRadius: "4px", cursor: "pointer" }}>↓</button>
                          <span style={{ fontSize: "12px", color: "#64748B" }}>X: {formData.logoX}, Y: {formData.logoY}</span>
                        </div>
                        <div style={{ marginTop: "8px" }}>
                          <label style={{ fontSize: "12px" }}>Logo Width: {formData.logoWidth}px</label>
                          <input type="range" min="50" max="200" value={formData.logoWidth} onChange={(e) => setFormData({ ...formData, logoWidth: parseInt(e.target.value) })} style={{ width: "100%" }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Watermark */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Watermark Text</label>
                    <input type="text" value={formData.watermark} onChange={(e) => setFormData({ ...formData, watermark: e.target.value })} placeholder="e.g., Verified, Certified" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0" }} />
                    <div style={{ marginTop: "8px" }}>
                      <label style={{ fontSize: "12px" }}>Opacity: {formData.watermarkOpacity}%</label>
                      <input type="range" min="10" max="100" value={formData.watermarkOpacity} onChange={(e) => setFormData({ ...formData, watermarkOpacity: parseInt(e.target.value) })} style={{ width: "100%" }} />
                    </div>
                  </div>

                  {/* Text Fields */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <label style={{ fontSize: "13px", fontWeight: "600" }}>Text Fields</label>
                      <button onClick={addTextField} style={{ background: "#F1F5F9", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}><FiPlus /> Add Field</button>
                    </div>
                    
                    <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                      {formData.textFields.map((field, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            background: selectedElement === `text_${idx}` ? "#EFF6FF" : "#F8FAFC", 
                            padding: "10px", 
                            borderRadius: "10px", 
                            marginBottom: "10px", 
                            border: selectedElement === `text_${idx}` ? "1px solid #2563EB" : "1px solid #E2E8F0",
                            cursor: "pointer"
                          }} 
                          onClick={() => setSelectedElement(`text_${idx}`)}
                        >
                          <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                            <input 
                              type="text" 
                              value={field.label} 
                              onChange={(e) => updateTextField(idx, "label", e.target.value)} 
                              placeholder="Label" 
                              style={{ flex: 2, padding: "6px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "12px" }} 
                            />
                            <input 
                              type="text" 
                              value={field.field} 
                              onChange={(e) => updateTextField(idx, "field", e.target.value)} 
                              placeholder="Field" 
                              style={{ flex: 1, padding: "6px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "12px" }} 
                            />
                            {idx >= 4 && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeTextField(idx); }} 
                                style={{ background: "#FEE2E2", border: "none", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", color: "#EF4444", fontSize: "12px" }}
                              >
                                <FiTrash2 size={12} />
                              </button>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                              <span style={{ fontSize: "10px" }}>X:</span>
                              <input 
                                type="number" 
                                value={field.x} 
                                onChange={(e) => updateTextField(idx, "x", parseInt(e.target.value))} 
                                style={{ width: "50px", padding: "4px", borderRadius: "4px", border: "1px solid #E2E8F0", fontSize: "11px" }} 
                              />
                            </div>
                            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                              <span style={{ fontSize: "10px" }}>Y:</span>
                              <input 
                                type="number" 
                                value={field.y} 
                                onChange={(e) => updateTextField(idx, "y", parseInt(e.target.value))} 
                                style={{ width: "50px", padding: "4px", borderRadius: "4px", border: "1px solid #E2E8F0", fontSize: "11px" }} 
                              />
                            </div>
                            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                              <span style={{ fontSize: "10px" }}>Size:</span>
                              <input 
                                type="number" 
                                value={field.fontSize} 
                                onChange={(e) => updateTextField(idx, "fontSize", parseInt(e.target.value))} 
                                style={{ width: "50px", padding: "4px", borderRadius: "4px", border: "1px solid #E2E8F0", fontSize: "11px" }} 
                              />
                            </div>
                            <input 
                              type="color" 
                              value={field.color} 
                              onChange={(e) => updateTextField(idx, "color", e.target.value)} 
                              style={{ width: "30px", height: "26px", borderRadius: "4px", border: "1px solid #E2E8F0" }} 
                            />
                            <select 
                              value={field.fontWeight} 
                              onChange={(e) => updateTextField(idx, "fontWeight", e.target.value)} 
                              style={{ padding: "4px", borderRadius: "4px", border: "1px solid #E2E8F0", fontSize: "11px" }}
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                              <option value="italic">Italic</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "#F8FAFC", borderRadius: "12px", marginBottom: "20px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "14px" }}>Active Template</h4>
                      <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Active templates can be used for certificates</p>
                    </div>
                    <label style={{ position: "relative", display: "inline-block", width: "50px", height: "24px" }}>
                      <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: formData.isActive ? "#2563EB" : "#CBD5E1", transition: "0.3s", borderRadius: "24px" }}>
                        <span style={{ position: "absolute", height: "20px", width: "20px", left: formData.isActive ? "26px" : "2px", bottom: "2px", backgroundColor: "white", transition: "0.3s", borderRadius: "50%" }}></span>
                      </span>
                    </label>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
                    <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "white", cursor: "pointer" }}>Cancel</button>
                    <button onClick={saveTemplate} disabled={saving} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#2563EB", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                      {saving ? "Saving..." : <><FiSave /> Save</>}
                    </button>
                  </div>
                </div>

                {/* Right Panel - Live Preview */}
                <div style={{ flex: 1, minWidth: "450px" }}>
                  <div style={{ 
                    background: "white", 
                    borderRadius: "12px", 
                    border: "1px solid #E2E8F0",
                    overflow: "hidden",
                    position: "sticky",
                    top: "24px"
                  }}>
                    <div style={{ 
                      background: "#F8FAFC", 
                      padding: "12px 16px", 
                      borderBottom: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <FiEye size={16} color="#2563EB" />
                      <span style={{ fontWeight: "600", fontSize: "14px" }}>Live Preview</span>
                      <span style={{ fontSize: "11px", color: "#64748B", marginLeft: "auto" }}>
                        Click on text to select
                      </span>
                    </div>
                    <div style={{ padding: "20px", minHeight: "550px" }}>
                      <LivePreview />
                    </div>
                    <div style={{ 
                      background: "#F8FAFC", 
                      padding: "8px 12px", 
                      borderTop: "1px solid #E2E8F0",
                      fontSize: "11px",
                      color: "#64748B",
                      textAlign: "center"
                    }}>
                      <FiMove size={12} /> Position text fields by adjusting X/Y coordinates in the left panel
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && selectedTemplate && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
            <div style={{ background: "white", borderRadius: "20px", width: "90%", maxWidth: "800px", maxHeight: "90vh", overflow: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #E2E8F0" }}>
                <h3>Preview: {selectedTemplate.name}</h3>
                <FiX size={20} onClick={() => setShowPreview(false)} style={{ cursor: "pointer" }} />
              </div>
              <div style={{ padding: "20px", textAlign: "center", background: "#F1F5F9" }}>
                {selectedTemplate.backgroundUrl ? (
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <img 
                      src={getImageUrl(selectedTemplate.backgroundUrl)} 
                      alt="Certificate" 
                      style={{ maxWidth: "100%", maxHeight: "500px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "60px" }}>No background uploaded</div>
                )}
              </div>
              <div style={{ padding: "16px 20px", borderTop: "1px solid #E2E8F0", textAlign: "center" }}>
                <button onClick={() => setShowPreview(false)} style={{ padding: "8px 20px", background: "#2563EB", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CertificateTemplate;