/**
 * CollisionSystem.js — Kiểm tra va chạm AABB
 *
 * So sánh bounding box của Player với tất cả vật cản đang active.
 * Không dùng Physics Engine — dùng manual AABB computation.
 * Trả về obstacle đầu tiên bị va chạm (hoặc null).
 *
 * NOTE: Phaser Container.getBounds() không trả đúng bounds khi chứa Graphics
 * nên phải tính manually từ container.x/y + container.width/height (đã set qua setSize).
 */

export class CollisionSystem {
  constructor() {
    // Không cần scene reference — chỉ check bounds thuần
  }

  /**
   * Kiểm tra va chạm giữa Player và danh sách vật cản active.
   * Trả về obstacle đầu tiên bị trúng (Tree/Rock) hoặc null.
   * @param {Player} player — instance Player (dùng getHitbox())
   * @param {Array} activeObstacles — mảng các Tree/Rock đang active (từ SpawnSystem._active)
   * @returns {{ obstacle: object|null }}
   */
  check(player, activeObstacles) {
    const pb = player.getHitbox();

    for (const obstacle of activeObstacles) {
      if (!obstacle.active) continue;

      const c = obstacle.container;
      const hw = c.width / 2;
      const hh = c.height / 2;
      const ob = new Phaser.Geom.Rectangle(
        c.x - hw,
        c.y - hh,
        c.width,
        c.height,
      );

      if (Phaser.Geom.Intersects.RectangleToRectangle(pb, ob)) {
        return { obstacle };
      }
    }

    return { obstacle: null };
  }

  /**
   * Kiểm tra va chạm giữa Player và collectibles (Coin / Boost).
   * Dùng chung AABB, trả về coin hoặc boost đầu tiên trúng.
   * @param {Player} player
   * @param {Array} activeCoins — mảng Coin đang active
   * @param {Array} activeBoosts — mảng Boost đang active
   * @returns {{ coin: object|null, boost: object|null }}
   */
  checkCollectibles(player, activeCoins, activeBoosts) {
    const pb = player.getHitbox();

    // ── Check Coin ──
    for (const coin of activeCoins) {
      if (!coin.active) continue;

      const c = coin.container;
      const hw = c.width / 2;
      const hh = c.height / 2;
      const cb = new Phaser.Geom.Rectangle(
        c.x - hw,
        c.y - hh,
        c.width,
        c.height,
      );

      if (Phaser.Geom.Intersects.RectangleToRectangle(pb, cb)) {
        return { coin, boost: null };
      }
    }

    // ── Check Boost ──
    for (const boost of activeBoosts) {
      if (!boost.active) continue;

      const c = boost.container;
      const hw = c.width / 2;
      const hh = c.height / 2;
      const bb = new Phaser.Geom.Rectangle(
        c.x - hw,
        c.y - hh,
        c.width,
        c.height,
      );

      if (Phaser.Geom.Intersects.RectangleToRectangle(pb, bb)) {
        return { coin: null, boost };
      }
    }

    return { coin: null, boost: null };
  }
}
