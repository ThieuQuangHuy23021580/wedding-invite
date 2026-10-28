import re, glob, os

files = sorted(glob.glob('.rea/orig/style-block-*.css')) + ['.rea/orig/all-styles.css']
for f in files:
    if not os.path.exists(f):
        continue
    t = open(f, encoding='utf-8', errors='replace').read()
    print('=====', f, len(t))
    for m in re.finditer(r'#w-([A-Za-z0-9_]+) \.section-background\{([^}]*)\}', t):
        print('  BG', m.group(1), '=>', m.group(2)[:200])
    for m in re.finditer(r'#w-([A-Za-z0-9_]+)\{top:0px;left:0px;position:relative;width:(\d+)px;height:(\d+)px;[^}]*\}', t):
        print('  SEC', m.group(1), m.group(2), m.group(3))
