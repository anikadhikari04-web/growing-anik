export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { folder } = req.query;
  
  if (!folder || (folder !== 'profits' && folder !== 'payouts')) {
    return res.status(400).json({ error: 'Invalid folder' });
  }

  try {
    const response = await fetch(`https://api.github.com/repos/anikadhikari04-web/growing-anik/contents/public/uploads/${folder}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.status === 404) {
      // Directory doesn't exist yet, return empty list
      return res.status(200).json([]);
    }

    if (!response.ok) {
      throw new Error('Failed to fetch from GitHub');
    }

    const data = await response.json();
    
    // Filter out non-files just in case, sort by name descending (assuming timestamp based names)
    const files = data
      .filter(item => item.type === 'file')
      .sort((a, b) => b.name.localeCompare(a.name))
      .map(item => ({
        url: item.download_url,
        sha: item.sha,
        path: item.path
      }));

    return res.status(200).json(files);
  } catch (error) {
    console.error('List error:', error);
    return res.status(500).json({ error: error.message });
  }
}
