import SnakeGame from '@/components/SnakeGame';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-green-800 mb-4">
            🐍 Snake Game
          </h1>
          <p className="text-lg text-green-700 max-w-2xl mx-auto">
            Classic Snake game built with Next.js and TypeScript. Eat the red food to grow longer and score points. 
            Don't hit the walls or yourself!
          </p>
        </div>
        
        <SnakeGame />
        
        <div className="mt-12 text-center text-sm text-green-600">
          <p>Built with Next.js, TypeScript, and Tailwind CSS</p>
        </div>
      </div>
    </main>
  );
}