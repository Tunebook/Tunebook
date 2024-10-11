import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReactPaginate from "react-paginate";
import Select from 'react-select';

// Import the images for the marker icon and shadow
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

function Sessions({ actor, currentPrincipal }) {
 const [sessions, setSessions] = useState([]);
 const [searchTerm, setSearchTerm] = useState(''); // For filtering sessions
 const [pageNum, setPageNum] = useState(0); // Pagination control
 const [totalSessions, setTotalSessions] = useState(1);
 const [name, setName] = useState(''); // For adding session
 const [location, setLocation] = useState(''); // For adding session
 const [daytime, setDaytime] = useState(''); // For adding session
 const [contact, setContact] = useState(''); // For adding session
 const [comment, setComment] = useState(''); // For adding session
 const [recurring, setRecurring] = useState('N/A');
 const [showModal, setShowModal] = useState(false);
 const [usernames, setUsernames] = useState({});
 const [errorMessage, setErrorMessage] = useState(''); // Add session error
 const [successMessage, setSuccessMessage] = useState(''); // Add session success

 const modalRef = useRef(null); // Reference to the modal content
 const [map, setMap] = useState(null); // Store Leaflet map instance
 const mapRef = useRef(null); // Reference to the map container div
 const mapInstanceRef = useRef(null); // Reference to the Leaflet map instance
 const [filteredSessions, setFilteredSessions] = useState([]);

 const SESSIONS_PER_PAGE = 9; // Sessions to display per page
 const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);
 const [nominatimRequestCount, setNominatimRequestCount] = useState(0);
 const totalPages = Math.ceil(totalSessions / SESSIONS_PER_PAGE); 

 const recurringOptions = [ 

    { value: 'N/A', label: 'N/A' }, 
    { value: 'Weekly', label: 'Weekly' }, 
    { value: 'Biweekly', label: 'Biweekly' }, 
    { value: 'Monthly', label: 'Monthly' }
  ]


