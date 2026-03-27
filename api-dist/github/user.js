"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const token_1 = require("../_lib/token");
async function handler(req, res) {
    const token = (0, token_1.getGitHubToken)(req);
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const ghRes = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        if (!ghRes.ok) {
            return res.status(ghRes.status).json({ error: 'GitHub API error' });
        }
        const user = await ghRes.json();
        res.json({
            login: user.login,
            avatar_url: user.avatar_url,
            name: user.name,
        });
    }
    catch (err) {
        console.error('User fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
}
