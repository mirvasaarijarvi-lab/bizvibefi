import { motion } from "framer-motion";
import botAvatar from "@/assets/support-bot-avatar.png";

interface HeroAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-20 h-20",
  md: "w-28 h-28",
  lg: "w-36 h-36",
};

/**
 * Friendly BizVibe mascot avatar for page headers.
 * Wrapped in a soft gradient ring on a card-colored disc so the
 * transparent PNG never reveals the page background as a tiling artifact.
 */
const HeroAvatar = ({ size = "md", className = "" }: HeroAvatarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
      className={`mx-auto mb-6 ${className}`}
    >
      <div className={`${sizeMap[size]} mx-auto rounded-full bg-gradient-to-br from-purple-vivid/20 via-card to-electric/20 p-1 shadow-lg ring-1 ring-border/50`}>
        <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
          <img src={botAvatar} alt="BizVibe mascot" className="w-full h-full object-contain drop-shadow-sm" />
        </div>
      </div>
    </motion.div>
  );
};

export default HeroAvatar;
