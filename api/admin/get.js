const db = require("../_db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminKey = req.headers["x-admin-key"];
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const trimId = parseInt(req.query.trim_id, 10);
  if (!trimId) {
    return res.status(400).json({ error: "trim_id is required" });
  }

  const result = await db.query(
    `SELECT t.id AS trim_id, m.name AS make, mo.name AS model, t.year, t.name AS trim, s.*
     FROM trims t
     JOIN models mo ON mo.id = t.model_id
     JOIN makes m ON m.id = mo.make_id
     LEFT JOIN specs s ON s.trim_id = t.id
     WHERE t.id = $1
     LIMIT 1`,
    [trimId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "not found" });
  }

  res.status(200).json(result.rows[0]);
};
