/**
 * FMO Car Booking Sub-system JS Logic
 * Simulates role-based UI flows, vehicle assignment, driver acceptance, and pre-trip checklists.
 */

// 1. Mock Fleet Data
const MOCK_FLEET = [
  { id: 1, type: "van_standard", name: "Toyota Commuter (รถตู้โดยสาร 11 ที่นั่ง)", plate: "3กข-1234", driver: "คุณนพดล ขับขี่ดี", status: "available", icon: "🚐" },
  { id: 2, type: "van_vip", name: "Toyota Alphard (รถตู้ผู้บริหาร VIP 7 ที่นั่ง)", plate: "1กข-9999", driver: "นายสมควร ขับเก่ง", status: "available", icon: "🚘" },
  { id: 3, type: "sedan", name: "Toyota Camry (รถเก๋งประจำตำแหน่ง 4 ที่นั่ง)", plate: "กง-8888", driver: "นายวิชัย บริการดี", status: "inuse", icon: "🚗" },
  { id: 4, type: "pickup", name: "Mitsubishi Triton (รถกระบะตอนครึ่งเอนกประสงค์)", plate: "บง-5555", driver: "นายมานพ ขนส่ง", status: "available", icon: "🛻" }
];

// Initial bookings if localStorage is empty
const INITIAL_BOOKINGS = [
  {
    id: "CB-001",
    requester: "พิมใจ ใฝ่บัญชี",
    requesterKey: "user_finance",
    destination: "สะพานปลาสมุทรปราการ",
    passengers: 3,
    startDate: "2026-06-05",
    startTime: "09:00",
    endDate: "2026-06-05",
    endTime: "16:00",
    carType: "van_standard",
    purpose: "นำส่งงบการเงินและเอกสารภาษีประเมินรายเดือน ณ ท่าเทียบเรือประมง",
    status: "completed",
    assignedCarId: 1,
    assignedDriverKey: "user_driver",
    checklistStatus: true
  },
  {
    id: "CB-002",
    requester: "สมชาย รักบริการ",
    requesterKey: "user_it",
    destination: "สะพานปลาหัวหิน จ.ประจวบคีรีขันธ์",
    passengers: 5,
    startDate: "2026-06-08",
    startTime: "07:30",
    endDate: "2026-06-10",
    endTime: "18:00",
    carType: "van_standard",
    purpose: "เดินทางตรวจสอบระบบเครือข่ายอินเทอร์เน็ตสะพานปลาหัวหิน และติดตั้ง Helpdesk",
    status: "pending",
    assignedCarId: null,
    assignedDriverKey: null,
    checklistStatus: false
  }
];

