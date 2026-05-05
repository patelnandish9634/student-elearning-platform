const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const verifyToken = require('../middleware/verifyToken');

// Get all notifications for a teacher
router.get('/teacher/:teacherId', verifyToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Verify the requesting user is the teacher or admin
    if (req.user.role !== 'admin' && req.user.id !== teacherId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const notifications = await Notification.find({ teacherId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ 
      teacherId, 
      isRead: false 
    });
    
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Verify ownership
    if (req.user.role !== 'admin' && req.user.id !== notification.teacherId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/teacher/:teacherId/read-all', verifyToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    if (req.user.role !== 'admin' && req.user.id !== teacherId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    await Notification.updateMany(
      { teacherId, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send notification (admin only)
router.post('/send', verifyToken, async (req, res) => {
  try {
    // Only admins can send notifications
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { teacherId, title, message, type, relatedId, relatedType } = req.body;
    
    const notification = new Notification({
      teacherId,
      title,
      message,
      type,
      relatedId,
      relatedType
    });
    
    await notification.save();
    
    res.status(201).json({ message: 'Notification sent successfully', notification });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:notificationId', verifyToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (req.user.role !== 'admin' && req.user.id !== notification.teacherId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    await notification.deleteOne();
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




module.exports = router;