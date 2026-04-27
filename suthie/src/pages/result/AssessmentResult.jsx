import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiActivity, FiInfo, FiCheck, FiSend, FiClock } from "react-icons/fi";
import riskLow from "../../assets/01.png";
import riskMedium from "../../assets/02.png";
import riskHigh from "../../assets/03.png";
import logoSUTH from "../../assets/logoSUTH.png";
import "./AssessmentResult.css";

// 🟢 นำเข้า API และ SweetAlert2
import { submitFormAnswers } from "../../services/api";
import Swal from "sweetalert2";

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

  // 🟢 รับ Payload ที่ถูกส่งมาจาก FormView
  const results = location.state?.results || [];
  const formId = location.state?.formId;
  const payload = location.state?.payload;

  // 🟢 State ควบคุมสถานะการส่งข้อมูล
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    // ถ้าไม่มีผลลัพธ์ (เช่น ผู้ใช้เข้าหน้านี้โดยตรง) ให้เด้งกลับหน้าแรก
    if (!results.length) {
      navigate("/");
    }
  }, [navigate, results.length]);

  // 🟢 ฟังก์ชันจัดการการยิง API
  const handleSendToStaff = () => {
    if (!formId || !payload) {
      Swal.fire('ข้อผิดพลาด', 'ไม่พบข้อมูลสำหรับการส่ง กรุณาทำแบบประเมินใหม่อีกครั้ง', 'error');
      return;
    }

    // เรียก SweetAlert2 ยืนยันการส่งแทน Modal เดิม
    Swal.fire({
      title: 'ต้องการส่งข้อมูลให้เจ้าหน้าที่?',
      text: "ระบบจะบันทึกข้อมูลและส่งการแจ้งเตือนไปยังทีมแพทย์/พยาบาล",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ส่งข้อมูล',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsSubmitting(true);
        
        // แสดง Loading
        Swal.fire({
          title: 'กำลังส่งข้อมูล...',
          text: 'กรุณารอสักครู่',
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });

        try {
          // 🟢 ยิง API ของจริงเพื่อบันทึกลง Database
          await submitFormAnswers(formId, payload);
          
          setIsSaved(true);
          
          Swal.fire({
            icon: 'success',
            title: 'ส่งข้อมูลสำเร็จ!',
            text: 'เจ้าหน้าที่ได้รับข้อมูลของท่านแล้ว ท่านสามารถตรวจสอบประวัติได้',
            confirmButtonColor: '#10b981'
          });
        } catch (error) {
          console.error("Submit Error:", error);
          Swal.fire({
            icon: 'error',
            title: 'ไม่สามารถส่งข้อมูลได้',
            text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
            confirmButtonColor: '#ef4444'
          });
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

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

        {/* 🟡 HERO HEADER - เปลี่ยนสีและข้อความตามสถานะการส่ง */}
        <div 
          className="ar-success-hero" 
          style={{ 
            backgroundColor: isSaved ? '#ecfdf5' : '#f8fafc', 
            borderColor: isSaved ? '#10b981' : '#e2e8f0' 
          }}
        >
          <div 
            className="ar-success-icon" 
            style={{ backgroundColor: isSaved ? '#10b981' : '#3b82f6' }}
          >
            {isSaved ? <FiCheckCircle size={40} color="#fff" /> : <FiCheck size={40} color="#fff" />}
          </div>
          <h2 className="ar-hero-title">
            {isSaved ? "ส่งข้อมูลให้เจ้าหน้าที่สำเร็จ" : "ประเมินผลเบื้องต้นเสร็จสิ้น"}
          </h2>
          <p className="ar-hero-subtitle" style={{ color: '#475569' }}>
            {isSaved 
              ? "ข้อมูลของท่านถูกส่งเข้าสู่ระบบและแจ้งเตือนไปยังทีมแพทย์เรียบร้อยแล้ว"
              : <span>ด้านล่างนี้คือสรุปผลการวิเคราะห์เบื้องต้น <br />หากต้องการรับการดูแลต่อ กรุณากดปุ่ม <b>“ส่งข้อมูลให้เจ้าหน้าที่”</b> ด้านล่าง</span>
            }
          </p>
        </div>

        {/* ✅ แสดงการ์ดผลการประเมิน */}
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

        {/* 🟢 ACTIONS BUTTONS ควบคุมการแสดงผลตาม State */}
        <div className="ar-actions">

          {/* ปุ่มกลับหน้าหลัก (แสดงตลอด) */}
          <button
            className="ar-btn ar-btn--ghost"
            onClick={() => navigate("/")}
            disabled={isSubmitting}
          >
            ← กลับหน้าหลัก
          </button>

          {/* ปุ่มส่งข้อมูลให้เจ้าหน้าที่ (แสดงตอนยังไม่ส่ง) */}
          {!isSaved && (
            <button
              className="ar-btn"
              style={{ background: "#3b82f6", display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
              onClick={handleSendToStaff}
              disabled={isSubmitting}
            >
              <FiSend /> {isSubmitting ? "กำลังส่ง..." : "ส่งข้อมูลให้เจ้าหน้าที่"}
            </button>
          )}

          {/* ปุ่มตรวจสอบประวัติ (แสดงหลังจากส่งสำเร็จแล้ว) */}
          {isSaved && (
            <button
              className="ar-btn"
              style={{
                background: isColorTooBright(results[0]?.color || "#2d7d81")
                  ? "#2d7d81"
                  : getLevelConfig(results[0]).color,
                display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center'
              }}
              onClick={() => navigate("/history")}
            >
              <FiClock /> ตรวจสอบประวัติ
            </button>
          )}

        </div>

      </div>
    </div>
  );
}