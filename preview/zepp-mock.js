/**
 * Zepp OS API Mock Layer
 * Simulates hmUI, hmSensor, hmApp, and hmFS for browser-based preview.
 * Renders to a <canvas> element sized 454x454 with a round clip mask.
 */

(function (global) {
  'use strict';

  const RESOLUTION = 454;
  const DESIGN_WIDTH = 480;
  const SCALE = RESOLUTION / DESIGN_WIDTH;

  // --- Utility ---
  function px(v) {
    return Math.round(v * SCALE);
  }

  function hexColor(n) {
    if (typeof n === 'string') return n;
    const hex = (n >>> 0).toString(16).padStart(6, '0');
    return '#' + hex.slice(-6);
  }

  // --- Mock Sensor Data ---
  const sensorData = {
    time: {
      year: 2026, month: 3, day: 15, week: 7,
      hour: 10, minute: 30, second: 45,
      utc: Date.now(),
      lunar_year: 2026, lunar_month: 2, lunar_day: 5,
      lunar_festival: '', lunar_solar_term: '', solar_festival: '',
    },
    heart: { current: 72, last: 68, today: [] },
    battery: { current: 85 },
    step: { current: 6420, target: 10000 },
    calorie: { current: 312 },
    distance: { current: 4.2 },
    weather: {
      cityName: 'San Francisco',
      forecastData: [
        { high: 18, low: 11, index: 1 },
        { high: 20, low: 12, index: 0 },
        { high: 17, low: 10, index: 2 },
      ],
      tideData: [
        { sunrise: { hour: 6, minute: 45 }, sunset: { hour: 18, minute: 30 } },
      ],
    },
    spo2: { current: 97 },
    stress: { current: 42 },
    pai: { dailypai: 35, totalpai: 82 },
    sleep: { current: 7.5 },
    stand: { current: 8, target: 12 },
  };

  // Update time every second
  function tickTime() {
    const now = new Date();
    sensorData.time.year = now.getFullYear();
    sensorData.time.month = now.getMonth() + 1;
    sensorData.time.day = now.getDate();
    sensorData.time.week = now.getDay() || 7;
    sensorData.time.hour = now.getHours();
    sensorData.time.minute = now.getMinutes();
    sensorData.time.second = now.getSeconds();
    sensorData.time.utc = now.getTime();
  }

  // --- Sensor API ---
  const sensorListeners = {};

  function createSensor(sensorId) {
    const name = Object.entries(hmSensor.id).find(([, v]) => v === sensorId)?.[0]?.toLowerCase();
    if (!name || !sensorData[name]) {
      console.warn(`[mock] Unknown sensor: ${sensorId}`);
      return {};
    }

    const data = sensorData[name];
    const sensor = { ...data, event: {} };

    // Weather has a special method
    if (name === 'weather') {
      sensor.getForecastWeather = () => ({
        cityName: data.cityName,
        forecastData: { data: data.forecastData },
        tideData: { data: data.tideData },
      });
    }

    // Event support
    if (name === 'time') {
      sensor.event.MINUTEEND = 'MINUTEEND';
      sensor.event.DAYCHANGE = 'DAYCHANGE';
    } else {
      sensor.event.CHANGE = 'CHANGE';
      sensor.event.CURRENT = 'CURRENT';
      sensor.event.LAST = 'LAST';
    }

    sensor.addEventListener = (event, cb) => {
      const key = `${name}_${event}`;
      if (!sensorListeners[key]) sensorListeners[key] = [];
      sensorListeners[key].push(cb);
    };

    sensor.removeEventListener = (event, cb) => {
      const key = `${name}_${event}`;
      if (sensorListeners[key]) {
        sensorListeners[key] = sensorListeners[key].filter(f => f !== cb);
      }
    };

    // Live-update proxy: reads always get fresh data
    return new Proxy(sensor, {
      get(target, prop) {
        if (prop in sensorData[name]) return sensorData[name][prop];
        return target[prop];
      },
    });
  }

  function fireSensorEvent(name, event) {
    const key = `${name}_${event}`;
    if (sensorListeners[key]) {
      sensorListeners[key].forEach(cb => {
        try { cb(); } catch (e) { console.error(`[mock] sensor event error:`, e); }
      });
    }
  }

  const hmSensor = {
    id: {
      TIME: 1, HEART: 2, BATTERY: 3, STEP: 4, CALORIE: 5,
      DISTANCE: 6, WEATHER: 7, SPO2: 8, STRESS: 9, PAI: 10,
      SLEEP: 11, STAND: 12, FAT_BURRING: 13, BODY_TEMP: 14, MUSIC: 15,
    },
    event: {
      CHANGE: 'CHANGE',
      CURRENT: 'CURRENT',
      LAST: 'LAST',
      MINUTEEND: 'MINUTEEND',
      DAYCHANGE: 'DAYCHANGE',
    },
    createSensor,
  };

  // --- Widget System ---
  let canvas, ctx;
  const widgets = [];
  let nextWidgetId = 1;

  const WIDGET_TYPES = {
    IMG: 1, TEXT: 2, ARC: 3, FILL_RECT: 4, STROKE_RECT: 5,
    TEXT_IMG: 6, ARC_PROGRESS: 7, LINE_PROGRESS: 8,
    IMG_PROGRESS: 9, IMG_LEVEL: 10, IMG_POINTER: 11,
    IMG_TIME: 12, IMG_DATE: 13, IMG_WEEK: 14, IMG_ANIM: 15,
    IMG_STATUS: 16, IMG_CLICK: 17, TEXT_TIME: 18, TIME_NUM: 19,
    CIRCLE: 21, FILL_RECT: 4, STROKE_RECT: 5,
    TIME_POINTER: 28, WIDGET_DELEGATE: 35,
    GRADKIENT_POLYLINE: 36, ARC_PROGRESS_FILL: 37,
    GROUP: 65536,
  };

  // data_type constants
  const DATA_TYPES = {
    BATTERY: 0, STEP: 1, STEP_TARGET: 2, CAL: 3, CAL_TARGET: 4,
    HEART: 5, PAI_DAILY: 6, PAI_WEEKLY: 7, DISTANCE: 8,
    STAND: 9, STAND_TARGET: 10, WEATHER_CURRENT: 11,
    WEATHER_LOW: 12, WEATHER_HIGH: 13, UVI: 14, AQI: 15,
    HUMIDITY: 16, ACTIVITY: 17, ACTIVITY_TARGET: 18,
    FAT_BURNING: 19, FAT_BURNING_TARGET: 20,
    SUN_CURRENT: 21, SUN_RISE: 22, SUN_SET: 23,
    WIND: 24, STRESS: 25, SPO2: 26, ALTIMETER: 27,
    MOON: 28, FLOOR: 29, ALARM_CLOCK: 30, COUNT_DOWN: 31,
    STOP_WATCH: 32, SLEEP: 33,
  };

  function resolveDataType(type) {
    switch (type) {
      case DATA_TYPES.BATTERY: return sensorData.battery.current;
      case DATA_TYPES.STEP: return sensorData.step.current;
      case DATA_TYPES.STEP_TARGET: return sensorData.step.target;
      case DATA_TYPES.CAL: return sensorData.calorie.current;
      case DATA_TYPES.HEART: return sensorData.heart.current;
      case DATA_TYPES.WEATHER_CURRENT: return sensorData.weather.forecastData[0]?.high || 0;
      case DATA_TYPES.WEATHER_LOW: return sensorData.weather.forecastData[0]?.low || 0;
      case DATA_TYPES.WEATHER_HIGH: return sensorData.weather.forecastData[0]?.high || 0;
      case DATA_TYPES.SPO2: return sensorData.spo2.current;
      case DATA_TYPES.STRESS: return sensorData.stress.current;
      case DATA_TYPES.DISTANCE: return sensorData.distance.current;
      case DATA_TYPES.STAND: return sensorData.stand.current;
      case DATA_TYPES.STAND_TARGET: return sensorData.stand.target;
      case DATA_TYPES.PAI_DAILY: return sensorData.pai.dailypai;
      case DATA_TYPES.PAI_WEEKLY: return sensorData.pai.totalpai;
      case DATA_TYPES.SLEEP: return sensorData.sleep.current;
      default: return 0;
    }
  }

  function createWidget(type, params) {
    const w = {
      _id: nextWidgetId++,
      _type: type,
      _props: { ...params },
      _visible: true,
      setProperty(prop, value) {
        if (typeof prop === 'object') {
          Object.assign(this._props, prop);
        } else if (prop === hmUI.prop.VISIBLE) {
          this._visible = value;
        } else if (prop === hmUI.prop.MORE) {
          Object.assign(this._props, value);
        } else {
          this._props[prop] = value;
        }
        scheduleRender();
      },
      getProperty(prop) {
        return this._props[prop];
      },
    };
    widgets.push(w);
    scheduleRender();
    return w;
  }

  // --- Render Engine ---
  let renderScheduled = false;

  function scheduleRender() {
    if (renderScheduled) return;
    renderScheduled = true;
    requestAnimationFrame(render);
  }

  function render() {
    renderScheduled = false;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, RESOLUTION, RESOLUTION);

    // Round clip mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(RESOLUTION / 2, RESOLUTION / 2, RESOLUTION / 2, 0, Math.PI * 2);
    ctx.clip();

    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, RESOLUTION, RESOLUTION);

    // Render each widget
    for (const w of widgets) {
      if (!w._visible) continue;
      try {
        renderWidget(w);
      } catch (e) {
        console.error(`[render] Widget ${w._id} error:`, e);
      }
    }

    ctx.restore();
  }

  function renderWidget(w) {
    const p = w._props;

    switch (w._type) {
      case WIDGET_TYPES.FILL_RECT:
        ctx.fillStyle = hexColor(p.color || 0x000000);
        if (p.radius) {
          roundRect(ctx, p.x || 0, p.y || 0, p.w || 0, p.h || 0, p.radius);
          ctx.fill();
        } else {
          ctx.fillRect(p.x || 0, p.y || 0, p.w || 0, p.h || 0);
        }
        break;

      case WIDGET_TYPES.STROKE_RECT:
        ctx.strokeStyle = hexColor(p.color || 0xffffff);
        ctx.lineWidth = p.line_width || 1;
        ctx.strokeRect(p.x || 0, p.y || 0, p.w || 0, p.h || 0);
        break;

      case WIDGET_TYPES.CIRCLE:
        ctx.beginPath();
        ctx.arc(p.center_x || 0, p.center_y || 0, p.radius || 0, 0, Math.PI * 2);
        if (p.color !== undefined) {
          ctx.fillStyle = hexColor(p.color);
          ctx.fill();
        }
        if (p.line_width) {
          ctx.strokeStyle = hexColor(p.stroke_color || p.color || 0xffffff);
          ctx.lineWidth = p.line_width;
          ctx.stroke();
        }
        break;

      case WIDGET_TYPES.TEXT:
        renderText(p);
        break;

      case WIDGET_TYPES.TEXT_IMG:
        renderTextImg(p);
        break;

      case WIDGET_TYPES.ARC_PROGRESS:
        renderArcProgress(p);
        break;

      case WIDGET_TYPES.LINE_PROGRESS:
        renderLineProgress(p);
        break;

      case WIDGET_TYPES.TIME_POINTER:
        renderTimePointer(p);
        break;

      case WIDGET_TYPES.TEXT_TIME:
        renderTextTime(p);
        break;

      case WIDGET_TYPES.IMG:
        renderImg(p);
        break;

      case WIDGET_TYPES.ARC:
        renderArc(p);
        break;

      case WIDGET_TYPES.WIDGET_DELEGATE:
        // Store resume callback
        if (p.resume_call) {
          w._resumeCall = p.resume_call;
        }
        break;

      case WIDGET_TYPES.GRADKIENT_POLYLINE:
        renderPolyline(p);
        break;

      default:
        // Unsupported widget — draw placeholder
        if (p.x !== undefined && p.y !== undefined) {
          ctx.strokeStyle = '#ff00ff44';
          ctx.strokeRect(p.x || 0, p.y || 0, p.w || 50, p.h || 20);
          ctx.fillStyle = '#ff00ff88';
          ctx.font = '10px monospace';
          ctx.fillText(`W:${w._type}`, (p.x || 0) + 2, (p.y || 0) + 12);
        }
        break;
    }
  }

  function renderText(p) {
    const size = p.text_size || 18;
    ctx.font = `${size}px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = hexColor(p.color || 0xffffff);

    const text = p.text || '';
    const x = p.x || 0;
    const y = p.y || 0;
    const w = p.w || RESOLUTION;
    const h = p.h || size + 4;

    // Horizontal alignment
    if (p.align_h === 'center_h' || p.align_h === 1) {
      ctx.textAlign = 'center';
      ctx.fillText(text, x + w / 2, y + h / 2 + size / 3, w);
    } else if (p.align_h === 'right' || p.align_h === 2) {
      ctx.textAlign = 'right';
      ctx.fillText(text, x + w, y + h / 2 + size / 3, w);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(text, x, y + h / 2 + size / 3, w);
    }
    ctx.textAlign = 'left';
  }

  function renderTextImg(p) {
    // Renders a data_type value as text (simulating image-font rendering)
    let value = '';
    if (p.type !== undefined) {
      value = String(resolveDataType(p.type));
    } else if (p.text !== undefined) {
      value = String(p.text);
    }

    const size = p.text_size || p.font_size || 36;
    ctx.font = `bold ${size}px "Segoe UI", monospace`;
    ctx.fillStyle = hexColor(p.color || 0xffffff);

    const x = p.x || 0;
    const y = p.y || 0;
    const w = p.w || 200;
    const h = p.h || size + 8;

    if (p.align_h === 'center_h' || p.align_h === 1) {
      ctx.textAlign = 'center';
      ctx.fillText(value, x + w / 2, y + h / 2 + size / 3, w);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(value, x, y + h / 2 + size / 3, w);
    }
    ctx.textAlign = 'left';
  }

  function renderTextTime(p) {
    const t = sensorData.time;
    const hour = String(t.hour).padStart(2, '0');
    const min = String(t.minute).padStart(2, '0');
    const sec = String(t.second).padStart(2, '0');

    let text = `${hour}:${min}`;
    if (p.show_second) text += `:${sec}`;

    const size = p.text_size || 60;
    ctx.font = `bold ${size}px "Segoe UI", monospace`;
    ctx.fillStyle = hexColor(p.color || 0xffffff);

    const x = p.x || 0;
    const y = p.y || 0;
    const w = p.w || RESOLUTION;
    const h = p.h || size + 8;

    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y + h / 2 + size / 3, w);
    ctx.textAlign = 'left';
  }

  function renderArcProgress(p) {
    const cx = p.center_x || RESOLUTION / 2;
    const cy = p.center_y || RESOLUTION / 2;
    const r = p.radius || 100;
    const startAngle = ((p.start_angle || 0) - 90) * Math.PI / 180;
    const endAngle = ((p.end_angle || 360) - 90) * Math.PI / 180;
    const level = p.level !== undefined ? p.level : 50;
    const lineWidth = p.line_width || 8;

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = hexColor(p.bg_color || 0x333333);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Progress arc
    const progressAngle = startAngle + (endAngle - startAngle) * (level / 100);
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, progressAngle);
    ctx.strokeStyle = hexColor(p.color || 0x00ff00);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function renderLineProgress(p) {
    const x = p.x || 0;
    const y = p.y || 0;
    const w = p.w || 200;
    const h = p.h || 8;
    const level = p.level !== undefined ? p.level : 50;

    // Background
    ctx.fillStyle = hexColor(p.bg_color || 0x333333);
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fill();

    // Progress
    const pw = w * (level / 100);
    if (pw > 0) {
      ctx.fillStyle = hexColor(p.color || 0x00ff00);
      roundRect(ctx, x, y, pw, h, h / 2);
      ctx.fill();
    }
  }

  function renderTimePointer(p) {
    const t = sensorData.time;
    const cx = RESOLUTION / 2;
    const cy = RESOLUTION / 2;

    // Hour hand
    if (p.hour_centerX !== undefined) {
      const hourAngle = ((t.hour % 12) + t.minute / 60) * 30 - 90;
      drawHand(cx, cy, hourAngle, p.hour_length || 80, p.hour_width || 6, hexColor(p.hour_color || 0xffffff));
    }

    // Minute hand
    if (p.minute_centerX !== undefined) {
      const minAngle = t.minute * 6 + t.second / 10 - 90;
      drawHand(cx, cy, minAngle, p.minute_length || 120, p.minute_width || 4, hexColor(p.minute_color || 0xffffff));
    }

    // Second hand
    if (p.second_centerX !== undefined) {
      const secAngle = t.second * 6 - 90;
      drawHand(cx, cy, secAngle, p.second_length || 140, p.second_width || 2, hexColor(p.second_color || 0xff3333));
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  function drawHand(cx, cy, angleDeg, length, width, color) {
    const angle = angleDeg * Math.PI / 180;
    const ex = cx + Math.cos(angle) * length;
    const ey = cy + Math.sin(angle) * length;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function renderImg(p) {
    // In mock mode, draw a placeholder rectangle for images
    const x = p.x || 0;
    const y = p.y || 0;
    const w = p.w || 50;
    const h = p.h || 50;

    if (p._loaded) {
      ctx.drawImage(p._loaded, x, y, w, h);
    } else {
      ctx.fillStyle = '#222233';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#444466';
      ctx.strokeRect(x, y, w, h);
      if (p.src) {
        ctx.fillStyle = '#666688';
        ctx.font = '9px monospace';
        ctx.fillText(p.src.split('/').pop() || 'img', x + 2, y + h / 2 + 3, w - 4);
      }
    }
  }

  function renderArc(p) {
    const cx = p.center_x || RESOLUTION / 2;
    const cy = p.center_y || RESOLUTION / 2;
    const r = p.radius || 100;
    const startAngle = ((p.start_angle || 0) - 90) * Math.PI / 180;
    const endAngle = ((p.end_angle || 360) - 90) * Math.PI / 180;

    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = hexColor(p.color || 0xffffff);
    ctx.lineWidth = p.line_width || 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function renderPolyline(p) {
    if (!p.data || p.data.length < 2) return;
    const x = p.x || 0;
    const y = p.y || 0;
    const w = p.w || 200;
    const h = p.h || 100;

    ctx.beginPath();
    const step = w / (p.data.length - 1);
    const max = Math.max(...p.data);
    const min = Math.min(...p.data);
    const range = max - min || 1;

    for (let i = 0; i < p.data.length; i++) {
      const px = x + i * step;
      const py = y + h - ((p.data[i] - min) / range) * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = hexColor(p.color || 0x00ff00);
    ctx.lineWidth = p.line_width || 2;
    ctx.stroke();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // --- hmUI API ---
  const hmUI = {
    widget: WIDGET_TYPES,
    data_type: DATA_TYPES,
    prop: {
      MORE: 'MORE',
      VISIBLE: 'VISIBLE',
      SRC: 'src',
      TEXT: 'text',
      X: 'x', Y: 'y', W: 'w', H: 'h',
      COLOR: 'color',
      ANGLE: 'angle',
      LEVEL: 'level',
    },
    show_level: {
      ONLY_NORMAL: 1,
      ONAL_AOD: 2,
      ONLY_EDIT: 4,
    },
    align: {
      LEFT: 0, CENTER_H: 1, RIGHT: 2,
      TOP: 0, CENTER_V: 1, BOTTOM: 2,
    },
    text_style: {
      NONE: 0, WRAP: 1, CHAR_WRAP: 2, ELLIPSIS: 3,
    },
    createWidget,
    deleteWidget(widget) {
      const idx = widgets.findIndex(w => w._id === widget._id);
      if (idx !== -1) widgets.splice(idx, 1);
      scheduleRender();
    },
    setStatusBarVisible(visible) {},
    updateStatusBarTitle(title) {},
    setLayerScrolling(scroll) {},
    getRtlLayout() { return false; },
    getTextLayout(text, options) {
      const size = options?.text_size || 18;
      return { width: text.length * size * 0.6, height: size + 4 };
    },
  };

  // --- hmApp API ---
  const hmApp = {
    startApp(params) { console.log('[mock] startApp:', params); },
    gotoPage(params) { console.log('[mock] gotoPage:', params); },
    reloadPage(params) { console.log('[mock] reloadPage:', params); },
    setScreenKeep(keep) {},
    packageInfo() { return { version: '1.0.0' }; },
    getScene() { return 1; },
  };

  // --- hmFS API ---
  const hmFS = {
    stat(path) { return { size: 0 }; },
    open(path, flags) { return 0; },
    read(fd, buf, off, len) { return 0; },
    close(fd) {},
    SysProGetBool(key) { return false; },
    SysProGetChars(key) { return ''; },
    SysProGetInt(key) { return 0; },
    SysProGetInt64(key) { return 0; },
  };

  // --- WatchFace registration ---
  let watchfaceInstance = null;

  function WatchFace(config) {
    watchfaceInstance = config;
    // Auto-run lifecycle
    if (config.onInit) config.onInit.call(config);
    if (config.build) config.build.call(config);
  }

  function App(config) {
    if (config.onCreate) config.onCreate.call(config);
  }

  // --- Timer mocking ---
  const timerMap = new Map();
  let nextTimerId = 1;

  const timer = {
    createTimer(delay, repeat, callback) {
      const id = nextTimerId++;
      if (repeat > 0) {
        timerMap.set(id, setInterval(callback, repeat));
      } else {
        timerMap.set(id, setTimeout(callback, delay));
      }
      return id;
    },
    stopTimer(id) {
      const handle = timerMap.get(id);
      if (handle !== undefined) {
        clearInterval(handle);
        clearTimeout(handle);
        timerMap.delete(id);
      }
    },
  };

  // --- px function ---
  global.px = px;

  // --- Initialization ---
  function initPreview(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    canvas.width = RESOLUTION;
    canvas.height = RESOLUTION;

    // Tick time and re-render every second
    setInterval(() => {
      tickTime();
      fireSensorEvent('time', 'MINUTEEND');
      scheduleRender();
    }, 1000);

    // Simulate heart rate fluctuation
    setInterval(() => {
      sensorData.heart.current = 60 + Math.floor(Math.random() * 30);
      fireSensorEvent('heart', 'CHANGE');
      fireSensorEvent('heart', 'CURRENT');
    }, 3000);
  }

  function resetWidgets() {
    widgets.length = 0;
    watchfaceInstance = null;
    Object.keys(sensorListeners).forEach(k => delete sensorListeners[k]);
    nextWidgetId = 1;
  }

  function updateSensorData(name, data) {
    if (sensorData[name]) {
      Object.assign(sensorData[name], data);
      fireSensorEvent(name, 'CHANGE');
      scheduleRender();
    }
  }

  function getSensorData() {
    return JSON.parse(JSON.stringify(sensorData));
  }

  // --- Exports ---
  global.hmUI = hmUI;
  global.hmSensor = hmSensor;
  global.hmApp = hmApp;
  global.hmFS = hmFS;
  global.WatchFace = WatchFace;
  global.App = App;
  global.timer = timer;

  global.__preview = {
    initPreview,
    resetWidgets,
    render: scheduleRender,
    updateSensorData,
    getSensorData,
    sensorData,
    RESOLUTION,
    widgets,
  };

})(typeof window !== 'undefined' ? window : globalThis);
