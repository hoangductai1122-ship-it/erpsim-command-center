"""
ERPsim Reverse-Engineering Command Center — Local Web Server & CORS-Free SAP OData Proxy
Run: python server.py
Opens: http://localhost:8050
"""

import base64
import json
import os
import urllib.request
import urllib.error
from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = 8050
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))


class ERPsimRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WORKSPACE_DIR, **kwargs)

    def do_POST(self):
        if self.path == '/api/odata-proxy':
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length).decode('utf-8')
            try:
                payload = json.loads(raw_body)
                target_url = payload.get('url', '').strip()
                user = payload.get('user', '').strip()
                password = payload.get('pass', '')

                req = urllib.request.Request(target_url)
                req.add_header('Accept', 'application/json')
                if user:
                    credentials = f"{user}:{password}".encode('utf-8')
                    b64_auth = base64.b64encode(credentials).decode('ascii')
                    req.add_header('Authorization', f"Basic {b64_auth}")

                with urllib.request.urlopen(req, timeout=10) as response:
                    body = response.read().decode('utf-8', errors='replace')
                    self._send_json(200, {
                        'ok': True,
                        'bytes': len(body),
                        'raw': body[:50000]
                    })
            except Exception as exc:
                self._send_json(400, {
                    'ok': False,
                    'error': str(exc)
                })
        else:
            self._send_json(404, {'ok': False, 'error': 'Unknown endpoint'})

    def _send_json(self, status_code, data):
        encoded = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


if __name__ == '__main__':
    print(f"============================================================")
    print(f" ERPsim Reverse-Engineering Command Center is running at:")
    print(f" -> http://localhost:{PORT}")
    print(f"============================================================")
    server = HTTPServer(('0.0.0.0', PORT), ERPsimRequestHandler)
    server.serve_forever()
