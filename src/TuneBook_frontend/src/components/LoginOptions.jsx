import React from 'react';

function LoginOptions({ onLoginICP, onLoginNFID }) {
  return (
    <div className="login-options">
      {/* IC Identity Login Button */}
      <button className="login-button" onClick={onLoginICP}>
        <span>IC Identity</span>
        <img src="/images/icp-logo.png" alt="IC Identity Logo" className="login-icon" />
      </button>

      {/* NFID Login Button */}
      <button className="login-button" onClick={onLoginNFID}>
        <span>NFID</span>
        <img src="/images/nfid-logo.png" alt="NFID Logo" className="login-icon" />
      </button>
    </div>
  );
}

export default LoginOptions;
