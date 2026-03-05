import React, { useState, useRef, useEffect } from "react";

export default function MusicPlayer({
  currentSong,
  isPlaying,
  playbackPosition,
  isHost,
  onTogglePlayback,
  onSeek,
}) {
  const [currentTime, setCurrentTime] = useState(playbackPosition || 0);
  const [duration, setDuration] = useState(currentSong?.duration || 0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  // Update audio source and reset when song changes
  useEffect(() => {
    if (audioRef.current && currentSong?.url) {
      setAudioError(null);
      setIsLoading(true);
      
      // Don't double-encode if it's already a valid URI component or path
      // Local songs from backend are already encoded. Uploaded songs usually don't have special chars.
      const safeUrl = currentSong.url.includes('%') ? currentSong.url : encodeURI(currentSong.url);
      
      console.log("Setting audio src to", safeUrl);
      audioRef.current.src = safeUrl;
      audioRef.current.currentTime = playbackPosition || 0;
      audioRef.current.load(); // Force reload

      if (isPlaying) {
        audioRef.current.play().catch((e) => {
          console.log("Playback failed:", e);
          setAudioError("Failed to play audio. Try clicking Play again.");
          setIsLoading(false);
        });
      }
    }
  }, [currentSong?.url]);

  // Update current time from playback position (only for non-hosts or if sync difference is large)
  useEffect(() => {
    if (audioRef.current) {
      const diff = Math.abs(audioRef.current.currentTime - (playbackPosition || 0));
      // Only sync if the difference is more than 2 seconds to avoid stuttering
      if (diff > 2) {
        audioRef.current.currentTime = playbackPosition || 0;
      }
    }
    setCurrentTime(playbackPosition || 0);
  }, [playbackPosition]);

  // Control audio playback based on isPlaying state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => {
          console.log("Playback failed:", e);
          setAudioError("Failed to play audio");
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      const vol = muted ? 0 : volume / 100;
      audioRef.current.volume = vol;
      console.log("Volume set to:", vol);
    }
  }, [volume, muted]);

  // Handle audio time updates
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setIsLoading(false);
    }
  };

  // Handle metadata loaded
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  // Handle audio errors
  const handleAudioError = (e) => {
    console.error("Audio error:", e);
    setAudioError("Failed to load audio file");
    setIsLoading(false);
  };

  // Handle audio load start
  const handleLoadStart = () => {
    console.log("Audio loading started for:", currentSong?.url);
    setIsLoading(true);
    setAudioError(null);
  };

  // Handle audio can play
  const handleCanPlay = () => {
    console.log("Audio can play:", currentSong?.url);
    setIsLoading(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e) => {
    const newPos = parseFloat(e.target.value);
    setCurrentTime(newPos);
    if (audioRef.current) {
      audioRef.current.currentTime = newPos;
    }
    if (isHost && onSeek) {
      onSeek(newPos);
    }
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  if (!currentSong || !currentSong.title) {
    return (
      <>
        <audio ref={audioRef} crossOrigin="anonymous" />
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-dark-hover flex items-center justify-center">
            <svg
              className="w-12 h-12 text-surface-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            No song playing
          </h3>
          <p className="text-surface-400 text-sm">
            {isHost
              ? "Select a song from the queue to start playing"
              : "Waiting for the host to play a song..."}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleAudioError}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onPlay={() => console.log("Audio playing:", audioRef.current?.src)}
        preload="none"
        crossOrigin="anonymous"
      />
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-5">
          {/* Album Art */}
          <div
            className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 ${isPlaying ? "animate-pulse-glow" : ""}`}
          >
            {currentSong.cover ? (
              <img
                src={currentSong.cover}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500/40 to-accent-500/40 flex items-center justify-center">
                {isPlaying ? (
                  <div className="flex items-end gap-0.5 h-8">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="equalizer-bar"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      ></div>
                    ))}
                  </div>
                ) : (
                  <svg
                    className="w-8 h-8 text-white/60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                )}
              </div>
            )}
            {/* Overlay if playing and has cover */}
            {currentSong.cover && isPlaying && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="flex items-end gap-0.5 h-6">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="equalizer-bar"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Song Info + Controls */}
          <div className="flex-1 min-w-0">
            <div className="mb-3">
              <h3 className="font-bold text-white text-lg truncate">
                {currentSong.title}
              </h3>
              <p className="text-sm text-surface-400 truncate">
                {currentSong.artist}
                {currentSong.album ? ` · ${currentSong.album}` : ""}
              </p>
              {isLoading && (
                <p className="text-xs text-primary-400 mt-1">
                  Loading audio...
                </p>
              )}
              {audioError && (
                <p className="text-xs text-red-400 mt-1">{audioError}</p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-surface-500 w-10 text-right tabular-nums">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative">
                <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 300}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  disabled={!isHost}
                />
              </div>
              <span className="text-xs text-surface-500 w-10 tabular-nums">
                {formatTime(duration || 0)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Previous */}
                <button
                  disabled={!isHost}
                  className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-dark-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                {/* Play/Pause */}
                <button
                  onClick={() =>
                    isHost && onTogglePlayback(!isPlaying, currentTime)
                  }
                  disabled={!isHost}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    isHost
                      ? "bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg hover:shadow-primary-500/25 transform hover:scale-105 active:scale-95"
                      : "bg-dark-hover text-surface-400 cursor-not-allowed"
                  }`}
                  id="play-pause-btn"
                >
                  {isPlaying ? (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Next */}
                <button
                  disabled={!isHost}
                  className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-dark-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMuted(!muted)}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-white transition-colors"
                >
                  {muted || volume === 0 ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseInt(e.target.value));
                    setMuted(false);
                  }}
                  className="w-20 h-1"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 ${muted ? 0 : volume}%, #2a2a3e ${muted ? 0 : volume}%)`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {!isHost && (
          <div className="mt-3 text-center text-xs text-surface-500">
            🔒 Only the host can control playback
          </div>
        )}
      </div>
    </>
  );
}
