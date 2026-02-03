-- Races table
CREATE TABLE races (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  circuit TEXT NOT NULL,
  country_code TEXT NOT NULL,
  has_sprint BOOLEAN NOT NULL DEFAULT FALSE,
  quali_time TEXT NOT NULL,
  sprint_quali_time TEXT,
  race_time TEXT NOT NULL,
  sprint_time TEXT,
  is_wild_card BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'in_progress', 'completed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(season_id, round)
);

CREATE INDEX idx_races_season_id ON races(season_id);
CREATE INDEX idx_races_round ON races(round);
CREATE INDEX idx_races_status ON races(status);
CREATE INDEX idx_races_quali_time ON races(quali_time);
