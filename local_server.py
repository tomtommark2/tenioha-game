import http.server
import socketserver
import mimetypes
import os

PORT = 8000

# Force correct MIME types
mimetypes.init()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('text/html', '.html')

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Allow CORS for local testing if needed
        self.send_header('Access-Control-Allow-Origin', '*')
        # DISABLE CACHING: Force browser to always fetch fresh files
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    # Optional: explicitly override for .js if registry is totally broken
    def guess_type(self, path):
        if path.endswith('.js'):
            return 'application/javascript'
        return super().guess_type(path)

print(f"Starting server at http://localhost:{PORT}")
print("Serving .js files as application/javascript")

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.shutdown()
