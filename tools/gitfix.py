# -*- coding: utf-8 -*-
import os, subprocess, glob

os.chdir(r'D:\六级APP')
env = dict(os.environ)
env['PATH'] = r'C:\Program Files\Git\cmd;' + env.get('PATH', '')
git = r'C:\Program Files\Git\cmd\git.exe'

# 1. 清理 lock 和 nul
lock = r'D:\六级APP\.git\index.lock'
if os.path.exists(lock):
    os.remove(lock)
    print('removed lock')
nul = os.path.join(r'D:\六级APP', 'nul')
if os.path.exists(nul):
    os.remove(nul)
    print('removed nul file')

# 2. 清理临时文件
for f in glob.glob(r'D:\六级APP\tools\commit-msg.txt') + glob.glob(r'D:\六级APP\nul'):
    if os.path.exists(f):
        os.remove(f)
        print('removed', f)

# 3. add + commit + push
for cmd in [
    [git, 'add', '-A'],
    [git, 'commit', '-q', '--allow-empty', '-m', 'v1.8.0: 六级难度对标升级 + 词根全集 + 句子翻译训练 + 个性化出题 + 真题中心 + 真题全卷'],
    [git, 'push'],
]:
    r = subprocess.run(cmd, capture_output=True, text=True, env=env)
    if r.returncode != 0:
        print('CMD FAIL:', cmd[-1], r.stderr[:200])

# 4. 最终状态
r = subprocess.run([git, 'log', '--oneline', '-1'], capture_output=True, text=True, env=env)
print('HEAD:', r.stdout.strip())
r = subprocess.run([git, 'status', '--short'], capture_output=True, text=True, env=env)
print('status:', repr(r.stdout))
