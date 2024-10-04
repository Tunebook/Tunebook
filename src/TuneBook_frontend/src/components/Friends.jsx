import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom'; 

function Friends({ actor, currentPrincipal }) {
  const [friends, setFriends] = useState([]); // List of friends
  const [selectedFriend, setSelectedFriend] = useState(null); // Currently selected friend
  const [searchTerm, setSearchTerm] = useState(''); // Search filter for browsing people
  const [myProfile, setMyProfile] = useState(null); // Your own profile info
  const [showMyProfile, setShowMyProfile] = useState(true); // Toggle between showing my profile or friend's profile
  const [usernames, setUsernames] = useState({}); // Cache for usernames
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const navigate = useNavigate();
  const [potentialFriends, setPotentialFriends] = useState([]);


  // Fetch the logged-in user's profile
  const fetchMyProfile = async () => {
    try {
        const profileArray = await actor.authentication(currentPrincipal);
        
        // Check if the array contains at least one profile object
        if (profileArray.length > 0) {
          const profile = profileArray[0]; // Access the first item in the array
          console.log("Fetched Profile:", profile);  // Log profile to inspect
          
          // Set the profile only if username is available
          if (profile.username) {
            setMyProfile(profile);  // Store profile in state
          } else {
            console.log('No username found in profile');
          }
        } else {
          console.log('No profile found in the array.');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
      
      
  };
  

    // Fetch current friends
    const fetchFriends = async () => {
        try {
          const result = await actor.get_friends(currentPrincipal);
          console.log("Friends Data:", result);
          setFriends(result); // Populate the friends state
        } catch (error) {
          console.error('Failed to fetch friends:', error);
        }
    };


  // Fetch friend's profile by principal
  const fetchFriendProfile = async (principal) => {
    if (!usernames[principal]) {
      console.log(`Fetching profile for principal: ${principal}`);
      try {
        const profile = await actor.authentication(principal);
        console.log(`Fetched Profile:`, profile);

        if (profile && profile.username) {
          setUsernames((prevUsernames) => ({
            ...prevUsernames,
            [principal]: profile.username, // Store username by principal
          }));
        } else {
          console.warn(`No profile found for principal: ${principal}`);
          setUsernames((prevUsernames) => ({
            ...prevUsernames,
            [principal]: 'Unknown', // Fallback if no profile found
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setUsernames((prevUsernames) => ({
          ...prevUsernames,
          [principal]: 'Unknown', // Handle errors with fallback
        }));
      }
    }
  };

  // Fetch potential friends (users who aren't current friends)
  const fetchPotentialFriends = async () => {
    try {
      const result = await actor.browse_people(currentPrincipal, searchTerm, 0); // Fetch users based on the search term
      setPotentialFriends(result[0]); // Assuming the result returns [users, count]
    } catch (error) {
      console.error('Failed to fetch potential friends:', error);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchMyProfile();
  }, [actor, currentPrincipal]);

    // Use effect to fetch potential friends when the search term changes
    useEffect(() => {
        if (searchTerm.trim()) {
          fetchPotentialFriends(); // Fetch potential friends based on search term
        }
      }, [searchTerm]);

  // Display selected friend's profile
  const displayFriendProfile = async (friend) => {
    try {
      await fetchFriendProfile(friend.principal); // Fetch friend's profile by principal
      setSelectedFriend(friend);
      setShowMyProfile(false); // Switch to friend's profile
    } catch (error) {
      console.error('Failed to fetch friend profile:', error);
    }
  };

  // Handle "My Profile" button click
  const handleMyProfileClick = () => {
    setSelectedFriend(null); // Clear any selected friend
    setShowMyProfile(true); // Show my profile in the main content
  };

  const handleEditProfileClick = () => {
    setIsEditProfileOpen(!isEditProfileOpen);  // Toggle the form visibility
    navigate('/profile'); 
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
      {/* Left Sidebar: Friends List */}
      <div className="friends-list">
        
      <button
        className="my-profile-button"
        onClick={handleMyProfileClick}
        style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%', // Ensures it takes full width if needed
            padding: '10px', // Add padding for better visual spacing
            textAlign: 'center', // Center the text horizontally
        }}
        >
        My Profile
        </button>

        {/* Edit Profile Button */}
        <button
        className="edit-profile-button"
        onClick={() => {
            if (!currentPrincipal) {
                alert('You must be signed in to edit your profile.');
            } else {
                handleEditProfileClick();  // Navigate to the profile edit page
            }
        }}
        >
        Edit Profile
        </button>


        {/* Search Input */}
        <div className="profile-section">
          <h2>Search for Friends</h2>
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
                onClick={() => displayFriendProfile(friend)}
              >
                <img
                  src={`data:image/png;base64,${friend.avatar}`}
                  alt="Avatar"
                  className="friend-avatar"
                />
                <h3>{usernames[friend.principal] || friend.username}</h3>
              </div>
            ))
        ) : (
          <p>You have no friends yet.</p>
        )}

        {/* Display potential friends (users not in the current friends list) */}
        {potentialFriends.length > 0 && (
          <>
            <h3>Potential Friends</h3>
            {potentialFriends.map((potentialFriend) => (
              <div
                key={potentialFriend.principal}
                className="friend-item"
                onClick={() => displayFriendProfile(potentialFriend)}
              >
                <img
                  src={`data:image/png;base64,${convertUint8ArrayToBase64(potentialFriend.avatar)}`}
                  alt="Avatar"
                  className="friend-avatar"
                  style={{ width: '30px', height: '30px', borderRadius: '15px' }}
                />
                <h3>{potentialFriend.username}</h3>
                <button
                  onClick={() => actor.send_friend_request(currentPrincipal, potentialFriend.principal)}

                  style={{
                    display: 'flex',
                    padding: '10px',
                }}
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
              style={{ width: '100px', height: '100px', borderRadius: '15px' }}
            />
            <p>Username: {myProfile.username}</p>
            <p>Location: {myProfile.pob || 'Unknown'}</p>
            <p>Instruments: {myProfile.instruments || 'None listed'}</p>
            <h3>My Tunes:</h3>
            <ul>
              <li>My Tune 1</li>
              <li>My Tune 2</li>
            </ul>
          </div>
        ) : selectedFriend ? (
          <div className="profile-view">
            <h2>{selectedFriend.username}'s Profile</h2>
            <img
              src={`data:image/png;base64,${selectedFriend.avatar}`}
              alt={`${selectedFriend.username}'s Avatar`}
              className="profile-avatar"
              style={{ width: '100px', height: '100px' }}
            />
            <p>Location: {selectedFriend.pob || 'Unknown'}</p>
            <p>Instruments: {selectedFriend.instruments || 'None listed'}</p>
            <h3>Their Tunes:</h3>
            <ul>
              <li>Tune 1</li>
              <li>Tune 2</li>
              <li>Tune 3</li>
            </ul>
          </div>
        ) : (
          <div className="no-friend-selected">
            <h2>No profile found, log in for a profile.</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default Friends;
