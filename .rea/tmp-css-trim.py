import re, sys
sys.stdout.reconfigure(encoding='utf-8')

p = 'css/layout.css'
s = open(p, encoding='utf-8').read()
orig = len(s)

# 1) shrink the RSVP section: button bottom = 372.5 + 46 = 418.5  -> +16px breathing room
old_sec = '#w-qnmbfkxc{top:0px;left:0px;position:relative;width:420px;height:561px;}'
new_sec = '#w-qnmbfkxc{top:0px;left:0px;position:relative;width:420px;height:435px;}'
n = s.count(old_sec)
assert n == 2, n
s = s.replace(old_sec, new_sec)
print('rsvp section height 561 -> 435 (%d rules)' % n)

# 2) drop rules for the removed decorative image + removed Thank You section
removed_rules = 0
def drop(pattern):
    global s, removed_rules
    new_s, k = re.subn(pattern, '', s)
    s = new_s
    removed_rules += k
    return k

drop(r'#w-xyw65oel[^{}]*\{[^}]*\}')
drop(r'#w-mfenqcev[^{}]*\{[^}]*\}')
print('removed rules:', removed_rules)

open(p, 'w', encoding='utf-8', newline='').write(s)
print('layout.css', orig, '->', len(s))
