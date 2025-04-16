// Sample data for news items


const dropdowncontent = document.getElementById('dropdownContent');
const currentYear = new Date().getFullYear();
document.getElementById('currentYear').innerText = currentYear;

// Function to load news items


// Function to format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

  // Mobile navigation elements
  const mobileTeamTrigger = document.querySelector(
    '.mobile-dropdown-trigger-team'
  );
  const mobileProfileTrigger = document.querySelector('.user-menu');
  const mobileTopicsTrigger = document.querySelector('.mobile-dropdown-trigger-topics');
  const mobileOverlay = document.querySelector('.mobile-overlay');
  const teamPanel = document.querySelector('.mobile-dropdown-panel-team');
  const userPanel = document.querySelector('.mobile-user-panel');
  const closeTeamBtn = document.querySelector('.close-dropdown-team');
  const closeUserBtn = document.querySelector('.close-user-panel');
  const topicsPanel = document.querySelector('.mobile-dropdown-panel-topics');
  const closeTopicsBtn = document.querySelector('.close-dropdown');
  // Helper function to close all panels
  function closeAllPanels() {
    teamPanel.classList.remove('active');
    userPanel.classList.remove('active');
    topicsPanel.classList.remove('active');
    mobileOverlay.classList.remove('active');
  }

  // Team panel handler
  if (mobileTeamTrigger) {
    mobileTeamTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (userPanel.classList.contains('active')) {
        userPanel.classList.remove('active');
      }
      if (topicsPanel.classList.contains('active')) {
        topicsPanel.classList.remove('active');
      }
      teamPanel.classList.toggle('active');
      mobileOverlay.classList.toggle('active');
    });
  }

  if (mobileTopicsTrigger) {
    mobileTopicsTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (userPanel.classList.contains('active')) {
        userPanel.classList.remove('active');
      }
      if (teamPanel.classList.contains('active')) {
        teamPanel.classList.remove('active');
      }
      topicsPanel.classList.toggle('active');
      mobileOverlay.classList.toggle('active');
    });
  }


 
  // Profile panel handler
  if (mobileProfileTrigger) {
    mobileProfileTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (teamPanel.classList.contains('active')) {
        teamPanel.classList.remove('active');
      }
      if (topicsPanel.classList.contains('active')) {
        topicsPanel.classList.remove('active');
      }
      userPanel.classList.toggle('active');
      mobileOverlay.classList.toggle('active');
    });
  }

  // Close buttons handlers
  if (closeTeamBtn) {
    closeTeamBtn.addEventListener('click', closeAllPanels);
  }
  if (closeUserBtn) {
    closeUserBtn.addEventListener('click', closeAllPanels);
  }

  if (closeTopicsBtn) {
    closeTopicsBtn.addEventListener('click', closeAllPanels);
  }

  // Overlay click handler
  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeAllPanels);
  }
 


  const mobileAppBtn = document.getElementById('mobileAppBtn');
  const mobileAppDropdown = document.getElementById('mobileAppDropdown');
  const studentsWorkItem = document.getElementById('studentsWorkItem');

  // Toggle dropdown when Applications button is clicked
  mobileAppBtn.addEventListener('click', function (e) {
    e.preventDefault();

    // Toggle dropdown
    mobileAppDropdown.classList.toggle('open');
  });

  const appbtn = document.getElementById('buttonDropdown');
  const appbtnMobile = document.getElementById('mobileAppBtn');
  console.log(appbtn);
  const posTaggingLink = document.getElementById('posTaggingLink');
  const sentimentAnalysisLink = document.getElementById(
    'sentimentAnalysisLink'
  );
  const posTaggingLinkMobile = document.getElementById('posTaggingLinkMobile');
  const sentimentAnalysisLinkMobile = document.getElementById(
    'sentimentAnalysisLinkMobile'
  );
  const createPostBtn = document.getElementById('createPostBtn');

  const user = JSON.parse(sessionStorage.getItem('user'));
  if (user && user.role) {
    console.log(user.role);
    if (
      user.role === 'researcher' ||
      user.role === 'admin' ||
      user.role === 'anotator1' ||
      user.role === 'anotator2'
    ) {
      appbtn.style.display = 'inline-block';
      appbtnMobile.style.display = 'block';
    } else {
      appbtn.style.display = 'none';
      appbtnMobile.style.display = 'none';
      console.log('ne moze');
    }

    if (
      user.role === 'researcher' ||
      user.role === 'admin' ||
      user.role === 'anotator2'
    ) {
      posTaggingLink.style.display = 'block';
      posTaggingLinkMobile.style.display = 'block';
    } else {
      posTaggingLink.style.display = 'none';
      posTaggingLinkMobile.style.display = 'none';
      console.log('ne moze');
    }

    if (
      user.role === 'researcher' ||
      user.role === 'admin' ||
      user.role === 'anotator1'
    ) {
      sentimentAnalysisLink.style.display = 'block';
      sentimentAnalysisLinkMobile.style.display = 'block';
    } else {
      sentimentAnalysisLink.style.display = 'none';
      sentimentAnalysisLinkMobile.style.display = 'none';
      console.log('ne moze');
    }
  } else {
    console.log('Korisnik nije prijavljen ili nema ulogu.');
    appbtn.style.display = 'none';
    appbtnMobile.style.display = 'none';
    posTaggingLink.style.display = 'none';
    posTaggingLinkMobile.style.display = 'none';
    sentimentAnalysisLink.style.display = 'none';
    sentimentAnalysisLinkMobile.style.display = 'none';
  }
});
