const API_BASE = "http://localhost:8000";

const statusEl = document.getElementById("control-status");
const eventsBody = document.getElementById("events-body");
const mitigationsBody = document.getElementById("mitigations-body");
const sprint4EvidenceBody = document.getElementById("sprint4-evidence-body");

let lastEventsSignature = "";
let lastMitigationsSignature = "";
let lastSprint4EvidenceSignature = "";
let pollInFlight = false;

async function triggerSimulation(endpoint, label) {
  statusEl.textContent = `Running ${label}...`;
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: "POST" });
    if (!res.ok) {
      statusEl.textContent = `${label} failed (${res.status})`;
      return;
    }
    statusEl.textContent = `${label} started`;
    setTimeout(() => {
      if (statusEl.textContent === `${label} started`) {
        statusEl.textContent = "Idle";
      }
    }, 4000);
  } catch (err) {
    statusEl.textContent = `${label} failed (API unreachable)`;
  }
}

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString();
}

function renderEvents(items) {
  eventsBody.innerHTML = "";
  if (items.length > 0 && statusEl.textContent.includes("started")) {
    statusEl.textContent = "Idle";
  }
  items.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="py-2">${formatTime(item.timestamp)}</td>
      <td>${item.username}</td>
      <td>${item.ip_address}</td>
      <td>${item.country}</td>
      <td>${item.event_action ?? "-"}</td>
      <td class="${item.is_suspicious ? "text-rose-400" : "text-emerald-400"}">${item.risk_score}</td>
    `;
    eventsBody.appendChild(row);
  });
}

function renderMitigations(items) {
  mitigationsBody.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="py-2">${formatTime(item.timestamp)}</td>
      <td>${item.uc_id}</td>
      <td>${item.target_identifier}</td>
      <td>${item.action}</td>
      <td>${item.status}</td>
    `;
    mitigationsBody.appendChild(row);
  });
}

function renderSprint4Evidence(items) {
  sprint4EvidenceBody.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("tr");
    const details = item.details ? JSON.stringify(item.details) : "-";
    row.innerHTML = `
      <td class="py-2">${formatTime(item.timestamp)}</td>
      <td>${item.uc_id ?? "-"}</td>
      <td>${item.event ?? "-"}</td>
      <td>${item.action ?? "-"}</td>
      <td>${item.status ?? "-"}</td>
      <td class="text-xs text-slate-300 break-all">${details}</td>
    `;
    sprint4EvidenceBody.appendChild(row);
  });
}

function buildSignature(items, fields) {
  return items
    .map((item) => fields.map((field) => item[field]).join("|"))
    .join("~");
}

async function poll() {
  if (pollInFlight) {
    return;
  }
  pollInFlight = true;
  try {
    const [eventsRes, mitigationsRes, sprint4Res] = await Promise.all([
      fetch(`${API_BASE}/events?limit=25`),
      fetch(`${API_BASE}/mitigations?limit=25`),
      fetch(`${API_BASE}/sprint4/evidence?limit=25`),
    ]);

    if (eventsRes.ok) {
      const events = await eventsRes.json();
      const eventsSignature = buildSignature(events, ["id", "timestamp", "risk_score", "event_action"]);
      if (eventsSignature !== lastEventsSignature) {
        renderEvents(events);
        lastEventsSignature = eventsSignature;
      }
    }

    if (mitigationsRes.ok) {
      const mitigations = await mitigationsRes.json();
      const mitigationsSignature = buildSignature(mitigations, ["id", "timestamp", "status", "action"]);
      if (mitigationsSignature !== lastMitigationsSignature) {
        renderMitigations(mitigations);
        lastMitigationsSignature = mitigationsSignature;
      }
    }

    if (sprint4Res && sprint4Res.ok) {
      const evidenceItems = await sprint4Res.json();
      const evidenceSignature = buildSignature(evidenceItems, ["timestamp", "uc_id", "event", "status"]);
      if (evidenceSignature !== lastSprint4EvidenceSignature) {
        renderSprint4Evidence(evidenceItems);
        lastSprint4EvidenceSignature = evidenceSignature;
      }
    }
  } catch (err) {
    statusEl.textContent = "API unreachable";
  } finally {
    pollInFlight = false;
  }
}

setInterval(poll, 2000);

poll();

document.getElementById("btn-uc-012").addEventListener("click", () => {
  triggerSimulation("/simulate/uc-012", "UC-012");
});

document.getElementById("btn-uc-013").addEventListener("click", () => {
  triggerSimulation("/simulate/uc-013", "UC-013");
});

document.getElementById("btn-uc-014").addEventListener("click", () => {
  triggerSimulation("/simulate/uc-014", "UC-014");
});

document.getElementById("btn-uc-015").addEventListener("click", () => {
  triggerSimulation("/simulate/uc-015", "UC-015");
});

document.getElementById("btn-uc-016").addEventListener("click", () => {
  triggerSimulation("/simulate/uc-016", "UC-016");
});

document.getElementById("btn-uc-018").addEventListener("click", () => {
  triggerSimulation("/simulate/uc-018", "UC-018");
});

document.getElementById("btn-uc-019").addEventListener("click", () => {
  triggerSimulation("/simulate/uc-019", "UC-019");
});

document.getElementById("btn-clear-events").addEventListener("click", async () => {
  statusEl.textContent = "Resetting simulation...";
  try {
    const res = await fetch(`${API_BASE}/events/clear?seed=true`, { method: "POST" });
    if (!res.ok) {
      statusEl.textContent = `Clear failed (${res.status})`;
      return;
    }
    await poll();
    statusEl.textContent = "Idle";
  } catch (err) {
    statusEl.textContent = "Clear failed (API unreachable)";
  }
});

const trafficBtn = document.getElementById("btn-traffic");
let trafficRunning = false;

async function toggleTraffic() {
  const endpoint = trafficRunning ? "/traffic/stop" : "/traffic/start";
  statusEl.textContent = trafficRunning ? "Stopping simulation..." : "Starting simulation...";
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: "POST" });
    if (!res.ok) {
      statusEl.textContent = `Traffic failed (${res.status})`;
      return;
    }
    trafficRunning = !trafficRunning;
    trafficBtn.textContent = trafficRunning ? "Stop Simulation" : "Start Simulation";
    statusEl.textContent = "Idle";
  } catch (err) {
    statusEl.textContent = "Traffic failed (API unreachable)";
  }
}

trafficBtn.addEventListener("click", toggleTraffic);
