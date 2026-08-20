const db = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const modelId = parseInt(req.query.model_id, 10);
  if (!modelId) {
    return res.status(400).json({ error: "model_id is required" });
  }

  const result = await db.query(
    `SELECT t.id, t.name, t.year
     FROM trims t
     JOIN specs s ON s.trim_id = t.id
     WHERE t.model_id = $1
     ORDER BY t.year ASC, t.name ASC`,
    [modelId]
  );

  res.status(200).json(result.rows);
};
