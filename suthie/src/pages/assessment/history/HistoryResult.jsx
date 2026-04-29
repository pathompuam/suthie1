import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './HistoryResult.css';
import Navbar from '../../../components/Navbar';

import {
  getMasterCaseByIdentity,
  getCaseLogs,
  getCaseAppointments,
  updateHistoryResponse,
  getCaseAnswers,
  getFormById 
} from '../../../services/api';

import {
  FiEye, FiEyeOff, FiClock,
  FiFileText, FiUser, FiActivity,
  FiMessageSquare, FiCalendar, FiPlusCircle, FiInfo, FiX,
  FiAlertCircle,FiChevronDown, FiChevronUp
} from 'react-icons/fi';

import { FaChartBar } from 'react-icons/fa';

import { CLINIC_INFO, stripHtml, formatDate, getRiskInfo, formatAnswerValue } from './historyUtils';
import { HeroEditableField, MaskedIdField, EditableAnswerField, EditableField, Toast } from './components/HistoryWidgets';

const ExpandableText = ({ text, color }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  let formattedText = text || "";
  if (typeof formattedText === 'string') {
    formattedText = formattedText.replace(/\]\s/g, ']\n');
    formattedText = formattedText.replace(/([^\n])\s+(\d+(?:\.\d+)*\.)/g, '$1\n$2');
  }
  const lines = formattedText.split('\n');
  const isLong = lines.length > 4 || formattedText.length > 150;

  return (
    <div className="hr-expandable-container">
      <div
        className={`hr-expandable-content ${isExpanded ? 'expanded' : 'collapsed'}`}
        style={{ maxHeight: (isLong && !isExpanded) ? '100px' : 'none' }}
      >
        <div className="hr-advice-text" >
          {lines.map((line, idx) => {
            if (!line.trim()) return null;
            const match = line.trim().match(/^(\d+(?:\.\d+)*\.)/);
            let level = 0;
            let isMainHeader = false;
            let isSubHeader = false;
            if (match) {
              const numStr = match[1];
              const dotCount = (numStr.match(/\./g) || []).length;
              level = dotCount - 1;
              if (level === 0) isMainHeader = true;
              if (level > 0) isSubHeader = true;
            }
            return (
              <div key={idx} style={{
                fontWeight: isMainHeader ? '800' : (isSubHeader ? '600' : '400'),
                color: isMainHeader ? '#1e40af' : (isSubHeader ? '#0f766e' : 'inherit'),
                marginLeft: `${level * 20}px`,
                marginTop: isMainHeader && idx > 0 ? '12px' : '4px',
                fontSize: isMainHeader ? '14px' : '13.5px',
                lineHeight: '1.5'
              }}>
                {line.trim()}
              </div>
            );
          })}
        </div>
        {(isLong && !isExpanded) && <div className="hr-expandable-fade" />}
      </div>
      {isLong && (
        <button
          type="button"
          className="hr-advice-toggle-btn-new"
          style={{ color: color || 'var(--theme-green-700)' }}
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
        >
          {isExpanded ? (
            <>ย่อข้อความ <FiChevronUp size={18} /></> 
          ) : (
            <>อ่านเพิ่มเติม <FiChevronDown size={18} /></>
          )}
        </button>
      )}
    </div>
  );
};

