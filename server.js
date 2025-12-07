// server.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const llmRouter = require("./llmRouter");
const mcpRouter = require("./mcpRouter");
const connectDB = require("./db");

const app = express();
app.use(bodyParser.json());

app.post("/api/query", async (req, res) => {
  try {
    await connectDB();

    const userQuery = req.body.query;
    if (!userQuery) return res.json({ answer: "Please provide a query." });

    const route = await llmRouter(userQuery);
    const result = await mcpRouter(route);

    return res.json({ answer: result });
  } catch (err) {
    console.error("Error:", err);
    return res.json({ answer: "Server error occurred." });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
