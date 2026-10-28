import sys
sys.stdout.reconfigure(encoding='utf-8')
lines = open('css/layout.css', encoding='utf-8').read().split('\n')
for i in range(41, 48):
    print(i + 1, repr(lines[i][:200]))
print('...')
for i in range(99, len(lines)):
    print(i + 1, repr(lines[i][:200]))
