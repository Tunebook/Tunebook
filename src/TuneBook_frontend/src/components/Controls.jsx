import { useState, useEffect, useRef, useCallback } from 'react';
import ABCJS from 'abcjs';

const Controls = ({
  synth,  // ABCJS Synth object passed as prop
  synthControl,
  visualObj,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(60); // Volume state
  const [muteVolume, setMuteVolume] = useState(false); // Mute state

  const playAnimationRef = useRef();

  // This function will keep the progress updated (like your repeat function)
  const updateProgress = useCallback(() => {
    // Get the current time from ABCJS playback
    const currentTime = synthControl.currentTime();

    // Update your UI for progress (assuming you have a progress bar)
    // E.g., update a progress bar's value to reflect the current time.

    // Request animation frame to continue the loop
    playAnimationRef.current = requestAnimationFrame(updateProgress);
  }, [synthControl]);

  useEffect(() => {
    if (isPlaying) {
      synthControl.play(); // Play the ABCJS tune
      playAnimationRef.current = requestAnimationFrame(updateProgress);
    } else {
      synthControl.pause(); // Pause ABCJS playback
      cancelAnimationFrame(playAnimationRef.current); // Stop animation when paused
    }
  }, [isPlaying, synthControl, updateProgress]);

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev); // Toggle play/pause
  };

  useEffect(() => {
    // Adjust volume in ABCJS synth (0 to 1 scale)
    synth.volume = muteVolume ? 0 : volume / 100;
  }, [volume, muteVolume, synth]);

  return (
    <div className="controls-wrapper">
      <div className="controls">
        <button onClick={togglePlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
      <div className="volume">
        <button onClick={() => setMuteVolume((prev) => !prev)}>
          {muteVolume || volume < 5 ? "🔇" : volume < 40 ? "🔉" : "🔊"}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          style={{
            background: `linear-gradient(to right, #f50 ${volume}%, #ccc ${volume}%)`,
          }}
        />
      </div>
    </div>
  );
};

export default Controls;
