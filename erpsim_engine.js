/**
 * ERPsim Reverse-Engineering & Mathematical Optimization Engine
 * Based on HEC Montréal ERPsim (Jacques Robert & Pierre-Majorique Léger)
 * Covers: Company Valuation, 21-Tier Credit Rating, Multinomial Logit (MNL) Demand Reverse-Engineering,
 * Amoroso-Robinson / Lerner Optimal Pricing (VK32), Regional Preference Deconvolution (ZVC2),
 * Concave Marketing Allocation (ZADS), Lean Manufacturing Setup Time (478000), & Carbon Penalty.
 */

const ERPsimEngine = (() => {
  // 1. OFFICIAL 21-TIER CREDIT RATING & COMPANY RISK RATE TABLE
  const CREDIT_RATING_TABLE = [
    { minDebtLoading: 0,         rating: 'AAA+', riskRate: 0.0300, tierIndex: 1,  color: '#10b981' },
    { minDebtLoading: -1000000,  rating: 'AA+',  riskRate: 0.0375, tierIndex: 2,  color: '#22c55e' },
    { minDebtLoading: -2000000,  rating: 'AA',   riskRate: 0.0400, tierIndex: 3,  color: '#34d399' },
    { minDebtLoading: -3000000,  rating: 'AA-',  riskRate: 0.0425, tierIndex: 4,  color: '#4ade80' },
    { minDebtLoading: -4000000,  rating: 'A+',   riskRate: 0.0475, tierIndex: 5,  color: '#84cc16' },
    { minDebtLoading: -5000000,  rating: 'A',    riskRate: 0.0500, tierIndex: 6,  color: '#a3e635' },
    { minDebtLoading: -6000000,  rating: 'A-',   riskRate: 0.0525, tierIndex: 7,  color: '#bef264' },
    { minDebtLoading: -7000000,  rating: 'BBB+', riskRate: 0.0575, tierIndex: 8,  color: '#eab308' },
    { minDebtLoading: -8000000,  rating: 'BBB',  riskRate: 0.0600, tierIndex: 9,  color: '#facc15' },
    { minDebtLoading: -9000000,  rating: 'BBB-', riskRate: 0.0625, tierIndex: 10, color: '#fde047' },
    { minDebtLoading: -10000000, rating: 'BB+',  riskRate: 0.0675, tierIndex: 11, color: '#f59e0b' },
    { minDebtLoading: -11000000, rating: 'BB',   riskRate: 0.0700, tierIndex: 12, color: '#fb923c' },
    { minDebtLoading: -12000000, rating: 'BB-',  riskRate: 0.0725, tierIndex: 13, color: '#f97316' },
    { minDebtLoading: -13000000, rating: 'B+',   riskRate: 0.0775, tierIndex: 14, color: '#ea580c' },
    { minDebtLoading: -14000000, rating: 'B',    riskRate: 0.0800, tierIndex: 15, color: '#ef4444' },
    { minDebtLoading: -15000000, rating: 'B-',   riskRate: 0.0825, tierIndex: 16, color: '#dc2626' },
    { minDebtLoading: -16000000, rating: 'CCC+', riskRate: 0.0900, tierIndex: 17, color: '#b91c1c' },
    { minDebtLoading: -17000000, rating: 'CCC',  riskRate: 0.1000, tierIndex: 18, color: '#991b1b' },
    { minDebtLoading: -18000000, rating: 'CCC-', riskRate: 0.1100, tierIndex: 19, color: '#7f1d1d' },
    { minDebtLoading: -19000000, rating: 'CC',   riskRate: 0.1200, tierIndex: 20, color: '#641e16' },
    { minDebtLoading: -Infinity, rating: 'C',    riskRate: 0.1500, tierIndex: 21, color: '#450a0a' }
  ];

  // 2. DISTRIBUTION CHANNEL BASELINE PARAMETERS
  const CHANNELS = {
    DC10: {
      code: 'DC10',
      name: 'DC10 - Hypermarkets (Đại siêu thị)',
      stores: 12,
      weeklyPotentialPerTeam: 90000,
      allowedSize: '1kg',
      skusPerOrder: 3,
      baseElasticity: 5.8,      // Very high price sensitivity
      marketingAlpha: 0.12,     // Low marketing sensitivity
      dampingLambda: 0.06,      // How much marketing dampens price elasticity
      paymentDaysMin: 20,
      paymentDaysMax: 20,
      priceCeilingMultiplier: 1.25
    },
    DC12: {
      code: 'DC12',
      name: 'DC12 - Grocery Chains (Chuỗi siêu thị)',
      stores: 59,
      weeklyPotentialPerTeam: 360000,
      allowedSize: 'ALL',
      skusPerOrder: 4,
      baseElasticity: 3.6,      // Moderate-high price sensitivity
      marketingAlpha: 0.35,     // High marketing sensitivity
      dampingLambda: 0.14,
      paymentDaysMin: 10,
      paymentDaysMax: 20,
      priceCeilingMultiplier: 1.38
    },
    DC14: {
      code: 'DC14',
      name: 'DC14 - Independent Grocers (Tiện lợi)',
      stores: 123,
      weeklyPotentialPerTeam: 135000,
      allowedSize: '500g',
      skusPerOrder: 1.5,
      baseElasticity: 2.3,      // Low price sensitivity (highest margins)
      marketingAlpha: 0.52,     // Very high local marketing sensitivity
      dampingLambda: 0.22,
      paymentDaysMin: 1,
      paymentDaysMax: 20,
      priceCeilingMultiplier: 1.55
    }
  };

  // 3. STANDARD 12 MUESLI SKUs IN ERPSIM MANUFACTURING
  const DEFAULT_SKUS = [
    { code: 'F01', name: '500g Original Muesli',   size: '500g', weightKg: 0.5, flavor: 'Original',   baseCogs: 1.38, refPrice: 2.70 },
    { code: 'F02', name: '500g Nut Muesli',        size: '500g', weightKg: 0.5, flavor: 'Nut',        baseCogs: 1.72, refPrice: 3.20 },
    { code: 'F03', name: '500g Blueberry Muesli',  size: '500g', weightKg: 0.5, flavor: 'Blueberry',  baseCogs: 1.85, refPrice: 3.45 },
    { code: 'F04', name: '500g Strawberry Muesli', size: '500g', weightKg: 0.5, flavor: 'Strawberry', baseCogs: 1.82, refPrice: 3.40 },
    { code: 'F05', name: '500g Raisin Muesli',     size: '500g', weightKg: 0.5, flavor: 'Raisin',     baseCogs: 1.58, refPrice: 2.95 },
    { code: 'F06', name: '500g Mixed Fruit Muesli',size: '500g', weightKg: 0.5, flavor: 'Mixed',      baseCogs: 1.79, refPrice: 3.35 },
    { code: 'F11', name: '1kg Original Muesli',    size: '1kg',  weightKg: 1.0, flavor: 'Original',   baseCogs: 2.52, refPrice: 4.65 },
    { code: 'F12', name: '1kg Nut Muesli',         size: '1kg',  weightKg: 1.0, flavor: 'Nut',        baseCogs: 3.18, refPrice: 5.50 },
    { code: 'F13', name: '1kg Blueberry Muesli',   size: '1kg',  weightKg: 1.0, flavor: 'Blueberry',  baseCogs: 3.45, refPrice: 5.90 },
    { code: 'F14', name: '1kg Strawberry Muesli',  size: '1kg',  weightKg: 1.0, flavor: 'Strawberry', baseCogs: 3.38, refPrice: 5.80 },
    { code: 'F15', name: '1kg Raisin Muesli',      size: '1kg',  weightKg: 1.0, flavor: 'Raisin',     baseCogs: 2.90, refPrice: 5.10 },
    { code: 'F16', name: '1kg Mixed Fruit Muesli', size: '1kg',  weightKg: 1.0, flavor: 'Mixed',      baseCogs: 3.32, refPrice: 5.70 }
  ];

  /**
   * 1. CREDIT RATING & COMPANY VALUATION ENGINE
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
      setupInvestment478000 = 0,
      elapsedSteps = 20,
      totalRounds = 3,
      stepsPerRound = 20,
      marketRiskRate = 0.07,
      cash = 0,
      accountsReceivable = 0,
      bankLoans = 0,
      accountsPayable = 0,
      inventoryValue = 0
    } = params;

    const totalGameSteps = Math.max(1, totalRounds * stepsPerRound);
    const safeElapsed = Math.max(1, elapsedSteps);

    // Debt Loading = (Cash + AR) - (|Loans| + |AP|)
    const debtLoading = (cash + accountsReceivable) - (Math.abs(bankLoans) + Math.abs(accountsPayable));
    const creditInfo = lookupCreditRating(debtLoading);
    const discountRate = marketRiskRate + creditInfo.riskRate;

    // Official ERPsim Annualized Profit + Setup Investment Refund Formula
    const operatingProfitExSetup = currentProfit - setupInvestment478000;
    const projectedFullGameOperatingProfit = (operatingProfitExSetup / safeElapsed) * totalGameSteps;
    const numerator = projectedFullGameOperatingProfit + setupInvestment478000;
    const companyValuation = numerator / discountRate;

    // What if we reached AAA+ (Debt Loading >= 0)?
    const aaaDiscountRate = marketRiskRate + 0.03;
    const potentialAAAValuation = numerator / aaaDiscountRate;
    const valuationLostToCreditRisk = potentialAAAValuation - companyValuation;

    // What if we reached the very next tier?
    let nextTierValuationGain = 0;
    if (creditInfo.nextBetter) {
      const nextDiscount = marketRiskRate + creditInfo.nextBetter.riskRate;
      nextTierValuationGain = (numerator / nextDiscount) - companyValuation;
    }

    // End-Game Inventory Liquidation Simulation (converting 70% of inventory into Cash/AR at 95% price margin)
    const liquidatedCashGain = inventoryValue * 0.75;
    const newDebtLoadingAfterLiquidation = debtLoading + liquidatedCashGain;
    const postLiquidationCredit = lookupCreditRating(newDebtLoadingAfterLiquidation);
    const postLiquidationValuation = numerator / (marketRiskRate + postLiquidationCredit.riskRate);

    return {
      debtLoading,
      creditInfo,
      marketRiskRate,
      discountRate,
      valuationMultiplier: 1 / discountRate,
      operatingProfitExSetup,
      projectedFullGameOperatingProfit,
      numerator,
      companyValuation,
      potentialAAAValuation,
      valuationLostToCreditRisk,
      nextTierValuationGain,
      amountNeededForAAA: Math.max(0, 0 - debtLoading),
      endGameSimulation: {
        liquidatedCashGain,
        newDebtLoadingAfterLiquidation,
        newRating: postLiquidationCredit.rating,
        newRiskRate: postLiquidationCredit.riskRate,
        postLiquidationValuation,
        valuationJump: postLiquidationValuation - companyValuation
      }
    };
  }

  /**
   * 2. LEAN MANUFACTURING (ACCOUNT 478000) & CAPACITY (ACCOUNT 11000) ENGINE
   */
  function calculateSetupAndProduction(params) {
    const {
      account478000 = 0,
      account11000ExtraUnits = 0,
      baseCapacity = 24000,
      productivityPct = 75,
      activeSkus = 4,
      lotSize = 18000,
      avgMarginPerBox = 1.65,
      remainingDays = 40
    } = params;

    // Official formula: Setup Time (hours) = 2 + (6 * 250000) / (250000 + Account478000)
    const setupTimeHours = 2 + (6 * 250000) / (250000 + Math.max(0, account478000));
    const initialSetupHours = 8.0;
    const hoursSavedPerChangeover = initialSetupHours - setupTimeHours;

    const totalNominalDailyCapacity = baseCapacity + account11000ExtraUnits;
    const nominalHourlyRate = totalNominalDailyCapacity / 24;
    const effectiveHourlyRate = nominalHourlyRate * (productivityPct / 100);

    // Calculate batch cycle
    const runHoursPerLot = lotSize / Math.max(1, effectiveHourlyRate);
    const totalHoursPerLot = setupTimeHours + runHoursPerLot;
    const changeoversPerDay = 24 / totalHoursPerLot;
    const lostHoursPerDay = changeoversPerDay * setupTimeHours;
    const productiveHoursPerDay = 24 - lostHoursPerDay;
    const actualDailyOutput = productiveHoursPerDay * effectiveHourlyRate;
    const capacityUtilizationPct = (productiveHoursPerDay / 24) * 100;

    // Baseline comparison (at €0 investment = 8h setup)
    const totalHoursPerLotAtZero = 8.0 + runHoursPerLot;
    const changeoversAtZero = 24 / totalHoursPerLotAtZero;
    const outputAtZero = (24 - changeoversAtZero * 8.0) * effectiveHourlyRate;
    const extraBoxesPerDay = Math.max(0, actualDailyOutput - outputAtZero);
    const extraProfitOverRemainingGame = extraBoxesPerDay * avgMarginPerBox * remainingDays;

    // Generate Milestone Curve Table
    const milestones = [0, 100000, 125000, 250000, 500000, 750000, 1000000, 1250000, 2000000].map(inv => {
      const st = 2 + (1500000 / (250000 + inv));
      const totLotH = st + runHoursPerLot;
      const chgDay = 24 / totLotH;
      const outDay = (24 - chgDay * st) * effectiveHourlyRate;
      const gainBoxes = outDay - outputAtZero;
      const grossProfitGain = gainBoxes * avgMarginPerBox * remainingDays;
      return {
        investment: inv,
        setupHours: st,
        pctDayLostPerSetup: (st / 24) * 100,
        dailyOutputBoxes: Math.round(outDay),
        extraBoxesPerDay: Math.round(gainBoxes),
        projectedProfitGain: Math.round(grossProfitGain)
      };
    });

    return {
      setupTimeHours,
      hoursSavedPerChangeover,
      totalNominalDailyCapacity,
      effectiveHourlyRate,
      runHoursPerLot,
      totalHoursPerLot,
      changeoversPerDay,
      lostHoursPerDay,
      productiveHoursPerDay,
      actualDailyOutput,
      capacityUtilizationPct,
      extraBoxesPerDay,
      extraProfitOverRemainingGame,
      milestones
    };
  }

  /**
   * 3. DEMAND & PRICING REVERSE-ENGINEERING SOLVER (VK32 / ZMARKET / ZVC2)
   * Estimates Empirical Arc Elasticity, Marketing-Damped Elasticity, True Unconstrained Demand,
   * and Solves for the Amoroso-Robinson / MNL Best-Response Profit-Maximizing Price P*
   */
  function reverseEngineerSkuChannel(input) {
    const {
      skuCode = 'F02',
      channelCode = 'DC12',
      cogs = 1.72,
      prevPrice = 3.20,
      prevQty = 2400,
      currPrice = 3.45,
      currQty = 2050,
      marketAvgPrice = 3.35,
      dailyMarketing = 1200,
      inventoryRemaining = 1500, // From ZMB52: 0 indicates stockout truncation
      activeTeamsCount = 6
    } = input;

    const channel = CHANNELS[channelCode] || CHANNELS.DC12;
    const skuInfo = DEFAULT_SKUS.find(s => s.code === skuCode) || DEFAULT_SKUS[0];

    // Check channel size compatibility
    const isSizeCompatible =
      channel.allowedSize === 'ALL' ||
      (channel.allowedSize === '1kg' && skuInfo.size === '1kg') ||
      (channel.allowedSize === '500g' && skuInfo.size === '500g');

    if (!isSizeCompatible) {
      return {
        compatible: false,
        reason: `Kênh ${channelCode} chỉ mua hộp ${channel.allowedSize} (Mã ${skuCode} là ${skuInfo.size}).`
      };
    }

    // 1. Detect Stockout Truncation
    const isStockout = inventoryRemaining <= 0;
    // If stocked out, true demand is higher than observed currQty
    const estimatedTrueCurrQty = isStockout ? Math.round(currQty * 1.28) : currQty;

    // 2. Calculate Empirical Arc Price Elasticity if price changed by at least €0.02
    let empiricalElasticity = null;
    const priceDiff = currPrice - prevPrice;
    if (Math.abs(priceDiff) >= 0.02 && prevQty > 0 && estimatedTrueCurrQty > 0) {
      const pctQtyChange = (estimatedTrueCurrQty - prevQty) / ((prevQty + estimatedTrueCurrQty) / 2);
      const pctPriceChange = priceDiff / ((prevPrice + currPrice) / 2);
      const rawElasticity = -(pctQtyChange / pctPriceChange);
      if (rawElasticity > 0.5 && rawElasticity < 20) {
        empiricalElasticity = rawElasticity;
      }
    }

    // 3. Theoretical Marketing-Damped Elasticity in ERPsim MNL Model:
    // Effective Elasticity = BaseChannelElasticity / (1 + lambda * ln(1 + Marketing / 250)) * (currPrice / marketAvgPrice)
    const marketingDampingFactor = 1 + channel.dampingLambda * Math.log(1 + Math.max(0, dailyMarketing) / 250);
    const relativePriceRatio = currPrice / Math.max(0.5, marketAvgPrice);
    const modelElasticity = (channel.baseElasticity / marketingDampingFactor) * Math.pow(relativePriceRatio, 1.15);

    // Blend empirical elasticity (if valid and no stockout distortion) with structural MNL elasticity
    const effectiveElasticity = (empiricalElasticity !== null && !isStockout)
      ? (0.55 * empiricalElasticity + 0.45 * modelElasticity)
      : modelElasticity;

    // Clamp effective elasticity > 1.15 so Amoroso-Robinson has a finite positive optimum
    const clampedElasticity = Math.max(1.22, Math.min(14.0, effectiveElasticity));

    // 4. Amoroso-Robinson / Lerner Index Unconstrained Profit-Maximizing Price:
    // P* = COGS * (e / (e - 1))
    const lernerOptimalPrice = cogs * (clampedElasticity / (clampedElasticity - 1));

    // 5. Competitive Best-Response & Reservation Ceiling Adjustment (Newton-Raphson on MNL Profit Function)
    // In ERPsim, each channel has a choke price ceiling and competitive benchmark anchor
    const priceCeiling = marketAvgPrice * channel.priceCeilingMultiplier;
    const marketingLiftMultiplier = 1 + channel.marketingAlpha * Math.log(1 + Math.max(0, dailyMarketing) / 300);

    // Search grid + local refinement around [COGS + 0.20, priceCeiling] to maximize expected profit E[pi(P)]
    let bestPrice = currPrice;
    let maxExpectedProfit = -Infinity;
    let expectedQtyAtOptimal = estimatedTrueCurrQty;

    // Calibrate baseline attractiveness constant K from current observed point (currPrice, estimatedTrueCurrQty)
    const beta = clampedElasticity / Math.max(0.5, currPrice);
    const currentShareProxy = Math.exp(-beta * (currPrice - marketAvgPrice));

    for (let p = Math.max(cogs + 0.15, marketAvgPrice * 0.65); p <= priceCeiling; p += 0.01) {
      // Penalty accelerates if p approaches priceCeiling
      const ceilingPenalty = p > marketAvgPrice * 1.18
        ? Math.exp(-2.5 * Math.pow((p - marketAvgPrice * 1.18) / (priceCeiling - marketAvgPrice * 1.18 + 0.01), 2))
        : 1.0;

      const relAttractiveness = Math.exp(-beta * (p - marketAvgPrice)) * ceilingPenalty;
      // Logistic market share damper so demand doesn't explode infinitely at low prices
      const predictedQty = estimatedTrueCurrQty * (relAttractiveness / Math.max(1e-6, currentShareProxy));
      const cappedQty = Math.min(predictedQty, estimatedTrueCurrQty * 2.6 + 800);
      const profit = (p - cogs) * cappedQty - (dailyMarketing / 3);

      if (profit > maxExpectedProfit) {
        maxExpectedProfit = profit;
        bestPrice = p;
        expectedQtyAtOptimal = Math.round(cappedQty);
      }
    }

    // Blend Newton/MNL best response with Lerner optimal price and stockout surge pricing
    let recommendedPrice = 0.65 * bestPrice + 0.35 * Math.min(priceCeiling, lernerOptimalPrice);
    if (isStockout) {
      // Stockout rule: Never leave money on the table when you stock out! Raise price by at least 6-10%
      recommendedPrice = Math.max(recommendedPrice, currPrice * 1.07);
    }
    recommendedPrice = Math.min(priceCeiling, Math.max(cogs + 0.20, Number(recommendedPrice.toFixed(2))));

    const currentDailyProfit = (currPrice - cogs) * currQty;
    const projectedOptimalProfit = (recommendedPrice - cogs) * expectedQtyAtOptimal;
    const profitGainPerDay = Math.max(0, projectedOptimalProfit - currentDailyProfit);
    const unitMargin = recommendedPrice - cogs;
    const marginPct = (unitMargin / recommendedPrice) * 100;

    let actionTag = 'GIỮ GIÁ';
    let actionColor = '#3b82f6';
    if (recommendedPrice - currPrice >= 0.06) {
      actionTag = isStockout ? 'TĂNG GIÁ MẠNH (CHỐNG ĐỨT HÀNG)' : 'TĂNG GIÁ TỐI ƯU BIÊN LN';
      actionColor = '#10b981';
    } else if (currPrice - recommendedPrice >= 0.06) {
      actionTag = 'GIẢM GIÁ KÍCH CẦU (CẦU CO GIÃN CAO)';
      actionColor = '#f59e0b';
    }

    return {
      compatible: true,
      skuCode,
      skuName: skuInfo.name,
      channelCode,
      channelName: channel.name,
      cogs,
      currPrice,
      currQty,
      marketAvgPrice,
      isStockout,
      estimatedTrueCurrQty,
      empiricalElasticity,
      effectiveElasticity: Number(clampedElasticity.toFixed(2)),
      marketingDampingFactor: Number(marketingDampingFactor.toFixed(2)),
      marketingLiftMultiplier: Number(marketingLiftMultiplier.toFixed(2)),
      lernerOptimalPrice: Number(lernerOptimalPrice.toFixed(2)),
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
   * 4. REGIONAL PREFERENCE DECONVOLUTION & MARKETING (ZADS) OPTIMIZER
   * Deconvolves observed regional sales (North, South, West) by removing price/ad distortion
   * to reveal the hidden Regional Preference parameter Theta_{j,r} and computes exact optimal ZADS budget.
   */
  function reverseEngineerRegionalMarketing(regionalSalesMatrix, totalDailyBudget = 6000) {
    // regionalSalesMatrix: array of { skuCode, flavor, unitMargin, salesNorth, salesSouth, salesWest, adsNorth, adsSouth, adsWest }
    const regions = ['North', 'South', 'West'];
    const regionTotals = { North: 0, South: 0, West: 0 };

    // Step 1: Compute baseline organic volume (strip out logarithmic ad boost)
    const deconvolvedRows = regionalSalesMatrix.map(row => {
      const stripAdBoost = (qty, ads) => {
        const adMultiplier = 1 + 0.35 * Math.log(1 + Math.max(0, ads) / 250);
        return qty / adMultiplier;
      };
      const orgNorth = stripAdBoost(row.salesNorth || 0, row.adsNorth || 0);
      const orgSouth = stripAdBoost(row.salesSouth || 0, row.adsSouth || 0);
      const orgWest  = stripAdBoost(row.salesWest || 0, row.adsWest || 0);

      regionTotals.North += orgNorth;
      regionTotals.South += orgSouth;
      regionTotals.West  += orgWest;

      return { ...row, orgNorth, orgSouth, orgWest };
    });

    // Step 2: Compute Normalized Regional Preference Index Theta_{j,r} (1.00 = average, >1.25 = Strong Hot Preference)
    const count = Math.max(1, deconvolvedRows.length);
    const avgShare = 1 / count;

    const analyzedRows = deconvolvedRows.map(row => {
      const shareNorth = regionTotals.North > 0 ? row.orgNorth / regionTotals.North : avgShare;
      const shareSouth = regionTotals.South > 0 ? row.orgSouth / regionTotals.South : avgShare;
      const shareWest  = regionTotals.West  > 0 ? row.orgWest  / regionTotals.West  : avgShare;

      const thetaNorth = shareNorth / avgShare;
      const thetaSouth = shareSouth / avgShare;
      const thetaWest  = shareWest  / avgShare;

      return {
        ...row,
        shareNorthPct: Number((shareNorth * 100).toFixed(1)),
        shareSouthPct: Number((shareSouth * 100).toFixed(1)),
        shareWestPct:  Number((shareWest * 100).toFixed(1)),
        thetaNorth: Number(thetaNorth.toFixed(2)),
        thetaSouth: Number(thetaSouth.toFixed(2)),
        thetaWest:  Number(thetaWest.toFixed(2))
      };
    });

    // Step 3: Allocate ZADS Marketing Budget to avoid Intra-Regional Cannibalization!
    // Rule: In each region, only fund the top 2 SKUs with highest (Theta_{j,r} * UnitMargin * BaseVolume)
    // where Marginal Revenue of Advertising > 1.0
    const recommendations = { North: {}, South: {}, West: {} };
    const regionRankings = { North: [], South: [], West: [] };

    regions.forEach(reg => {
      const thetaKey = `theta${reg}`;
      const orgKey = `org${reg}`;

      const scored = analyzedRows.map(r => {
        const responsiveness = r[thetaKey] * Math.max(0.5, r.unitMargin) * Math.sqrt(Math.max(100, r[orgKey]));
        return { skuCode: r.skuCode, name: r.name, theta: r[thetaKey], orgQty: r[orgKey], unitMargin: r.unitMargin, responsiveness };
      }).sort((a, b) => b.responsiveness - a.responsiveness);

      regionRankings[reg] = scored;

      // Pick Top 2 in each region to prevent dilution/cannibalization
      const top1 = scored[0];
      const top2 = scored[1];
      const regionBudget = totalDailyBudget / 3;

      scored.forEach((item, idx) => {
        if (idx === 0 && item.theta >= 0.85) {
          // Primary champion in this region gets ~65% of regional budget, capped by logarithmic ROI
          const optimalAd = Math.min(2200, Math.round((regionBudget * 0.65) / 50) * 50);
          recommendations[reg][item.skuCode] = { spend: optimalAd, role: 'CHỦ LỰC #1 (CHAMPION)', priority: 1 };
        } else if (idx === 1 && item.theta >= 1.05) {
          // Secondary strong match gets ~35% of regional budget
          const optimalAd = Math.min(1400, Math.round((regionBudget * 0.35) / 50) * 50);
          recommendations[reg][item.skuCode] = { spend: optimalAd, role: 'HỖ TRỢ #2 (CO-LEADER)', priority: 2 };
        } else {
          // Set to €0 to avoid intra-regional cannibalization
          recommendations[reg][item.skuCode] = { spend: 0, role: 'CẮT (€0 - TRÁNH TỰ ĂN MÒN)', priority: 0 };
        }
      });
    });

    return {
      analyzedRows,
      recommendations,
      regionRankings
    };
  }

  /**
   * 5. SUSTAINABILITY / CARBON FOOTPRINT (CO2e) CALCULATOR
   */
  function calculateCarbonFootprint(params) {
    const {
      dailyBoxesProduced = 20000,
      dailySetupHours = 4,
      averageInventoryBoxes = 35000,
      dailyDeliveriesCount = 28,
      carbonTaxRatePerKg = 0.30 // Default €0.30 / kg CO2e
    } = params;

    const prodCo2Kg = dailyBoxesProduced * 0.30;         // ~0.30 kg CO2e / box
    const setupCo2Kg = dailySetupHours * 185;            // ~185 kg CO2e / setup hour
    const storageCo2Kg = averageInventoryBoxes * 0.045;  // warehouse energy overhead
    const transportCo2Kg = dailyDeliveriesCount * 95;    // delivery route footprint

    const totalDailyCo2Kg = prodCo2Kg + setupCo2Kg + storageCo2Kg + transportCo2Kg;
    const dailyCarbonTaxEur = totalDailyCo2Kg * carbonTaxRatePerKg;

    return {
      prodCo2Kg: Math.round(prodCo2Kg),
      setupCo2Kg: Math.round(setupCo2Kg),
      storageCo2Kg: Math.round(storageCo2Kg),
      transportCo2Kg: Math.round(transportCo2Kg),
      totalDailyCo2Kg: Math.round(totalDailyCo2Kg),
      dailyCarbonTaxEur: Math.round(dailyCarbonTaxEur)
    };
  }

  /**
   * 6. LOGISTICS SUSTAINABILITY (PRESET 3 - DAIRY) & 8 RANDOM DISRUPTORS ENGINE
   * Based directly on Official ERPsim Logistics Sustainability Preset 3 Job Aid & Disruptors Guide Rev 2.0
   */
  const LOGISTICS_PRESET3_SKUS = [
    { code: 'T01', name: 'Milk ($$-T01)',      initialStock: 950, costV04: 22.95, costV08: 24.10, initialPrice: 25.25, elasticity: 3.15 },
    { code: 'T02', name: 'Cream ($$-T02)',     initialStock: 300, costV04: 72.07, costV08: 73.67, initialPrice: 75.78, elasticity: 2.65 },
    { code: 'T03', name: 'Yoghurt ($$-T03)',   initialStock: 700, costV04: 25.85, costV08: 27.14, initialPrice: 28.43, elasticity: 3.05 },
    { code: 'T04', name: 'Cheese ($$-T04)',    initialStock: 350, costV04: 82.68, costV08: 86.81, initialPrice: 90.95, elasticity: 2.45 },
    { code: 'T05', name: 'Butter ($$-T05)',    initialStock: 400, costV04: 59.88, costV08: 62.87, initialPrice: 65.87, elasticity: 2.75 },
    { code: 'T06', name: 'Ice Cream ($$-T06)', initialStock: 300, costV04: 43.15, costV08: 45.31, initialPrice: 47.47, elasticity: 2.85 }
  ];

  const LOGISTICS_DISRUPTORS = [
    {
      id: 1,
      code: 'COLD_SPELL',
      name: 'Event 1: Cold Spell (Đợt Giá Rét)',
      summary: '+5.0 kg CO2e/unit cho 2 sản phẩm bị ảnh hưởng (cả V04 & V08); Giảm phạt Carbon vượt kho -300 kg/container (còn 200 kg); Giảm Carbon năng lượng -25 kg/ngày.',
      counterStrategy: 'Tăng giá bán (VK32) của 2 sản phẩm bị cộng +5kg CO2e thêm (5 × Thuế Carbon × 1.35). Tận dụng việc phí phạt vượt kho giảm 60% để gom lô PO lớn hơn.'
    },
    {
      id: 2,
      code: 'CARBON_DECREE',
      name: 'Event 2: Carbon Decree (Sắc Lệnh Tăng Thuế Carbon)',
      summary: 'Thuế Carbon tăng vọt thêm +€0.20 / kg CO2e; Phát thải năng lượng mua ngoài giảm -50 kg/ngày (còn 50 kg/ngày).',
      counterStrategy: 'BẮT BUỘC tắt bán trực tiếp từ Kho tổng 03 (ZMB1B: Uncheck Use 03) vì 300kg CO2e/đơn lúc này tốn cực nhiều thuế! Gom đơn PO lớn và giảm tần suất chuyển kho.'
    },
    {
      id: 3,
      code: 'SUPPLIER_DISRUPTION',
      name: 'Event 3: Supplier Disruption (Đứt Gãy Chuỗi Cung Ứng NCC)',
      summary: 'Nhà cung cấp bị dính xúc xắc (V04 hoặc V08) bị phạt thêm +2.50 kg CO2e/unit và +200 kg CO2e/PO.',
      counterStrategy: 'Nếu V04 bị dính và Thuế Carbon cao (≥ €0.35/kg), kiểm tra bảng so sánh ZME12 bên dưới để chuyển các mã chênh lệch giá thấp (như T01, T02, T03) sang V08.'
    },
    {
      id: 4,
      code: 'HUB_GRIDLOCK',
      name: 'Event 4: Hub Gridlock (Tắc Nghẽn Kho Tổng 03)',
      summary: 'Bán trực tiếp từ Kho tổng 03 bị cộng thêm +300 kg CO2e/Sales Order (tổng 600 kg/đơn!). Chuyển kho nội bộ (ZMB1B) bị cộng +100 kg CO2e/transfer (tổng 150 kg). Mua hàng PO bị cộng +100 kg CO2e/PO.',
      counterStrategy: 'TUYỆT ĐỐI KHÔNG bán trực tiếp từ Kho tổng 03 (Uncheck Use 03 trong ZMB1B). Giãn tần suất chuyển kho ZMB1B ra 3–4 ngày/lần với số lượng lớn mỗi lần chuyển.'
    },
    {
      id: 5,
      code: 'SYSTEM_GLITCH',
      name: 'Event 5: System Glitch (Lỗi Hệ Thống Khóa Báo Cáo)',
      summary: 'Khóa ngẫu nhiên các nhóm báo cáo (Inventory ZMB52, Sales ZVC2/ZVA05, hoặc Procurement ZME2N). Mở khóa trong ZITM tốn €5,000 / báo cáo.',
      counterStrategy: 'KHÔNG CẦN TỐN €5,000 mua lại báo cáo nếu bạn đang dùng cổng OData (ZODATA / SAC / PowerBI / Web Command Center) hoặc chỉ mua duy nhất ZMB52 (€5,000 là rất nhỏ so với doanh thu €72,000/ngày).'
    },
    {
      id: 6,
      code: 'DATA_BREACH',
      name: 'Event 6: Data Breach (Rò Rỉ Dữ Liệu OData Toàn Thị Trường)',
      summary: 'Tất cả các đội đều xem được dữ liệu OData của nhau (giá bán, tồn kho, nhà cung cấp, doanh số của mọi đối thủ).',
      counterStrategy: 'Dùng OData quét ngay xem đối thủ đang đứt hàng (Stockout = 0) ở mã nào među T01..T06 tại vùng nào (03N, 03S, 03W) -> Đẩy hàng vào vùng đó qua ZMB1B và tăng giá VK32 +12%!'
    },
    {
      id: 7,
      code: 'FLASH_FLOOD',
      name: 'Event 7: Flash Flood (Lũ Quét Mất Trắng 1 Kho)',
      summary: 'Xóa sổ 100% tồn kho tại 1 kho ngẫu nhiên: Central (03), North (03N), South (03S), hoặc West (03W).',
      counterStrategy: 'Nếu mất kho vùng (VD: 03N): Vào ZMB1B đẩy hàng khẩn cấp từ 03 sang. Nếu mất kho tổng (03): Chạy ngay MD61 -> MD01 -> ZME12 chọn V04 (Lead time chỉ 1-2 ngày!) -> ME59N để cấp tốc bù hàng!'
    },
    {
      id: 8,
      code: 'AI_INNOVATION',
      name: 'Event 8: AI Innovation (Mở Khóa Công Cụ AI ZRPA)',
      summary: 'Mở khóa T-code ZRPA (AI Requirements Planning cho MD61 & AI Price Management cho VK32).',
      counterStrategy: 'Có thể dùng ZRPA để tự động gợi ý lượng đặt hàng MD61 nhanh, NHƯNG phải kiểm tra lại giá VK32 bằng Bộ Giải Ngược của chúng ta vì AI mặc định trong game đặt biên lợi nhuận khá bảo thủ.'
    }
  ];

  function solveLogisticsSustainabilityPreset3(params) {
    const {
      currentRound = 1,
      baseCarbonTax = 0.10, // Round 1 = 0.10, increases +0.05 per round
      orderLotSizePerPo = 600,
      totalWarehouseUnits = 3600,
      coldSpellActive = false,
      coldSpellCombo = 'T01_T02', // 1:T01+T02, 2:T01+T03, 3:T01+T05, 4:T02+T03, 5:T02+T05, 6:T03+T05
      carbonDecreeActive = false,
      supplierDisruptionActive = false,
      impactedSupplier = 'V04',
      hubGridlockActive = false,
      directSalesOrdersPerDay = 0,
      regionalSalesOrdersPerDay = 32,
      transfersPerDay = 3
    } = params;

    // 1. Effective Carbon Tax Rate (€/kg CO2e)
    // Standard rule from Slide 7 & 14: Initial €0.10/kg, +€0.05 per round after R1 (or custom base), +€0.20 if Carbon Decree
    const effectiveCarbonTax = baseCarbonTax + (carbonDecreeActive ? 0.20 : 0);

    // 2. Cold Spell affected SKUs
    const coldSpellSkus = coldSpellCombo.split('_');

    // 3. Supplier comparison for each of the 6 Dairy SKUs (T01..T06)
    const skuAnalysis = LOGISTICS_PRESET3_SKUS.map(sku => {
      const isColdHit = coldSpellActive && coldSpellSkus.includes(sku.code);
      const coldExtraUnitCo2 = isColdHit ? 5.0 : 0.0;

      // V04 unit & PO carbon
      const v04UnitCo2 = 1.2 + coldExtraUnitCo2 + (supplierDisruptionActive && impactedSupplier === 'V04' ? 2.50 : 0);
      const v04PoCo2 = 100 + (supplierDisruptionActive && impactedSupplier === 'V04' ? 200 : 0) + (hubGridlockActive ? 100 : 0);
      const v04PoFixedFee = 1000;

      // V08 unit & PO carbon
      const v08UnitCo2 = 0.8 + coldExtraUnitCo2 + (supplierDisruptionActive && impactedSupplier === 'V08' ? 2.50 : 0);
      const v08PoCo2 = 400 + (supplierDisruptionActive && impactedSupplier === 'V08' ? 200 : 0) + (hubGridlockActive ? 100 : 0);
      const v08PoFixedFee = 600;

      // True Landed Cost per Unit at given orderLotSizePerPo
      const safeLot = Math.max(50, orderLotSizePerPo);
      const v04LandedUnitCost = sku.costV04 + (v04UnitCo2 * effectiveCarbonTax) + (v04PoFixedFee + v04PoCo2 * effectiveCarbonTax) / safeLot;
      const v08LandedUnitCost = sku.costV08 + (v08UnitCo2 * effectiveCarbonTax) + (v08PoFixedFee + v08PoCo2 * effectiveCarbonTax) / safeLot;

      const recommendedVendor = v04LandedUnitCost <= v08LandedUnitCost ? 'V04' : 'V08';
      const minLandedCost = Math.min(v04LandedUnitCost, v08LandedUnitCost);
      const savingsPerUnit = Math.abs(v08LandedUnitCost - v04LandedUnitCost);

      // Calculate Break-even Lot Size Q* where TC_V04(Q*) == TC_V08(Q*)
      const unitVarDiff = (sku.costV08 + v08UnitCo2 * effectiveCarbonTax) - (sku.costV04 + v04UnitCo2 * effectiveCarbonTax);
      const fixedPoDiff = (v04PoFixedFee + v04PoCo2 * effectiveCarbonTax) - (v08PoFixedFee + v08PoCo2 * effectiveCarbonTax);
      const breakEvenLotSize = unitVarDiff > 0 ? Math.max(0, Math.round(fixedPoDiff / unitVarDiff)) : Infinity;

      // Optimal Retail Price on DC 16 (Retail Stores) using Amoroso-Robinson + Logistics Carbon pass-through
      const regionalOrderCo2CostPerUnit = (75 * effectiveCarbonTax) / 25; // ~25 units per average customer order
      const fullEffectiveMarginalCost = minLandedCost + regionalOrderCo2CostPerUnit;
      const optimalPriceDC16 = fullEffectiveMarginalCost * (sku.elasticity / (sku.elasticity - 1));
      // Blend with market tolerance ceiling so we don't hit choke price
      const recommendedPriceDC16 = Number(Math.min(sku.initialPrice * 1.32, Math.max(fullEffectiveMarginalCost * 1.12, optimalPriceDC16 * 0.65 + sku.initialPrice * 0.42)).toFixed(2));
      const netProfitPerUnit = Number((recommendedPriceDC16 - fullEffectiveMarginalCost).toFixed(2));

      return {
        ...sku,
        isColdHit,
        v04UnitCo2: Number(v04UnitCo2.toFixed(2)),
        v08UnitCo2: Number(v08UnitCo2.toFixed(2)),
        v04LandedUnitCost: Number(v04LandedUnitCost.toFixed(2)),
        v08LandedUnitCost: Number(v08LandedUnitCost.toFixed(2)),
        recommendedVendor,
        savingsPerUnit: Number(savingsPerUnit.toFixed(2)),
        breakEvenLotSize,
        recommendedPriceDC16,
        netProfitPerUnit
      };
    });

    // 4. Warehousing & Logistics Daily Carbon + Fee Summary
    const excessUnits = Math.max(0, totalWarehouseUnits - 4000);
    const excessContainers = Math.ceil(excessUnits / 1000);
    const overstockFeePerDay = excessContainers * 300;
    const overstockCo2PerContainer = coldSpellActive ? 200 : 500; // Cold Spell reduces from 500 to 200 kg/container
    const overstockCo2PerDay = excessContainers * overstockCo2PerContainer;

    const energyCo2PerDay = Math.max(0, 100 - (coldSpellActive ? 25 : 0) - (carbonDecreeActive ? 50 : 0));
    const otherOverheadCo2PerDay = 100; // 500 kg per 5 days

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

    // How much money is wasted per Direct Sale order from Central Warehouse (03) vs Regional Warehouse (03N/03S/03W)
    const lossPerDirectSaleOrder = directSalesFeeEach + (directSalesCo2Each - regionalSalesCo2Each) * effectiveCarbonTax;

    return {
      effectiveCarbonTax: Number(effectiveCarbonTax.toFixed(2)),
      skuAnalysis,
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
   * 7. SAP ZVC2 / ZMARKET TSV & CSV PARSER
   * Parses raw clipboard copy-paste from SAP GUI ALV Grids or Fiori tables
   */
  function parseSapTableText(rawText) {
    if (!rawText || !rawText.trim()) return [];
    const lines = rawText.trim().split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('---'));
    if (lines.length < 2) return [];

    // Detect delimiter: Tab (\t), Pipe (|), Semicolon (;), or Comma (,)
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
    CHANNELS,
    DEFAULT_SKUS,
    LOGISTICS_PRESET3_SKUS,
    LOGISTICS_DISRUPTORS,
    lookupCreditRating,
    calculateCompanyValuation,
    calculateSetupAndProduction,
    reverseEngineerSkuChannel,
    reverseEngineerRegionalMarketing,
    calculateCarbonFootprint,
    solveLogisticsSustainabilityPreset3,
    parseSapTableText
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ERPsimEngine;
}
