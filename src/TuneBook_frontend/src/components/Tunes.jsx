import React, { useEffect, useState } from "react";
import ABCJS from "abcjs";
import 'abcjs/abcjs-audio.css';
import ReactPaginate from "react-paginate";
import Select from 'react-select';
import { keyInfo, rhythmInfo } from './variables';  // Import key and rhythm filters
import { soundfontMapper } from './soundfontMapper';  // Import the soundfont mapper for local fonts

function Tunes({ actor }) {
  const [orgTunes, setOrgTunes] = useState([]);  // Original tunes
  const [currentTuneData, setCurrentTuneData] = useState("");
  const [currentTuneTitle, setCurrentTuneTitle] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const tunesPerPage = 10;  // Number of tunes per page
  const [searchTitle, setSearchTitle] = useState('');
  const [key, setKey] = useState({ value: "all", label: "Key" });
  const [rhythm, setRhythm] = useState({ value: "all", label: "Rhythm" });

  const synth = new ABCJS.synth.CreateSynth();
  const synthControl = new ABCJS.synth.SynthController();
  const [visualObj, setVisualObj] = useState(null);

  // Fetch tunes whenever the page, search, or filter changes
  useEffect(() => {
    fetchTunes();
  }, [currentPage, searchTitle, key, rhythm, actor]);

  // Fetch tunes based on the current filters and page
  const fetchTunes = async () => {
    try {
      const response = await actor.filter_tunes(
        searchTitle, 
        rhythm.value.toLowerCase(), 
        key.value, 
        currentPage
      );
      setOrgTunes(response[0]);
      setTotalPages(Math.ceil(response[1] / tunesPerPage));  // Calculate total pages
    } catch (error) {
      console.error("Error fetching tunes:", error);
    }
  };

  // Handle selecting a tune
  const onSelectTune = async (selectedTune) => {
    if (!selectedTune) return;
    try {
      const tuneData = await actor.get_original_tune(selectedTune.title);
      setCurrentTuneData(tuneData);
      setCurrentTuneTitle(selectedTune.title);
      iniABCJS(tuneData);  // Initialize ABCJS with the selected tune
    } catch (error) {
      console.error("Error fetching tune data:", error);
    }
  };

  // Initialize ABCJS for the selected tune with local soundfonts
  const iniABCJS = async (tuneData) => {
    if (!tuneData) return;

    // Render ABC notation
    const visualObj = ABCJS.renderAbc("tunedata", tuneData, { responsive: "resize" });

    // Check if visualObj is valid
    if (!visualObj || visualObj.length === 0) {
      console.error("Failed to create visualObj from ABC notation.");
      return;
    }

    try {
      // Initialize synth with local soundfonts
      await synth.init({
        visualObj: visualObj[0],
        options: {
          soundFontUrl: "/soundfonts/",  // Local soundfont folder
          //preloadedSoundFonts: soundfontMapper,  // Use the local soundfont mapper
        },
      });

      // Set up the synth controls for playback
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
  };

  // Handle pagination
  const handlePageChange = (data) => {
    setCurrentPage(data.selected);
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
                <span>🎵</span>
                <p className="tune-title">{tune.title.replaceAll(".abc", "")}</p>
                <p className="tune-id">{tune.title.split("_")[1]}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-tunes">No tunes found. Try adjusting your search or filters.</p>
        )}
      </div>

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

      {/* Tune Details */}
      {currentTuneData && (
        <div className="tune-detail-view">
          <h2 className="tune-title">{currentTuneTitle}</h2>
          <div id="tunedata" className="abc-notation"></div>
          <div id="player" className="abc-player"></div>
        </div>
      )}
    </div>
  );
}

export default Tunes;