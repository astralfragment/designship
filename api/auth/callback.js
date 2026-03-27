"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const crypto_1 = __importDefault(require("crypto"));
function encrypt(text, secret) {
    const iv = crypto_1.default.randomBytes(16);
    const key = crypto_1.default.scryptSync(secret, 'salt', 32);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}
async function handler(req, res) {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Missing code parameter' });
    }
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const sessionSecret = process.env.SESSION_SECRET;
    if (!clientId || !clientSecret || !sessionSecret) {
        return res.status(500).json({ error: 'Missing environment variables' });
    }
    try {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });
        const tokenData = await tokenRes.json();
        if (tokenData.error) {
            return res.status(400).json({ error: tokenData.error_description || tokenData.error });
        }
        const encryptedToken = encrypt(tokenData.access_token, sessionSecret);
        const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
        res.setHeader('Set-Cookie', [
            `gh_token=${encryptedToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure`,
            `gh_logged_in=1; Path=/; SameSite=Lax; Max-Age=604800; Secure`,
        ]);
        res.redirect(302, `${baseUrl}/dashboard`);
    }
    catch (err) {
        console.error('OAuth callback error:', err);
        res.status(500).json({ error: 'Failed to exchange code for token' });
    }
}
