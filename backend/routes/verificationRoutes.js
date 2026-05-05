const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const VerificationRequest = require('../models/VerificationRequest');
const Unit = require('../models/Unit');
const Content = require('../models/Content');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const auth = require('../middleware/verifytoken');

// Create verification request
router.post('/verification/request', auth, async (req, res) => {
  try {
    const {
      subjectId,
      subjectName,
      subjectCode,
      semester,
      teacherId,
      teacherName,
      teacherEmail
    } = req.body;

    console.log('========================================');
    console.log('Received verification request');
    console.log('Subject ID:', subjectId);
    console.log('Subject Name:', subjectName);
    console.log('Teacher ID:', teacherId);
    console.log('========================================');

    if (!subjectId || !teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subjectId and teacherId are required'
      });
    }

    const existingRequest = await VerificationRequest.findOne({
      subjectId: subjectId,
      teacherId: teacherId,
      status: { $in: ['pending_review', 'under_review'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending verification request for this subject'
      });
    }

    const [allUnits, allContent, allAssignments, allQuizzes] = await Promise.all([
      Unit.find({ subjectId: subjectId, teacherId: teacherId, isActive: true }),
      Content.find({ subjectId: subjectId, teacherId: teacherId }),
      Assignment.find({ subjectId: subjectId, teacherId: teacherId }),
      Quiz.find({ subjectId: subjectId, teacherId: teacherId })
    ]);
    
    const pendingUnits = allUnits.filter(unit => unit.status === 'pending');
    const pendingContent = allContent.filter(content => content.status === 'pending');
    const pendingAssignments = allAssignments.filter(assignment => assignment.status === 'pending');
    const pendingQuizzes = allQuizzes.filter(quiz => quiz.status === 'pending');
    
    const summary = {
      totalUnits: allUnits.length,
      totalContent: allContent.length,
      totalAssignments: allAssignments.length,
      totalQuizzes: allQuizzes.length,
      pendingUnits: pendingUnits.length,
      pendingContent: pendingContent.length,
      pendingAssignments: pendingAssignments.length,
      pendingQuizzes: pendingQuizzes.length
    };

    if (allUnits.length === 0 && allContent.length === 0 && 
        allAssignments.length === 0 && allQuizzes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No content found for this subject. Please create units, content, assignments, or quizzes first.'
      });
    }

    if (pendingUnits.length === 0 && pendingContent.length === 0 && 
        pendingAssignments.length === 0 && pendingQuizzes.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No pending items found. All items have status other than 'pending'.`
      });
    }

    const verificationRequest = new VerificationRequest({
      subjectId,
      subjectName,
      subjectCode,
      semester,
      teacherId,
      teacherName,
      teacherEmail,
      summary,
      items: {
        units: allUnits.map(u => u._id),
        content: allContent.map(c => c._id),
        assignments: allAssignments.map(a => a._id),
        quizzes: allQuizzes.map(q => q._id)
      },
      status: 'pending_review',
      requestedAt: new Date()
    });

    const savedRequest = await verificationRequest.save();

    if (pendingUnits.length > 0) {
      await Unit.updateMany(
        { _id: { $in: pendingUnits.map(u => u._id) } },
        { verificationRequestId: savedRequest._id }
      );
    }
    if (pendingContent.length > 0) {
      await Content.updateMany(
        { _id: { $in: pendingContent.map(c => c._id) } },
        { verificationRequestId: savedRequest._id }
      );
    }
    if (pendingAssignments.length > 0) {
      await Assignment.updateMany(
        { _id: { $in: pendingAssignments.map(a => a._id) } },
        { verificationRequestId: savedRequest._id }
      );
    }
    if (pendingQuizzes.length > 0) {
      await Quiz.updateMany(
        { _id: { $in: pendingQuizzes.map(q => q._id) } },
        { verificationRequestId: savedRequest._id }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Verification request submitted successfully',
      data: savedRequest
    });
  } catch (error) {
    console.error('Error creating verification request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// UPDATE existing verification request with new items
router.put('/verification/update/:requestId', auth, async (req, res) => {
  try {
    const { 
      subjectId, 
      subjectName, 
      subjectCode, 
      semester, 
      teacherId, 
      teacherName, 
      teacherEmail,
      newUnits,
      newContent,
      newAssignments,
      newQuizzes
    } = req.body;
    
    const existingRequest = await VerificationRequest.findById(req.params.requestId);
    
    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found'
      });
    }
    
    if (existingRequest.status !== 'pending_review' && existingRequest.status !== 'under_review') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a request that is already processed'
      });
    }
    
    let addedCount = 0;
    const addedItems = {
      units: [],
      content: [],
      assignments: [],
      quizzes: []
    };
    
    if (newUnits && newUnits.length > 0) {
      const existingUnitIds = new Set(existingRequest.items.units.map(id => id.toString()));
      const unitsToAdd = newUnits.filter(id => !existingUnitIds.has(id.toString()));
      if (unitsToAdd.length > 0) {
        existingRequest.items.units.push(...unitsToAdd);
        existingRequest.summary.totalUnits += unitsToAdd.length;
        existingRequest.summary.pendingUnits += unitsToAdd.length;
        addedCount += unitsToAdd.length;
        addedItems.units = unitsToAdd;
        
        await Unit.updateMany(
          { _id: { $in: unitsToAdd } },
          { verificationRequestId: existingRequest._id }
        );
      }
    }
    
    if (newContent && newContent.length > 0) {
      const existingContentIds = new Set(existingRequest.items.content.map(id => id.toString()));
      const contentToAdd = newContent.filter(id => !existingContentIds.has(id.toString()));
      if (contentToAdd.length > 0) {
        existingRequest.items.content.push(...contentToAdd);
        existingRequest.summary.totalContent += contentToAdd.length;
        existingRequest.summary.pendingContent += contentToAdd.length;
        addedCount += contentToAdd.length;
        addedItems.content = contentToAdd;
        
        await Content.updateMany(
          { _id: { $in: contentToAdd } },
          { verificationRequestId: existingRequest._id }
        );
      }
    }
    
    if (newAssignments && newAssignments.length > 0) {
      const existingAssignmentIds = new Set(existingRequest.items.assignments.map(id => id.toString()));
      const assignmentsToAdd = newAssignments.filter(id => !existingAssignmentIds.has(id.toString()));
      if (assignmentsToAdd.length > 0) {
        existingRequest.items.assignments.push(...assignmentsToAdd);
        existingRequest.summary.totalAssignments += assignmentsToAdd.length;
        existingRequest.summary.pendingAssignments += assignmentsToAdd.length;
        addedCount += assignmentsToAdd.length;
        addedItems.assignments = assignmentsToAdd;
        
        await Assignment.updateMany(
          { _id: { $in: assignmentsToAdd } },
          { verificationRequestId: existingRequest._id }
        );
      }
    }
    
    if (newQuizzes && newQuizzes.length > 0) {
      const existingQuizIds = new Set(existingRequest.items.quizzes.map(id => id.toString()));
      const quizzesToAdd = newQuizzes.filter(id => !existingQuizIds.has(id.toString()));
      if (quizzesToAdd.length > 0) {
        existingRequest.items.quizzes.push(...quizzesToAdd);
        existingRequest.summary.totalQuizzes += quizzesToAdd.length;
        existingRequest.summary.pendingQuizzes += quizzesToAdd.length;
        addedCount += quizzesToAdd.length;
        addedItems.quizzes = quizzesToAdd;
        
        await Quiz.updateMany(
          { _id: { $in: quizzesToAdd } },
          { verificationRequestId: existingRequest._id }
        );
      }
    }
    
    if (addedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No new items to add to the verification request'
      });
    }
    
    existingRequest.updatedAt = new Date();
    existingRequest.itemsAddedAt = new Date();
    
    await existingRequest.save();
    
    res.json({
      success: true,
      message: `Verification request updated with ${addedCount} new item(s)`,
      data: existingRequest,
      addedItems: addedItems
    });
    
  } catch (error) {
    console.error('Error updating verification request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all verification requests for a teacher
router.get('/verification/teacher/:teacherId', auth, async (req, res) => {
  try {
    const requests = await VerificationRequest.find({
      teacherId: req.params.teacherId
    })
    .populate('items.units', 'unitNumber unitTitle status')
    .populate('items.content', 'topic status')
    .populate('items.assignments', 'title status')
    .populate('items.quizzes', 'questions status')
    .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching teacher verification requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get verification request by subject ID
router.get('/verification/subject/:subjectId', auth, async (req, res) => {
  try {
    const teacherId = req.headers['x-teacher-id'];
    const query = {
      subjectId: req.params.subjectId,
      status: { $in: ['pending_review', 'under_review'] }
    };
    
    if (teacherId) {
      query.teacherId = teacherId;
    }
    
    const request = await VerificationRequest.findOne(query)
      .populate('items.units', 'unitNumber unitTitle status')
      .populate('items.content', 'topic status')
      .populate('items.assignments', 'title status')
      .populate('items.quizzes', 'questions status');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'No pending verification request found for this subject'
      });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching verification request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get verification request by ID with full details
router.get('/verification/request/:requestId', auth, async (req, res) => {
  try {
    const request = await VerificationRequest.findById(req.params.requestId)
      .populate('items.units', 'unitNumber unitTitle description status createdAt')
      .populate('items.content', 'topic description video duration status createdAt')
      .populate('items.assignments', 'title description totalMarks deadline status createdAt')
      .populate('items.quizzes', 'questions totalMarks duration status createdAt');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found'
      });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching verification request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all verification requests (for admin)
router.get('/verification/all', auth, async (req, res) => {
  try {
    const requests = await VerificationRequest.find()
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email')
      .populate('items.units', 'unitNumber unitTitle status')
      .populate('items.content', 'topic status')
      .populate('items.assignments', 'title status')
      .populate('items.quizzes', 'questions status')
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching all verification requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update verification request status (admin)
router.put('/verification/:requestId', auth, async (req, res) => {
  try {
    const { status, adminFeedback, adminId, adminName } = req.body;

    const updateData = {
      status,
      reviewedBy: {
        adminId: adminId || req.user?.id,
        adminName: adminName || req.user?.name || 'Admin',
        reviewedAt: new Date()
      },
      reviewedAt: new Date()
    };

    if (adminFeedback) {
      updateData.adminFeedback = adminFeedback;
      updateData.$push = {
        adminComments: {
          comment: adminFeedback,
          adminId: adminId || req.user?.id,
          adminName: adminName || req.user?.name || 'Admin',
          timestamp: new Date()
        }
      };
    }

    const request = await VerificationRequest.findById(req.params.requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found'
      });
    }

    if (status === 'approved') {
      if (request.items.units && request.items.units.length > 0) {
        await Unit.updateMany(
          { _id: { $in: request.items.units } },
          { status: 'approved', adminFeedback: adminFeedback || '' }
        );
      }
      
      if (request.items.content && request.items.content.length > 0) {
        await Content.updateMany(
          { _id: { $in: request.items.content } },
          { status: 'approved', adminFeedback: adminFeedback || '' }
        );
      }
      
      if (request.items.assignments && request.items.assignments.length > 0) {
        await Assignment.updateMany(
          { _id: { $in: request.items.assignments } },
          { status: 'approved', adminFeedback: adminFeedback || '' }
        );
      }
      
      if (request.items.quizzes && request.items.quizzes.length > 0) {
        await Quiz.updateMany(
          { _id: { $in: request.items.quizzes } },
          { status: 'approved', adminFeedback: adminFeedback || '' }
        );
      }
    }

    if (status === 'rejected') {
      if (request.items.units && request.items.units.length > 0) {
        await Unit.updateMany(
          { _id: { $in: request.items.units } },
          { status: 'rejected', adminFeedback: adminFeedback || '' }
        );
      }
      
      if (request.items.content && request.items.content.length > 0) {
        await Content.updateMany(
          { _id: { $in: request.items.content } },
          { status: 'rejected', adminFeedback: adminFeedback || '' }
        );
      }
      
      if (request.items.assignments && request.items.assignments.length > 0) {
        await Assignment.updateMany(
          { _id: { $in: request.items.assignments } },
          { status: 'rejected', adminFeedback: adminFeedback || '' }
        );
      }
      
      if (request.items.quizzes && request.items.quizzes.length > 0) {
        await Quiz.updateMany(
          { _id: { $in: request.items.quizzes } },
          { status: 'rejected', adminFeedback: adminFeedback || '' }
        );
      }
    }

    const updatedRequest = await VerificationRequest.findByIdAndUpdate(
      req.params.requestId,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: `Verification request ${status} successfully`,
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error updating verification request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete verification request
router.delete('/verification/:requestId', auth, async (req, res) => {
  try {
    const request = await VerificationRequest.findByIdAndDelete(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found'
      });
    }

    res.json({
      success: true,
      message: 'Verification request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting verification request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get verification statistics for dashboard
router.get('/verification/stats/:teacherId', auth, async (req, res) => {
  try {
    const stats = await VerificationRequest.aggregate([
      {
        $match: { teacherId: new mongoose.Types.ObjectId(req.params.teacherId) }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalUnits: { $sum: '$summary.totalUnits' },
          totalContent: { $sum: '$summary.totalContent' },
          totalAssignments: { $sum: '$summary.totalAssignments' },
          totalQuizzes: { $sum: '$summary.totalQuizzes' }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get verification statistics for admin dashboard
router.get('/verification/admin/stats', auth, async (req, res) => {
  try {
    const stats = await VerificationRequest.aggregate([
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          totalItems: [
            {
              $group: {
                _id: null,
                totalUnits: { $sum: '$summary.totalUnits' },
                totalContent: { $sum: '$summary.totalContent' },
                totalAssignments: { $sum: '$summary.totalAssignments' },
                totalQuizzes: { $sum: '$summary.totalQuizzes' }
              }
            }
          ],
          monthlyTrends: [
            {
              $group: {
                _id: {
                  year: { $year: '$requestedAt' },
                  month: { $month: '$requestedAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 6 }
          ]
        }
      }
    ]);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Bulk approve multiple requests
router.post('/verification/bulk-approve', auth, async (req, res) => {
  try {
    const { requestIds, adminId, adminName, adminFeedback } = req.body;
    
    const results = [];
    for (const requestId of requestIds) {
      const request = await VerificationRequest.findById(requestId);
      if (request && request.status === 'pending_review') {
        request.status = 'approved';
        request.adminFeedback = adminFeedback || '';
        request.reviewedBy = { 
          adminId: adminId || req.user?.id, 
          adminName: adminName || req.user?.name || 'Admin', 
          reviewedAt: new Date() 
        };
        request.reviewedAt = new Date();
        await request.save();
        
        if (request.items.units && request.items.units.length > 0) {
          await Unit.updateMany(
            { _id: { $in: request.items.units } },
            { status: 'approved', adminFeedback: adminFeedback || '' }
          );
        }
        if (request.items.content && request.items.content.length > 0) {
          await Content.updateMany(
            { _id: { $in: request.items.content } },
            { status: 'approved', adminFeedback: adminFeedback || '' }
          );
        }
        if (request.items.assignments && request.items.assignments.length > 0) {
          await Assignment.updateMany(
            { _id: { $in: request.items.assignments } },
            { status: 'approved', adminFeedback: adminFeedback || '' }
          );
        }
        if (request.items.quizzes && request.items.quizzes.length > 0) {
          await Quiz.updateMany(
            { _id: { $in: request.items.quizzes } },
            { status: 'approved', adminFeedback: adminFeedback || '' }
          );
        }
        
        results.push(requestId);
      }
    }
    
    res.json({
      success: true,
      message: `Successfully approved ${results.length} requests`,
      approved: results.length
    });
  } catch (error) {
    console.error('Error in bulk approve:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ========== FIX ORPHANED ITEMS ==========
router.post('/verification/fix-orphaned-items/:teacherId', auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID'
      });
    }

    const fixedItems = {
      content: 0,
      assignments: 0,
      quizzes: 0
    };

    // First, let's check if there are any units for this teacher
    const units = await Unit.find({ 
      teacherId: teacherId, 
      isActive: true 
    });
    
    console.log(`Found ${units.length} units for teacher ${teacherId}`);
    
    if (units.length === 0) {
      // No units found, we cannot fix orphaned items
      return res.json({
        success: true,
        message: 'No units found for this teacher. Please create units first before fixing orphaned items.',
        fixedItems: { content: 0, assignments: 0, quizzes: 0 },
        warning: 'No units available to associate items with'
      });
    }
    
    // Create a map of subjectId to the first unit found for that subject
    const subjectUnitMap = new Map();
    units.forEach(unit => {
      const subjectIdStr = unit.subjectId?.toString();
      if (subjectIdStr && !subjectUnitMap.has(subjectIdStr)) {
        subjectUnitMap.set(subjectIdStr, unit._id);
      }
    });

    console.log('Subject-Unit mapping:', Array.from(subjectUnitMap.entries()));

    // Fix orphaned content - using aggregation to find items with invalid unitId
    // First, find all content for this teacher
    const allTeacherContent = await Content.find({ teacherId: teacherId });
    
    for (const content of allTeacherContent) {
      // Check if unitId is missing, null, empty string, or invalid ObjectId
      const needsFix = !content.unitId || 
                       content.unitId === '' || 
                       (typeof content.unitId === 'string' && !mongoose.Types.ObjectId.isValid(content.unitId));
      
      if (needsFix) {
        const subjectIdStr = content.subjectId?.toString();
        const unitId = subjectUnitMap.get(subjectIdStr);
        
        if (unitId && mongoose.Types.ObjectId.isValid(unitId)) {
          await Content.updateOne(
            { _id: content._id },
            { $set: { unitId: unitId } }
          );
          fixedItems.content++;
          console.log(`Fixed content ${content._id} - assigned to unit ${unitId}`);
        } else {
          console.log(`No unit found for content ${content._id} with subject ${subjectIdStr}`);
        }
      }
    }

    // Fix orphaned assignments
    const allTeacherAssignments = await Assignment.find({ teacherId: teacherId });
    
    for (const assignment of allTeacherAssignments) {
      const needsFix = !assignment.unitId || 
                       assignment.unitId === '' || 
                       (typeof assignment.unitId === 'string' && !mongoose.Types.ObjectId.isValid(assignment.unitId));
      
      if (needsFix) {
        const subjectIdStr = assignment.subjectId?.toString();
        const unitId = subjectUnitMap.get(subjectIdStr);
        
        if (unitId && mongoose.Types.ObjectId.isValid(unitId)) {
          await Assignment.updateOne(
            { _id: assignment._id },
            { $set: { unitId: unitId } }
          );
          fixedItems.assignments++;
          console.log(`Fixed assignment ${assignment._id} - assigned to unit ${unitId}`);
        } else {
          console.log(`No unit found for assignment ${assignment._id} with subject ${subjectIdStr}`);
        }
      }
    }

    // Fix orphaned quizzes
    const allTeacherQuizzes = await Quiz.find({ teacherId: teacherId });
    
    for (const quiz of allTeacherQuizzes) {
      const needsFix = !quiz.unitId || 
                       quiz.unitId === '' || 
                       (typeof quiz.unitId === 'string' && !mongoose.Types.ObjectId.isValid(quiz.unitId));
      
      if (needsFix) {
        const subjectIdStr = quiz.subjectId?.toString();
        const unitId = subjectUnitMap.get(subjectIdStr);
        
        if (unitId && mongoose.Types.ObjectId.isValid(unitId)) {
          await Quiz.updateOne(
            { _id: quiz._id },
            { $set: { unitId: unitId } }
          );
          fixedItems.quizzes++;
          console.log(`Fixed quiz ${quiz._id} - assigned to unit ${unitId}`);
        } else {
          console.log(`No unit found for quiz ${quiz._id} with subject ${subjectIdStr}`);
        }
      }
    }

    res.json({
      success: true,
      message: `Fixed ${fixedItems.content} content, ${fixedItems.assignments} assignments, ${fixedItems.quizzes} quizzes`,
      fixedItems
    });
  } catch (error) {
    console.error('Error fixing orphaned items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ========== GET UNITS BY SUBJECT AND TEACHER ==========
router.get('/units/subject/:subjectId/teacher/:teacherId', auth, async (req, res) => {
  try {
    const { subjectId, teacherId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID or teacher ID'
      });
    }
    
    const units = await Unit.find({ 
      subjectId: subjectId, 
      teacherId: teacherId,
      isActive: true 
    }).sort({ unitNumber: 1 });
    
    res.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ========== RE-VERIFICATION ENDPOINTS ==========
router.put('/units/:unitId/reverify', auth, async (req, res) => {
  try {
    const { teacherId } = req.body;
    const unit = await Unit.findById(req.params.unitId);
    
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    
    if (unit.teacherId.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    unit.status = 'pending';
    unit.adminFeedback = '';
    unit.reverifiedAt = new Date();
    await unit.save();
    
    res.json({ success: true, message: 'Unit re-verification requested' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/content/:contentId/reverify', auth, async (req, res) => {
  try {
    const { teacherId } = req.body;
    const content = await Content.findById(req.params.contentId);
    
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }
    
    if (content.teacherId.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    content.status = 'pending';
    content.adminFeedback = '';
    content.reverifiedAt = new Date();
    await content.save();
    
    res.json({ success: true, message: 'Content re-verification requested' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/assignments/:assignmentId/reverify', auth, async (req, res) => {
  try {
    const { teacherId } = req.body;
    const assignment = await Assignment.findById(req.params.assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    
    if (assignment.teacherId.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    assignment.status = 'pending';
    assignment.adminFeedback = '';
    assignment.reverifiedAt = new Date();
    await assignment.save();
    
    res.json({ success: true, message: 'Assignment re-verification requested' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/quizzes/:quizId/reverify', auth, async (req, res) => {
  try {
    const { teacherId } = req.body;
    const quiz = await Quiz.findById(req.params.quizId);
    
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    
    if (quiz.teacherId.toString() !== teacherId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    quiz.status = 'pending';
    quiz.adminFeedback = '';
    quiz.reverifiedAt = new Date();
    await quiz.save();
    
    res.json({ success: true, message: 'Quiz re-verification requested' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET SINGLE ITEMS ENDPOINTS ==========
router.get('/units/:unitId', auth, async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.unitId)
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email');
    
    if (!unit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Unit not found' 
      });
    }
    
    res.json(unit);
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/content/:contentId', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.contentId)
      .populate('subjectId', 'name code')
      .populate('unitId', 'unitNumber unitTitle')
      .populate('teacherId', 'name email');
    
    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content not found' 
      });
    }
    
    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/assignments/:assignmentId', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId)
      .populate('subjectId', 'name code')
      .populate('unitId', 'unitNumber unitTitle')
      .populate('teacherId', 'name email');
    
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }
    
    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get('/quizzes/:quizId', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId)
      .populate('subjectId', 'name code')
      .populate('unitId', 'unitNumber unitTitle')
      .populate('teacherId', 'name email');
    
    if (!quiz) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quiz not found' 
      });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ========== UPDATE STATUS ENDPOINTS (ADMIN) ==========
router.put('/units/:unitId/status', auth, async (req, res) => {
  try {
    const { status, adminFeedback } = req.body;
    const unit = await Unit.findByIdAndUpdate(
      req.params.unitId,
      { status, adminFeedback },
      { new: true }
    );
    
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }
    
    res.json({ 
      success: true, 
      message: `Unit ${status} successfully`,
      data: unit 
    });
  } catch (error) {
    console.error('Error updating unit status:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.put('/content/:contentId/status', auth, async (req, res) => {
  try {
    const { status, adminFeedback } = req.body;
    const content = await Content.findByIdAndUpdate(
      req.params.contentId,
      { status, adminFeedback },
      { new: true }
    );
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    res.json({ 
      success: true, 
      message: `Content ${status} successfully`,
      data: content 
    });
  } catch (error) {
    console.error('Error updating content status:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.put('/assignments/:assignmentId/status', auth, async (req, res) => {
  try {
    const { status, adminFeedback } = req.body;
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.assignmentId,
      { status, adminFeedback },
      { new: true }
    );
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    res.json({ 
      success: true, 
      message: `Assignment ${status} successfully`,
      data: assignment 
    });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.put('/quizzes/:quizId/status', auth, async (req, res) => {
  try {
    const { status, adminFeedback } = req.body;
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.quizId,
      { status, adminFeedback },
      { new: true }
    );
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    res.json({ 
      success: true, 
      message: `Quiz ${status} successfully`,
      data: quiz 
    });
  } catch (error) {
    console.error('Error updating quiz status:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;