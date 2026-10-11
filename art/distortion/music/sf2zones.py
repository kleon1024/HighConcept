"""Print instrument zones of an SF2: key range, velocity range -> sample name (to learn a drum kit's key map)."""
import struct, sys
from collections import defaultdict
b = open(sys.argv[1], 'rb').read()
def chunks(off, end):
    while off < end:
        cid, size = b[off:off+4], struct.unpack('<I', b[off+4:off+8])[0]; yield cid, off + 8, size; off += 8 + size + (size & 1)
pd = {}
for cid, o, s in chunks(12, len(b)):
    if cid == b'LIST' and b[o:o+4] == b'pdta':
        for c2, o2, s2 in chunks(o + 4, o + s): pd[c2.decode()] = (o2, s2)
o, s = pd['inst']; inst = [(b[o+i*22:o+i*22+20].split(b'\0')[0].decode('latin1'), struct.unpack('<H', b[o+i*22+20:o+i*22+22])[0]) for i in range(s // 22)]
o, s = pd['ibag']; ibag = [struct.unpack('<HH', b[o+i*4:o+i*4+4])[0] for i in range(s // 4)]
o, s = pd['igen']; igen = [struct.unpack('<HH', b[o+i*4:o+i*4+4]) for i in range(s // 4)]
o, s = pd['shdr']; shdr = [b[o+i*46:o+i*46+20].split(b'\0')[0].decode('latin1') for i in range(s // 46)]
keys = defaultdict(set)
for ii in range(len(inst) - 1):
    for bi in range(inst[ii][1], inst[ii + 1][1]):
        kr = None; smp = None
        for gi in range(ibag[bi], ibag[bi + 1]):
            op, amt = igen[gi]
            if op == 43: kr = (amt & 255, amt >> 8)
            if op == 53: smp = shdr[amt]
        if kr and smp:
            for k in range(kr[0], kr[1] + 1): keys[k].add(smp.rsplit('-', 1)[0] if '-' in smp else smp[:14])
for k in sorted(keys): print(k, sorted(keys[k])[:4])
