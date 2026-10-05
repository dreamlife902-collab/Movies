import movies from './movies.js';

const movieList = document.getElementById('movie-list');
const searchInput = document.getElementById('inp');
const typeFilter = document.getElementById('type-filter');
const sortOrder = document.getElementById('sort-order');
const searchButton = document.querySelector('button');

const typeAliases = {
    romance: ['romance', 'romantic'],
    horror: ['horror'],
    comedy: ['comedy'],
    action: ['action'],
    thriller: ['thriller'],
    mystery: ['mystery'],
    'sci-fi': ['sci-fi', 'science fiction', 'science-fiction'],
    fantasy: ['fantasy'],
    drama: ['drama'],
    superhero: ['superhero'],
    adventure: ['adventure'],
    zombie: ['zombie'],
    crime: ['crime'],
    psychological: ['psychological'],
    war: ['war'],
    family: ['family'],
    sports: ['sport', 'sports'],
    racing: ['racing'],
    cyberpunk: ['cyberpunk'],
    'post-apocalyptic': ['post-apocalyptic', 'post apocalyptic']
};

function normalizeText(value) {
    return String(value ?? '').trim();
}

function buildMoviePoster(movie) {
    const title = normalizeText(movie.Title) || 'Movie';
    const hash = Array.from(title).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const hueA = hash % 360;
    const hueB = (hueA + 80) % 360;
    const label = title.length > 18 ? `${title.slice(0, 18)}…` : title;
    const safeLabel = label
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" role="img" aria-label="${safeLabel}">
            <defs>
                <linearGradient id="g" x1="0" x2="1">
                    <stop offset="0%" stop-color="hsl(${hueA} 80% 55%)"/>
                    <stop offset="100%" stop-color="hsl(${hueB} 75% 45%)"/>
                </linearGradient>
            </defs>
            <rect width="300" height="450" fill="url(#g)"/>
            <rect x="22" y="22" width="256" height="406" rx="18" fill="rgba(15,23,42,0.22)" stroke="rgba(255,255,255,0.7)" stroke-width="3"/>
            <circle cx="150" cy="150" r="58" fill="rgba(255,255,255,0.18)"/>
            <path d="M128 113h44v94h-44zM92 149h20v54H92zm96 0h20v54h-20z" fill="rgba(255,255,255,0.82)"/>
            <text x="150" y="285" text-anchor="middle" font-size="26" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#f8fafc">${safeLabel}</text>
            <text x="150" y="320" text-anchor="middle" font-size="15" font-family="Arial, Helvetica, sans-serif" fill="#e2e8f0">MOVIE</text>
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function sortMovies(items, sortValue) {
    const sorted = [...items];

    switch (sortValue) {
        case 'name':
            sorted.sort((a, b) => normalizeText(a.Title).localeCompare(normalizeText(b.Title)));
            break;
        case 'number':
            sorted.sort((a, b) => Number(b.movie_year) - Number(a.movie_year));
            break;
        case '18plus':
            sorted.sort((a, b) => Number(b.imdb_rating) - Number(a.imdb_rating));
            break;
        case '6plus':
            sorted.sort((a, b) => Number(a.runtime) - Number(b.runtime));
            break;
        case '3plus':
            sorted.sort((a, b) => normalizeText(a.Title).length - normalizeText(b.Title).length);
            break;
        default:
            sorted.sort((a, b) => Number(b.movie_year) - Number(a.movie_year));
            break;
    }

    return sorted;
}

function getMatchingCategories(movie) {
    const categories = String(movie.Categories || '').toLowerCase();

    return Object.entries(typeAliases).filter(([type, aliases]) =>
        aliases.some(alias => categories.includes(alias))
    ).map(([type]) => type);
}

function filterMovies(items) {
    const search = searchInput.value.toLowerCase().trim();
    const selectedType = typeFilter.value;

    return items.filter((movie) => {
        const title = normalizeText(movie.Title).toLowerCase();
        const summary = normalizeText(movie.summary).toLowerCase();
        const matchesSearch = !search || title.includes(search) || summary.includes(search);
        const matchesType = selectedType === 'all' || getMatchingCategories(movie).includes(selectedType);

        return matchesSearch && matchesType;
    });
}

function renderMovies(items) {
    if (!movieList) return;

    if (items.length === 0) {
        movieList.innerHTML = '<div class="notresult">Not Found</div>';
        return;
    }

    movieList.innerHTML = items.map((movie) => {
        const categories = String(movie.Categories || 'Uncategorized')
            .split('|')
            .map((category) => category.trim())
            .filter(Boolean)
            .slice(0, 2)
            .join(' · ');

        const title = normalizeText(movie.Title) || 'Untitled';
        const summary = normalizeText(movie.summary) || 'No summary available.';
        const poster = movie.ImageURL || buildMoviePoster(movie);
        const posterFallback = buildMoviePoster(movie);

        return `
            <article class="movie-card">
                <img src="${poster}" data-fallback="${posterFallback}" alt="${title}" loading="lazy" onerror="this.onerror=null;this.src=this.dataset.fallback;">
                <div class="movie-body">
                    <div class="movie-meta">
                        <span class="movie-year">${movie.movie_year}</span>
                        <span class="movie-category">${categories || 'Uncategorized'}</span>
                    </div>
                    <h3>${title}</h3>
                    <button type="button" class="toggle-summary" aria-expanded="false">Description</button>
                    <p class="movie-summary">${summary}</p>
                    <div class="movie-stats">
                        <span>⭐ ${movie.imdb_rating || 'N/A'}</span>
                        <span>⏱ ${movie.runtime || 0} min</span>
                        <span>${movie.language || 'Unknown'}</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    movieList.querySelectorAll('.toggle-summary').forEach((button) => {
        button.addEventListener('click', () => {
            const card = button.closest('.movie-card');
            const summary = card?.querySelector('.movie-summary');

            if (!card || !summary) return;

            const isOpen = card.classList.toggle('is-open');
            button.textContent = isOpen ? 'Hide description' : 'Description';
            button.setAttribute('aria-expanded', String(isOpen));
            summary.hidden = !isOpen;
        });
    });
}

function updateList() {
    const visibleMovies = sortMovies(filterMovies(movies), sortOrder.value);
    renderMovies(visibleMovies);
}

if (searchInput) {
    searchInput.addEventListener('input', updateList);
}

if (searchButton) {
    searchButton.addEventListener('click', updateList);
}

if (typeFilter) {
    typeFilter.addEventListener('change', updateList);
}

if (sortOrder) {
    sortOrder.addEventListener('change', updateList);
}

updateList();