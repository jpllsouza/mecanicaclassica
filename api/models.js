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
    "SELECT id, name, start_year, end_year FROM models WHERE make_id = $1 ORDER BY name ASC",
    [makeId]
  );

  res.status(200).json(result.rows);
};
