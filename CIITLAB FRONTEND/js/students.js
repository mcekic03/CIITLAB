// API Base URL
const API_BASE_URL = 'http://160.99.40.221:3500/users';

// Authentication token
const authToken = localStorage.getItem('authToken');

// Function to display researchers in the grid
async function displayStudents(students) {
  const studentsGrid = document.querySelector('.researchers-grid');

  studentsGrid.innerHTML = students
    .map(
      (student) => `
        <div class="researcher-card">
            <div class="researcher-image">
                <img src="${
                  student.profileImage || 'http://160.99.40.221:3500/users/images/default-avatar.svg'
                }" alt="${student.firstName} ${student.lastName}" />
            </div>
            <div class="researcher-info">
                <h3>${student.firstName} ${student.lastName}</h3>
                <p class="email">${student.email}</p>
                <p class="researcher-excerpt">
                    ${student.bio || 'No biography available.'}
                </p>
                <a href="profile.html?id=${
                  student.id
                }" class="btn btn-outline">View Profile</a>
            </div>
        </div>
    `
    )
    .join('');
}

// Function to fetch students
async function fetchStudents() {
  try {
    const response = await fetch(`${API_BASE_URL}/getStudents`);
    if (response.ok) {
      const students = await response.json();
      displayStudents(students);
    } else {
      showError('Failed to load students');
    }
  } catch (error) {
    console.error('Error fetching students:', error);
    showError('An error occurred while loading students');
  }
}

// Update login button visibility
function updateLoginButtonVisibility() {
  const authButtons = document.querySelector('.auth-buttons');
  if (authButtons) {
    if (authToken) {
      authButtons.innerHTML = `
        <button class="btn btn-outline" onclick="handleLogout()">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      `;
    } else {
      authButtons.innerHTML = `
        <a href="login.html" class="btn btn-outline">Login</a>
      `;
    }
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  window.location.href = 'index.html';
}

// Utility function to show errors
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  fetchStudents();
  updateLoginButtonVisibility();
});

// Function to create student profile page
function createStudentProfile(student) {
  return `
        <div class="student-profile">
            <div class="profile-header">
                <div class="profile-image">
                    <img src="${student.image}" alt="${student.firstName} ${
    student.lastName
  }">
                </div>
                <div class="profile-info">
                    <h1>${student.firstName} ${student.lastName}</h1>
                    <p class="email">${student.email}</p>
                </div>
            </div>

            <section class="profile-section">
                <h2>Education</h2>
                <ul>
                    ${student.education
                      .map((edu) => `<li>${edu}</li>`)
                      .join('')}
                </ul>
            </section>

            <section class="profile-section">
                <h2>Biography</h2>
                <p>${student.biography}</p>
            </section>

            <section class="profile-section">
                <h2>Publications</h2>
                <div class="publications-list">
                    ${student.publications
                      .map(
                        (pub) => `
                        <div class="publication-item">
                            <h3>${pub.title}</h3>
                            <p>${pub.venue}</p>
                            <p>${pub.month} ${pub.year}</p>
                            <p>Authors: ${pub.authors.join(', ')}</p>
                            <p>DOI: <a href="https://doi.org/${
                              pub.doi
                            }" target="_blank">${pub.doi}</a></p>
                        </div>
                    `
                      )
                      .join('')}
                </div>
            </section>

            <section class="profile-section">
                <h2>Projects</h2>
                <div class="projects-list">
                    ${student.projects
                      .map(
                        (proj) => `
                        <div class="project-item">
                            <h3>${proj.title}</h3>
                            <p>Year: ${proj.year}</p>
                            <p>Funding Source: ${proj.fundingSource}</p>
                        </div>
                    `
                      )
                      .join('')}
                </div>
            </section>
        </div>
    `;
}

// Function to load student profile
function loadStudentProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = parseInt(urlParams.get('id'));

  if (!studentId) return;

  const student = students.find((s) => s.id === studentId);
  if (!student) return;

  const mainContent = document.querySelector('main');
  if (mainContent) {
    mainContent.innerHTML = createStudentProfile(student);
  }
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('student-profile.html')) {
    loadStudentProfile();
  } else {
    fetchStudents();
  }
});

