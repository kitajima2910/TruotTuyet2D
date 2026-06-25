/**
 * ScoreSystem.js — Hệ thống tính điểm
 *
 * Điểm tăng theo quãng đường: score += scrollSpeed × deltaTime.
 * Best Score được lưu vào localStorage, không mất khi thoát game.
 */

const STORAGE_KEY = 'truot tuyet best score';

export class ScoreSystem {
  constructor() {
    this._score = 0;
    this._bestScore = this._loadBestScore();
  }

  /**
   * Gọi mỗi frame từ PlayScene.update()
   * @param {number} scrollSpeed — vận tốc cuộn (px/s)
   * @param {number} delta — ms kể từ frame trước
   */
  update(scrollSpeed, delta) {
    const dt = delta / 1000;
    this._score += scrollSpeed * dt;
  }

  /** Lấy điểm hiện tại (làm tròn nguyên) */
  getScore() {
    return Math.floor(this._score);
  }

  /** Lấy best score */
  getBestScore() {
    return this._bestScore;
  }

  /**
   * Lưu best score nếu score hiện tại cao hơn.
   * Gọi khi game over.
   */
  saveBestScore() {
    const current = this.getScore();
    if (current > this._bestScore) {
      this._bestScore = current;
      try {
        localStorage.setItem(STORAGE_KEY, String(current));
      } catch (_) {
        // localStorage full hoặc unavailable — bỏ qua
      }
    }
  }

  /** Đọc best score từ localStorage */
  _loadBestScore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw !== null ? parseInt(raw, 10) || 0 : 0;
    } catch (_) {
      return 0;
    }
  }
}
