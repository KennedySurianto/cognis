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
import { BrainCircuit, Send, User, Loader2, X, FileText } from "lucide-react";
// Add these imports for the mention UI
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import ReactMarkdown from "react-markdown";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
}

export function ChatInterface({ documents }: { documents: Document[] }) {
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<Document | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, status]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    // Logic: If the user types '@' as the start of a word, show the popover
    const words = val.split(" ");
    const lastWord = words[words.length - 1];
    setShowMentions(lastWord.startsWith("@"));
  };

  const handleSelectFile = (doc: Document) => {
    setSelectedFile(doc);
    // Remove the '@' trigger from input for a cleaner look
    const words = input.split(" ");
    words.pop();
    setInput(words.join(" ").trim());
    setShowMentions(false);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(
      { text: input },
      {
        headers: { "Content-Type": "application/json" },
        body: { selectedFileId: selectedFile?.id },
      },
    );

    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
      <header className="flex h-16 shrink-0 items-center border-b bg-white px-6 dark:bg-slate-900 shadow-sm z-10">
        <h2 className="text-lg font-semibold">Cognitive Search</h2>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 p-6 overflow-y-auto scroll-smooth min-h-0"
      >
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
          {/* ... existing messages mapping ... */}
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
                  Type @ to mention a specific document for context.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}
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
                      return m.role === "user" ? (
                        <p key={index} className="whitespace-pre-wrap">
                          {part.text}
                        </p>
                      ) : (
                        <div
                          key={index}
                          className="prose prose-sm dark:prose-invert max-w-none"
                        >
                          <ReactMarkdown>{part.text}</ReactMarkdown>
                        </div>
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
            ))
          )}
          {isLoading && (
            <div className="flex gap-4 justify-start animate-in fade-in slide-in-from-bottom-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <BrainCircuit className="h-5 w-5 text-blue-600" />
              </div>
              <div className="rounded-lg px-4 py-3 bg-white border shadow-sm dark:bg-slate-800 dark:border-slate-700 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-muted-foreground italic">
                  Thinking...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-white border-t dark:bg-slate-900 shrink-0">
        <form
          onSubmit={handleFormSubmit}
          className="max-w-3xl mx-auto relative flex flex-col"
        >
          {/* ACTIVE FILTER BADGE */}
          {selectedFile && (
            <div className="flex items-center gap-2 mb-2 self-start bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium border border-blue-100 dark:border-blue-800 animate-in zoom-in-95">
              <FileText className="h-3 w-3" />
              <span>Context: {selectedFile.file_name}</span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="relative flex items-center">
            <Popover open={showMentions} onOpenChange={setShowMentions}>
              <PopoverAnchor asChild>
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask anything or type @ to filter..."
                  className="pr-12 py-6 text-base shadow-sm w-full"
                  disabled={isLoading}
                />
              </PopoverAnchor>
              <PopoverContent
                className="p-0 w-75"
                align="start"
                side="top"
                sideOffset={10}
              >
                <Command>
                  <CommandList>
                    <CommandGroup heading="Mention Document">
                      {documents.length === 0 && (
                        <div className="p-2 text-xs text-center text-muted-foreground">
                          No documents available
                        </div>
                      )}
                      {documents.map((doc) => (
                        <CommandItem
                          key={doc.id}
                          onSelect={() => handleSelectFile(doc)}
                          className="cursor-pointer"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          <span>{doc.file_name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 h-9 w-9 rounded-md"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
