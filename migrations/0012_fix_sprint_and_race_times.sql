-- Fix sprint weekend session times (sprint_quali_time and sprint_time were swapped + wrong day)
-- Fix race_time for Canada, United States, and Las Vegas
-- Correct data sourced from OpenF1 API: https://api.openf1.org/v1/sessions?year=2026

-- R2 China: sprint_quali Fri 13th, sprint Sat 14th
UPDATE races SET
  sprint_quali_time = '2026-03-13T07:30:00Z',
  sprint_time = '2026-03-14T03:00:00Z'
WHERE season_id = 1 AND round = 2;

-- R6 Miami: sprint_quali Fri 1st, sprint Sat 2nd
UPDATE races SET
  sprint_quali_time = '2026-05-01T20:30:00Z',
  sprint_time = '2026-05-02T16:00:00Z'
WHERE season_id = 1 AND round = 6;

-- R7 Canada: sprint_quali Fri 22nd, sprint Sat 23rd, race Sun 24th
UPDATE races SET
  sprint_quali_time = '2026-05-22T20:30:00Z',
  sprint_time = '2026-05-23T16:00:00Z',
  race_time = '2026-05-24T20:00:00Z'
WHERE season_id = 1 AND round = 7;

-- R11 Britain: sprint_quali Fri 3rd, sprint Sat 4th
UPDATE races SET
  sprint_quali_time = '2026-07-03T15:30:00Z',
  sprint_time = '2026-07-04T11:00:00Z'
WHERE season_id = 1 AND round = 11;

-- R14 Netherlands: sprint_quali Fri 21st, sprint Sat 22nd
UPDATE races SET
  sprint_quali_time = '2026-08-21T14:30:00Z',
  sprint_time = '2026-08-22T10:00:00Z'
WHERE season_id = 1 AND round = 14;

-- R18 Singapore: sprint_quali Fri 9th, sprint Sat 10th
UPDATE races SET
  sprint_quali_time = '2026-10-09T12:30:00Z',
  sprint_time = '2026-10-10T09:00:00Z'
WHERE season_id = 1 AND round = 18;

-- R19 United States: race_time off by 1 hour
UPDATE races SET
  race_time = '2026-10-25T20:00:00Z'
WHERE season_id = 1 AND round = 19;

-- R22 Las Vegas: race_time off by 2 hours
UPDATE races SET
  race_time = '2026-11-22T04:00:00Z'
WHERE season_id = 1 AND round = 22;
