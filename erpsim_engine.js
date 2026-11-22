/**
 * ERPsim Reverse-Engineering & Mathematical Optimization Engine
 * Dedicated 100% to: ERPsim Logistics Sustainability Game (Preset 3 - Dairy) & 8 Random Disruptors
 * Based on Official HEC Montréal Documents:
 * - Logistics Sustainability Game (Preset 3) Job Aid
 * - Logistics Sustainability Disruptors Guide (Revision 2.0)
 * - Participant's Guide: Logistics Game (2024-2025 Edition)
 */

const ERPsimEngine = (() => {
  // 1. OFFICIAL 21-TIER CREDIT RATING & COMPANY RISK RATE TABLE
  const CREDIT_RATING_TABLE = [
    { minDebtLoading: 0, rating: 'AAA+', riskRate: 0.0300, tierIndex: 1, color: '#10b981' },
    { minDebtLoading: -1000000, rating: 'AA+', riskRate: 0.0375, tierIndex: 2, color: '#22c55e' },
    { minDebtLoading: -2000000, rating: 'AA', riskRate: 0.0400, tierIndex: 3, color: '#34d399' },
    { minDebtLoading: -3000000, rating: 'AA-', riskRate: 0.0425, tierIndex: 4, color: '#4ade80' },
    { minDebtLoading: -4000000, rating: 'A+', riskRate: 0.0475, tierIndex: 5, color: '#84cc16' },
    { minDebtLoading: -5000000, rating: 'A', riskRate: 0.0500, tierIndex: 6, color: '#a3e635' },
    { minDebtLoading: -6000000, rating: 'A-', riskRate: 0.0525, tierIndex: 7, color: '#bef264' },
    { minDebtLoading: -7000000, rating: 'BBB+', riskRate: 0.0575, tierIndex: 8, color: '#eab308' },
    { minDebtLoading: -8000000, rating: 'BBB', riskRate: 0.0600, tierIndex: 9, color: '#facc15' },
    { minDebtLoading: -9000000, rating: 'BBB-', riskRate: 0.0625, tierIndex: 10, color: '#fde047' },
    { minDebtLoading: -10000000, rating: 'BB+', riskRate: 0.0675, tierIndex: 11, color: '#f59e0b' },
    { minDebtLoading: -11000000, rating: 'BB', riskRate: 0.0700, tierIndex: 12, color: '#fb923c' },
    { minDebtLoading: -12000000, rating: 'BB-', riskRate: 0.0725, tierIndex: 13, color: '#f97316' },
    { minDebtLoading: -13000000, rating: 'B+', riskRate: 0.0775, tierIndex: 14, color: '#ea580c' },
    { minDebtLoading: -14000000, rating: 'B', riskRate: 0.0800, tierIndex: 15, color: '#ef4444' },
    { minDebtLoading: -15000000, rating: 'B-', riskRate: 0.0825, tierIndex: 16, color: '#dc2626' },
    { minDebtLoading: -16000000, rating: 'CCC+', riskRate: 0.0900, tierIndex: 17, color: '#b91c1c' },
    { minDebtLoading: -17000000, rating: 'CCC', riskRate: 0.1000, tierIndex: 18, color: '#991b1b' },
    { minDebtLoading: -18000000, rating: 'CCC-', riskRate: 0.1100, tierIndex: 19, color: '#7f1d1d' },
    { minDebtLoading: -19000000, rating: 'CC', riskRate: 0.1200, tierIndex: 20, color: '#641e16' },
    { minDebtLoading: -Infinity, rating: 'C', riskRate: 0.1500, tierIndex: 21, color: '#450a0a' }
  ];

  // 2. OFFICIAL 6 DAIRY PRODUCTS IN LOGISTICS SUSTAINABILITY (PRESET 3)
  // Elasticities calibrated to homogeneous Dairy commodity competition on DC 16 (epsilon ~ 6.2 - 7.2 -> Lerner optimal Gross Margin ~ 14.5% - 17%)
  const LOGISTICS_PRESET3_SKUS = [
    { code: 'T01', name: 'Milk ($$-T01)', shortName: 'Milk', initialStock: 950, costV04: 22.95, costV08: 24.10, initialPrice: 25.25, elasticity: 7.10, defaultTarget: 1100 },
    { code: 'T02', name: 'Cream ($$-T02)', shortName: 'Cream', initialStock: 300, costV04: 72.07, costV08: 75.67, initialPrice: 79.78, elasticity: 6.35, defaultTarget: 450 },
    { code: 'T03', name: 'Yoghurt ($$-T03)', shortName: 'Yoghurt', initialStock: 700, costV04: 25.85, costV08: 27.14, initialPrice: 28.43, elasticity: 6.95, defaultTarget: 850 },
    { code: 'T04', name: 'Cheese ($$-T04)', shortName: 'Cheese', initialStock: 350, costV04: 82.68, costV08: 86.81, initialPrice: 90.95, elasticity: 6.20, defaultTarget: 550 },
    { code: 'T05', name: 'Butter ($$-T05)', shortName: 'Butter', initialStock: 400, costV04: 59.88, costV08: 62.87, initialPrice: 65.87, elasticity: 6.55, defaultTarget: 550 },
    { code: 'T06', name: 'Ice Cream ($$-T06)', shortName: 'Ice Cream', initialStock: 300, costV04: 43.15, costV08: 45.31, initialPrice: 47.47, elasticity: 6.70, defaultTarget: 450 }
  ];

  // 3. OFFICIAL 8 RANDOM DISRUPTORS IN LOGISTICS SUSTAINABILITY (PRESET 3)
  const LOGISTICS_DISRUPTORS = [
    {
      id: 1,
      code: 'COLD_SPELL',
      name: 'Event 1: Cold Spell (Đợt Giá Rét)',
      summary: '+5.0 kg CO₂e/unit cho 2 sản phẩm bị ảnh hưởng (cả V04 & V08); Giảm phạt Carbon vượt kho -300 kg/container (từ 500 còn 200 kg); Giảm Carbon năng lượng -25 kg/ngày.',
      counterStrategy: 'Tăng giá bán (VK32 - Kênh 16) của 2 sản phẩm bị cộng +5kg CO₂e theo bảng giá tối ưu bên trên. Tận dụng phí phạt Carbon vượt kho giảm 60% để gom lô PO lớn hơn.'
    },
    {
      id: 2,
      code: 'CARBON_DECREE',
      name: 'Event 2: Carbon Decree (Sắc Lệnh Tăng Thuế Carbon)',
      summary: 'Thuế Carbon tăng vọt thêm +€0.20 / kg CO₂e; Phát thải năng lượng mua ngoài giảm -50 kg/ngày (còn 50 kg/ngày).',
      counterStrategy: 'BẮT BUỘC tắt bán trực tiếp từ Kho tổng 03 (ZMB1B: Bỏ tích Sales from Sloc 3 / Use 03) vì 300kg CO₂e/đơn lúc này tốn cực nhiều thuế! Gom đơn PO lớn và giảm tần suất chuyển kho.'
    },
    {
      id: 3,
      code: 'SUPPLIER_DISRUPTION',
      name: 'Event 3: Supplier Disruption (Đứt Gãy Chuỗi Cung Ứng NCC)',
      summary: 'Nhà cung cấp bị dính xúc xắc (V04 hoặc V08) bị phạt thêm +2.50 kg CO₂e/unit và +200 kg CO₂e/PO.',
      counterStrategy: 'Nếu V04 bị dính và Thuế Carbon cao (≥ €0.40/kg), kiểm tra cột CHỌN NCC (ZME12) bên trên để chuyển các mã chênh lệch giá thấp (như Milk T01, Yoghurt T03) sang V08.'
    },
    {
      id: 4,
      code: 'HUB_GRIDLOCK',
      name: 'Event 4: Hub Gridlock (Tắc Nghẽn Kho Tổng 03)',
      summary: 'Bán trực tiếp từ Kho tổng 03 bị cộng thêm +300 kg CO₂e/Sales Order (tổng 600 kg/đơn!). Chuyển kho nội bộ (ZMB1B) bị cộng +100 kg CO₂e/transfer (tổng 150 kg). Mua hàng PO bị cộng +100 kg CO₂e/PO.',
      counterStrategy: 'TUYỆT ĐỐI KHÔNG bán trực tiếp từ Kho tổng 03 (Bỏ tích Sales from Sloc 3 trong ZMB1B). Giãn tần suất chuyển kho ZMB1B ra 3–4 ngày/lần với số lượng lớn mỗi lần chuyển.'
    },
    {
      id: 5,
      code: 'SYSTEM_GLITCH',
      name: 'Event 5: System Glitch (Lỗi Hệ Thống Khóa Báo Cáo)',
      summary: 'Khóa ngẫu nhiên các nhóm báo cáo (Inventory ZMB52, Sales ZVC2/ZVA05, hoặc Procurement ZME2N). Mở khóa trong ZITM tốn €5,000 / báo cáo.',
      counterStrategy: 'KHÔNG CẦN TỐN €5,000 mua lại báo cáo nếu bạn đang dùng cổng OData (ZODATA / SAC / Excel OData Feed) hoặc chỉ mua duy nhất ZMB52 (€5,000 là rất nhỏ so với doanh thu €72,000/ngày).'
    },
    {
      id: 6,
      code: 'DATA_BREACH',
      name: 'Event 6: Data Breach (Rò Rỉ Dữ Liệu OData Toàn Thị Trường)',
      summary: 'Tất cả các đội đều xem được dữ liệu OData của nhau (giá bán, tồn kho, nhà cung cấp, doanh số của mọi đối thủ).',
      counterStrategy: 'Dùng OData quét ngay xem đối thủ đang đứt hàng (Stockout = 0) ở mặt hàng nào trong 6 mã (T01..T06) tại vùng nào (03N, 03S, 03W) → Đẩy hàng vào vùng đó qua ZMB1B và tăng giá VK32 +12%!'
    },
    {
      id: 7,
      code: 'FLASH_FLOOD',
      name: 'Event 7: Flash Flood (Lũ Quét Mất Trắng 1 Kho)',
      summary: 'Xóa sổ 100% tồn kho tại 1 kho ngẫu nhiên: Central (03), North (03N), South (03S), hoặc West (03W).',
      counterStrategy: 'Nếu mất kho vùng (VD: 03N): Vào ZMB1B đẩy hàng khẩn cấp từ 03 sang. Nếu mất kho tổng (03): Chạy ngay MD61 → MD01 → ZME12 chọn V04 (Lead time chỉ 1–2 ngày!) → ME59N để cấp tốc bù hàng!'
    },
    {
      id: 8,
      code: 'AI_INNOVATION',
      name: 'Event 8: AI Innovation (Mở Khóa Công Cụ AI ZRPA)',
      summary: 'Mở khóa T-code ZRPA (AI Requirements Planning cho MD61 & AI Price Management cho VK32).',
      counterStrategy: 'Có thể dùng ZRPA để tự động gợi ý lượng đặt hàng MD61 nhanh, NHƯNG phải kiểm tra lại giá VK32 bằng Bộ Giải Ngược của chúng ta vì AI mặc định trong game đặt biên lợi nhuận khá bảo thủ.'
    }
  ];

  /**
   * 1. LOGISTICS SUSTAINABILITY (PRESET 3) & 8 DISRUPTORS MAIN SOLVER
   */
  function solveLogisticsSustainabilityPreset3(params) {
    const {
      roundNumber = 1,
      dayInRound = 1,
      isFinalRound = false,
      baseCarbonTax = 0.10, // Preset 3 starts at €0.10/kg (+€0.05 per round)
      orderLotSizePerPo = 1800,
      totalWarehouseUnits = 3600,
      coverageDays = 5,
      autoOrderCalc = true,
      capWarehouse4000 = true,
      availableCash = 250000,
      capCashSafety = false,
      zmb1bMode = 'PULL', // 'PULL' (regional target stock) or 'PUSH' (shipment qty per cycle)
      coldSpellActive = false,
      coldSpellCombo = 'T01_T02', // 1:T01+T02, 2:T01+T03, 3:T01+T05, 4:T02+T03, 5:T02+T05, 6:T03+T05
      carbonDecreeActive = false,
      supplierDisruptionActive = false,
      impactedSupplier = 'V04',
      hubGridlockActive = false,
      flashFloodActive = false,
      flashFloodWarehouse = '03',
      directSalesOrdersPerDay = 0,
      regionalSalesOrdersPerDay = 32,
      transfersPerDay = 3,
      skuInventoryState = {}
    } = params;

    const effectiveCarbonTax = baseCarbonTax + (carbonDecreeActive ? 0.20 : 0);
    const coldSpellSkus = coldSpellCombo.split('_');

    // Recommended ZMB1B delivery frequency (days) & Use 03 switch
    const recommendedZmb1bFreqDays = (hubGridlockActive || carbonDecreeActive || effectiveCarbonTax >= 0.30) ? 3 : 2;
    const recommendedUse03 = (roundNumber === 1 && dayInRound === 1 && !hubGridlockActive && !carbonDecreeActive);
    const isEndgameLiquidation = isFinalRound && dayInRound >= 8;

    // First pass: calculate real current stock sum across 6 SKUs
    const sumSkuCurrentStock = LOGISTICS_PRESET3_SKUS.reduce((acc, sku) => {
      const st = skuInventoryState[sku.code] || {};
      const cur = st.currentStockAndOpenPo !== undefined ? st.currentStockAndOpenPo : Math.round(sku.initialStock * 0.5);
      return acc + cur;
    }, 0);

    let skuAnalysis = LOGISTICS_PRESET3_SKUS.map(sku => {
      const isColdHit = coldSpellActive && coldSpellSkus.includes(sku.code);
      const coldExtraUnitCo2 = isColdHit ? 5.0 : 0.0;

      // Preset 3 V04 parameters: 1.2 kg/unit, 100 kg/PO, €1,000/PO
      const v04UnitCo2 = 1.2 + coldExtraUnitCo2 + (supplierDisruptionActive && impactedSupplier === 'V04' ? 2.50 : 0);
      const v04PoCo2 = 100 + (supplierDisruptionActive && impactedSupplier === 'V04' ? 200 : 0) + (hubGridlockActive ? 100 : 0);
      const v04PoFixedFee = 1000;

      // Preset 3 V08 parameters: 0.8 kg/unit, 400 kg/PO, €600/PO
      const v08UnitCo2 = 0.8 + coldExtraUnitCo2 + (supplierDisruptionActive && impactedSupplier === 'V08' ? 2.50 : 0);
      const v08PoCo2 = 400 + (supplierDisruptionActive && impactedSupplier === 'V08' ? 200 : 0) + (hubGridlockActive ? 100 : 0);
      const v08PoFixedFee = 600;

      const safeLot = Math.max(50, orderLotSizePerPo);
      const v04LandedUnitCost = sku.costV04 + (v04UnitCo2 * effectiveCarbonTax) + (v04PoFixedFee + v04PoCo2 * effectiveCarbonTax) / safeLot;
      const v08LandedUnitCost = sku.costV08 + (v08UnitCo2 * effectiveCarbonTax) + (v08PoFixedFee + v08PoCo2 * effectiveCarbonTax) / safeLot;

      const recommendedVendor = v04LandedUnitCost <= v08LandedUnitCost ? 'V04' : 'V08';
      const minLandedCost = Math.min(v04LandedUnitCost, v08LandedUnitCost);
      const savingsPerUnit = Math.abs(v08LandedUnitCost - v04LandedUnitCost);

      // Break-even Lot Size Q* where TC_V04(Q*) == TC_V08(Q*)
      const unitVarDiff = (sku.costV08 + v08UnitCo2 * effectiveCarbonTax) - (sku.costV04 + v04UnitCo2 * effectiveCarbonTax);
      const fixedPoDiff = (v04PoFixedFee + v04PoCo2 * effectiveCarbonTax) - (v08PoFixedFee + v08PoCo2 * effectiveCarbonTax);
      const breakEvenLotSize = unitVarDiff > 0 ? Math.max(0, Math.round(fixedPoDiff / unitVarDiff)) : Infinity;

      // Regional ZVA05 Split (Area: NO, SO, WE) -> ZMB1B allocation
      const st = skuInventoryState[sku.code] || {};
      const sNO = st.salesNO !== undefined ? st.salesNO : 100;
      const sSO = st.salesSO !== undefined ? st.salesSO : 100;
      const sWE = st.salesWE !== undefined ? st.salesWE : 100;
      const totRegSales = Math.max(1, sNO + sSO + sWE);
      const shareNO = sNO / totRegSales;
      const shareSO = sSO / totRegSales;
      const shareWE = sWE / totRegSales;

      const currentStockAndOpenPo = st.currentStockAndOpenPo !== undefined ? st.currentStockAndOpenPo : Math.round(sku.initialStock * 0.5);
      const dailySalesRate = st.dailySalesRate !== undefined ? st.dailySalesRate : Math.round(sku.defaultTarget / 5);

      // Effective stock after Flash Flood (if active)
      let effectiveStock = currentStockAndOpenPo;
      let orderNote = '';
      if (autoOrderCalc && flashFloodActive) {
        if (flashFloodWarehouse === '03') {
          effectiveStock = Math.round(currentStockAndOpenPo * 0.60);
          orderNote = 'Bù lũ kho 03';
        } else if (flashFloodWarehouse === '03N') {
          effectiveStock = Math.round(currentStockAndOpenPo * (1 - shareNO * 0.85));
          orderNote = 'Bù lũ 03N';
        } else if (flashFloodWarehouse === '03S') {
          effectiveStock = Math.round(currentStockAndOpenPo * (1 - shareSO * 0.85));
          orderNote = 'Bù lũ 03S';
        } else if (flashFloodWarehouse === '03W') {
          effectiveStock = Math.round(currentStockAndOpenPo * (1 - shareWE * 0.85));
          orderNote = 'Bù lũ 03W';
        }
      }

      // Dynamic Retail Price on DC 16 (Retail Stores) via Amoroso-Robinson with true Dairy elasticity (epsilon ~ 6.2 - 7.1)
      const regionalOrderCo2CostPerUnit = (75 * effectiveCarbonTax) / 25;
      const fullEffectiveMarginalCost = minLandedCost + regionalOrderCo2CostPerUnit;
      const optimalPriceDC16 = fullEffectiveMarginalCost * (sku.elasticity / (sku.elasticity - 1));
      let baseRecPrice = optimalPriceDC16;

      const daysOfStockOnHand = dailySalesRate > 0 ? (effectiveStock / dailySalesRate) : 3;
      let priceActionNote = 'Tối ưu Lerner (DC 16)';
      if (effectiveStock <= 0 || daysOfStockOnHand < 1.2) {
        baseRecPrice *= 1.055; // Page 19: Short-term price increase to prevent stockout
        priceActionNote = 'Tăng giá chống đứt hàng';
      } else if (daysOfStockOnHand > 5.5) {
        baseRecPrice *= 0.965; // Gently accelerate inventory turnover without selling below cost
        priceActionNote = 'Giảm nhẹ xả tồn';
      }

      const recommendedPriceDC16 = Number(Math.min(sku.initialPrice * 1.22, Math.max(fullEffectiveMarginalCost * 1.09, baseRecPrice)).toFixed(2));
      const netProfitPerUnit = Number((recommendedPriceDC16 - fullEffectiveMarginalCost).toFixed(2));

      // Dynamic coverage days reaction to V08 (1-4d lead time), Hub Gridlock, and Endgame Liquidation
      let effectiveCoverageDays = isEndgameLiquidation ? 0 : Math.max(0, coverageDays);
      if (autoOrderCalc && effectiveCoverageDays > 0) {
        if (recommendedVendor === 'V08') {
          effectiveCoverageDays += 2;
          orderNote = orderNote ? `${orderNote} + V08(+2d)` : 'V08 Lead 1-4d (+2d)';
        }
        if (hubGridlockActive) {
          effectiveCoverageDays += 1;
          orderNote = orderNote ? `${orderNote} + Gom PO(+1d)` : 'Gom PO (+1d)';
        }
      } else if (isEndgameLiquidation) {
        orderNote = 'Xả kho cuối trận (AAA+)';
      }

      let desiredOrderQty;
      let md61TargetToEnter;
      if (autoOrderCalc) {
        const desiredTarget = Math.round(dailySalesRate * effectiveCoverageDays);
        desiredOrderQty = Math.max(0, desiredTarget - effectiveStock);
        md61TargetToEnter = effectiveStock + desiredOrderQty;
      } else {
        desiredOrderQty = st.desiredOrderQty !== undefined ? Math.max(0, st.desiredOrderQty) : Math.max(0, Math.round(sku.defaultTarget - currentStockAndOpenPo));
        md61TargetToEnter = Math.max(0, currentStockAndOpenPo + desiredOrderQty);
      }

      return {
        ...sku,
        isColdHit,
        v04UnitCo2: Number(v04UnitCo2.toFixed(2)),
        v08UnitCo2: Number(v08UnitCo2.toFixed(2)),
        v04LandedUnitCost: Number(v04LandedUnitCost.toFixed(2)),
        v08LandedUnitCost: Number(v08LandedUnitCost.toFixed(2)),
        minLandedCost: Number(minLandedCost.toFixed(2)),
        recommendedVendor,
        savingsPerUnit: Number(savingsPerUnit.toFixed(2)),
        breakEvenLotSize,
        recommendedPriceDC16,
        priceActionNote,
        netProfitPerUnit,
        currentStockAndOpenPo,
        effectiveStock,
        dailySalesRate,
        effectiveCoverageDays,
        orderNote,
        desiredOrderQty,
        md61TargetToEnter,
        salesNO: sNO,
        salesSO: sSO,
        salesWE: sWE,
        shareNO,
        shareSO,
        shareWE,
        shareNOPct: Number((shareNO * 100).toFixed(1)),
        shareSOPct: Number((shareSO * 100).toFixed(1)),
        shareWEPct: Number((shareWE * 100).toFixed(1))
      };
    });

    // Optional Auto-Cap 1: Warehouse Capacity Cap at 3,950 units (avoid 4,000-unit warehouse penalty)
    const rawTotalMd61 = skuAnalysis.reduce((acc, s) => acc + s.md61TargetToEnter, 0);
    const rawTotalEffStock = skuAnalysis.reduce((acc, s) => acc + s.effectiveStock, 0);
    const rawTotalOrder = skuAnalysis.reduce((acc, s) => acc + s.desiredOrderQty, 0);
    let wasCappedTo4000 = false;

    if (autoOrderCalc && capWarehouse4000 && rawTotalMd61 > 3950 && rawTotalOrder > 0) {
      wasCappedTo4000 = true;
      const allowedNewOrderTotal = Math.max(0, 3950 - rawTotalEffStock);
      const scale = allowedNewOrderTotal / rawTotalOrder;
      skuAnalysis = skuAnalysis.map(s => {
        const cappedOrder = Math.max(0, Math.floor(s.desiredOrderQty * scale));
        return {
          ...s,
          desiredOrderQty: cappedOrder,
          md61TargetToEnter: s.effectiveStock + cappedOrder
        };
      });
    }

    // Optional Auto-Cap 2: Weizen Bank Cash Overdraft Protection (keep PO cost <= 80% of available Cash)
    let wasCappedByCash = false;
    const rawPoCost = skuAnalysis.reduce((acc, s) => {
      const p = s.recommendedVendor === 'V04' ? s.costV04 : s.costV08;
      return acc + s.desiredOrderQty * p;
    }, 0);
    const safeCashBudget = Math.max(0, availableCash * 0.82 - 1000);
    if (autoOrderCalc && capCashSafety && rawPoCost > safeCashBudget && rawPoCost > 0) {
      wasCappedByCash = true;
      const cashScale = safeCashBudget / rawPoCost;
      skuAnalysis = skuAnalysis.map(s => {
        const cappedOrder = Math.max(0, Math.floor(s.desiredOrderQty * cashScale));
        return {
          ...s,
          desiredOrderQty: cappedOrder,
          md61TargetToEnter: s.effectiveStock + cappedOrder
        };
      });
    }

    // Finalize ZMB1B regional splits (PULL target vs PUSH shipment qty) and totals
    let totalMd61TargetUnits = 0;
    let totalPoCashNeeded = 0;
    let totalNewOrderUnits = 0;

    skuAnalysis = skuAnalysis.map(s => {
      // In PULL mode: regional target inventory (~82% of total target distributed across 03N/03S/03W, keeping ~18% buffer at 03)
      // In PUSH mode: exact shipment quantity per transfer cycle = dailySalesRate * recommendedZmb1bFreqDays * regionalShare
      const regionalPool = zmb1bMode === 'PUSH'
        ? Math.round(s.dailySalesRate * recommendedZmb1bFreqDays)
        : Math.round(s.md61TargetToEnter * 0.85);

      const zmb1bTargetNO = Math.round(regionalPool * s.shareNO);
      const zmb1bTargetSO = Math.round(regionalPool * s.shareSO);
      const zmb1bTargetWE = Math.max(0, regionalPool - zmb1bTargetNO - zmb1bTargetSO);

      totalMd61TargetUnits += s.md61TargetToEnter;
      totalNewOrderUnits += s.desiredOrderQty;
      const chosenUnitPrice = s.recommendedVendor === 'V04' ? s.costV04 : s.costV08;
      totalPoCashNeeded += s.desiredOrderQty * chosenUnitPrice;

      return {
        ...s,
        zmb1bTargetNO,
        zmb1bTargetSO,
        zmb1bTargetWE
      };
    });

    if (totalNewOrderUnits > 0) {
      totalPoCashNeeded += 1000;
    }

    const excessUnits = Math.max(0, totalWarehouseUnits - 4000);
    const excessContainers = Math.ceil(excessUnits / 1000);
    const overstockFeePerDay = excessContainers * 300;
    const overstockCo2PerContainer = coldSpellActive ? 200 : 500;
    const overstockCo2PerDay = excessContainers * overstockCo2PerContainer;

    const energyCo2PerDay = Math.max(0, 100 - (coldSpellActive ? 25 : 0) - (carbonDecreeActive ? 50 : 0));
    const otherOverheadCo2PerDay = 100;

    const transferCo2Each = 50 + (hubGridlockActive ? 100 : 0);
    const transferFeeEach = 100;
    const directSalesCo2Each = 300 + (hubGridlockActive ? 300 : 0);
    const directSalesFeeEach = 350;
    const regionalSalesCo2Each = 75;

    const dailyLogisticsCo2 =
      overstockCo2PerDay +
      energyCo2PerDay +
      otherOverheadCo2PerDay +
      (transfersPerDay * transferCo2Each) +
      (directSalesOrdersPerDay * directSalesCo2Each) +
      (regionalSalesOrdersPerDay * regionalSalesCo2Each);

    const dailyCarbonTaxEur = dailyLogisticsCo2 * effectiveCarbonTax;
    const dailyTransportAndStorageFeesEur =
      overstockFeePerDay +
      (transfersPerDay * transferFeeEach) +
      (directSalesOrdersPerDay * directSalesFeeEach);

    const lossPerDirectSaleOrder = directSalesFeeEach + (directSalesCo2Each - regionalSalesCo2Each) * effectiveCarbonTax;

    return {
      effectiveCarbonTax: Number(effectiveCarbonTax.toFixed(2)),
      skuAnalysis,
      sumSkuCurrentStock,
      totalMd61TargetUnits,
      totalNewOrderUnits,
      totalPoCashNeeded: Math.round(totalPoCashNeeded),
      wasCappedTo4000,
      wasCappedByCash,
      recommendedZmb1bFreqDays,
      recommendedUse03,
      isEndgameLiquidation,
      excessUnits,
      overstockFeePerDay,
      overstockCo2PerDay,
      dailyLogisticsCo2: Math.round(dailyLogisticsCo2),
      dailyCarbonTaxEur: Math.round(dailyCarbonTaxEur),
      dailyTransportAndStorageFeesEur: Math.round(dailyTransportAndStorageFeesEur),
      lossPerDirectSaleOrder: Number(lossPerDirectSaleOrder.toFixed(2))
    };
  }

  /**
   * 2. DAIRY DC 16 EMPIRICAL PRICE ELASTICITY & VK32 OPTIMAL PRICING SOLVER
   */
  function solveDairyDc16Pricing(input) {
    const {
      skuCode = 'T01',
      landedCogs = 24.75,
      prevPrice = 27.50,
      prevQty = 310,
      currPrice = 28.40,
      currQty = 275,
      inventoryRemaining = 420
    } = input;

    const skuInfo = LOGISTICS_PRESET3_SKUS.find(s => s.code === skuCode) || LOGISTICS_PRESET3_SKUS[0];
    const isStockout = inventoryRemaining <= 0;
    const estimatedTrueCurrQty = isStockout ? Math.round(currQty * 1.28) : currQty;

    // 1. Empirical Arc Price Elasticity
    let empiricalElasticity = null;
    const priceDiff = currPrice - prevPrice;
    if (Math.abs(priceDiff) >= 0.15 && prevQty > 0 && estimatedTrueCurrQty > 0) {
      const pctQtyChange = (estimatedTrueCurrQty - prevQty) / ((prevQty + estimatedTrueCurrQty) / 2);
      const pctPriceChange = priceDiff / ((prevPrice + currPrice) / 2);
      const rawElasticity = -(pctQtyChange / pctPriceChange);
      if (rawElasticity > 0.6 && rawElasticity < 15) {
        empiricalElasticity = rawElasticity;
      }
    }

    // 2. Blend with Dairy SKU structural elasticity on DC 16
    const relativePriceRatio = currPrice / Math.max(1, skuInfo.initialPrice * 1.08);
    const modelElasticity = skuInfo.elasticity * Math.pow(relativePriceRatio, 1.15);
    const effectiveElasticity = (empiricalElasticity !== null && !isStockout)
      ? (0.55 * empiricalElasticity + 0.45 * modelElasticity)
      : modelElasticity;

    const clampedElasticity = Math.max(2.50, Math.min(14.0, effectiveElasticity));

    // 3. Amoroso-Robinson / Lerner Optimal Price & MNL Best-Response Search
    const lernerOptimalPrice = landedCogs * (clampedElasticity / (clampedElasticity - 1));
    const priceCeiling = skuInfo.initialPrice * 1.24;

    let bestPrice = currPrice;
    let maxExpectedProfit = -Infinity;
    let expectedQtyAtOptimal = estimatedTrueCurrQty;

    const beta = clampedElasticity / Math.max(1, currPrice);
    const refPrice = skuInfo.initialPrice * 1.08;
    const currentShareProxy = Math.exp(-beta * (currPrice - refPrice));

    for (let p = Math.max(landedCogs * 1.05, skuInfo.initialPrice * 0.92); p <= priceCeiling; p += 0.10) {
      const ceilingPenalty = p > skuInfo.initialPrice * 1.15
        ? Math.exp(-2.5 * Math.pow((p - skuInfo.initialPrice * 1.15) / (priceCeiling - skuInfo.initialPrice * 1.15 + 0.05), 2))
        : 1.0;
      const relAttractiveness = Math.exp(-beta * (p - refPrice)) * ceilingPenalty;
      const predictedQty = estimatedTrueCurrQty * (relAttractiveness / Math.max(1e-6, currentShareProxy));
      const cappedQty = Math.min(predictedQty, estimatedTrueCurrQty * 2.2 + 120);
      const profit = (p - landedCogs) * cappedQty;

      if (profit > maxExpectedProfit) {
        maxExpectedProfit = profit;
        bestPrice = p;
        expectedQtyAtOptimal = Math.round(cappedQty);
      }
    }

    let recommendedPrice = 0.65 * bestPrice + 0.35 * Math.min(priceCeiling, lernerOptimalPrice);
    if (isStockout) {
      recommendedPrice = Math.max(recommendedPrice, currPrice * 1.07);
    }
    recommendedPrice = Math.min(priceCeiling, Math.max(landedCogs * 1.06, Number(recommendedPrice.toFixed(2))));

    const currentDailyProfit = (currPrice - landedCogs) * currQty;
    const projectedOptimalProfit = (recommendedPrice - landedCogs) * expectedQtyAtOptimal;
    const profitGainPerDay = Math.max(0, projectedOptimalProfit - currentDailyProfit);
    const unitMargin = recommendedPrice - landedCogs;
    const marginPct = (unitMargin / recommendedPrice) * 100;

    let actionTag = 'GIỮ GIÁ';
    let actionColor = '#3b82f6';
    if (recommendedPrice - currPrice >= 0.35) {
      actionTag = isStockout ? 'TĂNG GIÁ MẠNH (CHỐNG ĐỨT HÀNG)' : 'TĂNG GIÁ TỐI ƯU BIÊN LÃI';
      actionColor = '#10b981';
    } else if (currPrice - recommendedPrice >= 0.35) {
      actionTag = 'GIẢM GIÁ XẢ TỒN KHO';
      actionColor = '#f59e0b';
    }

    return {
      skuCode,
      skuName: skuInfo.name,
      landedCogs: Number(landedCogs.toFixed(2)),
      currPrice,
      currQty,
      isStockout,
      effectiveElasticity: Number(clampedElasticity.toFixed(2)),
      priceCeiling: Number(priceCeiling.toFixed(2)),
      recommendedPrice,
      priceDelta: Number((recommendedPrice - currPrice).toFixed(2)),
      expectedQtyAtOptimal,
      unitMargin: Number(unitMargin.toFixed(2)),
      marginPct: Number(marginPct.toFixed(1)),
      currentDailyProfit: Math.round(currentDailyProfit),
      projectedOptimalProfit: Math.round(projectedOptimalProfit),
      profitGainPerDay: Math.round(profitGainPerDay),
      actionTag,
      actionColor
    };
  }

  /**
   * 3. CREDIT RATING & COMPANY VALUATION ENGINE (LOGISTICS GAME)
   */
  function lookupCreditRating(debtLoading) {
    for (let i = 0; i < CREDIT_RATING_TABLE.length; i++) {
      if (debtLoading >= CREDIT_RATING_TABLE[i].minDebtLoading) {
        const current = CREDIT_RATING_TABLE[i];
        const nextBetter = i > 0 ? CREDIT_RATING_TABLE[i - 1] : null;
        const nextWorse = i < CREDIT_RATING_TABLE.length - 1 ? CREDIT_RATING_TABLE[i + 1] : null;
        return {
          ...current,
          nextBetter,
          nextWorse,
          amountToNextTier: nextBetter ? Math.max(0, nextBetter.minDebtLoading - debtLoading) : 0,
          bufferBeforeDrop: current.minDebtLoading !== -Infinity ? (debtLoading - current.minDebtLoading) : Infinity
        };
      }
    }
    return CREDIT_RATING_TABLE[CREDIT_RATING_TABLE.length - 1];
  }

  function calculateCompanyValuation(params) {
    const {
      currentProfit = 0,
      elapsedSteps = 10,
      totalRounds = 8, // ERPsim Logistics fiscal year = 80 days (8 rounds x 10 days) -> R1=x80, R2=x40, R3=x26.67, R4=x20 at AAA+
      stepsPerRound = 10,
      marketRiskRate = 0.07,
      cash = 250000,
      accountsReceivable = 180000,
      bankLoans = 0,
      accountsPayable = 150000,
      inventoryValue = 135000
    } = params;

    const totalGameSteps = Math.max(1, totalRounds * stepsPerRound);
    const safeElapsed = Math.max(1, elapsedSteps);

    const debtLoading = (cash + accountsReceivable) - (Math.abs(bankLoans) + Math.abs(accountsPayable));
    const creditInfo = lookupCreditRating(debtLoading);
    const discountRate = marketRiskRate + creditInfo.riskRate;

    const projectedFullGameProfit = (currentProfit / safeElapsed) * totalGameSteps;
    const companyValuation = projectedFullGameProfit / discountRate;

    const aaaDiscountRate = marketRiskRate + 0.03;
    const potentialAAAValuation = projectedFullGameProfit / aaaDiscountRate;
    const valuationLostToCreditRisk = potentialAAAValuation - companyValuation;

    let nextTierValuationGain = 0;
    if (creditInfo.nextBetter) {
      const nextDiscount = marketRiskRate + creditInfo.nextBetter.riskRate;
      nextTierValuationGain = (projectedFullGameProfit / nextDiscount) - companyValuation;
    }

    return {
      debtLoading,
      creditInfo,
      marketRiskRate,
      discountRate,
      valuationMultiplier: 1 / discountRate,
      projectedFullGameProfit,
      numerator: projectedFullGameProfit,
      companyValuation,
      potentialAAAValuation,
      valuationLostToCreditRisk,
      nextTierValuationGain,
      amountNeededForAAA: Math.max(0, 0 - debtLoading),
      cashBuffer: cash,
      inventoryValue
    };
  }

  /**
   * 4. SAP ZVA05 / ZVC2 / ZMB52 TSV & CSV PARSER
   */
  function parseSapTableText(rawText) {
    if (!rawText || !rawText.trim()) return [];
    const lines = rawText.trim().split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('---'));
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    let delimiter = '\t';
    if (headerLine.includes('|')) delimiter = '|';
    else if (headerLine.includes('\t')) delimiter = '\t';
    else if (headerLine.includes(';')) delimiter = ';';
    else if (headerLine.includes(',')) delimiter = ',';

    const cleanCell = c => c.trim().replace(/^"|"$/g, '');
    const headers = headerLine.split(delimiter).map(cleanCell).filter(Boolean);

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(cleanCell);
      if (cols.length < 2) continue;
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] !== undefined ? cols[idx] : '';
      });
      records.push(obj);
    }
    return { headers, records };
  }

  return {
    CREDIT_RATING_TABLE,
    LOGISTICS_PRESET3_SKUS,
    LOGISTICS_DISRUPTORS,
    lookupCreditRating,
    calculateCompanyValuation,
    solveLogisticsSustainabilityPreset3,
    solveDairyDc16Pricing,
    parseSapTableText
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ERPsimEngine;
}
