
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LocalSongs({
    songs: propsSongs,
    loading: propsLoading,
    onAddToQueue,
    onPlaySong,
    onRefresh,
    isHost
}) {
    const { api } = useAuth();
    const [localSongs, setLocalSongs] = useState([]);
    const [localLoading, setLocalLoading] = useState(false);
    const [showUploader, setShowUploader] = useState(false);

    // Use props if provided, otherwise fetch
    const songs = propsSongs || localSongs;
    const loading = propsLoading !== undefined ? propsLoading : localLoading;

    useEffect(() => {
        if (!propsSongs) {
            fetchSongs();
        }
    }, [propsSongs]);

    const fetchSongs = async () => {
        try {
            setLocalLoading(true);
            const res = await api.get('/users/local-songs');
            setLocalSongs(res.data);
        } catch (err) {
            console.error('Error fetching local songs:', err);
        } finally {
            setLocalLoading(false);
        }
    };

    const handleRefresh = () => {
        if (onRefresh) {
            onRefresh();
        } else {
            fetchSongs();
        }
    };

    if (loading && songs.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">
                    Available Songs ({songs.length})
                </h3>
                <button
                    onClick={handleRefresh}
                    className="p-1.5 rounded-lg hover:bg-dark-hover text-surface-400 hover:text-white transition-colors"
                    title="Refresh list"
                >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {songs.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                    <p className="text-surface-400 text-sm">No local songs found in server/songs folder.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {songs.map((song, index) => (
                        <div
                            key={index}
                            className="glass rounded-xl p-3 flex items-center gap-4 group hover:bg-dark-hover transition-all"
                        >
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary-500/20 flex items-center justify-center text-primary-300 flex-shrink-0">
                                {song.cover ? (
                                    <img src={song.cover} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13" /></svg>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                                <p className="text-xs text-surface-400 truncate">{song.artist}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onAddToQueue && (
                                    <button
                                        onClick={() => onAddToQueue(song)}
                                        className="p-2 rounded-lg bg-primary-500/20 text-primary-300 hover:bg-primary-500 hover:text-white transition-all"
                                        title="Add to queue"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    </button>
                                )}
                                {isHost && onPlaySong && (
                                    <button
                                        onClick={() => onPlaySong(song)}
                                        className="p-2 rounded-lg bg-accent-500/20 text-accent-300 hover:bg-accent-500 hover:text-white transition-all"
                                        title="Play now"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
