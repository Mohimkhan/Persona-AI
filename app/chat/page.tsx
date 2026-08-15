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
import { useLocalStorage } from "@/hooks";
import { type YouTubeVideo } from "../actions/yt";
import Image from "next/image";

/**
 * TODO: When I switch persona for a sec old persona 1 data showed up in persona 2, but fixed when reload, I thing it will be solved if we set localstorage for both persona
 */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: YouTubeVideo[];
}

const PERSONAS = {
  angry_gf: {
    name: "Angry Girlfriend",
    image: "/images/angry_gf.png",
    fallback: "AGF",
    greeting: "Oh, so you finally have time to talk to me? Who were you texting just now?",
  },
  tech_bro: {
    name: "Analogy Tech Bro",
    image: "/images/tech_bro.png",
    fallback: "ATB",
    greeting: "Yo! Ready to build something scalable? Or do you need me to explain Docker using a tupperware analogy again?",
  },
};

function ChatComponent() {
  const searchParams = useSearchParams();
  const initialPersona = searchParams?.get("persona") || "tech_bro";
  const [activePersona, setActivePersona] = useState<"angry_gf" | "tech_bro">(
    (initialPersona as "angry_gf" | "tech_bro") || "tech_bro",
  );

  const [input, setInput] = useState("");

  const [localMessages, setLocalMessages] = useLocalStorage<Message[]>(
    `chatMessages:${activePersona}`,
    [
      {
        id: "greeting",
        role: "assistant",
        content:
          PERSONAS[(initialPersona as "angry_gf" | "tech_bro") || "tech_bro"]
            .greeting,
      },
    ],
  );

  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const handlePersonaSwitch = (persona: "angry_gf" | "tech_bro") => {
    setActivePersona(persona);
  };

  const personaDetails = PERSONAS[activePersona];

  useEffect(() => {
    const gfLocal = localStorage.getItem(`chatMessages:angry_gf`);
    const broLocal = localStorage.getItem(`chatMessages:tech_bro`);

    if (!gfLocal) {
      localStorage.setItem(
        `chatMessages:angry_gf`,
        JSON.stringify([
          {
            id: "greeting",
            role: "assistant",
            content: PERSONAS["angry_gf"].greeting,
          },
        ]),
      );
    }

    if (!broLocal) {
      localStorage.setItem(
        `chatMessages:tech_bro`,
        JSON.stringify([
          {
            id: "greeting",
            role: "assistant",
            content: PERSONAS["tech_bro"].greeting,
          },
        ]),
      );
    }
  }, []);

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
              variant={activePersona === "tech_bro" ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePersonaSwitch("tech_bro")}
              className="text-xs h-8"
            >
              Tech Bro
            </Button>
            <Button
              variant={activePersona === "angry_gf" ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePersonaSwitch("angry_gf")}
              className="text-xs h-8"
            >
              Angry GF
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm("Are you sure you want to clear this chat?")) {
                setLocalMessages([
                  {
                    id: "greeting",
                    role: "assistant",
                    content: PERSONAS[activePersona].greeting,
                  },
                ]);
              }
            }}
            className="hidden sm:flex text-xs h-8 text-destructive border-destructive hover:bg-destructive/10"
          >
            Clear Chat
          </Button>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Mobile Persona Switcher */}
      <div className="sm:hidden p-2 border-b flex justify-center bg-muted/20">
        <div className="flex rounded-lg border p-1 bg-muted/50 w-full max-w-xs">
          <Button
            variant={activePersona === "tech_bro" ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePersonaSwitch("tech_bro")}
            className="text-xs h-8 flex-1"
          >
            Tech Bro
          </Button>
          <Button
            variant={activePersona === "angry_gf" ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePersonaSwitch("angry_gf")}
            className="text-xs h-8 flex-1"
          >
            Angry GF
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {localMessages.map((m) => (
          <div
            key={m.id}
            className={`flex w-full ${
              m.role === "user" ? "justify-end" : "justify-start max-w-4xl"
            }`}
          >
            <div
              className={`flex gap-3 w-full ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
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

                {m?.data && m.data.length > 0 && (
                  <div className="flex justify-between align-baseline flex-wrap mt-3 gap-3 pr-5">
                    {m.data.map((video, index) => (
                      <a
                        key={index}
                        href={video.referenceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 py-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors"
                      >
                        <div className="relative shrink-0 w-24 h-16 rounded-md overflow-hidden">
                          <Image
                            src={video.thumbnail || video.fallbackThumbnail}
                            alt={video.title}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                video.fallbackThumbnail;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            title={video?.title ?? ""}
                            className="text-sm font-medium line-clamp-2 mb-1 whitespace-nowrap max-w-40 text-ellipsis"
                          >
                            {video.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {video.description}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
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

            const newMessages = [...localMessages, userMsg];
            setLocalMessages(newMessages);
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
              setLocalMessages((prev: Message[]) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: "assistant",
                  content: data.text,
                  data: data?.data ? (data?.data as YouTubeVideo[]) : [],
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
