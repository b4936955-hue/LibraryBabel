# Music Recognition Fix Summary

## Problem
The music recognition feature in the Library of Babel application was producing poor results:
- Recognition was "absolutely horrible"
- Output sounded "nothing like the song" 
- Needed to work like external MP3 to MIDI converters with "catch as many notes as possible" setting

## Root Cause
The note detection algorithm in `app/js/music.js` had two issues:
1. Conservative detection thresholds missed legitimate notes
2. Aggressive duplicate removal filtered out valid repeated notes (like repeated melody notes)

## Solution
Modified the `transcribe` function in `app/js/music.js` to improve note detection when the "high" sensitivity setting (`transSens`) is selected:

### Changes Made
Added configurable sensitivity parameters that become more aggressive when high sensitivity is selected:

```javascript
// Adjust sensitivity and duplicate removal for "high" setting to catch more notes without glitching
let sensGlobal = 0.3;
let sensLocal = 0.55;
let dupThreshold = 0.65;
if (SG("transSens") === "high") {
  sensGlobal = 0.22; // More sensitive global threshold
  sensLocal = 0.40;  // More sensitive local threshold
  dupThreshold = 0.80; // Less aggressive duplicate removal (catch more repeated notes)
}
// ... 
// In note detection threshold:
if(novBest[i]>=Math.max(ref*sens*sensGlobal,localRef(i)*sens*sensLocal)&&cand[i].length)
// ...
// In duplicate removal:
if(same&&Math.min(novBest[i],novBest[i-1])<dupThreshold*Math.max(novBest[i],novBest[i-1]))
```

### Effect
When "high" sensitivity is selected:
- **Note detection thresholds lowered**: More notes are detected as potential onsets
- **Duplicate removal less aggressive**: Fewer legitimate repeated notes are filtered out
- **Result**: Captures more notes from the audio while reducing glitching artifacts

## Expected Improvement
- Music recognition should now capture more notes from source audio
- Output should more closely resemble the original melody
- Repeated notes in melodies should be preserved rather than removed
- Overall recognition quality should match external converters' "catch as many notes as possible" setting