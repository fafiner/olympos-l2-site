import { demoData } from "./data/demo-data.js";
import { createGameApi } from "./api.js";
import { t, getLocale } from "./i18n.js";

// Fonte de dados central: a Home usa a demonstração até existir uma API de produção.
// A implementação da API está isolada em api.js e segue o mesmo contrato dos dados abaixo.
const api = window.OLYMPOS_API_URL ? createGameApi({ baseUrl: window.OLYMPOS_API_URL }) : null;
const fmt = () => new Intl.NumberFormat(getLocale());
let rankingClasses = demoData.rankingsByClass;
let activeRankingCategory = "pvp";
let activeRankingClass = "all";
let latestData = demoData;
let bossInterval;

const $ = (selector, root = document) => root.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));
const safeAssetPath = (value) => typeof value === "string" && /^\.\/assets\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g)$/i.test(value)
  ? value
  : "./assets/olympos-wordmark.png";

function renderClassRankings() {
  const select = $("#ranking-class");
  const body = $("#ranking-rows");
  if (!select || !body) return;

  const availableClasses = Array.isArray(rankingClasses) ? rankingClasses : [];
  select.innerHTML = `<option value="all">${t("Todas as classes")}</option>` + availableClasses.map((entry) =>
    `<option value="${escapeHtml(entry.id)}">${escapeHtml(entry.name)}</option>`).join("");
  if (activeRankingClass !== "all" && !availableClasses.some((entry) => entry.id === activeRankingClass)) {
    activeRankingClass = "all";
  }
  select.value = activeRankingClass;

  const selectedClasses = activeRankingClass === "all"
    ? availableClasses
    : availableClasses.filter((entry) => entry.id === activeRankingClass);
  const rows = selectedClasses.flatMap((classEntry) => {
    const board = Array.isArray(classEntry[activeRankingCategory]) ? classEntry[activeRankingCategory] : [];
    const leaders = activeRankingClass === "all" ? board.slice(0, 1) : board.slice(0, 3);
    return leaders.map(([name, clan, score], index) => ({ name, clan, score, className: classEntry.name, position: index + 1 }));
  });

  body.innerHTML = rows.length ? rows.map((row) => `
    <tr><td><span class="class-rank-position">${String(row.position).padStart(2, "0")}</span></td>
      <td class="class-rank-player">${escapeHtml(row.name)}</td><td>${escapeHtml(row.className)}</td><td>${escapeHtml(row.clan)}</td>
      <td class="class-rank-score">${fmt().format(row.score)}</td></tr>`).join("")
    : `<tr><td class="ranking-empty" colspan="5">${t("Ainda não há resultados nesta classificação.")}</td></tr>`;

  const labels = { pvp: t("PONTOS PvP"), pk: t("PONTOS PK"), olympiad: t("PONTOS OLYMPIAD") };
  $("#ranking-score-heading").textContent = labels[activeRankingCategory];
  $("#ranking-scope").textContent = activeRankingClass === "all"
    ? t("Um líder por classe")
    : `Top 3 — ${selectedClasses[0]?.name ?? t("CLASSE")}`;
}

document.querySelectorAll("[data-ranking-tab]").forEach((tab) => tab.addEventListener("click", () => {
  activeRankingCategory = tab.dataset.rankingTab;
  document.querySelectorAll("[data-ranking-tab]").forEach((item) => {
    const selected = item === tab;
    item.classList.toggle("is-active", selected);
    item.setAttribute("aria-selected", String(selected));
  });
  renderClassRankings();
}));
$("#ranking-class")?.addEventListener("change", (event) => {
  activeRankingClass = event.target.value;
  renderClassRankings();
});

