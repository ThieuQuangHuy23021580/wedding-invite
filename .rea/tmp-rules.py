import re, sys
sys.stdout.reconfigure(encoding='utf-8')

s = open('css/layout.css', encoding='utf-8').read()

def rules_for(prefix):
    out = []
    for m in re.finditer(r'([^{}]*' + prefix + r'[^{}]*)\{([^{}]*)\}', s):
        out.append((m.group(1).strip(), m.group(2)))
    return out

for pfx in ['w-p12kr6sz', 'w-7yd1h6bp', 'w-ltrcre3k', 'w-gbw7ef4x', 'w-97eo26nr', 'w-0vnq5hek',
            'w-9umqqm48', 'w-chfcbzl0', 'w-rlhwoq3c', 'w-8hcsxt23', 'w-3soo5lv0', 'w-j9icc6ry', 'w-ogzoxw2f',
            'w-1dcdn9zn']:
    print('########', pfx)
    for sel, body in rules_for(pfx):
        print('  ', sel, '{', body[:400], '}')
    print()
