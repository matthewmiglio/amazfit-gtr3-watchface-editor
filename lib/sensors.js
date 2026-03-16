/**
 * Sensor helper library for Amazfit GTR 3 watchfaces.
 * Simplifies creating sensors and binding them to widgets.
 *
 * Usage in a watchface:
 *   const { createSensors, bindToWidget } = require('../../lib/sensors');
 *
 *   const sensors = createSensors(['time', 'heart', 'battery', 'step', 'weather']);
 *   bindToWidget(sensors.heart, 'CHANGE', myWidget, (value) => ({
 *     text: '♥ ' + value.current + ' bpm',
 *   }));
 */

const SENSOR_MAP = {
  time: { id: 1, events: ['MINUTEEND', 'DAYCHANGE'] },
  heart: { id: 2, events: ['CHANGE', 'CURRENT', 'LAST'] },
  battery: { id: 3, events: ['CHANGE'] },
  step: { id: 4, events: ['CHANGE'] },
  calorie: { id: 5, events: ['CHANGE'] },
  distance: { id: 6, events: ['CHANGE'] },
  weather: { id: 7, events: [] },
  spo2: { id: 8, events: ['CHANGE'] },
  stress: { id: 9, events: ['CHANGE'] },
  pai: { id: 10, events: ['CHANGE'] },
  sleep: { id: 11, events: [] },
  stand: { id: 12, events: ['CHANGE'] },
};

/**
 * Create multiple sensors at once.
 * @param {string[]} names - Sensor names: 'time', 'heart', 'battery', etc.
 * @returns {Object} Map of sensor name to sensor instance.
 */
function createSensors(names) {
  const sensors = {};
  for (const name of names) {
    const entry = SENSOR_MAP[name];
    if (!entry) {
      console.warn(`[sensors] Unknown sensor: ${name}`);
      continue;
    }
    sensors[name] = hmSensor.createSensor(entry.id);
  }
  return sensors;
}

/**
 * Bind a sensor event to update a widget.
 * @param {Object} sensor - Sensor instance from createSensors.
 * @param {string} event - Event name ('CHANGE', 'MINUTEEND', etc.).
 * @param {Object} widget - hmUI widget to update.
 * @param {Function} mapper - Function(sensorData) => widget props object.
 */
function bindToWidget(sensor, event, widget, mapper) {
  const update = () => {
    const props = mapper(sensor);
    if (props) {
      widget.setProperty(hmUI.prop.MORE, props);
    }
  };

  sensor.addEventListener(event, update);

  // Initial update
  update();

  return { unbind: () => sensor.removeEventListener(event, update) };
}

/**
 * Format time values with zero-padding.
 */
function formatTime(h, m, s) {
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  if (s !== undefined) {
    return `${hh}:${mm}:${String(s).padStart(2, '0')}`;
  }
  return `${hh}:${mm}`;
}

/**
 * Get weather info in a friendly format.
 */
function getWeatherInfo(weatherSensor) {
  const data = weatherSensor.getForecastWeather();
  return {
    city: data.cityName,
    today: data.forecastData?.data?.[0] || null,
    forecast: data.forecastData?.data || [],
    sunrise: data.tideData?.data?.[0]?.sunrise || null,
    sunset: data.tideData?.data?.[0]?.sunset || null,
  };
}

/**
 * Calculate progress percentage for step/calorie/etc goals.
 */
function progressPercent(current, target) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

if (typeof module !== 'undefined') {
  module.exports = {
    SENSOR_MAP,
    createSensors,
    bindToWidget,
    formatTime,
    getWeatherInfo,
    progressPercent,
  };
}
