const db = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const makeId = parseInt(req.query.make_id, 10);
  if (!makeId) {
    return res.status(400).json({ error: "make_id is required" });
  }

  const result = await db.query(
    `SELECT DISTINCT mo.id, mo.name, mo.start_year, mo.end_year
     FROM models mo
     JOIN trims t ON t.model_id = mo.id
     JOIN specs s ON s.trim_id = t.id
     WHERE mo.make_id = $1
     ORDER BY mo.name ASC`,
    [makeId]
  );

  res.status(200).json(result.rows);
};
