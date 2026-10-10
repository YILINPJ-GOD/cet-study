# -*- coding: utf-8 -*-
import os, subprocess, io, re
os.chdir(r'D:\六级APP')
env = dict(os.environ)
env['PATH'] = r'C:\Program Files\Git\cmd;' + env.get('PATH', '')
git = r'C:\Program Files\Git\cmd\git.exe'
r = subprocess.run([git, 'checkout', '--', 'tools/e2e-suite.js'], capture_output=True, text=True, env=env)
print('checkout:', r.returncode)
t = io.open(r'D:\六级APP\tools\e2e-suite.js', encoding='utf-8').read()
print('T.add:', len(re.findall(r'T\.add\(', t)))
print('brace:', t.count('{') - t.count('}'))
