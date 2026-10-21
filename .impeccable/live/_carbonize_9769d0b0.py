from pathlib import Path

p = Path(r"c:\Users\kasum\fall2026\gen_ui\hw1\src\app\practice\page.tsx")
src = p.read_text(encoding="utf-8")
start = src.index('    <div data-impeccable-carbonize="9769d0b0"')
shell_start = src.index('        <div className="app-shell lt-practice-noscroll-lock">', start)
shell_tag_end = src.index(">", shell_start) + 1
new_open = '    <div className="app-shell app-shell--noscroll-practice">'
src = src[:start] + new_open + src[shell_tag_end:]
tail_marker = "        </div>\n      </div>\n    </div>\n  );"
idx = src.rindex(tail_marker)
src = src[:idx] + "    </div>\n  );" + src[idx + len(tail_marker):]
p.write_text(src, encoding="utf-8")
print("ok")
