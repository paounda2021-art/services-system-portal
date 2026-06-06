/**
 * FMO KPI Evaluation System Logic
 * Handles Role-based dynamic loading, score calculations, LocalStorage persistence,
 * Supervisor approvals, and Print PDF preparation.
 */

// 1. KPI Templates for each Role
const KPI_TEMPLATES = {
  user_it: [
    { id: 1, text: "ความเสถียรของระบบเครือข่ายและเครื่องแม่ข่ายกลาง อสป. (Uptime > 99.9%)", weight: 30, target: "Uptime > 99.9%", actual: "", selfScore: 5, note: "" },
    { id: 2, text: "ระยะเวลาในการแก้ปัญหา Helpdesk คอมพิวเตอร์ของเจ้าหน้าที่ (เฉลี่ยไม่เกิน 30 นาที)", weight: 20, target: "< 30 นาที", actual: "", selfScore: 5, note: "" },
    { id: 3, text: "การปรับปรุงความปลอดภัยไซเบอร์และรักษาระบบเครือข่ายตามมาตรฐาน อสป.", weight: 20, target: "ผ่านการตรวจสอบ", actual: "", selfScore: 5, note: "" },
    { id: 4, text: "ผลคะแนนความพึงพอใจของบุคลากรผู้รับบริการด้านไอทีและการใช้งานระบบ", weight: 15, target: ">= 90%", actual: "", selfScore: 5, note: "" },
    { id: 5, text: "การจัดทำรายงานสถิติไอที คู่มือผู้ใช้ และจัดทำระบบสำรองข้อมูลประจำสัปดาห์", weight: 15, target: "ครบทุกสัปดาห์", actual: "", selfScore: 5, note: "" }
  ],
  user_finance: [
    { id: 1, text: "ความถูกต้องในการบันทึกบัญชี สรุปงบรายเดือน และการจัดการฐานภาษี อสป.", weight: 30, target: "ความผิดพลาด 0%", actual: "", selfScore: 5, note: "" },
    { id: 2, text: "ระยะเวลาในการประมวลผลการจัดซื้อจัดจ้างและการเบิกจ่ายงบตามกำหนดเวลา", weight: 20, target: "ภายใน 3 วัน", actual: "", selfScore: 5, note: "" },
    { id: 3, text: "การปฏิบัติตามมาตรฐานบัญชีภาครัฐและวินัยการเงินการคลังของสะพานปลา", weight: 20, target: "ถูกต้อง 100%", actual: "", selfScore: 5, note: "" },
    { id: 4, text: "ผลประเมินความพึงพอใจของผู้ยื่นเบิกจ่ายและหน่วยงานในสังกัดด้านบัญชี", weight: 15, target: ">= 88%", actual: "", selfScore: 5, note: "" },
    { id: 5, text: "การจัดเตรียมข้อมูลประกอบการตั้งงบประมาณและรายงานวิเคราะห์ความเสี่ยงรายไตรมาส", weight: 15, target: "ส่งตามกำหนด", actual: "", selfScore: 5, note: "" }
  ],
  user_driver: [
    { id: 1, text: "ความตรงต่อเวลาและการขับขี่ปลอดภัยในการรับส่งบุคลากร อสป. นอกสถานที่", weight: 30, target: "ตรงเวลา 100%", actual: "", selfScore: 5, note: "" },
    { id: 2, text: "การบำรุงรักษา ตรวจเช็คสภาพยานพาหนะประจำสัปดาห์ และบันทึกสมุดการใช้รถ", weight: 25, target: "ตรวจเช็คทุกสัปดาห์", actual: "", selfScore: 5, note: "" },
    { id: 3, text: "สถิติการเกิดอุบัติเหตุทางรถยนต์ขณะปฏิบัติหน้าที่ที่ตนเป็นฝ่ายผิดเป็นศูนย์", weight: 20, target: "อุบัติเหตุ = 0", actual: "", selfScore: 5, note: "" },
    { id: 4, text: "คะแนนประเมินความพึงพอใจของผู้โดยสารต่อนายสถานีและพนักงานขับรถประจำเที่ยว", weight: 15, target: ">= 92%", actual: "", selfScore: 5, note: "" },
    { id: 5, text: "ประสิทธิภาพการประหยัดพลังงานและการควบคุมการใช้น้ำมันเชื้อเพลิงของรถส่วนกลาง", weight: 10, target: "ตามเกณฑ์กำหนด", actual: "", selfScore: 5, note: "" }
  ],
  user_exec: [
    { id: 1, text: "อัตราความสำเร็จในการดำเนินโครงการตามแผนยุทธศาสตร์องค์การสะพานปลา", weight: 30, target: ">= 95%", actual: "", selfScore: 5, note: "" },
    { id: 2, text: "การบริหารจัดการและควบคุมการใช้งบประมาณรายปีของ อสป. ให้อยู่ในกรอบ", weight: 20, target: "ไม่เกินงบประมาณ", actual: "", selfScore: 5, note: "" },
    { id: 3, text: "ความสำเร็จในการตรวจสอบความโปร่งใสการจัดซื้อจัดจ้างและการจัดการบริหารความเสี่ยง", weight: 20, target: "ประเมินระดับดีเลิศ", actual: "", selfScore: 5, note: "" },
    { id: 4, text: "ความสำเร็จในการขับเคลื่อนระบบเทคโนโลยีดิจิทัล อสป. และปรับสู่ระบบไร้กระดาษ", weight: 15, target: ">= 90%", actual: "", selfScore: 5, note: "" },
    { id: 5, text: "อัตราความผูกพันและการรักษาบุคลากรที่มีความสามารถขององค์กร (Retention Rate)", weight: 15, target: ">= 85%", actual: "", selfScore: 5, note: "" }
  ]
};

