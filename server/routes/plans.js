const express = require('express');
const {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getPopularPlans,
  searchPlans,
  getPlansByCategory,
  checkPlanAvailability
} = require('../controllers/planController');
const { authenticateToken, adminOnly, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Public routes (with optional authentication for personalization)
router.get('/', optionalAuth, getAllPlans);
router.get('/popular', getPopularPlans);
router.get('/search', optionalAuth, searchPlans);
router.get('/category/:category', getPlansByCategory);
router.get('/:id', getPlanById);
router.post('/check-availability', checkPlanAvailability);

// Admin only routes
router.use(authenticateToken);
router.post('/', adminOnly, createPlan);
router.put('/:id', adminOnly, updatePlan);
router.delete('/:id', adminOnly, deletePlan);

module.exports = router;