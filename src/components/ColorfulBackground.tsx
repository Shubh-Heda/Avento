import { motion } from 'framer-motion';

export function ColorfulBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dynamic Rainbow Mesh Gradient Base */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 20% 50%, rgba(255, 71, 87, 0.35) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(34, 211, 238, 0.35) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(250, 204, 21, 0.35) 0%, transparent 50%)',
        }}
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(255, 71, 87, 0.35) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.35) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(250, 204, 21, 0.35) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 30%, rgba(139, 92, 246, 0.35) 0%, transparent 50%), radial-gradient(circle at 20% 70%, rgba(251, 146, 60, 0.35) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(251, 146, 60, 0.35) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 90%, rgba(236, 72, 153, 0.35) 0%, transparent 50%), radial-gradient(circle at 50% 10%, rgba(217, 70, 239, 0.35) 0%, transparent 50%), radial-gradient(circle at 90% 50%, rgba(249, 115, 22, 0.35) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 30%, rgba(250, 204, 21, 0.35) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(244, 63, 94, 0.35) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.35) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(255, 71, 87, 0.35) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.35) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(250, 204, 21, 0.35) 0%, transparent 50%)',
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
          'rgba(239, 68, 68, 0.4)',
          'rgba(249, 115, 22, 0.4)',
          'rgba(234, 179, 8, 0.4)',
          'rgba(251, 146, 60, 0.4)',
          'rgba(234, 88, 12, 0.4)',
          'rgba(244, 63, 94, 0.4)',
          'rgba(251, 113, 133, 0.4)',
          'rgba(139, 92, 246, 0.4)',
          'rgba(217, 70, 239, 0.4)',
          'rgba(236, 72, 153, 0.4)',
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
          'border-red-400/50 bg-red-500/10',
          'border-orange-400/50 bg-orange-500/10',
          'border-yellow-400/50 bg-yellow-500/10',
          'border-rose-400/50 bg-rose-500/10',
          'border-amber-400/50 bg-amber-500/10',
          'border-fuchsia-400/50 bg-fuchsia-500/10',
          'border-violet-400/50 bg-violet-500/10',
          'border-purple-400/50 bg-purple-500/10',
          'border-pink-400/50 bg-pink-500/10',
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
                'rgba(239, 68, 68, 0.5)',
                'rgba(249, 115, 22, 0.5)',
                'rgba(234, 179, 8, 0.5)',
                'rgba(251, 146, 60, 0.5)',
                'rgba(217, 70, 239, 0.5)',
                'rgba(244, 63, 94, 0.5)',
                'rgba(139, 92, 246, 0.5)',
                'rgba(236, 72, 153, 0.5)',
                'rgba(239, 68, 68, 0.5)',
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
            'linear-gradient(45deg, rgba(239, 68, 68, 0.08) 0%, rgba(234, 179, 8, 0.08) 25%, rgba(249, 115, 22, 0.08) 50%, rgba(139, 92, 246, 0.08) 75%, rgba(236, 72, 153, 0.08) 100%)',
            'linear-gradient(90deg, rgba(234, 179, 8, 0.08) 0%, rgba(249, 115, 22, 0.08) 25%, rgba(139, 92, 246, 0.08) 50%, rgba(236, 72, 153, 0.08) 75%, rgba(239, 68, 68, 0.08) 100%)',
            'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(139, 92, 246, 0.08) 25%, rgba(236, 72, 153, 0.08) 50%, rgba(239, 68, 68, 0.08) 75%, rgba(234, 179, 8, 0.08) 100%)',
            'linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.08) 25%, rgba(239, 68, 68, 0.08) 50%, rgba(234, 179, 8, 0.08) 75%, rgba(249, 115, 22, 0.08) 100%)',
            'linear-gradient(45deg, rgba(239, 68, 68, 0.08) 0%, rgba(234, 179, 8, 0.08) 25%, rgba(249, 115, 22, 0.08) 50%, rgba(139, 92, 246, 0.08) 75%, rgba(236, 72, 153, 0.08) 100%)',
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