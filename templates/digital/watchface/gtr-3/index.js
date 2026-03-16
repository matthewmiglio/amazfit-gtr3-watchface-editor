/**
 * Digital Watchface Template — Amazfit GTR 3
 *
 * Features:
 *   - Large digital time display
 *   - Date and day of week
 *   - Heart rate with live updates
 *   - Step count with progress arc
 *   - Battery indicator
 *   - Weather temperature
 */

WatchFace({
  onInit() {
    console.log('Digital watchface initialized');
  },

  build() {
    const RES = 454;
    const CX = RES / 2;

    // ── Background ──
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: RES, h: RES,
      color: 0x000000,
    });

    // ── Outer ring decoration ──
    hmUI.createWidget(hmUI.widget.CIRCLE, {
      center_x: CX, center_y: CX, radius: 224,
      stroke_color: 0x1a1a2e,
      line_width: 1,
    });

    // ── Time ──
    hmUI.createWidget(hmUI.widget.TEXT_TIME, {
      x: 0, y: 120, w: RES, h: 100,
      color: 0xffffff,
      text_size: 80,
    });

    // ── Date ──
    const timeSensor = hmSensor.createSensor(hmSensor.id.TIME);
    const days = ['', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dateText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: 222, w: RES, h: 30,
      text: `${days[timeSensor.week]}  ${months[timeSensor.month]} ${timeSensor.day}`,
      text_size: 18,
      color: 0x888888,
      align_h: 1,
    });

    timeSensor.addEventListener(timeSensor.event.MINUTEEND, () => {
      dateText.setProperty(hmUI.prop.MORE, {
        text: `${days[timeSensor.week]}  ${months[timeSensor.month]} ${timeSensor.day}`,
      });
    });

    // ── Heart Rate ──
    const heart = hmSensor.createSensor(hmSensor.id.HEART);

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 40, y: 290, w: 30, h: 30,
      text: '♥',
      text_size: 20,
      color: 0xff4444,
      align_h: 0,
    });

    const hrWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 70, y: 290, w: 100, h: 30,
      text: `${heart.current}`,
      text_size: 22,
      color: 0xff4444,
      align_h: 0,
    });

    heart.addEventListener(heart.event.CHANGE, () => {
      hrWidget.setProperty(hmUI.prop.MORE, {
        text: `${heart.current}`,
      });
    });

    // ── Steps ──
    const step = hmSensor.createSensor(hmSensor.id.STEP);
    const stepPercent = Math.min(100, Math.round((step.current / step.target) * 100));

    hmUI.createWidget(hmUI.widget.ARC_PROGRESS, {
      center_x: CX, center_y: CX, radius: 220,
      start_angle: -90, end_angle: 270,
      color: 0x4ade80,
      bg_color: 0x112211,
      line_width: 6,
      level: stepPercent,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 270, y: 290, w: 150, h: 24,
      text: `${step.current}`,
      text_size: 22,
      color: 0x4ade80,
      align_h: 2,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 270, y: 314, w: 150, h: 20,
      text: 'steps',
      text_size: 14,
      color: 0x336633,
      align_h: 2,
    });

    // ── Battery ──
    const battery = hmSensor.createSensor(hmSensor.id.BATTERY);

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: 370, w: RES, h: 24,
      text: `⚡ ${battery.current}%`,
      text_size: 16,
      color: battery.current > 20 ? 0x00cc66 : 0xff4444,
      align_h: 1,
    });

    // ── Weather ──
    const weather = hmSensor.createSensor(hmSensor.id.WEATHER);
    const forecast = weather.getForecastWeather();
    const todayWeather = forecast.forecastData?.data?.[0];

    if (todayWeather) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0, y: 80, w: RES, h: 24,
        text: `${todayWeather.high}° / ${todayWeather.low}°`,
        text_size: 16,
        color: 0x60a5fa,
        align_h: 1,
      });
    }

    // ── Refresh on screen wake ──
    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
      resume_call: () => {
        hrWidget.setProperty(hmUI.prop.MORE, { text: `${heart.current}` });
      },
    });
  },

  onDestroy() {
    console.log('Digital watchface destroyed');
  },
});
