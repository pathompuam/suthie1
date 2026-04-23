// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 🟢 1. นำเข้า Utils (ถ้ายังมีใช้อยู่)
const { sendTelegramAlert } = require('./utils/telegram');

// 🟢 2. นำเข้า Routes ทั้งหมดที่เราแยกไว้
const authRoutes = require('./routes/authRoutes'); // <-- เส้นทางจัดการการเข้าสู่ระบบ
const formRoutes = require('./routes/formRoutes'); // <-- เส้นทางจัดการข้อมูลฟอร์มและคำตอบ
const userRoutes = require('./routes/userRoutes'); // <-- เส้นทางจัดการข้อมูลผู้ใช้
const roleRoutes = require('./routes/roleRoutes'); // <-- เส้นทางจัดการข้อมูลผู้ใช้และสิทธิ์
const bannerRoutes = require('./routes/bannerRoutes');// <-- เส้นทางจัดการข้อมูลแบนเนอร์
const dashboardRoutes = require('./routes/dashboardRoutes');// <-- เส้นทางจัดการข้อมูล Dashboard
const caseRoutes = require('./routes/caseRoutes'); // <-- เส้นทางจัดการเคส, นัดหมาย, และประวัติ


const app = express();

app.set('trust proxy', 1); // ✅ เพิ่มบรรทัดนี้

// 🟢 ตั้งค่า Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' })); 
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// 🟢 ตั้งค่าหน้าแรก (Root Route)
app.get('/', (req, res) => {
    res.send("Server is running!");
});

// 🟢 ผูก Routes เข้ากับ API Path หลัก
app.use('/api', authRoutes); 
app.use('/api', formRoutes); 
app.use('/api', userRoutes); 
app.use('/api', roleRoutes); 
app.use('/api', bannerRoutes); 
app.use('/api', dashboardRoutes); 
app.use('/api', caseRoutes); 

// 🟢 6. API ทดสอบ Telegram (ปล่อยไว้ที่นี่ได้เป็นตัว Test)
app.get('/api/test-telegram', async (req, res) => {
  await sendTelegramAlert("🧪 <b>ทดสอบระบบ</b>\nถ้าเห็นข้อความนี้แสดงว่าเชื่อมต่อสำเร็จ ✅");
  res.json({ message: "ส่งแล้ว ดู Terminal และ Telegram" });
});

// 🟢 7. เริ่มต้นรันเซิร์ฟเวอร์
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
    console.log(`📁 Routes successfully loaded!`);
});