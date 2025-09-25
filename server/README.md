# BroadbandX Subscription Management System - Backend

A comprehensive MERN stack backend for managing broadband subscription services with advanced analytics, AI-powered recommendations, and role-based access control.

## 🚀 Features

### Core Functionality
- **User Management**: Customer and admin authentication with JWT tokens
- **Plan Management**: CRUD operations for broadband plans with pricing tiers
- **Subscription Management**: Complete subscription lifecycle with upgrade/downgrade
- **Usage Analytics**: Detailed tracking of customer usage patterns
- **AI Recommendations**: Personalized plan suggestions based on usage data
- **Admin Dashboard**: Comprehensive analytics and user management tools

### Technical Features
- **Authentication**: JWT-based with refresh tokens and role-based access
- **Security**: Rate limiting, input validation, password hashing, CORS protection
- **Database**: MongoDB with Mongoose ODM and optimized indexes
- **API Design**: RESTful endpoints with comprehensive error handling
- **Monitoring**: Request logging and performance tracking

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- npm or yarn package manager

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Setup environment file
npm run setup

# Edit .env file with your configuration
# Update MongoDB URI, JWT secrets, and other service credentials
```

### 3. Database Setup

```bash
# Seed database with sample data
npm run seed

# Or setup everything (env + seed)
npm run setup-dev
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 🗂️ Project Structure

```
server/
├── controllers/          # Business logic controllers
│   ├── authController.js       # Authentication & user registration
│   ├── planController.js       # Broadband plan management
│   ├── subscriptionController.js # Subscription lifecycle
│   ├── adminController.js      # Admin dashboard & analytics
│   ├── recommendationController.js # AI recommendations
│   └── userController.js       # User profile management
├── middleware/           # Custom middleware
│   └── auth.js                 # JWT authentication & authorization
├── models/              # MongoDB schemas
│   ├── User.js                 # User accounts & profiles
│   ├── Plan.js                 # Broadband plans & pricing
│   ├── Subscription.js         # Customer subscriptions
│   └── UsageAnalytics.js       # Usage tracking & analytics
├── routes/              # API route definitions
│   ├── auth.js                 # Authentication routes
│   ├── plans.js                # Plan management routes
│   ├── subscriptions.js        # Subscription routes
│   ├── admin.js                # Admin dashboard routes
│   ├── recommendations.js      # Recommendation routes
│   └── users.js                # User profile routes
├── scripts/             # Utility scripts
│   ├── seedData.js             # Database seeding
│   └── setupEnv.js             # Environment setup
├── .env.example         # Environment variables template
├── package.json         # Dependencies & scripts
└── server.js           # Main application entry point
```

## 🔐 Authentication

### User Roles
- **Customer**: Access to personal subscriptions, plans, and usage data
- **Admin**: Full system access including user management and analytics

### Sample Credentials (after seeding)
```
Admin: adityautsav1901@gmail.com / admin
Customer: john.doe@email.com / customer123
Customer: jane.smith@email.com / customer123
Customer: mike.johnson@email.com / customer123
```

## 🌐 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `POST /logout` - User logout
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset confirmation

### Plan Routes (`/api/plans`)
- `GET /` - List all plans with filtering
- `GET /:id` - Get specific plan details
- `POST /` - Create new plan (admin only)
- `PUT /:id` - Update plan (admin only)
- `DELETE /:id` - Delete plan (admin only)

### Subscription Routes (`/api/subscriptions`)
- `GET /` - List user subscriptions
- `POST /` - Create new subscription
- `GET /:id` - Get subscription details
- `PUT /:id/upgrade` - Upgrade subscription
- `PUT /:id/downgrade` - Downgrade subscription
- `DELETE /:id` - Cancel subscription

### Admin Routes (`/api/admin`)
- `GET /dashboard` - Dashboard analytics
- `GET /users` - User management
- `GET /subscriptions` - All subscriptions
- `GET /analytics` - Advanced analytics
- `PUT /users/:id/status` - Update user status

### User Routes (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `GET /subscriptions` - User's subscriptions
- `GET /usage` - Usage analytics
- `DELETE /account` - Delete user account

### Recommendation Routes (`/api/recommendations`)
- `GET /` - Get personalized recommendations
- `POST /feedback` - Submit recommendation feedback

## 📊 Data Models

### User Schema
- Personal information and contact details
- Authentication credentials with security features
- Role-based access control
- Account status and verification

### Plan Schema
- Broadband plan details (speed, data limits, pricing)
- Technical specifications and availability
- Feature lists and target audience
- Popularity metrics for recommendations

### Subscription Schema
- User-plan relationship management
- Billing and payment tracking
- Service history and status changes
- Installation and technical details

### Usage Analytics Schema
- Daily usage tracking and metrics
- Speed test results and quality metrics
- Application-specific usage patterns
- Network condition analysis

## 🔧 Configuration

### Environment Variables
```bash
# Application
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 🚦 API Usage Examples

### Customer Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'
```

### Get Available Plans
```bash
curl -X GET http://localhost:5000/api/plans \
  -H "Authorization: Bearer your_jwt_token"
```

### Create Subscription
```bash
curl -X POST http://localhost:5000/api/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "planId": "plan_id_here",
    "billingCycle": "monthly"
  }'
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test with specific environment
NODE_ENV=test npm test
```

## 📈 Monitoring & Analytics

The system includes comprehensive analytics tracking:
- User engagement metrics
- Subscription lifecycle analytics
- Usage pattern analysis
- Recommendation effectiveness
- System performance monitoring

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Account lockout on failed attempts

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production` in environment
2. Configure MongoDB Atlas production cluster
3. Set secure JWT secrets
4. Configure email service for notifications
5. Set up monitoring and logging
6. Configure reverse proxy (nginx)
7. Set up SSL certificates

### Performance Optimization
- Database indexing for frequent queries
- Caching strategies for static data
- Request compression
- Connection pooling
- Query optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Email: adityautsav1901@gmail.com
- Documentation: [Project Wiki]
- Issues: [GitHub Issues]

## 🎯 Roadmap

- [ ] Payment gateway integration (Stripe)
- [ ] SMS notifications (Twilio)
- [ ] Advanced ML recommendations
- [ ] Real-time analytics dashboard
- [ ] Mobile app API extensions
- [ ] Multi-tenant architecture
- [ ] Advanced reporting tools