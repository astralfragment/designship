# PRD 05 — Feedback Layer

## Goal
Allow anyone (no login) to leave structured feedback on shared outputs and designs.

## Route
`src/routes/share/$shareId.tsx` (extends the public share from PRD 04)

## Feedback Component
`src/components/feedback-view.tsx`:

### Reactions bar
6 emoji reactions: 👍 🔥 💡 ✅ ❤️ 🤔
- Click to react (no auth, stored by session fingerprint to prevent spam)
- Show reaction counts next to each emoji
- Highlight if you've already reacted

### Comment form
- Name field (optional, placeholder "Anonymous")
- Comment textarea
- Submit → POST `/api/feedback` → save to feedback table
- No login required

### Comments list
- Sorted newest first
- Show: name (or "Anonymous"), comment, time ago
- Simple, clean — not a full comment thread

## API
`api/feedback.ts`:
```typescript
// POST: { share_id, author_name?, content?, reaction? }
// GET: /api/feedback?share_id=xxx → return all feedback for that output
```

## Notifications (simple)
When feedback arrives on an output:
- Store in feedback table with output_id
- Owner sees badge count on `/outputs` page: "3 new reactions"
- No email for MVP — just in-app indicator

## Done when
- [ ] Public share page shows feedback UI
- [ ] Reactions work without login
- [ ] Comments save and display
- [ ] Feedback badge on `/outputs` page
- [ ] `npm run build` passes
- [ ] Committed: `feat: feedback layer — reactions, comments, public share`
