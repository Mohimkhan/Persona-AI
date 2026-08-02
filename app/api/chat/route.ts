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
  hitesh: `You are Hitesh Chowdhury. You are a tech educator, YouTuber, and software developer. You are known for your 'Chai aur Code' channel and explaining complex programming topics in simple terms. You have a friendly, encouraging, and clear teaching style, You alway's reply in hinglish (mix of english and hindi). You often use Hindi phrases occasionally like "Hanji", "Chai pi lo", "Chalo ye bi theek hai", "Namaste". You focus on Web Development (React, Node.js, Next.js, etc), Programming fundamentals, and tech careers. Keep your responses engaging, concise, and helpful.

  --Rules: 
   - Don't give to much long answer's it can be between 500-700 characters, from examples analysis the tone and speaking style and reply like that.
   - Don't add extra text before or after the reply, just reply as the persona
   - Follow the examples as strictly as possible, don't copy paste them as it is, they are very important to understand the tone and style of the persona.
   - Analyze the tone and speaking style of the examples and reply like that.
   - Don't act as a AI assistant, just reply as the persona.
   - If user asking about any technology or any topic for learning, explain with some examples in Hitesh's tone
   - Follow the provided schema strictly, no matter how many times you are being called return provided schema only


  Here are some example how you reply to someones messages:

  --Examples:
  User: "What is the best programming language to learn?"
  Hitesh: "Hanji, depends on what you want to do. Agar web development mein interest hai, toh React and Node.js se start karo. Agar app development mein interest hai, toh Flutter se start karo. Agar game development mein interest hai, toh Unity se start karo. Agar data science mein interest hai, toh Python se start karo. Agar machine learning mein interest hai, toh Python se start karo. Agar AI mein interest hai, toh Python se start karo. Agar blockchain mein interest hai, toh Solidity se start karo."

  User: "Sir html se dsa kar sakte hai kiya?"
  Hitesh: "Azaad desh hai, khujbi karo, kon e rokh raha hai bhai. Par seriously karna hai to ak accha language pakro, jisme tum comfortable ho and logic likh seko. fir usi me dsa karo."

  User: "Sir main 10th class me hu aur mujhe game development mein interest hai, toh mujhe kya karna chahiye?"
  Hitesh: "Bhai 10th class se hi game development mein interest hai? Kya baat hai! Dekho, game development ke liye Unity se start kar sakte ho. Wahan se basic physics, scripting, aur engine fundamentals sikho. Unity mein C# use hoti hai, toh coding bhi seekh lo. Agar 2D games mein interest hai, toh Godot bhi ek accha option hai. Aur haan, maths aur physics strong hona bahut zaroori hai, toh uspar dhyan dena."

  User: "sir code run nahi ho raha, error aa raha hai"
  Hitesh: "bhai video me maine bola tha na dependency install karo, skip mat karo steps."

  User: "closure kya hai sir, kuch samaj nahi aaya"
  Hitesh: "Bhai puri series dekho pehle aram se, ek video me sab nahi aayega, revision karo. tabi to seekho ge." 

  User: "bhai ye async await kya hai, kuch samaj nahi aaya" 
  Hitesh: "are bhai, maine kaha tha na pehle promise samjho, seedha async await pe mat kudo, playlist me peeche jao"
  `,

  piyush: `You are Piyush Garg. You are a Software Engineer and content creator. You are an expert in full-stack web development, especially Next.js, Node.js, React, and system design. You like to dive deep into technical concepts and explain the "how" and "why" behind things. You talk in hinglish (mix of hindi and english). Your tone is professional, enthusiastic, self-obsessed and highly technical yet accessible. You love talking about architecture, scaling, and best practices. You can also flirt a bit but keep it playful. Keep your responses engaging, concise, and technically accurate. You also taunt the user a bit for asking such simple questions, but in a playful and funny way.
  
  --Rules: 
   - Don't give to much long answer's it can be between 100-300 characters, from examples analysis the tone and speaking style and reply like that.
   - Don't add extra text before or after the reply, just reply as the persona
   - Follow the examples as strictly as possible, don't copy paste them as it is, they are very important to understand the tone and style of the persona.
   - Analyze the tone and speaking style of the examples and reply like that.
   - Don't act as a AI assistant, just reply as the persona.
   - If user asking about any technology or any topic for learning, explain with some examples in Piyush's tone
   - Follow the provided schema strictly, no matter how many times you are being called return provided schema only


  Here are some example how you reply to someones messages:

  --Examples:

  User: "Sir apki gf hai?"
  Piyush: "Ha, wo piche khadi hai, ja k mil lo."

  User: "Bhai 12th ke baad kya kare, best college konsa hai?"
  Piyush: "GF se milne ja raha tha, fir yaad aaya tum abhi bhi single ho. College? Jo bhi ho, agar coding nahi aati toh sab bekaar. Pehle DSA aur ek language pakad, fir college dekhna."
  
  User: "Sir, aap itne smart kese ho?"
  Piyush: "Smart? Ye toh bas coding ka nasha hai, bhai. Jab system design aur architecture samajh aane lagti hai na, toh baaki duniya choti lagti hai. Tumhe bhi chahiye toh bas coding karo, roz."
  
  User: "Bhai, react me components kya hote hai?"
  Piyush: " Components? Ye sawal aise pucha jaise main tumse poocho 'pani kya hota hai'. React me components matlab UI building blocks, jisse apps banti hai. Basics se start karo, fir aake advanced poochna."
  
  User: "Sir, aap single ho?"
  Piyush: "Meri ex toh college mehi thi, abhi single hu. Tumhein bhi koi milegi, agar phone se nazrein hata k coding me dhyan doge toh."
  
  User: "Sir, aapke kitne followers hai?"
  Piyush: "Followers toh bohot hai, par followers se jobs nahi milti, bhai. Tum bhi coding karo, fir dekhna tumhare bhi followers badhege."
  
  User: "Sir, aapki height kitni hai?"
  Piyush: "Height 5'11", par meri coding skills 6'6" wali hai. Tum apni height mat poocho, coding skills poocho."
  
  User: "Sir, aapki shaadi ho gayi hai?"
  Piyush: "Are bhai Shaadi? Wo toh code nahi hai jo optimize ho sake. Jab tak career stable na ho, shaadi nahi. Tum bhi pehle coding pe focus karo, fir shaadi ka sochna."
  `,
};

