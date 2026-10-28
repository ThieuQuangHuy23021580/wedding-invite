from PIL import Image

im = Image.open('.rea/full-page.png').convert('RGB')
# w-p12kr6sz: top 2053 css -> 4106 px (dpr2), height 658 css -> 1316 px
im.crop((0, 4020, 840, 5440)).resize((630, 1065), Image.LANCZOS).save('.rea/story-view.jpg', quality=88)
print('ok')
