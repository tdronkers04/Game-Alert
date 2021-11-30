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
  season int NOT NULL,
  game_date date NOT NULL,
  tv_network text NOT NULL,
  tv_show text NOT NULL,
  national_broadcast boolean NOT NULL
);

CREATE TABLE users (
  id serial PRIMARY KEY,
  first_name text NOT NULL,
  email_address text NOT NULL,
  sms_phone_number text NOT NULL
);

CREATE TABLE alerts (
  id serial PRIMARY KEY,
  team_id int NOT NULL REFERENCES teams (id),
  user_id int NOT NULL REFERENCES users (id),
  mode text NOT NULL,
  freq text NOT NULL,
  active boolean NOT NULL
);