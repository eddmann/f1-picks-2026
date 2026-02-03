-- Seed 2026 F1 Season Data
-- Data sourced from OpenF1 API (https://api.openf1.org) and official F1.com

-- Create 2026 Season
INSERT INTO seasons (year, name, is_active) VALUES (2026, 'F1 2026 Season', TRUE);

-- Insert Drivers (22 drivers across 11 teams for 2026)
-- Colors from OpenF1 API

-- Red Bull Racing (Ford power unit)
INSERT INTO drivers (season_id, code, name, number, team, team_color) VALUES
  (1, 'VER', 'Max Verstappen', 3, 'Red Bull Racing', '#4781D7'),
  (1, 'HAD', 'Isack Hadjar', 6, 'Red Bull Racing', '#4781D7');

-- Ferrari
INSERT INTO drivers (season_id, code, name, number, team, team_color) VALUES
  (1, 'LEC', 'Charles Leclerc', 16, 'Ferrari', '#ED1131'),
  (1, 'HAM', 'Lewis Hamilton', 44, 'Ferrari', '#ED1131');

-- McLaren (Mercedes power unit) - Norris #1 as 2025 World Champion
INSERT INTO drivers (season_id, code, name, number, team, team_color) VALUES
  (1, 'NOR', 'Lando Norris', 1, 'McLaren', '#F47600'),
  (1, 'PIA', 'Oscar Piastri', 81, 'McLaren', '#F47600');

-- Mercedes
INSERT INTO drivers (season_id, code, name, number, team, team_color) VALUES
  (1, 'RUS', 'George Russell', 63, 'Mercedes', '#00D7B6'),
  (1, 'ANT', 'Kimi Antonelli', 12, 'Mercedes', '#00D7B6');

-- Aston Martin (Honda power unit)
INSERT INTO drivers (season_id, code, name, number, team, team_color) VALUES
  (1, 'ALO', 'Fernando Alonso', 14, 'Aston Martin', '#229971'),
  (1, 'STR', 'Lance Stroll', 18, 'Aston Martin', '#229971');

-- Alpine (Mercedes power unit)
INSERT INTO drivers (season_id, code, name, number, team, team_color) VALUES
  (1, 'GAS', 'Pierre Gasly', 10, 'Alpine', '#00A1E8'),
  (1, 'COL', 'Franco Colapinto', 43, 'Alpine', '#00A1E8');

-- Williams (Mercedes power unit)
INSERT INTO drivers (season_id, code, name, number, team, team_color) VALUES
  (1, 'ALB', 'Alexander Albon', 23, 'Williams', '#1868DB'),
  (1, 'SAI', 'Carlos Sainz', 55, 'Williams', '#1868DB');

-- Racing Bulls (Ford power unit)
INSERT INTO drivers (season_id, code, name, number, team, team_color) VALUES
  (1, 'LAW', 'Liam Lawson', 30, 'Racing Bulls', '#6C98FF'),
  (1, 'LIN', 'Arvid Lindblad', 41, 'Racing Bulls', '#6C98FF');

-- Audi (own power unit, formerly Kick Sauber)
INSERT INTO drivers (season_id, code, name, number, team, team_color) VALUES
  (1, 'HUL', 'Nico Hulkenberg', 27, 'Audi', '#01C00E'),
  (1, 'BOR', 'Gabriel Bortoleto', 5, 'Audi', '#01C00E');

-- Haas (Ferrari power unit)
INSERT INTO drivers (season_id, code, name, number, team, team_color) VALUES
  (1, 'OCO', 'Esteban Ocon', 31, 'Haas', '#9C9FA2'),
  (1, 'BEA', 'Oliver Bearman', 87, 'Haas', '#9C9FA2');

-- Cadillac (Ferrari power unit) - NEW TEAM for 2026
INSERT INTO drivers (season_id, code, name, number, team, team_color) VALUES
  (1, 'PER', 'Sergio Perez', 11, 'Cadillac', '#1A1A1A'),
  (1, 'BOT', 'Valtteri Bottas', 77, 'Cadillac', '#1A1A1A');

-- Insert 2026 Race Calendar (24 races)
-- Data from OpenF1 API sessions endpoint (https://api.openf1.org/v1/sessions?year=2026)
-- Sprint races: China, Miami, Canada, Britain, Netherlands, Singapore
-- Rounds 23-24 are wild card races (game mechanic)
-- Pick window closes 10 mins before quali_time (or sprint_quali_time for sprint weekends)
INSERT INTO races (season_id, round, name, location, circuit, country_code, has_sprint, quali_time, sprint_quali_time, race_time, sprint_time, is_wild_card) VALUES
  (1, 1, 'Australian Grand Prix', 'Melbourne', 'Albert Park Circuit', 'AU', FALSE, '2026-03-07T05:00:00Z', NULL, '2026-03-08T04:00:00Z', NULL, FALSE),
  (1, 2, 'Chinese Grand Prix', 'Shanghai', 'Shanghai International Circuit', 'CN', TRUE, '2026-03-14T07:00:00Z', '2026-03-14T03:00:00Z', '2026-03-15T07:00:00Z', '2026-03-14T07:30:00Z', FALSE),
  (1, 3, 'Japanese Grand Prix', 'Suzuka', 'Suzuka International Racing Course', 'JP', FALSE, '2026-03-28T06:00:00Z', NULL, '2026-03-29T05:00:00Z', NULL, FALSE),
  (1, 4, 'Bahrain Grand Prix', 'Sakhir', 'Bahrain International Circuit', 'BH', FALSE, '2026-04-11T16:00:00Z', NULL, '2026-04-12T15:00:00Z', NULL, FALSE),
  (1, 5, 'Saudi Arabian Grand Prix', 'Jeddah', 'Jeddah Corniche Circuit', 'SA', FALSE, '2026-04-18T17:00:00Z', NULL, '2026-04-19T17:00:00Z', NULL, FALSE),
  (1, 6, 'Miami Grand Prix', 'Miami', 'Miami International Autodrome', 'US', TRUE, '2026-05-02T20:00:00Z', '2026-05-02T16:00:00Z', '2026-05-03T20:00:00Z', '2026-05-02T20:30:00Z', FALSE),
  (1, 7, 'Canadian Grand Prix', 'Montreal', 'Circuit Gilles Villeneuve', 'CA', TRUE, '2026-05-23T20:00:00Z', '2026-05-23T16:00:00Z', '2026-05-24T18:00:00Z', '2026-05-23T20:30:00Z', FALSE),
  (1, 8, 'Monaco Grand Prix', 'Monte Carlo', 'Circuit de Monaco', 'MC', FALSE, '2026-06-06T14:00:00Z', NULL, '2026-06-07T13:00:00Z', NULL, FALSE),
  (1, 9, 'Barcelona Grand Prix', 'Barcelona', 'Circuit de Barcelona-Catalunya', 'ES', FALSE, '2026-06-13T14:00:00Z', NULL, '2026-06-14T13:00:00Z', NULL, FALSE),
  (1, 10, 'Austrian Grand Prix', 'Spielberg', 'Red Bull Ring', 'AT', FALSE, '2026-06-27T14:00:00Z', NULL, '2026-06-28T13:00:00Z', NULL, FALSE),
  (1, 11, 'British Grand Prix', 'Silverstone', 'Silverstone Circuit', 'GB', TRUE, '2026-07-04T15:00:00Z', '2026-07-04T11:00:00Z', '2026-07-05T14:00:00Z', '2026-07-04T15:30:00Z', FALSE),
  (1, 12, 'Belgian Grand Prix', 'Spa', 'Circuit de Spa-Francorchamps', 'BE', FALSE, '2026-07-18T14:00:00Z', NULL, '2026-07-19T13:00:00Z', NULL, FALSE),
  (1, 13, 'Hungarian Grand Prix', 'Budapest', 'Hungaroring', 'HU', FALSE, '2026-07-25T14:00:00Z', NULL, '2026-07-26T13:00:00Z', NULL, FALSE),
  (1, 14, 'Dutch Grand Prix', 'Zandvoort', 'Circuit Zandvoort', 'NL', TRUE, '2026-08-22T14:00:00Z', '2026-08-22T10:00:00Z', '2026-08-23T13:00:00Z', '2026-08-22T14:30:00Z', FALSE),
  (1, 15, 'Italian Grand Prix', 'Monza', 'Autodromo Nazionale Monza', 'IT', FALSE, '2026-09-05T14:00:00Z', NULL, '2026-09-06T13:00:00Z', NULL, FALSE),
  (1, 16, 'Spanish Grand Prix', 'Madrid', 'Madrid Circuit', 'ES', FALSE, '2026-09-12T14:00:00Z', NULL, '2026-09-13T13:00:00Z', NULL, FALSE),
  (1, 17, 'Azerbaijan Grand Prix', 'Baku', 'Baku City Circuit', 'AZ', FALSE, '2026-09-25T12:00:00Z', NULL, '2026-09-26T11:00:00Z', NULL, FALSE),
  (1, 18, 'Singapore Grand Prix', 'Singapore', 'Marina Bay Street Circuit', 'SG', TRUE, '2026-10-10T13:00:00Z', '2026-10-10T09:00:00Z', '2026-10-11T12:00:00Z', '2026-10-10T13:30:00Z', FALSE),
  (1, 19, 'United States Grand Prix', 'Austin', 'Circuit of the Americas', 'US', FALSE, '2026-10-24T21:00:00Z', NULL, '2026-10-25T19:00:00Z', NULL, FALSE),
  (1, 20, 'Mexico City Grand Prix', 'Mexico City', 'Autodromo Hermanos Rodriguez', 'MX', FALSE, '2026-10-31T21:00:00Z', NULL, '2026-11-01T20:00:00Z', NULL, FALSE),
  (1, 21, 'Sao Paulo Grand Prix', 'Sao Paulo', 'Autodromo Jose Carlos Pace', 'BR', FALSE, '2026-11-07T18:00:00Z', NULL, '2026-11-08T17:00:00Z', NULL, FALSE),
  (1, 22, 'Las Vegas Grand Prix', 'Las Vegas', 'Las Vegas Street Circuit', 'US', FALSE, '2026-11-21T04:00:00Z', NULL, '2026-11-22T06:00:00Z', NULL, FALSE),
  (1, 23, 'Qatar Grand Prix', 'Lusail', 'Lusail International Circuit', 'QA', FALSE, '2026-11-28T18:00:00Z', NULL, '2026-11-29T16:00:00Z', NULL, TRUE),
  (1, 24, 'Abu Dhabi Grand Prix', 'Abu Dhabi', 'Yas Marina Circuit', 'AE', FALSE, '2026-12-05T14:00:00Z', NULL, '2026-12-06T13:00:00Z', NULL, TRUE);
