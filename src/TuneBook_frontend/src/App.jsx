import React, { useState, useEffect } from 'react';
import { HttpAgent, Actor } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';  // Import AuthClient
import { idlFactory } from '../../declarations/TuneBook_backend/TuneBook_backend.did.js';  // Correct path
import LoginOptions from './components/LoginOptions';  // Import the LoginOptions component
import Tunes from './components/Tunes';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom'; 
import Sessions from './components/Sessions';
import Friends from './components/Friends';
import Profile from './components/Profile';


const canisterId = "6owwo-2yaaa-aaaam-qbelq-cai"

// Initialize actor without authentication
const initActor = (identity) => {
  const agentOptions = identity ? { identity } : {};
  const agent = new HttpAgent({ ...agentOptions, host: "https://ic0.app" });  // Mainnet host
  return Actor.createActor(idlFactory, { agent, canisterId });
};

function App() {
  // State for login and tunes
  const [authClient, setAuthClient] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // State for sidebar visibility
  const [actor, setActor] = useState(null);  // Hold Actor instance
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(false);
  const [activeFriends, setActiveFriends] = useState(false);

  // Initialize AuthClient and actor
  useEffect(() => {
    const initAuthClient = async () => {
      const auth = await AuthClient.create();
      setAuthClient(auth);

      // Automatically authenticate if the user is already logged in
      if (await auth.isAuthenticated()) {
        handleLogin(auth.getIdentity());
      }
    };
    initAuthClient();
  }, []);
  

  // Initialize backend actor on component mount
  useEffect(() => {
    const actorInstance = initActor();  
    setActor(actorInstance);  
  }, []);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  /*
  // Authenticate user and fetch profile
  const handleLogin = async (identity) => {
    try {
      // Check if identity is available before proceeding
      if (!identity) {
        console.error('Identity is undefined. Unable to authenticate.');
        return;
      }

      const actorInstance = initActor(identity);  // Initialize actor with the user's identity
      setActor(actorInstance);  // Set actor in state
      
      const principal = identity.getPrincipal().toString();  // User's principal
      setCurrentAccount(principal);

      // Fetch user profile using the backend authentication function
      const userProfile = await actorInstance.authentication(principal);
      if (userProfile) {
        setProfile(userProfile);
        navigate('/profile')
        console.log('Profile fetched:', userProfile);
      } else {
        console.error('User profile not found.');
        navigate('/profile')
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };
*/

// Authenticate user and fetch profile
const handleLogin = async (identity) => {
  try {
    // Check if identity is available before proceeding
    if (!identity) {
      console.error('Identity is undefined. Unable to authenticate.');
      return;
    }

    const actorInstance = initActor(identity);  // Initialize actor with the user's identity
    setActor(actorInstance);  // Set actor in state
    
    const principal = identity.getPrincipal().toString();  // User's principal
    setCurrentAccount(principal);

    // Fetch user profile using the backend authentication function
    const userProfile = await actorInstance.authentication(principal);

    // Handle profile based on its existence
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


  // ICP Identity Login
  const loginICP = async () => {
    if (!authClient) return;
    await authClient.login({
      identityProvider: "https://identity.ic0.app",
      maxTimeToLive: 24 * 3_600_000_000_000,
      onSuccess: async () => {
        handleLogin(authClient.getIdentity());
        toggleSidebar();
      },
    });
  };

  // NFID Login
  const loginNFID = async () => {
    if (!authClient) return;
    await authClient.login({
      identityProvider: "https://nfid.one/authenticate",
      onSuccess: async () => {
        handleLogin(authClient.getIdentity());
        toggleSidebar();
      },
    });
  };

  // Handle clicking the "Sessions" button: Switches the main content to Sessions
  const handleSessionsClick = () => {
    setActiveSession(true);  // Set Sessions active when button is clicked
    setActiveFriends(false);
    navigate('/sessions'); 
  };

  const handleFriendsClick = () => {
    setActiveFriends(true);  // Set Sessions active when button is clicked
    setActiveSession(false);
    navigate('/friends'); 
  };  

    // Handle clicking the "Tunebook" logo to navigate to the default page
    const handleLogoClick = () => {
      setActiveSession(false); // Reset Sessions view
      setActiveFriends(false); // Reset Friends view
      navigate('/'); // Programmatically navigate to the default page
    };

return (
  <div className="app-container">
    {/* Navigation Bar */}
    <nav className="navbar">
    <div className="navbar-brand" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <img src="/Music-logo.svg" alt="Logo" className="navbar-logo" />
        <span className="navbar-title">Tunebook</span>
      </div>
      <div className="navbar-links">
          <div
          className="navbar-buttons"
          onClick={() => handleSessionsClick()}
          style={{ cursor: 'pointer', opacity: actor ? 1 : 0.5 }}
          >
            Sessions
          </div>

        <div
          className="navbar-buttons"
          onClick={() => handleFriendsClick()}
          style={{ cursor: 'pointer', opacity: actor ? 1 : 0.5 }}
        >
          Friends
        </div>
        <button className="login-button" onClick={toggleSidebar}>Login</button>
      </div>
    </nav>

        {/* Sidebar Panel for Login */}
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <h2>Connect To Get Started</h2>
          <p>Sign in to access your profile and interact with the platform.</p>

          {/* Use the LoginOptions component for logins */}
          {<LoginOptions onLoginICP={loginICP} onLoginNFID={loginNFID} />}

        </div>

        {/* Close Sidebar Button */}
        <button className="close-sidebar" onClick={toggleSidebar}>✖ Close</button>
      </div>

      {/* Main Content (SWITCHES BASED ON activeSession STATE) */}
      <div className="main-content">
      <Routes>
          {/* Default Route to Tunes */}
          <Route path="/" element={actor ? <Tunes actor={actor} /> : <p>Please log in to view tunes.</p>} />

          <Route 
            path="/profile" 
            element={actor ? <Profile actor={actor} currentPrincipal={currentAccount} /> : <p> Profile not available.</p>}  
          />

          {/* Sessions Route (Only activated if isSessionsActive is true) */}
          <Route 
            path="/sessions" 
            element={actor && activeSession ? <Sessions actor={actor} /> : <p>Sessions not available until activated by clicking the button.</p>} 
          />

           {/* Sessions Route (Only activated if isSessionsActive is true) */}
           <Route 
            path="/friends" 
            element={actor && activeFriends ? <Friends actor={actor} currentPrincipal={currentAccount} /> : <p>Friends not available until activated by clicking the button.</p>} 
          />

        </Routes>
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