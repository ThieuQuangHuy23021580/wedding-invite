from PIL import Image
import statistics

src = Image.open('assets/img/cdn-1.webp').convert('RGB')
W, H = src.size
print('cdn-1', src.size)

# row brightness profile (sampled)
prof = []
for y in range(0, H, 32):
    row = [src.getpixel((x, y)) for x in range(0, W, 16)]
    b = sum(sum(p) / 3 for p in row) / len(row)
    prof.append((y, round(b, 1)))

for y, b in prof:
    bar = '#' * int(b / 6)
    print(f'{y:5d} {b:6.1f} {bar}')

# corner colours
print('corners', src.getpixel((0, 0)), src.getpixel((W - 1, 0)), src.getpixel((0, H - 1)), src.getpixel((W - 1, H - 1)))
print('centre', src.getpixel((W // 2, H // 2)))
