import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: "5mb" }));
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: "Horizon AI — Conversational AI Platform API",
    status: "running",
    version: "1.0.0",
  });
});

app.use("/api", chatRoutes);

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn(
      "WARNING: Neither MONGO_URI nor MONGODB_URI is set in Backend/.env!",
    );
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("Successfully connected to MongoDB Database!");
  } catch (err) {
    console.error("Failed to connect to MongoDB Database:", err.message);
  }
};

app.listen(PORT, () => {
  console.log(`Horizon AI Backend running on port ${PORT}`);
  connectDB();
});

export default app;
