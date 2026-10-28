from PIL import Image

im = Image.open('.rea/full-page.png').convert('RGB')
print('full', im.size)

crops = {
    'crop-vuquy.png':   (0, 1400, 840, 3080),
    'crop-thanhhon.png': (0, 3000, 840, 4160),
    'crop-story.png':   (0, 4050, 840, 5500),
}
for name, box in crops.items():
    im.crop(box).save('.rea/' + name)
    print(name, box)
