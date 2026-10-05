# -*- coding: utf-8 -*-
import os, subprocess
env = dict(os.environ)
env['PATH'] = r'C:\Program Files\Git\cmd;' + env.get('PATH', '')
git = r'C:\Program Files\Git\cmd\git.exe'
os.chdir(r'D:\六级APP')

debug = ['tools/peek.py','tools/peek2.py','tools/peek3.py','tools/peek4.py','tools/peek5.py','tools/peek6.py',
         'tools/peek7.py','tools/dump_cloze.py','tools/fixurb.py','tools/fixroots.py','tools/dedup.py',
         'tools/findtors.py','tools/struct.py','tools/fixline.py','tools/fixregex.py','tools/fixds.py',
         'tools/checktag.py','tools/addtags.py','tools/mkinject.py','tools/bump.py','tools/patch_paras.py',
         'tools/careful.txt']
for f in debug:
    if os.path.exists(f):
        subprocess.run([git, 'rm', '-q', '-f', f], env=env)
# 本地临时/验证脚本不入库
with open('.gitignore', 'a', encoding='utf-8') as fh:
    fh.write('\n# 本地运维临时脚本\nghrefresh.txt\nghrel17.txt\nghst.txt\nvfy.txt\ntools/checkpages.py\ntools/pages.py\ntools/pages2.py\ntools/pages3.py\ntools/verify.py\ntools/__pycache__/\n')
subprocess.run([git, 'add', '-A'], env=env)
r = subprocess.run([git, 'commit', '-q', '-m', 'chore: 清理一次性调试脚本与本地临时文件'], env=env)
r2 = subprocess.run([git, 'push', '-q'], env=env)
print('cleanup committed & pushed:', r2.returncode == 0)
