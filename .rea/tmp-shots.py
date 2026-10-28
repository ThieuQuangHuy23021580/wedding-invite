from PIL import Image
import os

src = Image.open('assets/img/cdn-1.webp').convert('RGB')
print('cdn-1 size', src.size)

shots = [
    r'c:\Users\Admin\AppData\Local\Temp\cursor\screenshots\page-2026-10-28T15-31-32-325Z.png',
    r'c:\Users\Admin\AppData\Local\Temp\cursor\screenshots\page-2026-10-28T15-32-27-548Z.png',
]
for p in shots:
    if not os.path.exists(p):
        print('missing', p); continue
    im = Image.open(p).convert('RGB')
    print(p.split('\\')[-1], im.size)
