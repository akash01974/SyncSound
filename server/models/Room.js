const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    currentSong: {
        title: { type: String, default: '' },
        artist: { type: String, default: '' },
        album: { type: String, default: '' },
        cover: { type: String, default: '' },
        url: { type: String, default: '' },
        duration: { type: Number, default: 0 }
    },
    isPlaying: {
        type: Boolean,
        default: false
    },
    playbackPosition: {
        type: Number,
        default: 0
    },
    playbackStartedAt: {
        type: Date,
        default: null
    },
    playlist: [{
        title: String,
        artist: String,
        album: String,
        cover: String,
        url: String,
        duration: Number,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    votes: {
        type: Map,
        of: Number,
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true
    },
    maxParticipants: {
        type: Number,
        default: 20
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Room', roomSchema);
