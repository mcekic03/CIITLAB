// Constants and Configuration
const CONFIG = {
  API_BASE_URL: 'http://160.99.40.221:3500',
  DEFAULT_PROFILE_IMAGE:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlZWUiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIyNSIgZmlsbD0iIzk5OSIvPjxwYXRoIGQ9Ik01MCA3MGMtMjcuNjE0IDAtNTAgMjIuMzg2LTUwIDUwaDEwMGMwLTI3LjYxNC0yMi4zODYtNTAtNTAtNTB6IiBmaWxsPSIjOTk5Ii8+PC9zdmc+',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_DATASET_TYPES: ['application/zip', 'application/x-zip-compressed'],
};

// State Management
const state = {
  authToken: null,
  userId: null,
  isAuthenticated: () => Boolean(state.authToken && state.userId),
};

// Initialize state from localStorage
function initializeState() {
  state.authToken = localStorage.getItem('authToken');
  console.log(state.authToken);
  // Get userId either from URL parameter or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const urlId = urlParams.get('id');
  const storageId = localStorage.getItem('userId');

  // Proveri validnost ID-a iz storage-a
  const isStorageIdValid =
    storageId && storageId !== 'undefined' && storageId !== 'null';

  console.log(
    'InitializeState - URL ID:',
    urlId,
    'Storage ID:',
    storageId,
    'Storage ID valid:',
    isStorageIdValid
  );

  // Ako storage ID nije validan, očisti ga
  if (storageId && !isStorageIdValid) {
    console.warn(
      'Invalid userId found in localStorage, clearing it:',
      storageId
    );
    localStorage.removeItem('userId');
  }

  // Postavimo ID koristeći URL parametar ili lokalno skladište
  state.userId = isStorageIdValid ? storageId : null;
  console.log(state.userId);

  // Logiraj za potrebe debugginga
  console.log('InitializeState - Final userId:', state.userId);

  // Ako nemamo token a imamo ID u URL-u, dozvolićemo pregled profila
  if (!state.authToken && urlId) {
    console.log('Not authenticated but viewing profile ID from URL:', urlId);
    return; // Dozvoli da vidimo profil drugog korisnika bez autentifikacije
  }

  // Ako nemamo token i nemamo ID u URL-u, preusmeravamo na login
  if (!state.authToken) {
    console.warn(
      'Not authenticated and no profile ID in URL, redirecting to login'
    );
    localStorage.clear(); // Očisti sve iz localStorage za svaki slučaj
    window.location.href = 'researcher-login.html';
    throw new Error('Not authenticated');
  }

  // Ako imamo token ali nemamo validan userId, takođe preusmeravamo na login
  if (state.authToken && !state.userId) {
    console.warn(
      'Has auth token but invalid or missing userId, clearing auth data'
    );
    localStorage.clear(); // Očisti sve iz localStorage
    window.location.href = 'researcher-login.html';
    throw new Error('Invalid authentication data');
  }
}

// Initialize state when the script loads
initializeState();

// Helper function for checking valid userId
function isValidId(id) {
  return id && id !== 'undefined' && id !== 'null';
}

