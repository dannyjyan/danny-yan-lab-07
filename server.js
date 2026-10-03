const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Movie = require('./models/Movie'); // MongoDB model
const axios = require('axios'); // For API requests

// TMDB API Key
require('dotenv').config(); // Load variables from .env. Remember to add .env to .gitignore so it is not visible to the public!

const app = express();
const port = 3000;

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

let genreMap = null;

async function loadGenreMap() {
    if (genreMap) return genreMap; // already cached

    try {
        const response = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
            params: { api_key: process.env.TMDB_API_KEY }
        });

        genreMap = {};
        for (const genre of response.data.genres) {
            genreMap[genre.id] = genre.name;
        }
        return genreMap;
    } catch (err) {
        console.error('Failed to load genre list from TMDB:', err.message);
        genreMap = {}; // fallback to empty object
        return genreMap;
    }
}
function mapGenresToNames(genreIds, genreMap) {
    return genreIds.map(id => genreMap[id] || 'Unknown').join(', ');
}

// Routes

// Get one random popular movie from TMDb
app.get('/movies/random', async (req, res) => {
    if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ error: 'API key missing' });
    }

    try {
        const genreMap = await loadGenreMap(); // ensure genres are loaded
        const page = Math.floor(Math.random() * 10) + 1;
        const response = await axios.get('https://api.themoviedb.org/3/movie/popular', {
            params: { api_key: process.env.TMDB_API_KEY, page }
        });

        const results = response.data.results;
        if (!results.length) return res.json([]);

        const movie = results[Math.floor(Math.random() * results.length)];

        res.json([{
            id: movie.id,
            title: movie.title,
            overview: movie.overview,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
            poster_url: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : null,
            genres: mapGenresToNames(movie.genre_ids, genreMap)
        }]);
    } catch (err) {
        console.error('TMDB API Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch from TMDB' });
    }
});

// Search movies using TMDB API (no longer needed to fetch from a manually populated MongoDB database)
app.get('/movies/search', async (req, res) => {
    let { name = '', genre = '' } = req.query; // Default to empty string if not provided in query
    if (genre.toLowerCase() === 'all') genre = ''; // Treat 'all' as no genre filter
    if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({
            error: 'TMDB API key is not set. Please create a .env file and set the TMDB_API_KEY variable.'
        });
    }

    try {
        const genreMap = await loadGenreMap();
        let results = [];

        // Step 1: If a name is provided, use the TMDB search endpoint
        if (name) {
            const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
                params: {
                    api_key: process.env.TMDB_API_KEY,
                    query: name
                }
            });
            results = response.data.results;
        } else {
            // Step 2: If no name, fallback to popular movies
            const page = Math.floor(Math.random() * 3) + 1; // smaller sample
            const response = await axios.get('https://api.themoviedb.org/3/movie/popular', {
                params: {
                    api_key: process.env.TMDB_API_KEY,
                    page
                }
            });
            results = response.data.results;
        }

        // Step 3: Filter by genre (if provided)
        let filtered = results;
        if (genre) { // If a genre is specified in the query, filter results
            const target = genre.toLowerCase();
            filtered = results.filter(movie => {
                const genreString = mapGenresToNames(movie.genre_ids, genreMap).toLowerCase();
                return genreString.includes(target);
            });
        }

        const movies = filtered.map(movie => ({
            id: movie.id,
            title: movie.title,
            overview: movie.overview,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
            poster_url: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            genres: mapGenresToNames(movie.genre_ids, genreMap)
        }));

        res.json(movies);
    } catch (err) {
        console.error('TMDB API Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch movies from TMDB.' });
    }
});

app.get('/movies/genres', async (req, res) => {
    if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({
            error: 'TMDB API key is not set. Please create a .env file and set the TMDB_API_KEY variable.'
        });
    }

    try {
        const response = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
            params: {
                api_key: process.env.TMDB_API_KEY
            }
        });

        const genreMap = {};
        response.data.genres.forEach(genre => {
            genreMap[genre.id] = genre.name;
        });

        res.json(genreMap);
    } catch (err) {
        console.error('Error fetching genres:', err.message);
        res.status(500).json({ error: 'Failed to fetch genre list' });
    }
});
app.get('/movies/details/:id', async (req, res) => { //combined details, credits, and reviews
    const movieId = req.params.id;

    if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({
            error: 'TMDB API key is not set. Please create a .env file and set the TMDB_API_KEY variable.'
        });
    }

    try {
        const [details, credits, reviews] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                params: { api_key: process.env.TMDB_API_KEY }
            }),
            axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                params: { api_key: process.env.TMDB_API_KEY }
            }),
            axios.get(`https://api.themoviedb.org/3/movie/${movieId}/reviews`, {
                params: { api_key: process.env.TMDB_API_KEY }
            })
        ]);

        res.json({
            id: details.data.id,
            title: details.data.title,
            overview: details.data.overview,
            release_date: details.data.release_date,
            genres: details.data.genres.map(g => g.name),
            rating: details.data.vote_average,
            poster_url: details.data.poster_path
                ? `https://image.tmdb.org/t/p/w500${details.data.poster_path}` : null,
            cast: credits.data.cast.slice(0, 5).map(c => c.name),
            reviews: reviews.data.results.map(r => ({
                author: r.author,
                content: r.content,
                created_at: new Date(r.created_at).toLocaleDateString(),
            }))
        });
    } catch (err) {
        console.error('Error fetching movie details:', err.message);
        res.status(500).json({ error: 'Failed to fetch movie details' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
