const API_BASE = "http://localhost:8000";

const statusEl = document.getElementById("control-status");
const eventsBody = document.getElementById("events-body");
const mitigationsBody = document.getElementById("mitigations-body");
const sprint4EvidenceBody = document.getElementById("sprint4-evidence-body");

let lastEventsSignature = "";
let lastMitigationsSignature = "";
let lastSprint4EvidenceSignature = "";
let pollInFlight = false;

// Format timestamp to HH:MM:SS.ms
function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Render login events with enhanced status styling
function renderEvents(items) {
  eventsBody.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("tr");
    const isSuspicious = item.is_suspicious || (item.risk_score && item.risk_score > 50);
    const statusClass = isSuspicious ? "status-suspicious" : "status-safe";
    const statusText = isSuspicious ? "⚠ Suspicious" : "✓ Safe";
    
    row.innerHTML = `
      <td class="px-6 py-3 font-mono text-xs text-slate-400">${formatTime(item.timestamp)}</td>
      <td class="px-6 py-3 text-sm text-slate-100 font-medium">${item.username || "-"}</td>
      <td class="px-6 py-3 font-mono text-xs text-slate-300">${item.ip_address || "-"}</td>
      <td class="px-6 py-3 text-sm text-slate-100">${item.country || "-"}</td>
      <td class="px-6 py-3 font-mono text-xs text-slate-300">${item.event_action || "-"}</td>
      <td class="px-6 py-3"><span class="${statusClass}">${statusText}</span></td>
    `;
    eventsBody.appendChild(row);
  });
}

// Render mitigations with status indicators
function renderMitigations(items) {
  mitigationsBody.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("tr");
    let statusIcon = "schedule";
    let statusClass = "status-pending";
    
    if (item.status === "Success" || item.status === "COMPLETED") {
      statusIcon = "check_circle";
      statusClass = "status-success";
    } else if (item.status === "Failed" || item.status === "ERROR") {
      statusIcon = "error";
      statusClass = "px-2 py-0.5 bg-red-950 text-red-400 text-xs font-mono font-bold uppercase rounded flex items-center gap-1";
    } else if (item.status === "Pending" || item.status === "IN_PROGRESS") {
      statusIcon = "hourglass_empty";
      statusClass = "status-pending";
    }
    
    row.innerHTML = `
      <td class="px-6 py-3 font-mono text-xs text-slate-400">${formatTime(item.timestamp)}</td>
      <td class="px-6 py-3 font-mono text-xs font-bold text-indigo-400">${item.uc_id || "-"}</td>
      <td class="px-6 py-3 text-sm text-slate-100">${item.target_identifier || "-"}</td>
      <td class="px-6 py-3 text-sm text-slate-300">${item.action || "-"}</td>
      <td class="px-6 py-3">
        <div class="flex items-center gap-1.5 ${statusClass}">
          <span class="material-symbols-outlined text-xs" style="font-size: 14px;">${statusIcon}</span>
          <span>${item.status}</span>
        </div>
      </td>
    `;
    mitigationsBody.appendChild(row);
  });
}

// Render Sprint-4 evidence with collapsible details
function renderSprint4Evidence(items) {
  sprint4EvidenceBody.innerHTML = "";
  items.forEach((item, idx) => {
    const row = document.createElement("tr");
    const details = item.details ? JSON.stringify(item.details) : "-";
    const status = item.status || "PENDING";
    let statusIcon = "pending";
    
    if (status === "COMMITTED" || status === "SUCCESS") {
      statusIcon = "task_alt";
    } else if (status === "ANALYZING" || status === "IN_PROGRESS") {
      statusIcon = "autorenew";
    }
    
    row.innerHTML = `
      <td class="px-6 py-3 font-mono text-xs text-slate-400">${formatTime(item.timestamp)}</td>
      <td class="px-6 py-3 font-mono text-xs font-bold text-indigo-400">${item.uc_id || "-"}</td>
      <td class="px-6 py-3 text-xs text-slate-300 font-mono">${item.event || "-"}</td>
      <td class="px-6 py-3 text-xs text-slate-300">${item.action || "-"}</td>
      <td class="px-6 py-3">
        <div class="flex items-center gap-1.5 text-xs font-mono text-indigo-400">
          <span class="material-symbols-outlined" style="font-size: 14px;">${statusIcon}</span>
          ${status}
        </div>
      </td>
      <td class="px-6 py-3">
        <code class="text-xs bg-slate-800 text-amber-300 px-2 py-1 rounded block max-w-xs overflow-hidden text-ellipsis whitespace-nowrap cursor-help" title="${details}">${details}</code>
      </td>
    `;
    sprint4EvidenceBody.appendChild(row);
  });
}

// Build signature for change detection
function buildSignature(items, fields) {
  return items.map((item) => fields.map((field) => item[field]).join("|")).join("~");
}

// Update status display
function updateStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("text-red-400", isError);
  statusEl.classList.toggle("text-slate-400", !isError);
}

