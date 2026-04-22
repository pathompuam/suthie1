/**
 * ============================================================
 *  server/utils/encryption.js
 *  AES-256-GCM Encryption Utility — suthieproj
 *  เข้ารหัส: name, phone, national_id
 * ============================================================
 */

const crypto = require('crypto');

const ALGORITHM  = 'aes-256-gcm';
const IV_LENGTH  = 16;
const TAG_LENGTH = 16;

// ── ดึง Key จาก .env ──────────────────────────────────────
function getKey() {
  const hex = process.env.AES_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('AES_KEY ต้องเป็น hex 64 ตัวอักษร (256-bit) ใน .env');
  }
  return Buffer.from(hex, 'hex');
}

function getSearchKey() {
  const k = process.env.AES_SEARCH_KEY;
  if (!k || k.length < 32) {
    throw new Error('AES_SEARCH_KEY ต้องมีอย่างน้อย 32 ตัวอักษรใน .env');
  }
  return k;
}

// ── Encrypt ───────────────────────────────────────────────
function encrypt(text) {
  if (text === null || text === undefined || text === '') return null;
  const key    = getKey();
  const iv     = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(text), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // layout: [iv 16B][authTag 16B][ciphertext]
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

// ── Decrypt ───────────────────────────────────────────────
// ── Decrypt ───────────────────────────────────────────────
function decrypt(encryptedBase64) {
  if (!encryptedBase64) return null;
  try {
    const key  = getKey();
    const buf  = Buffer.from(encryptedBase64, 'base64');
    
    // 🟢 1. เช็คความยาวข้อมูล (กุญแจ IV 16 + Tag 16 = 32 bytes)
    // ถ้าสั้นกว่านี้ แปลว่าไม่ใช่ข้อมูลที่ถูกเข้ารหัสแน่นอน (เป็นข้อมูลเก่า) ให้ส่งคืนค่าเดิมกลับไปเลย
    if (buf.length <= IV_LENGTH + TAG_LENGTH) {
      return encryptedBase64; 
    }

    const iv         = buf.slice(0, IV_LENGTH);
    const authTag    = buf.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = buf.slice(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
    
  } catch (err) {
    // 🟢 2. ปิด console.error ทิ้งไป Terminal จะได้ไม่รก
    // console.error('[Decrypt Error]', err.message);
    
    // ถ้าถอดรหัสพลาด (อาจจะเพราะเป็นข้อความธรรมดา) ก็ให้คืนข้อความดั้งเดิมกลับไป
    return encryptedBase64;
  }
}

// ── HMAC Hash (สำหรับ Search) ─────────────────────────────
// ค้นหาโดยไม่ต้อง decrypt ทุก row
function hmacHash(value) {
  if (!value) return null;
  return crypto
    .createHmac('sha256', getSearchKey())
    .update(String(value).trim())
    .digest('hex');
}

// ── Mask สำหรับแสดงผลบางส่วน ─────────────────────────────
// "สมชาย ใจดี"    → "สมชาย ***"
function maskName(name) {
  if (!name) return null;
  const parts = String(name).trim().split(' ');
  if (parts.length === 1) return parts[0];
  return parts[0] + ' ' + '*'.repeat(parts.slice(1).join(' ').length);
}

// "0812345678" → "081****678"
function maskPhone(phone) {
  if (!phone) return null;
  const s = String(phone);
  return s.slice(0, 3) + '****' + s.slice(-3);
}

// "1234567890123" → "1234*****0123"
function maskNationalId(id) {
  if (!id) return null;
  const s = String(id);
  return s.slice(0, 4) + '*'.repeat(5) + s.slice(-4);
}

// ── Validate เลขบัตรประชาชนไทย ───────────────────────────
function validateThaiId(id) {
  const digits = String(id).replace(/\D/g, '');
  if (digits.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === parseInt(digits[12]);
}

// ── Validate เบอร์โทรไทย ────────────────────────────────
function validateThaiPhone(phone) {
  return /^0[689]\d{8}$/.test(String(phone).replace(/\D/g, ''));
}

module.exports = {
  encrypt,
  decrypt,
  hmacHash,
  maskName,
  maskPhone,
  maskNationalId,
  validateThaiId,
  validateThaiPhone,
};