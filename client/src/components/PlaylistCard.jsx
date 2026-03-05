import React from 'react';

export default function PlaylistCard({ playlist, onClick, onDelete, isOwner, selected }) {
    const songCount = playlist.songs?.length || 0;

    const gradients = [
        'from-purple-500/20 to-pink-500/10',
        'from-blue-500/20 to-cyan-500/10',
        'from-green-500/20 to-emerald-500/10',
        'from-orange-500/20 to-red-500/10',
        'from-indigo-500/20 to-violet-500/10'
    ];

    // Deterministic gradient based on playlist name
    const gradientIndex = (playlist.name?.charCodeAt(0) || 0) % gradients.length;

    return (
        <div
            onClick={onClick}
            className={`glass rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg ${selected ? 'border-primary-500/50 shadow-primary-500/10' : 'hover:border-primary-500/20'
                }`}
        >
            {/* Cover */}
            <div className={`h-28 bg-gradient-to-br ${gradients[gradientIndex]} relative flex items-center justify-center`}>
                <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>

                {playlist.isShared && (
                    <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-300 font-medium">
                        Shared
                    </span>
                )}

                {isOwner && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/40 text-white/60 hover:text-red-400 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete playlist"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                )}
            </div>

            <div className="p-4">
                <h3 className="font-semibold text-white truncate group-hover:text-primary-300 transition-colors">{playlist.name}</h3>
                <p className="text-xs text-surface-400 mt-1 flex items-center gap-2">
                    <span>{songCount} song{songCount !== 1 ? 's' : ''}</span>
                    {playlist.collaborators?.length > 0 && (
                        <>
                            <span className="text-surface-600">·</span>
                            <span>{playlist.collaborators.length + 1} collaborators</span>
                        </>
                    )}
                </p>
                <p className="text-xs text-surface-500 mt-1.5">
                    by {playlist.creator?.username || 'Unknown'}
                </p>
            </div>
        </div>
    );
}
