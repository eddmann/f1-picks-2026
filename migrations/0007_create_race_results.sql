-- Race results table
CREATE TABLE race_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  race_position INTEGER,
  sprint_position INTEGER,
  race_points INTEGER NOT NULL DEFAULT 0,
  sprint_points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(race_id, driver_id)
);

CREATE INDEX idx_race_results_race_id ON race_results(race_id);
CREATE INDEX idx_race_results_driver_id ON race_results(driver_id);
