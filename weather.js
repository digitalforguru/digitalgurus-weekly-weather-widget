const weatherWidget = document.getElementById("weatherWidget");
const cityInput = document.getElementById("cityInput");
const locationPopup = document.getElementById("locationPopup");
const locationBtn = document.getElementById("locationBtn");

const themeToggle = document.getElementById("themeToggle");
const themeOptions = document.getElementById("themeOptions");
const themeCircles = document.querySelectorAll(".theme-circle");

const fontToggle = document.getElementById("fontToggle");
const fontOptions = document.getElementById("fontOptions");
const fontChoices = document.querySelectorAll(".font-option");

const copyLinkBtn = document.getElementById("copyLinkBtn");

const params = new URLSearchParams(window.location.search);
const isEmbed = params.get("embed") === "true";

const iconMap = {
  Clear: "https://i.pinimg.com/originals/09/fb/e5/09fbe54e3fdbf459e490006c56f999f9.gif",
  Clouds: "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif",
  Rain: "https://i.pinimg.com/originals/2e/50/b8/2e50b8f6c94ecce01cbc30eb275fc6ea.gif",
  Snow: "https://i.pinimg.com/originals/6e/36/7c/6e367ce95ab109121d03f12ed7d250c8.gif",
  Thunderstorm: "https://i.pinimg.com/originals/86/5e/10/865e10e7bcc6a739e01598dfbe38e300.gif",
  Drizzle: "https://i.pinimg.com/originals/2e/50/b8/2e50b8f6c94ecce01cbc30eb275fc6ea.gif",
  Mist: "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif",
  Fog: "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif",
  Haze: "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif"
};

const cloudIconURL =
  "https://i.pinimg.com/originals/e3/9d/e9/e39de96ddbf852ed53a4e9a993550641.gif";

/* =========================
   EMBED MODE
========================= */
if (isEmbed) {
  const builderUI = document.querySelector(".builder-ui");
  if (builderUI) builderUI.style.display = "none";
}

/* =========================
   FONT
========================= */
fontToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  fontOptions.classList.toggle("hidden");
});

fontChoices.forEach(option => {
  option.addEventListener("click", () => {
    const font = option.dataset.font;
    localStorage.setItem("userFont", font);
    applyFont(font);
    fontOptions.classList.add("hidden");
  });
});

function applyFont(font) {
  const map = {
    serif: "Georgia, serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
    default: "'Satoshi', sans-serif"
  };

  weatherWidget.style.fontFamily = map[font] || map.default;
}

/* =========================
   LOCATION POPUP
========================= */
locationBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  locationPopup.classList.toggle("hidden");
  if (!locationPopup.classList.contains("hidden")) cityInput.focus();
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    if (!city) return;

    localStorage.setItem("userCity", city);
    locationPopup.classList.add("hidden");

    getWeeklyWeather(city);
  }
});

document.addEventListener("click", (e) => {
  if (!locationPopup.contains(e.target) && !locationBtn.contains(e.target)) {
    locationPopup.classList.add("hidden");
  }
});

/* =========================
   THEME
========================= */
themeToggle.addEventListener("click", () => {
  themeOptions.classList.toggle("hidden");
});

themeCircles.forEach(circle => {
  circle.addEventListener("click", () => {
    const theme = circle.dataset.theme;
    weatherWidget.className = `widget ${theme} weekly-widget`;
    localStorage.setItem("userTheme", theme);
    themeOptions.classList.add("hidden");
  });
});

/* =========================
   GEO
========================= */
async function getCoords(city) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
  );
  const data = await res.json();

  if (!data.results?.length) throw new Error("city not found");

  return {
    lat: data.results[0].latitude,
    lon: data.results[0].longitude,
    name: data.results[0].name,
    state: data.results[0].admin1 || data.results[0].country || ""
  };
}

/* =========================
   CREATE UI (IMPORTANT FIX)
========================= */
function buildWeekUI() {
  const grid = document.querySelector(".weekly-grid");
  grid.innerHTML = ""; // wipe static content

  const days = ["mon","tue","wed","thu","fri","sat","sun"];

  days.forEach(day => {
    const card = document.createElement("div");
    card.className = "day";

    card.innerHTML = `
      <p class="day-name">${day}</p>
      <img class="day-icon" />
      <p class="day-temp">--°</p>
    `;

    grid.appendChild(card);
  });
}

/* =========================
   WEATHER
========================= */
async function getWeeklyWeather(city) {
  try {
    const { lat, lon, name, state } = await getCoords(city);

    document.getElementById("cityName").textContent = name || city;
    document.getElementById("stateName").textContent = (state || "").toLowerCase();

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,weathercode&timezone=auto`
    );

    const data = await res.json();

    const maxTemps = data.daily.temperature_2m_max;
    const codes = data.daily.weathercode;

    const cards = document.querySelectorAll(".day");

    const today = new Date().toISOString().split("T")[0];

    const monday = new Date();
    const offset = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - offset);

    const weekDates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0];
    });

    function type(code) {
      if (code === 0) return "Clear";
      if (code <= 3) return "Clouds";
      if (code <= 48) return "Fog";
      if (code <= 67) return "Rain";
      if (code <= 77) return "Snow";
      return "Thunderstorm";
    }

    cards.forEach((card, i) => {
      const icon = card.querySelector(".day-icon");
      const temp = card.querySelector(".day-temp");

      const weatherType = type(codes[i]);
      icon.src = iconMap[weatherType] || cloudIconURL;

      temp.textContent = `${Math.round(maxTemps[i])}°`;

      card.classList.toggle("today", weekDates[i] === today);
    });

  } catch (e) {
    console.error(e);
    document.getElementById("cityName").textContent = "error loading weather";
  }
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  buildWeekUI();

  const city =
    new URLSearchParams(window.location.search).get("city") ||
    localStorage.getItem("userCity") ||
    "Los Angeles";

  weatherWidget.className =
    `widget ${localStorage.getItem("userTheme") || "pink"} weekly-widget`;

  applyFont(localStorage.getItem("userFont") || "default");

  getWeeklyWeather(city);
});