// Toggle edit mode
function toggleEditMode() {
  const editForm = document.querySelector('.edit-profile-form');
  const displayMode = document.querySelector('.profile-header').parentElement;

  if (editForm.style.display === 'none') {
    editForm.style.display = 'block';
    displayMode.style.display = 'none';
  } else {
    editForm.style.display = 'none';
    displayMode.style.display = 'flex';
  }
}

// Handle education item addition
document.addEventListener('DOMContentLoaded', function () {
  const addEducationBtn = document.querySelector('.add-education');
  if (addEducationBtn) {
    addEducationBtn.addEventListener('click', addEducationItem);
  }

  // Handle education item removal
  document.querySelectorAll('.remove-item').forEach((btn) => {
    btn.addEventListener('click', removeEducationItem);
  });

  // Handle form submissions
  const profileForm = document.getElementById('profileEditForm');
  const educationForm = document.getElementById('educationEditForm');

  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileUpdate);
  }

  if (educationForm) {
    educationForm.addEventListener('submit', handleEducationUpdate);
  }
});

function addEducationItem() {
  const educationList = document.querySelector('.education-list');
  const newItem = document.createElement('div');
  newItem.className = 'education-item';
  newItem.innerHTML = `
    <div class="form-group">
      <label>Degree</label>
      <input type="text" required>
    </div>
    <div class="form-group">
      <label>Institution</label>
      <input type="text" required>
    </div>
    <div class="form-group">
      <label>Years</label>
      <input type="text" required>
    </div>
    <button type="button" class="btn btn-outline remove-item">
      <i class="fas fa-trash"></i>
    </button>
  `;

  // Insert before the "Add Education" button
  educationList.insertBefore(newItem, this);

  // Add event listener to the new remove button
  newItem
    .querySelector('.remove-item')
    .addEventListener('click', removeEducationItem);
}

function removeEducationItem() {
  this.closest('.education-item').remove();
}

