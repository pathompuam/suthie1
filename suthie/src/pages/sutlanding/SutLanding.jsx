import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { FiClock, FiLogIn, FiChevronLeft, FiChevronRight, FiHeart } from "react-icons/fi";
import "./SutLanding.css";

import logo from "../../assets/logoSUTH.png";
import bgHealth from "../../assets/bg-health.jpg";
import bgContact from "../../assets/img-contact.jpg";
import bgClinic from "../../assets/bg-clinic.jpg";
import { getForms, getFormSubmissionCount, getBanners } from "../../services/api";

const SLIDE_INTERVAL = 6000;
const POLL_INTERVAL = 30000;
const CARD_THEMES = ["sl-card--blue", "sl-card--pink", "sl-card--green"];

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function useImageType(src) {
  const [isBanner, setIsBanner] = useState(false);
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      setIsBanner(img.naturalWidth / img.naturalHeight >= 1.4);
    };
    img.src = src;
  }, [src]);
  return isBanner;
}

function FormCard({ form, themeClass, count, isLoaded }) {
  const navigate = useNavigate();
  const displayImage = form.image || `${process.env.PUBLIC_URL}/14.png`;
  const isBanner = useImageType(displayImage);
  const plainDesc = stripHtml(form.description || "คลิกเพื่อประเมินความเสี่ยง");

  return (
    <article
      className={`ssl-card ${themeClass}`}
      onClick={() => navigate(`/assessment/${form.id}`)}
      role="button"
      tabIndex={0}
      aria-label={form.title}
    >
      <div className={`ssl-card__band ${isBanner ? "ssl-card__band--has-img" : ""}`}>
        {isBanner && (
          <img className="ssl-card__band-img" src={displayImage} alt={form.title} />
        )}
      </div>

      {!isBanner && (
        <div className="ssl-card__illust">
          <img src={displayImage} alt="Form Cover" />
        </div>
      )}

      <div className="ssl-card__body">
        <h3 className="ssl-card__title">{form.title || "ไม่มีชื่อฟอร์ม"}</h3>
        <p className="ssl-card__desc">{plainDesc}</p>
      </div>

      <div className="ssl-card__count">
        {!isLoaded ? (
          <span className="ssl-card__count-text">กำลังโหลด...</span>
        ) : (
          <span className="ssl-card__count-text">
            ผู้เข้ารับการประเมิน <strong>{Number(count).toLocaleString()}</strong> คน
          </span>
        )}
      </div>
    </article>
  );
}

