const db = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const trimId = parseInt(req.query.trim_id, 10);
  if (!trimId) {
    return res.status(400).json({ error: "trim_id is required" });
  }

  const result = await db.query(
    "SELECT * FROM specs WHERE trim_id = $1 LIMIT 1",
    [trimId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "specs not found" });
  }

  res.status(200).json(result.rows[0]);
};
