// Constants and Configuration
const CONFIG = {
  API_BASE_URL: 'http://160.99.40.221:3500',
  DEFAULT_PROFILE_IMAGE:
    'http://160.99.40.221:3500/users/images/default-avatar.svg',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  ALLOWED_DATASET_TYPES: ['application/zip', 'application/x-zip-compressed'],
};

// State Management
const state = {
  authToken: null,
  userId: null,
  isAuthenticated: () => Boolean(state.authToken && state.userId),
};

// Initialize state from sessionStorage
function initializeState() {
  state.authToken = sessionStorage.getItem('authToken');
  console.log(state.authToken);
  // Get userId either from URL parameter or sessionStorage
  const urlParams = new URLSearchParams(window.location.search);
  const urlId = urlParams.get('id');
  const storageId = sessionStorage.getItem('userId');

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
      'Invalid userId found in sessionStorage, clearing it:',
      storageId
    );
    sessionStorage.removeItem('userId');
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
    sessionStorage.clear(); // Očisti sve iz sessionStorage za svaki slučaj
    window.location.href = 'login.html';
    throw new Error('Not authenticated');
  }

  // Ako imamo token ali nemamo validan userId, takođe preusmeravamo na login
  if (state.authToken && !state.userId) {
    console.warn(
      'Has auth token but invalid or missing userId, clearing auth data'
    );
    sessionStorage.clear(); // Očisti sve iz sessionStorage
    window.location.href = 'login.html';
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
      for (const [key, value] of formData.entries()) {
        if (key === 'image') {
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
      const profileImage = formData.get('image');
      const hasNewImage = profileImage && profileImage.size > 0;

      if (hasNewImage) {
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
        formData.delete('image');
      }

      console.log('Sending profile update request to server...');

      // Show progress bar or loading indicator
      const progressBar = document.querySelector('.upload-progress');
      if (progressBar && hasNewImage) {
        progressBar.style.display = 'flex';
      }

      // Create a new FormData object to ensure it's properly serialized
      const requestFormData = new FormData();
      for (const [key, value] of formData.entries()) {
        requestFormData.append(key, value);
      }

      // Log the actual request data
      console.log('Request data:');
      for (const [key, value] of requestFormData.entries()) {
        if (key === 'image') {
          if (value instanceof File) {
            console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
          } else {
            console.log(`${key}: ${value}`);
          }
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      let response;

      // Choose the appropriate endpoint based on whether a new image is being uploaded
      if (hasNewImage) {
        // Use the existing endpoint for image and data update
        response = await fetch(
          `${CONFIG.API_BASE_URL}/users/updateProfile/ImageAndData/${userId}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${state.authToken}`,
              // Ne postavljamo Content-Type za FormData
            },
            body: requestFormData,
          }
        );
      } else {
        // Use a different endpoint for data-only update
        // Convert FormData to JSON for the data-only endpoint
        const jsonData = {};
        for (const [key, value] of requestFormData.entries()) {
          jsonData[key] = value;
        }

        response = await fetch(
          `${CONFIG.API_BASE_URL}/users/updateProfile/Data/${userId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${state.authToken}`,
            },
            body: JSON.stringify(jsonData),
          }
        );

        console.log(jsonData);
      }

      console.log(response);

      if (!response.ok) {
        const errorData = await response;
        console.error('Server error response:', errorData);
        throw new Error(
          errorData.message || `Server error: ${response.status}`
        );
      }

      const result = await response;
      console.log('Profile update successful:', result);

      // Hide progress bar after successful upload
      if (progressBar) {
        progressBar.style.display = 'none';
      }

      // Ažuriraj podatke o korisniku u lokalnom skladištu
      sessionStorage.setItem('user', JSON.stringify(result));

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
        `${CONFIG.API_BASE_URL}/users/updateEducation/${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.authToken}`,
          },
          body: JSON.stringify({
            education: education,
          }),
        }
      );
      console.log(updateResponse);
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
      window.location.reload();
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

  async updateResource(resourceId, resourceData) {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/users/resources/find/${resourceId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.authToken}`,
          },
          body: JSON.stringify(resourceData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Server error: ${response.status}`,
        }));
        throw new Error(
          errorData.message || `Failed to update resource (${response.status})`
        );
      }

      const result = await response.json();
      console.log('Resource update response:', result);
      return result;
    } catch (error) {
      console.error('Resource update error:', error);
      throw error;
    }
  },

  async updateStudentsWork(studentsWorkId, studentsWorkData) {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/studentsWork/update/${studentsWorkId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.authToken}`,
          },
          body: JSON.stringify(studentsWorkData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Server error: ${response.status}`,
        }));
        throw new Error(
          errorData.message ||
            `Failed to update students work (${response.status})`
        );
      }

      const result = await response.json();
      console.log('Students work update response:', result);
      return result;
    } catch (error) {
      console.error('Students work update error:', error);
      throw error;
    }
  },

  async getPublicationsForUser(researcherId) {
    try {
      console.log(`Fetching publications for researcher ${researcherId}`);

      const pub = await this.fetch(`/users/publications/find/${researcherId}`);
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
      return await this.fetch(
        `/studentsWork/GetWorksForMentor/${researcherId}`
      );
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

  getResources: async (userId) => {
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

  getStudentsWork: async (userId) => {
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

  // In the api object, add or modify the getResource function to fetch a single resource
  async getResource(resourceId) {
    try {
      console.log(`Fetching resource with ID ${resourceId}`);
      // Try the endpoint structure that matches your API
      return await this.fetch(`/users/resources/find/${resourceId}`);
    } catch (error) {
      console.error('Error fetching resource:', error);
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
      modal.style.display = 'flex';
    }
  },

  showAddStudentsWorkModal() {
    // Use the existing modal
    const modal = document.getElementById('studentsWorkUploadModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  },

  openModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.style.display = 'flex';
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
          '<p class="no-education">No Education listed</p>';
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
                'Content-Type': 'application/json', // Definiši tip sadržaja као JSON
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
        : `<a href="login.html" class="btn btn-outline">Login</a>`;
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

  async updateResourcesDisplay(resources, isOwnProfile) {
    const resourcesList = document.querySelector('.resources-list');
    const resourceFooter = document.querySelector('.resource-section-footer');
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id') || state.userId;
    const user = await api.fetch(`/users/me/${profileId}`);
    console.log(user);
    if (!resourcesList) {
      console.error('Resources list element not found');
      return;
    }

    if (!Array.isArray(resources) || resources.length === 0) {
      resourcesList.innerHTML =
        '<p class="no-resources">No resources available.</p>';
      return;
    }

    // Clear and rebuild the resources list
    resourcesList.innerHTML = resources
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // najnoviji prvi
      .slice(0, 5) // uzmi samo prvih 5
      .map((resource) => {
        const formattedDate = formatDate(resource.created_at);
        const researcherName =
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : 'Unknown researcher';

        const isLongDescription =
          resource.description && resource.description.length > 50;
        const truncatedDescription = isLongDescription
          ? `${resource.description.substring(0, 50)}...`
          : resource.description || 'No description available';

        return `
      <div class="resource-item">
        <div class="resource-header">
          <h3>${resource.title || 'No title'}</h3>
          ${
            isOwnProfile
              ? `
            <div class="resource-actions">
              <button class="btn-icon" onclick="toggleResourceEdit('${resource.id}')">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          `
              : ''
          }
        </div>
        <div class="resource-description-container">
          <p class="resource-description">${truncatedDescription}</p>
        </div>
        <div class="resource-footer">
          <div class="resource-meta"></div>
          ${
            isLongDescription
              ? `<button class="read-more-btn" onclick="openResourceModal('${resource.id}')">More</button>`
              : ''
          }
        </div>
      </div>
    `;
      })
      .join('');

    if (resources.length > 5) {
      resourceFooter.innerHTML = `<button class="load-more-btn">More</button>`;
    }
    // Add event listeners to all "Read more" buttons

    const loadMoreButton = resourceFooter.querySelector('.load-more-btn');
    if (loadMoreButton) {
      loadMoreButton.addEventListener('click', () => {
        openFullResourceListModal(resources, isOwnProfile);
      });
    }
  },

  updateStudentsWorkDisplay(studentsWork, isOwnProfile) {
    const studentsWorkList = document.querySelector('.studentsWork-list');
    const studentsWorkFooter = document.querySelector(
      '.studentsWork-section-footer'
    );
    const studentsWorkCount = document.querySelector('.studentsWork-count');
    studentsWorkCount.textContent = studentsWork.length;
    if (studentsWorkList) {
      if (Array.isArray(studentsWork) && studentsWork.length > 0) {
        studentsWorkList.innerHTML = studentsWork
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // najnoviji prvi
          .slice(0, 3)
          .map((studentsWork) => {
            const isLongDescription =
              studentsWork.description && studentsWork.description.length > 50;
            const truncatedDescription = isLongDescription
              ? `${studentsWork.description.substring(0, 50)}...`
              : studentsWork.description || 'No description available';

            return `
            <div class="studentsWork-item">
              <div class="studentsWork-header">
                <h3>${studentsWork.title} - ${studentsWork.firstName} ${
              studentsWork.lastName
            } (${studentsWork.graduationYear})</h3>
                ${
                  isOwnProfile
                    ? `
                  <div class="studentsWork-actions">
                    <button class="btn-icon" onclick="toggleStudentsWorkEdit('${studentsWork.id}')">
                      <i class="fas fa-edit"></i>
                    </button>
                  </div>
                `
                    : ''
                }
              </div>
              <div class="studentsWork-description-container">
                <p class="studentsWork-description">${truncatedDescription}</p>
              </div>
              <div class="studentsWork-footer">
                <div class="studentsWork-meta"></div>
          ${
            isLongDescription
              ? `<button class="read-more-btn" onclick="openStudentsWorkModal('${studentsWork.id}')">More</button>`
              : ''
          }
              </div>
            </div>
          `;
          })
          .join('');
      } else {
        studentsWorkList.innerHTML =
          '<p class="no-studentsWork">No students work available.</p>';
      }
    }

    if (studentsWork.length > 1) {
      studentsWorkFooter.innerHTML = `<button class="load-more-btn">More</button>`;
    }

    const loadMoreButton = studentsWorkFooter.querySelector('.load-more-btn');
    if (loadMoreButton) {
      loadMoreButton.addEventListener('click', () => {
        openFullStudentsWorkListModal(studentsWork, isOwnProfile);
      });
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
    reader.onload = (e) => {
      // Update the preview image in the form
      const previewImage = document.getElementById('profileImagePreview');
      if (previewImage) {
        previewImage.src = e.target.result;
      }

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
      // Create FormData object and add fields manually to ensure all data is included
      const formData = new FormData();

      // Get form elements directly
      const firstNameInput = form.querySelector('input[name="firstName"]');
      const lastNameInput = form.querySelector('input[name="lastName"]');
      const emailInput = form.querySelector('input[name="email"]');
      const bioInput = form.querySelector('textarea[name="bio"]');
      const profileImageInput = form.querySelector(
        'input[name="profileImage"]'
      );

      // Log the form elements for debugging
      console.log('Form elements:', {
        firstNameInput,
        lastNameInput,
        emailInput,
        bioInput,
        profileImageInput,
      });

      // Get values and add to FormData
      if (firstNameInput) formData.append('firstName', firstNameInput.value);
      if (lastNameInput) formData.append('lastName', lastNameInput.value);
      if (emailInput) formData.append('email', emailInput.value);
      if (bioInput) formData.append('bio', bioInput.value);

      // Handle profile image
      if (profileImageInput && profileImageInput.files[0]) {
        formData.append('image', profileImageInput.files[0]);
      }

      // Log formData for debugging
      console.log('Submitting profile update with FormData:');
      for (const [key, value] of formData.entries()) {
        if (key === 'image') {
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

      // Update profile
      const userId = state.userId;
      console.log('Updating profile for user ID:', userId);
      const updatedUser = await api.updateProfile(userId, formData);
      console.log('Profile updated successfully, updated user:', updatedUser);

      // Save result in sessionStorage for auth.js
      sessionStorage.setItem('user', JSON.stringify(updatedUser));

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
        form.querySelectorAll('.education-input-group')
      ).map((entry) => ({
        institution: entry.querySelector('[name="institution"]').value,
        degree: entry.querySelector('[name="degree"]').value,
        year: entry.querySelector('[name="year"]').value,
      }));

      console.log(education);

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

  handleLogout() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userId');
    window.location.href = 'index.html';
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
    const authToken = sessionStorage.getItem('authToken');
    const userRole = sessionStorage.getItem('userRole');
    const addStudentsWorkBtn = document.getElementById('addStudentsWorkBtn');
    if (authToken && userRole === 'researcher' && addStudentsWorkBtn) {
      addStudentsWorkBtn.style.display = 'flex';
      addStudentsWorkBtn.addEventListener('click', () => {
        const modal = document.getElementById('studentsWorkUploadModal');
        if (modal) {
          modal.style.display = 'flex';
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

  async handleResourceEdit(event) {
    event.preventDefault();
    const form = event.target;
    console.log(resourceId);
    try {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Saving...';

      const title = form.querySelector('[name="title"]').value.trim();
      const description = form
        .querySelector('[name="description"]')
        .value.trim();
      const url = form.querySelector('[name="url"]').value.trim();

      // Basic validation
      if (!title || !description) {
        throw new Error('Title and description are required');
      }

      const resourceData = {
        title,
        description,
        url,
      };

      // Update resource
      await api.updateResource(resourceId, resourceData);
      UI.showNotification('Resource updated successfully');
      UI.closeModal();

      // Refresh resources list
      const resources = await api.getResearcherResources(state.userId);
      UI.updateResourcesDisplay(resources, true);

      // Reload page to show updated resources
      window.location.reload();
    } catch (error) {
      console.error('Resource update error:', error);
      UI.showNotification(
        error.message || 'Failed to update resource',
        'error'
      );
    } finally {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
  },
  async handleStudentsWorkEdit(event) {
    event.preventDefault();
    const form = event.target;
    try {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Saving...';

      const title = form.querySelector('#title').value.trim();
      const firstName = form.querySelector('#firstName').value.trim();
      const lastName = form.querySelector('#lastName').value.trim();
      const graduationYear = form.querySelector('#graduationYear').value.trim();
      const description = form.querySelector('#description').value.trim();
      const link = form.querySelector('[name="link"]').value.trim();

      // Basic validation
      if (!title || !description) {
        throw new Error('Title and description are required');
      }

      const studentsWorkData = {
        title,
        firstName,
        lastName,
        graduationYear,
        description,
        link: link,
      };

      // Get the studentsWorkId from the form's dataset
      const studentsWorkId = form.dataset.studentsWorkId;

      // Update resource
      await api.updateStudentsWork(studentsWorkId, studentsWorkData);
      UI.showNotification('Students work updated successfully');
      UI.closeModal();

      // Refresh resources list
      const studentsWork = await api.getStudentsWork(state.userId);
      UI.updateStudentsWorkDisplay(studentsWork, true);

      // Reload page to show updated resources
      window.location.reload();
    } catch (error) {
      console.error('Resource update error:', error);
      UI.showNotification(
        error.message || 'Failed to update students work',
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
    document
      .getElementById('skillsEditForm')
      .addEventListener('click', function (event) {
        if (event.target === this) {
          closeModal();
        }
      });
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
        UI.updateResourcesDisplay(resources, true, state.userId);
      } catch (error) {
        UI.showNotification(error.message, 'error');
      }
    } else {
      return;
    }
  },

  async handleStudentsWorkDelete(studentsWorkId) {
    if (
      window.confirm('Da li ste sigurni da želite da obrišete studentski rad?')
    ) {
      try {
        await api.deleteStudentsWork(studentsWorkId);
        UI.showNotification('Students work deleted successfully');

        const studentsWork = await api.getStudentsWork(state.userId);
        UI.updateStudentsWorkDisplay(studentsWork, true);
      } catch (error) {
        UI.showNotification(error.message, 'error');
      }
    } else {
      return;
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
      const firstName = form
        .querySelector('#studentsWorkFirstName')
        .value.trim();
      const lastName = form.querySelector('#studentsWorkLastName').value.trim();
      const graduationYear = form
        .querySelector('#studentsWorkGraduationYear')
        .value.trim();
      const description = form
        .querySelector('#studentsWorkDescription')
        .value.trim();
      const url = form.querySelector('#studentsWorkUrl').value.trim();

      console.log('Raw form values:', {
        title,
        description,
        url,
        firstName,
        lastName,
        graduationYear,
      });

      // Basic validation
      if (
        !title ||
        !description ||
        !url ||
        !firstName ||
        !lastName ||
        !graduationYear
      ) {
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
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
        if (!authState.user.id) {
          throw new Error('Unable to get user ID. Please try again.');
        }
      }

      console.log('Current auth state:', {
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
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
            Authorization: sessionStorage.getItem('authToken')
              ? `Bearer ${sessionStorage.getItem('authToken')}`
              : undefined,
          },
          body: JSON.stringify(formData),
        }
      );

      console.log(response);

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
      Array.from(form.elements).forEach(
        (element) => (element.disabled = false)
      );
      submitButton.textContent = 'Add students work';
      form.reset();
    }
  },

  async loadResources() {
    try {
      console.log('Loading resources...');
      const authToken = sessionStorage.getItem('authToken');
      console.log('Auth token present:', !!authToken);

      const urlParams = new URLSearchParams(window.location.search);
      let urlId = urlParams.get('id');
      if (urlId == null) {
        urlId = sessionStorage.getItem('userId');
      }
      const response = await fetch(`${CONFIG.API_BASE_URL}/resources/all`, {
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : undefined,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }

      const resources = await response.json();
      console.log('Loaded resources:', resources);

      // Log each resource's researcher data
      resources.forEach((resource, index) => {
        console.log(
          `Resource ${index + 1} researcher data:`,
          resource.researcher_id
        );
      });

      this.displayResources(resources);
    } catch (error) {
      console.error('Error loading resources:', error);
      this.displayError('Error loading resources');
    }
  },

  displayError(message) {
    const resourcesList = document.querySelector('.resources-list-page');
    if (resourcesList) {
      resourcesList.innerHTML = `<p class="error-message">${message}</p>`;
    }
  },

  // Display success message
  displaySuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  },

  async displayResources(resources) {
    const resourcesList = document.getElementById('resources-list-page');

    if (!resourcesList) {
      console.error('Resources list element not found');
      return;
    }
    if (resources.length === 0) {
      resourcesList.innerHTML =
        '<p class="no-resources">No resources available at the moment.</p>';
      return;
    }

    // Clear existing resources
    resourcesList.innerHTML = '';

    // Add each resource to the list
    resources.forEach((resource) => {
      // Format the creation date
      const formattedDate = formatDate(resource.created_at);

      // Get researcher name
      const researcherName =
        resource.researcher &&
        resource.researcher.firstName &&
        resource.researcher.lastName
          ? `${resource.researcher.firstName} ${resource.researcher.lastName}`
          : 'Unknown researcher';

      console.log(researcherName);
      console.log(resources);

      // Check if description is long enough to need truncation
      const isLongDescription = resource.description.length > 100;
      const truncatedDescription = isLongDescription
        ? `${resource.description.substring(0, 100)}...`
        : resource.description || 'No description available';

      // Create resource HTML
      const resourceElement = document.createElement('div');
      resourceElement.className = 'resource-item-page';
      resourceElement.innerHTML = `
        <div class="resource-content-page">
          <div class="resource-header-page">
            <h3>${resource.title || 'No title'}</h3>
            <div class="resource-meta">
              <span class="researcher">
                <i class="fas fa-user"></i> ${researcherName}
              </span>
              <span class="date">
                <i class="fas fa-calendar"></i> ${formattedDate}
              </span>
            </div>
          </div>
          <div class="resource-description-container-page">
            <p class="resource-description-page">${truncatedDescription}</p>
            ${
              isLongDescription
                ? '<button class="read-more-btn-page">Read more</button>'
                : ''
            }
          </div>
        </div>
        <div class="resource-actions-page">
          <a href="${
            resource.url
          }" target="_blank" rel="noopener noreferrer" class="btn-primary resource-btn">
            <i class="fas fa-external-link-alt"></i> View resource
          </a>
        </div>
      `;
      console.log(resourcesList);
      // Add event listener to "Read more" button if it exists
      if (isLongDescription) {
        const readMoreBtn = resourceElement.querySelector(
          '.read-more-btn-page'
        );
        readMoreBtn.addEventListener('click', () => openModal(resource));
      }

      resourcesList.appendChild(resourceElement);
    });
  },

  async handleResourceSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    let resourceId = null;
    // Disable form during submission
    Array.from(form.elements).forEach((element) => (element.disabled = true));
    submitButton.textContent =
      '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
      // Check if there are any resource input groups
      const resourceGroups = form.querySelectorAll('.resource-input-group');

      // If no input groups and we have a resourceId, delete the resource
      if (resourceGroups.length === 0) {
        // Try to get the resourceId from the form
        const resourceIdElement = form.querySelector('[name="resourceId"]');
        if (resourceIdElement) {
          resourceId = resourceIdElement.value.trim();
          console.log('No input groups found, deleting resource:', resourceId);
          await api.deleteResource(resourceId);
          UI.showNotification('Resource deleted successfully');
          UI.closeModal();

          // Refresh resources list
          const resources = await api.getResearcherResources(state.userId);
          UI.updateResourcesDisplay(resources, true);

          // Reload page to show updated resources
          window.location.reload();
          return;
        } else {
          // If no resourceId is available, this is a new resource form with no inputs
          // Just close the modal and reset the form
          UI.closeModal();
          UI.showNotification('No resource data to save', 'info');
          return;
        }
      }

      // Get the first resource input group (we're only handling one at a time)
      const resourceGroup = resourceGroups[0];

      // Get form values from within the resource input group
      const titleElement = resourceGroup.querySelector('[name="title"]');
      const descriptionElement = resourceGroup.querySelector(
        '[name="description"]'
      );
      const urlElement = resourceGroup.querySelector('[name="url"]');
      const resourceIdElement = resourceGroup.querySelector(
        '[name="resourceId"]'
      );

      // Check if all required elements exist
      if (!titleElement || !descriptionElement || !urlElement) {
        throw new Error('Form is missing required fields');
      }

      // Get the resource ID if available
      if (resourceIdElement) {
        resourceId = resourceIdElement.value.trim();
      }

      const title = titleElement.value.trim();
      const description = descriptionElement.value.trim();
      const url = urlElement.value.trim();

      console.log('Raw form values:', { title, description, url, resourceId });

      // Basic validation
      if (!title || !description) {
        throw new Error('Title and description are required');
      }

      const resourceData = {
        title,
        description,
        url,
      };

      // Update resource
      await api.updateResource(resourceId, resourceData);
      UI.showNotification('Resource updated successfully');
      UI.closeModal();

      // Refresh resources list
      const resources = await api.getResearcherResources(state.userId);
      UI.updateResourcesDisplay(resources, true);

      // Reload page to show updated resources
      window.location.reload();
    } catch (error) {
      console.error('Error handling resource:', error);
      UI.showNotification(error.message || 'Error handling resource', 'error');
    } finally {
      // Re-enable form
      Array.from(form.elements).forEach(
        (element) => (element.disabled = false)
      );
      submitButton.textContent = 'Add resource';
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

    const studentsWork = document.getElementById('studentsWorkSection');
    if (user.role != 'researcher') {
      studentsWork.style.display = 'none';
    }

    // Set up event listeners for forms - only if it's user's own profile
    if (profileId === state.userId) {
      const forms = {
        publicationsEditForm: handlers.handlePublicationsEdit,
        studentsWorkEditForm: handlers.handleStudentsWorkEdit,
        educationEditForm: handlers.handleEducationEdit,
        skillsEditForm: handlers.handleSkillsEdit,
        resourceEditForm: handlers.handleResourceSubmit,
        profileEditForm: handlers.handleProfileEdit,
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
      window.location.href = 'login.html';
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
        'No valid user ID available - either in URL or sessionStorage'
      );
      UI.showNotification(
        'Молимо вас да се пријавите да бисте видели профил',
        'error'
      );
      setTimeout(() => {
        window.location.href = 'login.html';
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

  // Populate the form with the user's current data
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id') || state.userId;

  // Get the current user data
  api
    .fetch(`/users/me/${profileId}`)
    .then((user) => {
      // Populate the form fields
      document.getElementById('firstName').value = user.firstName || '';
      document.getElementById('lastName').value = user.lastName || '';
      document.getElementById('email').value = user.email || '';
      document.getElementById('bio').value = user.bio || '';

      // Update profile image preview
      const profileImagePreview = document.getElementById(
        'profileImagePreview'
      );
      if (profileImagePreview && user.profileImage) {
        profileImagePreview.src = user.profileImage;
      }
    })
    .catch((error) => {
      console.error('Error loading user data:', error);
      UI.showNotification('Error loading user data', 'error');
    });
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
            if (
              window.confirm(
                'Da li ste sigurni da želite da obrišete publikaciju?'
              )
            ) {
              const group = e.target.closest('.publication-input-group');
              if (group) {
                group.remove();
              }
            } else {
              return;
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

// Modify the window.toggleResourceEdit function to use the correct endpoint
window.toggleResourceEdit = (resourceId) => {
  UI.openModal();
  UI.showForm('resourceEditForm');

  const resourceInputs = document.querySelector('.resource-inputs');
  const template = document.getElementById('resourceFormTemplate');

  // Clear existing inputs
  resourceInputs.innerHTML = '';

  // Get current user data from the page
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id') || state.userId;
  // Fetch and populate education data
  api
    .fetch(`/users/resources/find/${resourceId}`)
    .then((resource) => {
      console.log(resource);
      if (resource) {
        resource.forEach((res) => {
          console.log(res.url);
          const newGroup = template.content
            .cloneNode(true)
            .querySelector('.resource-input-group');

          // Set values
          newGroup.querySelector('[name="title"]').value = res.title || '';
          newGroup.querySelector('[name="description"]').value =
            res.description || '';
          newGroup.querySelector('[name="url"]').value = res.url || '';
          newGroup.querySelector('[name="resourceId"]').value = res.id || '';

          // Replace the remove button with a delete button
          const removeBtn = newGroup.querySelector('.remove-resource');
          if (removeBtn) {
            removeBtn.className = 'btn-icon delete-resource';
            removeBtn.innerHTML =
              '<i class="fas fa-trash" aria-hidden="true"></i>';
            removeBtn.title = 'Delete Resource';
            removeBtn.onclick = async (e) => {
              e.preventDefault();
              if (confirm('Da li ste sigurni da želite da obrišete resurs?')) {
                try {
                  await api.deleteResource(resourceId);
                  UI.showNotification('Resource deleted successfully');
                  UI.closeModal();

                  // Refresh resources list
                  const resources = await api.getResearcherResources(
                    state.userId
                  );
                  UI.updateResourcesDisplay(resources, true);

                  // Reload page to show updated resources
                  window.location.reload();
                } catch (error) {
                  console.error('Error deleting resource:', error);
                  UI.showNotification(
                    error.message || 'Error deleting resource',
                    'error'
                  );
                }
              }
            };
          }

          resourceInputs.appendChild(newGroup);
        });
      } else {
        // Add one empty education input group if no education data exists
        handlers.handleResourceEdit();
      }
    })
    .catch((error) => {
      console.error('Error loading resource data:', error);
      UI.showNotification('Failed to load resource data', 'error');
    });
};

window.toggleStudentsWorkEdit = (studentsWorkId) => {
  UI.openModal();
  UI.showForm('studentsWorkEditForm');

  const resourceInputs = document.querySelector('.studentsWork-inputs');
  const template = document.getElementById('studentsWorkFormTemplate');

  // Clear existing inputs
  resourceInputs.innerHTML = '';

  // Store the studentsWorkId in the form for later use
  const form = document.getElementById('studentsWorkEditForm');
  form.dataset.studentsWorkId = studentsWorkId;

  // Get current user data from the page
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id') || state.userId;
  // Fetch and populate education data
  api
    .fetch(`/studentsWork/find/${studentsWorkId}`)
    .then((studentsWork) => {
      console.log(studentsWork);
      if (studentsWork) {
        const newGroup = template.content
          .cloneNode(true)
          .querySelector('.studentsWork-input-group');

        // Set values
        newGroup.querySelector('#title').value = studentsWork.title || '';
        newGroup.querySelector('#firstName').value =
          studentsWork.firstName || '';
        newGroup.querySelector('#lastName').value = studentsWork.lastName || '';
        newGroup.querySelector('#graduationYear').value =
          studentsWork.graduationYear || '';
        newGroup.querySelector('#description').value =
          studentsWork.description || '';
        newGroup.querySelector('[name="link"]').value = studentsWork.link || '';

        // Replace the remove button with a delete button
        const removeBtn = newGroup.querySelector('.remove-studentsWork');
        if (removeBtn) {
          removeBtn.className = 'btn-icon delete-studentsWork';
          removeBtn.innerHTML =
            '<i class="fas fa-trash" aria-hidden="true"></i>';
          removeBtn.title = 'Delete Students Work';
          removeBtn.onclick = async (e) => {
            e.preventDefault();
            if (confirm('Da li ste sigurni da želite da obrišete rad?')) {
              try {
                await api.deleteStudentsWork(studentsWorkId);
                UI.showNotification('Students work deleted successfully');
                UI.closeModal();

                // Refresh resources list
                const studentsWork = await api.getStudentsWork(state.userId);
                UI.updateStudentsWorkDisplay(studentsWork, true);

                // Reload page to show updated resources
                window.location.reload();
              } catch (error) {
                console.error('Error deleting resource:', error);
                UI.showNotification(
                  error.message || 'Error deleting students work',
                  'error'
                );
              }
            }
          };
        }

        resourceInputs.appendChild(newGroup);
      }
    })
    .catch((error) => {
      console.error('Error loading resource data:', error);
      UI.showNotification('Failed to load resource data', 'error');
    });
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
    modal.style.display = 'flex';
  }
};

window.toggleStudentsWorkUpload = () => {
  const modal = document.getElementById('studentsWorkUploadModal');
  if (modal) {
    modal.style.display = 'flex';
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

window.handleAddResource = () => {
  const resourceInputs = document.querySelector('.resource-inputs');
  const resourceTemplate = document.getElementById('resourceFormTemplate');
  const newGroup = resourceTemplate.content
    .cloneNode(true)
    .querySelector('.resource-input-group');

  // Clear any existing values
  newGroup.querySelectorAll('input').forEach((input) => (input.value = ''));

  // Set up remove button click handler
  const removeBtn = newGroup.querySelector('.remove-resource');
  if (removeBtn) {
    removeBtn.onclick = (e) => {
      e.preventDefault();
      const group = e.target.closest('.resource-input-group');
      if (group) {
        group.remove();
      }
    };
  }

  // Add the new group to the form
  resourceInputs.appendChild(newGroup);
};
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

async function openFullResourceListModal(resources, isOwnProfile) {
  const modal = document.getElementById('fullResourceModal');
  const modalTitle = document.getElementById('fullModalTitle');
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id') || state.userId;
  const user = await api.fetch(`/users/me/${profileId}`);
  const fullList = document.querySelector('.full-resource-list');
  // Set modal content
  modalTitle.textContent = 'All Resources';

  fullList.innerHTML = resources
    .sort((b, a) => new Date(b.created_at) - new Date(a.created_at))
    .map((resource) => {
      const formattedDate = formatDate(resource.created_at);
      const researcherName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : 'Unknown researcher';
      const isLongDescription =
        resource.description && resource.description.length > 50;
      const truncatedDescription = isLongDescription
        ? `${resource.description.substring(0, 50)}...`
        : resource.description || 'No description available';
      return `
      <div class="resource-item">
        <div class="resource-header">
          <h3>${resource.title || 'No title'}</h3>
          ${
            isOwnProfile
              ? `
            <div class="resource-actions">
              <button class="btn-icon" onclick="toggleResourceEdit('${resource.id}')">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          `
              : ''
          }
        </div>
        <div class="resource-description-container">
          <p class="resource-description">${truncatedDescription}</p>
        </div>
        <div class="resource-footer">
          <div class="resource-meta"></div>
          ${
            isLongDescription
              ? `<button class="read-more-btn" onclick="openResourceModal('${resource.id}')">More</button>`
              : ''
          }
        </div>
      </div>
    `;
    })
    .join('');

  modal.classList.add('active');

  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
}
async function openResourceModal(resourceId) {
  const modal = document.getElementById('resourceModal');
  const fullModal = document.getElementById('fullResourceModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMeta = document.getElementById('modalMeta');
  const modalDescription = document.getElementById('modalDescription');
  const modalViewLink = document.getElementById('modalViewLink');

  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id') || state.userId;

  // Dohvatanje podataka
  const user = await api.fetch(`/users/me/${profileId}`);
  const resourceResponse = await api.fetch(
    `/users/resources/find/${resourceId}`
  );

  // Pošto API vraća niz sa jednim objektom, uzimamo prvi element
  const resource = Array.isArray(resourceResponse)
    ? resourceResponse[0]
    : resourceResponse;

  console.log(resourceId);
  console.log(resource);

  // Opciono: sačuvati resource u sessionStorage za kasnije korišćenje
  sessionStorage.setItem(`resource_${resourceId}`, JSON.stringify(resource));

  // Set modal content
  modalTitle.textContent = resource.title;
  fullModal.classList.remove('active');

  // Format the creation date
  const formattedDate = formatDate(resource.created_at);

  // Get researcher name - koristimo podatke iz resource objekta direktno
  let researcherName = 'Unknown researcher';

  if (
    resource.researcher &&
    resource.researcher.firstName &&
    resource.researcher.lastName
  ) {
    researcherName = `${resource.researcher.firstName} ${resource.researcher.lastName}`;
  } else if (user.firstName && user.lastName) {
    researcherName = `${user.firstName} ${user.lastName}`;
  }

  // Set metadata
  modalMeta.innerHTML = `
    <span class="researcher">
      <i class="fas fa-user"></i> ${researcherName}
    </span>
    <span class="date">
      <i class="fas fa-calendar"></i> ${formattedDate}
    </span>
  `;

  // Set description
  modalDescription.textContent =
    resource.description || 'No description available';

  // Set view link
  modalViewLink.href = resource.url;

  // Show modal
  modal.classList.add('active');

  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';

  // Vraćamo resource objekat ako je potrebno
  return resource;
}

function closeResourceModal() {
  const modal = document.getElementById('resourceModal');
  const fullModal = document.getElementById('fullResourceModal');
  modal.classList.remove('active');

  // Re-enable body scrolling
  document.body.style.overflow = '';
}
function closeFullResourceModal() {
  const modal = document.getElementById('fullResourceModal');
  modal.classList.remove('active');

  // Re-enable body scrolling
  document.body.style.overflow = '';
}

async function openFullStudentsWorkListModal(studentsWork, isOwnProfile) {
  const modal = document.getElementById('fullStudentsWorkModal');
  const modalTitle = document.getElementById('fullStudentsWorkModalTitle');
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id') || state.userId;
  const user = await api.fetch(`/users/me/${profileId}`);
  const fullList = document.querySelector('.full-studentsWork-list');
  // Set modal content
  modalTitle.textContent = 'All Students Work';

  fullList.innerHTML = studentsWork
    .sort((b, a) => new Date(b.created_at) - new Date(a.created_at))
    .map((studentsWork) => {
      const formattedDate = formatDate(studentsWork.created_at);
      const researcherName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : 'Unknown researcher';
      const isLongDescription =
        studentsWork.description && studentsWork.description.length > 50;
      const truncatedDescription = isLongDescription
        ? `${studentsWork.description.substring(0, 50)}...`
        : studentsWork.description || 'No description available';
      return `
      <div class="studentsWork-item">
        <div class="studentsWork-header">
          <h3>${studentsWork.title || 'No title'} - ${studentsWork.firstName} ${
        studentsWork.lastName
      } (${studentsWork.graduationYear})</h3>
          ${
            isOwnProfile
              ? `
            <div class="studentsWork-actions">
              <button class="btn-icon" onclick="toggleStudentsWorkEdit('${studentsWork.id}')">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          `
              : ''
          }
        </div>
        <div class="studentsWork-description-container">
          <p class="studentsWork-description">${truncatedDescription}</p>
        </div>
        <div class="studentsWork-footer">
          <div class="studentsWork-meta"></div>
          ${
            isLongDescription
              ? `<button class="read-more-btn" onclick="openStudentsWorkModal('${studentsWork.id}')">More</button>`
              : ''
          }
        </div>
      </div>
    `;
    })
    .join('');

  modal.classList.add('active');

  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
}
async function openStudentsWorkModal(studentsWorkId) {
  const modal = document.getElementById('studentsWorkModal');
  const fullModal = document.getElementById('fullStudentsWorkModal');
  const modalTitle = document.getElementById('studentsWork-modal-title');
  const modalMeta = document.getElementById('studentsWork-modal-meta');
  const modalDescription = document.getElementById(
    'studentsWork-modal-description'
  );
  const modalViewLink = document.getElementById('modalViewLink');

  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id') || state.userId;

  // Dohvatanje podataka
  const user = await api.fetch(`/users/me/${profileId}`);
  const studentsWorkResponse = await api.fetch(
    `/studentsWork/find/${studentsWorkId}`
  );

  // Pošto API vraća niz sa jednim objektom, uzimamo prvi element
  const studentsWork = Array.isArray(studentsWorkResponse)
    ? studentsWorkResponse[0]
    : studentsWorkResponse;

  console.log(studentsWorkId);
  console.log(studentsWork);

  // Opciono: sačuvati resource u sessionStorage za kasnije korišćenje
  sessionStorage.setItem(
    `studentsWork_${studentsWorkId}`,
    JSON.stringify(studentsWork)
  );

  // Set modal content
  modalTitle.textContent = studentsWork.title;
  console.log(modalTitle);
  fullModal.classList.remove('active');

  // Format the creation date
  const formattedDate = formatDate(studentsWork.created_at);

  // Get researcher name - koristimo podatke iz resource objekta direktno
  let researcherName = 'Unknown researcher';

  if (
    studentsWork.researcher &&
    studentsWork.researcher.firstName &&
    studentsWork.researcher.lastName
  ) {
    researcherName = `${studentsWork.researcher.firstName} ${studentsWork.researcher.lastName}`;
  } else if (user.firstName && user.lastName) {
    researcherName = `${user.firstName} ${user.lastName}`;
  }

  // Set metadata
  modalMeta.innerHTML = `
    <span class="researcher">
      <i class="fas fa-user"></i> ${user.firstName} ${user.lastName}
    </span>
    <span class="date">
      <i class="fas fa-calendar"></i> ${formattedDate}
    </span>
  `;

  // Set description
  modalDescription.textContent =
    studentsWork.description || 'No description available';

  // Set view link
  modalViewLink.href = studentsWork.url;

  // Show modal
  modal.classList.add('active');

  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';

  // Vraćamo resource objekat ako je potrebno
  return studentsWork;
}

function closeStudentsWorkModal() {
  const modal = document.getElementById('studentsWorkModal');
  const fullModal = document.getElementById('fullStudentsWorkModal');
  modal.classList.remove('active');

  // Re-enable body scrolling
  document.body.style.overflow = '';
}
function closeFullStudentsWorkModal() {
  const modal = document.getElementById('fullStudentsWorkModal');
  modal.classList.remove('active');

  // Re-enable body scrolling
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  handlers.init();
});

// Export the validation functions for use in HTML
window.validateFileSize = validateFileSize;
window.validateJSON = validateJSON;

// Helper function to format dates
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Mock authState object if it's not already defined
window.authState = window.authState || {
  isAuthenticated: state.isAuthenticated(),
  user: JSON.parse(sessionStorage.getItem('user')) || null,
  updateNavbar: () => {
    // Implement your navbar update logic here
    console.log('Navbar updated');
  },
};