export default function SutLanding() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState([]);
  const [forms, setForms] = useState([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const pollRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // ✅ ตรวจจับว่าเป็น mobile หรือไม่ (ใช้ disable parallax transform)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1100);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [rotation, setRotation] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [winWidth, setWinWidth] = useState(window.innerWidth);
  const [touchStart, setTouchStart] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    getBanners()
      .then(res => setSlides(res.data.map(b => ({ image: b.image, alt: b.filename }))))
      .catch(err => console.error("fetchBanners:", err));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWinWidth(window.innerWidth);
      setIsMobile(window.innerWidth <= 1100); // ✅ sync isMobile กับ resize
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getForms("lastOpened");
        const now = new Date();
        const activeForms = res.data.filter(f => {
          if (!f.status || f.status !== 'published') return false;
          const start = f.publish_start_date ? new Date(f.publish_start_date) : null;
          const end = f.publish_end_date ? new Date(f.publish_end_date) : null;
          if (start && now < start) return false;
          if (end && now > end) return false;
          return true;
        });
        setForms([...activeForms].reverse());
      } catch (err) {
        console.error("fetchForms:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formsCount = forms.length;
  const getCardWidth = () => {
    if (winWidth > 1024) return 320;
    if (winWidth > 768) return 280;
    return 240;
  };
  const cardWidth = getCardWidth();
  const tz = formsCount > 1
    ? Math.round((cardWidth / 2) / Math.tan(Math.PI / formsCount)) + 160
    : 0;

  const handleNext = useCallback(() => {
    setRotation(prev => prev - (360 / formsCount));
    setActiveIdx(prev => (prev + 1) % formsCount);
    resetTimer();
  }, [formsCount]);

  const handlePrev = useCallback(() => {
    setRotation(prev => prev + (360 / formsCount));
    setActiveIdx(prev => (prev - 1 + formsCount) % formsCount);
    resetTimer();
  }, [formsCount]);

  const onTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const onTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    if (distance > 50) handleNext();
    else if (distance < -50) handlePrev();
    setTouchStart(null);
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimer();
  };

  const startTimer = () => {
    if (formsCount > 1) timerRef.current = setInterval(handleNext, 6000);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [formsCount, handleNext]);

  const fetchAllCounts = useCallback(async (formList) => {
    if (!formList.length) return;
    const results = await Promise.allSettled(
      formList.map(f => getFormSubmissionCount(f.id))
    );
    const map = {};
    formList.forEach((f, i) => {
      map[f.id] = results[i].status === "fulfilled" ? (results[i].value?.data?.count ?? 0) : 0;
    });
    setCounts(map);
  }, []);

  useEffect(() => {
    if (!forms.length) return;
    fetchAllCounts(forms);
    pollRef.current = setInterval(() => fetchAllCounts(forms), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [forms, fetchAllCounts]);

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [slides]);

  const handleHeroClick = e => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    e.clientX - left < width / 2 ? prev() : next();
  };

  useEffect(() => {
    if (!slides.length) return;
    const t = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(t);
  }, [next, slides]);

  const introRegRef = useRef(null);
  const [isIntroActive, setIsIntroActive] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { setIsIntroActive(entry.isIntersecting); },
      { threshold: 0.1 }
    );
    if (introRegRef.current) observer.observe(introRegRef.current);
    return () => observer.disconnect();
  }, []);

  const introRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!introRef.current) return;
      const rect = introRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = Math.min(
        Math.max((windowHeight - rect.top) / (windowHeight + rect.height), 0),
        1
      );
      document.documentElement.style.setProperty("--progress", progress);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="ssl-page">
      <nav className={`ssl-nav ${isScrolled ? "ssl-nav--scrolled" : ""}`}>
        <div className="ssl-nav__logo">
          <img src={logo} alt="SUTH Logo" className="ssl-nav__logo-img" />
        </div>
        <div className="ssl-nav__menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</div>
        <div className={`ssl-nav__actions ${menuOpen ? "ssl-open" : ""}`}>
          <button className="ssl-nav__btn ssl-nav__btn--history" onClick={() => navigate("/history")}>
            <FiClock className="ssl-nav__btn-icon" />
            <span className="ssl-nav__btn-text">ตรวจสอบประวัติ</span>
          </button>
          <button className="ssl-nav__btn ssl-nav__btn--login" onClick={() => navigate("/admin/dashboard")}>
            <FiLogIn className="ssl-nav__btn-icon" />
            <span className="ssl-nav__btn-text">สำหรับเจ้าหน้าที่</span>
          </button>
        </div>
      </nav>

      {/* ========================= PAGE 2: PARALLAX DEPTH ========================= */}
      <section ref={introRef} className="ssl-intro-register ssl-parallax-depth">
        <div className="ssl-intro-register__overlay" />

        <div className="parallax-scene">

          {/* LEFT: layers + text */}
          <div className="parallax-left">

            {/* ✅ แสดง layer เฉพาะ desktop เท่านั้น */}
            {!isMobile && (
              <>
                <img src={require("../../assets/imglayer-1.png")} className="layer l1" alt="" />
                <img src={require("../../assets/imglayer-2.png")} className="layer l2" alt="" />
                <img src={require("../../assets/layer-3.png")} className="layer l3" alt="" />
              </>
            )}

            {/* ✅ transform parallax เฉพาะ desktop */}
            <div
              className="parallax-content"
              style={!isMobile ? { transform: `translateY(${scrollY * -0.15}px)` } : {}}
            >
              <h2>
                แบบลงทะเบียน<br />
                <span>ขอเข้ารับคำปรึกษาปัญหาสุขภาพ</span>
              </h2>
              <p>
                ศูนย์รวมการลงทะเบียนขอรับคำปรึกษาทางคลินิก<br />
                โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี
              </p>
            </div>
          </div>

          {/* RIGHT: hero slider */}
          <div className="parallax-right">
            <div
              className="ssl-hero"
              // ✅ transform parallax เฉพาะ desktop
              style={!isMobile ? { transform: `translateY(${scrollY * 0.1}px)` } : {}}
              onClick={handleHeroClick}
            >
              {slides.length > 0 ? (
                <div className="ssl-hero__slider">
                  {slides.map((slide, i) => (
                    <img
                      key={i}
                      src={slide.image}
                      alt={slide.alt || `slide ${i + 1}`}
                      className={`ssl-hero__slide ${i === current ? "ssl-hero__slide--active" : ""}`}
                    />
                  ))}
                  <div className="ssl-hero__dots">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        className={`ssl-hero__dot ${i === current ? "ssl-active" : ""}`}
                        onClick={e => { e.stopPropagation(); setCurrent(i); }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="ssl-hero__placeholder">
                  <FiHeart size={48} color="rgba(255,255,255,0.5)" />
                  <p>ห่วงใยทุกสุขภาพของคุณ</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 3D Carousel Section */}
      <section
        className="sl-3d-section"
        style={{ backgroundImage: `url(${bgClinic})` }}
      >
        <div className="sl-container">
          <div className="sl-3d-viewport-wrapper">
            <div
              className="sl-3d-viewport"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {winWidth > 768 && (
                <>
                  <button className="sl-3d-nav-btn prev" onClick={handlePrev}><FiChevronLeft /></button>
                  <button className="sl-3d-nav-btn next" onClick={handleNext}><FiChevronRight /></button>
                </>
              )}

              <div className="sl-3d-carousel" style={{ transform: `rotateY(${rotation}deg)`, width: `${cardWidth}px` }}>
                {loading
                  ? <p className="ssl-cards__message">กำลังโหลดแบบประเมิน...</p>
                  : forms.length === 0
                    ? <p className="ssl-cards__message">ยังไม่มีแบบประเมินที่เปิดให้บริการในขณะนี้</p>
                    : forms.map((form, index) => {
                        const angle = (360 / formsCount) * index;
                        return (
                          <div
                            key={form.id}
                            className={`sl-3d-item ${activeIdx === index ? 'active' : ''}`}
                            style={{ transform: `rotateY(${angle}deg) translateZ(${tz}px)`, width: `${cardWidth}px` }}
                          >
                            <FormCard
                              form={form}
                              themeClass={CARD_THEMES[index % CARD_THEMES.length]}
                              count={counts[form.id] || 0}
                              isLoaded={counts[form.id] !== undefined}
                            />
                          </div>
                        );
                      })
                }
              </div>
            </div>
          </div>

          <div className="sl-3d-dots">
            {forms.map((_, i) => (
              <span
                key={i}
                className={`sl-3d-dot ${activeIdx === i ? 'active' : ''}`}
                onClick={() => {
                  const diff = i - activeIdx;
                  setRotation(prev => prev - (diff * (360 / formsCount)));
                  setActiveIdx(i);
                  resetTimer();
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="ssl-parallax ssl-parallax--contact" style={{ backgroundImage: `url(${bgContact})` }}>
        <div className="ssl-parallax__content">
          <h2>ติดต่อเรา</h2>
          <p>โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี</p>
          <p>111 ถ.มหาวิทยาลัย ต.สุรนารี อ.เมือง จ.นครราชสีมา</p>
          <p>www.suth.go.th</p>
        </div>
      </section>

      <footer className="sl-footer">
        <p>© 2569 โรงพยาบาลมหาวิทยาลัยเทคโนโลยีสุรนารี · โทร 044-376555</p>
      </footer>
    </div>
  );
}