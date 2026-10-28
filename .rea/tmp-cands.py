from PIL import Image, ImageDraw

src = Image.open('assets/img/DMI_1426.webp').convert('RGB')
W, H = src.size          # 4716 x 7074
print('source', src.size)

BANNER_W, BANNER_H = 420, 280          # css px
SCALE = 2.5                            # export at 2.5x for retina
band_h = int(W / (BANNER_W / BANNER_H))  # source band height to cover the banner box
print('band height', band_h, '=', round(band_h / H * 100, 1), '% of source')

# candidates: fraction of the source height where the band starts
cands = {
    'a': 0.10,
    'b': 0.16,
    'c': 0.22,
    'd': 0.28,
}
sheet = Image.new('RGB', (4 * 210 + 10, 150 + 24), 'white')
d = ImageDraw.Draw(sheet)
for i, (k, f) in enumerate(cands.items()):
    top = int(H * f)
    crop = src.crop((0, top, W, top + band_h)).resize((BANNER_W, BANNER_H), Image.LANCZOS)
    crop = crop.resize((200, 133), Image.LANCZOS)
    sheet.paste(crop, (i * 210 + 5, 20))
    d.text((i * 210 + 5, 4), f'{k}: top={f:.0%} y={top}', fill='black')
sheet.save('.rea/cand.jpg', quality=85, optimize=True)
print('saved .rea/cand.jpg')
