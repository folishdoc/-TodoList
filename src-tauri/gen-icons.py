import struct, zlib, os

icons_dir = os.path.dirname(__file__) or 'icons'
os.makedirs(icons_dir, exist_ok=True)

def create_png(width, height, filename):
    raw = b''
    for y in range(height):
        raw += b'\x00'
        for x in range(width):
            r = int(100 + (x/width) * 60)
            g = int(80 + (y/height) * 50)
            b_val = int(200 + ((width-x)/width) * 55)
            raw += struct.pack('BBBB', r, g, b_val, 255)

    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', zlib.compress(raw))
    png += chunk(b'IEND', b'')

    with open(os.path.join(icons_dir, filename), 'wb') as f:
        f.write(png)
    print(f'Created {filename} ({width}x{height})')

create_png(32, 32, '32x32.png')
create_png(128, 128, '128x128.png')
create_png(256, 256, '128x128@2x.png')
create_png(256, 256, 'icon.png')
print('Done')
