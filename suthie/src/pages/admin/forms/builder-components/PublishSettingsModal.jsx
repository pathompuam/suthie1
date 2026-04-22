import React from 'react';
import { FaCog, FaTimes } from 'react-icons/fa';

const PublishSettingsModal = ({ 
  isOpen, onClose, 
  formStatus, setFormStatus, 
  clinicType, setClinicType, 
  formType, setFormType, // 🟢 รับ Props formType
  isScheduled, setIsScheduled, 
  publishStartDate, setPublishStartDate, 
  publishEndDate, setPublishEndDate 
}) => {
  if (!isOpen) return null;

  return (
    <div className="sfb-modal-overlay">
      <div className="sfb-modal-content" style={{ position: 'relative', maxWidth: '500px', padding: '24px', background: 'white', borderRadius: '12px' }}>
        <button
    onClick={onClose}
    style={{
      position: 'absolute',
      top: '12px',
      right: '12px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: '18px',
      color: '#64748b'
    }}
  >
    <FaTimes />
  </button>

        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
          <FaCog color="#64748b" /> ตั้งค่าฟอร์มและการเผยแพร่
        </h3>
        
        <div className="sfb-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 🟢 1. เลือกประเภทฟอร์ม (Registration / Follow-up) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14.5px', color: '#0f172a' }}>ประเภทของฟอร์ม</label>
            <select value={formType} onChange={e => setFormType(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14.5px', outline: 'none' }}>
              <option value="Registration">📝 ฟอร์มลงทะเบียนแรกเข้า</option>
              <option value="Follow-up">🔄 แบบประเมินติดตามผล</option>
            </select>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              * ฟอร์มลงทะเบียนจะสร้างเคสใหม่เสมอ ส่วนฟอร์มติดตามผลจะเชื่อมกับเคสเดิม
            </p>
          </div>

          {/* 2. เลือกคลินิก */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14.5px', color: '#0f172a' }}>ประเภทคลินิก</label>
            <select value={clinicType} onChange={e => setClinicType(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14.5px', outline: 'none' }}>
              <option value="general">ทั่วไป (ใช้ร่วมกัน)</option>
              <option value="teenager">คลินิกวัยรุ่น</option>
              <option value="behavior">คลินิกLSM</option>
              <option value="sti">คลินิกโรคติดต่อฯ</option>
            </select>
          </div>

          {/* 3. สถานะฟอร์ม */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14.5px', color: '#0f172a' }}>สถานะฟอร์มปัจจุบัน</label>
            <select value={formStatus} onChange={e => setFormStatus(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14.5px', outline: 'none' }}>
              <option value="draft">ฉบับร่าง (ยังไม่เผยแพร่)</option>
              <option value="published">เผยแพร่ (พร้อมใช้งาน)</option>
            </select>
          </div>

          {/* 4. ตั้งเวลาเปิด-ปิด */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14.5px', color: '#0f172a' }}>
              <input type="checkbox" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#1967d2' }} />
              ตั้งเวลาเปิด-ปิดฟอร์มล่วงหน้า
            </label>
            
            {isScheduled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '26px', borderLeft: '2px solid #1967d2', animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#475569' }}>เริ่มเปิดรับข้อมูลตั้งแต่เวลา:</label>
                  <input type="datetime-local" value={publishStartDate} onChange={e => setPublishStartDate(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#475569' }}>ปิดรับข้อมูลอัตโนมัติเมื่อถึงเวลา:</label>
                  <input type="datetime-local" value={publishEndDate} onChange={e => setPublishEndDate(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="sfb-modal-footer" style={{ marginTop: '24px' }}>
          <button 
            className="sfb-btn-cancel" 
            onClick={onClose} 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#1967d2', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '15px' }}
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishSettingsModal;