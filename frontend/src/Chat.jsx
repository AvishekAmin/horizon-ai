import "./App.css";
import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { MyContext } from "./MyContext.jsx";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function CodeBlock({ className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const codeContent = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!match && !className) {
    return (
      <code className="inline-code" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="code-container">
      <div className="code-header">
        <span className="code-lang">{lang || "code"}</span>
        <button
          className="copy-btn"
          onClick={handleCopy}
          type="button"
          title="Copy code"
        >
          {copied ? (
            <>
              <i className="fa-solid fa-check"></i>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <i className="fa-regular fa-copy"></i>
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-pre">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

function TypewriterMessage({ content, isNew, onProgress, onFinish }) {
  const [displayedText, setDisplayedText] = useState(isNew ? "" : content);
  const [isDone, setIsDone] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      return;
    }

    let currentIndex = 0;
    const totalLength = content.length;
    const step =
      totalLength > 800 ? 4 : totalLength > 400 ? 3 : totalLength > 150 ? 2 : 1;
    const intervalTime = totalLength > 800 ? 10 : 15;

    const interval = setInterval(() => {
      currentIndex += step;
      if (currentIndex >= totalLength) {
        setDisplayedText(content);
        setIsDone(true);
        clearInterval(interval);
        if (onFinish) onFinish();
      } else {
        setDisplayedText(content.slice(0, currentIndex));
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [content, isNew, onFinish]);

  useEffect(() => {
    if (!isDone && onProgress) {
      onProgress();
    }
  }, [displayedText, isDone, onProgress]);

  return (
    <div className="assistant-markdown">
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: CodeBlock,
        }}
      >
        {displayedText}
      </ReactMarkdown>
      {!isDone && <span className="typing-cursor">▊</span>}
    </div>
  );
}

function Chat() {
  const { prevChats, loading } = useContext(MyContext);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [prevChats, loading, scrollToBottom]);

  const copyMessageText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="chats-container">
      <div className="chats-stream">
        {prevChats?.map((chat, idx) => {
          const isUser = chat.role === "user";

          return (
            <div
              key={idx}
              className={`message-row ${isUser ? "user-row" : "assistant-row"} ${chat.isError ? "error-row" : ""}`}
            >
              <div className="message-wrapper">
                <div className="message-avatar">
                  {isUser ? (
                    <div className="avatar-user" title="You">
                      <i className="fa-solid fa-user"></i>
                    </div>
                  ) : (
                    <div className="avatar-assistant" title="Horizon AI">
                      <i className="fa-solid fa-bolt-lightning"></i>
                    </div>
                  )}
                </div>

                <div className="message-body">
                  <div className="message-sender-name">
                    {isUser ? "You" : "Horizon AI"}
                  </div>

                  <div className="message-content">
                    {isUser ? (
                      <p className="user-text">{chat.content}</p>
                    ) : chat.isError ? (
                      <div className="assistant-markdown error-markdown">
                        <ReactMarkdown>{chat.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <TypewriterMessage
                        content={chat.content}
                        isNew={!!chat.isNew}
                        onProgress={scrollToBottom}
                        onFinish={() => {
                          chat.isNew = false;
                        }}
                      />
                    )}
                  </div>

                  {!isUser && !chat.isError && (
                    <div className="message-actions">
                      <button
                        className="msg-action-btn"
                        onClick={() => copyMessageText(chat.content, idx)}
                        title="Copy text"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <i className="fa-solid fa-check"></i> Copied
                          </>
                        ) : (
                          <>
                            <i className="fa-regular fa-copy"></i> Copy
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="message-row assistant-row loading-row">
            <div className="message-wrapper">
              <div className="message-avatar">
                <div
                  className="avatar-assistant pulse-avatar"
                  title="Horizon AI"
                >
                  <i className="fa-solid fa-bolt-lightning"></i>
                </div>
              </div>
              <div className="message-body">
                <div className="message-sender-name">Horizon AI</div>
                <div className="typing-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default Chat;
