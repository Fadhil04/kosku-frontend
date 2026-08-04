# KosKu Dashboard — Frontend Sistem Manajemen Kos

**KosKu Dashboard** adalah aplikasi frontend berbasis web modern yang dirancang untuk mengelola properti kos-kosan secara profesional. Terintegrasi langsung dengan [KosKu API](https://github.com/Fadhil04/kosku-api), dashboard ini memfasilitasi komunikasi dan operasional harian antara pemilik kos (**Owner**) dan penghuni (**Tenant**).

Aplikasi ini dibangun menggunakan **React 19, Vite, TypeScript, Tailwind CSS, dan React Query (TanStack Query)** dengan desain antarmuka premium, responsif, dan dinamis.

---

## 🚀 Stack Teknologi

* **Library Utama:** React v19.2
* **Build Tool:** Vite v8.2
* **Bahasa:** TypeScript ~6.0
* **Styling & UI:** Tailwind CSS v3.4 + Custom UI Primitives (Badge, Button, Card, Dialog, Input, Select)
* **Koleksi Ikon:** Lucide React
* **Client HTTP:** Axios (dengan request & response interceptors)
* **Manajemen State Server:** React Query (TanStack Query) v5.101
* **Navigasi & Routing:** React Router DOM v7.18
* **Validasi & Form:** React Hook Form + Zod Schema Validation
* **Visualisasi Grafik (Laporan):** Recharts v3.10

---

## ✨ Fitur Utama (Berdasarkan Role)

### 👨‍💼 Fitur Pemilik Kos (Owner)
1. **Ringkasan Dashboard:** Menampilkan data okupansi kamar berjalan, statistik tagihan (terbayar vs belum dibayar), daftar keluhan terbuka, dan alarm kontrak sewa yang akan segera habis.
2. **Manajemen Properti (CRUD):** Tambah, ubah, dan hapus properti/gedung kos lengkap dengan detail fasilitas, alamat, deskripsi, dan galeri foto.
3. **Manajemen Kamar (State Machine Status):** Mengatur kamar di setiap properti beserta harganya. Status kamar otomatis berpindah berdasarkan aksi sistem: `AVAILABLE` ➔ `RESERVED` ➔ `OCCUPIED` ➔ `NEEDS_MAINTENANCE`.
4. **Database Tenant (Penghuni):** Registrasi akun tenant baru, pencatatan kontak darurat, serta berkas data identitas (KTP).
5. **Manajemen Kontrak Sewa:**
   * Membuat kontrak baru (secara otomatis mengubah status kamar ke `OCCUPIED` dan men-generate seluruh tagihan bulanan dalam transaksi database aman).
   * Terminasi kontrak sewa sebelum waktunya (disertai pengembalian/potongan uang deposit serta pembatalan otomatis tagihan masa depan).
   * Perpanjangan kontrak sewa secara instan.
6. **Kelola Tagihan & Pembayaran:**
   * Monitoring tagihan berjalan dan denda keterlambatan (*late fee*) yang dihitung secara real-time.
   * Catat pembayaran manual (cash, transfer bank, e-wallet) dengan integrasi *idempotency key*.
   * Memberikan diskon potongan harga atau penghapusan tagihan (*waived*).
7. **Pusat Pengaduan Keluhan (Complaints):** Memantau keluhan dari seluruh kamar, berdiskusi dua arah secara langsung melalui thread chat interaktif, dan mengganti status perbaikan keluhan.
8. **Visualisasi Laporan Keuangan:** Diagram interaktif Recharts untuk melihat tren omzet 6 bulan terakhir, persentase keterisian kamar, serta perilaku disiplin pembayaran tenant.
9. **Dev-Tools Admin:** Halaman kontrol untuk melakukan sinkronisasi database (*backfill*) serta memicu antrean jobs BullMQ (email reminder, trigger tagihan bulanan) secara manual.

### 👩‍🎓 Fitur Penghuni Kos (Tenant)
1. **Dashboard Tenant:** Memantau detail kamar aktif, nominal tagihan terdekat, dan pemberitahuan penting dari owner.
2. **Tagihan Saya:** List lengkap tagihan bulanan (yang sudah dibayar, kurang bayar, atau terlambat) beserta kalkulasi denda harian secara transparan.
3. **Pengaduan Keluhan:** Membuat keluhan perbaikan fasilitas kos disertai foto bukti kerusakan dan melacak respons penyelesaian dari owner.
4. **Pusat Diskusi Keluhan:** Thread komunikasi interaktif untuk berkirim pesan dengan owner mengenai tindak lanjut keluhan.
5. **Profil Tenant:** Memperbarui data diri, nomor HP, kontak darurat, serta mengganti kata sandi.

---

## 🛠️ Cara Menjalankan Project Secara Lokal

### Prasyarat
* Node.js versi 20 ke atas
* npm atau yarn
* Backend [KosKu API](https://github.com/Fadhil04/kosku-api) sudah berjalan (di port `3000` secara default)

### Langkah Setup

1. **Clone repositori:**
   ```bash
   git clone https://github.com/username/kosku-dashboard.git
   cd kosku-dashboard
   ```

2. **Install semua dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable:**
   Secara default, Vite akan membaca endpoint API dari file `.env`. Buat file `.env` di dalam folder `src/` (atau di root folder proyek):
   ```env
   VITE_API_URL=http://localhost:3000/api/v1
   ```

4. **Jalankan aplikasi mode development:**
   ```bash
   npm run dev
   ```
   Aplikasi dashboard akan berjalan di alamat: `http://localhost:5173`. Buka alamat tersebut di browser Anda.

5. **Build untuk Production:**
   Untuk mengompilasi kode TypeScript dan membundle aset produksi:
   ```bash
   npm run build
   ```
   Hasil build akan disimpan di folder `dist/`.

---

## ⚙️ Detail Implementasi Utama

### 🔐 Rolling JWT & Auto-Refresh Interceptor
Untuk meningkatkan keamanan tanpa mengorbankan kenyamanan pengguna:
* `access_token` dan `refresh_token` disimpan di `localStorage`.
* Axios response interceptor memantau status code `401 Unauthorized`. Jika token kedaluwarsa, interceptor secara otomatis mengirim request ke API `/auth/refresh-token` menggunakan `refresh_token` di latar belakang.
* Jika token berhasil diperbarui, request awal yang gagal akan dikirim ulang secara otomatis. Jika gagal (refresh token juga kedaluwarsa), pengguna dipaksa logout untuk menjaga keamanan data.

### 💳 Idempotensi Pembayaran
Saat mencatat pembayaran, form akan membuat `idempotencyKey` acak (UUID). Key ini dikirim bersama transaksi ke backend. Jika pengguna tidak sengaja mengeklik tombol bayar dua kali (double submit) karena jaringan lambat, server API akan mengenali key ganda tersebut dan hanya memproses transaksi pertama kali, mencegah pembayaran tercatat ganda.

### 🛡️ Proteksi Route & Role Guard
Navigasi rute diproteksi menggunakan wrapper component `ProtectedRoute` yang memeriksa token aktif. Rute juga disaring secara cerdas berdasarkan `role` yang tertera pada state autentikasi user untuk mencegah akses tak berizin (contoh: tenant mencoba membuka halaman laporan keuangan `/reports`).

---

## 📁 Struktur Direktori Penting

```text
kosku-dashboard/
├── src/
│   ├── api/          # Modul pemanggilan REST API (auth, bills, dll.)
│   ├── components/   # Komponen UI umum & primitives (dialog, button, sidebar, dll.)
│   ├── hooks/        # Custom React hooks (AuthProvider, useAuth, dll.)
│   ├── lib/          # Inisialisasi library (Konfigurasi Axios & interceptors)
│   ├── pages/        # Halaman-halaman aplikasi (Owner & Tenant)
│   ├── types/        # Definisi tipe TypeScript
│   ├── utils/        # Fungsi helper format tanggal, denda, uang, dll.
│   ├── index.css     # Styling Tailwind CSS & custom design tokens
│   └── main.tsx      # Entry point aplikasi & konfigurasi routing
```
