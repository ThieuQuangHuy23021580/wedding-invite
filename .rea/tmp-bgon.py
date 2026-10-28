import json, base64, io, glob
from PIL import Image

log = sorted(glob.glob(r'C:\Users\Admin\.cursor\browser-logs\cdp-response-Page.captureScreenshot-*.json'))[-1]
print('log', log)
d = json.load(open(log, encoding='utf-8'))

def find_data(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == 'data' and isinstance(v, str) and len(v) > 1000:
                return v
            r = find_data(v)
            if r:
                return r
    elif isinstance(o, list):
        for v in o:
            r = find_data(v)
            if r:
                return r
    return None

raw = base64.b64decode(find_data(d))
im = Image.open(io.BytesIO(raw)).convert('RGB')
print('size', im.size)
im.save('.rea/bg-only.png')

src = Image.open('assets/img/cdn-1.webp').convert('RGB')
SW, SH = src.size
sheet = Image.new('RGB', (6 * 150 + 10, 300), 'white')
for i, (name, a, h) in enumerate([('hero', 0, 713), ('vuquy', 712, 805), ('thanhhon', 1516, 542),
                                  ('story', 2057, 658), ('rsvp', 2714, 561), ('thanks', 3274, 398)]):
    c = im.crop((0, a * 2, 840, (a + h) * 2)).resize((140, int(140 * h / 420)), Image.LANCZOS)
    sheet.paste(c, (i * 150 + 8, 10))
sheet.save('.rea/bg-strip.jpg', quality=88, optimize=True)
print('saved .rea/bg-strip.jpg')
