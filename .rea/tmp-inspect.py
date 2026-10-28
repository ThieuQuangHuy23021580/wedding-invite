import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

h = open('index.html', encoding='utf-8').read()

def find_el(html, el_id):
    m = re.search(r'<div id="%s"(?![a-z0-9-])' % re.escape(el_id), html)
    if not m:
        return None
    start = m.start()
    depth = 0
    for t in re.finditer(r'<div\b|</div>', html[start:]):
        if t.group(0) == '</div>':
            depth -= 1
            if depth == 0:
                return (start, start + t.end())
        else:
            depth += 1
    return None

for sid in ['w-mfenqcev', 'w-p28mg8b4', 'w-g9k9tyu9']:
    sp = find_el(h, sid)
    print('===', sid, 'span', sp, '===')
    print(h[sp[0]:sp[1]])
    print()
