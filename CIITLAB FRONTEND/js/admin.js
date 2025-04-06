// API Base URL
const API_BASE_URL = 'http://160.99.40.221:3500/admin';

function formatDate(isoString) {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0'); // lokalni dan
  const month = String(date.getMonth() + 1).padStart(2, '0'); // lokalni mesec
  const year = date.getFullYear(); // lokalna godina
  const hours = String(date.getHours()).padStart(2, '0'); // lokalni sati
  const minutes = String(date.getMinutes()).padStart(2, '0'); // lokalni minuti

  return `${day}.${month}.${year}. ${hours}:${minutes}`;
}


// Authentication token
let authToken = localStorage.getItem('authToken');

// Navigation
document.querySelectorAll('.admin-nav a').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = e.currentTarget.dataset.section;
    showSection(section);
  });
});

function showSection(sectionId) {
  // Update active nav link
  document.querySelectorAll('.admin-nav a').forEach((link) => {
    link.classList.remove('active');
    if (link.dataset.section === sectionId) {
      link.classList.add('active');
    }
  });

  // Show selected section
  document.querySelectorAll('.admin-section').forEach((section) => {
    section.classList.remove('active');
    if (section.id === sectionId) {
      section.classList.add('active');
    }
  });

  // Load section data
  switch (sectionId) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'researchers':
      loadResearchers();
      break;
    case 'publications':
      loadPublications();
      break;
    case 'resources':
      loadResources();
      break;
    case 'blogs':
      loadBlogs();
      break;
    case 'users':
      loadUsers();
      break;
    case 'applications':
      loadApp();
    case 'students':
      loadStudents();
      break;
    default:
      console.warn(`Unknown section: ${sectionId}`);
  }
}

// Modal Functions
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function (event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
};


window.addEventListener('load', function(){
  
  setTimeout(() => {
    document.getElementById("modalLoading").style.display = "none";
  }, 1200);



});




// Dashboard Functions
async function loadDashboardData() {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    console.log(data);

    document.getElementById('total-researchers').textContent =
      data.totalResearchers;
    document.getElementById('total-publications').textContent =
      data.totalPublications;
    document.getElementById('total-resources').textContent =
      data.totalResources;
    document.getElementById('total-blogs').textContent = data.totalBlogs;
    document.getElementById('total-students-work').textContent =
      data.totalWorks;
    document.getElementById('total-annotators').textContent =
      data.totalAnnotators;
    document.getElementById('total-phd-students').textContent =
      data.totalStudents;
    document.getElementById('total-phd-students').textContent =
      data.totalStudents;
    displayRecentActivity(data.recentActivity);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showError('Failed to load dashboard data');
  }
}

function displayRecentActivity(activities) {
  const activityList = document.getElementById('activity-list');
  console.log(activityList);
  activityList.innerHTML = activities
    .map(
      (activity) => `
        <div class="activity-item">
            <i class="fas ${getActivityIcon(activity.type)}"></i>
            <div class="activity-content">
                <p>${activity.description}</p>
                <small>${new Date(activity.timestamp).toLocaleString()}</small>
            </div>
        </div>
    `
    )
    .join('');
}

/// Funkcija za preuzimanje jednog fajla sa opcionalnim custom imenom fajla
async function downloadFile(url, filename) {
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || 'download.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('File download error:', error);
  }
}

async function downloadAnnotatorData(annotatorId) {
  const url = `${API_BASE_URL}/downloadAnotatorSentencesCSV/${annotatorId}`;
  const filename = generateDateFilename(`annotator_${annotatorId}_sentences`);
  await downloadFile(url, filename);
}

