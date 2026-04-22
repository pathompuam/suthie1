import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiActivity, FiInfo, FiCheck } from "react-icons/fi";
import riskLow from "../../assets/01.png";
import riskMedium from "../../assets/02.png";
import riskHigh from "../../assets/03.png";
import logoSUTH from "../../assets/logoSUTH.png"; // ✅ ใช้ path เดียวกับ SutLanding
import "./AssessmentResult.css";

// 🟢 ฟังก์ชันผู้ช่วย: แปลงสี HEX เป็น RGB
const hexToRgbArray = (hex) => {
  if (!hex.startsWith('#')) hex = '#' + hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

// 🟢 ฟังก์ชันผู้ช่วย: ตรวจสอบว่าสีที่ส่งมา "สว่างเกินไป" หรือไม่
const isColorTooBright = (hex) => {
  const [r, g, b] = hexToRgbArray(hex);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 190;
};

// 🟢 ฟังก์ชันสร้าง Config การ์ดแบบไดนามิก + เลือกรูปภาพ + จัดการ Contrast สี
const getLevelConfig = (result) => {
  if (!result) {
    return {
      title: "ผลการประเมิน",
      score: 0,
      label: "บันทึกสำเร็จ",
      advice: ["ไม่มีคำแนะนำเพิ่มเติมในขณะนี้"],
      color: "#2d7d81",
      textColor: "#2d7d81",
      rgb: "45, 125, 129",
      colorBg: "rgba(45, 125, 129, 0.08)",
      colorBorder: "rgba(45, 125, 129, 0.25)",
      colorBanner: "linear-gradient(135deg, rgba(45, 125, 129, 0.7) 0%, rgba(45, 125, 129, 1) 100%)",
      visualImage: riskLow,
    };
  }

  const hexCriteriaColor = result.color || "#2d7d81";
  const rgbString = hexToRgbArray(hexCriteriaColor).join(', ');
  const lowerColor = hexCriteriaColor.toLowerCase();

  const isTooBright = isColorTooBright(hexCriteriaColor);
  const readableTextColor = isTooBright ? "#2d7d81" : hexCriteriaColor;

  let visualImage = riskLow;
  if (lowerColor.includes('d93025') || lowerColor.includes('e53935') || lowerColor.includes('f44336') || lowerColor.includes('ef4444') || lowerColor.includes('d32f2f')) {
    visualImage = riskHigh;
  } else if (lowerColor.includes('fbbc04') || lowerColor.includes('ff9800') || lowerColor.includes('ffb300') || lowerColor.includes('f59e0b') || lowerColor.includes('f57c00')) {
    visualImage = riskMedium;
  }

  const rgbColor = hexToRgbArray(hexCriteriaColor);

  return {
    title: result.title || "ผลการประเมิน",
    score: result.score,
    label: result.label || "ประเมินเสร็จสิ้น",
    advice: result.advice ? (Array.isArray(result.advice) ? result.advice : result.advice.split('\n')) : ["ไม่มีคำแนะนำเพิ่มเติมในขณะนี้"],
    color: hexCriteriaColor,
    textColor: readableTextColor,
    rgb: rgbColor.join(', '),
    colorBg: `rgba(${rgbString}, 0.08)`,
    colorBorder: `rgba(${rgbString}, 0.25)`,
    colorBanner: `linear-gradient(135deg, rgba(${rgbString}, 0.7) 0%, rgba(${rgbString}, 1) 100%)`,
    visualImage: visualImage,
  };
};

export default function AssessmentResult() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const results = location.state?.results || [];

  return (
    <div className="ar-page">

      {/* ─── NAV ─── */}
      <nav className="ar-nav">
        <div className="ar-nav__logo-wrap">
          <img
            src={logoSUTH}
            alt="SUTH Healthcare"
            className="ar-nav__logo"
          />
        </div>
        <div className="ar-nav__actions">
          <button className="ar-btn-close" onClick={() => navigate("/")}>
            ✕ ปิดหน้าต่าง
          </button>
        </div>
      </nav>

      {/* ─── CONTENT ─── */}
      <div className="ar-container">

        {/* 🟡 HERO HEADER */}
        <div className="ar-success-hero">
          <div className="ar-success-icon">
            <FiCheck size={40} />
          </div>
          <h2 className="ar-hero-title">บันทึกข้อมูลสำเร็จ</h2>
          <p className="ar-hero-subtitle">
            ข้อมูลของท่านถูกส่งเข้าสู่ระบบเรียบร้อยแล้ว ด้านล่างนี้คือสรุปผลการวิเคราะห์เบื้องต้น
          </p>
        </div>

        {/* ✅ แสดงการ์ดผลเฉพาะเมื่อมีผลประเมิน — ไม่แสดง "ลงทะเบียนสำเร็จ" ซ้อน */}
        {results.length > 0 && results.map((res, index) => {
          const level = getLevelConfig(res);
          return (
            <div
              key={index}
              className="ar-result-card"
              style={{
                "--card-color": level.color,
                animationDelay: `${index * 0.15}s`
              }}
            >
              {/* CARD HEAD */}
              <div className="ar-result-card__head">
                <div style={{ flex: 1, paddingRight: '16px' }}>
                  <div className="ar-level-badge" style={{ color: level.textColor }}>
                    <FiActivity size={24} /> <span>{level.label}</span>
                  </div>
                  <div className="ar-card-title">{level.title}</div>
                </div>

                <div className="ar-score-wrapper" style={{ backgroundColor: level.colorBg, borderColor: level.colorBorder }}>
                  <span className="ar-score__label" style={{ color: '#64748b' }}>คะแนน</span>
                  <span className="ar-score__val" style={{ color: level.textColor }}>
                    {level.score}
                  </span>
                </div>
              </div>

              {/* CARD BODY */}
              <div className="ar-result-card__body">

                {/* ADVICE */}
                <div className="ar-advice-box" style={{ backgroundColor: level.colorBg, borderColor: level.colorBorder }}>
                  <h3 className="ar-advice-box__title" style={{ color: level.textColor }}>
                    <FiInfo size={18} /> คำแนะนำเบื้องต้น
                  </h3>
                  <ul className="ar-advice__list">
                    {level.advice.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>

                {/* VISUAL */}
                <div
                  className="ar-visual"
                  style={{
                    "--grad": level.colorBanner,
                    "--border": level.colorBorder,
                    "--accent": level.color,
                  }}
                >
                  <div className="ar-visual__frame" style={{ background: `radial-gradient(circle at 50% 50%, rgba(${level.rgb}, 0.25), transparent 70%)` }}>
                    <img src={level.visualImage} alt={level.label} />
                  </div>
                </div>

              </div>
            </div>
          );
        })}

        {/* ACTIONS */}
        <div className="ar-actions">
          <button
            className="ar-btn ar-btn--ghost"
            onClick={() => navigate("/")}
          >
            ← กลับหน้าหลัก
          </button>

          <button
            className="ar-btn"
            style={{
              background: isColorTooBright(results[0]?.color || "#2d7d81")
                ? "#2d7d81"
                : getLevelConfig(results[0]).color
            }}
            onClick={() => navigate("/history")}
          >
            ตรวจสอบประวัติ
          </button>
        </div>

      </div>
    </div>
  );
}