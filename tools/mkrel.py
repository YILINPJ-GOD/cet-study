# -*- coding: utf-8 -*-
import subprocess, os
os.chdir(r'D:\六级APP')
gh = r'C:\Program Files\GitHub CLI\gh.exe'
env = dict(os.environ)
env['PATH'] = r'C:\Program Files\Git\cmd;' + env.get('PATH', '')
notes = "六级难度全面对标: 仔细阅读重写(380-400词/长难句/目的题/引申题), 六级听力语篇密度提升, 选词填空框架升级, 写作范文校准, 翻译参考译文升级"
r = subprocess.run([gh, 'release', 'create', 'v1.8.0', '--title', 'v1.8.0 CET-6 Difficulty Alignment', '--notes', notes], capture_output=True, text=True, env=env)
print(r.stdout.strip())
print(r.stderr.strip()[:300])
