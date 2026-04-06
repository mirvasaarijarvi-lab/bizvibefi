import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useAdminShowcase";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ShieldCheck, ArrowLeft, UserCog } from "lucide-react";
import { toast } from "sonner";

const roleBadge = (role: string) => {
  switch (role) {
    case "superadmin":
      return (
        <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-[10px] px-1.5 py-0">
          SUPERADMIN
        </Badge>
      );
    case "admin":
      return (
        <Badge variant="default" className="text-[10px] px-1.5 py-0">
          ADMIN
        </Badge>
      );
    case "moderator":
      return (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          MODERATOR
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          USER
        </Badge>
      );
  }
};

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: myRoles } = useUserRole();
  const isSuperAdmin = myRoles?.includes("superadmin") ?? false;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, membership_tier")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      // Get all roles
      const userIds = profiles.map((p) => p.user_id);
      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("id, user_id, role")
        .in("user_id", userIds);
      if (rErr) throw rErr;

      const roleMap = new Map<string, { id: string; role: string }>();
      roles?.forEach((r) => roleMap.set(r.user_id, { id: r.id, role: r.role }));

      return profiles.map((p) => ({
        ...p,
        role_id: roleMap.get(p.user_id)?.id ?? null,
        role: roleMap.get(p.user_id)?.role ?? "user",
      }));
    },
    enabled: !!user && isSuperAdmin,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      currentRoleId,
      newRole,
    }: {
      userId: string;
      currentRoleId: string | null;
      newRole: string;
    }) => {
      // Don't allow changing own superadmin role
      if (userId === user?.id) throw new Error("Cannot change your own role");

      if (currentRoleId) {
        if (newRole === "user") {
          // Delete the role entry (default is user)
          const { error } = await supabase
            .from("user_roles")
            .delete()
            .eq("id", currentRoleId);
          if (error) throw error;
          // Re-insert as 'user'
          const { error: insertErr } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: newRole } as never);
          if (insertErr) throw insertErr;
        } else {
          const { error } = await supabase
            .from("user_roles")
            .update({ role: newRole } as never)
            .eq("id", currentRoleId);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!user || !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const filtered = users?.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.display_name?.toLowerCase().includes(q);
  });

  const initials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Layout>
      <PageMeta
        title="User Management — BizVibe Admin"
        description="Manage user roles and permissions."
      />
      <section className="py-24 md:py-32">
        <div className="container max-w-4xl">

          <div className="flex items-center gap-3 mb-2">
            <UserCog className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              User Management
            </h1>
          </div>
          <p className="text-muted-foreground font-body mb-8">
            Assign or remove admin and moderator roles. Only superadmins can access this page.
          </p>

          <div className="relative max-w-sm mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">User</TableHead>
                    <TableHead className="font-body">Tier</TableHead>
                    <TableHead className="font-body">Current Role</TableHead>
                    <TableHead className="font-body">Change Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => {
                    const isMe = u.user_id === user.id;
                    return (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.avatar_url ?? undefined} />
                              <AvatarFallback className="text-xs">
                                {initials(u.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-body text-sm font-medium">
                              {u.display_name || "Anonymous"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {u.membership_tier}
                          </Badge>
                        </TableCell>
                        <TableCell>{roleBadge(u.role)}</TableCell>
                        <TableCell>
                          {isMe ? (
                            <span className="text-xs text-muted-foreground font-body">
                              (your account)
                            </span>
                          ) : (
                            <Select
                              value={u.role}
                              onValueChange={(val) =>
                                updateRoleMutation.mutate({
                                  userId: u.user_id,
                                  currentRoleId: u.role_id,
                                  newRole: val,
                                })
                              }
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="h-8 text-xs w-32 font-body">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="superadmin">SuperAdmin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16">
              <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-body">No users found.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AdminUsers;
