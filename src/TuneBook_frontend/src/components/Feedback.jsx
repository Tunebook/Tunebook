import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import imageCompression from 'browser-image-compression';

const FeedbackForm = () => {
  const [feedback, setFeedback] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [file, setFile] = useState(null);

  const sendFeedback = async (e) => {
    e.preventDefault();

    let fileBase64 = '';
    if (file) {
      const compressedFile = await compressImage(file);
      fileBase64 = await convertFileToBase64(compressedFile);
    }

    const templateParams = {
      from_name: userName,
      message: feedback,
      reply_to: userEmail,
      image_base64: fileBase64,
    };

    emailjs.send(
      'service_09uyul4', 
      'template_kfotl1a', 
      templateParams, 
      'PtYXRu46x5BUnCZyu'
    )
    .then((result) => {
      console.log('Feedback sent successfully', result.text);
      setMessageStatus('Feedback sent successfully!');
      setFeedback('');
      setUserName('');
      setUserEmail('');
      setFile(null);
    })
    .catch((error) => {
      console.error('Failed to send feedback', error);
      setMessageStatus('Failed to send feedback. Please try again later.');
    });
  };

  // Compress image before converting to Base64
  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 0.05, // Target size (e.g., 50KB)
      maxWidthOrHeight: 600, // Resize image to max 300px width or height
      useWebWorker: true,
    };
    return await imageCompression(file, options);
  };

  // Convert file to Base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle file selection
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Handle drag and drop
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setFile(event.dataTransfer.files[0]);
  };

  return (
    <div className="feedback-form-wrapper">
      <div className="feedback-form-container">
        <form onSubmit={sendFeedback}>
          <h2>Submit Feedback</h2>

          <label>
            Name:
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </label>

          <label>
            Email:
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
            />
          </label>

        <label>
            Feedback:
            <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows="6" 
                    required
                />
          </label>


          <label style={{ marginTop: '10px' }}>Upload optional picture:</label>
          <div
            className="upload-box"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {file ? (
              <p>{file.name}</p>
            ) : (
              <>
                <p>Drop here or...</p>
                <label htmlFor="file-input" className="file-select-button">
                  Select
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </>
            )}
          </div>

          <button type="submit">Send Feedback</button>
          {messageStatus && <p>{messageStatus}</p>}
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
