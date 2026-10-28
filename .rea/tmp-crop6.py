from PIL import Image

im = Image.open('.rea/full-page.png').convert('RGB')
sec = im.crop((0, 4106, 840, 4106 + 700))   # top 350 css px of story section
sec.save('.rea/story-top-raw.png')
print(sec.size)
