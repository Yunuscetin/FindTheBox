const statsElements = {
  adminTokenForm: document.getElementById("adminTokenForm"),
  adminTokenInput: document.getElementById("adminTokenInput"),
  adminTokenHint: document.getElementById("adminTokenHint"),
  onlinePlayersValue: document.getElementById("onlinePlayersValue"),
  playerCapacityValue: document.getElementById("playerCapacityValue"),
  totalRoomsValue: document.getElementById("totalRoomsValue"),
  waitingRoomsValue: document.getElementById("waitingRoomsValue"),
  playingRoomsValue: document.getElementById("playingRoomsValue"),
  celebratingRoomsValue: document.getElementById("celebratingRoomsValue"),
  finishedRoomsValue: document.getElementById("finishedRoomsValue"),
  lastUpdatedValue: document.getElementById("lastUpdatedValue")
};

const ADMIN_STORAGE_KEY = "findthebox-admin-token";

async function fetchStats() {
  const adminToken = sessionStorage.getItem(ADMIN_STORAGE_KEY) || "";
  const response = await fetch("/api/stats", {
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": adminToken
    },
    cache: "no-store"
  });

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "İstatistikler alınamadı.");
  }

  return payload.stats;
}

function formatUpdatedAt(timestamp) {
  if (!timestamp) {
    return "Henüz veri alınmadı";
  }

  const formatted = new Date(timestamp * 1000).toLocaleString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit"
  });

  return `Son güncelleme: ${formatted}`;
}

function renderStats(stats) {
  statsElements.onlinePlayersValue.textContent = String(stats.players.online);
  statsElements.playerCapacityValue.textContent = `Kapasite: ${stats.players.capacity}`;
  statsElements.totalRoomsValue.textContent = String(stats.rooms.total);
  statsElements.waitingRoomsValue.textContent = String(stats.rooms.waiting);
  statsElements.playingRoomsValue.textContent = String(stats.rooms.playing);
  statsElements.celebratingRoomsValue.textContent = String(stats.rooms.celebrating);
  statsElements.finishedRoomsValue.textContent = String(stats.rooms.finished);
  statsElements.lastUpdatedValue.textContent = formatUpdatedAt(stats.updatedAt);
}

async function refreshStats() {
  try {
    const stats = await fetchStats();
    statsElements.adminTokenHint.textContent = "Canlı veriler yükleniyor ve sayfa otomatik yenileniyor.";
    renderStats(stats);
  } catch (error) {
    statsElements.lastUpdatedValue.textContent = error.message;
    statsElements.adminTokenHint.textContent = error.message;
  }
}

statsElements.adminTokenForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = statsElements.adminTokenInput.value.trim();

  if (!token) {
    statsElements.adminTokenHint.textContent = "Önce geçerli bir admin token gir.";
    return;
  }

  sessionStorage.setItem(ADMIN_STORAGE_KEY, token);
  statsElements.adminTokenInput.value = "";
  await refreshStats();
});

refreshStats();
window.setInterval(refreshStats, 10000);
