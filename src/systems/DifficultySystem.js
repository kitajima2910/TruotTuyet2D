/**
 * DifficultySystem.js — Quản lý độ khó tăng dần theo quãng đường
 *
 * Ba tham số chính tăng/giảm tuyến tính dựa trên distanceScore:
 *   • scrollSpeed    — tốc độ cuộn (px/s),  tăng dần, có giới hạn max
 *   • spawnInterval  — thời gian giữa 2 lần spawn (ms), giảm dần, có giới hạn min
 *   • obstacleDensity— số lượng vật cản mỗi lần spawn, tăng dần, có giới hạn max
 *
 * Công thức:
 *   units = floor(distance / stepUnit)
 *   value = base + units × stepValue
 *   clamp(value, min, max)
 */

export class DifficultySystem {
  /**
   * @param {object}  config
   * @param {number}  config.baseScrollSpeed     — scrollSpeed ban đầu (px/s)
   * @param {number}  config.baseSpawnInterval    — spawnInterval ban đầu (ms)
   * @param {number}  config.baseObstacleDensity  — density ban đầu (mặc định 1)
 * @param {number}  config.stepUnit             — số điểm mỗi bước tăng (mặc định 400)
 * @param {number}  config.maxScrollSpeed       — scrollSpeed tối đa (mặc định 520)
 * @param {number}  config.minSpawnInterval     — spawnInterval tối thiểu (mặc định 550)
 * @param {number}  config.maxObstacleDensity   — density tối đa (mặc định 2.5)
 * @param {number}  config.scrollSpeedStep      — tăng mỗi stepUnit điểm (mặc định 6)
 * @param {number}  config.spawnIntervalStep    — giảm mỗi stepUnit điểm (mặc định 10)
 * @param {number}  config.densityStep          — tăng mỗi stepUnit điểm (mặc định 0.015)
 */
  constructor(config = {}) {
    this._baseScrollSpeed = config.baseScrollSpeed ?? 280;
    this._baseSpawnInterval = config.baseSpawnInterval ?? 1400;
    this._baseObstacleDensity = config.baseObstacleDensity ?? 1;

    this._stepUnit = config.stepUnit ?? 400;

    this._maxScrollSpeed = config.maxScrollSpeed ?? 520;
    this._minSpawnInterval = config.minSpawnInterval ?? 550;
    this._maxObstacleDensity = config.maxObstacleDensity ?? 2.5;

    this._scrollSpeedStep = config.scrollSpeedStep ?? 6;
    this._spawnIntervalStep = config.spawnIntervalStep ?? 10;
    this._densityStep = config.densityStep ?? 0.015;
  }

  /**
   * Tính toán độ khó dựa trên quãng đường đã đi.
   * Gọi mỗi frame từ PlayScene.update().
   *
   * @param {number} distanceScore — score hiện tại (quãng đường)
   * @returns {{ scrollSpeed: number, spawnInterval: number, obstacleDensity: number }}
   */
  update(distanceScore) {
    const units = Math.floor(distanceScore / this._stepUnit);

    const scrollSpeed = Math.min(
      this._baseScrollSpeed + units * this._scrollSpeedStep,
      this._maxScrollSpeed,
    );

    const spawnInterval = Math.max(
      this._baseSpawnInterval - units * this._spawnIntervalStep,
      this._minSpawnInterval,
    );

    const obstacleDensity = Math.min(
      this._baseObstacleDensity + units * this._densityStep,
      this._maxObstacleDensity,
    );

    return { scrollSpeed, spawnInterval, obstacleDensity };
  }

  /** Reset về base (dùng khi restart) */
  reset() {
    // stateless — không cần reset gì
  }
}
