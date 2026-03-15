const db = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = await db.query(
    "SELECT id, name FROM makes ORDER BY name ASC",
    []
  );

  res.status(200).json(result.rows);
};
