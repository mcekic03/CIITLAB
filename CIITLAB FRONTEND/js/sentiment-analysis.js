const API_BASE_URL = 'http://160.99.40.221:3500';
const authToken = localStorage.getItem('authToken');

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
  const storageId = localStorage.getItem('userId');

  // Proveri validnost ID-a iz storage-a
  const isStorageIdValid =
    storageId && storageId !== 'undefined' && storageId !== 'null';

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
}

// Initialize state when the script loads
initializeState();
const confirmBtn = document.getElementById('confirmBtn');
document.addEventListener('DOMContentLoaded', () => {
  // DOM elementi
  const startDemoBtn = document.getElementById('startDemo');
  const sentimentOverlay = document.getElementById('sentimentOverlay');
  const sentimentCard = document.getElementById('sentimentCard');
  const sentenceContainer = document.getElementById('sentenceContainer');
  const positiveBtn = document.getElementById('positiveBtn');
  const negativeBtn = document.getElementById('negativeBtn');
  const neutralBtn = document.getElementById('neutralBtn');
  const closeBtn = document.getElementById('closeBtn');
  const posTaggingLink = document.getElementById('posTaggingLink');
  const sentimentAnalysisLink = document.getElementById(
    'sentimentAnalysisLink'
  );

  const heroContent = document.getElementById('heroContent');
  const sentimentApp = document.getElementById('sentimentApp');
  const sentimentCloseBtn = document.getElementById('sentimentCloseBtn');

  confirmBtn.addEventListener('click', (e) => {
    console.log('Dugme potvrde kliknuto!');
  });

  let currentSentence = null; // Trenutna rečenica
  let selectedSentiment = null;
  
  window.addEventListener("beforeunload", (event) => {
    if (sentimentOverlay?.classList.contains("active")) {
        event.preventDefault();
        event.returnValue = ""; // Potrebno za prikazivanje dijaloga u nekim browserima
    }
});


  if (sentimentCloseBtn) {
    sentimentCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sentimentApp.classList.remove('active');
      setTimeout(() => {
        heroContent.classList.remove('hidden');
        const existingOverlay = document.querySelector('.darkening-overlay');
        if (existingOverlay) {
          existingOverlay.remove();
        }
      }, 300);
      currentSentence = null;
    });
  }

  if (sentimentAnalysisLink) {
    sentimentAnalysisLink.addEventListener('click', (e) => {
      e.preventDefault();

      console.log(JSON.parse(localStorage.getItem('user')).role);

      // Hide hero content with transition
      heroContent.classList.add('hidden');

      // Show sentiment app with transition
      setTimeout(() => {
        sentimentApp.classList.add('active');
        const existingOverlay = document.querySelector('.darkening-overlay');

        if (existingOverlay) {
          // Remove overlay if it exists
          existingOverlay.remove();
        } else {
          // Create and add overlay if it doesn't exist
          const overlay = document.createElement('div');
          overlay.className = 'darkening-overlay';
          document.body.appendChild(overlay);
        }
      }, 300);
    });
  }

  console.log(state.authToken);

  // Dohvatanje nove rečenice iz baze
  async function getSentence() {
    sentimentCard.classList.remove('pulse');
    void sentimentCard.offsetWidth; // Trigger reflow
    sentimentCard.classList.add('pulse');

    setTimeout(() => {
      if (sentimentApp.classList.contains('active')) {
        sentimentApp.classList.remove('active');
      }
    }, 300);

    try {
      const response = await fetch(`${API_BASE_URL}/sentences/getSentence`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${state.authToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(JSON.parse(localStorage.getItem('user')).role);
      currentSentence = await response.json();
      console.log(state.authToken);
      console.log(currentSentence[0]);

      currentSentence = currentSentence[0];
      // Postavljanje rečenice u interfejs
      sentenceContainer.textContent = currentSentence.sentence;
      sentimentOverlay.classList.add('active');
      negativeBtn.classList.remove('active');
      positiveBtn.classList.remove('active');
      neutralBtn.classList.remove('active');
    } catch (error) {
      console.error('Greška pri dohvatanju rečenice:', error);
    }
  }
  // Slanje feedback-a
  async function sendFeedback(sentiment) {
    if (!currentSentence) {
      console.log('Nema trenutne rečenice.');
      return;
    }
    console.log('Šaljem feedback za:', sentiment);
    console.log('Trenutna rečenica:', currentSentence);

    if (sentiment === 'positive') {
      currentSentence.p += 1;
    } else if (sentiment === 'negative') {
      currentSentence.n += 1;
    } else if (sentiment === 'neutral') {
      currentSentence.status = 3;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/sentences/postSentence`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentSentence),
      });

      console.log('Odgovor servera:', response);

      if (!response.ok) {
        throw new Error('Greška pri slanju povratne informacije.');
      }

      currentSentence = null;
      getSentence();
    } catch (error) {
      console.error('Greška pri slanju:', error);
    }
  }

  // Zatvaranje modala bez interakcije
  async function closeSentimentCard() {
    sentimentApp.classList.remove('active');
    setTimeout(() => {
      heroContent.classList.remove('hidden');
      const existingOverlay = document.querySelector('.darkening-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
    }, 300);

    if (currentSentence) {
      try {
        await fetch(`${API_BASE_URL}/sentences/postSentence`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${state.authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentSentence), // Šaljemo nepromenjen objekat
        });
        currentSentence = null;
      } catch (error) {
        console.error('Greška pri slanju prazne povratne informacije:', error);
      }
    }

    sentimentOverlay.classList.remove('active');
    confirmBtn.style.display = 'none';
    selectedSentiment = null;

    currentSentence = null;
  }

  function disableScroll() {
    document.body.classList.add('no-scroll');
  }

  function enableScroll() {
    document.body.classList.remove('no-scroll');
  }

  // Prikazivanje sentiment kartice
  document
    .querySelector('#sentimentAnalysisLink')
    .addEventListener('click', disableScroll);
  document
    .querySelector('#sentimentCloseBtn')
    .addEventListener('click', enableScroll);
  document.querySelector('#closeBtn').addEventListener('click', enableScroll);
  
  console.log(sentimentOverlay.classList.contains('active'));
  
    

  console.log(confirmBtn);

  // Event listeneri
  startDemoBtn.addEventListener('click', getSentence);
  positiveBtn.addEventListener('click', () => {
    selectedSentiment = 'positive';
    console.log(selectedSentiment);
    positiveBtn.classList.add('active');
    negativeBtn.classList.remove('active');
    neutralBtn.classList.remove('active');
    confirmBtn.style.display = 'block';
  });
  negativeBtn.addEventListener('click', () => {
    selectedSentiment = 'negative';
    console.log(selectedSentiment);
    confirmBtn.style.display = 'block';
    negativeBtn.classList.add('active');
    positiveBtn.classList.remove('active');
    neutralBtn.classList.remove('active');
  });
  neutralBtn.addEventListener('click', () => {
    selectedSentiment = 'neutral';
    neutralBtn.classList.add('active');
    confirmBtn.style.display = 'block';
    negativeBtn.classList.remove('active');
    positiveBtn.classList.remove('active');
  });

  confirmBtn.addEventListener('click', () => {
    console.log('Dugme potvrde kliknuto!');
    console.log('Odabrani sentiment:', selectedSentiment);
    if (selectedSentiment) {
      sendFeedback(selectedSentiment);
      selectedSentiment = null;
      confirmBtn.style.display = 'none';
    } else {
      console.log('Nijedan sentiment nije odabran.');
    }
  });

  

  closeBtn.addEventListener('click', closeSentimentCard);
  sentimentCloseBtn.addEventListener('click', closeSentimentCard);

  // Zatvaranje klikom izvan kartice
  sentimentOverlay.addEventListener('click', (e) => {
    if (e.target === sentimentOverlay) {
      closeSentimentCard();
    }
  });
});
