require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const FICHAS_DIR = path.join(__dirname, "..", "FichasTecnicas");
const KGFM_TO_NM = 9.80665;

const POWER_CV_KEYS = [
  "potencia_maxima_cv",
  "potencia_maxima_cv_gasolina",
  "potencia_maxima_cv_alcool",
  "potencia_maxima_cv_bruto",
  "potencia_maxima_cv_liquido",
  "potencia_maxima_cv_sae",
  "potencia_maxima_cv_din",
  "potencia_maxima_cv_aprox",
  "potencia_maxima_cv_sae_bruto",
  "potencia_maxima_cv_mi_declarada",
  "potencia_maxima_cv_liquido_250s",
  "potencia_maxima_cv_bruto_alcool",
  "potencia_gasolina_cv",
  "potencia_alcool_cv_padrao"
];

const POWER_RPM_KEYS = [
  "potencia_maxima_rpm",
  "potencia_gasolina_rpm",
  "potencia_alcool_rpm_padrao"
];

const TORQUE_KGFM_KEYS = [
  "torque_maximo_kgfm",
  "torque_maximo_kgfm_gasolina",
  "torque_maximo_kgfm_alcool",
  "torque_maximo_kgfm_aprox",
  "torque_gasolina_kgfm",
  "torque_alcool_kgfm_xr3"
];

const TORQUE_RPM_KEYS = [
  "torque_maximo_rpm",
  "torque_gasolina_rpm"
];

const COMPRESSION_KEYS = [
  "taxa_compressao",
  "taxa_compressao_gasolina",
  "taxa_compressao_alcool",
  "taxa_compressao_carburado",
  "taxa_compressao_efi",
  "taxa_compressao_mpfi",
  "taxa_compressao_carburado_alcool",
  "taxa_compressao_carburado_gasolina",
  "taxa_compressao_totalflex"
];

const TOPSPEED_KEYS = [
  "velocidade_maxima_kmh",
  "velocidade_maxima_kmh_aprox",
  "velocidade_maxima_kmh_gasolina",
  "velocidade_maxima_kmh_fabrica"
];

const ACCEL_KEYS = [
  "aceleracao_0_100_s",
  "aceleracao_0_100_s_aprox",
  "aceleracao_0_100_s_gasolina",
  "aceleracao_0_100_s_fabrica_declarada"
];

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
}

function pick(obj, keys) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
  }
  return null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const match = String(value).replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function toInt(value) {
  const n = toNumber(value);
  return n === null ? null : Math.round(n);
}

