require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const PORT = 5000; // 🔥 IMPORTANT: Different from FastAPI

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* =========================
   GEMINI AI SETUP
========================= */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

/* =========================
   FILE UPLOAD SETUP
========================= */

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

let UPLOADED_PROBLEMS = [];

/* =========================
   CHATBOT ROUTE
========================= */

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const prompt = `
    You are an expert agricultural assistant named 'Kisan AI'.
    Farmer asks: "${message}"
    Answer briefly (under 60 words).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({
      reply: "AI service temporarily unavailable."
    });
  }
});

/* =========================
   CROP IMAGE UPLOAD
========================= */

app.post("/problem/upload", upload.single("cropImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const newProblem = {
      id: Date.now(),
      imagePath: `/uploads/${req.file.filename}`,
      status: "Pending AI Analysis"
    };

    UPLOADED_PROBLEMS.push(newProblem);

    // 🔥 OPTIONAL: Send image to Gemini Vision
    const imagePath = path.join(__dirname, req.file.path);

    const imageBytes = fs.readFileSync(imagePath);

    const visionModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    }); 

    const result = await visionModel.generateContent([
      {
        inlineData: {
          data: imageBytes.toString("base64"),
          mimeType: req.file.mimetype
        }
      },
      "Identify crop disease in this image and respond in one short line."
    ]);

    const aiResponse = result.response.text();

    newProblem.status = aiResponse;

    res.json({
      message: "Uploaded & Analyzed",
      problem: newProblem
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Upload failed." });
  }
});

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.json({ status: "Node AI Service Running" });
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () =>
  console.log(`✅ Express AI running at http://localhost:${PORT}`)
);
  