// Funkcija za generisanje imena fajla sa trenutnim datumom
function generateDateFilename(prefix, extension = 'csv') {
  const now = new Date();
  const year = now.getFullYear();
  // Dodajemo +1 za mesec jer getMonth() vraća 0-11, i padStart za vodeće nule
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${prefix}_${year}_${month}_${day}.${extension}`;
}

function getActivityIcon(type) {
  switch (type) {
    case 'users':
      return 'fa-user';
    case 'publications':
      return 'fa-book';
    case 'resources':
      return 'fa-folder';
    case 'blogs':
      return 'fa-blog';
    case 'studentswork':
      return 'fa-briefcase';
    case 'applications':
      return 'fa-cube';
    case 'students':
      return 'fa-graduation-cap';
    default:
      return 'fa-info-circle';
  }
}

async function displayPosTaggingAnnotation() {
  const appTable = document.getElementById('app-table');
  appTable.innerHTML = `<p>Aplikacija u izradi</p>`;
}



async function displayNone() {
  const appTable = document.getElementById('app-table');
  appTable.innerHTML = `<h3>Choose application</h3>`;
}

async function displaySentimentAnalysis() {
  try {
    const response = await fetch(`${API_BASE_URL}/sentimentAnalysis/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    console.log(data);

    const { countAnnotators, countDoneSentences, countNotSureSentences, sentimentCount } = data;

    document.getElementById('total-sentimentAnalysis-annotators').textContent = countAnnotators;
    document.getElementById('total-annotated-sentences').textContent = countDoneSentences;
    document.getElementById('total-neutral-sentences').textContent = countNotSureSentences;

    document.getElementById('app-table').innerHTML = `
      <thead>
        <tr>
          <th>Annotator ID</th>
          <th>Annotator</th>
          <th>Total Sentences</th>
          <th>Last Annotation</th>
          <th style="text-align: center; vertical-align: middle;">Download Annotator's Sentences</th>
        </tr>
      </thead>
      <tbody id="app-list">
        ${sentimentCount.map(({ annotator_id, annotator, total_sentences, last_time }) => `
          <tr>
            <td>${annotator_id}</td>
            <td>${annotator}</td>
            <td>${total_sentences}</td>
            <td>${formatDate(last_time)}</td>
            <td style="text-align: center; vertical-align: middle;">
              <button class="btn-icon" onclick="downloadAnnotatorData('${annotator_id}')">
                <i class="fas fa-download"></i>
              </button>
            </td>
          </tr>`).join('')}
      </tbody>
    `;

    [
      { id: 'downloadButtonDone', url: '/downloadDoneCSV', prefix: 'sentiment_data_done' },
      { id: 'downloadButtonFlag', url: '/downloadNotSureCSV', prefix: 'sentiment_data_not_sure' },
      { id: 'downloadButtonUnprocessed', url: '/downloadNotProcessCSV', prefix: 'sentiment_data_unprocessed' }
    ].forEach(({ id, url, prefix }) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => downloadFile(`${API_BASE_URL}${url}`, generateDateFilename(prefix)));
    });
  } catch (error) {
    console.error('Error loading annotators:', error);
    showError('Failed to load annotators');
  }
}

// Researcher Functions
function loadApp() {
  const select = document.getElementById('app-select');
  const app = document.querySelector('.app-stats');

  // Remove any existing event listeners to prevent duplicates
  const newSelect = select.cloneNode(true);
  select.parentNode.replaceChild(newSelect, select);

  newSelect.addEventListener('change', function (event) {
    const selectedValue = event.target.value;

    console.log('Selektovana vrednost:', selectedValue);

    if (selectedValue === 'sentimentAnalysis') {
      displaySentimentAnalysis();
      app.classList.add('active');
    } else if (selectedValue === 'posTagging') {
      app.classList.remove('active');
      displayPosTaggingAnnotation();
    } else if (selectedValue === 'none') {
      app.classList.remove('active');
      displayNone();
    }
  });
}

