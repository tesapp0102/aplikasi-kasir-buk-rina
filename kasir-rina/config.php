<?php
// Pengaturan koneksi database. Sesuaikan jika perlu.
// XAMPP bawaan: user "root", password kosong.
const DB_HOST = 'localhost';
const DB_NAME = 'kasir_bu_rina';
const DB_USER = 'root';
const DB_PASS = '';

date_default_timezone_set('Asia/Jakarta');

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec("SET time_zone = '+07:00'");
    return $pdo;
}
