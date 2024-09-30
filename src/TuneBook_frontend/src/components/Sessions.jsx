import React, { useState, useEffect, useRef } from 'react';
import { AuthClient } from '@dfinity/auth-client';

const canisterId = "6owwo-2yaaa-aaaam-qbelq-cai"; // Local canister ID

function Sessions({ actor }) {
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // For filtering sessions
  const [pageNum, setPageNum] = useState(0); // Pagination control
  const [totalSessions, setTotalSessions] = useState(0);
  const [name, setName] = useState(''); // For adding session
  const [location, setLocation] = useState(''); // For adding session
  const [daytime, setDaytime] = useState(''); // For adding session
  const [contact, setContact] = useState(''); // For adding session
  const [comment, setComment] = useState(''); // For adding session
  const [successMessage, setSuccessMessage] = useState(''); // Add session success
  const [errorMessage, setErrorMessage] = useState(''); // Add session error
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef(null); // Reference to the modal content

  // Function to fetch sessions
  const fetchSessions = async () => {
    try {
      const result = await actor.get_sessions(searchTerm, pageNum);
      setSessions(result[0]); // Sessions are in the first element of the tuple
      setTotalSessions(result[1]); // Total number of sessions in the second element
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  // Fetch sessions when the component mounts or search term/page changes
  useEffect(() => {
    fetchSessions();
  }, [searchTerm, pageNum, actor]);

  // Function to handle session submission (Add Session)
  const handleAddSession = async (event) => {
    event.preventDefault();

    try {
        const authClient = await AuthClient.create();
        const identity = await authClient.getIdentity();
        const principal = identity.getPrincipal().toString(); 

        // Fetch the profile to get the username
        const userProfile = await actor.authentication(principal);  // Fetch the profile using the principal
        const username = userProfile?.username || 'Anonymous';  // Default to 'Anonymous' if no profile found
        
      // Call the backend add_session method
      const success = await actor.add_session(principal, name, location, daytime, contact, comment);

      if (success) {
        setSuccessMessage('Session added successfully!');
        setErrorMessage('');
        setName('');
        setLocation('');
        setDaytime('');
        setContact('');
        setComment('');
        fetchSessions(); // Refresh the session list after adding
        setShowModal(false); // Close the modal after successful add
      } else {
        setSuccessMessage('');
        setErrorMessage('Failed to add session.');
      }
    } catch (error) {
      console.error('Error adding session:', error);
      setErrorMessage('Error adding session. Please try again.');
      setSuccessMessage('');
    }
  };

  // Close modal if user clicks outside the modal content
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setShowModal(false); // Close the modal if clicked outside
    }
  };

  // Add event listener to detect clicks outside the modal
  useEffect(() => {
    if (showModal) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showModal]);

  return (
    <div className="sessions-container">
      <h1>Sessions</h1>

      {/* Search Input */}
      <input
        type="text"
        className="search-input"
        placeholder="Search sessions"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Sessions List */}
      <div className="sessions-list">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div key={session.id} className="session-card">
              <h3>{session.name}</h3>
              <p>Location: {session.location}</p>
              <p>Day and Time: {session.daytime}</p>
              <p>Added by: {session.username}</p>
              <p>Contact: {session.contact}</p>
              <p>{session.comment}</p>
            </div>
          ))
        ) : (
          <p>No sessions found.</p>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="pagination-controls">
        <button disabled={pageNum === 0} onClick={() => setPageNum(pageNum - 1)}>
          Previous
        </button>
        <span>
          Page {pageNum + 1} of {Math.ceil(totalSessions / 15)}
        </span>
        <button disabled={sessions.length < 15} onClick={() => setPageNum(pageNum + 1)}>
          Next
        </button>
      </div>

      {/* Add Session Button */}
      <button className="add-session-button" onClick={() => setShowModal(true)}>
        Add Session
      </button>

      {/* Modal for Adding Session */}
      {showModal && (
        <div className="modal">
          <div className="modal-content" ref={modalRef}> {/* Assign ref to modal content */}
            <span className="close-modal" onClick={() => setShowModal(false)}>
              &times;
            </span>
            <h2>Add a New Session</h2>
            <form onSubmit={handleAddSession}>
              <div>
                <label>Session Name:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label>Location:</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>
              <div>
                <label>Day/Time:</label>
                <input type="datetime-local" value={daytime} onChange={(e) => setDaytime(e.target.value)} required />
              </div>
              <div>
                <label>Contact:</label>
                <input type="email" value={contact} onChange={(e) => setContact(e.target.value)} required />
              </div>
              <div>
                <label>Comment:</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
              </div>
              <button type="submit">Add Session</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sessions;