document.addEventListener("DOMContentLoaded", () => {
  // Session variables
  let session = null;
  let bookings = [];
  let fleet = [];
  let activeTab = "fleet";

  // DOM Elements
  const tabButtons = document.querySelectorAll(".cb-tab-btn");
  const panels = document.querySelectorAll(".cb-panel");
  const toast = document.getElementById("cb-toast-msg");

  // User Profile
  const userNameLabel = document.getElementById("cb-user-name");
  const userRoleLabel = document.getElementById("cb-user-role");
  const userAvatarSpan = document.getElementById("cb-user-avatar").querySelector("span");

  // Forms
  const carBookingForm = document.getElementById("car-booking-form");
  const btnCancelBook = document.getElementById("btn-cancel-book");

  // Driver elements
  const driverJobsList = document.getElementById("driver-jobs-list");
  const driverPendingJobsCount = document.getElementById("driver-pending-jobs-count");
  const preTripChecklistContainer = document.getElementById("pre-trip-checklist-container");
  const preTripForm = document.getElementById("pre-trip-form");
  const checklistCarPlate = document.getElementById("checklist-car-plate");
  const checklistDestination = document.getElementById("checklist-destination");
  const checkBookingId = document.getElementById("check-booking-id");

  // Manager elements
  const managerPendingCount = document.getElementById("manager-pending-count");
  const managerTbody = document.getElementById("manager-tbody");

  // History
  const historyTbody = document.getElementById("history-tbody");
  const historyCount = document.getElementById("history-count");

  // ----------------------------------------------------
  // 1. SSO Authentication Check
  // ----------------------------------------------------
  function checkSession() {
    const sessionRaw = localStorage.getItem("fmo_user_session");
    if (!sessionRaw) {
      showLockOverlay("กรุณากรอกข้อมูลเข้าสู่ระบบกลาง อสป. ที่หน้าหลักพอร์ทัลก่อนเข้าใช้งานระบบจองรถ");
      return false;
    }
    
    try {
      session = JSON.parse(sessionRaw);
      const isAllowed = session.allowedSystems && session.allowedSystems.includes("carBooking");
      if (!isAllowed) {
        showLockOverlay(`คุณ ${session.name} ไม่มีสิทธิ์ใช้งานระบบจองรถยนต์ส่วนกลาง อสป.`);
        return false;
      }
      
      // Load user profiles
      userNameLabel.textContent = "คุณ" + session.name;
      userRoleLabel.textContent = session.role;
      userAvatarSpan.textContent = session.avatar;
      
      // Adapt Tabs menu based on role
      if (session.userKey === "user_exec") {
        document.getElementById("tab-btn-approve").style.display = "flex";
      } else if (session.userKey === "user_driver") {
        document.getElementById("tab-btn-driver").style.display = "flex";
        document.getElementById("tab-btn-book").style.display = "none"; // Driver cannot request booking
      }
      
      return true;
    } catch (e) {
      showLockOverlay("เซสชันล็อกอินขัดข้อง กรุณาล็อกอินใหม่อีกครั้ง");
      return false;
    }
  }

  function showLockOverlay(message) {
    document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: 'K2D', sans-serif; background: #eff6ff; color: #1e3a8a; text-align: center; padding: 20px;">
        <div style="font-size: 80px; margin-bottom: 20px;">🔒</div>
        <h2 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 10px; color: #1e3a8a;">การเข้าใช้งานถูกจำกัด (Access Denied)</h2>
        <p style="color: #64748b; font-size: 1.05rem; margin-bottom: 30px; max-width: 500px;">${message}</p>
        <a href="index.html" style="padding: 0.8rem 2rem; background: #2563eb; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
          กลับไปเข้าสู่ระบบที่หน้าหลัก
        </a>
      </div>
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

    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam === "book" && session.userKey !== "user_driver") {
      switchTab("book");
    } else if (tabParam === "calendar" || tabParam === "history") {
      switchTab("fleet");
    } else {
      switchTab("fleet");
    }
  }

  function switchTab(tabName) {
    activeTab = tabName;
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

    // Load data specific to tabs
    if (tabName === "fleet") {
      renderFleetGrid();
      renderBookingHistory();
    } else if (tabName === "approve") {
      renderManagerApproveTable();
    } else if (tabName === "driver-panel") {
      renderDriverJobs();
    }
  }

  // ----------------------------------------------------
  // 3. Load / Save Database States (localStorage)
  // ----------------------------------------------------
  function loadDatabase() {
    // Fleet Loading
    const savedFleet = localStorage.getItem("fmo_cb_fleet");
    if (savedFleet) {
      fleet = JSON.parse(savedFleet);
    } else {
      fleet = JSON.parse(JSON.stringify(MOCK_FLEET));
      localStorage.setItem("fmo_cb_fleet", JSON.stringify(fleet));
    }

    // Bookings Loading
    const savedBookings = localStorage.getItem("fmo_cb_bookings");
    if (savedBookings) {
      bookings = JSON.parse(savedBookings);
    } else {
      bookings = JSON.parse(INITIAL_BOOKINGS_STRINGIFY());
      localStorage.setItem("fmo_cb_bookings", JSON.stringify(bookings));
    }
  }

  function INITIAL_BOOKINGS_STRINGIFY() {
    return JSON.stringify(INITIAL_BOOKINGS);
  }

  function saveDatabase() {
    localStorage.setItem("fmo_cb_fleet", JSON.stringify(fleet));
    localStorage.setItem("fmo_cb_bookings", JSON.stringify(bookings));
    
    // Sync notifications for SSO Portal
    updatePortalStats();
  }

  function updatePortalStats() {
    // Update the pending task count for the Director (user_exec)
    const pendingCount = bookings.filter(b => b.status === "pending").length;
    
    // Check if the current user is director, also sync pending tasks count
    // In index.js, we read notifications dynamically
    // We can save a key `cb_pending_tasks_exec` = pendingCount
    localStorage.setItem("fmo_cb_pending_exec", pendingCount);
  }

  function showToast(message) {
    toast.querySelector("span").textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // ----------------------------------------------------
  // 4. Tab 1: Render Fleet Grid & Booking History
  // ----------------------------------------------------
  function renderFleetGrid() {
    const fleetContainer = document.getElementById("fleet-grid-container");
    if (!fleetContainer) return;

    fleetContainer.innerHTML = "";

    const statusMap = {
      available: { text: "ว่าง (Available)", class: "available" },
      inuse: { text: "ติดภารกิจ (In Use)", class: "inuse" },
      maintenance: { text: "ซ่อมบำรุง (Maintenance)", class: "maintenance" }
    };

    fleet.forEach(car => {
      const status = statusMap[car.status] || statusMap.available;
      const card = document.createElement("div");
      card.className = "fleet-card";
      card.innerHTML = `
        <div class="fleet-card-header">
          <span class="fleet-car-type">${car.type.replace("_", " ")}</span>
          <span class="cb-badge-status ${status.class}">${status.text}</span>
        </div>
        <div class="fleet-image-placeholder">
          <span class="car-icon">${car.icon}</span>
          <span class="plate-num-overlay">${car.plate}</span>
        </div>
        <div class="fleet-details">
          <h4>${car.name}</h4>
          <div class="fleet-info-row">
            <span>พนักงานขับรถหลัก:</span>
            <strong>${car.driver}</strong>
          </div>
        </div>
      `;
      fleetContainer.appendChild(card);
    });
  }

  function renderBookingHistory() {
    if (!historyTbody) return;
    historyTbody.innerHTML = "";

    // Filter bookings based on user permission (Drivers see all, Exec sees all, IT/Finance see only theirs)
    let filteredBookings = [];
    if (session.userKey === "user_exec" || session.userKey === "user_driver") {
      filteredBookings = bookings;
    } else {
      filteredBookings = bookings.filter(b => b.requesterKey === session.userKey);
    }

    // Sort bookings: pending first, then completed by date
    filteredBookings.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.startDate) - new Date(a.startDate);
    });

    historyCount.textContent = `${filteredBookings.length} รายการ`;

    if (filteredBookings.length === 0) {
      historyTbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center" style="padding: 2.5rem; color: var(--cb-text-muted);">
            ไม่มีข้อมูลประวัติการจองใช้รถยนต์ส่วนกลาง
          </td>
        </tr>
      `;
      return;
    }

    const statusMap = {
      pending: { text: "รออนุมัติ", class: "pending" },
      approved: { text: "อนุมัติแล้ว (รอคนรับงาน)", class: "warning" },
      confirmed: { text: "คนขับรับงานแล้ว", class: "success" },
      rejected: { text: "ปฏิเสธคำขอ", class: "maintenance" },
      completed: { text: "เสร็จสิ้นภารกิจ", class: "available" }
    };

    filteredBookings.forEach(book => {
      const status = statusMap[book.status] || statusMap.pending;
      const assignedCar = book.assignedCarId ? fleet.find(c => c.id === book.assignedCarId) : null;
      
      let carText = "-";
      if (assignedCar) {
        carText = `${assignedCar.name} (${assignedCar.plate})<br><span style="font-size: 0.72rem; color: var(--cb-text-muted);">คนขับ: ${assignedCar.driver}</span>`;
      }

      // Convert date format
      const depDate = new Date(book.startDate);
      const displayDate = `${depDate.getDate()}/${depDate.getMonth()+1}/${depDate.getFullYear() + 543} (${book.startTime} น.)`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-center font-bold" style="color: var(--cb-primary);">${book.id}</td>
        <td>
          <div class="font-bold">${book.destination}</div>
          <div style="font-size: 0.78rem; color: var(--cb-text-muted); line-height: 1.4; margin-top: 4px;">
            วัตถุประสงค์: ${book.purpose} <br>
            ผู้ขอจอง: คุณ${book.requester} (${book.passengers} ผู้โดยสาร)
          </div>
        </td>
        <td>${book.carType.replace("_", " ").toUpperCase()}</td>
        <td>${displayDate}</td>
        <td>${carText}</td>
        <td class="text-center">
          <span class="cb-badge-status ${status.class}">${status.text}</span>
        </td>
      `;
      historyTbody.appendChild(tr);
    });
  }

  // ----------------------------------------------------
  // 5. Tab 2: Booking Form Submission
  // ----------------------------------------------------
  if (carBookingForm) {
    // Set min date of form inputs to today
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("book-start-date").min = today;
    document.getElementById("book-end-date").min = today;

    carBookingForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const dest = document.getElementById("book-destination").value.trim();
      const pass = parseInt(document.getElementById("book-passenger").value);
      const sDate = document.getElementById("book-start-date").value;
      const sTime = document.getElementById("book-start-time").value;
      const eDate = document.getElementById("book-end-date").value;
      const eTime = document.getElementById("book-end-time").value;
      const carType = document.getElementById("book-car-type").value;
      const purpose = document.getElementById("book-purpose").value.trim();
      const notes = document.getElementById("book-notes").value.trim();

      // Simple validation: return date cannot be before departure
      if (new Date(eDate) < new Date(sDate)) {
        alert("วันเดินทางกลับต้องไม่ก่อนวันเดินทางไป");
        return;
      }

      // Generate ID
      const lastIdNum = bookings.length > 0 ? parseInt(bookings[bookings.length - 1].id.split("-")[1]) : 0;
      const nextId = "CB-" + String(lastIdNum + 1).padStart(3, "0");

      const newBooking = {
        id: nextId,
        requester: session.name,
        requesterKey: session.userKey,
        destination: dest,
        passengers: pass,
        startDate: sDate,
        startTime: sTime,
        endDate: eDate,
        endTime: eTime,
        carType: carType,
        purpose: purpose + (notes ? ` (ผู้โดยสารเพิ่มเติม: ${notes})` : ""),
        status: "pending",
        assignedCarId: null,
        assignedDriverKey: null,
        checklistStatus: false
      };

      bookings.push(newBooking);
      saveDatabase();
      showToast("🚀 ส่งคำขอจองรถยนต์สำเร็จ! รอผลการพิจารณา");
      
      carBookingForm.reset();
      switchTab("fleet");
    });
  }

  if (btnCancelBook) {
    btnCancelBook.addEventListener("click", () => {
      carBookingForm.reset();
      switchTab("fleet");
    });
  }

  // ----------------------------------------------------
  // 6. Tab 3: Manager Approval Panel (Director Console)
  // ----------------------------------------------------
  function renderManagerApproveTable() {
    if (!managerTbody) return;
    managerTbody.innerHTML = "";

    const pendingBookings = bookings.filter(b => b.status === "pending");
    managerPendingCount.textContent = `${pendingBookings.length} คำขอ`;

    if (pendingBookings.length === 0) {
      managerTbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center" style="padding: 2.5rem; color: var(--cb-text-muted);">
            ไม่มีคำขอจองใช้รถยนต์ส่วนกลางค้างส่งอนุมัติ
          </td>
        </tr>
      `;
      return;
    }

    pendingBookings.forEach(book => {
      const tr = document.createElement("tr");

      // Build Vehicle options selector
      let vehicleOptions = `<option value="">-- เลือกยานพาหนะ --</option>`;
      fleet.forEach(car => {
        // Simple helper to filter compatible type
        vehicleOptions += `
          <option value="${car.id}" ${car.status === "maintenance" ? "disabled" : ""}>
            [${car.plate}] ${car.name} (${car.status === "inuse" ? "ติดงาน" : "ว่าง"})
          </option>
        `;
      });

      // Build Driver options selector
      const drivers = [
        { key: "user_driver", name: "คุณนพดล ขับขี่ดี (พนักงานขับรถ)" },
        { key: "driver_somkuan", name: "นายสมควร ขับเก่ง" },
        { key: "driver_wichai", name: "นายวิชัย บริการดี" },
        { key: "driver_manop", name: "นายมานพ ขนส่ง" }
      ];

      let driverOptions = `<option value="">-- เลือกคนขับ --</option>`;
      drivers.forEach(d => {
        driverOptions += `<option value="${d.key}">${d.name}</option>`;
      });

      const depDate = new Date(book.startDate);
      const displayDate = `${depDate.getDate()}/${depDate.getMonth()+1}/${depDate.getFullYear() + 543} (${book.startTime} น.)`;

      tr.innerHTML = `
        <td class="text-center font-bold" style="color: var(--cb-primary);">${book.id}</td>
        <td>
          <div class="font-bold">คุณ${book.requester}</div>
          <div style="font-size: 0.72rem; color: var(--cb-text-muted);">${book.requesterKey === "user_it" ? "เจ้าหน้าที่ IT" : "เจ้าหน้าที่การเงิน"}</div>
        </td>
        <td>
          <div class="font-bold">${book.destination}</div>
          <div style="font-size: 0.75rem; color: var(--cb-text-muted); margin-top: 4px;">
            วัตถุประสงค์: ${book.purpose} <br>
            ผู้โดยสาร: ${book.passengers} ท่าน | ประเภทที่ขอ: ${book.carType.toUpperCase()}
          </div>
        </td>
        <td>
          <select class="table-select select-assign-car" data-id="${book.id}">
            ${vehicleOptions}
          </select>
        </td>
        <td>
          <select class="table-select select-assign-driver" data-id="${book.id}">
            ${driverOptions}
          </select>
        </td>
        <td class="text-center">
          <button class="btn btn-success btn-approve-cb" data-id="${book.id}" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;">
            อนุมัติจัดรถ
          </button>
        </td>
      `;
      managerTbody.appendChild(tr);
    });

    // Attach approve click events
    document.querySelectorAll(".btn-approve-cb").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        performApprove(id);
      });
    });
  }

  function performApprove(bookingId) {
    const carSelect = document.querySelector(`.select-assign-car[data-id="${bookingId}"]`);
    const driverSelect = document.querySelector(`.select-assign-driver[data-id="${bookingId}"]`);

    const carId = parseInt(carSelect.value);
    const driverKey = driverSelect.value;

    if (!carId || !driverKey) {
      alert("กรุณาเลือกจัดสรรยานพาหนะและพนักงานขับรถให้ครบถ้วนก่อนกดอนุมัติ");
      return;
    }

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    // Confirm
    const confirmApprove = confirm(`ยืนยันการจัดสรรรถยนต์คันดังกล่าวและส่งข้อมูลจองรถรหัส ${bookingId} ใช่หรือไม่?`);
    if (confirmApprove) {
      // 1. Update booking details
      booking.status = "approved"; // Approved, waiting driver acceptance
      booking.assignedCarId = carId;
      booking.assignedDriverKey = driverKey;

      // 2. Update vehicle status to inuse
      const car = fleet.find(c => c.id === carId);
      if (car) {
        car.status = "inuse";
      }

      // 3. Save database and sync portal
      saveDatabase();
      showToast(`✔ อนุมัติการจองรหัส ${bookingId} และมอบงานคนขับเรียบร้อยแล้ว`);
      renderManagerApproveTable();
    }
  }

  // ----------------------------------------------------
  // 7. Tab 4: Driver Dashboard Panel (Accepting Jobs & checklist)
  // ----------------------------------------------------
  function renderDriverJobs() {
    if (!driverJobsList) return;
    driverJobsList.innerHTML = "";

    // Load jobs assigned to current driver (คุณนพดล - user_driver)
    const driverJobs = bookings.filter(b => b.assignedDriverKey === session.userKey && (b.status === "approved" || b.status === "confirmed"));
    driverPendingJobsCount.textContent = `${driverJobs.filter(j => j.status === "approved").length} งานใหม่`;

    if (driverJobs.length === 0) {
      driverJobsList.innerHTML = `
        <div class="no-selection-placeholder" style="padding: 3rem 1rem;">
          <div class="placeholder-icon">🚐</div>
          <h4>ไม่มีงานเดินรถค้างส่งหรือกำลังดำเนินการ</h4>
          <p>คุณไม่มีประวัติภารกิจที่ได้รับมอบหมายรออนุมัติอยู่ในขณะนี้</p>
        </div>
      `;
      preTripChecklistContainer.style.display = "none";
      return;
    }

    driverJobs.forEach(job => {
      const ticket = document.createElement("div");
      ticket.className = `driver-ticket ${job.status === "confirmed" ? "confirmed" : ""}`;
      
      const depDate = new Date(job.startDate);
      const displayDate = `${depDate.getDate()}/${depDate.getMonth()+1}/${depDate.getFullYear() + 543} (${job.startTime} น.)`;
      const assignedCar = fleet.find(c => c.id === job.assignedCarId);
      
      let actionBtn = "";
      if (job.status === "approved") {
        actionBtn = `
          <button class="btn btn-primary btn-accept-job" data-id="${job.id}" data-plate="${assignedCar ? assignedCar.plate : ""}" data-dest="${job.destination}">
            กดยอมรับภารกิจ (Accept Trip)
          </button>
        `;
      } else {
        actionBtn = `
          <span class="text-success font-bold" style="display: flex; align-items: center; gap: 0.25rem;">
            ✔ ยอมรับงานและรายงานตัวแล้ว
          </span>
        `;
      }

      ticket.innerHTML = `
        <div class="ticket-main-details">
          <div class="ticket-header-row">
            <span class="ticket-id">${job.id}</span>
            <span class="cb-badge-status ${job.status === "confirmed" ? "available" : "warning"}">
              ${job.status === "confirmed" ? "คนขับรับงานแล้ว" : "รอคนขับตอบรับ"}
            </span>
          </div>
          <div class="ticket-dest">
            <h4>📍 ปลายทาง: ${job.destination}</h4>
          </div>
          <div class="ticket-meta-info">
            <span>ผู้ขอใช้บริการ: <strong>คุณ${job.requester} (${job.passengers} ท่าน)</strong></span>
            <span>วันเวลาออกรถ: <strong>${displayDate}</strong></span>
            <span>รถยนต์ที่จัดสรร: <strong>${assignedCar ? assignedCar.name + " (" + assignedCar.plate + ")" : "-"}</strong></span>
            <span>วัตถุประสงค์: <strong>${job.purpose}</strong></span>
          </div>
        </div>
        <div class="ticket-actions">
          ${actionBtn}
        </div>
      `;
      driverJobsList.appendChild(ticket);
    });

    // Attach click events for Driver accept trip buttons
    document.querySelectorAll(".btn-accept-job").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const plate = btn.getAttribute("data-plate");
        const dest = btn.getAttribute("data-dest");
        openPreTripChecklist(id, plate, dest);
      });
    });
  }

  function openPreTripChecklist(bookingId, carPlate, destination) {
    preTripChecklistContainer.style.display = "block";
    checklistCarPlate.textContent = carPlate;
    checklistDestination.textContent = destination;
    checkBookingId.value = bookingId;

    // Scroll checklist into view
    preTripChecklistContainer.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Pre-trip Inspection Form Submit
  if (preTripForm) {
    preTripForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const bookingId = checkBookingId.value;
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      // Update booking state to confirmed
      booking.status = "confirmed";
      booking.checklistStatus = true;

      // Save database & sync portal
      saveDatabase();
      showToast("✔ ตรวจสภาพความปลอดภัยและยอมรับภารกิจเรียบร้อย");

      preTripForm.reset();
      preTripChecklistContainer.style.display = "none";
      
      renderDriverJobs();
    });
  }

  // ----------------------------------------------------
  // 9. Startup & Sync Logic
  // ----------------------------------------------------
  window.addEventListener("storage", (e) => {
    if (e.key === "fmo_user_session") {
      const ok = checkSession();
      if (ok) {
        loadDatabase();
        switchTab(activeTab);
      }
    } else if (e.key === "fmo_cb_bookings" || e.key === "fmo_cb_fleet") {
      loadDatabase();
      switchTab(activeTab);
    }
  });

  // Startup initialization
  const sessionOk = checkSession();
  if (sessionOk) {
    loadDatabase();
    initTabs();
  }
});
