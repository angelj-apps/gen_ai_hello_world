from pathlib import Path

path = Path(r"c:\Users\kasum\fall2026\gen_ui\hw1\src\app\page.tsx")
src = path.read_text(encoding="utf-8")
start_marker = '    <div className="app-shell">'
start = src.index(start_marker)
end_marker = "    </div>\n  );\n}"
end = src.index(end_marker) + len("    </div>")
original = src[start:end]

inner_start = original.index(">") + 1
inner = original[inner_start : original.rindex("</div>")].rstrip("\n")

def shell(extra: str) -> str:
    return f'    <div className="app-shell {extra}">\n' + inner + "\n    </div>"

style = '''      <style data-impeccable-css="9fe9fad1">{`
        @scope ([data-impeccable-variant="1"]) {
          :scope > .lt-noscroll-lock {
            height: 100dvh;
            max-height: 100dvh;
            overflow: hidden;
            padding-top: calc(0.6rem + (1 - var(--p-fit, 0.7)) * 1.1rem);
            padding-bottom: 0.75rem;
            scrollbar-width: none;
          }
          :scope > .lt-noscroll-lock::-webkit-scrollbar { display: none; }
          :scope > .lt-noscroll-lock .app-main {
            gap: calc(0.5rem + (1 - var(--p-fit, 0.7)) * 1rem);
            min-height: 0;
          }
          :scope > .lt-noscroll-lock h1 {
            font-size: clamp(1.6rem, 3vw, 2.4rem);
            line-height: 1.1;
          }
        }
        @scope ([data-impeccable-variant="2"]) {
          :scope > .lt-noscroll-compact {
            height: 100dvh;
            max-height: 100dvh;
            overflow: hidden;
            padding: 0.85rem 1rem 1rem;
            scrollbar-width: none;
          }
          :scope > .lt-noscroll-compact::-webkit-scrollbar { display: none; }
          :scope > .lt-noscroll-compact .app-main {
            gap: 0.7rem;
            max-width: 52rem;
          }
          :scope > .lt-noscroll-compact h1 {
            font-size: 1.65rem;
            line-height: 1.15;
          }
          :scope > .lt-noscroll-compact nav { gap: 0.5rem; }
        }
        @scope ([data-impeccable-variant="3"]) {
          :scope > .lt-noscroll-split {
            height: 100dvh;
            max-height: 100dvh;
            overflow: hidden;
            padding: 1rem 1.25rem;
            scrollbar-width: none;
          }
          :scope > .lt-noscroll-split::-webkit-scrollbar { display: none; }
          :scope > .lt-noscroll-split .app-main {
            height: 100%;
            min-height: 0;
          }
          :scope > .lt-noscroll-split #learn {
            min-height: 0;
            overflow-y: auto;
            scrollbar-width: none;
          }
          :scope > .lt-noscroll-split #learn::-webkit-scrollbar { display: none; }
          :scope > .lt-noscroll-split section {
            overflow-y: auto;
            scrollbar-width: none;
          }
          :scope > .lt-noscroll-split section::-webkit-scrollbar { display: none; }
        }
      `}</style>'''

params = (
    'data-impeccable-params=\''
    '[{"id":"fit","kind":"range","min":0,"max":1,"step":0.05,"default":0.7,"label":"Fit"}]\''
)

parts = []
parts.append('    <div data-impeccable-variants="9fe9fad1" data-impeccable-variant-count="3" style={{ display: "contents" }}>')
parts.append("      {/* impeccable-variants-start 9fe9fad1 */}")
parts.append("      {/* Original */}")
parts.append('      <div data-impeccable-variant="original">')
parts.append(original)
parts.append("      </div>")
parts.append("      {/* Variants: insert below this line */}")
parts.append(style)
parts.append(f'      <div data-impeccable-variant="1" {params}>')
parts.append(shell("lt-noscroll-lock"))
parts.append("      </div>")
parts.append('      <div data-impeccable-variant="2" style={{ display: "none" }}>')
parts.append(shell("lt-noscroll-compact"))
parts.append("      </div>")
parts.append('      <div data-impeccable-variant="3" style={{ display: "none" }}>')
parts.append(shell("lt-noscroll-split"))
parts.append("      </div>")
parts.append("      {/* impeccable-variants-end 9fe9fad1 */}")
parts.append("    </div>")

block = "\n".join(parts)
new_src = src[:start] + block + src[end:]
path.write_text(new_src, encoding="utf-8")
print("ok")
