import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Left section with logo, title, and description */}
        <div className="footer-left">
          <div className="footer-info">
            <div className="footer-header">
              <img src="/Tunebook_Logo.png" alt="Tunebook Logo" className="footer-logo" />
              <h2 className="footer-title">Tunebook</h2>
            </div>
            <p className="footer-description">
              Tunebook offers musicians a platform to connect with others, create new tunes, and share their tunes with others. 
              It also aims to build a community for Irish Trad musicians. You can also view or add 
              sessions that are around your area.
            </p>
          </div>
        </div>

        {/* Right section with links */}
        <div className="footer-right">
          <h4>Tunebook</h4>
          <ul className="footer-links">
            <li><Link to="/feedback">Feedback</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/Tunes">Tunes</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>
      

      {/* Community follow section */}
      <div className="footer-community">
        <h4>Follow The Community:</h4>
        <div className="social-link">
            
            <a href="https://x.com/TunebookICP" target="_blank" rel="noopener noreferrer">
            <img src="/twitterIcon.png" alt="Twitter" className="social-icon" />
            </a>

            <a href="https://github.com/Tunebook/Tunebook" target="_blank" rel="noopener noreferrer">
            <img src="/github-logo.png" alt="Github" className="social-icon" />
            </a>

            <a href="https://www.linkedin.com/company/tunebook" target="_blank" rel="noopener noreferrer">
            <img src="/LinkedIn-Icon.png" alt="LinkedIn" className="social-icon" /> 
            </a>

        </div>
        </div>

      

      {/* Bottom section with copyright and privacy links */}
      <div className="footer-bottom">
        <p>© 2024 Celtic Crossroads Foundation</p>
        <div className="footer-bottom-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-of-service">Terms of Service</Link>
        </div>
      </div>
      </div>
    </footer>
  );
}

export default Footer;
