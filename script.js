/* =========================================================
   Sabor&Arte — CONFIGURAÇÃO
   Edite só este bloco para mudar morada, telefone e horário.
   ========================================================= */
const CONFIG = {
  telefone: "910253753",           // usado no botão de ligar e no WhatsApp
  whatsapp: "351910253753",        // indicativo + número, sem espaços
  morada: "Rua da Estrada Nacional 105, nº 1699, loja 2, 4835-164 Guimarães",
  coords: "41.4149656,-8.3101641",  // pino exato no mapa (Google Maps)
  facebook: null,                  // TODO: link da página de Facebook
  // Horário segundo o Google Maps. [abre, fecha] em "HH:MM"; null = encerrado.
  // Ordem: Domingo, Segunda, Terça, Quarta, Quinta, Sexta, Sábado
  horario: [
    null,
    ["07:00", "19:30"],
    ["07:00", "19:30"],
    ["07:00", "19:30"],
    ["07:00", "19:30"],
    ["07:00", "19:30"],
    ["07:00", "14:30"],
  ],
};

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const fmt = (hhmm) => hhmm.replace(/^0/, "").replace(":", "h").replace("h00", "h");

/* ---------- Dados de contacto ---------- */
$$("[data-phone]").forEach((a) => (a.href = `tel:+351${CONFIG.telefone}`));
$("[data-year]").textContent = new Date().getFullYear();
if (CONFIG.facebook) $("[data-facebook]").href = CONFIG.facebook;
else $("[data-facebook]").remove();

const mapQuery = encodeURIComponent(CONFIG.coords || CONFIG.morada);
$("[data-address]").textContent = CONFIG.morada;
$("[data-map]").src = `https://maps.google.com/maps?q=${mapQuery}&z=16&output=embed`;
$("[data-directions]").href = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

/* ---------- Horário + estado "aberto agora" ---------- */
(function horario() {
  const now = new Date();
  const today = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();

  // Tabela começa à segunda-feira
  const order = [1, 2, 3, 4, 5, 6, 0];
  $("[data-hours]").innerHTML = order
    .map((d) => {
      const h = CONFIG.horario[d];
      return `<tr class="${d === today ? "is-today" : ""}"><td>${DIAS[d]}</td><td>${h ? `${fmt(h[0])} – ${fmt(h[1])}` : "Encerrado"}</td></tr>`;
    })
    .join("");

  const status = $("[data-status]");
  const h = CONFIG.horario[today];
  if (h && mins >= toMin(h[0]) && mins < toMin(h[1])) {
    status.textContent = `Aberto agora · até às ${fmt(h[1])}`;
    status.classList.add("is-open");
    return;
  }
  // Próxima abertura
  for (let i = 0; i < 7; i++) {
    const d = (today + i) % 7;
    const hd = CONFIG.horario[d];
    if (!hd || (i === 0 && mins >= toMin(hd[0]))) continue;
    const quando = i === 0 ? "hoje" : i === 1 ? "amanhã" : DIAS[d].toLowerCase();
    status.textContent = `Fechado · abrimos ${quando} às ${fmt(hd[0])}`;
    return;
  }
  status.textContent = "Fabrico próprio";
})();

/* ---------- Navegação ---------- */
const nav = $(".nav");
const toggle = $(".nav__toggle");
const links = $("#menu");
const fab = $(".fab");

toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  links.classList.toggle("is-open", !open);
});
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && links.classList.contains("is-open")) {
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("is-open");
    toggle.focus();
  }
});
links.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("is-open");
  }
});

const encomendar = $("#encomendar");
const onScroll = () => {
  nav.classList.toggle("is-scrolled", scrollY > 10);
  const r = encomendar.getBoundingClientRect();
  fab.classList.toggle("is-hidden", scrollY < 400 || (r.top < innerHeight && r.bottom > 0));
};
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Revelação ao scroll (com escalonamento) ---------- */
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
$$(".reveal").forEach((el) => {
  const siblings = $$(":scope > .reveal", el.parentElement);
  el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 6) * 0.08}s`);
  io.observe(el);
});

/* ---------- Tabs da vitrine ---------- */
const tabs = $$('[role="tab"]');
function selectTab(tab) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    $("#" + t.getAttribute("aria-controls")).hidden = !on;
  });
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => selectTab(t));
  t.addEventListener("keydown", (e) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    next.focus();
    selectTab(next);
  });
});

/* ---------- Carrossel de ocasiões: arrastar com o rato ---------- */
const cards = $("[data-drag]");
let down = false, startX = 0, startScroll = 0, moved = false;
cards.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse") return;
  down = true; moved = false; startX = e.clientX; startScroll = cards.scrollLeft;
});
addEventListener("pointermove", (e) => {
  if (!down) return;
  const dx = e.clientX - startX;
  if (Math.abs(dx) > 5) { moved = true; cards.classList.add("is-dragging"); }
  cards.scrollLeft = startScroll - dx;
});
addEventListener("pointerup", () => {
  down = false;
  cards.classList.remove("is-dragging");
});
cards.addEventListener("click", (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);

// Clicar numa ocasião pré-seleciona-a no formulário
const selOcasiao = $("#f-ocasiao");
$$(".card").forEach((card) =>
  card.querySelector(".card__link").addEventListener("click", () => {
    selOcasiao.value = card.dataset.ocasiao;
  })
);

/* ---------- Formulário de encomenda → WhatsApp ---------- */
const form = $("#order-form");
const dataInput = $("#f-data");
const minDate = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
dataInput.min = minDate;

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $(".form__error", form);
  const nome = form.nome.value.trim();
  const data = form.data.value;
  [form.nome, form.data].forEach((f) => f.removeAttribute("aria-invalid"));

  const problems = [];
  if (!nome) { problems.push("o seu nome"); form.nome.setAttribute("aria-invalid", "true"); }
  if (!data) { problems.push("a data"); form.data.setAttribute("aria-invalid", "true"); }
  if (problems.length) {
    err.textContent = `Falta indicar ${problems.join(" e ")}.`;
    err.hidden = false;
    form.querySelector('[aria-invalid="true"]').focus();
    return;
  }
  err.hidden = true;

  const dataPt = new Date(data + "T12:00").toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
  const linhas = [
    "Olá Sabor&Arte! Gostaria de fazer uma encomenda 🎂",
    "",
    `*Nome:* ${nome}`,
    `*Ocasião:* ${form.ocasiao.value}`,
    `*Data:* ${dataPt}`,
    form.pessoas.value ? `*Pessoas:* ${form.pessoas.value}` : null,
    form.detalhes.value.trim() ? `*Detalhes:* ${form.detalhes.value.trim()}` : null,
  ].filter((l) => l !== null);

  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(linhas.join("\n"))}`, "_blank", "noopener");
});
