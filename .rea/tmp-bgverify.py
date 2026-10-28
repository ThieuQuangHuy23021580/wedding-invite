from PIL import Image

im = Image.open('.rea/full-page.png').convert('RGB')
src = Image.open('assets/img/cdn-1.webp').convert('RGB')
SW, SH = src.size          # 640 x 1136

def cover(w, h):
    """replicate CSS background-size:cover for a 420xH box"""
    scale = max(w / SW, h / SH)
    nw, nh = round(SW * scale), round(SH * scale)
    r = src.resize((nw, nh), Image.LANCZOS)
    return r, (nw - w) // 2, (nh - h) // 2

secs = [('hero', 0, 713), ('vuquy', 712, 1517), ('thanhhon', 1516, 2058),
        ('story', 2053, 2711), ('rsvp', 2714, 3275)]

sheet = Image.new('RGB', (5 * 150 + 10, 300), 'white')
for i, (name, a, b) in enumerate(secs):
    h = b - a
    r, ox, oy = cover(420, h)
    # sample the middle of the expected render
    exp = r.crop((ox + 10, oy + h // 2, ox + 60, oy + h // 2 + 50))
    # same region from the real screenshot (2x)
    act = im.crop((20, (a + h // 2) * 2, 120, (a + h // 2) * 2 + 100)).resize((40, 50), Image.LANCZOS)
    diff = sum(abs(exp.getpixel((x, y))[c] - act.getpixel((x, y))[c]) for x in range(40) for y in range(50) for c in range(3)) / (40 * 50 * 3)
    print(f'{name:10s} h={h:4d}  mean |expected - actual| = {diff:6.2f}')
    sheet.paste(act.resize((120, 150), Image.LANCZOS), (i * 150 + 8, 10))
sheet.save('.rea/bgverify.jpg', quality=88, optimize=True)
