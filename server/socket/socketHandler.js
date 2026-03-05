const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const User = require('../models/User');
const Activity = require('../models/Activity');

const JWT_SECRET = process.env.JWT_SECRET || 'syncsound_secret_key_2024';

module.exports = (io) => {
    // Auth middleware for socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.userId = decoded.id;
            socket.username = decoded.username;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket) => {
        console.log(`User connected: ${socket.username} (${socket.userId})`);

        // Mark user as online
        await User.findByIdAndUpdate(socket.userId, { isOnline: true });

        // Notify friends that user is online
        const user = await User.findById(socket.userId).populate('friends');
        if (user && user.friends) {
            user.friends.forEach(friend => {
                io.to(`user_${friend._id}`).emit('friendOnline', {
                    userId: socket.userId,
                    username: socket.username
                });
            });
        }

        // Join personal channel for DMs and notifications
        socket.join(`user_${socket.userId}`);

        // ==================== ROOM EVENTS ====================

        socket.on('joinRoom', async ({ roomId }) => {
            try {
                const room = await Room.findById(roomId);
                if (!room || !room.isActive) {
                    return socket.emit('error', { message: 'Room not found or inactive' });
                }

                // Leave any current room
                if (socket.currentRoom) {
                    socket.leave(`room_${socket.currentRoom}`);
                    await Room.findByIdAndUpdate(socket.currentRoom, {
                        $pull: { participants: socket.userId }
                    });
                    io.to(`room_${socket.currentRoom}`).emit('userLeft', {
                        userId: socket.userId,
                        username: socket.username
                    });
                }

                // Join new room
                socket.join(`room_${roomId}`);
                socket.currentRoom = roomId;

                if (!room.participants.includes(socket.userId)) {
                    room.participants.push(socket.userId);
                    await room.save();
                }

                await User.findByIdAndUpdate(socket.userId, { currentRoom: roomId });

                const updatedRoom = await Room.findById(roomId)
                    .populate('host', 'username avatar')
                    .populate('participants', 'username avatar isOnline');

                // Send current state to the joiner
                socket.emit('roomState', {
                    room: updatedRoom,
                    currentSong: room.currentSong,
                    isPlaying: room.isPlaying,
                    playbackPosition: room.isPlaying && room.playbackStartedAt
                        ? room.playbackPosition + (Date.now() - room.playbackStartedAt.getTime()) / 1000
                        : room.playbackPosition
                });

                // Notify others in the room
                socket.to(`room_${roomId}`).emit('userJoined', {
                    userId: socket.userId,
                    username: socket.username,
                    participants: updatedRoom.participants
                });

                await Activity.create({
                    user: socket.userId,
                    type: 'joined_room',
                    details: { roomName: room.name }
                });
            } catch (error) {
                console.error('Join room error:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        socket.on('leaveRoom', async ({ roomId }) => {
            try {
                socket.leave(`room_${roomId}`);
                socket.currentRoom = null;

                await Room.findByIdAndUpdate(roomId, {
                    $pull: { participants: socket.userId }
                });

                await User.findByIdAndUpdate(socket.userId, { currentRoom: null });

                const updatedRoom = await Room.findById(roomId)
                    .populate('participants', 'username avatar isOnline');

                io.to(`room_${roomId}`).emit('userLeft', {
                    userId: socket.userId,
                    username: socket.username,
                    participants: updatedRoom ? updatedRoom.participants : []
                });

                await Activity.create({
                    user: socket.userId,
                    type: 'left_room',
                    details: { roomName: updatedRoom ? updatedRoom.name : 'Unknown' }
                });
            } catch (error) {
                console.error('Leave room error:', error);
            }
        });

        // ==================== PLAYBACK EVENTS ====================

        socket.on('playSong', async ({ roomId, song }) => {
            try {
                const room = await Room.findById(roomId);
                if (!room || room.host.toString() !== socket.userId) {
                    return socket.emit('error', { message: 'Only the host can control playback' });
                }

                room.currentSong = song;
                room.isPlaying = true;
                room.playbackPosition = 0;
                room.playbackStartedAt = new Date();
                await room.save();

                io.to(`room_${roomId}`).emit('songChanged', {
                    song,
                    isPlaying: true,
                    playbackPosition: 0,
                    timestamp: Date.now()
                });

                // Update host listening history
                await User.findByIdAndUpdate(socket.userId, {
                    $push: {
                        listeningHistory: {
                            $each: [{ title: song.title, artist: song.artist }],
                            $slice: -100
                        }
                    }
                });

                await Activity.create({
                    user: socket.userId,
                    type: 'played_song',
                    details: { songTitle: song.title, songArtist: song.artist }
                });
            } catch (error) {
                console.error('Play song error:', error);
            }
        });

        socket.on('togglePlayback', async ({ roomId, isPlaying, position }) => {
            try {
                const room = await Room.findById(roomId);
                if (!room || room.host.toString() !== socket.userId) {
                    return socket.emit('error', { message: 'Only the host can control playback' });
                }

                room.isPlaying = isPlaying;
                room.playbackPosition = position || 0;
                room.playbackStartedAt = isPlaying ? new Date() : null;
                await room.save();

                io.to(`room_${roomId}`).emit('playbackToggled', {
                    isPlaying,
                    playbackPosition: position || 0,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('Toggle playback error:', error);
            }
        });

        socket.on('seekSong', async ({ roomId, position }) => {
            try {
                const room = await Room.findById(roomId);
                if (!room || room.host.toString() !== socket.userId) {
                    return socket.emit('error', { message: 'Only the host can control playback' });
                }

                room.playbackPosition = position;
                room.playbackStartedAt = room.isPlaying ? new Date() : null;
                await room.save();

                io.to(`room_${roomId}`).emit('playbackSeeked', {
                    position,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('Seek error:', error);
            }
        });

        // ==================== CHAT EVENTS ====================

        socket.on('chatMessage', async ({ roomId, message }) => {
            try {
                const userData = await User.findById(socket.userId).select('username avatar');

                io.to(`room_${roomId}`).emit('newMessage', {
                    userId: socket.userId,
                    username: userData.username,
                    avatar: userData.avatar,
                    message,
                    timestamp: new Date()
                });
            } catch (error) {
                console.error('Chat error:', error);
            }
        });

        // ==================== VOTING EVENTS ====================

        socket.on('voteSong', async ({ roomId, songIndex, vote }) => {
            try {
                const room = await Room.findById(roomId);
                if (!room) return;

                const key = `${songIndex}_${socket.userId}`;
                room.votes.set(key, vote); // 1 for upvote, -1 for downvote
                await room.save();

                // Calculate total votes for this song
                let totalVotes = 0;
                room.votes.forEach((v, k) => {
                    if (k.startsWith(`${songIndex}_`)) {
                        totalVotes += v;
                    }
                });

                io.to(`room_${roomId}`).emit('voteUpdated', {
                    songIndex,
                    totalVotes,
                    votedBy: socket.username
                });
            } catch (error) {
                console.error('Vote error:', error);
            }
        });

        // ==================== PLAYLIST IN ROOM ====================

        socket.on('addToRoomPlaylist', async ({ roomId, song }) => {
            try {
                const room = await Room.findById(roomId);
                if (!room) return;

                room.playlist.push({ ...song, addedBy: socket.userId });
                await room.save();

                const updatedRoom = await Room.findById(roomId)
                    .populate('playlist.addedBy', 'username avatar');

                io.to(`room_${roomId}`).emit('playlistUpdated', {
                    playlist: updatedRoom.playlist,
                    addedBy: socket.username
                });
            } catch (error) {
                console.error('Add to playlist error:', error);
            }
        });

        // ==================== SYNC REQUEST ====================

        socket.on('syncRequest', async ({ roomId }) => {
            try {
                const room = await Room.findById(roomId);
                if (!room) return;

                let currentPosition = room.playbackPosition;
                if (room.isPlaying && room.playbackStartedAt) {
                    currentPosition += (Date.now() - room.playbackStartedAt.getTime()) / 1000;
                }

                socket.emit('syncResponse', {
                    currentSong: room.currentSong,
                    isPlaying: room.isPlaying,
                    playbackPosition: currentPosition,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('Sync error:', error);
            }
        });

        // ==================== DISCONNECT ====================

        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.username}`);

            try {
                await User.findByIdAndUpdate(socket.userId, {
                    isOnline: false,
                    currentRoom: null
                });

                // Leave current room
                if (socket.currentRoom) {
                    await Room.findByIdAndUpdate(socket.currentRoom, {
                        $pull: { participants: socket.userId }
                    });

                    const room = await Room.findById(socket.currentRoom)
                        .populate('participants', 'username avatar isOnline');

                    io.to(`room_${socket.currentRoom}`).emit('userLeft', {
                        userId: socket.userId,
                        username: socket.username,
                        participants: room ? room.participants : []
                    });
                }

                // Notify friends
                if (user && user.friends) {
                    user.friends.forEach(friend => {
                        io.to(`user_${friend._id}`).emit('friendOffline', {
                            userId: socket.userId,
                            username: socket.username
                        });
                    });
                }
            } catch (error) {
                console.error('Disconnect cleanup error:', error);
            }
        });
    });
};
