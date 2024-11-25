import React, { useRef, useState, useEffect } from 'react';
import { HttpAgent, Actor } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';  // Import AuthClient
import { idlFactory } from '../../declarations/TuneBook_backend/TuneBook_backend.did.js';  // Correct path
import LoginOptions from './components/LoginOptions';  // Import the LoginOptions component
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom'; 
import Sessions from './components/Sessions';
import Friends from './components/Friends';
import Profile from './components/Profile';
import Tunes from './components/Tunes';
import Footer from './components/Footer';
import Contact from './components/ContactUs';
import FAQ from './components/Faq';
import ImageCarousel from './components/ImageCarousel'; 
import FeedbackForm from './components/Feedback';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Login from './components/Login';
import LoadingSpinner from './components/LoadingSpinner';
import Marketplace from './components/Marketplace';
import AboutUs from './components/AboutUs';
import InstrumentPreview from './components/InstrumentPreview';
import Forums from './components/Forums';

const canisterId = "6owwo-2yaaa-aaaam-qbelq-cai";


// Initialize actor without authentication
const initActor = (identity) => {
  const agentOptions = identity ? { identity } : {};
  const agent = new HttpAgent({ ...agentOptions, host: "https://ic0.app" });  // Mainnet host
  return Actor.createActor(idlFactory, { agent, canisterId });
};

function App() {
  const [authClient, setAuthClient] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // State for sidebar visibility
  const [actor, setActor] = useState(null);  // Hold Actor instance
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(false);
  const [activeFriends, setActiveFriends] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state
  const [loading, setLoading] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const actorInstance = initActor();  
    setActor(actorInstance);  
  }, []);

