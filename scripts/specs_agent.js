const fs = require("fs");
const path = require("path");
const { setTimeout: delay } = require("timers/promises");

const REQUIRED_FIELDS = [
  "power_cv",
  "torque_kgfm",
  "weight_kg",
  "top_speed_kmh",
  "accel_0_100_s",
  "bore_mm",
  "stroke_mm",
  "tire_diameter_mm",
  "gear_ratios",
  "final_drive"
];

const OFFICIAL_BR_DOMAINS = {
  audi: ["audi.com.br"],
  bmw: ["bmw.com.br"],
  byd: ["byd.com/br", "byd.com.br"],
  caoa: ["caoachery.com.br"],
  chery: ["caoachery.com.br"],
  chevrolet: ["chevrolet.com.br"],
  citroen: ["citroen.com.br"],
  fiat: ["fiat.com.br"],
  ford: ["ford.com.br"],
  gwm: ["gwmbrasil.com.br"],
  honda: ["honda.com.br"],
  hyundai: ["hyundai.com.br"],
  jac: ["jacmotors.com.br"],
  jeep: ["jeep.com.br"],
  kia: ["kia.com.br"],
  mercedes: ["mercedes-benz.com.br"],
  "mercedes-benz": ["mercedes-benz.com.br"],
  mitsubishi: ["mitsubishimotors.com.br"],
  nissan: ["nissan.com.br"],
  peugeot: ["peugeot.com.br"],
  porsche: ["porsche.com.br"],
  ram: ["ram.com.br"],
  renault: ["renault.com.br"],
  toyota: ["toyota.com.br"],
  volkswagen: ["vw.com.br", "volkswagen.com.br"],
  vw: ["vw.com.br", "volkswagen.com.br"],
  volvo: ["volvocars.com.br"]
};

const BRAZIL_SUPPORT_DOMAINS = [
  "carrosnaweb.com.br",
  "icarros.com.br",
  "quatrorodas.abril.com.br",
  "car.blog.br"
];

const BRAZIL_ARCHIVE_DOMAINS = [
  "quatrorodas.abril.com.br",
  "omecanico.com.br",
  "canaldapeca.com.br",
  "autosclassicos.blogspot.com",
  "autosclassicos.blogspot.com.br",
  "pdfcoffee.com",
  "slideshare.net",
  "tudoparaopala.com.br",
  "jocar.com.br",
  "jkcarros.com.br",
  "scribd.com",
  "carroantigo.org",
  "manualdocarro.com.br",
  "manualcarro.com.br",
  "arquivoestado.sp.gov.br"
];

const MAKE_ALIASES = {
  chevrolet: ["Chevrolet", "GM"],
  volkswagen: ["Volkswagen", "VW"],
  vw: ["Volkswagen", "VW"]
};

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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (ch === '"' && next === '"') {
        value += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        value += ch;
      }
      continue;
    }

    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(value.trim());
      value = "";
    } else if (ch === "\n") {
      row.push(value.trim());
      rows.push(row);
      row = [];
      value = "";
    } else if (ch !== "\r") {
      value += ch;
    }
  }

  if (value || row.length) {
    row.push(value.trim());
    rows.push(row);
  }

  return rows.filter((r) => r.some(Boolean));
}

function readCsv(filePath) {
  const rows = parseCsv(fs.readFileSync(filePath, "utf8"));
  const header = rows.shift().map((s) => s.trim());
  return rows.map((cols) => {
    const row = {};
    header.forEach((h, i) => (row[h] = cols[i] || ""));
    return row;
  });
}

function appendJsonl(filePath, record) {
  fs.appendFileSync(filePath, JSON.stringify(record) + "\n", "utf8");
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\uFFFD/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&ordf;/g, "a")
    .replace(/&ordm;/g, "o")
    .replace(/&times;/g, "x")
    .replace(/&sup3;/g, "3")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(text) {
  if (text === null || text === undefined) return null;
  const raw = String(text).replace(/\s/g, "");
  const match = raw.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const numberText = match[0].includes(",")
    ? match[0].replace(/\./g, "").replace(",", ".")
    : match[0];
  const n = Number(numberText);
  return Number.isFinite(n) ? n : null;
}

