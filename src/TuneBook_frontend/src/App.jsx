import React, { useState, useEffect } from 'react';
import { HttpAgent, Actor } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';  // Import AuthClient
import { idlFactory } from '../../declarations/TuneBook_backend/TuneBook_backend.did.js';  // Correct path
import LoginOptions from './components/LoginOptions';  // Import the LoginOptions component
import Tunes from './components/Tunes';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'; 

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
  
/*
  // Initialize AuthClient
  useEffect(() => {
    const initAuthClient = async () => {
      const auth = await AuthClient.create();
      setAuthClient(auth);
    };
    initAuthClient();
  }, []);
*/

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

return (
  <div className="app-container">
    {/* Navigation Bar */}
    <nav className="navbar">
      <div className="navbar-brand">
        <img src="/music.png" alt="Logo" className="navbar-logo" />
        <span className="navbar-title">Tunebook</span>
      </div>
      <div className="navbar-links">
        <a href="#">Sessions</a>
        <a href="#">Connections</a>
        <button className="login-button" onClick={toggleSidebar}>Login</button>
      </div>
    </nav>


      {/* Main Content */}
      <div className="main-content">
        {/* Pass the actor to the Tunes component */}
        {actor ? <Tunes actor={actor} /> : <p>Please log in to view tunes.</p>}
      </div>

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
    </div>
  );
}

export default App;
