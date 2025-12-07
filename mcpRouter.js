// mcpRouter.js
const weatherTool = require("./tools/weatherTool");
const databaseTool = require("./tools/databaseTool");

async function mcpRouter(route) {
  const { tool, params } = route;

  if (tool === "weather") {
    const w = await weatherTool(params);
    return `The weather in ${w.city} is ${w.temperature}°C with ${w.condition}.`;
  }

  if (tool === "database") {
    const result = await databaseTool(params);

    if (result.entity === "employees")
      return `${result.count} employees joined between ${result.period.start} and ${result.period.end}.`;

    if (result.entity === "orders")
      return result.orders.length === 0
        ? `There are no orders over $${result.threshold}.`
        : `There are ${result.orders.length} orders over $${result.threshold}: ` +
            result.orders
              .map((o) => `${o.customer_name} ($${o.amount})`)
              .join(", ");
  }

  if (tool === "direct") return params.response;

  return "Unable to determine proper tool.";
}

module.exports = mcpRouter;
