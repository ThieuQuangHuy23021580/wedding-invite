from PIL import Image
import math

im = Image.open('.rea/full-page.png').convert('RGB')
W, H = im.size
print('full', im.size)

secs = [
    ('hero', 0, 713),
    ('vuquy', 712, 1517),
    ('thanhhon', 1516, 2058),
    ('story', 2053, 2711),
    ('rsvp', 2714, 3275),
    ('thanks', 3274, 3672),
]

# sample a thin strip at the very left edge (x 0..14) which is free of content
for name, a, b in secs:
    y0, y1 = a * 2 + 6, b * 2 - 6
    strip = im.crop((0, y0, 14, y1))
    px = list(strip.getdata())
    avg = tuple(round(sum(p[i] for p in px) / len(px)) for i in range(3))
    print(f'{name:10s} css {a}-{b}  edge-strip avg RGB = {avg}')
