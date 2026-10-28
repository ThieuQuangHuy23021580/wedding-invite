import re, sys
sys.stdout.reconfigure(encoding='utf-8')

p = 'index.html'
t = open(p, encoding='utf-8').read()
orig_len = len(t)

# 1) remove the decorative image block that sits below the button (w-xyw65oel)
dec = '<div id="w-xyw65oel" class="com-image-block p-absolute"><div class="full-width full-height"><div class="image-block-css p-relative full-width full-height full-mask-size mask-position"><div class="image-background p-absolute lazy" role="img" aria-label=""></div><div class="image-gradient-border"></div></div></div></div>'
assert t.count(dec) == 1, t.count(dec)
t = t.replace(dec, '')

# 2) remove the whole "Thank You!" section that follows the RSVP section
m = re.search(r'<div id="w-mfenqcev" class="com-section".*?(?=<div id="w-__popup_default__")', t, re.S)
assert m, 'mfenqcev section not found'
removed = m.group(0)
t = t[:m.start()] + t[m.end():]
print('removed section len:', len(removed))

open(p, 'w', encoding='utf-8', newline='').write(t)
print('index.html', orig_len, '->', len(t))

for mm in re.finditer(r'<div id="(w-[A-Za-z0-9_]+)" class="com-section"', t):
    print('  section:', mm.group(1))