// Poll backend for updates
async function poll() {
  if (pollInFlight) return;
  pollInFlight = true;
  
  try {
    const [eventsRes, mitigationsRes, sprint4Res] = await Promise.all([
      fetch(`${API_BASE}/events?limit=25`),
      fetch(`${API_BASE}/mitigations?limit=25`),
      fetch(`${API_BASE}/sprint4/evidence?limit=25`),
    ]);

    // Process events
    if (eventsRes.ok) {
      const events = await eventsRes.json();
      const eventsSignature = buildSignature(events, ["id", "timestamp", "risk_score", "event_action"]);
      if (eventsSignature !== lastEventsSignature) {
        renderEvents(events);
        lastEventsSignature = eventsSignature;
      }
    }

    // Process mitigations
    if (mitigationsRes.ok) {
      const mitigations = await mitigationsRes.json();
      const mitigationsSignature = buildSignature(mitigations, ["id", "timestamp", "status", "action"]);
      if (mitigationsSignature !== lastMitigationsSignature) {
        renderMitigations(mitigations);
        lastMitigationsSignature = mitigationsSignature;
      }
    }

    // Process Sprint-4 evidence
    if (sprint4Res && sprint4Res.ok) {
      const evidenceItems = await sprint4Res.json();
      const evidenceSignature = buildSignature(evidenceItems, ["timestamp", "uc_id", "event", "status"]);
      if (evidenceSignature !== lastSprint4EvidenceSignature) {
        renderSprint4Evidence(evidenceItems);
        lastSprint4EvidenceSignature = evidenceSignature;
      }
    }
    
    if (eventsRes.ok && mitigationsRes.ok) {
      updateStatus("Ready", false);
    } else {
      updateStatus("API Error", true);
    }
  } catch (err) {
    updateStatus("Offline", true);
  } finally {
    pollInFlight = false;
  }
}

// Poll every 2 seconds
setInterval(poll, 2000);
poll();

// Simulate detection vector
async function triggerSimulation(endpoint, label) {
  updateStatus(`Running ${label}...`, false);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: "POST" });
    if (!res.ok) {
      updateStatus(`${label} failed (${res.status})`, true);
      return;
    }
    updateStatus(`${label} triggered`, false);
    setTimeout(() => poll(), 500);
  } catch (err) {
    updateStatus(`${label} failed`, true);
  }
}

// UC Button Handlers
document.getElementById("btn-uc-012")?.addEventListener?.("click", () => {
  triggerSimulation("/simulate/uc-012", "UC-012");
}) ?? document.querySelector('[id="btn-uc-012"]')?.addEventListener?.("click", () => {
  triggerSimulation("/simulate/uc-012", "UC-012");
});

// Create buttons dynamically for each UC
const ucs = ["012", "013", "014", "015", "016", "018", "019"];
ucs.forEach(uc => {
  const btn = document.querySelector(`[id*="btn-uc-${uc}"]`) || 
              document.querySelector(`button:nth-of-type(${parseInt(uc) - 11})`);
  if (btn) {
    btn.addEventListener("click", () => {
      triggerSimulation(`/simulate/uc-${uc}`, `UC-${uc}`);
    });
  }
});

// Update button event listeners to use selectors that match the HTML
document.querySelectorAll("button").forEach((btn, idx) => {
  const text = btn.textContent;
  if (text.includes("UC-012")) {
    btn.addEventListener("click", () => triggerSimulation("/simulate/uc-012", "UC-012"));
  } else if (text.includes("UC-013")) {
    btn.addEventListener("click", () => triggerSimulation("/simulate/uc-013", "UC-013"));
  } else if (text.includes("UC-014")) {
    btn.addEventListener("click", () => triggerSimulation("/simulate/uc-014", "UC-014"));
  } else if (text.includes("UC-015")) {
    btn.addEventListener("click", () => triggerSimulation("/simulate/uc-015", "UC-015"));
  } else if (text.includes("UC-016")) {
    btn.addEventListener("click", () => triggerSimulation("/simulate/uc-016", "UC-016"));
  } else if (text.includes("UC-018")) {
    btn.addEventListener("click", () => triggerSimulation("/simulate/uc-018", "UC-018"));
  } else if (text.includes("UC-019")) {
    btn.addEventListener("click", () => triggerSimulation("/simulate/uc-019", "UC-019"));
  }
});

// Traffic Control
const trafficBtn = document.getElementById("btn-traffic");
let trafficRunning = false;

async function toggleTraffic() {
  const endpoint = trafficRunning ? "/traffic/stop" : "/traffic/start";
  updateStatus(trafficRunning ? "Stopping simulation..." : "Starting simulation...", false);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: "POST" });
    if (!res.ok) {
      updateStatus(`Traffic control failed (${res.status})`, true);
      return;
    }
    trafficRunning = !trafficRunning;
    trafficBtn.textContent = trafficRunning ? "⏹ Stop Simulation" : "▶ Start Simulation";
    updateStatus(trafficRunning ? "Simulation running" : "Ready", false);
    setTimeout(() => poll(), 500);
  } catch (err) {
    updateStatus("Traffic control failed", true);
  }
}

trafficBtn?.addEventListener?.("click", toggleTraffic);

// Reset/Clear Events
const clearBtn = document.getElementById("btn-clear-events");

async function clearEvents() {
  updateStatus("Resetting simulation...", false);
  try {
    const res = await fetch(`${API_BASE}/events/clear?seed=true`, { method: "POST" });
    if (!res.ok) {
      updateStatus(`Clear failed (${res.status})`, true);
      return;
    }
    await poll();
    updateStatus("Ready", false);
  } catch (err) {
    updateStatus("Clear failed", true);
  }
}

clearBtn?.addEventListener?.("click", clearEvents);
