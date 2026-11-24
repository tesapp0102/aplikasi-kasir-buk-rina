CREATE DATABASE IF NOT EXISTS kasir_bu_rina CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kasir_bu_rina;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  nama VARCHAR(60) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','kasir') NOT NULL DEFAULT 'kasir'
);

CREATE TABLE IF NOT EXISTS produk (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emoji VARCHAR(8) NOT NULL DEFAULT '🛒',
  nama VARCHAR(100) NOT NULL,
  kategori VARCHAR(30) NOT NULL DEFAULT 'Makanan',
  harga INT NOT NULL,
  modal INT NOT NULL DEFAULT 0,
  stok INT NOT NULL DEFAULT 0,
  foto VARCHAR(120) NULL
);

CREATE TABLE IF NOT EXISTS transaksi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  waktu DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total INT NOT NULL,
  diskon INT NOT NULL DEFAULT 0,
  bayar INT NOT NULL,
  kembali INT NOT NULL DEFAULT 0,
  metode VARCHAR(10) NOT NULL DEFAULT 'Tunai',
  kasir VARCHAR(60) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS detail_transaksi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaksi_id INT NOT NULL,
  produk_id INT NULL,
  nama VARCHAR(100) NOT NULL,
  harga INT NOT NULL,
  modal INT NOT NULL DEFAULT 0,
  qty INT NOT NULL,
  FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE CASCADE
);

INSERT INTO produk (emoji,nama,kategori,harga,modal,stok) VALUES
('🍚','Nasi uduk','Makanan',8000,5000,25),('🍜','Mie goreng','Makanan',10000,6500,20),
('🍳','Telur dadar','Makanan',4000,2500,30),('🍤','Gorengan','Snack',1000,600,60),
('🍘','Kerupuk','Snack',2000,1200,40),('🍞','Roti coklat','Snack',5000,3500,15),
('🧋','Es teh manis','Minuman',3000,1000,50),('☕','Kopi sachet','Minuman',3500,2000,40),
('💧','Air mineral','Minuman',3000,2000,48),('🥤','Teh botol','Minuman',5000,3600,4);
-- Akun admin dan kasir dibuat otomatis saat login pertama (lihat api.php).

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
