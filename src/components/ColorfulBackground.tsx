import { motion } from 'framer-motion';

export function ColorfulBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dynamic Rainbow Mesh Gradient Base */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(255, 203, 164, 0.32) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(168, 235, 255, 0.28) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(255, 182, 130, 0.3) 0%, transparent 50%)',
        }}
        animate={{
          background: [
            'radial-gradient(circle at 20% 55%, rgba(255, 203, 164, 0.34) 0%, transparent 50%), radial-gradient(circle at 78% 48%, rgba(168, 235, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 52% 78%, rgba(255, 182, 130, 0.32) 0%, transparent 50%)',
            'radial-gradient(circle at 75% 35%, rgba(168, 235, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 22% 72%, rgba(255, 196, 140, 0.34) 0%, transparent 50%), radial-gradient(circle at 52% 22%, rgba(255, 174, 120, 0.32) 0%, transparent 50%)',
            'radial-gradient(circle at 48% 88%, rgba(255, 196, 140, 0.34) 0%, transparent 50%), radial-gradient(circle at 52% 12%, rgba(186, 230, 219, 0.32) 0%, transparent 50%), radial-gradient(circle at 88% 52%, rgba(255, 182, 130, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 32%, rgba(255, 210, 170, 0.33) 0%, transparent 50%), radial-gradient(circle at 70% 68%, rgba(255, 174, 120, 0.33) 0%, transparent 50%), radial-gradient(circle at 52% 52%, rgba(186, 230, 219, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 22% 52%, rgba(255, 210, 170, 0.32) 0%, transparent 50%), radial-gradient(circle at 78% 52%, rgba(168, 235, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 52% 78%, rgba(255, 182, 130, 0.32) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Colorful Light Beams */}
      {[...Array(20)].map((_, i) => {
        const beamColors = [
          'rgba(255, 182, 130, 0.35)',
          'rgba(255, 210, 170, 0.35)',
          'rgba(255, 196, 140, 0.35)',
          'rgba(186, 230, 219, 0.35)',
          'rgba(168, 235, 255, 0.32)',
          'rgba(255, 174, 120, 0.35)',
          'rgba(255, 203, 164, 0.35)',
          'rgba(255, 214, 182, 0.32)',
          'rgba(205, 237, 234, 0.32)',
          'rgba(255, 189, 143, 0.35)',
        ];
        
        return (
          <motion.div
            key={`beam-${i}`}
            initial={{
              opacity: 0,
              scaleY: 0,
            }}
            animate={{
              opacity: [0, 0.4, 0],
              scaleY: [0, 2, 0],
              rotate: [0, 8, -8, 0],
            }}
            transition={{
              duration: 10 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut",
            }}
            className="absolute w-2 h-[600px] origin-bottom"
            style={{
              left: `${i * 5}%`,
              bottom: 0,
              background: `linear-gradient(to top, ${beamColors[i % beamColors.length]}, transparent)`,
              filter: 'blur(12px)',
            }}
          />
        );
      })}

      {/* Vibrant Geometric Shapes - Squares and Rectangles Only */}
      {[...Array(25)].map((_, i) => {
        const shapes = ['rounded-lg', 'rounded-none', 'rounded-3xl', 'rounded-xl'];
        const shapeColors = [
          'border-amber-300/60 bg-amber-200/20',
          'border-orange-300/60 bg-orange-200/20',
          'border-yellow-300/60 bg-yellow-200/20',
          'border-lime-300/50 bg-lime-200/15',
          'border-teal-300/50 bg-teal-200/15',
          'border-cyan-300/50 bg-cyan-200/15',
          'border-emerald-300/50 bg-emerald-200/15',
          'border-amber-200/60 bg-amber-100/25',
          'border-orange-200/60 bg-orange-100/25',
        ];
        
        return (
          <motion.div
            key={`shape-${i}`}
            animate={{
              y: [0, -50, 0],
              x: [0, Math.random() * 40 - 20, 0],
              rotate: [0, 360],
              scale: [1, 1.4, 1],
              borderColor: [
                'rgba(255, 196, 140, 0.5)',
                'rgba(255, 182, 130, 0.5)',
                'rgba(255, 210, 170, 0.5)',
                'rgba(186, 230, 219, 0.5)',
                'rgba(168, 235, 255, 0.5)',
                'rgba(255, 174, 120, 0.5)',
                'rgba(205, 237, 234, 0.5)',
                'rgba(255, 203, 164, 0.5)',
                'rgba(255, 196, 140, 0.5)',
              ],
            }}
            transition={{
              duration: Math.random() * 18 + 12,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut",
            }}
            className={`absolute ${i % 3 === 0 ? 'w-20 h-20' : i % 3 === 1 ? 'w-16 h-16' : 'w-24 h-24'} border-4 ${shapeColors[i % shapeColors.length]} ${shapes[i % shapes.length]} backdrop-blur-sm`}
            style={{
              left: `${8 + i * 4}%`,
              top: `${10 + (i % 4) * 22}%`,
            }}
          />
        );
      })}

      {/* Rainbow Gradient Overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(45deg, rgba(255, 203, 164, 0.08) 0%, rgba(255, 210, 170, 0.08) 25%, rgba(255, 182, 130, 0.08) 50%, rgba(168, 235, 255, 0.08) 75%, rgba(186, 230, 219, 0.08) 100%)',
            'linear-gradient(90deg, rgba(255, 210, 170, 0.08) 0%, rgba(255, 182, 130, 0.08) 25%, rgba(186, 230, 219, 0.08) 50%, rgba(168, 235, 255, 0.08) 75%, rgba(255, 203, 164, 0.08) 100%)',
            'linear-gradient(135deg, rgba(255, 182, 130, 0.08) 0%, rgba(168, 235, 255, 0.08) 25%, rgba(186, 230, 219, 0.08) 50%, rgba(255, 203, 164, 0.08) 75%, rgba(255, 210, 170, 0.08) 100%)',
            'linear-gradient(180deg, rgba(168, 235, 255, 0.08) 0%, rgba(186, 230, 219, 0.08) 25%, rgba(255, 203, 164, 0.08) 50%, rgba(255, 210, 170, 0.08) 75%, rgba(255, 182, 130, 0.08) 100%)',
            'linear-gradient(45deg, rgba(255, 203, 164, 0.08) 0%, rgba(255, 210, 170, 0.08) 25%, rgba(255, 182, 130, 0.08) 50%, rgba(168, 235, 255, 0.08) 75%, rgba(186, 230, 219, 0.08) 100%)',
          ],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}