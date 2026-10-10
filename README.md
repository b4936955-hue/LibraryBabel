# LibraryBabel

Open or host `babel-loader.html` (or `index.html`, which is the same loader). It never changes.
It reads `app/manifest.json` from this repo on GitHub, downloads every piece listed there, and runs them together.

- `app/shell.html` - the page frame
- `app/style.css` - all the styling
- `app/js/core.js` - engine, room list, router, and legacy/polyphonic music encodings
- `app/js/settings.js` - the Settings page (60+ options, searchable, saved in the browser)
- `app/js/random.js` - pure random generators (uniform length 1 to link max, every symbol random)
- `app/js/home.js` - home, about, shelf
- `app/js/room.js` - every text-style room (letters, numbers, colors, DNA, bitmaps, dice, emoji)
- `app/js/library.js` - the wall of bookshelves at the bottom of each page
- `app/js/pictures.js` - Pictures
- `app/js/sound.js` - Sound
- `app/js/synth.js` - instruments, drum kits and the player (tempo, swing, humanize, reverb, crackle, looping)
- `app/js/music.js` - the record, the record player page, the monkeys, and melody-first mp3-to-notes transcription
- `app/js/search.js` - Search
- `app/js/main.js` - starts the app
- `data/words.txt` - word list for Random word and "only real words"

To add a file, list it in `app/manifest.json`. Push, and every loader picks it up.
