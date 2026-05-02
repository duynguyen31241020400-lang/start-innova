const express = require('express');
const { requireAuth, checkRole } = require('../middlewares/authMiddleware');
const { rsvpEvent, cancelRsvp, myRsvpIds } = require('../controllers/eventRsvpController');

const router = express.Router();

router.use(requireAuth);

router.get('/rsvp-ids', checkRole(['head', 'admin', 'member']), myRsvpIds);
router.post('/:eventId/rsvp', checkRole(['head', 'admin', 'member']), rsvpEvent);
router.delete('/:eventId/rsvp', checkRole(['head', 'admin', 'member']), cancelRsvp);

module.exports = router;
