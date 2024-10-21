import React, { useEffect, useState } from "react";
import ABCJS from "abcjs";
import 'abcjs/abcjs-audio.css';
import ReactPaginate from "react-paginate";
import Select from 'react-select';
import { keyInfo, rhythmInfo } from './variables';  


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


  const [visualObj, setVisualObj] = useState(null);
  const synth = new ABCJS.synth.CreateSynth();
  const synthControl = new ABCJS.synth.SynthController();

  // Fetch tunes whenever the page, search, or filter changes
  useEffect(() => {
    fetchUserTunes();
    fetchTunes();
  }, [currentPage, searchTitle, key, rhythm, actor]);

    // Re-initialize sheet music rendering when the "Sheet Music" tab is selected
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
      const userTuneTitles = tuneList.map(tune => tune.title);  // Extract titles
      setUserTunes(userTuneTitles);
    } catch (error) {
      console.error("Error fetching user's tunes:", error);
    }
  };

  // Fetch and filter tunes based on the current search and filters
  const fetchTunes = async () => {
    try {
      const response = await actor.filter_tunes(
        searchTitle,
        rhythm.value.toLowerCase(),
        key.value,
        currentPage
      );

      const tunes = response[0];

      // Group library tunes (with multiple versions) and set them separately
      const libraryTunes = groupLibraryTunes(tunes);
      setLibraryTunes(libraryTunes);

      // Filter out the library tunes from the regular tune list
      const regularTunes = tunes.filter(tune =>
        !libraryTunes.some(lib => lib.baseTitle === tune.title.split('_')[0])
      );
      setOrgTunes(regularTunes);

      setTotalPages(Math.ceil(response[1] / tunesPerPage)); // Calculate total pages
    } catch (error) {
      console.error("Error fetching tunes:", error);
    }
  };

  // Group tunes by base title (without the version suffix)
  const groupLibraryTunes = (tunes) => {
    const groupedLibraryTunes = {};

    tunes.forEach((tune) => {
      const [baseTitle] = tune.title.split('_');
      if (!groupedLibraryTunes[baseTitle]) {
        groupedLibraryTunes[baseTitle] = [];
      }
      groupedLibraryTunes[baseTitle].push(tune);
    });

    // Filter out the ones with only one version
    return Object.entries(groupedLibraryTunes).filter(
      ([, versions]) => versions.length > 1
    ).map(([baseTitle, versions]) => ({
      baseTitle,
      versions,
    }));
  };

  // Handle selecting a tune
  const onSelectTune = async (selectedTune) => {
    if (!selectedTune) return;
    try {
      setCurrentLibrary(null);
      const tuneData = await actor.get_original_tune(selectedTune.title);
      setCurrentTuneData(tuneData);
      setCurrentTuneTitle(selectedTune.title);
      iniABCJS(tuneData);  // Initialize ABCJS with the selected tune
      setAbcNotation(tuneData);
    } catch (error) {
      console.error("Error fetching tune data:", error);
    }
  };

  // Initialize ABCJS for the selected tune with local soundfonts
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
        });
      } catch (error) {
        console.error("Error initializing or playing the tune", error);
      }
    }, 100);
  };

  // Handle pagination
  const handlePageChange = (data) => {
    setCurrentPage(data.selected);
  };

  // Handle adding a tune
  const handleAddTune = async (tune) => {
    try {
      if (!currentPrincipal) {
        alert("You must be logged in to add tunes.");
        setSidebarOpen(true);
        return;
      }

      const tuneData = await actor.get_original_tune(tune.title);
      if (!tuneData) {
        console.error("Failed to retrieve tune data.");
        return;
      }

      const success = await actor.add_tune(currentPrincipal, tune.title, tuneData, false);
      if (success) {
        setUserTunes((prev) => [...prev, tune.title]);  // Mark this tune as added
      }
    } catch (error) {
      console.error("Error adding tune to profile:", error);
    }
  };

  return (
    <div className="tune-app-container">
      <h2 className="title">Browse Tunes</h2>

      {/* Search Input and Filters */}
      <div className="search-filter">
        <input
          className="search-input"
          placeholder="Search for tunes"
          value={searchTitle}
          onChange={(e) => { setSearchTitle(e.target.value); setCurrentPage(0); }}
        />
        <Select 
          value={rhythm} 
          onChange={(value) => setRhythm(value)} 
          options={rhythmInfo} 
          className="select-filter"
        />
        <Select 
          value={key} 
          onChange={(value) => setKey(value)} 
          options={keyInfo} 
          className="select-filter"
        />
      </div>

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


      {/* Tune List */}
      <div className="tune-list">
        {orgTunes.length > 0 ? (
          orgTunes.map((tune, index) => (
            <div
              key={index}
              className="tune-card"
              onClick={() => onSelectTune(tune)}
            >
              <div className="tune-details">
                <p className="tune-title">{tune.title.replaceAll(".abc", "")}</p>
                <p className="tune-id">{tune.title.split("_")[1]}</p>
                <button
                  className="add-tune-button"
                  onClick={() => handleAddTune(tune)}
                  disabled={userTunes.includes(tune.title)}  // Disable button if already added
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
                onClick={() => {
                  
                  setCurrentLibrary(currentLibrary === library ? null : library);
                }}
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
                <p className="tune-title">{tune.title.replaceAll(".abc", "")}</p>
                <p className="tune-id">{tune.title.split("_")[1]}</p>
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
          pageCount={totalPages}  // Total number of pages
          marginPagesDisplayed={2}
          pageRangeDisplayed={5}
          onPageChange={handlePageChange}
          containerClassName={"pagination"}   // Apply pagination styles
          pageClassName={"page-item"}         // Class for each page number
          activeClassName={"active"}          // Active page class
          previousClassName={"prev"}          // Class for "Previous" link
          nextClassName={"next"}              // Class for "Next" link
        />
      </div>
    </div>
)};
export default Tunes;
