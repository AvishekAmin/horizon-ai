import "./App.css";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { MyContext } from "./MyContext.jsx";
import { useState, useEffect, useCallback } from "react";
import { v1 as uuidv1 } from "uuid";

const API_BASE = "http://localhost:8080/api";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getAllThreads = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/thread`);
      if (!response.ok) {
        throw new Error(`Failed to load threads: ${response.statusText}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setAllThreads(data);
      }
    } catch (err) {
      console.warn("Could not fetch conversation history:", err.message);
    }
  }, []);

  useEffect(() => {
    getAllThreads();
  }, [getAllThreads]);

  const createNewChat = useCallback(() => {
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setCurrThreadId(uuidv1());
    setPrevChats([]);
    setError(null);
    setIsQuotaError(false);
    setSidebarOpen(false);
  }, []);

  const changeThread = useCallback(async (newThreadId) => {
    if (!newThreadId || newThreadId === currThreadId && !newChat) return;

    setCurrThreadId(newThreadId);
    setError(null);
    setIsQuotaError(false);
    setSidebarOpen(false);

    try {
      const response = await fetch(`${API_BASE}/thread/${newThreadId}`);
      if (!response.ok) {
        throw new Error(`Thread not found`);
      }
      const data = await response.json();
      setPrevChats(Array.isArray(data) ? data : []);
      setNewChat(false);
      setReply(null);
    } catch (err) {
      console.error("Error changing thread:", err);
      setError("Unable to load the selected conversation.");
    }
  }, [currThreadId, newChat]);

  const deleteThread = useCallback(async (threadId) => {
    try {
      const response = await fetch(`${API_BASE}/thread/${threadId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }

      setAllThreads((prev) => prev.filter((t) => t.threadId !== threadId));

      if (threadId === currThreadId) {
        createNewChat();
      }
    } catch (err) {
      console.error("Error deleting thread:", err);
      setError("Failed to delete conversation thread.");
    }
  }, [currThreadId, createNewChat]);

  const sendMessage = useCallback(
    async (textToSend) => {
      const messageText = (textToSend || prompt).trim();
      if (!messageText || loading) return;

      const userMessage = {
        role: "user",
        content: messageText,
        timestamp: new Date().toISOString(),
      };

      setPrevChats((prev) => [...prev, userMessage]);
      setPrompt("");
      setLoading(true);
      setError(null);
      setIsQuotaError(false);
      setNewChat(false);

      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            threadId: currThreadId,
            message: messageText,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const isQuota = response.status === 429 || data.isQuota;
          setIsQuotaError(isQuota);
          const errorMsg =
            data.error || "Failed to receive response from Horizon AI.";
          setError(errorMsg);

          setPrevChats((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `⚠️ **Error:** ${errorMsg}`,
              isError: true,
              timestamp: new Date().toISOString(),
            },
          ]);
          return;
        }

        setReply(data.reply);
        setPrevChats((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            isNew: true,
            timestamp: new Date().toISOString(),
          },
        ]);

        getAllThreads();
      } catch (err) {
        console.error("Network or execution error:", err);
        const netErrorMsg =
          "Unable to connect to the Horizon AI backend. Please verify the server is running on port 8080.";
        setError(netErrorMsg);
        setPrevChats((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ **Connection Error:** ${netErrorMsg}`,
            isError: true,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [prompt, loading, currThreadId, getAllThreads]
  );

  const providerValues = {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setCurrThreadId,
    newChat,
    setNewChat,
    prevChats,
    setPrevChats,
    allThreads,
    setAllThreads,
    loading,
    setLoading,
    error,
    setError,
    isQuotaError,
    sidebarOpen,
    setSidebarOpen,
    sendMessage,
    createNewChat,
    changeThread,
    deleteThread,
    getAllThreads,
  };

  return (
    <MyContext.Provider value={providerValues}>
      <div className="app">
        <Sidebar />
        <ChatWindow />
      </div>
    </MyContext.Provider>
  );
}

export default App;
