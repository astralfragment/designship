"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const token_1 = require("../_lib/token");
async function handler(req, res) {
    const token = (0, token_1.getGitHubToken)(req);
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const days = Math.min(Number(req.query.days) || 7, 90);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];
    try {
        // Get authenticated user
        const userRes = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        const user = await userRes.json();
        const username = user.login;
        // Search for merged PRs by this user
        const searchQuery = `type:pr+author:${username}+is:merged+merged:>=${sinceStr}`;
        const searchRes = await fetch(`https://api.github.com/search/issues?q=${searchQuery}&sort=updated&order=desc&per_page=100`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        if (!searchRes.ok) {
            const err = await searchRes.text();
            console.error('GitHub search error:', err);
            return res.status(searchRes.status).json({ error: 'GitHub search failed' });
        }
        const searchData = await searchRes.json();
        // Fetch PR details for each result to get branch and commit count
        const prs = await Promise.all(searchData.items.slice(0, 50).map(async (item) => {
            if (!item.pull_request?.url)
                return null;
            try {
                const prRes = await fetch(item.pull_request.url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                });
                const prData = await prRes.json();
                return {
                    id: prData.id,
                    title: prData.title,
                    repo: prData.base.repo.full_name,
                    mergedAt: prData.merged_at,
                    author: prData.user.login,
                    authorAvatar: prData.user.avatar_url,
                    branch: prData.head.ref,
                    commitCount: prData.commits,
                    url: prData.html_url,
                };
            }
            catch {
                return null;
            }
        }));
        const filtered = prs.filter(Boolean);
        filtered.sort((a, b) => new Date(b.mergedAt).getTime() - new Date(a.mergedAt).getTime());
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
        res.json(filtered);
    }
    catch (err) {
        console.error('PR fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch PRs' });
    }
}

if (typeof exports.default !== 'undefined') { module.exports = exports.default; }
