-- User season stats table
CREATE TABLE user_season_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  races_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, season_id)
);

CREATE INDEX idx_user_season_stats_user_id ON user_season_stats(user_id);
CREATE INDEX idx_user_season_stats_season_id ON user_season_stats(season_id);
CREATE INDEX idx_user_season_stats_total_points ON user_season_stats(total_points DESC);
