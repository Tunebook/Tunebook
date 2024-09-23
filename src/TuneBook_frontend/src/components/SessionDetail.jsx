import React from 'react';
import { useParams } from 'react-router-dom';

function SessionDetail() {
  const { id } = useParams();  // Get session ID from URL params

  // Fetch the session details based on the ID (mocked for now)
  const session = {
    id,
    name: 'MySessionTest',
    location: 'London',
    daytime: '2024-09-12T10:00',
    contact: 'contact@music.com',
    comment: 'This is a weekly session in London.'
  };

  return (
    <div className="session-detail">
      <h2>{session.name}</h2>
      <p><strong>Location:</strong> {session.location}</p>
      <p><strong>Date:</strong> {session.daytime}</p>
      <p><strong>Contact:</strong> {session.contact}</p>
      <p><strong>Comment:</strong> {session.comment}</p>
    </div>
  );
}

export default SessionDetail;
