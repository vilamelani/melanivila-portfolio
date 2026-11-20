#!/usr/bin/env python3
"""
Servidor estático de desarrollo con soporte de HTTP Range.

Hace falta porque `python -m http.server` NO implementa byte ranges: sin eso
el navegador marca los <video> como no-buscables (`seekable.end === 0`) y cada
asignación de `currentTime` se ignora en silencio — el scroll-scrubbing queda
congelado en el primer fotograma. Cualquier hosting estático real (Netlify,
Vercel, GitHub Pages, nginx) ya soporta rangos; esto sólo empareja el entorno
local con producción.

Uso:  python serve.py [puerto]     (por defecto 5173)
"""

import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
ROOT = os.path.dirname(os.path.abspath(__file__))
CHUNK = 64 * 1024


class RangeHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def do_GET(self):
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)

        if not rng or not os.path.isfile(path):
            return super().do_GET()

        m = re.match(r"bytes=(\d*)-(\d*)\s*$", rng.strip())
        if not m:
            return super().do_GET()

        size = os.path.getsize(path)
        first, last = m.group(1), m.group(2)

        if first == "":                       # sufijo: bytes=-N (últimos N)
            if last == "":
                return super().do_GET()
            start = max(0, size - int(last))
            end = size - 1
        else:
            start = int(first)
            end = int(last) if last else size - 1

        if start >= size:
            self.send_response(416)
            self.send_header("Content-Range", "bytes */%d" % size)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        end = min(end, size - 1)
        length = end - start + 1

        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.send_header("Content-Length", str(length))
        self.end_headers()

        with open(path, "rb") as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                data = f.read(min(CHUNK, remaining))
                if not data:
                    break
                try:
                    self.wfile.write(data)
                except (BrokenPipeError, ConnectionResetError):
                    return        # el navegador abortó el seek: normal
                remaining -= len(data)

    def log_message(self, fmt, *args):
        if "404" in (fmt % args):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    os.chdir(ROOT)
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), RangeHandler)
    srv.daemon_threads = True
    print("Sirviendo %s en http://localhost:%d  (Range: on)" % (ROOT, PORT))
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
