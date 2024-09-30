import React, { useState, useEffect } from 'react';

function Friends({ actor, currentPrincipal }) {
  const [friends, setFriends] = useState([]); // List of friends
  const [selectedFriend, setSelectedFriend] = useState(null); // Currently selected friend
  const [people, setPeople] = useState([]); // List of people to browse
  const [incomingRequests, setIncomingRequests] = useState([]); // List of incoming friend requests
  const [searchTerm, setSearchTerm] = useState(''); // Search filter for browsing people
  const [pageNum, setPageNum] = useState(0); // Pagination for browsing people
  const [myProfile, setMyProfile] = useState(null); // Your own profile info
  const [showMyProfile, setShowMyProfile] = useState(true); // Toggle between showing my profile or friend's profile

  // Fetch current friends
  const fetchFriends = async () => {
    try {
      const result = await actor.get_friends(currentPrincipal);
      setFriends(result); // Populate the friends state
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

// Fetch the logged-in user's profile
const fetchMyProfile = async () => {
    try {
      // Correctly fetch the profile using the get_profile function
      const profile = await actor.get_profile(currentPrincipal);
      if (profile) {
        setMyProfile(profile);
      } else {
        console.log('No profile found, redirecting to create profile');
        navigate('/profile'); // Redirect to create profile if no profile found
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };
  

  useEffect(() => {
    fetchFriends();
    fetchMyProfile();
  }, [actor, currentPrincipal]);

  // Display selected friend's profile
  const displayFriendProfile = (friend) => {
    setSelectedFriend(friend);
    setShowMyProfile(false); // Switch to friend's profile
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
        <button className="my-profile-button" onClick={handleMyProfileClick}>
          My Profile
        </button>
        {/* Right Sidebar: My Profile and Tunes */}
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
          friends.map((friend) => (
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
              <h3>{friend.username}</h3>
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
            <p>Username: {myProfile.username}</p>
            <h3>My Tunes:</h3>
            <ul>
              {/* Placeholder for your tunes */}
              <li>My Tune 1</li>
              <li>My Tune 2</li>
            </ul>
          </div>
        ) : selectedFriend ? (
          <div className="profile-view">
            <h2>{selectedFriend.username}'s Profile</h2>
            <p>Profile details go here...</p>
            <h3>Their Tunes:</h3>
            {/* Display their tunes */}
            <ul>
              {/* Placeholder for tunes */}
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
