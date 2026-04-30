import { cn } from "@/lib/utils";
import BadgeIcon from "./BadgeIcon";
import type { BadgeDef } from "@/hooks/useBadges";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  badge: BadgeDef;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  earned?: boolean;
}

const sizeMap = {
  xs: { wrap: "h-6 w-6", icon: 12 },
  sm: { wrap: "h-8 w-8", icon: 14 },
  md: { wrap: "h-10 w-10", icon: 18 },
  lg: { wrap: "h-14 w-14", icon: 24 },
};

const BadgePill = ({ badge, size = "md", className, earned = true }: Props) => {
  const s = sizeMap[size];
  const isDiamond = badge.is_diamond;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "rounded-full flex items-center justify-center border shrink-0 transition-all",
            !earned
              ? "bg-muted/40 border-border text-muted-foreground/50 opacity-60 grayscale"
              : isDiamond
                ? "bg-gradient-to-br from-turquoise/30 to-primary/20 border-turquoise/60 text-turquoise shadow-md"
                : badge.color === "vibetor"
                  ? "bg-vibetor/15 border-vibetor/40 text-vibetor"
                  : "bg-primary/10 border-primary/30 text-primary",
            s.wrap,
            className,
          )}
        >
          <BadgeIcon name={badge.icon} size={s.icon} />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{badge.name}{!earned && " (locked)"}</p>
        <p className="text-xs text-muted-foreground max-w-[220px]">{badge.description}</p>
        {badge.bonus_points > 0 && (
          <p className="text-xs text-primary mt-1">+{badge.bonus_points} bonus pts</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export default BadgePill;
