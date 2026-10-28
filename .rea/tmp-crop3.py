from PIL import Image

im = Image.open('.rea/full-page.png').convert('RGB')
# story section starts at css 2053 -> px 4106
im.crop((0, 4106, 840, 4460)).resize((700, 295), Image.LANCZOS).save('.rea/story-top.jpg', quality=90)
print('ok')
