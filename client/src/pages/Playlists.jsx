import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PlaylistCard from '../components/PlaylistCard';

export default function Playlists() {
    const { user, api } = useAuth();
    const [playlists, setPlaylists] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [isShared, setIsShared] = useState(false);
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        try {
            const res = await api.get('/playlists');
            setPlaylists(res.data);
        } catch (err) {
            console.error('Error fetching playlists:', err);
        } finally {
            setLoading(false);
        }
    };

    const createPlaylist = async () => {
        if (creating || !newName.trim()) return;
        setCreating(true);
        try {
            const res = await api.post('/playlists', { name: newName, isShared });
            setPlaylists(prev => [res.data, ...prev]);
            setShowCreate(false);
            setNewName('');
            setIsShared(false);
        } catch (err) {
            console.error('Error creating playlist:', err);
        } finally {
            setCreating(false);
        }
    };

    const deletePlaylist = async (playlistId) => {
        try {
            await api.delete(`/playlists/${playlistId}`);
            setPlaylists(prev => prev.filter(p => p._id !== playlistId));
            if (selectedPlaylist?._id === playlistId) setSelectedPlaylist(null);
        } catch (err) {
            console.error('Error deleting playlist:', err);
        }
    };

    const handleSelectPlaylist = async (playlist) => {
        try {
            const res = await api.get(`/playlists/${playlist._id}`);
            setSelectedPlaylist(res.data);
        } catch (err) {
            console.error('Error fetching playlist details:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                        My Playlists
                    </h1>
                    <p className="text-surface-400 mt-1">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-medium hover:from-primary-500 hover:to-accent-500 transition-all shadow-lg hover:shadow-primary-500/25 flex items-center gap-2"
                    id="create-playlist-btn"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Playlist
                </button>
            </div>

            {/* Create Playlist Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
                    <div className="glass rounded-2xl p-8 w-full max-w-md mx-4 animate-slideInUp" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-6">Create New Playlist</h3>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Playlist name..."
                            className="w-full px-4 py-3 rounded-xl bg-dark-bg border border-dark-border text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all mb-4"
                            id="playlist-name-input"
                        />
                        <label className="flex items-center gap-3 mb-6 cursor-pointer">
                            <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${isShared ? 'bg-primary-600 justify-end' : 'bg-dark-border justify-start'}`}>
                                <div className="w-5 h-5 bg-white rounded-full mx-0.5 shadow-lg transition-all"></div>
                            </div>
                            <span className="text-surface-300 text-sm">Allow friends to add songs (shared playlist)</span>
                            <input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} className="hidden" />
                        </label>
                        <div className="flex gap-3">
                            <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border border-dark-border text-surface-300 hover:text-white hover:border-surface-500 transition-all">Cancel</button>
                            <button onClick={createPlaylist} disabled={creating || !newName.trim()} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold hover:from-primary-500 hover:to-accent-500 transition-all disabled:opacity-50" id="confirm-create-playlist">
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Playlist Grid */}
                <div className="lg:col-span-2">
                    {playlists.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-dark-hover flex items-center justify-center">
                                <svg className="w-10 h-10 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No playlists yet</h3>
                            <p className="text-surface-400 mb-4">Create your first playlist and start curating music!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {playlists.map((playlist) => (
                                <PlaylistCard
                                    key={playlist._id}
                                    playlist={playlist}
                                    onClick={() => handleSelectPlaylist(playlist)}
                                    onDelete={() => deletePlaylist(playlist._id)}
                                    isOwner={playlist.creator?._id === user?._id}
                                    selected={selectedPlaylist?._id === playlist._id}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Playlist Details */}
                <div className="glass rounded-2xl p-6 h-fit sticky top-4">
                    {selectedPlaylist ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">{selectedPlaylist.name}</h3>
                                {selectedPlaylist.isShared && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-accent-500/20 text-accent-300">Shared</span>
                                )}
                            </div>
                            <p className="text-sm text-surface-400 mb-4">
                                By {selectedPlaylist.creator?.username} · {selectedPlaylist.songs?.length || 0} songs
                            </p>

                            {selectedPlaylist.collaborators?.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs text-surface-500 mb-2">Collaborators</p>
                                    <div className="flex -space-x-2">
                                        {selectedPlaylist.collaborators.map(c => (
                                            <img key={c._id} src={c.avatar} alt={c.username} className="w-7 h-7 rounded-full border-2 border-dark-card" title={c.username} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {selectedPlaylist.songs?.length === 0 ? (
                                    <p className="text-surface-500 text-sm text-center py-4">No songs yet</p>
                                ) : (
                                    selectedPlaylist.songs?.map((song, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-hover transition-all">
                                            <span className="text-surface-500 text-xs w-5 text-center">{i + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{song.title}</p>
                                                <p className="text-xs text-surface-400 truncate">{song.artist}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <svg className="w-12 h-12 mx-auto mb-3 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            <p className="text-surface-400 text-sm">Select a playlist to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
