// ===== Default Data =====
const defaultStudentInfo = {
  name: 'นายธัญเทพ ภัทรโกศล',
  email: 'thunyathep@gmail.com',
  seatno: '44011853',
  idcard: '1449900898758',
  school: 'โรงเรียนสาธิตมหาวิทยาลัยมหาสารคาม (ฝ่ายมัธยม) จังหวัดมหาสารคาม',
  level: 'ระดับชั้น ม.5',
  expire: '15 สิงหาคม 2570',
};

const defaultSubjects = [
  {
    name: 'ความฉลาดรู้ทั่วไปด้านคณิตศาสตร์',
    code: 'รหัสวิชา 103',
max: 92.50, min: 0.00, avg: 28.15, sd: 9.28,
    score: 32.500, note: '',
  },
  {
    name: 'ความฉลาดรู้เฉพาะด้านวิทยาศาสตร์ และเทคโนโลยี',
    code: 'รหัสวิชา 201',
    max: 85.00, min: 0.00, avg: 36.87, sd: 8.67,
    score: 32.500, note: '',
  },
  {
    name: 'ความฉลาดรู้เฉพาะด้านฟิสิกส์',
    code: 'รหัสวิชา 204',
    max: 96.00, min: 0.00, avg: 30.25, sd: 10.27,
    score: 40.000, note: '',
  },
  {
    name: 'ความฉลาดรู้ทั่วไปด้านภาษาไทย',
    code: 'รหัสวิชา 101',
    max: 92.00, min: 0.00, avg: 51.53, sd: 12.51,
    score: 48.000, note: '',
  },
  {
    name: 'ความฉลาดรู้ทั่วไปด้านภาษาอังกฤษ',
    code: 'รหัสวิชา 102',
    max: 90.00, min: 0.00, avg: 28.51, sd: 10.70,
    score: 31.000,
    note: 'แบ่งเป็นการคิดคะแนนดังนี้ \nข้อละ 2 คะแนน จำนวน 20 ข้อ คือข้อ 1-20 \nข้อละ 2 คะแนน จำนวน 9 ข้อ คือข้อ 22,23,25,29,30,31,32,39,40 \nข้อละ 3 คะแนน จำนวน 2 ข้อ คือข้อ 24,35 \nข้อละ 4 คะแนน จำนวน 9 ข้อ คือข้อ 21,26,27,28,33,34,36,37,38',
  },
];

// ===== State =====
function clone(v) { return JSON.parse(JSON.stringify(v)); }
function loadRound(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : clone(fallback);
  } catch (e) { return clone(fallback); }
}

let studentInfo = loadFromStorage('netsat_info', defaultStudentInfo);
const legacySubjects = loadFromStorage('netsat_subjects', null);
let subjectsR1 = loadRound('netsat_subjects_r1', defaultSubjects);
let subjectsR2 = loadRound('netsat_subjects_r2', legacySubjects || defaultSubjects);
let subjects = subjectsR2;
let deleteTargetIndex = null;
let adminMode = false;
let logoClickCount = 0;
let logoClickTimer = null;

// ===== Storage =====
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}

function saveToStorage() {
  localStorage.setItem('netsat_info', JSON.stringify(studentInfo));
  localStorage.setItem('netsat_subjects_r1', JSON.stringify(subjectsR1));
  localStorage.setItem('netsat_subjects_r2', JSON.stringify(subjectsR2));
}

// ===== Round Tabs =====
function updateInkBar(el) {
  const ink = document.getElementById('tab-ink');
  if (ink && el) {
    ink.style.left = el.offsetLeft + 'px';
    ink.style.width = el.offsetWidth + 'px';
  }
}

function selectRoundTab(round, el) {
  document.querySelectorAll('.mat-tab-label').forEach(t => t.classList.remove('mat-tab-label-active'));
  el.classList.add('mat-tab-label-active');
  const title = document.getElementById('round-title');
  if (title) title.textContent = 'รอบการสอบ ' + round + '/2568';
  subjects = (round === '1') ? subjectsR1 : subjectsR2;
  renderScores();
  updateInkBar(el);
}

