import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path: string;
}

const ADMIN_PAGES: BreadcrumbItem[] = [
  { label: "Showcase", path: "/admin/showcase" },
  { label: "Notifications", path: "/admin/notifications" },
  { label: "Users", path: "/admin/users" },
  { label: "Event Registrations", path: "/admin/event-registrations" },
  { label: "Event Feedback", path: "/admin/event-feedback" },
  { label: "Messages", path: "/admin/messages" },
  { label: "Presentation Access", path: "/admin/presentation-access" },
  { label: "Audit Log", path: "/admin/audit-log" },
];

const ROUTE_LABELS: Record<string, string> = {
  "/": "Home",
  "/community": "Community",
  "/showcase": "Showcase",
  "/get-going": "Get Going",
  "/about": "About",
  "/contact": "Contact",
  "/auth": "Sign In",
  "/profile": "Profile",
  "/events": "Events",
  "/forum": "Forum",
  "/members": "Members",
  "/accessibility": "Accessibility",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
  "/admin/showcase": "Admin Showcase",
  "/admin/notifications": "Notifications",
  "/admin/users": "User Management",
  "/admin/audit-log": "Audit Log",
  "/admin/event-registrations": "Event Registrations",
  "/admin/event-feedback": "Event Feedback",
  "/admin/messages": "Send Messages",
  "/admin/presentation-access": "Presentation Access",
  "/reset-password": "Reset Password",
};

const Breadcrumbs = () => {
  const { pathname } = useLocation();

  if (pathname === "/") return null;

  const isAdmin = pathname.startsWith("/admin");

  // Build crumbs from path segments
  const crumbs: BreadcrumbItem[] = [];

  // For admin pages, use "Admin" as a group
  if (isAdmin) {
    crumbs.push({ label: "Admin", path: "/admin" });
    const label = ROUTE_LABELS[pathname];
    if (label && pathname !== "/admin") {
      crumbs.push({ label, path: pathname });
    }
  } else {
    // Try to match path directly, or build from segments
    const segments = pathname.split("/").filter(Boolean);
    let built = "";
    for (const seg of segments) {
      built += `/${seg}`;
      const label = ROUTE_LABELS[built];
      if (label) {
        crumbs.push({ label, path: built });
      } else {
        // Dynamic segment — skip or use a generic label
        // e.g. /showcase/:id, /members/:userId, /forum/:slug/:topicId
        if (built.startsWith("/showcase/")) {
          crumbs.push({ label: "Detail", path: built });
        } else if (built.startsWith("/members/")) {
          crumbs.push({ label: "Profile", path: built });
        }
      }
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="container pt-4 pb-0">
      <div className="flex items-center gap-1.5 text-sm font-body text-muted-foreground flex-wrap">
        <Link
          to="/"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          aria-label="Home"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only">Home</span>
        </Link>

        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={crumb.path} className="inline-flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              {isLast ? (
                <span className="text-foreground font-medium">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </div>

      {/* Admin quick-links bar */}
      {isAdmin && (
        <div className="flex flex-wrap gap-2 mt-2">
          {ADMIN_PAGES.map((page) => (
            <Link
              key={page.path}
              to={page.path}
              className={`text-xs font-body px-2.5 py-1 rounded-full border transition-colors ${
                pathname === page.path
                  ? "bg-primary/10 border-primary/30 text-primary font-medium"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
              }`}
            >
              {page.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Breadcrumbs;
