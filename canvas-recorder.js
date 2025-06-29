/**
 * Canvas Recorder v1.0.0 - Universal canvas recording library
 * Lightweight, portable, works with any canvas element
 */

class CanvasRecorder {
  static VERSION = "1.0.0";
  static _isHidden = false;

  constructor(canvasId, options = {}) {
    this.canvas =
      typeof canvasId === "string"
        ? document.getElementById(canvasId)
        : canvasId;
    if (!this.canvas?.getContext) throw new Error("Invalid canvas element");

    const presets = {
      performance: { fps: 30, bitrate: 1000000 },
      default: { fps: 60, bitrate: 2500000 },
    };
    const preset = presets[options.preset] || presets.default;

    this.options = {
      format: "webm",
      duration: 0,
      ...preset,
      ...options,
      onStart: options.onStart || (() => {}),
      onStop: options.onStop || (() => {}),
      onComplete: options.onComplete || (() => {}),
      onError: options.onError || console.error,
    };

    this.mediaRecorder = null;
    this.stream = null;
    this.chunks = [];
    this.isRecording = false;
    this.startTime = null;
    this.timer = null;

    this._checkSupport();

    // Auto-select in UI if available
    if (window.CanvasRecorderUI && !CanvasRecorder._isHidden) {
      setTimeout(
        () => window.CanvasRecorderUI._selectCanvas(this.canvas.id),
        100
      );
    }
  }

  _checkSupport() {
    if (!this.canvas.captureStream || !window.MediaRecorder) {
      throw new Error("Canvas recording not supported in this browser");
    }
    const mimeType = this._getMimeType();
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      this.options.format = "webm";
    }
  }

  _getMimeType() {
    return this.options.format === "mp4"
      ? "video/mp4;codecs=h264"
      : "video/webm;codecs=vp9";
  }

  start() {
    if (this.isRecording) throw new Error("Already recording");

    try {
      this.stream = this.canvas.captureStream(this.options.fps);
      if (!this.stream?.getVideoTracks().length) {
        throw new Error("Failed to capture canvas stream");
      }

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this._getMimeType(),
        videoBitsPerSecond: this.options.bitrate,
      });

      this.chunks = [];
      this.mediaRecorder.ondataavailable = (e) =>
        e.data.size > 0 && this.chunks.push(e.data);
      this.mediaRecorder.onstop = () => this._handleComplete();
      this.mediaRecorder.onerror = (e) => this.options.onError(e.error);

      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.startTime = Date.now();

      if (this.options.duration > 0) {
        this.timer = setTimeout(() => this.stop(), this.options.duration);
      }

      this.options.onStart();
    } catch (error) {
      this._cleanup();
      this.options.onError(error);
      throw error;
    }
  }

  stop() {
    if (!this.isRecording) return;
    try {
      this.mediaRecorder.stop();
      this.isRecording = false;
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.options.onStop();
    } catch (error) {
      this.options.onError(error);
    }
  }

  pause() {
    if (this.isRecording && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.pause();
    }
  }

  resume() {
    if (this.isRecording && this.mediaRecorder.state === "paused") {
      this.mediaRecorder.resume();
    }
  }

  _handleComplete() {
    if (!this.chunks.length) {
      this.options.onError(new Error("No data recorded"));
      return;
    }

    try {
      const blob = new Blob(this.chunks, { type: this._getMimeType() });
      const url = URL.createObjectURL(blob);
      const duration = this.startTime ? Date.now() - this.startTime : 0;
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const ext = this.options.format === "mp4" ? "mp4" : "webm";

      this._cleanup();
      this.options.onComplete({
        blob,
        url,
        duration,
        size: blob.size,
        mimeType: this._getMimeType(),
        filename: `canvas-${timestamp}.${ext}`,
      });
    } catch (error) {
      this.options.onError(error);
    }
  }

  _cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.mediaRecorder = null;
    this.isRecording = false;
    this.startTime = null;
  }

  getState() {
    return {
      isRecording: this.isRecording,
      duration: this.startTime ? Date.now() - this.startTime : 0,
      canvasSize: { width: this.canvas.width, height: this.canvas.height },
    };
  }

  static isSupported() {
    return !!(
      window.MediaRecorder &&
      HTMLCanvasElement.prototype.captureStream &&
      MediaRecorder.isTypeSupported("video/webm")
    );
  }

  static getSupportedFormats() {
    const formats = [];
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9"))
      formats.push("webm");
    if (MediaRecorder.isTypeSupported("video/mp4;codecs=h264"))
      formats.push("mp4");
    return formats;
  }

  static hide() {
    CanvasRecorder._isHidden = true;
    if (window.CanvasRecorderUI) window.CanvasRecorderUI._hide();
  }
}

