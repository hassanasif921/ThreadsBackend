const { Client, Environment } = require('square');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

class SquareService {
  constructor() {
    this.client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox
    });
    
    this.customersApi = this.client.customersApi;
    this.subscriptionsApi = this.client.subscriptionsApi;
    this.paymentsApi = this.client.paymentsApi;
    this.catalogApi = this.client.catalogApi;
  }

  // Create Square customer
  async createCustomer(userData) {
    try {
      const customerData = {
        givenName: userData.firstName || 'Customer',
        familyName: userData.lastName || '',
        emailAddress: userData.email,
        referenceId: userData._id.toString()
      };

      // Skip phone number for now to avoid validation issues
      // Phone number is optional in Square API

      const { result } = await this.customersApi.createCustomer(customerData);

      return result.customer;
    } catch (error) {
      console.error('Error creating Square customer:', error);
      console.error('Square API Error Details:', error.errors || error.body);
      throw new Error('Failed to create customer in Square');
    }
  }

  // Get or create customer
  async getOrCreateCustomer(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // If user already has Square customer ID, return it
      if (user.squareCustomerId) {
        const { result } = await this.customersApi.retrieveCustomer(user.squareCustomerId);
        return result.customer;
      }

      // Create new customer
      const customer = await this.createCustomer(user);
      
      // Update user with Square customer ID
      user.squareCustomerId = customer.id;
      await user.save();

      return customer;
    } catch (error) {
      console.error('Error getting/creating customer:', error);
      throw error;
    }
  }

  // Create subscription using Square payments with our own subscription management
  async createSubscription(userId, planId, paymentMethodId) {
    try {
      const customer = await this.getOrCreateCustomer(userId);
      
      // Define production-ready plan configurations
      const planConfigurations = {
        // Use environment variables or fallback to hardcoded IDs
        [process.env.SQUARE_MONTHLY_PLAN_ID || 'monthly']: {
          name: 'Premium Monthly',
          amount: 999, // $9.99
          planType: 'premium_monthly',
          cadence: 'MONTHLY',
          durationDays: 30
        },
        [process.env.SQUARE_YEARLY_PLAN_ID || 'yearly']: {
          name: 'Premium Yearly',
          amount: 9999, // $99.99
          planType: 'premium_yearly',
          cadence: 'ANNUAL',
          durationDays: 365
        }
      };

      const selectedPlan = planConfigurations[planId];
      if (!selectedPlan) {
        throw new Error(`Invalid plan ID: ${planId}. Available plans: ${Object.keys(planConfigurations).join(', ')}`);
      }

      console.log(`Processing subscription for plan: ${selectedPlan.name} ($${(selectedPlan.amount / 100).toFixed(2)})`);

      // Process the initial payment
      const payment = await this.processPayment(
        selectedPlan.amount,
        'USD',
        paymentMethodId,
        customer.id
      );

      if (payment.status !== 'COMPLETED') {
        throw new Error(`Payment failed with status: ${payment.status}`);
      }

      // Convert BigInt to regular number for payment amount
      const paymentAmount = typeof payment.amountMoney.amount === 'bigint' 
        ? Number(payment.amountMoney.amount) 
        : payment.amountMoney.amount;

      console.log(`Payment successful: ${payment.id} - $${(paymentAmount / 100).toFixed(2)}`);

      // Calculate subscription period
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date(currentPeriodStart);
      
      if (selectedPlan.cadence === 'MONTHLY') {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      } else if (selectedPlan.cadence === 'ANNUAL') {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      }

      // Create subscription record in database
      const subscriptionData = {
        userId: userId,
        squareCustomerId: customer.id,
        squarePaymentId: payment.id, // Store the payment ID
        planType: selectedPlan.planType,
        status: 'active',
        currentPeriodStart: currentPeriodStart,
        currentPeriodEnd: currentPeriodEnd,
        paymentMethodId: paymentMethodId,
        amount: selectedPlan.amount, // Use our plan amount, not Square's BigInt
        currency: 'USD',
        nextBillingDate: currentPeriodEnd, // When the next payment is due
        autoRenew: true
      };

      const subscription = await Subscription.findOneAndUpdate(
        { userId: userId },
        subscriptionData,
        { upsert: true, new: true }
      );

      // Update user subscription status
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: subscriptionData.planType,
        premiumAccessUntil: subscriptionData.currentPeriodEnd
      });

      console.log(`Subscription created successfully: ${subscription._id}`);
      console.log(`User premium access until: ${subscriptionData.currentPeriodEnd}`);

      // Create safe return object without BigInt values
      const safePayment = {
        id: payment.id,
        status: payment.status,
        amount: paymentAmount,
        currency: payment.amountMoney.currency
      };

      return { 
        subscription: {
          id: subscription._id,
          status: 'ACTIVE',
          planType: selectedPlan.planType,
          amount: selectedPlan.amount,
          currency: 'USD',
          currentPeriodStart: currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd,
          nextBillingDate: currentPeriodEnd
        }, 
        dbSubscription: subscription,
        payment: safePayment
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId, cancelAtPeriodEnd = true) {
    try {
      const subscription = await Subscription.findOne({ userId });
      if (!subscription || !subscription.squareSubscriptionId) {
        throw new Error('Subscription not found');
      }

      if (cancelAtPeriodEnd) {
        // Cancel at period end
        const { result } = await this.subscriptionsApi.updateSubscription(
          subscription.squareSubscriptionId,
          {
            subscription: {
              version: subscription.version,
              canceledDate: subscription.currentPeriodEnd.toISOString().split('T')[0]
            }
          }
        );
        
        subscription.cancelAtPeriodEnd = true;
        await subscription.save();
        
        return result.subscription;
      } else {
        // Cancel immediately
        const { result } = await this.subscriptionsApi.cancelSubscription(
          subscription.squareSubscriptionId
        );
        
        subscription.status = 'cancelled';
        subscription.currentPeriodEnd = new Date();
        await subscription.save();

        // Update user status
        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: 'cancelled',
          premiumAccessUntil: new Date()
        });
        
        return result.subscription;
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Process payment for one-time purchases
  async processPayment(amount, currency, paymentMethodId, customerId) {
    try {
      const { result } = await this.paymentsApi.createPayment({
        sourceId: paymentMethodId,
        amountMoney: {
          amount: amount,
          currency: currency
        },
        customerId: customerId,
        idempotencyKey: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      return result.payment;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  // Get subscription plans from catalog
  async getSubscriptionPlans() {
    try {
      const { result } = await this.catalogApi.listCatalog(
        undefined,
        'SUBSCRIPTION_PLAN'
      );

      return result.objects || [];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  // Helper method to determine plan type from plan ID and cadence
  determinePlanType(planId, cadence) {
    // First check environment variables
    if (planId === process.env.SQUARE_MONTHLY_PLAN_ID) {
      return 'premium_monthly';
    }
    if (planId === process.env.SQUARE_YEARLY_PLAN_ID) {
      return 'premium_yearly';
    }
    
    // Fallback to cadence-based determination
    if (cadence === 'MONTHLY') {
      return 'premium_monthly';
    } else if (cadence === 'ANNUAL') {
      return 'premium_yearly';
    }
    
    return 'premium_monthly'; // Default fallback
  }

  // Helper method to map plan ID to plan type (legacy support)
  getPlanTypeFromId(planId) {
    const planMapping = {
      [process.env.SQUARE_MONTHLY_PLAN_ID]: 'premium_monthly',
      [process.env.SQUARE_YEARLY_PLAN_ID]: 'premium_yearly',
      // Support for the new plan IDs
      '5CUHOPULR6IYPKFLX3WU2SQW': 'premium_monthly',
      'SUVI7YS7X52XMLH6JSDKPZUC': 'premium_yearly',
      // Legacy plan IDs
      'BKWHGZNOZJ3NAYFHKK3GXWRK': 'premium_monthly',
      'CQF77RXHW5LF6T7ISZ7VWVZ3': 'premium_yearly'
    };
    
    return planMapping[planId] || 'free';
  }

  // Get customer's saved cards
  async getCustomerCards(customerId) {
    try {
      const { result } = await this.customersApi.listCards(customerId);
      
      // Format cards for frontend
      const formattedCards = (result.cards || []).map(card => ({
        id: card.id,
        last4: card.last4,
        cardBrand: card.cardBrand,
        expMonth: card.expMonth,
        expYear: card.expYear,
        cardholderName: card.cardholderName,
        billingAddress: card.billingAddress,
        fingerprint: card.fingerprint,
        enabled: card.enabled,
        referenceId: card.referenceId,
        cardType: card.cardType
      }));

      return formattedCards;
    } catch (error) {
      console.error('Error fetching customer cards:', error);
      throw new Error('Failed to fetch customer cards');
    }
  }

  // Create card on file
  async createCardOnFile(customerId, paymentMethodId, setAsDefault = false) {
    try {
      const { result } = await this.customersApi.createCard(customerId, {
        cardNonce: paymentMethodId,
        billingAddress: {
          addressLine1: '123 Main St',
          locality: 'San Francisco',
          administrativeDistrictLevel1: 'CA',
          postalCode: '94102',
          country: 'US'
        },
        cardholderName: 'Card Holder'
      });

      // If this should be the default card, set it
      if (setAsDefault && result.card) {
        await this.setDefaultCard(customerId, result.card.id);
      }

      return {
        id: result.card.id,
        last4: result.card.last4,
        cardBrand: result.card.cardBrand,
        expMonth: result.card.expMonth,
        expYear: result.card.expYear,
        enabled: result.card.enabled
      };
    } catch (error) {
      console.error('Error creating card on file:', error);
      throw new Error('Failed to save card');
    }
  }

  // Set default card
  async setDefaultCard(customerId, cardId) {
    try {
      // Square doesn't have a direct "set default" API
      // We'll store this preference in our database or use card ordering
      // For now, we'll just return the card info
      const { result } = await this.customersApi.retrieveCard(customerId, cardId);
      return {
        id: result.card.id,
        last4: result.card.last4,
        cardBrand: result.card.cardBrand,
        isDefault: true
      };
    } catch (error) {
      console.error('Error setting default card:', error);
      throw new Error('Failed to set default card');
    }
  }

  // Get default card
  async getDefaultCard(customerId) {
    try {
      const cards = await this.getCustomerCards(customerId);
      // Return the first enabled card as default, or implement your own logic
      return cards.find(card => card.enabled) || null;
    } catch (error) {
      console.error('Error getting default card:', error);
      return null;
    }
  }

  // Delete card
  async deleteCard(customerId, cardId) {
    try {
      await this.customersApi.disableCard(customerId, cardId);
      return true;
    } catch (error) {
      console.error('Error deleting card:', error);
      throw new Error('Failed to remove card');
    }
  }

  // Check if card is in use by active subscription
  async checkCardInUse(customerId, cardId) {
    try {
      // Check if any active subscriptions are using this card
      const Subscription = require('../models/Subscription');
      const activeSubscription = await Subscription.findOne({
        squareCustomerId: customerId,
        paymentMethodId: cardId,
        status: 'active'
      });

      return !!activeSubscription;
    } catch (error) {
      console.error('Error checking card usage:', error);
      return false;
    }
  }

  // Handle webhook events
  async handleWebhookEvent(eventType, eventData) {
    try {
      switch (eventType) {
        case 'subscription.updated':
          await this.handleSubscriptionUpdated(eventData);
          break;
        case 'subscription.canceled':
          await this.handleSubscriptionCanceled(eventData);
          break;
        case 'invoice.payment_made':
          await this.handlePaymentMade(eventData);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(eventData);
          break;
        default:
          console.log(`Unhandled webhook event: ${eventType}`);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  async handleSubscriptionUpdated(eventData) {
    const subscription = eventData.object.subscription;
    const dbSubscription = await Subscription.findOne({ 
      squareSubscriptionId: subscription.id 
    });

    if (dbSubscription) {
      dbSubscription.status = subscription.status.toLowerCase();
      dbSubscription.currentPeriodStart = new Date(subscription.chargedThroughDate);
      
      // Update period end based on plan
      if (dbSubscription.planType.includes('monthly')) {
        dbSubscription.currentPeriodEnd = new Date(dbSubscription.currentPeriodStart);
        dbSubscription.currentPeriodEnd.setMonth(dbSubscription.currentPeriodEnd.getMonth() + 1);
      } else if (dbSubscription.planType.includes('yearly')) {
        dbSubscription.currentPeriodEnd = new Date(dbSubscription.currentPeriodStart);
        dbSubscription.currentPeriodEnd.setFullYear(dbSubscription.currentPeriodEnd.getFullYear() + 1);
      }

      await dbSubscription.save();

      // Update user status
      const user = await User.findById(dbSubscription.userId);
      if (user) {
        user.subscriptionStatus = subscription.status === 'ACTIVE' ? dbSubscription.planType : 'cancelled';
        user.premiumAccessUntil = dbSubscription.currentPeriodEnd;
        await user.save();
      }
    }
  }

  async handleSubscriptionCanceled(eventData) {
    const subscription = eventData.object.subscription;
    const dbSubscription = await Subscription.findOne({ 
      squareSubscriptionId: subscription.id 
    });

    if (dbSubscription) {
      dbSubscription.status = 'cancelled';
      await dbSubscription.save();

      // Update user status
      await User.findByIdAndUpdate(dbSubscription.userId, {
        subscriptionStatus: 'cancelled'
      });
    }
  }

  async handlePaymentMade(eventData) {
    // Handle successful payment
    const invoice = eventData.object.invoice;
    // Update subscription payment date, etc.
  }

  async handlePaymentFailed(eventData) {
    // Handle failed payment
    const invoice = eventData.object.invoice;
    // Update subscription status, send notifications, etc.
  }
}

module.exports = new SquareService();
