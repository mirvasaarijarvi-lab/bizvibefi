import { Link, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdminShowcase";
import { Card } from "@/components/ui/card";
import {
  Shield,
  Bell,
  Users,
  CalendarDays,
  ClipboardList,
  Award,
  FileBadge,
  Mail,
  Send,
  Activity,
  MessageSquare,
  FileSearch,
} from "lucide-react";

const TILES: Array<{
  to: string;
  label: string;
  description: string;
  Icon: typeof Shield;
}> = [
  {
    to: "/admin/showcase",
    label: "Showcase Moderation",
    description: "Review, approve, or reject community submissions.",
    Icon: Shield,
  },
  {
    to: "/admin/notifications",
    label: "Notifications",
    description: "Send announcements and in-app notifications.",
    Icon: Bell,
  },
  {
    to: "/admin/users",
    label: "User Management",
    description: "Manage members, roles, and membership tiers.",
    Icon: Users,
  },
  {
    to: "/admin/event-registrations",
    label: "Event Registrations",
    description: "View and export attendees per event.",
    Icon: CalendarDays,
  },
  {
    to: "/admin/event-feedback",
    label: "Event Feedback",
    description: "Read ratings, comments, and survey responses.",
    Icon: MessageSquare,
  },
  {
    to: "/admin/messages",
    label: "Send Messages",
    description: "Compose and send emails to members.",
    Icon: Send,
  },
  {
    to: "/admin/badges",
    label: "Badge Claims",
    description: "Approve or reject member badge claims.",
    Icon: Award,
  },
  {
    to: "/admin/certificates",
    label: "Issue Certificate",
    description: "Issue course certificates to members.",
    Icon: FileBadge,
  },
  {
    to: "/admin/email-health",
    label: "Email Health",
    description: "Inspect delivery logs and suppression list.",
    Icon: Mail,
  },
  {
    to: "/admin/audit-log",
    label: "Audit Log",
    description: "Review administrative actions and changes.",
    Icon: ClipboardList,
  },
];

const Admin = () => {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <Layout>
      <PageMeta title="Admin" description="Administrative tools and operations" />
      <div className="container max-w-5xl py-10">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-teal uppercase tracking-wider mb-2">
            Admin Panel
          </p>
          <h1 className="font-display text-4xl font-bold mb-3">
            Choose an operation
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Select an administrative tool below to manage the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TILES.map(({ to, label, description, Icon }) => (
            <Link key={to} to={to} className="group">
              <Card className="p-6 h-full transition-all hover:border-primary hover:shadow-md">
                <div className="flex items-start gap-3 mb-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-lg font-semibold leading-tight pt-1">
                    {label}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
