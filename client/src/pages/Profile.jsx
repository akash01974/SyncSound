import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
    const { id } = useParams();
    const { user: currentUser, api, updateProfile } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(true);
    const [friendStatus, setFriendStatus] = useState('none'); // none, friends, pending, sent

    const isOwnProfile = !id || id === currentUser?._id;

    useEffect(() => {
        if (isOwnProfile) {
            setProfileUser(currentUser);
            setBio(currentUser?.bio || '');
            setLoading(false);
        } else {
            fetchUserProfile();
        }
    }, [id, currentUser]);

    const fetchUserProfile = async () => {
        try {
            const res = await api.get(`/users/${id}`);
            setProfileUser(res.data);
            setBio(res.data.bio || '');

            // Check friend status
            if (currentUser?.friends?.some(f => (f._id || f) === id)) {
                setFriendStatus('friends');
            } else if (currentUser?.sentRequests?.includes(id)) {
                setFriendStatus('sent');
            } else {
                setFriendStatus('none');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBio = async () => {
        try {
            await updateProfile({ bio });
            setEditing(false);
        } catch (err) {
            console.error('Error updating bio:', err);
        }
    };

    const handleSendRequest = async () => {
        try {
            await api.post(`/users/friend-request/${id}`);
            setFriendStatus('sent');
        } catch (err) {
            console.error('Error sending request:', err);
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
        <div className="max-w-3xl mx-auto animate-fadeIn">
            {/* Profile Header */}
            <div className="glass rounded-2xl overflow-hidden mb-6">
                {/* Cover gradient */}
                <div className="h-36 bg-gradient-to-r from-primary-600/40 via-accent-600/30 to-primary-600/40 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-card/80"></div>
                </div>

                <div className="px-8 pb-8 -mt-16 relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <img
                                src={profileUser?.avatar || `https://ui-avatars.com/api/?name=${profileUser?.username}&background=6c5ce7&color=fff&size=200`}
                                alt={profileUser?.username}
                                className="w-28 h-28 rounded-2xl border-4 border-dark-card shadow-xl object-cover"
                            />
                            {profileUser?.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-dark-card rounded-full"></div>
                            )}
                        </div>

                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-white">{profileUser?.username}</h1>
                            <p className="text-surface-400 mt-1 flex items-center gap-4">
                                <span>{profileUser?.friendCount || profileUser?.friends?.length || 0} friends</span>
                                <span className={`flex items-center gap-1 ${profileUser?.isOnline ? 'text-green-400' : 'text-surface-500'}`}>
                                    <span className={`w-2 h-2 rounded-full ${profileUser?.isOnline ? 'bg-green-400' : 'bg-surface-500'}`}></span>
                                    {profileUser?.isOnline ? 'Online' : 'Offline'}
                                </span>
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {isOwnProfile ? (
                                <button
                                    onClick={() => setEditing(!editing)}
                                    className="px-5 py-2.5 rounded-xl border border-dark-border text-surface-300 hover:text-white hover:border-primary-500 transition-all flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    {friendStatus === 'none' && (
                                        <button onClick={handleSendRequest} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-medium hover:from-primary-500 hover:to-accent-500 transition-all flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                            Add Friend
                                        </button>
                                    )}
                                    {friendStatus === 'sent' && (
                                        <button disabled className="px-5 py-2.5 rounded-xl border border-dark-border text-surface-400 cursor-not-allowed flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Request Sent
                                        </button>
                                    )}
                                    {friendStatus === 'friends' && (
                                        <span className="px-5 py-2.5 rounded-xl bg-green-500/20 text-green-400 font-medium flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Friends
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bio Section */}
            <div className="glass rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    About
                </h2>
                {editing ? (
                    <div>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={200}
                            className="w-full px-4 py-3 rounded-xl bg-dark-bg border border-dark-border text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none"
                            rows={3}
                            placeholder="Tell others about yourself and your music taste..."
                        />
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-surface-500">{bio.length}/200</span>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditing(false); setBio(currentUser.bio || ''); }} className="px-4 py-2 text-sm rounded-lg text-surface-400 hover:text-white transition-colors">Cancel</button>
                                <button onClick={handleSaveBio} className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition-colors">Save</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-surface-300">{profileUser?.bio || 'No bio yet.'}</p>
                )}
            </div>

            {/* Listening History */}
            {isOwnProfile && currentUser?.listeningHistory?.length > 0 && (
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Recent Listening History
                    </h2>
                    <div className="space-y-2">
                        {currentUser.listeningHistory.slice(-10).reverse().map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-hover transition-all">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center text-sm">
                                    🎵
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                                    <p className="text-xs text-surface-400 truncate">{item.artist}</p>
                                </div>
                                <span className="text-xs text-surface-500">
                                    {new Date(item.playedAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
