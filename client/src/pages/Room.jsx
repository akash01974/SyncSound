import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import MusicPlayer from "../components/MusicPlayer";
import Chat from "../components/Chat";
import SongUploader from "../components/SongUploader";
import LocalSongs from "../components/LocalSongs";

export default function Room() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const { socket } = useSocket();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [messages, setMessages] = useState([]);
  const [showQueue, setShowQueue] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [votes, setVotes] = useState({});
  const [activePanel, setActivePanel] = useState("chat"); // chat, queue, people
  const [localSongs, setLocalSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  const isHost = room?.host?._id === user?._id;

  useEffect(() => {
    fetchRoom();
    // Fetch songs once API is available (after auth)
    if (api) {
      fetchLocalSongs();
    }
  }, [id, api]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("joinRoom", { roomId: id });

    socket.on("roomState", (data) => {
      setRoom(data.room);
      if (data.currentSong?.title) setCurrentSong(data.currentSong);
      setIsPlaying(data.isPlaying);
      setPlaybackPosition(data.playbackPosition);
      setLoading(false);
    });

    socket.on("userJoined", (data) => {
      setRoom((prev) =>
        prev ? { ...prev, participants: data.participants } : prev,
      );
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          message: `${data.username} joined the room`,
          timestamp: new Date(),
        },
      ]);
    });

    socket.on("userLeft", (data) => {
      setRoom((prev) =>
        prev ? { ...prev, participants: data.participants } : prev,
      );
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          message: `${data.username} left the room`,
          timestamp: new Date(),
        },
      ]);
    });

    socket.on("songChanged", (data) => {
      setCurrentSong(data.song);
      setIsPlaying(data.isPlaying);
      setPlaybackPosition(data.playbackPosition);
    });

    socket.on("playbackToggled", (data) => {
      setIsPlaying(data.isPlaying);
      setPlaybackPosition(data.playbackPosition);
    });

    socket.on("playbackSeeked", (data) => {
      setPlaybackPosition(data.position);
    });

    socket.on("newMessage", (data) => {
      setMessages((prev) => [...prev, { ...data, type: "user" }]);
    });

    socket.on("playlistUpdated", (data) => {
      setRoom((prev) => (prev ? { ...prev, playlist: data.playlist } : prev));
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          message: `${data.addedBy} added a song to the queue`,
          timestamp: new Date(),
        },
      ]);
    });

    socket.on("voteUpdated", (data) => {
      setVotes((prev) => ({ ...prev, [data.songIndex]: data.totalVotes }));
    });

    return () => {
      socket.emit("leaveRoom", { roomId: id });
      socket.off("roomState");
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("songChanged");
      socket.off("playbackToggled");
      socket.off("playbackSeeked");
      socket.off("newMessage");
      socket.off("playlistUpdated");
      socket.off("voteUpdated");
    };
  }, [socket, id]);

  const fetchRoom = async () => {
    try {
      const res = await api.get(`/rooms/${id}`);
      setRoom(res.data);
    } catch (err) {
      console.error("Error fetching room:", err);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalSongs = async () => {
    try {
      setLoadingSongs(true);
      const res = await api.get("/users/local-songs");
      setLocalSongs(res.data || []);
    } catch (err) {
      console.error(
        "Error fetching local songs:",
        err.response?.data || err.message,
      );
      setLocalSongs([]);
    } finally {
      setLoadingSongs(false);
    }
  };

  const handlePlaySong = (song) => {
    if (!isHost || !socket) return;
    socket.emit("playSong", { roomId: id, song });
  };

  const handleTogglePlayback = (playing, position) => {
    if (!isHost || !socket) return;
    socket.emit("togglePlayback", { roomId: id, isPlaying: playing, position });
  };

  const handleSeek = (position) => {
    if (!isHost || !socket) return;
    socket.emit("seekSong", { roomId: id, position });
  };

  const handleSendMessage = (message) => {
    if (!socket || !message.trim()) return;
    socket.emit("chatMessage", { roomId: id, message });
  };

  const handleAddToQueue = (song) => {
    if (!socket) return;
    socket.emit("addToRoomPlaylist", { roomId: id, song });
    // Switch back to queue view after adding a song
    setActivePanel('queue');
  };

  const handleVote = (songIndex, vote) => {
    if (!socket) return;
    socket.emit("voteSong", { roomId: id, songIndex, vote });
  };

  const handleCloseRoom = async () => {
    try {
      await api.delete(`/rooms/${id}`);
      navigate("/");
    } catch (err) {
      console.error("Error closing room:", err);
    }
  };

  const handleSongUploaded = (uploadedSong) => {
    handleAddToQueue(uploadedSong);
    setShowUploader(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
          <p className="text-surface-400">Joining room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-surface-400 text-lg">Room not found</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 rounded-xl bg-primary-600 text-white"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn h-full flex flex-col">
      {/* Room Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-dark-hover transition-colors text-surface-400 hover:text-white"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              {room.name}
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                LIVE
              </span>
            </h1>
            <p className="text-sm text-surface-400">
              Hosted by {room.host?.username} · {room.participants?.length || 0}{" "}
              listeners
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <button
              onClick={handleCloseRoom}
              className="px-4 py-2 rounded-lg text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
            >
              Close Room
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Left: Player + Queue */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          {/* Music Player */}
          <MusicPlayer
            currentSong={currentSong}
            isPlaying={isPlaying}
            playbackPosition={playbackPosition}
            isHost={isHost}
            onTogglePlayback={handleTogglePlayback}
            onSeek={handleSeek}
          />

          {/* Panel Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-dark-card">
            {[
              {
                id: "queue",
                label: "Song Queue",
                count: room.playlist?.length,
              },
              { id: "songs", label: "Browse Songs" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  activePanel === tab.id
                    ? "bg-dark-hover text-white"
                    : "text-surface-400 hover:text-white"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Queue / Browse Panel */}
          <div className="flex-1 glass rounded-xl overflow-y-auto min-h-0 p-4">
            {activePanel === "queue" && (
              <div className="space-y-2">
                {room.playlist?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-surface-400">
                      Queue is empty. Add songs to get started!
                    </p>
                  </div>
                ) : (
                  room.playlist?.map((song, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-hover transition-all group"
                    >
                      <span className="text-surface-500 text-sm w-6 text-center">
                        {i + 1}
                      </span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                        {song.cover ? (
                          <img src={song.cover} alt="" className="w-full h-full object-cover" />
                        ) : (
                          "🎵"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">
                          {song.title}
                        </p>
                        <p className="text-xs text-surface-400 truncate">
                          {song.artist}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVote(i, 1)}
                          className="p-1.5 rounded-lg hover:bg-dark-elevated text-surface-400 hover:text-green-400 transition-all"
                        >
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
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>
                        <span
                          className={`text-xs font-medium min-w-[20px] text-center ${(votes[i] || 0) > 0 ? "text-green-400" : (votes[i] || 0) < 0 ? "text-red-400" : "text-surface-400"}`}
                        >
                          {votes[i] || 0}
                        </span>
                        <button
                          onClick={() => handleVote(i, -1)}
                          className="p-1.5 rounded-lg hover:bg-dark-elevated text-surface-400 hover:text-red-400 transition-all"
                        >
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
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                      {isHost && (
                        <button
                          onClick={() => handlePlaySong(song)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition-all"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activePanel === 'songs' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUploader(!showUploader)}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-primary-600/20 to-accent-600/20 text-white text-sm font-medium hover:from-primary-600 hover:to-accent-600 transition-all border border-primary-500/20"
                  >
                    {showUploader ? 'Cancel Upload' : 'Upload New Song'}
                  </button>
                </div>

                {showUploader && (
                  <div className="animate-fadeIn">
                    <SongUploader onUploaded={handleSongUploaded} />
                  </div>
                )}

                <LocalSongs
                  songs={localSongs}
                  loading={loadingSongs}
                  onAddToQueue={handleAddToQueue}
                  onPlaySong={handlePlaySong}
                  onRefresh={fetchLocalSongs}
                  isHost={isHost}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Chat + Participants */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Participants */}
          <div className="glass rounded-xl p-4 flex-shrink-0">
            <h3 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Listeners ({room.participants?.length || 0})
            </h3>
            <div className="flex flex-wrap gap-2">
              {room.participants?.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-hover text-sm"
                  title={p.username}
                >
                  <img
                    src={
                      p.avatar ||
                      `https://ui-avatars.com/api/?name=${p.username}&background=6c5ce7&color=fff&size=24`
                    }
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-white text-xs font-medium truncate max-w-[100px]">
                    {p.username}
                  </span>
                  {p._id === room.host?._id && (
                    <span className="text-yellow-400 text-xs">👑</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 min-h-0">
            <Chat messages={messages} onSend={handleSendMessage} />
          </div>
        </div>
      </div>
    </div>
  );
}
