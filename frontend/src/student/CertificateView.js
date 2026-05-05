import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiDownload, FiAward, FiCalendar, FiUser, FiBookOpen, FiCheckCircle } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const token = localStorage.getItem("token");

const axiosConfig = {
  headers: { Authorization: `Bearer ${token}` }
};

const CertificateView = ({ student }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/certificates/student/${student.id}`, axiosConfig);
      setCertificates(response.data.certificates || []);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificate) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/certificates/download/${certificate.certificateId}`,
        { ...axiosConfig, responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate_${certificate.certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error("Failed to download certificate");
    }
  };

  const viewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
  };

  const closeModal = () => {
    setSelectedCertificate(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #E2E8F0", borderTopColor: "#667eea", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }}></div>
        <p>Loading certificates...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div style={{ padding: "28px", minHeight: "100vh", background: "#F8FAFC" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <FiAward size={28} color="#F59E0B" /> My Certificates
          </h1>
          <p style={{ color: "#64748B" }}>Your earned course completion certificates</p>
        </div>

        {certificates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", background: "white", borderRadius: "20px" }}>
            <FiAward size={64} color="#CBD5E1" />
            <h3>No Certificates Yet</h3>
            <p>Complete courses to earn certificates</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
            {certificates.map((cert) => (
              <div key={cert._id} style={{ background: "white", borderRadius: "16px", overflow: "hidden", border: "1px solid #E2E8F0", transition: "transform 0.2s ease", cursor: "pointer" }} onClick={() => viewCertificate(cert)}>
                <div style={{ 
                  height: "180px", 
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }}>
                  <FiAward size={64} color="white" style={{ opacity: 0.8 }} />
                  <div style={{ 
                    position: "absolute", 
                    bottom: "12px", 
                    right: "12px", 
                    background: "rgba(255,255,255,0.2)", 
                    padding: "4px 8px", 
                    borderRadius: "20px", 
                    fontSize: "11px", 
                    color: "white" 
                  }}>
                    {cert.status}
                  </div>
                </div>
                <div style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>{cert.courseName}</h3>
                  <div style={{ display: "flex", gap: "16px", marginBottom: "8px", fontSize: "13px", color: "#64748B" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><FiCalendar size={12} /> {formatDate(cert.issueDate)}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><FiBookOpen size={12} /> Certificate ID: {cert.certificateId}</span>
                  </div>
                  <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadCertificate(cert); }} 
                      style={{ flex: 1, padding: "8px 16px", background: "#10B981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", fontWeight: "500" }}
                    >
                      <FiDownload size={14} /> Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Preview Modal */}
      {selectedCertificate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }} onClick={closeModal}>
          <div style={{ background: "white", borderRadius: "20px", maxWidth: "800px", width: "100%", maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Certificate of Completion</h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: "30px", textAlign: "center" }}>
              {/* Certificate Design */}
              <div style={{ 
                border: "10px double #667eea", 
                padding: "40px", 
                background: "white",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                position: "relative"
              }}>
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                  <FiAward size={60} color="#F59E0B" />
                  <h1 style={{ fontSize: "32px", color: "#667eea", margin: "10px 0" }}>CERTIFICATE OF COMPLETION</h1>
                  <p style={{ fontSize: "16px", color: "#64748B" }}>This certificate is proudly presented to</p>
                </div>
                
                <div style={{ textAlign: "center", margin: "30px 0" }}>
                  <h2 style={{ fontSize: "36px", color: "#1E3A8A", borderBottom: "2px solid #F59E0B", display: "inline-block", padding: "0 20px" }}>
                    {selectedCertificate.studentName}
                  </h2>
                </div>
                
                <div style={{ textAlign: "center", margin: "20px 0" }}>
                  <p style={{ fontSize: "18px", color: "#475569" }}>for successfully completing the course</p>
                  <h3 style={{ fontSize: "24px", color: "#F59E0B", margin: "10px 0" }}>{selectedCertificate.courseName}</h3>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #E2E8F0" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: "150px", height: "2px", background: "#333", marginBottom: "8px" }}></div>
                    <p style={{ fontSize: "12px", color: "#64748B" }}>Date</p>
                    <p style={{ fontSize: "14px", fontWeight: "500" }}>{formatDate(selectedCertificate.issueDate)}</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: "150px", height: "2px", background: "#333", marginBottom: "8px" }}></div>
                    <p style={{ fontSize: "12px", color: "#64748B" }}>Certificate ID</p>
                    <p style={{ fontSize: "12px", fontWeight: "500" }}>{selectedCertificate.certificateId}</p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: "20px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "center", gap: "12px" }}>
              <button onClick={() => downloadCertificate(selectedCertificate)} style={{ padding: "10px 24px", background: "#10B981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                <FiDownload size={16} /> Download Certificate
              </button>
              <button onClick={closeModal} style={{ padding: "10px 24px", background: "#E2E8F0", color: "#475569", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CertificateView;