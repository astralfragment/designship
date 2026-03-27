module.exports = function(req, res) {
  res.json({ ok: true, clientId: !!process.env.GITHUB_CLIENT_ID });
};
