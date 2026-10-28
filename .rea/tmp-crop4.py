from PIL import Image

im = Image.open('.rea/full-page.png').convert('RGB')
W, H = im.size
print('full', im.size)

# story section css top 2053 -> px 4106, height 658 -> 1316
top, h = 4106, 1316
sec = im.crop((0, top, 840, top + h))
sec.resize((420, 658), Image.LANCZOS).save('.rea/story-sec.png')

# Also the vuquy (thanh hon) section for reference
sec2 = im.crop((0, 3024 * 2, 840, 3024 * 2 + 542 * 2)).resize((420, 542), Image.LANCZOS)
sec2.save('.rea/vuquy-sec.png')
print('ok')
