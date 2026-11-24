# Kasir Bu Rina v2 (HTML + CSS + JavaScript + PHP + MySQL)

## Isi folder
- index.html  : kerangka halaman
- style.css   : desain (warna teal + oranye, mode gelap otomatis)
- app.js      : logika di browser (JavaScript)
- api.php     : logika di server (PHP), semua akses database lewat sini
- config.php  : pengaturan koneksi MySQL
- database.sql: struktur tabel + 10 barang contoh
- uploads/    : dibuat otomatis, tempat foto barang

## Cara menjalankan (XAMPP)
1. Start Apache dan MySQL di XAMPP Control Panel.
2. Salin folder ini ke C:\xampp\htdocs\ dan beri nama kasir-bu-rina.
3. Buka http://localhost/phpmyadmin > tab Import > pilih database.sql > Import.
4. Buka http://localhost/kasir-bu-rina/
5. Masuk: admin / admin123 (akses penuh) atau kasir / kasir123 (hanya kasir dan laporan).
   Akun dibuat otomatis saat login pertama. Segera ganti password di database untuk pemakaian nyata.

Dari HP satu WiFi: ganti localhost dengan IP laptop (cek dengan ipconfig).

## Fitur
Login admin/kasir, katalog dengan foto, pencarian dan kategori, keranjang, diskon (Rp atau %),
tunai/QRIS, uang pas dan kembalian otomatis, struk (WhatsApp/cetak), pengurangan stok otomatis,
peringatan stok menipis, laporan harian (omzet, untung, terlaris), grafik 7 hari, unduh CSV (Excel),
kelola barang + upload foto, mode gelap otomatis.

## Ide pengembangan
Utang pelanggan, scan barcode, manajemen pengguna, laporan bulanan, hosting online.

## Gambar / foto
- Menu dan barang contoh sudah punya gambar bawaan di folder img/.
- Foto sendiri: menu Barang/Menu > Tambah atau Ubah > pilih foto (JPG/PNG/WebP).
- Kalau foto tidak mau masuk: pastikan folder uploads ada di dalam folder aplikasi dan bisa ditulis
  (di Linux/hosting: chmod 777 uploads). Pesan error akan tampil di layar.
- Kalau database sudah terlanjur di-import, jalankan update-gambar.sql di phpMyAdmin.
- Aplikasi harus dibuka lewat http://localhost/..., bukan dengan klik dua kali file index.html.
