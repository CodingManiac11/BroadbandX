const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const emailService = require('../services/emailService');

// @desc    Send payment reminder email
// @route   POST /api/notifications/payment-reminder/:userId
// @access  Private/Admin
exports.sendPaymentReminder = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const subscription = await Subscription.findOne({ user: user._id });
  if (!subscription) {
    throw new ErrorResponse('No active subscription found', 404);
  }

  // Send payment reminder email
  await emailService.sendPaymentReminder(user.email, {
    customerName: user.firstName,
    amount: subscription.currentBillingAmount,
    dueDate: subscription.nextBillingDate,
    planName: subscription.plan.name,
  });

  res.status(200).json({
    success: true,
    message: 'Payment reminder email sent successfully',
  });
});

// @desc    Send service update email
// @route   POST /api/notifications/service-update
// @access  Private/Admin
exports.sendServiceUpdate = asyncHandler(async (req, res) => {
  const { subject, message, date, time, duration, affectedUsers } = req.body;

  if (!message || !date || !time) {
    throw new ErrorResponse('Please provide message, date and time for the service update', 400);
  }

  let users;
  if (affectedUsers && affectedUsers.length > 0) {
    users = await User.find({ _id: { $in: affectedUsers } });
  } else {
    users = await User.find({ role: 'customer', 'notifications.email': true });
  }

  const emailPromises = users.map(user => 
    emailService.sendServiceUpdate(user.email, {
      customerName: user.firstName,
      subject,
      message,
      date,
      time,
      duration,
    })
  );

  await Promise.all(emailPromises);

  res.status(200).json({
    success: true,
    message: `Service update email sent to ${users.length} users`,
  });
});

// @desc    Send usage alert email
// @route   POST /api/notifications/usage-alert/:userId
// @access  Private
exports.sendUsageAlert = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const subscription = await Subscription.findOne({ user: user._id });
  if (!subscription) {
    throw new ErrorResponse('No active subscription found', 404);
  }

  const {
    currentUsage,
    monthlyLimit,
    usagePercentage,
    remainingData,
    daysLeft,
  } = req.body;

  await emailService.sendUsageAlert(user.email, {
    customerName: user.firstName,
    currentUsage,
    monthlyLimit,
    usagePercentage,
    remainingData,
    daysLeft,
  });

  res.status(200).json({
    success: true,
    message: 'Usage alert email sent successfully',
  });
});

// @desc    Send welcome email
// @route   POST /api/notifications/welcome/:userId
// @access  Private/Admin
exports.sendWelcomeEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  const subscription = await Subscription.findOne({ user: user._id });
  if (!subscription) {
    throw new ErrorResponse('No active subscription found', 404);
  }

  await emailService.sendWelcomeEmail(user.email, {
    customerName: user.firstName,
    planName: subscription.plan.name,
    speed: subscription.plan.speed,
    data: subscription.plan.data,
    installationDate: subscription.startDate,
  });

  res.status(200).json({
    success: true,
    message: 'Welcome email sent successfully',
  });
});

// @desc    Send ticket update email
// @route   POST /api/notifications/ticket-update/:ticketId
// @access  Private
exports.sendTicketUpdateEmail = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const { customerEmail, customerName, ticketNumber, status, message } = req.body;

  await emailService.sendTicketUpdate(customerEmail, {
    customerName,
    ticketNumber,
    ticketId,
    status,
    message,
    updateTime: new Date().toLocaleString(),
  });

  res.status(200).json({
    success: true,
    message: 'Ticket update email sent successfully',
  });
});