export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { path, sha, password } = req.body;

  if (password !== 'as1as2as3as4as5') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'GitHub token not configured on server' });
  }

  try {
    const response = await fetch(`https://api.github.com/repos/anikadhikari04-web/growing-anik/contents/${path}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Delete image ${path}`,
        sha: sha
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete from GitHub');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: error.message });
  }
}
