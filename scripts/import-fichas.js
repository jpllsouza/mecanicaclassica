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
  "torque_maximo_kgfm_bruto",
  "torque_maximo_kgfm_liquido",
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
    displacement_unit_cc: toNumber(pick(motor, ["cilindrada_unitaria_cm3"])),
    valves_per_cyl: toInt(pick(motor, ["valvulas_por_cilindro"])),
    compression_ratio: cleanText(pick(motor, COMPRESSION_KEYS)),
    engine_code: cleanText(motor.codigo_motor),
    weight_power_ratio_kg_cv: toNumber(pick(motor, ["peso_potencia_kg_cv"])),
    weight_torque_ratio_kg_kgfm: toNumber(pick(motor, ["peso_torque_kg_kgfm"])),
    aspiration: cleanText(motor.aspiracao),
    fuel_system: cleanText(motor.alimentacao),
    valve_train: cleanText(motor.comando_valvulas) || cleanText(motor.configuracao),
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
    torque_specific_kgfm_l: toNumber(pick(motor, ["torque_especifico_kgfm_l"])),
    power_specific_cv_l: toNumber(pick(motor, ["potencia_especifica_cv_l"])),
    weight_kg: toInt(pick(motor, ["peso_kg", "peso_kg_1990", "peso_kg_aprox", "peso_veiculo_seco_kg"])),
    cd_cx: toNumber(pick(motor, ["coeficiente_aerodinamico_cx"])),
    frontal_area_m2: toNumber(pick(motor, ["area_frontal_m2"])),
    frontal_area_corrected_m2: toNumber(pick(motor, ["area_frontal_corrigida_m2"])),
    length_mm: toInt(pick(motor, ["comprimento_mm"])),
    width_mm: toInt(pick(motor, ["largura_mm"])),
    height_mm: toInt(pick(motor, ["altura_mm"])),
    wheelbase_mm: toInt(pick(motor, ["entre_eixos_mm", "distancia_entre_eixos_mm"])),
    front_track_mm: toInt(pick(motor, ["bitola_dianteira_mm"])),
    rear_track_mm: toInt(pick(motor, ["bitola_traseira_mm"])),
    trunk_l: toInt(pick(motor, ["porta_malas_l", "porta_malas_litros"])),
    fuel_tank_l: toInt(pick(motor, ["tanque_litros"])),
    payload_kg: toInt(pick(motor, ["carga_util_kg"])),
    tow_no_brake_kg: toInt(pick(motor, ["reboque_sem_freio_kg"])),
    tow_with_brake_kg: toInt(pick(motor, ["reboque_com_freio_kg"])),
    ground_clearance_mm: toInt(pick(motor, ["altura_minima_solo_mm"])),
    drivetrain: cleanText(motor.tracao),
    transmission_type: cleanText(motor.cambio),
    clutch: cleanText(motor.embreagem),
    gear_ratios: cleanText(motor.relacoes_marcha),
    final_drive: toNumber(pick(motor, ["diferencial_relacao"])),
    front_suspension: cleanText(motor.suspensao_dianteira),
    rear_suspension: cleanText(motor.suspensao_traseira),
    front_spring: cleanText(motor.mola_dianteira),
    rear_spring: cleanText(motor.mola_traseira),
    front_brakes: cleanText(motor.freios_dianteiros),
    rear_brakes: cleanText(motor.freios_traseiros),
    steering_assist: cleanText(motor.direcao_assistencia),
    turning_diameter_m: toNumber(pick(motor, ["diametro_giro_m"])),
    front_tire: cleanText(motor.pneu_dianteiro),
    rear_tire: cleanText(motor.pneu_traseiro),
    spare_tire: cleanText(motor.estepe),
    sidewall_height_mm: toInt(pick(motor, ["altura_flanco_mm"])),
    top_speed_kmh: toInt(pick(motor, TOPSPEED_KEYS)),
    accel_0_100_s: toNumber(pick(motor, ACCEL_KEYS)),
    city_km_l: toNumber(pick(motor, ["consumo_urbano_km_l"])),
    highway_km_l: toNumber(pick(motor, ["consumo_rodoviario_km_l"])),
    city_range_km: toInt(pick(motor, ["autonomia_urbana_km"])),
    highway_range_km: toInt(pick(motor, ["autonomia_rodoviaria_km"])),
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
  // Built dynamically from mapSpecs()'s keys so every field it produces reaches
  // the DB (a fixed column list silently drops anything added later). ON CONFLICT
  // uses COALESCE(EXCLUDED.x, specs.x) so a re-import with a gap in the source
  // JSON never blanks out a value the DB already has - it only fills gaps.
  const cols = Object.keys(specs);
  const values = [trimId, ...cols.map((c) => specs[c])];
  const placeholders = cols.map((_, i) => `$${i + 2}`).join(",");
  const updateSet = cols.map((c) => `${c} = COALESCE(EXCLUDED.${c}, specs.${c})`).join(",\n       ");

  await client.query(
    `INSERT INTO specs (trim_id, ${cols.join(", ")})
     VALUES ($1, ${placeholders})
     ON CONFLICT (trim_id) DO UPDATE SET
       ${updateSet}`,
    values
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
