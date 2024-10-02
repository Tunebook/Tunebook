import React, { useState } from 'react';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';

function Profile({ actor, currentPrincipal }) {
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [instruments, setInstruments] = useState([]); ;
  const [avatar, setAvatar] = useState(null);
  const navigate = useNavigate();

  // Instrument options 
  const instrumentOptions = [ 
    { value: 'Piano', label: 'Piano' }, 
    { value: 'Guitar', label: 'Guitar' }, 
    { value: 'Flute', label: 'Flute' }, 
    { value: 'Fiddle', label: 'Fiddle' }, 
    { value: 'Low_whistle', label: 'Low Whistle' }, 
    { value: 'Pipes', label: 'Pipes' }, 
    { value: 'Accordion', label: 'Accordion' }, 
    { value: 'Concertina', label: 'Concertina' }, 
    { value: 'Bodhran', label: 'Bodhrán' }, 
    { value: 'Harp', label: 'Harp' }, 
    { value: 'Bouzoki', label: 'Bouzoki' }, 
    { value: 'Mandolin', label: 'Mandolin' }, 
    { value: 'Banjo', label: 'Banjo' }, 
    { value: 'other', label: 'Other' }
  ]
  

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
      // Transform selected instruments into Vec<nat8> format (array of bytes)
      const instrumentsString = instruments.join(', ');

      // Convert instruments string to byte array (Vec<u8> equivalent)
      const encoder = new TextEncoder();
      const instrumentsBytes = encoder.encode(instrumentsString);

      // Call the backend to create/update the profile
      const newProfile = await actor.update_profile(
        currentPrincipal,
        username,
        avatar ? avatar.split(',')[1] : [],  // Send the avatar data as base64
        location,
        Array.from(instrumentsBytes)
      );
      console.log('Profile created:', newProfile);
      // Redirect or notify after successful profile creation
      navigate('/friends')
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
          <Select
            isMulti
            value={instruments}
            onChange={(selectedOptions) => setInstruments(selectedOptions)}  // Update state on selection
            options={instrumentOptions}
            placeholder="Select your instruments"
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

export default Profile;
