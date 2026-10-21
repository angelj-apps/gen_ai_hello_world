from pathlib import Path

p = Path(r"c:\Users\kasum\fall2026\gen_ui\hw1\src\app\practice\page.tsx")
src = p.read_text(encoding="utf-8")
start = src.index('          <div data-impeccable-carbonize="bf8a22c3"')
end = src.index("          </div>\n        </header>", start) + len("          </div>")
replacement = """          <p className="sr-only">
            Short challenges from skills you already unlocked — stack points
            when you solve them.
          </p>"""
src = src[:start] + replacement + src[end:]
p.write_text(src, encoding="utf-8")
print("ok")