function parsePower(value) {
  const text = normalize(value);
  const rpm = parseRpm(value);
  const cvMatch = text.match(/(\d+(?:[.,]\d+)?)\s*cv/);
  const hpMatch = text.match(/(\d+(?:[.,]\d+)?)\s*hp/);
  const psMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:ps|cv)/);
  return {
    power_cv: cvMatch ? parseNumber(cvMatch[1]) : psMatch ? parseNumber(psMatch[1]) : null,
    power_hp: hpMatch ? parseNumber(hpMatch[1]) : null,
    power_rpm: rpm
  };
}

function parseTorque(value) {
  const text = normalize(value);
  const rpm = parseRpm(value);
  const kgfmMatch = text.match(/(\d+(?:[.,]\d+)?)\s*kgf?m/);
  const nmMatch = text.match(/(\d+(?:[.,]\d+)?)\s*n\.?m/);
  const kgfm = kgfmMatch ? parseNumber(kgfmMatch[1]) : nmMatch ? parseNumber(nmMatch[1]) / 9.80665 : parseNumber(value);
  return {
    torque_kgfm: kgfm ? Math.round(kgfm * 100) / 100 : null,
    torque_nm: nmMatch ? parseNumber(nmMatch[1]) : kgfm ? Math.round(kgfm * 9.80665 * 1000) / 1000 : null,
    torque_rpm: rpm
  };
}

function parseRpm(value) {
  const text = normalize(value);
  const match = text.match(/(\d{3,5})\s*rpm/);
  return match ? parseNumber(match[1]) : null;
}

function parseBoreStroke(value) {
  const text = String(value || "").replace(",", ".");
  const match = text.match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
  if (!match) return {};
  return {
    bore_mm: parseNumber(match[1]),
    stroke_mm: parseNumber(match[2])
  };
}

function parseTire(value) {
  const match = String(value || "").match(/(\d{3})\s*\/\s*(\d{2})\s*[Rr]\s*(\d{2})/);
  if (!match) return {};
  const width = Number(match[1]);
  const aspect = Number(match[2]) / 100;
  const rim = Number(match[3]) * 25.4;
  return {
    tire_diameter_mm: Math.round(rim + 2 * width * aspect),
    sidewall_height_mm: Math.round(width * aspect)
  };
}

function parseGearRatios(value) {
  const matches = [...String(value || "").matchAll(/\d+(?:[,.]\d+)?/g)].map((m) => m[0].replace(",", "."));
  return matches.length ? matches.join(",") : null;
}

function officialDomainsForMake(make) {
  const key = normalize(make).replace(/\s+/g, "-");
  return OFFICIAL_BR_DOMAINS[key] || [];
}

function makeAliases(make) {
  const key = normalize(make).replace(/\s+/g, "-");
  return MAKE_ALIASES[key] || [make].filter(Boolean);
}

function modelAliases(row) {
  const model = row.model || "";
  const trim = row.trim || "";
  const values = [
    model,
    [model, trim].filter(Boolean).join(" "),
    [row.make, model, trim].filter(Boolean).join(" "),
    ...makeAliases(row.make).map((make) => [make, model, trim].filter(Boolean).join(" "))
  ];

  if (normalize(model) === "opala") {
    values.push("Opala 250S", "Opala 250 S", "GM Opala 250S", "GM Opala 250 S");
  }

  return [...new Set(values.filter(Boolean))];
}

function pluralizePt(text) {
  if (!text) return text;
  if (/[sxz]$/i.test(text)) return text;
  if (/m$/i.test(text)) return text.replace(/m$/i, "ns");
  return `${text}s`;
}

function isOfficialBrazilUrl(url, row) {
  return officialDomainsForMake(row.make).some((domain) => url.includes(domain));
}

function isBrazilSupportUrl(url) {
  return BRAZIL_SUPPORT_DOMAINS.some((domain) => url.includes(domain));
}

function isBrazilArchiveUrl(url) {
  return BRAZIL_ARCHIVE_DOMAINS.some((domain) => url.includes(domain));
}

