import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { AVATARS } from '../constants/avatars';

export default function AvatarPicker({ selectedAvatar = 'avatar01', onSelectAvatar }) {
  return (
    <div className="space-y-2.5 w-full">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide px-1">
        Customize Your Avatar
      </label>

      <div className="glass-card rounded-3xl p-4 max-h-56 overflow-y-auto border border-white/80 shadow-inner">
        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5 sm:gap-3">
          {AVATARS.map((avatar) => {
            const isSelected = selectedAvatar === avatar.id;
            return (
              <motion.button
                key={avatar.id}
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectAvatar(avatar.id)}
                className={`relative rounded-full aspect-square transition-all duration-200 outline-none group focus:ring-2 focus:ring-blue-500 ${
                  isSelected
                    ? 'ring-4 ring-blue-600 ring-offset-2 ring-offset-[#F6F8FC] shadow-lg shadow-blue-500/30'
                    : 'hover:ring-2 hover:ring-blue-400/60 opacity-85 hover:opacity-100'
                }`}
                title={avatar.label}
              >
                <img
                  src={avatar.image}
                  alt={avatar.label}
                  className="w-full h-full rounded-full object-cover shadow-sm pointer-events-none"
                />

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md ring-2 ring-white"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
