<?php
// API: index.html memanggil file ini lewat fetch(). Semua aksi (kecuali login) wajib masuk dulu.
require __DIR__ . '/config.php';
session_start();
header('Content-Type: application/json; charset=utf-8');

$aksi = $_GET['aksi'] ?? '';
$in = json_decode(file_get_contents('php://input'), true) ?: [];

function keluar($data, int $kode = 200) { http_response_code($kode); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function admin() { if (($_SESSION['u']['role'] ?? '') !== 'admin') keluar(['error' => 'Hanya admin yang boleh melakukan ini'], 403); }

function simpanFoto(string $d): ?string {
    if (!preg_match('#^data:image/(jpeg|png|webp);base64,#', $d, $m)) throw new Exception('Format foto tidak didukung. Pakai JPG, PNG, atau WebP');
    $bin = base64_decode(substr($d, strpos($d, ',') + 1), true);
    if (!$bin) throw new Exception('Foto rusak, coba pilih foto lain');
    if (strlen($bin) > 1500000) throw new Exception('Foto terlalu besar');
    $dir = __DIR__ . '/uploads';
    if (!is_dir($dir) && !@mkdir($dir, 0777, true)) throw new Exception('Folder uploads belum ada. Buat folder bernama uploads di dalam folder aplikasi');
    if (!is_writable($dir)) throw new Exception('Folder uploads tidak bisa ditulis. Beri izin tulis (chmod 777 uploads)');
    $f = 'uploads/' . bin2hex(random_bytes(8)) . '.' . ($m[1] === 'jpeg' ? 'jpg' : $m[1]);
    if (file_put_contents(__DIR__ . '/' . $f, $bin) === false) throw new Exception('Gagal menyimpan foto ke folder uploads');
    return $f;
}

function ambilTransaksi(PDO $pdo, int $id): array {
    $s = $pdo->prepare("SELECT id AS no, UNIX_TIMESTAMP(waktu)*1000 AS t, total, diskon, bayar, kembali AS kemb, metode, kasir FROM transaksi WHERE id=?");
    $s->execute([$id]);
    $t = $s->fetch();
    $d = $pdo->prepare("SELECT produk_id AS id, nama AS n, harga AS h, modal AS m, qty AS q FROM detail_transaksi WHERE transaksi_id=?");
    $d->execute([$id]);
    foreach (['no','total','diskon','bayar','kemb'] as $f) $t[$f] = (int)$t[$f];
    $t['t'] = (float)$t['t'];
    $t['items'] = array_map(fn($r) => ['id' => (int)$r['id'], 'n' => $r['n'], 'h' => (int)$r['h'], 'm' => (int)$r['m'], 'q' => (int)$r['q']], $d->fetchAll());
    return $t;
}

if (!in_array($aksi, ['login', 'logout']) && empty($_SESSION['u'])) keluar(['error' => 'Belum masuk'], 401);

try {
    $pdo = db();
    switch ($aksi) {
        case 'login':
            if (!(int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn()) {
                $ins = $pdo->prepare("INSERT INTO users (username,nama,password,role) VALUES (?,?,?,?)");
                $ins->execute(['admin', 'Bu Rina', password_hash('admin123', PASSWORD_DEFAULT), 'admin']);
                $ins->execute(['kasir', 'Kasir Warung', password_hash('kasir123', PASSWORD_DEFAULT), 'kasir']);
            }
            $s = $pdo->prepare("SELECT * FROM users WHERE username=?");
            $s->execute([trim($in['u'] ?? '')]);
            $u = $s->fetch();
            if (!$u || !password_verify($in['p'] ?? '', $u['password'])) keluar(['error' => 'Nama pengguna atau kata sandi salah'], 422);
            session_regenerate_id(true);
            $_SESSION['u'] = ['id' => (int)$u['id'], 'nama' => $u['nama'], 'role' => $u['role']];
            keluar(['ok' => true]);

        case 'logout':
            $_SESSION = []; session_destroy();
            keluar(['ok' => true]);

        case 'data':
            $p = $pdo->query("SELECT id, emoji AS e, nama AS n, kategori AS k, harga AS h, modal AS m, stok AS s, foto AS f FROM produk ORDER BY kategori, nama")->fetchAll();
            foreach ($p as &$r) foreach (['id','h','m','s'] as $f) $r[$f] = (int)$r[$f];
            $ids = $pdo->query("SELECT id FROM transaksi WHERE DATE(waktu)=CURDATE() ORDER BY id")->fetchAll(PDO::FETCH_COLUMN);
            $sales = array_map(fn($i) => ambilTransaksi($pdo, (int)$i), $ids);
            $seq = (int)$pdo->query("SELECT COALESCE(MAX(id),0) FROM transaksi")->fetchColumn();
            $mg = $pdo->query("SELECT DATE(waktu) AS d, SUM(total) AS t FROM transaksi WHERE waktu >= CURDATE() - INTERVAL 6 DAY GROUP BY DATE(waktu)")->fetchAll();
            foreach ($mg as &$r) $r['t'] = (int)$r['t'];
            keluar(['products' => $p, 'sales' => $sales, 'seq' => $seq, 'minggu' => $mg, 'user' => $_SESSION['u']]);

        case 'simpan':
            admin();
            $nama = trim($in['n'] ?? ''); $harga = (int)($in['h'] ?? 0);
            if ($nama === '' || $harga <= 0) keluar(['error' => 'Nama dan harga wajib diisi'], 422);
            $foto = !empty($in['foto_data']) ? simpanFoto($in['foto_data']) : null;
            $v = [mb_substr($in['e'] ?? '🛒', 0, 8), $nama, $in['k'] ?? 'Makanan', $harga, max(0, (int)($in['m'] ?? 0)), max(0, (int)($in['s'] ?? 0)), $foto];
            if (!empty($in['id'])) {
                $v[] = (int)$in['id'];
                $pdo->prepare("UPDATE produk SET emoji=?, nama=?, kategori=?, harga=?, modal=?, stok=?, foto=COALESCE(?,foto) WHERE id=?")->execute($v);
            } else {
                $pdo->prepare("INSERT INTO produk (emoji,nama,kategori,harga,modal,stok,foto) VALUES (?,?,?,?,?,?,?)")->execute($v);
            }
            keluar(['ok' => true]);

        case 'hapus':
            admin();
            $pdo->prepare("DELETE FROM produk WHERE id=?")->execute([(int)($in['id'] ?? 0)]);
            keluar(['ok' => true]);

        case 'bayar':
            $items = $in['items'] ?? [];
            $metode = ($in['metode'] ?? 'Tunai') === 'QRIS' ? 'QRIS' : 'Tunai';
            if (!$items) keluar(['error' => 'Pesanan kosong'], 422);
            $pdo->beginTransaction();
            $sub = 0; $baris = [];
            foreach ($items as $it) {
                $q = (int)($it['q'] ?? 0);
                $s = $pdo->prepare("SELECT * FROM produk WHERE id=? FOR UPDATE");
                $s->execute([(int)($it['id'] ?? 0)]);
                $p = $s->fetch();
                if (!$p || $q < 1) throw new Exception('Barang tidak ditemukan');
                if ($p['stok'] < $q) throw new Exception('Stok ' . $p['nama'] . ' tinggal ' . $p['stok']);
                $sub += $p['harga'] * $q;           // harga dihitung di server
                $baris[] = [$p, $q];
            }
            $nilai = max(0, (int)($in['diskon']['nilai'] ?? 0));
            $disk = ($in['diskon']['tipe'] ?? 'rp') === 'persen' ? (int)round($sub * min($nilai, 100) / 100) : min($nilai, $sub);
            $total = $sub - $disk;
            $bayar = $metode === 'QRIS' ? $total : (int)($in['bayar'] ?? 0);
            if ($bayar < $total) throw new Exception('Uang yang diterima kurang');
            $pdo->prepare("INSERT INTO transaksi (total,diskon,bayar,kembali,metode,kasir) VALUES (?,?,?,?,?,?)")
                ->execute([$total, $disk, $bayar, $bayar - $total, $metode, $_SESSION['u']['nama']]);
            $tid = (int)$pdo->lastInsertId();
            foreach ($baris as [$p, $q]) {
                $pdo->prepare("INSERT INTO detail_transaksi (transaksi_id,produk_id,nama,harga,modal,qty) VALUES (?,?,?,?,?,?)")->execute([$tid, $p['id'], $p['nama'], $p['harga'], $p['modal'], $q]);
                $pdo->prepare("UPDATE produk SET stok = stok - ? WHERE id=?")->execute([$q, $p['id']]);
            }
            $pdo->commit();
            keluar(ambilTransaksi($pdo, $tid));

        case 'csv':
            admin();
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="penjualan-warung-bu-rina.csv"');
            $o = fopen('php://output', 'w'); fwrite($o, "\xEF\xBB\xBF");
            fputcsv($o, ['No', 'Waktu', 'Kasir', 'Metode', 'Barang', 'Qty', 'Harga', 'Subtotal', 'Diskon transaksi', 'Total transaksi']);
            $q = $pdo->query("SELECT t.id,t.waktu,t.kasir,t.metode,d.nama,d.qty,d.harga,d.qty*d.harga AS sub,t.diskon,t.total FROM transaksi t JOIN detail_transaksi d ON d.transaksi_id=t.id ORDER BY t.id");
            while ($r = $q->fetch(PDO::FETCH_NUM)) fputcsv($o, $r);
            exit;

        default:
            keluar(['error' => 'Aksi tidak dikenal'], 400);
    }
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    keluar(['error' => $e->getMessage()], 400);
}
