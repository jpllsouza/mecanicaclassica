CREATE TABLE IF NOT EXISTS makes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS models (
  id SERIAL PRIMARY KEY,
  make_id INTEGER NOT NULL REFERENCES makes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_year INTEGER,
  end_year INTEGER
);

CREATE TABLE IF NOT EXISTS trims (
  id SERIAL PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  year INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS specs (
  id SERIAL PRIMARY KEY,
  trim_id INTEGER NOT NULL UNIQUE REFERENCES trims(id) ON DELETE CASCADE,
  engine_cc INTEGER,
  power_hp INTEGER,
  torque_nm INTEGER,
  weight_kg INTEGER,
  cd_cx NUMERIC(4,3),
  frontal_area_m2 NUMERIC(4,2),
  tire_diameter_mm INTEGER,
  drivetrain TEXT,
  gear_ratios TEXT,
  final_drive NUMERIC(5,3),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS suggestions (
  id SERIAL PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  trim TEXT,
  source_url TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
