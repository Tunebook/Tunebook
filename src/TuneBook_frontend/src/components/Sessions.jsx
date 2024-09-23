import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Sessions() {
  const [sessions, setSessions] = useState([
    { id: 1, name: 'MySessionTest', location: 'London', contact: 'example@gmail.com' },
    { id: 2, name: 'Weekly Jam', location: 'New York', contact: 'contact@music.com' }
  ]);

  return (
    <div className="sessions-page">
      <div className="add-session-section">
        {/* Form to add new session (not shown for brevity) */}
      </div>

      <div className="session-list-section">
        <input
          type="text"
          className="search-input"
          placeholder="Search for sessions with name or location."
        />

        <div className="sessions-list">
          {sessions.map((session) => (
            <div key={session.id} className="session-card">
              <h4>{session.name}</h4>
              <p><strong>Location:</strong> {session.location}</p>
              <p><strong>Contact:</strong> {session.contact}</p>
              {/* Link to session detail page */}
              <Link to={`/session/${session.id}`}>View Details</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Sessions;
