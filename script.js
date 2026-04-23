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

const translations = {
  tr: {
    siteTitle: "Yeşil Kutuyu Bul",
    brandEyebrow: "Çok Oyunculu Tarayıcı Oyunu",
    brandTitle: "Yeşil Kutuyu Bul",
    languageLabel: "Dil",
    playerBadgeLabel: "Oyuncu",
    heroKicker: "Lobi tabanlı oyun",
    heroTitle: "Arkadaşlarını davet et, sırayla kutu aç, yeşili bulan kazansın.",
    heroDescription: "Oyun sahibi bir oda kurar, oyuncu sayısını belirler ve arkadaşlarını davet eder. Oyuncular davet linki ya da oda koduyla lobiye katılır. Turnuva başladığında herkes sırayla kutu açar, yeşil kutuyu bulan oyuncu o turu kazanır ve bir sonraki turda avantaj elde eder.",
    heroRuleFlowTitle: "Oyun Akışı",
    heroRuleFlowText: "Toplam 5 tur vardır. Her turda kutu sayısı azalır ve oyun daha zor hale gelir.",
    heroRule1Title: "Tur 1",
    heroRule1Text: "100 kutu vardır. Herkes sırayla 1 kutu açar. Yeşili bulan ilk turu kazanır.",
    heroRule2Title: "Tur 2",
    heroRule2Text: "80 kutu vardır. 1. turu kazanan oyuncu ilk başlar ve arka arkaya 5 kutu açar.",
    heroRule3Title: "Tur 3",
    heroRule3Text: "60 kutu vardır. 2. turu kazanan oyuncu ilk başlar ve 5 kutu açma hakkı kazanır.",
    heroRule4Title: "Tur 4",
    heroRule4Text: "50 kutu vardır. 3. turu kazanan oyuncu ilk başlar ve yine 5 kutu açar.",
    heroRule5Title: "Tur 5",
    heroRule5Text: "40 kutu vardır. 4. turu kazanan oyuncu ilk başlar, bu kez 3 kutu açar.",
    heroRuleLeaderTitle: "Liderlik",
    heroRuleLeaderText: "Turnuva sonunda en çok tur kazanan oyuncu lider olur. Eşitlik varsa liderlik paylaşılır.",
    guidesTitle: "Rehberler",
    guidePrimary: "Yeşil Kutuyu Bul nasıl oynanır?",
    guideSecondary: "Arkadaşlarla browser oyunu",
    sidebarNoteTitle: "Oyun Hakkında",
    sidebarNoteText: "Önce rehberlere göz atabilir, sonra oda kurup hemen oyuna başlayabilirsin.",
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
    bonusTitle: "Bonus Hak",
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
    restartDialogKicker: "Tur Bitti",
    restartGame: "Tekrar Başlat",
    later: "Daha Sonra",
    celebrationKicker: "Tur Kazanıldı",
    pending: "Bekleniyor",
    turnRule1: "1. turda 100 kutu vardır ve herkes sırayla 1 kutu açar.",
    turnRule2: "2. turda 80 kutu vardır. 1. turu kazanan oyuncu ilk başlar ve arka arkaya 5 kutu açar.",
    turnRule3: "3. turda 60 kutu vardır. 2. turu kazanan oyuncu ilk başlar ve 5 kutu açma avantajı alır.",
    turnRule4: "4. turda 50 kutu vardır. 3. turu kazanan oyuncu yine 5 kutu açarak başlar.",
    turnRule5: "5. turda 40 kutu vardır. 4. turu kazanan oyuncu ilk başlar ve bu kez 3 kutu açabilir."
  },
  en: {
    siteTitle: "Find the Green Box",
    brandEyebrow: "Multiplayer Browser Game",
    brandTitle: "Find the Green Box",
    languageLabel: "Language",
    playerBadgeLabel: "Player",
    heroKicker: "Lobby-based game",
    heroTitle: "Invite your friends, open boxes in turns, and win by finding the green one.",
    heroDescription: "The host creates a room, sets the player count, and invites friends. Players join via invite link or room code. Once the tournament starts, everyone opens boxes in turn. Whoever finds the green box wins that round and gains an advantage in the next one.",
    heroRuleFlowTitle: "Game Flow",
    heroRuleFlowText: "There are 5 rounds in total. Each round has fewer boxes and gets harder.",
    heroRule1Title: "Round 1",
    heroRule1Text: "There are 100 boxes. Everyone opens 1 box in turn. The player who finds the green box wins the round.",
    heroRule2Title: "Round 2",
    heroRule2Text: "There are 80 boxes. The winner of round 1 starts first and opens 5 boxes in a row.",
    heroRule3Title: "Round 3",
    heroRule3Text: "There are 60 boxes. The winner of round 2 starts first and gets 5 opening picks.",
    heroRule4Title: "Round 4",
    heroRule4Text: "There are 50 boxes. The winner of round 3 starts first and again opens 5 boxes.",
    heroRule5Title: "Round 5",
    heroRule5Text: "There are 40 boxes. The winner of round 4 starts first and opens 3 boxes this time.",
    heroRuleLeaderTitle: "Leaderboard",
    heroRuleLeaderText: "At the end of the tournament, the player with the most round wins becomes the leader. Ties share the lead.",
    guidesTitle: "Guides",
    guidePrimary: "How to play Find the Green Box",
    guideSecondary: "Browser game with friends",
    sidebarNoteTitle: "About the Game",
    sidebarNoteText: "Browse the guides first, then create a room and start playing right away.",
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
    bonusTitle: "Bonus Picks",
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
    restartDialogKicker: "Round Complete",
    restartGame: "Restart",
    later: "Later",
    celebrationKicker: "Round Won",
    pending: "Waiting",
    turnRule1: "Round 1 has 100 boxes and everyone opens 1 box in turn.",
    turnRule2: "Round 2 has 80 boxes. The winner of round 1 starts first and opens 5 boxes in a row.",
    turnRule3: "Round 3 has 60 boxes. The winner of round 2 starts first and gets 5 opening picks.",
    turnRule4: "Round 4 has 50 boxes. The winner of round 3 starts first and again opens 5 boxes.",
    turnRule5: "Round 5 has 40 boxes. The winner of round 4 starts first and opens 3 boxes this time."
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
          ? `Avantaj sende. Bu açılış serisinde ${room.openingStreakRemaining} kutu hakkın kaldı. Süren ${room.secondsUntilTurnTimeout} saniye.`
          : `You have the opening advantage. ${room.openingStreakRemaining} picks left in this streak. ${room.secondsUntilTurnTimeout} seconds remaining.`)
        : state.pendingMove
          ? (state.language === "tr" ? "Hamlen gönderiliyor..." : "Submitting your move...")
          : (state.language === "tr"
            ? `Sıra sende. Bir kutu seç ve yeşili bulmaya çalış. Süren ${room.secondsUntilTurnTimeout} saniye.`
            : `It's your turn. Pick a box and try to find the green one. ${room.secondsUntilTurnTimeout} seconds remaining.`);
    } else {
      elements.statusText.textContent = room.openingStreakRemaining > 0 && openingPlayer
        ? (state.language === "tr"
          ? `${openingPlayer.name} avantaj serisini oynuyor. Sonra normal sıra devam edecek.`
          : `${openingPlayer.name} is using the opening advantage. Normal turn order will continue after this.`)
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
        ? `${leaders.map((player) => player.name).join(", ")} aynı sayıda tur kazandı.`
        : `${leaders.map((player) => player.name).join(", ")} won the same number of rounds.`)
      : (state.language === "tr"
        ? `${leaders[0]?.name || "Oyuncu"} en fazla tur birinciliğini aldı.`
        : `${leaders[0]?.name || "A player"} got the most round wins.`);
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
    ? (state.language === "tr" ? "Turnuva beraberlikle bitti" : "The tournament ended in a tie")
    : (state.language === "tr" ? `${leaders[0]?.name || "Oyuncu"} lider oldu` : `${leaders[0]?.name || "A player"} is the leader`);
  elements.restartText.textContent = state.language === "tr"
    ? "Aynı lobiyle 5 turluk yeni bir turnuva başlatmak ister misin?"
    : "Would you like to start a new 5-round tournament with the same lobby?";
  elements.restartDialog.showModal();
  state.restartDialogShownForTournament = true;
}

function renderRoom(room) {
  const previousPhase = state.room?.phase;
  state.room = room;
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
    if (!state.isLeaving) {
      showToast(error.message);
    }
    leaveRoom({ silent: true });
    return;
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

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearPoll();
      clearPendingJoinPoll();
      return;
    }

    if (state.roomCode) {
      fetchRoomState();
      return;
    }

    if (state.pendingApprovalRoomCode) {
      fetchJoinRequestStatus();
    }
  });

  window.addEventListener("pageshow", () => {
    if (state.roomCode) {
      fetchRoomState();
    } else if (state.pendingApprovalRoomCode) {
      fetchJoinRequestStatus();
    }
  });
}

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
