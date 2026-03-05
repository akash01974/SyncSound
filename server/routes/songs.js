
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const songsDirectory = path.join(__dirname, '../songs');

router.get('/', (req, res) => {
    fs.readdir(songsDirectory, (err, files) => {
        if (err) {
            console.error('Error reading songs directory:', err);
            return res.status(500).json({ message: 'Error fetching songs' });
        }

        const songs = files
            .filter(file => file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.ogg') || file.endsWith('.m4a'))
            .map(file => {
                const filePath = path.join(songsDirectory, file);
                const baseName = path.basename(file, path.extname(file));
                let artist = 'Unknown Artist';
                let title = baseName;

                if (baseName.includes(' - ')) {
                    const parts = baseName.split(' - ');
                    artist = parts[0].trim();
                    title = parts[1].trim();
                }

                return {
                    title,
                    artist,
                    url: `/songs/${file}`, // Use raw filename, frontend will encode if needed
                    cover: `https://picsum.photos/seed/${encodeURIComponent(title + artist)}/300/300`,
                    duration: 0, 
                };
            });

        res.json(songs);
    });
});

module.exports = router;
