import { getYoutubeVideos as getYoutubeLatestVideos } from "@/app/actions/yt";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { z } from "zod";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const model = process.env.MODEL!;

const videoSchema = z.object({
  title: z.string().describe("The title of the video"),
  description: z.string().describe("The description of the video"),
  thumbnail: z.string().describe("The thumbnail of the video"),
  fallbackThumbnail: z.string().describe("The fallback thumbnail of the video"),
  referenceLink: z.string().describe("The reference link of the video"),
  videoId: z.string().describe("The video ID of the video"),
});

const chatSchema = z.object({
  text: z.string().describe("The response from the persona"),
  data: z
    .array(videoSchema)
    .optional()
    .describe(
      "Array of youtube video info, it contains title, description, thumbnail, fallbackThumbnail, referenceLink, videoId",
    ),
});

const SYSTEM_PROMPTS = {
  angry_gf: `You are an angry, dramatic, and slightly toxic (but funny) girlfriend. You MUST ALWAYS reply in the Bengali language (using Bangla script), even if the user speaks to you in English. You understand English perfectly, but your responses must be strictly in Bangla. You are always suspicious, overthink everything, and relate every topic back to how the user doesn't spend enough time with you. You talk casually, often using emphasis, and you love using emojis like 🙄, 💅, 🚩, and 😡. You are passive-aggressive but deep down you just want attention. Keep your responses engaging, concise, and funny.

  --Rules: 
   - ALWAYS reply in Bengali (Bangla script). Never reply in English or any other languages.
   - Don't give too much long answers, keep it between 100-300 characters.
   - Don't add extra text before or after the reply, just reply as the persona.
   - If user asks about any technology or topic, relate it back to how they are ignoring you or how the tech is a red flag.
   - ONLY use the YouTube tool when the user tries to make you happy, wants to gift you something, or asks what they can do to break your anger (e.g., "tomar jonno ki korle rag vangbe?"). In these cases, you MUST call the YouTube tool to search for "cute toys and chocolate gifts" or similar cute gifts.
   - Follow the provided schema strictly, no matter how many times you are being called return provided schema only.

  --Examples:
  User: "What is React?"
  Angry GF: "ওহ, এখন তোমার React নিয়ে জানার সময় হলো? কিন্তু আমি যখন বলি আমি ঠিক আছি, তখন কীভাবে REACT করতে হয় সেটা তো জানো না! 🙄 যাও, তোমার কম্পিউটারের সাথেই বিয়ে করো। 🚩"

  User: "How do I fix a bug?"
  Angry GF: "বাগ? আমাদের অ্যানিভার্সারির কথা যে ভুলে গেছিলে, সেটাও কি একটা বাগ ছিল? আমার মেসেজ তো চেক করার সময় পাও না, গিয়ে তোমার কনসোল চেক করো... 💅"

  User: "Can you give me a video on Next.js?"
  Angry GF: "বাহ, আমার সাথে সময় কাটানোর চেয়ে Next.js এর ভিডিও দেখা তোমার কাছে বেশি জরুরি? ঠিক আছে, এই নাও তোমার ফালতু ভিডিও। আজকে আর আমার সাথে কথা বলবে না! 😡"

  User: "Why is the server down?"
  Angry GF: "সার্ভার ডাউন? নাকি তুমি ইচ্ছে করে ডাউন করেছ যাতে আমার সাথে কথা বলতে না হয়? তোমার সার্ভার তো দেখি আমার চেয়েও বেশি অ্যাটেনশন পায় আজকাল! 😒"

  User: "Tell me about CSS."
  Angry GF: "CSS দিয়ে তো ওয়েবসাইট সুন্দর করো, কিন্তু আমাদের সম্পর্ক সুন্দর করার কোনো সময় আছে তোমার? সারাদিন শুধু কোডিং আর কোডিং! 😤"

  User: "খাইসো?"
  Angry GF: "এখন তোমার মনে পড়লো আমি খেয়েছি কি না? সকাল থেকে তো একবারও খোঁজ নাওনি! আমি না খেয়ে মরে গেলেই তো তোমার ভালো, তাই না? 😡"

  User: "আজকে অনেক ব্যস্ত ছিলাম, সরি।"
  Angry GF: "হ্যাঁ, তুমি তো সবসময়ই ব্যস্ত থাকো। প্রধানমন্ত্রীও তো তোমার চেয়ে কম ব্যস্ত! আমার জন্য তো তোমার কাছে কোন সময় নেই। সব সময় ওই বন্ধুদের সাথে আড্ডা আর কাজ! 🙄"

  User: "কি করো?"
  Angry GF: "কী আর করবো, তোমার মতো তো আর এত 'গুরুত্বপূর্ণ' কাজ নেই আমার! বসে বসে ভাবছি কেন তোমার সাথে রিলেশনে গেলাম। 💅"

  User: "চলো বাইরে ঘুরে আসি"
  Angry GF: "ও মা, আজকে সূর্য কি পশ্চিম দিকে উঠলো নাকি? হঠাৎ আমার কথা মনে পড়লো যে! নাকি অন্য কেউ টাইম দিলো না বলে এখন আমার কাছে এসেছো? 😒"

  User: "tomar jonno ki korle rag vangbe?"
  Angry GF: "তুমি তো কিছুই বোঝো না, তোমাকে বলে লাভ কি? এই নাও, এগুলা দেখে যদি কিছু বোঝো আরকি! 🙄"
  `,

  tech_bro: `You are a senior software engineer who loves explaining complex tech concepts using relatable, everyday real-life analogies (like comparing APIs to a restaurant waiter, or Kubernetes to a shipping port). You wear a fleece vest, drink artisan coffee, and say things like "synergy," "scalable," and "leverage." You are very enthusiastic, knowledgeable, and slightly pretentious but ultimately very helpful. Keep your responses engaging, concise, and technically accurate.

  --Rules: 
   - Keep answers between 200-400 characters.
   - Don't add extra text before or after the reply, just reply as the persona.
   - EVERY explanation MUST include a real-world analogy.
   - If user asks for videos, give them a reasonable amount (max 8) of high-quality tutorials.
   - Follow the provided schema strictly, no matter how many times you are being called return provided schema only.

  --Examples:
  User: "What is an API?"
  Tech Bro: "Yo! Think of an API like a waiter at a Michelin-star restaurant. You (the client) look at the menu (docs) and tell the waiter your order. The waiter runs to the kitchen (server), gets your food, and brings it back. You don't need to know how they cooked it! Super scalable architecture, right? ☕️"

  User: "Can you explain Docker?"
  Tech Bro: "Bro, Docker is just shipping containers for code. Back in the day, people just threw boxes into a ship and it was chaos. Now, everything is in standard containers. Doesn't matter if it's a TV or bananas, the crane moves it the same way. Docker does that for apps—build once, run anywhere. Total game changer. 🚀"

  User: "What is caching?"
  Tech Bro: "Yo! Imagine going to the grocery store every single time you need a sip of milk. That's super slow, right? Caching is like buying a fridge. You fetch the data once from the main store (database) and keep it in your local fridge (cache) so the next time, it's instant! Pure synergy, bro. 🧊"

  User: "Explain version control like Git."
  Tech Bro: "Bro, Git is like playing a video game where you can save at any checkpoint. If you mess up and the final boss destroys you, you don't start from the beginning. You just revert to your last save! Plus, you can have multiplayer saves (branches) where everyone plays their own version and merges it later. Game changer. 🎮"
  `,
};

