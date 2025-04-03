// Sample data for news items
const newsItems = [
  {
    title: 'New Research Publication in NLP',
    date: '2024-03-15',
    summary:
      'Our team has published a groundbreaking paper on advanced NLP techniques...',
    image: 'images/news1.jpg',
  },
  {
    title: 'Logic Design Workshop',
    date: '2024-03-10',
    summary:
      'Join us for an exciting workshop on modern logic design approaches...',
    image: 'images/news2.jpg',
  },
  {
    title: 'Web Programming Conference',
    date: '2024-03-05',
    summary:
      'Our researchers presented at the International Web Programming Conference...',
    image: 'images/news3.jpg',
  },
];

const currentYear = new Date().getFullYear();
document.getElementById('currentYear').innerText = currentYear;

// Function to load news items
function loadNews() {
  const newsGrid = document.querySelector('.news-grid');
  if (!newsGrid) return;

  newsItems.forEach((item) => {
    const newsCard = document.createElement('div');
    newsCard.className = 'news-card';
    newsCard.innerHTML = `
            <img src="${item.image}" alt="${item.title}">
            <div class="news-content">
                <h3>${item.title}</h3>
                <p class="date">${formatDate(item.date)}</p>
                <p>${item.summary}</p>
                <a href="#" class="btn btn-outline">Read More</a>
            </div>
        `;
    newsGrid.appendChild(newsCard);
  });
}

// Function to format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function createResponsiveNavbar() {
  // Check if document is loaded
  if (typeof document === 'undefined') return;

  // Select existing navbar
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelector('.nav-links');

  if (!navbar || !navLinks) return;

  // Create burger menu
  const burgerMenu = document.createElement('div');
  burgerMenu.classList.add('burger-menu');
  burgerMenu.innerHTML = `
    <div class="burger-line"></div>
    <div class="burger-line"></div>
    <div class="burger-line"></div>
  `;

  // Add burger menu before nav links
  navbar.insertBefore(burgerMenu, navLinks);

  // Toggle function for menu
  burgerMenu.addEventListener('click', () => {
    // Toggle class for navbar and links
    navLinks.classList.toggle('active');
    burgerMenu.classList.toggle('active');
  });

  // Add event listener to document to close menu when clicking outside
  document.addEventListener('click', (event) => {
    // Check if click is outside burger menu and nav links
    if (!navbar.contains(event.target)) {
      navLinks.classList.remove('active');
      burgerMenu.classList.remove('active');
    }
  });
  
  // Prevent menu from closing when clicking inside nav links
  navLinks.addEventListener('click', (event) => event.stopPropagation());

  // Responsive logic
  function handleResponsive() {
    const screenWidth = window.innerWidth;
    // If width is less than 890px
    if (screenWidth <= 1000) {
      navbar.classList.add('mobile-view');
      burgerMenu.style.display = 'flex';
      navLinks.classList.add('mobile-menu');
    } else {
      navbar.classList.remove('mobile-view');
      burgerMenu.style.display = 'none';
      navLinks.classList.remove('mobile-menu');
      navLinks.classList.remove('active');
    }
  }

  // Initial call
  handleResponsive();

  // Listen for screen size changes
  window.addEventListener('resize', handleResponsive);
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadNews();
  createResponsiveNavbar();


  const appbtn = document.querySelector('.button-dropdown');
  const posTaggingLink = document.getElementById('posTaggingLink');
  const sentimentAnalysisLink = document.getElementById(
    'sentimentAnalysisLink'
  );
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.role) {
    console.log(user.role);
    if (
      user.role === 'researcher' ||
      user.role === 'admin' ||
      user.role === 'anotator1' ||
      user.role === 'anotator2'
    ) {
      appbtn.style.display = 'inline-block';
    } else {
      appbtn.style.display = 'none';
      console.log('ne moze');
    }

    if (
      user.role === 'researcher' ||
      user.role === 'admin' ||
      user.role === 'anotator2'
    ) {
      posTaggingLink.style.display = 'block';
    } else {
      posTaggingLink.style.display = 'none';
      console.log('ne moze');
    }

    if (
      user.role === 'researcher' ||
      user.role === 'admin' ||
      user.role === 'anotator1'
    ) {
      sentimentAnalysisLink.style.display = 'block';
    } else {
      sentimentAnalysisLink.style.display = 'none';
      console.log('ne moze');
    }
  } else {
    console.log('Korisnik nije prijavljen ili nema ulogu.');
    appbtn.style.display = 'none';
    posTaggingLink.style.display = 'none';
    sentimentAnalysisLink.style.display = 'none';
  }
});
