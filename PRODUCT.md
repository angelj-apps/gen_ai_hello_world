# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People preparing for online coding assessments and interviews — including interview-prep beginners, CS students, and self-taught Python newcomers. They want to prepare **efficiently**: learn the right small capabilities, practice transfer, and not drown in full tutorial chapters or raw problem dumps.

## Product Purpose

Little Tools helps learners build Python interview readiness through **atomic skills** (one capability at a time), not topic dumps. Success means the learner can recognize a job (“How do I …?”), try it, understand the syntax in context, keep a personal toolkit of tools they’ve earned, and practice with transfer — progressing along a visible long-term path without being forced through every topic up front.

## Positioning

Unlike a generic Python tutorial (read → copy) or a LeetCode clone (problems first, syntax assumed), Little Tools centers:

- **Discovery before syntax** — a concrete try-first exercise before the teaching card
- **Atomic skills** with explicit soft prerequisites and a multi-wave roadmap
- **Personal tool cards** — personalized corrections grounded in the learner’s own attempt
- **Path map** — sections and waves so the destination stays visible
- **Progress / gamification** in the spirit of mastery paths (skillpoints, grey → yellow → green), without turning the product into a noisy arcade

## Operating Context

Signed-in web app (Next.js + Supabase). Core loop: **Learn** (horizon → discovery → attempt → tool card) → **Toolkit** (saved tools + path map) → **Practice** (graded attempts with in-browser Python) → **Explore** for adjacent tools. Curriculum authority lives in `CURRICULUM.md` and `src/lib/concepts.ts` / `discovery-exercises.ts`. Learners work in a Python editor with run/output, not a blank prose box.

## Capabilities and Constraints

Confirmed capabilities:

- Curriculum skills (Wave 1 launch; Waves 2–8 roadmap)
- Discovery exercises required for catalog skills before syntax
- Tool-card generation from learner attempts
- Toolkit save/load, clarifications, code edit
- Practice sessions with Pyodide run + grading
- Interactive path map (waves → sections → skills)

Constraints / undecided:

- Product must stay easy to use, accessible, and fluid — low cognitive load, pan-safe map interactions, clear hierarchy
- Do not invent testimonials, customers, benchmarks, or pricing claims
- Stack is incumbent: Next.js App Router, Supabase auth/data, Tailwind, Pyodide, CodeMirror Python editor

## Brand Commitments

- Product name: **Little Tools** (nav mark: `lt`)
- Capability language (“How do I …?”) over keyword dumps
- Voice: calm, encouraging, precise — not hype-heavy or tutorial-lecture

## Evidence on Hand

- Live app routes: Learn `/`, Toolkit, Practice, Explore, Library, Profile, Login
- Explore = shared Practice challenges (mix-skill problems); community ▲/▼ upvotes rank helpfulness. Stars are personal mastery on Learn/Toolkit only.
- Curriculum and discovery data: `CURRICULUM.md`, `src/lib/concepts.ts`, `src/lib/discovery-exercises.ts`
- No marketing proof assets (testimonials, press) — future work must not fabricate them

## Product Principles

1. **Try before teach** — discovery and attempt precede syntax reveal.
2. **One capability at a time** — skills are jobs the learner can do, not whole Python chapters.
3. **Personalization over generic examples** — corrections and cards stay grounded in the learner’s attempt.
4. **Long path, short horizon** — show the roadmap; offer only a small next set so preparation stays efficient.
5. **Ease, accessibility, fluidity** — every surface should stay scannable, operable, and calm under real use.

## Accessibility & Inclusion

Ease of use and accessibility are product requirements: clear structure, readable contrast, keyboard-friendly controls where practical, and interactions that don’t punish imprecise input (e.g. map pan vs tap). Specific WCAG target level is not yet decided.
