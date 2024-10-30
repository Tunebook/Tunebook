import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

function Contact() {

      const [message, setMessage] = useState('');
      const [userName, setUserName] = useState('');
      const [userEmail, setUserEmail] = useState('');
      const [messageStatus, setMessageStatus] = useState('');
    
      const sendContactMessage = (e) => {
        e.preventDefault();
    
        const templateParams = {
          from_name: userName,
          message: message,
          reply_to: userEmail,
        };
    
        emailjs.send(
          'service_09uyul4',  // Your Service ID
          'template_n4ejwvk', // Your Template ID for contact messages
          templateParams, 
          'PtYXRu46x5BUnCZyu' // Your Public Key
        )
        .then((result) => {
          console.log('Contact message sent successfully', result.text);
          setMessageStatus('Message sent successfully!');
          setMessage('');
          setUserName('');
          setUserEmail('');
        })
        .catch((error) => {
          console.error('Failed to send contact message', error);
          setMessageStatus('Failed to send message. Please try again later.');
        });
      };
    
      return (
        <div className="feedback-form-wrapper">
          <div className="feedback-form-container">
            <form onSubmit={sendContactMessage}>
              <h2>Contact Us</h2>
    
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
                Message:
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows="6" 
                    required
                />
                </label>

    
              <button type="submit">Send Message</button>
              {messageStatus && <p>{messageStatus}</p>}
            </form>
          </div>
        </div>
      );
    };
    

export default Contact;
