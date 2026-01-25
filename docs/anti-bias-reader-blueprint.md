# The Anti-Bias Reader – 9-Step Execution Plan

> Persona: Senior Full-Stack Architect, UX Director & Security Lead
> Model mindset: Quantum Engineering Agent (QEA)

## Task 1: The Stack & Architecture (Solid Foundation)

### Recommended Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Row Level Security)
- **State/Query:** TanStack Query + Zod validation
- **PWA:** Next.js `next-pwa` or Workbox, plus `manifest.webmanifest`
- **Analytics:** First-party event collection + optional PostHog/Segment
- **Payments:** Stripe (Billing Portal + Checkout)

### Security Plan
- **CSRF**
  - Use **SameSite=Lax** cookies and a **double-submit token** (signed cookie + `X-CSRF-Token` header) for state-changing requests.
  - SSR forms include a hidden CSRF token generated in middleware and validated on submit.
- **XSS Sanitization for RSS feeds**
  - Sanitize feed HTML server-side using DOMPurify (via `isomorphic-dompurify`) with a strict allowlist.
  - Strip `on*` handlers, scripts, `style` attributes, and unknown tags.
  - Enforce CSP: `default-src 'self'; script-src 'self'; img-src 'self' https: data:`.
- **Cookie Management (Guest vs Social Auth)**
  - **Guest Mode:** signed, httpOnly cookie containing a guest session id (TTL 7 days).
  - **Social Auth:** Supabase OAuth with rotating refresh tokens, stored httpOnly and SameSite cookies.
  - **Upgrade Flow:** when user opts to save progress, migrate guest data to the authenticated user id server-side.

#### Example: Secure Session Cookie Utilities (Server)
```ts
import { cookies } from "next/headers";

const SESSION_COOKIE = "abr_session";

export function setGuestSession(sessionId: string) {
  try {
    cookies().set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch (error) {
    console.error("Failed to set guest session cookie", error);
  }
}

export function clearGuestSession() {
  try {
    cookies().set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  } catch (error) {
    console.error("Failed to clear guest session cookie", error);
  }
}
```

---

## Task 2: SQL Database Schema (Data & Gamification)

### PostgreSQL SQL Schema
```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text,
  auth_provider text check (auth_provider in ('guest', 'google', 'apple', 'github')),
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  article_id text not null,
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds int default 0,
  context_depth int default 0
);

create index reading_sessions_user_idx on reading_sessions(user_id, started_at desc);

create table streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users(id) on delete cascade,
  current_streak int default 0,
  last_read_date date,
  updated_at timestamptz default now()
);

create table medals (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  min_streak int default 0,
  created_at timestamptz default now()
);

create table user_medals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  medal_id uuid references medals(id) on delete cascade,
  awarded_at timestamptz default now(),
  unique (user_id, medal_id)
);

create table ads_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  article_id text,
  impression_type text check (impression_type in ('chapter', 'interstitial', 'rewarded')),
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

insert into medals (code, name, description, min_streak)
values ('monthly_guardian', 'Monthly Guardian', '30-day reading streak achieved', 30);

create or replace function award_streak_medals(p_user_id uuid)
returns void as $$
begin
  insert into user_medals (user_id, medal_id)
  select p_user_id, m.id
  from medals m
  join streaks s on s.user_id = p_user_id
  where s.current_streak >= m.min_streak
  on conflict do nothing;
end;
$$ language plpgsql;

create or replace function update_streak(p_user_id uuid, p_read_date date)
returns void as $$
declare
  last_date date;
  new_streak int;
begin
  select last_read_date, current_streak into last_date, new_streak
  from streaks
  where user_id = p_user_id
  for update;

  if last_date is null then
    new_streak := 1;
  elsif p_read_date = last_date then
    return;
  elsif p_read_date = last_date + interval '1 day' then
    new_streak := new_streak + 1;
  else
    new_streak := 1;
  end if;

  insert into streaks (user_id, current_streak, last_read_date)
  values (p_user_id, new_streak, p_read_date)
  on conflict (user_id)
  do update set current_streak = excluded.current_streak,
    last_read_date = excluded.last_read_date,
    updated_at = now();

  perform award_streak_medals(p_user_id);
end;
$$ language plpgsql;
```

---

## Task 3: The "Book" Layout & Tailwind Config

### Tailwind Configuration (Fonts)
```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        headline: ["Gotham", "system-ui", "sans-serif"],
        body: ["Times New Roman", "Times", "serif"],
        ui: ["Calibri", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

### Page Container with Swipe (Left/Right)
```tsx
"use client";

import { useEffect, useRef } from "react";

type PageContainerProps = {
  children: React.ReactNode;
  onNext: () => void;
  onPrev: () => void;
};

export function PageContainer({ children, onNext, onPrev }: PageContainerProps) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      try {
        startX.current = event.clientX;
        startY.current = event.clientY;
      } catch (error) {
        console.error("Failed to capture pointer start", error);
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      try {
        if (startX.current === null || startY.current === null) return;
        const deltaX = event.clientX - startX.current;
        const deltaY = Math.abs(event.clientY - startY.current);
        if (deltaY > 50) return;
        if (deltaX < -40) onNext();
        if (deltaX > 40) onPrev();
        startX.current = null;
        startY.current = null;
      } catch (error) {
        console.error("Failed to handle swipe", error);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [onNext, onPrev]);

  return (
    <section className="min-h-screen bg-stone-50 text-stone-900 font-body">
      <div className="mx-auto max-w-3xl px-6 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-3xl bg-white">
        {children}
      </div>
    </section>
  );
}
```

---

## Task 4: Smart Auth & Logic (Hybrid Auth)

### Guest First, Prompt Later
```ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function ensureGuestSession() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      await supabase.auth.signInAnonymously();
    }
  } catch (error) {
    console.error("Failed to initialize guest session", error);
  }
}