// ===== Render =====
// ===== Admin Mode (Hidden) =====
function handleLogoClick() {
  logoClickCount++;
  clearTimeout(logoClickTimer);
  logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 1500);
  if (logoClickCount >= 5) {
    logoClickCount = 0;
    adminMode = !adminMode;
    document.getElementById('admin-indicator').classList.toggle('show', adminMode);
    renderScores();
  }
}

function render() {
  renderInfo();
  renderScores();
}

function renderInfo() {
  document.getElementById('info-name').textContent = studentInfo.name;
  document.getElementById('info-seatno').textContent = studentInfo.seatno;
  document.getElementById('info-idcard').textContent = studentInfo.idcard;
  document.getElementById('info-school').innerHTML =
    escHtml(studentInfo.school) + '<br><small>' + escHtml(studentInfo.level || '') + '</small>';
  document.getElementById('info-expire').textContent = studentInfo.expire;
  document.getElementById('sidebar-name').textContent = studentInfo.name;
  document.getElementById('sidebar-email').textContent = studentInfo.email;
  document.getElementById('toolbar-email').textContent = studentInfo.email;
}

function renderScores() {
  const container = document.getElementById('score-list');
  container.innerHTML = '';

  if (subjects.length === 0) {
    container.innerHTML = `<div class="mat-card" style="text-align:center;color:rgba(0,0,0,0.38);padding:40px;">
      ยังไม่มีผลการสอบ กด "เพิ่มวิชา" เพื่อเริ่มต้น
    </div>`;
    return;
  }

  subjects.forEach((subj, i) => {
    const noteHtml = subj.note
      ? `<div class="alert helpful">${escHtml(subj.note).replace(/\n/g, '<br>')}</div>`
      : '';

    const card = document.createElement('div');
    card.innerHTML = `
      <div class="mat-card example-card">
        <div class="mat-card-header">
          <div class="mat-card-header-text">
            <div class="mat-card-title" style="font-size:17px;">${escHtml(subj.name)}</div>
            <div class="mat-card-subtitle">${escHtml(subj.code)}</div>
          </div>
        </div>
        <div class="mat-card-content" style="padding-left:15px;">
          <div class="show-score-item-card">
            <div style="display:flex;width:100%;flex-direction:row;box-sizing:border-box;">
              <div class="score-stat-col">
                <p class="mat-card-subtitle">
                  <span> คะแนนสูงสุด ${fmt(subj.max)}</span><br>
                  <span> คะแนนต่ำสุด ${fmt(subj.min)}</span><br>
                  <span> ค่าเฉลี่ย ${fmt(subj.avg)}</span><br>
                  <span> ค่าเบี่ยงเบนมาตรฐาน ${fmt(subj.sd)}</span>
                </p>
              </div>
              <div class="score-display-col">
                <p style="text-align:center;">
                  <span class="score-top-label"> คะแนนเต็ม 100 ได้</span><br><br>
                  <span class="score-number">${fmtScore(subj.score)}</span><br>
                  <span class="score-bottom-label">คะแนน</span>
                </p>
              </div>
              ${adminMode ? `
              <div class="score-actions-col">
                <button class="btn-edit-score" onclick="openEditScore(${i})">แก้ไขคะเเนน</button>
                <button class="btn-del-score" onclick="openDeleteModal(${i})">ลบวิชา</button>
              </div>` : ''}
            </div>
            ${noteHtml}
          </div>
        </div>
      </div>
      <br>
    `;
    container.appendChild(card);
  });
}

// ===== Formatters =====
function fmt(n) { return parseFloat(n).toFixed(2); }
function fmtScore(n) { return parseFloat(n).toFixed(3); }
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== Modals =====
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) closeModal(this.id);
  });
});