function applyHomeData(data) {
  latestData = data;
  const isDemo = data.source === "demo";
  rankingClasses = data.rankingsByClass ?? demoData.rankingsByClass;
  renderClassRankings();
  const locale = getLocale();
  const numberFormat = new Intl.NumberFormat(locale);
  const status = data.server.status === "online" ? "Online" : data.server.status === "maintenance" ? t("Manutenção") : t("Em preparação");
  $("#server-status").textContent = t(status);
  $("#server-status").closest(".status-item")?.classList.toggle("live", data.server.status === "online" && !isDemo);
  $("#players-online").textContent = Number.isFinite(data.server.playersOnline) ? numberFormat.format(data.server.playersOnline) : "—";
  const siegeDate = data.server.nextSiegeAt ? new Date(data.server.nextSiegeAt) : null;
  const dateOptions = { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" };
  $("#next-siege").textContent = siegeDate && Number.isFinite(siegeDate.getTime()) ? siegeDate.toLocaleString(locale, dateOptions).replace(".", "") : t("A anunciar");
  $("#siege-detail-date").textContent = siegeDate && Number.isFinite(siegeDate.getTime()) ? siegeDate.toLocaleString(locale, { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }) : t("A anunciar");

  $("#pvp-list").innerHTML = data.pvpLeaders.map((leader, index) => `
    <div class="rank-row"><span class="rank-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="rank-avatar ${["", "rank-alt", "rank-third"][index] ?? ""}">${escapeHtml(String(leader.name).slice(0, 1))}</span>
      <span class="rank-name">${escapeHtml(leader.name)}<small>${escapeHtml(leader.className)} · ${escapeHtml(leader.clan)}</small></span>
      <strong>${numberFormat.format(leader.pvpCount)} <small>${t("FIGHTS")}</small></strong>
    </div>`).join("");
  $("#boss-name").textContent = data.epicBoss.name;
  $("#boss-caption").textContent = t(data.epicBoss.caption);
  $("#boss-state").textContent = t(data.epicBoss.state).toUpperCase();
  renderCountdown(data.epicBoss.nextSpawnAt ? new Date(data.epicBoss.nextSpawnAt) : null);
  window.clearInterval(bossInterval);
  if (data.epicBoss.nextSpawnAt) bossInterval = window.setInterval(() => renderCountdown(new Date(data.epicBoss.nextSpawnAt)), 1000);

  $("#event-list").innerHTML = data.events.map((event) => `
    <div class="event-row"><span class="event-date">${escapeHtml(event.day)}<small>${escapeHtml(t(event.month))}</small></span>
      <span class="event-name">${escapeHtml(t(event.name))}<small>${escapeHtml(t(event.detail))}</small></span><span class="event-time">${escapeHtml(event.time)}</span>
    </div>`).join("") || `<div class="event-row"><span class="event-date">—</span><span class="event-name">${escapeHtml(t("A agenda será anunciada."))}</span><span class="event-time">—</span></div>`;
  const monthTranslation = locale === "en" ? "OCT" : locale === "es" ? "OCT" : "OUT";
  $("#news-grid").innerHTML = data.news.map((item) => `
    <article class="news-card"><div class="news-art" aria-hidden="true"><img class="parallax-image" src="${safeAssetPath(item.image)}" alt="" loading="lazy" decoding="async"></div>
      <div class="news-meta"><span>${escapeHtml(t(item.category))}</span><span>·</span><span>${escapeHtml(String(item.date).replace(/\bOUT\b/g, monthTranslation))}</span></div>
      <h3>${escapeHtml(t(item.title))}</h3><span class="news-read">${escapeHtml(t("Ler crônica "))}<span>↗</span></span>
    </article>`).join("");

  document.querySelectorAll(".demo-tag").forEach((tag) => {
    tag.hidden = !isDemo;
    if (isDemo) tag.textContent = "DEMO";
  });
}

function renderCountdown(target) {
  if (!target || !Number.isFinite(target.getTime())) {
    $("#boss-countdown").innerHTML = `<span><b>—</b><i>${t("DIAS")}</i></span><span><b>—</b><i>${t("HORAS")}</i></span><span><b>—</b><i>${t("MIN")}</i></span><span><b>—</b><i>${t("SEG")}</i></span>`;
    return;
  }
  let remaining = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
  const days = Math.floor(remaining / 86400); remaining %= 86400;
  const hours = Math.floor(remaining / 3600); remaining %= 3600;
  const minutes = Math.floor(remaining / 60); const seconds = remaining % 60;
  const values = [days, hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
  $("#boss-countdown").innerHTML = values.map((value, index) => `<span><b>${value}</b><i>${t(["DIAS", "HORAS", "MIN", "SEG"][index])}</i></span>`).join("");
}

// Instante único do lançamento, comunicado em UTC para todos os países.
const launchAt = new Date("2026-11-07T22:00:00Z");
function renderLaunchCountdown() {
  const timer = $("#launch-timer");
  if (!timer) return;
  let remaining = Math.max(0, Math.floor((launchAt.getTime() - Date.now()) / 1000));
  const days = Math.floor(remaining / 86400); remaining %= 86400;
  const hours = Math.floor(remaining / 3600); remaining %= 3600;
  const minutes = Math.floor(remaining / 60); const seconds = remaining % 60;
  const values = [days, hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
  timer.innerHTML = values.map((value, index) => `<span><b>${value}</b><i>${t(["DIAS", "HORAS", "MIN", "SEG"][index])}</i></span>`).join("");
}
renderLaunchCountdown();
window.setInterval(renderLaunchCountdown, 1000);

// API wiring is intentionally opt-in; the preview remains usable with no backend.
if (api) {
  api.getHome().then((data) => applyHomeData({ ...data, source: "live" })).catch((error) => {
    console.warn("Olympos API indisponível; mostrando dados de demonstração.", error);
    applyHomeData(demoData);
  });
} else {
  applyHomeData(demoData);
}

const menuToggle = $(".menu-toggle");
const nav = $("#main-nav");
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
});
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  nav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

const modal = $("#info-modal");
const openInfo = (title, copy) => {
  $("#modal-title").textContent = title;
  $("#modal-copy").textContent = copy;
  modal.showModal();
};
$("#register-button").addEventListener("click", () => openInfo(t("A conta será criada dentro do jogo."), t("Olympos L2 usará criação automática de contas pelo cliente do jogo. Não será necessário preencher um cadastro no site. O cliente e as instruções de acesso serão divulgados junto com as informações oficiais de lançamento.")));
$("#download-button").addEventListener("click", (event) => {
  event.preventDefault();
  openInfo(t("O portal do jogo será aberto em breve."), t("O cliente e o launcher ainda estão sendo preparados. O botão de download ficará ativo quando os arquivos oficiais estiverem disponíveis."));
});

const passwordForm = $("#password-change-form");
const passwordStatus = $("#password-change-status");
const passwordSubmit = passwordForm.querySelector("[type=submit]");
const passwordSubmitLabel = passwordSubmit.querySelector("span");
let passwordServiceReady = false;
const setPasswordStatus = (message) => { passwordStatus.textContent = t(message); };

async function checkPasswordService() {
  try {
    const response = await fetch("/api/account/password/change", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });
    const result = await response.json();
    passwordServiceReady = response.ok && result.available === true;
  } catch {
    passwordServiceReady = false;
  }

  passwordSubmit.disabled = !passwordServiceReady;
  passwordSubmitLabel.textContent = t(passwordServiceReady ? "Alterar senha" : "Serviço de contas indisponível");
  setPasswordStatus(passwordServiceReady
    ? "Serviço seguro disponível. Somente contas de jogador sem privilégios podem usar este painel."
    : "O painel está em configuração e ainda não está recebendo senhas.");
}

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!passwordServiceReady || !passwordForm.reportValidity()) return;

  const account = passwordForm.elements.account.value.trim();
  const currentPassword = passwordForm.elements.currentPassword.value;
  const newPassword = passwordForm.elements.newPassword.value;
  const confirmPassword = passwordForm.elements.confirmPassword.value;
  if (newPassword !== confirmPassword) {
    setPasswordStatus("A confirmação não corresponde à nova senha.");
    passwordForm.elements.confirmPassword.focus();
    return;
  }

  passwordSubmit.disabled = true;
  passwordSubmitLabel.textContent = t("Alterando senha…");
  setPasswordStatus("Validando os dados da conta…");
  try {
    const response = await fetch("/api/account/password/change", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ account, currentPassword, newPassword }),
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok && result.ok === true) {
      passwordForm.reset();
      setPasswordStatus("Senha alterada. Já pode entrar no jogo com a nova senha.");
    } else if (response.status === 429) {
      setPasswordStatus("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
    } else if (response.status === 400 || response.status === 401 || response.status === 403) {
      setPasswordStatus("Não foi possível alterar. Confira login e senha atual; este painel aceita somente contas de jogador sem privilégios.");
    } else {
      setPasswordStatus("Não foi possível concluir agora. Tente novamente mais tarde.");
    }
  } catch {
    setPasswordStatus("Não foi possível conectar ao serviço de contas. Tente novamente mais tarde.");
  } finally {
    passwordForm.elements.currentPassword.value = "";
    passwordForm.elements.newPassword.value = "";
    passwordForm.elements.confirmPassword.value = "";
    passwordSubmit.disabled = !passwordServiceReady;
    passwordSubmitLabel.textContent = t(passwordServiceReady ? "Alterar senha" : "Serviço de contas indisponível");
  }
});

