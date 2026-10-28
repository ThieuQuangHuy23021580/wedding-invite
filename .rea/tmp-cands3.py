from PIL import Image

src = Image.open('assets/img/DMI_1426.webp').convert('RGB')
W, H = src.size                                  # 4716 x 7074
BAN_W, BAN_H = 420, 280                          # css px
EXPORT = 2                                      # 2x for retina
band = int(W / (BAN_W / BAN_H))                  # 3144 source px

for name, f in [('a', 0.08), ('b', 0.14)]:
    top = int(H * f)
    crop = src.crop((0, top, W, top + band)).resize((BAN_W * EXPORT, BAN_H * EXPORT), Image.LANCZOS)
    crop.save(f'.rea/ban2-{name}.jpg', quality=90, optimize=True)
    print(name, 'top', top, crop.size)
