-- Analytics events for harisrinivasan.dev. No cookies and no IP addresses are stored.
-- vid is a hash of the visitor's IP and browser with a salt that is replaced every day, so the
-- same person can be counted once per day but cannot be followed from one day to the next.
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  ts INTEGER NOT NULL,          -- unix milliseconds
  day TEXT NOT NULL,            -- YYYY-MM-DD, UTC
  vid TEXT NOT NULL,            -- daily visitor hash
  sid TEXT NOT NULL,            -- random per browser tab session
  type TEXT NOT NULL,           -- view | click | play | chapter | arcade | leave
  name TEXT,                    -- what was clicked or reached
  path TEXT,
  ref TEXT,                     -- referring host, views only
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  country TEXT,
  device TEXT,                  -- mobile | tablet | desktop
  value INTEGER                 -- seconds of visible time, leave events only
);
CREATE INDEX events_day_type ON events (day, type);
CREATE INDEX events_sid ON events (sid);

-- One random salt per UTC day. Older salts are deleted, which makes old hashes unlinkable.
CREATE TABLE salts (
  day TEXT PRIMARY KEY,
  salt TEXT NOT NULL
);
