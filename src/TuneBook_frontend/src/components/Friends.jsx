import React, { useState, useEffect } from 'react';

function Friends({ actor, currentPrincipal }) {
  const [friends, setFriends] = useState([]); // List of friends
  const [selectedFriend, setSelectedFriend] = useState(null); // Currently selected friend
  const [searchTerm, setSearchTerm] = useState(''); // Search filter for browsing people
  const [myProfile, setMyProfile] = useState(null); // Your own profile info
  const [showMyProfile, setShowMyProfile] = useState(true); // Toggle between showing my profile or friend's profile
  const [usernames, setUsernames] = useState({}); // Cache for usernames

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

  // Fetch the logged-in user's profile
  const fetchMyProfile = async () => {
    try {
      const profile = await actor.authentication(currentPrincipal);
      if (profile) {
        setMyProfile(profile);
      } else {
        console.log('No profile found, redirecting to create profile');
        // Optionally redirect to profile creation
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
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

  useEffect(() => {
    fetchFriends();
    fetchMyProfile();
  }, [actor, currentPrincipal]);

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


        <div className="profile-section">
          <h2>Search for Friends</h2>
          <input
            type="text"
            placeholder="Search people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>


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
                <h3>{usernames[friend.principal] || friend.username}</h3> {/* Use cached username */}
              </div>
            ))
        ) : (
          <p>You have no friends yet.</p>
        )}
      </div>

      {/* Main Content: Profile and Tunes */}
      <div className="main-profile-content">
        {showMyProfile && myProfile ? (
          <div className="profile-view">
            <h2>My Profile</h2>
            <img
              src={`data:image/png;base64,${myProfile.avatar}`}
              alt="My Avatar"
              className="profile-avatar"
              style={{ width: '100px', height: '100px' }}
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
            <h2>Select a friend to view their profile and tunes.</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default Friends;
