# PRD 07 — Settings + Final Deploy

## Goal
Settings page for OAuth management + API keys. Final deploy and smoke test.

## Route
`src/routes/settings/index.tsx`

## Sections

### Connected accounts
- GitHub: show avatar + login + "Connected" badge. "Disconnect" button.
- Figma: if connected → show name + "Connected". If not → "Connect Figma" button → redirect to `/api/auth/figma-login`

### AI provider
- Show current: "Gemini 2.0 Flash (free)" or "Claude Haiku" or "No AI (deterministic fallback)"
- Input to paste Google AI API key → saves to user preferences in Supabase
- Input to paste Anthropic API key (optional)
- Keys are stored encrypted in Supabase, never exposed to client after save

### Sync settings
- "Last synced: X minutes ago"
- "Sync now" button → calls `/api/sync` manually
- "Sync frequency: every 15 minutes" (informational)

### Danger zone
- "Clear all data" — deletes all PRs, frames, artifacts, outputs for this user (with confirmation)
- "Disconnect all" — removes OAuth tokens

## Final Deploy Checklist
After all PRDs are complete:
1. `npm run build` — must pass with zero errors
2. Push all commits to main
3. Deploy: `TOKEN=$(cat /home/char/.openclaw/workspace/.vercel-token | grep VERCEL_TOKEN | cut -d= -f2) && npx vercel --prod --yes --token "$TOKEN"`
4. Verify all routes load on production URL
5. Commit any final fixes

## Done when
- [ ] Settings page renders all sections
- [ ] Figma connect/disconnect works
- [ ] AI key inputs save to Supabase
- [ ] Manual sync button works
- [ ] Final production deploy successful
- [ ] `npm run build` passes
- [ ] Committed: `feat: settings page + final deploy`
- [ ] Notify: `openclaw system event --text "Done: DesignShip v2 fully built and deployed" --mode now`
