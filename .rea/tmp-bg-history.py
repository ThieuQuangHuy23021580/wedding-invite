import re, subprocess, sys

def sections(text):
    out = {}
    for m in re.finditer(r'#w-[A-Za-z0-9_]+ \.section-background\{[^}]*\}', text):
        out.setdefault(m.group(0).split(' ')[0], []).append(m.group(0))
    return out

for rev in ['6285038', '359f36c', '4a5f87a', 'HEAD']:
    try:
        t = subprocess.check_output(['git', 'show', f'{rev}:css/layout.css'], text=True, encoding='utf-8')
    except Exception as e:
        print(rev, 'ERR', e); continue
    print('=====', rev)
    # section heights
    for m in re.finditer(r'#w-([A-Za-z0-9_]+)\{top:0px;left:0px;position:relative;width:420px;height:(\d+)px;\}', t):
        pass
    secs = re.findall(r'#w-([A-Za-z0-9_]+)\{[^}]*height:(\d+)px;[^}]*\}', t)
    print('heights:', secs[:20])
    for m in re.finditer(r'#w-([A-Za-z0-9_]+) \.section-background\{([^}]*)\}', t):
        print('  BG', m.group(1), '=>', m.group(2)[:160])
