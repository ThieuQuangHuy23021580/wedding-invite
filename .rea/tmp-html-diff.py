import subprocess, re, difflib

def get(rev, path):
    return subprocess.check_output(['git', 'show', f'{rev}:{path}'], text=True, encoding='utf-8')

for rev in ['6285038', '359f36c', '4a5f87a']:
    t = get(rev, 'index.html')
    print('=====', rev, 'len', len(t))
    # print section divs start
    for m in re.finditer(r'<div id="(w-[A-Za-z0-9_]+)" class="com-section"[^>]*>', t):
        print('   ', m.group(1), m.start())

print()
print('--- diff 6285038 -> HEAD for index.html (normalized by lines) ---')
a = get('6285038', 'index.html').split('\n')
b = get('HEAD', 'index.html').split('\n')
for line in difflib.unified_diff(a, b, lineterm='', n=0):
    if len(line) > 400:
        line = line[:400] + ' ...TRUNC'
    print(line)
