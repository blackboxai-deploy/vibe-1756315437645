export interface Position {
  x: number;
  y: number;
}

export interface Snake {
  body: Position[];
  direction: Direction;
}

export interface Food {
  position: Position;
}

export interface GameState {
  snake: Snake;
  food: Food;
  score: number;
  highScore: number;
  gameStatus: GameStatus;
  gameSpeed: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameStatus = 'WAITING' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface GameConfig {
  gridSize: number;
  canvasWidth: number;
  canvasHeight: number;
  initialSpeed: number;
  speedIncrement: number;
  pointsPerFood: number;
}