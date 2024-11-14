import React, { useEffect, useState } from "react";
import ABCJS from "abcjs";
import 'abcjs/abcjs-audio.css';
import ReactPaginate from "react-paginate";
import Select from 'react-select';
import { useNavigate } from 'react-router-dom'; 
import { keyInfo, rhythmInfo } from './variables';  
import Modal from 'react-modal'; 
import LoadingSpinner from "./LoadingSpinner";
   

function Tunes({ actor, currentPrincipal, setSidebarOpen }) {
  const [orgTunes, setOrgTunes] = useState([]);  
  const [currentTuneData, setCurrentTuneData] = useState("");
  const [currentTuneTitle, setCurrentTuneTitle] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const tunesPerPage = 10;  // Number of tunes per page
  const [searchTitle, setSearchTitle] = useState('');
  const [key, setKey] = useState({ value: "all", label: "Key" });
  const [rhythm, setRhythm] = useState({ value: "all", label: "Rhythm" });
  const [libraryTunes, setLibraryTunes] = useState([]);
  const [currentLibrary, setCurrentLibrary] = useState(null);
  const [userTunes, setUserTunes] = useState([]);  
  const [abcNotation, setAbcNotation] = useState("");
  const [selectedTab, setSelectedTab] = useState("sheet"); 
  const [loading, setLoading] = useState(false); 

  const navigate = useNavigate();

  const [visualObj, setVisualObj] = useState(null);
  const synth = new ABCJS.synth.CreateSynth();
  const synthControl = new ABCJS.synth.SynthController();

    // Modal state for adding a new tune
    const [showAddTuneModal, setShowAddTuneModal] = useState(false);
    const [newTuneData, setNewTuneData] = useState(`X: 1
T: Tune Title
Z: Composer (optional)
S: Source or link (optional)
R: Rhythm (e.g., jig, reel)
M: 4/4
K: D

abc def | gfe dcB | ...`);  


    const [validationError, setValidationError] = useState("");
    const abcTemplate = `X: 1
T: Tune Title
Z: Composer (optional)
S: Source or link (optional)
R: Rhythm (e.g., jig, reel)
M: 4/4
K: D

abc def | gfe dcB | ...`;  
          


  // Helper function to clean up the tune title
  const cleanTitle = (title) => {
    // Remove any leading numbers and a hyphen (e.g., "00 - ")
    const withoutNumbers = title.replace(/^\d+\s*-\s*/, '');
    // Remove the .abc extension if present
    return withoutNumbers.replace(/\.abc$/, '');
  };

  // Fetch tunes whenever the page, search, or filter changes
  useEffect(() => {
    fetchUserTunes();
    fetchTunes();
  }, [currentPage, searchTitle, key, rhythm, actor]);

  useEffect(() => {
    if (selectedTab === "sheet" && currentTuneData) {
      iniABCJS(currentTuneData);
    }
  }, [selectedTab, currentTuneData]);



  // Fetch user's profile tunes
  const fetchUserTunes = async () => {
    try {
      
      if (!currentPrincipal) return;
      const [tuneList] = await actor.get_user_tune_list(currentPrincipal, 0);
      const userTuneTitles = tuneList.map(tune => tune.title);
      setUserTunes(userTuneTitles);
    } catch (error) {
      console.error("Error fetching user's tunes:", error);
    } 
  };
  

  const fetchTunes = async () => {
    try {
     
      const response = await actor.filter_tunes(
        searchTitle,
        rhythm.value.toLowerCase(),
        key.value,
        currentPage
      );
      
      const tunes = response[0];
      const totalCount = response[1];

      const libraryTunes = groupLibraryTunes(tunes);
      setLibraryTunes(libraryTunes);

      const regularTunes = tunes.filter(tune =>
        !libraryTunes.some(lib => lib.baseTitle === tune.title.split('_')[0])
      );
      setOrgTunes(regularTunes);

      setTotalPages(Math.ceil(totalCount / tunesPerPage));
 
    } catch (error) {
      console.error("Error fetching tunes:", error);
    }
    
  };

const groupLibraryTunes = (tunes) => {
    const groupedLibraryTunes = {};

    tunes.forEach((tune) => {
      // Use the cleaned-up title as the base for grouping
      const [baseTitle] = tune.title.split('_');
      if (!groupedLibraryTunes[baseTitle]) {
        groupedLibraryTunes[baseTitle] = [];
      }
      groupedLibraryTunes[baseTitle].push(tune);
    });

    // Only keep entries with more than one version
    return Object.entries(groupedLibraryTunes).filter(
      ([, versions]) => versions.length > 1
    ).map(([baseTitle, versions]) => ({
      baseTitle,
      versions,
    }));
  };


  const onSelectTune = async (selectedTune) => {
    if (!selectedTune) return;
    try {
      setCurrentLibrary(null);
      const tuneData = await actor.get_original_tune(selectedTune.title);
      setCurrentTuneData(tuneData);
      setCurrentTuneTitle(selectedTune.title);
      iniABCJS(tuneData);
      setAbcNotation(tuneData);
    } catch (error) {
      console.error("Error fetching tune data:", error);
    }
  };

  const iniABCJS = async (tuneData) => {
    if (!tuneData) return;
    setTimeout(async () => {
      const visualObj = ABCJS.renderAbc("tunedata", tuneData, { responsive: "resize" });
      if (!visualObj || visualObj.length === 0) {
        console.error("Failed to create visualObj from ABC notation.");
        return;
      }
      try {
        const synth = new ABCJS.synth.CreateSynth();
        const synthControl = new ABCJS.synth.SynthController();
        await synth.init({ visualObj: visualObj[0], options: { soundFontUrl: "/soundfonts/" } });
        await synthControl.setTune(visualObj[0], false, {});
        synthControl.load("#player", null, {
          displayRestart: true,
          displayPlay: true,
          displayProgress: true,
          displayWarp: true,
          displayVolume: true,
        });
      } catch (error) {
        console.error("Error initializing or playing the tune", error);
      }
    }, 100);
  };

  const handlePageChange = (data) => {
    setCurrentPage(data.selected);
  };


  const handleAddTune = async (tune) => {
    try {
      if (!currentPrincipal) {
        alert("You must be logged in to add tunes.");
        //navigate('/login');
        setSidebarOpen(true);
        return;
      }

      const tuneData = await actor.get_original_tune(tune.title);
      const username = tune.username ? String(tune.username).trim() : "Tunebook";

      if (!tuneData) {
        console.error("Failed to retrieve tune data.");
        return;
      }

      const success = await actor.add_tune(currentPrincipal, tune.title, tuneData, false, username);
      if (success) {
        setUserTunes((prev) => [...prev, tune.title]);
      }
    } catch (error) {
      console.error("Error adding tune to profile:", error);
    }
  };

    // Toggle Add Tune Modal
    const toggleAddTuneModal = () => {
      setShowAddTuneModal(!showAddTuneModal);
      setValidationError(""); // Clear validation error when modal is toggled
    };
  
    // ABCJS live preview effect
    useEffect(() => {
      if (showAddTuneModal) {
        ABCJS.renderAbc("abc-preview", newTuneData || abcTemplate);
      }
    }, [newTuneData, showAddTuneModal]);
  



  const validateABCNotation = (abc) => {
    const hasX = abc.match(/^X:\s*\d+/m);
    const hasT = abc.match(/^T:\s*.+/m);
    const hasK = abc.match(/^K:\s*.+/m);
    return hasX && hasT && hasK;
  };

  const handleAddTuneSubmit = async (e) => {
    
    e.preventDefault();
    setLoading(true);
    try {
    if (!currentPrincipal) {
      alert("You must be logged in to add tunes.");
      navigate('/login');
      //setSidebarOpen(true);
      return;
    }

    if (!validateABCNotation(newTuneData)) {
      setValidationError("Invalid ABC notation. Ensure it includes 'X:', 'T:', and 'K:' fields.");
      return;
    }

    const title = newTuneData.match(/^T:\s*(.*)/m)?.[1]?.trim();
    if (!title) {
      setValidationError("Please ensure your ABC notation includes a title with 'T:'.");
      return;
    }
    const profileArray = await actor.authentication(currentPrincipal);
    const Profile_username = profileArray?.[0]?.username;

      const success = await actor.add_tune(
        currentPrincipal,
        title,
        newTuneData,
        false,
        Profile_username
      );

      if (success) {
        alert("Tune added successfully!");
        setValidationError("");  
        setNewTuneData(`X: 1
T: Tune Title
Z: Composer (optional)
S: Source or link (optional)
R: Rhythm (e.g., jig, reel)
M: 4/4
K: D

abc def | gfe dcB | ...`);

        toggleAddTuneModal();  
        fetchTunes();
        setLoading(false);
      } else {
        alert("A tune with this title already exists.");
      }
    } catch (error) {
      console.error("Error adding tune:", error);
      alert("Failed to add tune. Please try again.");
      setLoading(false);
    }
    setLoading(false);
  };


  return (

<div className="tune-app-container" style={{ color: 'white' }}>

    {loading && <LoadingSpinner />}

    

    <div className="mid-app-container" >      
    <p style={{ fontSize: '18px', lineHeight: '1.6', justifyContent: 'center', textAlign: 'justify'}}>
                  Explore a large collection of over <strong>18,000 tunes</strong>! 
                  Tunebook is a powerful platform for musicians to <strong>create, store, and share</strong> their tunes with the world.
                  Whether you're looking for inspiration or want to build your own digital library, Tunebook has you covered. 
                  
                  Connect with other Celtic musicians and find mutual tunes with them for your sessions. Find the latest sessions happening around your area. 
    </p>          
    </div>

    <div className="mid-container" >

    <button  className="add-new-tunes" 
            onClick={toggleAddTuneModal}>
              + Add a New Tune
    </button>

   </div>

  <h2 className="title" style={{ fontSize: '30px', textAlign: 'center', marginBottom: '20px' }}>Browse Tunes</h2>

  <div className="search-filter" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
    <input
      className="search-input"
      placeholder="Search for tunes"
      value={searchTitle}
      onChange={(e) => { setSearchTitle(e.target.value); setCurrentPage(0); }}
      style={{
        flex: 1,
        marginRight: '10px',
        padding: '10px',
        borderRadius: '8px',
        backgroundColor: '#222',
        color: '#fff',
      }}
    />
    
            <Select
              value={rhythm}
              onChange={(value) => setRhythm(value)}
              options={rhythmInfo}
              className="select-filter"
              styles={{
                container: (base) => ({
                  ...base,
                  width: '200px',
                  marginRight: '10px',
                  
                }),
                control: (base) => ({
                  ...base,
                  backgroundColor: '#222',
                  border: '2px solid #58b0d2;',
                  color: '#fff',
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#fff',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #58d289',
                }),
                option: (base, { isFocused, isSelected }) => ({
                  ...base,
                  backgroundColor: isSelected ? '#58d289' : isFocused ? '#444' : '#333',
                  color: isSelected ? '#000' : '#fff',
                  cursor: 'pointer',
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#888',
                }),
              }}
            />

            <Select
              value={key}
              onChange={(value) => setKey(value)}
              options={keyInfo}
              className="select-filter"
              styles={{
                container: (base) => ({
                  ...base,
                  width: '200px',
                }),
                control: (base) => ({
                  ...base,
                  backgroundColor: '#222',
                  border: '2px solid #58b0d2;',
                  color: '#fff',
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#fff',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #58d289',
                }),
                option: (base, { isFocused, isSelected }) => ({
                  ...base,
                  backgroundColor: isSelected ? '#58d289' : isFocused ? '#444' : '#333',
                  color: isSelected ? '#000' : '#fff',
                  cursor: 'pointer',
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#888',
                }),
              }}
            />
          </div>

          <Modal
              isOpen={showAddTuneModal}
              onRequestClose={toggleAddTuneModal}
              contentLabel="Add Tune"
              ariaHideApp={false}
              className="add-tune-modal"
              overlayClassName="modal-overlay"
            >
              <h2>Add New Tune</h2>
              <form onSubmit={handleAddTuneSubmit}>
                <label>
                  Tune Data (ABC Notation):
                  <textarea
                    value={newTuneData}
                    onChange={(e) => setNewTuneData(e.target.value)}
                    rows="10"
                    required
                  />
                </label>
                <p className="abc-instructions">
                  Enter ABC notation. Ensure it includes at least an "X:", "T:", and "K:" field.
                </p>

                {validationError && <p className="error-message">{validationError}</p>}

                <button type="submit">Save Tune</button>
                <button type="button" onClick={toggleAddTuneModal}>
                  Cancel
                </button>
              </form>

              
              <h3>ABC Notation Preview:</h3>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              <div id="abc-preview">
              </div>
              </div>

            </Modal>


            {/* Tune Details with Tabs */}
            {currentTuneData && (
              <div className="tune-detail-view">
                <h2> </h2>
                
                {/* Tab Buttons */}
                <div className="tab-buttons">
                  <button 
                    className={selectedTab === "abc" ? "active" : ""} 
                    onClick={() => setSelectedTab("abc")}
                  >
                    ABC
                  </button>
                  <button 
                    className={selectedTab === "sheet" ? "active" : ""} 
                    onClick={() => setSelectedTab("sheet")}
                  >
                    Sheet Music
                  </button>
                </div>

                {/* ABC Notation */}
                {selectedTab === "abc" && (
                  <div className="abc-container">
                    <pre>{abcNotation}</pre>
                    
                    <button
                    className="download-btn"
                    onClick={() => {
                      const blob = new Blob([abcNotation], { type: "text/plain" });
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(blob);
                      link.download = `${currentTuneTitle || "abc_tune"}`; // Default filename
                      document.body.appendChild(link); // Append link to the document body
                      link.click(); // Programmatically click the link to trigger the download
                      document.body.removeChild(link); // Clean up by removing the link element
                    }}
                  >
                    Download
                  </button>

                  <button 
                    className="copy-btn" 
                    onClick={() => {
                      navigator.clipboard.writeText(abcNotation)
                        .then(() => {
                          alert("Copied to clipboard!"); // Show success message
                        })
                        .catch(() => {
                          alert("Failed to copy!"); // Show error message if copying fails
                        });
                    }}
                  >
                    Copy ABC
                  </button>


                  </div>
                )}

                {/* Sheet Music */}
                {selectedTab === "sheet" && (
                  <div id="tunedata" className="abc-notation"></div>
                )}
                
                <div id="player" className="abc-player"></div>
                
              </div>


              
            )}

      <div className="tune-list">
        {orgTunes.length > 0 ? (
          orgTunes.map((tune, index) => (
            <div
              key={index}
              className="tune-card"
              onClick={() => onSelectTune(tune)}
            >
              <div className="tune-details">
              <p className="tune-title">
              <span className="play-icon-circle">
                <svg
                  className="play-icon"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8 5v10l8-5z" /> 
                </svg>
              </span>
              {cleanTitle(tune.title.split("_+TBusername+:_")[0])}
            </p>
            
            <p className="tune-id">
            Added by: {tune.username && String(tune.username).trim() !== "" ? tune.username : "Tunebook"}
            </p>

                <button
                  className="add-tune-button"
                  onClick={() => handleAddTune(tune)}
                  disabled={userTunes.includes(tune.title)}  
                >
                  {userTunes.includes(tune.title) ? "Added" : "+ Add to My Tunebook"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-tunes">No tunes found. Try adjusting your search or filters.</p>
        )}

        {/* Library Card */}
        {libraryTunes.map((library, index) => (
          <div
            key={index}
            className="tune-card library-card"
            onClick={() => setCurrentLibrary(currentLibrary === library ? null : library)}
          >
            <div className="tune-details">
              <p className="tune-title">{`📚 ${library.baseTitle} Tune Library`}</p>
              <button
                className="add-tune-button"
                onClick={() => setCurrentLibrary(currentLibrary === library ? null : library)}
              >
                {currentLibrary === library ? "📚 Collapse" : "📚 Expand"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Display Library Tunes (if any are selected) */}
      {currentLibrary && (
        <div className="tune-library-list">
          <h3>{currentLibrary.baseTitle} Versions: </h3>
          {currentLibrary.versions.map((tune, idx) => (
            <div key={idx} className="tune-card" onClick={() => onSelectTune(tune)}>
              <div className="tune-details">
                
                <p className="tune-title">
                
                <span className="play-icon-circle">
                  <svg
                    className="play-icon"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M8 5v10l8-5z" /> 
                  </svg>
                </span>
                {cleanTitle(tune.title.split("_")[0])} 
              </p>

                <p className="tune-id">{tune.title.split("_")[1]}
                 </p>

                 <p className="tune-id">
                 Added by: {tune.username && String(tune.username).trim() !== "" ? tune.username : "Tunebook"} 
                 </p>
                
                <button
                  className="add-tune-button"
                  onClick={() => handleAddTune(tune)}
                  disabled={userTunes.includes(tune.title)}
                >
                  {userTunes.includes(tune.title) ? "Added!" : "+ Add to My Tunebook"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="pagination-wrapper">
        <ReactPaginate
          previousLabel={"Previous"}
          nextLabel={"Next"}
          breakLabel={"..."}
          pageCount={totalPages}
          marginPagesDisplayed={2}
          pageRangeDisplayed={5}
          onPageChange={handlePageChange}
          containerClassName={"pagination"}
          pageClassName={"page-item"}
          activeClassName={"active"}
          previousClassName={"prev"}
          nextClassName={"next"}
        />
      </div>
    </div>
  );
}
export default Tunes;
