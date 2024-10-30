import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';

function Profile({ actor, currentPrincipal }) {
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [instruments, setInstruments] = useState([]); ;
  const [avatar, setAvatar] = useState(null);
  const [pob, setpob] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  
  const [useDefaultAvatar, setUseDefaultAvatar] = useState(false);
  const [loading, setLoading] = useState(false);   // For handling loading state
  const [error, setError] = useState(null);        // For handling errors

  const navigate = useNavigate();

  const defaultAvatarPath = '/DefaultAvatar.png';

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
  ];






  // Handle file input for avatar
  const handleAvatarChange = (e) => {
    if (useDefaultAvatar) return;

    const file = e.target.files[0]; // Get the first file from the input
    const reader = new FileReader();
  
    reader.onloadend = () => {
      const arrayBuffer = reader.result; // Get the ArrayBuffer from the file
      const avatarBytes = new Uint8Array(arrayBuffer); // Convert to Uint8Array
      setAvatar(avatarBytes); // Set the avatar state to raw bytes
    };
  
    if (file) {
      reader.readAsArrayBuffer(file); // Read file as an ArrayBuffer
    }
  };

    // Toggle between custom avatar and default avatar
    const handleUseDefaultAvatarChange = (e) => {
      const isChecked = e.target.checked;
      setUseDefaultAvatar(isChecked);
  
      if (isChecked) {
        // Set avatar to the default image
        fetch(defaultAvatarPath)
          .then(res => res.arrayBuffer())
          .then(buffer => {
            setAvatar(new Uint8Array(buffer));
          })
          .catch(err => console.error("Failed to load default avatar:", err));
      } else {
        // Clear the avatar to allow file upload
        setAvatar(null);
      }
    };
  


  const handleSubmit = async (event) => {
    setLoading(true); // Start loading
    event.preventDefault();
  
    try {
      const instrumentsString = instruments.map(option => option.value).join(', ');
  
      // Call the backend to create/update the profile
      const newProfile = await actor.update_profile(
        currentPrincipal,
        username,
        pob,
        instrumentsString,
        avatar
      );
  
      setMessageStatus('Profile Updated!');
      console.log('Profile created:', newProfile);
      
      setLoading(false); // Stop loading
      navigate('/friends'); // Navigate to the friends page after success
      
    } catch (error) {
      console.error('Failed to create profile:', error);
      setMessageStatus('Failed to create profile. Please try again');
      
      // Check if the backend returns an error message indicating the username is taken
      if (error?.message.includes("Username") && error?.message.includes("already taken")) {
        setError('This username is already taken. Please choose a different one.');
        setMessageStatus('This username is already taken. Please choose a different one.');
      } else {
        setError('Failed to create profile. Please try again.');
      }
      
      setLoading(false); // Stop loading
    }
  };


  return (
    <div className="create-profile-container">
      <h2>Generate Profile</h2>
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
            onChange={(selectedOptions) => setInstruments(selectedOptions)}
            options={instrumentOptions}
            placeholder="Select your instruments"
          />
        </div>

        <div>
          <label>Avatar:</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleAvatarChange} 
            disabled={useDefaultAvatar} 
          />
        </div>

        <div className='default-avatar-checkbox'>
        <input
          type="checkbox"
          checked={useDefaultAvatar}
          onChange={handleUseDefaultAvatarChange}
          style={{
            width: '20px', // Set width
            height: '20px', // Set height
            accentColor: '#58d289', // Changes checkbox color in modern browsers
            cursor: 'pointer', // Adds pointer cursor
            marginRight: '15px',
            marginTop: '13px',
          }}
        />
        <label>Use default avatar</label>
        </div>
      



        {error && <p style={{ color: 'red' }}>{error}</p>}
        {messageStatus && <p> style={{ color: 'white' }} {messageStatus}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>

      </form>
    </div>
  );
}

export default Profile;