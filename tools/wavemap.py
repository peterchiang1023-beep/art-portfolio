"""Ripple displacement map (PNG): concentric rings pushing outward, fading to neutral grey.
R = horizontal push, G = vertical push, 128 = no movement."""
import math, struct, sys, zlib
N = 256
rows = []
for y in range(N):
    row = bytearray([0])
    for x in range(N):
        dx, dy = x + .5 - N/2, y + .5 - N/2
        r = math.hypot(dx, dy) / (N/2)
        if r < 1 and r > 0:
            disp = math.sin(r * math.pi * 2.5) * (1 - r) ** 1.6
            ux, uy = dx / (r * N/2), dy / (r * N/2)
            R = 128 + 122 * disp * ux
            G = 128 + 122 * disp * uy
        else:
            R = G = 128
        row += bytes([max(0, min(255, round(R))), max(0, min(255, round(G))), 128])
    rows.append(bytes(row))
def chunk(t, b): return struct.pack('>I', len(b)) + t + b + struct.pack('>I', zlib.crc32(t + b) & 0xffffffff)
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', N, N, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b''.join(rows), 9)) + chunk(b'IEND', b'')
open(sys.argv[1], 'wb').write(png); print(len(png), 'bytes')
