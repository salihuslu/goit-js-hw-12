import axios from 'axios';
import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const API_KEY = '50099197-cf66e6150e6b3edf0d1a830a4';
const BASE_URL = 'https://pixabay.com/api/';
const PER_PAGE = 40;
let currentPage = 1;
let currentQuery = '';
let totalHits = 0;

const form = document.querySelector('#search-form');
const input = document.querySelector('input[name="searchQuery"]');
const gallery = document.querySelector('.gallery');
const loader = document.querySelector('.loader');
const loadMoreBtn = document.querySelector('.load-more');

let lightbox = new SimpleLightbox('.gallery a');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    currentQuery = input.value.trim();
    if (!currentQuery) return;

    currentPage = 1;
    gallery.innerHTML = '';
    loadMoreBtn.classList.add('hidden');
    showLoader(true);

    try {
        const { hits, totalHits: total } = await fetchImages(currentQuery, currentPage);
        totalHits = total;
        if (hits.length === 0) {
            iziToast.error({
                message: 'Sorry, there are no images matching your search query. Please try again!',
                position: 'topRight',
            });
        } else {
            renderImages(hits);
            lightbox.refresh();
            if (totalHits > PER_PAGE && gallery.children.length > 0) {
                loadMoreBtn.classList.remove('hidden');
            }
        }
    } catch (error) {
        iziToast.error({
            message: 'An error occurred while fetching images.',
            position: 'topRight',
        });
    } finally {
        showLoader(false);
    }
});

loadMoreBtn.addEventListener('click', async () => {
    currentPage++;
    showLoader(true);

    try {
        const { hits } = await fetchImages(currentQuery, currentPage);
        renderImages(hits);
        lightbox.refresh();
        scrollByCards();

        if (currentPage * PER_PAGE >= totalHits) {
            loadMoreBtn.classList.add('hidden');
            iziToast.info({
                message: "We're sorry, but you've reached the end of search results.",
                position: 'topRight',
            });
        }
    } catch (error) {
        iziToast.error({
            message: 'An error occurred while loading more images.',
            position: 'topRight',
        });
    } finally {
        showLoader(false);
    }
});

async function fetchImages(query, page) {
    const response = await axios.get(BASE_URL, {
        params: {
            key: API_KEY,
            q: query,
            image_type: 'photo',
            orientation: 'horizontal',
            safesearch: true,
            page: page,
            per_page: PER_PAGE,
        },
    });
    return response.data;
}

function renderImages(images) {
    const markup = images
        .map(
            ({
                webformatURL,
                largeImageURL,
                tags,
                likes,
                views,
                comments,
                downloads,
            }) => `
    <div class="photo-card">
      <a href="${largeImageURL}">
        <img src="${webformatURL}" alt="${tags}" loading="lazy" />
      </a>
      <div class="info">
        <div><p class="label">Likes</p><p class="value">${likes}</p></div>
        <div><p class="label">Views</p><p class="value">${views}</p></div>
        <div><p class="label">Comments</p><p class="value">${comments}</p></div>
        <div><p class="label">Downloads</p><p class="value">${downloads}</p></div>
      </div>
    </div>`
        )
        .join('');
    gallery.insertAdjacentHTML('beforeend', markup);
}

function showLoader(show) {
    if (show) {
        loader.classList.remove('hidden');
    } else {
        loader.classList.add('hidden');
    }
}


function scrollByCards() {
    const { height: cardHeight } = gallery.firstElementChild.getBoundingClientRect();
    window.scrollBy({
        top: cardHeight * 2,
        behavior: 'smooth',
    });
}
