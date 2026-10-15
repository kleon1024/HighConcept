"""Run CosyVoice-300M-Instruct (FunAudioLLM, Apache-2.0) over a list of jobs. This runs inside CosyVoice's own Python
environment; music/voice.py calls it through a subprocess, so the rest of the pipeline stays in the system Python.
  python cosy_tts.py jobs.json
jobs.json: [{"text": …, "instruct": …, "spk": "中文男", "seed": 1, "speed": 1.0, "out": "/abs/path.wav"}, …]
Jobs whose output already exists are skipped. Env: COSYVOICE_DIR = a clone of github.com/FunAudioLLM/CosyVoice (with
third_party/Matcha-TTS) holding pretrained_models/CosyVoice-300M-Instruct from huggingface.co/FunAudioLLM. The
speech tokenizer (speech_tokenizer_v1.onnx) is only needed for voice cloning and can be left out."""
import json, os, sys

C = os.environ['COSYVOICE_DIR']
sys.path[:0] = [C, C + '/third_party/Matcha-TTS'] + [p for p in os.environ.get('COSYVOICE_STUBS', '').split(':') if p]
import torch, torchaudio

jobs = [j for j in json.load(open(sys.argv[1], encoding='utf-8')) if not os.path.exists(j['out'])]
if jobs:
    torch.set_num_threads(os.cpu_count() or 4)
    from cosyvoice.cli.cosyvoice import CosyVoice
    cv = CosyVoice(C + '/pretrained_models/CosyVoice-300M-Instruct')
    for j in jobs:
        torch.manual_seed(j.get('seed', 1))
        gen = cv.inference_instruct(j['text'], j.get('spk', '中文男'), j['instruct'], stream=False, speed=j.get('speed', 1.0), text_frontend=True)
        w = torch.cat([o['tts_speech'] for o in gen], 1)
        torchaudio.save(j['out'], w, cv.sample_rate)
        print('done', round(w.shape[1] / cv.sample_rate, 2), j['text'], flush=True)
