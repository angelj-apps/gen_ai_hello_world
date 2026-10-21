from pathlib import Path

p = Path(r"c:\Users\kasum\fall2026\gen_ui\hw1\src\components\PracticeClient.tsx")
src = p.read_text(encoding="utf-8")
start = src.index('          <div data-impeccable-carbonize="deaba805"')
end = src.index("          </div>\n        </div>", start) + len("          </div>")
replacement = """          <p className="sr-only">
            Tap skills from your toolkit, then start a short challenge — earn a
            skillpoint when you get it right.
          </p>"""
src = src[:start] + replacement + src[end:]
p.write_text(src, encoding="utf-8")
print("ok")
