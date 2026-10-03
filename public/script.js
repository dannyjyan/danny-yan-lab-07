// Specify the base URL for the backend
const BASE_URL = 'http://localhost:3000'; // Change this when deploying to production

const movieName = document.getElementById('movieName');
const movieGenre = document.getElementById('movieGenre');
const genreDropdown = document.getElementById('genre');
const searchInput = document.getElementById('searchInput');
const getMovieButton = document.getElementById('getMovieButton');
const searchButton = document.getElementById('searchButton');
const clearButton = document.getElementById('clearButton');
const moviePoster = document.getElementById('moviePoster');
const movieTableBody = document.getElementById('movieTableBody');

// Function to fetch and display movies
function fetchMovies(endpoint) {
    console.log(`Fetching movies from: ${BASE_URL}${endpoint}`);
    fetch(`${BASE_URL}${endpoint}`).then(response => response.json()).then(data => {
        movieTableBody.innerHTML = '';
        if (data.length === 0) {
            movieTableBody.innerHTML = `<tr><td colspan="4">No movies found.</td></tr>`;
            return;
        }

        data.forEach(movie => {
            const row = document.createElement('tr');

            const poster = movie.poster_url
                ? `<img src="${movie.poster_url}" style="max-width: 80px;">`
                : 'N/A';

            const genres = movie.genres || 'Unknown';

            console.log('movie object:', movie);
            console.log(`Movie ID: ${movie.id}, Title: ${movie.title}, Genres: ${genres}`);
            row.innerHTML = `
                <td>${poster}</td>
                <td>${movie.title}</td>
                <td>${genres}</td>
                <td><a href="details.html?id=${movie.id}" class="btn btn-sm btn-info">View</a></td>
            `;
            movieTableBody.appendChild(row);
        });
    }).catch(error => {
        console.error('Error fetching movies:', error);
        movieTableBody.innerHTML = `<tr><td colspan="4">Error fetching data.</td></tr>`;
    });
}

// Event listeners
getMovieButton.addEventListener('click', () => {
    fetchMovies('/movies/random');
});

searchButton.addEventListener('click', () => {
    const name = searchInput.value.trim();
    const genre = genreDropdown.value;

    if (!name && genre === 'all') {
        alert("Please enter a movie name or select a genre. You can click on get a random movie to start!");
        return;
    }

    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (genre && genre !== 'all') params.append('genre', genre);

    fetchMovies(`/movies/search?${params.toString()}`);
});


clearButton.addEventListener('click', () => {
    movieName.textContent = "Click 'Get Movie' to start!";
    movieGenre.textContent = "";
    searchInput.value = "";
});
