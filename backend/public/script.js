// Global variables
let token = localStorage.getItem('token') || null;
let currentPage = 1;
let totalPages = 1;
let currentBookId = null;

// DOM elements
const authStatusEl = document.getElementById('auth-status');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const formLogin = document.getElementById('form-login');
const formSignup = document.getElementById('form-signup');
const booksSection = document.getElementById('books-section');
const searchBtn = document.getElementById('search-btn');
const addBookBtn = document.getElementById('add-book-btn');
const modal = document.getElementById('book-modal');
const closeBtn = document.querySelector('.close');
const bookForm = document.getElementById('book-form');
const modalTitle = document.getElementById('modal-title');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const notification = document.getElementById('notification');

// Initialize the app
function init() {
    checkAuthStatus();
    setupEventListeners();
}

// Check if user is logged in
function checkAuthStatus() {
    if (token) {
        authStatusEl.querySelector('button.active')?.classList.remove('active');
        logoutBtn.style.display = 'block';
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        document.getElementById('auth-forms').style.display = 'none';
        booksSection.style.display = 'block';
        loadBooks();
    } else {
        logoutBtn.style.display = 'none';
        loginBtn.style.display = 'block';
        signupBtn.style.display = 'block';
        document.getElementById('auth-forms').style.display = 'block';
        booksSection.style.display = 'none';
    }
}

// Set up event listeners
function setupEventListeners() {
    // Auth button clicks
    loginBtn.addEventListener('click', () => showAuthForm('login'));
    signupBtn.addEventListener('click', () => showAuthForm('signup'));
    logoutBtn.addEventListener('click', logout);
    
    // Form submissions
    formLogin.addEventListener('submit', handleLogin);
    formSignup.addEventListener('submit', handleSignup);
    
    // Book actions
    searchBtn.addEventListener('click', () => {
        currentPage = 1;
        loadBooks();
    });
    addBookBtn.addEventListener('click', showAddBookModal);
    bookForm.addEventListener('submit', handleSaveBook);
    
    // Pagination
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadBooks();
        }
    });
    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadBooks();
        }
    });
    
    // Modal close
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// Show login or signup form
function showAuthForm(type) {
    if (type === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        loginBtn.classList.add('active');
        signupBtn.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        loginBtn.classList.remove('active');
        signupBtn.classList.add('active');
    }
}

// Parse JSON safely with error handling
async function safeParseJSON(response) {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error('Failed to parse JSON:', text);
        throw new Error('Invalid server response. Please try again later.');
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await safeParseJSON(response);
        
        if (!response.ok) {
            throw new Error(data?.message || 'Login failed');
        }
        
        // Save token and update UI
        token = data.token;
        localStorage.setItem('token', token);
        checkAuthStatus();
        showNotification('Logged in successfully!');
    } catch (error) {
        showNotification(error.message, true);
    }
}

// Handle signup form submission
async function handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await safeParseJSON(response);
        
        if (!response.ok) {
            throw new Error(data?.message || 'Signup failed');
        }
        
        // Save token and update UI
        token = data.token;
        localStorage.setItem('token', token);
        checkAuthStatus();
        showNotification('Account created successfully!');
    } catch (error) {
        showNotification(error.message, true);
    }
}

// Logout
function logout() {
    token = null;
    localStorage.removeItem('token');
    checkAuthStatus();
    showNotification('Logged out successfully!');
}

