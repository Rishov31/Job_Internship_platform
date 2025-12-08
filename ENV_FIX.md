# Environment Variable Fix

## Issue Found

Your `.env` file has a typo in the Stream API variable names:

**Current (WRONG):**
```env
STEAM_API_KEY=ustm79tx4f9c
STEAM_API_SECRET=fz2mvayrnzshe6htch98ayx6q7x6msxf6s9ykx2a939gtkdun6u3y75yhrctr2gp
```

**Should be (CORRECT):**
```env
STREAM_API_KEY=ustm79tx4f9c
STREAM_API_SECRET=fz2mvayrnzshe6htch98ayx6q7x6msxf6s9ykx2a939gtkdun6u3y75yhrctr2gp
```

## Fix Steps

1. Open `backend/.env` file
2. Change `STEAM_API_KEY` to `STREAM_API_KEY`
3. Change `STEAM_API_SECRET` to `STREAM_API_SECRET`
4. Save the file
5. **Restart your backend server** (important!)

After making these changes, the Stream Video service should initialize correctly and video calling will work.

