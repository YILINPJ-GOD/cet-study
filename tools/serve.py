# -*- coding: utf-8 -*-
"""开发服务器：带 no-cache 头，避免浏览器启发式缓存导致旧脚本"""
import http.server
import socketserver

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("127.0.0.1", 8765), H) as httpd:
        httpd.serve_forever()