// API Service with Error Handling
const api = {
  async fetch(endpoint, options = {}) {
    // Proveri da li je endpoint validan (sadrži nevalidan ID)
    if (endpoint.includes('/undefined') || endpoint.includes('/null')) {
      console.error(`Invalid endpoint detected: ${endpoint}`);
      throw new Error(`Invalid endpoint: ${endpoint}`);
    }

    const defaultOptions = {
      headers: {
        Authorization: `Bearer ${state.authToken}`,
        'Content-Type':
          options.body instanceof FormData ? undefined : 'application/json',
      },
    };

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`,
        }));
        throw new Error(
          error.message || `HTTP error! status: ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async updateProfile(userId, formData) {
    try {
      console.log('Updating profile for user:', userId);

      // Logiraj parametre za debugging
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (key === 'profileImage') {
          if (value.size > 0) {
            console.log(
              `${key}: File - ${value.name} (${value.size} bytes, ${value.type})`
            );
          } else {
            console.log(`${key}: Empty file object, will be ignored`);
          }
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // Handle profile image if present
      const profileImage = formData.get('profileImage');
      if (profileImage && profileImage.size > 0) {
        // Validate file type
        if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(profileImage.type)) {
          throw new Error(
            'Molimo vas da otpremite sliku u JPG, JPEG ili PNG formatu'
          );
        }
        // Validate file size
        if (profileImage.size > CONFIG.MAX_FILE_SIZE) {
          throw new Error('Veličina slike ne sme biti veća od 5MB');
        }
      } else if (profileImage && profileImage.size === 0) {
        // Ukloni praznu sliku iz formData
        formData.delete('profileImage');
      }

      console.log('Sending profile update request to server...');

      // Show progress bar or loading indicator
      const progressBar = document.querySelector('.upload-progress');
      if (progressBar && profileImage && profileImage.size > 0) {
        progressBar.style.display = 'flex';
      }

      // Koristi fetch sa FormData
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/users/me/${userId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${state.authToken}`,
            // Ne postavljamo Content-Type za FormData
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Unknown server error' }));
        console.error('Server error response:', errorData);
        throw new Error(
          errorData.message || `Server error: ${response.status}`
        );
      }

      const result = await response.json();
      console.log('Profile update successful:', result);

      // Hide progress bar after successful upload
      if (progressBar) {
        progressBar.style.display = 'none';
      }

      // Ažuriraj podatke o korisniku u lokalnom skladištu
      localStorage.setItem('user', JSON.stringify(result));

      return result;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  async updateEducation(userId, education) {
    try {
      console.log('Updating education with data:', education);

      // Šaljemo samo education polje
      const updateResponse = await fetch(
        `${CONFIG.API_BASE_URL}/users/me/${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.authToken}`,
          },
          body: JSON.stringify({
            education: education,
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({
          message: `Server error: ${updateResponse.status}`,
        }));
        throw new Error(
          errorData.message ||
            `Failed to update education (${updateResponse.status})`
        );
      }

      const result = await updateResponse.json();
      console.log('Education update response:', result);
      return result;
    } catch (error) {
      console.error('Education update error:', error);
      throw error;
    }
  },

  async updateSkills(userId, skills) {
    try {
      console.log('Updating skills for user:', userId);
      console.log('Skills to update:', skills);

      const response = await fetch(
        `${CONFIG.API_BASE_URL}/users/updateSkills/${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.authToken}`,
          },
          body: JSON.stringify({
            skills: skills,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Server error: ${response.status}`,
        }));
        throw new Error(
          errorData.message || `Failed to update skills (${response.status})`
        );
      }

      const result = await response.json();
      console.log('Skills update response:', result);
      return result;
    } catch (error) {
      console.error('Skills update error:', error);
      throw error;
    }
  },

  async updatePublications(user_id, publications) {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/users/publications/update/${user_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.authToken}`,
          },
          body: JSON.stringify({
            publications: publications,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Server error: ${response.status}`,
        }));
        throw new Error(
          errorData.message ||
            `Failed to update publication (${response.status})`
        );
      }

      const result = await response.json();
      console.log('publication update response:', result);
      return result;
    } catch (error) {
      console.error('publication update error:', error);
      throw error;
    }
  },
  

  async getPublicationsForUser(researcherId) {
    try {
      console.log(`Fetching publications for researcher ${researcherId}`);

      pub = await this.fetch(`/users/publications/find/${researcherId}`);
      if (pub) {
        return pub;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching researcher resources:', error);
      return [];
    }
  },


  async getResearcherResources(researcherId) {
    try {
      console.log(`Fetching resources for researcher ${researcherId}`);
      return await this.fetch(`/users/resources?researcher=${researcherId}`);
    } catch (error) {
      console.error('Error fetching researcher resources:', error);
      return [];
    }
  },

  async deleteResource(resourceId) {
    
    window.addEventListener('beforeunload', function (event) {
      // Pokaži standardnu poruku za reload (korisnik ne može da menja ovu poruku)
      const confirmationMessage = 'Da li želite da osvežite stranicu?';
  
      // Browser prikazuje standardnu poruku, korisnik može da odabere da li želi reload ili ne
      event.returnValue = confirmationMessage; // Za nove browser-e
    });
  
    try {
      return await this.fetch(`/users/resources/${resourceId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  },

  async getStudentsWork(researcherId) {
    try {
      console.log(`Fetching resources for researcher ${researcherId}`);
      return await this.fetch(`/studentsWork/GetWorksForMentor/${researcherId}`);
    } catch (error) {
      console.error('Error fetching researcher resources:', error);
      return [];
    }
  },

  async deleteStudentsWork(studentsWorkId) {
    try {
      return await this.fetch(`/studentsWork/delete/${studentsWorkId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  },


  getResources: async function (userId) {
    try {
      // Check if ID is valid
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.warn('Invalid userId provided to getResources:', userId);
        console.log('Fetching general resources instead');
        return await api.fetch(`/users/resources`);
      }

      console.log('Fetching resources for researcher ID:', userId);
      return await api.fetch(`/users/resources/researcher/${userId}`);
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  },

  getStudentsWork: async function (userId) {
    try {
      // Check if ID is valid
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.warn('Invalid userId provided to getStudentsWork:', userId);
        console.log('Fetching general students work instead');
        return await api.fetch(`/studentsWork/GetWorksForMentor`);
      }

      console.log('Fetching students work for researcher ID:', userId);
      return await api.fetch(`/studentsWork/GetWorksForMentor/${userId}`);
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  },

};

// UI Components
const UI = {
  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  },

  showAddResourceModal() {
    // Use the existing modal
    const modal = document.getElementById('resourceUploadModal');
    if (modal) {
      modal.style.display = 'block';
    }
  },
  
  showAddStudentsWorkModal() {
    // Use the existing modal
    const modal = document.getElementById('studentsWorkUploadModal');
    if (modal) {
      modal.style.display = 'block';
    }
  },

  openModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.style.display = 'block';
    }
  },

  closeModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  showForm(formId) {
    // Hide all forms first
    document.querySelectorAll('.edit-form').forEach((form) => {
      form.style.display = 'none';
    });
    // Show the requested form
    const form = document.getElementById(formId);
    if (form) {
      form.style.display = 'block';
    }
  },

  async updateProfileDisplay(user) {
    console.log('Updating profile display with user data:', user);
    console.log('Profile image path:', user.profileImage);

    // Update profile image with actual image from server or default
    const profileImageElements = document.querySelectorAll(
      '.researcher-profile-image img'
    );
    console.log('Found profile image elements:', profileImageElements.length);

    if (profileImageElements.length > 0) {
      // Ako korisnik ima profilnu sliku
      if (user.profileImage) {
        // Koristimo apsolutnu putanju za prikaz slike
        const imageUrl = `${user.profileImage}`;
        console.log(imageUrl);
        console.log('Setting profile image URL:', imageUrl);

        // Postavi sliku na sve pronađene elemente
        profileImageElements.forEach((img) => {
          console.log('Setting image src for element:', img);
          img.src = imageUrl;
          img.onerror = () => {
            console.warn('Failed to load profile image, using default image');
            img.src = CONFIG.DEFAULT_PROFILE_IMAGE;
          };
        });
      } else {
        console.log('No profile image found, using default');
        profileImageElements.forEach((img) => {
          img.src = CONFIG.DEFAULT_PROFILE_IMAGE;
        });
      }
    } else {
      console.warn('No profile image elements found on page!');
    }

    // Update profile header and other elements
    const headerH1 = document.querySelector('h1');
    if (headerH1) {
      headerH1.textContent = `${user.firstName} ${user.lastName}`;
    }

    // Update other profile elements
    const elements = {
      '.profile-info h1': `${user.firstName} ${user.lastName}`,
      '.profile-info .email': user.email,
      '.profile-info .bio': user.bio || '',
      '#firstName': user.firstName,
      '#lastName': user.lastName,
      '#email': user.email,
      '#bio': user.bio || '',
    };

    Object.entries(elements).forEach(([selector, value]) => {
      const element = document.querySelector(selector);
      if (element) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.value = value;
        } else {
          element.textContent = value;
        }
      }
    });

    // Update skills section
    const skillsList = document.querySelector('.skills-list');
    if (skillsList && user.skills) {
      if (Array.isArray(user.skills) && user.skills.length > 0) {
        skillsList.innerHTML = user.skills
          .map(
            (skill) => `
            <div class="skill-item">
              <i class="fas fa-check"></i>
              <span>${skill}</span>
            </div>
          `
          )
          .join('');
      } else {
        skillsList.innerHTML = '<p class="no-skills">No skills listed</p>';
      }
    }

    // Update education section
    const educationList = document.querySelector('.education-list');
    if (educationList && user.education) {
      if (Array.isArray(user.education) && user.education.length > 0) {
        educationList.innerHTML = user.education
          .map(
            (edu) => `
            <div class="education-item">
              <div class="education-content">
                <div class="education-main">
                  <i class="fas fa-graduation-cap"></i>
                  <div class="education-details">
                    <h4>${edu.degree || ''}</h4>
                    <p>${edu.institution || ''}</p>
                  </div>
                </div>
                <div class="education-year">${edu.year || ''}</div>
              </div>
            </div>
          `
          )
          .join('');

        // Update education count
        const resourceCount = document.querySelector('.education-count');
        const res = await api.getResearcherResources(user.id);
        if (resourceCount) {
          resourceCount.textContent = res.length;
        }
      } else {
        educationList.innerHTML =
          '<p class="no-education">No resources listed</p>';
        // Reset education count
        const educationCount = document.querySelector('.education-count');
        if (educationCount) {
          educationCount.textContent = '0';
        }
      }
    }

    // Update publications section
    const publicationsList = document.querySelector('.publications-list');
    user.publications = await api.getPublicationsForUser(user.id);
    console.log(user.publications);
    const publicationUrl =
      user.publications.length > 0 ? user.publications[0].url : null;
    console.log('Publication URL:', publicationUrl);
    if (publicationsList && user.publications) {
      try {
        if (user.publications.length > 0) {
          publicationsList.innerHTML = user.publications
            .map(
              (pub) => `
              <div class="publication-item">
                <a href='${pub.url || ''}'class="url">${pub.url || ''}</p>
              </div>
            `
            )
            .join('');

          // Update publications count
          const publicationsCount = document.querySelector(
            '.publications-count'
          );
          if (publicationsCount) {
            fetch(`http://160.99.40.221:3500/users/publications/count`, {
              method: 'POST', // POST metoda
              headers: {
                'Content-Type': 'application/json', // Definiši tip sadržaja kao JSON
              },
              body: JSON.stringify({ link: publicationUrl }), // Link šaljemo u JSON formatu
            })
              .then((response) => response.json()) // Pretvaramo odgovor u JSON
              .then((data) => {
                const brojRadova = data.broj_redova; // Pretpostavljamo da server vraća broj_radova
                console.log('Broj radova:', brojRadova);
                publicationsCount.textContent = brojRadova; // Ispisujemo broj radova u konzoli
              })
              .catch((error) => {
                console.error('Došlo je do greške:', error); // Ako nastane greška
              });
          }
        } else {
          publicationsList.innerHTML =
            '<p class="no-publications">No publications listed</p>';
          // Reset publications count
          const publicationsCount = document.querySelector(
            '.publications-count'
          );
          if (publicationsCount) {
            publicationsCount.textContent = '0';
          }
        }
      } catch (error) {
        console.error('Error loading publications:', error);
        publicationsList.innerHTML =
          '<p class="error-message">Error loading publications</p>';
      }
    }

    // Update page title
    document.title = `${user.firstName} ${user.lastName} - Researcher Profile - CIITLAB`;

    // Update edit buttons visibility
    const isOwnProfile = user._id === state.userId;
    document
      .querySelectorAll(
        '.edit-profile-btn, .edit-education-btn, .edit-section-btn'
      )
      .forEach(
        (button) => (button.style.display = isOwnProfile ? 'block' : 'none')
      );

    // Update profile image preview in edit form
    const previewImage = document.querySelector('#profileImagePreview');
    if (previewImage) {
      previewImage.src = user.profileImage || CONFIG.DEFAULT_PROFILE_IMAGE;
    }
  },

  updateAuthButtons() {
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
      authButtons.innerHTML = state.authToken
        ? `<button class="btn btn-outline" onclick="handleLogout()">
             <i class="fas fa-sign-out-alt"></i> Logout
           </button>`
        : `<a href="researcher-login.html" class="btn btn-outline">Login</a>`;
    }
  },

  updateSkillsDisplay(skills) {
    const skillsList = document.querySelector('.skills-list');
    if (skillsList) {
      if (Array.isArray(skills) && skills.length > 0) {
        skillsList.innerHTML = skills
          .map(
            (skill) => `
            <div class="skill-item">
              <i class="fas fa-check"></i>
              <span>${skill}</span>
            </div>
          `
          )
          .join('');
      } else {
        skillsList.innerHTML = '<p class="no-skills">No skills listed</p>';
      }
    }
  },

  updateResourcesDisplay(resources, isOwnProfile) {
    const resourcesList = document.querySelector('.resources-list');
    if (resourcesList) {
      if (Array.isArray(resources) && resources.length > 0) {
        resourcesList.innerHTML = resources
          .map(
            (resource) => `
            <div class="resource-item">
              <div class="resource-header">
                <h3>${resource.title}</h3>
                ${
                  isOwnProfile
                    ? `
                  <div class="resource-actions">
                    <button class="btn-icon" onclick="handlers.handleResourceDelete('${resource.id}')">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                `
                    : ''
                }
              </div>
              <p class="resource-description">${resource.description}</p>
              <div class="resource-meta">
                <span><i class="fas fa-link"></i> External Resource</span>
              </div>
              <a href="${resource.url}" target="_blank" class="resource-link">
                <i class="fas fa-external-link-alt"></i> Visit Resource
              </a>
            </div>
          `
          )
          .join('');
      } else {
        resourcesList.innerHTML =
          '<p class="no-resources">No resources available.</p>';
      }
    }
  },

  updateStudentsWorkDisplay(studentsWork, isOwnProfile) {
    const studentsWorkList = document.querySelector('.studentsWork-list');
    const studentsWorkCount = document.querySelector('.studentsWork-count');
    studentsWorkCount.textContent = studentsWork.length;
    if (studentsWorkList) {
      if (Array.isArray(studentsWork) && studentsWork.length > 0) {
        studentsWorkList.innerHTML = studentsWork
          .map(
            (studentsWork) => `
            <div class="studentsWork-item">
              <div class="studentsWork-header">
                <h3>${studentsWork.title} - ${studentsWork.firstName} ${studentsWork.lastName} (${studentsWork.graduationYear})</h3>
                ${
                  isOwnProfile
                    ? `
                  <div class="studentsWork-actions">
                    <button class="btn-icon" onclick="handlers.handleStudentsWorkDelete('${studentsWork.id}')">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                `
                    : ''
                }
              </div>
              <p class="studentsWork-description">${studentsWork.description}</p>
              <div class="studentsWork-meta">
              </div>
              <a href="${studentsWork.url}" target="_blank" class="studentsWork-link">
                <i class="fas fa-external-link-alt"></i> Visit Students Work
              </a>
            </div>
          `
          )
          .join('');
      } else {
        studentsWorkList.innerHTML =
          '<p class="no-studentsWork">No students work available.</p>';
      }
    }
  },

  updateProgressBar(percent) {
    const progressBar = document.querySelector('.upload-progress');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    if (progressBar && progressFill && progressText) {
      progressBar.style.display = 'flex';
      progressFill.style.width = `${percent}%`;
      progressText.textContent = `${percent}%`;
    }
  },

  hideProgressBar() {
    const progressBar = document.querySelector('.upload-progress');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    if (progressBar && progressFill && progressText) {
      progressBar.style.display = 'none';
      progressFill.style.width = '0%';
      progressText.textContent = '0%';
    }
  },

  handleImagePreview(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];

    if (!file) return;

    // Provera tipa fajla
    if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      UI.showNotification('Samo JPG, JPEG i PNG slike su dozvoljene', 'error');
      fileInput.value = '';
      return;
    }

    // Provera veličine fajla
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      UI.showNotification('Slika ne sme biti veća od 5MB', 'error');
      fileInput.value = '';
      return;
    }

    // Prikaz pregleda slike
    const reader = new FileReader();
    reader.onload = function (e) {
      // Pronađi sve elemente profilnih slika na stranici
      const profileImages = document.querySelectorAll(
        '.researcher-profile-image img'
      );
      console.log('Updating preview for images:', profileImages.length);

      if (profileImages && profileImages.length > 0) {
        // Ažuriraj sve instance slike na stranici
        profileImages.forEach((img) => {
          console.log('Setting preview for image element:', img);
          img.src = e.target.result;
        });

        console.log(
          'Preview image set to:',
          e.target.result.substring(0, 50) + '...'
        );
      } else {
        console.warn('No profile image elements found to update preview');
      }
    };
    reader.readAsDataURL(file);
  },
};

