import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Sidebar() {
    const { user, api } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [collapsed, setCollapsed] = useState(false);

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
        }
    };

    const navItems = [
        {
            path: '/', label: 'Home', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            )
        },
        {
            path: '/playlists', label: 'Playlists', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
            )
        },
        {
            path: '/profile', label: 'Profile', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            )
        }
    ];

    const onlineFriends = friends.filter(f => f.isOnline);

    return (
        <aside className={`${collapsed ? 'w-16' : 'w-64'} h-screen bg-dark-card border-r border-dark-border flex flex-col transition-all duration-300 flex-shrink-0 hidden md:flex`}>
            {/* Logo */}
            <div className="h-16 border-b border-dark-border flex items-center px-4 gap-3 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                </div>
                {!collapsed && <span className="text-lg font-bold gradient-text">SyncSound</span>}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="ml-auto p-1 rounded-lg hover:bg-dark-hover transition-colors text-surface-400"
                >
                    <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2">
                <div className="space-y-1">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-gradient-to-r from-primary-600/20 to-accent-600/10 text-white border border-primary-500/20'
                                    : 'text-surface-400 hover:text-white hover:bg-dark-hover'
                                } ${collapsed ? 'justify-center' : ''}`
                            }
                        >
                            {item.icon}
                            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                        </NavLink>
                    ))}
                </div>

                {/* Online Friends */}
                {!collapsed && (
                    <div className="mt-8">
                        <h3 className="px-3 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
                            Friends Online ({onlineFriends.length})
                        </h3>
                        <div className="space-y-1">
                            {friends.length === 0 ? (
                                <p className="px-3 text-xs text-surface-500">No friends yet</p>
                            ) : (
                                friends.slice(0, 10).map(friend => (
                                    <button
                                        key={friend._id}
                                        onClick={() => navigate(`/profile/${friend._id}`)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-dark-hover transition-colors text-left"
                                    >
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.username}&size=28`}
                                                alt=""
                                                className="w-7 h-7 rounded-full"
                                            />
                                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-dark-card ${friend.isOnline ? 'bg-green-400' : 'bg-surface-600'
                                                }`}></span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-surface-300 truncate">{friend.username}</p>
                                            {friend.currentRoom && (
                                                <p className="text-xs text-primary-400 truncate">In a room 🎧</p>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {collapsed && onlineFriends.length > 0 && (
                    <div className="mt-8 px-2">
                        <div className="w-full h-px bg-dark-border mb-3"></div>
                        <div className="space-y-2">
                            {onlineFriends.slice(0, 5).map(friend => (
                                <button
                                    key={friend._id}
                                    onClick={() => navigate(`/profile/${friend._id}`)}
                                    className="w-full flex justify-center"
                                    title={friend.username}
                                >
                                    <div className="relative">
                                        <img src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.username}&size=28`} alt="" className="w-8 h-8 rounded-full hover:ring-2 ring-primary-500 transition-all" />
                                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-dark-card"></span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            {/* User Card */}
            {!collapsed && (
                <div className="border-t border-dark-border p-3 flex-shrink-0">
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-dark-hover transition-colors cursor-pointer" onClick={() => navigate('/profile')}>
                        <img
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&size=36`}
                            alt=""
                            className="w-9 h-9 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                            <p className="text-xs text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                Online
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