// -------------------------------------------------------- //
// -------------------------------------------------------- //
// -------------------------------------------------------- //
// --------------------- Fetch SESSION -------------------- //
// -------------------------------------------------------- //
// -------------------------------------------------------- //


 // Fetch sessions from backend
 const fetchSessions = async () => {
    try {
      const result = await actor.get_sessions("", 0); // Assuming empty search term and page 0
      console.log("Sessions Data:", result[0]); // Log session data to inspect
      setSessions(result[0]); // Set session data
      setTotalSessions(result[1]); // Set total session count
 
 
      // Fetch usernames for each principal
      result[0].forEach(async (session) => {
        if (!usernames[session.principal]) {
          console.log(`Fetching profile for principal: ${session.principal}`);
          try {
            const profile = await actor.authentication(session.principal); // Fetch profile using the principal
            console.log(`Fetched Profile:`, profile);
 
 
            if (profile && profile.username) {
              setUsernames(prevUsernames => ({
                ...prevUsernames,
                [session.principal]: profile.username // Store username by principal
              }));
            } else {
              console.warn(`No profile found for principal: ${session.principal}`);
              setUsernames(prevUsernames => ({
                ...prevUsernames,
                [session.principal]: 'Unknown' // If no profile, fallback to 'Unknown'
              }));
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            setUsernames(prevUsernames => ({
              ...prevUsernames,
              [session.principal]: 'Unknown' // Handle errors with fallback
            }));
          }
        }
      });
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };
 
 
  // Fetch sessions when the component mounts or search term/page changes
  useEffect(() => {
    fetchSessions();
  }, [searchTerm, pageNum, actor]);
 
 /*
  const handleSearchSubmit = (event) => {
     if (event.key === 'Enter') {
        fetchSessions(); 
       //setDebouncedTerm(searchTerm); // Trigger search when Enter is pressed
       event.preventDefault(); // Prevent form submission or page reload
     }
   };
 */

   // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPageNum(0); // Reset to the first page on new search
  };


// -------------------------------------------------------- //
// -------------------------------------------------------- //
// -------------------------------------------------------- //
// --------- ADD SESSION ---------------------------------- //
// -------------------------------------------------------- //
// -------------------------------------------------------- //

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

      //const success = await actor.add_session(principal, username, name, location, daytime, contact, comment);
      const success = await actor.add_session(principal, username, name, location, daytime, contact, comment, recurring);

      if (success) {
        setSuccessMessage('Session added successfully!');
        setErrorMessage('');
        // Reset form fields
        setName('');
        setLocation('');
        setDaytime('');
        setContact('');
        setComment('');
        setRecurring('');
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




// -------------------------------------------------------- //
// -------------------------------------------------------- //
// -------------------------------------------------------- //
// --------- MAP STUFF ------------------------------------ //
// -------------------------------------------------------- //
// -------------------------------------------------------- //


 // Set custom marker icon paths
 useEffect(() => {
   delete L.Icon.Default.prototype._getIconUrl;
  
   L.Icon.Default.mergeOptions({
     iconRetinaUrl: markerIconRetina,
     iconUrl: markerIcon,
     shadowUrl: markerShadow,
   });
 }, []);


// Geocoding API function to get lat/lng from a location name
const geocodeLocation = async (location, retries = 1) => {
    try {

    setNominatimRequestCount(prevCount => prevCount + 1);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
  
      if (!response.ok) {
        throw new Error(`Geocoding request failed with status ${response.status}`);
      }
  
      const data = await response.json();
  
      // If geocoding results are found
      if (data.length > 0) {
        const { lat, lon } = data[0];
        return { lat: parseFloat(lat), lng: parseFloat(lon) };
      }
  
      // Return null if no results are found
      return null;
  
    } catch (error) {
      console.error(`Error in geocoding request: ${error.message}`);
  
      // Retry logic: If retries are available, retry the request after a short delay
      if (retries > 0) {
        console.log(`Retrying geocoding for ${location}. Attempts left: ${retries - 1}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay before retrying (1000ms = 1 second)
        return geocodeLocation(location, retries - 1);
      }
  
      // Return null if all retries fail
      return null;
    }
  };

   // Initialize Leaflet map (only if it's not already initialized)
 useEffect(() => {
    if (!mapInstanceRef.current) {
      // Create the Leaflet map instance and store it in the ref
      const mapInstance = L.map(mapRef.current).setView([20, 0], 2); // Default to world view
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance);
      mapInstanceRef.current = mapInstance;
      setMap(mapInstance);
    }
 
 
    // Cleanup the map instance when component unmounts
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);


// Filter sessions and geocode missing locations
useEffect(() => {
    const filterAndGeocodeSessions = async () => {
      if (!debouncedTerm.trim()) return; // Only proceed if there's a valid search term
  
      // 1. Filter sessions by location or name matching the search term
      const matchedSessions = sessions.filter(session =>
        session.location.toLowerCase().includes(debouncedTerm.toLowerCase()) ||
        session.name.toLowerCase().includes(debouncedTerm.toLowerCase())
      );
  
      // 2. Store the filtered sessions (for later display, pagination, etc.)
      const paginatedSessions = matchedSessions.slice(
        pageNum * SESSIONS_PER_PAGE, 
        (pageNum + 1) * SESSIONS_PER_PAGE
      );
  
      setFilteredSessions(paginatedSessions);
  
      // 3. Geocode missing lat/lng for matched sessions
      const updatedSessions = await Promise.all(matchedSessions.map(async (session) => {
        if (!session.locationLat || !session.locationLng) {
          try {
            // Only geocode if lat/lng is missing and location matched search
            const coords = await geocodeLocation(session.location);
            if (coords) {
              session.locationLat = coords.lat;
              session.locationLng = coords.lng;
            }
            setNominatimRequestCount(prevCount => prevCount + 1); // Increment request count
          } catch (error) {
            console.error(`Error in geocoding request: ${error.message}`);
          }
        }
        return session;
      }));
  
 
 
      setFilteredSessions(updatedSessions.slice(pageNum * SESSIONS_PER_PAGE, (pageNum + 1) * SESSIONS_PER_PAGE));
 
 
      // Clear existing map markers
      if (mapInstanceRef.current) {
        mapInstanceRef.current.eachLayer(layer => {
          if (layer instanceof L.Marker) {
            mapInstanceRef.current.removeLayer(layer);
          }
        });
 
 
        // Add markers for the filtered sessions
        const markersBounds = [];
        updatedSessions.forEach(session => {
          if (session.locationLat && session.locationLng) {
            L.marker([session.locationLat, session.locationLng])
              .addTo(mapInstanceRef.current)
              .bindPopup(`<b>${session.name}</b><br/>${session.location}`);
            markersBounds.push([session.locationLat, session.locationLng]);
          }
        });
 
 
        // Adjust map view to fit all markers
        if (markersBounds.length > 0) {
          mapInstanceRef.current.fitBounds(markersBounds);
        } else {
          mapInstanceRef.current.setView([20, 0], 2); // Reset to default world view if no results
        }
      }
    };
 
    filterAndGeocodeSessions();
  }, [debouncedTerm, sessions, pageNum]);




// -------------------------------------------------------- //
// -------------------------------------------------------- //
// -------------------------------------------------------- //
// --------- MISCELLANEOUS -------------------------------- //
// -------------------------------------------------------- //
// -------------------------------------------------------- //

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



  // Debounce effect (updates debouncedTerm after 500ms of no typing)
 useEffect(() => {
   const timer = setTimeout(() => {
     setDebouncedTerm(searchTerm);
   }, 2000); //  delay


   return () => {
     clearTimeout(timer);
   };
 }, [searchTerm]);


 // Effect to trigger the search/filter based on debounced term
 useEffect(() => {
    if (debouncedTerm) {
      // Filter sessions based on debounced search term
      const filtered = sessions.filter(session =>
        session.location.toLowerCase().includes(debouncedTerm.toLowerCase())
      );
      setFilteredSessions(filtered.slice(pageNum * SESSIONS_PER_PAGE, (pageNum + 1) * SESSIONS_PER_PAGE));
    } else {
      // If no search term, show all sessions
      setFilteredSessions(sessions.slice(pageNum * SESSIONS_PER_PAGE, (pageNum + 1) * SESSIONS_PER_PAGE));
    }
  }, [debouncedTerm, sessions, pageNum]);
  


 // Handle Pagination Controls
 const handleNextPage = () => {
   if ((pageNum + 1) * SESSIONS_PER_PAGE < sessions.length) {
     setPageNum(pageNum + 1);
   }
 };


 const handlePrevPage = () => {
   if (pageNum > 0) {
     setPageNum(pageNum - 1);
   }
 };

// Handle page change from ReactPaginate
const handlePageChange = (selectedPage) => {
    setPageNum(selectedPage.selected);  // Update the page number based on the user's selection
  };

// -------------------------------------------------------- //
// -------------------------------------------------------- //
// -------------------------------------------------------- //
// --------- VIEW ----------------------------------------- //
// -------------------------------------------------------- //
// -------------------------------------------------------- //

 return (
   <div className="sessions-container">
     <h1>Sessions</h1>

       {/* Display the Nominatim request count */}
      {/* <p>Nominatim requests: {nominatimRequestCount}</p> */}

     {/* Search Input */}
     <input
       type="text"
       className="search-input"
       placeholder="Search sessions"
       value={searchTerm}
       onChange={handleSearchChange}
       //onKeyDown={handleSearchSubmit}
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
             <p>Added by: {session.username || "Unknown"}</p> 
             <p>Contact: {session.contact}</p>
             <p>Comments: {session.comment}</p>
             <p>Recurring: {session.recurring}</p> 
           </div>
         ))
       ) : (
         <p>No sessions found.</p>
       )}
     </div>

     {/* Pagination */}
     <div className="pagination-wrapper">
       <ReactPaginate
         previousLabel={"Previous"}
         nextLabel={"Next"}
         breakLabel={"..."}
         pageCount={totalPages}  // Total number of pages
         marginPagesDisplayed={2}
         pageRangeDisplayed={5}
         onPageChange={handlePageChange}
         containerClassName={"pagination"}   // Apply pagination styles
         pageClassName={"page-item"}         // Class for each page number
         activeClassName={"active"}          // Active page class
         previousClassName={"prev"}          // Class for "Previous" link
         nextClassName={"next"}              // Class for "Next" link
       />
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
             <div>
            <label>Recurring:</label>
            <select 
                value={recurring} 
                onChange={(e) => setRecurring(e.target.value)} 
                required
            >
                <option value="N/A">N/A</option>
                <option value="Weekly">Weekly</option>
                <option value="Biweekly">Biweekly</option>
                <option value="Monthly">Monthly</option>
            </select>
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

