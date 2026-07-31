"use server";

export interface YouTubeVideo {
  title: string;
  description: string;
  thumbnail: string;
  fallbackThumbnail: string;
  referenceLink: string;
  videoId: string;
}

export async function findYouTubeVideos(
  keyword: string,
): Promise<YouTubeVideo[]> {
  try {
    console.log(`Searching YouTube for: "${keyword}"...`);
    const { search } = await import("youtube-search-without-api-key");

    // Fetch the raw search array from public web results
    const results = await search(keyword);

    if (!results || results.length === 0) {
      console.log("No videos found for this search string.");
      return [];
    }

    // Map through the array to build a clean, consistent data schema
    const formattedVideos = results.map((video: any) => {
      const videoId = video.id?.videoId || video.id;

      return {
        title: video.title,
        description: "No description provided",
        // Max resolution thumbnail direct layout from YouTube's static CDN
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        fallbackThumbnail:
          video.snippet?.thumbnails?.high?.url ||
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        referenceLink: `https://www.youtube.com/watch?v=${videoId}`,
        videoId: videoId,
      };
    });

    return formattedVideos;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Search failed completely:", error?.message);
    }
    return [];
  }
}

export async function getYoutubeVideos({
  role,
  query,
}: {
  role: "hitesh chowdhary" | "piyush garg";
  query: string;
}) {
  try {
    const finalQuery = `${role} ${query}`;
    const searchResults = await findYouTubeVideos(finalQuery);

    const response = searchResults.slice(0, 2);

    console.log("youtube videos ", JSON.stringify(response, null, 2));

    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    }

    return [];
  }
}
