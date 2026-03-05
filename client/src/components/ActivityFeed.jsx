import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ACTIVITY_CONFIG = {
    joined_room: { icon: '🎧', color: 'text-green-400', verb: 'joined' },
    left_room: { icon: '👋', color: 'text-surface-400', verb: 'left' },
    created_room: { icon: '🎵', color: 'text-primary-400', verb: 'created room' },
    played_song: { icon: '▶️', color: 'text-accent-400', verb: 'played' },
    created_playlist: { icon: '📋', color: 'text-purple-400', verb: 'created playlist' },
    added_song: { icon: '➕', color: 'text-blue-400', verb: 'added song to' },
    became_friends: { icon: '🤝', color: 'text-yellow-400', verb: 'became friends with' },
    signed_up: { icon: '🎉', color: 'text-pink-400', verb: 'joined SyncSound!' }
};

export default function ActivityFeed() {
    const { api } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const res = await api.get('/activities');
            setActivities(res.data);
        } catch (err) {
            console.error('Error fetching activities:', err);
        } finally {
            setLoading(false);
        }
    };

    const getActivityText = (activity) => {
        const config = ACTIVITY_CONFIG[activity.type] || { verb: 'did something' };
        const d = activity.details || {};

        switch (activity.type) {
            case 'joined_room':
            case 'left_room':
                return `${config.verb} room "${d.roomName || 'Unknown'}"`;
            case 'created_room':
                return `${config.verb} "${d.roomName || 'Unknown'}"`;
            case 'played_song':
                return `${config.verb} "${d.songTitle || 'Unknown'}" by ${d.songArtist || 'Unknown'}`;
            case 'created_playlist':
                return `${config.verb} "${d.playlistName || 'Unknown'}"`;
            case 'added_song':
                return `${config.verb} "${d.playlistName || 'a playlist'}" — "${d.songTitle || 'Unknown'}"`;
            case 'became_friends':
                return `${config.verb} ${d.friendName || 'someone'}`;
            case 'signed_up':
                return config.verb;
            default:
                return config.verb;
        }
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="glass rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-hover flex items-center justify-center">
                    <span className="text-3xl">📡</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No activity yet</h3>
                <p className="text-surface-400 text-sm">Activities from you and your friends will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {activities.map((activity, i) => {
                const config = ACTIVITY_CONFIG[activity.type] || { icon: '📌', color: 'text-surface-400' };
                return (
                    <div
                        key={activity._id || i}
                        className="glass rounded-xl p-4 flex items-start gap-3 hover:bg-dark-hover transition-all animate-fadeIn"
                        style={{ animationDelay: `${i * 30}ms` }}
                    >
                        <div className="w-10 h-10 rounded-full bg-dark-hover flex items-center justify-center flex-shrink-0 text-lg">
                            {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-surface-200">
                                <span className="font-semibold text-white">{activity.user?.username || 'Unknown'}</span>
                                {' '}
                                <span className={config.color}>{getActivityText(activity)}</span>
                            </p>
                            <p className="text-xs text-surface-500 mt-1">{timeAgo(activity.createdAt)}</p>
                        </div>
                        {activity.user?.avatar && (
                            <img src={activity.user.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