function isPdfUrl(url) {
  return /\.pdf(?:$|[?#])/i.test(url);
}

function sourceTypeForUrl(url, row) {
  if (isOfficialBrazilUrl(url, row)) return "official_br";
  if (isBrazilArchiveUrl(url) || isPdfUrl(url)) return "archive_br";
  if (isBrazilSupportUrl(url)) return "support_br";
  return "other";
}

function buildSearchQueries(row, opts) {
  const officialDomains = officialDomainsForMake(row.make);
  const base = [row.make, row.model, row.trim, row.year].filter(Boolean).join(" ");
  const baseNoYear = [row.make, row.model, row.trim].filter(Boolean).join(" ");
  const modelYear = [row.make, row.model, row.year].filter(Boolean).join(" ");
  const aliases = modelAliases(row);
  const archiveExact = aliases.flatMap((alias) => [
    `"ficha tecnica" "${alias}"`,
    `"ficha técnica" "${alias}"`,
    `"ficha tecnica" "${alias}" "${row.year || ""}"`,
    `"ficha técnica" "${alias}" "${row.year || ""}"`,
    `pdfs de fichas tecnicas de ${pluralizePt(alias)}`,
    `pdfs de fichas técnicas de ${pluralizePt(alias)}`,
    `${alias} ficha tecnica`,
    `${alias} ficha técnica`,
    `${alias} ficha tecnica ${row.year || ""}`,
    `${alias} ficha técnica ${row.year || ""}`
  ]);
  const archiveLead = [
    `pdfs de fichas tecnicas de ${pluralizePt(row.model)}`,
    `pdfs de fichas técnicas de ${pluralizePt(row.model)}`,
    `${row.model} ficha tecnica autosclassicos`,
    `${row.model} ficha técnica autosclassicos`,
    `${row.model} ficha tecnica "Canal da Peça"`,
    `${row.model} ficha técnica "Canal da Peça"`,
    `${row.model} ficha tecnica Scribd`,
    `${row.model} ficha técnica Scribd`,
    `${row.model} ficha tecnica PDFCoffee`,
    `${row.model} ficha técnica SlideShare`,
    row.trim ? `${row.model} ${row.trim} autosclassicos` : "",
    row.trim ? `${row.model} ${row.trim} Canal da Peça` : "",
    row.trim ? `${row.model} ${row.trim} ficha tecnica` : "",
    row.trim ? `${row.model} ${row.trim} ficha técnica` : "",
    row.year ? `${row.model} ${row.year} ficha tecnica` : "",
    row.year ? `${row.model} ${row.year} ficha técnica` : ""
  ];
  const exactFicha = [
    `"ficha tecnica" "${base}"`,
    `"ficha técnica" "${base}"`,
    `${base} ficha tecnica`,
    `${base} ficha técnica`,
    `${baseNoYear} ficha tecnica ${row.year || ""}`,
    `${modelYear} ficha tecnica ${row.trim || ""}`
  ].filter((q) => !q.includes('""'));
  const official = officialDomains.flatMap((domain) => [
    ...exactFicha.map((q) => `${q} site:${domain}`),
    `${base} ficha tecnica site:${domain}`,
    `${base} especificacoes tecnicas site:${domain}`,
    `${base} catalogo tecnico site:${domain}`,
    `${base} pdf site:${domain}`
  ]);
  const support = BRAZIL_SUPPORT_DOMAINS.flatMap((domain) => [
    ...exactFicha.map((q) => `${q} site:${domain}`),
    `${base} ficha tecnica site:${domain}`
  ]);
  const archive = [
    ...archiveLead,
    ...archiveExact,
    ...exactFicha,
    `"${base}" "ficha tecnica" pdf`,
    `"${base}" "ficha técnica" pdf`,
    ...aliases.flatMap((alias) => [
      `"${alias}" "ficha tecnica" pdf`,
      `"${alias}" "ficha técnica" pdf`,
      `"${alias}" "Ficha Técnica" "Autos Clássicos"`,
      `"${alias}" autosclassicos`,
      `"${alias}" "Canal da Peça"`,
      `"${alias}" "Scribd" "Ficha Técnica"`,
      `"${alias}" "Manual de Mecânica"`,
      `"${alias}" "Manual do Mecânico"`
    ]),
    `"${base}" "Quatro Rodas"`,
    `"${base}" "Oficina Mecânica"`,
    `"${base}" "O Mecânico"`,
    `"${base}" "Conheça seu carro"`,
    `"${base}" "Conheca seu carro"`,
    `"${base}" "coleção fichas técnicas"`,
    `"${base}" "colecao fichas tecnicas"`,
    `${base} quatro rodas teste`,
    `${base} quatro rodas ficha tecnica`,
    `${base} oficina mecanica ficha tecnica`,
    `${base} conheca seu carro ficha tecnica`,
    `${base} manual ficha tecnica pdf`,
    ...BRAZIL_ARCHIVE_DOMAINS.flatMap((domain) => [
      ...exactFicha.map((q) => `${q} site:${domain}`),
      `"${base}" pdf site:${domain}`,
      `"${base}" teste site:${domain}`
    ])
  ];
  const broadBrazil = [
    ...exactFicha,
    `${base} especificacoes tecnicas Brasil`
  ];

  const unique = (items) => [...new Set(items.map((q) => q.trim()).filter(Boolean))];
  if (opts.sources === "official") return unique(official);
  if (opts.sources === "archive") return unique(archive);
  if (opts.sources === "support") return unique(support);
  return unique([...official, ...archive, ...support, ...broadBrazil]);
}

function pickFirstLink(html, predicate) {
  const raw = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const urls = raw
    .map((u) => {
      if (u.startsWith("//")) u = "https:" + u;
      if (u.includes("duckduckgo.com/l/?uddg=")) {
        const m = u.match(/uddg=([^&]+)/);
        if (m) return decodeURIComponent(m[1]);
      }
      return u;
    })
    .filter(Boolean);
  const blocked = ["duckduckgo.com", "google.com", "ebay.com", "mercadolivre.com.br", "bing.com/aclick"];
  const filtered = urls.filter((u) => !blocked.some((b) => u.includes(b)));
  if (predicate) {
    const hit = filtered.find(predicate);
    if (hit) return hit;
  }
  return filtered[0] || null;
}

function extractPairs(html) {
  const pairs = [];
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[1]);

  rows.forEach((row) => {
    const cols = row.replace(/\s+/g, " ").match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
    if (!cols || cols.length < 2) return;
    for (let i = 0; i + 1 < cols.length; i += 2) {
      const label = normalize(stripTags(cols[i]));
      const value = stripTags(cols[i + 1]);
      if (label && value) pairs.push([label, value]);
    }
  });

  const listPairs = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  listPairs.forEach((m) => {
    const item = stripTags(m[1]);
    const parts = item.split(/\s*:\s*/);
    if (parts.length >= 2) pairs.push([normalize(parts[0]), parts.slice(1).join(":").trim()]);
  });

  return pairs;
}

function applyPair(data, label, value) {
  if (label.includes("potencia") && !label.includes("especifica") && !label.includes("peso/potencia")) Object.assign(data, cleanNulls(parsePower(value)));
  if (label.includes("potncia") && !label.includes("especfica") && !label.includes("peso/potncia")) Object.assign(data, cleanNulls(parsePower(value)));
  if (label.includes("torque") && !label.includes("especific") && !label.includes("especfic") && !label.includes("peso/torque")) Object.assign(data, cleanNulls(parseTorque(value)));
  if (label.includes("cilindrada unit")) data.displacement_unit_cc = data.displacement_unit_cc ?? parseNumber(value);
  else if (label.includes("cilindrada")) data.engine_cc = data.engine_cc ?? parseNumber(value);
  if (label.includes("deslocamento")) data.engine_cc = data.engine_cc ?? parseNumber(value);
  if (label.includes("cilindros")) data.cylinders = data.cylinders ?? value;
  if (label.includes("valvulas por cilindro")) data.valves_per_cyl = data.valves_per_cyl ?? parseNumber(value);
  if (label.includes("vlvulas por cilindro")) data.valves_per_cyl = data.valves_per_cyl ?? parseNumber(value);
  if (label.includes("valvulas") && !data.valves_per_cyl) data.valves_per_cyl = parseNumber(value);
  if (label.includes("instalacao")) data.engine_installation = data.engine_installation ?? value;
  if (label.includes("posicao") && label.includes("motor")) data.engine_layout = data.engine_layout ?? value;
  if (label.includes("aspiracao")) data.aspiration = data.aspiration ?? value;
  if (label.includes("alimentacao")) data.fuel_system = data.fuel_system ?? value;
  if (label.includes("comando")) data.valve_train = data.valve_train ?? value;
  if (label.includes("diametro x curso")) Object.assign(data, cleanNulls(parseBoreStroke(value)));
  if (label.includes("diametro do cilindro") || label.includes("dimetro do cilindro")) data.bore_mm = data.bore_mm ?? parseNumber(value);
  if (label.includes("curso do pist")) data.stroke_mm = data.stroke_mm ?? parseNumber(value);
  if (label.includes("peso/potencia")) data.weight_power_ratio_kg_cv = data.weight_power_ratio_kg_cv ?? parseNumber(value);
  if (label.includes("peso/torque")) data.weight_torque_ratio_kg_kgfm = data.weight_torque_ratio_kg_kgfm ?? parseNumber(value);
  if (label === "peso" || label.includes("peso em ordem") || label.includes("peso do veiculo")) data.weight_kg = data.weight_kg ?? parseNumber(value);
  if (label.includes("comprimento")) data.length_mm = data.length_mm ?? parseNumber(value);
  if (label.includes("largura")) data.width_mm = data.width_mm ?? parseNumber(value);
  if (label.includes("altura") && !label.includes("flanco")) data.height_mm = data.height_mm ?? parseNumber(value);
  if (label.includes("entre-eixos") || label.includes("entre eixos")) data.wheelbase_mm = data.wheelbase_mm ?? parseNumber(value);
  if (label.includes("bitola dianteira")) data.front_track_mm = data.front_track_mm ?? parseNumber(value);
  if (label.includes("bitola traseira")) data.rear_track_mm = data.rear_track_mm ?? parseNumber(value);
  if (label.includes("porta-malas") || label.includes("porta malas")) data.trunk_l = data.trunk_l ?? parseNumber(value);
  if (label.includes("tanque")) data.fuel_tank_l = data.fuel_tank_l ?? parseNumber(value);
  if (label.includes("carga util")) data.payload_kg = data.payload_kg ?? parseNumber(value);
  if (label.includes("altura minima")) data.ground_clearance_mm = data.ground_clearance_mm ?? parseNumber(value);
  if (label.includes("velocidade max") || label.includes("velocidade mxima")) data.top_speed_kmh = data.top_speed_kmh ?? parseNumber(value);
  if (label.includes("0-100") || label.includes("0 a 100")) data.accel_0_100_s = data.accel_0_100_s ?? parseNumber(value);
  if (label.includes("40-100") || label.includes("40 a 100")) data.accel_40_100_s = data.accel_40_100_s ?? parseNumber(value);
  if (label.includes("aceleracao lateral")) data.lateral_accel_g = data.lateral_accel_g ?? parseNumber(value);
  if (label.includes("consumo urbano") || label === "urbano" || label === "cidade") data.city_km_l = data.city_km_l ?? parseNumber(value);
  if (label.includes("consumo rodoviario") || label.includes("consumo rodovirio") || label === "rodoviario" || label === "rodovirio" || label === "estrada") data.highway_km_l = data.highway_km_l ?? parseNumber(value);
  if (label.includes("autonomia urbana")) data.city_range_km = data.city_range_km ?? parseNumber(value);
  if (label.includes("autonomia rodoviaria")) data.highway_range_km = data.highway_range_km ?? parseNumber(value);
  if (label.includes("cambio") || label.includes("transmissao")) data.transmission_type = data.transmission_type ?? value;
  if (label.includes("tracao")) data.drivetrain = data.drivetrain ?? value;
  if (label.includes("relacoes") || label.includes("marchas")) data.gear_ratios = data.gear_ratios ?? parseGearRatios(value);
  if (label.includes("diferencial")) data.final_drive = data.final_drive ?? parseNumber(value);
  if (label.includes("suspensao dianteira")) data.front_suspension = data.front_suspension ?? value;
  if (label.includes("suspensao traseira")) data.rear_suspension = data.rear_suspension ?? value;
  if (label.includes("freios dianteiros")) data.front_brakes = data.front_brakes ?? value;
  if (label.includes("freios traseiros")) data.rear_brakes = data.rear_brakes ?? value;
  if (label.includes("direcao")) data.steering_assist = data.steering_assist ?? value;
  if (label.includes("diametro de giro")) data.turning_diameter_m = data.turning_diameter_m ?? parseNumber(value);
  if (label.includes("pneu dianteiro")) Object.assign(data, cleanNulls({ front_tire: data.front_tire ?? value, ...parseTire(value) }));
  if (label.includes("pneu traseiro")) Object.assign(data, cleanNulls({ rear_tire: data.rear_tire ?? value, ...parseTire(value) }));
  if (label.includes("estepe")) data.spare_tire = data.spare_tire ?? value;

  const cylinders = parseNumber(data.cylinders);
  if (!data.engine_cc && data.displacement_unit_cc && cylinders) {
    data.engine_cc = Math.round(data.displacement_unit_cc * cylinders);
  }
}

function cleanNulls(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined));
}

