const express = require("express");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Activity = require("../models/Activity");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/users/search?q=
router.get("/search", auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const users = await User.find({
      username: { $regex: q, $options: "i" },
      _id: { $ne: req.user.id },
    })
      .select("username avatar bio isOnline")
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/friends
router.get("/friends", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "friends",
      "username avatar bio isOnline currentRoom",
    );

    res.json(user.friends);
  } catch (error) {
    console.error("Get friends error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/friend-requests
router.get("/friend-requests", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "friendRequests.from",
      "username avatar bio",
    );

    res.json(user.friendRequests);
  } catch (error) {
    console.error("Get friend requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/users/friend-request/:id
router.post("/friend-request/:id", auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const userId = req.user.id;

    if (targetId === userId) {
      return res
        .status(400)
        .json({ message: "Cannot send friend request to yourself" });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUser = await User.findById(userId);

    if (currentUser.friends.includes(targetId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    if (currentUser.sentRequests.includes(targetId)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    const existingRequest = targetUser.friendRequests.find(
      (r) => r.from.toString() === userId,
    );
    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    targetUser.friendRequests.push({ from: userId });
    currentUser.sentRequests.push(targetId);

    await Promise.all([targetUser.save(), currentUser.save()]);

    res.json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Friend request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/users/accept-friend/:id
router.post("/accept-friend/:id", auth, async (req, res) => {
  try {
    const fromId = req.params.id;
    const userId = req.user.id;

    const currentUser = await User.findById(userId);
    const fromUser = await User.findById(fromId);

    if (!fromUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const requestIndex = currentUser.friendRequests.findIndex(
      (r) => r.from.toString() === fromId,
    );

    if (requestIndex === -1) {
      return res
        .status(400)
        .json({ message: "No friend request from this user" });
    }

    currentUser.friendRequests.splice(requestIndex, 1);
    currentUser.friends.push(fromId);
    fromUser.friends.push(userId);
    fromUser.sentRequests = fromUser.sentRequests.filter(
      (id) => id.toString() !== userId,
    );

    await Promise.all([currentUser.save(), fromUser.save()]);

    await Activity.create({
      user: userId,
      type: "became_friends",
      details: { friendName: fromUser.username },
    });

    res.json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Accept friend error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/users/reject-friend/:id
router.post("/reject-friend/:id", auth, async (req, res) => {
  try {
    const fromId = req.params.id;
    const userId = req.user.id;

    const currentUser = await User.findById(userId);
    currentUser.friendRequests = currentUser.friendRequests.filter(
      (r) => r.from.toString() !== fromId,
    );

    const fromUser = await User.findById(fromId);
    if (fromUser) {
      fromUser.sentRequests = fromUser.sentRequests.filter(
        (id) => id.toString() !== userId,
      );
      await fromUser.save();
    }

    await currentUser.save();

    res.json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Reject friend error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { bio, avatar } = req.body;
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true },
    ).select("-password");

    res.json(user);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/recommendations
router.get("/recommendations", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Get demo songs library
    const demoSongs = getDemoSongs();

    // Simple recommendation: songs not in listening history
    const historyTitles = new Set(user.listeningHistory.map((h) => h.title));
    const recommended = demoSongs.filter((s) => !historyTitles.has(s.title));

    // Shuffle and take top 10
    const shuffled = recommended.sort(() => Math.random() - 0.5).slice(0, 10);

    res.json(shuffled);
  } catch (error) {
    console.error("Recommendations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/local-songs (requires auth)
router.get("/local-songs", auth, async (req, res) => {
  try {
    const songsDir = path.join(__dirname, "../songs");
    console.log("Songs directory path:", songsDir);

    // Ensure directory exists
    if (!fs.existsSync(songsDir)) {
      console.log("Songs directory does not exist, creating it...");
      fs.mkdirSync(songsDir, { recursive: true });
    }

    const files = fs.readdirSync(songsDir);
    console.log("Files in songs directory:", files);

    const songs = files
      .filter(
        (file) =>
          file.endsWith(".mp3") ||
          file.endsWith(".m4a") ||
          file.endsWith(".wav"),
      )
      .map((file) => {
        const filePath = path.join(songsDir, file);
        const stats = fs.statSync(filePath);

        // Extract title and artist from filename (basic parsing)
        const nameWithoutExt = file.replace(/\.(mp3|m4a|wav)$/i, "");
        const parts = nameWithoutExt.split(" - ");
        const title = parts.length > 1 ? parts[1] : nameWithoutExt;
        const artist = parts.length > 1 ? parts[0] : "Unknown Artist";

        // Return plain filename, let frontend handle encoding or keep it simple
        return {
          title,
          artist,
          album: "Local Songs",
          url: `/songs/${file}`, // Use raw filename, frontend will encode if needed
          cover: `https://picsum.photos/seed/${encodeURIComponent(title + artist)}/300/300`,
          duration: 180,
          filename: file,
        };
      });

    console.log("Returning songs:", songs);
    res.json(songs);
  } catch (error) {
    console.error("Get local songs error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/test-songs (no auth required - for testing)
router.get("/test-songs", async (req, res) => {
  try {
    const songsDir = path.join(__dirname, "../songs");
    console.log("[TEST] Songs directory path:", songsDir);

    if (!fs.existsSync(songsDir)) {
      return res.json({
        error: "Songs directory does not exist",
        path: songsDir,
      });
    }

    const files = fs.readdirSync(songsDir);
    console.log("[TEST] All files in directory:", files);

    const songs = files
      .filter(
        (file) =>
          file.endsWith(".mp3") ||
          file.endsWith(".m4a") ||
          file.endsWith(".wav"),
      )
      .map((file) => {
        const encoded = encodeURIComponent(file);
        return {
          filename: file,
          url: `/songs/${encoded}`,
        };
      });

    console.log("[TEST] Filtered songs:", songs);
    res.json({
      success: true,
      directory: songsDir,
      totalFiles: files.length,
      audioFiles: songs.length,
      songs,
    });
  } catch (error) {
    console.error("[TEST] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -friendRequests -sentRequests")
      .populate("friends", "username avatar isOnline");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

function getDemoSongs() {
  return [
    {
      title: "Midnight Groove",
      artist: "Neon Pulse",
      album: "Electric Dreams",
      genre: "Electronic",
    },
    {
      title: "Sunset Boulevard",
      artist: "Coastal Waves",
      album: "Ocean Drive",
      genre: "Chill",
    },
    {
      title: "Urban Echoes",
      artist: "City Lights",
      album: "Concrete Jungle",
      genre: "Hip-Hop",
    },
    {
      title: "Stellar Dreams",
      artist: "Cosmic Ray",
      album: "Nebula",
      genre: "Ambient",
    },
    {
      title: "Rhythm & Soul",
      artist: "Velvet Touch",
      album: "Soulful Nights",
      genre: "R&B",
    },
    {
      title: "Thunder Strike",
      artist: "Storm Chaser",
      album: "Electric Storm",
      genre: "Rock",
    },
    {
      title: "Crystal Clear",
      artist: "Pure Vibes",
      album: "Serenity",
      genre: "Ambient",
    },
    {
      title: "Neon Lights",
      artist: "Synth Wave",
      album: "Retro Future",
      genre: "Synthwave",
    },
    {
      title: "Golden Hour",
      artist: "Sunset Crew",
      album: "Warm Tones",
      genre: "Chill",
    },
    {
      title: "Bass Drop",
      artist: "Deep Freq",
      album: "Sub Level",
      genre: "Electronic",
    },
    {
      title: "Moonlit Path",
      artist: "Night Owl",
      album: "After Dark",
      genre: "Lo-fi",
    },
    {
      title: "Fire Dance",
      artist: "Blaze Runner",
      album: "Inferno",
      genre: "Latin",
    },
    {
      title: "Ocean Breeze",
      artist: "Tropical Heat",
      album: "Island Life",
      genre: "Reggae",
    },
    {
      title: "Digital Rain",
      artist: "Cyber Punk",
      album: "Matrix",
      genre: "Electronic",
    },
    {
      title: "Velvet Sky",
      artist: "Aurora",
      album: "Northern Lights",
      genre: "Dream Pop",
    },
    {
      title: "Heavy Metal Heart",
      artist: "Iron Will",
      album: "Steel",
      genre: "Metal",
    },
    {
      title: "Jazz Cafe",
      artist: "Smooth Jazz Trio",
      album: "Late Night",
      genre: "Jazz",
    },
    {
      title: "Reggae Sun",
      artist: "Island Vibes",
      album: "Chill Island",
      genre: "Reggae",
    },
    {
      title: "Piano Sonata",
      artist: "Classical Soul",
      album: "Ivory Keys",
      genre: "Classical",
    },
    {
      title: "Funk Machine",
      artist: "Groove Master",
      album: "Funky Town",
      genre: "Funk",
    },
  ];
}

module.exports = router;
