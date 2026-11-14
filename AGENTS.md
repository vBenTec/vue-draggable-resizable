# AGENTS.md

Vue 3 draggable/resizable component library (`vue3-draggable-resizable`), TypeScript, ESM-only.

## Layout

- `src/core/`: framework-agnostic logic (positioning, handles, reference lines, pointer). No Vue imports here.
- `src/vue/`: Vue components (`components/`) and composables (`composables/`).
- `src/index.ts`: public API. Keep exports in sync with `src/index.test-d.ts`.
- `playground/`: local demo app (`pnpm dev-vue`).

## Commands (pnpm only)

- `pnpm test`: Vitest (happy-dom). Tests sit next to their source as `*.test.ts`.
- `pnpm typecheck`: vue-tsc
- `pnpm lint` / `pnpm fmt`: oxlint / oxfmt (not ESLint/Prettier)
- `pnpm build && pnpm check:pkg`: build and validate the package

Before you finish, run what CI runs: `pnpm fmt:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm check:pkg`.

## Conventions

- Branch off `dev`. `release` is the main branch.
- Conventional commit messages (`feat:`, `fix:`, `refactor:`, `chore:`).
- `dist/` is build output. Don't edit it.
