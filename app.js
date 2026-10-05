import { demoData } from "./data/demo-data.js";
import { createGameApi } from "./api.js";

// Fonte de dados central: a Home usa a demonstração até existir uma API de produção.
// A implementação da API está isolada em api.js e segue o mesmo contrato dos dados abaixo.
const api = window.OLYMPOS_API_URL ? createGameApi({ baseUrl: window.OLYMPOS_API_URL }) : null;
const source = demoData.source;
const fmt = new Intl.NumberFormat("pt-BR");
let rankingClasses = demoData.rankingsByClass;
let activeRankingCategory = "pvp";
let activeRankingClass = "all";

const $ = (selector, root = document) => root.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));

function renderClassRankings() {
  const select = $("#ranking-class");
  const body = $("#ranking-rows");
  if (!select || !body) return;

  const availableClasses = Array.isArray(rankingClasses) ? rankingClasses : [];
  select.innerHTML = '<option value="all">Todas as classes</option>' + availableClasses.map((entry) =>
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
      <td class="class-rank-score">${fmt.format(row.score)}</td></tr>`).join("")
    : '<tr><td class="ranking-empty" colspan="5">Ainda não há resultados nesta classificação.</td></tr>';

  const labels = { pvp: "PONTOS PvP", pk: "PONTOS PK", olympiad: "PONTOS OLYMPIAD" };
  $("#ranking-score-heading").textContent = labels[activeRankingCategory];
  $("#ranking-scope").textContent = activeRankingClass === "all"
    ? "Um líder por classe"
    : `Top 3 — ${selectedClasses[0]?.name ?? "classe"}`;
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
  rankingClasses = data.rankingsByClass ?? demoData.rankingsByClass;
  renderClassRankings();
  const status = data.server.status === "online" ? "Online" : "Manutenção";
  $("#server-status").textContent = status;
  $("#players-online").textContent = fmt.format(data.server.playersOnline);
  const siegeDate = new Date(data.server.nextSiegeAt);
  const dateOptions = { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" };
  $("#next-siege").textContent = siegeDate.toLocaleString("pt-BR", dateOptions).replace(".", "");
  $("#siege-detail-date").textContent = siegeDate.toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });

  $("#pvp-list").innerHTML = data.pvpLeaders.map((leader, index) => `
    <div class="rank-row"><span class="rank-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="rank-avatar ${["", "rank-alt", "rank-third"][index] ?? ""}">${leader.name.slice(0, 1)}</span>
      <span class="rank-name">${leader.name}<small>${leader.className} · ${leader.clan}</small></span>
      <strong>${fmt.format(leader.pvpCount)} <small>FIGHTS</small></strong>
    </div>`).join("");
  $("#boss-name").textContent = data.epicBoss.name;
  $("#boss-caption").textContent = data.epicBoss.caption;
  $("#boss-state").textContent = data.epicBoss.state.toUpperCase();
  renderCountdown(new Date(data.epicBoss.nextSpawnAt));
  window.setInterval(() => renderCountdown(new Date(data.epicBoss.nextSpawnAt)), 1000);

  $("#event-list").innerHTML = data.events.map((event) => `
    <div class="event-row"><span class="event-date">${event.day}<small>${event.month}</small></span>
      <span class="event-name">${event.name}<small>${event.detail}</small></span><span class="event-time">${event.time}</span>
    </div>`).join("");
  $("#news-grid").innerHTML = data.news.map((item) => `
    <article class="news-card"><div class="news-art" aria-hidden="true"><img class="parallax-image" src="${item.image}" alt=""></div>
      <div class="news-meta"><span>${item.category}</span><span>·</span><span>${item.date}</span></div>
      <h3>${item.title}</h3><span class="news-read">Ler crônica <span>↗</span></span>
    </article>`).join("");

  document.querySelectorAll(".demo-tag").forEach((tag) => {
    if (source === "demo") tag.textContent = "DEMO";
  });
}

function renderCountdown(target) {
  let remaining = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
  const days = Math.floor(remaining / 86400); remaining %= 86400;
  const hours = Math.floor(remaining / 3600); remaining %= 3600;
  const minutes = Math.floor(remaining / 60); const seconds = remaining % 60;
  const values = [days, hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
  $("#boss-countdown").innerHTML = values.map((value, index) => `<span><b>${value}</b><i>${["DIAS", "HORAS", "MIN", "SEG"][index]}</i></span>`).join("");
}

// 22:00 em Portugal continental corresponde a UTC+0 nesta data.
const launchAt = new Date("2026-11-07T22:00:00+00:00");
function renderLaunchCountdown() {
  const timer = $("#launch-timer");
  if (!timer) return;
  let remaining = Math.max(0, Math.floor((launchAt.getTime() - Date.now()) / 1000));
  const days = Math.floor(remaining / 86400); remaining %= 86400;
  const hours = Math.floor(remaining / 3600); remaining %= 3600;
  const minutes = Math.floor(remaining / 60); const seconds = remaining % 60;
  const values = [days, hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
  timer.innerHTML = values.map((value, index) => `<span><b>${value}</b><i>${["DIAS", "HORAS", "MIN", "SEG"][index]}</i></span>`).join("");
}
renderLaunchCountdown();
window.setInterval(renderLaunchCountdown, 1000);

// API wiring is intentionally opt-in; the preview remains usable with no backend.
if (api) {
  api.getHome().then(applyHomeData).catch((error) => {
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
$("#register-button").addEventListener("click", () => openInfo("A abertura está chegando.", "O cadastro de Olympos L2 será liberado junto com as informações oficiais de abertura. Acompanhe as crônicas para ser avisado."));
$("#download-button").addEventListener("click", (event) => {
  event.preventDefault();
  openInfo("O portal do jogo será aberto em breve.", "O cliente e o launcher ainda estão sendo preparados. O botão de download ficará ativo quando os arquivos oficiais estiverem disponíveis.");
});
$(".modal-close").addEventListener("click", () => modal.close());
$(".modal-confirm").addEventListener("click", () => modal.close());
modal.addEventListener("click", (event) => { if (event.target === modal) modal.close(); });

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
}), { threshold: 0.08 });
document.querySelectorAll(".pillar-card,.arena-card,.siege-panel,.olympiad-card,.events-card,.news-card").forEach((element) => {
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
