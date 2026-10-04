# Draws the app icon (a dumbbell on a dark tile with an accent glow) as PNGs, no dependencies.
import zlib, struct, math, sys

def png(path, size):
    S = size
    def color(x, y):
        u, v = x / S, y / S
        # background: dark with a soft accent radial glow
        d = math.hypot(u - 0.5, v - 0.42)
        g = max(0.0, 1 - d / 0.65)
        bg = (int(15 + 40 * g * g), int(17 + 20 * g * g), int(21 + 8 * g * g))
        # dumbbell, centred, slightly tilted
        a = math.radians(-30)
        cx, cy = u - 0.5, v - 0.5
        X = cx * math.cos(a) - cy * math.sin(a)
        Y = cx * math.sin(a) + cy * math.cos(a)
        acc = (255, 107, 53)
        def rrect(px, py, hw, hh, r):
            qx, qy = abs(X - px) - hw + r, abs(Y - py) - hh + r
            return math.hypot(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0) - r
        shapes = [rrect(0, 0, 0.20, 0.035, 0.03),
                  rrect(-0.20, 0, 0.045, 0.16, 0.03), rrect(0.20, 0, 0.045, 0.16, 0.03),
                  rrect(-0.29, 0, 0.035, 0.11, 0.025), rrect(0.29, 0, 0.035, 0.11, 0.025)]
        sd = min(shapes)
        t = max(0.0, min(1.0, 0.5 - sd * S))  # anti-aliased coverage
        return tuple(int(bg[i] * (1 - t) + acc[i] * t) for i in range(3))
    raw = b''.join(b'\x00' + b''.join(bytes(color(x + .5, y + .5)) for x in range(S)) for y in range(S))
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', S, S, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

for s in (180, 192, 512):
    png(f'icons/icon-{s}.png', s)
print('icons written')
