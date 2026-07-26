const fs = require("fs");

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

function readJsonl(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (e) {
        throw new Error(`Linha ${index + 1}: JSON invalido (${e.message})`);
      }
    });
}

function normalizeSpecs(specs) {
  const out = { ...specs };
  if (out.torque_kgfm && !out.torque_nm) out.torque_nm = Number(out.torque_kgfm) * 9.80665;
  return out;
}

function shouldImport(record, minConfidence) {
  if (record.status !== "found") return false;
  if (!record.specs || Object.keys(record.specs).length === 0) return false;
  if (Number(record.confidence_score || 0) < minConfidence) return false;
  return true;
}

async function postRecord(baseUrl, adminKey, payload) {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/admin/upsert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey
    },
    body: JSON.stringify(payload)
  });

  const body = await res.text();
  let json = null;
  try {
    json = body ? JSON.parse(body) : null;
  } catch {
    json = { raw: body };
  }

  if (!res.ok) {
    throw new Error(`${res.status} ${JSON.stringify(json)}`);
  }

  return json;
}

async function main() {
  const args = parseArgs(process.argv);
  const input = args.input || "data/specs.jsonl";
  const baseUrl = args.url || "http://localhost:3000";
  const adminKey = args["admin-key"] || process.env.ADMIN_KEY;
  const minConfidence = Number(args["min-confidence"] || 0.55);
  const dryRun = !args.apply && args["dry-run"] !== false && args["dry-run"] !== "false";
  const defaultTrim = args["default-trim"] || "Base";

  if (!adminKey && !dryRun) {
    console.error("Informe --admin-key ou defina ADMIN_KEY para importar.");
    process.exit(1);
  }

  const records = readJsonl(input);
  const candidates = records.filter((record) => shouldImport(record, minConfidence));
  const skipped = records.length - candidates.length;

  console.log(`${dryRun ? "DRY RUN" : "IMPORT"}: ${candidates.length} candidatos, ${skipped} ignorados.`);

  for (const record of candidates) {
    const payload = {
      make: record.make,
      model: record.model,
      year: Number(record.year),
      trim: record.trim || defaultTrim,
      specs: {
        ...normalizeSpecs(record.specs),
        notes: [record.specs.notes, record.source_url ? `Fonte: ${record.source_url}` : null]
          .filter(Boolean)
          .join("\n")
      }
    };

    if (dryRun) {
      const missing = (record.missing_fields || []).join(", ") || "nenhum";
      console.log(`- ${payload.make} ${payload.model} ${payload.year} ${payload.trim}: score ${record.confidence_score}, faltando: ${missing}`);
      continue;
    }

    const result = await postRecord(baseUrl, adminKey, payload);
    console.log(`- importado ${payload.make} ${payload.model} ${payload.year} ${payload.trim}: trim_id=${result.trim_id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
