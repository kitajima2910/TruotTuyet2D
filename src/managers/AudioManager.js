/**
 * AudioManager.js — Quản lý tập trung BGM và SFX
 *
 * Singleton qua game.registry để mọi scene đều truy cập được.
 * Tự động tạo procedural audio (Web Audio API) nếu không có file audio.
 * Hỗ trợ mute, âm lượng riêng BGM/SFX, tránh phát trùng SFX.
 * Lưu cài đặt vào localStorage.
 *
 * Cách dùng:
 *   // Trong PlayScene.create():
 *   AudioManager.init(this);
 *   const audio = AudioManager.get(this.game.registry);
 *   audio.playBGM('bgm');
 *   audio.playSFX('sfx-coin');
 */

export class AudioManager {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this._muted = false;
    this._bgmVolume = 0.35;
    this._sfxVolume = 0.55;
    this._bgm = null;
    this._lastSfxTime = {};
    this._ready = false;

    this._loadSettings();
    this._initProceduralAudio(scene);
  }

  /**
   * Khởi tạo AudioManager singleton trong game.registry.
   * Gọi 1 lần duy nhất từ PlayScene.create().
   * @param {Phaser.Scene} scene
   * @returns {AudioManager}
   */
  static init(scene) {
    const key = 'audioManager';
    if (!scene.game.registry.get(key)) {
      scene.game.registry.set(key, new AudioManager(scene));
    }
    return scene.game.registry.get(key);
  }

  /**
   * Lấy AudioManager từ registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @returns {AudioManager|undefined}
   */
  static get(registry) {
    return registry.get('audioManager');
  }

  // ══════════════════════════════════════════════
  //  LOCALSTORAGE
  // ══════════════════════════════════════════════

  _loadSettings() {
    try {
      const raw = localStorage.getItem('truottuyet_audio');
      if (raw) {
        const d = JSON.parse(raw);
        this._muted = !!d.muted;
        this._bgmVolume = typeof d.bgmVolume === 'number'
          ? Phaser.Math.Clamp(d.bgmVolume, 0, 1) : 0.35;
        this._sfxVolume = typeof d.sfxVolume === 'number'
          ? Phaser.Math.Clamp(d.sfxVolume, 0, 1) : 0.55;
      }
    } catch (_) { /* localStorage unavailable */ }
  }

  _saveSettings() {
    try {
      localStorage.setItem('truottuyet_audio', JSON.stringify({
        muted: this._muted,
        bgmVolume: this._bgmVolume,
        sfxVolume: this._sfxVolume,
      }));
    } catch (_) { /* localStorage unavailable */ }
  }

  // ══════════════════════════════════════════════
  //  PROCEDURAL AUDIO (Web Audio API)
  // ══════════════════════════════════════════════

  /**
   * Tạo procedural audio buffers và đưa vào Phaser cache.
   * Chỉ hoạt động với WebAudioSoundManager (modern browsers).
   */
  _initProceduralAudio(scene) {
    const sm = scene.sound;
    if (!(sm instanceof Phaser.Sound.WebAudioSoundManager)) {
      // Fallback: HTML5Audio — không tạo procedural được, bỏ qua
      this._ready = true;
      return;
    }
    const ctx = sm.context;

    // Định nghĩa các âm thanh cần tạo
    const defs = {
      'bgm':         { type: 'bgm' },
      'sfx-coin':    { type: 'coin' },
      'sfx-boost':   { type: 'boost' },
      'sfx-hit':     { type: 'hit' },
      'sfx-gameover':{ type: 'gameover' },
      'sfx-click':   { type: 'click' },
    };

    for (const [key, def] of Object.entries(defs)) {
      // Chỉ tạo nếu chưa có trong cache (ưu tiên file audio thật)
      if (scene.cache.audio.exists(key)) continue;
      try {
        const buffer = this._generateBuffer(ctx, def.type);
        scene.cache.audio.add(key, buffer);
      } catch (_) { /* skip if generation fails */ }
    }

    this._ready = true;
  }

  /**
   * Tạo AudioBuffer từ kiểu âm thanh.
   * @param {AudioContext} ctx
   * @param {string} type
   * @returns {AudioBuffer}
   */
  _generateBuffer(ctx, type) {
    const sampleRate = ctx.sampleRate;

    switch (type) {
      case 'coin': return this._genCoin(ctx, sampleRate);
      case 'boost': return this._genBoost(ctx, sampleRate);
      case 'hit': return this._genHit(ctx, sampleRate);
      case 'gameover': return this._genGameOver(ctx, sampleRate);
      case 'click': return this._genClick(ctx, sampleRate);
      case 'bgm': return this._genBGM(ctx, sampleRate);
      default: return this._genSilent(ctx, sampleRate, 0.1);
    }
  }

  /** Coin: 2-tone chime (880Hz → 1320Hz) 0.25s */
  _genCoin(ctx, sr) {
    const dur = 0.25;
    const len = sr * dur;
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const freq = 880 + (1320 - 880) * Math.min(1, t / 0.08);
      const env = Math.max(0, 1 - t / dur);
      d[i] = (Math.sin(2 * Math.PI * freq * t) * 0.3 +
              Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.15) * env;
    }
    return buf;
  }

  /** Boost: rising sweep 400→1200Hz 0.35s */
  _genBoost(ctx, sr) {
    const dur = 0.35;
    const len = sr * dur;
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const freq = 400 + t / dur * 800;
      const env = Math.max(0, 1 - t / dur) * 0.4;
      d[i] = (Math.sin(2 * Math.PI * freq * t) * 0.25 +
              Math.sin(2 * Math.PI * freq * 2 * t) * 0.1) * env;
    }
    return buf;
  }

  /** Hit: low noise burst 0.2s */
  _genHit(ctx, sr) {
    const dur = 0.2;
    const len = sr * dur;
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const noise = (Math.random() * 2 - 1) * 0.5;
      const tone = Math.sin(2 * Math.PI * 120 * t) * 0.3;
      d[i] = (noise + tone) * Math.max(0, 1 - t / dur);
    }
    return buf;
  }

  /** Game Over: descending tone 400→80Hz 0.6s + noise */
  _genGameOver(ctx, sr) {
    const dur = 0.6;
    const len = sr * dur;
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const freq = 400 - t / dur * 320;
      const env = Math.max(0, 1 - t / dur);
      const noise = (Math.random() * 2 - 1) * 0.2 * env;
      d[i] = (Math.sin(2 * Math.PI * freq * t) * 0.35 + noise) * env;
    }
    return buf;
  }

  /** Click: short tick 0.05s */
  _genClick(ctx, sr) {
    const dur = 0.05;
    const len = sr * dur;
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      d[i] = Math.sin(2 * Math.PI * 600 * t) *
             Math.max(0, 1 - t / dur) * 0.4;
    }
    return buf;
  }

  /** BGM: simple melody loop 8s (C D E F G F E D) square wave */
  _genBGM(ctx, sr) {
    const dur = 8;
    const len = sr * dur;
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    const notes = [262, 294, 330, 349, 392, 349, 330, 294]; // C4 D4 E4 F4 G4 F4 E4 D4
    const noteLen = dur / notes.length;

    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const noteIdx = Math.floor(t / noteLen) % notes.length;
      const freq = notes[noteIdx];
      const localT = (t % noteLen) / noteLen;
      // Square wave + soft envelope
      const sq = (freq * t) % 1 < 0.5 ? 0.25 : -0.25;
      const attack = Math.min(1, localT * 8);
      const release = Math.max(0, 1 - localT * 0.3);
      d[i] = sq * attack * release;
    }
    return buf;
  }

  /** Silent fallback */
  _genSilent(ctx, sr, dur) {
    const len = sr * dur;
    return ctx.createBuffer(1, len, sr);
  }

  // ══════════════════════════════════════════════
  //  PUBLIC API
  // ══════════════════════════════════════════════

  /**
   * Phát BGM (loop). Tự động dừng BGM cũ trước khi phát mới.
   * Nếu key trùng với BGM đang phát → bỏ qua.
   * @param {string} key — key trong audio cache
   */
  playBGM(key) {
    if (!this._ready) return;
    if (this._bgm && this._bgm.isPlaying && this._bgm.key === key) return;
    this.stopBGM();
    try {
      this._bgm = this.scene.sound.add(key, {
        loop: true,
        volume: this._muted ? 0 : this._bgmVolume,
      });
      this._bgm.play();
    } catch (_) { /* audio unavailable */ }
  }

  /** Dừng BGM hiện tại */
  stopBGM() {
    if (this._bgm) {
      try {
        this._bgm.stop();
        this._bgm.destroy();
      } catch (_) { /* ignore */ }
      this._bgm = null;
    }
  }

  /**
   * Phát SFX một lần. Tự động tránh phát trùng trong 80ms.
   * @param {string} key — key trong audio cache
   * @param {object} [config] — tuỳ chọn Phaser sound config
   */
  playSFX(key, config = {}) {
    if (!this._ready || this._muted) return;
    const now = performance.now();
    if (this._lastSfxTime[key] && now - this._lastSfxTime[key] < 80) return;
    this._lastSfxTime[key] = now;
    try {
      this.scene.sound.play(key, {
        volume: this._sfxVolume,
        ...config,
      });
    } catch (_) { /* audio unavailable */ }
  }

  /**
   * Bật/tắt mute.
   * @returns {boolean} — trạng thái mute sau khi toggle
   */
  toggleMute() {
    this._muted = !this._muted;
    if (this._bgm && this._bgm.isPlaying) {
      this._bgm.setVolume(this._muted ? 0 : this._bgmVolume);
    }
    this._saveSettings();
    return this._muted;
  }

  /** @returns {boolean} */
  isMuted() { return this._muted; }

  /**
   * Chỉnh âm lượng BGM.
   * @param {number} v — 0..1
   */
  setBGMVolume(v) {
    this._bgmVolume = Phaser.Math.Clamp(v, 0, 1);
    if (this._bgm && this._bgm.isPlaying) {
      this._bgm.setVolume(this._muted ? 0 : this._bgmVolume);
    }
    this._saveSettings();
  }

  /**
   * Chỉnh âm lượng SFX.
   * @param {number} v — 0..1
   */
  setSFXVolume(v) {
    this._sfxVolume = Phaser.Math.Clamp(v, 0, 1);
    this._saveSettings();
  }

  /** Dọn dẹp khi game kết thúc */
  destroy() {
    this.stopBGM();
    this._lastSfxTime = {};
  }
}
