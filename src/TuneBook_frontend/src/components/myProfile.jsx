import React, { useState } from 'react';

function myProfile({ actor, currentPrincipal }) {
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [instruments, setInstruments] = useState('');
  const [avatar, setAvatar] = useState(null);

  // Handle file input for avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);  // Base64 encoded string
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      // Call the backend to create/update the profile
      const newProfile = await actor.update_profile(
        currentPrincipal,
        username,
        avatar ? avatar.split(',')[1] : [],  // Send the avatar data as base64
        location,
        instruments
      );
      console.log('Profile created:', newProfile);
      // Redirect after successful profile creation
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };

  return (
    <div className="create-profile-container">
      <h2>Create Your Profile</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Location:</label>
          <input 
            type="text" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Instruments:</label>
          <input 
            type="text" 
            value={instruments} 
            onChange={(e) => setInstruments(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Avatar:</label>
          <input type="file" accept="image/*" onChange={handleAvatarChange} />
        </div>
        <button type="submit">Create Profile</button>
      </form>
    </div>
  );
}

export default myProfile;
