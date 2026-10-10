# -*- coding: utf-8 -*-
import os, subprocess
os.chdir(r'D:\六级APP')
env = dict(os.environ)
env['PATH'] = r'C:\Program Files\Git\cmd;' + env.get('PATH', '')
git = r'C:\Program Files\Git\cmd\git.exe'
for cmd in [[git, 'add', '-A'], [git, 'commit', '-q', '--allow-empty', '-m', 'v1.8.1: 回忆式复习模式（看词自评/翻面确认）+ 六级难度对标全部内容升级'], [git, 'push']]:
    r = subprocess.run(cmd, capture_output=True, text=True, env=env)
    if r.returncode != 0:
        print('FAIL:', (r.stderr or '')[:200])
print('push done')
r = subprocess.run([git, 'log', '--oneline', '-3'], capture_output=True, text=True, env=env)
print(r.stdout)
