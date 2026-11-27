/**
 * UI Controller for ERPsim Logistics Sustainability (Preset 3) Command Center
 * 100% Dedicated to Preset 3 Dairy (T01..T06, V04 vs V08, MD61 Target, ZMB1B, VK32 DC 16, ESG Credit Gate & 8 Disruptors)
 */

document.addEventListener('DOMContentLoaded', () => {
  const fmtEur = (n) => {
    const sign = n < 0 ? '-' : '';
    return sign + '€' + Math.round(Math.abs(n)).toLocaleString('en-US');
  };
  const fmtDec = (n, d = 2) => Number(n).toFixed(d);
  const numVal = (id, fallback = 0) => {
    const el = document.getElementById(id);
    if (!el || el.value === '') return fallback;
    const v = Number(el.value);
    return Number.isFinite(v) ? v : fallback;
  };

  // 1. TAB SWITCHING
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // =========================================================================
  // SHARED STATE FOR THE 6 DAIRY PRODUCTS (T01..T06) IN PRESET 3
  // =========================================================================
  // Winning Top-1/Top-2 Velocity (~362 units/day = ~3,620 units/round like Team B & Team L)
  const skuInventoryState = {
    T01: { dailySalesRate: 115, physicalStock: 570, openPoQty: 0, currentStockAndOpenPo: 570, desiredOrderQty: 465, salesNO: 380, salesSO: 310, salesWE: 310, hasLocBreakdown: false, loc03: 0, loc03N: 0, loc03S: 0, loc03W: 0 },
    T02: { dailySalesRate: 36,  physicalStock: 180, openPoQty: 0, currentStockAndOpenPo: 180, desiredOrderQty: 144, salesNO: 110, salesSO: 140, salesWE: 100, hasLocBreakdown: false, loc03: 0, loc03N: 0, loc03S: 0, loc03W: 0 },
    T03: { dailySalesRate: 85,  physicalStock: 420, openPoQty: 0, currentStockAndOpenPo: 420, desiredOrderQty: 345, salesNO: 250, salesSO: 290, salesWE: 220, hasLocBreakdown: false, loc03: 0, loc03N: 0, loc03S: 0, loc03W: 0 },
    T04: { dailySalesRate: 42,  physicalStock: 210, openPoQty: 0, currentStockAndOpenPo: 210, desiredOrderQty: 168, salesNO: 190, salesSO: 130, salesWE: 150, hasLocBreakdown: false, loc03: 0, loc03N: 0, loc03S: 0, loc03W: 0 },
    T05: { dailySalesRate: 48,  physicalStock: 240, openPoQty: 0, currentStockAndOpenPo: 240, desiredOrderQty: 192, salesNO: 150, salesSO: 160, salesWE: 190, hasLocBreakdown: false, loc03: 0, loc03N: 0, loc03S: 0, loc03W: 0 },
    T06: { dailySalesRate: 36,  physicalStock: 180, openPoQty: 0, currentStockAndOpenPo: 180, desiredOrderQty: 144, salesNO: 120, salesSO: 170, salesWE: 130, hasLocBreakdown: false, loc03: 0, loc03N: 0, loc03S: 0, loc03W: 0 }
  };

  let dairyPricingState = [
    { skuCode: 'T01', landedCogs: 24.30, prevPrice: 25.25, prevQty: 125, currPrice: 28.05, currQty: 115, inventoryRemaining: 570 },
    { skuCode: 'T02', landedCogs: 73.42, prevPrice: 79.78, prevQty: 40,  currPrice: 87.40, currQty: 36,  inventoryRemaining: 180 },
    { skuCode: 'T03', landedCogs: 27.20, prevPrice: 28.43, prevQty: 95,  currPrice: 31.55, currQty: 85,  inventoryRemaining: 420 },
    { skuCode: 'T04', landedCogs: 84.03, prevPrice: 90.95, prevQty: 46,  currPrice: 100.50, currQty: 42, inventoryRemaining: 210 },
    { skuCode: 'T05', landedCogs: 61.23, prevPrice: 65.87, prevQty: 53,  currPrice: 72.40, currQty: 48,  inventoryRemaining: 240 },
    { skuCode: 'T06', landedCogs: 44.50, prevPrice: 47.47, prevQty: 40,  currPrice: 52.25, currQty: 36,  inventoryRemaining: 180 }
  ];

  // =========================================================================
  // TAB 1: LOGISTICS SUSTAINABILITY (PRESET 3) & 8 DISRUPTORS SOLVER
  // =========================================================================
  let currentRoundNumber = 1;
  let lastSolvedAnalysis = [];

  const logInputs = [
    'log-base-tax', 'log-po-lot', 'log-total-stock', 'log-transfers-day',
    'log-reg-orders', 'log-dir-orders', 'log-coverage-days', 'log-auto-order', 'log-cap-4000',
    'log-cap-cash', 'log-available-cash', 'log-zmb1b-mode', 'log-day-in-round', 'log-is-final-round',
    'log-auto-sync-totals',
    'dis-1-cold', 'dis-1-combo', 'dis-2-carbon', 'dis-3-supplier', 'dis-3-vendor',
    'dis-4-gridlock', 'dis-5-glitch', 'dis-6-breach', 'dis-7-flood', 'dis-7-warehouse', 'dis-8-ai'
  ];

  function buildSolverParams(overrideLot) {
    return {
      roundNumber: currentRoundNumber,
      dayInRound: Math.max(1, numVal('log-day-in-round', 4)),
      isFinalRound: document.getElementById('log-is-final-round').checked,
      baseCarbonTax: numVal('log-base-tax', 0.10),
      orderLotSizePerPo: overrideLot !== undefined ? overrideLot : Math.max(50, numVal('log-po-lot', 1800)),
      totalWarehouseUnits: numVal('log-total-stock', 1800),
      coverageDays: Math.max(0, numVal('log-coverage-days', 9)),
      autoOrderCalc: document.getElementById('log-auto-order').checked,
      capWarehouse4000: document.getElementById('log-cap-4000').checked,
      availableCash: Math.max(0, numVal('log-available-cash', 250000)),
      capCashSafety: document.getElementById('log-cap-cash').checked,
      zmb1bMode: document.getElementById('log-zmb1b-mode').value || 'PULL',
      transfersPerDay: numVal('log-transfers-day', 1.5),
      regionalSalesOrdersPerDay: numVal('log-reg-orders', 8),
      directSalesOrdersPerDay: numVal('log-dir-orders', 0),
      coldSpellActive: document.getElementById('dis-1-cold').checked,
      coldSpellCombo: document.getElementById('dis-1-combo').value,
      carbonDecreeActive: document.getElementById('dis-2-carbon').checked,
      supplierDisruptionActive: document.getElementById('dis-3-supplier').checked,
      impactedSupplier: document.getElementById('dis-3-vendor').value,
      hubGridlockActive: document.getElementById('dis-4-gridlock').checked,
      flashFloodActive: document.getElementById('dis-7-flood').checked,
      flashFloodWarehouse: document.getElementById('dis-7-warehouse').value,
      skuInventoryState
    };
  }

  function updateLogisticsPreset3Module() {
    const coldActive = document.getElementById('dis-1-cold').checked;
    const carbonActive = document.getElementById('dis-2-carbon').checked;
    const supplierActive = document.getElementById('dis-3-supplier').checked;
    const gridlockActive = document.getElementById('dis-4-gridlock').checked;
    const glitchActive = document.getElementById('dis-5-glitch').checked;
    const breachActive = document.getElementById('dis-6-breach').checked;
    const floodActive = document.getElementById('dis-7-flood').checked;
    const floodWh = document.getElementById('dis-7-warehouse').value;
    const aiActive = document.getElementById('dis-8-ai').checked;
    const autoOrderCalc = document.getElementById('log-auto-order').checked;
    const availableCash = Math.max(0, numVal('log-available-cash', 250000));
    const zmb1bMode = document.getElementById('log-zmb1b-mode').value || 'PULL';
    const autoSyncTotals = document.getElementById('log-auto-sync-totals').checked;

    if (autoSyncTotals) {
      const sumStock = Object.values(skuInventoryState).reduce((acc, st) => acc + (Number(st.currentStockAndOpenPo) || 0), 0);
      document.getElementById('log-total-stock').value = sumStock;
    }

    let res = ERPsimEngine.solveLogisticsSustainabilityPreset3(buildSolverParams());

    // Sync PO lot size cleanly when order is meaningful (>= 600u); when 0 or tiny, keep realistic 1,800u batch for pricing
    if (autoSyncTotals) {
      const effectiveLot = res.totalNewOrderUnits >= 600 ? res.totalNewOrderUnits : 1800;
      if (Math.abs(numVal('log-po-lot', 1800) - res.totalNewOrderUnits) > 2) {
        document.getElementById('log-po-lot').value = res.totalNewOrderUnits > 0 ? res.totalNewOrderUnits : 1800;
      }
      res = ERPsimEngine.solveLogisticsSustainabilityPreset3(buildSolverParams(effectiveLot));
    }

    lastSolvedAnalysis = res.skuAnalysis;

    // Live ZMB1B recommendation banner
    const zmb1bRecEl = document.getElementById('zmb1b-live-recommendation');
    if (zmb1bRecEl) {
      zmb1bRecEl.innerHTML = `Khuyến nghị <code>ZMB1B</code>: Chế độ <strong>${zmb1bMode}</strong> • Chu kỳ <strong>${res.recommendedZmb1bFreqDays} ngày/lần</strong> • <strong style="color:#34d399;">BỎ TÍCH Sales from SLoc 03 ngay từ Ngày 1</strong> (tránh phạt -€${fmtDec(res.lossPerDirectSaleOrder, 2)} &amp; +300kg CO₂e/đơn làm mất hạng AAA+!) ${res.isEndgameLiquidation ? '• <strong style="color:#fb7185;">🚨 3 NGÀY CUỐI: Ngừng PO &amp; Đẩy sạch Kho 03 ra 3 miền!</strong>' : ''}`;
    }

    // Update Top Telemetry Bar
    const topProfitEl = document.getElementById('top-round-profit');
    if (topProfitEl) {
      topProfitEl.textContent = `${fmtEur(res.projectedRoundNetIncome)} (${fmtDec(res.projectedGrossMarginPct, 1)}% GM)`;
      topProfitEl.style.color = res.projectedRoundNetIncome >= 18000 ? '#10b981' : (res.projectedRoundNetIncome >= 10000 ? '#fbbf24' : '#fb7185');
    }
    document.getElementById('top-md61-cap').textContent = `${res.totalMd61TargetUnits.toLocaleString('en-US')} / 4,000 u`;
    document.getElementById('top-md61-cap').style.color = res.totalMd61TargetUnits > 4000 ? '#fb7185' : '#60a5fa';
    document.getElementById('top-carbon-tax').textContent = `€${fmtDec(res.effectiveCarbonTax, 2)} / kg CO₂e`;

    // Update KPI Cards on Tab 1
    const projProfitEl = document.getElementById('log-proj-profit');
    if (projProfitEl) {
      projProfitEl.textContent = `${fmtEur(res.projectedRoundNetIncome)} / hiệp`;
      projProfitEl.style.color = res.projectedRoundNetIncome >= 18000 ? '#10b981' : '#fbbf24';
    }
    const projGmSubEl = document.getElementById('log-proj-gm-sub');
    if (projGmSubEl) {
      projGmSubEl.textContent = `Doanh thu ~${fmtEur(res.projectedRoundRevenue)} • Biên gộp ~${fmtDec(res.projectedGrossMarginPct, 1)}% (${res.sumDailySalesUnits * 10} hộp)`;
    }
    const esgCo2El = document.getElementById('log-esg-co2-unit');
    if (esgCo2El) {
      esgCo2El.textContent = `${fmtDec(res.projectedCo2PerUnitSold, 2)} kg / hộp`;
      esgCo2El.style.color = res.projectedCo2PerUnitSold <= 4.25 ? '#10b981' : (res.projectedCo2PerUnitSold <= 4.90 ? '#fbbf24' : '#fb7185');
    }
    const esgSubEl = document.getElementById('log-esg-rating-sub');
    if (esgSubEl) {
      esgSubEl.innerHTML = res.projectedCo2PerUnitSold <= 4.25
        ? `Cổng xanh ESG: <strong style="color:#34d399;">${res.projectedEsgCreditRating}</strong> (An toàn &le; 4.25 kg/u)`
        : `⚠️ Bị trần ESG ép xuống <strong style="color:#fb7185;">${res.projectedEsgCreditRating}</strong> (&gt; 4.25 kg/u)!`;
    }

    document.getElementById('log-eff-tax').textContent = `€${fmtDec(res.effectiveCarbonTax, 2)}/kg`;
    document.getElementById('log-overstock-fee').textContent = `${fmtEur(res.overstockFeePerDay)} / ngày`;
    document.getElementById('log-overstock-fee').style.color = res.overstockFeePerDay > 0 ? '#f43f5e' : '#10b981';
    document.getElementById('log-overstock-co2').textContent = `Vượt ${res.excessUnits.toLocaleString('en-US')} units (+${res.overstockCo2PerDay} kg CO₂e/ngày)`;
    document.getElementById('log-daily-total-cost').textContent = `${fmtEur(res.dailyCarbonTaxEur + res.dailyTransportAndStorageFeesEur)} / ngày`;
    document.getElementById('log-daily-co2-sub').textContent = `${res.dailyLogisticsCo2.toLocaleString('en-US')} kg CO₂/ngày`;
    document.getElementById('log-direct-loss').textContent = `-€${fmtDec(res.lossPerDirectSaleOrder, 2)}/đơn`;

    // Smart PO Timing Banner
    const poBanner = document.getElementById('po-timing-banner');
    if (poBanner) {
      if (res.poTimingCode === 'ENDGAME_STOP') {
        poBanner.className = 'alert-card danger';
      } else if (res.poTimingCode === 'HOLD_FULL' || res.poTimingCode === 'HOLD_CONSOLIDATE') {
        poBanner.className = 'alert-card warning';
      } else {
        poBanner.className = 'alert-card';
      }
      poBanner.innerHTML = `<strong>${res.poTimingMessage}</strong>`;
    }

    // Sync full effective marginal cost into Tab 2 Dairy Pricing State so Tab 1 & Tab 2 stay consistent
    res.skuAnalysis.forEach(s => {
      const pRow = dairyPricingState.find(r => r.skuCode === s.code);
      if (pRow) {
        pRow.landedCogs = s.fullEffectiveMarginalCost;
      }
    });

    // Active Disruptor Alert Banner
    const activeFlags = {
      1: coldActive,
      2: carbonActive,
      3: supplierActive,
      4: gridlockActive,
      5: glitchActive,
      6: breachActive,
      7: floodActive,
      8: aiActive
    };
    const activeAlerts = [];
    if (coldActive) activeAlerts.push(`<li><strong>[Event 1 - Cold Spell]:</strong> Đã tự động cộng +5.0 kg CO₂e/unit vào 2 sản phẩm bị ảnh hưởng và tính lại cột <strong>GIÁ TỐI ƯU VK32 (DC 16)</strong>. Hãy kiểm tra chỉ số <code>CO₂e/hộp</code> bên trên để giữ chuẩn <code>AAA+</code>!</li>`);
    if (carbonActive) activeAlerts.push(`<li><strong>[Event 2 - Carbon Decree]:</strong> Thuế suất Carbon đã cộng thêm +€0.20/kg (lên <strong>€${fmtDec(res.effectiveCarbonTax, 2)}/kg</strong>). Bấm <strong>📋 Copy 6 Giá VK32</strong> cập nhật giá bán ngay!</li>`);
    if (supplierActive) activeAlerts.push(`<li><strong>[Event 3 - Supplier Disruption (${document.getElementById('dis-3-vendor').value})]:</strong> Đã cộng +2.50 kg/unit &amp; +200 kg/PO vào ${document.getElementById('dis-3-vendor').value}. Hệ thống đã tối ưu gộp PO toàn danh mục ở cột <strong>CHỌN NCC (ZME12)</strong>!</li>`);
    if (gridlockActive) activeAlerts.push(`<li><strong>[Event 4 - Hub Gridlock]:</strong> Bán từ Kho tổng 03 hiện mất tới <strong>-€${fmtDec(res.lossPerDirectSaleOrder, 2)}/đơn</strong>! Đảm bảo bỏ tích <code>Sales from SLoc 03</code> và đổi <code>ZMB1B Scheduling = 3 days</code>!</li>`);
    if (glitchActive) activeAlerts.push(`<li><strong>[Event 5 - System Glitch]:</strong> KHÔNG tốn €5,000 mua báo cáo! Dùng ngay T-code chuẩn <strong><code>MD07</code></strong> (Collective Access) để xem cả Tồn kho + PO đang về miễn phí €0!</li>`);
    if (breachActive) activeAlerts.push(`<li><strong>[Event 6 - Data Breach]:</strong> Mở bảng OData soi xem đối thủ đang đứt hàng (Stock = 0) ở mặt hàng cao cấp nào (Cheese, Cream, Butter) tại vùng nào → Dùng <code>ZMB1B</code> đẩy hàng vào đó và tăng giá <code>VK32</code> +10%!</li>`);
    if (floodActive) {
      const floodBtnHtml = `<button class="btn btn-outline" id="btn-apply-flood-once" style="margin-left:0.5rem;padding:0.15rem 0.45rem;font-size:0.72rem;border-color:#fb7185;color:#fb7185;">⚡ Trừ Ước Lượng Tồn Kho Mất Do Lũ (1 Lần)</button>`;
      if (floodWh === '03') {
        activeAlerts.push(`<li><strong>[Event 7 - Flash Flood trúng Kho Tổng 03]:</strong> 3 kho vùng (03N, 03S, 03W) vẫn còn hàng bán! Hãy dán lại <code>ZMB52</code> thật (hoặc bấm ${floodBtnHtml}) rồi chạy ngay <code>MD61 → MD01 → ZME12 (V04) → ME59N</code>!</li>`);
      } else {
        activeAlerts.push(`<li><strong>[Event 7 - Flash Flood trúng Kho Vùng ${floodWh}]:</strong> Đổi <code>ZMB1B Scheduling = 1 day</code> đẩy hàng từ <code>03</code> cứu viện kho <strong>${floodWh}</strong>! Hãy dán lại <code>ZMB52</code> (hoặc bấm ${floodBtnHtml}).</li>`);
      }
    }
    if (aiActive) activeAlerts.push(`<li><strong>[Event 8 - AI Innovation]:</strong> Đã mở khóa T-code <code>ZRPA</code>. Với giá bán <code>VK32</code>, hãy dùng cột <strong>GIÁ TỐI ƯU VK32 (DC 16)</strong> của Dashboard để đạt biên lãi ~15% chuẩn Top 1!</li>`);

    const alertBox = document.getElementById('active-disruptor-alerts');
    if (activeAlerts.length > 0) {
      alertBox.style.display = 'block';
      alertBox.className = 'alert-card warning';
      alertBox.innerHTML = `<strong>⚡ LỆNH PHẢN CÔNG KHẨN CẤP CHO SỰ KIỆN ĐANG DIỄN RA:</strong><ul style="margin-left:1.2rem;margin-top:0.35rem;font-size:0.82rem;">${activeAlerts.join('')}</ul>`;
      const floodOnceBtn = document.getElementById('btn-apply-flood-once');
      if (floodOnceBtn) {
        floodOnceBtn.addEventListener('click', () => {
          res.skuAnalysis.forEach(s => {
            const st = skuInventoryState[s.code];
            if (!st) return;
            if (st.hasLocBreakdown) {
              if (floodWh === '03') st.loc03 = 0;
              else if (floodWh === '03N') st.loc03N = 0;
              else if (floodWh === '03S') st.loc03S = 0;
              else if (floodWh === '03W') st.loc03W = 0;
              st.physicalStock = st.loc03 + st.loc03N + st.loc03S + st.loc03W;
              st.currentStockAndOpenPo = st.physicalStock + (st.openPoQty || 0);
            } else {
              let keepRatio = 0.60;
              if (floodWh === '03N') keepRatio = 1 - s.shareNO * 0.80;
              else if (floodWh === '03S') keepRatio = 1 - s.shareSO * 0.80;
              else if (floodWh === '03W') keepRatio = 1 - s.shareWE * 0.80;
              st.currentStockAndOpenPo = Math.round(st.currentStockAndOpenPo * keepRatio);
              st.physicalStock = st.currentStockAndOpenPo;
            }
          });
          updateLogisticsPreset3Module();
        });
      }
    } else {
      alertBox.style.display = 'none';
    }

    // Render Tab 1 Main Table
    const skuTbody = document.getElementById('logistics-sku-tbody');
    skuTbody.innerHTML = res.skuAnalysis.map(s => {
      const vColor = s.recommendedVendor === 'V04' ? '#10b981' : '#3b82f6';
      const orderCellHtml = autoOrderCalc
        ? `<div style="font-weight:900;color:#6ee7b7;font-size:0.95rem;">+${s.desiredOrderQty.toLocaleString('en-US')}</div>
           <div style="font-size:0.68rem;color:#94a3b8;">${s.effectiveCoverageDays}d${s.orderNote ? ` • ${s.orderNote}` : ''}</div>`
        : `<input type="number" class="table-input log-inv-inp" data-sku="${s.code}" data-field="desiredOrderQty" value="${s.desiredOrderQty}" step="50" style="width:72px;" />`;

      const locSubHtml = s.hasLocBreakdown
        ? `<div style="font-size:0.65rem;margin-top:0.18rem;color:#94a3b8;">
             03:${s.loc03} |
             <span style="${s.loc03N <= 0 && s.shareNO > 0.05 ? 'color:#fb7185;font-weight:800;' : ''}">N:${s.loc03N}</span> |
             <span style="${s.loc03S <= 0 && s.shareSO > 0.05 ? 'color:#fb7185;font-weight:800;' : ''}">S:${s.loc03S}</span> |
             <span style="${s.loc03W <= 0 && s.shareWE > 0.05 ? 'color:#fb7185;font-weight:800;' : ''}">W:${s.loc03W}</span>
           </div>`
        : `<div style="font-size:0.65rem;margin-top:0.15rem;color:${s.daysOfStockOnHand < 2.0 ? '#fb7185' : '#94a3b8'};">Đủ ~${s.daysOfStockOnHand} ngày</div>`;

      const stockoutAlertBadge = s.stockoutRegions.length > 0
        ? `<div style="font-size:0.66rem;color:#fb7185;font-weight:800;margin-top:0.15rem;">🔴 Đứt kho: ${s.stockoutRegions.join(', ')}!</div>`
        : '';

      return `
        <tr>
          <td>
            <strong>${s.name}</strong>
            ${s.isColdHit ? '<span class="badge-tcode rose">❄ Cold +5kg</span>' : ''}
          </td>
          <td>€${fmtDec(s.costV04, 2)} | €${fmtDec(s.costV08, 2)}</td>
          <td>${fmtDec(s.v04UnitCo2, 1)}kg | ${fmtDec(s.v08UnitCo2, 1)}kg</td>
          <td style="${s.recommendedVendor === 'V04' ? 'color:#34d399;font-weight:700;' : ''}">€${fmtDec(s.v04LandedUnitCost, 2)}</td>
          <td style="${s.recommendedVendor === 'V08' ? 'color:#60a5fa;font-weight:700;' : ''}">€${fmtDec(s.v08LandedUnitCost, 2)}</td>
          <td>
            <span style="display:inline-block;padding:0.2rem 0.5rem;border-radius:4px;font-weight:800;background:${vColor}22;color:${vColor};border:1px solid ${vColor}66;">
              ${s.recommendedVendor} (-€${fmtDec(s.savingsPerUnit, 2)})
            </span>
          </td>
          <td>
            <input type="number" class="table-input log-inv-inp" data-sku="${s.code}" data-field="dailySalesRate" value="${s.dailySalesRate}" step="10" style="width:68px;" />
          </td>
          <td>
            <input type="number" class="table-input log-inv-inp" data-sku="${s.code}" data-field="currentStockAndOpenPo" value="${s.currentStockAndOpenPo}" step="25" style="width:72px;" />
            ${locSubHtml}
          </td>
          <td style="background:rgba(16,185,129,0.10);text-align:center;">
            ${orderCellHtml}
          </td>
          <td style="background:rgba(59,130,246,0.22);color:#93c5fd;font-weight:900;font-size:0.95rem;text-align:center;">
            ${s.md61TargetToEnter.toLocaleString('en-US')}
          </td>
          <td style="font-size:0.76rem;color:#cbd5e1;">
            03N:<strong>${s.zmb1bTargetNO}</strong> | 03S:<strong>${s.zmb1bTargetSO}</strong> | 03W:<strong>${s.zmb1bTargetWE}</strong>
            ${stockoutAlertBadge}
          </td>
          <td style="background:rgba(16,185,129,0.16);color:#10b981;font-weight:800;font-size:0.95rem;">
            €${fmtDec(s.recommendedPriceDC16, 2)}
            <div style="font-size:0.65rem;color:#94a3b8;font-weight:600;">${s.priceActionNote}</div>
          </td>
          <td style="color:#34d399;font-weight:700;">+€${fmtDec(s.netProfitPerUnit, 2)}</td>
        </tr>
      `;
    }).join('');

    skuTbody.querySelectorAll('.log-inv-inp').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const code = e.target.dataset.sku;
        const field = e.target.dataset.field;
        const val = Number(e.target.value);
        if (skuInventoryState[code]) {
          skuInventoryState[code][field] = Number.isFinite(val) ? Math.max(0, val) : 0;
          if (field === 'currentStockAndOpenPo') {
            skuInventoryState[code].physicalStock = skuInventoryState[code].currentStockAndOpenPo;
            skuInventoryState[code].openPoQty = 0;
            skuInventoryState[code].hasLocBreakdown = false;
          }
          updateLogisticsPreset3Module();
        }
      });
    });

    const capSummaryEl = document.getElementById('md61-cap-summary');
    const overCap = res.totalMd61TargetUnits > 4000;
    const cashWarning = res.totalPoCashNeeded > availableCash * 0.85;
    capSummaryEl.className = overCap ? 'alert-card danger' : (cashWarning ? 'alert-card warning' : 'alert-card');
    capSummaryEl.innerHTML = `
      <div>
        <strong>📊 Kiểm Tra Trần Kho MD61, Gộp Đơn PO (ME59N) &amp; Quỹ Tiền Mặt Weizen Bank:</strong><br/>
        • Tổng Mức Tồn Kho Mục Tiêu gõ vào <code>MD61</code>: <strong style="color:${overCap ? '#fb7185' : '#34d399'};font-size:0.95rem;">${res.totalMd61TargetUnits.toLocaleString('en-US')} / 4,000 units</strong>
        (${overCap ? `⚠️ Đang vượt trần ${res.totalMd61TargetUnits - 4000} units → Sẽ bị phạt €300 + 500kg CO₂e/1,000u khi hàng về!` : (res.wasCappedTo4000 ? '✅ Hệ thống đã tự động co tỷ lệ về ≤ 3,950 units để né phạt vượt kho 4,000u!' : '✅ Nằm an toàn trong trần 4,000 units miễn phí lưu kho!')})<br/>
        • Chiến lược gộp PO (<code>ZME12 → ME59N</code>): <strong style="color:#60a5fa;">${res.portfolioPoFixedNote}</strong><br/>
        • Tổng Lượng Đặt Mua Mới (PO Qty): <strong>${res.totalNewOrderUnits.toLocaleString('en-US')} units</strong> &rarr; Tiền mặt cần thanh toán (đã gồm ${fmtEur(res.portfolioPoFixedFeeEur)} phí PO): <strong style="color:${cashWarning ? '#fb7185' : '#fbbf24'};">${fmtEur(res.totalPoCashNeeded)}</strong> / Tiền mặt hiện có: <strong>${fmtEur(availableCash)}</strong>
        ${res.wasCappedByCash ? ' <strong style="color:#34d399;">(🛡️ Đã tự động giới hạn PO trong 82% quỹ tiền mặt hiện có để chống âm tài khoản 113300 Weizen Bank!)</strong>' : (cashWarning ? ' <strong style="color:#fb7185;">(⚠️ Hãy tích ô "Chống Âm Tiền Mặt Weizen Bank" để hệ thống tự co đơn PO về ngưỡng an toàn!)</strong>' : ' <em>(An toàn tuyệt đối trước hạn mức thấu chi Weizen Bank).</em>')}
      </div>
    `;

    // Render 8 Disruptors Table
    const disTbody = document.getElementById('logistics-disruptors-tbody');
    disTbody.innerHTML = ERPsimEngine.LOGISTICS_DISRUPTORS.map(d => {
      const isAct = Boolean(activeFlags[d.id]);
      return `
        <tr class="${isAct ? 'active-tier' : ''}">
          <td><strong style="color:#fbbf24;">${d.name} ${isAct ? '◀ ĐANG BẬT' : ''}</strong></td>
          <td style="font-family:var(--font-sans);">${d.summary}</td>
          <td style="font-family:var(--font-sans);color:#34d399;"><strong>Đối sách:</strong> ${d.counterStrategy}</td>
        </tr>
      `;
    }).join('');

    // Keep Tab 2 synced
    renderDairyPricingTable();
    renderZmb1bRegionalTable(res.skuAnalysis);
  }

  logInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateLogisticsPreset3Module);
      el.addEventListener('change', updateLogisticsPreset3Module);
    }
  });

  // Quick Round Buttons
  document.querySelectorAll('.round-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.round-quick-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
      });
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-primary');

      currentRoundNumber = Number(btn.dataset.round) || 1;
      const tax = Number(btn.dataset.tax) || 0.10;
      document.getElementById('log-base-tax').value = fmtDec(tax, 2);
      const dayInRound = Math.max(1, numVal('log-day-in-round', 4));
      const elapsedEl = document.getElementById('val-elapsed');
      if (elapsedEl) {
        elapsedEl.value = (currentRoundNumber - 1) * 10 + dayInRound;
        updateValuationModule();
      }
      updateLogisticsPreset3Module();
    });
  });

  document.getElementById('log-day-in-round').addEventListener('change', () => {
    const dayInRound = Math.max(1, numVal('log-day-in-round', 4));
    const elapsedEl = document.getElementById('val-elapsed');
    if (elapsedEl) {
      elapsedEl.value = (currentRoundNumber - 1) * 10 + dayInRound;
      updateValuationModule();
    }
    updateLogisticsPreset3Module();
  });

  document.getElementById('log-available-cash').addEventListener('input', () => {
    const cashVal = numVal('log-available-cash', 250000);
    const valCashEl = document.getElementById('val-cash');
    if (valCashEl) {
      valCashEl.value = cashVal;
      updateValuationModule();
    }
  });

  function showCopyToast(msg, targetId = 'copy-toast-msg') {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.textContent = msg;
    setTimeout(() => { el.textContent = ''; }, 3200);
  }

  document.getElementById('btn-copy-md61').addEventListener('click', () => {
    const text = lastSolvedAnalysis.map(s => s.md61TargetToEnter).join('\n');
    navigator.clipboard.writeText(text).then(() => showCopyToast('✅ Đã copy 6 số MD61 (dán thẳng vào cột tháng 2)!'));
  });

  document.getElementById('btn-copy-vk32').addEventListener('click', () => {
    const text = lastSolvedAnalysis.map(s => fmtDec(s.recommendedPriceDC16, 2)).join('\n');
    navigator.clipboard.writeText(text).then(() => showCopyToast('✅ Đã copy 6 giá bán tối ưu VK32 (DC 16)!'));
  });

  document.getElementById('btn-copy-zmb1b').addEventListener('click', () => {
    const text = lastSolvedAnalysis.map(s => `${s.zmb1bTargetNO}\t${s.zmb1bTargetSO}\t${s.zmb1bTargetWE}`).join('\n');
    navigator.clipboard.writeText(text).then(() => showCopyToast('✅ Đã copy đúng 6×3 số ZMB1B (North / South / West — không kèm tiêu đề)!'));
  });

  document.getElementById('btn-toggle-quick-paste').addEventListener('click', () => {
    const drawer = document.getElementById('tab1-quick-paste-drawer');
    if (drawer) {
      drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
    }
  });

  // 4 Tactical Presets on Tab 1
  const btnR1D1 = document.getElementById('btn-md61-preset-r1d1');
  if (btnR1D1) {
    btnR1D1.addEventListener('click', () => {
      document.getElementById('log-day-in-round').value = '1';
      document.getElementById('log-is-final-round').checked = false;
      document.getElementById('log-auto-order').checked = true;
      document.getElementById('log-cap-4000').checked = true;
      document.getElementById('log-cap-cash').checked = true;
      document.getElementById('log-coverage-days').value = 8;
      document.getElementById('log-available-cash').value = 372646;
      ERPsimEngine.LOGISTICS_PRESET3_SKUS.forEach(sku => {
        const st = skuInventoryState[sku.code];
        st.dailySalesRate = sku.defaultDailyRate;
        st.physicalStock = sku.initialStock;
        st.openPoQty = 0;
        st.currentStockAndOpenPo = sku.initialStock;
        st.hasLocBreakdown = true;
        st.loc03 = sku.initialStock;
        st.loc03N = 0;
        st.loc03S = 0;
        st.loc03W = 0;
        st.salesNO = 100;
        st.salesSO = 100;
        st.salesWE = 100;
      });
      updateLogisticsPreset3Module();
    });
  }

  document.getElementById('btn-md61-preset-start').addEventListener('click', () => {
    document.getElementById('log-is-final-round').checked = false;
    document.getElementById('log-auto-order').checked = true;
    document.getElementById('log-cap-4000').checked = true;
    document.getElementById('log-cap-cash').checked = true;
    document.getElementById('log-coverage-days').value = 8;
    ERPsimEngine.LOGISTICS_PRESET3_SKUS.forEach(sku => {
      skuInventoryState[sku.code].dailySalesRate = sku.defaultDailyRate;
    });
    updateLogisticsPreset3Module();
  });

  const btnTop1 = document.getElementById('btn-md61-preset-top1');
  if (btnTop1) {
    btnTop1.addEventListener('click', () => {
      document.getElementById('log-is-final-round').checked = false;
      document.getElementById('log-auto-order').checked = true;
      document.getElementById('log-cap-4000').checked = true;
      document.getElementById('log-cap-cash').checked = true;
      document.getElementById('log-coverage-days').value = 9.5;
      ERPsimEngine.LOGISTICS_PRESET3_SKUS.forEach(sku => {
        skuInventoryState[sku.code].dailySalesRate = sku.fastDailyRate;
      });
      updateLogisticsPreset3Module();
    });
  }

  document.getElementById('btn-md61-preset-endgame').addEventListener('click', () => {
    document.getElementById('log-is-final-round').checked = true;
    document.getElementById('log-day-in-round').value = '8';
    document.getElementById('log-auto-order').checked = true;
    document.getElementById('log-coverage-days').value = 0;
    document.getElementById('log-zmb1b-mode').value = 'PUSH';
    updateLogisticsPreset3Module();
  });

  // =========================================================================
  // TAB 2: DAIRY DC 16 ELASTICITY & ZMB1B REGIONAL ALLOCATION
  // =========================================================================
  let lastTab2SolvedPrices = [];

  function renderDairyPricingTable() {
    const tbody = document.getElementById('pricing-solver-tbody');
    if (!tbody) return;

    let totalCurrProfit = 0;
    let totalOptProfit = 0;
    let stockoutCount = 0;
    lastTab2SolvedPrices = [];

    tbody.innerHTML = dairyPricingState.map((row, idx) => {
      const solved = ERPsimEngine.solveDairyDc16Pricing(row);
      lastTab2SolvedPrices.push(solved.recommendedPrice);
      totalCurrProfit += solved.currentDailyProfit;
      totalOptProfit += solved.projectedOptimalProfit;
      if (solved.isStockout) stockoutCount++;

      const deltaSign = solved.priceDelta > 0 ? '+' : '';
      const deltaColor = solved.priceDelta > 0.25 ? '#34d399' : (solved.priceDelta < -0.25 ? '#fbbf24' : '#94a3b8');

      return `
        <tr>
          <td><strong>${solved.skuName}</strong></td>
          <td><input type="number" class="table-input dp-inp" data-idx="${idx}" data-field="landedCogs" value="${fmtDec(row.landedCogs, 2)}" step="0.25" /></td>
          <td><input type="number" class="table-input dp-inp" data-idx="${idx}" data-field="prevPrice" value="${fmtDec(row.prevPrice, 2)}" step="0.25" /></td>
          <td><input type="number" class="table-input dp-inp" data-idx="${idx}" data-field="prevQty" value="${row.prevQty}" step="10" /></td>
          <td><input type="number" class="table-input dp-inp" data-idx="${idx}" data-field="currPrice" value="${fmtDec(row.currPrice, 2)}" step="0.25" /></td>
          <td><input type="number" class="table-input dp-inp" data-idx="${idx}" data-field="currQty" value="${row.currQty}" step="10" /></td>
          <td><input type="number" class="table-input dp-inp" data-idx="${idx}" data-field="inventoryRemaining" value="${row.inventoryRemaining}" step="50" style="${solved.isStockout ? 'border-color:#f43f5e;color:#fb7185;' : ''}" /></td>
          <td style="color:#60a5fa; font-weight:700;">${fmtDec(solved.effectiveElasticity, 2)}</td>
          <td style="color:#94a3b8;">€${fmtDec(solved.priceCeiling, 2)}</td>
          <td style="background:rgba(16,185,129,0.14); font-weight:800; color:#10b981; font-size:0.95rem;">
            €${fmtDec(solved.recommendedPrice, 2)}
            <span style="font-size:0.72rem; color:${deltaColor};">(${deltaSign}${fmtDec(solved.priceDelta, 2)})</span>
          </td>
          <td>${fmtDec(solved.marginPct, 1)}%</td>
          <td style="color:#34d399; font-weight:700;">+${fmtEur(solved.profitGainPerDay)}</td>
          <td>
            <span style="display:inline-block; padding:0.18rem 0.45rem; border-radius:4px; font-size:0.7rem; font-weight:700; background:${solved.actionColor}22; color:${solved.actionColor}; border:1px solid ${solved.actionColor}55;">
              ${solved.actionTag}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    document.getElementById('price-curr-profit').textContent = fmtEur(totalCurrProfit);
    document.getElementById('price-opt-profit').textContent = fmtEur(totalOptProfit);
    document.getElementById('price-profit-gain').textContent = `+${fmtEur(Math.max(0, totalOptProfit - totalCurrProfit))} / ngày nếu cập nhật VK32 (DC 16)`;
    document.getElementById('price-stockout-count').textContent = `${stockoutCount} mã`;

    tbody.querySelectorAll('.dp-inp').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.dataset.idx);
        const field = e.target.dataset.field;
        const val = Number(e.target.value);
        dairyPricingState[idx][field] = Number.isFinite(val) ? Math.max(0, val) : 0;
        renderDairyPricingTable();
      });
    });
  }

  document.getElementById('btn-apply-optimal-prices').addEventListener('click', () => {
    dairyPricingState = dairyPricingState.map(row => {
      const solved = ERPsimEngine.solveDairyDc16Pricing(row);
      return {
        ...row,
        prevPrice: row.currPrice,
        prevQty: row.currQty,
        currPrice: solved.recommendedPrice,
        currQty: solved.expectedQtyAtOptimal
      };
    });
    renderDairyPricingTable();
  });

  const btnCopyTab2Vk32 = document.getElementById('btn-copy-tab2-vk32');
  if (btnCopyTab2Vk32) {
    btnCopyTab2Vk32.addEventListener('click', () => {
      const text = lastTab2SolvedPrices.map(p => fmtDec(p, 2)).join('\n');
      navigator.clipboard.writeText(text).then(() => showCopyToast('✅ Đã copy 6 giá P* VK32!', 'tab2-copy-toast'));
    });
  }

  const btnCopyTab2Zmb1b = document.getElementById('btn-copy-tab2-zmb1b');
  if (btnCopyTab2Zmb1b) {
    btnCopyTab2Zmb1b.addEventListener('click', () => {
      const text = lastSolvedAnalysis.map(s => `${s.zmb1bTargetNO}\t${s.zmb1bTargetSO}\t${s.zmb1bTargetWE}`).join('\n');
      navigator.clipboard.writeText(text).then(() => showCopyToast('✅ Đã copy đúng 6×3 số ZMB1B!', 'tab2-copy-toast'));
    });
  }

  function renderZmb1bRegionalTable(skuAnalysis) {
    const tbody = document.getElementById('zmb1b-regional-tbody');
    if (!tbody) return;

    tbody.innerHTML = skuAnalysis.map(s => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td><input type="number" class="table-input zva-inp" data-sku="${s.code}" data-field="salesNO" value="${s.salesNO}" step="20" /></td>
        <td><input type="number" class="table-input zva-inp" data-sku="${s.code}" data-field="salesSO" value="${s.salesSO}" step="20" /></td>
        <td><input type="number" class="table-input zva-inp" data-sku="${s.code}" data-field="salesWE" value="${s.salesWE}" step="20" /></td>
        <td><span class="badge-tcode">${s.shareNOPct}%</span> : <span class="badge-tcode">${s.shareSOPct}%</span> : <span class="badge-tcode">${s.shareWEPct}%</span></td>
        <td style="font-weight:700;">${s.md61TargetToEnter} units</td>
        <td style="background:rgba(16,185,129,0.14);color:#34d399;font-weight:800;font-size:0.95rem;">${s.zmb1bTargetNO}</td>
        <td style="background:rgba(59,130,246,0.14);color:#60a5fa;font-weight:800;font-size:0.95rem;">${s.zmb1bTargetSO}</td>
        <td style="background:rgba(245,158,11,0.14);color:#fbbf24;font-weight:800;font-size:0.95rem;">${s.zmb1bTargetWE}</td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.zva-inp').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const code = e.target.dataset.sku;
        const field = e.target.dataset.field;
        const val = Number(e.target.value);
        if (skuInventoryState[code]) {
          skuInventoryState[code][field] = Number.isFinite(val) ? Math.max(0, val) : 0;
          updateLogisticsPreset3Module();
        }
      });
    });
  }

  // =========================================================================
  // TAB 3: COMPANY VALUATION (ZVAL) & WEIZEN BANK + ESG CREDIT GATE
  // =========================================================================
  const valInputs = [
    'val-profit', 'val-elapsed', 'val-rounds', 'val-steps-round', 'val-co2-unit', 'val-use-esg',
    'val-mkt-risk', 'val-cash', 'val-ar', 'val-loans', 'val-ap', 'val-inventory'
  ];

  function updateValuationModule() {
    const useEsgEl = document.getElementById('val-use-esg');
    const params = {
      currentProfit: numVal('val-profit', 0),
      elapsedSteps: Math.max(1, numVal('val-elapsed', 20)),
      totalRounds: Math.max(1, numVal('val-rounds', 8)),
      stepsPerRound: Math.max(1, numVal('val-steps-round', 10)),
      co2PerUnitSold: Math.max(0, numVal('val-co2-unit', 3.48)),
      useEsgGate: useEsgEl ? useEsgEl.checked : true,
      marketRiskRate: numVal('val-mkt-risk', 7) / 100,
      cash: numVal('val-cash', 0),
      accountsReceivable: numVal('val-ar', 0),
      bankLoans: numVal('val-loans', 0),
      accountsPayable: numVal('val-ap', 0),
      inventoryValue: numVal('val-inventory', 0)
    };

    const res = ERPsimEngine.calculateCompanyValuation(params);

    document.getElementById('top-valuation').textContent = fmtEur(res.companyValuation);
    document.getElementById('top-credit').textContent = `${res.creditInfo.rating} (${fmtDec(res.creditInfo.interestRate * 100, 2)}%)`;
    document.getElementById('top-credit').style.color = res.creditInfo.color;

    document.getElementById('res-company-valuation').textContent = fmtEur(res.companyValuation);
    document.getElementById('res-val-multiplier').textContent = `Hệ số nhân hiện tại: ×${fmtDec(res.effectiveRoundMultiplier, 2)} lần Lãi ròng lũy kế`;
    document.getElementById('res-credit-rating').textContent = `${res.creditInfo.rating} (Lãi vay ${fmtDec(res.creditInfo.interestRate * 100, 2)}%)`;
    document.getElementById('res-credit-rating').style.color = res.creditInfo.color;
    document.getElementById('res-discount-rate').textContent = `Tổng mẫu số chiết khấu: ${fmtDec(res.discountRate * 100, 2)}%`;
    document.getElementById('res-debt-loading').textContent = fmtEur(res.debtLoading);
    document.getElementById('res-debt-loading').style.color = res.debtLoading >= 0 ? '#10b981' : '#f59e0b';
    document.getElementById('res-aaa-valuation').textContent = fmtEur(res.potentialAAAValuation);
    document.getElementById('res-lost-valuation').textContent = Math.abs(res.valuationLostToCreditRisk) > 1
      ? `Mất ${fmtEur(Math.abs(res.valuationLostToCreditRisk))} do chưa đạt AAA+`
      : 'Đang đạt đỉnh tín dụng AAA+ tối đa!';

    const advBox = document.getElementById('valuation-advisor-box');
    if (params.cash <= 20000) {
      advBox.className = 'alert-card danger';
      advBox.innerHTML = `
        <strong>🚨 CẢNH BÁO ĐỎ WEIZEN BANK:</strong> Số dư Tiền mặt (<code>113300 Bank Cash</code>) đang ở mức nguy hiểm (<strong>${fmtEur(params.cash)}</strong>)!
        Nếu tiền mặt âm (&lt; €0), Weizen Bank sẽ tự động cho vay thấu chi và hạ bậc Credit Rating. Tạm hoãn chạy <code>ME59N</code> 1–2 ngày để thu tiền khách hàng!
      `;
    } else if (res.creditInfo.penalizedByEsg) {
      advBox.className = 'alert-card warning';
      advBox.innerHTML = `
        <strong>⚠️ BỊ HẠ HẠNG TÍN DỤNG DO PHÁT THẢI CARBON CAO (ESG Gate — giống Team A ở R2!):</strong>
        <ul style="margin-left: 1.2rem; margin-top: 0.35rem; font-size: 0.83rem;">
          <li>Tài chính của bạn đủ chuẩn <strong>${res.creditInfo.financialRating}</strong> (Debt Loading = <strong>${fmtEur(res.debtLoading)}</strong>), NHƯNG chỉ số <code>CO₂e per Unit Sold = ${fmtDec(params.co2PerUnitSold, 2)} kg/hộp</code> (&gt; 4.25 kg/u) đang kéo hạng tín dụng xuống <strong>${res.creditInfo.rating}</strong> (mất trắng <strong style="color:#fb7185;">${fmtEur(Math.abs(res.valuationLostToCreditRisk))}</strong> Valuation)!</li>
          <li><strong>Cách kéo ngay về AAA+ (&le; 4.25 kg/hộp):</strong> Tắt sạch <code>Sales from SLoc 03</code>, gộp đơn PO lớn từ <code>V04/V08</code> và đẩy mạnh sản lượng bán để pha loãng lượng CO₂ cố định (2,000 kg/hiệp)!</li>
        </ul>
      `;
    } else if (res.creditInfo.rating === 'AAA+') {
      advBox.className = 'alert-card';
      advBox.innerHTML = `
        <strong>✅ Đỉnh Cao Kép Tài Chính + Xanh ESG (AAA+ • Lãi suất 6.00%):</strong> Debt Loading dương (<strong>${fmtEur(res.debtLoading)}</strong>) VÀ <code>CO₂e/hộp = ${fmtDec(params.co2PerUnitSold, 2)} kg</code> (&le; 4.25 kg/u)!
        Mẫu số chiết khấu đang ở đáy <strong>10.00%</strong> (nhân <strong>×${fmtDec(res.effectiveRoundMultiplier, 2)}</strong> lần Lãi ròng!). Ở Ngày 8–10 Hiệp Cuối, nhớ ngừng chạy <code>ME59N</code> và không bao giờ hạ giá dưới giá vốn!
      `;
    } else {
      const next = res.creditInfo.nextBetter;
      advBox.className = 'alert-card warning';
      advBox.innerHTML = `
        <strong>⚠️ Cảnh Báo Đòn Bẩy Nợ Ngắn Hạn (AP / Loans):</strong>
        <ul style="margin-left: 1.2rem; margin-top: 0.35rem; font-size: 0.83rem;">
          <li>Chỉ cần thu thêm tiền bán hàng (hoặc giảm Phải trả NCC <code>160000 AP</code>) <strong>${fmtEur(res.creditInfo.amountToNextTier)}</strong>, bạn sẽ nhảy lên hạng <strong>${next.rating}</strong> và tăng Định giá thêm <strong style="color:#34d399;">+${fmtEur(res.nextTierValuationGain)}</strong>!</li>
          <li>Ở Ngày 8–10 của Hiệp Cuối, hãy <strong>ngừng chạy <code>ME59N</code></strong> để đẩy Debt Loading về <strong>&ge; €0 (AAA+)</strong>!</li>
        </ul>
      `;
    }

    const tbody = document.getElementById('credit-tier-tbody');
    tbody.innerHTML = ERPsimEngine.CREDIT_RATING_TABLE.map(tier => {
      const isCurrent = tier.rating === res.creditInfo.rating;
      const totDisc = params.marketRiskRate + tier.riskRate;
      const mult = 1 / totDisc;
      const valAtTier = res.numerator / totDisc;
      const minStr = tier.minDebtLoading === -Infinity ? '< -€950,000' : `≥ ${fmtEur(tier.minDebtLoading)}`;
      return `
        <tr class="${isCurrent ? 'active-tier' : ''}">
          <td>#${tier.tierIndex}</td>
          <td>${minStr}</td>
          <td style="color:${tier.color}; font-weight:700;">${tier.rating} (${fmtDec(tier.interestRate * 100, 2)}%) ${isCurrent ? '◀ HIỆN TẠI' : ''}</td>
          <td>+${fmtDec(tier.riskRate * 100, 2)}%</td>
          <td>${fmtDec(totDisc * 100, 2)}%</td>
          <td>×${fmtDec(mult, 2)}</td>
          <td>${fmtEur(valAtTier)}</td>
        </tr>
      `;
    }).join('');
  }

  valInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateValuationModule);
      el.addEventListener('change', updateValuationModule);
    }
  });

  const btnTeamER2 = document.getElementById('btn-load-team-e-r2');
  if (btnTeamER2) {
    btnTeamER2.addEventListener('click', () => {
      document.getElementById('val-profit').value = 21314.85;
      document.getElementById('val-elapsed').value = 20;
      document.getElementById('val-co2-unit').value = 3.48;
      document.getElementById('val-use-esg').checked = true;
      document.getElementById('val-cash').value = 310000;
      document.getElementById('val-ar').value = 46000;
      document.getElementById('val-loans').value = 0;
      document.getElementById('val-ap').value = 0;
      document.getElementById('val-inventory').value = 95000;
      updateValuationModule();
    });
  }

  document.getElementById('btn-load-start-demo').addEventListener('click', () => {
    document.getElementById('val-profit').value = 21893.68;
    document.getElementById('val-elapsed').value = 10;
    document.getElementById('val-co2-unit').value = 3.39;
    document.getElementById('val-use-esg').checked = true;
    document.getElementById('val-cash').value = 225000;
    document.getElementById('val-ar').value = 65000;
    document.getElementById('val-loans').value = 0;
    document.getElementById('val-ap').value = 32000;
    document.getElementById('val-inventory').value = 115000;
    updateValuationModule();
  });

  document.getElementById('btn-load-endgame-demo').addEventListener('click', () => {
    document.getElementById('val-profit').value = 26285.56;
    document.getElementById('val-elapsed').value = 20;
    document.getElementById('val-co2-unit').value = 5.39;
    document.getElementById('val-use-esg').checked = true;
    document.getElementById('val-cash').value = 185000;
    document.getElementById('val-ar').value = 42000;
    document.getElementById('val-loans').value = 0;
    document.getElementById('val-ap').value = 35000;
    document.getElementById('val-inventory').value = 120000;
    updateValuationModule();
  });

  // =========================================================================
  // UNIVERSAL SAP FIORI REPORT PARSER (ZMB52 / ZVC2 / ZVA05 / ZME2N)
  // Handles grouped blank cells (Round, Day, Location, Area, Status) cleanly!
  // =========================================================================
  const SAMPLE_SAP_PASTE = [
    'Round\tDay\tArea\tLocation\tD. Channel\tMaterial\tDescription\tNet Price\tQuantity\tNet Value\tCost',
    '01\t04\tNO\t03N\t16\tEE-T01\tMilk\t28.10\t55\t1,545.50\t1,262.25',
    '\t\tSO\t03S\t16\tEE-T01\tMilk\t28.10\t32\t899.20\t734.40',
    '\t\tWE\t03W\t16\tEE-T01\tMilk\t28.10\t35\t983.50\t803.25',
    '01\t05\tNO\t03N\t16\tEE-T01\tMilk\t28.10\t58\t1,629.80\t1,331.10',
    '\t\tSO\t03S\t16\tEE-T01\tMilk\t28.10\t34\t955.40\t780.30',
    '\t\tWE\t03W\t16\tEE-T01\tMilk\t28.10\t36\t1,011.60\t826.20',
    '\t\tNO\t03N\t16\tEE-T02\tCream\t87.40\t12\t1,048.80\t864.84',
    '\t\tSO\t03S\t16\tEE-T02\tCream\t87.40\t22\t1,922.80\t1,585.54',
    '\t\tWE\t03W\t16\tEE-T02\tCream\t87.40\t10\t874.00\t720.70',
    '\t\tNO\t03N\t16\tEE-T03\tYoghurt\t31.55\t30\t946.50\t775.50',
    '\t\tSO\t03S\t16\tEE-T03\tYoghurt\t31.55\t38\t1,198.90\t982.30',
    '\t\tWE\t03W\t16\tEE-T03\tYoghurt\t31.55\t24\t757.20\t620.40',
    '\t\tNO\t03N\t16\tEE-T04\tCheese\t100.50\t22\t2,211.00\t1,818.96',
    '\t\tSO\t03S\t16\tEE-T04\tCheese\t100.50\t14\t1,407.00\t1,157.52',
    '\t\tWE\t03W\t16\tEE-T04\tCheese\t100.50\t16\t1,608.00\t1,322.88',
    '\t\tNO\t03N\t16\tEE-T05\tButter\t72.40\t16\t1,158.40\t958.08',
    '\t\tSO\t03S\t16\tEE-T05\tButter\t72.40\t18\t1,303.20\t1,077.84',
    '\t\tWE\t03W\t16\tEE-T05\tButter\t72.40\t22\t1,592.80\t1,317.36',
    '\t\tNO\t03N\t16\tEE-T06\tIce Cream\t52.25\t12\t627.00\t517.80',
    '\t\tSO\t03S\t16\tEE-T06\tIce Cream\t52.25\t20\t1,045.00\t863.00',
    '\t\tWE\t03W\t16\tEE-T06\tIce Cream\t52.25\t14\t731.50\t604.10'
  ].join('\n');

  function parseAndSyncAnySapReport(rawText, statusEl) {
    const parsed = ERPsimEngine.parseSapTableText(rawText);
    const headersUpper = (parsed.headers || []).map(h => h.toUpperCase());
    let isZmb52Only = headersUpper.includes('STOCK') && (headersUpper.includes('SLOC') || headersUpper.includes('LOCATION') || headersUpper.includes('RESERVED')) && !headersUpper.includes('PRICE') && !headersUpper.includes('NET PRICE') && !headersUpper.includes('NET VALUE');
    const isZme2nOnly = headersUpper.includes('STATUS') && (headersUpper.includes('RECEPTION') || headersUpper.includes('VENDOR'));

    const dairyAgg = {};
    const globalDaysSet = new Set();
    let matchedRows = 0;

    // Carry-forward state for SAP Fiori grouped cells (where repeated Round/Day/Location/Area/Status cells are blank!)
    let carryRound = '01';
    let carryDay = '';
    let carryLocation = '';
    let carryArea = '';
    let carryStatus = '';

    if (parsed.records && parsed.records.length > 0) {
      parsed.records.forEach(rec => {
        const rawRound = (rec.Rnd || rec.Round || '').trim();
        const rawDay = (rec.Day || '').trim();
        const rawLoc = (rec.Location || rec.SLoc || rec.Sloc || '').trim().toUpperCase();
        const rawArea = (rec.Area || rec.Region || '').trim().toUpperCase();
        const rawStatus = (rec.Status || '').trim().toUpperCase();

        if (rawRound) carryRound = rawRound;
        if (rawDay) carryDay = rawDay;
        if (rawLoc) carryLocation = rawLoc;
        if (rawArea) carryArea = rawArea;
        if (rawStatus) carryStatus = rawStatus;

        const rawSku = (rec.Material || rec.MATERIAL || rec.SKU || '').trim();
        const dairyMatch = rawSku.match(/T0[1-6]$/i);
        if (!dairyMatch) return;

        const dCode = dairyMatch[0].toUpperCase();
        if (!dairyAgg[dCode]) {
          dairyAgg[dCode] = {
            NO: 0, SO: 0, WE: 0,
            totalQty: 0, totalNetVal: 0,
            stockSum: 0, loc03: 0, loc03N: 0, loc03S: 0, loc03W: 0, hasLoc: false,
            openPoSum: 0,
            lastPrice: null, lastInv: null,
            daysSet: new Set()
          };
        }

        if (carryDay) {
          const dayKey = `${carryRound}_${carryDay}`;
          dairyAgg[dCode].daysSet.add(dayKey);
          globalDaysSet.add(dayKey);
        }

        if (isZmb52Only) {
          const stQty = ERPsimEngine.parseSapNumber(rec.Stock || rec.STOCK || rec.Qty) || 0;
          dairyAgg[dCode].stockSum += stQty;
          if (carryLocation) {
            dairyAgg[dCode].hasLoc = true;
            if (carryLocation === '03N') dairyAgg[dCode].loc03N += stQty;
            else if (carryLocation === '03S') dairyAgg[dCode].loc03S += stQty;
            else if (carryLocation === '03W') dairyAgg[dCode].loc03W += stQty;
            else dairyAgg[dCode].loc03 += stQty;
          }
        } else if (isZme2nOnly) {
          if (!carryStatus.includes('DELIVERED')) {
            const poQty = ERPsimEngine.parseSapNumber(rec.Quantity || rec.Qty) || 0;
            dairyAgg[dCode].openPoSum += poQty;
          }
        } else {
          const qty = ERPsimEngine.parseSapNumber(rec.Qty || rec.Quantity) || 0;
          const netVal = ERPsimEngine.parseSapNumber(rec['Net Value'] || rec.Value) || 0;
          const effArea = carryArea || carryLocation;

          if (effArea.includes('N')) dairyAgg[dCode].NO += qty;
          else if (effArea.includes('S')) dairyAgg[dCode].SO += qty;
          else if (effArea.includes('W')) dairyAgg[dCode].WE += qty;

          dairyAgg[dCode].totalQty += qty;
          if (netVal > 0) dairyAgg[dCode].totalNetVal += netVal;

          const rawPrice = (rec['Net Price'] !== undefined && rec['Net Price'] !== '') ? rec['Net Price'] : rec.Price;
          if (rawPrice !== undefined && rawPrice !== '') {
            const parsedP = ERPsimEngine.parseSapNumber(rawPrice);
            if (Number.isFinite(parsedP) && parsedP > 0) dairyAgg[dCode].lastPrice = parsedP;
          }
          if (rec.Inventory !== undefined && rec.Inventory !== '') {
            const parsedInv = ERPsimEngine.parseSapNumber(rec.Inventory);
            if (Number.isFinite(parsedInv)) dairyAgg[dCode].lastInv = parsedInv;
          }
        }
        matchedRows++;
      });
    }

    // Fallback: Raw SAP Fiori Ctrl+A / drag-select extractor for ZMB52 Inventory Report (even without headers or with newlines per cell!)
    if (matchedRows === 0 && rawText && rawText.trim()) {
      const tokenRegex = /(?:^(03[NSW]?)\b)|([A-Z0-9]{1,3}-(T0[1-6])[\s\t|]+(?:Milk|Cream|Yoghurt|Cheese|Butter|Ice\s*Cream)[\s\t|]+([0-9.,]+))/gim;
      let m;
      let curLoc = '03';
      while ((m = tokenRegex.exec(rawText)) !== null) {
        if (m[1]) {
          curLoc = m[1].toUpperCase();
        } else if (m[3]) {
          const dCode = m[3].toUpperCase();
          const stQty = ERPsimEngine.parseSapNumber(m[4]) || 0;
          if (!dairyAgg[dCode]) {
            dairyAgg[dCode] = {
              NO: 0, SO: 0, WE: 0, totalQty: 0, totalNetVal: 0,
              stockSum: 0, loc03: 0, loc03N: 0, loc03S: 0, loc03W: 0, hasLoc: true,
              openPoSum: 0, lastPrice: null, lastInv: null, daysSet: new Set()
            };
          }
          dairyAgg[dCode].stockSum += stQty;
          dairyAgg[dCode].hasLoc = true;
          if (curLoc === '03N') dairyAgg[dCode].loc03N += stQty;
          else if (curLoc === '03S') dairyAgg[dCode].loc03S += stQty;
          else if (curLoc === '03W') dairyAgg[dCode].loc03W += stQty;
          else dairyAgg[dCode].loc03 += stQty;
          matchedRows++;
        }
      }
      if (matchedRows > 0) {
        isZmb52Only = true;
      }
    }

    if (matchedRows === 0) {
      if (statusEl) {
        statusEl.style.color = '#fb7185';
        statusEl.textContent = 'Không tìm thấy dòng dữ liệu T01..T06 hợp lệ. Hãy bấm Ctrl+A, Ctrl+C ngay trên màn hình bảng SAP Fiori (hoặc nút Xuất bảng góc trên phải) rồi dán vào đây.';
      }
      return;
    }

    const totalObservedDays = Math.max(1, globalDaysSet.size);

    Object.keys(dairyAgg).forEach(code => {
      const agg = dairyAgg[code];
      const st = skuInventoryState[code];
      if (!st) return;

      if (isZmb52Only) {
        st.physicalStock = agg.stockSum;
        st.currentStockAndOpenPo = st.physicalStock + (st.openPoQty || 0);
        if (agg.hasLoc) {
          st.hasLocBreakdown = true;
          st.loc03 = agg.loc03;
          st.loc03N = agg.loc03N;
          st.loc03S = agg.loc03S;
          st.loc03W = agg.loc03W;
        }
      } else if (isZme2nOnly) {
        // Idempotent Open PO sync: never double-counts if ZME2N is pasted multiple times!
        st.openPoQty = agg.openPoSum;
        st.currentStockAndOpenPo = (st.physicalStock !== undefined ? st.physicalStock : st.currentStockAndOpenPo) + st.openPoQty;
      } else {
        if (agg.NO + agg.SO + agg.WE > 0) {
          st.salesNO = agg.NO;
          st.salesSO = agg.SO;
          st.salesWE = agg.WE;
        }
        const daysCount = Math.max(totalObservedDays, agg.daysSet.size, 1);
        if (agg.totalQty > 0) {
          st.dailySalesRate = Math.max(5, Math.round(agg.totalQty / daysCount));
        }
        if (agg.lastPrice === null && agg.totalQty > 0 && agg.totalNetVal > 0) {
          agg.lastPrice = Number((agg.totalNetVal / agg.totalQty).toFixed(2));
        }
        if (agg.lastInv !== null) {
          st.physicalStock = agg.lastInv;
          st.currentStockAndOpenPo = agg.lastInv + (st.openPoQty || 0);
        }
      }

      const pIdx = dairyPricingState.findIndex(r => r.skuCode === code);
      if (pIdx >= 0) {
        if (agg.lastPrice) {
          dairyPricingState[pIdx].prevPrice = dairyPricingState[pIdx].currPrice;
          dairyPricingState[pIdx].currPrice = agg.lastPrice;
        }
        if (st.dailySalesRate > 0) {
          dairyPricingState[pIdx].prevQty = dairyPricingState[pIdx].currQty;
          dairyPricingState[pIdx].currQty = st.dailySalesRate;
        }
        dairyPricingState[pIdx].inventoryRemaining = st.currentStockAndOpenPo;
      }
    });

    updateLogisticsPreset3Module();
    const reportType = isZmb52Only
      ? 'ZMB52 (Tồn kho chi tiết 03 / 03N / 03S / 03W)'
      : (isZme2nOnly ? 'ZME2N (Đơn PO đang trên đường về — chống cộng trùng)' : `ZVA05 / ZVC2 (${totalObservedDays} ngày bán & Tỷ lệ 3 miền)`);
    if (statusEl) {
      statusEl.style.color = '#34d399';
      statusEl.textContent = `✅ Đã đồng bộ ${reportType} (${matchedRows} dòng) → Đã tính mới Con Số MD61, Bảng ZMB1B (6×3) & Giá VK32!`;
    }
  }

  document.getElementById('btn-load-sample-tsv').addEventListener('click', () => {
    document.getElementById('sap-raw-paste').value = SAMPLE_SAP_PASTE;
  });
  document.getElementById('btn-parse-sap-paste').addEventListener('click', () => {
    parseAndSyncAnySapReport(document.getElementById('sap-raw-paste').value, document.getElementById('sap-parse-status'));
  });
  document.getElementById('btn-tab1-sample-paste').addEventListener('click', () => {
    document.getElementById('tab1-raw-paste').value = SAMPLE_SAP_PASTE;
  });
  document.getElementById('btn-tab1-apply-paste').addEventListener('click', () => {
    parseAndSyncAnySapReport(document.getElementById('tab1-raw-paste').value, document.getElementById('tab1-paste-status'));
  });

  document.getElementById('btn-test-odata').addEventListener('click', async () => {
    const url = document.getElementById('odata-url').value.trim();
    const user = document.getElementById('odata-user').value.trim();
    const pass = document.getElementById('odata-pass').value;
    const statusBox = document.getElementById('odata-status-box');

    if (!url) {
      statusBox.textContent = 'Vui lòng nhập SAP OData Service Base URL trước khi đồng bộ.';
      return;
    }

    statusBox.textContent = 'Đang kết nối tới cổng SAP OData qua Local Proxy (/api/odata-proxy)...';
    try {
      const resp = await fetch('/api/odata-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, user, pass })
      });
      const data = await resp.json();
      if (resp.ok && data.ok) {
        statusBox.textContent = `Kết nối SAP S/4HANA ZODATA thành công (${data.bytes} bytes). Đang đồng bộ dữ liệu Dairy (T01..T06)...`;
        try {
          const jsonPayload = JSON.parse(data.raw);
          const records = (jsonPayload.d && jsonPayload.d.results) || jsonPayload.value || [];
          if (Array.isArray(records) && records.length > 0) {
            let synced = 0;
            records.forEach(item => {
              const rawSku = item.Material || item.MATERIAL || item.SKU || '';
              const match = String(rawSku).match(/T0[1-6]$/i);
              if (match) {
                const code = match[0].toUpperCase();
                const idx = dairyPricingState.findIndex(p => p.skuCode === code);
                if (idx >= 0) {
                  if (item.Net_Price || item.Price) dairyPricingState[idx].currPrice = Number(item.Net_Price || item.Price);
                  if (item.Quantity || item.Quantity_Sold) dairyPricingState[idx].currQty = Number(item.Quantity || item.Quantity_Sold);
                  if (item.Current_Inventory !== undefined) {
                    dairyPricingState[idx].inventoryRemaining = Number(item.Current_Inventory);
                    skuInventoryState[code].physicalStock = Number(item.Current_Inventory);
                    skuInventoryState[code].currentStockAndOpenPo = Number(item.Current_Inventory) + (skuInventoryState[code].openPoQty || 0);
                  }
                  synced++;
                }
              }
            });
            updateLogisticsPreset3Module();
            statusBox.textContent = `Đồng bộ trực tiếp S/4HANA OData hoàn tất! Đã cập nhật ${synced} bản ghi Dairy từ feed (${records.length} dòng).`;
          }
        } catch (_) {
          // XML or metadata feed
        }
      } else {
        statusBox.textContent = `Phản hồi từ Proxy: ${data.error || 'Không thể kết nối tới máy chủ SAP OData.'}`;
      }
    } catch (err) {
      statusBox.textContent = `Lưu ý: Để gọi trực tiếp OData không bị trình duyệt chặn CORS, hãy khởi chạy bằng lệnh "python server.py" tại thư mục dự án (Chi tiết: ${err.message}).`;
    }
  });

  // Initial render of all Preset 3 modules
  updateLogisticsPreset3Module();
  updateValuationModule();
});
