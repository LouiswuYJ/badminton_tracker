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
function saveMatch() {
  if (selected.length !== 4) {
    alert("Select exactly 4 players");
    return;
  }

  const a = Number(scoreA.value);
  const b = Number(scoreB.value);
  if (a === b || isNaN(a) || isNaN(b)) {
    alert("Invalid score");
    return;
  }

  const data = load();
  const teamA = selected.slice(0, 2);
  const teamB = selected.slice(2, 4);
  const winner = a > b ? "A" : "B";

  if (winner === "A") {
    teamA.forEach(p => data.players[p]++);
    teamB.forEach(p => data.players[p]--);
  } else {
    teamB.forEach(p => data.players[p]++);
    teamA.forEach(p => data.players[p]--);
  }

  data.matches.push({
    teamA, teamB, scoreA: a, scoreB: b, winner
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

  if (m.winner === "A") {
    m.teamA.forEach(p => data.players[p]--);
    m.teamB.forEach(p => data.players[p]++);
  } else {
    m.teamB.forEach(p => data.players[p]--);
    m.teamA.forEach(p => data.players[p]++);
  }

  save(data);
  render();
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
    .map(([p, s]) => `<li>${p}: <b>${s}</b></li>`)
    .join("");

  /* History */
  history.innerHTML = data.matches.map((m, i) => `
    <li class="flex justify-between items-center">
      <span>
        ${m.teamA.join("+")} (${m.scoreA})
        vs
        ${m.teamB.join("+")} (${m.scoreB})
      </span>
      <button onclick="deleteMatch(${i})"
        class="text-red-500 text-sm">✕</button>
    </li>
  `).reverse().join("");
}

render();
