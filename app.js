/**
 * UI Controller for ERPsim Logistics Sustainability (Preset 3) Command Center
 * 100% Dedicated to Preset 3 Dairy (T01..T06, V04 vs V08, MD61 Target, ZMB1B, VK32 DC 16, & 8 Disruptors)
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
  const skuInventoryState = {
    T01: { dailySalesRate: 220, currentStockAndOpenPo: 500, desiredOrderQty: 600, salesNO: 380, salesSO: 310, salesWE: 310 },
    T02: { dailySalesRate: 90,  currentStockAndOpenPo: 150, desiredOrderQty: 300, salesNO: 110, salesSO: 140, salesWE: 100 },
    T03: { dailySalesRate: 170, currentStockAndOpenPo: 350, desiredOrderQty: 500, salesNO: 250, salesSO: 290, salesWE: 220 },
    T04: { dailySalesRate: 110, currentStockAndOpenPo: 180, desiredOrderQty: 420, salesNO: 190, salesSO: 130, salesWE: 150 },
    T05: { dailySalesRate: 110, currentStockAndOpenPo: 200, desiredOrderQty: 380, salesNO: 150, salesSO: 160, salesWE: 190 },
    T06: { dailySalesRate: 90,  currentStockAndOpenPo: 150, desiredOrderQty: 300, salesNO: 120, salesSO: 170, salesWE: 130 }
  };

  let dairyPricingState = [
    { skuCode: 'T01', landedCogs: 23.68, prevPrice: 25.25, prevQty: 360, currPrice: 28.10, currQty: 315, inventoryRemaining: 500 },
    { skuCode: 'T02', landedCogs: 72.80, prevPrice: 79.78, prevQty: 120, currPrice: 87.50, currQty: 105, inventoryRemaining: 150 },
    { skuCode: 'T03', landedCogs: 26.58, prevPrice: 28.43, prevQty: 270, currPrice: 31.80, currQty: 235, inventoryRemaining: 350 },
    { skuCode: 'T04', landedCogs: 83.41, prevPrice: 90.95, prevQty: 140, currPrice: 102.50, currQty: 125, inventoryRemaining: 0   },
    { skuCode: 'T05', landedCogs: 60.61, prevPrice: 65.87, prevQty: 155, currPrice: 73.80, currQty: 138, inventoryRemaining: 200 },
    { skuCode: 'T06', landedCogs: 43.88, prevPrice: 47.47, prevQty: 125, currPrice: 53.20, currQty: 112, inventoryRemaining: 150 }
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
    const capWarehouse4000 = document.getElementById('log-cap-4000').checked;
    const capCashSafety = document.getElementById('log-cap-cash').checked;
    const availableCash = Math.max(0, numVal('log-available-cash', 250000));
    const zmb1bMode = document.getElementById('log-zmb1b-mode').value || 'PULL';
    const dayInRound = Math.max(1, numVal('log-day-in-round', 5));
    const isFinalRound = document.getElementById('log-is-final-round').checked;
    const autoSyncTotals = document.getElementById('log-auto-sync-totals').checked;
    const coverageDays = Math.max(0, numVal('log-coverage-days', 5));

    // Pre-sync Total Stock from the 6 SKUs when auto-sync is enabled
    if (autoSyncTotals) {
      const sumStock = Object.values(skuInventoryState).reduce((acc, st) => acc + (Number(st.currentStockAndOpenPo) || 0), 0);
      document.getElementById('log-total-stock').value = sumStock;
    }

    let res = ERPsimEngine.solveLogisticsSustainabilityPreset3({
      roundNumber: currentRoundNumber,
      dayInRound,
      isFinalRound,
      baseCarbonTax: numVal('log-base-tax', 0.10),
      orderLotSizePerPo: Math.max(50, numVal('log-po-lot', 1800)),
      totalWarehouseUnits: numVal('log-total-stock', 1530),
      coverageDays,
      autoOrderCalc,
      capWarehouse4000,
      availableCash,
      capCashSafety,
      zmb1bMode,
      transfersPerDay: numVal('log-transfers-day', 0),
      regionalSalesOrdersPerDay: numVal('log-reg-orders', 0),
      directSalesOrdersPerDay: numVal('log-dir-orders', 0),
      coldSpellActive: coldActive,
      coldSpellCombo: document.getElementById('dis-1-combo').value,
      carbonDecreeActive: carbonActive,
      supplierDisruptionActive: supplierActive,
      impactedSupplier: document.getElementById('dis-3-vendor').value,
      hubGridlockActive: gridlockActive,
      flashFloodActive: floodActive,
      flashFloodWarehouse: floodWh,
      skuInventoryState
    });

    // If autoSyncTotals is ON and totalNewOrderUnits > 0, sync #log-po-lot and re-solve once for exact PO fee amortization
    if (autoSyncTotals && res.totalNewOrderUnits >= 50 && Math.abs(numVal('log-po-lot', 1800) - res.totalNewOrderUnits) > 5) {
      document.getElementById('log-po-lot').value = res.totalNewOrderUnits;
      res = ERPsimEngine.solveLogisticsSustainabilityPreset3({
        roundNumber: currentRoundNumber,
        dayInRound,
        isFinalRound,
        baseCarbonTax: numVal('log-base-tax', 0.10),
        orderLotSizePerPo: Math.max(50, res.totalNewOrderUnits),
        totalWarehouseUnits: numVal('log-total-stock', 1530),
        coverageDays,
        autoOrderCalc,
        capWarehouse4000,
        availableCash,
        capCashSafety,
        zmb1bMode,
        transfersPerDay: numVal('log-transfers-day', 0),
        regionalSalesOrdersPerDay: numVal('log-reg-orders', 0),
        directSalesOrdersPerDay: numVal('log-dir-orders', 0),
        coldSpellActive: coldActive,
        coldSpellCombo: document.getElementById('dis-1-combo').value,
        carbonDecreeActive: carbonActive,
        supplierDisruptionActive: supplierActive,
        impactedSupplier: document.getElementById('dis-3-vendor').value,
        hubGridlockActive: gridlockActive,
        flashFloodActive: floodActive,
        flashFloodWarehouse: floodWh,
        skuInventoryState
      });
    }

    lastSolvedAnalysis = res.skuAnalysis;

    // Live ZMB1B recommendation banner
    const zmb1bRecEl = document.getElementById('zmb1b-live-recommendation');
    if (zmb1bRecEl) {
      const use03Html = res.recommendedUse03
        ? '<strong style="color:#fbbf24;">TẠM TÍCH Use 03 (Chỉ duy nhất Ngày 1 Hiệp 1)</strong>'
        : '<strong style="color:#34d399;">BỎ TÍCH Sales from Sloc 3 / Use 03</strong>';
      zmb1bRecEl.innerHTML = `Khuyến nghị <code>ZMB1B</code>: Chế độ <strong>${zmb1bMode}</strong> • Chu kỳ <strong>${res.recommendedZmb1bFreqDays} ngày/lần</strong> • ${use03Html} ${res.isEndgameLiquidation ? '• <strong style="color:#fb7185;">🚨 ĐANG Ở 3 NGÀY CUỐI TRẬN: Đã tự động khóa Lượng Đặt Thêm = 0 để xả kho lên AAA+!</strong>' : ''}`;
    }

    // Update Top Telemetry Bar
    document.getElementById('top-md61-cap').textContent = `${res.totalMd61TargetUnits.toLocaleString('en-US')} / 4,000 u`;
    document.getElementById('top-md61-cap').style.color = res.totalMd61TargetUnits > 4000 ? '#fb7185' : '#60a5fa';
    document.getElementById('top-carbon-tax').textContent = `€${fmtDec(res.effectiveCarbonTax, 2)} / kg CO₂e`;

    // Update KPI cards
    document.getElementById('log-eff-tax').textContent = `€${fmtDec(res.effectiveCarbonTax, 2)} / kg CO₂e`;
    document.getElementById('log-overstock-fee').textContent = `${fmtEur(res.overstockFeePerDay)} / ngày`;
    document.getElementById('log-overstock-fee').style.color = res.overstockFeePerDay > 0 ? '#f43f5e' : '#10b981';
    document.getElementById('log-overstock-co2').textContent = `Vượt ${res.excessUnits.toLocaleString('en-US')} units (+${res.overstockCo2PerDay} kg CO₂e/ngày)`;
    document.getElementById('log-daily-total-cost').textContent = `${fmtEur(res.dailyCarbonTaxEur + res.dailyTransportAndStorageFeesEur)} / ngày`;
    document.getElementById('log-daily-co2-sub').textContent = `Phát thải vận hành: ${res.dailyLogisticsCo2.toLocaleString('en-US')} kg CO₂e/ngày (Thuế: ${fmtEur(res.dailyCarbonTaxEur)})`;
    document.getElementById('log-direct-loss').textContent = `-€${fmtDec(res.lossPerDirectSaleOrder, 2)} / đơn`;

    // Sync landed COGS, daily sales & inventory into Tab 2 Dairy Pricing State
    res.skuAnalysis.forEach(s => {
      const pRow = dairyPricingState.find(r => r.skuCode === s.code);
      if (pRow) {
        pRow.landedCogs = s.minLandedCost;
        pRow.inventoryRemaining = s.currentStockAndOpenPo;
        pRow.currQty = s.dailySalesRate;
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
    if (coldActive) activeAlerts.push(`<li><strong>[Event 1 - Cold Spell]:</strong> Đã tự động cộng +5.0 kg CO₂e/unit vào 2 sản phẩm bị ảnh hưởng và tính lại cột <strong>GIÁ TỐI ƯU VK32 (DC 16)</strong> bên dưới. Phạt Carbon vượt kho giảm còn 200 kg/container!</li>`);
    if (carbonActive) activeAlerts.push(`<li><strong>[Event 2 - Carbon Decree]:</strong> Thuế suất Carbon đã cộng thêm +€0.20/kg (lên <strong>€${fmtDec(res.effectiveCarbonTax, 2)}/kg</strong>). Hãy cập nhật ngay giá VK32 mới theo bảng dưới!</li>`);
    if (supplierActive) activeAlerts.push(`<li><strong>[Event 3 - Supplier Disruption (${document.getElementById('dis-3-vendor').value})]:</strong> Đã cộng +2.50 kg/unit &amp; +200 kg/PO vào ${document.getElementById('dis-3-vendor').value}. Kiểm tra cột <strong>CHỌN NCC (ZME12)</strong> bên dưới!</li>`);
    if (gridlockActive) activeAlerts.push(`<li><strong>[Event 4 - Hub Gridlock]:</strong> Bán từ Kho tổng 03 hiện mất tới <strong>-€${fmtDec(res.lossPerDirectSaleOrder, 2)}/đơn</strong>! Bắt buộc bỏ tích <code>Sales from Sloc 3 / Use 03</code> và giãn chu kỳ <code>ZMB1B</code> ra 3–4 ngày/lần!</li>`);
    if (glitchActive) activeAlerts.push(`<li><strong>[Event 5 - System Glitch]:</strong> Mở dữ liệu qua cổng <code>ZODATA</code> (miễn phí €0) hoặc vào <code>ZITM</code> chỉ mua lại duy nhất báo cáo <code>ZMB52</code> (€5,000).</li>`);
    if (breachActive) activeAlerts.push(`<li><strong>[Event 6 - Data Breach]:</strong> Mở ngay bảng OData <code>Current_Inventory</code> soi xem đối thủ đang đứt hàng (Stock = 0) ở mặt hàng nào/vùng nào → Dùng <code>ZMB1B</code> đẩy hàng vào đó và tăng giá <code>VK32</code> +12%!</li>`);
    if (floodActive) {
      if (floodWh === '03') {
        activeAlerts.push(`<li><strong>[Event 7 - Flash Flood trúng Kho Tổng 03]:</strong> 3 kho vùng (03N, 03S, 03W) vẫn còn hàng bán! Người 1 chạy ngay <code>MD61 → MD01 → ZME12 (V04) → ME59N</code> để 1–2 ngày sau hàng mới về lại kho 03!</li>`);
      } else {
        activeAlerts.push(`<li><strong>[Event 7 - Flash Flood trúng Kho Vùng ${floodWh}]:</strong> Người 2 vào ngay <code>ZMB1B</code> đẩy hàng từ Kho tổng 03 xuống cứu viện kho <strong>${floodWh}</strong>; Người 3 tăng giá <code>VK32</code> +12% vì các đối thủ cũng vừa mất trắng kho ${floodWh}!</li>`);
      }
    }
    if (aiActive) activeAlerts.push(`<li><strong>[Event 8 - AI Innovation]:</strong> Đã mở khóa T-code <code>ZRPA</code> hỗ trợ điền nhanh <code>MD61</code>. Với giá bán <code>VK32</code>, hãy ưu tiên áp dụng cột <strong>GIÁ TỐI ƯU VK32 (DC 16)</strong> bên dưới!</li>`);

    const alertBox = document.getElementById('active-disruptor-alerts');
    if (activeAlerts.length > 0) {
      alertBox.style.display = 'block';
      alertBox.className = 'alert-card warning';
      alertBox.innerHTML = `<strong>⚡ LỆNH PHẢN CÔNG KHẨN CẤP CHO SỰ KIỆN ĐANG DIỄN RA:</strong><ul style="margin-left:1.2rem;margin-top:0.35rem;font-size:0.82rem;">${activeAlerts.join('')}</ul>`;
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
            <input type="number" class="table-input log-inv-inp" data-sku="${s.code}" data-field="currentStockAndOpenPo" value="${s.currentStockAndOpenPo}" step="50" style="width:72px;" />
            ${autoOrderCalc && floodActive ? `<div style="font-size:0.66rem;color:#fb7185;">Sau lũ: ~${s.effectiveStock}</div>` : ''}
          </td>
          <td style="background:rgba(16,185,129,0.10);text-align:center;">
            ${orderCellHtml}
          </td>
          <td style="background:rgba(59,130,246,0.22);color:#93c5fd;font-weight:900;font-size:0.95rem;text-align:center;">
            ${s.md61TargetToEnter.toLocaleString('en-US')}
          </td>
          <td style="font-size:0.76rem;color:#cbd5e1;">
            03N:<strong>${s.zmb1bTargetNO}</strong> | 03S:<strong>${s.zmb1bTargetSO}</strong> | 03W:<strong>${s.zmb1bTargetWE}</strong>
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
        <strong>📊 Kiểm Tra Trần Kho MD61 &amp; Quỹ Tiền Mặt Weizen Bank (Trang 10, 16, 32 Participant's Guide):</strong><br/>
        • Tổng Mức Tồn Kho Mục Tiêu gõ vào <code>MD61</code>: <strong style="color:${overCap ? '#fb7185' : '#34d399'};font-size:0.95rem;">${res.totalMd61TargetUnits.toLocaleString('en-US')} / 4,000 units</strong>
        (${overCap ? `⚠️ Đang vượt trần ${res.totalMd61TargetUnits - 4000} units → Sẽ bị phạt €300 + 500kg CO₂e/1,000u khi hàng về!` : (res.wasCappedTo4000 ? '✅ Hệ thống đã tự động co tỷ lệ về ≤ 3,950 units để né phạt vượt kho 4,000u!' : '✅ Nằm an toàn trong trần 4,000 units miễn phí lưu kho!')})<br/>
        • Tổng Lượng Đặt Mua Mới (PO Qty): <strong>${res.totalNewOrderUnits.toLocaleString('en-US')} units</strong> &rarr; Tiền mặt cần thanh toán (sau 5 ngày với V04): <strong style="color:${cashWarning ? '#fb7185' : '#fbbf24'};">${fmtEur(res.totalPoCashNeeded)}</strong> / Tiền mặt hiện có: <strong>${fmtEur(availableCash)}</strong>
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

    // Also update Tab 2 tables so everything stays in sync
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

  // Quick MD61 Coverage Presets & 1-Click Round Buttons & Copy Buttons
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
      const dayInRound = Math.max(1, numVal('log-day-in-round', 5));
      const elapsedEl = document.getElementById('val-elapsed');
      if (elapsedEl) {
        elapsedEl.value = (currentRoundNumber - 1) * 10 + dayInRound;
        updateValuationModule();
      }
      updateLogisticsPreset3Module();
    });
  });

  document.getElementById('log-day-in-round').addEventListener('change', () => {
    const dayInRound = Math.max(1, numVal('log-day-in-round', 5));
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

  function showCopyToast(msg) {
    const el = document.getElementById('copy-toast-msg');
    if (!el) return;
    el.textContent = msg;
    setTimeout(() => { el.textContent = ''; }, 3000);
  }

  document.getElementById('btn-copy-md61').addEventListener('click', () => {
    const text = lastSolvedAnalysis.map(s => s.md61TargetToEnter).join('\n');
    navigator.clipboard.writeText(text).then(() => showCopyToast('✅ Đã copy 6 số MD61 (dán thẳng vào cột 2 MD61)!'));
  });

  document.getElementById('btn-copy-vk32').addEventListener('click', () => {
    const text = lastSolvedAnalysis.map(s => fmtDec(s.recommendedPriceDC16, 2)).join('\n');
    navigator.clipboard.writeText(text).then(() => showCopyToast('✅ Đã copy 6 giá bán tối ưu VK32 (DC 16)!'));
  });

  document.getElementById('btn-copy-zmb1b').addEventListener('click', () => {
    const text = lastSolvedAnalysis.map(s => `${s.code}\t${s.zmb1bTargetNO}\t${s.zmb1bTargetSO}\t${s.zmb1bTargetWE}`).join('\n');
    navigator.clipboard.writeText(text).then(() => showCopyToast('✅ Đã copy bảng phân bổ ZMB1B (03N / 03S / 03W)!'));
  });

  document.getElementById('btn-toggle-quick-paste').addEventListener('click', () => {
    const drawer = document.getElementById('tab1-quick-paste-drawer');
    if (drawer) {
      drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
    }
  });

  document.getElementById('btn-md61-preset-start').addEventListener('click', () => {
    document.getElementById('log-auto-order').checked = true;
    document.getElementById('log-cap-4000').checked = true;
    document.getElementById('log-cap-cash').checked = true;
    document.getElementById('log-coverage-days').value = 4;
    updateLogisticsPreset3Module();
  });
  document.getElementById('btn-md61-preset-normal').addEventListener('click', () => {
    document.getElementById('log-auto-order').checked = true;
    document.getElementById('log-cap-4000').checked = true;
    document.getElementById('log-coverage-days').value = 5;
    updateLogisticsPreset3Module();
  });
  document.getElementById('btn-md61-preset-endgame').addEventListener('click', () => {
    document.getElementById('log-auto-order').checked = true;
    document.getElementById('log-coverage-days').value = 0;
    updateLogisticsPreset3Module();
  });

  // =========================================================================
  // TAB 2: DAIRY DC 16 ELASTICITY & ZMB1B REGIONAL ALLOCATION
  // =========================================================================
  function renderDairyPricingTable() {
    const tbody = document.getElementById('pricing-solver-tbody');
    if (!tbody) return;

    let totalCurrProfit = 0;
    let totalOptProfit = 0;
    let stockoutCount = 0;

    tbody.innerHTML = dairyPricingState.map((row, idx) => {
      const solved = ERPsimEngine.solveDairyDc16Pricing(row);
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
          <td><input type="number" class="table-input dp-inp" data-idx="${idx}" data-field="prevQty" value="${row.prevQty}" step="20" /></td>
          <td><input type="number" class="table-input dp-inp" data-idx="${idx}" data-field="currPrice" value="${fmtDec(row.currPrice, 2)}" step="0.25" /></td>
          <td><input type="number" class="table-input dp-inp" data-idx="${idx}" data-field="currQty" value="${row.currQty}" step="20" /></td>
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
        <td style="background:rgba(16,185,129,0.14);color:#34d399;font-weight:800;font-size:0.95rem;">${s.zmb1bTargetNO} units</td>
        <td style="background:rgba(59,130,246,0.14);color:#60a5fa;font-weight:800;font-size:0.95rem;">${s.zmb1bTargetSO} units</td>
        <td style="background:rgba(245,158,11,0.14);color:#fbbf24;font-weight:800;font-size:0.95rem;">${s.zmb1bTargetWE} units</td>
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
  // TAB 3: COMPANY VALUATION (ZVAL) & WEIZEN BANK CREDIT RATING
  // =========================================================================
  const valInputs = [
    'val-profit', 'val-elapsed', 'val-rounds', 'val-steps-round',
    'val-mkt-risk', 'val-cash', 'val-ar', 'val-loans', 'val-ap', 'val-inventory'
  ];

  function updateValuationModule() {
    const params = {
      currentProfit: numVal('val-profit', 0),
      elapsedSteps: Math.max(1, numVal('val-elapsed', 1)),
      totalRounds: Math.max(1, numVal('val-rounds', 4)),
      stepsPerRound: Math.max(1, numVal('val-steps-round', 10)),
      marketRiskRate: numVal('val-mkt-risk', 7) / 100,
      cash: numVal('val-cash', 0),
      accountsReceivable: numVal('val-ar', 0),
      bankLoans: numVal('val-loans', 0),
      accountsPayable: numVal('val-ap', 0),
      inventoryValue: numVal('val-inventory', 0)
    };

    const res = ERPsimEngine.calculateCompanyValuation(params);

    document.getElementById('top-valuation').textContent = fmtEur(res.companyValuation);
    document.getElementById('top-credit').textContent = `${res.creditInfo.rating} (${fmtDec(res.creditInfo.riskRate * 100, 2)}%)`;
    document.getElementById('top-credit').style.color = res.creditInfo.color;

    document.getElementById('res-company-valuation').textContent = fmtEur(res.companyValuation);
    document.getElementById('res-val-multiplier').textContent = `Hệ số nhân: ×${fmtDec(res.valuationMultiplier, 2)} lần lợi nhuận năm`;
    document.getElementById('res-credit-rating').textContent = `${res.creditInfo.rating} (+${fmtDec(res.creditInfo.riskRate * 100, 2)}%)`;
    document.getElementById('res-credit-rating').style.color = res.creditInfo.color;
    document.getElementById('res-discount-rate').textContent = `Tổng mẫu số chiết khấu: ${fmtDec(res.discountRate * 100, 2)}%`;
    document.getElementById('res-debt-loading').textContent = fmtEur(res.debtLoading);
    document.getElementById('res-debt-loading').style.color = res.debtLoading >= 0 ? '#10b981' : '#f59e0b';
    document.getElementById('res-aaa-valuation').textContent = fmtEur(res.potentialAAAValuation);
    document.getElementById('res-lost-valuation').textContent = res.valuationLostToCreditRisk > 0
      ? `Mất ${fmtEur(res.valuationLostToCreditRisk)} do chưa đạt AAA+`
      : 'Đang đạt đỉnh tín dụng AAA+ tối đa!';

    const advBox = document.getElementById('valuation-advisor-box');
    if (params.cash <= 20000) {
      advBox.className = 'alert-card danger';
      advBox.innerHTML = `
        <strong>🚨 CẢNH BÁO ĐỎ WEIZEN BANK (Trang 10 Participant's Guide):</strong> Số dư Tiền mặt (<code>113300 Bank Cash</code>) của bạn đang ở mức nguy hiểm (<strong>${fmtEur(params.cash)}</strong>)!
        Nếu tiền mặt âm (&lt; €0), Weizen Bank sẽ tự động cho vay thấu chi nhưng <strong>lập tức hạ bậc Credit Rating và tăng lãi suất vay trong suốt phần còn lại của game</strong>! Hãy tạm hoãn chạy <code>ME59N</code> 1–2 ngày để chờ khách hàng thanh toán (4 ngày)!
      `;
    } else if (res.creditInfo.rating === 'AAA+') {
      advBox.className = 'alert-card';
      advBox.innerHTML = `
        <strong>✅ Trạng Thái Tín Dụng Hoàn Hảo (AAA+):</strong> Debt Loading dương (<strong>${fmtEur(res.debtLoading)}</strong>), Tiền mặt an toàn (<strong>${fmtEur(params.cash)}</strong>).
        Mẫu số chiết khấu đang ở mức thấp nhất (<strong>10.00%</strong> → Nhân <strong>10 lần</strong> lợi nhuận!). Lưu ý Trang 18: Cuối game hàng tồn kho chưa bán vẫn được định giá bằng giá mua trên P&amp;L, nên <strong>tuyệt đối không bán phá giá dưới giá vốn</strong>!
      `;
    } else {
      const next = res.creditInfo.nextBetter;
      advBox.className = 'alert-card warning';
      advBox.innerHTML = `
        <strong>⚠️ Cảnh Báo Đòn Bẩy Định Giá (ZVAL):</strong>
        <ul style="margin-left: 1.2rem; margin-top: 0.35rem; font-size: 0.83rem;">
          <li>Chỉ cần thu thêm tiền bán hàng (hoặc giảm Phải trả NCC <code>AP</code>) <strong>${fmtEur(res.creditInfo.amountToNextTier)}</strong>, bạn sẽ nhảy lên hạng <strong>${next.rating}</strong> và tăng Định giá Công ty thêm <strong style="color:#34d399;">+${fmtEur(res.nextTierValuationGain)}</strong>!</li>
          <li>Ở 3–4 ngày cuối của Round cuối cùng, hãy <strong>ngừng chạy <code>ME59N</code></strong> để không phát sinh thêm <code>Accounts Payable (AP)</code> và phí PO €1,000, giúp đẩy Debt Loading về <strong>≥ €0 (AAA+)</strong>!</li>
        </ul>
      `;
    }

    const tbody = document.getElementById('credit-tier-tbody');
    tbody.innerHTML = ERPsimEngine.CREDIT_RATING_TABLE.map(tier => {
      const isCurrent = tier.rating === res.creditInfo.rating;
      const totDisc = params.marketRiskRate + tier.riskRate;
      const mult = 1 / totDisc;
      const valAtTier = res.numerator / totDisc;
      const minStr = tier.minDebtLoading === -Infinity ? '≤ -€20,000,000' : `≥ ${fmtEur(tier.minDebtLoading)}`;
      return `
        <tr class="${isCurrent ? 'active-tier' : ''}">
          <td>#${tier.tierIndex}</td>
          <td>${minStr}</td>
          <td style="color:${tier.color}; font-weight:700;">${tier.rating} ${isCurrent ? '◀ HIỆN TẠI' : ''}</td>
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
    if (el) el.addEventListener('input', updateValuationModule);
  });

  document.getElementById('btn-load-start-demo').addEventListener('click', () => {
    document.getElementById('val-profit').value = 185000;
    document.getElementById('val-elapsed').value = 10;
    document.getElementById('val-cash').value = 250000;
    document.getElementById('val-ar').value = 180000;
    document.getElementById('val-loans').value = 0;
    document.getElementById('val-ap').value = 145000;
    document.getElementById('val-inventory').value = 138000;
    updateValuationModule();
  });

  document.getElementById('btn-load-endgame-demo').addEventListener('click', () => {
    document.getElementById('val-profit').value = 620000;
    document.getElementById('val-elapsed').value = 30;
    document.getElementById('val-cash').value = 110000;
    document.getElementById('val-ar').value = 240000;
    document.getElementById('val-loans').value = 1200000;
    document.getElementById('val-ap').value = 450000;
    document.getElementById('val-inventory').value = 195000;
    updateValuationModule();
  });

  // =========================================================================
  // UNIVERSAL SAP REPORT PARSER (ZMB52 / ZVC2 / ZVA05 / ZME2N) FOR TAB 1 & TAB 4
  // =========================================================================
  const SAMPLE_SAP_PASTE = [
    'Rnd\tDay\tArea\tMaterial\tDescription\tPrice\tQty\tInventory',
    '01\t04\tNO\tAA-T01\tMilk\t28.20\t85\t480',
    '01\t04\tSO\tAA-T01\tMilk\t28.20\t65\t480',
    '01\t04\tWE\tAA-T01\tMilk\t28.20\t70\t480',
    '01\t05\tNO\tAA-T01\tMilk\t28.20\t90\t480',
    '01\t05\tSO\tAA-T01\tMilk\t28.20\t70\t480',
    '01\t05\tWE\tAA-T01\tMilk\t28.20\t75\t480',
    '01\t05\tNO\tAA-T02\tCream\t87.50\t28\t140',
    '01\t05\tSO\tAA-T02\tCream\t87.50\t42\t140',
    '01\t05\tWE\tAA-T02\tCream\t87.50\t26\t140',
    '01\t05\tNO\tAA-T03\tYoghurt\t31.80\t58\t320',
    '01\t05\tSO\tAA-T03\tYoghurt\t31.80\t74\t320',
    '01\t05\tWE\tAA-T03\tYoghurt\t31.80\t50\t320',
    '01\t05\tNO\tAA-T04\tCheese\t103.00\t52\t95',
    '01\t05\tSO\tAA-T04\tCheese\t103.00\t30\t95',
    '01\t05\tWE\tAA-T04\tCheese\t103.00\t36\t95',
    '01\t05\tNO\tAA-T05\tButter\t74.00\t34\t190',
    '01\t05\tSO\tAA-T05\tButter\t74.00\t38\t190',
    '01\t05\tWE\tAA-T05\tButter\t74.00\t48\t190',
    '01\t05\tNO\tAA-T06\tIce Cream\t53.50\t26\t160',
    '01\t05\tSO\tAA-T06\tIce Cream\t53.50\t44\t160',
    '01\t05\tWE\tAA-T06\tIce Cream\t53.50\t30\t160'
  ].join('\n');

  function parseAndSyncAnySapReport(rawText, statusEl) {
    const parsed = ERPsimEngine.parseSapTableText(rawText);
    if (!parsed.records || parsed.records.length === 0) {
      if (statusEl) {
        statusEl.style.color = '#fb7185';
        statusEl.textContent = 'Không tìm thấy dòng dữ liệu hợp lệ. Hãy chắc chắn dòng đầu tiên là tiêu đề cột từ SAP.';
      }
      return;
    }

    const headersUpper = (parsed.headers || []).map(h => h.toUpperCase());
    const isZmb52Only = headersUpper.includes('SLOC') && headersUpper.includes('STOCK') && !headersUpper.includes('PRICE') && !headersUpper.includes('VALUE');
    const isZme2nOnly = headersUpper.includes('STATUS') && (headersUpper.includes('RECEPTION') || headersUpper.includes('VENDOR'));

    const dairyAgg = {};
    let matchedRows = 0;

    parsed.records.forEach(rec => {
      const rawSku = (rec.Material || rec.MATERIAL || rec.SKU || '').trim();
      const dairyMatch = rawSku.match(/T0[1-6]$/i);
      if (!dairyMatch) return;

      const dCode = dairyMatch[0].toUpperCase();
      if (!dairyAgg[dCode]) {
        dairyAgg[dCode] = { NO: 0, SO: 0, WE: 0, totalQty: 0, stockSum: 0, openPoSum: 0, lastPrice: null, lastInv: null, daysSet: new Set() };
      }

      const dayKey = `${rec.Rnd || rec.Round || '1'}_${rec.Day || '1'}`;
      if (rec.Day !== undefined && rec.Day !== '') {
        dairyAgg[dCode].daysSet.add(dayKey);
      }

      if (isZmb52Only) {
        const stQty = Number(String(rec.Stock || rec.Qty || '0').replace(/,/g, '')) || 0;
        dairyAgg[dCode].stockSum += stQty;
      } else if (isZme2nOnly) {
        const stStatus = String(rec.Status || '').toUpperCase();
        if (!stStatus.includes('DELIVERED')) {
          const poQty = Number(String(rec.Quantity || rec.Qty || '0').replace(/,/g, '')) || 0;
          dairyAgg[dCode].openPoSum += poQty;
        }
      } else {
        const qty = Number(String(rec.Qty || rec.Quantity || '0').replace(/,/g, '')) || 0;
        const area = (rec.Area || rec.Region || '').trim().toUpperCase();

        if (area.includes('N')) dairyAgg[dCode].NO += qty;
        else if (area.includes('S')) dairyAgg[dCode].SO += qty;
        else if (area.includes('W')) dairyAgg[dCode].WE += qty;

        dairyAgg[dCode].totalQty += qty;
        if (rec.Price !== undefined && rec.Price !== '') {
          dairyAgg[dCode].lastPrice = Number(String(rec.Price).replace(/,/g, ''));
        }
        if (rec.Inventory !== undefined && rec.Inventory !== '') {
          dairyAgg[dCode].lastInv = Number(String(rec.Inventory).replace(/,/g, ''));
        }
      }
      matchedRows++;
    });

    Object.keys(dairyAgg).forEach(code => {
      const agg = dairyAgg[code];
      if (!skuInventoryState[code]) return;

      if (isZmb52Only) {
        skuInventoryState[code].currentStockAndOpenPo = agg.stockSum;
      } else if (isZme2nOnly) {
        skuInventoryState[code].currentStockAndOpenPo += agg.openPoSum;
      } else {
        if (agg.NO > 0 || agg.SO > 0 || agg.WE > 0) {
          skuInventoryState[code].salesNO = agg.NO;
          skuInventoryState[code].salesSO = agg.SO;
          skuInventoryState[code].salesWE = agg.WE;
        }
        const numDays = Math.max(1, agg.daysSet.size);
        if (agg.totalQty > 0) {
          skuInventoryState[code].dailySalesRate = Math.round(agg.totalQty / numDays);
        }
        if (agg.lastInv !== null && Number.isFinite(agg.lastInv)) {
          skuInventoryState[code].currentStockAndOpenPo = agg.lastInv;
        }
      }

      const pIdx = dairyPricingState.findIndex(r => r.skuCode === code);
      if (pIdx >= 0) {
        if (agg.lastPrice) {
          dairyPricingState[pIdx].prevPrice = dairyPricingState[pIdx].currPrice;
          dairyPricingState[pIdx].currPrice = agg.lastPrice;
        }
        if (skuInventoryState[code].dailySalesRate > 0) {
          dairyPricingState[pIdx].prevQty = dairyPricingState[pIdx].currQty;
          dairyPricingState[pIdx].currQty = skuInventoryState[code].dailySalesRate;
        }
        dairyPricingState[pIdx].inventoryRemaining = skuInventoryState[code].currentStockAndOpenPo;
      }
    });

    updateLogisticsPreset3Module();
    const reportType = isZmb52Only ? 'ZMB52 (Tồn kho 4 kho)' : (isZme2nOnly ? 'ZME2N (Đơn PO đang về)' : 'ZVA05 / ZVC2 (Doanh số & Tỷ lệ vùng)');
    if (statusEl) {
      statusEl.style.color = '#34d399';
      statusEl.textContent = `✅ Đã nhận diện ${reportType} (${matchedRows} dòng) và tự động tính lại Lượng Đặt Thêm, Con Số MD61, ZMB1B & Giá VK32!`;
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
                    skuInventoryState[code].currentStockAndOpenPo = Number(item.Current_Inventory);
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
