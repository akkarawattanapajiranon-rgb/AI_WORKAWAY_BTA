/**
 * Workaway Recording & Dashboard System - Core Frontend App Logic
 * Vanilla JavaScript managing autocomplete, batch queue, modals, and API calls
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global States
  let apiBaseUrl = ''; // Relative path because they share same server, e.g. http://localhost:3000
  let tyreCodes = [];
  let areas = [];
  let storageLocations = [];
  let categories = [];
  
  let batchQueue = [];
  let chartManager = null;
  let currentActiveTab = 'dashboard';
  let historyRecords = [];
  
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
    
    // Form Inputs
    form: document.getElementById('workaway-form'),
    inputDate: document.getElementById('input-date'),
    inputArea: document.getElementById('input-area'),
    inputStorage: document.getElementById('input-storage'),
    inputCode: document.getElementById('input-code'),
    autocompleteList: document.getElementById('autocomplete-list'),
    inputCategory: document.getElementById('input-category'),
    inputQtyIn: document.getElementById('input-qty-in'),
    inputQtyOut: document.getElementById('input-qty-out'),
    inputNotes: document.getElementById('input-notes'),
    
    // Form Buttons
    btnAddQueue: document.getElementById('btn-add-queue'),
    btnSubmitDirect: document.getElementById('btn-submit-direct'),
    
    // Queue Elements
    queueContainer: document.getElementById('queue-items'),
    queueCountBadge: document.getElementById('queue-count'),
    queueSaveCount: document.getElementById('queue-save-count'),
    queueActionsPanel: document.getElementById('queue-actions-panel'),
    btnClearQueue: document.getElementById('btn-clear-queue'),
    btnSaveQueue: document.getElementById('btn-save-queue'),
    
    // Today Log Elements
    todayTableBody: document.getElementById('today-records-table-body'),
    btnRefreshToday: document.getElementById('btn-refresh-today'),
    
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
    
    // Edit Modal Elements
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

  // Set today's date in date inputs
  const todayStr = new Date().toISOString().split('T')[0];
  elements.inputDate.value = todayStr;
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
      
      const data = await response.ok ? await response.json() : null;
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

      // Render preset codes grids
      renderPresetCodesGrid();

      // Autocomplete events binding
      setupAutocomplete();
      
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
      
      // Clicking on chip fills it in recording form and opens record tab!
      chip.addEventListener('click', () => {
        elements.inputCode.value = code;
        switchTab('record');
        showToast(`เลือกรหัสยาง ${code} ลงในฟอร์มสำเร็จ`, 'info');
      });

      elements.presetCodesGrid.appendChild(chip);
    });
  }

  // Filter Code Chip event
  elements.searchCodeInput.addEventListener('input', (e) => {
    renderPresetCodesGrid(e.target.value);
  });

  // ==========================================================================
  // TYRE CODE AUTOCOMPLETE (SEARCH DROP-DOWN)
  // ==========================================================================
  function setupAutocomplete() {
    const input = elements.inputCode;
    const dropdown = elements.autocompleteList;

    input.addEventListener('input', () => {
      const val = input.value.trim().toUpperCase();
      dropdown.innerHTML = '';

      if (!val) {
        dropdown.style.display = 'none';
        return;
      }

      const matches = tyreCodes.filter(c => c.includes(val));
      if (matches.length === 0) {
        dropdown.style.display = 'none';
        return;
      }

      matches.forEach(match => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        // Highlight matched characters
        const regex = new RegExp(`(${val})`, 'gi');
        item.innerHTML = match.replace(regex, '<strong>$1</strong>');
        
        item.addEventListener('click', () => {
          input.value = match;
          dropdown.style.display = 'none';
        });

        dropdown.appendChild(item);
      });

      dropdown.style.display = 'block';
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target !== input && e.target !== dropdown) {
        dropdown.style.display = 'none';
      }
    });

    // Handle keys on autocomplete input (enter selects first match)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const items = dropdown.querySelectorAll('.autocomplete-item');
        if (items.length > 0) {
          e.preventDefault();
          items[0].click();
        }
      }
    });
  }

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
      record: { title: 'บันทึกข้อมูลรายวัน', desc: 'ป้อนข้อมูลนำเข้า/ส่งออกประจำวันอย่างรวดเร็ว (คีย์มือแบบกลุ่ม)' },
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
    } else if (targetTab === 'record') {
      fetchTodayRecords();
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
  // BATCH QUEUE MANAGEMENT
  // ==========================================================================
  
  // Validates a single entry before putting into queue or database
  function validateFormEntry() {
    const code = elements.inputCode.value.trim().toUpperCase();
    const area = elements.inputArea.value;
    const storage = elements.inputStorage.value;
    const category = elements.inputCategory.value;
    const qtyIn = parseFloat(elements.inputQtyIn.value) || 0;
    const qtyOut = parseFloat(elements.inputQtyOut.value) || 0;

    if (!elements.inputDate.value) {
      showToast('กรุณาระบุวันที่จัดทำรายการ', 'warning');
      return false;
    }
    if (!area) {
      showToast('กรุณาเลือกพื้นที่การผลิต (Area)', 'warning');
      return false;
    }
    if (!storage) {
      showToast('กรุณาเลือกสถานที่จัดเก็บ (Storage)', 'warning');
      return false;
    }
    if (!code || !tyreCodes.includes(code)) {
      showToast('รหัสยางต้องถูกต้องตามรายการรหัสยางมาตรฐาน 46 รหัสเท่านั้น', 'warning');
      return false;
    }
    if (!category) {
      showToast('กรุณาระบุสถานะหรือประเภทอายุยาง', 'warning');
      return false;
    }
    if (qtyIn < 0 || qtyOut < 0) {
      showToast('จำนวนน้ำหนักห้ามมีค่าติดลบ', 'warning');
      return false;
    }
    if (qtyIn === 0 && qtyOut === 0) {
      showToast('กรุณาระบุน้ำหนักขาเข้า (IN) หรือขาออก (OUT) อย่างน้อย 1 ช่อง', 'warning');
      return false;
    }

    return {
      date: elements.inputDate.value,
      area,
      storage_location: storage,
      code,
      category,
      qty_in: qtyIn,
      qty_out: qtyOut,
      notes: elements.inputNotes.value.trim()
    };
  }

  // Add Item to Queue
  elements.btnAddQueue.addEventListener('click', () => {
    const record = validateFormEntry();
    if (!record) return; // failed validation

    // Add unique queue ID
    record.queueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    batchQueue.push(record);
    
    // Clear inputs except Date, Area and Storage to speed up typing!
    elements.inputCode.value = '';
    elements.inputCategory.value = '';
    elements.inputQtyIn.value = '';
    elements.inputQtyOut.value = '';
    elements.inputNotes.value = '';
    
    renderQueueList();
    showToast('เพิ่มรายการเข้าคิวสำเร็จ', 'info');
  });

  // Render Visual Queue Items
  function renderQueueList() {
    const container = elements.queueContainer;
    container.innerHTML = '';

    elements.queueCountBadge.textContent = `${batchQueue.length} รายการ`;
    elements.queueSaveCount.textContent = batchQueue.length;

    if (batchQueue.length === 0) {
      elements.queueActionsPanel.style.display = 'none';
      container.innerHTML = `
        <div class="empty-queue-placeholder">
          <i class="fa-solid fa-cart-flatbed-suitcase"></i>
          <p>ยังไม่มีรายการในคิวเตรียมบันทึก</p>
          <span class="text-muted">เลือกข้อมูลด้านซ้ายแล้วกดปุ่ม "เพิ่มเข้าคิวด้านขวา"</span>
        </div>
      `;
      return;
    }

    elements.queueActionsPanel.style.display = 'flex';

    batchQueue.forEach((item, index) => {
      const qItem = document.createElement('div');
      qItem.className = 'queue-item';
      
      let badgeClass = 'badge-new';
      let categoryThai = 'ของใหม่';
      if (item.category === '7day') { badgeClass = 'badge-7d'; categoryThai = '7 วัน'; }
      if (item.category === '7-14day') { badgeClass = 'badge-7-14d'; categoryThai = '7-14 วัน'; }
      if (item.category === 'over14day') { badgeClass = 'badge-over14d'; categoryThai = '>14 วัน'; }
      if (item.category === 'disposition') { badgeClass = 'badge-disp'; categoryThai = 'รอตรวจ'; }

      qItem.innerHTML = `
        <div class="queue-item-details">
          <div class="queue-item-code-row">
            <span class="queue-item-code">${item.code}</span>
            <span class="queue-item-badge ${badgeClass}">${categoryThai}</span>
          </div>
          <span class="queue-item-info">พื้นที่: ${item.area} | จัดเก็บ: ${item.storage_location}</span>
        </div>
        <div class="queue-item-weight">
          <span class="weight-row">
            ${item.qty_in > 0 ? `<span class="text-success">+${item.qty_in} IN</span>` : ''}
            ${item.qty_out > 0 ? `<span class="text-danger">-${item.qty_out} OUT</span>` : ''}
          </span>
          <button class="queue-item-delete" title="ลบรายการนี้"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;

      // Remove from queue event
      qItem.querySelector('.queue-item-delete').addEventListener('click', () => {
        batchQueue.splice(index, 1);
        renderQueueList();
        showToast('ลบรายการออกจากคิวแล้ว', 'info');
      });

      container.appendChild(qItem);
    });
  }

  // Clear Queue
  elements.btnClearQueue.addEventListener('click', () => {
    batchQueue = [];
    renderQueueList();
    showToast('ล้างคิวรายการทั้งหมดเรียบร้อยแล้ว', 'info');
  });

  // Save Direct Single Entry (Immediate Save button)
  elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const record = validateFormEntry();
    if (!record) return;

    try {
      elements.btnSubmitDirect.disabled = true;
      elements.btnSubmitDirect.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';

      const response = await fetch(`${apiBaseUrl}/api/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save record');
      }

      showToast('บันทึกรายการลงเซิร์ฟเวอร์เรียบร้อย!', 'success');
      
      // Reset form fields
      elements.inputCode.value = '';
      elements.inputCategory.value = '';
      elements.inputQtyIn.value = '';
      elements.inputQtyOut.value = '';
      elements.inputNotes.value = '';

      fetchTodayRecords();
    } catch (error) {
      console.error(error);
      showToast(error.message, 'danger');
    } finally {
      elements.btnSubmitDirect.disabled = false;
      elements.btnSubmitDirect.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกลงเซิร์ฟเวอร์ทันที';
    }
  });

  // Save Batch Queue to Server
  elements.btnSaveQueue.addEventListener('click', async () => {
    if (batchQueue.length === 0) return;
    
    try {
      elements.btnSaveQueue.disabled = true;
      elements.btnSaveQueue.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกทั้งหมด...';

      let successCount = 0;
      // Post all items concurrently
      const promises = batchQueue.map(async (record) => {
        // Remove helper ID before posting
        const { queueId, ...cleanRecord } = record;
        const response = await fetch(`${apiBaseUrl}/api/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanRecord)
        });
        if (response.ok) successCount++;
      });

      await Promise.all(promises);
      
      showToast(`บันทึกแบบกลุ่มสำเร็จทั้งหมด ${successCount} จาก ${batchQueue.length} รายการ`, 'success');
      batchQueue = [];
      renderQueueList();
      fetchTodayRecords();
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลแบบกลุ่ม', 'danger');
    } finally {
      elements.btnSaveQueue.disabled = false;
      elements.btnSaveQueue.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> บันทึกรายการทั้งหมด';
    }
  });

  // ==========================================================================
  // TODAY ACTIONS & LOGS LIST
  // ==========================================================================
  async function fetchTodayRecords() {
    try {
      elements.todayTableBody.innerHTML = '<tr><td colspan="9" class="text-center"><i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...</td></tr>';
      
      const response = await fetch(`${apiBaseUrl}/api/records?start_date=${todayStr}&end_date=${todayStr}`);
      if (!response.ok) throw new Error('Failed to load today records');
      
      const data = await response.json();
      renderTodayTable(data);
    } catch (e) {
      console.error(e);
      elements.todayTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">เกิดข้อผิดพลาดในการดึงข้อมูลวันนี้</td></tr>';
    }
  }

  function renderTodayTable(records) {
    const tbody = elements.todayTableBody;
    tbody.innerHTML = '';

    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">ไม่พบประวัติการทำรายการในวันนี้ (กรอกฟอร์มเพื่อบันทึกรายการแรก)</td></tr>';
      return;
    }

    records.forEach(r => {
      const tr = document.createElement('tr');
      tr.className = 'glowing-row';
      
      const formattedTime = new Date(r.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      
      let categoryThai = 'ของใหม่';
      if (r.category === '7day') categoryThai = 'อยู่มาแล้ว 7 วัน';
      if (r.category === '7-14day') categoryThai = 'อยู่มาแล้ว 7-14 วัน';
      if (r.category === 'over14day') categoryThai = 'มากกว่า 14 วัน';
      if (r.category === 'disposition') categoryThai = 'รอตรวจสอบ (Disposition)';

      tr.innerHTML = `
        <td><strong>${formattedTime} น.</strong></td>
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

      // Bind Edit / Delete inside row
      tr.querySelector('.edit-btn').addEventListener('click', () => openEditModal(r));
      tr.querySelector('.delete-btn').addEventListener('click', () => deleteRecord(r.id));

      tbody.appendChild(tr);
    });
  }

  elements.btnRefreshToday.addEventListener('click', fetchTodayRecords);

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
      if (currentActiveTab === 'record') {
        fetchTodayRecords();
      } else if (currentActiveTab === 'history') {
        fetchHistoryRecords();
      }
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
      if (currentActiveTab === 'record') {
        fetchTodayRecords();
      } else if (currentActiveTab === 'history') {
        fetchHistoryRecords();
      }
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
      const headers = ['วันที่บันทึก (Date)', 'พื้นที่การผลิต (Area)', 'สถานที่จัดเก็บ (Storage)', 'รหัสยาง (Tyre Code)', 'ประเภทอายุยาง (Category)', 'นำเข้า IN (kg)', 'เคลียร์ออก OUT (kg)', 'หมายเหตุ (Notes)'];
      
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
          `"${(r.notes || '').replace(/"/g, '""')}"` // escape double quotes
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
