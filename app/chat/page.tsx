"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Bot, User } from "lucide-react";
import { Suspense } from "react";
import { showToast } from "@/lib/utils/toast";

const PERSONAS = {
  hitesh: {
    name: "Hitesh Chowdhury",
    image: "/images/hitesh_choudhary.png",
    fallback: "HC",
    greeting: "Hanji, Suru karte hai ajka session, chai ready hai na?",
  },
  piyush: {
    name: "Piyush Garg",
    image: "/images/piyush_garg.png",
    fallback: "PG",
    greeting: "Hey there, Piyush here! Kya hal chal hai ap logo ka?",
  },
};

function ChatComponent() {
  const searchParams = useSearchParams();
  const initialPersona = searchParams?.get("persona") || "hitesh";
  const [activePersona, setActivePersona] = useState<"hitesh" | "piyush">(
    (initialPersona as "hitesh" | "piyush") || "hitesh",
  );

  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<
    { id: string; role: "user" | "assistant"; content: string }[]
  >([
    {
      id: "greeting",
      role: "assistant",
      content:
        PERSONAS[(initialPersona as "hitesh" | "piyush") || "hitesh"].greeting,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePersonaSwitch = (persona: "hitesh" | "piyush") => {
    setActivePersona(persona);
    setMessages([
      {
        id: "greeting",
        role: "assistant",
        content: PERSONAS[persona].greeting,
      },
    ]);
  };

  const personaDetails = PERSONAS[activePersona];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex-none p-4 border-b flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage
                src={personaDetails.image}
                alt={personaDetails.name}
                className="object-cover"
              />
              <AvatarFallback>{personaDetails.fallback}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold">{personaDetails.name}</h1>
              <p className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                Online
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex rounded-lg border p-1 bg-muted/50">
            <Button
              variant={activePersona === "hitesh" ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePersonaSwitch("hitesh")}
              className="text-xs h-8"
            >
              Hitesh
            </Button>
            <Button
              variant={activePersona === "piyush" ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePersonaSwitch("piyush")}
              className="text-xs h-8"
            >
              Piyush
            </Button>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Mobile Persona Switcher */}
      <div className="sm:hidden p-2 border-b flex justify-center bg-muted/20">
        <div className="flex rounded-lg border p-1 bg-muted/50 w-full max-w-xs">
          <Button
            variant={activePersona === "hitesh" ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePersonaSwitch("hitesh")}
            className="text-xs h-8 flex-1"
          >
            Hitesh
          </Button>
          <Button
            variant={activePersona === "piyush" ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePersonaSwitch("piyush")}
            className="text-xs h-8 flex-1"
          >
            Piyush
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex w-full ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                {m.role === "assistant" ? (
                  <>
                    <AvatarImage
                      src={personaDetails.image}
                      alt={personaDetails.name}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div
                className={`rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                  {m.content}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="flex gap-3 max-w-[85%] flex-row">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                <AvatarImage
                  src={personaDetails.image}
                  alt={personaDetails.name}
                  className="object-cover"
                />
                <AvatarFallback>
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl px-4 py-3 bg-muted text-foreground rounded-tl-sm flex items-center gap-1">
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 border-t bg-background">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!input.trim() || isLoading) return;

            const userMsg = {
              id: Date.now().toString(),
              role: "user" as const,
              content: input,
            };
            const newMessages = [...messages, userMsg];
            setMessages(newMessages);
            setInput("");
            setIsLoading(true);

            try {
              const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: newMessages,
                  persona: activePersona,
                }),
              });

              if (!res.ok) throw new Error("Failed to fetch");

              const data = await res.json();
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: "assistant",
                  content: data.text,
                },
              ]);
            } catch (error) {
              console.error(error);
              showToast({ message: "Something went wrong", type: "error" });
            } finally {
              setIsLoading(false);
            }
          }}
          className="container max-w-4xl mx-auto flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${personaDetails.name.split(" ")[0]}...`}
            className="flex-1 rounded-full px-6"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full shrink-0"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      }
    >
      <ChatComponent />
    </Suspense>
  );
}
