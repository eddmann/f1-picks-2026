-- Add cancelled race status and mark cancelled 2026 rounds.
--
-- D1-safe table rebuild: D1 silently ignores `PRAGMA foreign_keys = OFF`,
-- so dropping `races` cascades through `picks` and `race_results`. We work
-- around it by snapshotting FK-bearing rows to backup tables, emptying the
-- originals so DROP has nothing to cascade through, then restoring.

CREATE TABLE picks_backup AS SELECT * FROM picks;
CREATE TABLE race_results_backup AS SELECT * FROM race_results;

DELETE FROM picks;
DELETE FROM race_results;

CREATE TABLE races_new (
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
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(season_id, round)
);

INSERT INTO races_new (
  id,
  season_id,
  round,
  name,
  location,
  circuit,
  country_code,
  has_sprint,
  quali_time,
  sprint_quali_time,
  race_time,
  sprint_time,
  is_wild_card,
  status,
  created_at
)
SELECT
  id,
  season_id,
  round,
  name,
  location,
  circuit,
  country_code,
  has_sprint,
  quali_time,
  sprint_quali_time,
  race_time,
  sprint_time,
  is_wild_card,
  status,
  created_at
FROM races;

DROP TABLE races;
ALTER TABLE races_new RENAME TO races;

CREATE INDEX idx_races_season_id ON races(season_id);
CREATE INDEX idx_races_round ON races(round);
CREATE INDEX idx_races_status ON races(status);
CREATE INDEX idx_races_quali_time ON races(quali_time);

INSERT INTO picks SELECT * FROM picks_backup;
INSERT INTO race_results SELECT * FROM race_results_backup;

DROP TABLE picks_backup;
DROP TABLE race_results_backup;

UPDATE races
SET status = 'cancelled'
WHERE season_id = (SELECT id FROM seasons WHERE year = 2026)
  AND name IN ('Bahrain Grand Prix', 'Saudi Arabian Grand Prix');

DELETE FROM race_results
WHERE race_id IN (
  SELECT id
  FROM races
  WHERE season_id = (SELECT id FROM seasons WHERE year = 2026)
    AND status = 'cancelled'
);

UPDATE user_season_stats
SET
  total_points = (
    SELECT COALESCE(SUM(rr.race_points + rr.sprint_points), 0)
    FROM picks p
    JOIN races r ON p.race_id = r.id
    LEFT JOIN race_results rr ON rr.race_id = r.id AND rr.driver_id = p.driver_id
    WHERE p.user_id = user_season_stats.user_id
      AND r.season_id = user_season_stats.season_id
      AND r.status = 'completed'
  ),
  races_completed = (
    SELECT COUNT(DISTINCT r.id)
    FROM picks p
    JOIN races r ON p.race_id = r.id
    LEFT JOIN race_results rr ON rr.race_id = r.id AND rr.driver_id = p.driver_id
    WHERE p.user_id = user_season_stats.user_id
      AND r.season_id = user_season_stats.season_id
      AND r.status = 'completed'
  )
WHERE season_id = (SELECT id FROM seasons WHERE year = 2026);
