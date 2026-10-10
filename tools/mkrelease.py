# -*- coding: utf-8 -*-
import subprocess, json
env = dict(os.environ)
env['PATH'] = r'C:\Program Files\Git\cmd;' + env.get('PATH', '')
gh = r'C:\Program Files\GitHub CLI\gh.exe'
notes = """# 四六级智学 v1.8.0 · 六级难度全面对标

## 🆕 本版核心改进

- 📖 **仔细阅读全面重写**：三篇全部升级至真六级难度（380-400词、平均句长20-24词/句、学术语域），新增目的题与引申题
- 🎧 **六级听力语篇密度提升**：全部6套的英文句子升级至学术语域（复合句、正式词汇、抽象论证）
- 🧪 **选词填空生成框架升级**：12个复杂句式框架对标六级语篇（含让步从句、被动结构、定语从句等）
- ✍️ **写作范文升级**：w2 新增 Only by 倒装句 + which 定语从句
- 📖 **翻译参考译文升级**：t4 加定语从句、t6 加非限制性从句、t2/t7/t9 加结构标记

## 📦 下载使用

下载 Assets 中的 ZIP → 解压 → 双击 index.html。纯离线运行。
"""
r = subprocess.run([gh, 'release', 'create', 'v1.8.0', '--title', 'v1.8.0 · 六级难度全面对标', '--notes', notes], capture_output=True, text=True, env=env)
print(r.stdout.strip())
print(r.stderr.strip()[:200] if r.returncode else 'OK')
