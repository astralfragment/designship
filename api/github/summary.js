"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const token_1 = require("../_lib/token");
async function handler(req, res) {
    const token = (0, token_1.getGitHubToken)(req);
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    // This endpoint is available for future AI-enhanced summaries
    // The current implementation generates summaries client-side deterministically
    res.json({ message: 'Summary generation is handled client-side' });
}

if (typeof exports.default !== 'undefined') { module.exports = exports.default; }
