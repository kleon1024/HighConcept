"""List presets (name, bank, program) and per-instrument key ranges of an SF2 file."""
import struct, sys
def chunks(b, off, end):
    while off < end:
        cid, size = b[off:off+4], struct.unpack('<I', b[off+4:off+8])[0]
        yield cid, off + 8, size
        off += 8 + size + (size & 1)
def main(path):
    b = open(path, 'rb').read()
    for cid, o, s in chunks(b, 12, len(b)):
        if cid == b'LIST' and b[o:o+4] == b'pdta':
            for c2, o2, s2 in chunks(b, o + 4, o + s):
                if c2 == b'phdr':
                    for i in range(s2 // 38 - 1):
                        name, prog, bank = struct.unpack('<20sHH', b[o2+i*38:o2+i*38+24])
                        print('preset', name.split(b'\0')[0].decode('latin1'), 'bank', bank, 'prog', prog)
                if c2 == b'inst':
                    names = [b[o2+i*22:o2+i*22+20].split(b'\0')[0].decode('latin1') for i in range(s2 // 22 - 1)]
                    print('instruments', len(names), names[:40])
for p in sys.argv[1:]: print('==', p); main(p)
