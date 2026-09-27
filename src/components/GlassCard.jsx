import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = false, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      whileHover={hover ? { y: -2, transition: { duration: 0.15 } } : undefined}
      className={`glass-card rounded-[32px] p-6 text-slate-800 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
