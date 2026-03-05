import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function FriendList() {
    const { api } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFriends();
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('friendOnline', ({ userId }) => {
            setFriends(prev => prev.map(f => f._id === userId ? { ...f, isOnline: true } : f));
        });
        socket.on('friendOffline', ({ userId }) => {
            setFriends(prev => prev.map(f => f._id === userId ? { ...f, isOnline: false } : f));
        });
        return () => {
            socket.off('friendOnline');
            socket.off('friendOffline');
        };
    }, [socket]);

    const fetchFriends = async () => {
        try {
            const res = await api.get('/users/friends');
            setFriends(res.data);
        } catch (err) {
            console.error('Error fetching friends:', err);
        } finally {
            setLoading(false);
        }
    };

    const onlineFriends = friends.filter(f => f.isOnline);
    const offlineFriends = friends.filter(f => !f.isOnline);

    if (loading) {
        return (
            <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl p-5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Friends ({friends.length})
            </h3>

            {friends.length === 0 ? (
                <div className="text-center py-6">
                    <p className="text-surface-400 text-sm mb-2">No friends yet</p>
                    <p className="text-surface-500 text-xs">Search for users to send friend requests!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Online */}
                    {onlineFriends.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                Online — {onlineFriends.length}
                            </p>
                            <div className="space-y-1">
                                {onlineFriends.map(f => (
                                    <button
                                        key={f._id}
                                        onClick={() => navigate(`/profile/${f._id}`)}
                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-dark-hover transition-all text-left"
                                    >
                                        <div className="relative flex-shrink-0">
                                            <img src={f.avatar || `https://ui-avatars.com/api/?name=${f.username}&size=36`} alt="" className="w-9 h-9 rounded-full" />
                                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-card"></span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{f.username}</p>
                                            {f.currentRoom ? (
                                                <p className="text-xs text-primary-400 flex items-center gap-1">🎧 In a room</p>
                                            ) : (
                                                <p className="text-xs text-green-400">Online</p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Offline */}
                    {offlineFriends.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                                Offline — {offlineFriends.length}
                            </p>
                            <div className="space-y-1">
                                {offlineFriends.map(f => (
                                    <button
                                        key={f._id}
                                        onClick={() => navigate(`/profile/${f._id}`)}
                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-dark-hover transition-all text-left opacity-60 hover:opacity-100"
                                    >
                                        <img src={f.avatar || `https://ui-avatars.com/api/?name=${f.username}&size=36`} alt="" className="w-9 h-9 rounded-full" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{f.username}</p>
                                            <p className="text-xs text-surface-500">Offline</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
