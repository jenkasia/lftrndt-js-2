const BASE_URL = "https://api.open-meteo.com/v1/forecast";
const LATITUDE = 40.71;
const LONGITUDE = -74.01;
const TIMEZONE = "America/New_York";
const DAILY = "temperature_2m_max,temperature_2m_min";

async function getWeatherData(startDate, endDate) {
  const params = new URLSearchParams({
    latitude: LATITUDE,
    longitude: LONGITUDE,
    timezone: TIMEZONE,
    daily: DAILY,
    start_date: startDate,
    end_date: endDate,
  });

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`);

    const data = await response.json();

    if (data.daily.time.length > 0) {
      createXMLButton(data);
      const table = generateTable(data.daily);
      document.getElementById("table-container").innerHTML = table;
    } else {
      document.getElementById("table-container").innerHTML =
        "No data available for the selected week.";
    }
  } catch (error) {
    document.getElementById(
      "table-container"
    ).innerHTML = `<div class='error'><p>An error occurred.</p></div>`;

    console.error(error);
  }
}

function generateTable(data) {
  let table =
    "<table>\n<thead>\n<tr>\n<th>Day</th>\n<th>Date</th>\n<th>Min Temperature</th>\n<th>Max Temperature</th>\n</tr>\n</thead>\n<tbody>\n";
  const { time, temperature_2m_min, temperature_2m_max } = data;

  time.forEach((date, index) => {
    const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    });
    const formattedDate = new Date(date).toLocaleDateString("en-US");
    const minTemp = temperature_2m_min[index];
    const maxTemp = temperature_2m_max[index];
    table += `<tr>\n<td>${dayOfWeek}</td>\n<td>${formattedDate}</td>\n<td>${minTemp} &deg;C</td>\n<td>${maxTemp} &deg;C</td>\n</tr>\n`;
  });

  table += "</tbody>\n</table>";
  return table;
}

function getStartDateOfWeek(week) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysSinceMonday = (7 + firstDayOfMonth.getDay() - 1) % 7;

  const startDate = new Date(
    currentYear,
    currentMonth,
    1 + (week - 1) * 7 - daysSinceMonday
  );
  return formatDate(startDate);
}

function getEndDateOfWeek(week) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysOffset =
    firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;
  const endDate = new Date(currentYear, currentMonth, week * 7 - daysOffset);
  return endDate.toISOString().slice(0, 10);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateXML(data) {
  const { time, temperature_2m_min, temperature_2m_max } = data;
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<temperatures>\n';
  time.forEach((date, index) => {
    const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    });
    const formattedDate = new Date(date).toLocaleDateString("en-US");
    const minTemp = temperature_2m_min[index];
    const maxTemp = temperature_2m_max[index];
    xml += `\t<temperature>\n\t\t<day>${dayOfWeek}</day>\n\t\t<date>\n\t\t\t<dateValue>${formattedDate}</dateValue>\n\t\t\t<dateFormat>YYYY-MM-DD</dateFormat>\n\t\t</date>\n\t\t<min>${minTemp}</min>\n\t\t<max>${maxTemp}</max>\n\t</temperature>\n`;
  });
  xml += "</temperatures>";
  downloadXML(xml);
}

function downloadXML(xml) {
  const filename = "temperature_data.xml";
  const blob = new Blob([xml], { type: "text/xml;charset=utf-8" });
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename);
  } else {
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

function handleXMLButtonClick(data) {
  generateXML(data.daily);
}

function createXMLButton(data) {
  let xmlButton = document.getElementById("generate-xml");
  if (!xmlButton) {
    xmlButton =
      document.getElementById("generate-xml") ||
      document.createElement("button");
    xmlButton.id = "generate-xml";
    xmlButton.textContent = "Generate XML";
    document.getElementById("button-container").appendChild(xmlButton);
  } else {
    xmlButton.removeEventListener("click", handleXMLButtonClick);
  }

  xmlButton.addEventListener("click", handleXMLButtonClick.bind(null, data));
}

function main() {
  document.getElementById("start-tracking").addEventListener("click", () => {
    const week = document.getElementById("week-select").value;
    const startDate = getStartDateOfWeek(week);
    const endDate = getEndDateOfWeek(week);
    getWeatherData(startDate, endDate);
  });

  document.getElementById("week-select").addEventListener("change", (event) => {
    const xmlButton = document.getElementById("generate-xml");
    document.getElementById("table-container").innerHTML = "";
    if (xmlButton) {
      xmlButton.remove();
    }
  });
}

main();
