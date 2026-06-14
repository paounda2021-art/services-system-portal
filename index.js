/**
 * FMO Systems Portal JS Logic
 * Handles Search, Tab Filters, Theme Switching, DateTime updates, Link Configurations,
 * and permission-based authentication flow (SSO Simulation).
 */

// 1. ตัวแปรสำหรับแก้ไขลิงก์ปลายทางของระบบต่างๆ (Configure System Links here)
const SYSTEM_LINKS = {
  eOffice: {
    main: "https://fmo.eoffice.go.th/",
    new: "https://fmo.eoffice.go.th/document/new",
    inbox: "https://fmo.eoffice.go.th/inbox"
  },
  ahtm: {
    main: "https://fishmarket2.athm-hr.com/",
    clock: "https://fishmarket2.athm-hr.com/attendance/clock-in",
    leave: "https://fishmarket2.athm-hr.com/leave/request"
  },
  kpi: {
    main: "https://fishmarket-pms.athm-hr.com/#/login",
    myKpi: "https://fishmarket-pms.athm-hr.com/#/login",
    submit: "https://fishmarket-pms.athm-hr.com/#/login"
  },
  carBooking: {
    main: "https://car-booking.fishmarket.co.th/",
    book: "https://car-booking.fishmarket.co.th/",
    calendar: "https://car-booking.fishmarket.co.th/"
  },
  workD: {
    main: "https://workd.go.th/",
    compose: "https://workd.go.th/mail/compose",
    inbox: "https://workd.go.th/mail/inbox"
  },
  itSupport: {
    main: "https://tickets-request.fishmarket.co.th/",
    create: "https://tickets-request.fishmarket.co.th/",
    status: "https://tickets-request.fishmarket.co.th/"
  },
  checkPermission: {
    main: "https://check-permission.fishmarket.co.th/",
    scan: "https://check-permission.fishmarket.co.th/",
    report: "https://check-permission.fishmarket.co.th/"
  },
  webRequest: {
    main: "https://web-request.fishmarket.co.th/",
    submit: "https://web-request.fishmarket.co.th/",
    history: "https://web-request.fishmarket.co.th/"
  },
  // สำหรับเจ้าหน้าที่สินเชื่อเท่านั้น (Stand-alone system)
  coreLoan: {
    main: "https://coreloan.fmo.go.th",
    calc: "https://coreloan.fmo.go.th/calculator",
    apply: "https://coreloan.fmo.go.th/apply"
  },
  myAccount: {
    main: "https://acc.fishmarket.co.th/",
    ledger: "https://acc.fishmarket.co.th/",
    report: "https://acc.fishmarket.co.th/"
  },
  myketPro: {
    main: "https://app.myket.in.th/auth/login",
    map: "https://app.myket.in.th/auth/login",
    contracts: "https://app.myket.in.th/auth/login"
  }
};

// Map system IDs to numbers
const SYSTEM_ID_MAP = {
  "eOffice": 1,
  "ahtm": 2,
  "kpi": 3,
  "carBooking": 4,
  "workD": 5,
  "itSupport": 6,
  "checkPermission": 7,
  "webRequest": 8,
  "coreLoan": 9,
  "myAccount": 10,
  "myketPro": 11
};

const REVERSE_SYSTEM_ID_MAP = {
  1: "eOffice",
  2: "ahtm",
  3: "kpi",
  4: "carBooking",
  5: "workD",
  6: "itSupport",
  7: "checkPermission",
  8: "webRequest",
  9: "coreLoan",
  10: "myAccount",
  11: "myketPro"
};

