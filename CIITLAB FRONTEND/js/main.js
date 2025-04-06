// Sample data for news items
const newsItems = [
  {
    title: 'DIDS – Dan internet domena Srbije',
    date: '2025-03-16',
    summary:
      'Registar nacionalnog internet domena Srbije (RNIDS) organizovao je onlajn konferenciju "Novi prioriteti", fokusirajući se na bezbednost poslovanja na internetu i etiku u AI i marketingu. Predavači su bili stručnjaci iz Google-a, Smashing Magazine-a i Bayer-a.',
    image: 'https://eventsinserbia.com/wp-content/uploads/2022/03/konferencije-758x426.jpg',
  },
  {
    title: 'IT Fest 2025',
    date: '2025-02-03',
    summary:
      'Festival informacionih tehnologija "AI Frontiers" namenjen srednjoškolcima. Učesnici su mogli prisustvovati predavanjima i radionicama iz oblasti veštačke inteligencije, sajber bezbednosti, multimedije i video produkcije.',
    image: 'https://t4.ftcdn.net/jpg/03/14/92/75/360_F_314927575_yqFMAuXFTNC6gBflR2njRZ4bQb8dAb7y.jpg',
  },
  {
    title: 'Konferencija Digitalno obrazovanje 2025',
    date: '2025-04-11',
    summary:
      'Šesta međunarodna onlajn konferencija "Digitalno obrazovanje 2025" okupila je nastavnike i stručnjake iz oblasti digitalnih tehnologija u obrazovanju. Cilj je bio razmena iskustava i unapređenje nastavnih metoda.',
    image: 'https://media.istockphoto.com/id/1439425791/photo/digital-technology-software-development-concept-coding-programmer-working-on-laptop-with.jpg?s=612x612&w=0&k=20&c=43WZfDZcnI2lULx83NVAtFiGyzKHzi4HyLqYZgggX-c=',
  },
];





const dropdowncontent = document.getElementById('dropdownContent');
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






// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadNews();
  //createResponsiveNavbar();


 // Get elements
 
  

  document.querySelector('.mobile-dropdown-trigger-topics').addEventListener('click', function(e) {
    e.preventDefault();
    if(document.querySelector('.mobile-dropdown-panel-team').classList.contains('active')) {
      document.querySelector('.mobile-dropdown-panel-team').classList.toggle('active');
    }
    document.querySelector('.mobile-dropdown-panel-topics').classList.toggle('active');
    document.querySelector('.mobile-overlay').classList.toggle('active');
    
  });
  
  document.querySelector('.mobile-dropdown-trigger-team').addEventListener('click', function(e) {
    e.preventDefault();
    if(document.querySelector('.mobile-dropdown-panel-topics').classList.contains('active')) {
      document.querySelector('.mobile-dropdown-panel-topics').classList.toggle('active');
    }
    document.querySelector('.mobile-dropdown-panel-team').classList.toggle('active');
    document.querySelector('.mobile-overlay').classList.toggle('active');
  });
  
  document.querySelector('.close-dropdown').addEventListener('click', function() {
    document.querySelector('.mobile-dropdown-panel-topics').classList.remove('active');
    document.querySelector('.mobile-dropdown-panel-team').classList.remove('active');
    document.querySelector('.mobile-overlay').classList.remove('active');
  });
  document.querySelector('.close-dropdown-team').addEventListener('click', function() {
    document.querySelector('.mobile-dropdown-panel-topics').classList.remove('active');
    document.querySelector('.mobile-dropdown-panel-team').classList.remove('active');
    document.querySelector('.mobile-overlay').classList.remove('active');
  });
  
  document.querySelector('.user-menu').addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector('.mobile-dropdown-panel-topics').classList.remove('active');
    document.querySelector('.mobile-dropdown-panel-team').classList.remove('active');
    document.querySelector('.mobile-user-panel').classList.toggle('active');
    document.querySelector('.mobile-overlay').classList.toggle('active');
  });
  
  document.querySelector('.close-user-panel').addEventListener('click', function() {
    document.querySelector('.mobile-overlay').classList.remove('active');
    document.querySelector('.mobile-user-panel').classList.remove('active');
    
  });
  
  document.querySelector('.mobile-overlay').addEventListener('click', function() {
    document.querySelector('.mobile-dropdown-panel-topics').classList.remove('active');
    document.querySelector('.mobile-dropdown-panel-team').classList.remove('active');
    document.querySelector('.mobile-user-panel').classList.remove('active');
    this.classList.remove('active');
  });

  const mobileAppBtn = document.getElementById('mobileAppBtn');
 const mobileAppDropdown = document.getElementById('mobileAppDropdown');
 const studentsWorkItem = document.getElementById('studentsWorkItem');
 
 // Toggle dropdown when Applications button is clicked
 mobileAppBtn.addEventListener('click', function(e) {
   e.preventDefault();
   
   // Toggle dropdown
   mobileAppDropdown.classList.toggle('open');
   
 });

  const studentsWork = document.getElementById('studentsWork-section')
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
      appbtnMobile.style.display = 'inline-block';
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


