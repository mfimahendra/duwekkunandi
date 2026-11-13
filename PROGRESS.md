# Progress: Monitoring Keuangan (Next.js + Google Sheets)

Dokumen ini merangkum kondisi project saat ini, untuk melanjutkan pengembangan dan proses deploy.

## Tujuan

Aplikasi monitoring keuangan pribadi:

- Data transaksi berasal dari Google Sheets (sheet "Transaksi"), diekspos lewat endpoint Google Apps Script berbentuk JSON.
- Aplikasi Next.js hanya membaca endpoint tersebut dan menampilkan datanya.
- Responsif untuk mobile, memakai Tailwind CSS dengan gaya komponen shadcn/ui.
- Login dengan PIN untuk pemilik (satu user).
- Hosting di Firebase App Hosting.

## Stack

- Next.js 16.4.6 (App Router, Turbopack, Cache Components aktif)
- React 19.3, TypeScript, Tailwind CSS 4
- clsx, tailwind-merge (helper `cn`)
- ESLint (config Next.js)

Firebase Admin SDK sudah dihapus dari project.

## Status

| Item | Status |
|---|---|
| Scaffold Next.js | Selesai |
| Login PIN (cookie sesi httpOnly, proxy proteksi halaman) | Selesai |
| Sumber data Google Sheets via Apps Script | Selesai (kode), belum diuji dengan endpoint asli |
| Hapus ketergantungan `firebase-admin` | Selesai |
| Dashboard (ringkasan + kategori teratas + riwayat transaksi) | Selesai |
| Tampilan responsif (kartu di mobile, tabel di desktop) | Selesai |
| `npm run build` | Lolos |
| `npm run lint` | Gagal, lihat catatan di bawah |
| Deploy ke Firebase App Hosting | Belum dilakukan |
| Secret App Hosting (`APP_PIN`, `APP_SECRET`, `SHEET_API_KEY`) | Belum dibuat |

## Struktur file penting

```
apphosting.yaml                      Konfigurasi runtime dan secret App Hosting (perlu diperbarui)
.env.example                         Template env (tanpa nilai asli)
.env.local                           Env lokal (di-ignore git, berisi PIN, secret, dan URL sheet)
src/proxy.ts                         Proteksi: redirect ke /login jika belum login
src/lib/auth.ts                      Cek PIN, buat dan verifikasi token sesi (HMAC)
src/lib/transactions.ts              Fetch JSON dari Apps Script, cache 1 jam (tag `transaksi`), urut terbaru
src/lib/types.ts                     Tipe Transaction
src/lib/utils.ts                     Helper cn()
src/app/actions/sync.ts              Server action syncTransaksi (updateTag)
src/components/sync-button.tsx       Tombol Sync manual
docs/GUIDE.md                        Panduan arsitektur, deploy, cache, dan troubleshooting
src/app/actions/auth.ts              Server actions: loginAction, logoutAction
src/app/login/page.tsx               Halaman login
src/app/page.tsx                     Dashboard (Suspense + async server component)
src/app/layout.tsx                   Root layout, lang id, metadata
src/app/globals.css                  Tailwind + variabel warna terang
src/components/login-form.tsx        Form PIN (client, useActionState)
src/components/transaction-list.tsx  Daftar transaksi responsif + helper format rupiah
src/components/ui/button.tsx         Komponen Button (gaya shadcn)
src/components/ui/card.tsx           Komponen Card (gaya shadcn)
src/components/ui/input.tsx          Komponen Input (gaya shadcn)
```

## Konfigurasi

Variabel environment (`.env.local` untuk lokal, App Hosting untuk deploy):

| Nama | Keterangan |
|---|---|
| `SHEET_API_URL` | URL Web App Google Apps Script yang mengembalikan JSON transaksi |
| `SHEET_API_KEY` | Key yang dicek Apps Script. Di-encode dan dikirim sebagai query `?key=`. Di App Hosting berupa secret. |
| `APP_PIN` | PIN login. Wajib diganti dari nilai default. Di App Hosting berupa secret. |
| `APP_SECRET` | Kunci penandatangan token sesi. Acak dan panjang. Di App Hosting berupa secret. |

Fetch dilakukan dengan `cache: "no-store"`, jadi data selalu terbaru saat halaman dibuka.

