# Laporan final — Turbin Arus Laut 60 Detik

## Hasil

- Branch pengembangan: `codex/tidal-turbine-60s`
- Komposisi Remotion: `TidalTurbineExplainer60`
- Video final: `out/tidal-turbine-60/tidal-turbine-explainer-60s.mp4`
- Implementasi: `src/videos/tidal-turbine/TidalTurbineExplainer60.tsx`
- Storyboard: `src/videos/tidal-turbine/STORYBOARD_60S.md`
- Contact sheet final: `out/tidal-turbine-60/final-contact-sheet.jpg`
- QA final: `out/tidal-turbine-60/qa/final-video-only/report.md`
- Preview adegan: `out/tidal-turbine-60/previews/scene-1.mp4` sampai `scene-6.mp4`

Prototipe awal tetap tersedia di `out/tidal-turbine/tidal-turbine-preview.mp4` dan komposisi `TidalTurbinePrototype`.

## Verifikasi final

- Codec: H.264
- Resolusi: 540×960
- Frame rate: 30/1 FPS
- Jumlah frame: 1.800
- Durasi: 60,000 detik
- Ukuran file: 24.595.139 byte
- SHA-256: `00d85d9f4e7ff5ad730dd76b582cd57bfd4ba4eca859727531ab4918630c1701`
- Audio: tidak ada stream audio
- Black frame: tidak ditemukan
- White flash: tidak ditemukan
- Frozen span ≥12 frame: tidak ditemukan
- Lonjakan frame tidak terencana: tidak ditemukan
- Frame dengan perbedaan gerak <0,3: 0 dari 1.800
- TypeScript `tsc --noEmit`: lulus
- `git diff --check`: lulus

## Cakupan ilmiah

Enam adegan membedakan arus air, rotor, poros, generator, kabel bawah laut, dan pengondisian daya. Generator digambarkan mengubah putaran mekanik menjadi listrik; kabinet pengondisian daya di daratan ditampilkan sebagai tahap terpisah sebelum jaringan.

## Perbaikan selama QA

Render pertama menunjukkan lonjakan pada frame 1.581 karena kamera melewati bidang permukaan air transparan. Bidang tersebut dinaikkan di atas seluruh lintasan kamera. Still frame 1.579–1.583 diperiksa ulang, video dirender ulang, dan QA final tidak lagi menemukan lonjakan. Render bermasalah disimpan sebagai `out/tidal-turbine-60/tidal-turbine-explainer-60s-first-pass.mp4` hanya untuk jejak audit.

## Masalah tersisa

Tidak ada masalah render yang belum selesai. Video sengaja tidak memiliki musik, efek suara, atau voice-over karena tidak ada aset atau metode audio yang diminta.

## Perintah reproduksi

```bash
env REMOTION_TMP=/workspace/scratch/remotion-tmp npm run render -- \
  --composition TidalTurbineExplainer60 \
  --output out/tidal-turbine-60/tidal-turbine-explainer-60s-with-silent-track.mp4 \
  --frames=0-1799 --scale=1 --log=error

ffmpeg -i out/tidal-turbine-60/tidal-turbine-explainer-60s-with-silent-track.mp4 \
  -map 0:v:0 -c:v copy -an -movflags +faststart \
  out/tidal-turbine-60/tidal-turbine-explainer-60s.mp4
```
