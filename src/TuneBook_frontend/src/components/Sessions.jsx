import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import the images for the marker icon and shadow
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';


function Sessions({ actor, currentPrincipal }) {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]); // New state for filtered sessions
  const [searchTerm, setSearchTerm] = useState(''); // For filtering sessions
  const [pageNum, setPageNum] = useState(0); // Pagination control
  const [totalSessions, setTotalSessions] = useState(1);
  const [name, setName] = useState(''); // For adding session
  const [location, setLocation] = useState(''); // For adding session
  const [daytime, setDaytime] = useState(''); // For adding session
  const [contact, setContact] = useState(''); // For adding session
  const [comment, setComment] = useState(''); // For adding session
  const [successMessage, setSuccessMessage] = useState(''); // Add session success
  const [errorMessage, setErrorMessage] = useState(''); // Add session error
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef(null); // Reference to the modal content
  const [usernames, setUsernames] = useState({});

  const mapRef = useRef(null); // Reference to the map container div
  const mapInstanceRef = useRef(null); 


    // Initialize Leaflet map (only if it's not already initialized)
  useEffect(() => {
    if (!mapInstanceRef.current) {
      // Create the Leaflet map instance and store it in the ref
      const mapInstance = L.map(mapRef.current).setView([20, 0], 2); // Default to world view
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance);
      mapInstanceRef.current = mapInstance;
    }

    // Cleanup the map instance when component unmounts
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch sessions from backend
  const fetchSessions = async () => {
    try {
      const result = await actor.get_sessions("", 0); // Assuming empty search term and page 0
      console.log("Sessions Data:", result[0]); // Log session data to inspect
      setSessions(result[0]); // Set session data
      setFilteredSessions(result[0]); // Set filtered sessions to display

      // Fetch usernames for each principal
      result[0].forEach(async (session) => {
        if (!usernames[session.principal]) {
          console.log(`Fetching profile for principal: ${session.principal}`);
          try {
            const profile = await actor.authentication(session.principal); // Fetch profile using the principal
            console.log(`Fetched Profile:`, profile);

            if (profile && profile.username) {
              setUsernames((prevUsernames) => ({
                ...prevUsernames,
                [session.principal]: profile.username, // Store username by principal
              }));
            } else {
              console.warn(`No profile found for principal: ${session.principal}`);
              setUsernames((prevUsernames) => ({
                ...prevUsernames,
                [session.principal]: 'Unknown', // If no profile, fallback to 'Unknown'
              }));
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            setUsernames((prevUsernames) => ({
              ...prevUsernames,
              [session.principal]: 'Unknown', // Handle errors with fallback
            }));
          }
        }
      });
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  // Fetch sessions when the component mounts or pageNum/actor changes
  useEffect(() => {
    fetchSessions();
  }, [pageNum, actor]);

  // Filter sessions based on the search term
  useEffect(() => {
    if (searchTerm === '') {
      // If searchTerm is empty, show all sessions
      setFilteredSessions(sessions);
    } else {
      const filtered = sessions.filter((session) =>
        session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSessions(filtered);
    }
  }, [searchTerm, sessions]);

  const handleAddSession = async (event) => {
    event.preventDefault();

    if (!/^\S+@\S+\.\S+$/.test(contact)) {
      console.log("Invalid email address");
      return;
    }
    try {
      if (!currentPrincipal) {
        console.error('You must be logged in to add a session.');
        setErrorMessage('You must be logged in to add a session.');
        return;
      }

      const principal = currentPrincipal;

      // Log the current principal for debugging
      console.log('Adding session for principal:', principal);

      // Fetch the user's profile
      const profile = await actor.authentication(principal);
      console.log('Fetched Profile:', profile); // Debug log to inspect structure

      // Check profile structure
      const username = Array.isArray(profile) && profile.length > 0 ? profile[0].username : profile.username;

      if (!username) {
        console.error('You need to have a profile to add a session.');
        setErrorMessage('You need to have a profile to add a session.');
        return;
      }

      console.log('Adding session with username:', username);
      console.log("Contact passed to backend: ", contact);

      const success = await actor.add_session(principal, username, name, location, daytime, contact, comment);

      if (success) {
        setSuccessMessage('Session added successfully!');
        setErrorMessage('');
        // Reset form fields
        setName('');
        setLocation('');
        setDaytime('');
        setContact('');
        setComment('');
        fetchSessions(); // Refresh sessions list
        setShowModal(false); // Close modal after successful add
      } else {
        setErrorMessage('Failed to add session.');
      }
    } catch (error) {
      console.error('Error adding session:', error);
      setErrorMessage('Error adding session. Please try again.');
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

        {/* Map container */}
      <div id="map" ref={mapRef} ></div>

      {/* Sessions List */}
      <div className="sessions-list">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <div key={session.id} className="session-card">
              <h3>{session.name}</h3>
              <p>Location: {session.location}</p>
              <p>Day and Time: {session.daytime}</p>
              <p>Added by: {session.username || 'Unknown'}</p>
              <p>Contact: {session.contact}</p>
              <p>Comments: {session.comment}</p>
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
          Page {pageNum + 1} of {Math.ceil(totalSessions / 9)}
        </span>
        <button disabled={filteredSessions.length < 9} onClick={() => setPageNum(pageNum + 1)}>
          Next
        </button>
      </div>

     {/* Add Session Button */}
    <button
    className="add-session-button"
    onClick={() => {
        if (!currentPrincipal) {
        alert('You must be signed in to add a session.');
        } else {
        setShowModal(true); // Only show the modal if the user is signed in
        }
    }}
    >
    Add Session
    </button>


      {/* Modal for Adding Session */}
      {showModal && (
        <div className="modal">
          <div className="modal-content" ref={modalRef}>
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