function extractSpecs(html) {
  const data = {};
  extractPairs(html).forEach(([label, value]) => applyPair(data, label, value));
  applyTextPatterns(data, stripTags(html));
  return data;
}

function applyTextPatterns(data, text) {
  const n = normalize(text);
  const raw = String(text || "");
  if (!data.power_cv) {
    const match = raw.match(/pot[eê]ncia[^0-9]{0,30}(\d+(?:[,.]\d+)?)\s*cv/i);
    if (match) data.power_cv = parseNumber(match[1]);
  }
  if (!data.torque_kgfm) {
    const match = raw.match(/torque[^0-9]{0,30}(\d+(?:[,.]\d+)?)\s*kgf?m/i);
    if (match) Object.assign(data, cleanNulls(parseTorque(match[0])));
  }
  if (!data.torque_nm) {
    const match = raw.match(/torque[^0-9]{0,30}(\d+(?:[,.]\d+)?)\s*n\.?m/i);
    if (match) Object.assign(data, cleanNulls(parseTorque(match[0])));
  }
  if (!data.accel_0_100_s) {
    const match = raw.match(/0\s*(?:a|-)\s*100[^0-9]{0,30}(\d+(?:[,.]\d+)?)\s*s/i);
    if (match) data.accel_0_100_s = parseNumber(match[1]);
  }
  if (!data.top_speed_kmh) {
    const match = raw.match(/velocidade m[aá]xima[^0-9]{0,30}(\d+(?:[,.]\d+)?)\s*km\/?h/i);
    if (match) data.top_speed_kmh = parseNumber(match[1]);
  }
  if (!data.weight_kg) {
    const match = raw.match(/peso[^0-9]{0,30}(\d{3,5})\s*kg/i);
    if (match) data.weight_kg = parseNumber(match[1]);
  }
  if (!data.tire_diameter_mm && n.includes("r")) {
    const tire = parseTire(raw);
    Object.assign(data, cleanNulls(tire));
  }
}

