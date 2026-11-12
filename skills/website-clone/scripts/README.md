# Clone scripts — riset & verifikasi untuk proyek clone

Skrip read-only untuk mempelajari situs referensi dan membandingkan hasil buatanmu berdampingan.
Semua path & URL diatur di **satu file**: `clone.config.json`. Tidak ada yang di-hardcode.

## Setup di proyek baru
```bash
# 1. salin folder ini ke proyek baru (mis. ke ./clone-kit) lalu:
cd clone-kit
npm install                                  # memasang playwright-core (memakai Chrome/Edge yang sudah ada)
cp clone.config.example.json clone.config.json
# 2. edit clone.config.json (lihat tabel di bawah)
```
Butuh: Node 18+, Chrome atau Edge terpasang, Python + Pillow (`pip install pillow`) untuk skrip `.py`.
Di **Git Bash (Windows)** jalankan dulu `export MSYS_NO_PATHCONV=1`, kalau tidak argumen `/` diubah jadi path Windows.

## clone.config.json
| Kunci | Isi | Contoh |
|---|---|---|
| `reference` | URL situs referensi (tanpa `/` di akhir) | `"https://example.com"` |
| `local` | build-mu: dev server atau folder statis | `"http://localhost:4321"` / `"file:///C:/proyek/site"` |
| `pages` | path yang dikunjungi | `["/", "/about", "/contact"]` |
| `localPaths` | (opsional) path lokal kalau beda dari referensi | `{ "/": "/index.html", "/about": "/about.html" }` |
| `viewports` | ukuran layar | `[[1440, 900], [390, 844]]` |
| `out` | folder hasil | `"clone-output"` |
| `settleMs` | tunggu setelah load (intro, font, WebGL) | `5000` |
| `cookieButton` | regex teks tombol cookie yang diklik | `"accept all|accept|agree"` |
| `browser` | (opsional) path Chrome/Edge; kosong = deteksi otomatis | `""` |

Override sementara tanpa edit file: `CLONE_REF`, `CLONE_LOCAL`, `CLONE_OUT`, `CLONE_BROWSER`, `CLONE_CONFIG`
(atau `--config path/ke/file.json`).

## Perintah
Semua skrip menerima `[path ...]` (default: `pages` dari config), `--vp 1440x900` (default: semua viewport),
dan `--target ref|local` (default `ref`).

| Perintah | Fungsi | Hasil |
|---|---|---|
| `node recon.mjs` | frame loading 7 dtk, full page, frame scroll, HTML ter-render, font, animasi, canvas/video, library JS | `out/recon/<target>/<halaman>-<lebar>/` |
| `node styles.mjs` | skala tipografi (computed style semua teks, dikelompokkan) + kotak section | `out/styles/<target>/*.json` + ringkasan di terminal |
| `node interact.mjs [--max 25]` | hover semua link/tombol, klik menu (catat URL tujuan), wheel/keys, menu mobile — **tidak pernah submit/beli/login** | `out/interact/<target>/<halaman>-<lebar>/` + `log.json` |
| `node shoot.mjs [--target both] [--reduced]` | screenshot identik referensi & build-mu (top + full page) | `out/shots/{ref,local}/` |
| `node audit.mjs` | cek build-mu: error JS, request gagal, link & gambar rusak, overflow horizontal | terminal (exit 1 kalau ada masalah) |
| `python side.py A.png B.png prefix [tinggi]` | gabung dua full page berdampingan per potongan | `prefix-0.png`, `prefix-1.png`, … |
| `python montage.py out.png a.png b.png …` | grid beberapa frame (mis. urutan loading) | `out.png` |
| `python slice.py full.png prefix [tinggi]` | potong full page jadi beberapa gambar | `prefix-0.png`, … |

## Alur yang disarankan (sesuai SKILL.md)
1. `recon` → `styles` → `interact` di referensi → tulis `docs/RESEARCH.md`.
2. Bangun halaman → `shoot --target both` → `side.py` → perbaiki selisih → ulangi.
3. `audit` sebelum serah terima.

Gunakan dengan sopan: skrip berjalan berurutan dengan jeda, hanya membaca, dan tidak mengirim data ke situs referensi.