// 2. ข้อมูลสิทธิ์ผู้ใช้งานจำลอง (Mock Users Permissions) - ใช้รหัสตัวเลขแทนระบบงานตามภาพวาด
const MOCK_USERS = {
  user_it: {
    name: "สมชาย รักบริการ",
    role: "นักวิชาการคอมพิวเตอร์",
    avatar: "สม",
    allowed: [1, 2, 3, 4, 5, 6, 7, 8],
    pendingTasks: 3
  },
  user_finance: {
    name: "พิมใจ ใฝ่บัญชี",
    role: "เจ้าหน้าที่บัญชีและการเงิน",
    avatar: "พิม",
    allowed: [1, 2, 3, 5, 9, 10, 11],
    pendingTasks: 4
  },
  user_driver: {
    name: "นพดล ขับขี่ดี",
    role: "พนักงานขับรถยนต์",
    avatar: "นพ",
    allowed: [2, 3, 4, 5],
    pendingTasks: 1
  },
  user_exec: {
    name: "อนันต์ บริหารงาน",
    role: "ผู้อำนวยการ อสป.",
    avatar: "อน",
    allowed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    pendingTasks: 6
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Authentication State
  let isLoggedIn = false;
  let currentUserKey = "";
  let currentUserObj = null;
  let allUsers = [];

  // โหลดรายชื่อผู้ใช้งานทั้งหมดจาก users.json
  fetch('deploy_latest/users.json')
    .then(response => response.json())
    .then(data => {
      allUsers = data;
    })
    .catch(err => {
      console.error("Failed to load users.json:", err);
    });
  
  // UI State
  let currentCategory = "all";
  let searchQuery = "";

  // DOM Elements
  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search");
  const systemCards = document.querySelectorAll(".system-card");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const searchFallback = document.getElementById("search-fallback");
  const resetSearchBtn = document.getElementById("reset-search-btn");
  
  // Theme Toggle Elements
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const iconClassic = themeToggleBtn.querySelector(".icon-classic");
  const iconOcean = themeToggleBtn.querySelector(".icon-ocean");
  const iconMint = themeToggleBtn.querySelector(".icon-mint");
  
  // Notification Sidebar Elements
  const notificationBtn = document.getElementById("notification-btn");
  const pendingTasksTrigger = document.getElementById("pending-tasks-trigger");
  const closeSidebarBtn = document.getElementById("close-sidebar");
  const sidebar = document.getElementById("notifications-sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const alertItems = document.querySelectorAll(".alert-item");
  
  // Header Authentication Containers
  const loginWrapper = document.getElementById("login-wrapper");
  const userProfileBox = document.getElementById("user-profile-box");
  const userAvatar = document.getElementById("user-avatar");
  const userNameLabel = document.getElementById("user-name-label");
  const userRoleLabel = document.getElementById("user-role-label");
  
  // Login Modal Elements
  const loginTriggerBtn = document.getElementById("login-trigger-btn");
  const loginModal = document.getElementById("login-modal");
  const closeLoginModal = document.getElementById("close-login-modal");
  const loginForm = document.getElementById("login-form");
  const loginEmployeeIdInput = document.getElementById("login-employee-id");
  const logoutBtn = document.getElementById("logout-btn");
  
  // Dashboard & Welcome Banner Elements
  const welcomeTitle = document.getElementById("welcome-title");
  const welcomeSubtitle = document.getElementById("welcome-subtitle");
  const dashboardStats = document.getElementById("dashboard-stats");
  const totalSystemsNum = document.getElementById("total-systems-num");
  const onlineSystemsNum = document.getElementById("online-systems-num");
  const pendingTasksNum = document.getElementById("pending-tasks-num");

  // ----------------------------------------------------
  // 1. ดำเนินการตั้งค่าลิงก์ในหน้าเว็บ (Setup Dynamic Links)
  // ----------------------------------------------------
  function initializeLinks() {
    // เซ็ตลิงก์สำหรับปุ่มเข้าใช้งานหลัก
    document.querySelectorAll(".btn-enter").forEach(btn => {
      const sysId = btn.getAttribute("data-sys");
      if (SYSTEM_LINKS[sysId]) {
        btn.setAttribute("href", SYSTEM_LINKS[sysId].main || "#");
      }
    });

    // เซ็ตลิงก์สำหรับปุ่มทางลัดด่วน (Quick Links)
    document.querySelectorAll(".btn-quick").forEach(btn => {
      const sysId = btn.getAttribute("data-sys");
      const action = btn.getAttribute("data-action");
      if (SYSTEM_LINKS[sysId] && SYSTEM_LINKS[sysId][action]) {
        btn.setAttribute("href", SYSTEM_LINKS[sysId][action]);
      } else {
        btn.setAttribute("href", "#");
      }
    });
  }

  // ----------------------------------------------------
  // 2. ฟังก์ชันค้นหาและกรองการ์ดระบบงาน (Filtering and Searching)
  // ----------------------------------------------------
  function filterSystems() {
    let visibleCount = 0;
    const allowedList = isLoggedIn ? currentUserObj.allowed : null;
    
    // นับจำนวนการ์ดในแต่ละหมวดหมู่เพื่ออัปเดตตัวเลขบนแท็บ
    const counts = { all: 0, general: 0, it: 0, finance: 0 };

    systemCards.forEach(card => {
      const sysId = card.getAttribute("data-id");
      const category = card.getAttribute("data-category");
      
      // การคัดกรองการเข้าถึงตามสิทธิ์ (ถ้าล็อคอินแล้วจะเช็คสิทธิ์ ถ้ายังไม่ล็อคอินจะแสดงครบ 10 ระบบ)
      const hasPermission = !isLoggedIn || (allowedList && allowedList.includes(SYSTEM_ID_MAP[sysId]));

      // จัดการคลาสล็อคการใช้งานการ์ด
      if (isLoggedIn && hasPermission) {
        card.classList.remove("locked");
      } else if (!isLoggedIn) {
        card.classList.add("locked");
      }

      const titleTh = card.querySelector(".system-title-th").textContent.toLowerCase();
      const titleEn = card.querySelector(".system-title-en").textContent.toLowerCase();
      const desc = card.querySelector(".system-desc").textContent.toLowerCase();
      
      const matchesSearch = titleTh.includes(searchQuery) || 
                            titleEn.includes(searchQuery) || 
                            desc.includes(searchQuery);
      
      const matchesCategory = (currentCategory === "all" || category === currentCategory);

      // ตรวจสอบการแสดงผลการ์ด
      if (hasPermission && matchesSearch && matchesCategory) {
        card.style.display = "flex";
        visibleCount++;
      } else {
        card.style.display = "none";
      }

      // นับสะสมสถิติสำหรับแท็บกรองด้านบน
      if (hasPermission && matchesSearch) {
        counts.all++;
        if (category === "general") counts.general++;
        if (category === "it") counts.it++;
        if (category === "finance") counts.finance++;
      }
    });

    // อัปเดตตัวเลขจำนวนสะสมบนแท็บ
    document.getElementById("count-all").textContent = counts.all;
    document.getElementById("count-general").textContent = counts.general;
    document.getElementById("count-it").textContent = counts.it;
    document.getElementById("count-finance").textContent = counts.finance;

    // แสดงหน้าจอแจ้งเตือนเมื่อไม่พบข้อมูลการค้นหา
    if (visibleCount === 0) {
      searchFallback.style.display = "flex";
      document.getElementById("systems-grid-container").style.display = "none";
    } else {
      searchFallback.style.display = "none";
      document.getElementById("systems-grid-container").style.display = "grid";
    }

    // อัปเดตตัวเลขในส่วนสถิติ
    totalSystemsNum.textContent = visibleCount;
    onlineSystemsNum.textContent = visibleCount;
  }

  // ค้นหาแบบเรียลไทม์ (Live Search)
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    
    // ควบคุมการแสดงผลปุ่มล้างคำค้นหา (Clear Button)
    if (searchQuery.length > 0) {
      clearSearchBtn.style.display = "flex";
    } else {
      clearSearchBtn.style.display = "none";
    }
    
    filterSystems();
  });

  // ล้างการค้นหาเมื่อกดปุ่ม X
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearSearchBtn.style.display = "none";
    searchInput.focus();
    filterSystems();
  });

  // ล้างการค้นหาเมื่อกดปุ่ม Fallback reset
  resetSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearSearchBtn.style.display = "none";
    currentCategory = "all";
    
    tabButtons.forEach(btn => {
      if (btn.getAttribute("data-category") === "all") {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    filterSystems();
  });

  // จัดการการเปลี่ยนแท็บหมวดหมู่ (Category Tabs switching)
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      tabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      
      currentCategory = button.getAttribute("data-category");
      filterSystems();
    });
  });

  // ----------------------------------------------------
  // 3. จัดการระบบล็อกอิน (Login / Logout Control Flow)
  // ----------------------------------------------------
  
  // เปิดโมดอลเข้าสู่ระบบ
  loginTriggerBtn.addEventListener("click", () => {
    loginModal.classList.add("open");
  });

  // ปิดโมดอลเข้าสู่ระบบ
  closeLoginModal.addEventListener("click", () => {
    loginModal.classList.remove("open");
  });

  // ยืนยันการเข้าสู่ระบบ (Submit Login)
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const empIdInput = loginEmployeeIdInput.value.trim();
    const errorMsg = document.getElementById("login-error-msg");
    
    // ค้นหาผู้ใช้งานในรายการ allUsers
    const foundUser = allUsers.find(u => u.employee_id === empIdInput);
    if (!foundUser) {
      errorMsg.textContent = "ไม่พบรหัสพนักงานนี้ในระบบ";
      errorMsg.style.display = "block";
      return;
    }
    
    errorMsg.style.display = "none";
        // ทำความสะอาดชื่อคำนำหน้าและแปลงสิทธิ์
    let cleanName = foundUser.name.replace(/^(นาย|นางสาว|นาง|น\.ส\.|ดร\.|ว่าที่\s*ร\.ต\.|นายนาย)\s*/, '').trim();
    let avatarText = cleanName.substring(0, 2);
    
    // ดึงสิทธิ์จากคอลัมน์ premission (แยกด้วยจุลภาค)
    let allowedNums = [];
    if (foundUser.premission) {
      allowedNums = foundUser.premission.split(',')
        .map(x => x.trim())
        .filter(x => x !== "")
        .map(Number);
    }
    
    const userObj = {
      name: cleanName,
      role: foundUser.position || foundUser.role || "เจ้าหน้าที่ อสป.",
      avatar: avatarText || "พน",
      allowed: allowedNums,
      pendingTasks: allowedNums.length > 0 ? (allowedNums.length % 3) + 1 : 0
    };
    
    performLogin(userObj, foundUser.employee_id);
  });

  function performLogin(userObj, userKey) {
    if (!userObj) return;

    isLoggedIn = true;
    currentUserKey = userKey;
    currentUserObj = userObj;

    // บันทึกเซสชันลงใน localStorage สำหรับระบบย่อยใช้งานแบบ SSO (แปลงรหัสตัวเลขกลับเป็น String ID เพื่อรักษาความเข้ากันได้)
    const sessionData = {
      userKey: userKey,
      name: userObj.name,
      role: userObj.role,
      avatar: userObj.avatar,
      allowedSystems: userObj.allowed.map(id => REVERSE_SYSTEM_ID_MAP[id] || id),
      loginTime: new Date().getTime()
    };
    localStorage.setItem("fmo_user_session", JSON.stringify(sessionData));

    // 1. จัดการการแสดงผล Header
    loginWrapper.style.display = "none";
    userProfileBox.style.display = "flex";
    if (notificationBtn) notificationBtn.style.display = "none";
    userAvatar.querySelector("span").textContent = userObj.avatar;
    userNameLabel.textContent = userObj.name;
    userRoleLabel.textContent = userObj.role;

    // 2. จัดการหน้า Welcome Banner & Dashboard
    welcomeTitle.textContent = `สวัสดีคุณ${userObj.name} ยินดีต้อนรับสู่ระบบสารสนเทศกลาง อสป.`;
    welcomeSubtitle.textContent = `เข้าถึงระบบบริหารงานสะพานปลา ระบบบริการไอที และระบบงานการเงินได้ในจุดเดียวเพื่อความสะดวกรวดเร็วในการทำงาน`;
    dashboardStats.style.opacity = "1.0";
    dashboardStats.style.pointerEvents = "auto";
    pendingTasksNum.textContent = userObj.pendingTasks;
    const alertCounter = document.getElementById("alert-counter");
    if (alertCounter) {
      alertCounter.textContent = userObj.pendingTasks;
    }

    // 3. กรองการแจ้งเตือนใน Sidebar ตามสิทธิ์
    document.querySelectorAll(".alert-item").forEach(item => {
      const targetSystem = item.getAttribute("data-target");
      if (userObj.allowed.includes(SYSTEM_ID_MAP[targetSystem])) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });

    // 4. ปิดหน้าต่างโมดอลและอัปเดตระบบการ์ดทั้งหมด
    loginModal.classList.remove("open");
    filterSystems();
    updateKpiBadgeStatus();
    updateCarBookingBadgeStatus();
  }

  // การออกจากระบบ (Perform Logout)
  logoutBtn.addEventListener("click", () => {
    performLogout();
  });

  function performLogout() {
    isLoggedIn = false;
    currentUserKey = "";

    // ล้างข้อมูลเซสชันใน localStorage
    localStorage.removeItem("fmo_user_session");

    // 1. รีเซ็ต Header
    loginWrapper.style.display = "flex";
    userProfileBox.style.display = "none";
    if (notificationBtn) notificationBtn.style.display = "none";
    closeSidebar(); // ปิด sidebar ถ้าเปิดค้างไว้

    // 2. รีเซ็ต Welcome Banner & Dashboard
    welcomeTitle.textContent = "ยินดีต้อนรับสู่ระบบสารสนเทศกลาง อสป.";
    welcomeSubtitle.textContent = "องค์การสะพานปลาให้บริการรวมศูนย์ระบบงานสารสนเทศเพื่อความสะดวกและรวดเร็ว โปรดเข้าสู่ระบบเพื่อใช้งาน";
    dashboardStats.style.opacity = "0.6";
    dashboardStats.style.pointerEvents = "none";
    pendingTasksNum.textContent = "0";

    // 3. รีเซ็ตตัวกรองและการ์ดระบบทั้งหมด (ให้กลับมาล็อกการ์ด และแสดงครบ 10 ตัว)
    filterSystems();
    updateKpiBadgeStatus();
    updateCarBookingBadgeStatus();
  }

  // ----------------------------------------------------
  // 4. ระบบสลับดีไซน์พอร์ทัล 3 รูปแบบ (3-Theme Cycle Switcher)
  // ----------------------------------------------------
  // ลำดับธีม: light-theme -> dark-ocean-theme -> mint-coastal-theme
  const themes = ["light-theme", "dark-ocean-theme", "mint-coastal-theme"];
  let currentThemeIndex = 0;

  function applyTheme(themeName) {
    // ลบคลาสธีมเดิมออกทั้งหมด
    themes.forEach(t => document.body.classList.remove(t));
    
    // ใส่คลาสธีมปัจจุบัน
    document.body.classList.add(themeName);
    
    // เซฟลง localStorage
    localStorage.setItem("fmo-portal-theme-3", themeName);
    
    // ปิดไอคอนทั้งหมดแล้วแสดงเฉพาะธีมปัจจุบัน
    iconClassic.style.display = "none";
    iconOcean.style.display = "none";
    iconMint.style.display = "none";
    
    if (themeName === "light-theme") {
      iconClassic.style.display = "block";
    } else if (themeName === "dark-ocean-theme") {
      iconOcean.style.display = "block";
    } else if (themeName === "mint-coastal-theme") {
      iconMint.style.display = "block";
    }
  }

  // โหลดธีมตั้งต้นที่ผู้ใช้เคยเลือกไว้
  const savedTheme = localStorage.getItem("fmo-portal-theme-3") || "light-theme";
  currentThemeIndex = themes.indexOf(savedTheme);
  if (currentThemeIndex === -1) currentThemeIndex = 0;
  applyTheme(themes[currentThemeIndex]);

  themeToggleBtn.addEventListener("click", () => {
    // วนรอบเพื่อสลับธีม 1 -> 2 -> 3 -> 1
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    applyTheme(themes[currentThemeIndex]);
  });

  // ----------------------------------------------------
  // 5. ควบคุมแถบสไลด์การแจ้งเตือนด้านข้าง (Sidebar Panels)
  // ----------------------------------------------------
  function openSidebar() {
    if (!isLoggedIn) return; // เข้าใช้งานได้เฉพาะตอนล็อกอินแล้วเท่านั้น
    sidebar.classList.add("open");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    document.body.style.overflow = "auto";
  }

  if (notificationBtn) notificationBtn.addEventListener("click", openSidebar);
  pendingTasksTrigger.addEventListener("click", openSidebar);
  closeSidebarBtn.addEventListener("click", closeSidebar);
  overlay.addEventListener("click", closeSidebar);

  // เมื่อคลิกการ์ดแจ้งเตือนใน Sidebar จะสลับไปโฟกัสที่การ์ดระบบงาน
  alertItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetSystem = item.getAttribute("data-target");
      closeSidebar();
      
      tabButtons.forEach(btn => {
        if (btn.getAttribute("data-category") === "all") {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
      currentCategory = "all";
      
      let searchWord = "";
      if (targetSystem === "eOffice") searchWord = "e-office";
      if (targetSystem === "checkPermission") searchWord = "check permission";
      if (targetSystem === "carBooking") searchWord = "car booking";

      searchInput.value = searchWord;
      searchQuery = searchWord;
      clearSearchBtn.style.display = "flex";
      
      filterSystems();
      
      const targetCard = document.querySelector(`.system-card[data-id="${targetSystem}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
        targetCard.style.boxShadow = "0 0 20px rgba(43, 108, 176, 0.4)";
        setTimeout(() => {
          targetCard.style.boxShadow = "";
        }, 2000);
      }
    });
  });

  // ----------------------------------------------------
  // 6. ควบคุมการแสดงผล QR Code Modal (QR Code Display)
  // ----------------------------------------------------
  const qrModal = document.getElementById("qr-modal");
  const qrModalImage = document.getElementById("qr-modal-image");
  const qrModalTitle = document.getElementById("qr-modal-title");
  const qrModalLink = document.getElementById("qr-modal-link");
  const closeQrModalBtn = document.getElementById("close-qr-modal");

  function openQrModal(sysId, sysName) {
    if (!isLoggedIn) return; // เรียกแสดง QR Code ได้เฉพาะตอนเข้าระบบแล้ว
    if (SYSTEM_LINKS[sysId]) {
      const url = SYSTEM_LINKS[sysId].main;
      
      qrModalTitle.textContent = `QR Code ระบบ ${sysName}`;
      qrModalLink.textContent = url;
      qrModalLink.setAttribute("href", url);
      
      qrModalImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
      qrModal.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  }

  function closeQrModal() {
    qrModal.classList.remove("open");
    qrModalImage.src = "";
    document.body.style.overflow = "auto";
  }

  document.querySelectorAll(".btn-qr").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const sysId = btn.getAttribute("data-sys");
      const sysName = btn.getAttribute("data-name");
      openQrModal(sysId, sysName);
    });
  });

  closeQrModalBtn.addEventListener("click", closeQrModal);
  qrModal.addEventListener("click", (e) => {
    if (e.target === qrModal) {
      closeQrModal();
    }
  });

  // ----------------------------------------------------
  // 7. อัปเดตเวลานาฬิกาเรียลไทม์ (DateTime Clock Updates)
  // ----------------------------------------------------
  function updateClock() {
    const now = new Date();
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById("current-time").textContent = `${hours}:${minutes}:${seconds}`;
    
    const thaiMonths = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    const date = now.getDate();
    const month = thaiMonths[now.getMonth()];
    const year = now.getFullYear() + 543;
    document.getElementById("current-date").textContent = `${date} ${month} ${year}`;
  }

  // ปิดหน้าต่างทั้งหมดด้วยปุ่ม ESC บนคีย์บอร์ด
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (qrModal.classList.contains("open")) closeQrModal();
      if (loginModal.classList.contains("open")) loginModal.classList.remove("open");
    }
  });

  // ดักจับการปิดโมดอลล็อคอินเมื่อกดพื้นที่รอบนอก
  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) {
      loginModal.classList.remove("open");
    }
  });

  // ฟังก์ชันอัปเดตสถานะป้ายประเมินผล KPI แบบเรียลไทม์
  function updateKpiBadgeStatus() {
    const kpiBadge = document.getElementById("badge-kpi");
    if (!kpiBadge) return;

    if (!isLoggedIn) {
      kpiBadge.textContent = "รอบการประเมินประจำปี";
      kpiBadge.className = "meta-badge warning";
      return;
    }

    const kpiStateRaw = localStorage.getItem(`kpi_state_${currentUserKey}`);
    if (kpiStateRaw) {
      try {
        const kpiState = JSON.parse(kpiStateRaw);
        if (kpiState.status === "approved") {
          kpiBadge.textContent = "ได้รับการอนุมัติแล้ว";
          kpiBadge.className = "meta-badge success";
        } else if (kpiState.status === "submitted") {
          kpiBadge.textContent = "รอหัวหน้าอนุมัติ";
          kpiBadge.className = "meta-badge warning";
        } else {
          kpiBadge.textContent = "กำลังกรอกแบบประเมิน";
          kpiBadge.className = "meta-badge default";
        }
      } catch (e) {
        kpiBadge.textContent = "ยังไม่ได้ส่งแบบประเมิน";
        kpiBadge.className = "meta-badge alert";
      }
    } else {
      kpiBadge.textContent = "ยังไม่ได้ส่งแบบประเมิน";
      kpiBadge.className = "meta-badge alert";
    }
  }

  // ฟังก์ชันอัปเดตสถานะป้ายจองรถยนต์ส่วนกลาง แบบเรียลไทม์
  function updateCarBookingBadgeStatus() {
    const cbBadge = document.getElementById("badge-carBooking");
    if (!cbBadge) return;

    if (!isLoggedIn) {
      cbBadge.textContent = "รอเดินทางวันนี้ 1 คัน";
      cbBadge.className = "meta-badge alert";
      return;
    }

    const bookingsRaw = localStorage.getItem("fmo_cb_bookings");
    if (bookingsRaw) {
      try {
        const bookings = JSON.parse(bookingsRaw);
        
        if (currentUserKey === "user_exec") {
          // Director: show pending requests
          const pendingCount = bookings.filter(b => b.status === "pending").length;
          if (pendingCount > 0) {
            cbBadge.textContent = `รออนุมัติจองรถ ${pendingCount} รายการ`;
            cbBadge.className = "meta-badge alert";
          } else {
            cbBadge.textContent = "ไม่มีงานจองรถค้างอนุมัติ";
            cbBadge.className = "meta-badge default";
          }
        } else if (currentUserKey === "user_driver") {
          // Driver: show assigned jobs
          const driverJobs = bookings.filter(b => b.assignedDriverKey === "user_driver" && b.status === "approved").length;
          if (driverJobs > 0) {
            cbBadge.textContent = `มีงานจองรถใหม่ ${driverJobs} รายการ`;
            cbBadge.className = "meta-badge alert";
          } else {
            cbBadge.textContent = "ไม่มีภารกิจเดินรถใหม่";
            cbBadge.className = "meta-badge default";
          }
        } else {
          // General employees: show their latest booking status
          const userBookings = bookings.filter(b => b.requesterKey === currentUserKey);
          if (userBookings.length > 0) {
            userBookings.sort((a,b) => b.id.localeCompare(a.id));
            const latest = userBookings[0];
            if (latest.status === "pending") {
              cbBadge.textContent = "คำขอจองรถ: รออนุมัติ";
              cbBadge.className = "meta-badge warning";
            } else if (latest.status === "approved") {
              cbBadge.textContent = "จองรถอนุมัติแล้ว (รอคนขับ)";
              cbBadge.className = "meta-badge warning";
            } else if (latest.status === "confirmed") {
              cbBadge.textContent = "คนขับรับทราบและเตรียมรถแล้ว";
              cbBadge.className = "meta-badge success";
            } else if (latest.status === "completed") {
              cbBadge.textContent = "ภารกิจเดินรถเสร็จสิ้น";
              cbBadge.className = "meta-badge success";
            } else {
              cbBadge.textContent = "คำขอถูกปฏิเสธ";
              cbBadge.className = "meta-badge default";
            }
          } else {
            cbBadge.textContent = "ไม่มีประวัติการจองรถ";
            cbBadge.className = "meta-badge default";
          }
        }
      } catch (e) {
        cbBadge.textContent = "รอเดินทางวันนี้ 1 คัน";
        cbBadge.className = "meta-badge default";
      }
    } else {
      cbBadge.textContent = "รอเดินทางวันนี้ 1 คัน";
      cbBadge.className = "meta-badge default";
    }
  }

  // ดักจับการเปลี่ยนแปลงใน localStorage เพื่อซิงก์ข้อมูลข้ามแท็บ
  window.addEventListener("storage", (e) => {
    if (e.key === "fmo_user_session") {
      const sessionRaw = localStorage.getItem("fmo_user_session");
      if (sessionRaw) {
        try {
          const session = JSON.parse(sessionRaw);
          if (currentUserKey !== session.userKey) {
            const userObj = {
              name: session.name,
              role: session.role,
              avatar: session.avatar,
              allowed: session.allowedSystems.map(sysKey => SYSTEM_ID_MAP[sysKey] || sysKey),
              pendingTasks: session.pendingTasks || 2
            };
            performLogin(userObj, session.userKey);
          }
        } catch (err) {}
      } else if (isLoggedIn) {
        performLogout();
      }
    } else if (e.key && e.key.startsWith("kpi_state_")) {
      updateKpiBadgeStatus();
    } else if (e.key === "fmo_cb_bookings") {
      updateCarBookingBadgeStatus();
    }
  });

  // Dynamic Online Users Counter (ตัวนับเค้าเตอร์คนออนไลน์แบบสุ่มมีความเคลื่อนไหว)
  const onlineUsersCountEl = document.getElementById("online-users-count");
  if (onlineUsersCountEl) {
    let currentOnline = Math.floor(Math.random() * 21) + 15;
    onlineUsersCountEl.textContent = currentOnline + " คน";
    setInterval(() => {
      const change = Math.floor(Math.random() * 3) - 1;
      currentOnline = Math.max(5, currentOnline + change);
      onlineUsersCountEl.textContent = currentOnline + " คน";
    }, 12000);
  }

  // เรียกใช้ตั้งแต่วินาทีแรก และรันทุกๆ 1 วินาที
  updateClock();
  setInterval(updateClock, 1000);

  // เริ่มต้นตั้งค่าลิงก์
  initializeLinks();

  // ตรวจสอบเซสชันค้างอยู่จากเบราว์เซอร์ (Auto-Login if session exists)
  const existingSession = localStorage.getItem("fmo_user_session");
  if (existingSession) {
    try {
      const session = JSON.parse(existingSession);
      const userObj = {
        name: session.name,
        role: session.role,
        avatar: session.avatar,
        allowed: session.allowedSystems.map(sysKey => SYSTEM_ID_MAP[sysKey] || sysKey),
        pendingTasks: session.pendingTasks || 2
      };
      performLogin(userObj, session.userKey);
    } catch (e) {
      localStorage.removeItem("fmo_user_session");
      performLogout();
    }
  } else {
    performLogout();
  }
});
