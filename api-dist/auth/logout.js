"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
function handler(_req, res) {
    const baseUrl = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000';
    res.setHeader('Set-Cookie', [
        `gh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
        `gh_logged_in=; Path=/; SameSite=Lax; Max-Age=0`,
    ]);
    res.redirect(302, baseUrl);
}
