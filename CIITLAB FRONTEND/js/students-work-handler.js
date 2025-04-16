// studentWork Handler Module
const studentWorkHandler = {
  // Configuration - either use window.CONFIG or define our own
  config: window.CONFIG || {
    API_BASE_URL: 'http://160.99.40.221:3500/users',
  },

  // Debug helper functions
  debug: {
    // Test a URL - add to window for access from inline onclick handlers
    testUrl: function (url) {
      console.log('Testing URL:', url);
      if (!url) {
        console.error('URL is undefined or empty');
        return false;
      }

      try {
        // Test if URL is valid
        new URL(url);
        console.log('URL is valid');
        return true;
      } catch (e) {
        console.error('Invalid URL:', e);
        return false;
      }
    },
  },

  // Initialize the studentWork handler
  init() {
    // Sačekaj da se authState inicijalizuje
    if (typeof authState === 'undefined') {
      console.error('authState not initialized');
      return;
    }
    this.checkAuthAndSetupUI();
    this.loadStudentWork();
    this.setupEventListeners();
  },

  // Check authentication and setup UI accordingly
  checkAuthAndSetupUI() {
    const authToken = sessionStorage.getItem('authToken');
    const userRole = sessionStorage.getItem('userRole');
    const addstudentWorkBtn = document.getElementById('addstudentWorkBtn');

    if (authToken && userRole === 'researcher' && addstudentWorkBtn) {
      addstudentWorkBtn.style.display = 'flex';
      addstudentWorkBtn.addEventListener('click', () => {
        const modal = document.getElementById('studentWorkUploadModal');
        if (modal) {
          modal.style.display = 'block';
        }
      });
    }
  },

  // Set up event listeners
  setupEventListeners() {
    const form = document.getElementById('studentWorkUploadForm');
    if (form) {
      form.addEventListener('submit', this.handlestudentWorkSubmit.bind(this));
    }
  },

  // Load studentWorks from the API
  
  async loadStudentWork() {
    try {
      console.log('Loading students work...');
      const authToken = sessionStorage.getItem('authToken');
      console.log('Auth token present:', !!authToken);

      const urlParams = new URLSearchParams(window.location.search);
      let urlId = urlParams.get('id');
      if(urlId == null){
        urlId = sessionStorage.getItem('userId')
      }
      const response = await fetch('http://160.99.40.221:3500/studentsWork/getAll', {
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : undefined,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch studentWorks');
      }

      const studentsWork = await response.json();
      console.log('Loaded students work:', studentsWork);
      
    
      

      
      // Log each studentWork's researcher data
      studentsWork.forEach((studentsWork, index) => {
        console.log(`studentWork ${index + 1} researcher data:`, studentsWork.mentor_id);
      });
      
      this.displayStudentsWork(studentsWork);
    } catch (error) {
      console.error('Error loading students work:', error);
      this.displayError('Error loading students work');
    }
  },

  

  // Display studentWorks in the list
 
 async displayStudentsWork(studentsWork) {
    const studentsWorkList = document.getElementById('studentsWork-list-page');
    
    if (!studentsWorkList) {
      console.error('studentWorks list element not found');
      return;
    }
    if (studentsWork.length === 0) {
      studentsWorkList.innerHTML = '<p class="no-studentWorks">No studentWorks available at the moment.</p>';
      return;
    }

    // Clear existing studentWorks
    studentsWorkList.innerHTML = '';

    // Add each studentWork to the list
    studentsWork.forEach(studentWork => {
      // Format the creation date
      const formattedDate = formatDate(studentWork.created_at);
     
      // Check if description is long enough to need truncation
      const isLongDescription = studentWork.description.length > 100;
      const truncatedDescription = isLongDescription 
        ? `${studentWork.description.substring(0, 100)}...` 
        : studentWork.description || 'No description available';

      // Create studentWork HTML
      const studentWorkElement = document.createElement('div');
      studentWorkElement.className = 'studentWork-item-page';
      studentWorkElement.innerHTML = `
        <div class="studentWork-content-page">
          <div class="studentWork-header-page">
            <h3>${studentWork.title || 'No title'}</h3>
            <div class="studentWork-meta">
              <span class="researcher">
                <i class="fas fa-user"></i> ${studentWork.mentorFirstName}
              </span>
              <span class="date">
                <i class="fas fa-calendar"></i> ${formattedDate}
              </span>
            </div>
          </div>
          <div class="studentWork-description-container-page">
            <p class="studentWork-description-page">${truncatedDescription}</p>
            ${isLongDescription ? '<button class="read-more-btn-page">Read more</button>' : ''}
          </div>
        </div>
        <div class="studentWork-actions-page">
          <a href="${studentWork.link}" target="_blank" rel="noopener noreferrer" class="btn-primary studentWork-btn">
            <i class="fas fa-external-link-alt"></i> View studentWork
          </a>
        </div>
      `;
      console.log(studentsWorkList);
      // Add event listener to "Read more" button if it exists
      if (isLongDescription) {
        const readMoreBtn = studentWorkElement.querySelector('.read-more-btn-page');
        readMoreBtn.addEventListener('click', () => openStudentsWorkModal(studentWork));
      }

      studentsWorkList.appendChild(studentWorkElement);
      
    });
  },

  // Modal functions


  

  // Event listeners for modal
  
  // Display error message
  displayError(message) {
    const studentWorksList = document.querySelector('.studentWorks-list-page');
    if (studentWorksList) {
      studentWorksList.innerHTML = `<p class="error-message">${message}</p>`;
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

  // Handle studentWork form submission
  async handlestudentWorkSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Disable form during submission
    Array.from(form.elements).forEach((element) => (element.disabled = true));
    submitButton.textContent = 'Adding...';

    try {
      // Get form values and log them
      const title = form.querySelector('#studentWorkTitle').value.trim();
      const description = form
        .querySelector('#studentWorkDescription')
        .value.trim();
      const url = form.querySelector('#studentWorkUrl').value.trim();

      console.log('Raw form values:', { title, description, url });

      // Basic validation
      if (!title || !description || !url) {
        throw new Error('Title, description and URL are required');
      }

      // Check if user is authenticated
      if (typeof authState === 'undefined') {
        throw new Error('Authentication system is not initialized');
      }

      if (!authState.isAuthenticated || !authState.user) {
        throw new Error('You must be logged in to add a studentWork');
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
        description,
        url,
        researcher: authState.user.id, // Use researcher ID from authState
      };

      // Log the request details for debugging
      console.log('Submitting studentWork data:', formData);

      const response = await fetch(
        `${this.config.API_BASE_URL}/studentWorks/updatestudentWorks`,
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error adding studentWork');
      }

      const newstudentWork = await response.json();
      console.log('studentWork added successfully:', newstudentWork);

      // Refresh the studentWorks list
      await this.loadstudentWorks();

      // Close the modal
      this.closestudentWorkModal();

      // Show success message
      this.displaySuccess('studentWork added successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error adding studentWork:', error);
      this.displayError(error.message);
    } finally {
      // Re-enable form
      Array.from(form.elements).forEach((element) => (element.disabled = false));
      submitButton.textContent = 'Add studentWork';
      form.reset();
    }
  },

  // Close the studentWork modal
  closestudentWorkModal() {
    const modal = document.getElementById('studentWorkUploadModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  // Handle studentWork deletion
  async handlestudentWorkDelete(studentWorkId) {
    if (!studentWorkId) {
      console.error('No studentWork ID provided for deletion');
      this.showNotification(
        'Error: Cannot delete studentWork without ID',
        'error'
      );
      return;
    }

    if (!confirm('Are you sure you want to delete this studentWork?')) {
      return;
    }

    try {
      console.log(
        'Deleting studentWork:',
        `${this.config.API_BASE_URL}/studentWorks/${studentWorkId}`
      );

      const response = await fetch(
        `${this.config.API_BASE_URL}/studentWorks/${studentWorkId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete studentWork');
      }

      this.showNotification('studentWork deleted successfully!', 'success');
      await this.loadStudentsWork();
    } catch (error) {
      console.error('Error deleting studentWork:', error);
      this.showNotification('Error deleting studentWork', 'error');
    }
  },
};

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function openModal(studentsWork) {
  const modal = document.getElementById('studentWorkModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMeta = document.getElementById('modalMeta');
  const modalDescription = document.getElementById('modalDescription');
  const modalViewLink = document.getElementById('modalViewLink');

  // Set modal content
  modalTitle.textContent = studentWork.title;
  
  // Format the creation date
  const formattedDate = formatDate(studentWork.created_at);
  
  // Get researcher name
  const researcherName = studentWork.researcher && studentWork.researcher.firstName && studentWork.researcher.lastName
    ? `${studentWork.researcher.firstName} ${studentWork.researcher.lastName}`
    : 'Unknown researcher';

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
  modalDescription.textContent = studentWork.description || 'No description available';

  // Set view link
  modalViewLink.href = studentWork.url;

  // Show modal
  modal.classList.add('active');
  
  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
}

async function openStudentsWorkModal(studentWork) {
  const modal = document.getElementById('studentsWorkModal');
  const modalTitle = document.getElementById('studentsWork-modal-title');
  const modalMeta = document.getElementById('studentsWork-modal-meta');
  const modalDescription = document.getElementById(
    'studentsWork-modal-description'
  );
  const modalViewLink = document.getElementById('modalViewLink');
  console.log(studentWork.title);
  // Set modal content
  modalTitle.textContent = studentWork.title;
  console.log(modalTitle);

  // Format the creation date
  const formattedDate = formatDate(studentWork.created_at);

  // Get researcher name - koristimo podatke iz resource objekta direktno
  let researcherName = `${studentWork.mentorFirstName} ${studentWork.mentorLastName}`;

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
    studentWork.description || 'No description available';

  // Set view link
  modalViewLink.href = studentWork.url;

  // Show modal
  modal.classList.add('active');

  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';

  // Vraćamo resource objekat ako je potrebno
  return studentWork;
}

function closeStudentsWorkModal() {
  const modal = document.getElementById('studentsWorkModal');
  modal.classList.remove('active');

  // Re-enable body scrolling
  document.body.style.overflow = '';
}

document.getElementById('closestudentWorkModal').addEventListener('click', closestudentWorkModal);
  document.getElementById('studentWorkModalCloseBtn').addEventListener('click', closestudentWorkModal);
  
  // Close modal when clicking outside content
  document.getElementById('studentWorkModal').addEventListener('click', function(event) {
    if (event.target === this) {
      closestudentWorkModal();
    }
  });

// Initialize the studentWork handler when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  studentWorkHandler.init();
});
