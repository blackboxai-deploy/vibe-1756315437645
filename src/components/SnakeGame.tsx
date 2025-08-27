'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Snake, 
  Food, 
  GameStatus, 
  Direction,
  GameState 
} from '@/types/game';
import {
  GAME_CONFIG,
  generateRandomFood,
  moveSnake,
  changeDirection,
  getNextHeadPosition,
  isWallCollision,
  isSelfCollision,
  isFoodCollision,
  calculateGameSpeed,
  getHighScore,
  saveHighScore,
} from '@/lib/gameUtils';

const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastRenderTimeRef = useRef<number>(0);

  // Initial game state
  const [gameState, setGameState] = useState<GameState>({
    snake: {
      body: [{ x: 200, y: 200 }],
      direction: 'RIGHT' as Direction,
    },
    food: { position: { x: 100, y: 100 } },
    score: 0,
    highScore: 0,
    gameStatus: 'WAITING' as GameStatus,
    gameSpeed: GAME_CONFIG.initialSpeed,
  });

  // Initialize high score from localStorage
  useEffect(() => {
    setGameState(prev => ({ ...prev, highScore: getHighScore() }));
  }, []);

  // Draw functions
  const drawSnake = useCallback((ctx: CanvasRenderingContext2D, snake: Snake) => {
    snake.body.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#10b981' : '#16a34a'; // Head is slightly different color
      ctx.fillRect(segment.x + 1, segment.y + 1, GAME_CONFIG.gridSize - 2, GAME_CONFIG.gridSize - 2);
    });
  }, []);

  const drawFood = useCallback((ctx: CanvasRenderingContext2D, food: Food) => {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(
      food.position.x + 2, 
      food.position.y + 2, 
      GAME_CONFIG.gridSize - 4, 
      GAME_CONFIG.gridSize - 4
    );
  }, []);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;

    for (let x = 0; x <= GAME_CONFIG.canvasWidth; x += GAME_CONFIG.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_CONFIG.canvasHeight);
      ctx.stroke();
    }

    for (let y = 0; y <= GAME_CONFIG.canvasHeight; y += GAME_CONFIG.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_CONFIG.canvasWidth, y);
      ctx.stroke();
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);

    // Draw grid
    drawGrid(ctx);

    // Draw game elements
    drawSnake(ctx, gameState.snake);
    drawFood(ctx, gameState.food);
  }, [gameState.snake, gameState.food, drawGrid, drawSnake, drawFood]);

  // Game logic
  const updateGame = useCallback(() => {
    setGameState(prevState => {
      if (prevState.gameStatus !== 'PLAYING') return prevState;

      const nextHeadPosition = getNextHeadPosition(prevState.snake);
      
      // Check collisions
      if (isWallCollision(nextHeadPosition) || isSelfCollision(nextHeadPosition, prevState.snake)) {
        saveHighScore(prevState.score);
        return {
          ...prevState,
          gameStatus: 'GAME_OVER' as GameStatus,
          highScore: Math.max(prevState.highScore, prevState.score),
        };
      }

      // Check food collision
      const ateFood = isFoodCollision(nextHeadPosition, prevState.food);
      const newSnake = moveSnake(prevState.snake, ateFood);
      
      let newFood = prevState.food;
      let newScore = prevState.score;
      
      if (ateFood) {
        newFood = generateRandomFood(newSnake);
        newScore += GAME_CONFIG.pointsPerFood;
      }

      return {
        ...prevState,
        snake: newSnake,
        food: newFood,
        score: newScore,
        gameSpeed: calculateGameSpeed(newScore),
      };
    });
  }, []);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (timestamp - lastRenderTimeRef.current >= gameState.gameSpeed) {
      updateGame();
      lastRenderTimeRef.current = timestamp;
    }
    
    if (gameState.gameStatus === 'PLAYING') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState.gameSpeed, gameState.gameStatus, updateGame]);

  // Start game loop when playing
  useEffect(() => {
    if (gameState.gameStatus === 'PLAYING') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.gameStatus, gameLoop]);

  // Render on state change
  useEffect(() => {
    render();
  }, [render]);

  // Keyboard controls
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (gameState.gameStatus !== 'PLAYING') return;

    const keyDirectionMap: Record<string, Direction> = {
      'ArrowUp': 'UP',
      'KeyW': 'UP',
      'ArrowDown': 'DOWN',
      'KeyS': 'DOWN',
      'ArrowLeft': 'LEFT',
      'KeyA': 'LEFT',
      'ArrowRight': 'RIGHT',
      'KeyD': 'RIGHT',
    };

    const newDirection = keyDirectionMap[event.code];
    if (newDirection) {
      event.preventDefault();
      setGameState(prev => ({
        ...prev,
        snake: {
          ...prev.snake,
          direction: changeDirection(prev.snake.direction, newDirection),
        },
      }));
    }

    // Pause/Resume with spacebar
    if (event.code === 'Space') {
      event.preventDefault();
      togglePause();
    }
  }, [gameState.gameStatus, gameState.snake.direction]);

  // Event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Game control functions
  const startGame = () => {
    const initialFood = generateRandomFood({
      body: [{ x: 200, y: 200 }],
      direction: 'RIGHT',
    });
    
    setGameState({
      snake: {
        body: [{ x: 200, y: 200 }],
        direction: 'RIGHT',
      },
      food: initialFood,
      score: 0,
      highScore: getHighScore(),
      gameStatus: 'PLAYING',
      gameSpeed: GAME_CONFIG.initialSpeed,
    });
  };

  const togglePause = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: prev.gameStatus === 'PLAYING' ? 'PAUSED' : 'PLAYING',
    }));
  };

  const resetGame = () => {
    setGameState(prev => ({
      snake: {
        body: [{ x: 200, y: 200 }],
        direction: 'RIGHT',
      },
      food: { position: { x: 100, y: 100 } },
      score: 0,
      highScore: prev.highScore,
      gameStatus: 'WAITING',
      gameSpeed: GAME_CONFIG.initialSpeed,
    }));
  };

  const getStatusText = () => {
    switch (gameState.gameStatus) {
      case 'WAITING':
        return 'Press Start to Play';
      case 'PLAYING':
        return 'Playing';
      case 'PAUSED':
        return 'Paused';
      case 'GAME_OVER':
        return 'Game Over';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (gameState.gameStatus) {
      case 'WAITING':
        return 'secondary';
      case 'PLAYING':
        return 'default';
      case 'PAUSED':
        return 'outline';
      case 'GAME_OVER':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-green-600">Snake Game</CardTitle>
          <div className="flex justify-center items-center gap-4 mt-4">
            <Badge variant={getStatusColor() as any}>
              {getStatusText()}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{gameState.score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{gameState.highScore}</div>
              <div className="text-sm text-gray-600">High Score</div>
            </div>
          </div>

          <Separator />

          {/* Game Canvas */}
          <div className="flex justify-center">
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg">
              <canvas
                ref={canvasRef}
                width={GAME_CONFIG.canvasWidth}
                height={GAME_CONFIG.canvasHeight}
                className="block"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {gameState.gameStatus === 'WAITING' && (
              <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
                Start Game
              </Button>
            )}
            
            {(gameState.gameStatus === 'PLAYING' || gameState.gameStatus === 'PAUSED') && (
              <Button onClick={togglePause} variant="outline">
                {gameState.gameStatus === 'PLAYING' ? 'Pause' : 'Resume'}
              </Button>
            )}
            
            {gameState.gameStatus === 'GAME_OVER' && (
              <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
                Play Again
              </Button>
            )}
            
            <Button onClick={resetGame} variant="outline">
              Reset
            </Button>
          </div>

          <Separator />

          {/* Instructions */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-gray-800">Controls</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Use <kbd className="px-2 py-1 bg-gray-100 rounded">Arrow Keys</kbd> or <kbd className="px-2 py-1 bg-gray-100 rounded">WASD</kbd> to move</div>
              <div>Press <kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd> to pause/resume</div>
              <div>Eat the red food to grow and score points!</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SnakeGame;