import { motion } from "framer-motion";
import botAvatar from "@/assets/support-bot-avatar.png";

interface HeroAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  src?: string;
  alt?: string;
}

const sizeMap = {
  sm: "w-20 h-20",
  md: "w-28 h-28",
  lg: "w-36 h-36",
};

/**
 * Friendly <Good Vibes Café/> mascot avatar for page headers.
 * Renders the transparent mascot directly on the page background — no disc,
 * no ring, no tiling. The PNG itself carries true alpha transparency.
 */
const HeroAvatar = ({ size = "md", className = "", src, alt }: HeroAvatarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
      className={`mx-auto mb-6 ${className}`}
    >
      <img
        src={src ?? botAvatar}
        alt={alt ?? "<Good Vibes Café/> mascot"}
        className={`${sizeMap[size]} mx-auto object-contain drop-shadow-lg`}
      />
    </motion.div>
  );
};

export default HeroAvatar;
