import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../declarations/TuneBook_backend/TuneBook_backend.did.js';

// Define the canister ID
const canisterId = process.env.CANISTER_ID_TUNEBOOK || "bkyz2-fmaaa-aaaaa-qaaaq-cai";  // Update as necessary


// Centralized createActor function
export const createActor = (identity = null) => {
    const agent = new HttpAgent({ identity, host: 'http://127.0.0.1:4943' });

    // Fetch the root key for certificate validation in local development
    if (process.env.NODE_ENV === 'development') {
      agent.fetchRootKey().catch((err) => {
        console.warn('Unable to fetch root key. Local replica might not be running.');
        console.error(err);
      });
    }
  
    return Actor.createActor(idlFactory, { agent, canisterId });
};