async function loadStudents() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/admin', '/users')}/getStudents`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const students = await response.json();
    console.log(students);
    const studentsList = document.getElementById('students-list');
    studentsList.innerHTML = students
      .map(
        (student) => `
            <tr>
                <td>${student.id}</td>
                <td>${student.firstName} ${student.lastName}</td>
                <td>${student.email}</td>
                <td><span class="status ${student.status}">${student.status}</span></td>
            </tr>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading students:', error);
    showError('Failed to load students');
  }
}
async function loadResearchers() {
  try {
    const response = await fetch(`${API_BASE_URL}/getAllResearchers`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const researchers = await response.json();
    console.log(researchers[5]);
    const researchersList = document.getElementById('researchers-list');
    researchersList.innerHTML = researchers
      .map(
        (researcher) => `
            <tr>
                <td>${researcher.id}</td>
                <td>${researcher.firstName} ${researcher.lastName}</td>
                <td>${researcher.email}</td>
                <td><span class="status ${researcher.status}">${researcher.status}</span></td>
                <td>${researcher.publications}</td>
                <td>${researcher.resources}</td>
            </tr>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading researchers:', error);
    showError('Failed to load researchers');
  }
}

function openAddResearcherModal() {
  document.getElementById('researcher-form').reset();
  document.getElementById('researcher-id').value = '';
  openModal('researcher-modal');
}

