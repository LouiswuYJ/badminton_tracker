const KEY = "badminton_tracker";

function load() {
  return JSON.parse(localStorage.getItem(KEY)) || {
    players: {},
    matches: []
  };
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function normalize(name) {
  return name === "Boby" ? "Bobby" : name;
}

/* -------- Players -------- */
function addPlayer() {
  const name = normalize(playerName.value.trim());
  if (!name) return;

  const data = load();
  data.players[name] ??= 0;
  save(data);
  playerName.value = "";
  render();
}

/* -------- Bulk Import -------- */
function importMatches() {
  const data = load();
  bulkInput.value.trim().split("\n").forEach(line => {
    const p = line.split(" ");
    if (p.length < 7) return;

    const t1 = [normalize(p[0]), normalize(p[1])];
    const t2 = [normalize(p[4]), normalize(p[5])];
    const win1 = p[2] === "1";

    [...t1, ...t2].forEach(n => data.players[n] ??= 0);

    if (win1) {
      t1.forEach(n => data.players[n]++);
      t2.forEach(n => data.players[n]--);
    } else {
      t2.forEach(n => data.players[n]++);
      t1.forEach(n => data.players[n]--);
    }

    data.matches.push({ t1, t2, win1 });
  });

  save(data);
  bulkInput.value = "";
  render();
}

/* -------- Undo -------- */
function undoLastMatch() {
  const data = load();
  const m = data.matches.pop();
  if (!m) return;

  if (m.win1) {
    m.t1.forEach(n => data.players[n]--);
    m.t2.forEach(n => data.players[n]++);
  } else {
    m.t2.forEach(n => data.players[n]--);
    m.t1.forEach(n => data.players[n]++);
  }

  save(data);
  render();
}

/* -------- Reset -------- */
function resetGame() {
  if (!confirm("Reset all data?")) return;
  localStorage.removeItem(KEY);
  render();
}

/* -------- Export / Import -------- */
function exportData() {
  const data = load();
  const blob = new Blob([JSON.stringify(data, null, 2)]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "badminton.json";
  a.click();
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    localStorage.setItem(KEY, r.result);
    render();
  };
  r.readAsText(file);
}

/* -------- Render -------- */
function render() {
  const data = load();
  leaderboard.innerHTML = Object.entries(data.players)
    .sort((a, b) => b[1] - a[1])
    .map(([p, s]) => `<li>${p}: <b>${s}</b></li>`)
    .join("");
}

render();

/* -------- PWA -------- */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
