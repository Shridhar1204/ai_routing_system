# 🤖 AI-Driven Natural Language Routing System

A fully functional AI-driven routing system that accepts natural language queries, uses the Gemini LLM to determine the correct backend tool, executes the tool, and returns a clear, consolidated English response.

The architecture is inspired by modern AI agent frameworks such as **OpenAI Function Calling** and the **ReAct pattern**.

---

## 🚀 Features

- **Natural-Language Query Understanding**: Interpret everyday questions without requiring strict command syntax
  - Examples: 
    - *"What's the weather in Mumbai right now?"*
    - *"How many employees joined last month?"*
    - *"List all orders above $500."*

- **Real LLM Routing**: Uses Gemini 2.5 Flash to generate structured JSON routing instructions

- **Fault-Tolerant Routing**: Includes a rule-based fallback system to prevent crashes if the LLM returns invalid JSON, ensuring production stability

- **Modular Tooling**: Easily extensible design to integrate new tools (e.g., Finance, HR, Search)

- **Clean English Output**: The system (via the MCP Router) converts raw tool output (e.g., SQL results, API dumps) into a single, readable sentence

---

## 🧠 Architectural Flow

The pipeline uses a **Model Context Protocol (MCP)**-inspired flow for robust agent execution:

```
User Query
    ↓
Gemini LLM: Receives the query and returns a structured JSON object containing the tool and params
    ↓
MCP Router (mcpRouter.js): Coordinates the execution, selecting the appropriate tool based on the JSON
    ↓
Tools (weatherTool.js / databaseTool.js): Execute the core logic
    ↓
Final English Answer: The MCP Router formats the tool's raw output into a clean, professional response
```

### JSON Routing Example (What Gemini Returns)

```json
{
  "tool": "weather",
  "params": {
    "city": "Mumbai",
    "units": "metric"
  }
}
```

---

## 🛠 Backend Tools

The system integrates with two distinct real-world tools:

### 🌦 Weather Tool (`weatherTool.js`)
- Connects to the **OpenWeather API** to fetch live, real-time weather data
- **Example Output**: *"The weather in Chennai is 24.5°C with mist."*

### 🗄 MongoDB Database Tool (`databaseTool.js`)
- A seeded MongoDB powers queries for business data, automatically seeding on startup for convenience
- **Supported Queries**: Counting employees by join date, listing orders by threshold
- **Example Outputs**: 
  - *"3 employees joined last month."*
  - *"I found 2 orders above $500: Globex ($800), Stark ($650)."*

### 💬 Direct LLM Tool (`direct`)
- Used when a query does not require a specific external tool (e.g., *"Explain X"*)
- The response is a clean text output generated directly by the LLM

---

## 📝 API Usage

The system exposes a single, simple POST endpoint.

| Method | Endpoint     | Description                                              |
|--------|--------------|----------------------------------------------------------|
| POST   | `/api/query` | Submits a natural language query for routing and execution |

### Example Request

```json
{
  "query": "Tell me the weather in Chennai"
}
```

### Example Response

```json
{
  "answer": "The weather in Chennai is 24.5°C with mist."
}
```

### Supported Query Types

| Example Query                          | Routed Tool | Output Description      |
|----------------------------------------|-------------|-------------------------|
| "Weather in Delhi"                     | `weather`   | Live weather sentence   |
| "How many employees joined last month?"| `database`  | Count summary           |
| "List all orders above $500"           | `database`  | Itemized summary        |
| "Explain X"                            | `direct`    | Clean text from LLM     |

---

## 📦 Project Structure

```
routing_system/
│
├── server.js             # Main Express API server
├── llmRouter.js          # Real Gemini router + fallback mock router
├── mcpRouter.js          # Tool coordinator
├── db.js                 # MongoDB connection + auto-seeding
│
└── tools/
    ├── weatherTool.js    # Live OpenWeather integration
    └── databaseTool.js   # Employee + order queries
```

---

## ⚙️ Setup Instructions

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Create `.env` File

Create a file named `.env` in the root directory and populate it with your API keys and configuration.

> **Note**: The `.env` file is ignored via `.gitignore` to protect secrets.

```env
PORT=3000

# LLM Routing
GEMINI_API_KEY=your_real_gemini_api_key_here
USE_MOCK_LLM=false         # Set to 'true' to bypass Gemini and use only the mock router

# Weather API
WEATHER_API_KEY=your_openweather_api_key_here

# MongoDB (local or Atlas)
MONGO_URL=mongodb_url_here
```

### 3️⃣ Running the Server

Start the application using Node.js:

```bash
node server.js
```

Upon successful startup, you should see the confirmation message:

```
Server running on port 3000
```

---

## 🧪 Testing the API

You can test the API using `curl`, Postman, or any HTTP client:

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the weather in Mumbai?"}'
```

---

## 🔧 Configuration Options

### Using Mock LLM Router

To test without consuming Gemini API credits, set `USE_MOCK_LLM=true` in your `.env` file. This will use a rule-based fallback router instead of the Gemini API.

### MongoDB Setup

- **Local**: Use `mongodb://127.0.0.1:27017/ai_routing_db`
- **Atlas**: Replace with your MongoDB Atlas connection string

The database will automatically seed sample data on startup.

---

## 🚦 Future Enhancements

- Add more tools (Finance, HR, Search, etc.)
- Implement conversation history for multi-turn interactions
- Add authentication and rate limiting
- Deploy to cloud platforms (AWS, GCP, Azure)
- Add comprehensive logging and monitoring

---

