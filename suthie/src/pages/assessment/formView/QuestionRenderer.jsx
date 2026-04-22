import React from 'react';
import { FiRefreshCw, FiCheck, FiXCircle } from 'react-icons/fi';
import { formatThaiID, validateThaiID, formatPhoneNumber } from './formUtils';

const QuestionRenderer = ({
  q,
  index,
  answers,
  errors,
  verifiedIdentity,
  optionInputValues,
  handleClearQuestionAnswer,
  handleAnswer,
  handleOptionInputChange,
  handleGridAnswer
}) => {

  // กรณีเป็นคำถามกลุ่ม (Group)
  if (q.type === 'group') {
    const subs = q.subQuestions || [];
    return (
      <div id={`question-${q.id}`} className="preview-group-wrapper" style={{ animationDelay: `${index * 0.05}s` }}>
        <div className="preview-group-header">
          <h3 className="preview-sec__title" dangerouslySetInnerHTML={{ __html: q.title || 'กลุ่มคำถาม' }} />
          {q.text && <div className="preview-hint" dangerouslySetInnerHTML={{ __html: q.text }} />}
        </div>
        <div className="preview-group-body">
          {subs.map((sq, sIdx) => {
            const displayTitle = `<span style="color: var(--theme-color); margin-right: 4px;">${sIdx + 1}.</span> ${sq.title || ''}`;
            return (
              <QuestionRenderer
                key={sq.id}
                q={{ ...sq, title: displayTitle, isSubQuestion: true }}
                index={sIdx}
                answers={answers}
                errors={errors}
                verifiedIdentity={verifiedIdentity}
                optionInputValues={optionInputValues}
                handleClearQuestionAnswer={handleClearQuestionAnswer}
                handleAnswer={handleAnswer}
                handleOptionInputChange={handleOptionInputChange}
                handleGridAnswer={handleGridAnswer}
              />
            );
          })}
        </div>
      </div>
    );
  }

  const ans = answers[q.id];
  const hasError = !!errors[q.id];

  // เช็คว่าข้อนี้ถูกตอบไปหรือยัง
  let hasAnswer = false;
  if (q.type === 'checkboxes') {
    hasAnswer = ans && ans.length > 0;
  } else if (q.type === 'grid_multiple' || q.type === 'grid_checkbox') {
    if (ans) {
      const answeredRowsCount = Object.keys(ans).filter(rowIndex => {
        if (q.type === 'grid_checkbox') return ans[rowIndex] && ans[rowIndex].length > 0;
        return !!ans[rowIndex];
      }).length;
      hasAnswer = answeredRowsCount > 0;
    }
  } else if (q.type === 'bmi') {
    hasAnswer = ans && (ans.weight || ans.height);
  } else {
    hasAnswer = !!ans && String(ans).trim() !== '';
  }

  return (
    <div id={`question-${q.id}`} className={`preview-sec ${hasError ? 'preview-sec--error' : ''} ${q.isSubQuestion ? 'preview-sec--sub' : ''}`} style={{ animationDelay: `${index * 0.05}s` }}>
      
      <div className="preview-sec__head_wrap">
        <div style={{ flex: 1 }}>
          <h3 className="preview-sec__title" dangerouslySetInnerHTML={{ __html: q.title || 'คำถามที่ไม่มีชื่อ' }} />
          {q.required && <span className="req">*</span>}
          {q.hasDescription && q.text && <div className="preview-hint" dangerouslySetInnerHTML={{ __html: q.text }} />}
        </div>
        
        {hasAnswer && !(q.type === 'national_id' && verifiedIdentity) && (
          <button 
            type="button" 
            className="clear-question-btn" 
            onClick={() => handleClearQuestionAnswer(q.id)}
            title="ล้างคำตอบข้อนี้"
          >
            <FiRefreshCw /> ล้างคำตอบ
          </button>
        )}
      </div>

      <div className="preview-sec__body">
        {q.image && <div className="preview-q-img"><img src={q.image} alt="question" /></div>}

        {(q.type === 'short_text' || q.type === 'full_name') && (
          <input type="text" className={`preview-input ${hasError ? 'preview-input--error' : ''}`} placeholder="คำตอบของคุณ" value={ans || ''} onChange={(e) => handleAnswer(q.id, e.target.value)} />
        )}
        
        {(q.type === 'paragraph' || q.type === 'main_issue') && (
          <textarea className={`preview-input ${hasError ? 'preview-input--error' : ''}`} placeholder="คำตอบของคุณ" rows="4" value={ans || ''} onChange={(e) => handleAnswer(q.id, e.target.value)}></textarea>
        )}
        
        {q.type === 'phone_number' && (
          <input type="tel" className={`preview-input ${hasError ? 'preview-input--error' : ''}`} placeholder="0xx-xxx-xxxx" value={ans || ''} onChange={(e) => handleAnswer(q.id, formatPhoneNumber(e.target.value))} maxLength={12} />
        )}
        
        {q.type === 'date' && (
          <input type="date" className={`preview-input ${hasError ? 'preview-input--error' : ''}`} value={ans || ''} onChange={(e) => handleAnswer(q.id, e.target.value)} />
        )}

        {q.type === 'bmi' && (() => {
          const bmiAns = ans || { weight: '', height: '' };
          return (
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ fontSize: '14px', color: '#5f6368', marginBot: '6px', display: 'block', fontWeight: 600 }}>น้ำหนัก (กิโลกรัม)</label>
                <input type="number" step="0.1" min="0" className={`preview-input ${hasError ? 'preview-input--error' : ''}`} placeholder="เช่น 65.5" value={bmiAns.weight || ''} onChange={(e) => handleAnswer(q.id, { ...bmiAns, weight: e.target.value })} />
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ fontSize: '14px', color: '#5f6368', marginBot: '6px', display: 'block', fontWeight: 600 }}>ส่วนสูง (เซนติเมตร)</label>
                <input type="number" step="0.1" min="0" className={`preview-input ${hasError ? 'preview-input--error' : ''}`} placeholder="เช่น 170" value={bmiAns.height || ''} onChange={(e) => handleAnswer(q.id, { ...bmiAns, height: e.target.value })} />
              </div>
            </div>
          );
        })()}

        {q.type === 'national_id' && (() => {
          const val = answers[q.id] || '';
          const isFullLength = val.length === 17;
          const isValid = isFullLength ? validateThaiID(val) : true;
          const isLocked = !!verifiedIdentity; 
          
          return (
            <div className="national-id-wrapper">
              <input 
                type="text" 
                className={`preview-input id-mask-input ${(hasError || (!isValid && !isLocked)) ? 'preview-input--error' : ''}`} 
                placeholder="x-xxxx-xxxxx-xx-x" 
                value={val} 
                onChange={(e) => {
                  if (!isLocked) handleAnswer(q.id, formatThaiID(e.target.value))
                }} 
                maxLength={17} 
                disabled={isLocked}
                style={isLocked ? { backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', opacity: 0.8 } : {}}
              />
              {isLocked && (
                <div style={{ fontSize: '12.5px', color: '#2563eb', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                  <FiCheck /> ดึงข้อมูลจากประวัติเดิมอัตโนมัติ (เชื่อมโยงเคสแล้ว)
                </div>
              )}
              {isFullLength && !isValid && !isLocked && <div className="error-msg"><FiXCircle style={{ display: 'inline', transform: 'translateY(2px)' }} /> เลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง</div>}
            </div>
          );
        })()}

        {q.type === 'multiple_choice' && (
          <div className="preview-chip-col">
            {q.options.map((opt, i) => {
              const isSelected = ans === opt;
              const showInput = q.optionHasInput?.[i] === true;
              
              return (
                <div key={i} className="preview-option-wrapper">
                  <label className={`preview-chip ${isSelected ? 'active' : ''}`}>
                    <input type="radio" name={`q-${q.id}`} checked={isSelected} onChange={() => handleAnswer(q.id, opt)} />
                    <span dangerouslySetInnerHTML={{ __html: opt }} />
                  </label>
                  
                  {isSelected && showInput && (
                    <div style={{ marginLeft: '30px', animation: 'fadeIn 0.2s ease-out' }}>
                      <input 
                        type="text" 
                        className="preview-input" 
                        placeholder="โปรดระบุรายละเอียด..." 
                        value={optionInputValues[`${q.id}_${opt}`] || ''}
                        onChange={(e) => handleOptionInputChange(q.id, opt, e.target.value)}
                        style={{ fontSize: '14px', padding: '6px 0', borderBottomColor: 'var(--theme-color)', maxWidth: '300px' }}
                        autoFocus
                      />
                    </div>
                  )}
                  
                  {q.optionImages && q.optionImages[i] && <img src={q.optionImages[i]} alt="option" className="preview-opt-img" />}
                </div>
              );
            })}
          </div>
        )}

        {q.type === 'checkboxes' && (
          <div className="preview-check-col">
            {q.options.map((opt, i) => {
              const isChecked = (ans || []).includes(opt);
              const showInput = q.optionHasInput?.[i] === true;
              
              return (
                <div key={i} className="preview-option-wrapper">
                  <label className={`preview-check ${isChecked ? 'active' : ''}`}>
                    <input type="checkbox" checked={isChecked} onChange={() => handleAnswer(q.id, opt, true)} />
                    <span className="preview-check__mark">{isChecked ? <FiCheck strokeWidth={3} /> : ""}</span>
                    <span dangerouslySetInnerHTML={{ __html: opt }} />
                  </label>
                  
                  {isChecked && showInput && (
                    <div style={{ marginLeft: '34px', animation: 'fadeIn 0.2s ease-out' }}>
                      <input 
                        type="text" 
                        className="preview-input" 
                        placeholder="โปรดระบุรายละเอียด..." 
                        value={optionInputValues[`${q.id}_${opt}`] || ''}
                        onChange={(e) => handleOptionInputChange(q.id, opt, e.target.value)}
                        style={{ fontSize: '14px', padding: '6px 0', borderBottomColor: 'var(--theme-color)', maxWidth: '300px' }}
                        autoFocus
                      />
                    </div>
                  )}

                  {q.optionImages && q.optionImages[i] && <img src={q.optionImages[i]} alt="option" className="preview-opt-img" />}
                </div>
              );
            })}
          </div>
        )}

        {(q.type === 'dropdown' || q.type === 'faculty') && (
          <select className={`preview-input ${hasError ? 'preview-input--error' : ''}`} value={ans || ''} onChange={(e) => handleAnswer(q.id, e.target.value)}>
            <option value="" disabled>เลือกคำตอบ</option>
            {q.options.map((opt, i) => {
              const textOnly = opt.replace(/<[^>]+>/g, '');
              return <option key={i} value={textOnly}>{textOnly}</option>;
            })}
          </select>
        )}

        {(q.type === 'grid_multiple' || q.type === 'grid_checkbox') && (
          <div className="preview-grid-wrapper">
            <table className="preview-grid-table">
              <thead>
                <tr>
                  <th></th>
                  {q.cols.map((col, i) => <th key={i} dangerouslySetInnerHTML={{ __html: col }} />)}
                </tr>
              </thead>
              <tbody>
                {q.rows.map((row, i) => (
                  <tr key={i} className={hasError && (!ans || (q.type === 'grid_multiple' ? !ans[i] : !ans[i]?.length)) ? 'grid-row-error' : ''}>
                    <td dangerouslySetInnerHTML={{ __html: row }} />
                    {q.cols.map((col, j) => {
                      const key = String(i);
                      const rowAns = ans?.[key] || (q.type === 'grid_multiple' ? null : []);
                      const isChecked = q.type === 'grid_multiple' ? rowAns === col : (rowAns || []).includes(col);
                      return (
                        <td key={j} style={{ textAlign: 'center' }}>
                          <input type={q.type === 'grid_multiple' ? 'radio' : 'checkbox'} name={`grid-${q.id}-${i}`} checked={isChecked} onChange={() => handleGridAnswer(q.id, i, col, q.type === 'grid_checkbox')} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasError && (
          <div className="preview-error-msg">
            <FiXCircle size={18} />
            {errors[q.id]}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionRenderer;