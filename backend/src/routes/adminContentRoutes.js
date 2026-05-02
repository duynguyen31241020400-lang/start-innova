const express = require('express');
const { requireAuth, checkRole } = require('../middlewares/authMiddleware');
const { sensitiveLimiter, broadcastLimiter } = require('../middlewares/rateLimit');
const content = require('../controllers/contentController');

const router = express.Router();

router.use(requireAuth);
router.use(checkRole(['head', 'admin']));
router.use(sensitiveLimiter);

router.get('/events', content.getAdminEvents);
router.post('/events', content.upsertEvent);
router.put('/events/:id', content.upsertEvent);
router.delete('/events/:id', content.deleteEvent);

router.get('/announcements', content.getAdminAnnouncements);
router.post('/announcements', content.upsertAnnouncement);
router.put('/announcements/:id', content.upsertAnnouncement);
router.delete('/announcements/:id', content.deleteAnnouncement);

router.get('/projects', content.getAdminProjects);
router.post('/projects', content.upsertProject);
router.put('/projects/:id', content.upsertProject);
router.delete('/projects/:id', content.deleteProject);

router.get('/partners', content.getAdminPartners);
router.post('/partners', content.upsertPartner);
router.put('/partners/:id', content.upsertPartner);
router.delete('/partners/:id', content.deletePartner);

router.get('/posts', content.getAdminPosts);
router.post('/posts', content.upsertPost);
router.put('/posts/:id', content.upsertPost);
router.delete('/posts/:id', content.deletePost);

router.get('/audit-log', checkRole(['head']), content.listAdminActions);

router.post('/broadcast', broadcastLimiter, checkRole(['head', 'admin']), content.sendBroadcast);

module.exports = router;
