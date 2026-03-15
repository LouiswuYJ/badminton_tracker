const KEY = "badminton_tracker";
let selected = [];

function load() {
  const data = JSON.parse(localStorage.getItem(KEY)) || {
    players: {},
    matches: [],
    removedPlayers: []
  };
  data.removedPlayers ??= [];
  return data;
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

/* ---------- Players ---------- */
function addPlayer() {
  const name = playerName.value.trim();
  if (!name) return;

  const data = load();
  data.players[name] ??= 0;
  data.removedPlayers = data.removedPlayers.filter(p => p !== name);
  save(data);
  playerName.value = "";
  render();
}

function removePlayer(name) {
  if (!confirm(`Remove "${name}" from the player list?`)) return;
  const data = load();
  if (!data.removedPlayers.includes(name)) {
    data.removedPlayers.push(name);
  }
  selected = selected.filter(p => p !== name);
  save(data);
  render();
}

function restorePlayer(name) {
  const data = load();
  data.removedPlayers = data.removedPlayers.filter(p => p !== name);
  save(data);
  render();
}

/* ---------- Tags ---------- */
function togglePlayer(name) {
  if (selected.includes(name)) {
    selected = selected.filter(p => p !== name);
  } else if (selected.length < 4) {
    selected.push(name);
  }
  render();
}

/* ---------- Match ---------- */
function quickWin(winnerTeam) {
  saveMatch(winnerTeam);
}

function saveMatch(forcedWinner = null) {
  if (selected.length !== 4) {
    alert("Select exactly 4 players");
    return;
  }

  let a, b, winner;
  let points = 1;

  if (forcedWinner) {
    a = null;
    b = null;
    winner = forcedWinner;
  } else {
    a = Number(scoreA.value);
    b = Number(scoreB.value);
    if (a === b || isNaN(a) || isNaN(b)) {
      alert("Invalid score");
      return;
    }
    winner = a > b ? "A" : "B";

    const loserScore = winner === "A" ? b : a;
    if (loserScore < 10) {
      points = 2;
    }
  }

  const data = load();
  const teamA = selected.slice(0, 2);
  const teamB = selected.slice(2, 4);

  if (winner === "A") {
    teamA.forEach(p => data.players[p] += points);
    teamB.forEach(p => data.players[p] -= points);
  } else {
    teamB.forEach(p => data.players[p] += points);
    teamA.forEach(p => data.players[p] -= points);
  }

  data.matches.push({
    teamA, teamB, scoreA: a, scoreB: b, winner, points,
    time: new Date().toISOString()
  });

  selected = [];
  scoreA.value = "";
  scoreB.value = "";
  save(data);
  render();
}

/* ---------- Delete Match ---------- */
function deleteMatch(index) {
  const data = load();
  const m = data.matches.splice(index, 1)[0];

  const points = m.points || 1;

  if (m.winner === "A") {
    m.teamA.forEach(p => data.players[p] -= points);
    m.teamB.forEach(p => data.players[p] += points);
  } else {
    m.teamB.forEach(p => data.players[p] -= points);
    m.teamA.forEach(p => data.players[p] += points);
  }

  save(data);
  render();
}

/* ---------- Share ---------- */
function shareToWhatsApp() {
  const data = load();

  // Build leaderboard HTML
  const entries = Object.entries(data.players).sort((a, b) => b[1] - a[1]);
  const groups = [];
  entries.forEach(([p, s]) => {
    const last = groups[groups.length - 1];
    if (last && last.score === s) {
      last.names.push(p);
    } else {
      groups.push({ names: [p], score: s });
    }
  });
  groups.forEach((g, i) => g.rank = i + 1);

  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const leaderboardRows = groups.map(g => {
    const medal = medals[g.rank] || "";
    const s = g.score;
    const sign = s > 0 ? "+" : "";
    const scoreColor = s > 0 ? "#059669" : s < 0 ? "#dc2626" : "#64748b";
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid #f1f5f9;">
      <span style="font-weight:600;color:#334155;">${g.rank}. ${medal} ${g.names.join(", ")}</span>
      <span style="color:${scoreColor};font-weight:700;font-size:13px;">${sign}${s}</span>
    </div>`;
  }).join("");

  // Build match history HTML (ascending)
  const matchRows = data.matches.map(m => {
    const isWinA = m.winner === "A";
    let displayA, displayB;
    if (m.scoreA !== null && m.scoreB !== null) {
      displayA = m.scoreA;
      displayB = m.scoreB;
    } else {
      displayA = isWinA ? "W" : "-";
      displayB = !isWinA ? "W" : "-";
    }
    const dp = m.points > 1 ? ' <span style="background:#fef3c7;color:#b45309;font-size:10px;padding:1px 4px;border-radius:4px;">2x</span>' : "";

    let timeStr = "";
    if (m.time) {
      const d = new Date(m.time);
      const month = d.toLocaleString("en", { month: "short" });
      const day = d.getDate();
      const hours = d.getHours().toString().padStart(2, "0");
      const mins = d.getMinutes().toString().padStart(2, "0");
      timeStr = `<div style="font-size:10px;color:#94a3b8;text-align:center;margin-top:2px;">${month} ${day}, ${hours}:${mins}</div>`;
    }

    return `<div style="background:#f8fafc;border-radius:8px;padding:8px 10px;margin-bottom:6px;border:1px solid #f1f5f9;">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
        <span style="font-weight:${isWinA ? 700 : 400};color:${isWinA ? '#334155' : '#94a3b8'};flex:1;text-align:right;padding-right:6px;">${m.teamA.join(" + ")}</span>
        <span style="color:#cbd5e1;font-size:10px;">vs</span>
        <span style="font-weight:${!isWinA ? 700 : 400};color:${!isWinA ? '#334155' : '#94a3b8'};flex:1;text-align:left;padding-left:6px;">${m.teamB.join(" + ")}</span>
      </div>
      <div style="text-align:center;font-family:monospace;font-size:14px;">
        <span style="color:${isWinA ? '#059669' : '#cbd5e1'};font-weight:700;">${displayA}</span>
        <span style="color:#e2e8f0;margin:0 6px;">-</span>
        <span style="color:${!isWinA ? '#059669' : '#cbd5e1'};font-weight:700;">${displayB}</span>
        ${dp}
      </div>
      ${timeStr}
    </div>`;
  }).join("");

  // Build the off-screen container
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:400px;background:#ffffff;font-family:Inter,system-ui,sans-serif;padding:24px;";
  container.innerHTML = `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:24px;margin-bottom:4px;">🏸</div>
      <div style="font-size:18px;font-weight:800;color:#1e293b;">Badminton Tracker</div>
    </div>
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🏆 Leaderboard</div>
      <div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
        ${leaderboardRows || '<div style="padding:16px;text-align:center;color:#cbd5e1;">No players yet</div>'}
      </div>
    </div>
    <div>
      <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">📜 Match History</div>
      ${matchRows || '<div style="padding:16px;text-align:center;color:#cbd5e1;">No matches yet</div>'}
    </div>
  `;
  document.body.appendChild(container);

  html2canvas(container, { scale: 2, backgroundColor: "#ffffff", useCORS: true }).then(canvas => {
    document.body.removeChild(container);
    canvas.toBlob(blob => {
      const file = new File([blob], "badminton-results.png", { type: "image/png" });

      // Use Web Share API if available (mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: "Badminton Tracker Results",
        }).catch(() => {});
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "badminton-results.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    }, "image/png");
  });
}

/* ---------- Reset ---------- */
function resetData() {
  if (confirm("Are you sure you want to delete all data? This cannot be undone.")) {
    localStorage.removeItem(KEY);
    location.reload();
  }
}

/* ---------- Render ---------- */
function render() {
  const data = load();

  /* Selection counter */
  const countEl = document.getElementById("selectionCount");
  if (countEl) {
    countEl.textContent = `${selected.length}/4`;
    countEl.className = `text-[11px] font-semibold px-2 py-0.5 rounded-full ${
      selected.length === 4
        ? "bg-emerald-100 text-emerald-600"
        : selected.length > 0
          ? "bg-indigo-100 text-indigo-600"
          : "bg-slate-100 text-slate-400"
    }`;
  }

  /* Player Tags — only show active (non-removed) players */
  const activePlayers = Object.keys(data.players).filter(n => !data.removedPlayers.includes(n));
  playerTags.innerHTML = activePlayers.map(name => {
    const isSelected = selected.includes(name);
    const idx = selected.indexOf(name);
    const teamLabel = idx >= 0 && idx < 2 ? "A" : idx >= 2 ? "B" : "";

    return `
    <div class="relative group">
      <button onclick="togglePlayer('${name}')"
        class="player-tag px-3.5 py-1.5 rounded-xl text-sm cursor-pointer select-none font-medium
        ${isSelected
          ? idx < 2
            ? "bg-indigo-500 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-300"
            : "bg-purple-500 text-white shadow-md shadow-purple-200 ring-2 ring-purple-300"
          : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
        } ${isSelected ? "selected" : ""}">
        ${name}
        ${teamLabel ? `<span class="text-[10px] opacity-75 ml-0.5">${teamLabel}</span>` : ""}
      </button>
      <button onclick="removePlayer('${name}')"
        class="absolute -top-1.5 -right-1.5 bg-slate-300 hover:bg-red-500 text-white
        text-[10px] rounded-full w-4 h-4 flex items-center justify-center cursor-pointer
        opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all shadow-sm"
        aria-label="Remove ${name}">
        &times;
      </button>
    </div>
  `}).join("");

  /* Selected Teams */
  if (selected.length > 0) {
    const a = selected.slice(0, 2);
    const b = selected.slice(2);

    const renderClickable = (players, color) =>
      players.length > 0
        ? players.map(p =>
            `<span onclick="togglePlayer('${p}')" class="cursor-pointer hover:line-through hover:opacity-60 transition-all text-${color}-600 font-bold">${p}</span>`
          ).join(` <span class="font-normal text-${color}-300">&</span> `)
        : '<span class="text-slate-300">?</span>';

    selectedTeams.innerHTML = `
      <div class="flex items-center justify-center gap-3 py-1">
        <span>${renderClickable(a, "indigo")}</span>
        <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-2">vs</span>
        <span>${renderClickable(b, "purple")}</span>
      </div>
      <p class="text-[10px] text-slate-400 mt-1">Tap a name to deselect</p>
    `;
    selectedTeams.className = "text-sm font-semibold text-center py-3 px-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-xl border border-indigo-100";
  } else {
    selectedTeams.innerHTML = '<span class="text-slate-400">Select 4 players above...</span>';
    selectedTeams.className = "text-sm font-semibold text-center py-3 px-4 bg-slate-50 rounded-xl text-slate-500 border border-dashed border-slate-200";
  }

  /* Player count */
  const playerCountEl = document.getElementById("playerCount");
  const playerCount = Object.keys(data.players).length;
  if (playerCountEl) {
    playerCountEl.textContent = playerCount > 0 ? `${playerCount} players` : "";
  }

  /* Leaderboard */
  const entries = Object.entries(data.players).sort((a, b) => b[1] - a[1]);

  // Group players by score
  const groups = [];
  entries.forEach(([p, s]) => {
    const last = groups[groups.length - 1];
    if (last && last.score === s) {
      last.names.push(p);
    } else {
      groups.push({ names: [p], score: s });
    }
  });

  // Assign ranks: sequential (1, 2, 3...) regardless of group size
  groups.forEach((g, i) => {
    g.rank = i + 1;
  });

  leaderboard.innerHTML = groups.length === 0
    ? '<li class="text-center py-8 text-slate-300 text-sm">No players yet</li>'
    : groups.map(g => {
      const { rank, names, score: s } = g;
      const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
      const medal = medals[rank] || "";
      const isTop3 = rank <= 3;

      const bgColors = { 1: "bg-gradient-to-r from-amber-50 to-yellow-50/50", 2: "bg-gradient-to-r from-slate-50 to-gray-50/50", 3: "bg-gradient-to-r from-orange-50 to-amber-50/30" };
      const bg = bgColors[rank] || "hover:bg-slate-50";

      const scoreColor = s > 0 ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
        : s < 0 ? "bg-red-50 text-red-600 ring-1 ring-red-200/50"
        : "bg-slate-50 text-slate-500 ring-1 ring-slate-200/50";

      return `
      <li class="flex justify-between items-center py-2.5 px-3 rounded-xl mx-1 transition-colors ${bg}">
        <div class="flex items-center gap-2.5">
          <span class="text-slate-300 font-mono text-xs w-4 text-right ${isTop3 ? "font-bold text-slate-500" : ""}">${rank}</span>
          ${medal ? `<span class="text-lg leading-none">${medal}</span>` : '<span class="w-[18px]"></span>'}
          <span class="font-semibold text-sm">${names.map(n =>
            data.removedPlayers.includes(n)
              ? `<span class="text-slate-400 italic">${n}</span><button onclick="restorePlayer('${n}')" class="ml-1 text-[10px] text-indigo-500 hover:text-indigo-700 font-semibold not-italic" title="Restore player">↩</button>`
              : `<span class="text-slate-700">${n}</span>`
          ).join(", ")}</span>
        </div>
        <span class="${scoreColor} px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums">
          ${s > 0 ? '+' : ''}${s}
        </span>
      </li>
    `}).join("");

  /* Games Played */
  const gameCounts = {};
  Object.keys(data.players).forEach(p => gameCounts[p] = 0);
  data.matches.forEach(m => {
    [...m.teamA, ...m.teamB].forEach(p => {
      gameCounts[p] = (gameCounts[p] || 0) + 1;
    });
  });

  const gameEntries = Object.entries(gameCounts).sort((a, b) => b[1] - a[1]);
  const gamesPlayedEl = document.getElementById("gamesPlayed");
  if (gamesPlayedEl) {
    gamesPlayedEl.innerHTML = gameEntries.length === 0
      ? '<li class="text-center py-8 text-slate-300 text-sm">No players yet</li>'
      : gameEntries.map(([p, count], i) => {
        const isRemoved = data.removedPlayers.includes(p);
        const maxCount = gameEntries[0][1];
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

        return `
        <li class="flex justify-between items-center py-2.5 px-3 rounded-xl mx-1 hover:bg-slate-50 transition-colors">
          <div class="flex items-center gap-2.5 flex-1 min-w-0">
            <span class="text-slate-300 font-mono text-xs w-4 text-right">${i + 1}</span>
            <div class="flex-1 min-w-0">
              <span class="font-semibold text-sm ${isRemoved ? "text-slate-400 italic" : "text-slate-700"}">${p}</span>
              <div class="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all" style="width: ${barWidth}%"></div>
              </div>
            </div>
          </div>
          <span class="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ml-3 flex-shrink-0">
            ${count}
          </span>
        </li>
      `}).join("");
  }

  /* Match count */
  const matchCountEl = document.getElementById("matchCount");
  if (matchCountEl) {
    matchCountEl.textContent = data.matches.length > 0 ? `${data.matches.length} matches` : "";
  }

  /* History — ascending (oldest first) */
  matchHistory.innerHTML = data.matches.length === 0
    ? '<li class="text-center py-8 text-slate-300 text-sm">No matches yet</li>'
    : data.matches.map((m, i) => {
    const isWinA = m.winner === "A";

    let displayA, displayB;
    if (m.scoreA !== null && m.scoreB !== null) {
      displayA = m.scoreA;
      displayB = m.scoreB;
    } else {
      displayA = isWinA ? "W" : "-";
      displayB = !isWinA ? "W" : "-";
    }

    const pointsBadge = m.points > 1
      ? `<span class="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md">2x</span>`
      : "";

    // Format time
    let timeStr = "";
    if (m.time) {
      const d = new Date(m.time);
      const month = d.toLocaleString("en", { month: "short" });
      const day = d.getDate();
      const hours = d.getHours().toString().padStart(2, "0");
      const mins = d.getMinutes().toString().padStart(2, "0");
      timeStr = `${month} ${day}, ${hours}:${mins}`;
    }

    return `
      <li class="match-item flex items-center bg-slate-50/80 p-3 rounded-xl border border-slate-100 group hover:border-slate-200 transition-all">
        <div class="flex flex-col w-full min-w-0">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-xs truncate flex-1 text-right ${isWinA ? "font-bold text-slate-700" : "text-slate-400"}">
              ${m.teamA.join(" + ")}
            </span>
            <span class="text-[10px] text-slate-300 font-medium flex-shrink-0">vs</span>
            <span class="text-xs truncate flex-1 text-left ${!isWinA ? "font-bold text-slate-700" : "text-slate-400"}">
              ${m.teamB.join(" + ")}
            </span>
          </div>
          <div class="flex items-center justify-center gap-3">
            <span class="text-sm font-mono font-bold ${isWinA ? "text-emerald-600" : "text-slate-300"}">${displayA}</span>
            <span class="text-slate-200 text-xs">-</span>
            <span class="text-sm font-mono font-bold ${!isWinA ? "text-emerald-600" : "text-slate-300"}">${displayB}</span>
            ${pointsBadge}
          </div>
          ${timeStr ? `<div class="text-[10px] text-slate-300 text-center mt-1">${timeStr}</div>` : ""}
        </div>
        <button onclick="deleteMatch(${i})"
          class="ml-2 text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-white
                 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
          aria-label="Delete match">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </li>
    `;
  }).join("");
}

render();
