/**
 * Analog Watchface Template — Amazfit GTR 3
 *
 * Features:
 *   - Classic analog clock hands (hour, minute, second)
 *   - Tick marks around the dial
 *   - Date window
 *   - Heart rate sub-dial
 *   - Step count arc
 *   - Battery level indicator
 */

WatchFace({
  onInit() {
    console.log('Analog watchface initialized');
  },

  build() {
    const RES = 454;
    const CX = RES / 2;
    const CY = RES / 2;

    // ── Background ──
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: RES, h: RES,
      color: 0x0a0a12,
    });

    // ── Outer bezel ring ──
    hmUI.createWidget(hmUI.widget.CIRCLE, {
      center_x: CX, center_y: CY, radius: 222,
      stroke_color: 0x2a2a3a,
      line_width: 2,
    });

    hmUI.createWidget(hmUI.widget.CIRCLE, {
      center_x: CX, center_y: CY, radius: 218,
      stroke_color: 0x1a1a2e,
      line_width: 1,
    });

    // ── Hour tick marks ──
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const isQuarter = i % 3 === 0;
      const outerR = 215;
      const innerR = isQuarter ? 195 : 203;
      const width = isQuarter ? 3 : 1;

      const x1 = CX + Math.cos(angle) * innerR;
      const y1 = CY + Math.sin(angle) * innerR;
      const x2 = CX + Math.cos(angle) * outerR;
      const y2 = CY + Math.sin(angle) * outerR;

      // Use small rectangles to simulate tick marks
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const len = outerR - innerR;

      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: Math.round(midX - width / 2),
        y: Math.round(midY - len / 2),
        w: width,
        h: len,
        color: isQuarter ? 0xffffff : 0x555555,
      });
    }

    // ── Step count arc (bottom sub-dial area) ──
    const step = hmSensor.createSensor(hmSensor.id.STEP);
    const stepPercent = Math.min(100, Math.round((step.current / step.target) * 100));

    hmUI.createWidget(hmUI.widget.ARC_PROGRESS, {
      center_x: CX, center_y: CY, radius: 185,
      start_angle: 150, end_angle: 390,
      color: 0x2563eb,
      bg_color: 0x111122,
      line_width: 4,
      level: stepPercent,
    });

    // ── Date window (3 o'clock position) ──
    const timeSensor = hmSensor.createSensor(hmSensor.id.TIME);

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 320, y: CY - 14, w: 52, h: 28,
      color: 0x111118,
      radius: 4,
    });

    hmUI.createWidget(hmUI.widget.STROKE_RECT, {
      x: 320, y: CY - 14, w: 52, h: 28,
      color: 0x333344,
      line_width: 1,
    });

    const dateWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 320, y: CY - 14, w: 52, h: 28,
      text: String(timeSensor.day).padStart(2, '0'),
      text_size: 16,
      color: 0xffffff,
      align_h: 1,
    });

    // ── Heart rate (6 o'clock sub-dial) ──
    const heart = hmSensor.createSensor(hmSensor.id.HEART);

    hmUI.createWidget(hmUI.widget.CIRCLE, {
      center_x: CX, center_y: CY + 80, radius: 35,
      stroke_color: 0x331111,
      line_width: 1,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - 40, y: CY + 48, w: 80, h: 18,
      text: '♥',
      text_size: 14,
      color: 0xff4444,
      align_h: 1,
    });

    const hrWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      x: CX - 40, y: CY + 65, w: 80, h: 28,
      text: `${heart.current}`,
      text_size: 22,
      color: 0xff6666,
      align_h: 1,
    });

    heart.addEventListener(heart.event.CHANGE, () => {
      hrWidget.setProperty(hmUI.prop.MORE, { text: `${heart.current}` });
    });

    // ── Battery (9 o'clock position) ──
    const battery = hmSensor.createSensor(hmSensor.id.BATTERY);

    hmUI.createWidget(hmUI.widget.LINE_PROGRESS, {
      x: 60, y: CY - 4, w: 60, h: 8,
      color: 0x00cc66,
      bg_color: 0x112211,
      level: battery.current,
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 50, y: CY + 10, w: 80, h: 18,
      text: `${battery.current}%`,
      text_size: 12,
      color: 0x00cc66,
      align_h: 1,
    });

    // ── Clock Hands ──
    hmUI.createWidget(hmUI.widget.TIME_POINTER, {
      hour_centerX: CX,
      hour_centerY: CY,
      hour_length: 95,
      hour_width: 7,
      hour_color: 0xdddddd,
      minute_centerX: CX,
      minute_centerY: CY,
      minute_length: 135,
      minute_width: 5,
      minute_color: 0xffffff,
      second_centerX: CX,
      second_centerY: CY,
      second_length: 155,
      second_width: 2,
      second_color: 0xff3333,
    });

    // ── Update on screen wake ──
    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
      resume_call: () => {
        dateWidget.setProperty(hmUI.prop.MORE, {
          text: String(timeSensor.day).padStart(2, '0'),
        });
        hrWidget.setProperty(hmUI.prop.MORE, { text: `${heart.current}` });
      },
    });
  },

  onDestroy() {
    console.log('Analog watchface destroyed');
  },
});
