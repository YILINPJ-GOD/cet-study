# -*- coding: utf-8 -*-
import os, subprocess

os.chdir(r'D:\六级APP')
env = dict(os.environ)
env['PATH'] = r'C:\Program Files\Git\cmd;' + env.get('PATH', '')
git = r'C:\Program Files\Git\cmd\git.exe'

# 1. 清理 lock
lock = r'D:\六级APP\.git\index.lock'
if os.path.exists(lock):
    os.remove(lock)
    print('removed lock')

# 2. nul 文件是 Windows 保留名，用 git 排除而非删除
with open(r'D:\六级APP\.gitignore', 'a', encoding='utf-8') as fh:
    fh.write('\nnul\n')
    fh.close()

# 3. add + commit + push
for cmd in [
    [git, 'add', '-A'],
    [git, 'commit', '-q', '--allow-empty', '-m', 'v1.8.0: 六级难度对标升级 + 词根全集 + 句子翻译训练 + 个性化出题 + 真题中心 + 真题全卷'],
    [git, 'push'],
]:
    r = subprocess.run(cmd, capture_output=True, text=True, env=env)
    if r.returncode != 0:
        print('CMD FAIL:', cmd[-1], (r.stderr or '')[:300])

# 4. 最终状态
r = subprocess.run([git, 'log', '--oneline', '-1'], capture_output=True, text=True, env=env)
print('HEAD:', r.stdout.strip())
r = subprocess.run([git, 'status', '--short'], capture_output=True, text=True, env=env)
print('status:', repr(r.stdout))
