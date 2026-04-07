const STORAGE_KEYS = {
  playerName: "yesil-kutu-player-name"
};

const SESSION_KEYS = {
  playerId: "yesil-kutu-session-player-id"
};

function resolveApiBase() {
  const isHttp = window.location.protocol === "http:" || window.location.protocol === "https:";
  const isLocalHost = ["127.0.0.1", "localhost"].includes(window.location.hostname);

  if (!isHttp || (isLocalHost && window.location.port !== "8000")) {
    return "http://127.0.0.1:8000/api";
  }

  return `${window.location.origin}/api`;
}

const API_BASE = resolveApiBase();

const elements = {
  homeView: document.getElementById("homeView"),
  roomView: document.getElementById("roomView"),
  playerBadge: document.getElementById("playerBadge"),
  homeBrandButton: document.getElementById("homeBrandButton"),
  createRoomButton: document.getElementById("createRoomButton"),
  createRoomDialog: document.getElementById("createRoomDialog"),
  createRoomForm: document.getElementById("createRoomForm"),
  maxPlayersSelect: document.getElementById("maxPlayersSelect"),
  cancelCreateRoomButton: document.getElementById("cancelCreateRoomButton"),
  joinRoomForm: document.getElementById("joinRoomForm"),
  roomCodeInput: document.getElementById("roomCodeInput"),
  roomCodeLabel: document.getElementById("roomCodeLabel"),
  inviteLinkInput: document.getElementById("inviteLinkInput"),
  copyInviteButton: document.getElementById("copyInviteButton"),
  playersList: document.getElementById("playersList"),
  playerCountLabel: document.getElementById("playerCountLabel"),
  leaderboardList: document.getElementById("leaderboardList"),
  leaderLabel: document.getElementById("leaderLabel"),
  stepRuleText: document.getElementById("stepRuleText"),
  statusHeading: document.getElementById("statusHeading"),
  statusText: document.getElementById("statusText"),
  turnLabel: document.getElementById("turnLabel"),
  stepLabel: document.getElementById("stepLabel"),
  bonusLabel: document.getElementById("bonusLabel"),
  startGameButton: document.getElementById("startGameButton"),
  leaveRoomButton: document.getElementById("leaveRoomButton"),
  board: document.getElementById("board"),
  stepResultsList: document.getElementById("stepResultsList"),
  resultsCountLabel: document.getElementById("resultsCountLabel"),
  nameDialog: document.getElementById("nameDialog"),
  nameForm: document.getElementById("nameForm"),
  nameInput: document.getElementById("nameInput"),
  restartDialog: document.getElementById("restartDialog"),
  restartTitle: document.getElementById("restartTitle"),
  restartText: document.getElementById("restartText"),
  restartGameButton: document.getElementById("restartGameButton"),
  closeRestartDialogButton: document.getElementById("closeRestartDialogButton"),
  toast: document.getElementById("toast"),
  celebrationOverlay: document.getElementById("celebrationOverlay"),
  celebrationTitle: document.getElementById("celebrationTitle"),
  celebrationText: document.getElementById("celebrationText")
};

const state = {
  playerId: sessionStorage.getItem(SESSION_KEYS.playerId) || crypto.randomUUID(),
  playerName: (localStorage.getItem(STORAGE_KEYS.playerName) || "").trim(),
  roomCode: null,
  room: null,
  pollTimer: null,
  restartDialogShownForTournament: false,
  isLeaving: false,
  pendingMove: false,
  lastCelebratedTurnCount: 0
};

sessionStorage.setItem(SESSION_KEYS.playerId, state.playerId);

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(showToast.timerId);
  showToast.timerId = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2400);
}

function showCelebration(title, text) {
  elements.celebrationTitle.textContent = title;
  elements.celebrationText.textContent = text;
  elements.celebrationOverlay.classList.add("visible");
}

function hideCelebration() {
  elements.celebrationOverlay.classList.remove("visible");
}

function persistPlayerName(name) {
  state.playerName = name.trim();
  localStorage.setItem(STORAGE_KEYS.playerName, state.playerName);
  elements.playerBadge.textContent = state.playerName || "-";
}