function firstYear(value) {
  const match = String(value || "").match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function lastYear(value) {
  const matches = String(value || "").match(/(19|20)\d{2}/g);
  return matches ? Number(matches[matches.length - 1]) : null;
}

function cleanText(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim();
}

function joinNotes(data, motor) {
  const notes = [
    motor.observacoes,
    Array.isArray(motor._fontes) && motor._fontes.length ? `Fontes: ${motor._fontes.join("; ")}` : null,
    data._observacoes_gerais,
    data._nota_importante_r_l,
    data._nota_importante_biela,
    data._nota_variacao_potencia
  ].filter(Boolean);
  return notes.join("\n\n") || null;
}

function trimNameForMotor(motor) {
  const parts = [
    motor.codigo_motor || "Motor",
    motor.apelido ? `(${motor.apelido})` : null
  ].filter(Boolean);
  return parts.join(" ");
}

function mapSpecs(data, motor) {
  const torqueKgfm = toNumber(pick(motor, TORQUE_KGFM_KEYS));
  return {
    engine_installation: cleanText(motor.configuracao),
    engine_layout: cleanText(motor.configuracao),
    cylinders: cleanText(motor.configuracao),
    lifters: cleanText(motor.tuchos),
    engine_cc: toInt(pick(motor, ["cilindrada_cm3"])),
    valves_per_cyl: toInt(pick(motor, ["valvulas_por_cilindro"])),
    compression_ratio: cleanText(pick(motor, COMPRESSION_KEYS)),
    engine_code: cleanText(motor.codigo_motor),
    aspiration: cleanText(motor.aspiracao),
    fuel_system: cleanText(motor.alimentacao),
    valve_train: cleanText(motor.configuracao),
    timing_drive: cleanText(motor.acionamento_comando),
    rod_length_mm: toNumber(pick(motor, ["comprimento_biela_mm"])),
    bore_mm: toNumber(pick(motor, ["diametro_cilindro_mm"])),
    stroke_mm: toNumber(pick(motor, ["curso_pistao_mm"])),
    power_cv: toInt(pick(motor, POWER_CV_KEYS)),
    power_rpm: toInt(pick(motor, POWER_RPM_KEYS)),
    power_hp: toInt(pick(motor, ["potencia_maxima_hp"])),
    torque_kgfm: torqueKgfm,
    torque_rpm: toInt(pick(motor, TORQUE_RPM_KEYS)),
    torque_nm: torqueKgfm === null ? null : torqueKgfm * KGFM_TO_NM,
    weight_kg: toInt(pick(motor, ["peso_kg", "peso_kg_1990", "peso_kg_aprox", "peso_veiculo_seco_kg"])),
    cd_cx: toNumber(pick(motor, ["coeficiente_aerodinamico_cx"])),
    length_mm: toInt(pick(motor, ["comprimento_mm"])),
    width_mm: toInt(pick(motor, ["largura_mm"])),
    height_mm: toInt(pick(motor, ["altura_mm"])),
    wheelbase_mm: toInt(pick(motor, ["entre_eixos_mm", "distancia_entre_eixos_mm"])),
    fuel_tank_l: toInt(pick(motor, ["tanque_litros"])),
    drivetrain: cleanText(motor.tracao),
    transmission_type: cleanText(motor.cambio),
    gear_ratios: cleanText(motor.relacoes_marcha),
    final_drive: toNumber(pick(motor, ["diferencial_relacao"])),
    top_speed_kmh: toInt(pick(motor, TOPSPEED_KEYS)),
    accel_0_100_s: toNumber(pick(motor, ACCEL_KEYS)),
    notes: joinNotes(data, motor)
  };
}

async function upsertMake(client, name) {
  const result = await client.query(
    "INSERT INTO makes (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
    [name]
  );
  return result.rows[0].id;
}

async function upsertModel(client, makeId, name, startYear, endYear) {
  const existing = await client.query(
    "SELECT id FROM models WHERE make_id = $1 AND name = $2 LIMIT 1",
    [makeId, name]
  );
  if (existing.rowCount) {
    await client.query(
      "UPDATE models SET start_year = COALESCE($2, start_year), end_year = COALESCE($3, end_year) WHERE id = $1",
      [existing.rows[0].id, startYear, endYear]
    );
    return existing.rows[0].id;
  }
  const inserted = await client.query(
    "INSERT INTO models (make_id, name, start_year, end_year) VALUES ($1, $2, $3, $4) RETURNING id",
    [makeId, name, startYear, endYear]
  );
  return inserted.rows[0].id;
}

async function upsertTrim(client, modelId, name, year) {
  const existing = await client.query(
    "SELECT id FROM trims WHERE model_id = $1 AND name = $2 AND year = $3 LIMIT 1",
    [modelId, name, year]
  );
  if (existing.rowCount) return existing.rows[0].id;
  const inserted = await client.query(
    "INSERT INTO trims (model_id, name, year) VALUES ($1, $2, $3) RETURNING id",
    [modelId, name, year]
  );
  return inserted.rows[0].id;
}

async function upsertSpecs(client, trimId, specs) {
  // ON CONFLICT uses COALESCE(EXCLUDED.x, specs.x) so a re-import with a gap
  // in the source JSON never blanks out a value the DB already has (e.g. one
  // manually backfilled from raw_data) — it only ever fills missing fields.
  await client.query(
    `INSERT INTO specs (
       trim_id, engine_installation, engine_layout, cylinders, lifters, engine_cc, valves_per_cyl,
       compression_ratio, engine_code, aspiration, fuel_system, valve_train, timing_drive, rod_length_mm,
       bore_mm, stroke_mm, power_cv, power_rpm, power_hp, torque_kgfm, torque_rpm, torque_nm,
       weight_kg, cd_cx, length_mm, width_mm, height_mm, wheelbase_mm, fuel_tank_l, drivetrain,
       transmission_type, gear_ratios, final_drive, top_speed_kmh, accel_0_100_s, notes
     )
     VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
       $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36
     )
     ON CONFLICT (trim_id) DO UPDATE SET
       engine_installation = COALESCE(EXCLUDED.engine_installation, specs.engine_installation),
       engine_layout = COALESCE(EXCLUDED.engine_layout, specs.engine_layout),
       cylinders = COALESCE(EXCLUDED.cylinders, specs.cylinders),
       lifters = COALESCE(EXCLUDED.lifters, specs.lifters),
       engine_cc = COALESCE(EXCLUDED.engine_cc, specs.engine_cc),
       valves_per_cyl = COALESCE(EXCLUDED.valves_per_cyl, specs.valves_per_cyl),
       compression_ratio = COALESCE(EXCLUDED.compression_ratio, specs.compression_ratio),
       engine_code = COALESCE(EXCLUDED.engine_code, specs.engine_code),
       aspiration = COALESCE(EXCLUDED.aspiration, specs.aspiration),
       fuel_system = COALESCE(EXCLUDED.fuel_system, specs.fuel_system),
       valve_train = COALESCE(EXCLUDED.valve_train, specs.valve_train),
       timing_drive = COALESCE(EXCLUDED.timing_drive, specs.timing_drive),
       rod_length_mm = COALESCE(EXCLUDED.rod_length_mm, specs.rod_length_mm),
       bore_mm = COALESCE(EXCLUDED.bore_mm, specs.bore_mm),
       stroke_mm = COALESCE(EXCLUDED.stroke_mm, specs.stroke_mm),
       power_cv = COALESCE(EXCLUDED.power_cv, specs.power_cv),
       power_rpm = COALESCE(EXCLUDED.power_rpm, specs.power_rpm),
       power_hp = COALESCE(EXCLUDED.power_hp, specs.power_hp),
       torque_kgfm = COALESCE(EXCLUDED.torque_kgfm, specs.torque_kgfm),
       torque_rpm = COALESCE(EXCLUDED.torque_rpm, specs.torque_rpm),
       torque_nm = COALESCE(EXCLUDED.torque_nm, specs.torque_nm),
       weight_kg = COALESCE(EXCLUDED.weight_kg, specs.weight_kg),
       cd_cx = COALESCE(EXCLUDED.cd_cx, specs.cd_cx),
       length_mm = COALESCE(EXCLUDED.length_mm, specs.length_mm),
       width_mm = COALESCE(EXCLUDED.width_mm, specs.width_mm),
       height_mm = COALESCE(EXCLUDED.height_mm, specs.height_mm),
       wheelbase_mm = COALESCE(EXCLUDED.wheelbase_mm, specs.wheelbase_mm),
       fuel_tank_l = COALESCE(EXCLUDED.fuel_tank_l, specs.fuel_tank_l),
       drivetrain = COALESCE(EXCLUDED.drivetrain, specs.drivetrain),
       transmission_type = COALESCE(EXCLUDED.transmission_type, specs.transmission_type),
       gear_ratios = COALESCE(EXCLUDED.gear_ratios, specs.gear_ratios),
       final_drive = COALESCE(EXCLUDED.final_drive, specs.final_drive),
       top_speed_kmh = COALESCE(EXCLUDED.top_speed_kmh, specs.top_speed_kmh),
       accel_0_100_s = COALESCE(EXCLUDED.accel_0_100_s, specs.accel_0_100_s),
       notes = COALESCE(EXCLUDED.notes, specs.notes)`,
    [
      trimId,
      specs.engine_installation,
      specs.engine_layout,
      specs.cylinders,
      specs.lifters,
      specs.engine_cc,
      specs.valves_per_cyl,
      specs.compression_ratio,
      specs.engine_code,
      specs.aspiration,
      specs.fuel_system,
      specs.valve_train,
      specs.timing_drive,
      specs.rod_length_mm,
      specs.bore_mm,
      specs.stroke_mm,
      specs.power_cv,
      specs.power_rpm,
      specs.power_hp,
      specs.torque_kgfm,
      specs.torque_rpm,
      specs.torque_nm,
      specs.weight_kg,
      specs.cd_cx,
      specs.length_mm,
      specs.width_mm,
      specs.height_mm,
      specs.wheelbase_mm,
      specs.fuel_tank_l,
      specs.drivetrain,
      specs.transmission_type,
      specs.gear_ratios,
      specs.final_drive,
      specs.top_speed_kmh,
      specs.accel_0_100_s,
      specs.notes
    ]
  );
}

async function main() {
  const args = parseArgs(process.argv);
  const dryRun = !args.apply;

  if (!process.env.DATABASE_URL && !dryRun) {
    console.error("Faltou DATABASE_URL no .env. Use a connection string do Neon.");
    process.exit(1);
  }

  const files = fs.readdirSync(FICHAS_DIR).filter((f) => f.endsWith(".json")).sort();
  const records = [];

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(FICHAS_DIR, file), "utf8"));
    const fabricante = data.fabricante;
    const modelo = data.modelo;
    const motorizacoes = Array.isArray(data.motorizacoes) ? data.motorizacoes : [];

    if (!fabricante || !modelo || !motorizacoes.length) {
      console.warn(`[pulado] ${file}: fabricante/modelo/motorizacoes ausente`);
      continue;
    }

    const startYear = firstYear(data.producao_brasil);
    const endYear = lastYear(data.producao_brasil);
    for (const motor of motorizacoes) {
      // "_targets" lets a single motorização route to one or more specific
      // make/model combos, for cases where the JSON's top-level fabricante/modelo
      // is a combined placeholder (e.g. "D-20 / C-20 / A-20 / Veraneio") that has
      // since been split into real models in the DB. Falls back to the file-level
      // fabricante/modelo when absent.
      const targets = Array.isArray(motor._targets) && motor._targets.length
        ? motor._targets.map((t) => ({ make: t.fabricante || fabricante, model: t.modelo }))
        : [{ make: fabricante, model: modelo }];

      for (const target of targets) {
        records.push({
          file,
          make: target.make,
          model: target.model,
          startYear,
          endYear,
          trim: trimNameForMotor(motor),
          year: firstYear(motor.periodo_producao) || startYear || 1900,
          specs: mapSpecs(data, motor)
        });
      }
    }
  }

  if (dryRun) {
    console.log(`DRY RUN: ${files.length} arquivos, ${records.length} motorizações prontas para importar.`);
    records.slice(0, 20).forEach((r) => {
      console.log(`- ${r.make} ${r.model} ${r.year} ${r.trim} (${r.file})`);
    });
    if (records.length > 20) console.log(`... +${records.length - 20} registros`);
    console.log("Para gravar no Neon, rode: node scripts\\import-fichas.js --apply");
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  try {
    await client.query("BEGIN");
    for (const record of records) {
      const makeId = await upsertMake(client, record.make);
      const modelId = await upsertModel(client, makeId, record.model, record.startYear, record.endYear);
      const trimId = await upsertTrim(client, modelId, record.trim, record.year);
      await upsertSpecs(client, trimId, record.specs);
    }
    await client.query("COMMIT");
    console.log(`Importação concluída: ${records.length} motorizações de ${files.length} arquivos.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Erro na importação:", err);
  process.exit(1);
});
