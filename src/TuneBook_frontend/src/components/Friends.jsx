import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ABCJS from 'abcjs';  // Import ABCJS
import 'abcjs/abcjs-audio.css';

function Friends({ actor, currentPrincipal }) {
  const [friends, setFriends] = useState([]); // List of friends
  const [selectedFriend, setSelectedFriend] = useState(null); // Currently selected friend
  const [searchTerm, setSearchTerm] = useState(''); // Search filter for browsing people
  const [myProfile, setMyProfile] = useState(null); // Your own profile info
  const [usernames, setUsernames] = useState({}); // Cache for usernames
  const [potentialFriends, setPotentialFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('profile'); // Track active tab
  const [sentRequests, setSentRequests] = useState([]); // Sent friend requests
  const [receivedRequests, setReceivedRequests] = useState([]); // Received friend requests
  const navigate = useNavigate();

  const [myTunes, setMyTunes] = useState([]); // State to store user's tunes
  const [totalTunes, setTotalTunes] = useState(0); // Total number of tunes
  const [pageNumber, setPageNumber] = useState(0); // Pagination control
  const TUNES_PER_PAGE = 5; // Number of tunes per page

  const [currentTuneData, setCurrentTuneData] = useState(''); // Data of the currently selected tune
  const [currentTuneTitle, setCurrentTuneTitle] = useState(''); // Title of the currently selected tune
  const [visualObj, setVisualObj] = useState(null); // Store ABCJS visual object
  const synth = new ABCJS.synth.CreateSynth();  // Create ABCJS Synth
  const synthControl = new ABCJS.synth.SynthController();

  // Fetch the user's profile and tunes
  const fetchMyProfileAndTunes = async (page = 0) => {
    try {
      const profileArray = await actor.authentication(currentPrincipal);
      if (profileArray.length > 0) {
        const profile = profileArray[0];
        setMyProfile(profile);

        const [tuneList, totalCount] = await actor.get_user_tune_list(currentPrincipal, page);
        setMyTunes(tuneList);
        setTotalTunes(totalCount);
      }
    } catch (error) {
      console.error('Failed to fetch profile or tunes:', error);
    }
  };

  // Handle Pagination (next/previous page)
  const handleNextPage = () => {
    if ((pageNumber + 1) * TUNES_PER_PAGE < totalTunes) {
      setPageNumber(pageNumber + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pageNumber > 0) {
      setPageNumber(pageNumber - 1);
    }
  };

  // Fetch current friends
  const fetchFriends = async () => {
    try {
      const result = await actor.get_friends(currentPrincipal);
      setFriends(result);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  // Fetch potential friends based on search term
  const fetchPotentialFriends = async () => {
    try {
      const result = await actor.browse_people(currentPrincipal, searchTerm, 0);
      setPotentialFriends(result[0]);
    } catch (error) {
      console.error('Failed to fetch potential friends:', error);
    }
  };

  useEffect(() => {
    if (currentPrincipal) {
      fetchMyProfileAndTunes(pageNumber); // Fetch profile and tunes on mount
      fetchFriends(); // Fetch friends
    }
  }, [actor, currentPrincipal, pageNumber]);

  // Fetch potential friends when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      fetchPotentialFriends(); // Fetch potential friends
    }
  }, [searchTerm]);

  // Function to initialize ABCJS player with selected tune
  const iniABCJS = async (tuneData) => {
    if (!tuneData) return;
    const visualObj = ABCJS.renderAbc("tunedata", tuneData, { responsive: "resize" });
    
    if (!visualObj || visualObj.length === 0) {
      console.error("Failed to create visualObj from ABC notation.");
      return;
    }

    try {
      await synth.init({
        visualObj: visualObj[0],
        options: {
          soundFontUrl: "/soundfonts/",  // Local soundfont folder
        },
      });
      await synthControl.setTune(visualObj[0], false, {});
      synthControl.load("#player", null, {
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: true,
      });
    } catch (error) {
      console.error("Error initializing or playing the tune", error);
    }
  };

  // Handle selecting a tune from the user's saved tunes
  const onSelectTune = (tune) => {
    setCurrentTuneData(tune.tune_data);  // Set the selected tune data
    setCurrentTuneTitle(tune.title);  // Set the title
    iniABCJS(tune.tune_data);  // Initialize ABCJS player
  };

  // Render the user's saved tunes with ABCJS playback option
  const renderMyTunes = () => {
    if (myTunes.length === 0) {
      return <p>You have no tunes saved yet.</p>;
    }

    return (
      <ul>
        {myTunes.map((tune, index) => (
          <li key={index} onClick={() => onSelectTune(tune)}>
            <p><strong>{tune.title} </strong> </p>
            {/* Optional: Add a button or click handler to play the tune */}
          </li>
        ))}
      </ul>
    );
  };

    // Helper function to convert Uint8Array to Base64 string
const convertUint8ArrayToBase64 = (uint8Array) => {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return window.btoa(binary); // Converts binary to Base64 string
  };

  return (
    <div className="friends-page">
      {/* Sidebar: Profile Options and Search */}
      <div className="friends-list">
        <button className="my-profile-button" onClick={() => setActiveTab('profile')}>
          My Profile
        </button>
        <button className="edit-profile-button" onClick={() => navigate('/profile')}>
          Edit Profile
        </button>
        <button className="requests-button" onClick={() => setActiveTab('requests')}>
          Friend Requests
        </button>

        {/* Search Input */}
        <div className="profile-section">
          <h2>Browse users: </h2>
          <input
            type="text"
            placeholder="Search people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Display current friends based on search term */}
        {friends.length > 0 ? (
          friends
            .filter((friend) =>
              friend.username.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((friend) => (
              <div
                key={friend.principal}
                className="friend-item"
                onClick={() => setSelectedFriend(friend)}
              >
                <img
                  src={`data:image/png;base64,${convertUint8ArrayToBase64(friend.avatar)}`}
                  alt="Avatar"
                  className="friend-avatar"
                />
                <h3>{usernames[friend.principal] || friend.username}</h3>
              </div>
            ))
        ) : (
          <p>You have no friends yet.</p>
        )}

        {/* Display potential friends */}
        {potentialFriends.length > 0 && (
          <>
            <h3>Potential Friends</h3>
            {potentialFriends.map((potentialFriend) => (
              <div
                key={potentialFriend.principal}
                className="friend-item"
                onClick={() => setSelectedFriend(potentialFriend)}
              >
                <img
                  src={`data:image/png;base64,${convertUint8ArrayToBase64(potentialFriend.avatar)}`}
                  alt="Avatar"
                  className="friend-avatar"
                  style={{ width: '30px', height: '30px', borderRadius: '15px' }}
                />
                <h3>{potentialFriend.username}</h3>
                <button
                  className="add-friend-button"
                  onClick={() => sendFriendRequest(potentialFriend.principal)}
                >
                  Add Friend
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Main Content: Profile, Friend Requests, Selected Friend */}
      <div className="main-profile-content">
        {activeTab === 'profile' && myProfile && (
          <div className="profile-view">
            <h2>My Profile</h2>
            <img
              src={`data:image/png;base64,${convertUint8ArrayToBase64(myProfile.avatar)}`}
              alt="My Avatar"
              className="profile-avatar"
              style={{ width: '100px', height: '100px', borderRadius: '15px' }}
            />
            <p>Username: {myProfile.username}</p>
            <p>Location: {myProfile.pob || 'Unknown'}</p>
            <p>Instruments: {myProfile.instruments || 'None listed'}</p>

            {/* Render saved tunes */}
            <h3>My Tunes:</h3>
            {renderMyTunes()}

             {/* Tune Details & Player */}
            {currentTuneData && (
              <div className="tune-detail-view">
                <h2 className="tune-title">{currentTuneTitle}</h2>
                <div id="tunedata" className="abc-notation"></div>
                <div id="player" className="abc-player"></div>
              </div>
            )}

            {/* Pagination controls 
            <div className="pagination-controls">
              <button onClick={handlePreviousPage} disabled={pageNumber === 0}>
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={(pageNumber + 1) * TUNES_PER_PAGE >= totalTunes}
              >
                Next
              </button>
            </div> */}
          </div>
        )}

        {/* Other tabs */}
        {activeTab === 'requests' && (
          <div className="friend-requests-view">
            <h2>Friend Requests</h2>

            <h3>Received Requests:</h3>
            {receivedRequests.length > 0 ? (
              receivedRequests.map((request, index) => (
                <div key={index} className="friend-request-item">
                  <img
                    src={`data:image/png;base64,${convertUint8ArrayToBase64(request.avatar)}`}
                    alt={`${request.username}'s Avatar`}
                    className="request-avatar"
                    style={{ width: '50px', height: '50px', borderRadius: '15px' }}
                  />
                  <p>{request.username}</p>
                  <button onClick={() => acceptFriendRequest(request.principal)}>Accept</button>
                  <button onClick={() => cancelFriendRequest(request.principal)}>Reject</button>
                </div>
              ))
            ) : (
              <p>No received friend requests.</p>
            )}

            <h3>Sent Requests:</h3>
            {sentRequests.length > 0 ? (
              sentRequests.map((request, index) => (
                <div key={index} className="friend-request-item">
                  <img
                    src={`data:image/png;base64,${convertUint8ArrayToBase64(request.avatar)}`}
                    alt={`${request.username}'s Avatar`}
                    className="request-avatar"
                    style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }}
                  />
                  <p>{request.username}</p>
                  <button onClick={() => cancelFriendRequest(request.principal)}>Cancel Request</button>
                </div>
              ))
            ) : (
              <p>No sent friend requests.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Friends;