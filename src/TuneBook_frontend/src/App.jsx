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
  const refreshInterval = 5 * 60 * 100;


  useEffect(() => {
    const initAuthClient = async () => {
      setLoading(true); 
      const auth = await AuthClient.create();
      setAuthClient(auth);  // Store the AuthClient instance
    
      if (await auth.isAuthenticated()) {
        console.log('User is already authenticated');
        handleLogin(auth.getIdentity());
        setLoading(false);
      } else {
        console.log('User is not authenticated');
        setLoading(false);
      }
    };
  
    initAuthClient();
  }, []);


  useEffect(() => {
    // Set up periodic session refresh
    const refreshSession = async () => {
      if (authClient && (await authClient.isAuthenticated())) {
        const identity = authClient.getIdentity();
        handleLogin(identity); // Refresh the session by re-authenticating
      }
    };
    
    // Set interval for session refresh
    const intervalId = setInterval(refreshSession, refreshInterval);
    
    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [authClient]);
  

  useEffect(() => {
    const actorInstance = initActor();  
    setActor(actorInstance);  
  }, []);



  // Authenticate user and fetch profile
  const handleLogin = async (identity) => {
    try {
      if (!identity) {
        console.error('Identity is undefined. Unable to authenticate.');
        return;
      }

      const actorInstance = initActor(identity);  // Initialize actor with identity
      setActor(actorInstance);

      const principal = identity.getPrincipal().toString();  // User's principal
      setCurrentAccount(principal);
      setIsLoggedIn(true); // Set login state to true
      console.log('User logged in with principal:', principal);

      // Fetch user profile
      const userProfile = await actorInstance.authentication(principal);
      if (userProfile && Object.keys(userProfile).length > 0) {
        setProfile(userProfile);
        console.log('Profile fetched:', userProfile);
      } else {
        console.log('No profile found. Redirecting to profile creation...');
        navigate('/profile');  // Navigate to profile creation page if no profile is found
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (!authClient) return;

    await authClient.logout();
    setCurrentAccount(null);  // Reset user account
    setIsLoggedIn(false);     // Set login state to false
    setActor(initActor());    // Re-initialize actor without identity
    console.log('User has been logged out');
  };

  const loginICP = async () => {
    if (!authClient) return;
    await authClient.login({
      identityProvider: "https://identity.ic0.app",
      maxTimeToLive: 7 * 24 * 60 * 60 * 1_000_000_000,
      onSuccess: async () => {
        console.log('ICP Login Successful');
        handleLogin(authClient.getIdentity());
        setSidebarOpen(false);  // Close sidebar after login
      },
    });
  };

  const loginNFID = async () => {
    if (!authClient) return;
    await authClient.login({
      identityProvider: "https://nfid.one/authenticate",
      maxTimeToLive: 7 * 24 * 60 * 60 * 1_000_000_000,
      onSuccess: async () => {
        console.log('NFID Login Successful');
        handleLogin(authClient.getIdentity());
        setSidebarOpen(false);  // Close sidebar after login
      },
    });
  };

  const handleSessionsClick = () => {
    setActiveSession(true);  
    setActiveFriends(false);
    navigate('/sessions'); 
  };

  const handleFriendsClick = () => {
    setActiveFriends(true);  
    setActiveSession(false);
    navigate('/friends'); 
  };  

  const handleFeedbackClick = () => {
    setActiveFriends(false);  
    setActiveSession(false);
    navigate('/feedback'); 
  }; 

  const handleMarketplaceClick = () => {
    setActiveFriends(false);  
    setActiveSession(false);
    navigate('/marketplace'); 
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
          {/*
        <div
            className="navbar-buttons"
            onClick={() => handleFeedbackClick()}
            style={{ cursor: 'pointer', opacity: actor ? 1 : 0.5 }}
          >
              Feedback
          </div>
          */}

          <div
            className="navbar-buttons"
            onClick={() => navigate('/marketplace')}
            style={{ cursor: 'pointer', opacity: actor ? 1 : 0.5 }}
          >
             Marketplace
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
                  Explore a large collection of over <strong>18,000 tunes</strong>! 
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
                        onClick={() => navigate('/marketplace')} // Navigate to the Marketplace page
                      >
                        Visit Marketplace
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
