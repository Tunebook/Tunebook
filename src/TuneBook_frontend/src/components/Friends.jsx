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
  const [showMyProfile, setShowMyProfile] = useState(true);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [friendTunes, setFriendTunes] = useState([]); // Friend's tunes
  const [selectedFriendProfile, setSelectedFriendProfile] = useState(null);



  const [myTunes, setMyTunes] = useState([]); // State to store user's tunes
  const [totalTunes, setTotalTunes] = useState(0); // Total number of tunes
  const [pageNumber, setPageNumber] = useState(0); // Pagination control
  const TUNES_PER_PAGE = 5; // Number of tunes per page

  const [currentTuneData, setCurrentTuneData] = useState(''); // Data of the currently selected tune
  const [currentTuneTitle, setCurrentTuneTitle] = useState(''); // Title of the currently selected tune
  //const [visualObj, setVisualObj] = useState(null); // Store ABCJS visual object
  const synth = new ABCJS.synth.CreateSynth();  // Create ABCJS Synth
  const synthControl = new ABCJS.synth.SynthController();



// -------------------------------------------------------------- 
// -------------------------------------------------------------- 
// Fetch the user's profile and tunes, including friend requests
// -------------------------------------------------------------- 
// -------------------------------------------------------------- 
const fetchMyProfileAndTunes = async (page = 0) => {
  try {
    const profileArray = await actor.authentication(currentPrincipal);
    if (profileArray.length > 0) {
      const profile = profileArray[0];
      setMyProfile(profile);

      // Set incoming and outgoing friend requests from the profile
      setReceivedRequests(profile.incoming_fr);
      setSentRequests(profile.outcoming_fr);

      const [tuneList, totalCount] = await actor.get_user_tune_list(currentPrincipal, page);
      setMyTunes(tuneList);
      setTotalTunes(totalCount);
    }
  } catch (error) {
    console.error('Failed to fetch profile or tunes:', error);
  }
};






// -------------------------------------------------------------- 
// -------------------------------------------------------------- 
  // Handle Pagination (next/previous page)
  // -------------------------------------------------------------- 
  // -------------------------------------------------------------- 
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









  // -------------------------------------------------------------- 
  // -------------------------------------------------------------- 
  // Fetch current friends
  // -------------------------------------------------------------- 
  // -------------------------------------------------------------- 
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


  // Function to send a friend request
const sendFriendRequest = async (receiverPrincipal) => {
  try {
    if (!currentPrincipal) {
      console.error("User is not logged in.");
      return;
    }

    // Call backend function to send a friend request
    const result = await actor.send_friend_request(currentPrincipal, receiverPrincipal);

    if (result) {
      console.log("Friend request sent successfully!");
      setSentRequests([...sentRequests, result]); // Update the sent requests list
    } else {
      console.log("Friend request failed or already exists.");
    }
  } catch (error) {
    console.error("Failed to send friend request:", error);
  }
};


