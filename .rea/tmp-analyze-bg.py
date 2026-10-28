import re

s = open('css/layout.css', encoding='utf-8').read()
print('len', len(s))
for m in re.finditer(r'#w-[A-Za-z0-9_]+ \.section-background\{[^}]*\}', s):
    print(m.group(0)[:400])
    print('---')
