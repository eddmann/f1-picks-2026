-- Seasons table
CREATE TABLE seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_seasons_year ON seasons(year);
CREATE INDEX idx_seasons_is_active ON seasons(is_active);
