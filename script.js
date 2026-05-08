const STORAGE_KEYS = {
  playerName: "yesil-kutu-player-name",
  language: "yesil-kutu-language"
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
  brandEyebrow: document.getElementById("brandEyebrow"),
  brandTitle: document.getElementById("brandTitle"),
  languageLabel: document.getElementById("languageLabel"),
  languageSelect: document.getElementById("languageSelect"),
  playerBadgeLabel: document.getElementById("playerBadgeLabel"),
  playerBadge: document.getElementById("playerBadge"),
  homeBrandButton: document.getElementById("homeBrandButton"),
  heroKicker: document.getElementById("heroKicker"),
  heroTitle: document.getElementById("heroTitle"),
  heroDescription: document.getElementById("heroDescription"),
  heroRuleFlowTitle: document.getElementById("heroRuleFlowTitle"),
  heroRuleFlowText: document.getElementById("heroRuleFlowText"),
  heroRule1Title: document.getElementById("heroRule1Title"),
  heroRule1Text: document.getElementById("heroRule1Text"),
  heroRule2Title: document.getElementById("heroRule2Title"),
  heroRule2Text: document.getElementById("heroRule2Text"),
  heroRule3Title: document.getElementById("heroRule3Title"),
  heroRule3Text: document.getElementById("heroRule3Text"),
  heroRule4Title: document.getElementById("heroRule4Title"),
  heroRule4Text: document.getElementById("heroRule4Text"),
  heroRule5Title: document.getElementById("heroRule5Title"),
  heroRule5Text: document.getElementById("heroRule5Text"),
  heroRuleLeaderTitle: document.getElementById("heroRuleLeaderTitle"),
  heroRuleLeaderText: document.getElementById("heroRuleLeaderText"),
  guidesTitle: document.getElementById("guidesTitle"),
  guidePrimary: document.getElementById("guidePrimary"),
  guideSecondary: document.getElementById("guideSecondary"),
  sidebarNoteTitle: document.getElementById("sidebarNoteTitle"),
  sidebarNoteText: document.getElementById("sidebarNoteText"),
  createRoomButton: document.getElementById("createRoomButton"),
  createRoomDialog: document.getElementById("createRoomDialog"),
  createRoomForm: document.getElementById("createRoomForm"),
  maxPlayersSelect: document.getElementById("maxPlayersSelect"),
  cancelCreateRoomButton: document.getElementById("cancelCreateRoomButton"),
  joinRoomForm: document.getElementById("joinRoomForm"),
  joinRoomLabel: document.getElementById("joinRoomLabel"),
  joinRequestNotice: document.getElementById("joinRequestNotice"),
  joinRequestNoticeText: document.getElementById("joinRequestNoticeText"),
  roomCodeInput: document.getElementById("roomCodeInput"),
  roomInfoKicker: document.getElementById("roomInfoKicker"),
  roomCodeTitle: document.getElementById("roomCodeTitle"),
  roomCodeLabel: document.getElementById("roomCodeLabel"),
  inviteLinkLabel: document.getElementById("inviteLinkLabel"),
  inviteLinkInput: document.getElementById("inviteLinkInput"),
  copyInviteButton: document.getElementById("copyInviteButton"),
  playersTitle: document.getElementById("playersTitle"),
  playersList: document.getElementById("playersList"),
  playerCountLabel: document.getElementById("playerCountLabel"),
  pendingRequestsTitle: document.getElementById("pendingRequestsTitle"),
  pendingRequestsCard: document.getElementById("pendingRequestsCard"),
  pendingRequestsCountLabel: document.getElementById("pendingRequestsCountLabel"),
  pendingRequestsList: document.getElementById("pendingRequestsList"),
  leaderboardTitle: document.getElementById("leaderboardTitle"),
  leaderboardList: document.getElementById("leaderboardList"),
  leaderLabel: document.getElementById("leaderLabel"),
  turnRuleTitle: document.getElementById("turnRuleTitle"),
  stepRuleText: document.getElementById("stepRuleText"),
  gameStatusKicker: document.getElementById("gameStatusKicker"),
  statusHeading: document.getElementById("statusHeading"),
  statusText: document.getElementById("statusText"),
  turnTitle: document.getElementById("turnTitle"),
  turnLabel: document.getElementById("turnLabel"),
  roundTitle: document.getElementById("roundTitle"),
  stepLabel: document.getElementById("stepLabel"),
  bonusTitle: document.getElementById("bonusTitle"),
  bonusLabel: document.getElementById("bonusLabel"),
  timerTitle: document.getElementById("timerTitle"),
  turnTimerLabel: document.getElementById("turnTimerLabel"),
  startGameButton: document.getElementById("startGameButton"),
  leaveRoomButton: document.getElementById("leaveRoomButton"),
  board: document.getElementById("board"),
  turnResultsTitle: document.getElementById("turnResultsTitle"),
  stepResultsList: document.getElementById("stepResultsList"),
  resultsCountLabel: document.getElementById("resultsCountLabel"),
  nameDialog: document.getElementById("nameDialog"),
  nameDialogKicker: document.getElementById("nameDialogKicker"),
  nameForm: document.getElementById("nameForm"),
  nameDialogTitle: document.getElementById("nameDialogTitle"),
  nameDialogText: document.getElementById("nameDialogText"),
  nameInput: document.getElementById("nameInput"),
  nameDialogSubmit: document.getElementById("nameDialogSubmit"),
  restartDialog: document.getElementById("restartDialog"),
  restartDialogKicker: document.getElementById("restartDialogKicker"),
  restartTitle: document.getElementById("restartTitle"),
  restartText: document.getElementById("restartText"),
  restartGameButton: document.getElementById("restartGameButton"),
  closeRestartDialogButton: document.getElementById("closeRestartDialogButton"),
  createRoomDialogKicker: document.getElementById("createRoomDialogKicker"),
  createRoomDialogTitle: document.getElementById("createRoomDialogTitle"),
  createRoomDialogText: document.getElementById("createRoomDialogText"),
  maxPlayersLabel: document.getElementById("maxPlayersLabel"),
  createRoomSubmit: document.getElementById("createRoomSubmit"),
  toast: document.getElementById("toast"),
  celebrationOverlay: document.getElementById("celebrationOverlay"),
  celebrationKicker: document.getElementById("celebrationKicker"),
  celebrationTitle: document.getElementById("celebrationTitle"),
  celebrationText: document.getElementById("celebrationText")
};

const state = {
  playerId: sessionStorage.getItem(SESSION_KEYS.playerId) || crypto.randomUUID(),
  playerName: (localStorage.getItem(STORAGE_KEYS.playerName) || "").trim(),
  roomCode: null,
  room: null,
  pollTimer: null,
  pendingJoinPollTimer: null,
  socket: null,
  socketRoomCode: null,
  socketReconnectTimer: null,
  socketHeartbeatTimer: null,
  socketConnected: false,
  restartDialogShownForTournament: false,
  isLeaving: false,
  pendingMove: false,
  lastCelebratedTurnCount: 0,
  pendingApprovalRoomCode: null,
  lastSeenTimeoutAt: 0,
  language: localStorage.getItem(STORAGE_KEYS.language) || "en"
};

const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
if (requestedLanguage === "tr" || requestedLanguage === "en") {
  state.language = requestedLanguage;
  localStorage.setItem(STORAGE_KEYS.language, requestedLanguage);
}

if (!localStorage.getItem(STORAGE_KEYS.language)) {
  state.language = (navigator.language || "en").toLowerCase().startsWith("tr") ? "tr" : "en";
}

function roomSocketUrl(roomCode) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const base = `${protocol}//${window.location.host}`;

  if (window.location.protocol !== "http:" && window.location.protocol !== "https:") {
    return `ws://127.0.0.1:8000/ws/rooms/${encodeURIComponent(roomCode)}?playerId=${encodeURIComponent(state.playerId)}`;
  }

  if (["127.0.0.1", "localhost"].includes(window.location.hostname) && window.location.port !== "8000") {
    return `ws://127.0.0.1:8000/ws/rooms/${encodeURIComponent(roomCode)}?playerId=${encodeURIComponent(state.playerId)}`;
  }

  return `${base}/ws/rooms/${encodeURIComponent(roomCode)}?playerId=${encodeURIComponent(state.playerId)}`;
}

