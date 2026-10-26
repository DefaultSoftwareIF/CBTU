# Gera ícones PLACEHOLDER (quadrado azul-escuro com círculo claro). Substituir pela identidade visual real.
import struct, zlib, sys, pathlib

def png(size, path):
    bg, fg = (38, 57, 74), (233, 120, 63)
    c, r = size / 2, size * 0.28
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            inside = (x - c) ** 2 + (y - c) ** 2 <= r * r
            row += bytes(fg if inside else bg)
        rows.append(bytes(row))
    raw = b"".join(rows)
    def chunk(t, d):
        body = t + d
        return struct.pack(">I", len(d)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)) \
        + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    pathlib.Path(path).write_bytes(data)

out = pathlib.Path(sys.argv[1])
png(192, out / "icon-192.png")
png(512, out / "icon-512.png")
