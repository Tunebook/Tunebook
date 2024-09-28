import React, { useEffect } from 'react';
import ABCJS from 'abcjs';
import { soundfontMapper } from './soundfontMapper';  // Import the soundfont mapper

function AbcPlayer({ abcNotation }) {
  useEffect(() => {
    // Render the ABC notation into a visual staff
    const visualObj = ABCJS.renderAbc("abc-container", abcNotation, {
      responsive: 'resize',
    });

    if (!visualObj || visualObj.length === 0) {
      console.error("Failed to create visualObj from ABC notation.");
      return;
    }

    // Initialize the synth for audio playback
    const synth = new ABCJS.synth.CreateSynth();
    const synthControl = new ABCJS.synth.SynthController();

    const initSynth = async () => {
      try {
        // Initialize synth with local soundfonts
        await synth.init({
          visualObj: visualObj[0],
          options: {
            soundFontUrl: "/soundfonts/acoustic_grand_piano-mp3",  // Local folder path
            preloadedSoundFonts: soundfontMapper,  // Use the soundfont mapper
          },
        });

        // Bind synth controls (play/pause) to the player element
        synthControl.setTune(visualObj[0], false, {}).then(() => {
          synthControl.load("#abc-audio-controls", null, {
            displayRestart: true,
            displayPlay: true,
            displayProgress: true,
            displayWarp: true,
          });
        });
      } catch (error) {
        console.error("Error initializing ABCJS playback:", error);
      }
    };

    initSynth();
  }, [abcNotation]);

  return (
    <div>
      <div id="abc-container" className="abc-notation"></div>
      <div id="abc-audio-controls"></div>
    </div>
  );
}

export default AbcPlayer;
