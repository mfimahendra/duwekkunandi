# Progress: Monitoring Keuangan (Next.js + Firebase)

Dokumen ini merangkum kondisi project saat ini, untuk melanjutkan integrasi Firebase dan proses deploy.

## Tujuan

Aplikasi monitoring keuangan pribadi:

- Data berasal dari Google Apps Script yang membaca email secara otomatis dan menulis ke Firestore.
- Aplikasi Next.js hanya membaca data dari Firestore dan menampilkannya.
- Responsif untuk mobile, memakai Tailwind CSS dengan gaya komponen shadcn/ui.
- Login dengan PIN untuk pemilik (satu user).
- Hosting di Firebase App Hosting.

## Stack

- Next.js 16.4.6 (App Router, Turbopack, Cache Components aktif)
- React 19.3, TypeScript, Tailwind CSS 4
- firebase-admin (akses Firestore dari server saja)
- clsx, tailwind-merge (helper `cn`)
- ESLint (config Next.js)

## Status

| Item | Status |
|---|---|
| Scaffold Next.js | Selesai |
| Login PIN (cookie sesi httpOnly, proxy proteksi halaman) | Selesai |
| Koneksi Firebase Admin ke Firestore | Selesai, terverifikasi (collection `transaksi` ada dan kosong) |
| Dashboard (ringkasan + kategori teratas + riwayat transaksi) | Selesai |
| Tampilan responsif (kartu di mobile, tabel di desktop) | Selesai |
| `npm run build` | Lolos |
| `npm run lint` | Lolos |
| Data transaksi di Firestore | Belum ada (menunggu Apps Script) |
| Deploy ke Firebase App Hosting | Belum dilakukan |
| Secret App Hosting (`APP_PIN`, `APP_SECRET`) | Belum dibuat |

## Struktur file penting

```
apphosting.yaml                  Konfigurasi runtime dan secret untuk App Hosting
.env.example                     Template env (tidak berisi nilai asli)
.env.local                       Env lokal (di-ignore git, berisi PIN dan secret)
src/proxy.ts                     Proteksi: redirect ke /login jika belum login
src/lib/auth.ts                  Cek PIN, buat dan verifikasi token sesi (HMAC)
src/lib/firebase.ts              Inisialisasi firebase-admin (Application Default Credentials)
src/lib/transactions.ts          Baca koleksi Firestore, mapping field ke tipe Transaction
src/lib/utils.ts                 Helper cn()
src/app/actions/auth.ts          Server actions: loginAction, logoutAction
src/app/login/page.tsx           Halaman login
src/app/page.tsx                 Dashboard (Suspense + async server component)
src/app/layout.tsx               Root layout, lang id, metadata
src/app/globals.css              Tailwind + variabel warna terang
src/components/login-form.tsx    Form PIN (client, useActionState)
src/components/transaction-list.tsx  Daftar transaksi responsif + helper format rupiah
src/components/ui/button.tsx     Komponen Button (gaya shadcn)
src/components/ui/card.tsx       Komponen Card (gaya shadcn)
src/components/ui/input.tsx      Komponen Input (gaya shadcn)
```

## Konfigurasi

Variabel environment (`.env.local` untuk lokal, `apphosting.yaml` untuk deploy):

| Nama | Keterangan |
|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path file service account JSON (hanya lokal). Di App Hosting tidak perlu. |
| `FIREBASE_PROJECT_ID` | `duwekkunandi` |
| `FIRESTORE_COLLECTION` | Nama collection, default `transaksi` |
| `APP_PIN` | PIN login. Wajib diganti dari nilai default. Di App Hosting berupa secret. |
| `APP_SECRET` | Kunci penandatangan token sesi. Acak dan panjang. Di App Hosting berupa secret. |

Project ID dan `client_email` service account diambil dari file JSON yang ada di root project. File ini sudah di-ignore git lewat pola `*firebase-adminsdk*.json`. Jangan di-commit dan jangan dipakai di kode client.

## Asumsi data (perlu dicocokkan dengan Apps Script)

Dokumen Firestore diharapkan memakai field berikut. Mapping ada di `src/lib/transactions.ts`.

| Kolom spreadsheet | Field Firestore | Tipe |
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
- Urutan riwayat memakai `Date.parse("tanggal jam")`. Format `dd/mm/yyyy` mungkin tidak terbaca dan akan jatuh ke urutan 0.
- Query saat ini mengambil maksimal 1000 dokumen tanpa paginasi.

## Keamanan

- Firestore diakses hanya dari server memakai Admin SDK, jadi aturan keamanan Firestore tidak dipakai untuk aplikasi ini. Biarkan aturan default (tolak akses publik).
- Cookie sesi: httpOnly, sameSite lax, secure di production, berlaku 30 hari.
- Perbandingan PIN dan token memakai `timingSafeEqual` dengan hash SHA-256.
- Belum ada pembatasan percobaan PIN (rate limiting). Gunakan PIN minimal 6 digit.
- Key service account pernah tampil di percakapan. Disarankan rotasi key di Firebase Console (Project settings, Service accounts).
- `npm audit` melaporkan 8 kerentanan moderat (belum ditangani).

## Cara menjalankan lokal

```powershell
cd d:\projects\duwekkunandi
npm install
npm run dev
```

Buka `http://localhost:3000`, lalu masukkan `APP_PIN`.

## Langkah berikutnya

1. Pastikan Apps Script menulis ke collection `transaksi` dengan nama field di atas. Kirim satu contoh dokumen dari Firestore untuk mencocokkan mapping jika berbeda.
2. Isi data uji di Firestore dan cek dashboard di `npm run dev`.
3. Ganti `APP_PIN` di `.env.local` dengan PIN final.
4. Deploy ke App Hosting:
   - Install CLI: `npm i -g firebase-tools`, lalu `firebase login`.
   - Buat secret: `firebase apphosting:secrets:set APP_PIN` dan `firebase apphosting:secrets:set APP_SECRET`.
   - Push project ke repo GitHub. App Hosting men-deploy dari repo, jadi perlu di-connect lewat Firebase Console (App Hosting, Create backend).
   - Pastikan service account runtime App Hosting punya akses Firestore (role seperti Cloud Datastore User). Jika belum, tambahkan di IAM.
5. Verifikasi URL App Hosting: login, dashboard, dan tampilan mobile.
6. Opsional: tambahkan rate limiting PIN, paginasi, filter bulan, dan grafik.
