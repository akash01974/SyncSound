const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    songs: [{
        title: { type: String, required: true },
        artist: { type: String, default: 'Unknown Artist' },
        album: { type: String, default: '' },
        cover: { type: String, default: '' },
        url: { type: String, required: true },
        duration: { type: Number, default: 0 },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isShared: {
        type: Boolean,
        default: false
    },
    cover: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Playlist', playlistSchema);
