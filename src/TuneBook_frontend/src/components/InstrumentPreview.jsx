import React, { useState, useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { useNavigate } from "react-router-dom";

function InstrumentPreview({ actor, currentPrincipal }) {
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const convertUint8ArrayToBase64 = (uint8Array) => {
    if (uint8Array && uint8Array.byteLength) {
      let binary = "";
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      return window.btoa(binary);
    } else {
      console.warn("Invalid Uint8Array passed to convertUint8ArrayToBase64");
      return "";
    }
  };

  const fetchInstruments = async () => {
    setLoading(true);
    try {
      const result = await actor.get_instruments(searchTerm, 0);
      setInstruments(result[0] || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching instruments:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstruments();
  }, [searchTerm]);

  return (
    <div className="marketplace-container-P">
      {loading && <LoadingSpinner />}

      <div className="preview-header">
        <h2 className="preview-title">Explore Our Marketplace</h2>
        <p className="preview-subtitle">
          Discover bespoke and rare musical instruments from all over the world!
        </p>
      </div>

      <div className="instrument-preview-grid-P">
        {loading ? (
          <p>Loading...</p>
        ) : instruments.length > 0 ? (
          instruments.map((instrument, index) => (
            <div key={index} className="instrument-card-P">
              <div className="instrument-image-container-P">
                {instrument.photos && instrument.photos.length > 0 ? (
                  <img
                    src={`data:image/png;base64,${convertUint8ArrayToBase64(
                      instrument.photos[0]
                    )}`}
                    alt={`${instrument.name}`}
                    className="instrument-image-P"
                  />
                ) : (
                  <div className="no-image-placeholder-P">No Image Available</div>
                )}
              </div>
              <div className="instrument-info-P">
                <h3 className="instrument-name-P">{instrument.name}</h3>
                <p className="instrument-location-P">{instrument.location}</p>
                <p className="instrument-price-P">${instrument.price}</p>
                <button
                  className="buy-button-P"
                  onClick={() => {
                                    navigate('/marketplace');
                    
                  }}
                >
                  + Add to Cart
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No instruments found.</p>
        )}
      </div>
    </div>
  );
}

export default InstrumentPreview;
