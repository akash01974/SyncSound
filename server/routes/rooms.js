const express = require('express');
const Room = require('../models/Room');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/rooms - Create room
router.post('/', auth, async (req, res) => {
    try {
        const { name } = req.body;

        const room = new Room({
            name: name || `${req.user.username}'s Room`,
            host: req.user.id,
            participants: [req.user.id]
        });

        await room.save();
        await room.populate('host', 'username avatar');
        await room.populate('participants', 'username avatar isOnline');

        await Activity.create({
            user: req.user.id,
            type: 'created_room',
            details: { roomName: room.name }
        });

        res.status(201).json(room);
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/rooms - List active rooms
router.get('/', auth, async (req, res) => {
    try {
        const rooms = await Room.find({ isActive: true })
            .populate('host', 'username avatar')
            .populate('participants', 'username avatar isOnline')
            .sort({ createdAt: -1 });

        res.json(rooms);
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/rooms/:id - Room details
router.get('/:id', auth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('host', 'username avatar')
            .populate('participants', 'username avatar isOnline')
            .populate('playlist.addedBy', 'username avatar');

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json(room);
    } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/rooms/:id - Close room
router.delete('/:id', auth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.host.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the host can close the room' });
        }

        room.isActive = false;
        room.participants = [];
        await room.save();

        res.json({ message: 'Room closed' });
    } catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
