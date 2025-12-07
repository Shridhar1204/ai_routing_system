
require("dotenv").config();
const { MongoClient } = require("mongodb");

let database = null;
let client = null;

async function connectDB() {
  if (database) return database;

  if (!client) {
    client = new MongoClient(process.env.MONGO_URL); 
  }

  await client.connect();
  database = client.db("ai_routing_db");

  await seed(database);
  return database;
}

async function seed(db) {
  const employees = db.collection("employees");
  const orders = db.collection("orders");

  if (await employees.countDocuments() === 0) {
    await employees.insertMany([
      { name: "Shridhar", joined_at: "2025-10-05", department: "Engineering" },
      { name: "Raju", joined_at: "2025-11-01", department: "Sales" },
      { name: "Chinmay", joined_at: "2025-11-15", department: "HR" },
      { name: "Vilay", joined_at: "2025-09-20", department: "Engineering" },
      { name: "Aman", joined_at: "2025-11-28", department: "Marketing" }
    ]);
  }

  if (await orders.countDocuments() === 0) {
    await orders.insertMany([
      { customer_name: "DCEU", amount: 450, created_at: "2025-11-01" },
      { customer_name: "Google", amount: 800, created_at: "2025-11-10" },
      { customer_name: "Inxtinct", amount: 1200, created_at: "2025-11-20" },
      { customer_name: "Netflix", amount: 300, created_at: "2025-10-15" },
      { customer_name: "Stark Industries", amount: 650, created_at: "2025-11-25" }
    ]);
  }
}

module.exports = connectDB;