// Event Handlers
const handlers = {
  async handleProfileEdit(event) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
      // Get form data
      const formData = new FormData(form);

      // Log formData
      console.log('Submitting profile update with FormData');
      for (let [key, value] of formData.entries()) {
        if (key === 'profileImage') {
          if (value instanceof File) {
            console.log(
              `${key}: [File object]`,
              value.name,
              value.size,
              value.type
            );
          } else {
            console.log(`${key}: ${value}`);
          }
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const profileImage = formData.get('profileImage');
      console.log('Profile image file:', profileImage);
      if (profileImage && profileImage.size === 0) {
        // Ukloni praznu sliku
        formData.delete('profileImage');
        console.log('Empty profile image removed from FormData');
      }

      // Update profile
      const userId = state.userId;
      console.log('Updating profile for user ID:', userId);
      const updatedUser = await api.updateProfile(userId, formData);
      console.log('Profile updated successfully, updated user:', updatedUser);

      // Save result in localStorage for auth.js
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Refresh navigation to show new image
      if (typeof authState !== 'undefined' && authState.updateNavbar) {
        console.log('Refreshing auth state with new profile data');

        // Set user directly in authState object
        authState.user = updatedUser;

        // Refresh navigation display
        authState.updateNavbar();
      }

      // Show success message
      UI.showNotification('Profile updated successfully', 'success');
      UI.closeModal();

      // Refresh page as it's the safest way to show changes
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Profile update error:', error);
      UI.showNotification(
        error.message || 'Došlo je do greške pri ažuriranju profila',
        'error'
      );
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-save"></i> Save changes';
    }
  },


  async handleEducationEdit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      const education = Array.from(
        form.querySelectorAll('.education-entry')
      ).map((entry) => ({
        institution: entry.querySelector('[name="institution"]').value,
        degree: entry.querySelector('[name="degree"]').value,
        field: entry.querySelector('[name="field"]').value,
        startDate: entry.querySelector('[name="startDate"]').value,
        endDate: entry.querySelector('[name="endDate"]').value,
        description: entry.querySelector('[name="description"]').value,
      }));

      await api.updateEducation(state.userId, education);
      UI.showNotification('Education updated successfully', 'success');
      await loadUserProfile();
      // Close modal after successful update
      const modal = form.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    } catch (error) {
      console.error('Education update error:', error);
      UI.showNotification(error.message || 'Error updating education', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  },

  handleAddEducation() {
    const educationInputs = document.querySelector('.education-inputs');
    const educationTemplate = document.getElementById('educationFormTemplate');
    const newGroup = educationTemplate.content
      .cloneNode(true)
      .querySelector('.education-input-group');

    // Clear any existing values
    newGroup.querySelectorAll('input').forEach((input) => (input.value = ''));

    // Set up remove button click handler
    const removeBtn = newGroup.querySelector('.remove-education');
    if (removeBtn) {
      removeBtn.onclick = (e) => {
        e.preventDefault();
        const group = e.target.closest('.education-input-group');
        if (group) {
          group.remove();
        }
      };
    }

    // Add the new group to the form
    educationInputs.appendChild(newGroup);
  },

  handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
  },

  handleAddPublication() {
    const publicationsInputs = document.querySelector('.publications-inputs');
    const publicationTemplate = document.getElementById(
      'publicationFormTemplate'
    );
    const newGroup = publicationTemplate.content
      .cloneNode(true)
      .querySelector('.publication-input-group');

    // Clear any existing values
    newGroup
      .querySelectorAll('input, textarea')
      .forEach((input) => (input.value = ''));

    // Set up remove button click handler
    const removeBtn = newGroup.querySelector('.remove-publication');
    if (removeBtn) {
      removeBtn.onclick = (e) => {
        e.preventDefault();
        const group = e.target.closest('.publication-input-group');
        if (group) {
          group.remove();
        }
      };
    }

    // Add the new group to the form
    publicationsInputs.appendChild(newGroup);
  },

  init() {
    // Sačekaj da se authState inicijalizuje
    if (typeof authState === 'undefined') {
      console.error('authState not initialized');
      return;
    }
    this.checkAuthAndSetupUI();
    this.setupEventListeners();
  },

  checkAuthAndSetupUI() {
    const authToken = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const addStudentsWorkBtn = document.getElementById('addStudentsWorkBtn');
    if (authToken && userRole === 'researcher' && addStudentsWorkBtn) {
      addStudentsWorkBtn.style.display = 'flex';
      addStudentsWorkBtn.addEventListener('click', () => {
        const modal = document.getElementById('studentsWorkUploadModal');
        if (modal) {
          modal.style.display = 'block';
        }
      });
    }
  },

  async handlePublicationsEdit(event) {
    event.preventDefault();
    const form = event.target;
    try {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Saving...';

      // Get all publication entries from the form
      const publicationInputs = form.querySelectorAll(
        '.publication-input-group'
      );
      const publications = Array.from(publicationInputs).map((input) => ({
        url: input.querySelector('[name="title"]').value.trim(),
      }));

      // Update publications
      await api.updatePublications(state.userId, publications);
      UI.showNotification('Publications updated successfully');
      UI.closeModal();
      loadUserProfile();
      window.location.reload();
    } catch (error) {
      console.error('Publications update error:', error);
      UI.showNotification(
        error.message || 'Failed to update publications',
        'error'
      );
    } finally {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
  },

  async handleSkillsEdit(event) {
    event.preventDefault();
    const form = event.target;
    try {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Saving...';

      // Get skills from the form
      const skillsInput = form.querySelector('[name="skills"]');
      const skills = skillsInput.value
        .split(',')
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);

      console.log(skills);

      // Update skills
      await api.updateSkills(state.userId, skills);
      UI.showNotification('Skills updated successfully');
      UI.closeModal();
      loadUserProfile();
      window.location.reload(); // Reload the profile to show updated skills
    } catch (error) {
      console.error('Skills update error:', error);
      UI.showNotification(error.message || 'Failed to update skills', 'error');
    } finally {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
  },

  async handleResourceDelete(resourceId) {
    if (window.confirm('Da li ste sigurni da želite da obrišete resurs?')) {

    
    try {
      await api.deleteResource(resourceId);
      UI.showNotification('Resource deleted successfully');

      // Refresh resources list
      const resources = await api.getResearcherResources(state.userId);
      UI.updateResourcesDisplay(resources, true);
    } catch (error) {
      UI.showNotification(error.message, 'error');
    }
  } else {
    return
  }
  },

  async handleStudentsWorkDelete(studentsWorkId) {
    if (window.confirm('Da li ste sigurni da želite da obrišete studentsk rad?')) {
    try {
      await api.deleteStudentsWork(studentsWorkId);
      UI.showNotification('Students work deleted successfully');

      const studentsWork = await api.getStudentsWork(state.userId);
      UI.updateStudentsWorkDisplay(studentsWork, true);

    } catch (error) {
      UI.showNotification(error.message, 'error');
    }
  } else {
    return
  }
  },
  
  closeStudentsWorkModal() {
    const modal = document.getElementById('studentsWorkUploadModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  setupEventListeners() {
    const form = document.getElementById('studentsWorkUploadForm');
    
    if (form) {
      form.addEventListener('submit', this.handleStudentsWorkSubmit.bind(this));
    }
  },

  async handleStudentsWorkSubmit(event) {
    event.preventDefault();
    console.log('handleStudentsWorkSubmit called');
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // Disable form during submission
    Array.from(form.elements).forEach((element) => (element.disabled = true));
    submitButton.textContent = 'Adding...';

    try {
      // Get form values and log them
      const title = form.querySelector('#studentsWorkTitle').value.trim();
      const firstName = form.querySelector('#studentsWorkFirstName').value.trim();
      const lastName = form.querySelector('#studentsWorkLastName').value.trim();
      const graduationYear = form.querySelector('#studentsWorkGraduationYear').value.trim();
      const description = form.querySelector('#studentsWorkDescription').value.trim();
      const url = form.querySelector('#studentsWorkUrl').value.trim();

      console.log('Raw form values:', { title, description, url, firstName, lastName, graduationYear });

      // Basic validation
      if (!title || !description || !url || !firstName || !lastName || !graduationYear) {
        throw new Error('All fields are required');
      }

      // Check if user is authenticated
      if (typeof authState === 'undefined') {
        throw new Error('Authentication system is not initialized');
      }

      if (!authState.isAuthenticated || !authState.user) {
        throw new Error('You must be logged in to add a students work');
      }

      // Check if authState is fully initialized
      if (!authState.user.id) {
        console.log('Waiting for authState to be fully initialized...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        if (!authState.user.id) {
          throw new Error('Unable to get user ID. Please try again.');
        }
      }

      console.log('Current auth state:', {
        isAuthenticated: authState.isAuthenticated,
        user: authState.user
      });

      const formData = {
        title,
        firstName,
        lastName,
        graduationYear,
        description,
        url, 
      };

      // Log the request details for debugging
      console.log('Submitting students work data:', formData);

      const response = await fetch(
        `${CONFIG.API_BASE_URL}/studentsWork/create/${authState.user.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: localStorage.getItem('authToken')
              ? `Bearer ${localStorage.getItem('authToken')}`
              : undefined,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error adding students work');
      }

      const newStudentsWork = await response.json();
      console.log('Students work added successfully:', newStudentsWork);

      // Refresh the resources list
      const studentsWork = await api.getStudentsWork(state.userId);
      UI.updateStudentsWorkDisplay(studentsWork, true);

      // Close the modal
      UI.closeModal();

      // Show success message
      UI.showNotification('Students work added successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error adding students work:', error);
    } finally {
      // Re-enable form
      Array.from(form.elements).forEach((element) => (element.disabled = false));
      submitButton.textContent = 'Add students work';
      form.reset();
    }
  },

};

// Main Functions
async function loadUserProfile() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id') || state.userId;

    if (!profileId) {
      throw new Error('No user ID provided');
    }

    console.log('Loading profile for ID:', profileId);
    const user = await api.fetch(`/users/me/${profileId}`);
    console.log('Loaded user data:', user);

    // Update UI with user data
    await UI.updateProfileDisplay(user);

    // Load user's resources
    try {
      console.log('Loading resources for user:', profileId);
      const resources = await api.getResearcherResources(profileId);
      console.log('Loaded resources:', resources);
      UI.updateResourcesDisplay(resources, profileId === state.userId);
    } catch (resourceError) {
      console.error('Error loading resources:', resourceError);
    }

    try {
      console.log('Loading students work for user:', profileId);
      const studentsWork = await api.getStudentsWork(profileId);
      console.log('Loaded students work:', studentsWork);
      UI.updateStudentsWorkDisplay(studentsWork, profileId === state.userId);
    } catch (studentsWorkError) {
      console.error('Error loading students work:', studentsWorkError);
    }

    // Set up event listeners for forms - only if it's user's own profile
    if (profileId === state.userId) {
      const forms = {
        publicationsEditForm: handlers.handlePublicationsEdit,
        studentsWorkEditForm: handlers.handleStudentsWorkEdit,
        skillsEditForm: handlers.handleSkillsEdit,
      };

      // Add form submit handlers
      Object.entries(forms).forEach(([formId, handler]) => {
        const form = document.getElementById(formId);
        if (form) {
          form.addEventListener('submit', handler);
        }
      });
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    UI.showNotification(error.message, 'error');
    if (error.message.includes('Not authenticated')) {
      window.location.href = 'researcher-login.html';
    }
  }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {


  try {
    // Прво провери да ли постоји ID корисника
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id') || state.userId;
    
    console.log(
      'DOMContentLoaded - Attempting to load profile with ID:',
      profileId
    );

    if (!isValidId(profileId)) {
      console.error(
        'No valid user ID available - either in URL or localStorage'
      );
      UI.showNotification(
        'Молимо вас да се пријавите да бисте видели профил',
        'error'
      );
      setTimeout(() => {
        window.location.href = 'researcher-login.html';
      }, 2000);
      return;
    }

    // Додај event listener за промену слике
    const profileImageInput = document.getElementById('profileImage');
    if (profileImageInput) {
      profileImageInput.addEventListener('change', UI.handleImagePreview);
    }

    // Учитај профил корисника
    await loadUserProfile();

    // Ажурирај видљивост дугмета за урађивање
    const isOwnProfile = state.userId === profileId;
    document
      .querySelectorAll('.edit-profile-btn, .edit-section-btn')
      .forEach((btn) => {
        btn.style.display = isOwnProfile ? 'block' : 'none';
      });

    // Сакриј overlay за промену слике ако није сопствени профил
    const profileImageOverlay = document.querySelector(
      '.profile-image-overlay'
    );
    if (profileImageOverlay) {
      profileImageOverlay.style.display = isOwnProfile ? 'flex' : 'none';
    }
  } catch (error) {
    console.error('Initialization error:', error);
    UI.showNotification(error.message, 'error');
  }
});

// Export functions for HTML onclick handlers
window.toggleEditMode = () => {
  UI.openModal();
  UI.showForm('profileEditForm');
};

window.toggleEducationEdit = () => {
  UI.openModal();
  UI.showForm('educationEditForm');

  // Get the current user's education data
  const educationInputs = document.querySelector('.education-inputs');
  const template = document.getElementById('educationFormTemplate');

  // Clear existing inputs
  educationInputs.innerHTML = '';

  // Get current user data from the page
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id') || state.userId;

  // Fetch and populate education data
  api
    .fetch(`/users/me/${profileId}`)
    .then((user) => {
      if (user.education && user.education.length > 0) {
        user.education.forEach((edu) => {
          const newGroup = template.content
            .cloneNode(true)
            .querySelector('.education-input-group');

          // Set values
          newGroup.querySelector('[name="degree"]').value = edu.degree || '';
          newGroup.querySelector('[name="institution"]').value =
            edu.institution || '';
          newGroup.querySelector('[name="year"]').value = edu.year || '';

          // Set up remove button click handler
          const removeBtn = newGroup.querySelector('.remove-education');
          if (removeBtn) {
            removeBtn.onclick = (e) => {
              e.preventDefault();
              const group = e.target.closest('.education-input-group');
              if (group) {
                group.remove();
              }
            };
          }

          educationInputs.appendChild(newGroup);
        });
      } else {
        // Add one empty education input group if no education data exists
        handlers.handleAddEducation();
      }
    })
    .catch((error) => {
      console.error('Error loading education data:', error);
      UI.showNotification('Failed to load education data', 'error');
    });
};

window.togglePublicationsEdit = async () => {
  UI.openModal();
  UI.showForm('publicationsEditForm');

  // Get the current user's publications data
  const publicationsInputs = document.querySelector('.publications-inputs');
  const template = document.getElementById('publicationFormTemplate');

  // Clear existing inputs
  publicationsInputs.innerHTML = '';

  try {
    // Get current user data from the page
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id') || state.userId;

    // Fetch user data and publications
    const user = await api.fetch(`/users/me/${profileId}`);
    user.publications = await api.getPublicationsForUser(user.id);

    if (user.publications && user.publications.length > 0) {
      // Fetch full publication data for each publication

      const publications = user.publications;
      const validPublications = publications.filter((pub) => pub !== null);

      // Add each publication to the form
      validPublications.forEach((pub) => {
        console.log(pub.url);
        const newGroup = template.content
          .cloneNode(true)
          .querySelector('.publication-input-group');

        // Set values
        newGroup.querySelector('[name="title"]').value = pub.url || '';

        // Add publication ID as a hidden input
        const pubIdInput = document.createElement('input');
        pubIdInput.type = 'hidden';
        pubIdInput.name = 'publicationId';
        pubIdInput.value = pub._id;
        newGroup.appendChild(pubIdInput);

        // Set up remove button click handler
        const removeBtn = newGroup.querySelector('.remove-publication');
        if (removeBtn) {
         
          removeBtn.onclick = (e) => {
            e.preventDefault();
            if(window.confirm('Da li ste sigurni da želite da obrišete publikaciju?')) {
            const group = e.target.closest('.publication-input-group');
            if (group) {
              group.remove();
            } 
          } else{
            return
          }
          }; 
        }
        publicationsInputs.appendChild(newGroup);
      });
    } else {
      // Add one empty publication input group if no publications exist
      handlers.handleAddPublication();
    }
  } catch (error) {
    console.error('Error loading publications data:', error);
    UI.showNotification('Failed to load publications data', 'error');
    // Add one empty publication input group as fallback
    handlers.handleAddPublication();
  }
};



window.toggleSkillsEdit = () => {
  UI.openModal();
  UI.showForm('skillsEditForm');

  // Get current user data
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id') || state.userId;

  // Fetch and populate skills data
  api
    .fetch(`/users/me/${profileId}`)
    .then((user) => {
      const skillsInput = document.querySelector('[name="skills"]');
      if (skillsInput && user.skills) {
        skillsInput.value = user.skills.join(', ');
      }
    })
    .catch((error) => {
      console.error('Error loading skills data:', error);
      UI.showNotification('Failed to load skills data', 'error');
    });
};

window.toggleResourcesEdit = () => {
  const modal = document.getElementById('resourceUploadModal');
  if (modal) {
    modal.style.display = 'block';
  }
};

window.toggleStudentsWorkEdit = () => {
  const modal = document.getElementById('studentsWorkUploadModal');
  if (modal) {
    modal.style.display = 'block';
  }
};

window.closeModal = () => {
  const editModal = document.getElementById('editModal');
  const resourceModal = document.getElementById('resourceUploadModal');
  const studentsWorkModal = document.getElementById('studentsWorkUploadModal');
  if (editModal) {
    editModal.style.display = 'none';
  }
  if (resourceModal) {
    resourceModal.style.display = 'none';
  }
  if (studentsWorkModal) {
    studentsWorkModal.style.display = 'none';
  }
};

window.handleLogout = handlers.handleLogout;

window.handleAddEducation = () => {
  const educationInputs = document.querySelector('.education-inputs');
  const educationTemplate = document.getElementById('educationFormTemplate');
  const newGroup = educationTemplate.content
    .cloneNode(true)
    .querySelector('.education-input-group');

  // Clear any existing values
  newGroup.querySelectorAll('input').forEach((input) => (input.value = ''));

  // Set up remove button click handler
  const removeBtn = newGroup.querySelector('.remove-education');
  if (removeBtn) {
    removeBtn.onclick = (e) => {
      e.preventDefault();
      const group = e.target.closest('.education-input-group');
      if (group) {
        group.remove();
      }
    };
  }

  // Add the new group to the form
  educationInputs.appendChild(newGroup);
};

window.handleAddPublication = handlers.handleAddPublication;
async function apiRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${state.authToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  };

  return await api.fetch(endpoint, options);
}

// Add these functions before the handlers object
function validateFileSize(input) {
  const maxSize = 50 * 1024 * 1024; // 50MB in bytes
  if (input.files[0] && input.files[0].size > maxSize) {
    UI.showNotification('File size should be less than 50MB', 'error');
    input.value = ''; // Clear the file input
  }
}

function validateJSON(textarea) {
  if (textarea.value.trim()) {
    try {
      JSON.parse(textarea.value);
    } catch (error) {
      UI.showNotification('Invalid JSON format', 'error');
      textarea.value = ''; // Clear the invalid JSON
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  handlers.init();
});

// Export the validation functions for use in HTML
window.validateFileSize = validateFileSize;
window.validateJSON = validateJSON;