async function handleProfileUpdate(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const profileData = {
    name: formData.get('name'),
    email: formData.get('email'),
    bio: formData.get('bio'),
  };

  try {
    // Here you would typically make an API call to update the profile
    // For now, we'll just simulate a successful update
    console.log('Updating profile:', profileData);

    // Update the display
    document.querySelector('.profile-info h1').textContent = profileData.name;
    document.querySelector('.profile-info .email').textContent =
      profileData.email;
    document.querySelector('.profile-info .bio').textContent = profileData.bio;

    // Handle profile image if uploaded
    const imageFile = formData.get('profileImage');
    if (imageFile.size > 0) {
      // Here you would typically upload the image to your server
      // For now, we'll just show a preview
      const reader = new FileReader();
      reader.onload = function (e) {
        document.querySelector('.profile-image img').src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    }
    // Show success message
    showNotification('Profile updated successfully!', 'success');
    toggleEditMode();
  } catch (error) {
    showNotification('Failed to update profile. Please try again.', 'error');
  }
}

async function handleEducationUpdate(e) {
  e.preventDefault();

  const educationItems = document.querySelectorAll('.education-item');
  const educationData = Array.from(educationItems).map((item) => ({
    degree: item.querySelector('input[type="text"]:nth-of-type(1)').value,
    institution: item.querySelector('input[type="text"]:nth-of-type(2)').value,
    years: item.querySelector('input[type="text"]:nth-of-type(3)').value,
  }));

  try {
    // Here you would typically make an API call to update the education
    console.log('Updating education:', educationData);

    // Update the display
    const educationList = document.querySelector('.profile-section ul');
    educationList.innerHTML = educationData
      .map(
        (edu) => `<li>${edu.degree} - ${edu.institution} (${edu.years})</li>`
      )
      .join('');

    showNotification('Education updated successfully!', 'success');
  } catch (error) {
    showNotification('Failed to update education. Please try again.', 'error');
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Toggle functions for edit forms
function togglePublicationsEdit() {
  const editForm = document.querySelector('.edit-publications-form');
  const displayMode = document.querySelector('.publications-list');

  if (editForm.style.display === 'none') {
    editForm.style.display = 'block';
    displayMode.style.display = 'none';
  } else {
    editForm.style.display = 'none';
    displayMode.style.display = 'grid';
  }
}

function toggleResourcesEdit() {
  const editForm = document.querySelector('.edit-resources-form');
  const displayMode = document.querySelector('.resources-list');

  if (editForm.style.display === 'none') {
    editForm.style.display = 'block';
    displayMode.style.display = 'none';
  } else {
    editForm.style.display = 'none';
    displayMode.style.display = 'grid';
  }
}

function toggleBlogEdit() {
  const editForm = document.querySelector('.edit-blog-form');
  const displayMode = document.querySelector('.blog-posts-list');

  if (editForm.style.display === 'none') {
    editForm.style.display = 'block';
    displayMode.style.display = 'none';
  } else {
    editForm.style.display = 'none';
    displayMode.style.display = 'grid';
  }
}

// Add new item functions
function addPublicationItem() {
  const publicationsList = document.querySelector(
    '.edit-publications-form .publications-list'
  );
  const newItem = document.createElement('div');
  newItem.className = 'publication-item';
  newItem.innerHTML = `
    <div class="form-group">
      <label>Title</label>
      <input type="text" required>
    </div>
    <div class="form-group">
      <label>Authors</label>
      <input type="text" required>
    </div>
    <div class="form-group">
      <label>Venue</label>
      <input type="text" required>
    </div>
    <div class="form-group">
      <label>Year</label>
      <input type="number" required>
    </div>
    <div class="form-group">
      <label>DOI</label>
      <input type="text">
    </div>
    <button type="button" class="btn btn-outline remove-item">
      <i class="fas fa-trash"></i>
    </button>
  `;

  publicationsList.insertBefore(newItem, this);
  newItem.querySelector('.remove-item').addEventListener('click', removeItem);
}

function addResourceItem() {
  const resourcesList = document.querySelector(
    '.edit-resources-form .resources-list'
  );
  const newItem = document.createElement('div');
  newItem.className = 'resource-item';
  newItem.innerHTML = `
    <div class="form-group">
      <label>Title</label>
      <input type="text" required>
    </div>
    <div class="form-group">
      <label>Description</label>
      <textarea required></textarea>
    </div>
    <div class="form-group">
      <label>Link</label>
      <input type="url">
    </div>
    <button type="button" class="btn btn-outline remove-item">
      <i class="fas fa-trash"></i>
    </button>
  `;

  resourcesList.insertBefore(newItem, this);
  newItem.querySelector('.remove-item').addEventListener('click', removeItem);
}

function addBlogPostItem() {
  const blogList = document.querySelector('.edit-blog-form .blog-posts-list');
  const newItem = document.createElement('div');
  newItem.className = 'blog-post-item';
  newItem.innerHTML = `
    <div class="form-group">
      <label>Title</label>
      <input type="text" required>
    </div>
    <div class="form-group">
      <label>Publication Date</label>
      <input type="date" required>
    </div>
    <div class="form-group">
      <label>Excerpt</label>
      <textarea required></textarea>
    </div>
    <div class="form-group">
      <label>Content</label>
      <textarea rows="10" required></textarea>
    </div>
    <button type="button" class="btn btn-outline remove-item">
      <i class="fas fa-trash"></i>
    </button>
  `;

  blogList.insertBefore(newItem, this);
  newItem.querySelector('.remove-item').addEventListener('click', removeItem);
}

// Generic remove item function
function removeItem() {
  this.closest('.publication-item, .resource-item, .blog-post-item').remove();
}

// Form submission handlers
async function handlePublicationsUpdate(e) {
  e.preventDefault();

  const publications = Array.from(
    document.querySelectorAll('.edit-publications-form .publication-item')
  ).map((item) => ({
    title: item.querySelector('input[type="text"]:nth-of-type(1)').value,
    authors: item.querySelector('input[type="text"]:nth-of-type(2)').value,
    venue: item.querySelector('input[type="text"]:nth-of-type(3)').value,
    year: item.querySelector('input[type="number"]').value,
    doi: item.querySelector('input[type="text"]:last-child').value,
  }));

  try {
    // Here you would typically make an API call to update the publications
    console.log('Updating publications:', publications);

    // Update the display
    const publicationsList = document.querySelector('.publications-list');
    publicationsList.innerHTML = publications
      .map(
        (pub) => `
      <div class="publication-item">
        <h3>${pub.title}</h3>
        <p>Authors: ${pub.authors}</p>
        <p>Venue: ${pub.venue} (${pub.year})</p>
        <p>DOI: <a href="https://doi.org/${pub.doi}">${pub.doi}</a></p>
      </div>
    `
      )
      .join('');

    showNotification('Publications updated successfully!', 'success');
    togglePublicationsEdit();
  } catch (error) {
    showNotification(
      'Failed to update publications. Please try again.',
      'error'
    );
  }
}

async function handleResourcesUpdate(e) {
  e.preventDefault();

  const resources = Array.from(
    document.querySelectorAll('.edit-resources-form .resource-item')
  ).map((item) => ({
    title: item.querySelector('input[type="text"]').value,
    description: item.querySelector('textarea').value,
    link: item.querySelector('input[type="url"]').value,
  }));

  try {
    // Here you would typically make an API call to update the resources
    console.log('Updating resources:', resources);

    // Update the display
    const resourcesList = document.querySelector('.resources-list');
    resourcesList.innerHTML = resources
      .map(
        (res) => `
      <div class="resource-item">
        <h3>${res.title}</h3>
        <p>${res.description}</p>
        <a href="${res.link}" class="btn btn-outline">View Resource</a>
      </div>
    `
      )
      .join('');

    showNotification('Resources updated successfully!', 'success');
    toggleResourcesEdit();
  } catch (error) {
    showNotification('Failed to update resources. Please try again.', 'error');
  }
}

async function handleBlogUpdate(e) {
  e.preventDefault();

  const blogPosts = Array.from(
    document.querySelectorAll('.edit-blog-form .blog-post-item')
  ).map((item) => ({
    title: item.querySelector('input[type="text"]').value,
    date: item.querySelector('input[type="date"]').value,
    excerpt: item.querySelector('textarea:first-of-type').value,
    content: item.querySelector('textarea:last-of-type').value,
  }));

  try {
    // Here you would typically make an API call to update the blog posts
    console.log('Updating blog posts:', blogPosts);

    // Update the display
    const blogList = document.querySelector('.blog-posts-list');
    blogList.innerHTML = blogPosts
      .map(
        (post) => `
      <div class="blog-post-item">
        <h3>${post.title}</h3>
        <p class="post-meta">Published on ${new Date(
          post.date
        ).toLocaleDateString()}</p>
        <p class="post-excerpt">${post.excerpt}</p>
        <a href="#" class="btn btn-outline">Read More</a>
      </div>
    `
      )
      .join('');

    showNotification('Blog posts updated successfully!', 'success');
    toggleBlogEdit();
  } catch (error) {
    showNotification('Failed to update blog posts. Please try again.', 'error');
  }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function () {
  // Add event listeners for "Add" buttons
  const addPublicationBtn = document.querySelector('.add-publication');
  const addResourceBtn = document.querySelector('.add-resource');
  const addBlogPostBtn = document.querySelector('.add-blog-post');

  if (addPublicationBtn) {
    addPublicationBtn.addEventListener('click', addPublicationItem);
  }
  if (addResourceBtn) {
    addResourceBtn.addEventListener('click', addResourceItem);
  }
  if (addBlogPostBtn) {
    addBlogPostBtn.addEventListener('click', addBlogPostItem);
  }

  // Add event listeners for form submissions
  const publicationsForm = document.getElementById('publicationsEditForm');
  const resourcesForm = document.getElementById('resourcesEditForm');
  const blogForm = document.getElementById('blogEditForm');

  if (publicationsForm) {
    publicationsForm.addEventListener('submit', handlePublicationsUpdate);
  }
  if (resourcesForm) {
    resourcesForm.addEventListener('submit', handleResourcesUpdate);
  }
  if (blogForm) {
    blogForm.addEventListener('submit', handleBlogUpdate);
  }

  // Add event listeners for remove buttons
  document.querySelectorAll('.remove-item').forEach((btn) => {
    btn.addEventListener('click', removeItem);
  });
});