const translations = {
  tr: {
    siteTitle: "Yeşil Kutuyu Bul",
    brandEyebrow: "Çok Oyunculu Tarayıcı Oyunu",
    brandTitle: "Yeşil Kutuyu Bul",
    languageLabel: "Dil",
    playerBadgeLabel: "Oyuncu",
    heroKicker: "Lobi tabanlı oyun",
    heroTitle: "Arkadaşlarını davet et, turlar boyunca yeşil kutuları topla, puan tablosunda zirveye çık.",
    heroDescription: "Oyun sahibi bir oda kurar, oyuncu sayısını belirler ve arkadaşlarını davet eder. Oyuncular davet linki ya da oda koduyla lobiye katılır. Turnuva başladığında herkes sırayla kutu açar, bulunan her yeşil kutu puan kazandırır. Finalde en çok yeşil kutu puanı toplayan oyuncu kazanır.",
    heroRuleFlowTitle: "Oyun Akışı",
    heroRuleFlowText: "Toplam 5 tur vardır. Kutu sayısı azalır, yeşil kutu sayısı 5'ten 1'e düşer ve tüm puanlar final tabloya yazılır.",
    heroRule1Title: "Tur 1",
    heroRule1Text: "100 kutuda 5 yeşil kutu vardır. Her oyuncu sırayla 1 kutu açar.",
    heroRule2Title: "Tur 2",
    heroRule2Text: "80 kutuda 4 yeşil kutu vardır.",
    heroRule3Title: "Tur 3",
    heroRule3Text: "60 kutuda 3 yeşil kutu vardır.",
    heroRule4Title: "Tur 4",
    heroRule4Text: "50 kutuda 2 yeşil kutu vardır.",
    heroRule5Title: "Tur 5",
    heroRule5Text: "40 kutuda 1 yeşil kutu vardır.",
    heroRuleLeaderTitle: "Liderlik",
    heroRuleLeaderText: "Turnuva sonunda en çok yeşil kutu puanı toplayan oyuncu lider olur. Eşitlik varsa liderlik paylaşılır.",
    guidesTitle: "Rehberler",
    guidePrimary: "Yeşil Kutuyu Bul nasıl oynanır?",
    guideSecondary: "Arkadaşlarla browser oyunu",
    sidebarNoteTitle: "Oyun Hakkında",
    sidebarNoteText: "Önce rehberlere göz atabilir, sonra oda kurup puanlı turnuvayı başlatabilirsin.",
    createRoom: "Oyun Kur",
    joinByCode: "Oda kodu ile katıl",
    joinGame: "Oyuna Katıl",
    joinRequestTitle: "Katılım isteği gönderildi",
    joinRequestText: "Oda sahibinin onayı bekleniyor. Onay gelirse otomatik olarak odaya alınacaksın.",
    roomInfoKicker: "Oda Bilgileri",
    roomCodeTitle: "Oda Kodu",
    inviteLinkLabel: "Davet Linki",
    copy: "Kopyala",
    playersTitle: "Oyuncular",
    pendingRequestsTitle: "Katılım İstekleri",
    leaderboardTitle: "Lider Tablosu",
    turnRuleTitle: "Tur Kuralı",
    gameStatusKicker: "Oyun Durumu",
    startGame: "Oyunu Başlat",
    leaveRoom: "Lobiden Ayrıl",
    turnTitle: "Sıra",
    roundTitle: "Tur",
    bonusTitle: "Yeşil Kalan",
    timerTitle: "Süre",
    turnResultsTitle: "Tur Sonuçları",
    nameDialogKicker: "İlk Giriş",
    nameDialogTitle: "Oyuncu adını yaz",
    nameDialogText: "Bu isim kutuların üstünde görünecek ve lobide seni temsil edecek.",
    namePlaceholder: "İsminiz",
    continue: "Devam Et",
    createRoomDialogKicker: "Oda Ayarları",
    createRoomDialogTitle: "Oyuncu sayısını seç",
    createRoomDialogText: "Lobi oluşturulurken maksimum oyuncu sayısını belirleyebilirsin.",
    maxPlayersLabel: "Maksimum oyuncu",
    createRoomSubmit: "Odayı Kur",
    cancel: "Vazgeç",
    restartDialogKicker: "Tur Tamamlandı",
    restartGame: "Tekrar Başlat",
    later: "Daha Sonra",
    celebrationKicker: "Tur Tamamlandı",
    pending: "Bekleniyor",
    turnRule1: "1. turda 100 kutu içinde 5 yeşil kutu vardır. Herkes sırayla 1 kutu açar.",
    turnRule2: "2. turda 80 kutu içinde 4 yeşil kutu vardır.",
    turnRule3: "3. turda 60 kutu içinde 3 yeşil kutu vardır.",
    turnRule4: "4. turda 50 kutu içinde 2 yeşil kutu vardır.",
    turnRule5: "5. turda 40 kutu içinde 1 yeşil kutu vardır."
  },
  en: {
    siteTitle: "Find the Green Box",
    brandEyebrow: "Multiplayer Browser Game",
    brandTitle: "Find the Green Box",
    languageLabel: "Language",
    playerBadgeLabel: "Player",
    heroKicker: "Lobby-based game",
    heroTitle: "Invite your friends, collect green boxes across every round, and finish on top of the score table.",
    heroDescription: "The host creates a room, sets the player count, and invites friends. Players join via invite link or room code. Once the tournament starts, everyone opens boxes in turn, and every green box adds to the player's score. The highest total at the end wins.",
    heroRuleFlowTitle: "Game Flow",
    heroRuleFlowText: "There are 5 rounds in total. Box counts shrink, green box counts drop from 5 to 1, and every point carries into the final standings.",
    heroRule1Title: "Round 1",
    heroRule1Text: "Round 1 hides 5 green boxes among 100 boxes. Everyone opens 1 box in turn.",
    heroRule2Title: "Round 2",
    heroRule2Text: "Round 2 hides 4 green boxes among 80 boxes.",
    heroRule3Title: "Round 3",
    heroRule3Text: "Round 3 hides 3 green boxes among 60 boxes.",
    heroRule4Title: "Round 4",
    heroRule4Text: "Round 4 hides 2 green boxes among 50 boxes.",
    heroRule5Title: "Round 5",
    heroRule5Text: "Round 5 hides 1 green box among 40 boxes.",
    heroRuleLeaderTitle: "Leaderboard",
    heroRuleLeaderText: "At the end of the tournament, the player with the highest green-box score becomes the leader. Ties share the lead.",
    guidesTitle: "Guides",
    guidePrimary: "How to play Find the Green Box",
    guideSecondary: "Browser game with friends",
    sidebarNoteTitle: "About the Game",
    sidebarNoteText: "Browse the guides first, then create a room and launch the score-based tournament.",
    createRoom: "Create Room",
    joinByCode: "Join with room code",
    joinGame: "Join Game",
    joinRequestTitle: "Join request sent",
    joinRequestText: "Waiting for the host to approve your request. You will be added automatically if approved.",
    roomInfoKicker: "Room Info",
    roomCodeTitle: "Room Code",
    inviteLinkLabel: "Invite Link",
    copy: "Copy",
    playersTitle: "Players",
    pendingRequestsTitle: "Join Requests",
    leaderboardTitle: "Leaderboard",
    turnRuleTitle: "Round Rule",
    gameStatusKicker: "Game Status",
    startGame: "Start Game",
    leaveRoom: "Leave Lobby",
    turnTitle: "Turn",
    roundTitle: "Round",
    bonusTitle: "Greens Left",
    timerTitle: "Timer",
    turnResultsTitle: "Round Results",
    nameDialogKicker: "First Visit",
    nameDialogTitle: "Enter your player name",
    nameDialogText: "This name will appear on boxes and represent you in the lobby.",
    namePlaceholder: "Your name",
    continue: "Continue",
    createRoomDialogKicker: "Room Settings",
    createRoomDialogTitle: "Choose player count",
    createRoomDialogText: "You can set the maximum number of players when creating the lobby.",
    maxPlayersLabel: "Maximum players",
    createRoomSubmit: "Create Room",
    cancel: "Cancel",
    restartDialogKicker: "Round Closed",
    restartGame: "Restart",
    later: "Later",
    celebrationKicker: "Round Complete",
    pending: "Waiting",
    turnRule1: "Round 1 has 5 green boxes hidden among 100 boxes. Everyone opens 1 box in turn.",
    turnRule2: "Round 2 has 4 green boxes among 80 boxes.",
    turnRule3: "Round 3 has 3 green boxes among 60 boxes.",
    turnRule4: "Round 4 has 2 green boxes among 50 boxes.",
    turnRule5: "Round 5 has 1 green box among 40 boxes."
  }
};

function t(key) {
  return translations[state.language]?.[key] || translations.en[key] || key;
}

sessionStorage.setItem(SESSION_KEYS.playerId, state.playerId);

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

