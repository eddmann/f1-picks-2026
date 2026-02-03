-- Picks table
CREATE TABLE picks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, race_id)
);

CREATE INDEX idx_picks_user_id ON picks(user_id);
CREATE INDEX idx_picks_race_id ON picks(race_id);
CREATE INDEX idx_picks_driver_id ON picks(driver_id);
