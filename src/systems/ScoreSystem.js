/**
 * ScoreSystem.js — Hệ thống tính điểm
 *
 * Điểm tăng theo quãng đường: score += scrollSpeed × deltaTime.
 * Best Score được đồng bộ với PlayerProfile thay vì ghi localStorage trực tiếp.
 */

export class ScoreSystem {
  /**
   * @param {import('../profile/PlayerProfile.js').PlayerProfile} [profile]
   */
  constructor(profile) {
    this._score = 0;
    this._coinCount = 0;
    this._lastMissionDist = 0;

    // Nếu không truyền profile (PlayScene khởi tạo không tham số), lấy từ static
    this._profile = profile || ScoreSystem._profile;
    this._bestScore = this._loadBestScore();
  }

  /** @type {import('../profile/PlayerProfile.js').PlayerProfile|null} */
  static _profile = null;

  /** @type {import('./MissionSystem.js').MissionSystem|null} */
  static _missionSystem = null;

  /**
   * Gán profile toàn cục cho ScoreSystem (gọi từ Game.js).
   * Cho phép PlayScene giữ nguyên `new ScoreSystem()`.
   * @param {import('../profile/PlayerProfile.js').PlayerProfile} profile
   */
  static setProfile(profile) {
    ScoreSystem._profile = profile;
  }

  /**
   * Gán MissionSystem toàn cục cho ScoreSystem.
   * @param {import('./MissionSystem.js').MissionSystem} ms
   */
  static setMissionSystem(ms) {
    ScoreSystem._missionSystem = ms;
  }

  /**
   * Gọi mỗi frame từ PlayScene.update()
   * @param {number} scrollSpeed — vận tốc cuộn (px/s)
   * @param {number} delta — ms kể từ frame trước
   */
  update(scrollSpeed, delta) {
    const dt = delta / 1000;
    this._score += scrollSpeed * dt;

    // Mission: DISTANCE_CHANGED (cập nhật khi floor score thay đổi)
    const currentFloor = Math.floor(this._score);
    if (currentFloor !== this._lastMissionDist) {
      this._lastMissionDist = currentFloor;
      ScoreSystem._missionSystem?.updateProgress('DISTANCE_CHANGED', currentFloor);
    }
  }

  /** Lấy điểm hiện tại (làm tròn nguyên) — Distance Score */
  getScore() {
    return Math.floor(this._score);
  }

  /** Lấy best score (từ profile nếu có) */
  getBestScore() {
    return this._bestScore;
  }

  /** Cộng dồn số xu đã thu thập */
  addCoin() {
    this._coinCount++;
    // Mission: COIN_COLLECTED
    ScoreSystem._missionSystem?.updateProgress('COIN_COLLECTED', 1);
  }

  /** Lấy số xu đã thu thập */
  getCoinCount() {
    return this._coinCount;
  }

  /**
   * Lưu best score và xu vào PlayerProfile.
   * Gọi khi game over.
   */
  saveBestScore() {
    const profile = this._profile || ScoreSystem._profile;
    if (!profile) return;

    const current = this.getScore();
    if (current > profile.bestScore) {
      profile.bestScore = current;
    }
    this._bestScore = profile.bestScore;

    // Cộng dồn xu vào profile (tổng xu qua các phiên)
    if (this._coinCount > 0) {
      profile.coins += this._coinCount;
    }
  }

  /** Đọc best score từ PlayerProfile */
  _loadBestScore() {
    const profile = this._profile || ScoreSystem._profile;
    return profile ? profile.bestScore : 0;
  }
}
