import React from 'react';

function FAQ() {
  return (
    <div className='faq-container-wrapper'>
    <div className="faq-container">
      <h1>FAQ</h1>
      
      <div className="faq-item">
        <h3> - What is Tunebook?</h3>
        <p>
          Tunebook is a decentralized platform for musicians and music enthusiasts to create, manage, and share musical sessions with a community of like-minded individuals. 
          Built on the Internet Computer, Tunebook provides a secure, scalable, and serverless backend for all its features.
        </p>
      </div>
      
      <div className="faq-item">
        <h3> - How do I create a musical session?</h3>
        <p>
          Once you've created an account and logged in, navigate to the "Create Session" page. Fill in the details of your session, including the location, contact information, 
          and recurrence schedule. Once submitted, your session will be available for other users to browse.
        </p>
      </div>
      
      <div className="faq-item">
        <h3> - Is there a fee to use Tunebook?</h3>
        <p>
          Tunebook is free to use. There are no fees to create, browse, or join sessions. However, you may be responsible for any local event or venue fees associated 
          with the sessions you attend.
        </p>
      </div>
      
      <div className="faq-item">
        <h3> - How is my data protected on Tunebook?</h3>
        <p>
          Tunebook leverages the security of the Internet Computer, which uses Rust-based canisters to securely store and manage data. User authentication is handled by 
          the Internet Computer’s identity service, providing privacy and security for all users.
        </p>
      </div>
      
      <div className="faq-item">
        <h3> - How can I find sessions near me?</h3>
        <p>
          Tunebook features an interactive map powered by Leaflet.js. You can use this map to view and search for musical sessions near your location, making it easy 
          to connect with local musicians.
        </p>
      </div>
      
      <div className="faq-item">
        <h3> - What does “recurrence” mean when setting up a session?</h3>
        <p>
          Recurrence allows you to schedule sessions on a repeating basis, such as weekly, biweekly, or monthly. This is useful for regular gatherings, jam sessions, 
          or music lessons.
        </p>
      </div>

      <div className="faq-item">
        <h3> - Who are the team members behind Tunebook?</h3>
        <p>
          Tunebook is founded by Robert Ripley and developed by founding engineer Gurleen K Dhaliwal.
        </p>
      </div>

      <div className="faq-item">
        <h3> - How do I report an issue or provide feedback?</h3>
        <p>
          You can report issues or provide feedback by navigating to the “Feedback” section on the website. This allows you to communicate directly with the TuneBook team 
          and help improve the platform.
        </p>
      </div>

      <div className="faq-item">
        <h3> - Can I filter sessions by location or type?</h3>
        <p>
          Yes, Tunebook provides various filters to help you narrow down sessions based on location, event name, or other parameters. This makes it easy to find exactly 
          what you’re looking for.
        </p>
      </div>
      </div>
    </div>
  );
}

export default FAQ;

