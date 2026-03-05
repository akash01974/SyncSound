const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'joined_room',
            'left_room',
            'created_room',
            'played_song',
            'created_playlist',
            'added_song',
            'became_friends',
            'signed_up'
        ],
        required: true
    },
    details: {
        roomName: String,
        songTitle: String,
        songArtist: String,
        playlistName: String,
        friendName: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800 // Auto-delete after 7 days
    }
});

activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
