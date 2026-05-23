/**
 * Workaway Recording & Dashboard System - Premium Charts Module
 * Custom neon gradients, glowing states, and responsive resizing via Chart.js
 */

class WorkawayCharts {
  constructor() {
    this.instances = {};
    // Premium color palette mapping matching our HSL css variables
    this.colors = {
      purple: 'rgba(99, 102, 241, 1)',
      purpleLight: 'rgba(99, 102, 241, 0.35)',
      purpleGlow: 'rgba(99, 102, 241, 0.1)',
      
      cyan: 'rgba(6, 182, 212, 1)',
      cyanLight: 'rgba(6, 182, 212, 0.35)',
      cyanGlow: 'rgba(6, 182, 212, 0.1)',
      
      amber: 'rgba(245, 158, 11, 1)',
      amberLight: 'rgba(245, 158, 11, 0.35)',
      
      emerald: 'rgba(16, 185, 129, 1)',
      emeraldLight: 'rgba(16, 185, 129, 0.35)',
      
      rose: 'rgba(239, 68, 68, 1)',
      roseLight: 'rgba(239, 68, 68, 0.35)',

      orange: 'rgba(249, 115, 22, 1)',
      orangeLight: 'rgba(249, 115, 22, 0.35)',
      
      gridColor: 'rgba(255, 255, 255, 0.05)',
      gridColorLight: 'rgba(0, 0, 0, 0.05)',
      
      textMain: '#f3f4f6',
      textMainLight: '#1e293b'
    };
  }

  // Helper to determine if theme is dark
  isDarkTheme() {
    return document.body.classList.contains('dark-theme');
  }

  // Get current responsive text color based on active theme
  getTextColor() {
    return this.isDarkTheme() ? this.colors.textMain : this.colors.textMainLight;
  }

  // Get current responsive grid color based on active theme
  getGridColor() {
    return this.isDarkTheme() ? this.colors.gridColor : this.colors.gridColorLight;
  }

