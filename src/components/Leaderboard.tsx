import { useLeaderboard, useBadgeCatalog, useAllMemberBadges } from "@/hooks/useBadges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Trophy, Crown, Medal } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n/useTranslation";
import BadgePill from "./BadgePill";

const initials = (name: string | null) =>
  !name ? "?" : name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const Leaderboard = () => {
  const { data, isLoading } = useLeaderboard();
  const { data: catalog } = useBadgeCatalog();
  const { t } = useTranslation();
  const top = (data ?? []).slice(0, 10);
  const userIds = top.map((r) => r.user_id);
  const { data: earnedMap } = useAllMemberBadges(userIds);

  if (isLoading) return null;
  if (!data || data.length === 0) return null;

  return (
    <TooltipProvider>
      <Card className="mb-12 overflow-hidden border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold tracking-[-0.02em]">
              {t("badges.leaderboard.title")}
            </h2>
            <span className="text-sm text-muted-foreground ml-auto">
              {t("badges.leaderboard.subtitle")}
            </span>
          </div>
          <ul className="space-y-3">
            {top.map((row, i) => {
              const isFirst = i === 0;
              const earned = earnedMap?.[row.user_id] ?? new Set<string>();
              return (
                <motion.li
                  key={row.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={`/members/${row.user_id}`}
                    className={`block p-3 rounded-lg transition-all ${
                      isFirst
                        ? "bg-gradient-to-r from-primary/15 via-vibetor/10 to-turquoise/10 border border-primary/40 shadow-md hover:shadow-lg"
                        : "hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 text-center font-bold font-display ${isFirst ? "text-primary text-lg" : "text-muted-foreground"}`}>
                        {isFirst ? <Crown className="h-5 w-5 mx-auto text-primary" /> : i === 1 || i === 2 ? <Medal className={`h-4 w-4 mx-auto ${i === 1 ? "text-muted-foreground" : "text-vibetor/70"}`} /> : `#${i + 1}`}
                      </div>
                      <Avatar className={`h-10 w-10 ${isFirst ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>
                        <AvatarImage src={row.avatar_url ?? undefined} alt={row.display_name ?? ""} />
                        <AvatarFallback className="text-xs">{initials(row.display_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate ${isFirst ? "font-display font-semibold" : "font-medium"}`}>
                          {row.display_name ?? t("badges.leaderboard.anonymous")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.badge_count} {row.badge_count === 1 ? t("badges.leaderboard.badge") : t("badges.leaderboard.badges")}
                        </p>
                      </div>
                      <Badge variant={isFirst ? "default" : "outline"} className={isFirst ? "bg-primary text-primary-foreground" : ""}>
                        {row.total_points} pts
                      </Badge>
                    </div>
                    {catalog && catalog.length > 0 && (
                      <div className="mt-3 sm:pl-11 flex flex-wrap gap-1.5">
                        {catalog.map((b) => (
                          <BadgePill key={b.id} badge={b} size="xs" earned={earned.has(b.id)} />
                        ))}
                      </div>
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default Leaderboard;