export default function HistoryResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identity, records } = location.state || {};

  const [data, setData] = useState([]);
  const [masterCases, setMasterCases] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [showId, setShowId] = useState(false);
  const [expanded, setExpanded] = useState(null);
  
  const [activeInnerTab, setActiveInnerTab] = useState({}); 

  const [toast, setToast] = useState(null);
  const [formAnswers, setFormAnswers] = useState({});
  const [formQuestionsMap, setFormQuestionsMap] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [caseLogs, setCaseLogs] = useState([]);

  const [adviceModal, setAdviceModal] = useState({ isOpen: false, logs: [], clinicInfo: null });
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [showNewAssessMenu, setShowNewAssessMenu] = useState(false);
  const reentryRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (reentryRef.current && !reentryRef.current.contains(e.target)) setShowNewAssessMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!identity) { navigate('/history'); return; }

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getMasterCaseByIdentity(identity);

        const fetchedResponses = res.data.responses || [];
        const mCases = res.data.masterCases || [];

        setData(fetchedResponses);
        setMasterCases(mCases);

        if (fetchedResponses && fetchedResponses.length > 0) {
          const logPromises = fetchedResponses.map(c =>
            getCaseLogs(c.id, 'response')
              .then(r => r.data.map(l => ({ ...l, case_id: c.id, form_title: c.form_title, clinic_type: c.clinicType || c.clinic_type || 'general' })))
              .catch(() => [])
          );
          const logsResponses = await Promise.all(logPromises);
          const allLogs = logsResponses.flatMap(r => r || []);
          allLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setCaseLogs(allLogs);

          const masterApptPromises = mCases.map(mc =>
            getCaseAppointments(mc.id, 'master')
              .then(r => {
                const rel = fetchedResponses.find(d => d.master_case_id === mc.id);
                return r.data.map(a => ({ ...a, clinic_type: rel?.clinicType || rel?.clinic_type || mc.clinicType || 'general' }));
              })
              .catch(() => [])
          );

          const legacyResponses = fetchedResponses.filter(r => !r.master_case_id);
          const legacyApptPromises = legacyResponses.map(c =>
            getCaseAppointments(c.id, 'response')
              .then(r => r.data.map(a => ({ ...a, clinic_type: c.clinicType || c.clinic_type || 'general' })))
              .catch(() => [])
          );

          const apptsResponses = await Promise.all([...masterApptPromises, ...legacyApptPromises]);
          const allAppts = apptsResponses.flat();
          allAppts.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));
          setAppointments(allAppts);
        }

      } catch (err) {
        if (Array.isArray(records) && records.length) setData(records);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [identity, navigate, records]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const maskedId = identity ? identity.slice(0, -4).replace(/\d/g, '●') + identity.slice(-4) : '';

  const handleHeroSave = async (field, value) => {
    if (!data.length) return;
    const targetId = data[0].id;
    try {
      const res = await updateHistoryResponse(targetId, { field, value });
      handleFieldSave(targetId, field, value, res.data?.updated_at);
    } catch (err) {
      alert(`บันทึกไม่สำเร็จ: ${err?.response?.data?.message || err?.message}`);
    }
  };

  const handleFieldSave = (responseId, field, value, updatedAt) => {
    setData(prev => prev.map(item => {
      if (item.id !== responseId) return item;
      const sd = { ...item.summary_data };
      sd[field] = value;
      sd[`${field}_updated_at`] = updatedAt;
      return { ...item, summary_data: sd };
    }));
    showToast('บันทึกสำเร็จ ✓', 'success');
  };

  const loadAnswers = async (record) => {
    const id = record.id;
    
    if (record.form_id && !formQuestionsMap[record.form_id]) {
      try {
        const formRes = await getFormById(record.form_id);
        let q = formRes.data.questions;
        if (typeof q === 'string') q = JSON.parse(q);
        setFormQuestionsMap(prev => ({ ...prev, [record.form_id]: q }));
      } catch (e) {
      }
    }

    if (formAnswers[id]) return;

    try {
      const res = await getCaseAnswers(id);
      setFormAnswers(prev => ({ ...prev, [id]: res.data }));
    } catch {
      const raw = record.summary_data?.raw_answers || {};
      const arr = Object.entries(raw).map(([q, a]) => ({ question_title: q, answer_value: a }));
      setFormAnswers(prev => ({ ...prev, [id]: arr }));
    }
  };

  const toggleCard = (record) => {
    const id = record.id;
    if (expanded === id) { 
      setExpanded(null); 
    } else { 
      setExpanded(id); 
      loadAnswers(record);
      const hasScores = record.summary_data?.score_results?.length > 0;
      setActiveInnerTab(prev => ({ ...prev, [id]: hasScores ? 'scores' : 'answers' }));
    }
  };

 // --- ส่วน Loading ---
if (loading) return (
  <div className="hr-loading-screen">
    <div className="hr-loading-container">
      <div className="hr-loading-spinner">
        <div className="hr-spinner-ring"></div>
      </div>
      <div className="hr-loading-content">
        <h3 className="hr-loading-text">กำลังโหลด</h3>
      </div>
    </div>
  </div>
);


  const allNames = [...new Set(data.map(d => stripHtml(d.summary_data?.display_name)).filter(n => n && n !== '-'))];
  const allPhones = [...new Set(data.map(d => stripHtml(d.summary_data?.phone || d.summary_data?.raw_answers?.['เบอร์โทรศัพท์'] || d.summary_data?.display_phone)).filter(p => p && p !== '-'))];

  const latestName = allNames[0] || '-';
  const pastNames = allNames.slice(1);
  const latestPhone = allPhones[0] || '-';
  const pastPhones = allPhones.slice(1);

  const visitedClinics = [...new Set(data.map(d => d.clinicType || d.clinic_type || 'general'))];

  // 🟢 ปรับปรุงลอจิกการดึงข้อมูล BMI ให้สแกนหาจากคำตอบโดยตรงอย่างชาญฉลาด
  const bmiRecords = data.map(d => {
    const sd = d.summary_data || {};
    const rawAnswers = sd.raw_answers || {};
    const score = sd.score_results?.find(s => s.title?.toLowerCase().includes('bmi') || s.title?.includes('ดัชนีมวลกาย'));

    const cType = d.clinicType || d.clinic_type || 'general';
    const cInfo = CLINIC_INFO[cType] || CLINIC_INFO.general;

    if (score) {
      let weightVal = sd.weight || '-';
      let heightVal = sd.height || '-';

      // 2. สแกนหาคำว่า "น้ำหนัก" หรือ "ส่วนสูง" จาก raw_answers
      if (weightVal === '-' || heightVal === '-') {
        for (const [key, val] of Object.entries(rawAnswers)) {
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            for (const [subKey, subVal] of Object.entries(val)) {
              if (subKey.includes('น้ำหนัก') || subKey.toLowerCase().includes('weight')) weightVal = String(subVal).replace(/[^0-9.]/g, '');
              if (subKey.includes('ส่วนสูง') || subKey.toLowerCase().includes('height')) heightVal = String(subVal).replace(/[^0-9.]/g, '');
            }
          } 
          else if (typeof val === 'string' || typeof val === 'number') {
            const strVal = String(val);
            // 🟢 จัดการกรณีที่รวมมาเป็น String ก้อนเดียว (เช่น "น้ำหนัก 50 กก. | ส่วนสูง 169.8 ซม.")
            if (strVal.includes('น้ำหนัก') && strVal.includes('ส่วนสูง')) {
               const wMatch = strVal.match(/(?:น้ำหนัก|Weight)[^\d]*([\d.]+)/i);
               const hMatch = strVal.match(/(?:ส่วนสูง|Height)[^\d]*([\d.]+)/i);
               if (wMatch) weightVal = wMatch[1];
               if (hMatch) heightVal = hMatch[1];
            } else {
               if (key.includes('น้ำหนัก') || key.toLowerCase().includes('weight')) weightVal = strVal.replace(/[^0-9.]/g, '');
               if (key.includes('ส่วนสูง') || key.toLowerCase().includes('height')) heightVal = strVal.replace(/[^0-9.]/g, '');
            }
          }
        }
      }

      return {
        date: d.submitted_at, score: score.score, label: score.label, color: score.color,
        clinicColor: cInfo.color, clinicName: cInfo.text,
        weight: weightVal,
        height: heightVal
      };
    }
    return null;
  }).filter(Boolean).slice(0, 5).reverse();

  const adviceLogs = caseLogs.filter(l => l.type === 'note');
  const adviceByClinic = { teenager: [], behavior: [], sti: [], general: [] };
  adviceLogs.forEach(log => {
    const clinic = log.clinicType || log.clinic_type || 'general';
    if (adviceByClinic[clinic]) adviceByClinic[clinic].push(log);
  });

  const timelineEvents = [
    ...data.map(d => ({ type: 'form', date: new Date(d.submitted_at), data: d, clinic_type: d.clinicType || d.clinic_type || 'general' })),
    ...appointments.map(a => ({ type: 'appt', date: new Date(a.appointment_date), data: a, clinic_type: a.clinicType || a.clinic_type || 'general' }))
  ].sort((a, b) => b.date - a.date);

  const filteredTimeline = timelineEvents.filter(ev => timelineFilter === 'all' || ev.clinic_type === timelineFilter);
  const activeCases = masterCases.filter(mc => mc.status === 'Open');

  return (
    <div className="hr-page">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <Navbar showBack={true} backText="กลับค้นหา" onBack={() => navigate('/history')} />

      <div className="hr-layout">

        {/* 🟢 ส่วนหัวแฟ้มประวัติ (Hero Profile) */}
        <div className="hr-hero">
          <div className="hr-hero-grid">
            <div className="hr-avatar">{latestName !== '-' ? latestName.charAt(0).toUpperCase() : '?'}</div>
            <div className="hr-hero-info">

              <div className="hr-name-row" style={{ alignItems: 'flex-start' }}>
                <HeroEditableField value={latestName} isTitle={true} onSave={(newVal) => handleHeroSave('display_name', newVal)} />
                {pastNames.length > 0 && (
                  <div className="hr-info-icon-wrapper" style={{ marginTop: 6 }}>
                    <FiInfo size={16} />
                    <div className="hr-tooltip"><strong>เคยบันทึกชื่ออื่น:</strong><br />{pastNames.join(', ')}</div>
                  </div>
                )}
              </div>

              <div className="hr-profile-meta">
                <div className="hr-id-pill">
                  <FiUser size={12} color="rgba(255,255,255,0.8)" />
                  <span className="hr-id-value">{showId ? identity : maskedId}</span>
                  <button className="hr-id-toggle" onClick={() => setShowId(!showId)}>
                    {showId ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                  </button>
                </div>

                <div className="hr-id-pill" style={{ padding: '4px 10px', gap: 4 }}>
                  <HeroEditableField value={latestPhone} type="tel" icon="phone" onSave={(newVal) => handleHeroSave('phone', newVal)} />
                  {pastPhones.length > 0 && (
                    <div className="hr-info-icon-wrapper" style={{ marginLeft: 4 }}>
                      <FiInfo size={14} color="rgba(255,255,255,0.7)" />
                      <div className="hr-tooltip"><strong>เบอร์โทรอื่นในระบบ:</strong><br />{pastPhones.join(', ')}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="hr-clinic-badges" style={{ marginTop: 12 }}>
                {Object.values(CLINIC_INFO).filter(c => c.id !== 'general' || visitedClinics.includes('general')).map(clinic => {
                  const isVisited = visitedClinics.includes(clinic.id);
                  return (
                    <span key={clinic.id} className="hr-badge-clinic"
                      style={isVisited ? { backgroundColor: clinic.bg, color: clinic.color, border: `1px solid ${clinic.border}` }
                        : { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', border: '1px dashed rgba(255,255,255,0.3)' }}>
                      {isVisited ? '✓ ' : ''}{clinic.text}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="hr-hero-actions" ref={reentryRef}>
              <div className="hr-reentry-wrapper">
                <button className="hr-btn-new-assess" onClick={() => setShowNewAssessMenu(!showNewAssessMenu)}>
                  <FiPlusCircle size={16} /> เริ่มการประเมินใหม่ ▾
                </button>
                {showNewAssessMenu && (
                  <div className="hr-reentry-menu">
                    <div className="hr-reentry-header">เลือกแผนกเพื่อเข้ารับการประเมิน</div>
                    {Object.values(CLINIC_INFO).filter(c => c.id !== 'general').map(c => (
                      <button key={c.id} className="hr-reentry-item" onClick={() => navigate('/', { state: { targetClinic: c.id, prefillIdentity: identity } })}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: c.color, marginRight: 10 }}></div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{c.text}</span>
                      </button>
                    ))}
                    <button className="hr-reentry-item" onClick={() => navigate('/')} style={{ borderTop: '1px solid var(--gray-100)' }}>
                      <span style={{ fontSize: 13, color: 'var(--gray-500)', paddingLeft: 22 }}>ดูแบบฟอร์มทั้งหมด</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {activeCases.length > 0 && (
          <div className="hr-active-cases-grid">
            {activeCases.map(mc => {
              const relatedResponse = data.find(d => d.master_case_id === mc.id);
              const actualClinicType = mc.clinicType || mc.clinic_type || relatedResponse?.clinicType || relatedResponse?.clinic_type || 'general';
              const cInfo = CLINIC_INFO[actualClinicType] || CLINIC_INFO.general;
              const upcomingAppt = appointments.find(a => a.master_case_id === mc.id && new Date(a.appointment_date) > new Date());
              const currentStatus = relatedResponse?.status || "รอติดต่อ (รอดำเนินการ)";

              return (
                <div key={mc.id} className="hr-active-case-card" style={{ border: `2px solid ${cInfo.color}` }}>
                  <div className="hr-active-case-info-wrap">
                    <div className="hr-active-case-icon" style={{ backgroundColor: cInfo.bg }}>
                      <FiAlertCircle size={22} color={cInfo.color} />
                    </div>
                    <div>
                      <h3 className="hr-active-case-title">การรักษาปัจจุบัน: {cInfo.text}</h3>
                      <p className="hr-active-case-status">
                        สถานะ: <strong>{currentStatus}</strong>
                        <span className="hr-active-case-id">(MC-{String(mc.id).padStart(4, '0')})</span>
                      </p>
                    </div>
                  </div>

                  {upcomingAppt && (
                    <div className="hr-upcoming-appt-box">
                      <FiCalendar size={20} color="#ea580c" style={{ flexShrink: 0 }} />
                      <div>
                        <div className="hr-upcoming-appt-title">
                          นัดหมายครั้งถัดไป {upcomingAppt.service_name ? `(${upcomingAppt.service_name})` : ''}
                        </div>
                        <div className="hr-upcoming-appt-date">
                          {formatDate(upcomingAppt.appointment_date)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 🟢 แนวโน้ม BMI และคำแนะนำ */}
        {(bmiRecords.length > 0 || adviceLogs.length > 0) && (
          <div className="hr-dashboard-grid" style={{ marginTop: activeCases.length > 0 ? '20px' : '40px' }}>

            {bmiRecords.length > 0 && (
              <div className="hr-widget">
                <div className="hr-widget-header">
                  <div className="hr-widget-title">
                    <FiActivity size={18} color="var(--theme-orange-500)" />
                    <h3>แนวโน้มสุขภาพ (BMI)</h3>
                  </div>
                  <span className="hr-widget-subtitle">จากทุกคลินิก</span>
                </div>
                <div className="hr-widget-body">
                  <div className="hr-trend-chart">
                    {bmiRecords.map((b, i) => {
                      const heightPct = Math.min((b.score / 40) * 100, 100);

                      // 🟢 ไม่ต้อง Replace ข้อมูลแล้ว เพราะเราสกัดเอาเฉพาะตัวเลขมาแล้วตั้งแต่ด้านบน
                      const displayWeight = b.weight;
                      const displayHeight = b.height;

                      return (
                        <div key={i} className="hr-trend-bar-wrapper">
                          <div className="hr-trend-bar" style={{ height: `${heightPct}%`, backgroundColor: b.color }}>
                            <span className="hr-trend-val" style={{ color: b.color }}>{b.score}</span>
                          </div>
                          <div className="hr-trend-date">{new Date(b.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</div>

                          {/* 🟢 แยกบรรทัดน้ำหนักและส่วนสูงให้ชัดเจน */}
                          <div className="hr-trend-wh">
                            <span style={{ display: 'block' }}>{displayWeight && displayWeight !== '-' ? `${displayWeight} kg` : '-'}</span>
                            <span style={{ display: 'block', color: '#94a3b8' }}>{displayHeight && displayHeight !== '-' ? `${displayHeight} cm` : '-'}</span>
                          </div>

                          <div className="hr-trend-clinic-dot" style={{ backgroundColor: b.clinicColor, marginTop: '4px' }} title={b.clinicName}></div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {adviceLogs.length > 0 && (
              <div className="hr-widget">
                <div className="hr-widget-header">
                  <div className="hr-widget-title">
                    <FiMessageSquare size={18} color="var(--theme-green-700)" />
                    <h3>คำแนะนำจากผู้เชี่ยวชาญ</h3>
                  </div>
                </div>
                <div className="hr-widget-body hr-advice-scroll">
                  {Object.entries(adviceByClinic).map(([clinicId, logs]) => {
                    if (logs.length === 0) return null;
                    const latestLog = logs[0];
                    const cInfo = CLINIC_INFO[clinicId] || CLINIC_INFO.general;

                    return (
                      <div key={clinicId} className="hr-advice-stack-card" style={{ backgroundColor: cInfo.bg, borderColor: cInfo.border }}>
                        <div className="hr-advice-clinic-name" style={{ color: cInfo.color }}>{cInfo.text}</div>
                        <div className="hr-advice-item" style={{ borderLeftColor: cInfo.color, backgroundColor: 'rgba(255,255,255,0.7)' }}>
                          <ExpandableText text={latestLog.detail} color={cInfo.color} />
                          <div className="hr-advice-meta" style={{ marginTop: '8px' }}>
                            — {latestLog.staff} ({new Date(latestLog.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})
                          </div>
                        </div>
                        
                        <button className="hr-advice-expand-btn" style={{ color: cInfo.color }} onClick={() => setAdviceModal({ isOpen: true, logs: logs, clinicInfo: cInfo })}>
                          ดูประวัติคำแนะนำทั้งหมด ({logs.length})
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="hr-section-label" style={{ marginTop: 40, marginBottom: 12 }}>
          <div className="hr-section-dot" /> ประวัติการเข้ารับบริการ (ไทม์ไลน์)
        </div>

        <div className="hr-timeline-filter">
          <button className={`hr-filter-btn ${timelineFilter === 'all' ? 'active' : ''}`} onClick={() => setTimelineFilter('all')}>
            ทั้งหมด ({timelineEvents.length})
          </button>
          {Object.values(CLINIC_INFO).filter(c => visitedClinics.includes(c.id)).map(c => {
            const count = timelineEvents.filter(ev => ev.clinic_type === c.id).length;
            if (count === 0) return null;
            return (
              <button key={c.id}
                className={`hr-filter-btn ${timelineFilter === c.id ? 'active' : ''}`}
                style={timelineFilter === c.id ? { backgroundColor: c.color, borderColor: c.color, color: 'white' } : {}}
                onClick={() => setTimelineFilter(c.id)}
              >
                {c.text} ({count})
              </button>
            );
          })}
        </div>

        {/* 🟢 ไทม์ไลน์ประวัติ */}
        <div className="hr-timeline">
          {filteredTimeline.length === 0 && (
            <div className="hr-empty-state" style={{ padding: '40px 0' }}>
              <FiFileText size={40} color="var(--gray-300)" />
              <p>ไม่มีประวัติในหมวดหมู่นี้</p>
            </div>
          )}

          {filteredTimeline.map((event, idx) => {
            const cInfo = CLINIC_INFO[event.clinic_type] || CLINIC_INFO.general;

            if (event.type === 'appt') {
              const appt = event.data;
              return (
                <div key={`appt-${appt.id || idx}`} className="hr-timeline-item">
                  <div className="hr-timeline-marker appt-marker" style={{ backgroundColor: '#f97316', borderColor: '#fff7ed' }}>
                    <FiCalendar size={10} color="white" />
                  </div>
                  <div className="hr-appt-card" style={{ borderColor: '#fdba74', backgroundColor: '#fff7ed', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="hr-appt-icon-box" style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px' }}>
                        <FiCalendar size={20} color="#ea580c" />
                      </div>
                      <div className="hr-appt-content">
                        <div style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '16px' }}>นัดหมายเข้ารับบริการ</div>
                        <div style={{ color: '#431407', fontSize: '15px', marginTop: '4px' }}>
                          วันที่ <strong>{formatDate(appt.appointment_date)}</strong>
                        </div>
                        {appt.note && <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>หมายเหตุ: {appt.note}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            const record = event.data;
            const sd = record.summary_data || {};
            const scoreResults = sd.score_results || [];
            const risk = getRiskInfo(scoreResults);
            const isOpen = expanded === record.id;
            const answers = formAnswers[record.id] || [];

            const rawAnswers = sd.raw_answers || {};
            const rawArr = Object.entries(rawAnswers)
              .filter(([q]) => !['เลขบัตรประชาชน', 'ชื่อ-นามสกุล', 'น้ำหนัก (กก.)', 'ส่วนสูง (ซม.)', 'เบอร์โทรศัพท์'].includes(q))
              .map(([q, a]) => ({ question_title: q, answer_value: a }));

            const allAnswers = Array.isArray(answers) && answers.length > 0 ? answers : rawArr;

            const hasWeight = sd.weight !== undefined || rawAnswers['น้ำหนัก (กก.)'] !== undefined;
            const hasHeight = sd.height !== undefined || rawAnswers['ส่วนสูง (ซม.)'] !== undefined;
            const hasPhone = sd.phone !== undefined || rawAnswers['เบอร์โทรศัพท์'] !== undefined;
            
            const formQs = formQuestionsMap[record.form_id] || [];
            const currentTab = activeInnerTab[record.id] || 'answers';

            // 🟢 หาคำถามที่ถูกตั้งค่าให้อนุญาตให้แก้ได้จาก Form Builder
            const editableQuestions = allAnswers.filter(ans => {
              const qLabel = stripHtml(ans.question_title || '');
              const qDef = formQs.find(q => stripHtml(q.title) === qLabel);
              return qDef?.isEditable === true;
            });

            return (
              <div key={`form-${record.id}`} className="hr-timeline-item">
                <div className="hr-timeline-marker" style={{ backgroundColor: cInfo.color, borderColor: cInfo.bg }}></div>
                <div className={`hr-card ${isOpen ? 'is-open' : ''}`} style={isOpen ? { borderColor: cInfo.color } : {}}>
                  <div className="hr-card-head" onClick={() => toggleCard(record)}>
                    <div className="hr-card-left">
                      <div>
                        <div className="hr-card-title">{stripHtml(record.form_title || `ฟอร์ม #${record.form_id}`)}</div>
                        <div className="hr-card-date">
                          <FiClock size={11} />
                          {formatDate(record.submitted_at)}
                          <span style={{ marginLeft: 8, padding: '2px 6px', background: cInfo.bg, color: cInfo.color, borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                            {cInfo.text}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="hr-card-right">
                      <span className="hr-risk-tag" style={{ color: risk.color, background: risk.bg }}>● {risk.label}</span>
                      <span className={`hr-chevron ${isOpen ? 'open' : ''}`}>▾</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="hr-detail">
                      <div className="hr-divider" style={{ margin: 0 }} />

                      {/* 🟢 TABS ควบคุมข้อมูลในกล่อง */}
                      <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        {scoreResults.length > 0 && (
                          <button 
                            onClick={() => setActiveInnerTab(prev => ({ ...prev, [record.id]: 'scores' }))}
                            style={{ 
                              padding: '6px 12px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                              background: currentTab === 'scores' ? '#ffffff' : 'transparent',
                              color: currentTab === 'scores' ? '#2563eb' : '#64748b',
                              boxShadow: currentTab === 'scores' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                          >
                            <FaChartBar /> ผลประเมิน
                          </button>
                        )}
                        <button 
                          onClick={() => setActiveInnerTab(prev => ({ ...prev, [record.id]: 'answers' }))}
                          style={{ 
                            padding: '6px 12px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                            background: currentTab === 'answers' ? '#ffffff' : 'transparent',
                            color: currentTab === 'answers' ? '#10b981' : '#64748b',
                            boxShadow: currentTab === 'answers' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          <FiFileText /> คำตอบฟอร์ม
                        </button>
                        <button 
                          onClick={() => setActiveInnerTab(prev => ({ ...prev, [record.id]: 'editable' }))}
                          style={{ 
                            padding: '6px 12px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
                            background: currentTab === 'editable' ? '#ffffff' : 'transparent',
                            color: currentTab === 'editable' ? '#f59e0b' : '#64748b',
                            boxShadow: currentTab === 'editable' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          <FiUser /> ข้อมูลบุคคล
                        </button>
                      </div>

                      {/* 🟢 เนื้อหาของ TABS */}
                      <div style={{ padding: '20px' }}>
                        
                        {currentTab === 'scores' && scoreResults.length > 0 && (
                          <div className="hr-score-strip" style={{ padding: 0, border: 'none' }}>
                            {scoreResults.map((s, i) => (
                              <div key={i} className="hr-score-chip" style={{ borderColor: s.color || '#e2e8f0' }}>
                                <span className="hr-score-big" style={{ color: s.color || '#334155' }}>{s.score}</span>
                                <span className="hr-score-title">{stripHtml(s.title || '').substring(0, 28)}</span>
                                <div className="hr-score-lbl" style={{ color: s.color, background: `${s.color}18` }}>
                                  <span style={{ color: s.color }}>{stripHtml(s.label)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 🟢 TAB: ข้อมูลบุคคล (แยกฟอร์มที่แก้ได้มาไว้ที่นี่) */}
                        {currentTab === 'editable' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="hr-fields-grid">
                              <EditableField responseId={record.id} field="display_name" label="ชื่อ-นามสกุล" value={sd.display_name} updatedAt={sd.display_name_updated_at} icon="user" onSave={(f, v, t) => handleFieldSave(record.id, f, v, t)} />
                              {hasPhone && <EditableField responseId={record.id} field="phone" label="เบอร์โทรศัพท์" value={sd.phone || rawAnswers['เบอร์โทรศัพท์']} updatedAt={sd.phone_updated_at} type="tel" icon="phone" onSave={(f, v, t) => handleFieldSave(record.id, f, v, t)} />}
                              {hasWeight && <EditableField responseId={record.id} field="weight" label="น้ำหนัก (กก.)" value={String(sd.weight || rawAnswers['น้ำหนัก (กก.)'] || '')} updatedAt={sd.weight_updated_at} type="number" icon="weight" onSave={(f, v, t) => handleFieldSave(record.id, f, v, t)} />}
                              {hasHeight && <EditableField responseId={record.id} field="height" label="ส่วนสูง (ซม.)" value={String(sd.height || rawAnswers['ส่วนสูง (ซม.)'] || '')} updatedAt={sd.height_updated_at} type="number" icon="ruler" onSave={(f, v, t) => handleFieldSave(record.id, f, v, t)} />}
                            </div>

                            {/* 🟢 แสดงคำตอบที่ถูกตั้งให้แก้ได้ */}
                            {editableQuestions.length > 0 && (
                              <div className="hr-answers-list" style={{ marginTop: '16px' }}>
                                <div className="hr-group-title" style={{ marginTop: '0', marginBottom: '12px' }}>
                                  <FiFileText size={12} color="var(--gray-400)" /> ข้อมูลจากฟอร์มที่อนุญาตให้แก้ไขได้
                                </div>
                                {editableQuestions.map((ans, i) => {
                                  const questionLabel = stripHtml(ans.question_title || `ข้อ ${i + 1}`);
                                  return (
                                    <EditableAnswerField 
                                      key={ans.question_id || `edit_${i}`} 
                                      responseId={record.id} 
                                      questionId={ans.question_id} 
                                      questionLabel={questionLabel} 
                                      answerValue={ans.answer_value} 
                                      type="text" 
                                      onSave={async (qid, newVal) => { 
                                        try {
                                           await updateHistoryResponse(record.id, { 
                                              field: 'custom_answer', 
                                              question_title: questionLabel, 
                                              value: newVal,
                                              question_id: qid
                                           });
                                        } catch(err) {  }
                    
                                        setFormAnswers(prev => { 
                                          const updated = (prev[record.id] || []).map(a => 
                                             (a.question_id === qid || a.question_title === ans.question_title) 
                                             ? { ...a, answer_value: newVal } 
                                             : a
                                          ); 
                                          return { ...prev, [record.id]: updated }; 
                                        }); 
                                        
                                        setData(prevData => prevData.map(item => {
                                          if (item.id === record.id) {
                                             const sd = { ...item.summary_data };
                                             if (sd.raw_answers && sd.raw_answers[questionLabel] !== undefined) {
                                                sd.raw_answers[questionLabel] = newVal;
                                             }
                                             return { ...item, summary_data: sd };
                                          }
                                          return item;
                                        }));
                    
                                        showToast('บันทึกสำเร็จ ✓', 'success'); 
                                      }} 
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 🟢 TAB: คำตอบฟอร์ม (ดูอย่างเดียว เรียงเหมือนเดิม 100%) */}
                        {currentTab === 'answers' && allAnswers.length > 0 && (
                          <div className="hr-answers-list">
                            {allAnswers.map((ans, i) => {
                              const questionLabel = stripHtml(ans.question_title || `ข้อ ${i + 1}`);
                              let displayAns = formatAnswerValue(ans.answer_value);
                              
                              const scoreObj = scoreResults.find(sr => stripHtml(sr.title) === stripHtml(questionLabel));

                              let isTableData = false;
                              if (ans.answer_value && typeof ans.answer_value === 'object' && !Array.isArray(ans.answer_value)) {
                                isTableData = true;
                              }

                              const isIdCard = ['บัตรประชาชน', 'เลขบัตร', 'รหัสบัตร', 'citizen', 'national id'].some(k => questionLabel.toLowerCase().includes(k));

                              if (isIdCard) {
                                return (
                                  <div key={i} className="hr-answer-row">
                                    <div className="hr-answer-q-wrap" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                                      <span className="hr-answer-num">{i + 1}</span>
                                      <span className="hr-answer-q">{questionLabel}</span>
                                      <span className="hr-answer-sep">→</span>
                                    </div>
                                    <div style={{ flex: 1.5, display: 'flex', alignItems: 'center' }}>
                                      <MaskedIdField value={formatAnswerValue(ans.answer_value)} />
                                    </div>
                                  </div>
                                );
                              }

                              // วาดตาราง (เหมือนเดิม)
                              if (isTableData) {
                                const qDef = formQs.find(q => stripHtml(q.title) === stripHtml(questionLabel));
                                
                                return (
                                  <div key={i} className="hr-answer-row has-table" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div className="hr-answer-q-wrap" style={{ marginBottom: '10px' }}>
                                      <span className="hr-answer-num">{i + 1}</span>
                                      <span className="hr-answer-q" style={{ fontWeight: 'bold' }}>{questionLabel}</span>
                                    </div>
                                    <div className="hr-table-container">
                                      <table className="hr-table">
                                        <tbody>
                                          {Object.entries(ans.answer_value).map(([rowKey, rowValue], idx) => {
                                            let displayRowTitle = rowKey;
                                            if (!isNaN(rowKey)) {
                                                if (qDef && qDef.rows && qDef.rows[rowKey]) {
                                                    displayRowTitle = stripHtml(qDef.rows[rowKey]);
                                                } else {
                                                    displayRowTitle = `แถวที่ ${Number(rowKey) + 1}`;
                                                }
                                            }

                                            return (
                                              <tr key={idx}>
                                                <td className="hr-table-label">{displayRowTitle}</td>
                                                <td className="hr-table-value">
                                                  {Array.isArray(rowValue) ? rowValue.join(', ') : String(rowValue)}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* แทรกคะแนนด้านล่างตาราง */}
                                    {scoreObj && (
                                      <div style={{
                                        marginTop: '12px',
                                        padding: '10px 14px',
                                        background: `${scoreObj.color}15` || '#f1f5f9',
                                        borderLeft: `4px solid ${scoreObj.color || '#94a3b8'}`,
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                      }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '18px', color: scoreObj.color || '#334155' }}>
                                          {scoreObj.score}
                                        </div>
                                        <div style={{ fontSize: '13.5px', color: '#475569' }}>
                                          <strong>ผลประเมินย่อย: </strong> {stripHtml(scoreObj.label)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              // 🟢 คำตอบธรรมดาแบบ Read-only ล้วน (ไม่มี EditableAnswerField โผล่ที่นี่แล้ว)
                              return (
                                <div key={i} className="hr-answer-row">
                                  <div className="hr-answer-q-wrap" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                                    <span className="hr-answer-num">{i + 1}</span>
                                    <span className="hr-answer-q">{questionLabel}</span>
                                    <span className="hr-answer-sep">→</span>
                                  </div>
                                  <span className="hr-answer-v">{displayAns}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="hr-case-footer">
                        <span className="hr-case-id-tag"># RES-{String(record.id).padStart(4, '0')}</span>
                        <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>ส่งเมื่อ {formatDate(record.submitted_at)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {adviceModal.isOpen && (
        <div className="hr-modal-overlay" onClick={() => setAdviceModal({ isOpen: false, logs: [], clinicInfo: null })}>
          <div className="hr-modal-card" onClick={e => e.stopPropagation()}>
            <div className="hr-modal-header">
              <h3><FiMessageSquare color={adviceModal.clinicInfo?.color} /> ประวัติคำแนะนำ ({adviceModal.clinicInfo?.text})</h3>
              <button className="hr-modal-close-btn" onClick={() => setAdviceModal({ isOpen: false, logs: [], clinicInfo: null })}><FiX size={18} /></button>
            </div>
            <div className="hr-modal-body">
              {adviceModal.logs.map((log, idx) => (
                <div key={log.id || idx} className="hr-advice-item" style={{ borderLeftColor: adviceModal.clinicInfo?.color, backgroundColor: adviceModal.clinicInfo?.bg }}>
                  <ExpandableText text={log.detail} color={adviceModal.clinicInfo?.color} />
                  <div className="hr-advice-meta" style={{ marginTop: '8px' }}>— {log.staff} ({new Date(log.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })})</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}