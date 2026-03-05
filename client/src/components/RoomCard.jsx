import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoomCard({ room, index }) {
    const navigate = useNavigate();

    const gradients = [
        'from-primary-600/30 to-accent-600/20',
        'from-accent-600/30 to-primary-600/20',
        'from-purple-600/30 to-pink-600/20',
        'from-cyan-600/30 to-blue-600/20',
        'from-green-600/30 to-teal-600/20',
        'from-orange-600/30 to-red-600/20'
    ];

    const gradient = gradients[index % gradients.length];

    return (
        <div
            onClick={() => navigate(`/room/${room._id}`)}
            className="glass rounded-xl overflow-hidden cursor-pointer group hover:border-primary-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10"
            id={`room-card-${room._id}`}
        >
            {/* Header gradient */}
            <div className={`h-20 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
                <div className="absolute inset-0 bg-dark-card/20"></div>
                {room.isPlaying && room.currentSong?.title ? (
                    <div className="relative z-10 flex items-end gap-0.5 h-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="equalizer-bar" style={{ animationDelay: `${i * 0.12}s` }}></div>
                        ))}
                    </div>
                ) : (
                    <svg className="relative z-10 w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                )}
                <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium z-10">
                    LIVE
                </span>
            </div>

            <div className="p-4">
                <h3 className="font-semibold text-white mb-1 truncate group-hover:text-primary-300 transition-colors">{room.name}</h3>

                <p className="text-xs text-surface-400 mb-3 flex items-center gap-1">
                    <span>Hosted by</span>
                    <span className="text-surface-300 font-medium">{room.host?.username}</span>
                </p>

                {room.currentSong?.title && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-bg/50 mb-3">
                        <span className="text-xs">🎵</span>
                        <p className="text-xs text-surface-300 truncate">{room.currentSong.title} — {room.currentSong.artist}</p>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                        {room.participants?.slice(0, 4).map(p => (
                            <img
                                key={p._id}
                                src={p.avatar || `https://ui-avatars.com/api/?name=${p.username}&size=24`}
                                alt={p.username}
                                className="w-6 h-6 rounded-full border-2 border-dark-card"
                                title={p.username}
                            />
                        ))}
                        {(room.participants?.length || 0) > 4 && (
                            <div className="w-6 h-6 rounded-full border-2 border-dark-card bg-dark-hover flex items-center justify-center text-xs text-surface-400 font-medium">
                                +{room.participants.length - 4}
                            </div>
                        )}
                    </div>
                    <span className="text-xs text-surface-400">{room.participants?.length || 0} listening</span>
                </div>
            </div>
        </div>
    );
}
