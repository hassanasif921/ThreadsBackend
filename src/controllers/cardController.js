const squareService = require('../services/squareService');
const User = require('../models/User');

// Get user's saved cards
exports.getUserCards = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get customer from Square if exists
    if (!user.squareCustomerId) {
      return res.json({
        success: true,
        data: [],
        message: 'No saved cards found'
      });
    }

    const cards = await squareService.getCustomerCards(user.squareCustomerId);

    res.json({
      success: true,
      data: cards,
      message: 'Cards retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user cards:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cards',
      error: error.message
    });
  }
};

// Add a new card
exports.addCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethodId, setAsDefault = false } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required'
      });
    }

    // Get or create Square customer
    const customer = await squareService.getOrCreateCustomer(userId);
    
    // Create card on file
    const card = await squareService.createCardOnFile(customer.id, paymentMethodId, setAsDefault);

    res.status(201).json({
      success: true,
      data: card,
      message: 'Card added successfully'
    });
  } catch (error) {
    console.error('Error adding card:', error);
    res.status(400).json({
      success: false,
      message: 'Error adding card',
      error: error.message
    });
  }
};

// Update card (set as default, etc.)
exports.updateCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;
    const { setAsDefault } = req.body;

    const user = await User.findById(userId);
    if (!user || !user.squareCustomerId) {
      return res.status(404).json({
        success: false,
        message: 'User or customer not found'
      });
    }

    if (setAsDefault) {
      const updatedCard = await squareService.setDefaultCard(user.squareCustomerId, cardId);
      
      res.json({
        success: true,
        data: updatedCard,
        message: 'Default card updated successfully'
      });
    } else {
      res.json({
        success: true,
        message: 'No updates specified'
      });
    }
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating card',
      error: error.message
    });
  }
};

// Remove a card
exports.removeCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;

    const user = await User.findById(userId);
    if (!user || !user.squareCustomerId) {
      return res.status(404).json({
        success: false,
        message: 'User or customer not found'
      });
    }

    // Check if card is being used by active subscription
    const activeSubscription = await squareService.checkCardInUse(user.squareCustomerId, cardId);
    
    if (activeSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove card that is being used by an active subscription',
        code: 'CARD_IN_USE'
      });
    }

    await squareService.deleteCard(user.squareCustomerId, cardId);

    res.json({
      success: true,
      message: 'Card removed successfully'
    });
  } catch (error) {
    console.error('Error removing card:', error);
    res.status(400).json({
      success: false,
      message: 'Error removing card',
      error: error.message
    });
  }
};

// Get default card
exports.getDefaultCard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user || !user.squareCustomerId) {
      return res.json({
        success: true,
        data: null,
        message: 'No default card found'
      });
    }

    const defaultCard = await squareService.getDefaultCard(user.squareCustomerId);

    res.json({
      success: true,
      data: defaultCard,
      message: defaultCard ? 'Default card retrieved' : 'No default card set'
    });
  } catch (error) {
    console.error('Error fetching default card:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching default card',
      error: error.message
    });
  }
};
