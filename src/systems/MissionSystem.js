/**
 * MissionSystem.js — Hệ thống nhiệm vụ trong game
 *
 * Quản lý Active Missions, Progress, Reward và Status.
 * Chỉ nhận 5 loại sự kiện:
 *   DISTANCE_CHANGED, COIN_COLLECTED, BOOST_USED, TIME_SURVIVED, GAME_COMPLETED
 *
 * API công khai:
 *   loadMissions()           — khởi tạo/reset missions
 *   getActiveMissions()      — lấy danh sách mission với progress + status
 *   updateProgress(event, v) — cập nhật tiến độ (PlayScene gọi)
 *   claimReward(missionId)   — nhận thưởng (MissionPanel gọi)
 *   isCompleted(missionId)   — kiểm tra hoàn thành
 *   isClaimed(missionId)     — kiểm tra đã nhận thưởng
 *
 * Phần thưởng chỉ được cộng vào PlayerProfile.coins khi gọi claimReward().
 * Lưu qua SaveManager ngay sau khi claim.
 *
 * Singleton qua game.registry.
 */

const MISSION_DEFS = Object.freeze([
  {
    id: 'dist_500',
    name: 'Đi 500m',
    desc: 'Vượt qua quãng đường 500m',
    eventType: 'DISTANCE_CHANGED',
    target: 500,
    reward: 50,
  },
  {
    id: 'dist_2000',
    name: 'Đi 2000m',
    desc: 'Vượt qua quãng đường 2000m',
    eventType: 'DISTANCE_CHANGED',
    target: 2000,
    reward: 200,
  },
  {
    id: 'coin_20',
    name: 'Thu 20 Coin',
    desc: 'Thu thập 20 xu trong một lần chơi',
    eventType: 'COIN_COLLECTED',
    target: 20,
    reward: 30,
  },
  {
    id: 'coin_100',
    name: 'Thu 100 Coin',
    desc: 'Thu thập 100 xu trong một lần chơi',
    eventType: 'COIN_COLLECTED',
    target: 100,
    reward: 150,
  },
  {
    id: 'survive_60',
    name: 'Sống 60 giây',
    desc: 'Sống sót 60 giây trong một lần chơi',
    eventType: 'TIME_SURVIVED',
    target: 60,
    reward: 100,
  },
  {
    id: 'boost_5',
    name: 'Kích hoạt Boost 5 lần',
    desc: 'Kích hoạt Boost 5 lần trong một lần chơi',
    eventType: 'BOOST_USED',
    target: 5,
    reward: 80,
  },
]);

/**
 * Các event type có giá trị tích luỹ (SET progress = value).
 * Các event còn lại là cộng dồn (ADD value vào progress).
 */
const CUMULATIVE_EVENTS = Object.freeze(['DISTANCE_CHANGED', 'TIME_SURVIVED']);

export class MissionSystem {
  constructor() {
    /** @type {Array<{id:string, name:string, desc:string, eventType:string, target:number, reward:number, progress:number}>} */
    this._missions = [];
  }

  /**
   * Đăng ký MissionSystem vào game.registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @param {MissionSystem} system
   */
  static register(registry, system) {
    registry.set('missionSystem', system);
  }

  /**
   * Lấy MissionSystem từ registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @returns {MissionSystem|undefined}
   */
  static get(registry) {
    return registry.get('missionSystem');
  }

  /** @returns {ReadonlyArray<{id:string, name:string, desc:string, eventType:string, target:number, reward:number}>} */
  static get MISSION_DEFS() { return MISSION_DEFS; }

  /**
   * Khởi tạo (hoặc reset) tất cả missions về progress = 0.
   * Gọi mỗi khi bắt đầu gameplay mới (PlayScene.create()).
   */
  loadMissions() {
    this._missions = MISSION_DEFS.map(def => ({
      ...def,
      progress: 0,
    }));
  }

  /**
   * Lấy danh sách mission đang active, kèm trạng thái completed/claimed.
   * @returns {Array<{id:string, name:string, desc:string, eventType:string, target:number, reward:number, progress:number, completed:boolean, claimed:boolean}>}
   */
  getActiveMissions() {
    const profile = this._getProfile();
    return this._missions.map(m => ({
      ...m,
      completed: m.progress >= m.target,
      claimed: profile ? profile.completedMissions.includes(m.id) : false,
    }));
  }

  /**
   * Cập nhật tiến độ khi có sự kiện gameplay.
   *
   * Với DISTANCE_CHANGED / TIME_SURVIVED: giá trị là tổng tích luỹ (SET).
   * Với các event còn lại (COIN_COLLECTED, BOOST_USED, GAME_COMPLETED): giá trị là số cần cộng dồn (ADD).
   *
   * @param {string} eventType — DISTANCE_CHANGED | COIN_COLLECTED | BOOST_USED | TIME_SURVIVED | GAME_COMPLETED
   * @param {number} value — giá trị cập nhật
   */
  updateProgress(eventType, value) {
    const isCumulative = CUMULATIVE_EVENTS.includes(eventType);

    for (const m of this._missions) {
      if (m.eventType !== eventType) continue;
      if (isCumulative) {
        // SET: progress là tổng tích luỹ
        m.progress = Math.min(value, m.target);
      } else {
        // ADD: cộng dồn
        m.progress = Math.min(m.progress + value, m.target);
      }
    }
  }

  /**
   * Nhận thưởng cho mission đã hoàn thành.
   * Chỉ claim được 1 lần — mission ID được lưu vào PlayerProfile.completedMissions.
   * @param {string} missionId
   * @returns {boolean} — true nếu claim thành công
   */
  claimReward(missionId) {
    const mission = this._missions.find(m => m.id === missionId);
    if (!mission) return false;
    if (mission.progress < mission.target) return false;

    const profile = this._getProfile();
    if (!profile) return false;
    if (profile.completedMissions.includes(missionId)) return false;

    // Cộng thưởng
    profile.completedMissions.push(missionId);
    profile.coins += mission.reward;

    // Lưu qua SaveManager
    const sm = this._getSaveManager();
    if (sm) sm.save();

    return true;
  }

  /**
   * Kiểm tra mission đã hoàn thành (đạt target) chưa.
   * @param {string} missionId
   * @returns {boolean}
   */
  isCompleted(missionId) {
    const mission = this._missions.find(m => m.id === missionId);
    return mission ? mission.progress >= mission.target : false;
  }

  /**
   * Kiểm tra mission đã được claim (nhận thưởng) chưa.
   * @param {string} missionId
   * @returns {boolean}
   */
  isClaimed(missionId) {
    const profile = this._getProfile();
    return profile ? profile.completedMissions.includes(missionId) : false;
  }

  /**
   * Gắn registry để MissionSystem có thể truy cập PlayerProfile và SaveManager.
   * @param {Phaser.Game.GameRegistry} registry
   */
  setRegistry(registry) {
    this._registry = registry;
  }

  /** @returns {import('../profile/PlayerProfile.js').PlayerProfile|null} */
  _getProfile() {
    return this._registry ? this._registry.get('playerProfile') : null;
  }

  /** @returns {import('../managers/SaveManager.js').SaveManager|null} */
  _getSaveManager() {
    return this._registry ? this._registry.get('saveManager') : null;
  }
}
