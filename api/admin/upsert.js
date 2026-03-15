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
      engine_cc,
      power_hp,
      torque_nm,
      weight_kg,
      cd_cx,
      frontal_area_m2,
      tire_diameter_mm,
      drivetrain,
      gear_ratios,
      final_drive,
      notes
    } = specs;

    await client.query(
      `INSERT INTO specs (
         trim_id, engine_cc, power_hp, torque_nm, weight_kg, cd_cx, frontal_area_m2,
         tire_diameter_mm, drivetrain, gear_ratios, final_drive, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (trim_id) DO UPDATE SET
         engine_cc = EXCLUDED.engine_cc,
         power_hp = EXCLUDED.power_hp,
         torque_nm = EXCLUDED.torque_nm,
         weight_kg = EXCLUDED.weight_kg,
         cd_cx = EXCLUDED.cd_cx,
         frontal_area_m2 = EXCLUDED.frontal_area_m2,
         tire_diameter_mm = EXCLUDED.tire_diameter_mm,
         drivetrain = EXCLUDED.drivetrain,
         gear_ratios = EXCLUDED.gear_ratios,
         final_drive = EXCLUDED.final_drive,
         notes = EXCLUDED.notes`,
      [
        trimId,
        engine_cc || null,
        power_hp || null,
        torque_nm || null,
        weight_kg || null,
        cd_cx || null,
        frontal_area_m2 || null,
        tire_diameter_mm || null,
        drivetrain || null,
        gear_ratios || null,
        final_drive || null,
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
