const express = require('express');
const Activity = require('../models/Activity');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/activities - Activity feed for user + friends
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const friendIds = user.friends || [];
        const userIds = [req.user.id, ...friendIds];

        const activities = await Activity.find({ user: { $in: userIds } })
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(activities);
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
