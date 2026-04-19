# Atyant OPS Frontend

Next.js 15 · TypeScript · Tailwind CSS v3 · Redux Toolkit + RTK Query

## Quick start

```bash
pnpm install
pnpm dev        # → http://localhost:3000
```

`.env.local` is already included:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

## Routes

| Path | Page |
|---|---|
| `/login` | Login with email + password |
| `/invite?token=...` | Accept invite + set password |
| `/dashboard` | Stats overview |
| `/mentors` | Mentor list + add modal |
| `/students` | Student list + add modal |
| `/sessions` | Session list |
| `/tasks` | Task kanban (To Do / In Progress / Done) |
| `/team` | Team members + invite |
| `/settings` | Profile view |
| `/notifications` | Notification center |

## Auth flow

1. Login → POST `/auth/login` → receives `{ token, user }`
2. Token stored in Redux + written to `atyant_session` cookie
3. Middleware checks `atyant_session` cookie on every request
4. `window.location.href` used after login (not `router.replace`) to ensure cookie is committed before middleware checks it
5. On page refresh → `getMe` query rehydrates user from backend HttpOnly cookie

## Structure

```
src/
├── app/
│   ├── login/           ← Login page
│   ├── invite/          ← Accept invite page
│   ├── (app)/           ← All authenticated pages
│   │   ├── layout.tsx   ← Auth guard + sidebar layout
│   │   ├── dashboard/
│   │   ├── mentors/
│   │   ├── students/
│   │   ├── sessions/
│   │   ├── tasks/
│   │   ├── team/
│   │   ├── settings/
│   │   └── notifications/
│   ├── layout.tsx        ← Root layout (StoreProvider + Toaster)
│   └── globals.css
├── store/
│   ├── index.ts          ← Redux store (singleton)
│   ├── hooks.ts          ← useAppDispatch, useAppSelector, useIsAuthenticated
│   ├── slices/authSlice.ts
│   └── api/
│       ├── baseApi.ts    ← RTK Query base + 401 handler
│       ├── authApi.ts    ← login, logout, getMe, acceptInvite
│       ├── mentorsApi.ts
│       ├── studentsApi.ts
│       ├── sessionsApi.ts
│       ├── tasksApi.ts
│       ├── usersApi.ts
│       └── dashboardApi.ts
├── components/
│   ├── layout/Sidebar.tsx
│   ├── layout/Topbar.tsx
│   ├── ui/index.tsx      ← Button, Badge, Avatar, Spinner, Modal, Empty
│   └── common/StoreProvider.tsx
├── lib/
│   ├── constants.ts      ← TOKEN_COOKIE, API_BASE, stage configs, nav items
│   └── utils.ts          ← cn, formatDate, formatRelative, getInitials, etc.
├── types/index.ts
└── middleware.ts          ← Route protection via atyant_session cookie
```
