import type Database from 'better-sqlite3'
import { ProjectStore } from './projects'
import { FragmentStore } from './fragments'
import type { FragmentInput } from '../../shared/ipc-types'

const SAMPLE_PROJECT_NAME = 'Welcome to Fragment'

const SAMPLE_FRAGMENTS: Omit<FragmentInput, 'project_id'>[] = [
  {
    title: 'Onboarding completion drops sharply after step two',
    type: 'note',
    source: 'Internal review',
    tags: ['onboarding', 'analytics'],
    content:
      'Funnel data: 78% of new users complete step one, only 41% complete step two. Step two asks them to connect a tool before they have seen any value.',
  },
  {
    title: '"I gave up because it was asking me too much, too early."',
    type: 'feedback',
    source: 'Customer interview — Maya, design lead',
    tags: ['onboarding', 'voice-of-customer'],
    content:
      'Maya signed up, hit the connect-tools step, closed the tab. She came back two weeks later and only stayed because a teammate walked her through it.',
  },
  {
    title: '"I want to try the product first, then connect things later."',
    type: 'feedback',
    source: 'Customer interview — Jordan, founder',
    tags: ['onboarding', 'voice-of-customer'],
    content:
      'Jordan explicitly asked for a demo workspace pre-loaded so they could see the workflow before committing to setup.',
  },
  {
    title: 'New users land on an empty Fragments page with no context',
    type: 'qa',
    source: 'QA review of v0.1',
    tags: ['onboarding', 'empty-state'],
    content:
      'Empty state has no actionable CTA. Users do not know what to do first.',
  },
  {
    title: 'First launch must show a working example, not an empty workspace',
    type: 'requirement',
    tags: ['onboarding'],
    content:
      'On first launch the app should auto-seed a sample project so the user can see the Capture → Fragments → Specs flow without setup.',
  },
  {
    title: 'Defer SSO to v2',
    type: 'decision',
    source: 'Founders sync — May 2026',
    tags: ['onboarding', 'auth', 'scope'],
    content:
      'SSO adds significant onboarding friction for the prototype. We will ship local-first only and revisit SSO when team workspaces land.',
  },
  {
    title: 'How should we handle expired or revoked AI provider keys?',
    type: 'question',
    tags: ['onboarding', 'ai'],
    content:
      'If the user configures a Claude key and it later gets revoked, should the AI button silently fall back to the template path, or surface an error?',
  },
  {
    title: 'Onboarding redesign — proposed direction',
    type: 'note',
    source: 'PM draft',
    tags: ['onboarding'],
    content:
      'Pre-seed a Welcome workspace, defer all integrations, lead with a working spec draft on first launch. Connect-tools moves to Settings → optional.',
  },
]

export function seedSampleWorkspace(db: Database.Database): { project_id: string } {
  const projects = new ProjectStore(db)
  const fragments = new FragmentStore(db)

  const existing = projects.findByName(SAMPLE_PROJECT_NAME)
  if (existing) {
    return { project_id: existing.id }
  }

  const project = projects.create(SAMPLE_PROJECT_NAME)
  for (const sample of SAMPLE_FRAGMENTS) {
    fragments.insert({ ...sample, project_id: project.id })
  }
  return { project_id: project.id }
}

export function maybeSeedOnFirstRun(db: Database.Database): void {
  const flag = db
    .prepare(`SELECT value FROM app_config WHERE key = 'first_run_seeded'`)
    .get() as { value: string } | undefined

  if (flag?.value === '1') return

  seedSampleWorkspace(db)

  db.prepare(
    `INSERT OR REPLACE INTO app_config (key, value) VALUES ('first_run_seeded', '1')`,
  ).run()
}