function applyLanguage() {
  document.documentElement.lang = state.language;
  document.title = t("siteTitle");
  elements.languageSelect.value = state.language;
  elements.brandEyebrow.textContent = t("brandEyebrow");
  elements.brandTitle.textContent = t("brandTitle");
  elements.languageLabel.textContent = t("languageLabel");
  elements.playerBadgeLabel.textContent = t("playerBadgeLabel");
  elements.heroKicker.textContent = t("heroKicker");
  elements.heroTitle.textContent = t("heroTitle");
  elements.heroDescription.textContent = t("heroDescription");
  elements.heroRuleFlowTitle.textContent = t("heroRuleFlowTitle");
  elements.heroRuleFlowText.textContent = t("heroRuleFlowText");
  elements.heroRule1Title.textContent = t("heroRule1Title");
  elements.heroRule1Text.textContent = t("heroRule1Text");
  elements.heroRule2Title.textContent = t("heroRule2Title");
  elements.heroRule2Text.textContent = t("heroRule2Text");
  elements.heroRule3Title.textContent = t("heroRule3Title");
  elements.heroRule3Text.textContent = t("heroRule3Text");
  elements.heroRule4Title.textContent = t("heroRule4Title");
  elements.heroRule4Text.textContent = t("heroRule4Text");
  elements.heroRule5Title.textContent = t("heroRule5Title");
  elements.heroRule5Text.textContent = t("heroRule5Text");
  elements.heroRuleLeaderTitle.textContent = t("heroRuleLeaderTitle");
  elements.heroRuleLeaderText.textContent = t("heroRuleLeaderText");
  elements.guidesTitle.textContent = t("guidesTitle");
  elements.guidePrimary.textContent = t("guidePrimary");
  elements.guideSecondary.textContent = t("guideSecondary");
  elements.guidePrimary.href = state.language === "tr" ? "/tr/nasil-oynanir/" : "/en/how-to-play/";
  elements.guideSecondary.href = state.language === "tr" ? "/tr/arkadaslarla-browser-oyunu/" : "/en/browser-game-with-friends/";
  elements.sidebarNoteTitle.textContent = t("sidebarNoteTitle");
  elements.sidebarNoteText.textContent = t("sidebarNoteText");
  elements.createRoomButton.textContent = t("createRoom");
  elements.joinRoomLabel.textContent = t("joinByCode");
  elements.joinRoomForm.querySelector("button[type='submit']").textContent = t("joinGame");
  elements.roomCodeInput.placeholder = state.language === "tr" ? "Örn. A7K2P9" : "Ex. A7K2P9";
  elements.joinRequestNotice.querySelector("strong").textContent = t("joinRequestTitle");
  if (!state.pendingApprovalRoomCode) {
    elements.joinRequestNoticeText.textContent = t("joinRequestText");
  }
  elements.roomInfoKicker.textContent = t("roomInfoKicker");
  elements.roomCodeTitle.textContent = t("roomCodeTitle");
  elements.inviteLinkLabel.textContent = t("inviteLinkLabel");
  elements.copyInviteButton.textContent = t("copy");
  elements.playersTitle.textContent = t("playersTitle");
  elements.pendingRequestsTitle.textContent = t("pendingRequestsTitle");
  elements.leaderboardTitle.textContent = t("leaderboardTitle");
  elements.turnRuleTitle.textContent = t("turnRuleTitle");
  elements.gameStatusKicker.textContent = t("gameStatusKicker");
  elements.startGameButton.textContent = t("startGame");
  elements.leaveRoomButton.textContent = t("leaveRoom");
  elements.turnTitle.textContent = t("turnTitle");
  elements.roundTitle.textContent = t("roundTitle");
  elements.bonusTitle.textContent = t("bonusTitle");
  elements.timerTitle.textContent = t("timerTitle");
  elements.turnResultsTitle.textContent = t("turnResultsTitle");
  elements.nameDialogKicker.textContent = t("nameDialogKicker");
  elements.nameDialogTitle.textContent = t("nameDialogTitle");
  elements.nameDialogText.textContent = t("nameDialogText");
  elements.nameInput.placeholder = t("namePlaceholder");
  elements.nameDialogSubmit.textContent = t("continue");
  elements.createRoomDialogKicker.textContent = t("createRoomDialogKicker");
  elements.createRoomDialogTitle.textContent = t("createRoomDialogTitle");
  elements.createRoomDialogText.textContent = t("createRoomDialogText");
  elements.maxPlayersLabel.textContent = t("maxPlayersLabel");
  Array.from(elements.maxPlayersSelect.options).forEach((option) => {
    const count = option.value;
    option.textContent = state.language === "tr" ? `${count} Oyuncu` : `${count} Players`;
  });
  elements.createRoomSubmit.textContent = t("createRoomSubmit");
  elements.cancelCreateRoomButton.textContent = t("cancel");
  elements.restartDialogKicker.textContent = t("restartDialogKicker");
  elements.restartGameButton.textContent = t("restartGame");
  elements.closeRestartDialogButton.textContent = t("later");
  elements.celebrationKicker.textContent = t("celebrationKicker");
  renderTurnRule(state.room || { currentStep: 1 });
}

function roomStorageKey(roomCode) {
  return `yesil-kutu-room-player-${roomCode.toUpperCase()}`;
}

function saveRoomSession(roomCode) {
  localStorage.setItem(roomStorageKey(roomCode), state.playerId);
}

function clearRoomSession(roomCode) {
  if (!roomCode) {
    return;
  }
  localStorage.removeItem(roomStorageKey(roomCode));
}

function showJoinRequestNotice(message) {
  elements.joinRequestNoticeText.textContent = message;
  elements.joinRequestNotice.classList.remove("hidden");
}

function hideJoinRequestNotice() {
  elements.joinRequestNotice.classList.add("hidden");
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
      "Content-Type": "application/json",
      "X-Language": state.language
    },
    ...options
  });

  const rawText = await response.text();
  let payload = {};

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch (error) {
      throw new Error(state.language === "tr" ? `Sunucu beklenmeyen bir yanıt döndürdü (${response.status}).` : `The server returned an unexpected response (${response.status}).`);
    }
  }

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || (state.language === "tr"
      ? `${options.method || "GET"} ${apiUrl(path)} başarısız oldu (${response.status}).`
      : `${options.method || "GET"} ${apiUrl(path)} failed (${response.status}).`));
  }

  return payload;
}

function shouldLeaveRoomForError(message) {
  const text = String(message || "").toLowerCase();
  return (
    text.includes("oda bulunamadi") ||
    text.includes("bu odada yer almiyorsun") ||
    text.includes("oyuncu odada bulunamadi") ||
    text.includes("room not found") ||
    text.includes("you are not part of this room") ||
    text.includes("player was not found in this room")
  );
}

function formatGreenScore(count) {
  if (state.language === "tr") {
    return `${count} yeşil kutu`;
  }
  return `${count} green box${count === 1 ? "" : "es"}`;
}

function formatLeaderTag() {
  return state.language === "tr" ? "Lider" : "Leader";
}

function formatSharedLeadLabel() {
  return state.language === "tr" ? "Paylaşımlı" : "Shared";
}

