const API_BASE = "http://localhost:8000";

const statusEl = document.getElementById("control-status");
const statusIconEl = document.getElementById("status-icon");
const eventsBody = document.getElementById("events-body");
const mitigationsBody = document.getElementById("mitigations-body");
const sprint4EvidenceBody = document.getElementById("sprint4-evidence-body");
const evidenceCountEl = document.getElementById("evidence-count");

let lastEventsSignature = "";
let lastMitigationsSignature = "";
let lastSprint4EvidenceSignature = "";
let pollInFlight = false;

// Format timestamp to HH:MM:SS.ms
function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

// Render login events with enhanced status styling
function renderEvents(items) {
  eventsBody.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-white/5 transition-colors group";

    const isSuspicious = item.is_suspicious || (item.risk_score && item.risk_score > 50);
    const statusClass = isSuspicious
      ? "px-2 py-0.5 bg-rose-900/40 text-rose-400 text-[10px] font-bold uppercase"
      : "px-2 py-0.5 bg-emerald-900/40 text-emerald-400 text-[10px] font-bold uppercase";
    const statusText = isSuspicious ? "Suspicious" : "Safe";
    
    row.innerHTML = `
      <td class="px-6 py-4 font-mono text-xs text-on-surface-variant">${formatTime(item.timestamp)}</td>
      <td class="px-6 py-4 font-body text-xs text-on-surface">${item.username || "-"}</td>
      <td class="px-6 py-4 font-mono text-xs text-secondary">${item.ip_address || "-"}</td>
      <td class="px-6 py-4 font-body text-xs text-on-surface-variant">${item.country || "-"}</td>
      <td class="px-6 py-4 font-mono text-xs text-on-surface">${item.event_action || "-"}</td>
      <td class="px-6 py-4"><span class="${statusClass}">${statusText}</span></td>
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
    let statusTextClass = "text-primary";
    let statusLabel = item.status || "Pending";
    
    if (item.status === "Success" || item.status === "COMPLETED") {
      statusIcon = "check_circle";
      statusTextClass = "text-emerald-400";
      statusLabel = "Success";
    } else if (item.status === "Failed" || item.status === "ERROR") {
      statusIcon = "error";
      statusTextClass = "text-error";
      statusLabel = "Failed";
    } else if (item.status === "Pending" || item.status === "IN_PROGRESS") {
      statusIcon = "autorenew";
      statusTextClass = "text-primary";
      statusLabel = "Pending";
    }
    
    row.innerHTML = `
      <td class="px-6 py-4 font-mono text-xs text-on-surface-variant">${formatTime(item.timestamp)}</td>
      <td class="px-6 py-4 font-mono text-xs text-rose-400 font-bold">${item.uc_id || "-"}</td>
      <td class="px-6 py-4 font-body text-xs text-on-surface">${item.target_identifier || "-"}</td>
      <td class="px-6 py-4 font-body text-xs text-on-surface">${item.action || "-"}</td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined ${statusTextClass} text-sm">${statusIcon}</span>
          <span class="text-xs ${statusTextClass} font-mono">${statusLabel}</span>
        </div>
      </td>
    `;
    mitigationsBody.appendChild(row);
  });
}

// Render Sprint-4 evidence with collapsible details
function renderSprint4Evidence(items) {
  sprint4EvidenceBody.innerHTML = "";
  if (evidenceCountEl) {
    evidenceCountEl.textContent = `TOTAL_OBJECTS: ${items.length}`;
  }

  items.forEach((item, idx) => {
    const row = document.createElement("tr");
    row.className = "group";
    const details = item.details ? JSON.stringify(item.details) : "-";
    const status = item.status || "PENDING";
    let statusClass = "text-secondary";
    
    if (status === "COMMITTED" || status === "SUCCESS") {
      statusClass = "text-emerald-400";
    } else if (status === "ANALYZING" || status === "IN_PROGRESS") {
      statusClass = "text-secondary";
    } else if (status === "FAILED" || status === "ERROR") {
      statusClass = "text-error";
    }
    
    row.innerHTML = `
      <td class="px-6 py-4 font-mono text-xs text-on-surface-variant">${formatTime(item.timestamp)}</td>
      <td class="px-6 py-4 font-mono text-xs text-on-surface">${item.uc_id || "-"}</td>
      <td class="px-6 py-4 font-mono text-xs text-on-surface">${item.event || "-"}</td>
      <td class="px-6 py-4 font-mono text-xs text-on-surface">${item.action || "-"}</td>
      <td class="px-6 py-4 ${statusClass} font-mono text-xs">${status}</td>
      <td class="px-6 py-4">
        <div class="bg-surface-container-lowest p-2 rounded text-[10px] font-mono text-primary-fixed-dim max-w-xs overflow-hidden group-hover:bg-surface-container-highest transition-colors" title="${details}">
          ${details}
        </div>
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
  statusEl.classList.toggle("text-error", isError);
  statusEl.classList.toggle("text-emerald-400", !isError);

  if (statusIconEl) {
    statusIconEl.textContent = isError ? "wifi_off" : "check_circle";
    statusIconEl.classList.toggle("text-error", isError);
    statusIconEl.classList.toggle("text-emerald-400", !isError);
  }
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
    
    if (eventsRes.ok && mitigationsRes.ok && sprint4Res.ok) {
      updateStatus("Connected: real-time polling active", false);
    } else {
      updateStatus("API unreachable: CONNECTION_REFUSED", true);
    }
  } catch (err) {
    updateStatus("API unreachable: CONNECTION_REFUSED", true);
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

const ucMap = {
  "btn-uc-012": "012",
  "btn-uc-013": "013",
  "btn-uc-014": "014",
  "btn-uc-015": "015",
  "btn-uc-016": "016",
  "btn-uc-018": "018",
  "btn-uc-019": "019"
};

Object.entries(ucMap).forEach(([id, uc]) => {
  document.getElementById(id)?.addEventListener("click", () => {
    triggerSimulation(`/simulate/uc-${uc}`, `UC-${uc}`);
  });
});

// Traffic Control
const trafficBtn = document.getElementById("btn-traffic");
let trafficRunning = false;

function setTrafficButtonLabel() {
  if (!trafficBtn) return;
  trafficBtn.textContent = trafficRunning ? "Stop Simulation" : "Start Simulation";
  trafficBtn.classList.toggle("bg-[#10b981]", !trafficRunning);
  trafficBtn.classList.toggle("hover:bg-[#059669]", !trafficRunning);
  trafficBtn.classList.toggle("bg-rose-600", trafficRunning);
  trafficBtn.classList.toggle("hover:bg-rose-500", trafficRunning);
}

setTrafficButtonLabel();

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
    setTrafficButtonLabel();
    updateStatus(trafficRunning ? "Simulation running" : "Connected: real-time polling active", false);
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
    updateStatus("Connected: real-time polling active", false);
  } catch (err) {
    updateStatus("Clear failed", true);
  }
}

clearBtn?.addEventListener?.("click", clearEvents);
