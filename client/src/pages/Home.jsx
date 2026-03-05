import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import RoomCard from '../components/RoomCard';
import ActivityFeed from '../components/ActivityFeed';
import FriendList from '../components/FriendList';

export default function Home() {
    const { user, api } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const location = useLocation();
    const [rooms, setRooms] = useState([]);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [creating, setCreating] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [activeTab, setActiveTab] = useState('rooms');

    useEffect(() => {
        fetchRooms();
        fetchRecommendations();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await api.get('/rooms');
            setRooms(res.data);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        }
    };

    const fetchRecommendations = async () => {
        try {
            const res = await api.get('/users/recommendations');
            setRecommendations(res.data);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
        }
    };

    const createRoom = async () => {
        if (creating) return;
        setCreating(true);
        try {
            const res = await api.post('/rooms', { name: roomName || `${user.username}'s Room` });
            navigate(`/room/${res.data._id}`);
        } catch (err) {
            console.error('Error creating room:', err);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto animate-fadeIn">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl glass p-8 mb-8">
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-accent-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3">
                        Welcome back, <span className="gradient-text">{user?.username}</span> 👋
                    </h1>
                    <p className="text-surface-400 text-lg mb-6 max-w-xl">
                        Ready to vibe? Create a room, join your friends, or discover new music together.
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <button
                            id="create-room-btn"
                            onClick={() => setShowCreateRoom(true)}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold hover:from-primary-500 hover:to-accent-500 transition-all duration-300 shadow-lg hover:shadow-primary-500/25 transform hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Create Room
                        </button>
                        <button
                            onClick={() => navigate('/playlists')}
                            className="px-6 py-3 rounded-xl border border-dark-border text-surface-300 hover:text-white hover:border-primary-500 transition-all duration-300 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                            My Playlists
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Room Modal */}
            {showCreateRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateRoom(false)}>
                    <div className="glass rounded-2xl p-8 w-full max-w-md mx-4 animate-slideInUp" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-2">Create a Listening Room</h3>
                        <p className="text-surface-400 text-sm mb-6">Invite friends and listen to music together in real time</p>

                        <input
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder={`${user?.username}'s Room`}
                            className="w-full px-4 py-3 rounded-xl bg-dark-bg border border-dark-border text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all mb-6"
                            id="room-name-input"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateRoom(false)}
                                className="flex-1 py-3 rounded-xl border border-dark-border text-surface-300 hover:text-white hover:border-surface-500 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createRoom}
                                disabled={creating}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold hover:from-primary-500 hover:to-accent-500 transition-all disabled:opacity-50"
                                id="confirm-create-room"
                            >
                                {creating ? 'Creating...' : 'Create Room'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 rounded-2xl bg-dark-card border border-dark-border mb-8 max-w-sm">
                {[
                    { id: 'rooms', label: 'Rooms', icon: '🎧' },
                    { id: 'activity', label: 'Activity', icon: '📡' },
                    { id: 'discover', label: 'Discover', icon: '🎵' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg shadow-primary-500/20'
                                : 'text-surface-500 hover:text-surface-300 hover:bg-dark-hover'
                            }`}
                    >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    {activeTab === 'rooms' && (
                        <div className="animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="text-2xl">🎧</span> Active Rooms
                                </h2>
                                <span className="text-xs font-semibold text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20 uppercase tracking-widest">
                                    {rooms.length} Live
                                </span>
                            </div>
                            {rooms.length === 0 ? (
                                <div className="glass rounded-3xl p-16 text-center border-dashed border-2 border-dark-border/50">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-dark-hover flex items-center justify-center">
                                        <svg className="w-10 h-10 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">No active rooms</h3>
                                    <p className="text-surface-400 mb-4">Be the first to create a listening room!</p>
                                    <button
                                        onClick={() => setShowCreateRoom(true)}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-medium hover:from-primary-500 hover:to-accent-500 transition-all"
                                    >
                                        Create Room
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {rooms.map((room, i) => (
                                        <RoomCard key={room._id} room={room} index={i} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="animate-fadeIn">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="text-2xl">📡</span> Activity Feed
                            </h2>
                            <ActivityFeed />
                        </div>
                    )}

                    {activeTab === 'discover' && (
                        <div className="animate-fadeIn">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="text-2xl">🎵</span> Weekly Discovery
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {recommendations.length === 0 ? (
                                    <div className="lg:col-span-2 glass rounded-3xl p-12 text-center border-dashed border-2 border-dark-border/50">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-hover flex items-center justify-center text-2xl">✨</div>
                                        <h3 className="text-lg font-semibold text-white mb-2">Finding your vibe...</h3>
                                        <p className="text-surface-400 max-w-xs mx-auto">Listen to more music to get personalized recommendations!</p>
                                    </div>
                                ) : (
                                    recommendations.map((song, i) => (
                                        <div key={i} className="glass p-4 rounded-2xl flex items-center gap-4 group hover:bg-dark-hover transition-all cursor-pointer">
                                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-primary-500/10 flex items-center justify-center flex-shrink-0 relative">
                                                {song.cover ? (
                                                    <img src={song.cover} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <span className="text-xl">🎵</span>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">{song.title}</p>
                                                <p className="text-xs text-surface-500 truncate mt-0.5">{song.artist}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar - Friends */}
                <div className="hidden lg:block">
                    <FriendList />
                </div>
            </div>
        </div>
    );
}
