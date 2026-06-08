import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useAdminShowcase";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, ShieldCheck, UserCog, Plus, Trash2, KeyRound, Gem, CalendarIcon } from "lucide-react";
import { format, parseISO, isBefore } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
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

const callAdminFn = async (action: string, params: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action, ...params },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};

const DateField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (iso: string | null) => void | Promise<void>;
}) => {
  const date = value ? parseISO(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 justify-start text-left font-body text-xs gap-1 px-2",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-3 w-3" />
          <span className="opacity-70">{label}:</span>
          {date ? format(date, "dd MMM yyyy") : "set"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : null)}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
};

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: myRoles, isLoading: rolesLoading } = useUserRole();
  const isSuperAdmin = myRoles?.includes("superadmin") ?? false;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ user_id: string; name: string } | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<{ user_id: string; name: string } | null>(null);

  // Create user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("user");

  // Password form
  const [newPwd, setNewPwd] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, membership_tier, vibetor_type, viber_started_at, viber_ends_at")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

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
      if (userId === user?.id) throw new Error("Cannot change your own role");
      if (currentRoleId) {
        if (newRole === "user") {
          const { error } = await supabase.from("user_roles").delete().eq("id", currentRoleId);
          if (error) throw error;
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
    onError: (err: Error) => toast.error(err.message),
  });

  const createUserMutation = useMutation({
    mutationFn: () =>
      callAdminFn("create_user", {
        email: newEmail,
        password: newPassword,
        display_name: newName,
        role: newRole,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User created");
      setCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewRole("user");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => callAdminFn("delete_user", { user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      callAdminFn("update_password", { user_id: userId, password }),
    onSuccess: () => {
      toast.success("Password updated");
      setPasswordTarget(null);
      setNewPwd("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (authLoading || (user && rolesLoading)) {
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
    return u.display_name?.toLowerCase().includes(search.toLowerCase());
  });

  const initials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Layout>
      <PageMeta title="User Management — <Good Vibes Café/> Admin" description="Manage user roles and permissions." />
      <section className="py-24 md:py-32">
        <div className="container max-w-5xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <UserCog className="h-6 w-6 text-primary" />
              <h1 className="font-display text-2xl md:text-3xl font-bold">User Management</h1>
            </div>
            <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </div>
          <p className="text-muted-foreground font-body mb-8">
            Manage users, roles, and passwords. Only superadmins can access this page.
          </p>

          <div className="relative max-w-sm mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">User</TableHead>
                    <TableHead className="font-body">Tier</TableHead>
                    <TableHead className="font-body">Viber window</TableHead>
                    <TableHead className="font-body">Vibetor Type</TableHead>
                    <TableHead className="font-body">Current Role</TableHead>
                    <TableHead className="font-body">Change Role</TableHead>
                    <TableHead className="font-body text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => {
                    const isMe = u.user_id === user.id;
                    const viberStart = (u as Record<string, unknown>).viber_started_at as string | null;
                    const viberEnd = (u as Record<string, unknown>).viber_ends_at as string | null;
                    const expired = u.membership_tier === "viber" && viberEnd && isBefore(parseISO(viberEnd), new Date());
                    return (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.avatar_url ?? undefined} />
                              <AvatarFallback className="text-xs">{initials(u.display_name)}</AvatarFallback>
                            </Avatar>
                            <span className="font-body text-sm font-medium">{u.display_name || "Anonymous"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isMe ? (
                            <Badge variant="outline" className="text-[10px] capitalize">{u.membership_tier}</Badge>
                          ) : (
                            <Select
                              value={u.membership_tier}
                              onValueChange={async (val) => {
                                const oldTier = u.membership_tier;
                                if (val === oldTier) return;
                                const patch: Record<string, unknown> = { membership_tier: val };
                                if (val === "viber" && !viberStart) {
                                  patch.viber_started_at = new Date().toISOString().slice(0, 10);
                                  patch.viber_ends_at = "2026-12-31";
                                }
                                if (val !== "viber") {
                                  patch.viber_started_at = null;
                                  patch.viber_ends_at = null;
                                }
                                const { error } = await supabase
                                  .from("profiles")
                                  .update(patch as never)
                                  .eq("user_id", u.user_id);
                                if (error) { toast.error(error.message); return; }
                                await supabase.from("admin_notifications").insert({
                                  title: "Membership tier changed",
                                  message: `${u.display_name || "A member"}'s tier was changed from "${oldTier}" to "${val}".`,
                                  type: "tier_change",
                                });
                                queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                                toast.success("Tier updated");
                              }}
                            >
                              <SelectTrigger className={cn("h-8 text-xs w-28 font-body capitalize", expired && "border-destructive text-destructive")}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="starter">Starter</SelectItem>
                                <SelectItem value="viber">Viber</SelectItem>
                                <SelectItem value="vibetor">Vibetor</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {expired && (
                            <div className="text-[10px] text-destructive mt-1 font-body">Expired</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.membership_tier === "viber" && !isMe ? (
                            <div className="flex flex-col gap-1">
                              <DateField
                                label="Start"
                                value={viberStart}
                                onChange={async (iso) => {
                                  const { error } = await supabase
                                    .from("profiles")
                                    .update({ viber_started_at: iso } as never)
                                    .eq("user_id", u.user_id);
                                  if (error) { toast.error(error.message); return; }
                                  queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                                  toast.success("Viber start date updated");
                                }}
                              />
                              <DateField
                                label="End"
                                value={viberEnd}
                                onChange={async (iso) => {
                                  const { error } = await supabase
                                    .from("profiles")
                                    .update({ viber_ends_at: iso } as never)
                                    .eq("user_id", u.user_id);
                                  if (error) { toast.error(error.message); return; }
                                  queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                                  toast.success("Viber end date updated");
                                }}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.membership_tier === "vibetor" ? (
                            <Select
                              value={(u as Record<string, unknown>).vibetor_type as string ?? "none"}
                              onValueChange={async (val) => {
                                const newType = val === "none" ? null : val;
                                const oldType = (u as Record<string, unknown>).vibetor_type as string | null;
                                const { error } = await supabase
                                  .from("profiles")
                                  .update({ vibetor_type: newType } as never)
                                  .eq("user_id", u.user_id);
                                if (error) { toast.error(error.message); return; }
                                const label = (t: string | null) => t ? t.charAt(0).toUpperCase() + t.slice(1) : "Not set";
                                await supabase.from("admin_notifications").insert({
                                  title: "Vibetor type changed",
                                  message: `${u.display_name || "A member"}'s vibetor type was changed from "${label(oldType)}" to "${label(newType)}".`,
                                  type: "vibetor_type_change",
                                });
                                queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                                toast.success("Vibetor type updated");
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs w-28 font-body"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Not set</SelectItem>
                                <SelectItem value="founder">Founder</SelectItem>
                                <SelectItem value="investor">Investor</SelectItem>
                                <SelectItem value="innovator">Innovator</SelectItem>
                                <SelectItem value="partner">Partner</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{roleBadge(u.role)}</TableCell>
                        <TableCell>
                          {isMe ? (
                            <span className="text-xs text-muted-foreground font-body">(your account)</span>
                          ) : (
                            <Select
                              value={u.role}
                              onValueChange={(val) =>
                                updateRoleMutation.mutate({ userId: u.user_id, currentRoleId: u.role_id, newRole: val })
                              }
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="h-8 text-xs w-32 font-body"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="superadmin">SuperAdmin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isMe && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Change password"
                                onClick={() => setPasswordTarget({ user_id: u.user_id, name: u.display_name || "this user" })}
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete user"
                                onClick={() => setDeleteTarget({ user_id: u.user_id, name: u.display_name || "this user" })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Create New User</DialogTitle>
            <DialogDescription className="font-body">
              Add a new user with a pre-set email and password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-name">Display Name</Label>
              <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pwd">Password</Label>
              <Input id="new-pwd" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">SuperAdmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createUserMutation.mutate()}
              disabled={!newEmail || !newPassword || newPassword.length < 6 || createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteUserMutation.mutate(deleteTarget.user_id)}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog open={!!passwordTarget} onOpenChange={(open) => { if (!open) { setPasswordTarget(null); setNewPwd(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Change Password</DialogTitle>
            <DialogDescription className="font-body">
              Set a new password for <strong>{passwordTarget?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="change-pwd">New Password</Label>
            <Input id="change-pwd" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Min 6 characters" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasswordTarget(null); setNewPwd(""); }}>Cancel</Button>
            <Button
              onClick={() => passwordTarget && updatePasswordMutation.mutate({ userId: passwordTarget.user_id, password: newPwd })}
              disabled={newPwd.length < 6 || updatePasswordMutation.isPending}
            >
              {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminUsers;