function postJson(path, body) {
  return request(path, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

function safeShowDialog(dialog) {
  if (!dialog) {
    return false;
  }

  try {
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      return true;
    }
  } catch (error) {
    console.warn("Dialog showModal failed", error);
  }

  dialog.setAttribute("open", "open");
  return true;
}

function safeCloseDialog(dialog) {
  if (!dialog) {
    return;
  }

  try {
    if (typeof dialog.close === "function") {
      dialog.close();
      return;
    }
  } catch (error) {
    console.warn("Dialog close failed", error);
  }

  dialog.removeAttribute("open");
}

function ensurePlayerName() {
  if (state.playerName) {
    elements.playerBadge.textContent = state.playerName;
    return Promise.resolve();
  }

  elements.nameInput.value = state.playerName;
  if (!safeShowDialog(elements.nameDialog)) {
    const fallbackName = window.prompt(state.language === "tr" ? "Oyuncu adını yaz" : "Enter your player name", state.playerName || "");
    if (!fallbackName || !fallbackName.trim()) {
      return Promise.reject(new Error(state.language === "tr" ? "Devam etmek için bir oyuncu adı gerekli." : "A player name is required to continue."));
    }
    persistPlayerName(fallbackName.trim());
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const submitHandler = (event) => {
      event.preventDefault();
      const name = elements.nameInput.value.trim();

      if (!name) {
        elements.nameInput.focus();
        return;
      }

      persistPlayerName(name);
      safeCloseDialog(elements.nameDialog);
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
  const isHost = room.hostId === state.playerId;

  room.players.forEach((player) => {
    const item = document.createElement("li");
    const meta = document.createElement("div");
    const actions = document.createElement("div");
    const avatar = document.createElement("div");
    const nameWrap = document.createElement("div");
    const name = document.createElement("strong");
    const subline = document.createElement("div");

    meta.className = "player-meta";
    actions.className = "player-actions";
    avatar.className = "avatar";
    avatar.textContent = player.initials;
    name.textContent = player.name;
    subline.className = "subline";
    subline.textContent = formatGreenScore(player.score || 0);

    if (player.id === room.hostId) {
      subline.textContent += " • Oda sahibi";
    }

    if (player.id === room.hostId) {
      subline.textContent = formatGreenScore(player.score || 0) + (state.language === "tr" ? " • Oda sahibi" : " • Host");
    }

    nameWrap.append(name, subline);
    meta.append(avatar, nameWrap);
    item.appendChild(meta);

    if (player.id === room.currentTurnPlayerId && room.phase === "playing") {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = state.language === "tr" ? "Sırada" : "Current";
      actions.appendChild(pill);
    } else if (player.id === state.playerId) {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = state.language === "tr" ? "Sen" : "You";
      actions.appendChild(pill);
    }

    if (isHost && player.id !== state.playerId) {
      const kickButton = document.createElement("button");
      kickButton.type = "button";
      kickButton.className = "row-action-button";
      kickButton.textContent = state.language === "tr" ? "Çıkar" : "Kick";
      kickButton.addEventListener("click", async () => {
        try {
          const payload = await postJson(`/rooms/${state.roomCode}/kick`, {
            playerId: state.playerId,
            targetPlayerId: player.id
          });
          renderRoom(payload.room);
          showToast(state.language === "tr" ? `${player.name} oyundan çıkarıldı.` : `${player.name} was removed from the room.`);
          scheduleNextPoll();
        } catch (error) {
          showToast(error.message);
        }
      });
      actions.appendChild(kickButton);
    }

    if (actions.childNodes.length > 0) {
      item.appendChild(actions);
    }

    elements.playersList.appendChild(item);
  });
}

function renderPendingJoinRequests(room) {
  const isHost = room.hostId === state.playerId;
  const requests = room.pendingJoinRequests || [];

  elements.pendingRequestsList.innerHTML = "";
  elements.pendingRequestsCountLabel.textContent = String(requests.length);
  elements.pendingRequestsCard.classList.toggle("hidden", !isHost || requests.length === 0);

  if (!isHost) {
    return;
  }

  requests.forEach((request) => {
    const item = document.createElement("li");
    const meta = document.createElement("div");
    const avatar = document.createElement("div");
    const nameWrap = document.createElement("div");
    const name = document.createElement("strong");
    const subline = document.createElement("div");
    const actions = document.createElement("div");
    const approveButton = document.createElement("button");
    const rejectButton = document.createElement("button");

    meta.className = "player-meta";
    actions.className = "player-actions";
    avatar.className = "avatar";
    avatar.textContent = request.playerName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?";
    name.textContent = request.playerName;
    subline.className = "subline";
    subline.textContent = state.language === "tr" ? "Oyuna katılmak istiyor" : "Wants to join the game";
    nameWrap.append(name, subline);
    meta.append(avatar, nameWrap);

    approveButton.type = "button";
    approveButton.className = "row-action-button approve";
    approveButton.textContent = state.language === "tr" ? "Onayla" : "Approve";
    approveButton.addEventListener("click", async () => {
      try {
        const payload = await postJson(`/rooms/${state.roomCode}/requests/approve`, {
          playerId: state.playerId,
          targetPlayerId: request.playerId
        });
        renderRoom(payload.room);
        showToast(state.language === "tr" ? `${request.playerName} oyuna alındı.` : `${request.playerName} joined the room.`);
        scheduleNextPoll();
      } catch (error) {
        showToast(error.message);
      }
    });

    rejectButton.type = "button";
    rejectButton.className = "row-action-button reject";
    rejectButton.textContent = state.language === "tr" ? "Reddet" : "Reject";
    rejectButton.addEventListener("click", async () => {
      try {
        const payload = await postJson(`/rooms/${state.roomCode}/requests/reject`, {
          playerId: state.playerId,
          targetPlayerId: request.playerId
        });
        renderRoom(payload.room);
        showToast(state.language === "tr" ? `${request.playerName} isteği reddedildi.` : `${request.playerName}'s request was rejected.`);
        scheduleNextPoll();
      } catch (error) {
        showToast(error.message);
      }
    });

    actions.append(approveButton, rejectButton);
    item.append(meta, actions);
    elements.pendingRequestsList.appendChild(item);
  });
}

function renderLeaderboard(room) {
  elements.leaderboardList.innerHTML = "";
  const leaders = room.leaderboard.filter((player) => player.isLeader);
  elements.leaderLabel.textContent = leaders.length === 0 ? "-" : leaders.length === 1 ? leaders[0].name : formatSharedLeadLabel();

  room.leaderboard.forEach((player, index) => {
    const item = document.createElement("li");
    item.className = "compact";
    const left = document.createElement("div");
    const right = document.createElement("strong");

    left.innerHTML = `<strong>#${index + 1} ${player.name}</strong><div class="subline">${formatGreenScore(player.score || 0)}</div>`;
    right.textContent = player.isLeader ? formatLeaderTag() : "";
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
    1: t("turnRule1"),
    2: t("turnRule2"),
    3: t("turnRule3"),
    4: t("turnRule4"),
    5: t("turnRule5")
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
    ? (state.language === "tr" ? `${winner?.name || "Bir oyuncu"} son turu kazandı` : `${winner?.name || "A player"} won the final round`)
    : (state.language === "tr" ? `${winner?.name || "Bir oyuncu"} ${room.currentStep}. turu kazandı` : `${winner?.name || "A player"} won round ${room.currentStep}`);
  const text = room.currentStep === room.totalSteps
    ? (state.language === "tr" ? "Lider tablosu hazırlanıyor. Son ekran birazdan gelecek." : "Preparing the leaderboard. The final screen will appear shortly.")
    : (state.language === "tr" ? `${nextTurn}. tur ${room.secondsUntilNextStep} saniye içinde başlayacak.` : `Round ${nextTurn} starts in ${room.secondsUntilNextStep} seconds.`);

  showCelebration(title, text);
}

function renderStatus(room) {
  const isHost = room.hostId === state.playerId;
  const currentTurn = room.players.find((player) => player.id === room.currentTurnPlayerId);
  const openingPlayer = room.players.find((player) => player.id === room.openingPlayerId);

  elements.stepLabel.textContent = `${room.currentStep}/${room.totalSteps}`;
  elements.turnTimerLabel.textContent = room.phase === "playing"
    ? (state.language === "tr" ? `${room.secondsUntilTurnTimeout} sn` : `${room.secondsUntilTurnTimeout}s`)
    : "-";
  elements.turnLabel.textContent = room.phase === "playing" && currentTurn
    ? currentTurn.name
    : room.phase === "finished"
      ? (state.language === "tr" ? "Turnuva bitti" : "Tournament over")
      : room.phase === "celebrating"
        ? (state.language === "tr" ? "Tur tamamlanıyor" : "Round ending")
        : (state.language === "tr" ? "Başlamadı" : "Not started");
  elements.bonusLabel.textContent = room.openingStreakRemaining > 0 && openingPlayer
    ? `${openingPlayer.name}: ${room.openingStreakRemaining}`
    : "-";

  if (room.phase === "waiting") {
    elements.statusHeading.textContent = state.language === "tr" ? "Turnuva hazır" : "Tournament ready";
    elements.statusText.textContent = isHost
      ? (state.language === "tr"
        ? `En az 2 oyuncu olduğunda ${room.maxPlayers} kişilik turnuvayı başlatabilirsin.`
        : `You can start this ${room.maxPlayers}-player tournament once at least 2 players are in the room.`)
      : (state.language === "tr" ? "Oda sahibinin turnuvayı başlatmasını bekliyorsun." : "Waiting for the host to start the tournament.");
  }

  if (room.phase === "playing") {
    elements.statusHeading.textContent = state.language === "tr" ? `Tur ${room.currentStep} oynanıyor` : `Round ${room.currentStep} in progress`;

    if (currentTurn?.id === state.playerId) {
      elements.statusText.textContent = room.openingStreakRemaining > 0 && room.openingPlayerId === state.playerId
        ? (state.language === "tr"
          ? `Sıra sende. Süren ${room.secondsUntilTurnTimeout} saniye.`
          : `It's your turn. ${room.secondsUntilTurnTimeout} seconds remaining.`)
        : state.pendingMove
          ? (state.language === "tr" ? "Hamlen gönderiliyor..." : "Submitting your move...")
          : (state.language === "tr"
            ? `Sıra sende. Bir kutu seç ve yeşili bulmaya çalış. Süren ${room.secondsUntilTurnTimeout} saniye.`
            : `It's your turn. Pick a box and try to find the green one. ${room.secondsUntilTurnTimeout} seconds remaining.`);
    } else {
      elements.statusText.textContent = room.openingStreakRemaining > 0 && openingPlayer
        ? (state.language === "tr"
          ? `${openingPlayer.name} seçim yapıyor.`
          : `${openingPlayer.name} is making a pick.`)
        : (state.language === "tr"
          ? `${currentTurn?.name || "Bir oyuncu"} kutu seçimini yapıyor.`
          : `${currentTurn?.name || "A player"} is choosing a box.`);
    }
  }

  if (room.phase === "celebrating") {
    const winner = room.players.find((player) => player.id === room.winnerId);
    elements.statusHeading.textContent = state.language === "tr"
      ? `${winner?.name || "Bir oyuncu"} turu kazandı`
      : `${winner?.name || "A player"} won the round`;
    elements.statusText.textContent = room.currentStep === room.totalSteps
      ? (state.language === "tr" ? "Turnuva sonucu açıklanıyor." : "Preparing the tournament result.")
      : (state.language === "tr" ? `Yeni tur ${room.secondsUntilNextStep} saniye içinde başlayacak.` : `The next round starts in ${room.secondsUntilNextStep} seconds.`);
  }

  if (room.phase === "finished") {
    const leaders = room.leaderboard.filter((player) => player.isLeader);
    elements.statusHeading.textContent = leaders.length > 1
      ? (state.language === "tr" ? "Paylaşımlı liderlik" : "Shared lead")
      : (state.language === "tr" ? `${leaders[0]?.name || "Oyuncu"} turnuvayı önde bitirdi` : `${leaders[0]?.name || "A player"} finished in the lead`);
    elements.statusText.textContent = leaders.length > 1
      ? (state.language === "tr"
        ? `${leaders.map((player) => player.name).join(", ")} toplam yeşil kutu puanında eşitlendi.`
        : `${leaders.map((player) => player.name).join(", ")} finished tied on total green-box score.`)
      : (state.language === "tr"
        ? `${leaders[0]?.name || "Oyuncu"} en yüksek yeşil kutu puanına ulaştı.`
        : `${leaders[0]?.name || "A player"} reached the highest green-box score.`);
  }

  elements.startGameButton.disabled = !isHost || room.phase !== "waiting" || room.players.length < 2;
}

function maybeShowRestartDialog(room) {
  const isHost = room.hostId === state.playerId;
  if (room.phase !== "finished" || state.restartDialogShownForTournament) {
    return;
  }

  const leaders = room.leaderboard.filter((player) => player.isLeader);
  elements.restartTitle.textContent = leaders.length > 1
    ? (state.language === "tr" ? "Turnuva beraberlikle bitti" : "The tournament ended in a tie")
    : (state.language === "tr" ? `${leaders[0]?.name || "Oyuncu"} zirvede tamamladı` : `${leaders[0]?.name || "A player"} finished on top`);
  elements.restartText.textContent = state.language === "tr"
    ? "Aynı lobiyle yeni bir puan tabanlı turnuva başlatmak ister misin?"
    : "Would you like to start another score-based tournament with the same lobby?";
  elements.restartDialog.showModal();
  state.restartDialogShownForTournament = true;
}

function renderPlayers(room) {
  elements.playersList.innerHTML = "";
  elements.playerCountLabel.textContent = `${room.players.length}/${room.maxPlayers}`;
  const isHost = room.hostId === state.playerId;

  room.players.forEach((player) => {
    const item = document.createElement("li");
    const meta = document.createElement("div");
    const actions = document.createElement("div");
    const avatar = document.createElement("div");
    const nameWrap = document.createElement("div");
    const name = document.createElement("strong");
    const subline = document.createElement("div");

    meta.className = "player-meta";
    actions.className = "player-actions";
    avatar.className = "avatar";
    avatar.textContent = player.initials;
    name.textContent = player.name;
    subline.className = "subline";
    subline.textContent = formatGreenScore(player.score || 0);

    if (player.id === room.hostId) {
      subline.textContent += state.language === "tr" ? " • Oda sahibi" : " • Host";
    }

    nameWrap.append(name, subline);
    meta.append(avatar, nameWrap);
    item.appendChild(meta);

    if (player.id === room.currentTurnPlayerId && room.phase === "playing") {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = state.language === "tr" ? "Sırada" : "Current";
      actions.appendChild(pill);
    } else if (player.id === state.playerId) {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = state.language === "tr" ? "Sen" : "You";
      actions.appendChild(pill);
    }

    if (isHost && player.id !== state.playerId) {
      const kickButton = document.createElement("button");
      kickButton.type = "button";
      kickButton.className = "row-action-button";
      kickButton.textContent = state.language === "tr" ? "Çıkar" : "Kick";
      kickButton.addEventListener("click", async () => {
        try {
          const payload = await postJson(`/rooms/${state.roomCode}/kick`, {
            playerId: state.playerId,
            targetPlayerId: player.id
          });
          renderRoom(payload.room);
          showToast(state.language === "tr" ? `${player.name} odadan çıkarıldı.` : `${player.name} was removed from the room.`);
          scheduleNextPoll();
        } catch (error) {
          showToast(error.message);
        }
      });
      actions.appendChild(kickButton);
    }

    if (actions.childNodes.length > 0) {
      item.appendChild(actions);
    }

    elements.playersList.appendChild(item);
  });
}

const baseApplyLanguage = applyLanguage;
applyLanguage = function applyLanguageV2() {
  baseApplyLanguage();

  const sidebarTitle = document.querySelector(".player-list-title strong");
  if (sidebarTitle && sidebarTitle.textContent === "SEO") {
    sidebarTitle.textContent = "";
  }

  elements.heroDescription.textContent = state.language === "tr"
    ? "Oyun sahibi bir oda kurar, oyuncu sayısını belirler ve arkadaşlarını davet eder. Her turda birden fazla yeşil kutu vardır. Oyuncular sırayla kutu açar, buldukları her yeşil kutu puan kazandırır. Turnuva sonunda en fazla yeşil kutuyu bulan oyuncu zirvede yer alır."
    : "The host creates a room, sets the player count, and invites friends. Each round contains multiple green boxes. Players open boxes in turn, and every green box they find adds to their score. The player with the highest total at the end of the tournament finishes on top.";
  elements.heroRuleFlowText.textContent = state.language === "tr"
      ? "Toplam 5 tur vardır. Kutular azalır, yeşil kutu sayısı da 5'ten 1'e düşer. Her bulunan yeşil kutu final puan tablosuna eklenir."
      : "There are 5 rounds in total. The number of boxes shrinks, the green box count drops from 5 to 1, and every green found is added to the final score table.";
  elements.heroRule1Text.textContent = state.language === "tr"
    ? "100 kutuda 5 yeşil kutu vardır. Herkes sırayla 1 kutu açar."
    : "There are 5 green boxes hidden among 100 boxes. Everyone opens 1 box in turn.";
  elements.heroRule2Text.textContent = state.language === "tr"
    ? "80 kutuda 4 yeşil kutu vardır."
    : "There are 4 green boxes among 80 boxes.";
  elements.heroRule3Text.textContent = state.language === "tr"
    ? "60 kutuda 3 yeşil kutu vardır."
    : "There are 3 green boxes among 60 boxes.";
  elements.heroRule4Text.textContent = state.language === "tr"
      ? "50 kutuda 2 yeşil kutu vardır."
      : "There are 2 green boxes among 50 boxes.";
  elements.heroRule5Text.textContent = state.language === "tr"
      ? "40 kutuda 1 yeşil kutu vardır."
      : "There is 1 green box among 40 boxes.";
  elements.heroRuleLeaderText.textContent = state.language === "tr"
    ? "Final sıralama toplam bulunan yeşil kutu sayısına göre belirlenir."
    : "The final ranking is based on the total number of green boxes found.";
  elements.sidebarNoteText.textContent = state.language === "tr"
    ? "Önce rehberlere göz atabilir, sonra oda kurup puan tabanlı yeni sistemi hemen deneyebilirsin."
    : "You can skim the guides first, then create a room and try the new score-based format right away.";
};

function renderLeaderboard(room) {
  elements.leaderboardList.innerHTML = "";
  const leaders = room.leaderboard.filter((player) => player.isLeader);
  elements.leaderLabel.textContent = leaders.length === 0 ? "-" : leaders.length === 1 ? leaders[0].name : formatSharedLeadLabel();

  room.leaderboard.forEach((player, index) => {
    const item = document.createElement("li");
    item.className = "compact";
    const left = document.createElement("div");
    const right = document.createElement("strong");

    left.innerHTML = `<strong>#${index + 1} ${player.name}</strong><div class="subline">${formatGreenScore(player.score || 0)}</div>`;
    right.textContent = player.isLeader ? formatLeaderTag() : "";
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
    const leaderText = result.leaderNames.length > 1
      ? `${state.language === "tr" ? "Tur liderleri" : "Round leaders"}: ${result.leaderNames.join(", ")}`
      : `${state.language === "tr" ? "Tur lideri" : "Round leader"}: ${result.leaderNames[0]}`;
    const scoreText = state.language === "tr"
      ? `${result.topScore} yeşil • ${result.greenBoxes} toplam`
      : `${result.topScore} greens • ${result.greenBoxes} total`;
    item.innerHTML = `<strong>${state.language === "tr" ? `${result.step}. tur` : `Round ${result.step}`}</strong><span>${leaderText} (${scoreText})</span>`;
    elements.stepResultsList.appendChild(item);
  });
}

function renderTurnRule(room) {
  const rules = {
    1: state.language === "tr"
      ? "1. turda 100 kutu içinde 5 yeşil kutu vardır. Her oyuncu sırasıyla 1 kutu açar."
      : "Round 1 has 5 green boxes hidden among 100 boxes. Every player opens 1 box in turn.",
    2: state.language === "tr"
      ? "2. turda 80 kutu içinde 4 yeşil kutu vardır."
      : "Round 2 has 4 green boxes among 80 boxes.",
    3: state.language === "tr"
      ? "3. turda 60 kutu içinde 3 yeşil kutu vardır."
      : "Round 3 has 3 green boxes among 60 boxes.",
    4: state.language === "tr"
      ? "4. turda 50 kutu içinde 2 yeşil kutu vardır."
      : "Round 4 has 2 green boxes among 50 boxes.",
    5: state.language === "tr"
      ? "5. turda 40 kutu içinde 1 yeşil kutu vardır."
      : "Round 5 has 1 green box among 40 boxes."
  };

  elements.stepRuleText.textContent = rules[room.currentStep] || "";
}

function maybeShowCelebration(room) {
  if (room.phase !== "celebrating") {
    hideCelebration();
    return;
  }

  if (state.lastCelebratedTurnCount !== room.stepResults.length) {
    state.lastCelebratedTurnCount = room.stepResults.length;
  }

  const latestResult = room.stepResults[room.stepResults.length - 1];
  const nextTurn = Math.min(room.currentStep + 1, room.totalSteps);
  const leaderNames = latestResult?.leaderNames?.join(", ") || (state.language === "tr" ? "Oyuncular" : "Players");
  const title = state.language === "tr"
    ? `${room.currentStep}. tur tamamlandı`
    : `Round ${room.currentStep} complete`;
  const text = room.currentStep === room.totalSteps
    ? (state.language === "tr"
      ? `${leaderNames} bu turu önde kapattı. Final puan tablosu hazırlanıyor.`
      : `${leaderNames} finished this round on top. Preparing the final score table.`)
    : (state.language === "tr"
      ? `${leaderNames} bu turu önde kapattı. ${nextTurn}. tur ${room.secondsUntilNextStep} saniye içinde başlayacak.`
      : `${leaderNames} finished this round on top. Round ${nextTurn} starts in ${room.secondsUntilNextStep} seconds.`);

  showCelebration(title, text);
}

function renderStatus(room) {
  const isHost = room.hostId === state.playerId;
  const currentTurn = room.players.find((player) => player.id === room.currentTurnPlayerId);
  const openingPlayer = room.players.find((player) => player.id === room.openingPlayerId);

  elements.stepLabel.textContent = `${room.currentStep}/${room.totalSteps}`;
  elements.turnTimerLabel.textContent = room.phase === "playing"
    ? (state.language === "tr" ? `${room.secondsUntilTurnTimeout} sn` : `${room.secondsUntilTurnTimeout}s`)
    : "-";
  elements.turnLabel.textContent = room.phase === "playing" && currentTurn
    ? currentTurn.name
    : room.phase === "finished"
      ? (state.language === "tr" ? "Turnuva bitti" : "Tournament over")
      : room.phase === "celebrating"
        ? (state.language === "tr" ? "Tur kapanıyor" : "Round closing")
        : (state.language === "tr" ? "Başlamadı" : "Not started");
  elements.bonusLabel.textContent = room.openingStreakRemaining > 0 && openingPlayer
    ? `${openingPlayer.name}: ${room.openingStreakRemaining}`
    : "-";

  if (room.phase === "waiting") {
    elements.statusHeading.textContent = state.language === "tr" ? "Puanlı turnuva hazır" : "Score-based tournament ready";
    elements.statusText.textContent = isHost
      ? (state.language === "tr"
        ? `En az 2 oyuncu olduğunda ${room.maxPlayers} kişilik turnuvayı başlatabilirsin. Finalde en çok yeşil kutu bulan oyuncu öne çıkacak.`
        : `You can start this ${room.maxPlayers}-player tournament once at least 2 players are in the room. The player with the most green boxes at the end will lead.`)
      : (state.language === "tr"
        ? "Oda sahibinin puanlı turnuvayı başlatmasını bekliyorsun."
        : "Waiting for the host to start the score-based tournament.");
  }

  if (room.phase === "playing") {
    elements.statusHeading.textContent = state.language === "tr"
      ? `Tur ${room.currentStep} oynanıyor • ${room.remainingGreenCount} yeşil kaldı`
      : `Round ${room.currentStep} in progress • ${room.remainingGreenCount} greens left`;

    if (currentTurn?.id === state.playerId) {
      elements.statusText.textContent = room.openingStreakRemaining > 0 && room.openingPlayerId === state.playerId
        ? (state.language === "tr"
          ? `Sıra sende. Turda ${room.remainingGreenCount} yeşil kutu daha var.`
          : `It's your turn. ${room.remainingGreenCount} green boxes are still hidden this round.`)
        : state.pendingMove
          ? (state.language === "tr" ? "Hamlen gönderiliyor..." : "Submitting your move...")
          : (state.language === "tr"
            ? `Sıra sende. Bir kutu seç ve kalan ${room.remainingGreenCount} yeşil kutudan birini bulmaya çalış.`
            : `It's your turn. Pick a box and try to hit one of the ${room.remainingGreenCount} remaining green boxes.`);
    } else {
      elements.statusText.textContent = room.openingStreakRemaining > 0 && openingPlayer
        ? (state.language === "tr"
          ? `${openingPlayer.name} seçim yapıyor. Bu turda ${room.remainingGreenCount} yeşil kutu kaldı.`
          : `${openingPlayer.name} is making a pick. ${room.remainingGreenCount} green boxes remain in this round.`)
        : (state.language === "tr"
          ? `${currentTurn?.name || "Bir oyuncu"} kutu seçimini yapıyor. Bu turda ${room.remainingGreenCount} yeşil kutu kaldı.`
          : `${currentTurn?.name || "A player"} is choosing a box. ${room.remainingGreenCount} green boxes remain in this round.`);
    }
  }

  if (room.phase === "celebrating") {
    const latestResult = room.stepResults[room.stepResults.length - 1];
    const leaders = latestResult?.leaderNames?.join(", ") || (state.language === "tr" ? "Oyuncular" : "Players");
    elements.statusHeading.textContent = state.language === "tr"
      ? `${leaders} bu turu önde bitirdi`
      : `${leaders} finished this round in front`;
    elements.statusText.textContent = room.currentStep === room.totalSteps
      ? (state.language === "tr" ? "Final puan tablosu hazırlanıyor." : "Preparing the final score table.")
      : (state.language === "tr" ? `Yeni tur ${room.secondsUntilNextStep} saniye içinde başlayacak.` : `The next round starts in ${room.secondsUntilNextStep} seconds.`);
  }

  if (room.phase === "finished") {
    const leaders = room.leaderboard.filter((player) => player.isLeader);
    elements.statusHeading.textContent = leaders.length > 1
      ? (state.language === "tr" ? "Paylaşımlı liderlik" : "Shared lead")
      : (state.language === "tr" ? `${leaders[0]?.name || "Oyuncu"} turnuvayı önde kapattı` : `${leaders[0]?.name || "A player"} finished on top`);
    elements.statusText.textContent = leaders.length > 1
      ? (state.language === "tr"
        ? `${leaders.map((player) => player.name).join(", ")} toplam yeşil kutu puanında eşitlendi.`
        : `${leaders.map((player) => player.name).join(", ")} finished tied on total green box score.`)
      : (state.language === "tr"
        ? `${leaders[0]?.name || "Oyuncu"} toplam ${formatGreenScore(leaders[0]?.score || 0)} ile zirvede yer aldı.`
        : `${leaders[0]?.name || "A player"} led the tournament with ${formatGreenScore(leaders[0]?.score || 0)}.`);
  }

  elements.startGameButton.disabled = !isHost || room.phase !== "waiting" || room.players.length < 2;
}

function maybeShowRestartDialog(room) {
  const isHost = room.hostId === state.playerId;
  if (room.phase !== "finished" || state.restartDialogShownForTournament) {
    return;
  }

  const leaders = room.leaderboard.filter((player) => player.isLeader);
  elements.restartDialogKicker.textContent = state.language === "tr" ? "Turnuva Bitti" : "Tournament Finished";
  elements.restartTitle.textContent = leaders.length > 1
    ? (state.language === "tr" ? "Turnuva beraberlikle tamamlandı" : "The tournament ended in a tie")
    : (state.language === "tr" ? `${leaders[0]?.name || "Oyuncu"} zirvede tamamladı` : `${leaders[0]?.name || "A player"} finished on top`);
  elements.restartText.textContent = isHost
    ? (state.language === "tr"
      ? "İstersen aynı lobiyle yeni bir turnuva daha başlatabilirsin."
      : "If you want, you can start another tournament with the same lobby.")
    : (state.language === "tr"
      ? "Final puan tablosu hazır. Oda sahibi yeni bir turnuva başlatırsa aynı lobide devam edebilirsiniz."
      : "The final scoreboard is ready. If the host starts another tournament, you can continue in the same lobby.");
  elements.restartGameButton.hidden = !isHost;
  elements.closeRestartDialogButton.textContent = isHost
    ? (state.language === "tr" ? "Daha Sonra" : "Later")
    : (state.language === "tr" ? "Tamam" : "Close");
  safeShowDialog(elements.restartDialog);
  state.restartDialogShownForTournament = true;
}

function renderRoom(room) {
  const previousPhase = state.room?.phase;
  state.room = room;
  state.roomCode = room.code;
  state.pendingMove = false;
  state.pendingApprovalRoomCode = null;
  hideJoinRequestNotice();

  if (previousPhase === "celebrating" && room.phase !== "celebrating") {
    hideCelebration();
  }

  if (room.lastTimeoutAt && room.lastTimeoutAt !== state.lastSeenTimeoutAt) {
    state.lastSeenTimeoutAt = room.lastTimeoutAt;
    showToast(`${timedOutPlayerName(room)} süresi dolduğu için sıra geçti.`);
  }

  elements.roomCodeLabel.textContent = room.code;
  updateInviteLink(room.code);
  saveRoomSession(room.code);
  renderPlayers(room);
  renderPendingJoinRequests(room);
  renderLeaderboard(room);
  renderTurnResults(room);
  renderTurnRule(room);
  renderStatus(room);
  renderBoard(room);
  maybeShowCelebration(room);
  connectRoomSocket(room.code);
  setActiveView("room");
  maybeShowRestartDialog(room);
}

function timedOutPlayerName(room) {
  return room.players.find((player) => player.id === room.lastTimeoutPlayerId)?.name || "Bir oyuncunun";
}

function clearPoll() {
  if (state.pollTimer) {
    window.clearTimeout(state.pollTimer);
    state.pollTimer = null;
  }
}

function clearPendingJoinPoll() {
  if (state.pendingJoinPollTimer) {
    window.clearTimeout(state.pendingJoinPollTimer);
    state.pendingJoinPollTimer = null;
  }
}

function clearSocketReconnect() {
  if (state.socketReconnectTimer) {
    window.clearTimeout(state.socketReconnectTimer);
    state.socketReconnectTimer = null;
  }
}

function clearSocketHeartbeat() {
  if (state.socketHeartbeatTimer) {
    window.clearInterval(state.socketHeartbeatTimer);
    state.socketHeartbeatTimer = null;
  }
}

function disconnectRoomSocket({ intentional = false } = {}) {
  clearSocketReconnect();
  clearSocketHeartbeat();
  state.socketConnected = false;
  state.socketRoomCode = null;

  if (!state.socket) {
    return;
  }

  const socket = state.socket;
  state.socket = null;

  if (intentional) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
  }

  try {
    socket.close();
  } catch (error) {
    return;
  }
}

function scheduleSocketReconnect(roomCode) {
  clearSocketReconnect();
  state.socketReconnectTimer = window.setTimeout(() => {
    if (state.roomCode === roomCode) {
      connectRoomSocket(roomCode);
    }
  }, 1500);
}

function connectRoomSocket(roomCode) {
  if (!roomCode) {
    return;
  }

  if (
    state.socket &&
    state.socketRoomCode === roomCode &&
    (state.socket.readyState === WebSocket.OPEN || state.socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  disconnectRoomSocket({ intentional: true });

  const socket = new WebSocket(roomSocketUrl(roomCode));
  state.socket = socket;
  state.socketRoomCode = roomCode;

  socket.onopen = () => {
    state.socketConnected = true;
    clearSocketReconnect();
    clearSocketHeartbeat();
    state.socketHeartbeatTimer = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send("ping");
      }
    }, 20000);
  };

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === "room_update" && payload.room) {
        renderRoom(payload.room);
      }
    } catch (error) {
      console.warn("Socket message parse failed", error);
    }
  };

  socket.onerror = () => {
    state.socketConnected = false;
  };

  socket.onclose = (event) => {
    clearSocketHeartbeat();
    state.socketConnected = false;
    if (state.socket === socket) {
      state.socket = null;
    }

    if ([4001, 4003, 4403, 4404].includes(event.code)) {
      if (event.code === 4003) {
        showToast("Oda sahibin tarafindan odadan cikarildin.");
      }
      leaveRoom({ silent: event.code === 4001 });
      return;
    }

    if (state.roomCode === roomCode) {
      scheduleSocketReconnect(roomCode);
    }
  };
}

