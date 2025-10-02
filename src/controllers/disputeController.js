const Dispute = require('../models/Dispute');
const notificationService = require('../services/notificationService');

// Create a new dispute
async function createDispute(req, res) {
  try {
    const { userId } = req.params;
    const {
      category,
      subject,
      description,
      priority = 'medium',
      contactInfo,
      relatedItems
    } = req.body;

    // Validate required fields
    if (!category || !subject || !description || !contactInfo?.email) {
      return res.status(400).json({
        success: false,
        message: 'Category, subject, description, and email are required'
      });
    }

    // Create new dispute
    const dispute = new Dispute({
      userId,
      category,
      subject,
      description,
      priority,
      contactInfo,
      relatedItems: relatedItems || {}
    });

    await dispute.save();

    // Send confirmation notification to user
    try {
      await notificationService.sendToUser(userId, {
        title: '📋 Dispute Submitted',
        body: `Your dispute "${subject}" has been submitted. Reference ID: ${dispute.disputeId}`,
        type: 'general',
        data: {
          disputeId: dispute.disputeId,
          category: dispute.category
        }
      });
    } catch (notificationError) {
      console.error('Error sending dispute confirmation notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Dispute created successfully',
      data: {
        disputeId: dispute.disputeId,
        status: dispute.status,
        createdAt: dispute.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating dispute:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating dispute',
      error: error.message
    });
  }
}

// Get user's disputes
async function getUserDisputes(req, res) {
  try {
    const { userId } = req.params;
    const { 
      status, 
      category, 
      limit = 20, 
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = { userId, isActive: true };
    if (status) filter.status = status;
    if (category) filter.category = category;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const disputes = await Dispute.find(filter)
      .select('-adminNotes -__v')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('relatedItems.stitchId', 'name referenceNumber');

    const total = await Dispute.countDocuments(filter);

    res.json({
      success: true,
      data: disputes,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user disputes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching disputes',
      error: error.message
    });
  }
}

// Get dispute by ID
async function getDisputeById(req, res) {
  try {
    const { userId, disputeId } = req.params;

    const dispute = await Dispute.findOne({
      disputeId,
      userId,
      isActive: true
    })
      .select('-adminNotes -__v')
      .populate('relatedItems.stitchId', 'name referenceNumber');

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    res.json({
      success: true,
      data: dispute
    });
  } catch (error) {
    console.error('Error fetching dispute:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dispute',
      error: error.message
    });
  }
}

// Update dispute (user can only update certain fields)
async function updateDispute(req, res) {
  try {
    const { userId, disputeId } = req.params;
    const { description, contactInfo, priority } = req.body;

    const dispute = await Dispute.findOne({
      disputeId,
      userId,
      isActive: true
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    // Only allow updates if dispute is still open
    if (dispute.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update dispute that is no longer open'
      });
    }

    // Update allowed fields
    if (description) dispute.description = description;
    if (contactInfo) dispute.contactInfo = { ...dispute.contactInfo, ...contactInfo };
    if (priority) dispute.priority = priority;

    await dispute.save();

    res.json({
      success: true,
      message: 'Dispute updated successfully',
      data: dispute
    });
  } catch (error) {
    console.error('Error updating dispute:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating dispute',
      error: error.message
    });
  }
}

// Cancel dispute
async function cancelDispute(req, res) {
  try {
    const { userId, disputeId } = req.params;
    const { reason } = req.body;

    const dispute = await Dispute.findOne({
      disputeId,
      userId,
      isActive: true
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    // Only allow cancellation if dispute is open or in progress
    if (!['open', 'in_progress'].includes(dispute.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel dispute with current status'
      });
    }

    dispute.status = 'cancelled';
    if (reason) {
      dispute.adminNotes.push({
        note: `Cancelled by user. Reason: ${reason}`,
        addedBy: userId,
        addedAt: new Date()
      });
    }

    await dispute.save();

    res.json({
      success: true,
      message: 'Dispute cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling dispute:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling dispute',
      error: error.message
    });
  }
}

// Add satisfaction rating (after resolution)
async function addSatisfactionRating(req, res) {
  try {
    const { userId, disputeId } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const dispute = await Dispute.findOne({
      disputeId,
      userId,
      status: 'resolved',
      isActive: true
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Resolved dispute not found'
      });
    }

    dispute.resolution.satisfactionRating = rating;
    if (feedback) {
      dispute.adminNotes.push({
        note: `User feedback: ${feedback}`,
        addedBy: userId,
        addedAt: new Date()
      });
    }

    await dispute.save();

    res.json({
      success: true,
      message: 'Thank you for your feedback'
    });
  } catch (error) {
    console.error('Error adding satisfaction rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding satisfaction rating',
      error: error.message
    });
  }
}

// Get dispute categories
async function getDisputeCategories(req, res) {
  try {
    const categories = [
      {
        value: 'billing',
        label: 'Billing & Payments',
        description: 'Issues related to charges, refunds, or payment methods'
      },
      {
        value: 'technical_issue',
        label: 'Technical Issue',
        description: 'App crashes, bugs, or performance problems'
      },
      {
        value: 'content_issue',
        label: 'Content Issue',
        description: 'Problems with stitching patterns or instructions'
      },
      {
        value: 'account_access',
        label: 'Account Access',
        description: 'Login problems or account recovery'
      },
      {
        value: 'privacy_concern',
        label: 'Privacy Concern',
        description: 'Data privacy or security concerns'
      },
      {
        value: 'inappropriate_content',
        label: 'Inappropriate Content',
        description: 'Report inappropriate or offensive content'
      },
      {
        value: 'feature_request',
        label: 'Feature Request',
        description: 'Suggest new features or improvements'
      },
      {
        value: 'other',
        label: 'Other',
        description: 'Any other issues not covered above'
      }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching dispute categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dispute categories',
      error: error.message
    });
  }
}

// Get dispute statistics for user
async function getUserDisputeStats(req, res) {
  try {
    const { userId } = req.params;

    const stats = await Dispute.aggregate([
      { $match: { userId, isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalDisputes = await Dispute.countDocuments({ userId, isActive: true });

    const statusCounts = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        total: totalDisputes,
        byStatus: statusCounts
      }
    });
  } catch (error) {
    console.error('Error fetching dispute statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dispute statistics',
      error: error.message
    });
  }
}

module.exports = {
  createDispute,
  getUserDisputes,
  getDisputeById,
  updateDispute,
  cancelDispute,
  addSatisfactionRating,
  getDisputeCategories,
  getUserDisputeStats
};
