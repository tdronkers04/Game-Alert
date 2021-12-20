CREATE TABLE leagues (
  id serial PRIMARY KEY,
  league_name text UNIQUE NOT NULL,
  sport text NOT NULL,
  country text NOT NULL
);

CREATE TABLE teams (
  id serial PRIMARY KEY,
  league_id int NOT NULL REFERENCES leagues (id),
  team_name_full text UNIQUE NOT NULL,
  team_city text NOT NULL,
  team_mascot text NOT NULL
);

CREATE TABLE schedules (
  id serial PRIMARY KEY,
  league_id int NOT NULL REFERENCES leagues (id),
  home_team_id int NOT NULL REFERENCES teams (id),
  away_team_id int NOT NULL REFERENCES teams (id),
  season text NOT NULL,
  game_date_utc timestamp with time zone NOT NULL,
  tv_network text NOT NULL,
  national_broadcast boolean
);

CREATE TABLE users (
  id serial PRIMARY KEY,
  email_address text NOT NULL,
  sms_phone_number text NOT NULL,
  password text NOT NULL
);

CREATE TABLE alerts (
  id serial PRIMARY KEY,
  team_id int NOT NULL REFERENCES teams (id),
  user_id int NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  mode text NOT NULL,
  freq text NOT NULL,
  active boolean NOT NULL
);