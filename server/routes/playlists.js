const express = require('express');
const Playlist = require('../models/Playlist');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/playlists - Create playlist
router.post('/', auth, async (req, res) => {
    try {
        const { name, isShared } = req.body;

        const playlist = new Playlist({
            name: name || 'My Playlist',
            creator: req.user.id,
            isShared: isShared || false
        });

        await playlist.save();
        await playlist.populate('creator', 'username avatar');

        await Activity.create({
            user: req.user.id,
            type: 'created_playlist',
            details: { playlistName: playlist.name }
        });

        res.status(201).json(playlist);
    } catch (error) {
        console.error('Create playlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/playlists - User's playlists
router.get('/', auth, async (req, res) => {
    try {
        const playlists = await Playlist.find({
            $or: [
                { creator: req.user.id },
                { collaborators: req.user.id }
            ]
        })
            .populate('creator', 'username avatar')
            .populate('collaborators', 'username avatar')
            .sort({ updatedAt: -1 });

        res.json(playlists);
    } catch (error) {
        console.error('Get playlists error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/playlists/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate('creator', 'username avatar')
            .populate('collaborators', 'username avatar')
            .populate('songs.addedBy', 'username avatar');

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        res.json(playlist);
    } catch (error) {
        console.error('Get playlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/playlists/:id/songs - Add song
router.post('/:id/songs', auth, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        const isCreator = playlist.creator.toString() === req.user.id;
        const isCollaborator = playlist.collaborators.some(c => c.toString() === req.user.id);

        if (!isCreator && !isCollaborator) {
            return res.status(403).json({ message: 'Not authorized to add songs' });
        }

        const { title, artist, album, cover, url, duration } = req.body;

        playlist.songs.push({
            title,
            artist: artist || 'Unknown Artist',
            album: album || '',
            cover: cover || '',
            url: url || '',
            duration: duration || 0,
            addedBy: req.user.id
        });

        await playlist.save();
        await playlist.populate('songs.addedBy', 'username avatar');

        await Activity.create({
            user: req.user.id,
            type: 'added_song',
            details: { songTitle: title, playlistName: playlist.name }
        });

        res.json(playlist);
    } catch (error) {
        console.error('Add song error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/playlists/:id/songs/:songIndex - Remove song
router.delete('/:id/songs/:songIndex', auth, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        const isCreator = playlist.creator.toString() === req.user.id;
        if (!isCreator) {
            return res.status(403).json({ message: 'Only creator can remove songs' });
        }

        const index = parseInt(req.params.songIndex);
        if (index < 0 || index >= playlist.songs.length) {
            return res.status(400).json({ message: 'Invalid song index' });
        }

        playlist.songs.splice(index, 1);
        await playlist.save();

        res.json(playlist);
    } catch (error) {
        console.error('Remove song error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/playlists/:id/collaborators - Add collaborator
router.post('/:id/collaborators', auth, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        if (playlist.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only creator can add collaborators' });
        }

        const { userId } = req.body;

        if (playlist.collaborators.includes(userId)) {
            return res.status(400).json({ message: 'User is already a collaborator' });
        }

        playlist.collaborators.push(userId);
        playlist.isShared = true;
        await playlist.save();

        await playlist.populate('collaborators', 'username avatar');

        res.json(playlist);
    } catch (error) {
        console.error('Add collaborator error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/playlists/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        if (playlist.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only creator can delete playlist' });
        }

        await Playlist.findByIdAndDelete(req.params.id);

        res.json({ message: 'Playlist deleted' });
    } catch (error) {
        console.error('Delete playlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
