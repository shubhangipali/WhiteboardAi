import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in backend/.env");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate-diagram", async (req, res) => {
  const { prompt } = req.body;

  try {
    // Mock API response for testing
    let mockResponse = [];

    if (prompt.toLowerCase().includes("login")) {
      mockResponse = [
        { text: "User enters credentials" },
        { text: "Validate input" },
        { text: "Send API request" },
        { text: "Check database" },
        { text: "Return response" },
      ];
    } else if (prompt.toLowerCase().includes("payment")) {
      mockResponse = [
        { text: "User selects product" },
        { text: "Enter payment details" },
        { text: "Process payment" },
        { text: "Confirm transaction" },
      ];
    } else if (prompt.toLowerCase().includes("workflow")) {
      mockResponse = [
        { text: "Start process" },
        { text: "Validate data" },
        { text: "Execute action" },
        { text: "Log results" },
      ];
    } else {
      mockResponse = [
        { text: "Step 1: Initialize" },
        { text: "Step 2: Process" },
        { text: "Step 3: Complete" },
      ];
    }

    res.json(mockResponse);
  } catch (err) {
    console.error("Generate diagram failed:", err);
    res.status(500).json({
      error: "Diagram generation failed",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

app.listen(5000, () => {
  console.log("🚀 Backend running on http://localhost:5000");
});
