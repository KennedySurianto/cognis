"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Send, User, Loader2 } from "lucide-react";

export function ChatInterface() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  // status can be: 'idle', 'submitted', or 'streaming'
  const isSubmitting = status === "submitted";
  const isStreaming = status === "streaming";
  const isLoading = isSubmitting || isStreaming;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, status]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
      <header className="flex h-16 shrink-0 items-center border-b bg-white px-6 dark:bg-slate-900 shadow-sm z-10">
        <h2 className="text-lg font-semibold">Cognitive Search</h2>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 p-6 overflow-y-auto scroll-smooth min-h-0"
      >
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
          {messages.length === 0 ? (
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <BrainCircuit className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  How can I help you today?
                </CardTitle>
                <CardDescription>
                  Ask a question and I will search through your uploaded
                  documents to find the answer.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-4 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role !== "user" && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <BrainCircuit className="h-5 w-5 text-blue-600" />
                    </div>
                  )}

                  <div
                    className={`rounded-lg px-4 py-3 max-w-[85%] text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border shadow-sm dark:bg-slate-800 dark:border-slate-700"
                    }`}
                  >
                    {m.parts.map((part, index) => {
                      if (part.type === "text") {
                        return (
                          <p key={index} className="whitespace-pre-wrap">
                            {part.text}
                          </p>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 dark:bg-slate-700">
                      <User className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Bubble: Shown when prompt is submitted but stream hasn't started */}
              {isSubmitting && (
                <div className="flex gap-4 justify-start animate-in fade-in slide-in-from-bottom-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <BrainCircuit className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="rounded-lg px-4 py-3 bg-white border shadow-sm dark:bg-slate-800 dark:border-slate-700 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-muted-foreground italic">Thinking...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="p-4 bg-white border-t dark:bg-slate-900 shrink-0">
        <form
          onSubmit={handleFormSubmit}
          className="max-w-3xl mx-auto relative flex items-center"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your documents..."
            className="pr-12 py-6 text-base shadow-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 h-9 w-9 rounded-md transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <div className="text-center mt-2">
          <span className="text-xs text-slate-400">
            Cognis utilizes RAG to verify document data.
          </span>
        </div>
      </div>
    </div>
  );
}