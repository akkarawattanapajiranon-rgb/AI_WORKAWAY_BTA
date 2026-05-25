/**
 * Workaway Recording & Dashboard System - Core Frontend App Logic
 * Vanilla JavaScript managing autocomplete, QR Inventory, modals, printing and API calls
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global States
  let apiBaseUrl = ''; // Relative path because they share same server, e.g. http://localhost:3000
  let tyreCodes = [];
  let areas = [];
  let storageLocations = [];
  let categories = [];
  
  let chartManager = null;
  let currentActiveTab = 'dashboard';
  let historyRecords = [];
  
  // QR Inventory States
  let qrCodeList = [];
  let currentFilterStatus = 'all';

  // Pagination State
  let currentPage = 1;
  const recordsPerPage = 10;

  // Initialize Elements
  const elements = {
    // Navigation Tabs
    navItems: document.querySelectorAll('.sidebar-menu .menu-item'),
    viewSections: document.querySelectorAll('.view-section'),
    pageTitle: document.getElementById('page-title'),
    pageSubtitle: document.getElementById('page-subtitle'),
    
    // Header & Theme
    themeToggle: document.getElementById('theme-toggle'),
    currentTime: document.getElementById('current-time-display'),
    dbPathDisplay: document.getElementById('db-path-display'),
    
    // QR Inventory Elements
    qrInventoryGrid: document.getElementById('qr-inventory-grid'),
    qrSearchInput: document.getElementById('qr-search-input'),
    btnFilterAll: document.getElementById('btn-filter-all'),
    btnFilterAvailable: document.getElementById('btn-filter-available'),
    btnFilterInuse: document.getElementById('btn-filter-inuse'),
    btnOpenPrintModal: document.getElementById('btn-open-print-modal'),
    btnRefreshInventory: document.getElementById('btn-refresh-inventory'),
    countAvailableQr: document.getElementById('count-available-qr'),
    countInuseQr: document.getElementById('count-inuse-qr'),
    countTotalQr: document.getElementById('count-total-qr'),

    // QR Details Modal
    qrDetailModal: document.getElementById('qr-detail-modal'),
    qrModalImage: document.getElementById('qr-modal-image'),
    qrModalCodeName: document.getElementById('qr-modal-code-name'),
    qrModalStatusBadge: document.getElementById('qr-modal-status-badge'),
    qrModalStateAvailable: document.getElementById('qr-modal-state-available'),
    qrModalStateInuse: document.getElementById('qr-modal-state-inuse'),
    qrModalLblTyreCode: document.getElementById('qr-modal-lbl-tyre-code'),
    qrModalLblArea: document.getElementById('qr-modal-lbl-area'),
    qrModalLblStorage: document.getElementById('qr-modal-lbl-storage'),
    qrModalLblWeight: document.getElementById('qr-modal-lbl-weight'),
    qrModalLblDate: document.getElementById('qr-modal-lbl-date'),
    qrModalLblNotes: document.getElementById('qr-modal-lbl-notes'),
    qrModalOutForm: document.getElementById('qr-modal-out-form'),
    qrModalAdminPass: document.getElementById('qr-modal-admin-pass'),
    btnCloseQrModal: document.getElementById('btn-close-qr-modal'),

    // QR Print Modal
    qrPrintModal: document.getElementById('qr-print-modal'),
    btnPrintStartNum: document.getElementById('print-start-num'),
    btnPrintEndNum: document.getElementById('print-end-num'),
    btnGeneratePrintSheet: document.getElementById('btn-generate-print-sheet'),
    btnClosePrintModal: document.getElementById('btn-close-print-modal'),
    
    // Filters & History Elements
    filterStartDate: document.getElementById('filter-start-date'),
    filterEndDate: document.getElementById('filter-end-date'),
    filterArea: document.getElementById('filter-area'),
    filterStorage: document.getElementById('filter-storage'),
    filterCode: document.getElementById('filter-code'),
    filterCategory: document.getElementById('filter-category'),
    btnApplyFilters: document.getElementById('btn-apply-filters'),
    btnClearFilters: document.getElementById('btn-clear-filters'),
    btnExportCsv: document.getElementById('btn-export-csv'),
    historyTableBody: document.getElementById('history-table-body'),
    resultsCountBadge: document.getElementById('results-count-badge'),
    tablePagination: document.getElementById('table-pagination'),
    
    // Codes View Elements
    searchCodeInput: document.getElementById('search-code-input'),
    presetCodesGrid: document.getElementById('preset-codes-grid'),
    codesCountBadge: document.getElementById('codes-count-badge'),
    
    // Edit Modal Elements (For history updates)
    editModal: document.getElementById('edit-modal'),
    editForm: document.getElementById('edit-form'),
    editId: document.getElementById('edit-id'),
    editDate: document.getElementById('edit-date'),
    editArea: document.getElementById('edit-area'),
    editStorage: document.getElementById('edit-storage'),
    editCode: document.getElementById('edit-code'),
    editCategory: document.getElementById('edit-category'),
    editQtyIn: document.getElementById('edit-qty-in'),
    editQtyOut: document.getElementById('edit-qty-out'),
    editNotes: document.getElementById('edit-notes'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),
    
    // Toast Container
    toastContainer: document.getElementById('toast-container'),

    // KPI Trends & In-Out Info
    kpiTotalInOut: document.getElementById('kpi-total-in-out'),
    kpiClearPercentage: document.getElementById('kpi-clear-percentage'),
    kpiTodayNewInOut: document.getElementById('kpi-today-new-in-out')
  };

  // Set default dates in date inputs
  const todayStr = new Date().toISOString().split('T')[0];
  elements.filterStartDate.value = todayStr; // Default filters to today to keep it clean
  elements.filterEndDate.value = todayStr;

  // Real-time time display in header
  function updateTimeBadge() {
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    elements.currentTime.innerHTML = `<i class="fa-solid fa-clock"></i> ${new Date().toLocaleDateString('th-TH', options)}`;
  }
  setInterval(updateTimeBadge, 1000);
  updateTimeBadge();

  // ==========================================================================
  // TOAST NOTIFICATION SYSTEM
  // ==========================================================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    if (type === 'danger') iconClass = 'fa-circle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass} toast-icon"></i>
      <span class="toast-message">${message}</span>
    `;

    elements.toastContainer.appendChild(toast);
    
    // Remove toast after 3.5 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3500);
  }

  // ==========================================================================
  // THEME MANAGEMENT (DARK / LIGHT MODE Switcher)
  // ==========================================================================
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    elements.themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
  } else {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    elements.themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }

  elements.themeToggle.addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      elements.themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
      localStorage.setItem('theme', 'light');
      showToast('เปลี่ยนเป็นโหมดสว่างเรียบร้อย', 'info');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
      elements.themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
      localStorage.setItem('theme', 'dark');
      showToast('เปลี่ยนเป็นโหมดมืดเรียบร้อย', 'info');
    }
    
    // Refresh chart colors dynamically!
    if (chartManager) {
      chartManager.refreshTheme();
    }
  });

  // ==========================================================================
  // METADATA & INITIAL DATABASE LOAD
  // ==========================================================================
  async function loadSystemMetadata() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/metadata`);
      if (!response.ok) throw new Error('Failed to fetch system metadata');
      
      const data = await response.json();
      if (!data) return;

      tyreCodes = data.tyre_codes || [];
      areas = data.areas || [];
      storageLocations = data.storage_locations || [];
      categories = data.categories || [];
      
      // Update Database Path indicator
      if (data.db_path) {
        elements.dbPathDisplay.textContent = data.db_path;
        elements.dbPathDisplay.title = data.db_path;
      }

      // Populate filter dropdown for tyre codes
      elements.filterCode.innerHTML = '<option value="">-- แสดงทั้งหมด --</option>';
      tyreCodes.forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = code;
        elements.filterCode.appendChild(option);
      });

      // Populate edit modal dropdowns
      elements.editArea.innerHTML = '';
      areas.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        elements.editArea.appendChild(opt);
      });

      elements.editStorage.innerHTML = '';
      storageLocations.forEach(sl => {
        const opt = document.createElement('option');
        opt.value = sl;
        opt.textContent = sl;
        elements.editStorage.appendChild(opt);
      });

      // Render preset codes grids
      renderPresetCodesGrid();
      
      showToast('เชื่อมต่อระบบหลังบ้านสำเร็จ', 'success');
    } catch (error) {
      console.error(error);
      elements.dbPathDisplay.textContent = 'ตัดการเชื่อมต่อ (ใช้ออฟไลน์)';
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน', 'danger');
    }
  }

  // Render Preset Tyre Chips
  function renderPresetCodesGrid(searchQuery = '') {
    elements.presetCodesGrid.innerHTML = '';
    
    const filteredCodes = tyreCodes.filter(c => 
      c.toLowerCase().includes(searchQuery.toLowerCase())
    );

    elements.codesCountBadge.textContent = `${filteredCodes.length} รหัส`;

    if (filteredCodes.length === 0) {
      elements.presetCodesGrid.innerHTML = '<div class="text-center text-muted" style="grid-column: 1/-1; padding: 20px;">ไม่พบรหัสยาง</div>';
      return;
    }

    filteredCodes.forEach(code => {
      const chip = document.createElement('div');
      chip.className = 'code-chip';
      chip.innerHTML = `
        <span class="code-title">${code}</span>
        <span class="code-usage">รหัสเริ่มแรก</span>
      `;
      
      // Clicking on chip searches in QR inventory!
      chip.addEventListener('click', () => {
        elements.qrSearchInput.value = code;
        switchTab('qrinventory');
        renderQRInventoryGrid();
        showToast(`ฟิลเตอร์ค้นหาคลังด้วยรหัสยาง ${code} สำเร็จ`, 'info');
      });

      elements.presetCodesGrid.appendChild(chip);
    });
  }

  // Filter Code Chip event
  elements.searchCodeInput.addEventListener('input', (e) => {
    renderPresetCodesGrid(e.target.value);
  });

  // ==========================================================================
  // NAVIGATION SPA TABS SWITCHER
  // ==========================================================================
  function switchTab(targetTab) {
    currentActiveTab = targetTab;
    
    // Update menu buttons
    elements.navItems.forEach(btn => {
      if (btn.getAttribute('href') === `#${targetTab}`) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update section visibility
    elements.viewSections.forEach(sec => {
      if (sec.id === `view-${targetTab}`) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    // Update Top bar header headings
    const tabHeadings = {
      dashboard: { title: 'แดชบอร์ดสรุปผล', desc: 'วิเคราะห์ข้อมูลสถิติ Workaway รวม ยางรถยนต์ & ยางเครื่องบิน' },
      qrinventory: { title: 'คลังจัดการและสั่งพิมพ์ QR Code', desc: 'ควบคุมสถานะ QR Code 500 รหัสหมุนเวียน และสั่งพิมพ์ฉลากหน้างาน' },
      history: { title: 'ประวัติและตัวกรองข้อมูล', desc: 'ค้นหา ประวัติ แก้ไขรายละเอียด หรือดาวน์โหลดส่งออกข้อมูลเป็น CSV/Excel' },
      codes: { title: 'รหัสยางและข้อมูลระบบ', desc: 'บัญชีรายชื่อรหัสยางมาตรฐานทั้ง 46 รายการและข้อกำหนดการทำงาน' }
    };

    if (tabHeadings[targetTab]) {
      elements.pageTitle.textContent = tabHeadings[targetTab].title;
      elements.pageSubtitle.textContent = tabHeadings[targetTab].desc;
    }

    // Refresh charts if dashboard tab is active
    if (targetTab === 'dashboard') {
      fetchDashboardSummary();
    } else if (targetTab === 'qrinventory') {
      fetchQRInventory();
    } else if (targetTab === 'history') {
      fetchHistoryRecords();
    }
  }

  // Bind nav click events
  elements.navItems.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('href').substring(1);
      switchTab(tab);
    });
  });

  // ==========================================================================
  // FETCH DASHBOARD DATA & SUMMARY
  // ==========================================================================
  async function fetchDashboardSummary() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/dashboard-summary`);
      if (!response.ok) throw new Error('Failed to load dashboard summaries');
      
      const summary = await response.json();
      
      // Update KPI Value tags
      animateKpiNumber('kpi-total-balance', summary.totals.net_balance, ' กก.');
      animateKpiNumber('kpi-disposition-pending', summary.totals.disposition_pending, ' กก.');
      animateKpiNumber('kpi-total-out', summary.totals.total_out, ' กก.');

      elements.kpiTotalInOut.textContent = `เข้า ${summary.totals.total_in.toLocaleString()} / ออก ${summary.totals.total_out.toLocaleString()}`;

      // Calculate clear percentage
      let pct = 0;
      if (summary.totals.total_in > 0) {
        pct = Math.round((summary.totals.total_out / summary.totals.total_in) * 100);
      }
      elements.kpiClearPercentage.textContent = `${pct}% ของน้ำหนักนำเข้าสะสม`;

      // Active New items today
      const todayNew = summary.categories.new?.in || 0;
      animateKpiNumber('kpi-today-new', todayNew, ' กก.');
      elements.kpiTodayNewInOut.textContent = `ยอดเข้าประเภท New วันนี้`;

      // Update Chart widgets
      if (!chartManager) {
        chartManager = new WorkawayCharts();
      }
      chartManager.updateCharts(summary);
    } catch (e) {
      console.error(e);
      showToast('ไม่สามารถดึงข้อมูลสรุปแดชบอร์ดได้', 'danger');
    }
  }

  // Smooth KPI Counter increase animation
  function animateKpiNumber(elementId, targetValue, suffix = '') {
    const el = document.getElementById(elementId);
    if (!el) return;

    let current = 0;
    const duration = 800; // ms
    const startTime = performance.now();

    function updateNum(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // EaseOutQuad formula
      const easeProgress = progress * (2 - progress);
      current = easeProgress * targetValue;
      
      el.innerHTML = `${current.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span class="unit">${suffix}</span>`;

      if (progress < 1) {
        requestAnimationFrame(updateNum);
      } else {
        el.innerHTML = `${targetValue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span class="unit">${suffix}</span>`;
      }
    }

    requestAnimationFrame(updateNum);
  }

  // ==========================================================================
  // QR INVENTORY CONTROLLERS
  // ==========================================================================
  async function fetchQRInventory() {
    try {
      elements.qrInventoryGrid.innerHTML = `
        <div class="grid-loader">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          <p>กำลังรีเฟรชข้อมูลคลัง QR Code...</p>
        </div>
      `;
      
      const response = await fetch(`${apiBaseUrl}/api/qrcodes`);
      if (!response.ok) throw new Error('Failed to fetch QR codes');
      
      qrCodeList = await response.json();
      renderQRInventoryGrid();
      updateQRLegendCounts();
    } catch (error) {
      console.error(error);
      elements.qrInventoryGrid.innerHTML = `
        <div class="grid-loader text-danger">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>ไม่สามารถดึงข้อมูลคลัง QR Code ได้</p>
        </div>
      `;
      showToast('โหลดข้อมูลคลัง QR Code ล้มเหลว', 'danger');
    }
  }

  function renderQRInventoryGrid() {
    elements.qrInventoryGrid.innerHTML = '';
    
    const searchQuery = elements.qrSearchInput.value.trim().toLowerCase();
    
    let filtered = qrCodeList;
    
    // Apply Status Filter
    if (currentFilterStatus !== 'all') {
      filtered = filtered.filter(q => q.status === currentFilterStatus);
    }
    
    // Apply Search Query (matches QR code name or current tyre code)
    if (searchQuery) {
      filtered = filtered.filter(q => {
        const matchesName = q.code.toLowerCase().includes(searchQuery);
        const matchesTyreCode = q.details && q.details.code.toLowerCase().includes(searchQuery);
        return matchesName || matchesTyreCode;
      });
    }
    
    if (filtered.length === 0) {
      elements.qrInventoryGrid.innerHTML = `
        <div class="grid-loader text-muted">
          <i class="fa-solid fa-qrcode" style="opacity:0.3;"></i>
          <p>ไม่พบรายการ QR Code ตามเงื่อนไข</p>
        </div>
      `;
      return;
    }
    
    filtered.forEach(q => {
      const card = document.createElement('div');
      card.className = `qr-chip-card ${q.status}`;
      
      let detailHtml = '';
      let statusLabel = 'ว่างพร้อมใช้';
      if (q.status === 'in_use') {
        statusLabel = 'ใช้งานอยู่';
        if (q.details) {
          detailHtml = `<span class="qr-chip-detail" title="${q.details.code}">${q.details.code} (${q.details.qty_in.toFixed(1)} กก.)</span>`;
        }
      }
      
      card.innerHTML = `
        <i class="fa-solid fa-qrcode qr-chip-icon"></i>
        <span class="qr-chip-name">${q.code}</span>
        <span class="qr-chip-status">${statusLabel}</span>
        ${detailHtml}
      `;
      
      card.addEventListener('click', () => openQRDetailModal(q));
      elements.qrInventoryGrid.appendChild(card);
    });
  }

  function updateQRLegendCounts() {
    const availableCount = qrCodeList.filter(q => q.status === 'available').length;
    const inuseCount = qrCodeList.filter(q => q.status === 'in_use').length;
    
    elements.countAvailableQr.textContent = availableCount;
    elements.countInuseQr.textContent = inuseCount;
    elements.countTotalQr.textContent = qrCodeList.length;
  }

  // QR Details Dialog binding
  let activeSelectedQR = null;

  function openQRDetailModal(q) {
    activeSelectedQR = q;
    
    elements.qrModalCodeName.textContent = q.code;
    elements.qrModalImage.src = `${apiBaseUrl}/api/qrcodes/${q.code}/image`;
    
    // Reset Badges
    elements.qrModalStatusBadge.className = `qr-status-badge ${q.status}`;
    elements.qrModalStatusBadge.textContent = q.status === 'available' ? 'Available' : 'In-Use';
    
    // Reset Admin Form Pass
    elements.qrModalAdminPass.value = '';
    
    if (q.status === 'available') {
      elements.qrModalStateAvailable.style.display = 'block';
      elements.qrModalStateInuse.style.display = 'none';
    } else {
      elements.qrModalStateAvailable.style.display = 'none';
      elements.qrModalStateInuse.style.display = 'block';
      
      const d = q.details || {};
      elements.qrModalLblTyreCode.textContent = d.code || '-';
      elements.qrModalLblArea.textContent = d.area || '-';
      elements.qrModalLblStorage.textContent = d.storage_location || '-';
      elements.qrModalLblWeight.textContent = `${(d.qty_in || 0).toFixed(1)} กิโลกรัม`;
      
      const dateStr = d.date ? new Date(d.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
      elements.qrModalLblDate.textContent = dateStr;
      elements.qrModalLblNotes.textContent = d.notes || '-';
    }
    
    elements.qrDetailModal.classList.add('active');
  }

  function closeQRDetailModal() {
    elements.qrDetailModal.classList.remove('active');
    activeSelectedQR = null;
  }

  elements.btnCloseQrModal.addEventListener('click', closeQRDetailModal);

  // Admin OUT form submission
  elements.qrModalOutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeSelectedQR) return;
    
    const password = elements.qrModalAdminPass.value.trim();
    if (!password) {
      showToast('กรุณากรอกรหัสผ่านผู้ดูแลระบบ', 'warning');
      return;
    }
    
    try {
      const submitBtn = document.getElementById('btn-qr-modal-submit-out');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> กำลังดำเนินการ...';
      
      const res = await fetch(`${apiBaseUrl}/api/qrcodes/scan-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeSelectedQR.code,
          password: password
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to clear QR Code');
      }
      
      showToast(`ทำรายการ OUT รหัส ${activeSelectedQR.code} สำเร็จ!`, 'success');
      closeQRDetailModal();
      fetchQRInventory(); // Refresh grid
    } catch (error) {
      console.error(error);
      showToast(error.message || 'รหัสผ่านไม่ถูกต้อง หรือเกิดข้อผิดพลาด', 'danger');
    } finally {
      const submitBtn = document.getElementById('btn-qr-modal-submit-out');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> ยืนยัน OUT';
    }
  });

  // Bind Grid controls search & filter
  elements.qrSearchInput.addEventListener('input', renderQRInventoryGrid);

  elements.btnRefreshInventory.addEventListener('click', fetchQRInventory);

  // Filter click handlers
  const filterBtns = [elements.btnFilterAll, elements.btnFilterAvailable, elements.btnFilterInuse];
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilterStatus = btn.getAttribute('data-status');
      renderQRInventoryGrid();
    });
  });

  // Print sheets setup
  elements.btnOpenPrintModal.addEventListener('click', () => {
    elements.qrPrintModal.classList.add('active');
  });
  
  elements.btnClosePrintModal.addEventListener('click', () => {
    elements.qrPrintModal.classList.remove('active');
  });

  elements.btnGeneratePrintSheet.addEventListener('click', () => {
    const start = parseInt(elements.btnPrintStartNum.value) || 1;
    const end = parseInt(elements.btnPrintEndNum.value) || 50;
    
    if (start < 1 || end > 500 || start > end) {
      alert('กรุณาระบุช่วงตัวเลขที่ถูกต้อง (1 - 500)');
      return;
    }
    
    elements.qrPrintModal.classList.remove('active');
    
    const printWindow = window.open('', '_blank');
    let cardsHTML = '';
    
    for (let i = start; i <= end; i++) {
      const paddedNum = String(i).padStart(3, '0');
      const qrName = `QR-${paddedNum}`;
      const qrImgUrl = `${window.location.origin}/api/qrcodes/${qrName}/image`;
      
      cardsHTML += `
        <div class="qr-card">
          <div class="card-brand">WORKAWAY BTA</div>
          <div class="qr-wrapper">
            <img src="${qrImgUrl}" alt="${qrName}">
          </div>
          <div class="card-code">${qrName}</div>
          <div class="card-footer">ยิงกล้องมือถือเพื่อทำรายการ IN/OUT</div>
        </div>
      `;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print QR Sheet: ${start} - ${end}</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Sarabun', sans-serif;
            background: #fff;
            color: #000;
          }
          .no-print {
            margin-bottom: 20px;
            text-align: center;
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .print-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 15px;
          }
          .qr-card {
            border: 2px dashed #333;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #fff;
          }
          .card-brand {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            color: #555;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .qr-wrapper {
            width: 140px;
            height: 140px;
            margin: 5px 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .card-code {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #000;
            margin: 2px 0;
          }
          .card-footer {
            font-size: 8px;
            color: #666;
            margin-top: 2px;
          }
          @media print {
            .no-print {
              display: none;
            }
            body {
              padding: 0;
            }
            .print-grid {
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
            }
            .qr-card {
              border: 1px solid #000;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; font-weight: bold; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">
            🖨️ คลิกสั่งพิมพ์แผ่นเอกสาร (Print Sheet)
          </button>
          <p style="font-size: 12px; color: #555; margin-top: 8px; margin-bottom: 0;">ตั้งค่าหน้ากระดาษเป็นกระดาษแนวตั้ง และเปิดภาพพื้นหลัง / กราฟิกพื้นหลัง (Background graphics)</p>
        </div>
        <div class="print-grid">
          ${cardsHTML}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  });

  // ==========================================================================
  // HISTORICAL RECORDS & FILTERING
  // ==========================================================================
  async function fetchHistoryRecords() {
    try {
      elements.historyTableBody.innerHTML = '<tr><td colspan="9" class="text-center"><i class="fa-solid fa-spinner fa-spin"></i> กำลังกรองค้นหาข้อมูล...</td></tr>';
      
      const start = elements.filterStartDate.value;
      const end = elements.filterEndDate.value;
      const area = elements.filterArea.value;
      const storage = elements.filterStorage.value;
      const code = elements.filterCode.value;
      const category = elements.filterCategory.value;

      let url = `${apiBaseUrl}/api/records?`;
      if (start) url += `start_date=${start}&`;
      if (end) url += `end_date=${end}&`;
      if (area) url += `area=${area}&`;
      if (storage) url += `storage_location=${storage}&`;
      if (code) url += `code=${code}&`;
      if (category) url += `category=${category}&`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load history records');

      historyRecords = await response.json();
      currentPage = 1; // Reset to page 1
      renderHistoryTable();
    } catch (e) {
      console.error(e);
      elements.historyTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูลประวัติ</td></tr>';
    }
  }

  // Render History Table with Pagination
  function renderHistoryTable() {
    const tbody = elements.historyTableBody;
    tbody.innerHTML = '';
    
    elements.resultsCountBadge.textContent = `พบ ${historyRecords.length} รายการ`;

    if (historyRecords.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">ไม่พบข้อมูลตามเงื่อนไขที่ค้นหา</td></tr>';
      elements.tablePagination.innerHTML = '';
      return;
    }

    // Pagination calculations
    const totalPages = Math.ceil(historyRecords.length / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, historyRecords.length);
    const paginatedRecords = historyRecords.slice(startIndex, endIndex);

    paginatedRecords.forEach(r => {
      const tr = document.createElement('tr');
      
      let categoryThai = 'ของใหม่';
      if (r.category === '7day') categoryThai = 'อยู่มาแล้ว 7 วัน';
      if (r.category === '7-14day') categoryThai = 'อยู่มาแล้ว 7-14 วัน';
      if (r.category === 'over14day') categoryThai = 'มากกว่า 14 วัน';
      if (r.category === 'disposition') categoryThai = 'รอตรวจสอบ (Disposition)';

      // Format date beautifully
      const formattedDate = new Date(r.date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });

      tr.innerHTML = `
        <td><strong>${formattedDate}</strong></td>
        <td><span class="results-count">${r.area}</span></td>
        <td><i class="fa-solid fa-warehouse text-muted"></i> ${r.storage_location}</td>
        <td><strong class="text-success">${r.code}</strong></td>
        <td>${categoryThai}</td>
        <td class="text-right text-success">${r.qty_in > 0 ? `+${r.qty_in.toFixed(1)}` : '0'}</td>
        <td class="text-right text-danger">${r.qty_out > 0 ? `-${r.qty_out.toFixed(1)}` : '0'}</td>
        <td><span class="text-muted" style="font-size: 11px;">${r.notes || '-'}</span></td>
        <td class="text-center">
          <div class="table-actions">
            <button class="btn-table-icon edit-btn" title="แก้ไข"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-table-icon delete-btn" title="ลบ"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;

      // Bind actions
      tr.querySelector('.edit-btn').addEventListener('click', () => openEditModal(r));
      tr.querySelector('.delete-btn').addEventListener('click', () => deleteRecord(r.id));

      tbody.appendChild(tr);
    });

    renderPaginationControls(totalPages);
  }

  // Render Pagination HTML elements
  function renderPaginationControls(totalPages) {
    const container = elements.tablePagination;
    container.innerHTML = '';

    if (totalPages <= 1) return;

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn-pagination';
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderHistoryTable();
      }
    });
    container.appendChild(prevBtn);

    // Max visible pages
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `btn-pagination ${i === currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        renderHistoryTable();
      });
      container.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-pagination';
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderHistoryTable();
      }
    });
    container.appendChild(nextBtn);
  }

  // Bind Actions on filter tab
  elements.btnApplyFilters.addEventListener('click', fetchHistoryRecords);

  elements.btnClearFilters.addEventListener('click', () => {
    elements.filterStartDate.value = '';
    elements.filterEndDate.value = '';
    elements.filterArea.value = '';
    elements.filterStorage.value = '';
    elements.filterCode.value = '';
    elements.filterCategory.value = '';
    fetchHistoryRecords();
    showToast('ล้างค่าตัวกรองประวัติเรียบร้อย', 'info');
  });

  // ==========================================================================
  // EDIT & DELETE LOGIC
  // ==========================================================================
  
  // Delete Operation
  async function deleteRecord(id) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/records/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete record');

      showToast('ลบรายการสำเร็จเรียบร้อย', 'success');
      
      // Refresh active tables and dashboard
      if (currentActiveTab === 'qrinventory') {
        fetchQRInventory();
      } else if (currentActiveTab === 'history') {
        fetchHistoryRecords();
      }
      fetchDashboardSummary();
    } catch (e) {
      console.error(e);
      showToast('ไม่สามารถลบรายการได้สำเร็จ', 'danger');
    }
  }

  // Open Edit Dialog
  function openEditModal(record) {
    elements.editId.value = record.id;
    elements.editDate.value = record.date;
    elements.editArea.value = record.area;
    elements.editStorage.value = record.storage_location;
    elements.editCode.value = record.code;
    elements.editCategory.value = record.category;
    elements.editQtyIn.value = record.qty_in;
    elements.editQtyOut.value = record.qty_out;
    elements.editNotes.value = record.notes || '';

    elements.editModal.classList.add('active');
  }

  // Close Dialogs
  function closeEditModal() {
    elements.editModal.classList.remove('active');
    elements.editForm.reset();
  }

  elements.btnCloseModal.addEventListener('click', closeEditModal);
  elements.btnCancelEdit.addEventListener('click', closeEditModal);

  // Submit edits
  elements.editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = elements.editId.value;
    const updateData = {
      date: elements.editDate.value,
      area: elements.editArea.value,
      storage_location: elements.editStorage.value,
      category: elements.editCategory.value,
      qty_in: parseFloat(elements.editQtyIn.value) || 0,
      qty_out: parseFloat(elements.editQtyOut.value) || 0,
      notes: elements.editNotes.value.trim()
    };

    if (updateData.qty_in < 0 || updateData.qty_out < 0) {
      showToast('น้ำหนักห้ามเป็นค่าติดลบ', 'warning');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to update record');

      showToast('อัปเดตข้อมูลรายการสำเร็จเรียบร้อย', 'success');
      closeEditModal();

      // Refresh corresponding logs
      if (currentActiveTab === 'qrinventory') {
        fetchQRInventory();
      } else if (currentActiveTab === 'history') {
        fetchHistoryRecords();
      }
      fetchDashboardSummary();
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการอัปเดตข้อมูล', 'danger');
    }
  });

  // ==========================================================================
  // EXPORT TO EXCEL / CSV
  // ==========================================================================
  elements.btnExportCsv.addEventListener('click', () => {
    if (historyRecords.length === 0) {
      showToast('ไม่มีข้อมูลในตารางผลลัพธ์ที่จะส่งออก', 'warning');
      return;
    }

    try {
      // Define CSV headers in Thai with English equivalents for standard excel loading
      const headers = ['วันที่บันทึก (Date)', 'พื้นที่การผลิต (Area)', 'สถานที่จัดเก็บ (Storage)', 'รหัสยาง (Tyre Code)', 'ประเภทอายุยาง (Category)', 'นำเข้า IN (kg)', 'เคลียร์ออก OUT (kg)', 'หมายเหตุ (Notes)', 'รหัส QR Code'];
      
      const csvRows = [headers.join(',')];

      historyRecords.forEach(r => {
        let categoryThai = 'ของใหม่';
        if (r.category === '7day') categoryThai = '7 วัน';
        if (r.category === '7-14day') categoryThai = '7-14 วัน';
        if (r.category === 'over14day') categoryThai = '>14 วัน';
        if (r.category === 'disposition') categoryThai = 'รอตรวจสอบ';

        const row = [
          `"${r.date}"`,
          `"${r.area}"`,
          `"${r.storage_location}"`,
          `"${r.code}"`,
          `"${categoryThai}"`,
          r.qty_in,
          r.qty_out,
          `"${(r.notes || '').replace(/"/g, '""')}"`, // escape double quotes
          `"${r.qr_code || '-'}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\r\n');
      
      // UTF-8 BOM to display Thai language correctly in Microsoft Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename based on date filters
      const start = elements.filterStartDate.value || 'all';
      const end = elements.filterEndDate.value || 'all';
      link.setAttribute('download', `workaway_report_${start}_to_${end}.csv`);
      
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('ดาวน์โหลดไฟล์ CSV สำหรับ Excel สำเร็จ!', 'success');
    } catch (e) {
      console.error(e);
      showToast('ไม่สามารถส่งออกข้อมูลเป็น CSV ได้', 'danger');
    }
  });

  // ==========================================================================
  // APP LIFECYCLE INITIALIZER
  // ==========================================================================
  loadSystemMetadata();
  switchTab('dashboard'); // Default show dashboard on boot
});
