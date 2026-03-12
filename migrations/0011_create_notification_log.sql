CREATE TABLE notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  sent_at TEXT NOT NULL DEFAULT (datetime('now'))
);