// Initialize AuthClient
useEffect(() => {
  const initAuthClient = async () => {
    const client = await AuthClient.create({
      idleOptions: {
        idleTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        disableDefaultIdleCallback: true, // Prevent auto logout on idle
      },
    });
    setAuthClient(client);

    // Restore session if user is already authenticated
    if (await client.isAuthenticated()) {
      console.log("Restoring session...");
      const identity = client.getIdentity();
      handleLogin(identity);
    }
  };

  initAuthClient();
}, []);



  // Authenticate user and fetch profile
  const handleLogin = async (identity) => {
    try {
      const actorInstance = initActor(identity);
      setActor(actorInstance);

      const principal = identity.getPrincipal().toString();
      setCurrentAccount(principal);
      setIsLoggedIn(true);

      console.log("Logged in as:", principal);

      // Fetch user profile
      const userProfile = await actorInstance.authentication(principal);
      if (userProfile && Object.keys(userProfile).length > 0) {
        setProfile(userProfile);
      } else {
        console.log("Redirecting to profile creation...");
        navigate('/profile');
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

 // Logout and reset state
 const handleLogout = async () => {
  if (authClient) {
    await authClient.logout();
    setCurrentAccount(null);
    setIsLoggedIn(false);
    setActor(initActor());
    console.log("User logged out");
  }
};

// Renew session periodically
useEffect(() => {
  const renewSession = async () => {
    if (authClient && await authClient.isAuthenticated()) {
      console.log("Renewing session...");
      await authClient.login({
        identityProvider: "https://identity.ic0.app",
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000), // 7 days
        onSuccess: () => console.log("Session renewed"),
      });
    }
  };
  
  const interval = setInterval(renewSession, 6 * 60 * 60 * 1000); // Every 6 hours
  return () => clearInterval(interval);
}, [authClient]);

// Login with Internet Identity
const loginICP = async () => {
  if (authClient) {
    await authClient.login({
      identityProvider: "https://identity.ic0.app",
      maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000), // 7 days
      onSuccess: () => {
        console.log("ICP Login Successful");
        handleLogin(authClient.getIdentity());
        setSidebarOpen(false);
      },
    });
  }
};

// Login with NFID
const loginNFID = async () => {
  if (authClient) {
    const APP_NAME = "Tunebook"; // Replace with your app name
    const APP_LOGO = "https://nfid.one/icons/favicon-96x96.png"; // Replace with your logo URL
    const identityProvider = `https://nfid.one/authenticate?applicationName=${APP_NAME}&applicationLogo=${APP_LOGO}`;

    await authClient.login({
      identityProvider,
      maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000), // 7 days
      onSuccess: () => {
        console.log("NFID Login Successful");
        handleLogin(authClient.getIdentity());
        setSidebarOpen(false);
      },
      windowOpenerFeatures: `
        left=${window.screen.width / 2 - 525 / 2},
        top=${window.screen.height / 2 - 705 / 2},
        toolbar=0,location=0,menubar=0,width=525,height=705
      `,
    });
  }
};

  

  const handleLogoClick = () => {
    navigate('/'); 
  };

    // Handle clicks outside of the sidebar
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
          setSidebarOpen(false); // Close the sidebar when clicked outside
        }
      };
  
      if (sidebarOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      } else {
        document.removeEventListener('mousedown', handleClickOutside);
      }
  
      // Cleanup the event listener when the component unmounts or sidebar is closed
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [sidebarOpen]);


  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>

      {loading && <LoadingSpinner />}

      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-brand" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        {  <img src="/Tunebook_Logo.png" alt="Logo" className="navbar-logo" /> }
          <img src="/Tunebook-Name.png" alt="Tunebook Title" className="navbar-title" /> 
        </div>
        <div className="navbar-links">
        
        

          <div
            className="navbar-buttons"
            onClick={() => navigate('/marketplace')}
            style={{ cursor: 'pointer', opacity: actor ? 1 : 0.5 }}
          >
             Marketplace
          </div>

          <div
            className="navbar-buttons"
            onClick={() => navigate('/forums')}
            style={{ cursor: 'pointer', opacity: actor ? 1 : 0.5 }}
          >
              Forums
          </div>


          <div
            className="navbar-buttons"
            onClick={() => navigate('/sessions')}
            style={{ cursor: 'pointer', opacity: actor ? 1 : 0.5 }}
          >
            Sessions
          </div>

          <div
            className="navbar-buttons"
            onClick={() => navigate('/friends')}
            style={{ cursor: 'pointer', opacity: actor ? 1 : 0.5 }}
          >
             Profile
          </div>

          {/* Toggle between Login and Logout buttons based on the isLoggedIn state */}
          {isLoggedIn ? (
            <button className="login-button" onClick={handleLogout}>Logout</button>
          ) : (
            <button className="login-button" onClick={() => setSidebarOpen(true)}>Login</button>
          )}
        </div>
      </nav>

      {/* Sidebar Panel for Login */}
      <div ref={sidebarRef} className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <h2>Connect To Get Started</h2>
          <p style={{ textAlign: "center" }}>Sign in to use the platform.</p>


          {/* Use the LoginOptions component for logins */}
          {<LoginOptions onLoginICP={loginICP} onLoginNFID={loginNFID} />}

          <ul
          style={{
            paddingLeft: "20px",
            textAlign: "left",
            color: "white",
            lineHeight: "1.8",
            fontSize: "16px",
            marginBottom: "20px",
            marginTop: "50px"
          }}
        >
          <li>
            <strong style={{ color: "#86e3e6" }}>Internet Identity:</strong> A simple,
            secure login method designed for the apps of tomorrow.
          </li>
          <li>
            <strong style={{ color: "#86e3e6" }}>NFID:</strong> Login with your email or
            Google account, making it just as familiar and easy as other apps you
            use daily.
          </li>
        </ul>
          

          <h3 className="terms-text">
            By Connecting, you agree to have read and understood and accept the{" "}
            <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">
              Terms of Service.
            </a>
          </h3>
        </div>

      </div>

      {/* Main Content */}
      <div className="main-content">

        

        <Routes>
          
        <Route 
            path="/" 
            element={
              <>
                <ImageCarousel />

                <div className="mid-app-container" >      
                  <p style={{ fontSize: '18px', lineHeight: '1.6', justifyContent: 'center', textAlign: 'justify'}}>
                  Explore a large collection of over <strong>4,200 tunes</strong>! 
                  Tunebook is a powerful platform for musicians to <strong>create, store, and share</strong> their tunes with the world.
                  Whether you're looking for inspiration or want to build your own digital library, Tunebook has you covered. 
                  
                  Connect with other Celtic musicians and find mutual tunes with them for your sessions. Find the latest sessions happening around your area. 
                  </p>          
                  </div>

                  <div className="mid-intro-container"> 
                      <button
                        className="intro-links"
                        onClick={() => navigate('/about-us')} // Navigate to the Tunes page
                      >
                         About Tunebook
                      </button>

                      <button
                        className="intro-links"
                        onClick={() => navigate('/tunes')} // Navigate to the Tunes page
                      >
                         View all Tunes
                      </button>
                    </div>

                  <div className="mid-intro-container"> 

                      <button
                        className="intro-links"
                        onClick={() => navigate('/forums')} 
                      >
                        Visit Forums
                      </button>


                      <button
                        className="intro-links"
                        onClick={() => navigate('/sessions')} // Navigate to the Sessions page
                      >
                         View all Sessions
                      </button>
                    </div>



                {actor ? <InstrumentPreview actor={actor} currentPrincipal={currentAccount} /> : <p>Coming soon.</p>}

              
                {actor ? (
                  <Tunes actor={actor} currentPrincipal={currentAccount} setSidebarOpen={setSidebarOpen} />
                ) : (
                  <p>Loading Tunes.</p>
                )}
          


              </>
            } 
          />

          
          <Route path="/profile" element={actor ? <Profile actor={actor} currentPrincipal={currentAccount} /> : <p> Profile not available, try refreshing this page.</p>} />
          
          <Route path="/sessions" element={actor ? <Sessions actor={actor} currentPrincipal={currentAccount}/> : <p>Sessions not available, try refreshing this page.</p>} />
          <Route path="/friends" element={actor ? <Friends actor={actor} currentPrincipal={currentAccount} /> : <p>Friends not available, try refreshing this page.</p>} />
          <Route path="/login" element={<Login setAuthClient={setAuthClient} setCurrentAccount={setCurrentAccount} setActor={setActor} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/forums" element={actor ? <Forums actor={actor} currentPrincipal={currentAccount}/> : <p>Forums not available, try refreshing this page.</p>} />
        
          <Route path="/tunes" element={actor ? <Tunes actor={actor} currentPrincipal={currentAccount} setSidebarOpen={setSidebarOpen} /> : <p>Please log in to view tunes.</p>} />

          <Route path="/marketplace" element={actor ? <Marketplace actor={actor} currentPrincipal={currentAccount} /> : <p>Coming soon.</p>} />
          <Route path="/instrument-preview" element={actor ? <InstrumentPreview actor={actor} currentPrincipal={currentAccount} /> : <p>Coming soon.</p>} />
          
          <Route path="/faq" element={<FAQ />} />

          <Route path="/contact" element={<Contact />} />
          <Route path="/feedback" element={<FeedbackForm />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

        </Routes>

        <Footer />

      </div>
    </div>
  );
}

// Wrapped with Router
function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default WrappedApp;