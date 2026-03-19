const db = require("../_db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminKey = req.headers["x-admin-key"];
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);

  const result = await db.query(
    `SELECT t.id AS trim_id, m.name AS make, mo.name AS model, t.year, t.name AS trim
     FROM trims t
     JOIN models mo ON mo.id = t.model_id
     JOIN makes m ON m.id = mo.make_id
     ORDER BY t.year DESC, m.name, mo.name, t.name
     LIMIT $1`,
    [limit]
  );

  res.status(200).json(result.rows);
};
