export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, filename, folder, password } = req.body;

  if (password !== 'as1as2as3as4as5') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'GitHub token not configured on server' });
  }

  try {
    // GitHub API requires base64 content without the data URI prefix
    const base64Content = imageBase64.split(',')[1];
    
    const response = await fetch(`https://api.github.com/repos/anikadhikari04-web/growing-anik/contents/public/uploads/${folder}/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Upload image ${filename}`,
        content: base64Content,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload to GitHub');
    }

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}
