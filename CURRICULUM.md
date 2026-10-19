# Little Tools curriculum map

Design + product contract. Wave 1 skill ids live in `src/lib/concepts.ts`. Later waves are roadmap only until validated.

---

## Levels vs skill cards

Learn / Expand / Toolkit / Practice (and mastery stages) are **different depths of engagement with the same skill**, not four different skill catalogs.

- One stable skill id per capability (`for_loop`, `list_index`, …).
- Later engagement reuses that id — do not invent `for_loop_advanced` or duplicate cards per level.
- Later **waves** compose earlier skills as prerequisites; they do not clone them.

---

## Design rules

1. **One capability per skill** — something the learner can *do*, not an entire Python topic.
2. **Explicit prerequisites** — record *direct* dependencies only, not every skill that came before.
3. **Separate syntax from application** — knowing `for` and knowing when to use a loop are different achievements (syntax skill vs pattern skill).
4. **Teach concepts before relying on them** — no exercise should secretly require an unintroduced operation.
5. **Mastery requires transfer** — recognizing a syntax example is not enough; use it in a new context.
6. **Keep the full roadmap visible** — show the long-term destination without forcing beginners through every topic up front.
7. **Stable ids** — reuse existing ids when the meaning matches so toolkit rows survive.
8. **Horizon-sized launch** — Wave 1 stays ~20–28 skills so Learn does not drown beginners.

---

## Full roadmap (eight waves)

Long-term map. Waves 5–8 expand into individual skills as earlier waves are validated. Shipping Wave 1 does not require implementing all eight.

| Wave | Name | Outcome |
|------|------|---------|
| **01** | Foundations *(current focus)* | Write small programs and trace what they do |
| **02** | Working with data | Choose an appropriate data structure for a task |
| **03** | Reusable, reliable code | Turn a solution into a reusable, testable function |
| **04** | Core problem-solving patterns | Recognize recurring problems and select a strategy |
| **05** | Search and ordering | Exploit ordering to solve problems more efficiently |
| **06** | Recursion and structured data | Solve problems with hierarchical data and recursive structure |
| **07** | Graphs and traversal | Reason about relationships, reachability, and routes |
| **08** | Advanced algorithms & interview readiness | Solve unfamiliar problems, justify an approach, analyze efficiency |

**Wave 01 — Foundations:** names, values, comparisons, conditions, lists, strings, loops, accumulation.

**Wave 02 — Working with data:** indexing/slicing, dicts, sets, tuples, nested collections, comprehensions.

**Wave 03 — Reusable, reliable code:** functions, parameters, returns, built-ins, mutation, copying, debugging, errors.

**Wave 04 — Core problem-solving patterns:** counting, lookup, filtering, transformation, stacks, queues, two pointers, sliding windows, prefix sums.

**Wave 05 — Search and ordering:** sorting, custom sort keys, binary search, searching sorted data, intervals.

**Wave 06 — Recursion and structured data:** recursive calls, base cases, trees, BSTs, heaps, priority queues.

**Wave 07 — Graphs and traversal:** graph representations, BFS, DFS, visited sets, connected components, topological sorting, shortest paths.

**Wave 08 — Advanced algorithms:** backtracking, greedy, dynamic programming, complexity analysis, mixed assessments.

Complexity intuition starts earlier than Wave 8: simple runtime feel in Wave 3, linear vs quadratic in Wave 4, formal analysis as algorithms deepen.

---

## Wave 1 — launch catalog (22 skills)

### 1. Names and output

| ID | Skill | Prerequisites |
|----|-------|---------------|
| `assign_value` | Store a value in a name | None |
| `print_value` | Show a value | None |
| `input_read` | Ask the user for a value | `assign_value` |
| `arith_add` | Add numbers together | `assign_value` |

### 2. Comparisons

| ID | Skill | Prerequisites |
|----|-------|---------------|
| `equality` | Check whether two values are equal | None |
| `inequality` | Check whether two values are not equal | `equality` |
| `compare_order` | Compare which value is bigger or smaller | `equality` |

### 3. Decisions

| ID | Skill | Prerequisites |
|----|-------|---------------|
| `if_branch` | Do something only when a condition is true | `equality` **or** `compare_order` |
| `if_else` | Choose between two paths | `if_branch` |
| `bool_and` | Require two conditions both true | `if_branch` |
| `bool_or` | Accept either of two conditions | `if_branch` |

### 4. Lists

| ID | Skill | Prerequisites |
|----|-------|---------------|
| `list_create` | Make a list of values | None |
| `list_length` | Count items in a list | `list_create` |
| `list_index` | Get an item by position | `list_create` |
| `list_membership` | Check whether a value is in a list | `list_create` |
| `list_absence` | Check that a value is missing from a list | `list_membership` |
| `list_append` | Add an item to the end of a list | `list_create` |

### 5. Text

| ID | Skill | Prerequisites |
|----|-------|---------------|
| `string_combine` | Join text together | `assign_value` |
| `string_length` | Count characters in text | `string_combine` |
| `string_index` | Get a character by position | `string_combine` |

### 6. Loops

| ID | Skill | Prerequisites |
|----|-------|---------------|
| `for_loop` | Repeat something for each item in a list | `list_create` |
| `loop_accumulate` | Build a result while looping | `for_loop`, `assign_value` |

**Starters** (available immediately, no prerequisite mastery): `assign_value`, `print_value`, `list_create`, `equality`.

**Park for later** (out of initial Wave 1): modulo and `+=`; type conversion; `elif`; `range`, `break`, and `continue`; string `.split()`, `.strip()`, and deeper immutability; advanced list operations.

### Wave 1 discovery exercises

Before syntax for a catalog skill, Learn shows a **discovery question** (prompt + optional starter code). The learner must edit beyond the starter before opening the tool card. Data: `src/lib/discovery-exercises.ts`.

| Skill ID | Exercise prompt | Starter code |
|----------|-----------------|--------------|
| `assign_value` | Save the name of your favorite song in a variable called song. | — |
| `print_value` | Display "Welcome to the game!" on the screen. | — |
| `input_read` | Let a user enter their destination and save it in destination. | `destination = ""` |
| `arith_add` | Calculate the final price after adding a $4 delivery fee to a $16 order. | `price = 16` / `delivery = 4` |
| `equality` | Check whether the two PIN entries match. | `pin1` / `pin2` |
| `inequality` | Check whether the current player and the previous winner are different people. | `player` / `winner` |
| `compare_order` | Check whether a train ticket costing $28 is cheaper than one costing $35. | — |
| `if_branch` | Display "Low battery!" when the battery level is below 15. | `battery = 12` |
| `if_else` | Display "On time" if a bus arrives by 9:00. Otherwise, display "Late". | `arrival_time = 9.15` |
| `bool_and` | Check whether a student can enter an event only if they have a ticket and their name is on the guest list. | `has_ticket` / `on_guest_list` |
| `bool_or` | Check whether a player earns a bonus for finding a secret item or completing a bonus level. | `found_secret` / `beat_bonus_level` |
| `list_create` | Store the names of three cities you'd like to visit in a list called cities. | — |
| `list_length` | Find how many songs are in this playlist. | `playlist = [...]` |
| `list_index` | Get the second stop on this itinerary. | `stops = [...]` |
| `list_membership` | Check whether "mango" is on the grocery list. | `groceries = [...]` |
| `list_absence` | Check whether "password123" is missing from the list of blocked passwords. | `blocked = [...]` |
| `list_append` | Add "Submit assignment" to the existing to-do list. | `tasks = [...]` |
| `string_combine` | Combine a first name and a last name into one full name, with a space between them. | `first` / `last` |
| `string_length` | Check whether an invitation code has at least eight characters. | `code = "SUNSET42"` |
| `string_index` | Get the first character of this airport code. | `airport = "JFK"` |
| `for_loop` | Print each item on the packing list, one at a time. | `packing = [...]` |
| `loop_accumulate` | Calculate the total number of minutes spent on these three activities. | `minutes = [20, 35, 15]` |

---

## Wave 2 — Working with data (atomic skills)

Goal: select, organize, transform, and inspect collections. Prefer dictionaries before sets (frequency + fast lookup); sets follow for uniqueness / membership.

| Skill ID | Capability |
|----------|------------|
| `list_slice` | Get a portion of a list |
| `list_negative_index` | Get an item from the end of a list |
| `list_update` | Replace an item at a position |
| `list_sort` | Put list items in order |
| `list_reverse` | Reverse a list |
| `list_nested` | Get an item from a nested list |
| `list_copy` | Make a separate copy of a list |
| `tuple_create` | Group values in a tuple |
| `tuple_unpack` | Assign tuple items to separate names |
| `dict_create` | Associate keys with values |
| `dict_lookup` | Find a value using a key |
| `dict_update` | Add or replace a key-value pair |
| `dict_get` | Look up a key with a fallback |
| `dict_membership` | Check whether a key exists |
| `dict_items` | Loop over keys and values |
| `set_create` | Make a collection of unique values |
| `set_membership` | Check whether a value belongs to a set |
| `set_union` | Combine unique values from sets |
| `set_intersection` | Find values shared by sets |
| `list_comprehension` | Build a list from an iterable |
| `filtered_comprehension` | Build a list using a condition |
| `dict_comprehension` | Build a dictionary from an iterable |

---

## Wave 3 — Reusable, reliable code

Goal: package logic, understand failures, avoid accidental mutation. Teach **return** separately from **print**.

