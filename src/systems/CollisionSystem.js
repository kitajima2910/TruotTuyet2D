/**
 * CollisionSystem.js — Kiểm tra va chạm AABB
 *
 * So sánh bounding box của Player với tất cả vật cản đang active.
 * Không dùng Physics Engine — dùng manual AABB computation.
 * Trả về trạng thái isPlayerDead.
 *
 * NOTE: Phaser Container.getBounds() không trả đúng bounds khi chứa Graphics
 * nên phải tính manually từ container.x/y + container.width/height (đã set qua setSize).
 */

export class CollisionSystem {
  constructor() {
    // Không cần scene reference — chỉ check bounds thuần
  }

  /**
   * Kiểm tra va chạm giữa Player và danh sách vật cản active
   * @param {Player} player — instance Player (dùng getHitbox() thay vì getBounds())
   * @param {Array} activeObstacles — mảng các Tree/Rock đang active (từ SpawnSystem._active)
   * @returns {{ isPlayerDead: boolean }}
   */
  check(player, activeObstacles) {
    const pb = player.getHitbox();

    for (const obstacle of activeObstacles) {
      if (!obstacle.active) continue;

      // Container.getBounds() trả về zero với Graphics children → tính manual
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
        return { isPlayerDead: true };
      }
    }

    return { isPlayerDead: false };
  }
}
