import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SongUploader({ onUploaded }) {
    const { token } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [songTitle, setSongTitle] = useState('');
    const [songArtist, setSongArtist] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const fileRef = useRef(null);

    const handleFile = (file) => {
        if (!file) return;

        const allowed = ['.mp3', '.wav', '.ogg', '.m4a', '.webm'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowed.includes(ext)) {
            setError('Only audio files (.mp3, .wav, .ogg, .m4a, .webm) are allowed');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be under 10MB');
            return;
        }

        setError('');
        setSelectedFile(file);

        // Try to extract song info from filename
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        if (baseName.includes(' - ')) {
            const parts = baseName.split(' - ');
            setSongArtist(parts[0].trim());
            setSongTitle(parts[1].trim());
        } else {
            setSongTitle(baseName);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !songTitle.trim()) return;

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('audio', selectedFile);

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            onUploaded({
                title: songTitle,
                artist: songArtist || 'Unknown Artist',
                album: '',
                cover: '',
                url: data.url,
                duration: 0
            });

            setSongTitle('');
            setSongArtist('');
            setSelectedFile(null);
        } catch (err) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="glass-light rounded-xl p-4">
            {!selectedFile ? (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragActive
                            ? 'border-primary-400 bg-primary-500/10'
                            : 'border-dark-border hover:border-primary-500/30 hover:bg-dark-hover'
                        }`}
                >
                    <svg className="w-8 h-8 mx-auto mb-2 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="text-sm text-surface-300">Drag & drop an audio file or <span className="text-primary-400 font-medium">browse</span></p>
                    <p className="text-xs text-surface-500 mt-1">MP3, WAV, OGG, M4A · Max 10MB</p>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".mp3,.wav,.ogg,.m4a,.webm,audio/*"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-dark-bg">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-300">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{selectedFile.name}</p>
                            <p className="text-xs text-surface-400">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        <button onClick={() => { setSelectedFile(null); setSongTitle(''); setSongArtist(''); }} className="p-1.5 rounded-lg hover:bg-dark-hover text-surface-400 hover:text-red-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <input
                        type="text"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        placeholder="Song title *"
                        className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white placeholder-surface-500 text-sm focus:outline-none focus:border-primary-500/50 transition-all"
                    />
                    <input
                        type="text"
                        value={songArtist}
                        onChange={(e) => setSongArtist(e.target.value)}
                        placeholder="Artist name"
                        className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white placeholder-surface-500 text-sm focus:outline-none focus:border-primary-500/50 transition-all"
                    />

                    <button
                        onClick={handleUpload}
                        disabled={uploading || !songTitle.trim()}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-accent-600 text-white text-sm font-medium hover:from-primary-500 hover:to-accent-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Uploading...
                            </span>
                        ) : 'Upload & Add to Queue'}
                    </button>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
                    {error}
                </p>
            )}
        </div>
    );
}
