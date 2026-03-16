/**
 * Widget helper library for Amazfit GTR 3 watchfaces.
 * Provides shorthand functions for creating common widget patterns.
 *
 * Usage in a watchface:
 *   const ui = require('../../lib/widgets');
 *   ui.text({ x: 100, y: 200, text: 'Hello', size: 24, color: 0xffffff });
 */

const RESOLUTION = 454;
const CENTER = RESOLUTION / 2;

/**
 * Create a full-screen background.
 */
function background(color) {
  return hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: 0, y: 0, w: RESOLUTION, h: RESOLUTION,
    color: color || 0x000000,
  });
}

/**
 * Create a text widget with sensible defaults.
 */
function text(opts) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    x: opts.x || 0,
    y: opts.y || 0,
    w: opts.w || RESOLUTION,
    h: opts.h || (opts.size || 18) + 8,
    text: opts.text || '',
    text_size: opts.size || 18,
    color: opts.color || 0xffffff,
    align_h: opts.align || 1, // center by default
    align_v: 1,
  });
}

/**
 * Create a centered time display.
 */
function timeDisplay(opts) {
  return hmUI.createWidget(hmUI.widget.TEXT_TIME, {
    x: opts.x || 0,
    y: opts.y || 150,
    w: opts.w || RESOLUTION,
    h: opts.h || 80,
    color: opts.color || 0xffffff,
    text_size: opts.size || 72,
    show_second: opts.showSeconds || false,
  });
}

/**
 * Create an arc progress indicator.
 */
function arcProgress(opts) {
  return hmUI.createWidget(hmUI.widget.ARC_PROGRESS, {
    center_x: opts.cx || CENTER,
    center_y: opts.cy || CENTER,
    radius: opts.radius || 200,
    start_angle: opts.startAngle || -90,
    end_angle: opts.endAngle || 270,
    color: opts.color || 0x00ff00,
    bg_color: opts.bgColor || 0x1a1a2e,
    line_width: opts.width || 8,
    level: opts.level || 0,
  });
}

/**
 * Create a linear progress bar.
 */
function lineProgress(opts) {
  return hmUI.createWidget(hmUI.widget.LINE_PROGRESS, {
    x: opts.x || 100,
    y: opts.y || 300,
    w: opts.w || 254,
    h: opts.h || 8,
    color: opts.color || 0x00ff00,
    bg_color: opts.bgColor || 0x1a1a2e,
    level: opts.level || 0,
  });
}

/**
 * Create an analog clock with hour/minute/second hands.
 */
function analogClock(opts) {
  return hmUI.createWidget(hmUI.widget.TIME_POINTER, {
    hour_centerX: CENTER,
    hour_centerY: CENTER,
    hour_length: opts.hourLength || 90,
    hour_width: opts.hourWidth || 6,
    hour_color: opts.hourColor || 0xffffff,
    minute_centerX: CENTER,
    minute_centerY: CENTER,
    minute_length: opts.minuteLength || 130,
    minute_width: opts.minuteWidth || 4,
    minute_color: opts.minuteColor || 0xffffff,
    second_centerX: CENTER,
    second_centerY: CENTER,
    second_length: opts.secondLength || 150,
    second_width: opts.secondWidth || 2,
    second_color: opts.secondColor || 0xff3333,
  });
}

/**
 * Create a circle widget.
 */
function circle(opts) {
  return hmUI.createWidget(hmUI.widget.CIRCLE, {
    center_x: opts.cx || CENTER,
    center_y: opts.cy || CENTER,
    radius: opts.radius || 50,
    color: opts.color,
    stroke_color: opts.strokeColor,
    line_width: opts.lineWidth,
  });
}

/**
 * Create a filled rectangle.
 */
function rect(opts) {
  return hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: opts.x || 0,
    y: opts.y || 0,
    w: opts.w || 100,
    h: opts.h || 100,
    color: opts.color || 0x333333,
    radius: opts.radius || 0,
  });
}

/**
 * Create a data-bound text display (for steps, calories, etc).
 */
function dataText(opts) {
  return hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: opts.x || 0,
    y: opts.y || 0,
    w: opts.w || 200,
    h: opts.h || 40,
    type: opts.type, // hmUI.data_type constant
    color: opts.color || 0xffffff,
    text_size: opts.size || 28,
    align_h: opts.align || 1,
  });
}

/**
 * Create a WIDGET_DELEGATE for screen wake refresh.
 */
function onResume(callback) {
  return hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
    resume_call: callback,
  });
}

if (typeof module !== 'undefined') {
  module.exports = {
    RESOLUTION,
    CENTER,
    background,
    text,
    timeDisplay,
    arcProgress,
    lineProgress,
    analogClock,
    circle,
    rect,
    dataText,
    onResume,
  };
}
