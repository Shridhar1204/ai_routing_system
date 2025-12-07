require("dotenv").config();
const fetch = global.fetch;

async function weatherTool({ city, units = "metric" }) {
  const API_KEY = process.env.WEATHER_API_KEY;

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&units=${units}&appid=${API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather API error");
    const data = await res.json();

    return {
      city,
      temperature: data.main.temp,
      condition: data.weather[0].description,
      units,
    };
  } catch (err) {
    return {
      city,
      temperature: 18,
      condition: "unavailable, using fallback",
      units,
    };
  }
}

module.exports = weatherTool;
