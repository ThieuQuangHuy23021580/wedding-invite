import re, sys
sys.stdout.reconfigure(encoding='utf-8')

s = open('css/layout.css', encoding='utf-8').read()
lines = s.split('\n')
print('lines:', len(lines))
for i, l in enumerate(lines, 1):
    print(i, len(l), repr(l[:90]))