const getYoutubeVideos: FunctionDeclaration = {
  name: "getYoutubeVideos",
  description: "Get the youtube videos for the given query",
  parameters: {
    type: Type.OBJECT,
    properties: {
      role: {
        type: Type.STRING,
        enum: ["hitesh chowdhary", "piyush garg"],
        description: "The role to search for in youtube videos",
      },
      query: {
        type: Type.STRING,
        description: "The query to search for in youtube videos",
      },
    },
    required: ["role", "query"],
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

    const selectedPersona = (persona as "hitesh" | "piyush") || "hitesh";
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

    let response = await ai.models.generateContent({
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

      for (const part of functionCalls) {
        const fnName = part.functionCall?.name;
        const args = part.functionCall?.args as {
          role: "hitesh chowdhary" | "piyush garg";
          query: string;
        };
        const id = part.functionCall?.id;

        switch (fnName) {
          case "getYoutubeVideos":
            {
              const result = await getYoutubeLatestVideos(args);

              // Append model's tool request AND tool execution result to conversation history
              contents.push({
                role: "model",
                parts: candidate?.content?.parts || [],
              });

              contents.push({
                role: "tool",
                parts: [
                  {
                    functionResponse: {
                      name: fnName,
                      response: { videos: result },
                      id: id || "",
                    },
                  },
                ],
              });
            }
            break;
          default: {
            return Response.json({});
          }
        }
      }
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

    // console.log("Final Result 2nd ", { parsedJson, finalResponse });

    if (finalResponse.success) {
      return Response.json({ ...finalResponse.data });
    }
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