function getNextPollDelay(room = state.room) {
  if (!room) {
    return 2000;
  }

  if (room.phase === "celebrating") {
    return 800;
  }

  if (room.phase === "waiting") {
    return 2500;
  }

  if (room.phase === "finished") {
    return 3000;
  }

  if (room.phase === "playing") {
    if (state.socketConnected) {
      return 12000;
    }

    if (room.currentTurnPlayerId === state.playerId) {
      return 700;
    }

    if (room.secondsUntilTurnTimeout <= 3) {
      return 900;
    }

    return 1600;
  }

  return 1800;
}

function scheduleNextPoll(delay = getNextPollDelay()) {
  clearPoll();
  state.pollTimer = window.setTimeout(fetchRoomState, delay);
}

function schedulePendingJoinPoll(delay = 2500) {
  clearPendingJoinPoll();
  state.pendingJoinPollTimer = window.setTimeout(fetchJoinRequestStatus, delay);
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
    if (!state.isLeaving && shouldLeaveRoomForError(error.message)) {
      showToast(error.message);
      leaveRoom({ silent: true });
      return;
    }
    if (!state.isLeaving) {
      showToast(error.message);
    }
  }

  scheduleNextPoll();
}

async function fetchJoinRequestStatus() {
  if (!state.pendingApprovalRoomCode) {
    return;
  }

  try {
    const payload = await request(`/rooms/${state.pendingApprovalRoomCode}/join-status?playerId=${encodeURIComponent(state.playerId)}`, {
      method: "GET"
    });

    if (payload.status === "approved" && payload.room) {
      state.roomCode = payload.room.code;
      state.restartDialogShownForTournament = false;
      state.lastCelebratedTurnCount = payload.room.stepResults.length;
      clearPendingJoinPoll();
      renderRoom(payload.room);
      showToast("Katılım isteğin onaylandı.");
      scheduleNextPoll();
      return;
    }

    if (payload.status === "rejected" || payload.status === "kicked" || payload.status === "missing") {
      clearPendingJoinPoll();
      clearRoomSession(state.pendingApprovalRoomCode);
      showToast(payload.status === "rejected" ? "Katılım isteğin reddedildi." : "Odaya alınmadın.");
      state.pendingApprovalRoomCode = null;
      hideJoinRequestNotice();
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
  } catch (error) {
    showToast(error.message);
  }

  schedulePendingJoinPoll();
}

async function createRoom(maxPlayers) {
  await ensurePlayerName();
  const payload = await postJson("/rooms", {
    playerId: state.playerId,
    playerName: state.playerName,
    maxPlayers
  });

  state.roomCode = payload.room.code;
  clearPendingJoinPoll();
  state.restartDialogShownForTournament = false;
  state.lastCelebratedTurnCount = 0;
  state.lastSeenTimeoutAt = 0;
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

  if (payload.pendingApproval) {
    disconnectRoomSocket({ intentional: true });
    clearPoll();
    state.roomCode = null;
    state.pendingApprovalRoomCode = payload.roomCode;
    state.lastSeenTimeoutAt = 0;
    window.history.replaceState({}, "", `?room=${payload.roomCode}`);
    showJoinRequestNotice(payload.message || "Katılım isteğin gönderildi.");
    showToast("Katılım isteğin oda sahibine gönderildi.");
    schedulePendingJoinPoll();
    return;
  }

  state.roomCode = payload.room.code;
  clearPendingJoinPoll();
  state.restartDialogShownForTournament = false;
  state.lastCelebratedTurnCount = payload.room.stepResults.length;
  state.lastSeenTimeoutAt = 0;
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
  safeCloseDialog(elements.restartDialog);
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

function notifyLeaveRoomBeacon(roomCode = state.roomCode || state.pendingApprovalRoomCode) {
  if (!roomCode || typeof navigator.sendBeacon !== "function") {
    return;
  }

  try {
    const payload = JSON.stringify({ playerId: state.playerId });
    const blob = new Blob([payload], { type: "application/json; charset=UTF-8" });
    navigator.sendBeacon(`${API_BASE}/rooms/${roomCode}/leave`, blob);
  } catch (error) {
    console.warn("Leave beacon failed", error);
  }
}

function leaveRoom({ silent = false } = {}) {
  disconnectRoomSocket({ intentional: true });
  clearPoll();
  clearPendingJoinPoll();
  clearRoomSession(state.roomCode || state.pendingApprovalRoomCode);
  state.roomCode = null;
  state.room = null;
  state.restartDialogShownForTournament = false;
  state.isLeaving = false;
  state.pendingMove = false;
  state.lastCelebratedTurnCount = 0;
  state.pendingApprovalRoomCode = null;
  state.lastSeenTimeoutAt = 0;
  hideCelebration();
  hideJoinRequestNotice();
  window.history.replaceState({}, "", window.location.pathname);
  setActiveView("home");
  if (!silent) {
    showToast("Lobiden ayrıldın.");
  }
}

function setupEvents() {
  elements.languageSelect.addEventListener("change", () => {
    state.language = elements.languageSelect.value;
    localStorage.setItem(STORAGE_KEYS.language, state.language);
    applyLanguage();
    if (state.room) {
      renderRoom(state.room);
    }
  });

  elements.homeBrandButton.addEventListener("click", () => {
    if (state.roomCode) {
      leaveRoom({ silent: true });
    } else {
      setActiveView("home");
    }
  });

  elements.createRoomButton.addEventListener("click", async () => {
    try {
      await ensurePlayerName();
      safeShowDialog(elements.createRoomDialog);
    } catch (error) {
      showToast(error.message);
    }
  });

  elements.createRoomForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const maxPlayers = Number(elements.maxPlayersSelect.value);
      safeCloseDialog(elements.createRoomDialog);
      await createRoom(maxPlayers);
    } catch (error) {
      showToast(error.message);
    }
  });

  elements.cancelCreateRoomButton.addEventListener("click", () => {
    safeCloseDialog(elements.createRoomDialog);
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
    safeCloseDialog(elements.restartDialog);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearPoll();
      clearPendingJoinPoll();
      return;
    }

    if (state.roomCode) {
      if (!state.socketConnected) {
        connectRoomSocket(state.roomCode);
      }
      fetchRoomState();
      return;
    }

    if (state.pendingApprovalRoomCode) {
      fetchJoinRequestStatus();
    }
  });

  window.addEventListener("pageshow", () => {
    if (state.roomCode) {
      if (!state.socketConnected) {
        connectRoomSocket(state.roomCode);
      }
      fetchRoomState();
    } else if (state.pendingApprovalRoomCode) {
      fetchJoinRequestStatus();
    }
  });

  window.addEventListener("pagehide", () => {
    notifyLeaveRoomBeacon();
  });

  window.addEventListener("beforeunload", () => {
    notifyLeaveRoomBeacon();
  });
}

