/**
 * Минимальный ZIP-упаковщик без зависимостей (метод STORE). Нужен для «единого
 * пакета аудита»: все документы прогона одним .zip. UTF-8-имена (кириллица ок).
 */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export type ZipEntry = { name: string; data: Buffer };

export function makeZip(entries: ZipEntry[]): Buffer {
  const chunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8');
    const crc = crc32(e.data);
    const size = e.data.length;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);          // version needed
    local.writeUInt16LE(0x0800, 6);      // flags: UTF-8 filename
    local.writeUInt16LE(0, 8);           // method: store
    local.writeUInt16LE(0, 10);          // time
    local.writeUInt16LE(0, 12);          // date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(size, 18);       // compressed
    local.writeUInt32LE(size, 22);       // uncompressed
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);          // extra len
    chunks.push(local, name, e.data);

    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);            // version made by
    cen.writeUInt16LE(20, 6);            // version needed
    cen.writeUInt16LE(0x0800, 8);        // flags
    cen.writeUInt16LE(0, 10);            // method
    cen.writeUInt16LE(0, 12);            // time
    cen.writeUInt16LE(0, 14);            // date
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(size, 20);
    cen.writeUInt32LE(size, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt16LE(0, 30);            // extra
    cen.writeUInt16LE(0, 32);            // comment
    cen.writeUInt16LE(0, 34);            // disk
    cen.writeUInt16LE(0, 36);            // internal attrs
    cen.writeUInt32LE(0, 38);            // external attrs
    cen.writeUInt32LE(offset, 42);       // local header offset
    central.push(cen, name);

    offset += local.length + name.length + e.data.length;
  }

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, centralBuf, end]);
}
