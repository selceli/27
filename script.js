document.addEventListener('DOMContentLoaded', function () {
	const phoneRegex = /^(\+|00)?[1-9]\d{1,14}$/;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const form = document.getElementById('form');
	const formContainer = document.querySelector('#form-container');
	const searchbutton = document.getElementById('search');

	form.addEventListener('submit', function (event) {
		event.preventDefault();
		let isFormCorrect = true;

		const emailInput = document.getElementById('email');
		const emailError = document.getElementById('emailError');

		const nameInput = document.getElementById('name');
		const nameError = document.getElementById('nameError');

		const surnameInput = document.getElementById('surname');
		const surnameError = document.getElementById('surnameError');

		const ageInput = document.getElementById('age');
		const ageError = document.getElementById('ageError');

		const phoneInput = document.getElementById('phone');
		const phoneError = document.getElementById('phoneError');
		const emailDisplay = document.getElementById('emailAddress');

		if (nameInput.value.length < 3) {
			nameError.textContent =
				'Incorrect name entry! Please enter a valid name...';
			isFormCorrect = false;
		} else {
			nameError.textContent = '';
		}
		if (surnameInput.value.length < 3) {
			surnameError.textContent =
				'Incorrect surname entry! Please enter a valid surname...';
			isFormCorrect = false;
		} else {
			surnameError.textContent = '';
		}
		if (ageInput.value <= 0 || ageInput.value > 120) {
			ageError.textContent =
				'Incorrect age entry! Please enter a valid age between 1-120';
			isFormCorrect = false;
		} else {
			ageError.textContent = '';
		}
		if (!phoneRegex.test(phoneInput.value)) {
			phoneError.textContent = 'Please enter a valid number...';
			isFormCorrect = false;
		} else {
			phoneError.textContent = '';
		}
		if (!emailRegex.test(emailInput.value)) {
			emailError.textContent = 'Please enter a valid email address...';
			isFormCorrect = false;
		} else {
			emailError.textContent = '';
		}
		if (isFormCorrect) {
			formContainer.classList.add('hidden');

			if (emailDisplay) {
				emailDisplay.textContent = emailInput.value;
			} else {
				console.error('emailDisplay element not found!');
			}
			modal.style.display = 'block';
		}
	});
});

const searchBookButton = document.getElementById('searchBook');
let isCancelled = false;
const searchbutton = document.getElementById('search');
searchbutton.classList.add('hidden');

searchBookButton.addEventListener('click', function () {
	isCancelled = false;
	const bookTitle = document.getElementById('bookTitle').value;
	fetchBooks(bookTitle);
});

const clear = document.getElementById('clearSearch');
clear.addEventListener('click', function () {
	const bookTitleInput = document.getElementById('bookTitle');
	bookTitleInput.value = '';
	isCancelled = true;
	const resultsContainerList = document.getElementById(
		'results-container-list'
	);
	resultsContainerList.textContent = '';
	const resultsContainer = document.getElementById('results-container');
	resultsContainer.textContent = '';
});

async function fetchBooks(title) {
	const query = title.replace(/\s+/g, '+');
	const URL = `https://openlibrary.org/search.json?q=${query}`;
	const resultsContainer = document.getElementById('results-container');

	if (!resultsContainer) {
		console.error('resultsContainer element not found!');
		return;
	}

	let fetchingInterval;

	const startFetchingMessage = () => {
		let dots = 0;
		fetchingInterval = setInterval(() => {
			resultsContainer.textContent = 'Waiting for data' + '.'.repeat(dots % 5);
			dots++;
		}, 500);
	};

	startFetchingMessage();

	try {
		const response = await fetch(URL);
		if (isCancelled) {
			clearInterval(fetchingInterval);
			console.log('Fetch cancelled');
			resultsContainer.textContent = 'Fetch cancelled.';
			return;
		}
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();

		console.log(data);
		displayResults(data);
		clearInterval(fetchingInterval);
	} catch (error) {
		console.error(error);
		resultsContainer.textContent = 'Error fetching data.';
		clearInterval(fetchingInterval);
		resultsContainer.textContent = 'Error fetching data: ' + error.message;
	} finally {
		console.log('fetch is done.');
	}
}

function displayResults(data) {
	const resultsContainerList = document.getElementById(
		'results-container-list'
	);
	const resultsContainer = document.getElementById('results-container');
	resultsContainerList.textContent = '';
	resultsContainer.textContent = '';

	if (data.docs.length === 0) {
		resultsContainerList.textContent = 'No results found.';
		return;
	}

	data.docs.forEach((book) => {
		const bookElement = document.createElement('div');
		bookElement.classList.add('book-item');
		bookElement.innerHTML = `
                        <button class="bookKnowledge">${book.title}</button> 
                        <div class="book-details" style="display: none;"></div>
                    `;
		const knowledge = bookElement.querySelector('.bookKnowledge');
		const bookDetails = bookElement.querySelector('.book-details');

		if (knowledge) {
			knowledge.addEventListener('click', function (event) {
				event.preventDefault();
				if (
					bookDetails.style.display === 'none' ||
					bookDetails.style.display === ''
				) {
					fetchBookDetails(book.key, bookDetails);
				} else {
					bookDetails.style.display = 'none';
				}
			});
		} else {
			console.error("Element with class 'bookKnowledge' not found!");
		}
		resultsContainerList.appendChild(bookElement);
	});
}

async function fetchBookDetails(bookKey, bookDetailsContainer) {
	try {
		const response = await fetch(`https://openlibrary.org${bookKey}.json`);

		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const bookData = await response.json();
		displayBookDetails(bookData, bookDetailsContainer);
	} catch (error) {
		console.error('Error fetching book details:', error);
		bookDetailsContainer.textContent = 'Error fetching book details.';
	}
}

async function fetchAuthorDetails(authorKey) {
	try {
		const response = await fetch(
			`https://openlibrary.org/search/authors.json?q=${authorKey}`
		);
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const authorData = await response.json();
		if (authorData.docs && authorData.docs.length > 0) {
			return authorData.docs[0].name;
		} else {
			return 'Unknown';
		}
	} catch (error) {
		console.error('Error fetching author details:', error);
		return 'Unknown';
	}
}
async function displayBookDetails(book, bookDetailsContainer) {
	const coverImageUrl = `https://covers.openlibrary.org/b/id/${
		book.covers ? book.covers[0] : 'default'
	}-L.jpg`;
	let authorName = 'Unknown';

	if (book.authors && book.authors.length > 0) {
		authorName = await fetchAuthorDetails(book.authors[0].key);
	}

	const bookDetailsHTML = `
                    <h3>${book.title}</h3>
                    <p>Author: ${authorName}</p>
                    <p>Pages: ${book.number_of_pages || 'Unknown'}</p>
                    <p>Year: ${book.publish_date || 'Unknown'}</p>
                    <img src="${coverImageUrl}" alt="${book.title} cover">
                `;
	bookDetailsContainer.innerHTML = bookDetailsHTML;
	bookDetailsContainer.style.display = 'block';
}
var modal = document.getElementById('myModal');
var span = document.getElementsByClassName('close')[0];

span.onclick = function () {
	modal.style.display = 'none';
	const search = document.getElementById('search-area');
	search.classList.remove('hidden');
};

window.onclick = function (event) {
	if (event.target == modal) {
		modal.style.display = 'none';
	}
};
