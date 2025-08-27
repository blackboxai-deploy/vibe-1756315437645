import { Position, Snake, Food, Direction, GameConfig } from '@/types/game';

export const GAME_CONFIG: GameConfig = {
  gridSize: 20,
  canvasWidth: 400,
  canvasHeight: 400,
  initialSpeed: 150,
  speedIncrement: 10,
  pointsPerFood: 10,
};

export const getGridPosition = (x: number, y: number): Position => ({
  x: Math.floor(x / GAME_CONFIG.gridSize) * GAME_CONFIG.gridSize,
  y: Math.floor(y / GAME_CONFIG.gridSize) * GAME_CONFIG.gridSize,
});

export const generateRandomFood = (snake: Snake): Food => {
  let position: Position;
  do {
    position = {
      x: Math.floor(Math.random() * (GAME_CONFIG.canvasWidth / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize,
      y: Math.floor(Math.random() * (GAME_CONFIG.canvasHeight / GAME_CONFIG.gridSize)) * GAME_CONFIG.gridSize,
    };
  } while (isPositionOnSnake(position, snake));
  
  return { position };
};

export const isPositionOnSnake = (position: Position, snake: Snake): boolean => {
  return snake.body.some(segment => segment.x === position.x && segment.y === position.y);
};

export const getNextHeadPosition = (snake: Snake): Position => {
  const head = snake.body[0];
  const { direction } = snake;
  
  switch (direction) {
    case 'UP':
      return { x: head.x, y: head.y - GAME_CONFIG.gridSize };
    case 'DOWN':
      return { x: head.x, y: head.y + GAME_CONFIG.gridSize };
    case 'LEFT':
      return { x: head.x - GAME_CONFIG.gridSize, y: head.y };
    case 'RIGHT':
      return { x: head.x + GAME_CONFIG.gridSize, y: head.y };
    default:
      return head;
  }
};

export const isWallCollision = (position: Position): boolean => {
  return (
    position.x < 0 ||
    position.x >= GAME_CONFIG.canvasWidth ||
    position.y < 0 ||
    position.y >= GAME_CONFIG.canvasHeight
  );
};

export const isSelfCollision = (position: Position, snake: Snake): boolean => {
  return snake.body.slice(1).some(segment => segment.x === position.x && segment.y === position.y);
};

export const isFoodCollision = (position: Position, food: Food): boolean => {
  return position.x === food.position.x && position.y === food.position.y;
};

export const moveSnake = (snake: Snake, ateFood: boolean): Snake => {
  const newHead = getNextHeadPosition(snake);
  const newBody = [newHead, ...snake.body];
  
  if (!ateFood) {
    newBody.pop(); // Remove tail if no food eaten
  }
  
  return {
    ...snake,
    body: newBody,
  };
};

export const changeDirection = (currentDirection: Direction, newDirection: Direction): Direction => {
  // Prevent reversing into the snake's body
  const opposites: Record<Direction, Direction> = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT',
  };
  
  if (opposites[currentDirection] === newDirection) {
    return currentDirection;
  }
  
  return newDirection;
};

export const calculateGameSpeed = (score: number): number => {
  const speedBoosts = Math.floor(score / 50); // Increase speed every 50 points
  return Math.max(50, GAME_CONFIG.initialSpeed - (speedBoosts * GAME_CONFIG.speedIncrement));
};

export const getHighScore = (): number => {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
};

export const saveHighScore = (score: number): void => {
  if (typeof window === 'undefined') return;
  const currentHighScore = getHighScore();
  if (score > currentHighScore) {
    localStorage.setItem('snakeHighScore', score.toString());
  }
};