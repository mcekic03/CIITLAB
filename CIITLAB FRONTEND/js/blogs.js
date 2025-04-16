const API_BASE_URL = 'http://160.99.40.221:3500'


async function getAllBlogs() {
  
  
  try {
    const response = await fetch(`${API_BASE_URL}/blogs/getAll`);
    if (response.ok) {
      const blogs = await response.json();
      return blogs;
    } else {
      throw new Error('Failed to load blogs');
    }
  } catch (error) {
    console.error('Error loading blogs:', error);
    showError('Failed to load blogs');
  }
}

async function loadBlogs() {
  const newsGrid = document.querySelector('.news-grid');
  if (!newsGrid) return;
 
  const blogs = await getAllBlogs();
  console.log(blogs);
  console.log(blogs[0].id);

  blogs.forEach((blog) => {
    const newsCard = document.createElement('div');
    newsCard.className = 'news-card';
    newsCard.innerHTML = `
            <div class="news-image">
              <img src="${blog.banerUrl}" alt="News Image" />
            </div>
            <div class="news-content">
              <div class="news-meta">
                <span class="category">${blog.category}</span>
                <span class="date">${formatDate(blog.created_at)}</span>
              </div>
              <h3>${blog.title}</h3>
              <p>
                ${blog.excerpt}
              </p>
              <div class="news-footer">
                <span class="author">By ${blog.firstName} ${blog.lastName}</span>
                <a href="blog-detail.html?id=${blog.id}" class="read-more"
                  >Read More <i class="fas fa-arrow-right"></i
                ></a>
              </div>
            </div>

        `;
    newsGrid.appendChild(newsCard);
  });
}



document.addEventListener('DOMContentLoaded', function () {
  loadBlogs();
  const newsCards = document.querySelectorAll('.news-card');

  // Add click event listeners to each card
  newsCards.forEach((card) => {
    card.addEventListener('click', function (e) {
      // Don't trigger if clicking on the read more link
      if (e.target.closest('.read-more')) {
        return;
      }

      // Find the read more link in the card
      const readMoreLink = card.querySelector('.read-more');
      if (readMoreLink) {
        // Navigate to the blog detail page
        window.location.href = readMoreLink.getAttribute('href');
      }
    });
  });

  // Add hover effect to cards
  newsCards.forEach((card) => {
    card.style.cursor = 'pointer';
  });
});
