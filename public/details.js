const BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');

    if (!movieId) {
        document.getElementById('details').innerText = 'No movie ID provided.';
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/movies/details/${movieId}`);
        const movie = await res.json();

        // Details section
        const detailsContainer = document.getElementById('details');
        detailsContainer.textContent = ''; // Clear loading text

        const title = document.createElement('h4');
        title.textContent = movie.title;

        const genres = document.createElement('p');
        genres.innerHTML = `<strong>Genres:</strong> ${movie.genres.join(', ')}`;

        const releaseDate = document.createElement('p');
        releaseDate.innerHTML = `<strong>Release Date:</strong> ${movie.release_date}`;

        const rating = document.createElement('p');
        rating.innerHTML = `<strong>Average Rating:</strong> ${movie.rating}`;

        const cast = document.createElement('p');
        cast.innerHTML = `<strong>Top Cast:</strong> ${movie.cast.join(', ')}`;

        const overview = document.createElement('p');
        overview.innerHTML = `<strong>Overview:</strong> ${movie.overview}`;

        // Poster image (optional)
        if (movie.poster_url) {
            const poster = document.createElement('img');
            poster.src = movie.poster_url;
            poster.alt = `Poster for ${movie.title}`;
            poster.classList.add('img-fluid', 'my-3');
            poster.style.maxWidth = '200px';
            detailsContainer.appendChild(poster);
        }

        detailsContainer.append(title, genres, releaseDate, rating, cast, overview);

        // Reviews section
        const reviewList = document.getElementById('reviewList');
        reviewList.textContent = ''; // Clear loading text
        console.log('reviews:', movie);
        if (!movie.reviews || movie.reviews.length === 0) {
            reviewList.textContent = 'No reviews available.';
        } else {
            movie.reviews.forEach((review, i) => {
                const row = document.createElement('div');
                row.classList.add('d-flex', 'mb-3', 'border-bottom', 'pb-3', 'gap-3');

                const avatar = document.createElement('img');
                avatar.src = 'profile_img.png';
                avatar.alt = 'User avatar';
                avatar.classList.add('rounded-circle');
                avatar.width = 48;
                avatar.height = 48;

                const content = document.createElement('div');

                const header = document.createElement('p');
                header.classList.add('mb-1');
                header.innerHTML = `<strong>${review.author}</strong>`;
                if (review.created_at) {
                    header.innerHTML += ` <small class="text-muted">(${review.created_at})</small>`;
                }

                const comment = document.createElement('p');
                comment.classList.add('fst-italic', 'mb-0');
                comment.textContent = review.content;


                content.append(header, comment);
                row.append(avatar, content);
                reviewList.appendChild(row);
            });
        }


    } catch (err) {
        console.error(err);
        document.getElementById('details').textContent = 'Error loading movie details.';
        document.getElementById('reviewList').textContent = 'Error loading reviews.';
    }
});
