const TEDX_CHANNEL_ID = 'UCsT0YIqwnpJCM-mx7-gSA4Q';
const MAX_RESULTS_PER_QUERY = 8;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { queries } = req.body;

  if (!queries || !Array.isArray(queries) || queries.length === 0) {
    return res.status(400).json({ error: 'queries array is required' });
  }

  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const videoMap = new Map();

    await Promise.all(
      queries.map(async (query) => {
        const params = new URLSearchParams({
          part: 'snippet',
          channelId: TEDX_CHANNEL_ID,
          q: query,
          type: 'video',
          maxResults: MAX_RESULTS_PER_QUERY,
          key: apiKey,
        });

        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?${params}`
        );

        if (!response.ok) {
          const error = await response.text();
          console.error(`YouTube API error for query "${query}":`, error);
          return;
        }

        const data = await response.json();

        if (data.items) {
          data.items.forEach((item) => {
            const videoId = item.id?.videoId;
            if (videoId && !videoMap.has(videoId)) {
              videoMap.set(videoId, {
                videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail:
                  item.snippet.thumbnails?.medium?.url ||
                  item.snippet.thumbnails?.default?.url,
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                url: `https://www.youtube.com/watch?v=${videoId}`,
              });
            }
          });
        }
      })
    );

    const videos = Array.from(videoMap.values());
    return res.status(200).json({ videos });
  } catch (err) {
    console.error('YouTube proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}