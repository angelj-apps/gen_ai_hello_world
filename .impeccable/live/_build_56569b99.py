from pathlib import Path

path = Path(r"c:\Users\kasum\fall2026\gen_ui\hw1\src\components\AttemptFirstLearn.tsx")
src = path.read_text(encoding="utf-8")
start_marker = '    <div className="learn-fun-shell flex flex-col gap-6">'
start = src.index(start_marker)
# end at the closing of that div before `  );\n}`
end = src.index("\n  );\n}", start)
# find last </div> before end that closes the shell — the return closes with </div>\n  );
close = src.rindex("    </div>", start, end)
end = close + len("    </div>")
original = src[start:end]

inner_start = original.index(">") + 1
inner = original[inner_start : original.rindex("</div>")].rstrip("\n")


def shell(extra: str) -> str:
    return (
        f'    <div className="learn-fun-shell flex flex-col gap-6 {extra}">\n'
        + inner
        + "\n    </div>"
    )


style = '''      <style data-impeccable-css="56569b99">{`
        @scope ([data-impeccable-variant="1"]) {
          :scope > .lt-skills-snug {
            gap: calc(0.55rem + (1 - var(--p-density, 0.65)) * 0.85rem);
            padding: 1rem 1rem 1.1rem;
          }
          :scope > .lt-skills-snug ul.grid {
            gap: calc(0.35rem + (1 - var(--p-density, 0.65)) * 0.55rem);
          }
          :scope > .lt-skills-snug .learn-fun-skill {
            padding: 0.45rem 0.7rem;
            border-radius: 10px;
            box-shadow: 0 2px 0 rgb(18 21 26 / 0.05);
            align-items: center;
            gap: 0.65rem;
          }
          :scope > .lt-skills-snug .learn-fun-skill > span:first-child {
            margin-top: 0;
            height: 1.65rem;
            width: 1.65rem;
            font-size: 0.65rem;
          }
          :scope > .lt-skills-snug .learn-fun-skill span.font-bold {
            font-size: 0.875rem;
            line-height: 1.25;
          }
          :scope > .lt-skills-snug h2 {
            font-size: 1.25rem;
          }
        }
        @scope ([data-impeccable-variant="2"]) {
          :scope > .lt-skills-tiles {
            gap: 0.85rem;
            padding: 1.1rem 1.1rem 1.2rem;
          }
          :scope > .lt-skills-tiles ul.grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
          @media (min-width: 640px) {
            :scope > .lt-skills-tiles ul.grid {
              grid-template-columns: 1fr 1fr;
            }
          }
          :scope > .lt-skills-tiles .learn-fun-skill {
            padding: 0.55rem 0.75rem;
            height: 100%;
            align-items: flex-start;
            gap: 0.55rem;
          }
          :scope > .lt-skills-tiles .learn-fun-skill > span:first-child {
            margin-top: 0.1rem;
            height: 1.75rem;
            width: 1.75rem;
            font-size: 0.65rem;
          }
          :scope > .lt-skills-tiles h2 {
            font-size: 1.35rem;
          }
        }
        @scope ([data-impeccable-variant="3"]) {
          :scope > .lt-skills-inline {
            gap: 0.75rem;
            padding: 1rem;
          }
          :scope > .lt-skills-inline ul.grid {
            gap: 0.4rem;
          }
          :scope > .lt-skills-inline .learn-fun-skill {
            padding: 0.4rem 0.65rem;
            border-radius: 8px;
            align-items: center;
            gap: 0.55rem;
            box-shadow: none;
          }
          :scope > .lt-skills-inline .learn-fun-skill:hover {
            transform: none;
            box-shadow: none;
          }
          :scope > .lt-skills-inline .learn-fun-skill > span:first-child {
            margin-top: 0;
            height: 1.4rem;
            width: 1.4rem;
            font-size: 0.6rem;
            border-radius: 6px;
          }
          :scope > .lt-skills-inline .learn-fun-skill > span.min-w-0 {
            display: flex;
            flex-wrap: wrap;
            align-items: baseline;
            gap: 0.35rem 0.65rem;
          }
          :scope > .lt-skills-inline .learn-fun-skill > span.min-w-0 > span.block {
            display: inline;
            margin: 0;
          }
          :scope > .lt-skills-inline .learn-fun-skill span.font-bold {
            font-size: 0.875rem;
          }
          :scope > .lt-skills-inline h2 {
            font-size: 1.2rem;
          }
          :scope > .lt-skills-inline .border-dashed {
            padding: 0.75rem 0.85rem;
          }
        }
      `}</style>'''

# Avoid f-string brace corruption: assemble with replace
params = (
    'data-impeccable-params=\''
    '[{"id":"density","kind":"range","min":0,"max":1,"step":0.05,"default":0.65,"label":"Density"}]\''
)

parts = []
parts.append(
    '    <div data-impeccable-variants="56569b99" data-impeccable-variant-count="3" style={{ display: "contents" }}>'
)
parts.append("      {/* impeccable-variants-start 56569b99 */}")
parts.append("      {/* Original */}")
parts.append('      <div data-impeccable-variant="original">')
parts.append(original)
parts.append("      </div>")
parts.append("      {/* Variants: insert below this line */}")
parts.append(style)
parts.append(f'      <div data-impeccable-variant="1" {params}>')
parts.append(shell("lt-skills-snug"))
parts.append("      </div>")
parts.append('      <div data-impeccable-variant="2" style={{ display: "none" }}>')
parts.append(shell("lt-skills-tiles"))
parts.append("      </div>")
parts.append('      <div data-impeccable-variant="3" style={{ display: "none" }}>')
parts.append(shell("lt-skills-inline"))
parts.append("      </div>")
parts.append("      {/* impeccable-variants-end 56569b99 */}")
parts.append("    </div>")

block = "\n".join(parts)
new_src = src[:start] + block + src[end:]
path.write_text(new_src, encoding="utf-8")
print("ok", path)
