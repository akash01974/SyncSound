import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Navbar() {
    const { user, api, logout } = useAuth();
    const { connected } = useSocket();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const searchRef = useRef(null);
    const profileRef = useRef(null);
    const notifRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Fetch friend requests as notifications
    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/users/friend-requests');
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
            setSearchResults(res.data);
            setShowSearch(true);
        } catch (err) {
            console.error('Search error:', err);
        }
    };

    const handleAcceptFriend = async (fromId) => {
        try {
            await api.post(`/users/accept-friend/${fromId}`);
            setNotifications(prev => prev.filter(n => n.from._id !== fromId));
        } catch (err) {
            console.error('Accept friend error:', err);
        }
    };

    const handleRejectFriend = async (fromId) => {
        try {
            await api.post(`/users/reject-friend/${fromId}`);
            setNotifications(prev => prev.filter(n => n.from._id !== fromId));
        } catch (err) {
            console.error('Reject friend error:', err);
        }
    };

    return (
        <nav className="h-16 border-b border-dark-border bg-dark-card/80 backdrop-blur-lg flex items-center px-4 md:px-6 gap-4 flex-shrink-0 z-40">
            {/* Search */}
            <div className="flex-1 max-w-md relative" ref={searchRef}>
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowSearch(true)}
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-dark-hover border border-dark-border text-white placeholder-surface-500 text-sm focus:outline-none focus:border-primary-500/50 transition-all"
                        id="search-users-input"
                    />
                </div>

                {showSearch && searchResults.length > 0 && (
                    <div className="absolute top-full mt-2 w-full glass rounded-xl shadow-2xl py-2 max-h-64 overflow-y-auto z-50">
                        {searchResults.map(u => (
                            <button
                                key={u._id}
                                onClick={() => {
                                    navigate(`/profile/${u._id}`);
                                    setShowSearch(false);
                                    setSearchQuery('');
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-hover transition-colors text-left"
                            >
                                <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}&size=32`} alt="" className="w-8 h-8 rounded-full" />
                                <div>
                                    <p className="text-sm font-medium text-white">{u.username}</p>
                                    <p className="text-xs text-surface-400 truncate max-w-[200px]">{u.bio || 'SyncSound user'}</p>
                                </div>
                                <span className={`ml-auto w-2 h-2 rounded-full ${u.isOnline ? 'bg-green-400' : 'bg-surface-600'}`}></span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
                {/* Connection Status */}
                <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                    {connected ? 'Connected' : 'Offline'}
                </div>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => { setShowNotifications(!showNotifications); fetchNotifications(); }}
                        className="p-2 rounded-lg hover:bg-dark-hover transition-colors relative text-surface-400 hover:text-white"
                        id="notifications-btn"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{notifications.length}</span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 glass rounded-xl shadow-2xl py-2 z-50">
                            <h4 className="px-4 py-2 text-sm font-semibold text-white border-b border-dark-border">Friend Requests</h4>
                            {notifications.length === 0 ? (
                                <p className="px-4 py-4 text-sm text-surface-400 text-center">No pending requests</p>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.from._id} className="px-4 py-3 flex items-center gap-3 hover:bg-dark-hover transition-colors">
                                        <img src={n.from.avatar || `https://ui-avatars.com/api/?name=${n.from.username}&size=32`} alt="" className="w-9 h-9 rounded-full" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{n.from.username}</p>
                                            <p className="text-xs text-surface-400">wants to be your friend</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleAcceptFriend(n.from._id)} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            </button>
                                            <button onClick={() => handleRejectFriend(n.from._id)} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-dark-hover transition-colors"
                        id="profile-dropdown-btn"
                    >
                        <img
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&size=32`}
                            alt=""
                            className="w-8 h-8 rounded-lg"
                        />
                        <span className="hidden md:block text-sm font-medium text-white">{user?.username}</span>
                        <svg className="w-4 h-4 text-surface-400 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {showProfile && (
                        <div className="absolute right-0 top-full mt-2 w-56 glass rounded-xl shadow-2xl py-2 z-50">
                            <Link
                                to="/profile"
                                onClick={() => setShowProfile(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-dark-hover transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                My Profile
                            </Link>
                            <Link
                                to="/playlists"
                                onClick={() => setShowProfile(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-dark-hover transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                Playlists
                            </Link>
                            <div className="border-t border-dark-border my-2"></div>
                            <button
                                onClick={() => { logout(); navigate('/login'); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                id="logout-btn"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
