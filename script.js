// Popmotion 8 tools (loaded from the script tag in index.html)
const { styler, spring } = popmotion;

// LA crime data API (Socrata). 2nrs-mtv8 = "Crime Data from 2020 to Present"
const API_URL = "https://data.lacity.org/resource/2nrs-mtv8.json";

const crimeList = document.querySelector("#crime-list");
const statusText = document.querySelector("#status");
const controls = document.querySelector("#controls");
const areaSelect = document.querySelector("#area-select");
const countSelect = document.querySelector("#count-select");

// Load data when the page opens, and again whenever the form is submitted
loadCrimes();

controls.addEventListener("submit", function (event) {
  event.preventDefault(); // stop the page from reloading
  loadCrimes();
});

// Fetch data from the API
function loadCrimes() {
  const area = areaSelect.value;
  const count = countSelect.value;

  // Build the request: newest first, limited to the chosen number of records
  let url = `${API_URL}?$order=date_occ DESC&$limit=${count}`;
  if (area) {
    url += `&area_name=${encodeURIComponent(area)}`;
  }

  statusText.textContent = "Loading crime data...";
  crimeList.innerHTML = "";

  fetch(url)
    .then(function (response) {
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      return response.json();
    })
    .then(function (crimes) {
      if (crimes.length === 0) {
        statusText.textContent = "No records found.";
        return;
      }
      statusText.textContent = `Showing ${crimes.length} most recent reports${area ? " in " + area : ""}. Click a card to bounce it.`;
      showCrimes(crimes);
    })
    .catch(function (error) {
      statusText.textContent = `Could not load data: ${error.message}`;
    });
}

// Build one card per crime record 
function showCrimes(crimes) {
  crimes.forEach(function (crime, index) {
    const card = document.createElement("article");
    card.className = `crime-card ${getCategory(crime.crm_cd_desc)}`;

    card.innerHTML = `
      <span class="tag">${crime.area_name || "Unknown area"}</span>
      <h2>${toTitleCase(crime.crm_cd_desc || "Unknown crime")}</h2>
      <dl class="details">
        <dt>Date</dt>
        <dd>${formatDate(crime.date_occ)} ${formatTime(crime.time_occ)}</dd>
        <dt>Place</dt>
        <dd>${toTitleCase(crime.premis_desc || "Not listed")}</dd>
        <dt>Status</dt>
        <dd>${crime.status_desc || "Not listed"}</dd>
      </dl>
    `;

    crimeList.appendChild(card);

    
    animateIn(card, index);

    
    card.addEventListener("click", function () {
      bounce(card);
    });
  });
}

// Popmotion spring animation

// Card rises up and grows into place with a overshoot
function animateIn(card, index) {
  const cardStyler = styler(card);
  cardStyler.set({ y: 120, scale: 0.6, opacity: 0 });

  setTimeout(function () {
    spring({
      from: { y: 120, scale: 0.6, opacity: 0 },
      to: { y: 0, scale: 1, opacity: 1 },
      stiffness: 180,
      damping: 12
    }).start(cardStyler.set);
  }, index * 80);
}

// Card squashes and springs back when clicked
function bounce(card) {
  const cardStyler = styler(card);

  spring({
    from: 0.85,
    to: 1,
    velocity: 4,
    stiffness: 300,
    damping: 8
  }).start(function (value) {
    cardStyler.set("scale", value);
  });
}




function getCategory(description) {
  const text = (description || "").toUpperCase();
  if (text.includes("ASSAULT") || text.includes("ROBBERY") || text.includes("BATTERY") || text.includes("HOMICIDE")) {
    return "category-violent";
  }
  if (text.includes("VEHICLE")) {
    return "category-vehicle";
  }
  if (text.includes("THEFT") || text.includes("BURGLARY") || text.includes("SHOPLIFTING")) {
    return "category-theft";
  }
  if (text.includes("VANDALISM")) {
    return "category-vandalism";
  }
  return "category-other";
}

// "2024-01-05T00:00:00.000" -> "Jan 5, 2024"
function formatDate(dateString) {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// "2130" -> "9:30 PM"
function formatTime(timeString) {
  if (!timeString) return "";
  const padded = timeString.padStart(4, "0");
  let hours = Number(padded.slice(0, 2));
  const minutes = padded.slice(2);
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `at ${hours}:${minutes} ${period}`;
}

// "VEHICLE - STOLEN" -> "Vehicle - Stolen" Just to help readablity
function toTitleCase(text) {
  return text.toLowerCase().replace(/\b\w/g, function (letter) {
    return letter.toUpperCase();
  });
}
