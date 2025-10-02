const LegalContent = require('../models/LegalContent');

// Get privacy policy
async function getPrivacyPolicy(req, res) {
  try {
    const privacyPolicy = await LegalContent.findOne({
      type: 'privacy_policy',
      isActive: true
    }).select('-__v');

    if (!privacyPolicy) {
      return res.status(404).json({
        success: false,
        message: 'Privacy policy not found'
      });
    }

    res.json({
      success: true,
      data: privacyPolicy
    });
  } catch (error) {
    console.error('Error fetching privacy policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching privacy policy',
      error: error.message
    });
  }
}

// Get terms and conditions
async function getTermsAndConditions(req, res) {
  try {
    const termsAndConditions = await LegalContent.findOne({
      type: 'terms_conditions',
      isActive: true
    }).select('-__v');

    if (!termsAndConditions) {
      return res.status(404).json({
        success: false,
        message: 'Terms and conditions not found'
      });
    }

    res.json({
      success: true,
      data: termsAndConditions
    });
  } catch (error) {
    console.error('Error fetching terms and conditions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching terms and conditions',
      error: error.message
    });
  }
}

// Get all legal content
async function getAllLegalContent(req, res) {
  try {
    const legalContent = await LegalContent.find({
      isActive: true
    }).select('-__v').sort({ type: 1 });

    res.json({
      success: true,
      data: legalContent
    });
  } catch (error) {
    console.error('Error fetching legal content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching legal content',
      error: error.message
    });
  }
}

// Create or update legal content (Admin only)
async function createOrUpdateLegalContent(req, res) {
  try {
    const { type } = req.params;
    const { title, content, version, effectiveDate, metadata } = req.body;

    if (!['privacy_policy', 'terms_conditions'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type. Must be privacy_policy or terms_conditions'
      });
    }

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Check if content already exists
    let legalContent = await LegalContent.findOne({ type });

    if (legalContent) {
      // Update existing content
      legalContent.title = title;
      legalContent.content = content;
      if (version) legalContent.version = version;
      if (effectiveDate) legalContent.effectiveDate = new Date(effectiveDate);
      if (metadata) legalContent.metadata = { ...legalContent.metadata, ...metadata };
      
      await legalContent.save();
    } else {
      // Create new content
      legalContent = new LegalContent({
        type,
        title,
        content,
        version: version || '1.0',
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        metadata: metadata || {}
      });
      
      await legalContent.save();
    }

    res.json({
      success: true,
      message: `${type.replace('_', ' ')} ${legalContent.isNew ? 'created' : 'updated'} successfully`,
      data: legalContent
    });
  } catch (error) {
    console.error('Error creating/updating legal content:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating/updating legal content',
      error: error.message
    });
  }
}

// Get content by type (generic endpoint)
async function getContentByType(req, res) {
  try {
    const { type } = req.params;

    if (!['privacy_policy', 'terms_conditions'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type'
      });
    }

    const content = await LegalContent.findOne({
      type,
      isActive: true
    }).select('-__v');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: `${type.replace('_', ' ')} not found`
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
}

// Get content version history (Admin only)
async function getContentHistory(req, res) {
  try {
    const { type } = req.params;

    if (!['privacy_policy', 'terms_conditions'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type'
      });
    }

    // This would require a separate versioning system
    // For now, just return the current version
    const content = await LegalContent.findOne({ type }).select('-__v');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: {
        current: content,
        history: [] // Placeholder for version history
      }
    });
  } catch (error) {
    console.error('Error fetching content history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content history',
      error: error.message
    });
  }
}

// Delete legal content (Admin only)
async function deleteLegalContent(req, res) {
  try {
    const { type } = req.params;

    const result = await LegalContent.findOneAndUpdate(
      { type },
      { isActive: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Content deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting legal content:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting legal content',
      error: error.message
    });
  }
}

module.exports = {
  getPrivacyPolicy,
  getTermsAndConditions,
  getAllLegalContent,
  createOrUpdateLegalContent,
  getContentByType,
  getContentHistory,
  deleteLegalContent
};
