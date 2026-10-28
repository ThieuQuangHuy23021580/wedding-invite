import re, sys, io, shutil
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

shutil.copyfile('index.html', '.rea/backup-index-before-footer-remove.html')
shutil.copyfile('css/layout.css', '.rea/backup-layout-before-footer-remove.css')

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

sp = find_el(h, 'w-p28mg8b4')
assert sp, 'w-p28mg8b4 not found'
print('removing w-p28mg8b4 span %d..%d (len=%d)' % (sp[0], sp[1], sp[1] - sp[0]))
h = h[:sp[0]] + h[sp[1]:]

open('index.html', 'w', encoding='utf-8', newline='').write(h)
print('index.html written:', len(h), 'bytes')
print('remaining refs:', {k: h.count(k) for k in ['w-p28mg8b4', 'w-7k369oaw', 'w-g9k9tyu9', 'w-x79op7cq', 'w-n40l3van', 'w-4sh6orob']})
