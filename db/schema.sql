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
  -- Motor
  engine_installation TEXT,
  engine_layout TEXT,
  cylinders TEXT,
  lifters TEXT,
  engine_cc INTEGER,
  displacement_unit_cc INTEGER,
  valves_per_cyl INTEGER,
  compression_ratio TEXT,
  engine_code TEXT,
  weight_power_ratio_kg_cv NUMERIC(6,2),
  weight_torque_ratio_kg_kgfm NUMERIC(6,2),
  aspiration TEXT,
  fuel_system TEXT,
  valve_train TEXT,
  timing_drive TEXT,
  bore_mm NUMERIC(6,2),
  stroke_mm NUMERIC(6,2),
  power_cv INTEGER,
  power_rpm INTEGER,
  power_hp INTEGER,
  torque_kgfm NUMERIC(6,2),
  torque_rpm INTEGER,
  torque_nm INTEGER,
  torque_specific_kgfm_l NUMERIC(6,2),
  power_specific_cv_l NUMERIC(6,2),
  -- Dimensoes e aerodinamica
  weight_kg INTEGER,
  cd_cx NUMERIC(4,3),
  frontal_area_m2 NUMERIC(4,2),
  frontal_area_corrected_m2 NUMERIC(4,3),
  length_mm INTEGER,
  width_mm INTEGER,
  height_mm INTEGER,
  wheelbase_mm INTEGER,
  front_track_mm INTEGER,
  rear_track_mm INTEGER,
  trunk_l INTEGER,
  fuel_tank_l INTEGER,
  payload_kg INTEGER,
  tow_no_brake_kg INTEGER,
  tow_with_brake_kg INTEGER,
  ground_clearance_mm INTEGER,
  -- Transmissao
  tire_diameter_mm INTEGER,
  drivetrain TEXT,
  transmission_type TEXT,
  clutch TEXT,
  gear_ratios TEXT,
  final_drive NUMERIC(5,3),
  -- Suspensao / freios / direcao / pneus
  front_suspension TEXT,
  rear_suspension TEXT,
  front_spring TEXT,
  rear_spring TEXT,
  front_brakes TEXT,
  rear_brakes TEXT,
  steering_assist TEXT,
  turning_diameter_m NUMERIC(4,2),
  front_tire TEXT,
  rear_tire TEXT,
  spare_tire TEXT,
  sidewall_height_mm INTEGER,
  -- Desempenho / consumo
  top_speed_kmh INTEGER,
  accel_0_100_s NUMERIC(4,2),
  lateral_accel_g NUMERIC(4,2),
  accel_40_100_s NUMERIC(4,2),
  city_km_l NUMERIC(4,1),
  highway_km_l NUMERIC(4,1),
  city_range_km INTEGER,
  highway_range_km INTEGER,
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