// === UI COMPONENT ===
class CanvasRecorderUI {
  constructor() {
    this.recorder = null;
    this.isExpanded = false;
    this.selectedCanvas = null;

    this._createStyles();
    this._createUI();
    this._findCanvases();
    this._attachEvents();
    window.CanvasRecorderUI = this;
  }

  _createStyles() {
    this.styles = {
      container: `
        position: fixed; bottom: 20px; left: 20px; z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', roboto, sans-serif;
        font-size: 14px; background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px); border-radius: 12px; padding: 12px;
        color: white; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        user-select: none; cursor: move; transition: all 0.2s ease; min-width: 200px;
      `,
      select: `
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white; padding: 6px 8px; border-radius: 6px;
        font-size: 12px; flex: 1;
      `,
      button: `
        border: none; color: white; padding: 8px 12px; border-radius: 6px;
        cursor: pointer; font-size: 12px; font-weight: 500;
        transition: all 0.1s ease; white-space: nowrap;
      `,
      toggleBtn: `
        background: none; border: none; color: white; cursor: pointer;
        font-size: 12px; padding: 2px 6px; border-radius: 4px; 
        transition: all 0.1s ease; flex-shrink: 0;
      `,
    };
  }

  _createElement(tag, styles, content) {
    const el = document.createElement(tag);
    if (styles) el.style.cssText = styles;
    if (content) el.textContent = content;
    return el;
  }

  _createUI() {
    // Main container
    this.container = this._createElement("div", this.styles.container);

    // Compact header (always visible)
    this.header = this._createElement(
      "div",
      "display: flex; align-items: center; gap: 8px; margin-bottom: 8px;"
    );

    this.emoji = this._createElement(
      "span",
      "font-size: 16px; flex-shrink: 0;",
      "🎬"
    );
    this.canvasSelect = this._createElement("select", this.styles.select);
    this.recordBtn = this._createElement(
      "button",
      this.styles.button + "background: #ff4444; flex-shrink: 0;",
      "⏺ Record"
    );
    this.toggleBtn = this._createElement("button", this.styles.toggleBtn, "▼");

    this.header.append(
      this.emoji,
      this.canvasSelect,
      this.recordBtn,
      this.toggleBtn
    );

    // Expanded controls panel
    this.panel = this._createElement(
      "div",
      "display: none; flex-direction: column; gap: 8px;"
    );

    this.durationSelect = this._createElement("select", this.styles.select);
    this.durationSelect.innerHTML = `
      <option value="1000">1 second</option>
      <option value="2000">2 seconds</option>
      <option value="5000" selected>5 seconds</option>
      <option value="15000">15 seconds</option>
      <option value="30000">30 seconds</option>
      <option value="60000">1 minute</option>
      <option value="0">Manual stop</option>
    `;

    this.qualitySelect = this._createElement("select", this.styles.select);
    this.qualitySelect.innerHTML = `
      <option value="performance">Performance (30fps)</option>
      <option value="default" selected>Default (60fps)</option>
    `;

    this.settingsRow = this._createElement("div", "display: flex; gap: 8px;");
    this.settingsRow.append(this.durationSelect, this.qualitySelect);

    this.status = this._createElement(
      "div",
      `
      font-size: 11px; color: rgba(255, 255, 255, 0.7);
      text-align: center; padding: 4px; display: none;
    `
    );

    this.panel.append(this.settingsRow, this.status);
    this.container.append(this.header, this.panel);
    document.body.appendChild(this.container);
  }

  _findCanvases() {
    const canvases = document.querySelectorAll("canvas");
    this.canvasSelect.innerHTML = "";

    if (!canvases.length) {
      this.canvasSelect.innerHTML = "<option disabled>No canvas found</option>";
      return;
    }

    canvases.forEach((canvas, i) => {
      if (!canvas.id) canvas.id = `canvas-${i}`;
      const option = document.createElement("option");
      option.value = canvas.id;
      option.textContent = `${canvas.id} (${canvas.width}×${canvas.height})`;
      this.canvasSelect.appendChild(option);
    });

    this.selectedCanvas = canvases[0]?.id;
  }

