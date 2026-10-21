from pathlib import Path

tsx = Path(r"c:\Users\kasum\fall2026\gen_ui\hw1\src\components\AttemptFirstLearn.tsx")
css = Path(r"c:\Users\kasum\fall2026\gen_ui\hw1\src\app\globals.css")
src = tsx.read_text(encoding="utf-8")

ret = src.index("  return (")
end = src.index("\n  );\n}", ret) + 1  # points at newline before );
# Find the shell div content
shell_open = src.index(
    '<div className="learn-fun-shell flex flex-col gap-6 lt-skills-tiles">',
    ret,
)
# content starts after this opening tag
inner_start = src.index(">", shell_open) + 1
# matching close: the shell closes before </div></div></div> at end
# Structure:
# carbonize > variant > shell > ...content... </div></div></div>
# Find last three closing divs before );
close_region = src.rindex("        </div>\n      </div>\n    </div>\n  );", ret)
shell_close = close_region  # "        </div>" is shell close
inner = src[inner_start:shell_close].rstrip("\n")

# Dedent inner by 2 spaces if it was nested deeper
lines = inner.split("\n")
dedented = []
for line in lines:
    if line.startswith("          "):
        dedented.append(line[2:])
    elif line.startswith("        ") and not line.startswith("        <"):
        dedented.append(line[2:] if line.startswith("          ") else line)
    else:
        # try strip 2 spaces from common nest
        if line.startswith("          "):
            dedented.append(line[2:])
        elif line.startswith("        "):
            dedented.append("    " + line[8:] if False else line[2:])
        else:
            dedented.append(line)

# Simpler: shell content should be indented with 6 spaces for children of return's div
# Current inner has 10 spaces for first-level children (was nested under variant)
# Target: 6 spaces for first-level inside shell

def reindent(text: str, from_base: int, to_base: int) -> str:
    out = []
    for line in text.split("\n"):
        if not line.strip():
            out.append("")
            continue
        # count leading spaces
        sp = len(line) - len(line.lstrip(" "))
        if sp >= from_base:
            line = (" " * (to_base + (sp - from_base))) + line.lstrip(" ")
        out.append(line)
    return "\n".join(out)

# Detect base indent of first non-empty line
first = next(l for l in inner.split("\n") if l.strip())
from_base = len(first) - len(first.lstrip(" "))
inner_clean = reindent(inner, from_base, 6)

new_return = (
    "  return (\n"
    '    <div className="learn-fun-shell learn-fun-shell--tiles flex flex-col gap-6">\n'
    + inner_clean
    + "\n    </div>\n"
)

new_src = src[:ret] + new_return + src[end:]
# fix: end pointed at newline before ); — we need to include `  );`
# Actually end = index of `\n  );` so src[end:] starts with `\n  );\n}`
# new_return already ends without `  );` - good if src[end:] is `\n  );\n}`

if not src[end:].startswith("\n  );"):
    # adjust
    end2 = src.index("  );\n}", ret)
    new_src = src[:ret] + new_return + "  );\n" + src[end2 + 5 :]

tsx.write_text(new_src, encoding="utf-8")

tiles_css = """
/* Compact two-column skill tiles (horizon pick) */
.learn-fun-shell--tiles {
  gap: 0.85rem;
  padding: 1.1rem 1.1rem 1.2rem;
}

.learn-fun-shell--tiles ul.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .learn-fun-shell--tiles ul.grid {
    grid-template-columns: 1fr 1fr;
  }
}

.learn-fun-shell--tiles .learn-fun-skill {
  padding: 0.55rem 0.75rem;
  height: 100%;
  align-items: flex-start;
  gap: 0.55rem;
}

.learn-fun-shell--tiles .learn-fun-skill > span:first-child {
  margin-top: 0.1rem;
  height: 1.75rem;
  width: 1.75rem;
  font-size: 0.65rem;
}

.learn-fun-shell--tiles h2 {
  font-size: 1.35rem;
}
"""

css_text = css.read_text(encoding="utf-8")
anchor = ".learn-fun-skill {"
if "learn-fun-shell--tiles" not in css_text:
    css_text = css_text.replace(anchor, tiles_css + "\n" + anchor, 1)
    css.write_text(css_text, encoding="utf-8")

print("carbonized")
