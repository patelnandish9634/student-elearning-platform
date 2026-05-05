// Meetings.js - Teacher's Live Class Management with Backend Integration
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const token = localStorage.getItem("token");

const axiosConfig = {
  headers: { Authorization: `Bearer ${token}` }
};

const Meetings = ({ teacherId }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [teacherDivision, setTeacherDivision] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    meetingLink: '',
    description: '',
    subjectId: '',
    unitId: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);

  // Fetch teacher's division from their subjects
  const fetchTeacherDivision = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subjects/teacher/${teacherId}`, axiosConfig);
      console.log("Teacher subjects response:", response.data);
      
      let teacherSubjects = [];
      if (response.data.success) {
        teacherSubjects = response.data.subjects;
      } else if (Array.isArray(response.data)) {
        teacherSubjects = response.data;
      }
      
      // Get the division from the first subject (assuming teacher teaches one division)
      if (teacherSubjects.length > 0 && teacherSubjects[0].division) {
        setTeacherDivision(teacherSubjects[0].division);
        console.log("Teacher division set to:", teacherSubjects[0].division);
      } else {
        // Fallback: get division from localStorage or user data
        const storedTeacher = localStorage.getItem("teacher");
        if (storedTeacher) {
          const teacher = JSON.parse(storedTeacher);
          if (teacher.division) {
            setTeacherDivision(teacher.division);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching teacher division:", err);
    }
  };

  // Fetch subjects for the teacher
  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subjects/teacher/${teacherId}`, axiosConfig);
      console.log("Subjects response:", response.data);
      
      if (response.data.success) {
        setSubjects(response.data.subjects);
      } else if (Array.isArray(response.data)) {
        setSubjects(response.data);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setSubjects([]);
    }
  };

  // Fetch units for selected subject
  const fetchUnits = async (subjectId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/units/subject/${subjectId}?teacherId=${teacherId}`, axiosConfig);
      console.log("Units response:", response.data);
      if (response.data.success) {
        setUnits(response.data.units);
      } else if (Array.isArray(response.data)) {
        setUnits(response.data);
      } else {
        setUnits([]);
      }
    } catch (err) {
      console.error("Error fetching units:", err);
      setUnits([]);
    }
  };

  // Fetch meetings from backend
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/meetings/teacher/${teacherId}`, axiosConfig);
      console.log("Meetings response:", response.data);
      if (response.data.success) {
        setMeetings(response.data.meetings);
      } else if (Array.isArray(response.data)) {
        setMeetings(response.data);
      } else {
        setMeetings([]);
        setError(response.data.message);
      }
    } catch (err) {
      console.error("Error fetching meetings:", err);
      setError(err.response?.data?.message || "Failed to load meetings");
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  // Load all data on mount
  useEffect(() => {
    if (teacherId) {
      fetchTeacherDivision();
      fetchMeetings();
      fetchSubjects();
    }
  }, [teacherId]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If subject changes, fetch units for that subject
    if (name === 'subjectId' && value) {
      fetchUnits(value);
      setFormData(prev => ({ ...prev, unitId: '' }));
    }
  };

  // Open modal for adding new meeting
  const handleAddClick = () => {
    setEditingMeeting(null);
    setFormData({
      title: '',
      date: '',
      time: '',
      duration: '60',
      meetingLink: '',
      description: '',
      subjectId: '',
      unitId: ''
    });
    setUnits([]);
    setIsModalOpen(true);
  };

  // Open modal for editing existing meeting
  const handleEditClick = (meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      date: meeting.date ? meeting.date.split('T')[0] : '',
      time: meeting.time,
      duration: meeting.duration,
      meetingLink: meeting.meetingLink,
      description: meeting.description || '',
      subjectId: meeting.subjectId?._id || meeting.subjectId || '',
      unitId: meeting.unitId?._id || meeting.unitId || ''
    });
    if (meeting.subjectId) {
      fetchUnits(meeting.subjectId?._id || meeting.subjectId);
    }
    setIsModalOpen(true);
  };

  // Save meeting (add or update)
  const handleSaveMeeting = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }
    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }
    if (!formData.time) {
      toast.error('Please select a time');
      return;
    }
    if (!formData.meetingLink.trim()) {
      toast.error('Please enter a meeting link');
      return;
    }
    if (!teacherDivision) {
      toast.error('Teacher division not found. Please ensure you are assigned to a division.');
      return;
    }

    try {
      const meetingData = {
        ...formData,
        teacherId,
        division: teacherDivision, // Automatically add the teacher's division
        date: new Date(formData.date).toISOString()
      };

      console.log("Saving meeting with division:", meetingData.division);

      let response;
      if (editingMeeting) {
        response = await axios.put(
          `${API_BASE_URL}/meetings/${editingMeeting._id}`,
          meetingData,
          axiosConfig
        );
        if (response.data.success) {
          toast.success('Meeting updated successfully!');
        }
      } else {
        response = await axios.post(
          `${API_BASE_URL}/meetings/add`,
          meetingData,
          axiosConfig
        );
        if (response.data.success) {
          toast.success('Meeting scheduled successfully!');
        }
      }

      await fetchMeetings();
      setIsModalOpen(false);
      setEditingMeeting(null);
    } catch (err) {
      console.error("Error saving meeting:", err);
      toast.error(err.response?.data?.message || "Failed to save meeting");
    }
  };

  // Delete meeting
  const handleDeleteMeeting = async (id) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/meetings/${id}`, axiosConfig);
        if (response.data.success) {
          toast.success('Meeting deleted successfully!');
          await fetchMeetings();
        }
      } catch (err) {
        console.error("Error deleting meeting:", err);
        toast.error("Failed to delete meeting");
      }
    }
  };

  // Copy meeting link to clipboard
  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success('Meeting link copied to clipboard!');
  };

  // Join meeting
  const handleJoinMeeting = (link) => {
    window.open(link, '_blank');
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get upcoming meetings
  const getUpcomingMeetings = () => {
    const now = new Date();
    return meetings
      .filter(meeting => {
        if (!meeting.date) return false;
        const meetingDate = new Date(meeting.date);
        const meetingDateTime = new Date(`${meeting.date.split('T')[0]}T${meeting.time}`);
        return meetingDateTime >= now && meeting.status !== 'cancelled';
      })
      .sort((a, b) => {
        const dateTimeA = new Date(`${a.date?.split('T')[0]}T${a.time}`);
        const dateTimeB = new Date(`${b.date?.split('T')[0]}T${b.time}`);
        return dateTimeA - dateTimeB;
      });
  };

  // Get past meetings
  const getPastMeetings = () => {
    const now = new Date();
    return meetings
      .filter(meeting => {
        if (!meeting.date) return true;
        const meetingDateTime = new Date(`${meeting.date.split('T')[0]}T${meeting.time}`);
        return meetingDateTime < now || meeting.status === 'cancelled';
      })
      .sort((a, b) => {
        const dateTimeA = new Date(`${a.date?.split('T')[0]}T${a.time}`);
        const dateTimeB = new Date(`${b.date?.split('T')[0]}T${b.time}`);
        return dateTimeB - dateTimeA;
      });
  };

  const upcomingMeetings = getUpcomingMeetings();
  const pastMeetings = getPastMeetings();

  // Show division info in the header
  const getDivisionDisplay = () => {
    if (teacherDivision) {
      return <span style={styles.divisionBadge}>Division {teacherDivision}</span>;
    }
    return null;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading meetings...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <ToastContainer position="bottom-right" />
      
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <i className="fas fa-video" style={styles.titleIcon}></i>
            Live Classes & Meetings
          </h1>
          <p style={styles.subtitle}>Schedule and manage your virtual classroom sessions</p>
          {getDivisionDisplay()}
        </div>
        <button style={styles.addButton} onClick={handleAddClick}>
          <i className="fas fa-plus" style={styles.addButtonIcon}></i>
          Schedule Meeting
        </button>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <i className="fas fa-calendar-check"></i>
          </div>
          <div>
            <div style={styles.statValue}>{meetings.length}</div>
            <div style={styles.statLabel}>Total Meetings</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <i className="fas fa-clock"></i>
          </div>
          <div>
            <div style={styles.statValue}>{upcomingMeetings.length}</div>
            <div style={styles.statLabel}>Upcoming</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <div style={styles.statValue}>{pastMeetings.length}</div>
            <div style={styles.statLabel}>Completed</div>
          </div>
        </div>
      </div>

      {/* Upcoming Meetings Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <i className="fas fa-rocket" style={styles.sectionIcon}></i>
          Upcoming Meetings
        </h2>
        {upcomingMeetings.length === 0 ? (
          <div style={styles.emptyState}>
            <i className="fas fa-video-slash" style={styles.emptyIcon}></i>
            <p>No upcoming meetings scheduled</p>
            <button style={styles.emptyButton} onClick={handleAddClick}>Schedule your first meeting</button>
          </div>
        ) : (
          <div style={styles.meetingsGrid}>
            {upcomingMeetings.map(meeting => (
              <div key={meeting._id} style={styles.meetingCard}>
                <div style={styles.cardHeader}>
                  <div style={styles.meetingType}>
                    <i className="fab fa-zoom" style={styles.zoomIcon}></i>
                    <span style={styles.meetingTypeText}>Live Class</span>
                  </div>
                  <div style={styles.cardActions}>
                    <button 
                      style={styles.editBtn} 
                      onClick={() => handleEditClick(meeting)}
                      title="Edit Meeting"
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button 
                      style={styles.deleteBtn} 
                      onClick={() => handleDeleteMeeting(meeting._id)}
                      title="Delete Meeting"
                    >
                      <i className="fas fa-trash-alt"></i> Delete
                    </button>
                  </div>
                </div>
                <h3 style={styles.meetingTitle}>{meeting.title}</h3>
                {meeting.description && (
                  <p style={styles.meetingDescription}>{meeting.description}</p>
                )}
                <div style={styles.meetingDetails}>
                  <div style={styles.detailItem}>
                    <i className="fas fa-calendar-alt"></i>
                    <span>{formatDate(meeting.date)}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <i className="fas fa-clock"></i>
                    <span>{meeting.time} ({meeting.duration} min)</span>
                  </div>
                  {meeting.subjectId && (meeting.subjectId.name || meeting.subjectName) && (
                    <div style={styles.detailItem}>
                      <i className="fas fa-book"></i>
                      <span>{meeting.subjectId.name || meeting.subjectName}</span>
                    </div>
                  )}
                </div>
                <div style={styles.cardFooter}>
                  <button style={styles.joinBtn} onClick={() => handleJoinMeeting(meeting.meetingLink)}>
                    <i className="fas fa-video"></i>
                    Join Meeting
                  </button>
                  <button style={styles.copyBtn} onClick={() => handleCopyLink(meeting.meetingLink)}>
                    <i className="fas fa-copy"></i>
                    Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Meetings Section */}
      {pastMeetings.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <i className="fas fa-history" style={styles.sectionIcon}></i>
            Past Meetings
          </h2>
          <div style={styles.meetingsGrid}>
            {pastMeetings.map(meeting => (
              <div key={meeting._id} style={{ ...styles.meetingCard, ...styles.pastMeetingCard }}>
                <div style={styles.cardHeader}>
                  <div style={styles.meetingType}>
                    <i className="fab fa-zoom" style={styles.zoomIcon}></i>
                    <span style={styles.meetingTypeText}>Completed</span>
                  </div>
                  <div style={styles.cardActions}>
                    <button 
                      style={styles.viewRecordBtn} 
                      onClick={() => handleEditClick(meeting)}
                    >
                      <i className="fas fa-eye"></i> View
                    </button>
                    <button 
                      style={styles.deleteBtn} 
                      onClick={() => handleDeleteMeeting(meeting._id)}
                    >
                      <i className="fas fa-trash-alt"></i> Delete
                    </button>
                  </div>
                </div>
                <h3 style={styles.meetingTitle}>{meeting.title}</h3>
                {meeting.description && (
                  <p style={styles.meetingDescription}>{meeting.description}</p>
                )}
                <div style={styles.meetingDetails}>
                  <div style={styles.detailItem}>
                    <i className="fas fa-calendar-alt"></i>
                    <span>{formatDate(meeting.date)}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <i className="fas fa-clock"></i>
                    <span>{meeting.time}</span>
                  </div>
                </div>
                <div style={styles.cardFooter}>
                  <button style={styles.copyBtn} onClick={() => handleCopyLink(meeting.meetingLink)}>
                    <i className="fas fa-copy"></i>
                    Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Add/Edit Meeting */}
      {isModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <i className="fas fa-video" style={styles.modalIcon}></i>
                {editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
              </h2>
              <button style={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div style={styles.modalBody}>
              {/* Show division info */}
              {teacherDivision && (
                <div style={styles.infoBox}>
                  <i className="fas fa-users"></i> Scheduling for <strong>Division {teacherDivision}</strong>
                </div>
              )}
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Meeting Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Algebra Review Session"
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Subject (Optional)</label>
                  <select
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleInputChange}
                    style={styles.input}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Unit (Optional)</label>
                  <select
                    name="unitId"
                    value={formData.unitId}
                    onChange={handleInputChange}
                    style={styles.input}
                    disabled={!formData.subjectId}
                  >
                    <option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit._id} value={unit._id}>Unit {unit.unitNumber}: {unit.unitTitle}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Duration (min)</label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    style={styles.input}
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Meeting Link *</label>
                <input
                  type="url"
                  name="meetingLink"
                  value={formData.meetingLink}
                  onChange={handleInputChange}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx or https://zoom.us/j/123456789"
                  style={styles.input}
                />
                <small style={styles.helperText}>Google Meet or Zoom meeting link</small>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Add meeting agenda, topics to cover, or preparation notes..."
                  style={styles.textarea}
                  rows="3"
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={handleSaveMeeting}>
                <i className="fas fa-save"></i>
                {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px 32px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: '#F8FAFC',
    minHeight: 'calc(100vh - 80px)'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '16px'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid #E2E8F0',
    borderTopColor: '#0B63E5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0F172A',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  titleIcon: {
    color: '#0B63E5',
    fontSize: '28px'
  },
  subtitle: {
    color: '#64748B',
    fontSize: '14px',
    marginTop: '4px'
  },
  divisionBadge: {
    display: 'inline-block',
    background: '#EFF6FF',
    color: '#0B63E5',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    marginTop: '8px'
  },
  addButton: {
    background: 'linear-gradient(135deg, #0B63E5 0%, #0B2A4A 100%)',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
  },
  addButtonIcon: {
    fontSize: '14px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #E2E8F0'
  },
  statIcon: {
    width: '48px',
    height: '48px',
    background: '#EFF6FF',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0B63E5',
    fontSize: '22px'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0F172A'
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748B'
  },
  section: {
    marginBottom: '48px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  sectionIcon: {
    color: '#0B63E5',
    fontSize: '18px'
  },
  meetingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '24px'
  },
  meetingCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    border: '1px solid #E2E8F0',
    transition: 'all 0.3s ease'
  },
  pastMeetingCard: {
    opacity: 0.75,
    background: '#F9FAFB'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  meetingType: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#EFF6FF',
    padding: '4px 12px',
    borderRadius: '20px'
  },
  zoomIcon: {
    color: '#0B63E5',
    fontSize: '12px'
  },
  meetingTypeText: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#0B63E5'
  },
  cardActions: {
    display: 'flex',
    gap: '8px'
  },
  editBtn: {
    background: '#F0FDF4',
    border: '1px solid #22C55E',
    color: '#16A34A',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  viewRecordBtn: {
    background: '#F0FDF4',
    border: '1px solid #22C55E',
    color: '#16A34A',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  deleteBtn: {
    background: '#FEF2F2',
    border: '1px solid #EF4444',
    color: '#DC2626',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
  },
  meetingTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: '8px'
  },
  meetingDescription: {
    fontSize: '13px',
    color: '#64748B',
    marginBottom: '16px',
    lineHeight: '1.5'
  },
  meetingDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
    paddingTop: '12px',
    borderTop: '1px solid #F1F5F9'
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#475569'
  },
  cardFooter: {
    display: 'flex',
    gap: '12px'
  },
  joinBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #0B63E5 0%, #0B2A4A 100%)',
    border: 'none',
    padding: '10px',
    borderRadius: '12px',
    color: 'white',
    fontWeight: '500',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  copyBtn: {
    flex: 1,
    background: '#F1F5F9',
    border: '1px solid #E2E8F0',
    padding: '10px',
    borderRadius: '12px',
    color: '#475569',
    fontWeight: '500',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '24px',
    border: '1px solid #E2E8F0'
  },
  emptyIcon: {
    fontSize: '48px',
    color: '#CBD5E1',
    marginBottom: '16px'
  },
  emptyButton: {
    marginTop: '16px',
    background: 'none',
    border: '1px solid #0B63E5',
    padding: '10px 20px',
    borderRadius: '12px',
    color: '#0B63E5',
    cursor: 'pointer',
    fontWeight: '500'
  },
  infoBox: {
    background: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
    fontSize: '13px',
    color: '#1E40AF',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'white',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '650px',
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#0F172A',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  modalIcon: {
    color: '#0B63E5'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#94A3B8'
  },
  modalBody: {
    padding: '24px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#334155'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'all 0.2s'
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical'
  },
  helperText: {
    display: 'block',
    marginTop: '4px',
    fontSize: '11px',
    color: '#94A3B8'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #E2E8F0'
  },
  cancelBtn: {
    padding: '10px 20px',
    background: '#F1F5F9',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  saveBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #0B63E5 0%, #0B2A4A 100%)',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
};

// Add global styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  button:hover {
    transform: translateY(-2px);
    transition: transform 0.2s ease;
  }
  button:active {
    transform: translateY(0);
  }
  [style*="meetingCard"]:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 20px -12px rgba(0,0,0,0.15);
  }
  input:focus, textarea:focus, select:focus {
    border-color: #0B63E5;
    box-shadow: 0 0 0 3px rgba(11,99,229,0.1);
    outline: none;
  }
`;
document.head.appendChild(styleSheet);

export default Meetings;