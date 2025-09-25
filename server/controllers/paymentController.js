const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Plan = require('../models/Plan');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { asyncHandler } = require('../middleware/errorHandler');

const createPaymentIntent = asyncHandler(async (req, res) => {
  const { planId, billingCycle } = req.body;
  const userId = req.user._id;

  console.log('Creating payment intent for:', { planId, billingCycle, userId });

  // Validate Stripe configuration
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your-stripe-secret-key')) {
    console.error('Stripe secret key not configured properly');
    return res.status(500).json({
      status: 'error',
      message: 'Payment system not configured. Please contact administrator.'
    });
  }

  // Get the plan details
  const plan = await Plan.findById(planId);
  if (!plan) {
    return res.status(404).json({
      status: 'error',
      message: 'Plan not found'
    });
  }

  // Calculate the amount based on billing cycle
  const amount = billingCycle === 'yearly'
    ? plan.pricing.yearly * 100 // Convert to cents
    : plan.pricing.monthly * 100;

  console.log('Payment amount calculated:', { amount, currency: 'inr' });

  try {
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'inr',
      metadata: {
        userId: userId.toString(),
        planId: planId,
        billingCycle
      }
    });

    console.log('Payment intent created successfully:', paymentIntent.id);

    res.json({
      status: 'success',
      data: {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Stripe error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    });
    res.status(500).json({
      status: 'error',
      message: 'Failed to create payment intent: ' + error.message
    });
  }
});

const handlePaymentSuccess = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    // Retrieve the payment intent to get metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const { userId, planId, billingCycle } = paymentIntent.metadata;

    // Create or update subscription
    const subscription = await Subscription.create({
      user: userId,
      plan: planId,
      billingCycle,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
    });

    res.json({
      status: 'success',
      data: { subscription }
    });
  } catch (error) {
    console.error('Error handling payment success:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process subscription'
    });
  }
});

const getPaymentMethods = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user.stripeCustomerId) {
      return res.json({
        status: 'success',
        data: { paymentMethods: [] }
      });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card'
    });

    res.json({
      status: 'success',
      data: { paymentMethods: paymentMethods.data }
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payment methods'
    });
  }
});

const addPaymentMethod = asyncHandler(async (req, res) => {
  const { paymentMethodId } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user.stripeCustomerId) {
      // Create a new customer if they don't have one
      const customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    } else {
      // Attach the payment method to existing customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId,
      });
    }

    res.json({
      status: 'success',
      message: 'Payment method added successfully'
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add payment method'
    });
  }
});

const deletePaymentMethod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user.stripeCustomerId) {
      return res.status(404).json({
        status: 'error',
        message: 'No payment methods found'
      });
    }

    await stripe.paymentMethods.detach(id);

    res.json({
      status: 'success',
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete payment method'
    });
  }
});

module.exports = {
  createPaymentIntent,
  handlePaymentSuccess,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod
};