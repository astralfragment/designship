export default function handler(req, res) {
  res.json({ ok: true, env: !!process.env.GITHUB_CLIENT_ID, time: new Date().toISOString() })
}
