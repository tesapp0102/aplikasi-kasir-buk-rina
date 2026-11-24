-- Jalankan ini di phpMyAdmin jika database sudah terlanjur di-import.
USE kasir_bu_rina;
-- Gambar contoh bawaan (folder img/)
UPDATE produk SET foto='img/nasi-uduk.svg' WHERE nama='Nasi uduk' AND foto IS NULL;
UPDATE produk SET foto='img/mie-goreng.svg' WHERE nama='Mie goreng' AND foto IS NULL;
UPDATE produk SET foto='img/telur-dadar.svg' WHERE nama='Telur dadar' AND foto IS NULL;
UPDATE produk SET foto='img/gorengan.svg' WHERE nama='Gorengan' AND foto IS NULL;
UPDATE produk SET foto='img/kerupuk.svg' WHERE nama='Kerupuk' AND foto IS NULL;
UPDATE produk SET foto='img/roti-coklat.svg' WHERE nama='Roti coklat' AND foto IS NULL;
UPDATE produk SET foto='img/es-teh.svg' WHERE nama='Es teh manis' AND foto IS NULL;
UPDATE produk SET foto='img/kopi.svg' WHERE nama='Kopi sachet' AND foto IS NULL;
UPDATE produk SET foto='img/air-mineral.svg' WHERE nama='Air mineral' AND foto IS NULL;
UPDATE produk SET foto='img/teh-botol.svg' WHERE nama='Teh botol' AND foto IS NULL;
