import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

p = 'css/layout.css'
s = open(p, encoding='utf-8').read()

def rep(old, new, expect=2):
    global s
    n = s.count(old)
    assert n == expect, 'count %d (expected %d): %s' % (n, expect, old[:70])
    s = s.replace(old, new)
    print('  OK x%d  %s' % (n, old[:76]))

# The footer row sat at top:393.5px and was 35px tall; the section is 440px.
# Remove it and shrink the section to the remaining content.
rep('#w-mfenqcev{top:0px;left:0px;position:relative;width:420px;height:440px;}',
    '#w-mfenqcev{top:0px;left:0px;position:relative;width:420px;height:398px;}')

# Drop the CSS rules for the removed footer group.
pat = re.compile(
    r'#w-p28mg8b4\{[^}]*\}'
    r'#w-7k369oaw\{[^}]*\}'
    r'#w-7k369oaw \.rectangle-css\{[^}]*\}'
    r'#w-g9k9tyu9\{[^}]*\}'
    r'#w-g9k9tyu9 \.text-block\{[^}]*\}'
    r'#w-g9k9tyu9 \.text-block-css\{[^}]*\}'
    r'#w-x79op7cq\{[^}]*\}'
    r'#w-x79op7cq \.rectangle-css\{[^}]*\}'
    r'#w-n40l3van\{[^}]*\}'
    r'#w-n40l3van \.rectangle-css\{[^}]*\}'
    r'#w-4sh6orob\{[^}]*\}'
    r'#w-4sh6orob \.rectangle-css\{[^}]*\}'
)
found = list(pat.finditer(s))
print('footer rule chunks matched:', len(found))
assert found, 'no footer rule chunk matched'
for m in found:
    print('  removing len=%d' % (m.end() - m.start()))
s = pat.sub('', s)

open(p, 'w', encoding='utf-8', newline='').write(s)
print('layout.css written:', len(s), 'bytes')
for k in ['w-p28mg8b4', 'w-7k369oaw', 'w-g9k9tyu9', 'w-x79op7cq', 'w-n40l3van', 'w-4sh6orob']:
    print('  %-14s refs=%d' % (k, s.count(k)))
