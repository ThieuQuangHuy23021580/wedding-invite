import subprocess, re, sys, difflib
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def get(rev, path):
    return subprocess.check_output(['git', 'show', f'{rev}:{path}'], text=True, encoding='utf-8')

a = get('6285038', 'index.html')
b = get('HEAD', 'index.html')

# split into top-level section chunks
def sections(t):
    res = {}
    for m in re.finditer(r'<div id="(w-[A-Za-z0-9_]+)" class="com-section"[^>]*>(.*?)(?=<div id="w-[A-Za-z0-9_]+" class="com-section"|<div id="w-__popup_default__")', t, re.S):
        res[m.group(1)] = m.group(2)
    return res

sa, sb = sections(a), sections(b)
for k in sa:
    if k not in sb:
        print('REMOVED section', k); continue
    if sa[k] != sb[k]:
        print('CHANGED section', k, len(sa[k]), '->', len(sb[k]))
        # show image srcs
        ia = re.findall(r'src="(/assets/img/[^"]+)"', sa[k])
        ib = re.findall(r'src="(/assets/img/[^"]+)"', sb[k])
        print('   old imgs:', ia)
        print('   new imgs:', ib)
for k in sb:
    if k not in sa:
        print('ADDED section', k)