const finalApplyLanguage = applyLanguage;
applyLanguage = function applyLanguageFinal() {
  finalApplyLanguage();

  elements.heroDescription.textContent = state.language === "tr"
    ? "Oyun sahibi bir oda kurar, oyuncu sayısını belirler ve arkadaşlarını davet eder. Oyuncular davet linki ya da oda koduyla lobiye katılır. Turnuva başladığında herkes sırayla kutu açar, bulunan her yeşil kutu puan kazandırır. Finalde en çok yeşil kutu puanı toplayan oyuncu kazanır."
    : "The host creates a room, sets the player count, and invites friends. Players join via invite link or room code. Once the tournament starts, everyone opens boxes in turn, and every green box adds to the player's score. The player with the highest total at the end wins.";
  elements.heroRuleFlowText.textContent = state.language === "tr"
    ? "Toplam 5 tur vardır. Kutu sayısı azalır, yeşil kutu sayısı 5'ten 1'e düşer ve tüm puanlar final tabloya yazılır."
    : "There are 5 rounds in total. Box counts shrink, green box counts drop from 5 to 1, and every point carries into the final standings.";
  elements.heroRule1Text.textContent = state.language === "tr"
    ? "100 kutuda 5 yeşil kutu vardır. Herkes sırayla 1 kutu açar."
    : "Round 1 hides 5 green boxes among 100 boxes. Everyone opens 1 box in turn.";
  elements.heroRule2Text.textContent = state.language === "tr"
    ? "80 kutuda 4 yeşil kutu vardır."
    : "Round 2 hides 4 green boxes among 80 boxes.";
  elements.heroRule3Text.textContent = state.language === "tr"
    ? "60 kutuda 3 yeşil kutu vardır."
    : "Round 3 hides 3 green boxes among 60 boxes.";
  elements.heroRule4Text.textContent = state.language === "tr"
    ? "50 kutuda 2 yeşil kutu vardır."
    : "Round 4 hides 2 green boxes among 50 boxes.";
  elements.heroRule5Text.textContent = state.language === "tr"
    ? "40 kutuda 1 yeşil kutu vardır."
    : "Round 5 hides 1 green box among 40 boxes.";
  elements.heroRuleLeaderText.textContent = state.language === "tr"
    ? "Final sıralama toplam bulunan yeşil kutu sayısına göre belirlenir."
    : "The final ranking is based on the total number of green boxes found.";
  elements.turnRuleTitle.textContent = state.language === "tr" ? "Tur Kuralı" : "Round Rule";
  elements.bonusTitle.textContent = state.language === "tr" ? "Yeşil Kalan" : "Greens Left";
  elements.sidebarNoteText.textContent = state.language === "tr"
    ? "Önce rehberlere göz atabilir, sonra oda kurup puan tabanlı yeni sistemi hemen deneyebilirsin."
    : "You can skim the guides first, then create a room and try the score-based format right away.";
};

