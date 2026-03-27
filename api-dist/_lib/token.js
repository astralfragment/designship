"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGitHubToken = getGitHubToken;
const crypto_1 = __importDefault(require("crypto"));
function parseCookies(cookieHeader) {
    const cookies = {};
    cookieHeader.split(';').forEach((cookie) => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name)
            cookies[name] = rest.join('=');
    });
    return cookies;
}
function decrypt(encrypted, secret) {
    const [ivHex, encryptedData] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto_1.default.scryptSync(secret, 'salt', 32);
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
function getGitHubToken(req) {
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret)
        return null;
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader)
        return null;
    const cookies = parseCookies(cookieHeader);
    const encryptedToken = cookies['gh_token'];
    if (!encryptedToken)
        return null;
    try {
        return decrypt(encryptedToken, sessionSecret);
    }
    catch {
        return null;
    }
}
