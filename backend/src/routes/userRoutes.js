const express = require('express');
const { requireAuth, checkRole } = require('../middlewares/authMiddleware');
const { sensitiveLimiter } = require('../middlewares/rateLimit');
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getClubData,
  patchProfile,
  getPublicProfile
} = require('../controllers/userController');

const router = express.Router();

router.use(requireAuth);

router.patch('/me', patchProfile);

router.get('/all', checkRole(['head', 'admin']), getAllUsers);

router.put('/role', sensitiveLimiter, checkRole(['head', 'admin']), updateUserRole);

router.delete('/by-email/:email', sensitiveLimiter, checkRole(['head']), deleteUser);

router.get('/club-data', checkRole(['head', 'admin', 'member']), getClubData);

router.get(
  '/public-profile',
  checkRole(['head', 'admin', 'member', 'guest', 'customer']),
  getPublicProfile
);

module.exports = router;