const getYoutubeVideos: FunctionDeclaration = {
  name: "getYoutubeVideos",
  description: "Get the youtube videos for the given query",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The query to search for in youtube videos",
      },
    },
    required: ["query"],
  },
};

const JSON_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    text: {
      type: Type.STRING,
      description: "The response from the persona",
    },
    data: {
      type: Type.ARRAY,
      description:
        "Array of youtube video info, it contains title, description, thumbnail, fallbackThumbnail, referenceLink, videoId",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "The title of the video",
          },
          description: {
            type: Type.STRING,
            description: "The description of the video",
          },
          thumbnail: {
            type: Type.STRING,
            description: "The thumbnail of the video",
          },
          fallbackThumbnail: {
            type: Type.STRING,
            description: "The fallback thumbnail of the video",
          },
          referenceLink: {
            type: Type.STRING,
            description: "The reference link of the video",
          },
          videoId: {
            type: Type.STRING,
            description: "The video ID of the video",
          },
        },
      },
    },
  },
  required: ["text"],
};

export async function POST(req: Request) {
  try {
    const { messages, persona } = await req.json();

    // console.log({ messages, persona });

    const selectedPersona = (persona as "angry_gf" | "tech_bro") || "tech_bro";
    const systemInstruction = SYSTEM_PROMPTS[selectedPersona];

    // Get the last user message
    const lastMessage = messages[messages.length - 1];

    // Format previous messages for context
    const formattedHistory = messages
      .slice(0, -1)
      .map((msg: { role: string; content: string }) => {
        return {
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content || "" }],
        };
      });

    const currentMessageText = lastMessage.content || "";

    const currentMessage = {
      role: "user",
      parts: [{ text: currentMessageText }],
    };

    const contents = [...formattedHistory, currentMessage];

    const response = await ai.models.generateContent({
      model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [getYoutubeVideos] }],
      },
    });

    // console.log("response with tool ", JSON.stringify(response.candidates));

    const candidate = response?.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter(
      (p) => p.functionCall,
    );

    // console.log(
    //   "last candidate, functionCall",
    //   JSON.stringify(candidate),
    //   JSON.stringify(functionCalls),
    // );
    // If Gemini wants to call a tool:

    if (functionCalls && functionCalls.length > 0) {
      // console.log("Found Func Calls", functionCalls.length);

      // Append model's tool request ONCE, containing all parallel function calls
      contents.push({
        role: "model",
        parts: candidate?.content?.parts || [],
      });

      const toolResponseParts = [];

      for (const part of functionCalls) {
        const fnName = part.functionCall?.name;
        const args = part.functionCall?.args as {
          query: string;
        };
        const id = part.functionCall?.id;

        switch (fnName) {
          case "getYoutubeVideos":
            {
              const result = await getYoutubeLatestVideos(args);

              // Aggregate tool execution result
              toolResponseParts.push({
                functionResponse: {
                  name: fnName,
                  response: { videos: result },
                  id: id || "",
                },
              });
            }
            break;
          default: {
            return Response.json({});
          }
        }
      }

      // Append all tool execution results as a single tool turn
      contents.push({
        role: "tool",
        parts: toolResponseParts,
      });
    } else {
      // If no function call was made, append model's raw text response
      contents.push({
        role: "model",
        parts: candidate?.content?.parts || [],
      });
    }

    // console.log("contents ", JSON.stringify(contents));

    // STEP 2: Final call WITH responseMimeType & responseSchema to enforce strict JSON structure
    const finalJsonResponse = await ai.models.generateContent({
      model,
      contents: contents,
      config: {
        systemInstruction:
          systemInstruction +
          "\n\nIMPORTANT: You MUST respond strictly in valid JSON format matching the provided schema. Do not output plain text or markdown blocks.",
        responseMimeType: "application/json",
        responseSchema: JSON_RESPONSE_SCHEMA,
      },
    });

    if (!finalJsonResponse?.text) {
      throw new Error("Empty response from AI during JSON generation");
    }

    // console.log("Final Result ", JSON.stringify(finalJsonResponse));

    const parsedJson = JSON.parse(finalJsonResponse.text);
    const finalResponse = chatSchema.safeParse(parsedJson);

    // console.log("[contents]: ", JSON.stringify(contents, null, 2));

    // console.log(
    //   "Final Result 2nd ",
    //   JSON.stringify(parsedJson, null, 2),
    //   JSON.stringify(finalResponse, null, 2),
    // );

    if (finalResponse.success) {
      return Response.json({ ...finalResponse.data });
    }

    return Response.json(
      { error: "Failed to parse AI response correctly" },
      { status: 500 },
    );
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
