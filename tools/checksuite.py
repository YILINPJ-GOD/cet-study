# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()
print('T.add total:', t.count('T.add('))
print('RV cases:', t.count("T.add('RV-"))
print('has RV-01:', "RV-01" in t)
print('has RV-02:', "RV-02" in t)
print('has RV-03:', "RV-03" in t)
