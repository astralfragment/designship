"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const crypto_1 = __importDefault(require("crypto"));
function handler(req, res) {
    const clientId = process.env.FIGMA_CLIENT_ID;
    if (!clientId) {
        return res.status(500).json({ error: 'FIGMA_CLIENT_ID not configured' });
    }
    const baseUrl = process.env.VERCEL_URL
        ? 'https://' + process.env.VERCEL_URL
        : 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/auth/figma-callback`;
    const state = crypto_1.default.randomBytes(16).toString('hex');
    res.setHeader('Set-Cookie', `figma_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${process.env.VERCEL_URL ? '; Secure' : ''}`);
    const url = `https://www.figma.com/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=file_read&state=${state}&response_type=code`;
    res.redirect(302, url);
}
