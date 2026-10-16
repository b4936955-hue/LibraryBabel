# LibraryBabel

Open or host `babel-loader.html` (or `index.html`, which is the same loader). It never changes.
It reads `app/manifest.json` from this repo on GitHub, downloads every piece listed there, and runs them together.

- `app/shell.html` - the page frame
- `app/style.css` - base styling
- `app/ui.css` - the design layer on top of it: flat controls, one radius scale, no glow or tilt, the hexagon logo
- `app/js/core.js` - engine, room list, router, and legacy/polyphonic music encodings
- `app/js/settings.js` - the Settings page (60+ options, searchable, saved in the browser)
- `app/js/random.js` - pure random generators (uniform length 1 to link max, every symbol random)
- `app/js/home.js` - home, about, shelf
- `app/js/room.js` - every text-style room (letters, numbers, colors, DNA, bitmaps, dice, emoji)
- `app/js/rooms2.js` - the Cards, Braille, Runes and Kana rooms (add a new alphabet room by adding one entry here)
- `app/js/ui.js` - interface helpers: grouped room actions, the settings section bar, empty states
- `app/js/library.js` - the wall of bookshelves at the bottom of each page
- `app/js/pictures.js` - Pictures
- `app/js/sound.js` - Sound
- `app/js/synth.js` - instruments, drum kits and the player. A record is turned into a timed plan, then played live or rendered offline. The "Match the recording" instrument uses the overtones and fade speed measured from the audio
- `app/js/transcribe.js` - the listener: beat tracking, an NMF note finder that learns the instrument, drums, and the loudness/octave sidecar
- `app/js/match.js` - scores how close a rebuilt song sounds to the original, and picks the closest reading
- `app/js/music.js` - the record player, piano roll, the monkeys, MIDI and WAV export, and the song-to-record panel
- `app/js/search.js` - Search
- `app/js/features.js` - toasts, keyboard shortcuts, quick jump (Ctrl+K), recent pages, page of the day
- `app/js/main.js` - starts the app
- `data/words.txt` - word list for Random word and "only real words"

To add a file, list it in `app/manifest.json`. Push, and every loader picks it up.

## Piano samples
`data/piano/` holds 30 recorded notes from the Salamander Grand Piano by Alexander Holm, licensed CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/). They are loaded the first time you press play. `standalone.html` has them embedded so it works when opened straight from disk.

## Rebuilding the offline copy
Run `python build_standalone.py` after changing anything in `app/`. It rebuilds `standalone.html` and reuses the piano samples already inside it.
