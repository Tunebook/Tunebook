import React, { useState } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { idlFactory } from '../../../declarations/TuneBook_backend/TuneBook_backend.did.js';
import { HttpAgent, Actor } from '@dfinity/agent';
import { useNavigate } from 'react-router-dom';

const canisterId = "6owwo-2yaaa-aaaam-qbelq-cai";

const initActor = (identity) => {
  const agentOptions = identity ? { identity } : {};
  const agent = new HttpAgent({ ...agentOptions, host: "https://ic0.app" });
  return Actor.createActor(idlFactory, { agent, canisterId });
};

function Login({ setAuthClient, setCurrentAccount, setActor, setIsLoggedIn }) {
  const [authClient, setLocalAuthClient] = useState(null);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  const initializeAuthClient = async () => {
    const auth = await AuthClient.create();
    setAuthClient(auth);  // Pass auth client to App state
    setLocalAuthClient(auth);  // Local state for direct use in Login component
  };

  useState(() => {
    initializeAuthClient();
  }, []);

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
        navigate('/friends'); 
      } else {
        console.log('No profile found. Redirecting to profile creation...');
        navigate('/profile');  // Navigate to profile creation page if no profile is found
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const loginICP = async () => {
    if (!authClient) return;
    await authClient.login({
      identityProvider: "https://identity.ic0.app",
      maxTimeToLive: 30 * 24 * 3_600_000_000_000,
      onSuccess: () => handleLogin(authClient.getIdentity()),
    });
  };

  const loginNFID = async () => {
    if (!authClient) return;
    await authClient.login({
      identityProvider: "https://nfid.one/authenticate",
      maxTimeToLive: 30 * 24 * 3_600_000_000_000,
      onSuccess: () => handleLogin(authClient.getIdentity()),
    });
  };

  return (
    <div className="login-container-wrapper">
    <div className="login-container">
      <h2>Login to Tunebook </h2>
      <h3>Select an option below to continue: </h3>


      <div className="login-options">
      {/* IC Identity Login Button */}
      <button className="login-button" onClick={loginICP}>
        <span>IC Identity</span>
        <img src="/images/icp-logo.png" alt="IC Identity Logo" className="login-icon" />
      </button>

      {/* NFID Login Button */}
      <button className="login-button" onClick={loginNFID}>
        <span>NFID</span>
        <img src="/images/nfid-logo.png" alt="NFID Logo" className="login-icon" />
      </button>
    </div>



    </div>
    </div>
  );
}

export default Login;
