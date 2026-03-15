const db = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }

  const {
    make,
    model,
    year,
    trim,
    source_url,
    payload
  } = body || {};

  if (!make || !model || !year || !payload) {
    return res.status(400).json({ error: "make, model, year, payload required" });
  }

  const result = await db.query(
    `INSERT INTO suggestions (make, model, year, trim, source_url, payload)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [make, model, year, trim || null, source_url || null, JSON.stringify(payload)]
  );

  res.status(201).json({ id: result.rows[0].id, status: "pending" });
};