checkPasswordService();
window.addEventListener("olympos:language-change", () => {
  passwordSubmitLabel.textContent = t(passwordServiceReady ? "Alterar senha" : "Serviço de contas indisponível");
});

$(".modal-close").addEventListener("click", () => modal.close());
$(".modal-confirm").addEventListener("click", () => modal.close());
modal.addEventListener("click", (event) => { if (event.target === modal) modal.close(); });
window.addEventListener("olympos:language-change", () => applyHomeData(latestData));

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
}), { threshold: 0.08 });
document.querySelectorAll(".pillar-card,.server-rule,.arena-card,.siege-panel,.olympiad-card,.events-card,.news-card").forEach((element) => {
  element.classList.add("reveal"); observer.observe(element);
});

// Movement is tied to the page scroll and remains still when reduced motion is preferred.
const parallaxImages = [...document.querySelectorAll(".parallax-image")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let parallaxFrame = 0;
function updateParallax() {
  parallaxFrame = 0;
  if (reduceMotion.matches) {
    parallaxImages.forEach((image) => image.style.setProperty("--parallax-y", "0px"));
    return;
  }
  const viewportCenter = window.innerHeight / 2;
  parallaxImages.forEach((image) => {
    const bounds = image.parentElement.getBoundingClientRect();
    const offset = Math.max(-42, Math.min(42, (viewportCenter - (bounds.top + bounds.height / 2)) * 0.055));
    image.style.setProperty("--parallax-y", `${offset.toFixed(1)}px`);
  });
}
function requestParallaxUpdate() {
  if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateParallax);
}
window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
window.addEventListener("resize", requestParallaxUpdate);
reduceMotion.addEventListener?.("change", requestParallaxUpdate);
updateParallax();
