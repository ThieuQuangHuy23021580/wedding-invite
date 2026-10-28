from PIL import Image

im = Image.open('.rea/full-page.png').convert('RGB')

# Story section: css top 2053 -> px 4106, height 658 css
sec = im.crop((0, 4106, 840, 4106 + 1316))
sec.crop((0, 0, 840, 400)).save('.rea/s_top.png')       # top 200 css px
sec.crop((0, 0, 840, 1316)).resize((560, 877), Image.LANCZOS).save('.rea/s_all.png')
print('ok')
