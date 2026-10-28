import re, subprocess

def show(rev):
    try:
        t = subprocess.check_output(['git', 'show', f'{rev}:css/layout.css'], text=True, encoding='utf-8')
    except Exception as e:
        print(rev, 'ERR', e); return
    print('=====', rev)
    # find rules like #w-xxx{top:0px;left:0px;position:relative;width:420px;height:NNNpx;}
    for m in re.finditer(r'#w-([A-Za-z0-9_]+)\{top:0px;left:0px;position:relative;width:(\d+)px;height:(\d+)px;\}', t):
        print('  SECTION', m.group(1), 'w=', m.group(2), 'h=', m.group(3))

for rev in ['6285038', 'HEAD']:
    show(rev)