// Fetch friend's profile by principal
const fetchFriendProfile = async (principal) => {
  console.log(`Fetching profile for principal: ${principal}`);
  try {
    const profileArray = await actor.authentication(principal);
    const profile = profileArray[0];  // Assuming profileArray returns an array with profile as the first element
    
    if (profile && profile.username) {
      // Store the friend's full profile (username, pob, instruments, and avatar)
      setSelectedFriendProfile({
        username: profile.username,
        pob: profile.pob || 'Unknown',       // Fetching pob
        instruments: profile.instruments || 'None listed',  // Fetching instruments
        avatar: profile.avatar,              // Avatar
      });
    } else {
      console.warn(`No profile found for principal: ${principal}`);
      setSelectedFriendProfile({
        username: 'Unknown',
        pob: 'Unknown',
        instruments: 'None listed',
        avatar: '',  // Empty avatar if no profile found
      });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    setSelectedFriendProfile({
      username: 'Unknown',
      pob: 'Unknown',
      instruments: 'None listed',
      avatar: '',  // Handle errors with empty profile details
    });
  }
};




   // Function to accept a friend request
   const acceptFriendRequest = async (senderPrincipal) => {
    try {
      const success = await actor.accept_friend_request(currentPrincipal, senderPrincipal);
      if (success) {
        // Update the UI by removing the accepted request
        setReceivedRequests(receivedRequests.filter((req) => req.principal !== senderPrincipal));
        // Optionally update friends list by re-fetching friends or adding the new friend
        fetchFriends();
      } else {
        console.log("Failed to accept friend request.");
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  // Function to cancel/reject a friend request
  const cancelFriendRequest = async (receiverPrincipal) => {
    try {
      const success = await actor.cancel_friend_request(currentPrincipal, receiverPrincipal);
      if (success) {
        // Update the UI by removing the canceled request
        setSentRequests(sentRequests.filter((req) => req.principal !== receiverPrincipal));
        setReceivedRequests(receivedRequests.filter((req) => req.principal !== receiverPrincipal));
      } else {
        console.log("Failed to cancel friend request.");
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error);
    }
  };


// Display selected friend's profile and their tunes
const displayFriendProfile = async (friend) => {
  try {
        // Clear current tune data to remove the player when switching profiles
        setCurrentTuneData(null); 
        setCurrentTuneTitle(null);

    await fetchFriendProfile(friend.principal); // Fetch friend's profile
    await fetchFriendTunes(friend.principal);   // Fetch friend's tunes
    //setSelectedFriend(friend);                 // Set the selected friend state
    setShowMyProfile(false);                   // Hide my profile view
    setShowFriendRequests(false);              // Hide friend requests view
  } catch (error) {
    console.error('Failed to fetch friend profile and tunes:', error);
  }
};






// -------------------------------------------------------------- 
// -------------------------------------------------------------- 
// Handle "My Profile" button click
// -------------------------------------------------------------- 
// -------------------------------------------------------------- 


const handleMyProfileClick = () => {
      // Clear current tune data to remove the player when switching profiles
      setCurrentTuneData(null); 
      setCurrentTuneTitle(null);

  setSelectedFriendProfile(null);
  setSelectedFriend(null); // Clear any selected friend
  setShowMyProfile(true); // Show my profile in the main content
  setShowFriendRequests(false);  
};

// Function to handle friend requests button click
const handleFriendRequestsClick = () => {
  setSelectedFriendProfile(null);
  setShowFriendRequests(true);  // Show friend requests
  setShowMyProfile(false);      // Hide my profile
  setSelectedFriend(null);      // Clear any selected friend
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





    // Helper function to convert Uint8Array to Base64 string
    const convertUint8ArrayToBase64 = (uint8Array) => {
      let binary = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      return window.btoa(binary); // Converts binary to Base64 string
    };









  // -------------------------------------------------------------- 
  // -------------------------------------------------------------- 
  // Function to initialize ABCJS player with selected tune
  // -------------------------------------------------------------- 
  // -------------------------------------------------------------- 
  const iniABCJS = async (tuneData) => {
    if (!tuneData) return;
  
    // Add a small delay to ensure DOM is ready
    setTimeout(async () => {
      const visualObj = ABCJS.renderAbc("tunedata", tuneData, { responsive: "resize" });
  
      if (!visualObj || visualObj.length === 0) {
        console.error("Failed to create visualObj from ABC notation.");
        return;
      }
  
      try {

        const synth = new ABCJS.synth.CreateSynth();
        const synthControl = new ABCJS.synth.SynthController();
  
        await synth.init({
          visualObj: visualObj[0],
          options: {
            soundFontUrl: "/soundfonts/",  // Ensure correct URL
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
    }, 100); // Delay of 100ms
  };
  
  
  


  const fetchFriendTunes = async (principal) => {
    try {

      const [tunes] = await actor.get_user_tune_list(principal, 0); // Assuming it returns an array
      console.log('Fetched Friend Tunes:', tunes); // Debugging log to check the response
      setFriendTunes(tunes); // Update state with friend's tunes
    } catch (error) {
      console.error('Error fetching friend tunes:', error);
      setFriendTunes([]); // Clear tunes if there's an error
    }
  };
  
  

  // Handle selecting a tune from the user's saved tunes
  const onSelectTune = (tune) => {
    setCurrentTuneData(tune.tune_data);  // Set the selected tune data
    setCurrentTuneTitle(tune.title);  // Set the title
    if(tune.tune_data) {
      iniABCJS(tune.tune_data);  // Initialize ABCJS player
    }
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












  // -------------------------------------------------------------- 
  // -------------------------------------------------------------- 
  // ---------------------------View------------------------------- 
  // -------------------------------------------------------------- 
  // -------------------------------------------------------------- 
  return (
    <div className="friends-page">
      {/* Sidebar: Profile Options and Search */}
      <div className="friends-list">
        <button className="my-profile-button" onClick={() => handleMyProfileClick()}>
          My Profile
        </button>
        <button className="edit-profile-button" onClick={() => navigate('/profile')}>
          Edit Profile
        </button>
        <button className="requests-button" onClick={handleFriendRequestsClick}>
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
              onClick={() => displayFriendProfile(friend)} // Call the function to display the friend's profile
            >
              <img
                src={`data:image/png;base64,${convertUint8ArrayToBase64(friend.avatar)}`}
                alt="Avatar"
                className="friend-avatar"
              />
              <h3>{usernames[friend.principal] || friend.username}</h3> {/* Display username from cache or directly */}
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
              onClick={() => displayFriendProfile(potentialFriend)} // Display potential friend's profile
            >
              <img
                src={`data:image/png;base64,${convertUint8ArrayToBase64(potentialFriend.avatar)}`}
                alt="Avatar"
                className="friend-avatar"
                style={{ width: '30px', height: '30px', borderRadius: '15px' }}
              />
              <h3>{potentialFriend.username}</h3> {/* Display potential friend's username */}
              <button
                className="add-friend-button"
                onClick={() => sendFriendRequest(potentialFriend.principal)} // Add friend button
              >
                Add Friend
              </button>
            </div>
          ))}
        </>
      )}
      </div>

      {/* Main Content: Profile and Tunes */}
      <div className="main-profile-content">
      {showMyProfile && myProfile ? (
    
        <div className="profile-view">
          <h2>My Profile</h2>
          <img
            src={`data:image/png;base64,${convertUint8ArrayToBase64(myProfile.avatar)}`}
            alt="My Avatar"
            className="profile-avatar"
            style={{ width: '100px', height: '100px' }}
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


        </div>


      ) : selectedFriendProfile ? (
    
        <div className="profile-view">
          <h2>{selectedFriendProfile.username}'s Profile</h2>
          <img
            src={`data:image/png;base64,${convertUint8ArrayToBase64(selectedFriendProfile.avatar)}`}
            alt={`${selectedFriendProfile.username}'s Avatar`}
            className="profile-avatar"
            style={{ width: '100px', height: '100px' }}
          />
          <p>Location: {selectedFriendProfile.pob}</p>  {/* Display pob */}
          <p>Instruments: {selectedFriendProfile.instruments}</p>  {/* Display instruments */}

          {/* Friend's tunes */}
          <h3>{selectedFriendProfile.username}'s Tunes:</h3>
          {friendTunes.length > 0 ? (
            <ul>
              {friendTunes.map((tune, index) => (
                <li key={index} onClick={() => onSelectTune(tune)}> {/* Play tune on click */}
                  <strong>{tune.title}</strong> {/* Display tune title */}
                </li>
              ))}
            </ul>
          ) : (
            <p>{selectedFriendProfile.username} has no tunes.</p>
          )}

          {/* Tune Details & Player */}
          {currentTuneData && (
            <div className="tune-detail-view">
              <h2 className="tune-title">{currentTuneTitle}</h2>
              <div id="tunedata" className="abc-notation"></div>
              <div id="player" className="abc-player"></div>
            </div>
          )}
        </div>


    
      ) :  showFriendRequests ? (
          <div className="friend-requests-view">
            <h2>Friend Requests</h2>
            <h3>Received Requests:</h3>
            {receivedRequests.length > 0 ? (
              receivedRequests.map((request, index) => (
                <div key={index} className="friend-request-item">
                  <img src={`data:image/png;base64,${convertUint8ArrayToBase64(request.avatar)}`} alt={`${request.username}'s Avatar`} className="request-avatar" style={{ width: '50px', height: '50px', borderRadius: '15px' }} />
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
                  <img src={`data:image/png;base64,${convertUint8ArrayToBase64(request.avatar)}`} alt={`${request.username}'s Avatar`} className="request-avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }} />
                  <p>{request.username}</p>
                  <button onClick={() => cancelFriendRequest(request.principal)}>Cancel Request</button>
                </div>
              ))


            ) : (
              <p>No sent friend requests.</p>
            )}
          </div>
        ) : (
          // Default view when no friend is selected
          <div className="no-friend-selected">
            <h2>Select a friend to view their profile and tunes.</h2>
          </div>
        )}
      </div>
      
    </div>
  );
}

export default Friends;