function looksLikeCaptcha(html) {
  const n = normalize(html);
  return n.includes("captcha") || n.includes("g-recaptcha") || n.includes("recaptcha");
}

function extractCatalogLinks(html) {
  const links = [...html.matchAll(/fichadetalhe\.asp\?codigo=\d+/gi)].map((m) => m[0]);
  const uniq = [...new Set(links)];
  return uniq.map((l) => `https://www.carrosnaweb.com.br/${l}`);
}

function carrosNaWebCatalogUrl(row) {
  if (!row.make || !row.model || !row.year) return null;
  const fabricante = encodeURIComponent(row.make);
  const varnome = encodeURIComponent(String(row.model).toUpperCase());
  const anofim = encodeURIComponent(row.year);
  return `https://www.carrosnaweb.com.br/catalogo.asp?fabricante=${fabricante}&varnome=${varnome}&anofim=${anofim}`;
}

function scoreMatch(html, row) {
  const n = normalize(stripTags(html));
  let score = 0;
  if (row.year && n.includes(String(row.year))) score += 2;
  if (row.trim && n.includes(normalize(row.trim))) score += 2;
  if (row.model && n.includes(normalize(row.model))) score += 1;
  if (row.make && n.includes(normalize(row.make))) score += 1;
  return score;
}

