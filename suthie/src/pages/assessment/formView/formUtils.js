// ==========================================
// Helper Functions สำหรับ FormView
// ==========================================

export const formatThaiID = (value) => {
  const val = value.replace(/\D/g, '');
  if (val.length <= 1) return val;
  if (val.length <= 5) return `${val.slice(0, 1)}-${val.slice(1)}`;
  if (val.length <= 10) return `${val.slice(0, 1)}-${val.slice(1, 5)}-${val.slice(5)}`;
  if (val.length <= 12) return `${val.slice(0, 1)}-${val.slice(1, 5)}-${val.slice(5, 10)}-${val.slice(10)}`;
  return `${val.slice(0, 1)}-${val.slice(1, 5)}-${val.slice(5, 10)}-${val.slice(10, 12)}-${val.slice(12, 13)}`;
};

export const validateThaiID = (id) => {
  let val = id.replace(/\D/g, '');
  if (val.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseFloat(val.charAt(i)) * (13 - i);
  let checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseFloat(val.charAt(12));
};

export const formatPhoneNumber = (value) => {
  const val = value.replace(/\D/g, '');
  if (val.length <= 3) return val;
  if (val.length <= 6) return `${val.slice(0, 3)}-${val.slice(3)}`;
  return `${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6, 10)}`;
};

export const getQuestionTitles = (groupedSteps) => {
  const titles = {};
  groupedSteps.forEach(step => {
    step.items.forEach(q => {
      if (q.type === 'group') {
        (q.subQuestions || []).forEach(sq => {
          titles[sq.id] = sq.title ? sq.title.replace(/<[^>]+>/g, '') : 'คำถามที่ไม่มีชื่อ';
        });
      } else {
        titles[q.id] = q.title ? q.title.replace(/<[^>]+>/g, '') : 'คำถามที่ไม่มีชื่อ';
      }
    });
  });
  return titles;
};

export const calculateQuestionScore = (q, rawAns) => {
  let totalScore = 0;
  if (q.type === 'bmi') {
    const w = parseFloat(rawAns.weight) || 0; 
    const hCm = parseFloat(rawAns.height) || 0;
    if (w > 0 && hCm > 0) { 
      const hM = hCm / 100; 
      totalScore = Number((w / (hM * hM)).toFixed(2)); 
    }
  } else if (q.type === 'grid_multiple' || q.type === 'grid_checkbox') {
    const colScores = q.colScores || []; 
    const rowScores = q.rowScores || []; 
    const mode = q.scoreMode || "column";
    
    Object.entries(rawAns).forEach(([rowIndex, val]) => {
      const rIdx = Number(rowIndex);
      const getScoreForCell = (colIdx) => {
        if (q.cellScores && q.cellScores[rIdx] && q.cellScores[rIdx][colIdx] !== undefined) return Number(q.cellScores[rIdx][colIdx]);
        if (mode === "column") return Number(colScores[colIdx]) || 0;
        if (mode === "row") return Number(rowScores[rIdx]) || 0;
        return 0;
      };

      if (Array.isArray(val)) {
        val.forEach(v => { 
          const colIdx = (q.cols||[]).indexOf(v); 
          if (colIdx !== -1) totalScore += getScoreForCell(colIdx); 
        });
      } else {
        const colIdx = (q.cols||[]).indexOf(val); 
        if (colIdx !== -1) totalScore += getScoreForCell(colIdx); 
      }
    });
  } else if (q.type === 'multiple_choice' || q.type === 'dropdown' || q.type === 'faculty') {
    const optIdx = (q.options || []).indexOf(rawAns);
    if (optIdx !== -1 && q.optionScores) totalScore += Number(q.optionScores[optIdx]) || 0;
  } else if (q.type === 'checkboxes') {
    if (Array.isArray(rawAns)) { 
      rawAns.forEach(v => { 
        const optIdx = (q.options || []).indexOf(v); 
        if (optIdx !== -1 && q.optionScores) totalScore += Number(q.optionScores[optIdx]) || 0; 
      }); 
    }
  }
  return totalScore;
};