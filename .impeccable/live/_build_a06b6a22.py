from pathlib import Path

page = Path(r"c:\Users\kasum\fall2026\gen_ui\hw1\src\app\page.tsx")
src = page.read_text(encoding="utf-8")
marker = "      <main className={`app-main"
start = src.index(marker)
end = src.index("      </main>\n    </div>\n  );") + len("      </main>")
original = src[start:end]

# Shared body: everything inside <main>...</main> for original structure
# Strip opening/closing main tags to rebuild with different classNames
inner_start = original.index(">") + 1
inner = original[inner_start : original.rindex("</main>")].rstrip("\n")

def main_with_class(extra: str) -> str:
    # Keep identical inner JSX; only swap the fit class on <main>.
    return (
        "      <main\n"
        f'        className={{`app-main ${{focusUnlock ? "max-w-3xl" : ""}} {extra}`}}\n'
        "      >\n"
        + inner
        + "\n      </main>"
    )

# For original, keep exact
orig_block = original

v1 = main_with_class("lt-fit-dense")
v2 = main_with_class("lt-fit-split")
v3 = main_with_class("lt-fit-rail")

style = r'''          <style data-impeccable-css="a06b6a22">{`
            @scope ([data-impeccable-variant="1"]) {
              :scope > .lt-fit-dense {
                gap: calc(0.45rem + (1 - var(--p-compress, 0.7)) * 0.9rem);
                max-height: calc(100dvh - 2.5rem);
                overflow: hidden;
              }
              :scope > .lt-fit-dense > header {
                gap: 0.35rem;
              }
              :scope > .lt-fit-dense > header h1 {
                font-size: clamp(1.35rem, 2.4vw, 1.85rem);
                line-height: 1.15;
              }
              :scope > .lt-fit-dense > header > p {
                margin: 0;
              }
              :scope > .lt-fit-dense > header > a {
                padding: 0.25rem 0.65rem;
                font-size: 0.75rem;
              }
              :scope > .lt-fit-dense .learn-fun-shell {
                gap: 0.75rem;
                padding: 0.85rem 1rem;
              }
              :scope > .lt-fit-dense .learn-fun-skill {
                padding: 0.55rem 0.75rem;
              }
              :scope > .lt-fit-dense nav {
                gap: 0.5rem;
              }
            }
            @scope ([data-impeccable-variant="2"]) {
              :scope > .lt-fit-split {
                display: grid;
                grid-template-columns: minmax(12rem, 0.9fr) minmax(0, 1.4fr);
                grid-template-rows: auto auto minmax(0, 1fr);
                column-gap: 1.25rem;
                row-gap: 0.75rem;
                max-height: calc(100dvh - 2.5rem);
                overflow: hidden;
                align-content: start;
              }
              :scope > .lt-fit-split > nav {
                grid-column: 1 / -1;
              }
              :scope > .lt-fit-split > header {
                grid-column: 1;
                grid-row: 2;
                gap: 0.4rem;
                align-self: start;
              }
              :scope > .lt-fit-split > header h1 {
                font-size: clamp(1.4rem, 2.2vw, 2rem);
                line-height: 1.15;
              }
              :scope > .lt-fit-split > #learn,
              :scope > .lt-fit-split > section {
                grid-column: 2;
                grid-row: 2 / span 2;
                min-height: 0;
                overflow: auto;
              }
              :scope > .lt-fit-split > div:not(#learn) {
                grid-column: 1 / -1;
              }
              :scope > .lt-fit-split .learn-fun-shell {
                gap: 0.85rem;
                padding: 0.9rem 1rem;
                height: 100%;
              }
              @media (max-width: 819px) {
                :scope > .lt-fit-split {
                  display: flex;
                  flex-direction: column;
                }
                :scope > .lt-fit-split > #learn,
                :scope > .lt-fit-split > section {
                  overflow: visible;
                }
              }
            }
            @scope ([data-impeccable-variant="3"]) {
              :scope > .lt-fit-rail {
                gap: 0.65rem;
                max-height: calc(100dvh - 2.25rem);
                overflow: hidden;
              }
              :scope > .lt-fit-rail > header {
                flex-direction: row;
                flex-wrap: wrap;
                align-items: baseline;
                gap: 0.5rem 1rem;
              }
              :scope > .lt-fit-rail > header > p {
                order: 0;
              }
              :scope > .lt-fit-rail > header h1 {
                order: 1;
                flex: 1 1 auto;
                font-size: clamp(1.25rem, 2vw, 1.65rem);
                line-height: 1.2;
              }
              :scope > .lt-fit-rail > header > a {
                order: 2;
                margin-left: auto;
                padding: 0.2rem 0.55rem;
                font-size: 0.7rem;
              }
              :scope > .lt-fit-rail .learn-fun-shell {
                gap: 0.65rem;
                padding: 0.75rem 0.9rem;
              }
              :scope > .lt-fit-rail .learn-fun-skill > span:first-child {
                height: 1.75rem;
                width: 1.75rem;
                font-size: 0.65rem;
              }
              :scope > .lt-fit-rail nav {
                padding-bottom: 0.15rem;
                border-bottom: 1px solid var(--line);
              }
            }
          `}</style>'''

params1 = """data-impeccable-params='[{"id":"compress","kind":"range","min":0,"max":1,"step":0.05,"default":0.7,"label":"Compress"}]'"""

block = f'''      <div data-impeccable-variants="a06b6a22" data-impeccable-variant-count="3" style={{ display: "contents" }}>
        {{/* impeccable-variants-start a06b6a22 */}}
        {{/* Original */}}
        <div data-impeccable-variant="original">
{orig_block}
        </div>
        {{/* Variants: insert below this line */}}
{style}
        <div data-impeccable-variant="1" {params1}>
{v1}
        </div>
        <div data-impeccable-variant="2" style={{ display: "none" }}>
{v2}
        </div>
        <div data-impeccable-variant="3" style={{ display: "none" }}>
{v3}
        </div>
        {{/* impeccable-variants-end a06b6a22 */}}
      </div>'''

# Fix indentation of orig/v mains - they already have 6-space indent; inside div need +2 spaces? 
# orig_block starts with 6 spaces. Nested in variant div should be fine.

new_src = src[:start] + block + src[end:]
page.write_text(new_src, encoding="utf-8")
print("written", page)
print("ok")