async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const rawText = await response.text();
  let payload = {};

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch (error) {
      throw new Error(`Sunucu beklenmeyen bir yanıt döndürdü (${response.status}).`);
    }
  }

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `${options.method || "GET"} ${apiUrl(path)} başarısız oldu (${response.status}).`);
  }

  return payload;
}

function postJson(path, body) {
  return request(path, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

function ensurePlayerName() {
  if (state.playerName) {
    elements.playerBadge.textContent = state.playerName;
    return Promise.resolve();
  }

  elements.nameInput.value = state.playerName;
  elements.nameDialog.showModal();

  return new Promise((resolve) => {
    const submitHandler = (event) => {
      event.preventDefault();
      const name = elements.nameInput.value.trim();

      if (!name) {
        elements.nameInput.focus();
        return;
      }

      persistPlayerName(name);
      elements.nameDialog.close();
      elements.nameForm.removeEventListener("submit", submitHandler);
      resolve();
    };

    elements.nameForm.addEventListener("submit", submitHandler);
  });
}

function setActiveView(view) {
  elements.homeView.classList.toggle("active", view === "home");
  elements.roomView.classList.toggle("active", view === "room");
}

function updateInviteLink(roomCode) {
  const inviteUrl = new URL(window.location.href);
  inviteUrl.searchParams.set("room", roomCode);
  elements.inviteLinkInput.value = inviteUrl.toString();
}

function renderPlayers(room) {
  elements.playersList.innerHTML = "";
  elements.playerCountLabel.textContent = `${room.players.length}/${room.maxPlayers}`;

  room.players.forEach((player) => {
    const item = document.createElement("li");
    const meta = document.createElement("div");
    const avatar = document.createElement("div");
    const nameWrap = document.createElement("div");
    const name = document.createElement("strong");
    const subline = document.createElement("div");

    meta.className = "player-meta";
    avatar.className = "avatar";
    avatar.textContent = player.initials;
    name.textContent = player.name;
    subline.className = "subline";
    subline.textContent = `${player.stepWins} tur galibiyeti`;

    if (player.id === room.hostId) {
      subline.textContent += " • Oda sahibi";
    }

    nameWrap.append(name, subline);
    meta.append(avatar, nameWrap);
    item.appendChild(meta);

    if (player.id === room.currentTurnPlayerId && room.phase === "playing") {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = "Sırada";
      item.appendChild(pill);
    } else if (player.id === state.playerId) {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = "Sen";
      item.appendChild(pill);
    }

    elements.playersList.appendChild(item);
  });
}

function renderLeaderboard(room) {
  elements.leaderboardList.innerHTML = "";
  const leaders = room.leaderboard.filter((player) => player.isLeader);
  elements.leaderLabel.textContent = leaders.length === 0 ? "-" : leaders.length === 1 ? leaders[0].name : "Paylaşımlı";

  room.leaderboard.forEach((player, index) => {
    const item = document.createElement("li");
    item.className = "compact";
    const left = document.createElement("div");
    const right = document.createElement("strong");

    left.innerHTML = `<strong>#${index + 1} ${player.name}</strong><div class="subline">${player.stepWins} tur birinciliği</div>`;
    right.textContent = player.isLeader ? "Lider" : "";
    item.append(left, right);
    elements.leaderboardList.appendChild(item);
  });
}

function renderTurnResults(room) {
  elements.stepResultsList.innerHTML = "";
  elements.resultsCountLabel.textContent = `${room.stepResults.length}/${room.totalSteps}`;

  room.stepResults.forEach((result) => {
    const item = document.createElement("li");
    item.className = "compact";
    item.innerHTML = `<strong>${result.step}. tur</strong><span>${result.winnerName}</span>`;
    elements.stepResultsList.appendChild(item);
  });
}

function renderTurnRule(room) {
  const rules = {
    1: "1. turda 100 kutu vardır ve herkes sırayla 1 kutu açar.",
    2: "2. turda 80 kutu vardır. 1. turu kazanan oyuncu ilk başlar ve arka arkaya 5 kutu açar.",
    3: "3. turda 60 kutu vardır. 2. turu kazanan oyuncu ilk başlar ve 5 kutu açma avantajı alır.",
    4: "4. turda 50 kutu vardır. 3. turu kazanan oyuncu yine 5 kutu açarak başlar.",
    5: "5. turda 40 kutu vardır. 4. turu kazanan oyuncu ilk başlar ve bu kez 3 kutu açabilir."
  };

  elements.stepRuleText.textContent = rules[room.currentStep] || "";
}

function handleTileClick(index) {
  if (!state.roomCode || state.pendingMove || !state.room || state.room.phase !== "playing") {
    return;
  }

  state.pendingMove = true;
  elements.statusText.textContent = "Hamlen gönderiliyor...";

  postJson(`/rooms/${state.roomCode}/click`, {
    playerId: state.playerId,
    tileIndex: index
  })
    .then((payload) => {
      renderRoom(payload.room);
      scheduleNextPoll();
    })
    .catch(async (error) => {
      showToast(error.message);
      state.pendingMove = false;
      await fetchRoomState();
    });
}

function renderBoard(room) {
  elements.board.innerHTML = "";

  room.board.forEach((tile, index) => {
    const button = document.createElement("button");
    const label = document.createElement("span");
    const isClickable =
      room.phase === "playing" &&
      room.currentTurnPlayerId === state.playerId &&
      tile.state === "hidden" &&
      !state.pendingMove;

    button.type = "button";
    button.className = "tile";
    label.className = "tile-label";

    if (tile.state === "revealed") {
      button.classList.add("revealed", tile.color);
      label.textContent = tile.initials || "";
      button.disabled = true;
    } else {
      button.disabled = !isClickable;
      if (isClickable) {
        button.classList.add("ready");
      }
    }

    button.appendChild(label);
    button.addEventListener("click", () => handleTileClick(index));
    elements.board.appendChild(button);
  });
}

function maybeShowCelebration(room) {
  if (room.phase !== "celebrating") {
    hideCelebration();
    return;
  }

  if (state.lastCelebratedTurnCount !== room.stepResults.length) {
    state.lastCelebratedTurnCount = room.stepResults.length;
  }

  const winner = room.players.find((player) => player.id === room.winnerId);
  const nextTurn = Math.min(room.currentStep + 1, room.totalSteps);
  const title = room.currentStep === room.totalSteps
    ? `${winner?.name || "Bir oyuncu"} son turu kazandı`
    : `${winner?.name || "Bir oyuncu"} ${room.currentStep}. turu kazandı`;
  const text = room.currentStep === room.totalSteps
    ? "Lider tablosu hazırlanıyor. Son ekran birazdan gelecek."
    : `${nextTurn}. tur ${room.secondsUntilNextStep} saniye içinde başlayacak.`;

  showCelebration(title, text);
}

function renderStatus(room) {
  const isHost = room.hostId === state.playerId;
  const currentTurn = room.players.find((player) => player.id === room.currentTurnPlayerId);
  const openingPlayer = room.players.find((player) => player.id === room.openingPlayerId);

  elements.stepLabel.textContent = `${room.currentStep}/${room.totalSteps}`;
  elements.turnLabel.textContent = room.phase === "playing" && currentTurn
    ? currentTurn.name
    : room.phase === "finished"
      ? "Turnuva bitti"
      : room.phase === "celebrating"
        ? "Tur tamamlanıyor"
        : "Başlamadı";
  elements.bonusLabel.textContent = room.openingStreakRemaining > 0 && openingPlayer
    ? `${openingPlayer.name}: ${room.openingStreakRemaining}`
    : "-";

  if (room.phase === "waiting") {
    elements.statusHeading.textContent = "Turnuva hazır";
    elements.statusText.textContent = isHost
      ? `En az 2 oyuncu olduğunda ${room.maxPlayers} kişilik turnuvayı başlatabilirsin.`
      : "Oda sahibinin turnuvayı başlatmasını bekliyorsun.";
  }

  if (room.phase === "playing") {
    elements.statusHeading.textContent = `Tur ${room.currentStep} oynanıyor`;

    if (currentTurn?.id === state.playerId) {
      elements.statusText.textContent = room.openingStreakRemaining > 0 && room.openingPlayerId === state.playerId
        ? `Avantaj sende. Bu açılış serisinde ${room.openingStreakRemaining} kutu hakkın kaldı.`
        : state.pendingMove
          ? "Hamlen gönderiliyor..."
          : "Sıra sende. Bir kutu seç ve yeşili bulmaya çalış.";
    } else {
      elements.statusText.textContent = room.openingStreakRemaining > 0 && openingPlayer
        ? `${openingPlayer.name} avantaj serisini oynuyor. Sonra normal sıra devam edecek.`
        : `${currentTurn?.name || "Bir oyuncu"} kutu seçimini yapıyor.`;
    }
  }

  if (room.phase === "celebrating") {
    const winner = room.players.find((player) => player.id === room.winnerId);
    elements.statusHeading.textContent = `${winner?.name || "Bir oyuncu"} turu kazandı`;
    elements.statusText.textContent = room.currentStep === room.totalSteps
      ? "Turnuva sonucu açıklanıyor."
      : `Yeni tur ${room.secondsUntilNextStep} saniye içinde başlayacak.`;
  }

  if (room.phase === "finished") {
    const leaders = room.leaderboard.filter((player) => player.isLeader);
    elements.statusHeading.textContent = leaders.length > 1 ? "Paylaşımlı liderlik" : `${leaders[0]?.name || "Oyuncu"} turnuvayı önde bitirdi`;
    elements.statusText.textContent = leaders.length > 1
      ? `${leaders.map((player) => player.name).join(", ")} aynı sayıda tur kazandı.`
      : `${leaders[0]?.name || "Oyuncu"} en fazla tur birinciliğini aldı.`;
  }

  elements.startGameButton.disabled = !isHost || room.phase !== "waiting" || room.players.length < 2;
}

function maybeShowRestartDialog(room) {
  const isHost = room.hostId === state.playerId;
  if (!isHost || room.phase !== "finished" || state.restartDialogShownForTournament) {
    return;
  }

  const leaders = room.leaderboard.filter((player) => player.isLeader);
  elements.restartTitle.textContent = leaders.length > 1
    ? "Turnuva beraberlikle bitti"
    : `${leaders[0]?.name || "Oyuncu"} lider oldu`;
  elements.restartText.textContent = "Aynı lobiyle 5 turluk yeni bir turnuva başlatmak ister misin?";
  elements.restartDialog.showModal();
  state.restartDialogShownForTournament = true;
}

function renderRoom(room) {
  const previousPhase = state.room?.phase;
  state.room = room;
  state.pendingMove = false;

  if (previousPhase === "celebrating" && room.phase !== "celebrating") {
    hideCelebration();
  }

  updateInviteLink(room.code);
  renderPlayers(room);
  renderLeaderboard(room);
  renderTurnResults(room);
  renderTurnRule(room);
  renderStatus(room);
  renderBoard(room);
  maybeShowCelebration(room);
  setActiveView("room");
  maybeShowRestartDialog(room);
}

function clearPoll() {
  if (state.pollTimer) {
    window.clearTimeout(state.pollTimer);
    state.pollTimer = null;
  }
}

function scheduleNextPoll(delay = 700) {
  clearPoll();
  state.pollTimer = window.setTimeout(fetchRoomState, delay);
}

async function fetchRoomState() {
  if (!state.roomCode) {
    return;
  }

  try {
    const payload = await request(`/rooms/${state.roomCode}?playerId=${encodeURIComponent(state.playerId)}`, {
      method: "GET"
    });
    renderRoom(payload.room);
  } catch (error) {
    state.pendingMove = false;
    if (!state.isLeaving) {
      showToast(error.message);
    }
    leaveRoom({ silent: true });
    return;
  }

  scheduleNextPoll();
}

async function createRoom(maxPlayers) {
  await ensurePlayerName();
  const payload = await postJson("/rooms", {
    playerId: state.playerId,
    playerName: state.playerName,
    maxPlayers
  });

  state.roomCode = payload.room.code;
  state.restartDialogShownForTournament = false;
  state.lastCelebratedTurnCount = 0;
  window.history.replaceState({}, "", `?room=${payload.room.code}`);
  clearPoll();
  renderRoom(payload.room);
  scheduleNextPoll();
}

async function joinRoom(roomCode) {
  await ensurePlayerName();
  const payload = await postJson("/rooms/join", {
    roomCode: roomCode.trim().toUpperCase(),
    playerId: state.playerId,
    playerName: state.playerName
  });

  state.roomCode = payload.room.code;
  state.restartDialogShownForTournament = false;
  state.lastCelebratedTurnCount = payload.room.stepResults.length;
  window.history.replaceState({}, "", `?room=${payload.room.code}`);
  clearPoll();
  renderRoom(payload.room);
  scheduleNextPoll();
}

async function startGame() {
  const payload = await postJson(`/rooms/${state.roomCode}/start`, {
    playerId: state.playerId
  });
  renderRoom(payload.room);
  showToast("Turnuva başlatıldı.");
  scheduleNextPoll();
}

async function restartGame() {
  const payload = await postJson(`/rooms/${state.roomCode}/restart`, {
    playerId: state.playerId
  });
  elements.restartDialog.close();
  state.restartDialogShownForTournament = false;
  renderRoom(payload.room);
  state.lastCelebratedTurnCount = 0;
  showToast("Yeni turnuva açıldı.");
  scheduleNextPoll();
}

async function notifyLeaveRoom() {
  if (!state.roomCode) {
    return;
  }

  try {
    await postJson(`/rooms/${state.roomCode}/leave`, {
      playerId: state.playerId
    });
  } catch (error) {
    return;
  }
}

function leaveRoom({ silent = false } = {}) {
  clearPoll();
  state.roomCode = null;
  state.room = null;
  state.restartDialogShownForTournament = false;
  state.isLeaving = false;
  state.pendingMove = false;
  state.lastCelebratedTurnCount = 0;
  hideCelebration();
  window.history.replaceState({}, "", window.location.pathname);
  setActiveView("home");
  if (!silent) {
    showToast("Lobiden ayrıldın.");
  }
}

function setupEvents() {
  elements.homeBrandButton.addEventListener("click", () => {
    if (state.roomCode) {
      leaveRoom({ silent: true });
    } else {
      setActiveView("home");
    }
  });

  elements.createRoomButton.addEventListener("click", async () => {
    await ensurePlayerName();
    elements.createRoomDialog.showModal();
  });

  elements.createRoomForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const maxPlayers = Number(elements.maxPlayersSelect.value);
      elements.createRoomDialog.close();
      await createRoom(maxPlayers);
    } catch (error) {
      showToast(error.message);
    }
  });

  elements.cancelCreateRoomButton.addEventListener("click", () => {
    elements.createRoomDialog.close();
  });

  elements.joinRoomForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const roomCode = elements.roomCodeInput.value.trim();

    if (!roomCode) {
      showToast("Oda kodu yazmalısın.");
      return;
    }

    try {
      await joinRoom(roomCode);
      elements.roomCodeInput.value = "";
    } catch (error) {
      showToast(error.message);
    }
  });

  elements.copyInviteButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(elements.inviteLinkInput.value);
      showToast("Davet linki kopyalandı.");
    } catch (error) {
      showToast("Link kopyalanamadı.");
    }
  });

  elements.startGameButton.addEventListener("click", async () => {
    try {
      await startGame();
    } catch (error) {
      showToast(error.message);
    }
  });

  elements.leaveRoomButton.addEventListener("click", async () => {
    state.isLeaving = true;
    await notifyLeaveRoom();
    leaveRoom();
  });

  elements.restartGameButton.addEventListener("click", async () => {
    try {
      await restartGame();
    } catch (error) {
      showToast(error.message);
    }
  });

  elements.closeRestartDialogButton.addEventListener("click", () => {
    elements.restartDialog.close();
  });

  window.addEventListener("beforeunload", () => {
    if (!state.roomCode) {
      return;
    }

    const data = JSON.stringify({ playerId: state.playerId });
    navigator.sendBeacon(apiUrl(`/rooms/${state.roomCode}/leave`), new Blob([data], { type: "application/json" }));
  });
}

async function bootstrap() {
  persistPlayerName(state.playerName);
  setupEvents();

  const roomCode = new URLSearchParams(window.location.search).get("room");
  if (roomCode) {
    try {
      await joinRoom(roomCode);
    } catch (error) {
      showToast(error.message);
      leaveRoom({ silent: true });
    }
  } else {
    setActiveView("home");
  }
}

bootstrap();
