import json, base64, io, glob
from PIL import Image

log = sorted(glob.glob(r'C:\Users\Admin\.cursor\browser-logs\cdp-response-Page.captureScreenshot-*.json'))[-1]
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

im = Image.open(io.BytesIO(base64.b64decode(find_data(d)))).convert('RGB')
W, H = im.size
print('capture', im.size)
# viewport was 828 css wide -> pageview 420 css centred; dpr 2
x0 = (W - 420 * 2) // 2
print('x0', x0)

secs = [('hero', 0, 713), ('vuquy', 712, 805), ('thanhhon', 1516, 542),
        ('story', 2057, 658), ('rsvp', 2714, 561), ('thanks', 3274, 398)]

sheet = Image.new('RGB', (6 * 145 + 10, 300), 'white')
for i, (name, a, h) in enumerate(secs):
    c = im.crop((x0, a * 2, x0 + 420 * 2, (a + h) * 2)).resize((135, int(135 * h / 420)), Image.LANCZOS)
    sheet.paste(c, (i * 145 + 8, 10))
sheet.save('.rea/bg-strip2.jpg', quality=88, optimize=True)
print('saved')
