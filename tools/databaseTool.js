// tools/databaseTool.js
const connectDB = require("../db");

async function databaseTool(params) {
  const db = await connectDB();
  const { entity, operation, filter, threshold } = params;

  if (entity === "employees" && operation === "count") {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastMonth = month === 0 ? 12 : month;
    const lastYear = month === 0 ? year - 1 : year;

    const start = `${lastYear}-${String(lastMonth).padStart(2, "0")}-01`;
    const end = `${lastYear}-${String(lastMonth).padStart(2, "0")}-31`;

    const count = await db.collection("employees").countDocuments({
      joined_at: { $gte: start, $lte: end },
    });

    return { entity, operation, filter, count, period: { start, end } };
  }

  if (entity === "orders" && operation === "list") {
    const t = threshold || 500;

    const orders = await db
      .collection("orders")
      .find({ amount: { $gt: t } })
      .toArray();

    return {
      entity,
      operation,
      filter,
      threshold: t,
      orders,
    };
  }

  return { message: "Query not implemented" };
}

module.exports = databaseTool;
