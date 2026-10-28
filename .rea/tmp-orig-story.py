import re, sys
sys.stdout.reconfigure(encoding='utf-8')

t = open('.rea/orig/all-styles.css', encoding='utf-8', errors='replace').read()

for pfx in ['w-p12kr6sz', 'w-8rs6r7nn', 'w-uwtv09ot', 'w-gbw7ef4x', 'w-7yd1h6bp', 'w-ltrcre3k',
            'w-97eo26nr', 'w-9e669brq', 'w-7s3z11g9', 'w-4q35z857', 'w-0vnq5hek']:
    print('########', pfx)
    seen = set()
    for m in re.finditer(r'([^{}]*' + pfx + r'[^{}]*)\{([^{}]*)\}', t):
        key = (m.group(1).strip(), m.group(2)[:120])
        if key in seen:
            continue
        seen.add(key)
        print('  ', m.group(1).strip(), '{', m.group(2)[:400], '}')
    print()
