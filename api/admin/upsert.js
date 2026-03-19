const db = require("../_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminKey = req.headers["x-admin-key"];
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }

  const { make, model, year, trim, specs } = body || {};
  if (!make || !model || !year || !trim || !specs) {
    return res.status(400).json({ error: "make, model, year, trim, specs required" });
  }

  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    const makeRes = await client.query(
      "INSERT INTO makes (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
      [make]
    );
    const makeId = makeRes.rows[0].id;

    const modelRes = await client.query(
      `INSERT INTO models (make_id, name)
       VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [makeId, model]
    );

    let modelId;
    if (modelRes.rowCount === 0) {
      const existing = await client.query(
        "SELECT id FROM models WHERE make_id = $1 AND name = $2 LIMIT 1",
        [makeId, model]
      );
      if (existing.rowCount === 0) {
        throw new Error("Failed to resolve model");
      }
      modelId = existing.rows[0].id;
    } else {
      modelId = modelRes.rows[0].id;
    }

    const trimRes = await client.query(
      `INSERT INTO trims (model_id, name, year)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [modelId, trim, year]
    );

    let trimId;
    if (trimRes.rowCount === 0) {
      const existing = await client.query(
        "SELECT id FROM trims WHERE model_id = $1 AND name = $2 AND year = $3 LIMIT 1",
        [modelId, trim, year]
      );
      if (existing.rowCount === 0) {
        throw new Error("Failed to resolve trim");
      }
      trimId = existing.rows[0].id;
    } else {
      trimId = trimRes.rows[0].id;
    }

    const {
      engine_installation,
      engine_layout,
      cylinders,
      lifters,
      engine_cc,
      displacement_unit_cc,
      valves_per_cyl,
      compression_ratio,
      engine_code,
      weight_power_ratio_kg_cv,
      weight_torque_ratio_kg_kgfm,
      aspiration,
      fuel_system,
      valve_train,
      timing_drive,
      bore_mm,
      stroke_mm,
      power_cv,
      power_rpm,
      power_hp,
      torque_kgfm,
      torque_rpm,
      torque_nm,
      torque_specific_kgfm_l,
      power_specific_cv_l,
      weight_kg,
      cd_cx,
      frontal_area_m2,
      frontal_area_corrected_m2,
      length_mm,
      width_mm,
      height_mm,
      wheelbase_mm,
      front_track_mm,
      rear_track_mm,
      trunk_l,
      fuel_tank_l,
      payload_kg,
      tow_no_brake_kg,
      tow_with_brake_kg,
      ground_clearance_mm,
      tire_diameter_mm,
      drivetrain,
      transmission_type,
      clutch,
      gear_ratios,
      final_drive,
      front_suspension,
      rear_suspension,
      front_spring,
      rear_spring,
      front_brakes,
      rear_brakes,
      steering_assist,
      turning_diameter_m,
      front_tire,
      rear_tire,
      spare_tire,
      sidewall_height_mm,
      top_speed_kmh,
      accel_0_100_s,
      lateral_accel_g,
      accel_40_100_s,
      city_km_l,
      highway_km_l,
      city_range_km,
      highway_range_km,
      notes
    } = specs;

    const num = (v) => {
      if (v === undefined || v === null || v === "") return null;
      const n = Number(String(v).replace(",", "."));
      return Number.isFinite(n) ? n : null;
    };

    const int = (v) => {
      const n = num(v);
      return n === null ? null : Math.trunc(n);
    };

    await client.query(
      `INSERT INTO specs (
         trim_id, engine_installation, engine_layout, cylinders, lifters, engine_cc, displacement_unit_cc,
         valves_per_cyl, compression_ratio, engine_code, weight_power_ratio_kg_cv, weight_torque_ratio_kg_kgfm,
         aspiration, fuel_system, valve_train, timing_drive, bore_mm, stroke_mm, power_cv, power_rpm, power_hp,
         torque_kgfm, torque_rpm, torque_nm, torque_specific_kgfm_l, power_specific_cv_l, weight_kg, cd_cx,
         frontal_area_m2, frontal_area_corrected_m2, length_mm, width_mm, height_mm, wheelbase_mm, front_track_mm,
         rear_track_mm, trunk_l, fuel_tank_l, payload_kg, tow_no_brake_kg, tow_with_brake_kg, ground_clearance_mm,
         tire_diameter_mm, drivetrain, transmission_type, clutch, gear_ratios, final_drive, front_suspension,
         rear_suspension, front_spring, rear_spring, front_brakes, rear_brakes, steering_assist, turning_diameter_m,
         front_tire, rear_tire, spare_tire, sidewall_height_mm, top_speed_kmh, accel_0_100_s, lateral_accel_g,
         accel_40_100_s, city_km_l, highway_km_l, city_range_km, highway_range_km, notes
       )
       VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,
         $27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,
         $51,$52,$53,$54,$55,$56,$57,$58,$59,$60,$61,$62,$63,$64,$65,$66,$67,$68,$69
       )
       ON CONFLICT (trim_id) DO UPDATE SET
         engine_installation = EXCLUDED.engine_installation,
         engine_layout = EXCLUDED.engine_layout,
         cylinders = EXCLUDED.cylinders,
         lifters = EXCLUDED.lifters,
         engine_cc = EXCLUDED.engine_cc,
         displacement_unit_cc = EXCLUDED.displacement_unit_cc,
         valves_per_cyl = EXCLUDED.valves_per_cyl,
         compression_ratio = EXCLUDED.compression_ratio,
         engine_code = EXCLUDED.engine_code,
         weight_power_ratio_kg_cv = EXCLUDED.weight_power_ratio_kg_cv,
         weight_torque_ratio_kg_kgfm = EXCLUDED.weight_torque_ratio_kg_kgfm,
         aspiration = EXCLUDED.aspiration,
         fuel_system = EXCLUDED.fuel_system,
         valve_train = EXCLUDED.valve_train,
         timing_drive = EXCLUDED.timing_drive,
         bore_mm = EXCLUDED.bore_mm,
         stroke_mm = EXCLUDED.stroke_mm,
         power_cv = EXCLUDED.power_cv,
         power_rpm = EXCLUDED.power_rpm,
         power_hp = EXCLUDED.power_hp,
         torque_kgfm = EXCLUDED.torque_kgfm,
         torque_rpm = EXCLUDED.torque_rpm,
         torque_nm = EXCLUDED.torque_nm,
         torque_specific_kgfm_l = EXCLUDED.torque_specific_kgfm_l,
         power_specific_cv_l = EXCLUDED.power_specific_cv_l,
         weight_kg = EXCLUDED.weight_kg,
         cd_cx = EXCLUDED.cd_cx,
         frontal_area_m2 = EXCLUDED.frontal_area_m2,
         frontal_area_corrected_m2 = EXCLUDED.frontal_area_corrected_m2,
         length_mm = EXCLUDED.length_mm,
         width_mm = EXCLUDED.width_mm,
         height_mm = EXCLUDED.height_mm,
         wheelbase_mm = EXCLUDED.wheelbase_mm,
         front_track_mm = EXCLUDED.front_track_mm,
         rear_track_mm = EXCLUDED.rear_track_mm,
         trunk_l = EXCLUDED.trunk_l,
         fuel_tank_l = EXCLUDED.fuel_tank_l,
         payload_kg = EXCLUDED.payload_kg,
         tow_no_brake_kg = EXCLUDED.tow_no_brake_kg,
         tow_with_brake_kg = EXCLUDED.tow_with_brake_kg,
         ground_clearance_mm = EXCLUDED.ground_clearance_mm,
         tire_diameter_mm = EXCLUDED.tire_diameter_mm,
         drivetrain = EXCLUDED.drivetrain,
         transmission_type = EXCLUDED.transmission_type,
         clutch = EXCLUDED.clutch,
         gear_ratios = EXCLUDED.gear_ratios,
         final_drive = EXCLUDED.final_drive,
         front_suspension = EXCLUDED.front_suspension,
         rear_suspension = EXCLUDED.rear_suspension,
         front_spring = EXCLUDED.front_spring,
         rear_spring = EXCLUDED.rear_spring,
         front_brakes = EXCLUDED.front_brakes,
         rear_brakes = EXCLUDED.rear_brakes,
         steering_assist = EXCLUDED.steering_assist,
         turning_diameter_m = EXCLUDED.turning_diameter_m,
         front_tire = EXCLUDED.front_tire,
         rear_tire = EXCLUDED.rear_tire,
         spare_tire = EXCLUDED.spare_tire,
         sidewall_height_mm = EXCLUDED.sidewall_height_mm,
         top_speed_kmh = EXCLUDED.top_speed_kmh,
         accel_0_100_s = EXCLUDED.accel_0_100_s,
         lateral_accel_g = EXCLUDED.lateral_accel_g,
         accel_40_100_s = EXCLUDED.accel_40_100_s,
         city_km_l = EXCLUDED.city_km_l,
         highway_km_l = EXCLUDED.highway_km_l,
         city_range_km = EXCLUDED.city_range_km,
         highway_range_km = EXCLUDED.highway_range_km,
         notes = EXCLUDED.notes`,
      [
        trimId,
        engine_installation || null,
        engine_layout || null,
        cylinders || null,
        lifters || null,
        int(engine_cc),
        int(displacement_unit_cc),
        int(valves_per_cyl),
        compression_ratio || null,
        engine_code || null,
        num(weight_power_ratio_kg_cv),
        num(weight_torque_ratio_kg_kgfm),
        aspiration || null,
        fuel_system || null,
        valve_train || null,
        timing_drive || null,
        num(bore_mm),
        num(stroke_mm),
        int(power_cv),
        int(power_rpm),
        int(power_hp),
        num(torque_kgfm),
        int(torque_rpm),
        num(torque_nm),
        num(torque_specific_kgfm_l),
        num(power_specific_cv_l),
        int(weight_kg),
        num(cd_cx),
        num(frontal_area_m2),
        num(frontal_area_corrected_m2),
        int(length_mm),
        int(width_mm),
        int(height_mm),
        int(wheelbase_mm),
        int(front_track_mm),
        int(rear_track_mm),
        int(trunk_l),
        int(fuel_tank_l),
        int(payload_kg),
        int(tow_no_brake_kg),
        int(tow_with_brake_kg),
        int(ground_clearance_mm),
        int(tire_diameter_mm),
        drivetrain || null,
        transmission_type || null,
        clutch || null,
        gear_ratios || null,
        num(final_drive),
        front_suspension || null,
        rear_suspension || null,
        front_spring || null,
        rear_spring || null,
        front_brakes || null,
        rear_brakes || null,
        steering_assist || null,
        num(turning_diameter_m),
        front_tire || null,
        rear_tire || null,
        spare_tire || null,
        int(sidewall_height_mm),
        int(top_speed_kmh),
        num(accel_0_100_s),
        num(lateral_accel_g),
        num(accel_40_100_s),
        num(city_km_l),
        num(highway_km_l),
        int(city_range_km),
        int(highway_range_km),
        notes || null
      ]
    );

    await client.query("COMMIT");
    res.status(201).json({ ok: true, trim_id: trimId });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
};
