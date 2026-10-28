from PIL import Image, ImageDraw

src = Image.open('assets/img/DMI_1426.jpg').convert('RGB')
W, H = src.size                      # 4716 x 7074
BAN_W, BAN_H = 420, 280              # css px
band = int(W / (BAN_W / BAN_H))      # 3144

cands = {'a': 0.06, 'b': 0.12, 'c': 0.18, 'd': 0.24}
sheet = Image.new('RGB', (4 * 220 + 10, 175), 'white')
d = ImageDraw.Draw(sheet)
for i, (k, f) in enumerate(cands.items()):
    top = int(H * f)
    crop = src.crop((0, top, W, top + band)).resize((BAN_W, BAN_H), Image.LANCZOS)
    crop = crop.resize((210, 140), Image.LANCZOS)
    sheet.paste(crop, (i * 220 + 8, 28))
    d.text((i * 220 + 8, 8), f'{k}  top={f:.0%}  y={top}px', fill='black')
sheet.save('.rea/cand2.jpg', quality=86, optimize=True)
print('band', band, 'sheet saved')
