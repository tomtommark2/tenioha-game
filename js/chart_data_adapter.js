// Chart Data Adapter: shared monthly-series builder for fallback + firebase modes
(function (global) {
  function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function makeLast30Dates() {
    const dates = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.push(formatDate(d));
    }
    return dates;
  }

  function mergeLocalHistory(logMap, gs) {
    if (!gs || !gs.dailyHistory) return;
    gs.dailyHistory.forEach((h) => {
      if (!h || !h.date) return;
      logMap.set(h.date, {
        total_learned: (h.total_learned ?? h.wordsLearned ?? 0),
        cefr_breakdown: h.cefr_breakdown || {}
      });
    });
  }

  function buildMonthlyStats(logMap, gs, vDB) {
    const dates = makeLast30Dates();
    const labels = [];
    const datasets = { total: [], A1: [], A2: [], B1: [], B2: [] };
    const isRealData = [];

    dates.forEach((dateStr, index) => {
      const d = new Date(dateStr);
      labels.push(`${d.getMonth() + 1}/${d.getDate()}`);

      if (index < 29) {
        if (logMap.has(dateStr)) {
          const data = logMap.get(dateStr);
          isRealData.push(true);
          datasets.total.push(data.total_learned || 0);
          datasets.A1.push(data.cefr_breakdown?.A1 || 0);
          datasets.A2.push(data.cefr_breakdown?.A2 || 0);
          datasets.B1.push(data.cefr_breakdown?.B1 || 0);
          datasets.B2.push(data.cefr_breakdown?.B2 || 0);
        } else {
          isRealData.push(false);
          datasets.total.push(0);
          datasets.A1.push(0);
          datasets.A2.push(0);
          datasets.B1.push(0);
          datasets.B2.push(0);
        }
      } else {
        if (gs && gs.wordStates && vDB && global.StatsEngine) {
          const c = global.StatsEngine.getPerfectCountsByCEFR(gs, vDB);
          isRealData.push(true);
          datasets.total.push(c.total);
          datasets.A1.push(c.A1);
          datasets.A2.push(c.A2);
          datasets.B1.push(c.B1);
          datasets.B2.push(c.B2);
        } else {
          isRealData.push(false);
          datasets.total.push(0);
          datasets.A1.push(0);
          datasets.A2.push(0);
          datasets.B1.push(0);
          datasets.B2.push(0);
        }
      }
    });

    return { labels, datasets, isRealData, isDemo: false };
  }

  global.ChartDataAdapter = {
    makeLast30Dates,
    mergeLocalHistory,
    buildMonthlyStats
  };
})(typeof window !== 'undefined' ? window : self);
