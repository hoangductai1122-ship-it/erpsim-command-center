/**
 * UI Controller for ERPsim Reverse-Engineering Command Center
 */

document.addEventListener('DOMContentLoaded', () => {
  // Format helpers
  const fmtEur = (n) => {
    const sign = n < 0 ? '-' : '';
    return sign + '€' + Math.round(Math.abs(n)).toLocaleString('en-US');
  };
  const fmtDec = (n, d = 2) => Number(n).toFixed(d);

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
  // MODULE 1: COMPANY VALUATION & 21-TIER CREDIT RATING
  // =========================================================================
  const valInputs = [
    'val-profit', 'val-setup-inv', 'val-elapsed', 'val-rounds',
    'val-steps-round', 'val-mkt-risk', 'val-cash', 'val-ar',
    'val-loans', 'val-ap', 'val-inventory'
  ];

  function updateValuationModule() {
    const params = {
      currentProfit: Number(document.getElementById('val-profit').value) || 0,
      setupInvestment478000: Number(document.getElementById('val-setup-inv').value) || 0,
      elapsedSteps: Number(document.getElementById('val-elapsed').value) || 1,
      totalRounds: Number(document.getElementById('val-rounds').value) || 3,
      stepsPerRound: Number(document.getElementById('val-steps-round').value) || 20,
      marketRiskRate: (Number(document.getElementById('val-mkt-risk').value) || 7) / 100,
      cash: Number(document.getElementById('val-cash').value) || 0,
      accountsReceivable: Number(document.getElementById('val-ar').value) || 0,
      bankLoans: Number(document.getElementById('val-loans').value) || 0,
      accountsPayable: Number(document.getElementById('val-ap').value) || 0,
      inventoryValue: Number(document.getElementById('val-inventory').value) || 0
    };

    const res = ERPsimEngine.calculateCompanyValuation(params);

    // Top telemetry strip
    document.getElementById('top-valuation').textContent = fmtEur(res.companyValuation);
    document.getElementById('top-credit').textContent = `${res.creditInfo.rating} (${fmtDec(res.creditInfo.riskRate * 100, 2)}%)`;
    document.getElementById('top-credit').style.color = res.creditInfo.color;
    document.getElementById('top-debt-loading').textContent = fmtEur(res.debtLoading);
    document.getElementById('top-debt-loading').style.color = res.debtLoading >= 0 ? '#10b981' : '#fbbf24';

    // Main Valuation Stat Boxes
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

    // Dynamic Strategic Advisor Box
    const advBox = document.getElementById('valuation-advisor-box');
    if (res.creditInfo.rating === 'AAA+') {
      advBox.className = 'alert-card';
      advBox.innerHTML = `
        <strong>Trạng thái Tối Ưu (AAA+):</strong> Debt Loading của bạn đang dương (${fmtEur(res.debtLoading)}). Mẫu số chiết khấu đang ở mức thấp nhất có thể (<strong>${fmtDec(res.discountRate * 100, 2)}%</strong>).
        Bạn có bộ đệm an toàn <strong>${fmtEur(res.creditInfo.bufferBeforeDrop)}</strong> trước khi bị tụt xuống hạng AA+.
      `;
    } else {
      const next = res.creditInfo.nextBetter;
      advBox.className = 'alert-card warning';
      advBox.innerHTML = `
        <strong>Cảnh báo Đòn bẩy Định giá & Chiến thuật Cuối Game (End-Game Valuation Hack):</strong>
        <ul style="margin-left: 1.2rem; margin-top: 0.35rem; font-size: 0.83rem;">
          <li>Chỉ cần giảm nợ ròng (hoặc thu thêm tiền bán hàng) <strong>${fmtEur(res.creditInfo.amountToNextTier)}</strong>, bạn sẽ nhảy lên hạng <strong>${next.rating}</strong> và tăng Định giá Công ty ngay lập tức thêm <strong style="color:#34d399;">+${fmtEur(res.nextTierValuationGain)}</strong>!</li>
          <li>Để lên đỉnh <strong>AAA+</strong> (nhận thêm <strong style="color:#34d399;">+${fmtEur(res.valuationLostToCreditRisk)}</strong> định giá), bạn cần cải thiện Debt Loading thêm <strong>${fmtEur(res.amountNeededForAAA)}</strong>.</li>
          <li><strong>Mô phỏng Xả Tồn Kho Cuối Game:</strong> Hiện bạn có <strong>${fmtEur(params.inventoryValue)}</strong> tồn kho (không được cộng vào Debt Loading). Nếu ngừng MRP (<code>MD01</code>) ở 5 ngày cuối và xả 75% lượng tồn kho này thành Tiền/Phải thu (${fmtEur(res.endGameSimulation.liquidatedCashGain)}), hạng tín dụng sẽ nhảy lên <strong>${res.endGameSimulation.newRating}</strong> và Định giá tăng vọt thêm <strong style="color:#10b981;">+${fmtEur(res.endGameSimulation.valuationJump)}</strong>!</li>
        </ul>
      `;
    }

    // Populate 21-Tier Table
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

  document.getElementById('btn-load-endgame-demo').addEventListener('click', () => {
    document.getElementById('val-profit').value = 2450000;
    document.getElementById('val-setup-inv').value = 500000;
    document.getElementById('val-elapsed').value = 55;
    document.getElementById('val-cash').value = 1100000;
    document.getElementById('val-ar').value = 1800000;
    document.getElementById('val-loans').value = 4500000;
    document.getElementById('val-ap').value = 1450000;
    document.getElementById('val-inventory').value = 2800000;
    updateValuationModule();
  });

  // =========================================================================
  // MODULE 2: DEMAND REVERSE-ENGINEERING & VK32 OPTIMAL PRICING
  // =========================================================================
  let pricingState = [
    { skuCode: 'F11', channelCode: 'DC10', cogs: 2.52, prevPrice: 4.55, prevQty: 3100, currPrice: 4.40, currQty: 3650, marketAvgPrice: 4.48, dailyMarketing: 0,    inventoryRemaining: 2400 },
    { skuCode: 'F12', channelCode: 'DC10', cogs: 3.18, prevPrice: 5.40, prevQty: 2600, currPrice: 5.55, currQty: 1950, marketAvgPrice: 5.38, dailyMarketing: 0,    inventoryRemaining: 1900 },
    { skuCode: 'F13', channelCode: 'DC10', cogs: 3.45, prevPrice: 5.75, prevQty: 2200, currPrice: 5.60, currQty: 2800, marketAvgPrice: 5.70, dailyMarketing: 0,    inventoryRemaining: 0    },
    { skuCode: 'F02', channelCode: 'DC12', cogs: 1.72, prevPrice: 3.25, prevQty: 3400, currPrice: 3.40, currQty: 3120, marketAvgPrice: 3.35, dailyMarketing: 1200, inventoryRemaining: 2100 },
    { skuCode: 'F03', channelCode: 'DC12', cogs: 1.85, prevPrice: 3.50, prevQty: 2900, currPrice: 3.35, currQty: 3900, marketAvgPrice: 3.55, dailyMarketing: 1500, inventoryRemaining: 0    },
    { skuCode: 'F12', channelCode: 'DC12', cogs: 3.18, prevPrice: 5.60, prevQty: 2700, currPrice: 5.85, currQty: 2350, marketAvgPrice: 5.65, dailyMarketing: 1000, inventoryRemaining: 1650 },
    { skuCode: 'F16', channelCode: 'DC12', cogs: 3.32, prevPrice: 5.70, prevQty: 2500, currPrice: 5.95, currQty: 2100, marketAvgPrice: 5.75, dailyMarketing: 900,  inventoryRemaining: 1800 },
    { skuCode: 'F01', channelCode: 'DC14', cogs: 1.38, prevPrice: 2.85, prevQty: 1950, currPrice: 2.95, currQty: 1890, marketAvgPrice: 2.90, dailyMarketing: 800,  inventoryRemaining: 1200 },
    { skuCode: 'F03', channelCode: 'DC14', cogs: 1.85, prevPrice: 3.65, prevQty: 2250, currPrice: 3.75, currQty: 2180, marketAvgPrice: 3.70, dailyMarketing: 1500, inventoryRemaining: 0    },
    { skuCode: 'F04', channelCode: 'DC14', cogs: 1.82, prevPrice: 3.60, prevQty: 1800, currPrice: 3.95, currQty: 1520, marketAvgPrice: 3.68, dailyMarketing: 1100, inventoryRemaining: 950  }
  ];

  function renderPricingTable() {
    const filter = document.getElementById('pricing-channel-filter').value;
    const tbody = document.getElementById('pricing-solver-tbody');

    let totalCurrProfit = 0;
    let totalOptProfit = 0;
    let stockoutCount = 0;

    const rowsHtml = pricingState.map((row, idx) => {
      if (filter !== 'ALL' && row.channelCode !== filter) return '';
      const solved = ERPsimEngine.reverseEngineerSkuChannel(row);
      if (!solved.compatible) return '';

      totalCurrProfit += solved.currentDailyProfit;
      totalOptProfit += solved.projectedOptimalProfit;
      if (solved.isStockout) stockoutCount++;

      const deltaSign = solved.priceDelta > 0 ? '+' : '';
      const deltaColor = solved.priceDelta > 0.05 ? '#34d399' : (solved.priceDelta < -0.05 ? '#fbbf24' : '#94a3b8');

      return `
        <tr>
          <td><strong>${solved.skuCode}</strong> <span style="font-size:0.72rem;color:#94a3b8;">${solved.skuName.replace(/^\S+\s/, '')}</span></td>
          <td><span class="badge-tcode">${solved.channelCode}</span></td>
          <td><input type="number" class="table-input" data-idx="${idx}" data-field="cogs" value="${row.cogs}" step="0.05" /></td>
          <td><input type="number" class="table-input" data-idx="${idx}" data-field="prevPrice" value="${row.prevPrice}" step="0.05" /></td>
          <td><input type="number" class="table-input" data-idx="${idx}" data-field="prevQty" value="${row.prevQty}" step="100" /></td>
          <td><input type="number" class="table-input" data-idx="${idx}" data-field="currPrice" value="${row.currPrice}" step="0.05" /></td>
          <td><input type="number" class="table-input" data-idx="${idx}" data-field="currQty" value="${row.currQty}" step="100" /></td>
          <td><input type="number" class="table-input" data-idx="${idx}" data-field="marketAvgPrice" value="${row.marketAvgPrice}" step="0.05" /></td>
          <td><input type="number" class="table-input" data-idx="${idx}" data-field="dailyMarketing" value="${row.dailyMarketing}" step="100" /></td>
          <td><input type="number" class="table-input" data-idx="${idx}" data-field="inventoryRemaining" value="${row.inventoryRemaining}" step="100" style="${solved.isStockout ? 'border-color:#f43f5e;color:#fb7185;' : ''}" /></td>
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

    tbody.innerHTML = rowsHtml;

    document.getElementById('price-curr-profit').textContent = fmtEur(totalCurrProfit);
    document.getElementById('price-opt-profit').textContent = fmtEur(totalOptProfit);
    document.getElementById('price-profit-gain').textContent = `+${fmtEur(Math.max(0, totalOptProfit - totalCurrProfit))} / ngày nếu cập nhật VK32`;
    document.getElementById('price-stockout-count').textContent = `${stockoutCount} mã`;

    // Bind live input changes
    tbody.querySelectorAll('.table-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.dataset.idx);
        const field = e.target.dataset.field;
        pricingState[idx][field] = Number(e.target.value) || 0;
        renderPricingTable();
      });
    });
  }

  document.getElementById('pricing-channel-filter').addEventListener('change', renderPricingTable);

  document.getElementById('btn-apply-optimal-prices').addEventListener('click', () => {
    pricingState = pricingState.map(row => {
      const solved = ERPsimEngine.reverseEngineerSkuChannel(row);
      if (!solved.compatible) return row;
      return {
        ...row,
        prevPrice: row.currPrice,
        prevQty: row.currQty,
        currPrice: solved.recommendedPrice,
        currQty: solved.expectedQtyAtOptimal
      };
    });
    renderPricingTable();
  });

  // =========================================================================
  // MODULE 3: REGIONAL PREFERENCE HEATMAP & ZADS MARKETING ALLOCATOR
  // =========================================================================
  let regionalMatrixState = [
    { skuCode: 'F01', name: '500g Original',   unitMargin: 1.45, salesNorth: 1450, salesSouth: 920,  salesWest: 1100, adsNorth: 400,  adsSouth: 400, adsWest: 400 },
    { skuCode: 'F02', name: '500g Nut',        unitMargin: 1.68, salesNorth: 2850, salesSouth: 1150, salesWest: 1300, adsNorth: 800,  adsSouth: 600, adsWest: 600 },
    { skuCode: 'F03', name: '500g Blueberry',  unitMargin: 1.85, salesNorth: 1100, salesSouth: 3100, salesWest: 1250, adsNorth: 500,  adsSouth: 900, adsWest: 500 },
    { skuCode: 'F04', name: '500g Strawberry', unitMargin: 1.78, salesNorth: 980,  salesSouth: 1200, salesWest: 2950, adsNorth: 400,  adsSouth: 400, adsWest: 800 },
    { skuCode: 'F12', name: '1kg Nut',         unitMargin: 2.45, salesNorth: 2400, salesSouth: 1050, salesWest: 1150, adsNorth: 700,  adsSouth: 300, adsWest: 300 },
    { skuCode: 'F16', name: '1kg Mixed Fruit', unitMargin: 2.55, salesNorth: 1150, salesSouth: 2250, salesWest: 2500, adsNorth: 400,  adsSouth: 700, adsWest: 800 }
  ];

  function heatColor(theta) {
    if (theta >= 1.35) return 'background: rgba(16, 185, 129, 0.28); color: #34d399; border: 1px solid #10b981;';
    if (theta >= 1.05) return 'background: rgba(59, 130, 246, 0.22); color: #60a5fa; border: 1px solid #3b82f6;';
    return 'background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid #334155;';
  }

  function renderRegionalMarketingModule() {
    const budget = Number(document.getElementById('mkt-total-budget').value) || 5400;
    const res = ERPsimEngine.reverseEngineerRegionalMarketing(regionalMatrixState, budget);

    // Render top champion cards per region
    const cardsContainer = document.getElementById('region-champions-cards');
    cardsContainer.innerHTML = ['North', 'South', 'West'].map(reg => {
      const top1 = res.regionRankings[reg][0];
      const top2 = res.regionRankings[reg][1];
      const spend1 = res.recommendations[reg][top1.skuCode].spend;
      const spend2 = res.recommendations[reg][top2.skuCode].spend;
      return `
        <div class="stat-box" style="border-left: 3px solid #10b981;">
          <div class="s-label">VÙNG ${reg.toUpperCase()} — SẢN PHẨM KHỚP THỊ HIẾU NHẤT</div>
          <div class="s-value" style="font-size: 1.05rem; color: #34d399;">
            #1: ${top1.skuCode} (${top1.name}) — Θ = ${fmtDec(top1.theta, 2)}
          </div>
          <div class="s-sub" style="margin-top:0.35rem; color:#e2e8f0;">
            • Bơm ZADS <strong>${fmtEur(spend1)}/ngày</strong> cho <strong>${top1.skuCode}</strong><br/>
            • Hỗ trợ <strong>${fmtEur(spend2)}/ngày</strong> cho <strong>${top2.skuCode}</strong> (Θ = ${fmtDec(top2.theta, 2)})<br/>
            • <span style="color:#fb7185;">Các mã còn lại tại ${reg}: Đặt €0 để tránh tự ăn mòn!</span>
          </div>
        </div>
      `;
    }).join('');

    // Render matrix table
    const tbody = document.getElementById('regional-marketing-tbody');
    tbody.innerHTML = res.analyzedRows.map((row, idx) => {
      const recN = res.recommendations.North[row.skuCode];
      const recS = res.recommendations.South[row.skuCode];
      const recW = res.recommendations.West[row.skuCode];

      return `
        <tr>
          <td><strong>${row.skuCode}</strong> ${row.name}</td>
          <td><input type="number" class="table-input reg-inp" data-idx="${idx}" data-field="unitMargin" value="${row.unitMargin}" step="0.1" /></td>
          <td><input type="number" class="table-input reg-inp" data-idx="${idx}" data-field="salesNorth" value="${row.salesNorth}" step="100" /></td>
          <td><input type="number" class="table-input reg-inp" data-idx="${idx}" data-field="salesSouth" value="${row.salesSouth}" step="100" /></td>
          <td><input type="number" class="table-input reg-inp" data-idx="${idx}" data-field="salesWest" value="${row.salesWest}" step="100" /></td>
          <td><span class="heat-cell" style="${heatColor(row.thetaNorth)}">${fmtDec(row.thetaNorth, 2)} (${row.shareNorthPct}%)</span></td>
          <td><span class="heat-cell" style="${heatColor(row.thetaSouth)}">${fmtDec(row.thetaSouth, 2)} (${row.shareSouthPct}%)</span></td>
          <td><span class="heat-cell" style="${heatColor(row.thetaWest)}">${fmtDec(row.thetaWest, 2)} (${row.shareWestPct}%)</span></td>
          <td style="font-weight:700; color:${recN.spend > 0 ? '#10b981' : '#64748b'};">${fmtEur(recN.spend)} <span style="font-size:0.68rem;">${recN.priority === 1 ? '★#1' : (recN.priority === 2 ? '◆#2' : '')}</span></td>
          <td style="font-weight:700; color:${recS.spend > 0 ? '#10b981' : '#64748b'};">${fmtEur(recS.spend)} <span style="font-size:0.68rem;">${recS.priority === 1 ? '★#1' : (recS.priority === 2 ? '◆#2' : '')}</span></td>
          <td style="font-weight:700; color:${recW.spend > 0 ? '#10b981' : '#64748b'};">${fmtEur(recW.spend)} <span style="font-size:0.68rem;">${recW.priority === 1 ? '★#1' : (recW.priority === 2 ? '◆#2' : '')}</span></td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.reg-inp').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.dataset.idx);
        const field = e.target.dataset.field;
        regionalMatrixState[idx][field] = Number(e.target.value) || 0;
        renderRegionalMarketingModule();
      });
    });
  }

  document.getElementById('mkt-total-budget').addEventListener('input', renderRegionalMarketingModule);

  // =========================================================================
  // MODULE 4: PRODUCTION, SETUP TIME (478000) & CARBON TAX
  // =========================================================================
  const prodInputs = ['prod-478000', 'prod-11000', 'prod-productivity', 'prod-lot-size', 'prod-avg-margin', 'prod-rem-days'];
  const co2Inputs = ['co2-boxes', 'co2-setup-hrs', 'co2-inventory', 'co2-deliveries', 'co2-tax-rate'];

  function updateProductionModule() {
    const account478000 = Number(document.getElementById('prod-478000').value) || 0;
    const res = ERPsimEngine.calculateSetupAndProduction({
      account478000,
      account11000ExtraUnits: Number(document.getElementById('prod-11000').value) || 0,
      productivityPct: Number(document.getElementById('prod-productivity').value) || 75,
      lotSize: Number(document.getElementById('prod-lot-size').value) || 16000,
      avgMarginPerBox: Number(document.getElementById('prod-avg-margin').value) || 1.65,
      remainingDays: Number(document.getElementById('prod-rem-days').value) || 35
    });

    document.getElementById('top-setup-time').textContent = `${fmtDec(res.setupTimeHours, 2)} giờ`;
    document.getElementById('res-prod-setup').textContent = `${fmtDec(res.setupTimeHours, 2)} giờ`;
    document.getElementById('res-prod-saved').textContent = `Tiết kiệm ${fmtDec(res.hoursSavedPerChangeover, 2)} giờ/lần đổi mã (so với 8h gốc)`;
    document.getElementById('res-prod-output').textContent = `${Math.round(res.actualDailyOutput).toLocaleString('en-US')} hộp/ngày`;
    document.getElementById('res-prod-util').textContent = `Hiệu suất chạy máy: ${fmtDec(res.capacityUtilizationPct, 1)}% ngày`;
    document.getElementById('res-prod-extra-profit').textContent = `+${fmtEur(res.extraProfitOverRemainingGame)}`;

    const tbody = document.getElementById('setup-milestones-tbody');
    tbody.innerHTML = res.milestones.map(m => {
      const isCurrent = Math.abs(m.investment - account478000) < 25000;
      return `
        <tr class="${isCurrent ? 'active-tier' : ''}">
          <td>${fmtEur(m.investment)} ${isCurrent ? '◀' : ''}</td>
          <td style="color:#60a5fa; font-weight:700;">${fmtDec(m.setupHours, 2)} giờ</td>
          <td>${fmtDec(m.pctDayLostPerSetup, 1)}%</td>
          <td>${m.dailyOutputBoxes.toLocaleString('en-US')} hộp</td>
          <td style="color:#34d399;">+${m.extraBoxesPerDay.toLocaleString('en-US')} hộp</td>
          <td style="color:#10b981; font-weight:700;">+${fmtEur(m.projectedProfitGain)}</td>
        </tr>
      `;
    }).join('');
  }

  function updateCarbonModule() {
    const res = ERPsimEngine.calculateCarbonFootprint({
      dailyBoxesProduced: Number(document.getElementById('co2-boxes').value) || 0,
      dailySetupHours: Number(document.getElementById('co2-setup-hrs').value) || 0,
      averageInventoryBoxes: Number(document.getElementById('co2-inventory').value) || 0,
      dailyDeliveriesCount: Number(document.getElementById('co2-deliveries').value) || 0,
      carbonTaxRatePerKg: Number(document.getElementById('co2-tax-rate').value) || 0.30
    });

    document.getElementById('res-co2-total').textContent = `${res.totalDailyCo2Kg.toLocaleString('en-US')} kg CO2e`;
    document.getElementById('res-co2-breakdown').textContent = `SX: ${res.prodCo2Kg}kg | Setup: ${res.setupCo2Kg}kg | Kho: ${res.storageCo2Kg}kg | Giao vận: ${res.transportCo2Kg}kg`;
    document.getElementById('res-co2-tax').textContent = `${fmtEur(res.dailyCarbonTaxEur)} / ngày`;
  }

  prodInputs.forEach(id => document.getElementById(id).addEventListener('input', updateProductionModule));
  co2Inputs.forEach(id => document.getElementById(id).addEventListener('input', updateCarbonModule));

  // =========================================================================
  // MODULE 5: SAP CLIPBOARD IMPORTER & ODATA CONNECTOR
  // =========================================================================
  document.getElementById('btn-load-sample-tsv').addEventListener('click', () => {
    const sample = [
      'SKU\tChannel\tRegion\tPrice\tQty\tMarketAvgPrice\tCOGS\tMarketing\tInventory',
      'F11\tDC10\tNorth\t4.42\t3800\t4.50\t2.52\t0\t1900',
      'F12\tDC10\tSouth\t5.50\t2200\t5.38\t3.18\t0\t1200',
      'F02\tDC12\tNorth\t3.40\t3350\t3.35\t1.72\t1400\t2100',
      'F03\tDC12\tSouth\t3.45\t4100\t3.55\t1.85\t1600\t0',
      'F04\tDC14\tWest\t3.90\t2450\t3.75\t1.82\t1300\t650'
    ].join('\n');
    document.getElementById('sap-raw-paste').value = sample;
  });

  document.getElementById('btn-parse-sap-paste').addEventListener('click', () => {
    const raw = document.getElementById('sap-raw-paste').value;
    const parsed = ERPsimEngine.parseSapTableText(raw);
    const statusEl = document.getElementById('sap-parse-status');

    if (!parsed.records || parsed.records.length === 0) {
      statusEl.style.color = '#fb7185';
      statusEl.textContent = 'Không tìm thấy dòng dữ liệu hợp lệ. Hãy chắc chắn dòng đầu tiên là tiêu đề cột.';
      return;
    }

    let updatedCount = 0;
    parsed.records.forEach(rec => {
      const sku = (rec.SKU || rec.Material || '').trim();
      const ch = (rec.Channel || rec.DC || 'DC12').trim();
      if (!sku) return;

      const existingIdx = pricingState.findIndex(p => p.skuCode === sku && p.channelCode === ch);
      const entry = {
        skuCode: sku,
        channelCode: ch,
        cogs: Number(rec.COGS) || 1.80,
        prevPrice: existingIdx >= 0 ? pricingState[existingIdx].currPrice : (Number(rec.Price) || 3.40) * 0.97,
        prevQty: existingIdx >= 0 ? pricingState[existingIdx].currQty : (Number(rec.Qty) || 2000) * 1.04,
        currPrice: Number(rec.Price) || 3.50,
        currQty: Number(rec.Qty) || 2200,
        marketAvgPrice: Number(rec.MarketAvgPrice) || Number(rec.Price) || 3.45,
        dailyMarketing: Number(rec.Marketing) || 0,
        inventoryRemaining: rec.Inventory !== undefined ? Number(rec.Inventory) : 1000
      };

      if (existingIdx >= 0) {
        pricingState[existingIdx] = entry;
      } else {
        pricingState.push(entry);
      }
      updatedCount++;
    });

    renderPricingTable();
    statusEl.style.color = '#34d399';
    statusEl.textContent = `Đã phân tích và đồng bộ thành công ${updatedCount} bản ghi SKU/Channel vào Tab 2 (Bộ Giải Ngược Cầu & Giá VK32)!`;
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
        statusBox.textContent = `Kết nối SAP S/4HANA ZODATA thành công (${data.bytes} bytes). Đang đồng bộ Entity Sets (Sales, Market, Current_Inventory, Company_Valuation)...`;
        try {
          const jsonPayload = JSON.parse(data.raw);
          const records = (jsonPayload.d && jsonPayload.d.results) || jsonPayload.value || [];
          if (Array.isArray(records) && records.length > 0) {
            let synced = 0;
            records.forEach(item => {
              const sku = item.Material || item.MATERIAL || item.SKU;
              const ch = item.Distribution_Channel || item.DISTR_CHAN || (item.Channel ? String(item.Channel) : '');
              const chCode = ch.startsWith('DC') ? ch : (ch ? `DC${ch}` : 'DC12');
              if (sku) {
                const idx = pricingState.findIndex(p => p.skuCode === sku && p.channelCode === chCode);
                if (idx >= 0) {
                  if (item.Net_Price || item.Price) pricingState[idx].currPrice = Number(item.Net_Price || item.Price);
                  if (item.Quantity || item.Quantity_Sold) pricingState[idx].currQty = Number(item.Quantity || item.Quantity_Sold);
                  if (item.Average_Price || item.MarketAvgPrice) pricingState[idx].marketAvgPrice = Number(item.Average_Price || item.MarketAvgPrice);
                  if (item.Current_Inventory !== undefined) pricingState[idx].inventoryRemaining = Number(item.Current_Inventory);
                  synced++;
                }
              }
            });
            renderPricingTable();
            statusBox.textContent = `Đồng bộ trực tiếp S/4HANA OData hoàn tất! Đã cập nhật ${synced} bản ghi từ feed (${records.length} dòng).`;
          }
        } catch (_) {
          // Metadata or XML feed returned
        }
      } else {
        statusBox.textContent = `Phản hồi từ Proxy: ${data.error || 'Không thể kết nối tới máy chủ SAP OData.'}`;
      }
    } catch (err) {
      statusBox.textContent = `Lưu ý: Để gọi trực tiếp OData không bị trình duyệt chặn CORS, hãy khởi chạy bằng lệnh "python server.py" tại thư mục dự án (Chi tiết: ${err.message}).`;
    }
  });

  // =========================================================================
  // MODULE 0: LOGISTICS SUSTAINABILITY (PRESET 3) & 8 DISRUPTORS SOLVER
  // =========================================================================
  const logInputs = [
    'log-base-tax', 'log-po-lot', 'log-total-stock', 'log-transfers-day',
    'log-reg-orders', 'log-dir-orders', 'dis-1-cold', 'dis-1-combo',
    'dis-2-carbon', 'dis-3-supplier', 'dis-3-vendor', 'dis-4-gridlock'
  ];

  function updateLogisticsPreset3Module() {
    const res = ERPsimEngine.solveLogisticsSustainabilityPreset3({
      baseCarbonTax: Number(document.getElementById('log-base-tax').value) || 0.10,
      orderLotSizePerPo: Number(document.getElementById('log-po-lot').value) || 600,
      totalWarehouseUnits: Number(document.getElementById('log-total-stock').value) || 3600,
      transfersPerDay: Number(document.getElementById('log-transfers-day').value) || 0,
      regionalSalesOrdersPerDay: Number(document.getElementById('log-reg-orders').value) || 0,
      directSalesOrdersPerDay: Number(document.getElementById('log-dir-orders').value) || 0,
      coldSpellActive: document.getElementById('dis-1-cold').checked,
      coldSpellCombo: document.getElementById('dis-1-combo').value,
      carbonDecreeActive: document.getElementById('dis-2-carbon').checked,
      supplierDisruptionActive: document.getElementById('dis-3-supplier').checked,
      impactedSupplier: document.getElementById('dis-3-vendor').value,
      hubGridlockActive: document.getElementById('dis-4-gridlock').checked
    });

    document.getElementById('log-eff-tax').textContent = `€${fmtDec(res.effectiveCarbonTax, 2)} / kg CO2e`;
    document.getElementById('log-overstock-fee').textContent = `${fmtEur(res.overstockFeePerDay)} / ngày`;
    document.getElementById('log-overstock-fee').style.color = res.overstockFeePerDay > 0 ? '#f43f5e' : '#10b981';
    document.getElementById('log-overstock-co2').textContent = `Vượt ${res.excessUnits.toLocaleString('en-US')} units (+${res.overstockCo2PerDay} kg CO2e/ngày)`;
    document.getElementById('log-daily-total-cost').textContent = `${fmtEur(res.dailyCarbonTaxEur + res.dailyTransportAndStorageFeesEur)} / ngày`;
    document.getElementById('log-daily-co2-sub').textContent = `Phát thải vận hành: ${res.dailyLogisticsCo2.toLocaleString('en-US')} kg CO2e/ngày (Thuế: ${fmtEur(res.dailyCarbonTaxEur)})`;
    document.getElementById('log-direct-loss').textContent = `-€${fmtDec(res.lossPerDirectSaleOrder, 2)} / đơn`;

    const skuTbody = document.getElementById('logistics-sku-tbody');
    skuTbody.innerHTML = res.skuAnalysis.map(s => {
      const vColor = s.recommendedVendor === 'V04' ? '#10b981' : '#3b82f6';
      return `
        <tr>
          <td>
            <strong>${s.name}</strong>
            ${s.isColdHit ? '<span class="badge-tcode rose">❄ Cold Spell +5kg</span>' : ''}
          </td>
          <td>${s.initialStock}</td>
          <td>€${fmtDec(s.costV04, 2)}</td>
          <td>€${fmtDec(s.costV08, 2)}</td>
          <td>${fmtDec(s.v04UnitCo2, 1)}kg | ${fmtDec(s.v08UnitCo2, 1)}kg</td>
          <td style="${s.recommendedVendor === 'V04' ? 'color:#34d399;font-weight:700;' : ''}">€${fmtDec(s.v04LandedUnitCost, 2)}</td>
          <td style="${s.recommendedVendor === 'V08' ? 'color:#60a5fa;font-weight:700;' : ''}">€${fmtDec(s.v08LandedUnitCost, 2)}</td>
          <td>
            <span style="display:inline-block;padding:0.2rem 0.55rem;border-radius:4px;font-weight:800;background:${vColor}22;color:${vColor};border:1px solid ${vColor}66;">
              CHỌN ${s.recommendedVendor} (-€${fmtDec(s.savingsPerUnit, 2)}/u)
            </span>
          </td>
          <td>${s.breakEvenLotSize === Infinity ? 'V08 luôn rẻ hơn' : `≥ ${s.breakEvenLotSize} units`}</td>
          <td>€${fmtDec(s.initialPrice, 2)}</td>
          <td style="background:rgba(16,185,129,0.16);color:#10b981;font-weight:800;font-size:0.95rem;">
            €${fmtDec(s.recommendedPriceDC16, 2)}
          </td>
          <td style="color:#34d399;font-weight:700;">+€${fmtDec(s.netProfitPerUnit, 2)}</td>
        </tr>
      `;
    }).join('');

    const disTbody = document.getElementById('logistics-disruptors-tbody');
    disTbody.innerHTML = ERPsimEngine.LOGISTICS_DISRUPTORS.map(d => `
      <tr>
        <td><strong style="color:#fbbf24;">${d.name}</strong></td>
        <td style="font-family:var(--font-sans);">${d.summary}</td>
        <td style="font-family:var(--font-sans);color:#34d399;"><strong>Đối sách:</strong> ${d.counterStrategy}</td>
      </tr>
    `).join('');
  }

  logInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateLogisticsPreset3Module);
      el.addEventListener('change', updateLogisticsPreset3Module);
    }
  });

  // Initial render of all modules
  updateLogisticsPreset3Module();
  updateValuationModule();
  renderPricingTable();
  renderRegionalMarketingModule();
  updateProductionModule();
  updateCarbonModule();
});
