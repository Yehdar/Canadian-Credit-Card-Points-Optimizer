"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/api";

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isDone: boolean;
  onSendMessage: (text: string) => void;
}

export default function ChatPanel({ messages, isLoading, isDone, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSend() {
    const text = input.trim();
    if (!text || isLoading || isDone) return;
    onSendMessage(text);
    setInput("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-[#DADCE0] bg-white dark:border-[#3C4043] dark:bg-[#2D2E30]">

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#DADCE0] px-4 py-3 dark:border-[#3C4043]">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A73E8] text-[11px] font-bold text-white">
          CG
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[#202124] dark:text-[#E8EAED]">CardGenius</p>
          <p className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">AI Card Advisor</p>
        </div>
      </div>

      {/* Message list */}
      <div className="flex h-[300px] flex-col gap-3 overflow-y-auto px-4 py-4 lg:h-[320px]">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[12px] text-[#9AA0A6] dark:text-[#5F6368]">Starting conversation…</p>
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === "model" ? (
            // CardGenius bubble — left aligned
            <div key={i} className="flex items-end gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1A73E8] text-[9px] font-bold text-white">
                CG
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-[#F1F3F4] px-3 py-2 text-[13px] leading-relaxed text-[#202124] dark:bg-[#3C4043] dark:text-[#E8EAED]">
                <MessageText text={msg.content} />
              </div>
            </div>
          ) : (
            // User bubble — right aligned
            <div key={i} className="flex items-end justify-end gap-2">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#1A73E8] px-3 py-2 text-[13px] leading-relaxed text-white">
                {msg.content}
              </div>
            </div>
          )
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-end gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1A73E8] text-[9px] font-bold text-white">
              CG
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[#F1F3F4] px-4 py-3 dark:bg-[#3C4043]">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9AA0A6] [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9AA0A6] [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9AA0A6] [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="border-t border-[#DADCE0] px-3 py-3 dark:border-[#3C4043]">
        {isDone ? (
          <p className="text-center text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
            Conversation complete — results shown below.
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Type your answer…"
              className="flex-1 rounded-full border border-[#DADCE0] bg-[#F8F9FA] px-4 py-2 text-[13px] text-[#202124] placeholder-[#9AA0A6] outline-none transition focus:border-[#1A73E8] focus:bg-white disabled:opacity-50 dark:border-[#3C4043] dark:bg-[#202124] dark:text-[#E8EAED] dark:placeholder-[#5F6368] dark:focus:bg-[#2D2E30]"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1A73E8] text-white transition hover:bg-[#1557B0] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SendIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Renders model text preserving line breaks
function MessageText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