## Asumsi data

Endpoint Apps Script harus mengembalikan array JSON dengan field berikut. Mapping dan parsing ada di `src/lib/transactions.ts`.

| Kolom sheet | Field JSON | Tipe |
|---|---|---|
| Tanggal | `tanggal` | string, disarankan `yyyy-mm-dd` |
| Jam | `jam` | string, `HH:mm` |
| Bank | `bank` | string |
| Jenis | `jenis` | string |
| Penerima/Penyedia | `penerima_penyedia` | string |
| Nominal | `nominal` | number |
| Biaya | `biaya` | number |
| Total | `total` | number (jika kosong dihitung `nominal + biaya`) |
| Kategori | `kategori` | string |
| Rekening | `rekening` | string |
| No Referensi | `no_referensi` | string |
| Keterangan | `keterangan` | string |

Catatan:
- Angka bisa juga berupa string, parser membuang karakter non-digit (aman untuk IDR tanpa desimal).
- Urutan riwayat memakai `Date.parse("tanggal jam")`. Format `dd/mm/yyyy` mungkin tidak terbaca dan akan jatuh ke urutan 0. Sebaiknya Apps Script mengirim `yyyy-mm-dd`.
- Jika endpoint mengembalikan objek `{ "error": "..." }`, halaman menampilkan error tersebut.

## Keamanan

- Key endpoint Apps Script hanya dipakai di server (Server Component), tidak dikirim ke browser.
- Cookie sesi: httpOnly, sameSite lax, secure di production, berlaku 30 hari.
- Perbandingan PIN dan token memakai `timingSafeEqual` dengan hash SHA-256.
- Belum ada pembatasan percobaan PIN (rate limiting). Gunakan PIN minimal 6 digit.
- Key service account Firebase lama pernah tampil di percakapan. Sebaiknya dirotasi di Firebase Console (Project settings, Service accounts), lalu file JSON-nya dihapus dari project.
- `npm audit` melaporkan 8 kerentanan moderat (belum ditangani).

## Catatan kode yang perlu dibereskan

- `npm run lint` gagal di `src/dataconnect-admin-generated/index.cjs.js` (`require()` dilarang). Folder ini dibuat oleh tooling Firebase Data Connect, bukan kode aplikasi.
- Folder `dataconnect/` dan `src/dataconnect-admin-generated/` masih ada dan belum di-commit. Keduanya tidak dipakai aplikasi. Putuskan apakah dihapus atau di-ignore.
- `apphosting.yaml` masih berisi `FIRESTORE_COLLECTION`, yang sudah tidak dipakai. Perlu diganti dengan `SHEET_API_URL` dan `SHEET_API_KEY` (secret).

## Cara menjalankan lokal

```powershell
cd d:\projects\duwekkunandi
npm install
npm run dev
```

Isi `SHEET_API_URL` dan `SHEET_API_KEY` di `.env.local`, lalu buka `http://localhost:3000` dan masukkan `APP_PIN`.

## Langkah berikutnya

1. Pastikan Apps Script membuka endpoint JSON (doGet) yang mengecek `key` dan mengembalikan array transaksi dengan nama field di atas.
2. Isi `SHEET_API_URL` dan `SHEET_API_KEY` di `.env.local`, lalu cek dashboard di `npm run dev`.
3. Perbaiki lint: putuskan nasib folder `src/dataconnect-admin-generated/` dan `dataconnect/`.
4. Ganti `APP_PIN` di `.env.local` dengan PIN final.
5. Perbarui `apphosting.yaml`: hapus `FIRESTORE_COLLECTION`, tambahkan `SHEET_API_URL` dan `SHEET_API_KEY` (secret).
6. Deploy ke App Hosting:
   - Install CLI: `npm i -g firebase-tools`, lalu `firebase login`.
   - Buat secret: `firebase apphosting:secrets:set APP_PIN`, `APP_SECRET`, dan `SHEET_API_KEY`.
   - Push project ke repo GitHub, lalu connect lewat Firebase Console (App Hosting, Create backend).
7. Verifikasi URL App Hosting: login, dashboard, dan tampilan mobile.
8. Opsional: rate limiting PIN, filter bulan, dan grafik.