const finalRenderTurnRule = renderTurnRule;
renderTurnRule = function renderTurnRuleFinal(room) {
  finalRenderTurnRule(room);
  const rules = {
    1: state.language === "tr"
      ? "1. turda 100 kutu içinde 5 yeşil kutu vardır. Herkes sırayla 1 kutu açar."
      : "Round 1 has 5 green boxes hidden among 100 boxes. Everyone opens 1 box in turn.",
    2: state.language === "tr"
      ? "2. turda 80 kutu içinde 4 yeşil kutu vardır."
      : "Round 2 has 4 green boxes among 80 boxes.",
    3: state.language === "tr"
      ? "3. turda 60 kutu içinde 3 yeşil kutu vardır."
      : "Round 3 has 3 green boxes among 60 boxes.",
    4: state.language === "tr"
      ? "4. turda 50 kutu içinde 2 yeşil kutu vardır."
      : "Round 4 has 2 green boxes among 50 boxes.",
    5: state.language === "tr"
      ? "5. turda 40 kutu içinde 1 yeşil kutu vardır."
      : "Round 5 has 1 green box among 40 boxes."
  };

  elements.stepRuleText.textContent = rules[room.currentStep] || "";
};

const finalRenderStatus = renderStatus;
renderStatus = function renderStatusFinal(room) {
  finalRenderStatus(room);
  const remainingGreens = typeof room.remainingGreenCount === "number"
    ? room.remainingGreenCount
    : Math.max((room.greenBoxCount || 0) - (room.foundGreenCount || 0), 0);
  elements.bonusLabel.textContent = room.phase === "waiting" ? "-" : String(remainingGreens);
};

async function bootstrap() {
  const roomCode = new URLSearchParams(window.location.search).get("room");
  const persistedPlayerId = roomCode ? localStorage.getItem(roomStorageKey(roomCode)) : null;
  if (persistedPlayerId) {
    state.playerId = persistedPlayerId;
    sessionStorage.setItem(SESSION_KEYS.playerId, persistedPlayerId);
  }

  applyLanguage();
  persistPlayerName(state.playerName);
  setupEvents();

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
