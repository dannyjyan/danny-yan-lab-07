const mongoose = require('mongoose');

// Movie Schema
const movieSchema = new mongoose.Schema({
    name: String,
    genre: String,
    review: Number,
    //TODO: Add more fields as needed (e.g : director, release date, etc.)
});

// Movie Model
const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;