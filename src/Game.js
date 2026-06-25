/**
 * Game.js — Cấu hình và khởi tạo Phaser.Game
 * Kích thước: 720×1280, Scale Mode: FIT
 * Nền: màu tuyết (snow blue)
 */

import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { PlayScene } from './scenes/PlayScene.js';
import { UIScene } from './scenes/UIScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;

const SNOW_BG = 0xe8f0fe; // Nền màu tuyết nhạt

/**
 * Tạo và trả về instance Phaser.Game
 * @param {string|HTMLElement} parent — selector hoặc DOM element chứa game
 * @returns {Phaser.Game}
 */
export function createGame(parent = 'game-container') {
  const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: SNOW_BG,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, MenuScene, PlayScene, UIScene, GameOverScene],
  };

  return new Phaser.Game(config);
}