async function handleResearcherSubmit(event) {
  event.preventDefault();

  const formData = new FormData();
  formData.append('firstName', document.getElementById('firstName').value);
  formData.append('lastName', document.getElementById('lastName').value);
  formData.append('email', document.getElementById('email').value);
  formData.append('bio', document.getElementById('bio').value);
  formData.append(
    'profileImage',
    document.getElementById('profileImage').value
  );

  // ako se uploaduje slika
  //const profileImage = document.getElementById('profileImage').files[0]
  //if (profileImage) {
  //formData.append('profileImage', profileImage);
  //}

  const researcherId = document.getElementById('researcher-id').value;
  const url = researcherId
    ? `${API_BASE_URL}/researchers/${researcherId}`
    : `${API_BASE_URL}/researchers`;

  try {
    const response = await fetch(url, {
      method: researcherId ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (response.ok) {
      closeModal('researcher-modal');
      loadResearchers();
      showSuccess('Researcher saved successfully');
    } else {
      throw new Error('Failed to save researcher');
    }
  } catch (error) {
    console.error('Error saving researcher:', error);
    showError('Failed to save researcher');
  }
}

// Publication Functions
async function loadPublications() {
  try {
    const response = await fetch(`${API_BASE_URL}/getAllPublications`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const publications = await response.json();
    console.log(publications[0]);
    const publicationsList = document.getElementById('publications-list');
    publicationsList.innerHTML = publications
      .map(
        (pub) => `
            <tr>
                <td>${pub.id}</td>
                <td>${pub.user_id}</td>
                <td>${formatDate(pub.created_at)}</td>
                <td>${pub.url}</td>
                
                <td>
                    <button class="btn-icon" onclick="deletePublication('${pub.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading publications:', error);
    showError('Failed to load publications');
  }
}

async function deletePublication(id) {
  if (!confirm('Are you sure you want to delete this publication?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/deletePublication/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      loadPublications();
      showSuccess('publication deleted successfully');
    } else {
      throw new Error('Failed to delete publication');
    }
  } catch (error) {
    console.error('Error deleting publication:', error);
    showError('Failed to delete publication');
  }
}

// Resource Functions
async function loadResources() {
  try {
    const response = await fetch(`${API_BASE_URL}/getAllResources`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const resources = await response.json();
    console.log(resources[0]);
    const resourcesList = document.getElementById('resources-list');
    resourcesList.innerHTML = resources
      .map(
        (resource) => `
            <tr>
                <td>${resource.researcher_id}</td>
                <td>${resource.title}</td>
                <td>${resource.description}</td>
                <td>${resource.url}</td>
                
                <td>
                    <button class="btn-icon" onclick="deleteResource('${resource.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading resources:', error);
    showError('Failed to load resources');
  }
}

async function deleteResource(id) {
  if (!confirm('Are you sure you want to delete this Resource?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/deleteResource/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      loadResources();
      showSuccess('Resource deleted successfully');
    } else {
      throw new Error('Failed to delete Resource');
    }
  } catch (error) {
    console.error('Error deleting Resource:', error);
    showError('Failed to delete Resource');
  }
}

// Blog Functions
async function loadBlogs() {
  try {
    const response = await fetch(`${API_BASE_URL}/getAllBlogs`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const blogs = await response.json();
    console.log(blogs);
    const blogsList = document.getElementById('blogs-list');
    blogsList.innerHTML = blogs
      .map(
        (blog) => `
            <tr>
                <td>${blog.id}</td>
                <td>${blog.author_id}</td>
                <td>${blog.title}</td>
                <td>${formatDate(blog.created_at)}</td>
                <td>${blog.updated_at}</td>
                <td>${blog.body}</td>
                <td>${blog.keywords}</td>
                <td>
                    <button class="btn-icon" onclick="deleteBlog('${blog.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading blogs:', error);
    showError('Failed to load blogs');
  }
}

async function deleteBlog(id) {
  if (!confirm('Are you sure you want to delete this blog?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/deleteBlogs/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      loadBlogs();
      showSuccess('blog deleted successfully');
    } else {
      throw new Error('Failed to delete blog');
    }
  } catch (error) {
    console.error('Error deleting blog:', error);
    showError('Failed to delete blog');
  }
}

// User Functions
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/getAllUsers`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const users = await response.json();
    console.log(users[0]);
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = users
      .map(
        (user) => `
            <tr>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td><span class="status ${user.status}">${user.status}</span></td>
                <td>
                    <button class="btn-icon" onclick="editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading users:', error);
    showError('Failed to load users');
  }
}

function openAddUserModal() {
  document.getElementById('user-form').reset();
  document.getElementById('user-id').value = '';
  openModal('user-modal');
}

const bio = document.Get;

async function handleUserSubmit(event) {
  event.preventDefault();
  //treba se sredi na bacnednu da prihvata formdata i njega rasporedjuje

  let userr = {
    firstName: document.getElementById('user-firstName').value,
    lastName: document.getElementById('user-lastName').value,
    email: document.getElementById('user-email').value,
    role: document.getElementById('user-role').value,
    bio: document.getElementById('user-bio').value,
    status: document.getElementById('user-status').value,
    profileImage: document.getElementById('user-profileImage').value,
    password: ' ',
  };

  const password = document.getElementById('user-password').value;
  if (password) {
    userr.password = password;
  }

  console.log(userr);
  console.log(JSON.stringify(userr));
  const userId = document.getElementById('user-id').value;
  const url = userId
    ? `${API_BASE_URL}/updateUser/${userId}`
    : `${API_BASE_URL}/createUser`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userr),
    });

    if (response.ok) {
      loadUsers();
      closeModal('user-modal');
      showSuccess('User saved successfully');
    } else {
      throw new Error('Failed to save user');
    }
  } catch (error) {
    console.error('Error saving user:', error);
    showError('Failed to save user');
  }
}

async function editUser(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/getUser/${id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const user = await response.json();
    //biografiju treba da ima
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-firstName').value = user.firstName;
    document.getElementById('user-lastName').value = user.lastName;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-role').value = user.role;
    document.getElementById('user-status').value = user.status;
    document.getElementById('user-bio').value = user.bio;
    document.getElementById('user-password').value = ''; // Clear password field
    document.getElementById('user-profileImage').value = user.profileImage;
    openModal('user-modal');
  } catch (error) {
    console.error('Error loading user:', error);
    showError('Failed to load user details');
  }
}

async function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/deleteUser/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      loadUsers();
      showSuccess('User deleted successfully');
    } else {
      throw new Error('Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    showError('Failed to delete user');
  }
}

function showSuccess(message) {
  // Implement success notification
  alert(message);
}

function showError(message) {
  // Implement error notification
  alert(message);
}

function refreshDashboard() {}

// Initialize the admin panel
document.addEventListener('DOMContentLoaded', () => {
  if (!authToken) {
    window.location.href = 'login.html';
    return;
  }

  // Show dashboard by default
  showSection('dashboard');
});
