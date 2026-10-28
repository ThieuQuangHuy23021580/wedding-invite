import json, base64, io
from PIL import Image
import glob, os

logs = sorted(glob.glob(r'C:\Users\Admin\.cursor\browser-logs\cdp-response-Page.captureScreenshot-*.json'))
log = logs[-1]
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

b64 = find_data(d)
raw = base64.b64decode(b64)
im = Image.open(io.BytesIO(raw)).convert('RGB')
print('full page', im.size)
im.save('.rea/full-page.png')
im.resize((max(1, im.width // 5), max(1, im.height // 5)), Image.LANCZOS).save('.rea/full-page-small.jpg', quality=85)
print('saved .rea/full-page-small.jpg', Image.open('.rea/full-page-small.jpg').size)
