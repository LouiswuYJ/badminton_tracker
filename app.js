const KEY = "badminton_tracker";
let selected = [];

function load() {
  return JSON.parse(localStorage.getItem(KEY)) || {
    players: {},
    matches: []
  };
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
  save(data);
  playerName.value = "";
  render();
}

function removePlayer(name) {
  const data = load();
  delete data.players[name];
  selected = selected.filter(p => p !== name);
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
    // Quick Record Mode
    a = null;
    b = null;
    winner = forcedWinner;
  } else {
    // Score Mode
    a = Number(scoreA.value);
    b = Number(scoreB.value);
    if (a === b || isNaN(a) || isNaN(b)) {
      alert("Invalid score");
      return;
    }
    winner = a > b ? "A" : "B";

    // Double Points Rule: Loser < 10
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
    teamA, teamB, scoreA: a, scoreB: b, winner, points
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

  // Default to 1 if points not stored (backward compatibility), else use stored points
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

  /* Player Tags */
  playerTags.innerHTML = Object.keys(data.players).map(name => `
    <div class="relative">
      <span onclick="togglePlayer('${name}')"
        class="px-3 py-1 rounded-full border-2 text-sm cursor-pointer select-none
        ${selected.includes(name)
      ? "bg-blue-600 border-blue-600 text-white"
      : "bg-white border-blue-400"}">
        ${name}
      </span>

      <span onclick="removePlayer('${name}')"
        class="absolute -top-1 -right-1 bg-red-500 text-white
        text-xs rounded-full w-4 h-4 flex items-center justify-center cursor-pointer">
        ×
      </span>
    </div>
  `).join("");

  /* Selected Teams */
  if (selected.length > 0) {
    const a = selected.slice(0, 2).join(" + ");
    const b = selected.slice(2).join(" + ");
    selectedTeams.innerHTML = `${a || "?"} <b>VS</b> ${b || "?"}`;
  } else {
    selectedTeams.innerHTML = "";
  }

  /* Leaderboard */
  leaderboard.innerHTML = Object.entries(data.players)
    .sort((a, b) => b[1] - a[1])
    .map(([p, s], i) => {
      let medal = "";
      if (i === 0) medal = "🥇";
      else if (i === 1) medal = "🥈";
      else if (i === 2) medal = "🥉";

      return `
      <li class="flex justify-between items-center py-3 px-2 hover:bg-gray-50 transition-colors">
        <div class="flex items-center gap-3">
          <span class="text-gray-400 font-mono w-5 text-right">${i + 1}.</span>
          <span class="font-medium text-gray-800">${p}</span>
          <span class="text-xl ml-1">${medal}</span>
        </div>
        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">${s > 0 ? '+' : ''}${s}</span>
      </li>
    `
    })
    .join("");

  /* History */
  matchHistory.innerHTML = data.matches.map((m, i) => {
    // Determine winner style
    const isWinA = m.winner === "A";
    const styleA = isWinA ? "font-bold text-gray-900" : "text-gray-500";
    const styleB = !isWinA ? "font-bold text-gray-900" : "text-gray-500";

    // Display Logic
    let displayA, displayB;
    if (m.scoreA !== null && m.scoreB !== null) {
      displayA = m.scoreA;
      displayB = m.scoreB;
    } else {
      displayA = isWinA ? "Win" : "✕";
      displayB = !isWinA ? "Win" : "✕";
    }

    // Points Badge
    const pointsBadge = m.points > 1
      ? `<span class="bg-yellow-100 text-yellow-800 text-[10px] px-1 rounded border border-yellow-200 ml-2">2x</span>`
      : "";

    return `
      <li class="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm relative overflow-hidden">
        ${m.points > 1 ? '<div class="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-bl"></div>' : ''}
        <div class="flex flex-col text-xs sm:text-sm w-full mr-2">
          <div class="flex justify-between items-center mb-1">
            <span class="${styleA} truncate w-1/2 pr-1 text-right flex justify-end items-center">
               ${m.teamA.join(" + ")}
            </span>
            <span class="px-2 text-gray-300">vs</span>
            <span class="${styleB} truncate w-1/2 pl-1 text-left flex items-center">
               ${m.teamB.join(" + ")}
            </span>
          </div>
          <div class="flex justify-center items-center gap-4 text-base font-mono">
            <span class="${isWinA ? "text-green-600 font-bold" : "text-gray-400"}">${displayA}</span>
            <span class="text-gray-300">-</span>
            <span class="${!isWinA ? "text-green-600 font-bold" : "text-gray-400"}">${displayB}</span>
            ${pointsBadge}
          </div>
        </div>
        <button onclick="deleteMatch(${i})"
          class="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-white transition-all"
          aria-label="Delete match">
          ✕
        </button>
      </li>
    `;
  }).reverse().join("");
}

render();
