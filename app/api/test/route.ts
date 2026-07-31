import { getYoutubeVideos, findYouTubeVideos } from "@/app/actions/yt";

export async function GET() {
  try {
    const result = await getYoutubeVideos({
      query: "docker",
      role: "hitesh chowdhary",
    });

    const result2 = await findYouTubeVideos("AI AUTOMATION");

    return Response.json({
      message: "Found DATA",
      data: JSON.stringify(result2),
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error);
    }

    return Response.json({ message: "NOT FOUND" });
  }
}
