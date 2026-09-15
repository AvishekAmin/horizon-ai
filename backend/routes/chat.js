import express from "express";
import Thread from "../models/Thread.js";
import getGeminiAPIResponse from "../utils/gemini.js";

const router = express.Router();

/**
 * Health check / ping
 */
router.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "Horizon AI API",
    time: new Date().toISOString(),
  });
});

/**
 * Get all conversation threads
 */
router.get("/thread", async (req, res) => {
  try {
    const threads = await Thread.find(
      {},
      { threadId: 1, title: 1, createdAt: 1, updatedAt: 1 }
    ).sort({ updatedAt: -1 });

    return res.status(200).json(threads);
  } catch (err) {
    console.error("Error fetching threads:", err);
    return res.status(500).json({ error: "Failed to fetch conversation history" });
  }
});

/**
 * Get all messages for a specific thread
 */
router.get("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await Thread.findOne({ threadId });

    if (!thread) {
      return res.status(404).json({ error: "Conversation thread not found" });
    }

    return res.status(200).json(thread.messages);
  } catch (err) {
    console.error(`Error fetching thread ${threadId}:`, err);
    return res.status(500).json({ error: "Failed to fetch conversation messages" });
  }
});

/**
 * Delete a specific conversation thread
 */
router.delete("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    const deletedThread = await Thread.findOneAndDelete({ threadId });

    if (!deletedThread) {
      return res.status(404).json({ error: "Thread not found or already deleted" });
    }

    return res.status(200).json({
      success: true,
      message: "Thread deleted successfully",
      threadId,
    });
  } catch (err) {
    console.error(`Error deleting thread ${threadId}:`, err);
    return res.status(500).json({ error: "Failed to delete conversation thread" });
  }
});

/**
 * Send a message and get a response from Horizon AI (Gemini 3.8 Flash)
 */
router.post("/chat", async (req, res) => {
  const { threadId, message } = req.body;

  if (!threadId || typeof threadId !== "string" || !threadId.trim()) {
    return res.status(400).json({ error: "threadId is required" });
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "A non-empty message is required" });
  }

  const cleanMessage = message.trim();

  try {
    let thread = await Thread.findOne({ threadId });
    let historyContext = [];

    if (!thread) {
      // Create concise title from first message
      const generatedTitle =
        cleanMessage.length > 35
          ? `${cleanMessage.slice(0, 35)}...`
          : cleanMessage;

      thread = new Thread({
        threadId,
        title: generatedTitle,
        messages: [{ role: "user", content: cleanMessage }],
      });
    } else {
      // Collect prior conversation context before appending current turn
      historyContext = thread.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      thread.messages.push({ role: "user", content: cleanMessage });
    }

    // Call Gemini with user prompt and context
    const assistantReply = await getGeminiAPIResponse(cleanMessage, historyContext);

    // Save assistant reply
    thread.messages.push({ role: "assistant", content: assistantReply });
    thread.updatedAt = new Date();
    await thread.save();

    return res.status(200).json({
      reply: assistantReply,
      threadId: thread.threadId,
      title: thread.title,
    });
  } catch (err) {
    console.error("Chat route processing error:", err);
    const statusCode = err.statusCode || (err.isQuota ? 429 : 500);

    return res.status(statusCode).json({
      error:
        err.message ||
        "An unexpected error occurred while communicating with Horizon AI.",
      isQuota: !!err.isQuota,
    });
  }
});

export default router;