// ===== Edit Score =====
function openEditScore(index) {
  const s = subjects[index];
  document.getElementById('edit-index').value = index;
  document.getElementById('edit-name').value = s.name;
  document.getElementById('edit-code').value = s.code;
  document.getElementById('edit-max').value = s.max;
  document.getElementById('edit-min').value = s.min;
  document.getElementById('edit-avg').value = s.avg;
  document.getElementById('edit-sd').value = s.sd;
  document.getElementById('edit-score').value = s.score;
  openModal('modal-score');
}

function saveScore() {
  const i = parseInt(document.getElementById('edit-index').value);
  subjects[i] = {
    ...subjects[i],
    name: document.getElementById('edit-name').value.trim(),
    code: document.getElementById('edit-code').value.trim(),
    max: parseFloat(document.getElementById('edit-max').value) || 0,
    min: parseFloat(document.getElementById('edit-min').value) || 0,
    avg: parseFloat(document.getElementById('edit-avg').value) || 0,
    sd: parseFloat(document.getElementById('edit-sd').value) || 0,
    score: parseFloat(document.getElementById('edit-score').value) || 0,
  };
  saveToStorage();
  closeModal('modal-score');
  renderScores();
  showToast('บันทึกคะแนนแล้ว');
}

// ===== Edit Info =====
function openEditInfo() {
  document.getElementById('ei-name').value = studentInfo.name;
  document.getElementById('ei-email').value = studentInfo.email;
  document.getElementById('ei-seatno').value = studentInfo.seatno;
  document.getElementById('ei-idcard').value = studentInfo.idcard;
  document.getElementById('ei-school').value = studentInfo.school;
  document.getElementById('ei-level').value = studentInfo.level || '';
  document.getElementById('ei-expire').value = studentInfo.expire;
  openModal('modal-info');
}

function saveInfo() {
  studentInfo = {
    ...studentInfo,
    name: document.getElementById('ei-name').value.trim(),
    email: document.getElementById('ei-email').value.trim(),
    seatno: document.getElementById('ei-seatno').value.trim(),
    idcard: document.getElementById('ei-idcard').value.trim(),
    school: document.getElementById('ei-school').value.trim(),
    level: document.getElementById('ei-level').value.trim(),
    expire: document.getElementById('ei-expire').value.trim(),
  };
  saveToStorage();
  closeModal('modal-info');
  renderInfo();
  showToast('บันทึกข้อมูลนักเรียนแล้ว');
}

// ===== Add Subject =====
function openAddSubject() {
  ['add-name','add-code','add-avg','add-sd','add-score'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('add-max').value = '100';
  document.getElementById('add-min').value = '0';
  openModal('modal-add');
}

function addSubject() {
  const name = document.getElementById('add-name').value.trim();
  if (!name) { alert('กรุณากรอกชื่อวิชา'); return; }
  subjects.push({
    name,
    code: document.getElementById('add-code').value.trim() || '-',
    max: parseFloat(document.getElementById('add-max').value) || 100,
    min: parseFloat(document.getElementById('add-min').value) || 0,
    avg: parseFloat(document.getElementById('add-avg').value) || 0,
    sd: parseFloat(document.getElementById('add-sd').value) || 0,
    score: parseFloat(document.getElementById('add-score').value) || 0,
    note: '',
  });
  saveToStorage();
  closeModal('modal-add');
  renderScores();
  showToast('เพิ่มวิชาแล้ว');
}

// ===== Delete =====
function openDeleteModal(index) {
  deleteTargetIndex = index;
  document.getElementById('delete-name').textContent = subjects[index].name;
  openModal('modal-delete');
}

function confirmDelete() {
  if (deleteTargetIndex !== null) {
    subjects.splice(deleteTargetIndex, 1);
    deleteTargetIndex = null;
    saveToStorage();
    closeModal('modal-delete');
    renderScores();
    showToast('ลบวิชาแล้ว');
  }
}

// ===== Toast =====
let toastTimeout;
function showToast(msg) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== Escape closes modals =====
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    ['modal-score','modal-info','modal-add','modal-delete'].forEach(id => {
      document.getElementById(id).style.display = 'none';
    });
  }
});

// ===== Init =====
render();
updateInkBar(document.querySelector('.mat-tab-label.mat-tab-label-active'));