  _selectCanvas(canvasId) {
    if (canvasId && this.canvasSelect) {
      this.canvasSelect.value = canvasId;
      this.selectedCanvas = canvasId;
    }
  }

  _hide() {
    if (this.container) this.container.style.display = "none";
  }

  _attachEvents() {
    // Toggle panel
    this.toggleBtn.onclick = () => {
      this.isExpanded = !this.isExpanded;
      this.panel.style.display = this.isExpanded ? "flex" : "none";
      this.toggleBtn.textContent = this.isExpanded ? "▲" : "▼";
    };

    // Canvas selection
    this.canvasSelect.onchange = (e) => (this.selectedCanvas = e.target.value);

    // Record/Stop button
    this.recordBtn.onclick = () => {
      if (this.recorder?.isRecording) {
        this.recorder.stop();
      } else {
        this._startRecording();
      }
    };

    // Dragging
    this._makeDraggable();

    // Hover effects
    [this.recordBtn, this.toggleBtn].forEach((btn) => {
      btn.onmouseenter = () =>
        !btn.disabled && (btn.style.transform = "scale(1.05)");
      btn.onmouseleave = () => (btn.style.transform = "scale(1)");
    });
  }

  _startRecording() {
    if (!this.selectedCanvas)
      return this._showStatus("No canvas selected", "error");

    try {
      this.recorder = new CanvasRecorder(this.selectedCanvas, {
        preset: this.qualitySelect.value,
        duration: parseInt(this.durationSelect.value),
        format: "webm",
        onStart: () => this._updateUI(true),
        onStop: () => this._showStatus("Processing...", "processing"),
        onComplete: (result) => this._onComplete(result),
        onError: (error) => this._onError(error),
      });
      this.recorder.start();
    } catch (error) {
      this._onError(error);
    }
  }

  _updateUI(recording) {
    if (recording) {
      this.recordBtn.textContent = "⏹ Stop";
      this.recordBtn.style.background = "#ff6b35";

      const duration = parseInt(this.durationSelect.value);
      const message =
        duration > 0 ? `Recording for ${duration / 1000}s...` : "Recording...";
      this._showStatus(message, "recording");
    } else {
      this.recordBtn.textContent = "⏺ Record";
      this.recordBtn.style.background = "#ff4444";
      this.recorder = null;
    }
  }

  _onComplete(result) {
    // Auto-download
    const a = document.createElement("a");
    a.href = result.url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    this._updateUI(false);
    this._showStatus(`Saved ${result.filename}`, "success");
    setTimeout(() => URL.revokeObjectURL(result.url), 5000);
  }

  _onError(error) {
    this._updateUI(false);
    this._showStatus(`Error: ${error.message}`, "error");
    console.error("Recording error:", error);
  }

  _showStatus(message, type = "info") {
    this.status.textContent = message;
    this.status.style.display = "block";

    const colors = {
      recording: "#ff6b35",
      processing: "#4dabf7",
      success: "#51cf66",
      error: "#ff6b6b",
      info: "rgba(255, 255, 255, 0.7)",
    };
    this.status.style.color = colors[type] || colors.info;

    if (type === "success" || type === "error") {
      setTimeout(() => (this.status.style.display = "none"), 3000);
    }
  }

  _makeDraggable() {
    let isDragging = false,
      startX,
      startY,
      initialX,
      initialY;

    this.header.onmousedown = (e) => {
      if (e.target === this.toggleBtn) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = this.container.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      this.container.style.transition = "none";
    };

    document.onmousemove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      this.container.style.left = `${initialX + deltaX}px`;
      this.container.style.top = `${initialY + deltaY}px`;
      this.container.style.bottom = "auto";
    };

    document.onmouseup = () => {
      if (isDragging) {
        isDragging = false;
        this.container.style.transition = "all 0.2s ease";
      }
    };
  }
}

// === INITIALIZATION ===
if (typeof window !== "undefined") {
  const initUI = () => {
    if (!CanvasRecorder._isHidden) {
      setTimeout(() => new CanvasRecorderUI(), 100);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI);
  } else {
    initUI();
  }
}

// Export
if (typeof module !== "undefined" && module.exports)
  module.exports = CanvasRecorder;
if (typeof window !== "undefined") window.CanvasRecorder = CanvasRecorder;
