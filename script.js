const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

// nav
const nav = $("#nav");
const burger = $("#burger");
const menu = $("#navLinks");

const setMenu = (open) => {
  menu.classList.toggle("open", open);
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  document.body.style.overflow = open ? "hidden" : "";
};

addEventListener("scroll", () => nav.classList.toggle("solid", scrollY > 20), { passive: true });
burger.onclick = () => setMenu(!menu.classList.contains("open"));
menu.onclick = (e) => e.target.closest("a") && setMenu(false);

// highlight whichever section is in the middle of the screen
const spy = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      menu.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.hash === "#" + e.target.id));
    }
  }
}, { rootMargin: "-45% 0px -50%" });
$$("section[id]").forEach((s) => spy.observe(s));

// fade things in on scroll
const fader = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add("in");
      fader.unobserve(e.target);
    }
  }
}, { threshold: 0.12 });

if (!calm) {
  $$(".heading, .about > div, .card, .project, .contact > *").forEach((el) => {
    el.classList.add("fade");
    fader.observe(el);
  });
}

// typing effect
const words = ["fast web apps", "clean APIs", "useful tools", "things that ship"];
const typed = $("#typed");

if (!calm) {
  let w = 0, i = words[0].length, back = true;

  (function type() {
    i += back ? -1 : 1;
    typed.textContent = words[w].slice(0, i);

    let wait = back ? 40 : 90;
    if (!back && i === words[w].length) { back = true; wait = 2200; }
    else if (back && i === 0) { back = false; w = (w + 1) % words.length; wait = 300; }

    setTimeout(type, wait);
  })();
}

// cursor glow + card spotlight (mouse only)
if (matchMedia("(pointer: fine)").matches && !calm) {
  const glow = $("#glow");
  let x = 0, y = 0, gx = 0, gy = 0;

  addEventListener("pointermove", (e) => {
    x = e.clientX;
    y = e.clientY;
    glow.style.opacity = 1;
  });

  (function follow() {
    gx += (x - gx) * 0.12;
    gy += (y - gy) * 0.12;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(follow);
  })();

  $("#cards").addEventListener("pointermove", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--x", e.clientX - r.left + "px");
    card.style.setProperty("--y", e.clientY - r.top + "px");
  });
}

// terminal
const out = $("#termOut");
const input = $("#termIn");
const past = [];
let h = 0;

const say = (text, cls) => {
  const p = document.createElement("p");
  if (cls) p.className = cls;
  p.textContent = text;
  out.append(p);
  $("#termBody").scrollTop = 1e6;
};

const jump = (id) => setTimeout(() => $(id).scrollIntoView(), 400);

const commands = {
  help: () => "commands: " + Object.keys(commands).filter((c) => c !== "sudo").join(", "),
  whoami: () => "Dylan Lyons. CS student at the University of Winchester, graduating 2027.",
  about: () => (jump("#about"), "scrolling to about..."),
  skills: () => "js  ts  react  node  python  java  sql  docker  git  aws  machine-learning",
  projects: () => (jump("#projects"), "scrolling to projects..."),
  contact: () => (jump("#contact"), "ddlyons2@hotmail.com  (or use the form below)"),
  cv: () => (open("cv.pdf"), "opening cv.pdf"),
  date: () => new Date().toString(),
  clear: () => (out.textContent = "", null),
  sudo: () => "nice try.",
};

const run = (raw) => {
  const cmd = raw.trim().toLowerCase();
  say(raw, "cmd");
  if (!cmd) return;

  past.push(cmd);
  h = past.length;

  const res = commands[cmd] ? commands[cmd]() : `command not found: ${cmd}. try 'help'`;
  if (res) say(res);
};

$("#termForm").onsubmit = (e) => {
  e.preventDefault();
  run(input.value);
  input.value = "";
};

input.onkeydown = (e) => {
  if (e.key === "ArrowUp" && h > 0) input.value = past[--h];
  else if (e.key === "ArrowDown") input.value = past[++h] ?? ((h = past.length), "");
  else if (e.key === "Tab" && input.value) {
    const match = Object.keys(commands).find((c) => c.startsWith(input.value));
    if (match) input.value = match;
  } else return;
  e.preventDefault();
};

$("#termBody").onclick = () => getSelection().isCollapsed && input.focus({ preventScroll: true });

// boot: fake-type "whoami" so it's obvious you can type here
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  if (!calm) {
    await sleep(700);
    for (const ch of "whoami") {
      input.value += ch;
      await sleep(110);
    }
    await sleep(300);
  }
  input.value = "";
  run("whoami");
  say("type 'help' to see what else this does", "hl");
})();

// local time
const clock = $("#clock");
const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" });
const tick = () => (clock.textContent = fmt.format(new Date()));
tick();
setInterval(tick, 30000);

// contact form
const form = $("#form");
const note = $("#status");

form.onsubmit = async (e) => {
  e.preventDefault();
  const btn = form.querySelector("button");

  if (form.action.includes("YOUR_FORM_ID")) {
    note.className = "status mono err";
    note.textContent = "form isn't hooked up yet";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Sending...";

  try {
    const res = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw 0;
    form.reset();
    note.className = "status mono ok";
    note.textContent = "Sent, thanks! I'll be in touch.";
  } catch {
    note.className = "status mono err";
    note.textContent = "Couldn't send that. Email me directly instead?";
  }

  btn.disabled = false;
  btn.textContent = "Send";
};

$("#year").textContent = new Date().getFullYear();
