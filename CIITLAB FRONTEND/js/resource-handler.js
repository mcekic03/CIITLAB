// Resource Handler Module
const ResourceHandler = {
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

  // Initialize the resource handler
  init() {
    // Sačekaj da se authState inicijalizuje
    if (typeof authState === 'undefined') {
      console.error('authState not initialized');
      return;
    }
    this.checkAuthAndSetupUI();
    this.loadResources();
    this.setupEventListeners();
  },

  // Check authentication and setup UI accordingly
  checkAuthAndSetupUI() {
    const authToken = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const addResourceBtn = document.getElementById('addResourceBtn');

    if (authToken && userRole === 'researcher' && addResourceBtn) {
      addResourceBtn.style.display = 'flex';
      addResourceBtn.addEventListener('click', () => {
        const modal = document.getElementById('resourceUploadModal');
        if (modal) {
          modal.style.display = 'block';
        }
      });
    }
  },

  // Set up event listeners
  setupEventListeners() {
    const form = document.getElementById('resourceUploadForm');
    if (form) {
      form.addEventListener('submit', this.handleResourceSubmit.bind(this));
    }
  },

  // Load resources from the API
  async loadResources() {
    try {
      console.log('Loading resources...');
      const authToken = localStorage.getItem('authToken');
      console.log('Auth token present:', !!authToken);

      const urlParams = new URLSearchParams(window.location.search);
      let urlId = urlParams.get('id');
      if(urlId == null){
        urlId = localStorage.getItem('userId')
      }
      const response = await fetch(`${this.config.API_BASE_URL}/resources/all`, {
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
        console.log(`Resource ${index + 1} researcher data:`, resource.researcher_id);
      });
      
      this.displayResources(resources);
    } catch (error) {
      console.error('Error loading resources:', error);
      this.displayError('Error loading resources');
    }
  },

  

  // Display resources in the list
 async displayResources(resources) {
    const resourcesList = document.getElementById('resources-list-page');
    
    if (!resourcesList) {
      console.error('Resources list element not found');
      return;
    }
    if (resources.length === 0) {
      resourcesList.innerHTML = '<p class="no-resources">No resources available at the moment.</p>';
      return;
    }

    // Clear existing resources
    resourcesList.innerHTML = '';

    // Add each resource to the list
    resources.forEach(resource => {
      // Format the creation date
      const formattedDate = formatDate(resource.created_at);
      
      // Get researcher name
      const researcherName = resource.researcher && resource.researcher.firstName && resource.researcher.lastName
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
            ${isLongDescription ? '<button class="read-more-btn-page">Read more</button>' : ''}
          </div>
        </div>
        <div class="resource-actions-page">
          <a href="${resource.url}" target="_blank" rel="noopener noreferrer" class="btn-primary resource-btn">
            <i class="fas fa-external-link-alt"></i> View resource
          </a>
        </div>
      `;
      console.log(resourcesList);
      // Add event listener to "Read more" button if it exists
      if (isLongDescription) {
        const readMoreBtn = resourceElement.querySelector('.read-more-btn-page');
        readMoreBtn.addEventListener('click', () => openModal(resource));
      }

      resourcesList.appendChild(resourceElement);
      
    });
  },

  // Modal functions


  

  // Event listeners for modal
  
  // Display error message
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

  // Handle resource form submission
  async handleResourceSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Disable form during submission
    Array.from(form.elements).forEach((element) => (element.disabled = true));
    submitButton.textContent = 'Adding...';

    try {
      // Get form values and log them
      const title = form.querySelector('#resourceTitle').value.trim();
      const description = form
        .querySelector('#resourceDescription')
        .value.trim();
      const url = form.querySelector('#resourceUrl').value.trim();

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
        throw new Error('You must be logged in to add a resource');
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
      console.log('Submitting resource data:', formData);

      const response = await fetch(
        `${this.config.API_BASE_URL}/resources/updateResources`,
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
        throw new Error(errorData.message || 'Error adding resource');
      }

      const newResource = await response.json();
      console.log('Resource added successfully:', newResource);

      // Refresh the resources list
      await this.loadResources();

      // Close the modal
      this.closeResourceModal();

      // Show success message
      this.displaySuccess('Resource added successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error adding resource:', error);
      this.displayError(error.message);
    } finally {
      // Re-enable form
      Array.from(form.elements).forEach((element) => (element.disabled = false));
      submitButton.textContent = 'Add resource';
      form.reset();
    }
  },

  // Close the resource modal
  closeResourceModal() {
    const modal = document.getElementById('resourceUploadModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  // Handle resource deletion
  async handleResourceDelete(resourceId) {
    if (!resourceId) {
      console.error('No resource ID provided for deletion');
      this.showNotification(
        'Error: Cannot delete resource without ID',
        'error'
      );
      return;
    }

    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      console.log(
        'Deleting resource:',
        `${this.config.API_BASE_URL}/resources/${resourceId}`
      );

      const response = await fetch(
        `${this.config.API_BASE_URL}/resources/${resourceId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }

      this.showNotification('Resource deleted successfully!', 'success');
      await this.loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      this.showNotification('Error deleting resource', 'error');
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

function openModal(resource) {
  const modal = document.getElementById('resourceModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMeta = document.getElementById('modalMeta');
  const modalDescription = document.getElementById('modalDescription');
  const modalViewLink = document.getElementById('modalViewLink');

  // Set modal content
  modalTitle.textContent = resource.title;
  
  // Format the creation date
  const formattedDate = formatDate(resource.created_at);
  
  // Get researcher name
  const researcherName = resource.researcher && resource.researcher.firstName && resource.researcher.lastName
    ? `${resource.researcher.firstName} ${resource.researcher.lastName}`
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
  modalDescription.textContent = resource.description || 'No description available';

  // Set view link
  modalViewLink.href = resource.url;

  // Show modal
  modal.classList.add('active');
  
  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
}

function closeResourceModal() {
  const modal = document.getElementById('resourceModal');
  modal.classList.remove('active');
  
  // Re-enable body scrolling
  document.body.style.overflow = '';
}

document.getElementById('closeResourceModal').addEventListener('click', closeResourceModal);
  document.getElementById('resourceModalCloseBtn').addEventListener('click', closeResourceModal);
  
  // Close modal when clicking outside content
  document.getElementById('resourceModal').addEventListener('click', function(event) {
    if (event.target === this) {
      closeResourceModal();
    }
  });

// Initialize the resource handler when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  ResourceHandler.init();
});
