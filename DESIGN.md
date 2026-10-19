---
name: Little Tools
description: Focus-path workbench for atomic Python interview skills
colors:
  accent: "#0f766e"
  accent-soft: "#d7ebe8"
  ink: "#12151a"
  muted: "#5a6570"
  bg: "#eef2ef"
  bg-glow: "#e2ebe6"
  surface: "#f7faf8"
  surface-raised: "#ffffff"
  line: "#c9d2cc"
  code-bg: "#1a2220"
  code-ink: "#e8efeb"
  danger: "#b42318"
typography:
  title:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    letterSpacing: "0.12em"
rounded:
  sm: "0px"
  md: "6px"
spacing:
  sm: "0.5rem"
  md: "1.25rem"
  lg: "1.75rem"
  shell: "1.75rem 1.25rem 3.5rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface-raised}"
    rounded: "{rounded.sm}"
    padding: "0.625rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface-raised}"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1rem"
  studio-bench:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
  skill-option:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1rem"
---

# Design System: Little Tools

## Overview

**Creative North Star: "The Focus Path"**

Little Tools feels like a calm mastery trail: a soft sage field, one teal accent for progress, and a single bordered workbench where the learner does the next small job. Density stays roomy enough to think, never sparse-for-style. Personality is precise and encouraging — mono micro-labels mark steps on the path; display type never overwhelms the brand mark.

Visual rejections confirmed by the incumbent build: no purple-gradient AI kitsch, no cream-and-terracotta editorial poster look, no broadsheet dense columns, no glow stacks or pill forests, no card grids in the hero of a learning moment.

**Key Characteristics:**
- Soft sage paper field with faint ruled texture
- Teal accent used sparingly for path / focus
- Flat bordered workbench (`studio-bench`) over floating card stacks
- DM Sans + IBM Plex Mono pairing
- Path map as spatial destination, not a dashboard widget wall

## Colors

A cool sage-neutral field with a single deep teal accent and a dark terminal plane for code.

### Primary
- **Path Teal** (#0f766e): Progress, links, focus rings, map selection. Keep rare so the path reads clearly.
- **Path Mist** (#d7ebe8): Soft hover / selected skill wash behind Path Teal.

### Neutral
- **Field Sage** (#eef2ef): Page background.
- **Field Glow** (#e2ebe6): Soft top-left atmosphere on the field.
- **Ink** (#12151a): Primary text and primary buttons.
- **Quiet Slate** (#5a6570): Secondary copy.
- **Hairline** (#c9d2cc): Borders and dividers.
- **Bench Paper** (#f7faf8 / #ffffff): Surface vs raised workbench panels.

### Code plane
- **Terminal Night** (#1a2220) / **Terminal Ink** (#e8efeb): Python editor and run output.

### Semantic
- **Alert Clay** (#b42318): Errors only.

### Named Rules
**The One Accent Rule.** Path Teal is for progress and focus — not decorative fills across a whole viewport.

**The Bench Border Rule.** Depth comes from 1px Hairline borders and tonal paper shifts, not drop shadows.

## Typography

**Display / Body Font:** DM Sans (ui-sans-serif, system-ui)
**Label/Mono Font:** IBM Plex Mono (ui-monospace)

**Character:** Humanist sans for calm clarity; mono for path metadata, syntax hints, and step labels — never for long paragraphs.

### Hierarchy
- **Headline** (600, ~2.25rem / tight): Page titles (Learn, Toolkit).
- **Title** (600, ~1.125rem): Section and panel headings.
- **Body** (400, 1rem / ~1.6): Supporting sentences; keep readable width.
- **Label** (500, ~11px, wide tracking, often uppercase): Mono eyebrows like “Discovery”, “lt”.

### Named Rules
**The Mono Means Meta Rule.** Mono is for structure and code adjacency, not for marketing slogans.

## Layout

Centered workbench shell (`app-shell` → `app-main` max-width ~58rem) with generous vertical gap (~1.75rem). Related panels share one `studio-bench` border; splits use hairline dividers, sticky secondary columns from ~900px. Path map earns a taller viewport and pan/zoom space — it is a destination plane, not a sidebar widget.

## Elevation & Depth

Flat by default. Depth = tonal layering (field → surface → raised) + 1px borders. No ambient shadow vocabulary in the core system. Motion is short and purposeful (fade-up ~280ms, skill-option nudge).

### Named Rules
**The Flat-By-Default Rule.** Surfaces stay flat at rest; interaction feedback is color and micro-motion, not multi-layer shadows.

## Shapes

Mostly sharp workbench edges (0 radius on benches/buttons). Soften only where the map or code chrome already uses slight rounding (~6px) for hit targets. No pill clusters.

## Components

### Buttons
- **Shape:** Sharp (0)
- **Primary:** Ink fill, raised text; hover → Path Teal
- **Ghost / secondary:** Surface fill, Hairline border; hover border/text → Path Teal

### Cards / Containers
- Prefer **studio-bench** shared frames over separate card stacks
- Border Hairline, raised paper, internal padding ~1.25rem
- Skill options are bordered surface rows with light hover wash — interaction containers, not decorative cards

### Inputs / Fields
- Hairline border, raised or code-bg fill
- Focus: Path Teal ring
- Code entry uses the dark terminal plane with syntax colors

### Navigation
- Brand: mono `lt` + “Little Tools” wordmark
- Quiet text links; signed-in email in mono muted

### Signature: Path map
- Dotted spatial field that pans with content
- Wave → section drill-in; grey / graded yellow / green mastery
- Pan-safe tap (drag ≠ navigate)

## Do's and Don'ts

### Do:
- **Do** keep the next action small: short horizon, one discovery, one workbench.
- **Do** use Path Teal for progress and focus only.
- **Do** put code in the terminal plane with run/output.
- **Do** preserve pan-safe map interaction and calm hierarchy.

### Don't:
- **Don't** dump the full curriculum as a skill wall on Learn.
- **Don't** introduce purple glow kits, cream/terracotta poster themes, or broadsheet density.
- **Don't** navigate on map drag or overload the first viewport with stats/chips.
- **Don't** invent marketing proof or hype voice.
