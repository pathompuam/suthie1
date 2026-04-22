import React from "react";
import { FaExchangeAlt, FaStickyNote, FaUserCircle } from "react-icons/fa";
import { FiCalendar } from "react-icons/fi";

export default function CaseHistoryTab({ groupedLogs, renderLogDetail }) {
  return (
    <div className="cdm-hist-container">
      {Object.keys(groupedLogs).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>ยังไม่มีประวัติการติดตาม</div>
      ) : (
        Object.entries(groupedLogs).map(([dateStr, logs]) => (
          <div key={dateStr} className="cdm-hist-date-section">
            <div className="cdm-hist-date-divider">
              <span className="cdm-hist-date-badge">{dateStr}</span>
            </div>
            <div className="cdm-hist-items-wrapper">
              {logs.map(log => {
                let IconCmp = FaStickyNote;
                let typeLabel = "บันทึกข้อความ";
                let dotClass = "note";
                if (log.type === 'status') {
                  IconCmp = FaExchangeAlt; typeLabel = "อัปเดตสถานะ"; dotClass = "status";
                } else if (log.type === 'appoint') {
                  IconCmp = FiCalendar; typeLabel = "นัดหมาย"; dotClass = "appoint";
                }
                return (
                  <div key={log.id} className="cdm-hist-item">
                    <div className={`cdm-hist-icon ${dotClass}`}><IconCmp /></div>
                    <div className="cdm-hist-card">
                      <div className="cdm-hist-card-header">
                        <div className="cdm-hist-time-label">
                          <span className="cdm-time">{log.date.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })} น.</span>
                          <span className={`cdm-type-badge ${dotClass}`}>{typeLabel}</span>
                        </div>
                        <span className="cdm-hist-staff-badge"><FaUserCircle /> {log.staff}</span>
                      </div>
                      <div className="cdm-hist-card-body">
                        {renderLogDetail(log.detail)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}