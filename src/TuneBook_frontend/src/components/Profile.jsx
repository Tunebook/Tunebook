import React, { useState } from 'react';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';

function Profile({ actor, currentPrincipal }) {
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [instruments, setInstruments] = useState([]); ;
  const [avatar, setAvatar] = useState(null);
  const navigate = useNavigate();
  const [pob, setpob] = useState('');

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
    const file = e.target.files[0]; // Get the first file from the input
    const reader = new FileReader();
  
    reader.onloadend = () => {
      const arrayBuffer = reader.result; // Get the ArrayBuffer from the file
      const avatarBytes = new Uint8Array(arrayBuffer); // Convert to Uint8Array
      setAvatar(avatarBytes); // Set the avatar state to raw bytes
    };
  
    // Read the file as an ArrayBuffer instead of Base64
    if (file) {
      reader.readAsArrayBuffer(file); // Read file as an ArrayBuffer
    }
  };
  

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    try {
      // Transform selected instruments into Vec<nat8> format (array of bytes)
      const instrumentsString = instruments.map(option => option.value).join(', ');

      // Convert instruments string to byte array (Vec<u8> equivalent)
      const encoder = new TextEncoder();
      const instrumentsBytes = encoder.encode(instrumentsString);

      // Call the backend to create/update the profile
      const newProfile = await actor.update_profile(
        currentPrincipal,
        username,
        pob,               // 4. pob (place of birth/location)
        instrumentsString,  // 5. instruments (string)
        avatar
      );
  
      console.log('Profile created:', newProfile);
      navigate('/friends');
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
            value={pob} 
            onChange={(e) => setpob(e.target.value)} 
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
