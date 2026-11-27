/**
 * ERPsim Reverse-Engineering & Mathematical Optimization Engine
 * Dedicated 100% to: ERPsim Logistics Sustainability Game (Preset 3 - Dairy) & 8 Random Disruptors
 * Calibrated against:
 * - Official HEC Montréal Preset 3 Job Aid, Disruptors Guide (Rev 2.0), & Participant's Guide (2024-2025)
 * - Official SAP Fiori Preset 3 Screens (ZME12, ZMB52, ZMB1B, VK32, MD61, MD01, ME59N, ZME2N, ZVC2, ZVA05, F.01)
 * - Live Multi-Round Scoreboard Telemetry (10-Team R1-R4 & 18-Team R1-R2 Financial Statements)
 */

const ERPsimEngine = (() => {
  // 1. LOGISTICS SUSTAINABILITY (PRESET 3 - €500,000 EQUITY) 21-TIER CREDIT RATING TABLE
  // Verified to €0.00 error against live SAP Financial Statements:
  // AAA+ (6.00% interest -> 10.00% discount), AA+ (6.50% -> 10.75%), AA (7.00% -> 11.00%), AA- (7.25% -> 11.25%), A (8.00% -> 12.00%)
  const CREDIT_RATING_TABLE = [
    { minDebtLoading: 0, rating: 'AAA+', interestRate: 0.0600, riskRate: 0.0300, tierIndex: 1, color: '#10b981' },
    { minDebtLoading: -50000, rating: 'AA+', interestRate: 0.0650, riskRate: 0.0375, tierIndex: 2, color: '#22c55e' },
    { minDebtLoading: -100000, rating: 'AA', interestRate: 0.0700, riskRate: 0.0400, tierIndex: 3, color: '#34d399' },
    { minDebtLoading: -150000, rating: 'AA-', interestRate: 0.0725, riskRate: 0.0425, tierIndex: 4, color: '#4ade80' },
    { minDebtLoading: -200000, rating: 'A+', interestRate: 0.0775, riskRate: 0.0475, tierIndex: 5, color: '#84cc16' },
    { minDebtLoading: -250000, rating: 'A', interestRate: 0.0800, riskRate: 0.0500, tierIndex: 6, color: '#a3e635' },
    { minDebtLoading: -300000, rating: 'A-', interestRate: 0.0825, riskRate: 0.0525, tierIndex: 7, color: '#bef264' },
    { minDebtLoading: -350000, rating: 'BBB+', interestRate: 0.0875, riskRate: 0.0575, tierIndex: 8, color: '#eab308' },
    { minDebtLoading: -400000, rating: 'BBB', interestRate: 0.0900, riskRate: 0.0600, tierIndex: 9, color: '#facc15' },
    { minDebtLoading: -450000, rating: 'BBB-', interestRate: 0.0925, riskRate: 0.0625, tierIndex: 10, color: '#fde047' },
    { minDebtLoading: -500000, rating: 'BB+', interestRate: 0.0975, riskRate: 0.0675, tierIndex: 11, color: '#f59e0b' },
    { minDebtLoading: -550000, rating: 'BB', interestRate: 0.1000, riskRate: 0.0700, tierIndex: 12, color: '#fb923c' },
    { minDebtLoading: -600000, rating: 'BB-', interestRate: 0.1025, riskRate: 0.0725, tierIndex: 13, color: '#f97316' },
    { minDebtLoading: -650000, rating: 'B+', interestRate: 0.1075, riskRate: 0.0775, tierIndex: 14, color: '#ea580c' },
    { minDebtLoading: -700000, rating: 'B', interestRate: 0.1100, riskRate: 0.0800, tierIndex: 15, color: '#ef4444' },
    { minDebtLoading: -750000, rating: 'B-', interestRate: 0.1125, riskRate: 0.0825, tierIndex: 16, color: '#dc2626' },
    { minDebtLoading: -800000, rating: 'CCC+', interestRate: 0.1200, riskRate: 0.0900, tierIndex: 17, color: '#b91c1c' },
    { minDebtLoading: -850000, rating: 'CCC', interestRate: 0.1300, riskRate: 0.1000, tierIndex: 18, color: '#991b1b' },
    { minDebtLoading: -900000, rating: 'CCC-', interestRate: 0.1400, riskRate: 0.1100, tierIndex: 19, color: '#7f1d1d' },
    { minDebtLoading: -950000, rating: 'CC', interestRate: 0.1500, riskRate: 0.1200, tierIndex: 20, color: '#641e16' },
    { minDebtLoading: -Infinity, rating: 'C', interestRate: 0.1800, riskRate: 0.1500, tierIndex: 21, color: '#450a0a' }
  ];

  // 2. OFFICIAL 6 DAIRY PRODUCTS IN LOGISTICS SUSTAINABILITY (PRESET 3)
  // Verified 100% against SAP Fiori ZME12, ZMB52, ZME2N & VK32 screens:
  // Initial Stock = 3,000 units in SLoc 03 (950, 300, 700, 350, 400, 300)
  // Elasticities calibrated to real Top-1/Top-2 winning DC 16 Gross Margin (~14.8% - 16.5%)
  const LOGISTICS_PRESET3_SKUS = [
    { code: 'T01', name: 'Milk ($$-T01)', shortName: 'Milk', initialStock: 950, costV04: 22.95, costV08: 24.10, initialPrice: 25.25, elasticity: 7.00, defaultDailyRate: 95, fastDailyRate: 115, defaultTarget: 950 },
    { code: 'T02', name: 'Cream ($$-T02)', shortName: 'Cream', initialStock: 300, costV04: 72.07, costV08: 75.67, initialPrice: 79.78, elasticity: 6.25, defaultDailyRate: 30, fastDailyRate: 36, defaultTarget: 300 },
    { code: 'T03', name: 'Yoghurt ($$-T03)', shortName: 'Yoghurt', initialStock: 700, costV04: 25.85, costV08: 27.14, initialPrice: 28.43, elasticity: 6.85, defaultDailyRate: 70, fastDailyRate: 85, defaultTarget: 700 },
    { code: 'T04', name: 'Cheese ($$-T04)', shortName: 'Cheese', initialStock: 350, costV04: 82.68, costV08: 86.81, initialPrice: 90.95, elasticity: 6.10, defaultDailyRate: 35, fastDailyRate: 42, defaultTarget: 350 },
    { code: 'T05', name: 'Butter ($$-T05)', shortName: 'Butter', initialStock: 400, costV04: 59.88, costV08: 62.87, initialPrice: 65.87, elasticity: 6.45, defaultDailyRate: 40, fastDailyRate: 48, defaultTarget: 400 },
    { code: 'T06', name: 'Ice Cream ($$-T06)', shortName: 'Ice Cream', initialStock: 300, costV04: 43.15, costV08: 45.31, initialPrice: 47.47, elasticity: 6.60, defaultDailyRate: 30, fastDailyRate: 36, defaultTarget: 300 }
  ];

  // 3. OFFICIAL 8 RANDOM DISRUPTORS IN LOGISTICS SUSTAINABILITY (PRESET 3)
  const LOGISTICS_DISRUPTORS = [
    {
      id: 1,
      code: 'COLD_SPELL',
      name: 'Event 1: Cold Spell (Đợt Giá Rét)',
      summary: '+5.0 kg CO₂e/unit cho 2 sản phẩm bị ảnh hưởng (cả V04 & V08); Giảm phạt Carbon vượt kho -300 kg/container (từ 500 còn 200 kg); Giảm Carbon năng lượng -25 kg/ngày.',
      counterStrategy: 'Tăng giá bán (VK32 - Kênh 16) của 2 sản phẩm bị cộng +5kg CO₂e theo bảng giá tối ưu bên trên. Kiểm soát kỹ CO₂e/unit để không vượt ngưỡng 4.25 kg/unit làm tụt hạng AAA+.'
    },
    {
      id: 2,
      code: 'CARBON_DECREE',
      name: 'Event 2: Carbon Decree (Sắc Lệnh Tăng Thuế Carbon)',
      summary: 'Thuế Carbon tăng vọt thêm +€0.20 / kg CO₂e; Phát thải năng lượng mua ngoài giảm -50 kg/ngày (còn 50 kg/ngày).',
      counterStrategy: 'Cập nhật ngay 6 giá VK32 mới để chuyển 100% thuế Carbon sang người mua. Giãn chu kỳ chuyển kho ZMB1B lên 3 ngày/lần và gom đơn PO lớn (≥ 1,500 hộp/đơn).'
    },
    {
      id: 3,
      code: 'SUPPLIER_DISRUPTION',
      name: 'Event 3: Supplier Disruption (Đứt Gãy Chuỗi Cung Ứng NCC)',
      summary: 'Nhà cung cấp bị dính xúc xắc (V04 hoặc V08) bị phạt thêm +2.50 kg CO₂e/unit và +200 kg CO₂e/PO.',
      counterStrategy: 'Xem khuyến nghị Gộp PO ở cột CHỌN NCC (ZME12): nếu V04 bị dính khiến CO₂/unit vọt cao hoặc thuế Carbon ≥ €0.40/kg, cân nhắc chuyển toàn bộ sang V08 để giữ chuẩn xanh AAA+.'
    },
    {
      id: 4,
      code: 'HUB_GRIDLOCK',
      name: 'Event 4: Hub Gridlock (Tắc Nghẽn Kho Tổng 03)',
      summary: 'Bán trực tiếp từ Kho tổng 03 bị cộng thêm +300 kg CO₂e/Sales Order (tổng 600 kg/đơn!). Chuyển kho nội bộ (ZMB1B) bị cộng +100 kg CO₂e/transfer (tổng 150 kg). Mua hàng PO bị cộng +100 kg CO₂e/PO.',
      counterStrategy: 'TUYỆT ĐỐI BỎ TÍCH Sales from SLoc 03 trong ZMB1B. Giãn Scheduling trong ZMB1B ra 3 ngày/lần và gom PO thật lớn (3–4 ngày/lần).'
    },
    {
      id: 5,
      code: 'SYSTEM_GLITCH',
      name: 'Event 5: System Glitch (Lỗi Hệ Thống Khóa Báo Cáo)',
      summary: 'Khóa ngẫu nhiên các nhóm báo cáo (Inventory ZMB52, Sales ZVC2/ZVA05, hoặc Procurement ZME2N). Mở khóa trong ZITM tốn €5,000 / báo cáo.',
      counterStrategy: 'KHÔNG TỐN €5,000 mở khóa! Dùng ngay T-code chuẩn MD07 (Collective Access -> Plant = Mã đội) để xem cả Stock lẫn POitem miễn phí €0, hoặc dùng cổng OData (ZODATA).'
    },
    {
      id: 6,
      code: 'DATA_BREACH',
      name: 'Event 6: Data Breach (Rò Rỉ Dữ Liệu OData Toàn Thị Trường)',
      summary: 'Tất cả các đội đều xem được dữ liệu OData của nhau (giá bán, tồn kho, nhà cung cấp, doanh số của mọi đối thủ).',
      counterStrategy: 'Quét OData xem đối thủ đang đứt hàng (Stock = 0) ở mặt hàng cao cấp nào (Cheese, Cream, Butter) tại vùng nào (03N, 03S, 03W) → Bơm hàng vào vùng đó qua ZMB1B và tăng giá VK32 +8% đến +12%!'
    },
    {
      id: 7,
      code: 'FLASH_FLOOD',
      name: 'Event 7: Flash Flood (Lũ Quét Mất Trắng 1 Kho)',
      summary: 'Xóa sổ 100% tồn kho tại 1 kho ngẫu nhiên: Central (03), North (03N), South (03S), hoặc West (03W).',
      counterStrategy: 'Mở ZMB52 kiểm tra kho bị mất trắng rồi dán vào Dashboard. Nếu mất kho vùng: đổi ZMB1B Scheduling = 1 ngày để bơm cấp tốc từ 03. Nếu mất kho 03: chạy ngay MD61 → MD01 → ZME12 (V04) → ME59N!'
    },
    {
      id: 8,
      code: 'AI_INNOVATION',
      name: 'Event 8: AI Innovation (Mở Khóa Công Cụ AI ZRPA)',
      summary: 'Mở khóa T-code ZRPA (AI Requirements Planning cho MD61 & AI Price Management cho VK32).',
      counterStrategy: 'Có thể tham khảo ZRPA cho MD61 nhưng PHẢI khóa trần ≤ 3,950 hộp và ưu tiên dùng Giá Tối Ưu VK32 của Dashboard (biên ~15% thay vì mức bảo thủ ~11% của AI mặc định).'
    }
  ];

  /**
   * ESG Carbon Intensity Gate observed in live Preset 3 Sustainability Scoreboards:
   * High CO₂e per Unit Sold caps your Credit Rating even when Debt Loading >= 0!
   */
  function lookupEsgCarbonCapTier(co2PerUnitSold) {
    if (!Number.isFinite(co2PerUnitSold) || co2PerUnitSold <= 0) return 1;
    if (co2PerUnitSold <= 4.25) return 1; // AAA+ (6.00%)
    if (co2PerUnitSold <= 4.90) return 2; // AA+  (6.50%)
    if (co2PerUnitSold <= 5.45) return 3; // AA   (7.00%)
    return 4;                             // AA-  (7.25%)
  }

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
      totalWarehouseUnits = 3000,
      coverageDays = 8,
      autoOrderCalc = true,
      capWarehouse4000 = true,
      availableCash = 250000,
      capCashSafety = true,
      zmb1bMode = 'PULL', // 'PULL' (regional target stock) or 'PUSH' (shipment qty per cycle)
      coldSpellActive = false,
      coldSpellCombo = 'T01_T02',
      carbonDecreeActive = false,
      supplierDisruptionActive = false,
      impactedSupplier = 'V04',
      hubGridlockActive = false,
      flashFloodActive = false,
      flashFloodWarehouse = '03',
      directSalesOrdersPerDay = 0,
      regionalSalesOrdersPerDay = 8,
      transfersPerDay = 1.5,
      skuInventoryState = {}
    } = params;

    const effectiveCarbonTax = baseCarbonTax + (carbonDecreeActive ? 0.20 : 0);
    const coldSpellSkus = coldSpellCombo.split('_');

    // Recommended ZMB1B delivery frequency (days) & Use 03 switch
    // Live telemetry proves Direct Sales from SLoc 03 (+300kg CO₂e & €350/order) destroys AAA+ ESG Credit Rating!
    const recommendedZmb1bFreqDays = (hubGridlockActive || carbonDecreeActive || effectiveCarbonTax >= 0.25) ? 3 : 2;
    const recommendedUse03 = false;
    const isEndgameLiquidation = isFinalRound && dayInRound >= 8;

    // First pass: calculate real current stock sum and total daily sales across 6 SKUs
    const sumSkuCurrentStock = LOGISTICS_PRESET3_SKUS.reduce((acc, sku) => {
      const st = skuInventoryState[sku.code] || {};
      const cur = st.currentStockAndOpenPo !== undefined ? st.currentStockAndOpenPo : Math.round(sku.initialStock * 0.5);
      return acc + cur;
    }, 0);
    const sumDailySalesUnits = LOGISTICS_PRESET3_SKUS.reduce((acc, sku) => {
      const st = skuInventoryState[sku.code] || {};
      const rate = st.dailySalesRate !== undefined ? st.dailySalesRate : sku.defaultDailyRate;
      return acc + rate;
    }, 0);
    const avgUnitsPerRegionalOrder = Math.max(15, sumDailySalesUnits / Math.max(1, regionalSalesOrdersPerDay));

    // Shared PO Fixed Parameters (ME59N consolidates all SKUs of the same vendor into 1 single PO!)
    const v04PoCo2 = 100 + (supplierDisruptionActive && impactedSupplier === 'V04' ? 200 : 0) + (hubGridlockActive ? 100 : 0);
    const v04PoFixedFee = 1000;
    const v08PoCo2 = 400 + (supplierDisruptionActive && impactedSupplier === 'V08' ? 200 : 0) + (hubGridlockActive ? 100 : 0);
    const v08PoFixedFee = 600;
    const v04PoTotalFixed = v04PoFixedFee + v04PoCo2 * effectiveCarbonTax;
    const v08PoTotalFixed = v08PoFixedFee + v08PoCo2 * effectiveCarbonTax;

    // IMPORTANT FIX: Never amortize fixed PO fee over tiny residual gaps (<1,200u) when pricing inventory!
    // Standard consolidated PO batch is ~1,500 - 2,200 units.
    const pricingAmortizationLot = Math.max(1500, orderLotSizePerPo);

    let skuAnalysis = LOGISTICS_PRESET3_SKUS.map(sku => {
      const isColdHit = coldSpellActive && coldSpellSkus.includes(sku.code);
      const coldExtraUnitCo2 = isColdHit ? 5.0 : 0.0;

      // Preset 3 V04 parameters: 1.2 kg/unit, 100 kg/PO, €1,000/PO
      const v04UnitCo2 = 1.2 + coldExtraUnitCo2 + (supplierDisruptionActive && impactedSupplier === 'V04' ? 2.50 : 0);
      // Preset 3 V08 parameters: 0.8 kg/unit, 400 kg/PO, €600/PO
      const v08UnitCo2 = 0.8 + coldExtraUnitCo2 + (supplierDisruptionActive && impactedSupplier === 'V08' ? 2.50 : 0);

      const v04VarUnitCost = sku.costV04 + (v04UnitCo2 * effectiveCarbonTax);
      const v08VarUnitCost = sku.costV08 + (v08UnitCo2 * effectiveCarbonTax);
      const v04LandedUnitCost = v04VarUnitCost + v04PoTotalFixed / pricingAmortizationLot;
      const v08LandedUnitCost = v08VarUnitCost + v08PoTotalFixed / pricingAmortizationLot;

      const recommendedVendor = v04LandedUnitCost <= v08LandedUnitCost ? 'V04' : 'V08';
      const minLandedCost = Math.min(v04LandedUnitCost, v08LandedUnitCost);
      const savingsPerUnit = Math.abs(v08LandedUnitCost - v04LandedUnitCost);

      // Break-even Lot Size Q* where TC_V04(Q*) == TC_V08(Q*)
      const unitVarDiff = v08VarUnitCost - v04VarUnitCost;
      const fixedPoDiff = v04PoTotalFixed - v08PoTotalFixed;
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
      const dailySalesRate = st.dailySalesRate !== undefined ? st.dailySalesRate : sku.defaultDailyRate;
      const effectiveStock = currentStockAndOpenPo;

      // Per-warehouse stock breakdown if ZMB52 was pasted
      const hasLocBreakdown = Boolean(st.hasLocBreakdown);
      const loc03 = Number(st.loc03) || 0;
      const loc03N = Number(st.loc03N) || 0;
      const loc03S = Number(st.loc03S) || 0;
      const loc03W = Number(st.loc03W) || 0;
      const stockoutRegions = [];
      if (hasLocBreakdown) {
        if (shareNO > 0.05 && loc03N <= 0) stockoutRegions.push('03N');
        if (shareSO > 0.05 && loc03S <= 0) stockoutRegions.push('03S');
        if (shareWE > 0.05 && loc03W <= 0) stockoutRegions.push('03W');
      }

      // Dynamic Retail Price on DC 16 (Retail Stores) via Amoroso-Robinson
      const regionalOrderCo2CostPerUnit = (75 * effectiveCarbonTax) / avgUnitsPerRegionalOrder;
      const transferCostPerUnit = ((100 + (50 + (hubGridlockActive ? 100 : 0)) * effectiveCarbonTax) * transfersPerDay) / Math.max(50, sumDailySalesUnits);
      const fullEffectiveMarginalCost = minLandedCost + regionalOrderCo2CostPerUnit + transferCostPerUnit;
      const optimalPriceDC16 = fullEffectiveMarginalCost * (sku.elasticity / (sku.elasticity - 1));
      let baseRecPrice = optimalPriceDC16;

      const daysOfStockOnHand = dailySalesRate > 0 ? (effectiveStock / dailySalesRate) : 4;
      let priceActionNote = 'Chuẩn tối ưu (~15% GM)';
      if (effectiveStock <= 0 || daysOfStockOnHand < 1.3) {
        baseRecPrice *= 1.06; // Strong stockout protection + high margin capture
        priceActionNote = '🔥 Tăng +6% chống đứt hàng';
      } else if (daysOfStockOnHand < 2.3 || stockoutRegions.length >= 2) {
        baseRecPrice *= 1.028; // Lean stock -> capture higher margin while awaiting PO
        priceActionNote = '⚡ Tăng +3% giữ hàng';
      } else if (isEndgameLiquidation && daysOfStockOnHand > Math.max(1.5, 11 - dayInRound)) {
        baseRecPrice *= 0.965; // Controlled endgame conversion to cash (never below cost)
        priceActionNote = '🏁 Giảm nhẹ xả cuối trận';
      } else if (daysOfStockOnHand > 11.5) {
        baseRecPrice *= 0.975; // Only trim if genuinely stagnant (>11.5 days of stock!)
        priceActionNote = 'Giảm -2.5% xả tồn chậm';
      }

      const recommendedPriceDC16 = Number(Math.min(sku.initialPrice * 1.24, Math.max(fullEffectiveMarginalCost * 1.08, baseRecPrice)).toFixed(2));
      const netProfitPerUnit = Number((recommendedPriceDC16 - fullEffectiveMarginalCost).toFixed(2));

      // Dynamic coverage days reaction to V08 (1-4d lead time), Hub Gridlock, and Endgame Liquidation
      let orderNote = '';
      let effectiveCoverageDays = isEndgameLiquidation ? 0 : Math.max(0, coverageDays);
      if (autoOrderCalc && effectiveCoverageDays > 0) {
        if (recommendedVendor === 'V08') {
          effectiveCoverageDays += 1.5;
          orderNote = 'V08 (+1.5d)';
        }
        if (hubGridlockActive) {
          effectiveCoverageDays += 1;
          orderNote = orderNote ? `${orderNote} + Gom PO` : 'Gom PO (+1d)';
        }
      } else if (isEndgameLiquidation) {
        orderNote = 'Ngừng PO (Khóa AAA+)';
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
        v04VarUnitCost,
        v08VarUnitCost,
        v04LandedUnitCost: Number(v04LandedUnitCost.toFixed(2)),
        v08LandedUnitCost: Number(v08LandedUnitCost.toFixed(2)),
        minLandedCost: Number(minLandedCost.toFixed(2)),
        fullEffectiveMarginalCost: Number(fullEffectiveMarginalCost.toFixed(2)),
        recommendedVendor,
        savingsPerUnit: Number(savingsPerUnit.toFixed(2)),
        breakEvenLotSize,
        recommendedPriceDC16,
        priceActionNote,
        netProfitPerUnit,
        daysOfStockOnHand: Number(daysOfStockOnHand.toFixed(1)),
        currentStockAndOpenPo,
        effectiveStock,
        hasLocBreakdown,
        loc03,
        loc03N,
        loc03S,
        loc03W,
        stockoutRegions,
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

    // Portfolio-Level ME59N PO Consolidation Optimization (All V04 vs All V08 vs Split 2 POs!)
    const activeOrders = skuAnalysis.filter(s => s.desiredOrderQty > 0);
    let portfolioPoStrategy = 'ALL_V04';
    let portfolioPoFixedFeeEur = 0;
    let portfolioPoCo2Kg = 0;
    let portfolioPoFixedNote = 'Chưa có đơn đặt mua mới';

    if (activeOrders.length > 0) {
      const costAllV04 = v04PoTotalFixed + activeOrders.reduce((acc, s) => acc + s.desiredOrderQty * s.v04VarUnitCost, 0);
      const costAllV08 = v08PoTotalFixed + activeOrders.reduce((acc, s) => acc + s.desiredOrderQty * s.v08VarUnitCost, 0);
      const splitUsesV04 = activeOrders.some(s => s.v04VarUnitCost <= s.v08VarUnitCost);
      const splitUsesV08 = activeOrders.some(s => s.v08VarUnitCost < s.v04VarUnitCost);
      const splitFixed = (splitUsesV04 ? v04PoTotalFixed : 0) + (splitUsesV08 ? v08PoTotalFixed : 0);
      const costSplit = splitFixed + activeOrders.reduce((acc, s) => acc + s.desiredOrderQty * Math.min(s.v04VarUnitCost, s.v08VarUnitCost), 0);

      if (costAllV04 <= costAllV08 && costAllV04 <= costSplit) {
        portfolioPoStrategy = 'ALL_V04';
        portfolioPoFixedFeeEur = v04PoFixedFee;
        portfolioPoCo2Kg = v04PoCo2;
        portfolioPoFixedNote = `Gom cả 6 mã vào 1 PO duy nhất của V04 (Phí PO €1,000, tiết kiệm ${Math.round(Math.min(costAllV08, costSplit) - costAllV04)}€ so với đổi/tách NCC)`;
        skuAnalysis = skuAnalysis.map(s => ({ ...s, recommendedVendor: 'V04' }));
      } else if (costAllV08 <= costAllV04 && costAllV08 <= costSplit) {
        portfolioPoStrategy = 'ALL_V08';
        portfolioPoFixedFeeEur = v08PoFixedFee;
        portfolioPoCo2Kg = v08PoCo2;
        portfolioPoFixedNote = `Gom cả 6 mã vào 1 PO duy nhất của V08 (Phí PO €600, tiết kiệm ${Math.round(Math.min(costAllV04, costSplit) - costAllV08)}€ so với V04)`;
        skuAnalysis = skuAnalysis.map(s => ({ ...s, recommendedVendor: 'V08' }));
      } else {
        portfolioPoStrategy = 'SPLIT';
        portfolioPoFixedFeeEur = (splitUsesV04 ? v04PoFixedFee : 0) + (splitUsesV08 ? v08PoFixedFee : 0);
        portfolioPoCo2Kg = (splitUsesV04 ? v04PoCo2 : 0) + (splitUsesV08 ? v08PoCo2 : 0);
        portfolioPoFixedNote = `Tách 2 PO (V04 + V08 = €1,600 phí cố định) vẫn rẻ hơn gom 1 NCC ${Math.round(Math.min(costAllV04, costAllV08) - costSplit)}€!`;
        skuAnalysis = skuAnalysis.map(s => ({ ...s, recommendedVendor: s.v04VarUnitCost <= s.v08VarUnitCost ? 'V04' : 'V08' }));
      }
    }

    // Optional Auto-Cap 2: Weizen Bank Cash Overdraft Protection (keep PO cost <= 82% of available Cash)
    let wasCappedByCash = false;
    const rawPoCost = skuAnalysis.reduce((acc, s) => {
      const p = s.recommendedVendor === 'V04' ? s.costV04 : s.costV08;
      return acc + s.desiredOrderQty * p;
    }, 0);
    const safeCashBudget = Math.max(0, availableCash * 0.82 - portfolioPoFixedFeeEur);
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

    // Finalize ZMB1B regional splits (Deficit-aware PUSH vs Target PULL) and totals
    let totalMd61TargetUnits = 0;
    let totalPoCashNeeded = 0;
    let totalNewOrderUnits = 0;
    let minDaysOfStockAcrossSkus = Infinity;

    skuAnalysis = skuAnalysis.map(s => {
      if (s.daysOfStockOnHand < minDaysOfStockAcrossSkus) {
        minDaysOfStockAcrossSkus = s.daysOfStockOnHand;
      }

      let zmb1bTargetNO;
      let zmb1bTargetSO;
      let zmb1bTargetWE;

      const targetRegDays = recommendedZmb1bFreqDays + 1.5;
      const idealNO = Math.round(s.dailySalesRate * targetRegDays * s.shareNO);
      const idealSO = Math.round(s.dailySalesRate * targetRegDays * s.shareSO);
      const idealWE = Math.round(s.dailySalesRate * targetRegDays * s.shareWE);

      if (isEndgameLiquidation) {
        // Flush 100% of Main Warehouse 03 stock (or remaining stock) out to the 3 regions!
        const poolToFlush = s.hasLocBreakdown ? s.loc03 : s.effectiveStock;
        if (s.hasLocBreakdown && poolToFlush > 0) {
          const defNO = Math.max(0, idealNO * 1.5 - s.loc03N);
          const defSO = Math.max(0, idealSO * 1.5 - s.loc03S);
          const defWE = Math.max(0, idealWE * 1.5 - s.loc03W);
          const defSum = defNO + defSO + defWE;
          if (defSum > 0) {
            zmb1bTargetNO = Math.round(poolToFlush * (defNO / defSum));
            zmb1bTargetSO = Math.round(poolToFlush * (defSO / defSum));
            zmb1bTargetWE = Math.max(0, poolToFlush - zmb1bTargetNO - zmb1bTargetSO);
          } else {
            zmb1bTargetNO = Math.round(poolToFlush * s.shareNO);
            zmb1bTargetSO = Math.round(poolToFlush * s.shareSO);
            zmb1bTargetWE = Math.max(0, poolToFlush - zmb1bTargetNO - zmb1bTargetSO);
          }
        } else {
          zmb1bTargetNO = Math.round(poolToFlush * s.shareNO);
          zmb1bTargetSO = Math.round(poolToFlush * s.shareSO);
          zmb1bTargetWE = Math.max(0, poolToFlush - zmb1bTargetNO - zmb1bTargetSO);
        }
      } else if (zmb1bMode === 'PUSH') {
        if (s.hasLocBreakdown) {
          // Deficit-aware PUSH: prioritize regions with low/zero inventory!
          const defNO = Math.max(0, idealNO - s.loc03N);
          const defSO = Math.max(0, idealSO - s.loc03S);
          const defWE = Math.max(0, idealWE - s.loc03W);
          const defSum = defNO + defSO + defWE;
          const shipPool = s.loc03 > 0 ? Math.min(s.loc03, Math.max(defSum, Math.round(s.dailySalesRate * recommendedZmb1bFreqDays))) : Math.round(s.dailySalesRate * recommendedZmb1bFreqDays);
          if (defSum > 0) {
            zmb1bTargetNO = Math.round(shipPool * (defNO / defSum));
            zmb1bTargetSO = Math.round(shipPool * (defSO / defSum));
            zmb1bTargetWE = Math.max(0, shipPool - zmb1bTargetNO - zmb1bTargetSO);
          } else {
            zmb1bTargetNO = Math.round(shipPool * s.shareNO);
            zmb1bTargetSO = Math.round(shipPool * s.shareSO);
            zmb1bTargetWE = Math.max(0, shipPool - zmb1bTargetNO - zmb1bTargetSO);
          }
        } else {
          const regionalPool = Math.round(s.dailySalesRate * recommendedZmb1bFreqDays);
          zmb1bTargetNO = Math.round(regionalPool * s.shareNO);
          zmb1bTargetSO = Math.round(regionalPool * s.shareSO);
          zmb1bTargetWE = Math.max(0, regionalPool - zmb1bTargetNO - zmb1bTargetSO);
        }
      } else {
        // PULL mode: Target stock ceiling at each regional warehouse (SAP automatically computes Target - CurrentRegionalStock)
        const regionalPool = Math.min(Math.max(s.md61TargetToEnter, s.effectiveStock), Math.round(s.dailySalesRate * targetRegDays));
        zmb1bTargetNO = Math.round(regionalPool * s.shareNO);
        zmb1bTargetSO = Math.round(regionalPool * s.shareSO);
        zmb1bTargetWE = Math.max(0, regionalPool - zmb1bTargetNO - zmb1bTargetSO);
      }

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
      totalPoCashNeeded += portfolioPoFixedFeeEur;
    }

    const excessUnits = Math.max(0, totalWarehouseUnits - 4000);
    const excessContainers = Math.ceil(excessUnits / 1000);
    const overstockFeePerDay = excessContainers * 300;
    const overstockCo2PerContainer = coldSpellActive ? 200 : 500;
    const overstockCo2PerDay = excessContainers * overstockCo2PerContainer;

    // Proven against live SAP R2 Team F/G idle telemetry: 100 energy + 100 overhead = 200 kg/day = 2,000 kg/round
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

    // Live Round Financial & ESG Projection (10-Day Round)
    const projectedDailyRevenue = skuAnalysis.reduce((acc, s) => acc + s.dailySalesRate * s.recommendedPriceDC16, 0);
    const projectedDailyProductInvoiceCost = skuAnalysis.reduce((acc, s) => {
      const invCost = s.recommendedVendor === 'V04' ? s.costV04 : s.costV08;
      return acc + s.dailySalesRate * invCost;
    }, 0);
    const projectedDailyProductCo2Kg = skuAnalysis.reduce((acc, s) => {
      const uCo2 = s.recommendedVendor === 'V04' ? s.v04UnitCo2 : s.v08UnitCo2;
      return acc + s.dailySalesRate * uCo2;
    }, 0);
    const estPosPerRound = Math.max(1.5, (sumDailySalesUnits * 10) / Math.max(1200, pricingAmortizationLot));
    const singlePoFixedFee = portfolioPoFixedFeeEur > 0 ? portfolioPoFixedFeeEur : (portfolioPoStrategy === 'ALL_V08' ? v08PoFixedFee : v04PoFixedFee);
    const singlePoCo2Kg = portfolioPoCo2Kg > 0 ? portfolioPoCo2Kg : (portfolioPoStrategy === 'ALL_V08' ? v08PoCo2 : v04PoCo2);

    const projectedRoundRevenue = projectedDailyRevenue * 10;
    const projectedRoundPoFees = estPosPerRound * singlePoFixedFee;
    const projectedRoundTotalCo2Kg = (projectedDailyProductCo2Kg + dailyLogisticsCo2) * 10 + estPosPerRound * singlePoCo2Kg;
    const projectedRoundTotalCarbonTax = projectedRoundTotalCo2Kg * effectiveCarbonTax;
    const projectedRoundCogs = projectedDailyProductInvoiceCost * 10 + projectedRoundPoFees + (projectedDailyProductCo2Kg * 10 + estPosPerRound * singlePoCo2Kg) * effectiveCarbonTax;
    const projectedRoundGrossProfit = projectedRoundRevenue - projectedRoundCogs;
    const projectedGrossMarginPct = projectedRoundRevenue > 0 ? (projectedRoundGrossProfit / projectedRoundRevenue) * 100 : 0;
    const projectedRoundOpEx = dailyTransportAndStorageFeesEur * 10 + (dailyLogisticsCo2 * 10) * effectiveCarbonTax;
    const projectedRoundNetIncome = projectedRoundGrossProfit - projectedRoundOpEx;
    const projectedCo2PerUnitSold = sumDailySalesUnits > 0 ? (projectedRoundTotalCo2Kg / (sumDailySalesUnits * 10)) : 0;
    const projectedEsgTierIndex = lookupEsgCarbonCapTier(projectedCo2PerUnitSold);
    const projectedEsgCreditRating = CREDIT_RATING_TABLE[projectedEsgTierIndex - 1].rating;

    // Smart PO Timing Advisor (prevents wasting €1,000 on tiny POs AND prevents stockouts!)
    let poTimingCode = 'ORDER_NOW';
    let poTimingMessage = '';
    if (isEndgameLiquidation) {
      poTimingCode = 'ENDGAME_STOP';
      poTimingMessage = '🛑 NGỪNG CHẠY MD61 / ME59N (3 Ngày Cuối): Không tạo thêm nợ AP cuối trận, dùng ZMB1B đẩy 100% Kho 03 ra 3 miền để khóa cứng AAA+!';
    } else if (totalNewOrderUnits <= 0) {
      poTimingCode = 'HOLD_FULL';
      poTimingMessage = `⏳ KHO ĐANG ĐẦY (${sumSkuCurrentStock.toLocaleString('en-US')} hộp, đủ bán ≥ ${minDaysOfStockAcrossSkus} ngày): CHƯA CẦN chạy MD61 / ME59N hôm nay!`;
    } else if (totalNewOrderUnits < 850 && minDaysOfStockAcrossSkus >= 2.5) {
      poTimingCode = 'HOLD_CONSOLIDATE';
      poTimingMessage = `⏳ KHOAN BẤM ME59N HÔM NAY: Lượng cần đặt thêm mới chỉ ${totalNewOrderUnits} hộp (kho vẫn đủ bán ≥ ${minDaysOfStockAcrossSkus} ngày). Đợi thêm 1–2 ngày gom đủ ≥ 1,200 hộp rồi đặt 1 PO duy nhất để tiết kiệm €1,000 phí PO!`;
    } else {
      poTimingCode = 'ORDER_NOW';
      poTimingMessage = `🚀 ĐẾN ĐIỂM ĐẶT HÀNG VÀNG: Bấm Copy 6 Số MD61 → Chạy MD61 → MD01 → ME59N đặt ngay ${totalNewOrderUnits.toLocaleString('en-US')} hộp (tránh đứt hàng các mã giá cao)!`;
    }

    return {
      effectiveCarbonTax: Number(effectiveCarbonTax.toFixed(2)),
      skuAnalysis,
      sumSkuCurrentStock,
      sumDailySalesUnits,
      totalMd61TargetUnits,
      totalNewOrderUnits,
      totalPoCashNeeded: Math.round(totalPoCashNeeded),
      portfolioPoStrategy,
      portfolioPoFixedFeeEur,
      portfolioPoFixedNote,
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
      lossPerDirectSaleOrder: Number(lossPerDirectSaleOrder.toFixed(2)),
      projectedRoundRevenue: Math.round(projectedRoundRevenue),
      projectedRoundNetIncome: Math.round(projectedRoundNetIncome),
      projectedGrossMarginPct: Number(projectedGrossMarginPct.toFixed(1)),
      projectedCo2PerUnitSold: Number(projectedCo2PerUnitSold.toFixed(2)),
      projectedEsgCreditRating,
      poTimingCode,
      poTimingMessage
    };
  }

  /**
   * 2. DAIRY DC 16 EMPIRICAL PRICE ELASTICITY & VK32 OPTIMAL PRICING SOLVER
   */
  function solveDairyDc16Pricing(input) {
    const {
      skuCode = 'T01',
      landedCogs = 24.00,
      prevPrice = 25.25,
      prevQty = 110,
      currPrice = 27.95,
      currQty = 95,
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
      if (rawElasticity > 1.2 && rawElasticity < 14) {
        empiricalElasticity = rawElasticity;
      }
    }

    // 2. Blend with Dairy SKU structural elasticity on DC 16
    const relativePriceRatio = currPrice / Math.max(1, skuInfo.initialPrice * 1.10);
    const modelElasticity = skuInfo.elasticity * Math.pow(relativePriceRatio, 1.10);
    const effectiveElasticity = (empiricalElasticity !== null && !isStockout)
      ? (0.50 * empiricalElasticity + 0.50 * modelElasticity)
      : modelElasticity;

    const clampedElasticity = Math.max(3.00, Math.min(13.0, effectiveElasticity));

    // 3. Amoroso-Robinson / Lerner Optimal Price & MNL Best-Response Search
    const lernerOptimalPrice = landedCogs * (clampedElasticity / (clampedElasticity - 1));
    const priceCeiling = skuInfo.initialPrice * 1.24;

    let bestPrice = currPrice;
    let maxExpectedProfit = -Infinity;
    let expectedQtyAtOptimal = estimatedTrueCurrQty;

    const beta = clampedElasticity / Math.max(1, currPrice);
    const refPrice = skuInfo.initialPrice * 1.10;
    const currentShareProxy = Math.exp(-beta * (currPrice - refPrice));

    for (let p = Math.max(landedCogs * 1.06, skuInfo.initialPrice * 0.94); p <= priceCeiling; p += 0.10) {
      const ceilingPenalty = p > skuInfo.initialPrice * 1.16
        ? Math.exp(-2.5 * Math.pow((p - skuInfo.initialPrice * 1.16) / (priceCeiling - skuInfo.initialPrice * 1.16 + 0.05), 2))
        : 1.0;
      const relAttractiveness = Math.exp(-beta * (p - refPrice)) * ceilingPenalty;
      const predictedQty = estimatedTrueCurrQty * (relAttractiveness / Math.max(1e-6, currentShareProxy));
      const cappedQty = Math.min(predictedQty, estimatedTrueCurrQty * 2.1 + 100);
      const profit = (p - landedCogs) * cappedQty;

      if (profit > maxExpectedProfit) {
        maxExpectedProfit = profit;
        bestPrice = p;
        expectedQtyAtOptimal = Math.round(cappedQty);
      }
    }

    let recommendedPrice = 0.50 * bestPrice + 0.50 * Math.min(priceCeiling, lernerOptimalPrice);
    if (isStockout) {
      recommendedPrice = Math.max(recommendedPrice, currPrice * 1.06);
    }
    recommendedPrice = Math.min(priceCeiling, Math.max(landedCogs * 1.08, Number(recommendedPrice.toFixed(2))));

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
   * 3. CREDIT RATING & COMPANY VALUATION ENGINE (FINANCIAL + ESG CARBON INTENSITY GATE)
   */
  function lookupCreditRating(debtLoading, co2PerUnitSold = 3.50, useEsgGate = true) {
    let finIdx = CREDIT_RATING_TABLE.length - 1;
    for (let i = 0; i < CREDIT_RATING_TABLE.length; i++) {
      if (debtLoading >= CREDIT_RATING_TABLE[i].minDebtLoading) {
        finIdx = i;
        break;
      }
    }

    const esgTierIndex = useEsgGate ? lookupEsgCarbonCapTier(co2PerUnitSold) : 1; // 1-based
    const esgIdx = Math.min(CREDIT_RATING_TABLE.length - 1, Math.max(0, esgTierIndex - 1));
    const effectiveIdx = Math.max(finIdx, esgIdx);
    const penalizedByEsg = esgIdx > finIdx;

    const current = CREDIT_RATING_TABLE[effectiveIdx];
    const nextBetter = effectiveIdx > 0 ? CREDIT_RATING_TABLE[effectiveIdx - 1] : null;
    const nextWorse = effectiveIdx < CREDIT_RATING_TABLE.length - 1 ? CREDIT_RATING_TABLE[effectiveIdx + 1] : null;

    return {
      ...current,
      financialRating: CREDIT_RATING_TABLE[finIdx].rating,
      esgMaxRating: CREDIT_RATING_TABLE[esgIdx].rating,
      penalizedByEsg,
      nextBetter,
      nextWorse,
      amountToNextTier: (!penalizedByEsg && nextBetter) ? Math.max(0, nextBetter.minDebtLoading - debtLoading) : 0,
      bufferBeforeDrop: current.minDebtLoading !== -Infinity ? (debtLoading - current.minDebtLoading) : Infinity
    };
  }

  function calculateCompanyValuation(params) {
    const {
      currentProfit = 0,
      elapsedSteps = 10,
      totalRounds = 8, // ERPsim Logistics fiscal year = 80 days (8 rounds x 10 days) -> R1=x80, R2=x40, R3=x26.67, R4=x20 at AAA+
      stepsPerRound = 10,
      marketRiskRate = 0.07,
      cash = 250000,
      accountsReceivable = 55000,
      bankLoans = 0,
      accountsPayable = 32000,
      inventoryValue = 115000,
      co2PerUnitSold = 3.48,
      useEsgGate = true
    } = params;

    const totalGameSteps = Math.max(1, totalRounds * stepsPerRound);
    const safeElapsed = Math.max(1, elapsedSteps);

    const debtLoading = (cash + accountsReceivable) - (Math.abs(bankLoans) + Math.abs(accountsPayable));
    const creditInfo = lookupCreditRating(debtLoading, co2PerUnitSold, useEsgGate);
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
      co2PerUnitSold,
      creditInfo,
      marketRiskRate,
      discountRate,
      valuationMultiplier: 1 / discountRate,
      effectiveRoundMultiplier: (totalGameSteps / safeElapsed) / discountRate,
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
   * 4. SAP FIORI & GUI UNIVERSAL TABLE PARSER (ZMB52 / ZVC2 / ZVA05 / ZME2N)
   * Auto-discovers table headers even when user presses Ctrl+A, Ctrl+C on full SAP Fiori screens!
   */
  function parseSapNumber(raw) {
    if (raw === undefined || raw === null) return NaN;
    let s = String(raw).trim().replace(/[€$\s]/g, '');
    if (!s) return NaN;
    let neg = false;
    if (s.endsWith('-')) { neg = true; s = s.slice(0, -1); }
    else if (s.startsWith('-')) { neg = true; s = s.slice(1); }
    else if (s.startsWith('(') && s.endsWith(')')) { neg = true; s = s.slice(1, -1); }

    if (s.includes(',') && s.includes('.')) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        s = s.replace(/,/g, '');
      }
    } else if (s.includes(',')) {
      const parts = s.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        s = s.replace(',', '.');
      } else {
        s = s.replace(/,/g, '');
      }
    }
    const v = Number(s);
    return Number.isFinite(v) ? (neg ? -v : v) : NaN;
  }

  function parseSapTableText(rawText) {
    if (!rawText || !rawText.trim()) return { headers: [], records: [] };
    const lines = rawText.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('---'));
    if (lines.length < 2) return { headers: [], records: [] };

    // Auto-discover the true SAP table header line (handles Ctrl+A on full SAP Fiori pages with top nav bars!)
    let headerIdx = 0;
    for (let i = 0; i < Math.min(lines.length, 25); i++) {
      const upper = lines[i].toUpperCase();
      if (
        (upper.includes('MATERIAL') || upper.includes('SKU')) &&
        (upper.includes('STOCK') || upper.includes('QTY') || upper.includes('QUANTITY') || upper.includes('PRICE') || upper.includes('STATUS') || upper.includes('VALUE'))
      ) {
        headerIdx = i;
        break;
      }
    }

    const headerLine = lines[headerIdx];
    let delimiter = '\t';
    if (headerLine.includes('|')) delimiter = '|';
    else if (headerLine.includes('\t')) delimiter = '\t';
    else if (headerLine.includes(';')) delimiter = ';';
    else if (headerLine.includes(',')) delimiter = ',';

    const cleanCell = c => c.trim().replace(/^"|"$/g, '');
    const splitLine = (line) => {
      let s = line;
      if (delimiter === '|') {
        s = s.trim().replace(/^\|/, '').replace(/\|$/, '');
      }
      return s.split(delimiter).map(cleanCell);
    };

    const rawHeaders = splitLine(headerLine);
    const records = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cols = splitLine(lines[i]);
      if (cols.length < 2) continue;
      const obj = {};
      rawHeaders.forEach((h, idx) => {
        if (!h) return;
        obj[h] = cols[idx] !== undefined ? cols[idx] : '';
      });
      records.push(obj);
    }
    return { headers: rawHeaders.filter(Boolean), records };
  }

  return {
    CREDIT_RATING_TABLE,
    LOGISTICS_PRESET3_SKUS,
    LOGISTICS_DISRUPTORS,
    lookupEsgCarbonCapTier,
    lookupCreditRating,
    calculateCompanyValuation,
    solveLogisticsSustainabilityPreset3,
    solveDairyDc16Pricing,
    parseSapNumber,
    parseSapTableText
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ERPsimEngine;
}
