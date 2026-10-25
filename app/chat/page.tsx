"use client";

import { useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  ArrowLeft,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  PanelLeft,
  ArrowDown,
} from "lucide-react";
import { type YouTubeVideo } from "../actions/yt";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import {
  useSupabaseChat,
  PERSONAS,
  PersonaType,
} from "@/hooks/useSupabaseChat";

const CodeBlock = ({
  match,
  children,
  rest,
}: {
  match: RegExpExecArray;
  children: string | ReactNode;
  rest: Record<string, unknown>;
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-md overflow-hidden bg-[#1d1f21] border border-white/10">
      <div className="flex items-center justify-between px-4 py-1.5 bg-black/40 text-xs text-zinc-400 select-none border-b border-white/5">
        <span>{match[1]}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-zinc-100 transition-colors py-1"
        >
          {isCopied ? (
            <Check size={14} className="text-green-500" />
          ) : (
            <Copy size={14} />
          )}
          {isCopied ? (
            <span className="text-green-500">Copied!</span>
          ) : (
            "Copy code"
          )}
        </button>
      </div>
      <SyntaxHighlighter
        {...rest}
        PreTag="div"
        language={match[1]}
        style={atomDark}
        className="!m-0 !text-sm !bg-transparent"
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
};

function ChatComponent() {
  const searchParams = useSearchParams();
  const initialPersona = (searchParams?.get("persona") as PersonaType) || "tech_bro";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const {
    user,
    chats,
    activeChatId,
    activePersona,
    messages,
    isLoadingMessages,
    isSending,
    handleSelectChat,
    handleCreateNewChat,
    handleDeleteChat,
    handleRenameChat,
    handleClearCurrentChat,
    handleSendMessage,
    setActivePersona,
    refreshSession,
  } = useSupabaseChat(initialPersona);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLElement>(null);
  const personaDetails = PERSONAS[activePersona] || PERSONAS.tech_bro;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleScroll = () => {
    if (!mainScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainScrollRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isScrolledUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePersonaSwitch = (persona: PersonaType) => {
    setActivePersona(persona);
    handleCreateNewChat(persona);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    const currentInput = input;
    setInput("");
    await handleSendMessage(currentInput);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Left Chat Sidebar */}
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        activePersona={activePersona}
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectChat={handleSelectChat}
        onCreateNewChat={handleCreateNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onSessionChange={refreshSession}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Header */}
        <header className="flex-none p-3.5 sm:p-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Sidebar toggle for mobile / tablet */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 shrink-0"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              title="Toggle sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>

            <Link href="/">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>

            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="w-9 h-9 shrink-0 border border-border/50">
                <AvatarImage
                  src={personaDetails.image}
                  alt={personaDetails.name}
                  className="object-cover"
                />
                <AvatarFallback>{personaDetails.fallback}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="font-bold text-sm sm:text-base leading-tight truncate">
                  {personaDetails.name}
                </h1>
                <p className="text-[11px] text-green-500 flex items-center gap-1 leading-none mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                  Online
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Persona Switcher */}
            <div className="hidden sm:flex rounded-lg border border-border p-1 bg-muted/50">
              <Button
                variant={activePersona === "tech_bro" ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePersonaSwitch("tech_bro")}
                className="text-xs h-7 px-3"
              >
                Tech Bro
              </Button>
              <Button
                variant={activePersona === "angry_gf" ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePersonaSwitch("angry_gf")}
                className="text-xs h-7 px-3"
              >
                Angry GF
              </Button>
            </div>

            {/* Clear Chat Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm("Are you sure you want to clear this chat?")) {
                  handleClearCurrentChat();
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
        <div className="sm:hidden p-2 border-b border-border flex justify-between items-center bg-muted/20 gap-2">
          <div className="flex rounded-lg border border-border p-0.5 bg-muted/50 flex-1 max-w-xs">
            <Button
              variant={activePersona === "tech_bro" ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePersonaSwitch("tech_bro")}
              className="text-xs h-7 flex-1"
            >
              Tech Bro
            </Button>
            <Button
              variant={activePersona === "angry_gf" ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePersonaSwitch("angry_gf")}
              className="text-xs h-7 flex-1"
            >
              Angry GF
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm("Are you sure you want to clear this chat?")) {
                handleClearCurrentChat();
              }
            }}
            className="text-xs h-7 text-destructive border-destructive px-2"
          >
            Clear
          </Button>
        </div>

        {/* Chat Messages */}
        <main
          ref={mainScrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
        >
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span>Loading messages...</span>
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex w-full ${
                  m.role === "user" ? "justify-end" : "justify-start max-w-4xl"
                }`}
              >
                <div
                  className={`flex gap-3 w-full ${
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 border border-border/40">
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
                        <UserIcon className="h-5 w-5" />
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-xs"
                        : "bg-muted text-foreground rounded-tl-xs w-full"
                    }`}
                  >
                    <div className="text-sm sm:text-base leading-relaxed overflow-hidden [&>p]:mb-2 [&>p:last-child]:mb-0">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code(props) {
                            const { children, className, node, ref, ...rest } =
                              props;
                            void node;
                            const match = /language-(\w+)/.exec(className || "");
                            return match ? (
                              <CodeBlock match={match} rest={rest}>
                                {children}
                              </CodeBlock>
                            ) : (
                              <code
                                {...rest}
                                ref={ref}
                                className="bg-foreground/10 px-1 py-0.5 rounded font-mono text-sm"
                              >
                                {children}
                              </code>
                            );
                          },
                          a(props) {
                            return (
                              <a
                                {...props}
                                className="text-blue-500 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            );
                          },
                          ul(props) {
                            return (
                              <ul {...props} className="list-disc pl-5 mb-2" />
                            );
                          },
                          ol(props) {
                            return (
                              <ol {...props} className="list-decimal pl-5 mb-2" />
                            );
                          },
                        }}
                      >
                        {String(m.content)}
                      </ReactMarkdown>
                    </div>

                    {/* YouTube Video cards */}
                    {m?.data && m.data.length > 0 && (
                      <div className="flex flex-wrap mt-3 gap-3 pr-5">
                        {m.data.map((video, index) => (
                          <a
                            key={index}
                            href={video.referenceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative block flex-auto basis-[200px] max-w-full aspect-video rounded-xl overflow-hidden group bg-muted border border-border/40"
                          >
                            <Image
                              src={
                                video.thumbnail ||
                                video.fallbackThumbnail ||
                                "/images/video-fallback.svg"
                              }
                              alt={video.title}
                              fill
                              unoptimized
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/images/video-fallback.svg";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <p className="text-white text-sm font-medium text-center line-clamp-3">
                                {video.title}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {isSending && (
            <div className="flex w-full justify-start">
              <div className="flex gap-3 max-w-[85%] flex-row">
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 border border-border/40">
                  <AvatarImage
                    src={personaDetails.image}
                    alt={personaDetails.name}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-3 bg-muted text-foreground rounded-tl-xs flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-6 sm:right-10 z-30 p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all"
            title="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}

        {/* Input Area */}
        <footer className="flex-none p-4 border-t border-border bg-background">
          <form
            onSubmit={onSubmit}
            className="container max-w-4xl mx-auto flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${personaDetails.name.split(" ")[0]}...`}
              className="flex-1 rounded-full px-6"
              disabled={isSending}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full shrink-0 h-10 w-10"
              disabled={isSending || !input.trim()}
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </footer>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-background text-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span>Loading Persona AI...</span>
          </div>
        </div>
      }
    >
      <ChatComponent />
    </Suspense>
  );
}
