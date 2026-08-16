"use client";

import { useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Bot, User, Copy, Check } from "lucide-react";
import { Suspense } from "react";
import { showToast } from "@/lib/utils/toast";
import { useLocalStorage } from "@/hooks";
import { type YouTubeVideo } from "../actions/yt";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

/**
 * TODO: Make every chat card size fized to a minimum size when content is greater than that then introduce see more button unless see less
 * TODO: Scroll to bottom button
 * TODO: Implement alert dialog for clear chat button
 *
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
    greeting:
      "Oh, so you finally have time to talk to me? Who were you texting just now?",
  },
  tech_bro: {
    name: "Analogy Tech Bro",
    image: "/images/tech_bro.png",
    fallback: "ATB",
    greeting:
      "Yo! Ready to build something scalable? Or do you need me to explain Docker using a tupperware analogy again?",
  },
};

const markdown =
  "Bro, **Docker** hocche code er jonno shipping container er moto. Age manush jahaje jemon temon kore jinish patato, ekhon shob standard container e jay. Docker apps er jonno same kaj kore—build once, run anywhere! Ekta app ar tar shob dependencies (libraries, settings, etc.) ekta container e package kora hoy, tai seta jekono machine e chalano jay jekhane Docker install kora ache. No more \"it works on my machine\" excuses! 😉\n\n**Analogy**: Imagine you have a delicious biryani recipe. To share it perfectly, you don't just send the ingredients. You cook it, put it in a nice, sealed tiffin box with all the necessary cutlery and instructions. Dockerfile is the recipe and instructions, and the Docker image is the cooked biryani in the tiffin box. Anyone with a fork (Docker installed) can open the box and enjoy the biryani (run the app).\n\n**Example: Simple Web Server**\n\nLet's containerize a super basic Python web server using Flask.\n\n**1. Project Structure:**\n\n```\nmy-flask-app/\n├── app.py\n└── Dockerfile\n```\n\n**2. `app.py` (Your Python Flask App):**\n\n~~~python\nfrom flask import Flask\napp = Flask(__name__)\n\n@app.route('/')\ndef hello_world():\n    return 'Hello from Dockerized Flask App! 🚀'\n\nif __name__ == '__main__':\n    app.run(debug=True, host='0.0.0.0')\n~~~\n\n**3. `Dockerfile` (The Blueprint):**\n\n~~~dockerfile\n# Use an official Python runtime as a parent image\nFROM python:3.9-slim\n\n# Set the working directory in the container\nWORKDIR /app\n\n# Copy the current directory contents into the container at /app\nCOPY . /app\n\n# Install any needed packages specified in requirements.txt\n# If you don't have a requirements.txt, you can install Flask directly\n# RUN pip install --no-cache-dir -r requirements.txt\nRUN pip install Flask\n\n# Make port 5000 available to the world outside this container\nEXPOSE 5000\n\n# Define environment variable\nENV NAME World\n\n# Run app.py when the container launches\nCMD [\"python\", \"app.py\"]\n~~~\n\n**Explanation of Dockerfile:**\n\n*   `FROM python:3.9-slim`: Starts with a lightweight official Python image.\n*   `WORKDIR /app`: Sets the default directory inside the container.\n*   `COPY . /app`: Copies your app files from your local machine into the container's `/app` directory.\n*   `RUN pip install Flask`: Installs the Flask library.\n*   `EXPOSE 5000`: Informs Docker that the container listens on port 5000 at runtime.\n*   `CMD [\"python\", \"app.py\"]`: Specifies the command to run when the container starts.\n\n**Steps to Build and Run:**\n\n1.  **Navigate to your project directory** in the terminal:\n    ~~~\nbash\ncd my-flask-app\n~~~\n2.  **Build the Docker image**: Give it a name, like `my-flask-app`.\n    ~~~\ndocker build -t my-flask-app .\n~~~\n3.  **Run the Docker container**: Map port 5000 on your machine to port 5000 in the container.\n    ~~~\ndocker run -p 5000:5000 my-flask-app\n~~~\n4.  Now, open your web browser and go to `http://localhost:5000`. You should see \"Hello from Dockerized Flask App! 🚀\". Boom! Scalable deployment achieved.\n\n**Recommended Videos for Deeper Dive:**\n\n1.  **Docker Tutorial for Beginners (Full Course)** by freeCodeCamp.org: This is a comprehensive course that covers all the basics and more.\n    *   Link: ~~~https://www.youtube.com/watch?v=3c-i7WX7M_o~~~\n2.  **What is Docker?** by Mosh Hamedani: A concise and clear explanation, perfect for understanding the core concepts.\n    *   Link: ~~~https://www.youtube.com/watch?v=gAkw7_218Xk~~~\n\nThese resources should give you a solid understanding and practical skills. Let me know if you want to explore more complex scenarios, like multi-container apps with Docker Compose!";

const CodeBlock = ({
  match,
  children,
  rest,
}: {
  match: RegExpExecArray;
  children: string | ReactNode;
  rest: any;
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
        children={String(children).replace(/\n$/, "")}
        language={match[1]}
        style={atomDark}
        className="!m-0 !text-sm !bg-transparent"
      />
    </div>
  );
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
                <div className="text-sm sm:text-base leading-relaxed overflow-hidden [&>p]:mb-2 [&>p:last-child]:mb-0">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code(props) {
                        const { children, className, node, ref, ...rest } =
                          props;
                        const match = /language-(\w+)/.exec(className || "");
                        return match ? (
                          <CodeBlock
                            match={match}
                            children={children}
                            rest={rest}
                          />
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
                    {/* {markdown} */}
                  </ReactMarkdown>
                </div>

                {m?.data && m.data.length > 0 && (
                  <div className="flex flex-wrap mt-3 gap-3 pr-5">
                    {m.data.map((video, index) => (
                      <a
                        key={index}
                        href={video.referenceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block flex-auto basis-[200px] max-w-full aspect-video rounded-xl overflow-hidden group bg-muted"
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
