import re, sys
sys.stdout.reconfigure(encoding='utf-8')
s = open('css/layout.css', encoding='utf-8').read()
for m in re.finditer(r'#w-qnmbfkxc[^{}]*\{[^}]*\}', s):
    print(repr(m.group(0)))
print('---- mfenqcev ----')
for m in re.finditer(r'#w-mfenqcev[^{}]*\{[^}]*\}', s):
    print(repr(m.group(0)))
print('---- xyw65oel ----')
for m in re.finditer(r'#w-xyw65oel[^{}]*\{[^}]*\}', s):
    print(repr(m.group(0)))