| Skill ID | Capability |
|----------|------------|
| `function_define` | Define a reusable function |
| `function_parameter` | Pass information into a function |
| `function_return` | Return a result from a function |
| `function_print_return` | Distinguish displaying a result from returning it |
| `function_default` | Provide a default parameter value |
| `function_scope` | Understand where a variable is available |
| `builtin_sum` | Add up values with `sum()` |
| `builtin_min_max` | Find the smallest or largest value |
| `builtin_sorted` | Create a sorted result without changing the original |
| `builtin_enumerate` | Loop with an item and its position |
| `builtin_zip` | Pair items from multiple iterables |
| `builtin_any_all` | Test whether any or all conditions hold |
| `builtin_range` | Generate a sequence of integers |
| `builtin_type_conversion` | Convert between compatible types |
| `error_traceback` | Locate the source of a runtime error |
| `error_index_key` | Handle missing positions and keys |
| `try_except` | Handle an expected exception |
| `debug_trace` | Trace changing values through execution |
| `mutation_behavior` | Identify operations that modify a collection |
| `copy_behavior` | Distinguish shared references from independent copies |
| `edge_case_test` | Test empty, minimal, and boundary inputs |

---

## Wave 4 — Core problem-solving patterns

Goal: combine existing tools into reusable algorithms (not pure syntax skills).

| Skill ID | Capability |
|----------|------------|
| `pattern_filter` | Keep items that satisfy a condition |
| `pattern_transform` | Convert each item into a new value |
| `pattern_count` | Count items that satisfy a condition |
| `pattern_frequency` | Count occurrences using a dictionary |
| `pattern_seen` | Track which values have appeared |
| `pattern_group` | Group values by a shared property |
| `pattern_stack` | Process the most recently added item first |
| `pattern_queue` | Process the earliest added item first |
| `pattern_two_pointers` | Move two positions through a sequence |
| `pattern_sliding_window` | Maintain a moving range of items |
| `pattern_prefix_sum` | Answer range-sum questions using cumulative totals |
| `pattern_fast_lookup` | Trade storage for faster repeated lookups |
| `pattern_in_place` | Modify a collection without building a full replacement |
| `pattern_nested_loop` | Compare combinations of items |

Example: frequency counting combines loops, dict updates, membership/fallback, and integer arithmetic — it depends on those Wave 1–3 skills; it does not duplicate them.

---

## Waves 5–8 — skill families (expand later)

| Wave | Skill families |
|------|----------------|
| 5 Search & ordering | Sorting with keys, binary search boundaries, interval merging, search over an answer range |
| 6 Recursion & structured data | Base cases, recursive calls, call-stack tracing, tree traversal, BST search, heap operations |
| 7 Graphs & traversal | Adjacency lists, BFS, DFS, visited sets, connected components, topological ordering, shortest paths |
| 8 Advanced algorithms | Backtracking, permutations/combinations, greedy choice, overlapping subproblems, memoization, tabulation, DP state design |

---

## Prerequisite graph design

The graph captures what makes a skill **learnable**, not every possible relationship.

```text
list_create
  → list_length
  → list_index
  → list_membership
```

### Graph rules

1. Each skill has a stable **id**, a **track**, a **wave**, and zero or more direct prerequisites.
2. Prerequisites are **soft recommendations** in the product, not access locks.
3. A skill may have **alternative** prerequisites (`anyOf`): any one capability is enough (e.g. a condition from equality, order, or membership).
4. Avoid redundant **transitive** edges. If A → B → C, do not add A → C unless C depends on A independently of B.
5. **Cross-track** dependencies are allowed.
6. **No cycles** — validation should reject cyclic dependencies.
7. A skill can be mastered even when prerequisites are not formally mastered; the graph guides learning, it does not grant permission.

### Data model: `all` vs `anyOf`

A flat list of prerequisites means **every** listed parent is required. When any one of several capabilities is sufficient, use an `anyOf` group:

```ts
// concepts.ts shape
type PrereqRule =
  | { all: string[] }
  | { anyOf: string[] }
  | { all: string[]; anyOf: string[] }; // rare: need every `all` and one of `anyOf`
```

Ranking “what should I do next?” stays separate from this graph (horizon / soft rank).

---

## Path map (in product)

Shown on **Toolkit → Your path** (also linked from Learn as “See your path”).

**Overview:** eight **wave** nodes in sequence (01 → 08). Tap a wave (short tap, not a drag) to open that wave’s **section graph** — the same layered track flow Wave 1 used before (Names → Lists → Loops, etc.). Later waves show planned section nodes even when skills are not shipped yet.

Inside a wave: tap a **section** to open its skill list. **← All waves** returns to the overview. Dotted background moves with the map.

Colors (wave, section, and skill):

- **Grey** — nothing started (or roadmap-only with no live skills)
- **Yellow** — in progress; deepens as average skillpoints rise
- **Green** — every live skill in that scope is mastered (`skill_points >= 3`)

---

## When implementing next

1. Soft-rank Learn with “direct prereqs met” (`all` + `anyOf`).
2. On correct Practice: +1 selected skills; +1 once to each **direct** owned prereq (no full transitive credit).
3. Ship Wave 1 additions (`arith_add`, `string_index`) with cards; keep `string_index` off the starter horizon if needed.
4. Expand Waves 2–4 into `concepts.ts` only after Wave 1 cards and ranking feel solid.
5. Add cycle validation over the prereq graph in CI or a small unit test.