function looksLikeArchiveCandidate(html, row) {
  const n = normalize(stripTags(html));
  const terms = [
    "ficha tecnica",
    "ficha tcnica",
    "quatro rodas",
    "oficina mecanica",
    "o mecanico",
    "autos classicos",
    "autosclassicos",
    "conheca seu carro",
    "canal da peca"
  ];
  const hasModel = row.model && n.includes(normalize(row.model));
  const hasArchiveTerm = terms.some((term) => n.includes(term));
  return Boolean(hasModel && hasArchiveTerm);
}

function missingFields(specs) {
  return REQUIRED_FIELDS.filter((field) => specs[field] === null || specs[field] === undefined || specs[field] === "");
}

function confidenceScore(specs, matchScore) {
  const foundRequired = REQUIRED_FIELDS.length - missingFields(specs).length;
  const coverage = foundRequired / REQUIRED_FIELDS.length;
  return Math.round(Math.min(1, coverage * 0.75 + Math.min(matchScore, 6) / 6 * 0.25) * 100) / 100;
}

async function fetchHtml(url, referer = "") {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.6",
      ...(referer ? { Referer: referer } : {})
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function cachePath(cacheDir, row, suffix) {
  const safe = `${row.make}_${row.model}_${row.year}_${row.trim || "base"}_${suffix}`.replace(/[^\w.-]+/g, "_");
  return path.join(cacheDir, `${safe}.html`);
}

function shortHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

async function fetchCached(url, cacheDir, row, suffix, referer = "") {
  if (!cacheDir) return await fetchHtml(url, referer);
  const filePath = cachePath(cacheDir, row, `${suffix}_${shortHash(url)}`);
  if (fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf8");
  const html = await fetchHtml(url, referer);
  fs.writeFileSync(filePath, html, "utf8");
  return html;
}

async function searchAndExtract(row, opts) {
  const maxQueries = Number(opts.maxQueries || (opts.sources === "archive" ? 18 : 30));
  const queries = buildSearchQueries(row, opts).filter((q) => !q.includes("  ")).slice(0, maxQueries);

  let pageHtml = null;
  let source = null;
  let sourceType = null;
  if (opts.sources === "support" || opts.sources === "all") {
    const directCatalog = carrosNaWebCatalogUrl(row);
    if (directCatalog) {
      try {
        pageHtml = await fetchCached(directCatalog, opts.cacheDir, row, "carrosnaweb_catalog");
        source = directCatalog;
        sourceType = sourceTypeForUrl(directCatalog, row);
      } catch {
        pageHtml = null;
        source = null;
        sourceType = null;
      }
    }
  }

  for (let i = 0; i < queries.length; i++) {
    if (source && pageHtml) break;
    const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(queries[i])}`;
    let searchHtml = "";
    try {
      searchHtml = await fetchCached(searchUrl, opts.cacheDir, row, `search_${i + 1}`);
    } catch {
      await delay(600);
      continue;
    }
    if (looksLikeCaptcha(searchHtml)) return { status: "captcha" };
    const best =
      pickFirstLink(searchHtml, (u) => isOfficialBrazilUrl(u, row)) ||
      (opts.sources === "official" ? null : pickFirstLink(searchHtml, (u) => isBrazilArchiveUrl(u) || isPdfUrl(u))) ||
      (opts.sources === "official" ? null : pickFirstLink(searchHtml, isBrazilSupportUrl));
    if (best) {
      try {
        source = best;
        sourceType = sourceTypeForUrl(best, row);
        if (isPdfUrl(best)) break;
        pageHtml = await fetchCached(best, opts.cacheDir, row, "page");
        break;
      } catch {
        await delay(600);
      }
    }
    await delay(600);
  }

  if (!source) return { status: "not_found" };

  if (isPdfUrl(source)) {
    return {
      status: "archive_candidate",
      market: "BR",
      source_type: sourceType,
      source_url: source,
      manual_review: true,
      reason: "PDF ou scan encontrado. Necessita revisao/OCR antes de importar.",
      confidence_score: 0,
      match_score: 0,
      missing_fields: REQUIRED_FIELDS,
      specs: {}
    };
  }

  if (!pageHtml) return { status: "not_found" };

  let specs = {};
  let finalSource = source;
  let finalSourceType = sourceType;
  let matchScore = scoreMatch(pageHtml, row);

  if (source.includes("carrosnaweb.com.br") && (source.includes("catalogo.asp") || source.includes("catalogomodelo.asp"))) {
    const links = extractCatalogLinks(pageHtml).slice(0, Number(opts.maxCatalogLinks || 12));
    let bestScore = -1;
    for (let i = 0; i < links.length; i++) {
      try {
        const detailHtml = await fetchCached(links[i], opts.cacheDir, row, `detail_${i + 1}`, source);
        const currentScore = scoreMatch(detailHtml, row);
        if (currentScore > bestScore) {
          bestScore = currentScore;
          matchScore = currentScore;
          finalSource = links[i];
          finalSourceType = sourceTypeForUrl(links[i], row);
          specs = extractSpecs(detailHtml);
          if (currentScore >= 6) break;
        }
        await delay(500);
      } catch {
        continue;
      }
    }
  } else {
    specs = extractSpecs(pageHtml);
  }

  const missing = missingFields(specs);
  if (!Object.keys(specs).length && finalSourceType === "archive_br" && looksLikeArchiveCandidate(pageHtml, row)) {
    return {
      status: "archive_candidate",
      market: "BR",
      source_type: finalSourceType,
      source_url: finalSource,
      manual_review: true,
      reason: "Pagina de acervo encontrada, mas sem extracao estruturada confiavel.",
      confidence_score: Math.round(Math.min(0.5, 0.2 + matchScore / 20) * 100) / 100,
      match_score: matchScore,
      missing_fields: REQUIRED_FIELDS,
      specs: {}
    };
  }

  return {
    status: Object.keys(specs).length ? "found" : "empty",
    market: "BR",
    source_type: finalSourceType,
    source_url: finalSource,
    confidence_score: confidenceScore(specs, matchScore),
    match_score: matchScore,
    missing_fields: missing,
    specs
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const input = args.input;
  const out = args.out || "data/specs.jsonl";
  const cacheDir = args.cache || "";
  const throttle = Number(args.throttle || 3000);
  const sources = args.sources || "all";

  if (!input) {
    console.error("Uso: node scripts/specs_agent.js --input data/vehicles.csv --out data/specs.jsonl --cache data/cache");
    process.exit(1);
  }

  if (!["all", "official", "archive", "support"].includes(sources)) {
    console.error("--sources deve ser all, official, archive ou support");
    process.exit(1);
  }

  if (cacheDir) fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(out, "", "utf8");

  const rows = readCsv(input);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const res = await searchAndExtract(row, {
        cacheDir,
        sources,
        maxQueries: args["max-queries"],
        maxCatalogLinks: args["max-catalog-links"]
      });
      const record = {
        make: row.make,
        model: row.model,
        year: row.year,
        trim: row.trim,
        ...res
      };
      appendJsonl(out, record);
      console.log(`[${i + 1}/${rows.length}] ${row.make} ${row.model} ${row.year} ${row.trim || ""}: ${record.status} (${record.confidence_score ?? "-"})`);
      await delay(throttle);
    } catch (e) {
      appendJsonl(out, {
        make: row.make,
        model: row.model,
        year: row.year,
        trim: row.trim,
        status: "error",
        error: e.message
      });
      console.log(`[${i + 1}/${rows.length}] ${row.make} ${row.model}: error ${e.message}`);
    }
  }

  console.log(`OK: ${rows.length} registros -> ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
