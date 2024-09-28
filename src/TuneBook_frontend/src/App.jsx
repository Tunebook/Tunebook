import React, { useState, useEffect } from 'react';
import { HttpAgent, Actor } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';  // Import AuthClient
import { idlFactory } from '../../declarations/TuneBook_backend/TuneBook_backend.did.js';  // Correct path
import LoginOptions from './components/LoginOptions';  // Import the LoginOptions component
import Tunes from './components/Tunes';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom'; 
import Sessions from './components/Sessions';
import { Principal } from '@dfinity/candid/lib/cjs/idl.js';
import Friends from './components/Friends'
import myProfile from './components/myProfile';

const canisterId = "bkyz2-fmaaa-aaaaa-qaaaq-cai"; // Local canister ID

// Initialize the actor once
const initActor = (identity) => {
  const agent = new HttpAgent({ host: 'http://127.0.0.1:4943' }); // Local dev with identity
  agent.fetchRootKey();  // Necessary for local replica trust

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,  // Use the backend canister ID
  });
};

function App() {
  // State for login and tunes
  const [currentAccount, setCurrentAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // State for sidebar visibility
  const [actor, setActor] = useState(null);  // Hold Actor instance
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(false);
  const [activeFriends, setActiveFriends] = useState(false);

  // Initialize AuthClient
  useEffect(() => {
    const initAuthClient = async () => {
      const auth = await AuthClient.create();
      setAuthClient(auth);
    };
    initAuthClient();
  }, []);


useEffect(() => {
  const actorInstance = initActor();  // Initialize the backend actor
  setActor(actorInstance);  // Set the actor state to use in the child component
}, []);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Authenticate user and fetch profile
  const handleLogin = async (identity) => {
    try {
      const actorInstance = initActor(identity);  // Initialize actor with the user's identity
      setActor(actorInstance);  // Set actor in state
      
      const principal = identity.getPrincipal().toString();  // User's principal
      setCurrentAccount(principal);

      // Fetch user profile using the backend authentication function
      const userProfile = await actorInstance.authentication(principal);
      if (userProfile) {
        setProfile(userProfile);
        console.log('Profile fetched:', userProfile);
      } else {
        console.error('User profile not found.');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };
 

  useEffect(() => {
    handleLogin();  // Check if user is signed in on component mount
  }, []);

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
          
          <Route path="/myProfile" element={<myProfile actor={actor} currentPrincipal={currentAccount} />} />

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