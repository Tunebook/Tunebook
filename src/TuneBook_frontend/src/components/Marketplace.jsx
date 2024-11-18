import React, { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import LoadingSpinner from "./LoadingSpinner";
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';


function Marketplace({ actor, currentPrincipal }) {
    const navigate = useNavigate();
  const [instruments, setInstruments] = useState([]);
  const [newInstrument, setNewInstrument] = useState({
    name: "",
    location: "",
    product: "",
    comment: "",
    price: "",
    photos: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState(0);
  const [totalInstruments, setTotalInstruments] = useState(0);
  const [modalOpen, setModalOpen] = useState(false); 

  useEffect(() => {
    fetchInstruments();
  }, [searchTerm, pageNum]);

  const convertUint8ArrayToBase64 = (uint8Array) => {
    if (uint8Array && uint8Array.byteLength) {
      let binary = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      return window.btoa(binary); 
    } else {
      console.warn("Invalid Uint8Array passed to convertUint8ArrayToBase64");
      return ''; 
    }
  };


  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(file, options);
      const arrayBuffer = await compressedFile.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error("Error compressing image:", error);
      return null;
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5); // Limit to 5 photos
    const compressedPhotos = await Promise.all(
      files.map((file) => compressImage(file))
    );

    setNewInstrument((prev) => ({
      ...prev,
      photos: [...prev.photos, ...compressedPhotos.filter((photo) => photo !== null)],
    }));
  };

  const fetchInstruments = async () => {
    setLoading(true);
    try {
      const result = await actor.get_instruments(searchTerm, pageNum);
      setInstruments(result[0] || []);
      setTotalInstruments(result[1] || 0);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching instruments:", error);
      setLoading(false);
    }
  };

  /*
  const handleAddInstrument = async (e) => {
    e.preventDefault();
    if (!currentPrincipal) {
      alert("This is an upcoming feature, that will be released soon.");
      return;
    }

    try {
      setLoading(true);
      const profile = await actor.authentication(currentPrincipal);
      const username =
        Array.isArray(profile) && profile.length > 0
          ? profile[0].username
          : "Unknown";

      const success = await actor.add_instrument(
        currentPrincipal,
        "None",
        username,
        newInstrument.name,
        newInstrument.location,
        newInstrument.product,
        newInstrument.comment,
        newInstrument.price,
        newInstrument.photos
      );

      if (success) {
        alert("Instrument added successfully!");
        fetchInstruments();
        setNewInstrument({
          name: "",
          location: "",
          product: "",
          comment: "",
          price: "",
          photos: [],
        });
        setModalOpen(false);
      } else {
        alert("Failed to add instrument.");
        setModalOpen(false);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error adding instrument:", error);
      setModalOpen(false);
      setLoading(false);
    }
  };
  */


  const handleAddInstrument = async (e) => {
    alert("This feature is coming soon... Stay tuned!");
    setModalOpen(false);
  }


  useEffect(() => {
    fetchInstruments();
  }, [searchTerm, pageNum]);


  const handleDeleteInstrument = async (id) => {
    if (!currentPrincipal) {
      alert("You must be logged in to delete an instrument.");
      return;
    }

    try {
      const success = await actor.delete_instrument(id, currentPrincipal);
      if (success) {
        alert("Instrument deleted successfully!");
        // Update the instruments state by removing the deleted instrument
        setInstruments((prevInstruments) =>
          prevInstruments.filter((instrument) => instrument.id !== id)
        );
      } else {
        alert("Failed to delete instrument. You may not have permission if you are not the seller.");
      }
    } catch (error) {
      console.error("Error deleting instrument:", error);
    }
  };


  return (

    <div className="marketplace-container">

        {loading && <LoadingSpinner />}


      <h1>Tunebook Instrument Marketplace</h1>




<div className="market-info-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', marginBottom: "60px" }}>
  <div style={{
    maxWidth: '1200px',
    backgroundColor: '#1a1a1a',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'left',
  }}>
    <h3 style={{ textAlign: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '35px' }}>
      Coming Soon: Instrument Marketplace
    </h3>
    <p style={{ fontSize: '18px', lineHeight: '1.8', color: 'white', marginBottom: '55px' }}>
       A place where Traditional musicians can not only connect but also buy and sell the instruments that bring their sessions to life. The <strong>Tunebook Marketplace</strong> is designed to be the ultimate destination for trading bespoke, rare, and secondhand musical instruments.
    </p>
    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#86e3e6', marginBottom: '25px', marginTop: "45px", justifySelf: "left" }}>
      What makes this marketplace special?
    </h3>
    <ul style={{ paddingLeft: '20px', color: 'white', lineHeight: '1.9', fontSize: '18px', marginBottom: '35px' }}>
      <li>
        <strong style={{ color: '#86e3e6' }}>Trust and Reputation:</strong> As our network grows, musicians build profiles that show their connections, tunes, and community involvement. This fosters trust between buyers and sellers, creating a unique marketplace.
      </li>
      <li>
        <strong style={{ color: '#86e3e6'  }}>Perfect for Rare Finds:</strong> From handcrafted flutes to vintage fiddles, our marketplace will cater to the unique needs of Traditional Musicians, making it easier than ever to find and sell niche instruments.
      </li>
      <li>
        <strong style={{ color: '#86e3e6' }}>Empowered by Tunebook Tokens:</strong> Once we launch our SNS, sellers will be able to participate by locking up a certain amount of Tunebook tokens, adding an extra layer of security and commitment to every transaction.
      </li>
    </ul>
    <p style={{ fontSize: '18px', lineHeight: '1.8', color: 'white', marginTop: '40px' }}>
      We’re hard at work building this exciting feature, and we can’t wait to bring it to life for the Trad Music community. Stay tuned!
    </p>
  </div>
</div>


<h2 className="preview-title"> Preview Listings: </h2>

        <input
        type="text"
        className="search-bar"
        placeholder="Search for instruments..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="instrument-listings">
        {loading ? (
          <p>Loading...</p>
        ) : instruments.length > 0 ? (
          instruments.map((instrument, index) => (

            <div key={index} className="instrument-card">
            <h3>{instrument.name}</h3>

            <div className="instrument-photos">
            {instrument.photos && instrument.photos.length > 0 ? (
              instrument.photos.map((photo, i) => (
                <img
                  key={i}
                  src={`data:image/png;base64,${convertUint8ArrayToBase64(photo)}`}
                  alt={`Instrument ${i + 1}`}
                  className="instrument-photo"
                  style={{ width: '100px', height: '100px', margin: '5px' }}
                />
              ))
            ) : (
              <p>No photos available</p>
            )}
          </div>

            
              
              <p><strong>Location:</strong> {instrument.location}</p>
              <p><strong>Product:</strong> {instrument.product}</p>
              <p><strong>Price in USD:</strong> ${instrument.price}</p>
              <p><strong>Comment:</strong> {instrument.comment}</p>
              <p><strong>Seller:</strong> {instrument.username}</p>

            {/*
              <button
              className="delete-instrument-button"
              onClick={() => handleDeleteInstrument(instrument.id)}
            >
              🗑️
            </button> 
            */}

            <button
              className="buy-button"
              onClick={() => alert("This feature is coming soon... ")}
            >
              + Add to cart
            </button>       

            </div>
          ))
        ) : (
          <p>No instruments found.</p>
        )}

        
      </div>

      <button className="add-instrument-button" onClick={() => setModalOpen(true)}>
        + List an Instrument
      </button>


           {/* Add Instrument Modal */}
    {modalOpen && (
        <div className="modal" onClick={() => setModalOpen(false)}>

          
            <form className="add-instrument-form" onSubmit={handleAddInstrument} onClick={(e) => e.stopPropagation()}>

        

            <h3>List an Instrument</h3>

  
              <input
                type="text"
                placeholder="Name"
                value={newInstrument.name}
                onChange={(e) =>
                  setNewInstrument({ ...newInstrument, name: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={newInstrument.location}
                onChange={(e) =>
                  setNewInstrument({ ...newInstrument, location: e.target.value })
                }
                required
              />
              <select
              
                value={newInstrument.product}
                onChange={(e) =>
                  setNewInstrument({ ...newInstrument, product: e.target.value })
                }
                required
              >
                <option value="N/A">N/A</option>
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Slightly Used">Slightly Used</option>
              </select>

              <textarea
                 style={{backgroundColor: "#1a1a1a", color: "white", marginBottom: "5px", marginTop: "5px"}}
                placeholder="Comment"
                value={newInstrument.comment}
                onChange={(e) =>
                  setNewInstrument({ ...newInstrument, comment: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Price in USD"
                value={newInstrument.price}
                onChange={(e) =>
                  setNewInstrument({ ...newInstrument, price: e.target.value })
                }
                required
              />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
              />
              <button type="submit"> + Add Instrument</button>
              
            </form>
          </div>

      )}

    </div>
  );
}

export default Marketplace;