  // Safe global default options for premium feel
  getGlobalDefaults() {
    const textColor = this.getTextColor();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: { family: "'Inter', 'Sarabun'", size: 11, weight: '500' }
          }
        },
        tooltip: {
          backgroundColor: this.isDarkTheme() ? 'rgba(16, 18, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: this.isDarkTheme() ? '#f3f4f6' : '#1e293b',
          bodyColor: this.isDarkTheme() ? '#9ca3af' : '#64748b',
          borderColor: this.isDarkTheme() ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          titleFont: { family: "'Inter', 'Sarabun'", size: 12, weight: '700' },
          bodyFont: { family: "'Inter', 'Sarabun'", size: 12 },
          displayColors: true,
          boxPadding: 6
        }
      }
    };
  }

  // Create neon gradient fills for bar/line charts
  createGradient(ctx, color1, color2, height = 300) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    return grad;
  }

  // 1. Initialize Trend Line Chart
  initTrendChart(canvasId, labels = [], inData = [], outData = []) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const gradIn = this.createGradient(ctx, 'rgba(99, 102, 241, 0.25)', 'rgba(99, 102, 241, 0.0)');
    const gradOut = this.createGradient(ctx, 'rgba(6, 182, 212, 0.25)', 'rgba(6, 182, 212, 0.0)');

    const config = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'ปริมาณนำเข้า (IN)',
            data: inData,
            borderColor: this.colors.purple,
            backgroundColor: gradIn,
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: this.colors.purple,
            pointBorderColor: 'rgba(255, 255, 255, 0.3)',
            pointHoverRadius: 6,
            pointHoverBorderWidth: 3
          },
          {
            label: 'ปริมาณเคลียร์ออก (OUT)',
            data: outData,
            borderColor: this.colors.cyan,
            backgroundColor: gradOut,
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: this.colors.cyan,
            pointBorderColor: 'rgba(255, 255, 255, 0.3)',
            pointHoverRadius: 6,
            pointHoverBorderWidth: 3
          }
        ]
      },
      options: {
        ...this.getGlobalDefaults(),
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: this.getTextColor(),
              font: { family: "'Inter'", size: 10 }
            }
          },
          y: {
            grid: { color: this.getGridColor() },
            ticks: {
              color: this.getTextColor(),
              font: { family: "'Inter'", size: 10 },
              callback: (value) => `${value} กก.`
            }
          }
        }
      }
    };

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }
    this.instances[canvasId] = new Chart(ctx, config);
  }

  // 2. Initialize Top 10 Tyre Codes Horizontal Bar Chart
  initTop10Chart(canvasId, labels = [], data = []) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Create side-to-side gradient for bars
    const grad = ctx.createLinearGradient(0, 0, 400, 0);
    grad.addColorStop(0, 'rgba(99, 102, 241, 0.85)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.85)');

    const config = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'น้ำหนักสะสมในระบบ',
            data: data,
            backgroundColor: grad,
            borderColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 1,
            borderRadius: 6,
            barThickness: 16
          }
        ]
      },
      options: {
        ...this.getGlobalDefaults(),
        indexAxis: 'y', // horizontal bar chart
        plugins: {
          ...this.getGlobalDefaults().plugins,
          legend: { display: false } // Hide legend as there's only one dataset
        },
        scales: {
          x: {
            grid: { color: this.getGridColor() },
            ticks: {
              color: this.getTextColor(),
              font: { family: "'Inter'", size: 10 },
              callback: (value) => `${value} กก.`
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: this.getTextColor(),
              font: { family: "'Inter'", size: 11, weight: '600' }
            }
          }
        }
      }
    };

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }
    this.instances[canvasId] = new Chart(ctx, config);
  }

  // 3. Initialize Category Breakdown Vertical Column Chart
  initCategoriesChart(canvasId, dataMap = {}) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const labels = ['ของใหม่', '7 วัน', '7-14 วัน', '>14 วัน', 'รอตรวจ'];
    const values = [
      dataMap.new || 0,
      dataMap['7day'] || 0,
      dataMap['7-14day'] || 0,
      dataMap.over14day || 0,
      dataMap.disposition || 0
    ];

    const config = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'น้ำหนักสะสม (กก.)',
            data: values,
            backgroundColor: [
              'rgba(99, 102, 241, 0.8)', // New: Purple
              'rgba(6, 182, 212, 0.8)',  // 7d: Cyan
              'rgba(245, 158, 11, 0.8)', // 7-14d: Amber
              'rgba(239, 68, 68, 0.8)',  // >14d: Rose
              'rgba(249, 115, 22, 0.8)'  // Disp: Orange
            ],
            borderWidth: 1,
            borderRadius: 8,
            barThickness: 28
          }
        ]
      },
      options: {
        ...this.getGlobalDefaults(),
        plugins: {
          ...this.getGlobalDefaults().plugins,
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: this.getTextColor(),
              font: { family: "'Sarabun', 'Inter'", size: 11, weight: '600' }
            }
          },
          y: {
            grid: { color: this.getGridColor() },
            ticks: {
              color: this.getTextColor(),
              font: { family: "'Inter'", size: 10 },
              callback: (value) => `${value} กก.`
            }
          }
        }
      }
    };

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }
    this.instances[canvasId] = new Chart(ctx, config);
  }

  // 4. Initialize Disposition Doughnut Chart
  initDispositionChart(canvasId, labels = [], data = []) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const bgColors = [
      'rgba(99, 102, 241, 0.75)',  // QUAD
      'rgba(6, 182, 212, 0.75)',   // Tuber
      'rgba(245, 158, 11, 0.75)',  // 4roll2
      'rgba(16, 185, 129, 0.75)',  // 4roll1
      'rgba(239, 68, 68, 0.75)',   // BTB-WBR
      'rgba(139, 92, 246, 0.75)',  // Sapphire
      'rgba(244, 63, 94, 0.75)'    // BTB-Aero
    ];

    const config = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: bgColors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: this.isDarkTheme() ? '#161926' : '#ffffff',
            hoverOffset: 8
          }
        ]
      },
      options: {
        ...this.getGlobalDefaults(),
        plugins: {
          ...this.getGlobalDefaults().plugins,
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 10,
              font: { size: 10 }
            }
          }
        },
        cutout: '70%'
      }
    };

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }
    this.instances[canvasId] = new Chart(ctx, config);
  }

  // 5. Initialize Storage Location Doughnut Chart
  initStorageChart(canvasId, labels = [], data = []) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Custom colors for storage locations: QUAD, TUBER, WA1, WA 2, WA3
    const bgColors = [
      'rgba(6, 182, 212, 0.75)',   // QUAD (cyan)
      'rgba(139, 92, 246, 0.75)',  // TUBER (purple)
      'rgba(16, 185, 129, 0.75)',  // WA1 (emerald)
      'rgba(245, 158, 11, 0.75)',  // WA 2 (amber)
      'rgba(239, 68, 68, 0.75)'    // WA3 (rose)
    ];

    const config = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: bgColors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: this.isDarkTheme() ? '#161926' : '#ffffff',
            hoverOffset: 8
          }
        ]
      },
      options: {
        ...this.getGlobalDefaults(),
        plugins: {
          ...this.getGlobalDefaults().plugins,
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 10,
              font: { size: 10 }
            }
          }
        },
        cutout: '70%'
      }
    };

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }
    this.instances[canvasId] = new Chart(ctx, config);
  }

  // Redraw/update all charts in response to theme toggles or window resize
  refreshTheme() {
    Object.values(this.instances).forEach(chart => {
      // Update ticks, grid, legend font colors based on active theme
      const textColor = this.getTextColor();
      const gridColor = this.getGridColor();

      if (chart.options.plugins?.legend?.labels) {
        chart.options.plugins.legend.labels.color = textColor;
      }
      if (chart.options.plugins?.tooltip) {
        chart.options.plugins.tooltip.backgroundColor = this.isDarkTheme() ? 'rgba(16, 18, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        chart.options.plugins.tooltip.titleColor = this.isDarkTheme() ? '#f3f4f6' : '#1e293b';
        chart.options.plugins.tooltip.bodyColor = this.isDarkTheme() ? '#9ca3af' : '#64748b';
        chart.options.plugins.tooltip.borderColor = this.isDarkTheme() ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
      }

      if (chart.options.scales) {
        Object.keys(chart.options.scales).forEach(scaleId => {
          const scale = chart.options.scales[scaleId];
          if (scale.ticks) scale.ticks.color = textColor;
          if (scale.grid && scaleId !== 'x') scale.grid.color = gridColor;
        });
      }

      // Border lines update inside doughnuts
      if (chart.config.type === 'doughnut') {
        chart.data.datasets.forEach(ds => {
          ds.borderColor = this.isDarkTheme() ? '#161926' : '#ffffff';
        });
      }

      chart.update();
    });
  }

  // Global aggregate updater
  updateCharts(summaryData) {
    if (!summaryData) return;

    // 1. Update Daily Trend Chart
    if (summaryData.daily_trend) {
      const dates = summaryData.daily_trend.map(t => {
        // Format YYYY-MM-DD to DD/MM
        const p = t.date.split('-');
        return p.length === 3 ? `${p[2]}/${p[1]}` : t.date;
      });
      const inValues = summaryData.daily_trend.map(t => t.in);
      const outValues = summaryData.daily_trend.map(t => t.out);
      this.initTrendChart('chartTrend', dates, inValues, outValues);
    }

    // 2. Update Top 10 Chart
    if (summaryData.top_codes) {
      const topCodesLabels = summaryData.top_codes.map(c => c.code);
      const topCodesValues = summaryData.top_codes.map(c => c.balance);
      this.initTop10Chart('chartTop10', topCodesLabels, topCodesValues);
    }

    // 3. Update Categories Chart
    if (summaryData.categories) {
      const catMap = {
        new: summaryData.categories.new?.balance || 0,
        '7day': summaryData.categories['7day']?.balance || 0,
        '7-14day': summaryData.categories['7-14day']?.balance || 0,
        over14day: summaryData.categories.over14day?.balance || 0,
        disposition: summaryData.categories.disposition?.balance || 0
      };
      this.initCategoriesChart('chartCategories', catMap);
    }

    // 4. Update Disposition by Area Chart
    if (summaryData.areas) {
      const areaLabels = [];
      const areaValues = [];
      Object.keys(summaryData.areas).forEach(area => {
        const dispVal = summaryData.areas[area].disposition_pending || 0;
        if (dispVal > 0) {
          areaLabels.push(area);
          areaValues.push(dispVal);
        }
      });
      // Fallback if no disposition pending to avoid empty chart display
      if (areaLabels.length === 0) {
        this.initDispositionChart('chartDisposition', ['ไม่มีงานค้าง'], [0]);
      } else {
        this.initDispositionChart('chartDisposition', areaLabels, areaValues);
      }
    }

    // 5. Update Storage Locations Chart
    if (summaryData.storage_locations) {
      const locLabels = [];
      const locValues = [];
      Object.keys(summaryData.storage_locations).forEach(loc => {
        const balVal = summaryData.storage_locations[loc].balance || 0;
        if (balVal > 0) {
          locLabels.push(loc);
          locValues.push(balVal);
        }
      });
      // Fallback
      if (locLabels.length === 0) {
        this.initStorageChart('chartStorage', ['คลังว่างเปล่า'], [0]);
      } else {
        this.initStorageChart('chartStorage', locLabels, locValues);
      }
    }
  }
}

// Export class globally
window.WorkawayCharts = WorkawayCharts;
