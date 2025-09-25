const PDFDocument = require('pdfkit');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');
const Billing = require('../models/Billing');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const emailService = require('./emailService');

class BillingService {
  constructor() {
    this.stripe = stripe;
  }

  async generateInvoice(billing) {
    const doc = new PDFDocument();
    const filePath = path.join(__dirname, `../uploads/invoices/${billing.invoiceNumber}.pdf`);
    
    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(filePath));

    // Add company logo
    doc.image(path.join(__dirname, '../assets/logo.png'), 50, 45, { width: 150 });

    // Add company details
    doc.fontSize(10)
       .text('BroadbandX', 200, 50)
       .text('123 Internet Street')
       .text('Tech City, TC 12345')
       .text('Phone: (555) 123-4567')
       .text('Email: billing@broadbandx.com');

    // Add invoice details
    doc.fontSize(20)
       .text('INVOICE', 50, 200)
       .fontSize(10)
       .text(`Invoice Number: ${billing.invoiceNumber}`, 50, 230)
       .text(`Date: ${billing.createdAt.toLocaleDateString()}`, 50, 245)
       .text(`Due Date: ${billing.dueDate.toLocaleDateString()}`, 50, 260);

    // Add customer details
    const user = await User.findById(billing.user);
    doc.text('Bill To:', 300, 230)
       .text(user.firstName + ' ' + user.lastName)
       .text(user.address)
       .text(user.email);

    // Add billing items table
    let yPos = 350;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    yPos += 20;
    
    // Table headers
    doc.text('Description', 50, yPos)
       .text('Quantity', 300, yPos)
       .text('Amount', 400, yPos)
       .text('Total', 500, yPos);
    
    yPos += 20;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    yPos += 20;

    // Add items
    billing.items.forEach(item => {
      doc.text(item.description, 50, yPos)
         .text(item.quantity.toString(), 300, yPos)
         .text(item.amount.toFixed(2), 400, yPos)
         .text(item.total.toFixed(2), 500, yPos);
      yPos += 20;
    });

    // Add totals
    yPos += 20;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    yPos += 20;

    doc.text('Subtotal:', 400, yPos)
       .text(billing.subtotal.toFixed(2), 500, yPos);
    yPos += 20;

    doc.text('Tax:', 400, yPos)
       .text(billing.tax.toFixed(2), 500, yPos);
    yPos += 20;

    if (billing.discount > 0) {
      doc.text('Discount:', 400, yPos)
         .text(`-${billing.discount.toFixed(2)}`, 500, yPos);
      yPos += 20;
    }

    doc.fontSize(12)
       .text('Total:', 400, yPos)
       .text(billing.total.toFixed(2), 500, yPos);

    // Add payment details
    yPos += 40;
    doc.fontSize(10)
       .text('Payment Details:', 50, yPos)
       .text(`Method: ${billing.paymentMethod.type}`, 50, yPos + 15)
       .text(`Status: ${billing.status}`, 50, yPos + 30);

    // Add footer
    doc.fontSize(8)
       .text('Thank you for your business!', 50, 700)
       .text('Payment is due within 30 days.', 50, 715)
       .text('For questions about this invoice, please contact billing@broadbandx.com', 50, 730);

    // Finalize PDF
    doc.end();

    return filePath;
  }

  async processPayment(billingId) {
    const billing = await Billing.findById(billingId);
    if (!billing) {
      throw new Error('Billing record not found');
    }

    try {
      // Create payment intent with Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(billing.total * 100), // Convert to cents
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          billingId: billing.id,
          invoiceNumber: billing.invoiceNumber
        }
      });

      // Update billing record with payment intent
      billing.metadata.set('paymentIntentId', paymentIntent.id);
      await billing.save();

      return paymentIntent;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw new Error('Failed to process payment');
    }
  }

  async handlePaymentSuccess(paymentIntent) {
    const billingId = paymentIntent.metadata.billingId;
    const billing = await Billing.findById(billingId);

    if (!billing) {
      throw new Error('Billing record not found');
    }

    // Update billing status
    billing.status = 'paid';
    billing.paymentDate = new Date();
    billing.transactionId = paymentIntent.id;
    await billing.save();

    // Send payment confirmation email
    const user = await User.findById(billing.user);
    await emailService.sendPaymentConfirmation(user.email, {
      customerName: user.firstName,
      invoiceNumber: billing.invoiceNumber,
      amount: billing.total,
      paymentDate: billing.paymentDate
    });

    return billing;
  }

  async generateMonthlyInvoices() {
    const subscriptions = await Subscription.find({ status: 'active' });

    for (const subscription of subscriptions) {
      try {
        // Calculate billing period
        const today = new Date();
        const billingPeriod = {
          start: new Date(today.getFullYear(), today.getMonth(), 1),
          end: new Date(today.getFullYear(), today.getMonth() + 1, 0)
        };

        // Create billing record
        const billing = await Billing.create({
          user: subscription.user,
          subscription: subscription._id,
          amount: subscription.plan.price,
          dueDate: new Date(today.getFullYear(), today.getMonth(), 15), // Due on 15th
          billingPeriod,
          items: [{
            description: `${subscription.plan.name} - Monthly Subscription`,
            amount: subscription.plan.price,
            quantity: 1,
            total: subscription.plan.price
          }],
          subtotal: subscription.plan.price,
          tax: subscription.plan.price * 0.1, // 10% tax
          total: subscription.plan.price * 1.1,
          paymentMethod: {
            type: subscription.paymentMethod.type,
            last4: subscription.paymentMethod.last4,
            cardBrand: subscription.paymentMethod.cardBrand
          }
        });

        // Generate PDF invoice
        const pdfPath = await this.generateInvoice(billing);
        billing.invoicePdf = pdfPath;
        await billing.save();

        // Send invoice email
        const user = await User.findById(subscription.user);
        await emailService.sendInvoice(user.email, {
          customerName: user.firstName,
          invoiceNumber: billing.invoiceNumber,
          amount: billing.total,
          dueDate: billing.dueDate,
          pdfPath
        });
      } catch (error) {
        console.error(`Failed to generate invoice for subscription ${subscription._id}:`, error);
      }
    }
  }

  async sendPaymentReminders() {
    const dueBillings = await Billing.find({
      status: 'pending',
      dueDate: {
        $lt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days before due
        $gt: new Date()
      }
    }).populate('user');

    for (const billing of dueBillings) {
      if (!billing.remindersSent.includes(new Date().toDateString())) {
        await emailService.sendPaymentReminder(billing.user.email, {
          customerName: billing.user.firstName,
          invoiceNumber: billing.invoiceNumber,
          amount: billing.total,
          dueDate: billing.dueDate
        });

        billing.remindersSent.push(new Date());
        await billing.save();
      }
    }
  }
}

module.exports = new BillingService();