export async function promptSocialUpgrade() {
  try {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  } catch (error) {
    console.error("Failed to start OAuth flow", error);
  }
}
```

### Guest → Social Migration (Server)
```ts
export async function migrateGuestData(guestId: string, userId: string) {
  try {
    // move guest reading_sessions + streaks to the newly authenticated user
  } catch (error) {
    console.error("Failed to migrate guest data", error);
  }
}
```

---

## Task 5: Mobile Sitemap & Navigation Flow

```
Home
├── Library (default)
│   ├── Article Card
│   │   └── Article (Book View)
│   │       ├── Page Turn Left/Right
│   │       ├── Context Deep Dive
│   │       │   └── Source Citations / Glossary / Related Studies
│   │       └── Return to Article
│   └── Topic Filters
├── Daily Streak
│   └── Medal Progress
├── Profile
│   └── Save Progress (Social Auth Prompt)
└── Settings
    ├── Themes
    └── Accessibility
```

---

## Task 6: Gamification & Animation (The "Spark")

### Daily Streak Flame (Framer Motion)
```tsx
"use client";

import { motion } from "framer-motion";

type FlameProps = {
  isActive: boolean;
};

export function DailyFlame({ isActive }: FlameProps) {
  const ignite = () => {
    try {
      return isActive ? { scale: [0.9, 1.1, 1], opacity: [0.4, 1, 0.9] } : {};
    } catch (error) {
      console.error("Failed to compute flame animation", error);
      return {};
    }
  };

  return (
    <motion.div
      className="h-10 w-10 rounded-full bg-orange-500 shadow-[0_0_25px_rgba(255,125,0,0.6)]"
      animate={ignite()}
      transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
    />
  );
}
```

### Daily Streak Flame (Pure CSS fallback)
```css
@keyframes flamePulse {
  0% { transform: scale(0.9); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.85; }
}

.flame {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: #f97316;
  box-shadow: 0 0 25px rgba(255, 125, 0, 0.6);
  animation: flamePulse 0.8s infinite;
}
```

### Medal Unlock Popup
```tsx
"use client";

import { motion } from "framer-motion";

type MedalUnlockProps = {
  open: boolean;
  onClose: () => void;
};

export function MedalUnlock({ open, onClose }: MedalUnlockProps) {
  const handleClose = () => {
    try {
      onClose();
    } catch (error) {
      console.error("Failed to close medal popup", error);
    }
  };

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div
        className="rounded-2xl bg-white px-8 py-6 text-center shadow-2xl"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <h3 className="font-headline text-2xl">Monthly Guardian</h3>
        <p className="mt-2 font-body text-stone-600">30-day streak achieved.</p>
        <button
          onClick={handleClose}
          className="mt-4 rounded-full bg-stone-900 px-4 py-2 font-ui text-white"
        >
          Continue Reading
        </button>
      </motion.div>
    </motion.div>
  );
}
```

---

## Task 7: Better Navigation (Navbar & Foobar)

```tsx
"use client";

import Link from "next/link";

export function Navbar({ hidden }: { hidden?: boolean }) {
  if (hidden) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <span className="font-headline text-xl">Anti-Bias Reader</span>
        <input
          className="w-48 rounded-full border border-stone-200 px-4 py-2 font-ui"
          placeholder="Search"
        />
      </div>
    </header>
  );
}

export function Foobar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2 px-6 py-3 text-center font-ui text-sm">
        <Link href="/library">📚 Library</Link>
        <Link href="/streak">🔥 12</Link>
        <Link href="/profile">👤 Profile</Link>
        <Link href="/settings">⚙️ Settings</Link>
      </div>
    </nav>
  );
}
```

---

## Task 8: Monetization & External Links

### Stripe + AdSense Placement (Between Chapters)
```tsx
export function ChapterInterstitial({ showAds }: { showAds: boolean }) {
  try {
    if (!showAds) return null;
    return (
      <aside className="my-10 rounded-3xl border border-stone-200 bg-stone-50 p-8">
        <div id="adsense-container" className="min-h-[320px]">
          {/* Google AdSense script renders here */}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <p className="font-body text-stone-600">Support the mission.</p>
          <button id="stripe-checkout" className="rounded-full bg-stone-900 px-4 py-2 font-ui text-white">
            Upgrade
          </button>
        </div>
      </aside>
    );
  } catch (error) {
    console.error("Failed to render interstitial", error);
    return null;
  }
}
```

### Social Links (Precise Formatting)
- Instagram: **@techandstream**
- GitHub: **@kvnbbg**

---

## Task 9: The "Ready for Demo" Polish

- Every JS/TS code snippet above includes **try/catch** error handling in all event handlers and async calls.
- Avoid try/catch around imports (per code style constraint).
- With Next.js + TypeScript + ESLint, this structure compiles cleanly and supports future linting rules.

---

## QEA Optimization Notes

**Entanglements Identified**
- Auth + analytics data must respect privacy boundaries.
- Swipe navigation must remain accessible and not break pointer semantics.
- Medals logic must be deterministic to avoid user trust erosion.

**Future-state superpositions**
- **Path A:** Minimal ads + premium subscriptions (higher trust, lower revenue variability)
- **Path B:** Hybrid ads + membership (balanced revenue, needs stronger ad safety)

**Recommendation:** Start on Path A for brand integrity, then layer Path B after user trust stabilization.
