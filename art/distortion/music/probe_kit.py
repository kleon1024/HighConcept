import mido, subprocess, numpy as np, soundfile as sf, sys, os, tempfile
sf2 = sys.argv[1]; lo, hi = int(sys.argv[2]), int(sys.argv[3])
mid = mido.MidiFile(ticks_per_beat=480); tr = mido.MidiTrack(); mid.tracks.append(tr)
tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(60), time=0)); tr.append(mido.Message('program_change', channel=0, program=0, time=0))
for k in range(lo, hi + 1):
    tr.append(mido.Message('note_on', channel=0, note=k, velocity=110, time=0)); tr.append(mido.Message('note_off', channel=0, note=k, velocity=0, time=480))
d = tempfile.mkdtemp(); mid.save(d + '/p.mid')
subprocess.run(['fluidsynth', '-ni', '-q', '-r', '48000', '-F', d + '/p.wav', sf2, d + '/p.mid'], check=True)
x, sr = sf.read(d + '/p.wav'); m = x.mean(1)
for i, k in enumerate(range(lo, hi + 1)):
    seg = m[i * sr:(i + 1) * sr]; rms = np.sqrt(np.mean(seg ** 2)) + 1e-12
    if rms < 1e-5: print(k, '-'); continue
    sp = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))); f = np.fft.rfftfreq(len(seg), 1 / sr)
    cent = (sp * f).sum() / sp.sum(); dec = np.argmax(np.cumsum(seg ** 2) > 0.9 * np.sum(seg ** 2)) / sr
    print(k, f'rms {20*np.log10(rms):6.1f} dB  centroid {cent:6.0f} Hz  t90 {dec:.2f}s')
