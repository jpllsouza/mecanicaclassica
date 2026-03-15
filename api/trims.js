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
    "SELECT id, name, year FROM trims WHERE model_id = $1 ORDER BY year ASC, name ASC",
    [modelId]
  );

  res.status(200).json(result.rows);
};
