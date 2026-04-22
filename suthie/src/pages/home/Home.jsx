import "./Home.css";
import { useNavigate } from "react-router-dom";


/* ─────────────────────────────────────────────
   CARD DATA
───────────────────────────────────────────── */
const CARDS = [
  
  {
    cls: "card-blue",
    title:
      "แบบแสดงความประสงค์เข้ารับคำปรึกษาคลินิกวัยรุ่น (สุขภาพกาย,สุขภาพใจ)",
    desc: "เพื่อให้พยาบาลการรับคำปรึกษา สำหรับนักศึกษา บุคลากร มกส. ที่ต้องการเข้ารับคำปรึกษากับแพทย์ สพ.มกส. สามารถลงทะเบียนเพื่อเข้ารับคำปรึกษาได้เสมอนะ",
    path: "/assessment/teen-clinic",
    image: "/14.png",
  },
  {
    cls: "card-pink",
    title:
      "ลงทะเบียนขอเข้ารับบริการปรึกษา/ตรวจคัดกรองโรคติดต่อทางเพศสัมพันธ์",
    desc:
      "คลินิกวัยรุ่น คลินิกให้บริการปรึกษา คัดกรองโรคติดต่อทางเพศสัมพันธ์",
    path: "/assessment/std-clinic",
    image: "/15.png",
  },
  {
    cls: "card-green",
    title:
      "แบบลงทะเบียนขอรับคำปรึกษาคลินิกปรับเปลี่ยนพฤติกรรมสุขภาพ LSM Clinic",
    desc:
      "ท่านสามารถกรอกข้อมูลเพื่อแสดงความประสงค์เข้ารับบริการสอบถามได้ตามแบบฟอร์มนี้ จะมีเจ้าหน้าที่ติดต่อกลับสถานบัตรเบอร์โทรศัพท์ที่ท่านให้ไว้",
    path: "/assessment/lsm-clinic",
    image: "/16.png",
  },
];

/* ─────────────────────────────────────────────
   HOME COMPONENT
───────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">

      <nav className="navbar">
        
  <div className="navbar__logo">
    <img
      src="/logoSUTH.png"
      alt="SUTH Logo"
      className="navbar__logo-img"
    />
  </div>
</nav>
      {/* ================= HERO ================= */}
    <section
  className="hero"
  style={{ backgroundImage: "url('tree-bg.webp')" }}  // เปลี่ยนรูปตรงนี้
>
  <h1 className="hero__title">แบบลงทะเบียนขอเข้ารับคำปรึกษาปัญหาสุขภาพ</h1>
  <span className="hero__line" />
</section>

      {/* ================= CARDS ================= */}
      <section className="cards">
        {CARDS.map(({ cls, title, desc, path, image }) => (
          <article
            key={path}
            className={`card ${cls}`}
            onClick={() => navigate(path)}
            onKeyDown={(e) => e.key === "Enter" && navigate(path)}
            role="button"
            tabIndex={0}
            aria-label={title}
          >
          
            <div className="card__illust" aria-hidden="true">
              <img src={image} alt="" />
            </div>

            <div className="card__body">
              <h2 className="card__title">{title}</h2>
              <p className="card__desc">{desc}</p>
            </div>
          </article>
        ))}
      </section>

    </div>
  );
}