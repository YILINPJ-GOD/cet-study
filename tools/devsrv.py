# -*- coding: utf-8 -*-
import http.server, socketserver, functools, os
os.chdir(r'D:\六级APP')

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, format, *args):
        pass  # 静默

httpd = socketserver.TCPServer(('127.0.0.1', 8765), H)
print('SERVING')
httpd.serve_forever()
