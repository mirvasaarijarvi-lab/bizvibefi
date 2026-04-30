import {
  Award, UserPlus, Crown, CalendarCheck, Gem, Code, BarChart3, Wrench, BookOpen,
  GraduationCap, MessageSquareQuote, Brain, Rocket, Calendar, Sparkles, Handshake,
  Clock, Gift, Mic, Ship, FlaskConical, Users, Megaphone, Package, Telescope, Star,
  Newspaper, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Award, UserPlus, Crown, CalendarCheck, Gem, Code, BarChart3, Wrench, BookOpen,
  GraduationCap, MessageSquareQuote, Brain, Rocket, Calendar, Sparkles, Handshake,
  Clock, Gift, Mic, Ship, FlaskConical, Users, Megaphone, Package, Telescope, Star,
  Newspaper,
};

interface Props {
  name: string;
  className?: string;
  size?: number;
}

const BadgeIcon = ({ name, className, size = 20 }: Props) => {
  const Cmp = ICONS[name] ?? Award;
  return <Cmp className={className} size={size} aria-hidden="true" />;
};

export default BadgeIcon;
