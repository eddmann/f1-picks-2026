-- Drivers table
CREATE TABLE drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  team TEXT NOT NULL,
  team_color TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(season_id, code)
);

CREATE INDEX idx_drivers_season_id ON drivers(season_id);
CREATE INDEX idx_drivers_code ON drivers(code);
