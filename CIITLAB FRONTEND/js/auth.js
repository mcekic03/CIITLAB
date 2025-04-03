// Config
const AUTH_CONFIG = {
  API_BASE_URL: 'http://160.99.40.221:3500/users',
  DEFAULT_PROFILE_IMAGE: '/images/default-avatar.png',
};

// State management
const authState = {
  isAuthenticated: false,
  user: null,
  token: null,

  init() {
    this.token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    // Proveri da li je userId validan
    const isValidId = userId && userId !== 'undefined' && userId !== 'null';
    console.log('Auth init - Token present:', !!this.token, 'userId present:', !!userId, 'userId valid:', isValidId, 'Raw userId value:', userId);
    
    // Ако нема токена или userId, нема смисла даље проверавати
    if (!this.token || !isValidId) {
      console.warn('No auth token or valid userId found in localStorage');
      // Постави стање као неаутентификовано и ажурирај навбар
      this.isAuthenticated = false;
      this.user = null;
      this.updateNavbar();
      // Očisti nevažeće vrednosti
      if (this.token && !isValidId) {
        console.log('Clearing invalid authentication data');
        this.clearAuth();
      }
      return;
    }
    
    // Ако постоји токен и userId, учитај најновије податке о кориснику са сервера
    this.loadUserData(userId);
  },

  // Учитај најновије податке о кориснику са сервера
  async loadUserData(userId) {
    // Провера да ли постоји валидан userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.warn('Attempted to load user data with invalid userId:', userId);
      this.isAuthenticated = false;
      this.user = null;
      this.updateNavbar();
      return;
    }
    
    try {
      console.log('Loading user data for userId:', userId);
      const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/me/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Token is invalid or expired');
          this.clearAuth();
          return;
        }
        throw new Error('Failed to load user data');
      }

      const userData = await response.json();
      this.user = userData;
      this.isAuthenticated = true;
      
      // Ažuriraj lokalno skladište
      localStorage.setItem('user', JSON.stringify(userData));
      
      this.updateNavbar();
    } catch (error) {
      console.error('Error loading user data:', error);
      // Ako ne možemo da dobavimo podatke sa servera, očistimo autentifikaciju
      this.clearAuth();
    }
  },

  setAuth(user, token) {
    console.log('SetAuth called with user:', user);
    
    // Check if user has ID
    if (!user || (!user._id && !user.id)) {
      console.error('Error: User has no valid ID', user);
      return;
    }
    
    // Save user and token
    this.user = user;
    this.token = token;
    this.isAuthenticated = true;
    
    // Save data in localStorage
    localStorage.setItem('authToken', token);
    
    // Use _id or id, whichever is available
    const userId = user.id;
    console.log('Saving userId in localStorage:', userId);
    localStorage.setItem('userId', userId);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Check if saving was successful
    setTimeout(() => {
      console.log('Checking localStorage after setAuth:');
      console.log('authToken:', localStorage.getItem('authToken'));
      console.log('userId:', localStorage.getItem('userId'));
      console.log('user object:', localStorage.getItem('user'));
    }, 100);
    
    this.updateNavbar();
  },

  clearAuth() {
    console.log('Clearing auth data from localStorage');
    this.user = null;
    this.token = null;
    this.isAuthenticated = false;
    
    // Očisti localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    
    // Proveri da li je čišćenje uspelo
    setTimeout(() => {
      const authToken = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      const user = localStorage.getItem('user');
      
      console.log('After clearing - Token present:', !!authToken, 'userId present:', !!userId, 'user present:', !!user);
      
      // Ako podaci i dalje postoje, probaj clear
      if (authToken || userId || user) {
        console.warn('Failed to remove items from localStorage, trying clear()');
        localStorage.clear();
      }
    }, 100);
    
    this.updateNavbar();
  },

  // Pripremi URL profilne slike
  getProfileImageUrl() {
    if (!this.user) return AUTH_CONFIG.DEFAULT_PROFILE_IMAGE;
    
    // Ako profil ima punu URL putanju (http://...)
    if (this.user.profileImage && this.user.profileImage.startsWith('http')) {
      return this.user.profileImage;
    }
    
    // Ako profil ima relativnu putanju (/uploads/...)
    if (this.user.profileImage && this.user.profileImage.startsWith('/')) {
      // Preuzmi domen iz API_BASE_URL (npr. http://localhost:3000)
      const apiBase = AUTH_CONFIG.API_BASE_URL.replace('/users', '');
      return `${apiBase}${this.user.profileImage}`;
    }
    
    // Ako nema profilne slike
    return AUTH_CONFIG.DEFAULT_PROFILE_IMAGE;
  },

  updateNavbar() {
    const navbar = document.querySelector('.nav-links');
    if (!navbar) return;

    // Pronađi postojeći auth element (ako postoji)
    const existingAuth = navbar.querySelector('.auth-section');
    if (existingAuth) {
      existingAuth.remove();
    }

    // Kreiraj novi auth element
    const authSection = document.createElement('div');
    authSection.className = 'auth-section';

    if (this.isAuthenticated && this.user && (this.user?.role === 'researcher' || this.user?.role === 'student')) {
      // Pripremi putanju slike
      const profileImageUrl = this.getProfileImageUrl();
      console.log('Navbar profile image URL:', profileImageUrl);
      
      // Kreiraj dropdown za autentifikovanog korisnika
      authSection.innerHTML = `
        <div class="user-dropdown">
          <button class="user-dropdown-trigger">
            <img src="${profileImageUrl}" alt="Profile" class="profile-image" 
                 onerror="this.src='${AUTH_CONFIG.DEFAULT_PROFILE_IMAGE}'">
            <span>${this.user.firstName || ''} ${this.user.lastName || ''}</span>
            <i class="fas fa-chevron-down"></i>
          </button>
          <div class="user-dropdown-content">
            <a href="/profile.html">
              <i class="fas fa-user"></i> Profile
            </a>
            <a href="#" id="logoutBtn">
              <i class="fas fa-sign-out-alt"></i> Logout
            </a>
          </div>
        </div>
      `;
      setTimeout(() => {
        const logoutBtn = authSection.querySelector("#logoutBtn")
        if (logoutBtn) {
          logoutBtn.addEventListener("click", (e) => {
            e.preventDefault()
            this.clearAuth()
            window.location.href = "/index.html"
          })
        }
      }, 0)
    } else if (
      this.isAuthenticated &&
      (this.user.role === "anotator1" || this.user.role === "anotator2")
    ) {
      authSection.innerHTML = `
        <div class="user-dropdown">
          <button class="user-dropdown-trigger">
            <span>${this.user.firstName || ""} ${this.user.lastName || ""}</span>
            <i class="fas fa-chevron-down"></i>
          </button>
          <div class="user-dropdown-content">
            <a href="#" id="logoutBtn">
              <i class="fas fa-sign-out-alt"></i> Logout
            </a>
          </div>
        </div>
      `
    
      // Add the same event listener for admin logout - THIS WAS MISSING
      setTimeout(() => {
        const logoutBtn = authSection.querySelector("#logoutBtn")
        if (logoutBtn) {
          logoutBtn.addEventListener("click", (e) => {
            e.preventDefault()
            this.clearAuth()
            window.location.href = "/index.html"
          })
        }
      }, 0)
    } else if (this.isAuthenticated && this.user.role === "admin") {
      authSection.innerHTML = `
        <div class="user-dropdown">
          <button class="user-dropdown-trigger">
            <span>${this.user.firstName || ""} ${this.user.lastName || ""}</span>
            <i class="fas fa-chevron-down"></i>
          </button>
          <div class="user-dropdown-content">
          <a href="/admin.html">
              <i class="fas fa-cogs"></i> Admin Panel
            </a>
            <a href="#" id="logoutBtn">
              <i class="fas fa-sign-out-alt"></i> Logout
            </a>
          </div>
        </div>
      `
      setTimeout(() => {
        const logoutBtn = authSection.querySelector("#logoutBtn")
        if (logoutBtn) {
          logoutBtn.addEventListener("click", (e) => {
            e.preventDefault()
            this.clearAuth()
            window.location.href = "/index.html"
          })
        }
      }, 0)
    } else {
      // Create link for unauthenticated user
      authSection.innerHTML = `
        <a href="/login.html" class="btn btn-primary">Login</a>
      `
    }

    navbar.appendChild(authSection);
  }
};

// Inicijalizacija auth state-a kada se stranica učita
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing auth state...');
  
  // Check if this is login page
  const isLoginPage = window.location.href.includes('login.html') || window.location.href.includes('researcher-login.html');
  
  // If it's login page, clear localStorage of any incorrect data
  if (isLoginPage) {
    console.log('Login page detected - resetting localStorage');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
  }
  
  authState.init();
}); 