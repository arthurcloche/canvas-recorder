# 🎬 Canvas Recorder

Universal canvas recording library - Lightweight, portable, works with any canvas element.

Perfect for creative coding, prototyping, and capturing canvas animations as video files.

[![jsDelivr](https://img.shields.io/badge/jsDelivr-CDN-orange)](https://cdn.jsdelivr.net/gh/arthurcloche/canvas-recorder@latest/canvas-recorder.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **One-click recording** - Auto-detecting UI appears automatically
- 📱 **Universal compatibility** - Works with any HTML5 canvas (2D, WebGL)
- 🚀 **Zero dependencies** - Pure vanilla JavaScript
- 💾 **Auto-download** - Saves video files automatically
- ⚙️ **Flexible settings** - Duration, quality, and format options
- 🔍 **Smart validation** - Detects cross-origin issues upfront
- 📦 **CDN ready** - Available on jsDelivr

## 🚀 Quick Start

### Option 1: CDN (Recommended)

```html
<script src="https://cdn.jsdelivr.net/gh/arthurcloche/canvas-recorder@latest/canvas-recorder.js"></script>
```

That's it! The recording UI will appear automatically on any page with canvas elements.

### Option 2: Manual Installation

Download `canvas-recorder.js` and include it in your HTML:

```html
<script src="canvas-recorder.js"></script>
```

### Option 3: Console Injection (Perfect for experiments!)

Paste this into any webpage's console:

```javascript
(function(){const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/arthurcloche/canvas-recorder@latest/canvas-recorder.js';s.onload=()=>console.log('🎬 Ready!');document.head.appendChild(s)})();
```

## 📖 Usage

### Automatic UI

The library automatically creates a draggable recording widget when loaded:

1. **Select canvas** from the dropdown
2. **Click ⏺ Record** to start
3. **Click ⏹ Stop** to finish (or wait for auto-stop)
4. **Video downloads** automatically!

### Programmatic API

```javascript
// Basic usage
const recorder = new CanvasRecorder('myCanvas');
recorder.start();

// With options
const recorder = new CanvasRecorder('myCanvas', {
  preset: 'performance',  // 'performance' (30fps) or 'default' (60fps)
  duration: 5000,         // Auto-stop after 5 seconds (0 = manual)
  format: 'webm',         // 'webm' or 'mp4'
  
  onStart: () => console.log('Recording started'),
  onStop: () => console.log('Recording stopped'),
  onComplete: (result) => {
    console.log('Video ready:', result.filename);
    // result contains: blob, url, duration, size, mimeType, filename
  },
  onError: (error) => console.error('Error:', error)
});

// Control recording
recorder.start();
recorder.pause();
recorder.resume();
recorder.stop();

// Get current state
const state = recorder.getState();
console.log('Recording:', state.isRecording);
```

### Static Methods

```javascript
// Check browser support
if (CanvasRecorder.isSupported()) {
  console.log('Canvas recording is supported!');
}

// Get supported formats
const formats = CanvasRecorder.getSupportedFormats();
console.log('Available formats:', formats); // ['webm', 'mp4']

// Check if specific canvas can be recorded
const canRecord = CanvasRecorder.canRecord(myCanvas);
if (!canRecord) {
  console.log('Canvas has cross-origin content');
}

// Hide automatic UI
CanvasRecorder.hide();
```

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preset` | string | `'default'` | `'performance'` (30fps, 1Mbps) or `'default'` (60fps, 2.5Mbps) |
| `duration` | number | `0` | Auto-stop duration in ms (0 = manual stop) |
| `format` | string | `'webm'` | Video format: `'webm'` or `'mp4'` |
| `fps` | number | `60` | Frame rate (overrides preset) |
| `bitrate` | number | `2500000` | Video bitrate (overrides preset) |
| `onStart` | function | `() => {}` | Called when recording starts |
| `onStop` | function | `() => {}` | Called when recording stops |
| `onComplete` | function | `() => {}` | Called with video result |
| `onError` | function | `console.error` | Called on error |

## 🚨 Limitations

- ⚠️ **Cross-origin content**: Canvas with external images/fonts cannot be recorded (browser security)
- 🌐 **Browser support**: Modern browsers only (Chrome 51+, Firefox 54+, Safari 14+)
- 📱 **Mobile**: Limited support on iOS Safari

The library automatically detects these issues and shows helpful warnings.

## 🎨 Demo

Check out the [live demo](demo.html) with animated examples!

## 📄 License

MIT License - feel free to use in any project!

## 🛠️ Development

```bash
git clone https://github.com/arthurcloche/canvas-recorder.git
cd canvas-recorder
open demo.html  # View examples
```

---

Made with ❤️ for the creative coding community
