"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, CreditCard, Send } from "lucide-react";
import type { ChatMessage } from "@/lib/api";
import ProfileSwitcher from "@/app/components/ProfileSwitcher";

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isDone: boolean;
  onSendMessage: (text: string) => void;
  hasCards?: boolean;
  onViewCards?: () => void;
  hasSavedCards?: boolean;
  onViewSavedCards?: () => void;
  onGetCards?: () => void;
  canGetCards?: boolean;
}

export default function ChatPanel({ messages, isLoading, isDone, onSendMessage, hasCards, onViewCards, hasSavedCards, onViewSavedCards, onGetCards, canGetCards }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
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

  const hasText = input.trim().length > 0;

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-[#DADCE0] bg-white min-h-0 dark:border-white/10 dark:bg-[#2D2E30]">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#DADCE0] px-4 py-3 dark:border-white/10">
        <ProfileSwitcher />
        <div className="flex items-center gap-2">
          {hasCards && onViewCards && (
            <button
              onClick={onViewCards}
              className="flex items-center gap-1.5 rounded-lg border border-[#DADCE0] px-2.5 py-1.5 text-[11px] font-medium text-[#5F6368] transition hover:bg-[#F1F3F4] dark:border-white/10 dark:text-[#9AA0A6] dark:hover:bg-white/5"
            >
              <CreditCard className="h-3.5 w-3.5" />
              View Credit Cards
            </button>
          )}
          {hasSavedCards && onViewSavedCards && (
            <button
              onClick={onViewSavedCards}
              className="flex items-center gap-1.5 rounded-lg border border-[#DADCE0] px-2.5 py-1.5 text-[11px] font-medium text-[#5F6368] transition hover:bg-[#F1F3F4] dark:border-white/10 dark:text-[#9AA0A6] dark:hover:bg-white/5"
            >
              <Bookmark className="h-3.5 w-3.5" />
              Saved Cards
            </button>
          )}
        </div>
      </div>

      {/* Message list */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 min-h-0">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[12px] text-[#9AA0A6] dark:text-[#5F6368]">Starting conversation…</p>
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === "model" ? (
            // CardGenius bubble — left aligned
            <motion.div
              key={i}
              className="flex items-end gap-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-800 text-[9px] font-bold text-white">
              O‿O
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-transparent bg-[#F1F3F4] px-3 py-2 text-[13px] leading-relaxed text-[#202124] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#E8EAED]">
                <MessageText text={msg.content} />
              </div>
            </motion.div>
          ) : (
            // User bubble — right aligned
            <motion.div
              key={i}
              className="flex items-end justify-end gap-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-[#B8BCC4] bg-[#CDD0D6] px-3 py-2 text-[13px] leading-relaxed text-[#202124] dark:border-white/[0.18] dark:bg-white/[0.15] dark:text-[#E8EAED]">
                {msg.content}
              </div>
            </motion.div>
          )
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-end gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-800 text-[9px] font-bold text-white">
              O‿O
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-transparent bg-[#F1F3F4] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9AA0A6] [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9AA0A6] [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9AA0A6] [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="border-t border-[#DADCE0] px-3 py-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Type your answer…"
            className="flex-1 rounded-full border border-[#DADCE0] bg-[#F8F9FA] px-4 py-2 text-[13px] text-[#202124] placeholder-[#9AA0A6] outline-none transition focus:border-[#1A73E8] focus:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-[#E8EAED] dark:placeholder-[#5F6368] dark:focus:border-white/30 dark:focus:bg-white/[0.07]"
          />
          <button
            onClick={handleSend}
            disabled={!hasText || isLoading}
            aria-label="Send message"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
              hasText && !isLoading
                ? "bg-white text-gray-900 glow-emerald-sm hover:brightness-90"
                : "bg-[#F1F3F4] text-gray-400 dark:bg-white/[0.06] dark:text-gray-600"
            } disabled:cursor-not-allowed`}
          >
            <Send className="h-4 w-4" />
          </button>
          {onGetCards && (
            <button
              onClick={onGetCards}
              disabled={!canGetCards || isLoading}
              className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-all ${
                canGetCards && !isLoading
                  ? "animate-neon-pulse bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 hover:scale-[1.02] cursor-pointer"
                  : "bg-black/5 text-black/25 border border-black/10 dark:bg-white/5 dark:text-white/20 dark:border-white/10 cursor-not-allowed"
              }`}
            >
              Get Cards Now
            </button>
          )}
        </div>
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
