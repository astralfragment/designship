"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabase = getSupabase;
const supabase_js_1 = require("@supabase/supabase-js");
let _client = null;
function getSupabase() {
    if (!_client) {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key)
            throw new Error('Supabase env vars not configured');
        _client = (0, supabase_js_1.createClient)(url, key);
    }
    return _client;
}

if (typeof exports.default !== 'undefined') { module.exports = exports.default; }
