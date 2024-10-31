import React from 'react';

// Helper function to convert Uint8Array to Base64 string
const convertUint8ArrayToBase64 = (uint8Array) => {
  if (uint8Array && uint8Array.byteLength) {
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return window.btoa(binary);
  } else {
    return ''; // Return empty string if no valid data is passed
  }
};

function FriendRequests({
  sentRequests,
  receivedRequests,
  acceptFriendRequest,
  cancelFriendRequest,
}) {
  return (
    <div className="friend-requests-view">
      <h2>Friend Requests</h2>
      
      <h3>Received Requests:</h3>
      {receivedRequests.length > 0 ? (
        receivedRequests.map((request, index) => (
          <div key={index} className="friend-request-item">
            <p>{request.username}</p>
            <button onClick={() => acceptFriendRequest(request.principal)}>Accept</button>
            <button onClick={() => cancelFriendRequest(request.principal)}>Reject</button>
            <img
              src={
                request.avatar instanceof Uint8Array && request.avatar.byteLength
                  ? `data:image/png;base64,${convertUint8ArrayToBase64(request.avatar)}`
                  : '/path/to/default-avatar.png'
              }
              alt="Avatar"
              style={{ width: '30px', height: '30px', borderRadius: '15px' }}
            />
          </div>
        ))
      ) : (
        <p>No received friend requests.</p>
      )}

      <h3>Sent Requests:</h3>
      {sentRequests.length > 0 ? (
        sentRequests.map((request, index) => (
          <div key={index} className="friend-request-item">
            <img
              src={
                request.avatar instanceof Uint8Array && request.avatar.byteLength
                  ? `data:image/png;base64,${convertUint8ArrayToBase64(request.avatar)}`
                  : '/path/to/default-avatar.png'
              }
              alt="Avatar"
              style={{ width: '30px', height: '30px', borderRadius: '15px' }}
            />
            <p>{request.username}</p>
            <button onClick={() => cancelFriendRequest(request.principal)}>Cancel Request</button>
          </div>
        ))
      ) : (
        <p>No sent friend requests.</p>
      )}
    </div>
  );
}

export default FriendRequests;