// Load books with filtering and pagination
async function loadBooks() {
    try {
        // Get filter values
        const title = document.getElementById('search-title').value;
        const author = document.getElementById('filter-author').value;
        const category = document.getElementById('filter-category').value;
        const rating = document.getElementById('filter-rating').value;
        
        // Build query string
        const queryParams = new URLSearchParams();
        if (title) queryParams.append('title', title);
        if (author) queryParams.append('author', author);
        if (category) queryParams.append('category', category);
        if (rating) queryParams.append('rating', rating);
        queryParams.append('page', currentPage);
        queryParams.append('limit', 6); // Show 6 books per page
        
        const response = await fetch(`/api/books?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            logout();
            throw new Error('Session expired. Please login again.');
        }
        
        if (!response.ok) {
            throw new Error('Failed to load books');
        }
        
        const result = await safeParseJSON(response);
        
        // Check if result has the expected structure
        if (!result || !result.data) {
            throw new Error('Invalid data format received from server');
        }
        
        displayBooks(result.data);
        
        // Update pagination - safely handle missing pagination data
        totalPages = result.pagination?.pages || 1;
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    } catch (error) {
        showNotification(error.message, true);
    }
}

// Display books in the UI
function displayBooks(books) {
    const container = document.getElementById('books-container');
    container.innerHTML = '';
    
    if (!books || books.length === 0) {
        container.innerHTML = '<p>No books found. Try different filters or add a new book.</p>';
        return;
    }
    
    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        
        // Safely format date
        let publishedDate = 'N/A';
        try {
            publishedDate = new Date(book.publishedDate).toLocaleDateString();
        } catch (e) {
            console.error('Invalid date format:', book.publishedDate);
        }
        
        // Safely handle price formatting
        const price = typeof book.price === 'number' ? book.price.toFixed(2) : 'N/A';
        
        bookCard.innerHTML = `
            <h3 class="book-title">${book.title || 'Untitled'}</h3>
            <p class="book-author">by ${book.author || 'Unknown'}</p>
            <div class="book-details">
                <p>Category: ${book.category || 'Uncategorized'}</p>
                <p>Price: $${price}</p>
                <p>Rating: ${book.rating || 'N/A'} / 5</p>
                <p>Published: ${publishedDate}</p>
            </div>
            <div class="book-actions">
                <button class="btn" onclick="editBook('${book.id}')">Edit</button>
                <button class="btn" style="background-color: #e74c3c;" onclick="deleteBook('${book.id}')">Delete</button>
            </div>
        `;
        
        container.appendChild(bookCard);
    });
}

// Show modal to add a new book
function showAddBookModal() {
    modalTitle.textContent = 'Add New Book';
    bookForm.reset();
    document.getElementById('book-id').value = '';
    currentBookId = null;
    
    // Set today as the default publishing date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('book-published').value = today;
    
    modal.style.display = 'block';
}

// Edit a book
async function editBook(id) {
    try {
        const response = await fetch(`/api/books/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please login again.');
        }
        
        if (!response.ok) throw new Error('Failed to load book details');
        
        const book = await safeParseJSON(response);
        
        if (!book || !book.id) {
            throw new Error('Invalid book data received');
        }
        
        // Populate form
        modalTitle.textContent = 'Edit Book';
        document.getElementById('book-id').value = book.id;
        document.getElementById('book-title').value = book.title || '';
        document.getElementById('book-author').value = book.author || '';
        document.getElementById('book-category').value = book.category || '';
        document.getElementById('book-price').value = book.price || 0;
        document.getElementById('book-rating').value = book.rating || 0;
        
        // Format date for input - handle potential invalid dates
        let publishedDate = new Date().toISOString().split('T')[0]; // Default to today
        if (book.publishedDate) {
            try {
                publishedDate = new Date(book.publishedDate).toISOString().split('T')[0];
            } catch (e) {
                console.error('Invalid date format:', book.publishedDate);
            }
        }
        document.getElementById('book-published').value = publishedDate;
        
        currentBookId = book.id;
        modal.style.display = 'block';
    } catch (error) {
        showNotification(error.message, true);
    }
}

// Delete a book
async function deleteBook(id) {
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
        const response = await fetch(`/api/books/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please login again.');
        }
        
        if (!response.ok) {
            const errorData = await safeParseJSON(response);
            throw new Error(errorData?.message || 'Failed to delete book');
        }
        
        loadBooks();
        showNotification('Book deleted successfully!');
    } catch (error) {
        showNotification(error.message, true);
    }
}

// Handle saving a book (add or edit)
async function handleSaveBook(e) {
    e.preventDefault();
    
    try {
        // Validate form input
        const title = document.getElementById('book-title').value.trim();
        const author = document.getElementById('book-author').value.trim();
        
        if (!title) throw new Error('Book title is required');
        if (!author) throw new Error('Author name is required');
        
        // Get other values
        const category = document.getElementById('book-category').value.trim();
        const priceStr = document.getElementById('book-price').value;
        const ratingStr = document.getElementById('book-rating').value;
        const publishedDate = document.getElementById('book-published').value;
        
        // Parse numeric values with validation
        const price = parseFloat(priceStr);
        if (isNaN(price) || price < 0) throw new Error('Price must be a positive number');
        
        const rating = parseFloat(ratingStr);
        if (isNaN(rating) || rating < 0 || rating > 5) throw new Error('Rating must be between 0 and 5');
        
        // Validate date
        if (!publishedDate) throw new Error('Published date is required');
        
        const bookData = {
            title,
            author,
            category,
            price,
            rating,
            publishedDate
        };
        
        let url = '/api/books';
        let method = 'POST';
        
        if (currentBookId) {
            url = `/api/books/${currentBookId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookData)
        });
        
        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please login again.');
        }
        
        if (!response.ok) {
            const errorData = await safeParseJSON(response);
            throw new Error(errorData?.message || 'Failed to save book');
        }
        
        closeModal();
        loadBooks();
        showNotification(currentBookId ? 'Book updated successfully!' : 'Book added successfully!');
    } catch (error) {
        showNotification(error.message, true);
    }
}

// Close the modal
function closeModal() {
    modal.style.display = 'none';
}

// Show notification
function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.className = 'notification' + (isError ? ' error' : '');
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Add global functions to window for onclick handlers
window.editBook = editBook;
window.deleteBook = deleteBook;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);