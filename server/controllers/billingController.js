const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Billing = require('../models/Billing');
const billingService = require('../services/billingService');

// @desc    Get all invoices for a user
// @route   GET /api/billing/invoices/:userId
// @access  Private
exports.getUserInvoices = asyncHandler(async (req, res) => {
  const invoices = await Billing.find({ user: req.params.userId })
    .sort('-createdAt')
    .populate('subscription', 'plan.name');

  res.status(200).json({
    success: true,
    count: invoices.length,
    data: invoices
  });
});

// @desc    Get single invoice
// @route   GET /api/billing/invoice/:id
// @access  Private
exports.getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Billing.findById(req.params.id)
    .populate('user', 'firstName lastName email address')
    .populate('subscription', 'plan.name');

  if (!invoice) {
    throw new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404);
  }

  // Check if user owns the invoice or is admin
  if (invoice.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new ErrorResponse('Not authorized to access this invoice', 403);
  }

  res.status(200).json({
    success: true,
    data: invoice
  });
});

// @desc    Download invoice PDF
// @route   GET /api/billing/invoice/:id/pdf
// @access  Private
exports.downloadInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await Billing.findById(req.params.id);

  if (!invoice) {
    throw new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404);
  }

  // Check if user owns the invoice or is admin
  if (invoice.user.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new ErrorResponse('Not authorized to access this invoice', 403);
  }

  if (!invoice.invoicePdf) {
    // Generate PDF if not already generated
    const pdfPath = await billingService.generateInvoice(invoice);
    invoice.invoicePdf = pdfPath;
    await invoice.save();
  }

  res.download(invoice.invoicePdf);
});

// @desc    Process payment for an invoice
// @route   POST /api/billing/invoice/:id/pay
// @access  Private
exports.processPayment = asyncHandler(async (req, res) => {
  const invoice = await Billing.findById(req.params.id);

  if (!invoice) {
    throw new ErrorResponse(`Invoice not found with id of ${req.params.id}`, 404);
  }

  if (invoice.status === 'paid') {
    throw new ErrorResponse('Invoice has already been paid', 400);
  }

  const paymentIntent = await billingService.processPayment(invoice.id);

  res.status(200).json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret
    }
  });
});

// @desc    Handle webhook from payment provider
// @route   POST /api/billing/webhook
// @access  Public
exports.handlePaymentWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new ErrorResponse(`Webhook Error: ${err.message}`, 400);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await billingService.handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      // Handle failed payment
      console.log('Payment failed:', event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// @desc    Update payment method
// @route   PUT /api/billing/payment-method
// @access  Private
exports.updatePaymentMethod = asyncHandler(async (req, res) => {
  const { paymentMethodId } = req.body;

  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: req.user.stripeCustomerId,
  });

  // Set as default payment method
  await stripe.customers.update(req.user.stripeCustomerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Payment method updated successfully'
  });
});

// @desc    Get billing overview (for dashboard)
// @route   GET /api/billing/overview/:userId
// @access  Private
exports.getBillingOverview = asyncHandler(async (req, res) => {
  // Get payment history
  const invoices = await Billing.find({ user: req.params.userId })
    .sort('-createdAt')
    .limit(5);

  // Get upcoming invoice
  const upcomingInvoice = await Billing.findOne({
    user: req.params.userId,
    status: 'pending',
    dueDate: { $gt: new Date() }
  }).sort('dueDate');

  // Get payment statistics
  const stats = await Billing.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: null,
        totalPaid: {
          $sum: {
            $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0]
          }
        },
        totalPending: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$total', 0]
          }
        },
        totalOverdue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'overdue'] }, '$total', 0]
          }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      recentInvoices: invoices,
      upcomingInvoice,
      stats: stats[0] || {
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0
      }
    }
  });
});