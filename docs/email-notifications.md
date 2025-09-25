# Email Notification System

The BroadbandX platform includes a comprehensive email notification system that keeps users informed about important updates and events.

## Email Notification Types

1. **Support Ticket Notifications**
   - Ticket creation confirmation
   - Status updates
   - New message notifications
   - Resolution notifications

2. **Payment Notifications**
   - Payment reminders
   - Payment confirmation
   - Invoice notifications
   - Subscription renewal reminders

3. **Service Updates**
   - Maintenance notifications
   - Service outage alerts
   - Network upgrades information
   - Service restoration updates

4. **Usage Alerts**
   - Data usage threshold notifications
   - Bandwidth limit warnings
   - Peak usage alerts
   - Monthly usage summaries

5. **Account Notifications**
   - Welcome emails
   - Account verification
   - Password reset
   - Profile updates

## Configuration

Email notifications can be configured in the `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="BroadbandX" <noreply@broadbandx.com>

# Notification Settings
ENABLE_EMAIL_NOTIFICATIONS=true
```

## Usage

### Sending Notifications

```javascript
// Send payment reminder
await emailService.sendPaymentReminder(userEmail, {
  customerName: 'John Doe',
  amount: 49.99,
  dueDate: '2024-10-01',
  planName: 'Premium'
});

// Send service update
await emailService.sendServiceUpdate(userEmail, {
  customerName: 'John Doe',
  message: 'Scheduled maintenance',
  date: '2024-10-01',
  time: '02:00 AM',
  duration: '2 hours'
});
```

### User Preferences

Users can manage their notification preferences through their account settings:
- Email notifications
- Notification frequency
- Types of notifications

## Email Templates

All email templates use responsive HTML design and are tested across major email clients. Templates include:
- Professional branding
- Clear call-to-actions
- Responsive design
- Accessible formatting