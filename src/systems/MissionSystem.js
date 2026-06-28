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
  // ── Màn 1 (dễ) ──
  {
    id: 'L1_DIST',
    name: 'Đi 200m',
    desc: 'Vượt qua quãng đường 200m',
    eventType: 'DISTANCE_CHANGED',
    target: 200,
    reward: 25,
    level: 1,
  },
  {
    id: 'L1_COIN',
    name: 'Thu 10 Coin',
    desc: 'Thu thập 10 xu trong một lần chơi',
    eventType: 'COIN_COLLECTED',
    target: 10,
    reward: 20,
    level: 1,
  },
  {
    id: 'L1_TIME',
    name: 'Sống 30 giây',
    desc: 'Sống sót 30 giây trong một lần chơi',
    eventType: 'TIME_SURVIVED',
    target: 30,
    reward: 20,
    level: 1,
  },
  {
    id: 'L1_BOOST',
    name: 'Kích hoạt Boost',
    desc: 'Kích hoạt Boost 1 lần',
    eventType: 'BOOST_USED',
    target: 1,
    reward: 15,
    level: 1,
  },

  // ── Màn 2 (trung bình) ──
  {
    id: 'L2_DIST',
    name: 'Đi 500m',
    desc: 'Vượt qua quãng đường 500m',
    eventType: 'DISTANCE_CHANGED',
    target: 500,
    reward: 45,
    level: 2,
  },
  {
    id: 'L2_COIN',
    name: 'Thu 20 Coin',
    desc: 'Thu thập 20 xu trong một lần chơi',
    eventType: 'COIN_COLLECTED',
    target: 20,
    reward: 35,
    level: 2,
  },
  {
    id: 'L2_TIME',
    name: 'Sống 50 giây',
    desc: 'Sống sót 50 giây trong một lần chơi',
    eventType: 'TIME_SURVIVED',
    target: 50,
    reward: 40,
    level: 2,
  },
  {
    id: 'L2_BOOST',
    name: 'Boost 2 lần',
    desc: 'Kích hoạt Boost 2 lần',
    eventType: 'BOOST_USED',
    target: 2,
    reward: 30,
    level: 2,
  },
  {
    id: 'L2_COMPLETE',
    name: 'Hoàn thành màn',
    desc: 'Hoàn thành 1 lần chơi màn 2',
    eventType: 'GAME_COMPLETED',
    target: 1,
    reward: 80,
    level: 2,
  },

  // ── Màn 3 (khó) ──
  {
    id: 'L3_DIST',
    name: 'Đi 800m',
    desc: 'Vượt qua quãng đường 800m',
    eventType: 'DISTANCE_CHANGED',
    target: 800,
    reward: 65,
    level: 3,
  },
  {
    id: 'L3_COIN',
    name: 'Thu 30 Coin',
    desc: 'Thu thập 30 xu trong một lần chơi',
    eventType: 'COIN_COLLECTED',
    target: 30,
    reward: 50,
    level: 3,
  },
  {
    id: 'L3_TIME',
    name: 'Sống 70 giây',
    desc: 'Sống sót 70 giây trong một lần chơi',
    eventType: 'TIME_SURVIVED',
    target: 70,
    reward: 60,
    level: 3,
  },
  {
    id: 'L3_BOOST',
    name: 'Boost 3 lần',
    desc: 'Kích hoạt Boost 3 lần',
    eventType: 'BOOST_USED',
    target: 3,
    reward: 45,
    level: 3,
  },
  {
    id: 'L3_COMPLETE',
    name: 'Hoàn thành màn',
    desc: 'Hoàn thành 1 lần chơi màn 3',
    eventType: 'GAME_COMPLETED',
    target: 1,
    reward: 120,
    level: 3,
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
   * Khởi tạo (hoặc reset) missions cho màn chơi cụ thể về progress = 0.
   * @param {number} [level=1] — màn chơi (1-3)
   */
  loadMissions(level = 1) {
    this._missions = MISSION_DEFS
      .filter(def => def.level === level)
      .map(def => ({
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
   * @returns {Array<{id:string, name:string, progress:number, target:number, justCompleted:boolean}>}
   *   Danh sách các mission có thay đổi, để gửi toast notification.
   */
  updateProgress(eventType, value) {
    const isCumulative = CUMULATIVE_EVENTS.includes(eventType);
    const changed = [];

    for (const m of this._missions) {
      if (m.eventType !== eventType) continue;

      const oldProgress = m.progress;
      if (isCumulative) {
        // SET: progress là tổng tích luỹ
        m.progress = Math.min(value, m.target);
      } else {
        // ADD: cộng dồn
        m.progress = Math.min(m.progress + value, m.target);
      }

      if (m.progress !== oldProgress) {
        const oldCompleted = oldProgress >= m.target;
        const newCompleted = m.progress >= m.target;
        changed.push({
          id: m.id,
          name: m.name,
          progress: m.progress,
          target: m.target,
          justCompleted: !oldCompleted && newCompleted,
        });
      }
    }

    return changed;
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