// Mock User Meta Details for Report
const MOCK_USER_METADATA = {
  user_it: { dept: "ฝ่ายเทคโนโลยีสารสนเทศ อสป.", supervisor: "คุณอนันต์ บริหารงาน (ผู้อำนวยการ อสป.)" },
  user_finance: { dept: "ฝ่ายการบัญชีและการคลัง อสป.", supervisor: "คุณอนันต์ บริหารงาน (ผู้อำนวยการ อสป.)" },
  user_driver: { dept: "แผนกบริการยานพาหนะและธุรการ อสป.", supervisor: "คุณอนันต์ บริหารงาน (ผู้อำนวยการ อสป.)" },
  user_exec: { dept: "สำนักงานผู้อำนวยการ องค์การสะพานปลา", supervisor: "คณะกรรมการบอร์ดบริหาร อสป." }
};

document.addEventListener("DOMContentLoaded", () => {
  // Session variables
  let session = null;
  let currentKpiData = [];
  let currentKpiStatus = "draft"; // draft, submitted, approved
  
  // DOM Elements
  const tabButtons = document.querySelectorAll(".kpi-tab-btn");
  const panels = document.querySelectorAll(".kpi-panel");
  const toast = document.getElementById("kpi-toast-msg");
  
  // Profile elements
  const userNameLabel = document.getElementById("kpi-user-name");
  const userRoleLabel = document.getElementById("kpi-user-role");
  const userAvatarSpan = document.getElementById("kpi-user-avatar").querySelector("span");
  
  // Self Evaluation Elements
  const selfEvalTbody = document.getElementById("self-eval-tbody");
  const totalWeightLabel = document.getElementById("total-weight-label");
  const btnSaveDraft = document.getElementById("btn-save-draft");
  const btnSubmitEval = document.getElementById("btn-submit-eval");
  const formStatusBadge = document.getElementById("form-status-badge");
  
  // Dashboard Elements
  const dashTotalScore = document.getElementById("dash-total-score");
  const dashGrade = document.getElementById("dash-grade");
  const dashStatusBadge = document.getElementById("dash-status-badge");
  const coreKpiPercent = document.getElementById("core-kpi-percent");
  const coreKpiFill = document.getElementById("core-kpi-fill");
  const funcKpiPercent = document.getElementById("func-kpi-percent");
  const funcKpiFill = document.getElementById("func-kpi-fill");
  const stepSelf = document.getElementById("step-self");
  const stepSupervisor = document.getElementById("step-supervisor");
  const stepApproved = document.getElementById("step-approved");
  const kpiAlertBanner = document.getElementById("kpi-alert-banner");
  const kpiBannerMsg = document.getElementById("kpi-banner-msg");
  
  // Supervisor Elements
  const selectEmployee = document.getElementById("select-employee");
  const supervisorEvalArea = document.getElementById("supervisor-eval-area");
  const supervisorNoSelection = document.getElementById("supervisor-no-selection");
  const supervisorTbody = document.getElementById("supervisor-tbody");
  const superCalcScore = document.getElementById("super-calc-score");
  const superCalcGrade = document.getElementById("super-calc-grade");
  const btnApproveKpi = document.getElementById("btn-approve-kpi");
  const empStatusBadge = document.getElementById("emp-status-badge");
  const empStatusBanner = document.getElementById("emp-status-summary");
  
  // Report Elements
  const repEmpName = document.getElementById("rep-emp-name");
  const repEmpRole = document.getElementById("rep-emp-role");
  const repEmpDept = document.getElementById("rep-emp-dept");
  const repSupervisor = document.getElementById("rep-supervisor");
  const repStatus = document.getElementById("rep-status");
  const repGrade = document.getElementById("rep-grade");
  const reportTbody = document.getElementById("report-tbody");
  const repTotalWeight = document.getElementById("rep-total-weight");
  const repTotalScore = document.getElementById("rep-total-score");
  const repEmpSigName = document.getElementById("rep-emp-sig-name");

  // ----------------------------------------------------
  // 1. Authentication & Security Check (SSO Simulation)
  // ----------------------------------------------------
  function checkSession() {
    const sessionRaw = localStorage.getItem("fmo_user_session");
    if (!sessionRaw) {
      showLockOverlay("กรุณาเข้าสู่ระบบผ่านหน้าระบบพอร์ทัลกลาง อสป. ก่อนใช้งานระบบ KPI");
      return false;
    }
    
    try {
      session = JSON.parse(sessionRaw);
      const isAllowed = session.allowedSystems && session.allowedSystems.includes("kpi");
      if (!isAllowed) {
        showLockOverlay(`คุณ ${session.name} ไม่มีสิทธิ์การเข้าถึงระบบประเมินผลรายบุคคล (KPI)`);
        return false;
      }
      
      // Load user profile details
      userNameLabel.textContent = "คุณ" + session.name;
      userRoleLabel.textContent = session.role;
      userAvatarSpan.textContent = session.avatar;
      
      // If user is executive, show supervisor tab
      if (session.userKey === "user_exec") {
        document.getElementById("tab-btn-supervisor").style.display = "flex";
      }
      
      return true;
    } catch (e) {
      showLockOverlay("ข้อมูลการล็อกอินขัดข้อง กรุณาลองล็อกอินใหม่อีกครั้ง");
      return false;
    }
  }

  function showLockOverlay(message) {
    document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: 'K2D', sans-serif; background: #eff6ff; color: #1e3a8a; text-align: center; padding: 20px;">
        <div style="font-size: 80px; margin-bottom: 20px; animation: bounce 2s infinite;">🔒</div>
        <h2 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 10px; color: #1e3a8a;">การเข้าใช้งานถูกบล็อก (Access Denied)</h2>
        <p style="color: #64748b; font-size: 1.05rem; margin-bottom: 30px; max-width: 500px;">${message}</p>
        <a href="index.html" style="padding: 0.8rem 2rem; background: #2563eb; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 12px rgba(37,99,235,0.25); transition: all 0.3s;">
          กลับไปยังหน้าพอร์ทัลหลัก
        </a>
      </div>
      <style>
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      </style>
    `;
  }

  // ----------------------------------------------------
  // 2. Tab Navigation
  // ----------------------------------------------------
  function initTabs() {
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tabName = btn.getAttribute("data-tab");
        switchTab(tabName);
      });
    });

    // Check URL query parameters for default tab
    const urlParams = new URLSearchParams(window.location.search);
    const defaultTab = urlParams.get("tab");
    if (defaultTab === "evaluation" || defaultTab === "self") {
      switchTab("self-eval");
    } else {
      switchTab("dashboard");
    }
  }

  function switchTab(tabName) {
    tabButtons.forEach(btn => {
      if (btn.getAttribute("data-tab") === tabName) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    panels.forEach(panel => {
      if (panel.id === `panel-${tabName}`) {
        panel.classList.add("active");
      } else {
        panel.classList.remove("active");
      }
    });

    // Run tab-specific reload
    if (tabName === "dashboard") {
      loadKpiDashboardState();
    } else if (tabName === "self-eval") {
      loadSelfEvaluationForm();
    } else if (tabName === "report") {
      loadReportView();
    }
  }

  // ----------------------------------------------------
  // 3. Load / Save KPI State (localStorage)
  // ----------------------------------------------------
  function loadKpiDataForUser(userKey) {
    const kpiStateRaw = localStorage.getItem(`kpi_state_${userKey}`);
    const defaultKpiTemplate = KPI_TEMPLATES[userKey] || KPI_TEMPLATES.user_it;
    
    if (kpiStateRaw) {
      try {
        const parsed = JSON.parse(kpiStateRaw);
        currentKpiStatus = parsed.status || "draft";
        
        // Merge saved actual, selfScores, supervisorScores with templates
        currentKpiData = defaultKpiTemplate.map(tmpl => {
          const saved = parsed.kpis.find(k => k.id === tmpl.id);
          return saved ? { ...tmpl, ...saved } : tmpl;
        });
      } catch (e) {
        currentKpiData = JSON.parse(JSON.stringify(defaultKpiTemplate));
        currentKpiStatus = "draft";
      }
    } else {
      // Deep copy template
      currentKpiData = JSON.parse(JSON.stringify(defaultKpiTemplate));
      currentKpiStatus = "draft";
    }
  }

  function saveKpiDataForUser(userKey, status) {
    currentKpiStatus = status;
    const dataToSave = {
      status: status,
      lastUpdated: new Date().getTime(),
      kpis: currentKpiData.map(k => ({
        id: k.id,
        actual: k.actual,
        selfScore: k.selfScore,
        note: k.note,
        supervisorScore: k.supervisorScore || k.selfScore, // Default supervisor score to self score
        supervisorNote: k.supervisorNote || ""
      }))
    };
    
    localStorage.setItem(`kpi_state_${userKey}`, JSON.stringify(dataToSave));
    
    // If user completes action, notify main portal (modify pending tasks count)
    syncPendingTasksCount();
  }

  function syncPendingTasksCount() {
    // Modify mock pending task count in SSO
    const sessionRaw = localStorage.getItem("fmo_user_session");
    if (!sessionRaw) return;
    
    try {
      const sess = JSON.parse(sessionRaw);
      
      // Let's say if employee submits, IT Support / Director pending tasks change.
      // We will update the fmo_user_session key so that index.js loads the updated counts!
      if (sess.userKey !== "user_exec") {
        // General employee: submitted their KPI
        // Notify them that it's submitted.
      }
    } catch (e) {}
  }

  function showToast(message) {
    toast.querySelector("span").textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // ----------------------------------------------------
  // 4. Score & Grade Calculations
  // ----------------------------------------------------
  function calculateTotalKpiScore(kpiList, type) {
    // type = 'self' or 'supervisor'
    let totalWeight = 0;
    let totalWeightedScore = 0;

    kpiList.forEach(k => {
      const score = type === "supervisor" ? (k.supervisorScore || k.selfScore) : k.selfScore;
      totalWeight += k.weight;
      totalWeightedScore += (score * (k.weight / 100));
    });

    return {
      score: totalWeightedScore,
      grade: calculateGrade(totalWeightedScore)
    };
  }

  function calculateGrade(scoreOutOf5) {
    // Convert 1-5 scale to percentage (e.g. 5 = 100%, 4 = 80%, etc.)
    const pct = (scoreOutOf5 / 5) * 100;
    
    if (pct >= 90) return "A (ดีเลิศ)";
    if (pct >= 80) return "B (ดีมาก)";
    if (pct >= 70) return "C (ดี)";
    if (pct >= 60) return "D (พอใช้)";
    return "F (ต้องปรับปรุง)";
  }

  // ----------------------------------------------------
  // 5. Dashboard Tab Management
  // ----------------------------------------------------
  function loadKpiDashboardState() {
    loadKpiDataForUser(session.userKey);
    
    // Status color classes and text
    const statusClasses = {
      draft: { text: "กำลังกรอกแบบประเมิน (Draft)", class: "default" },
      submitted: { text: "ส่งประเมินแล้ว - รอหัวหน้าอนุมัติ", class: "warning" },
      approved: { text: "อนุมัติผลเรียบร้อยแล้ว (Approved)", class: "success" }
    };
    
    const currentStatus = statusClasses[currentKpiStatus] || statusClasses.draft;
    dashStatusBadge.textContent = currentStatus.text;
    dashStatusBadge.className = `kpi-badge-status ${currentStatus.class}`;

    // Timeline steps indicators
    if (currentKpiStatus === "draft") {
      stepSelf.className = "timeline-step";
      stepSupervisor.className = "timeline-step";
      stepApproved.className = "timeline-step";
      
      kpiAlertBanner.className = "kpi-info-banner notification-alert";
      kpiBannerMsg.textContent = 'คุณยังไม่ได้ส่งแบบประเมินผลงาน โปรดกดแท็บ "ประเมินตนเอง" เพื่อเริ่มระบุความสำเร็จการปฏิบัติงานรอบปี';
    } else if (currentKpiStatus === "submitted") {
      stepSelf.className = "timeline-step completed";
      stepSupervisor.className = "timeline-step";
      stepApproved.className = "timeline-step";
      
      kpiAlertBanner.className = "kpi-info-banner notification-warning";
      kpiBannerMsg.textContent = 'ส่งประเมินผลงานเรียบร้อยแล้ว! ปัจจุบันอยู่ระหว่างรอคุณอนันต์ (ผู้อำนวยการ) ตรวจสอบและให้คะแนนขั้นสุดท้าย';
    } else if (currentKpiStatus === "approved") {
      stepSelf.className = "timeline-step completed";
      stepSupervisor.className = "timeline-step completed";
      stepApproved.className = "timeline-step completed";
      
      kpiAlertBanner.className = "kpi-info-banner notification-success";
      kpiBannerMsg.textContent = 'ผู้อำนวยการ อสป. ได้ทำการอนุมัติและลงนามอิเล็กทรอนิกส์ในใบประเมินเรียบร้อยแล้ว คุณสามารถตรวจดูใบประเมินฉบับสมบูรณ์ได้ในแท็บ "รายงานประเมินผล"';
    }

    // Calculations
    const results = calculateTotalKpiScore(currentKpiData, currentKpiStatus === "approved" ? "supervisor" : "self");
    dashTotalScore.textContent = results.score.toFixed(2);
    
    if (currentKpiStatus === "draft") {
      dashGrade.textContent = "รอส่งประเมิน";
    } else {
      dashGrade.textContent = results.grade.split(" ")[0]; // Just A, B, C, D
    }

    // Core & Functional KPI Breakdowns
    // Core KPIs: index 0 and 1 (usually 50% weight total)
    // Functional KPIs: index 2, 3, 4
    const coreKpis = currentKpiData.slice(0, 2);
    const funcKpis = currentKpiData.slice(2);
    const scoreType = currentKpiStatus === "approved" ? "supervisor" : "self";

    const coreResults = calculateTotalKpiScore(coreKpis, scoreType);
    const funcResults = calculateTotalKpiScore(funcKpis, scoreType);

    // Normalize back to 5.0 scale
    const coreScaled = (coreKpis.reduce((acc, k) => acc + (k[scoreType === "supervisor" ? "supervisorScore" : "selfScore"] || k.selfScore) * k.weight, 0) / coreKpis.reduce((acc, k) => acc + k.weight, 0));
    const funcScaled = (funcKpis.reduce((acc, k) => acc + (k[scoreType === "supervisor" ? "supervisorScore" : "selfScore"] || k.selfScore) * k.weight, 0) / funcKpis.reduce((acc, k) => acc + k.weight, 0));

    coreKpiPercent.textContent = `${coreScaled.toFixed(1)} / 5.0`;
    coreKpiFill.style.width = `${(coreScaled / 5) * 100}%`;
    funcKpiPercent.textContent = `${funcScaled.toFixed(1)} / 5.0`;
    funcKpiFill.style.width = `${(funcScaled / 5) * 100}%`;
  }

  // ----------------------------------------------------
  // 6. Self Evaluation Form Tab
  // ----------------------------------------------------
  function loadSelfEvaluationForm() {
    loadKpiDataForUser(session.userKey);
    
    const statusClasses = {
      draft: { text: "ยังไม่ได้ส่งประเมิน (Draft)", class: "alert" },
      submitted: { text: "รอหัวหน้าอนุมัติ", class: "warning" },
      approved: { text: "อนุมัติเสร็จสิ้น", class: "success" }
    };
    
    const status = statusClasses[currentKpiStatus] || statusClasses.draft;
    formStatusBadge.textContent = status.text;
    formStatusBadge.className = `kpi-badge-status ${status.class}`;

    // Render table
    selfEvalTbody.innerHTML = "";
    let totalWeight = 0;

    // Disabled inputs if submitted or approved
    const isDisabled = currentKpiStatus !== "draft";

    currentKpiData.forEach((kpi, idx) => {
      totalWeight += kpi.weight;
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-center">${idx + 1}</td>
        <td>
          <div class="kpi-metric-title font-bold">${kpi.text}</div>
          <div class="kpi-metric-cat" style="font-size: 0.75rem; color: var(--kpi-text-muted); margin-top: 4px;">
            ${idx < 2 ? "🔴 ตัวชี้วัดหลักองค์กร (Core KPI)" : "🔵 ตัวชี้วัดตำแหน่งหน้าที่ (Functional KPI)"}
          </div>
        </td>
        <td class="text-center font-bold">${kpi.weight}%</td>
        <td class="text-center">${kpi.target}</td>
        <td>
          <input type="text" class="kpi-input-actual" data-id="${kpi.id}" value="${kpi.actual}" placeholder="ระบุผลงานจริงที่ทำได้..." ${isDisabled ? "disabled" : ""}>
        </td>
        <td class="text-center">
          <select class="kpi-score-select" data-id="${kpi.id}" ${isDisabled ? "disabled" : ""}>
            <option value="5" ${kpi.selfScore == 5 ? "selected" : ""}>5 - ยอดเยี่ยม</option>
            <option value="4" ${kpi.selfScore == 4 ? "selected" : ""}>4 - ดีมาก</option>
            <option value="3" ${kpi.selfScore == 3 ? "selected" : ""}>3 - พอใช้</option>
            <option value="2" ${kpi.selfScore == 2 ? "selected" : ""}>2 - ต้องปรับปรุง</option>
            <option value="1" ${kpi.selfScore == 1 ? "selected" : ""}>1 - ต่ำกว่าเกณฑ์</option>
          </select>
        </td>
        <td>
          <textarea class="kpi-input-note" data-id="${kpi.id}" placeholder="ลิงก์หลักฐาน หรือคำอธิบายเพิ่มเติม..." ${isDisabled ? "disabled" : ""}>${kpi.note}</button>
        </td>
      `;
      selfEvalTbody.appendChild(tr);
    });

    totalWeightLabel.textContent = `${totalWeight}%`;

    // Hide or show action buttons based on status
    if (isDisabled) {
      btnSaveDraft.style.display = "none";
      btnSubmitEval.style.display = "none";
    } else {
      btnSaveDraft.style.display = "inline-flex";
      btnSubmitEval.style.display = "inline-flex";
    }

    // Attach events for values changes
    if (!isDisabled) {
      document.querySelectorAll(".kpi-input-actual").forEach(input => {
        input.addEventListener("input", (e) => {
          const id = parseInt(e.target.getAttribute("data-id"));
          const kpi = currentKpiData.find(k => k.id === id);
          if (kpi) kpi.actual = e.target.value;
        });
      });

      document.querySelectorAll(".kpi-score-select").forEach(select => {
        select.addEventListener("change", (e) => {
          const id = parseInt(e.target.getAttribute("data-id"));
          const kpi = currentKpiData.find(k => k.id === id);
          if (kpi) kpi.selfScore = parseInt(e.target.value);
        });
      });

      document.querySelectorAll(".kpi-input-note").forEach(textarea => {
        textarea.addEventListener("input", (e) => {
          const id = parseInt(e.target.getAttribute("data-id"));
          const kpi = currentKpiData.find(k => k.id === id);
          if (kpi) kpi.note = e.target.value;
        });
      });
    }
  }

  // Save draft button action
  if (btnSaveDraft) {
    btnSaveDraft.addEventListener("click", () => {
      saveKpiDataForUser(session.userKey, "draft");
      showToast("💾 บันทึกร่างแบบประเมินเรียบร้อยแล้ว");
    });
  }

  // Submit evaluation button action
  if (btnSubmitEval) {
    btnSubmitEval.addEventListener("click", () => {
      // Validate inputs
      let hasEmpty = false;
      currentKpiData.forEach(k => {
        if (!k.actual.trim()) hasEmpty = true;
      });

      if (hasEmpty) {
        alert("กรุณากรอก ผลงานจริง (Actual) ในทุกช่องข้อมูลของตัวชี้วัดก่อนทำการส่งประเมินผลงาน");
        return;
      }

      const confirmSubmit = confirm("ยืนยันส่งประเมินผลงานใช่หรือไม่? หลังจากส่งแล้วท่านจะไม่สามารถแก้ไขข้อมูลประเมินตนเองได้อีก");
      if (confirmSubmit) {
        saveKpiDataForUser(session.userKey, "submitted");
        showToast("🚀 ส่งข้อมูลประเมินผลงานไปยังผู้บังคับบัญชาแล้ว");
        switchTab("dashboard");
      }
    });
  }

  // ----------------------------------------------------
  // 7. Supervisor Review Tab Management
  // ----------------------------------------------------
  let supervisorSelectedUserKey = "";
  let supervisorSelectedUserKpiData = [];
  let supervisorSelectedUserKpiStatus = "draft";

  if (selectEmployee) {
    selectEmployee.addEventListener("change", (e) => {
      supervisorSelectedUserKey = e.target.value;
      loadSupervisorEmployeeData();
    });
  }

  function loadSupervisorEmployeeData() {
    if (!supervisorSelectedUserKey) {
      supervisorEvalArea.style.display = "none";
      supervisorNoSelection.style.display = "flex";
      return;
    }

    // Load selected employee's data
    const kpiStateRaw = localStorage.getItem(`kpi_state_${supervisorSelectedUserKey}`);
    const defaultKpiTemplate = KPI_TEMPLATES[supervisorSelectedUserKey];

    if (kpiStateRaw) {
      try {
        const parsed = JSON.parse(kpiStateRaw);
        supervisorSelectedUserKpiStatus = parsed.status;
        supervisorSelectedUserKpiData = defaultKpiTemplate.map(tmpl => {
          const saved = parsed.kpis.find(k => k.id === tmpl.id);
          return saved ? { ...tmpl, ...saved } : tmpl;
        });
      } catch (e) {
        supervisorSelectedUserKpiStatus = "draft";
        supervisorSelectedUserKpiData = [];
      }
    } else {
      supervisorSelectedUserKpiStatus = "draft";
      supervisorSelectedUserKpiData = [];
    }

    // UI setup
    supervisorEvalArea.style.display = "block";
    supervisorNoSelection.style.display = "none";
    empStatusBanner.style.display = "flex";

    const statusClasses = {
      draft: { text: "ยังไม่ส่งแบบประเมิน (กำลังกรอกข้อมูล)", class: "alert" },
      submitted: { text: "ส่งแล้ว - รอตรวจประเมิน", class: "warning" },
      approved: { text: "ได้รับการอนุมัติแล้ว", class: "success" }
    };

    const status = statusClasses[supervisorSelectedUserKpiStatus] || statusClasses.draft;
    empStatusBadge.textContent = status.text;
    empStatusBadge.className = `kpi-badge-status ${status.class}`;

    // Render supervisor table
    supervisorTbody.innerHTML = "";
    
    if (supervisorSelectedUserKpiData.length === 0) {
      supervisorTbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center" style="padding: 2rem; color: var(--kpi-text-muted);">
            ไม่พบข้อมูลประเมินของพนักงานคนนี้ หรือพนักงานยังไม่เคยบันทึกข้อมูลแบบร่าง
          </td>
        </tr>
      `;
      btnApproveKpi.style.display = "none";
      return;
    }

    const isSupervisorEditable = supervisorSelectedUserKpiStatus === "submitted";

    supervisorSelectedUserKpiData.forEach((kpi, idx) => {
      // Default supervisor score to self score if not set yet
      if (kpi.supervisorScore === undefined) {
        kpi.supervisorScore = kpi.selfScore;
      }
      if (kpi.supervisorNote === undefined) {
        kpi.supervisorNote = "";
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-center">${idx + 1}</td>
        <td>
          <div class="font-bold">${kpi.text}</div>
          <span style="font-size: 0.72rem; color: var(--kpi-text-muted);">${idx < 2 ? "Core" : "Functional"} KPI</span>
        </td>
        <td class="text-center font-bold">${kpi.weight}%</td>
        <td style="background: var(--kpi-secondary-light); font-weight: 500;">${kpi.actual || "-"}</td>
        <td class="text-center" style="font-weight: 700;">${kpi.selfScore} / 5</td>
        <td><span style="font-size: 0.78rem; word-break: break-all;">${kpi.note || "-"}</span></td>
        <td class="text-center">
          <select class="kpi-super-score-select" data-id="${kpi.id}" ${!isSupervisorEditable ? "disabled" : ""}>
            <option value="5" ${kpi.supervisorScore == 5 ? "selected" : ""}>5 - ยอดเยี่ยม</option>
            <option value="4" ${kpi.supervisorScore == 4 ? "selected" : ""}>4 - ดีมาก</option>
            <option value="3" ${kpi.supervisorScore == 3 ? "selected" : ""}>3 - พอใช้</option>
            <option value="2" ${kpi.supervisorScore == 2 ? "selected" : ""}>2 - ปรับปรุง</option>
            <option value="1" ${kpi.supervisorScore == 1 ? "selected" : ""}>1 - ต่ำกว่าเกณฑ์</option>
          </select>
        </td>
        <td>
          <input type="text" class="kpi-super-note-input" data-id="${kpi.id}" value="${kpi.supervisorNote}" placeholder="ใส่ความเห็นเพิ่มเติม..." ${!isSupervisorEditable ? "disabled" : ""}>
        </td>
      `;
      supervisorTbody.appendChild(tr);
    });

    // Calculations & displays
    updateSupervisorScoreSummary();

    if (isSupervisorEditable) {
      btnApproveKpi.style.display = "inline-flex";
      
      // Attach change events
      document.querySelectorAll(".kpi-super-score-select").forEach(select => {
        select.addEventListener("change", (e) => {
          const id = parseInt(e.target.getAttribute("data-id"));
          const kpi = supervisorSelectedUserKpiData.find(k => k.id === id);
          if (kpi) {
            kpi.supervisorScore = parseInt(e.target.value);
            updateSupervisorScoreSummary();
          }
        });
      });

      document.querySelectorAll(".kpi-super-note-input").forEach(input => {
        input.addEventListener("input", (e) => {
          const id = parseInt(e.target.getAttribute("data-id"));
          const kpi = supervisorSelectedUserKpiData.find(k => k.id === id);
          if (kpi) kpi.supervisorNote = e.target.value;
        });
      });
    } else {
      btnApproveKpi.style.display = "none";
    }
  }

  function updateSupervisorScoreSummary() {
    const results = calculateTotalKpiScore(supervisorSelectedUserKpiData, "supervisor");
    superCalcScore.textContent = `${results.score.toFixed(2)} / 5.00`;
    superCalcGrade.textContent = results.grade.split(" ")[0];
  }

  // Director approves employee's KPI
  if (btnApproveKpi) {
    btnApproveKpi.addEventListener("click", () => {
      const confirmApprove = confirm(`ท่านต้องการส่งอนุมัติผลการประเมินชี้วัดผลงานของพนักงานคนนี้ใช่หรือไม่? หลังจากกดอนุมัติแล้วเกรดจะบันทึกทันที`);
      if (confirmApprove) {
        // Save the updated scores with approved status
        const dataToSave = {
          status: "approved",
          lastUpdated: new Date().getTime(),
          kpis: supervisorSelectedUserKpiData.map(k => ({
            id: k.id,
            actual: k.actual,
            selfScore: k.selfScore,
            note: k.note,
            supervisorScore: k.supervisorScore,
            supervisorNote: k.supervisorNote
          }))
        };
        
        localStorage.setItem(`kpi_state_${supervisorSelectedUserKey}`, JSON.stringify(dataToSave));
        showToast("✔ อนุมัติแบบประเมินและสรุปเกรดผลงานเรียบร้อยแล้ว");
        
        // Reload area
        loadSupervisorEmployeeData();
      }
    });
  }

  // ----------------------------------------------------
  // 8. Official PDF Report Rendering View
  // ----------------------------------------------------
  function loadReportView() {
    // Populate report meta
    const empMeta = MOCK_USER_METADATA[session.userKey] || { dept: "องค์การสะพานปลา", supervisor: "--" };
    
    repEmpName.textContent = "คุณ" + session.name;
    repEmpRole.textContent = session.role;
    repEmpDept.textContent = empMeta.dept;
    repSupervisor.textContent = empMeta.supervisor;
    repEmpSigName.textContent = `( คุณ${session.name} )`;

    loadKpiDataForUser(session.userKey);

    const results = calculateTotalKpiScore(currentKpiData, currentKpiStatus === "approved" ? "supervisor" : "self");

    // Display status and grade
    if (currentKpiStatus === "draft") {
      repStatus.textContent = "กำลังดำเนินการกรอกแบบร่าง";
      repStatus.className = "font-bold text-danger";
      repGrade.textContent = "รอการประเมิน";
      repGrade.className = "font-bold font-large";
    } else if (currentKpiStatus === "submitted") {
      repStatus.textContent = "รอผู้ประเมินอนุมัติผลคะแนน";
      repStatus.className = "font-bold text-warning";
      repGrade.textContent = "รอผู้บังคับบัญชา";
      repGrade.className = "font-bold font-large";
    } else if (currentKpiStatus === "approved") {
      repStatus.textContent = "อนุมัติอย่างเป็นทางการแล้ว";
      repStatus.className = "font-bold font-large text-success";
      repGrade.textContent = results.grade;
      repGrade.className = "font-bold font-large text-primary";
    }

    // Render report table
    reportTbody.innerHTML = "";
    let totalWeight = 0;
    const scoreType = currentKpiStatus === "approved" ? "supervisor" : "self";

    currentKpiData.forEach((kpi, idx) => {
      totalWeight += kpi.weight;
      const score = kpi[scoreType] || kpi.selfScore;
      const weighted = (score * (kpi.weight / 100));

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-center">${idx + 1}</td>
        <td>
          <div class="font-bold">${kpi.text}</div>
          <span style="font-size: 0.7rem; color: #475569;">${idx < 2 ? "Core KPI" : "Functional KPI"}</span>
        </td>
        <td class="text-center">${kpi.weight}%</td>
        <td class="text-center">${kpi.target}</td>
        <td class="text-center font-bold">${kpi.actual || "-"}</td>
        <td class="text-center font-bold">${score}</td>
        <td class="text-center font-bold" style="background: #f8fafc;">${weighted.toFixed(2)}</td>
      `;
      reportTbody.appendChild(tr);
    });

    repTotalWeight.textContent = `${totalWeight}%`;
    
    if (currentKpiStatus === "draft") {
      repTotalScore.textContent = "-";
    } else {
      repTotalScore.textContent = results.score.toFixed(2);
    }
  }

  // ----------------------------------------------------
  // 9. Cross-tab session changes syncing
  // ----------------------------------------------------
  window.addEventListener("storage", (e) => {
    if (e.key === "fmo_user_session") {
      const ok = checkSession();
      if (ok) {
        loadKpiDashboardState();
      }
    }
  });

  // Run Startup Setup
  const sessionOk = checkSession();
  if (sessionOk) {
    initTabs();
  }
});
