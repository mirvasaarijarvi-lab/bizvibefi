import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile, type WebsiteLink } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useAdminShowcase";
import { supabase } from "@/integrations/supabase/client";
import { safeUrl } from "@/lib/safeUrl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Linkedin, Building, User, Globe, Mail, Phone, Plus, Trash2, Inbox, CheckCheck, MessageSquare, Calendar, KeyRound } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: roles } = useUserRole();
  const isSuperAdmin = roles?.includes("superadmin") ?? false;
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: contactRequests } = useQuery({
    queryKey: ["contact-requests-inbox", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_requests")
        .select("*")
        .eq("to_user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      const senderIds = [...new Set((data ?? []).map((r) => r.from_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", senderIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      return (data ?? []).map((r) => ({
        ...r,
        sender: profileMap.get(r.from_user_id),
      }));
    },
    enabled: !!user,
  });

  const { data: forumTopics } = useQuery({
    queryKey: ["profile-forum-topics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_topics")
        .select("id, title, created_at, category_id, reply_count")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;

      const catIds = [...new Set((data ?? []).map((t) => t.category_id))];
      const { data: cats } = await supabase
        .from("forum_categories")
        .select("id, slug, name")
        .in("id", catIds);
      const catMap = new Map(cats?.map((c) => [c.id, c]) ?? []);

      return (data ?? []).map((t) => ({
        ...t,
        category: catMap.get(t.category_id),
      }));
    },
    enabled: !!user,
  });

  const { data: upcomingRsvps } = useQuery({
    queryKey: ["profile-rsvps", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("id, status, event_id")
        .eq("user_id", user!.id)
        .eq("status", "going");
      if (error) throw error;
      if (!data?.length) return [];

      const eventIds = data.map((r) => r.event_id);
      const { data: events } = await supabase
        .from("events")
        .select("id, title, starts_at, location, is_online")
        .in("id", eventIds)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(5);

      return events ?? [];
    },
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_requests")
        .update({ is_read: true } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-requests-inbox"] });
    },
  });

  const unreadCount = contactRequests?.filter((r) => !r.is_read).length ?? 0;

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [company, setCompany] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [websiteLinks, setWebsiteLinks] = useState<WebsiteLink[]>([]);
  const [aiSkills, setAiSkills] = useState<string[]>([]);
  const [skillsSummary, setSkillsSummary] = useState("");
  const [openToWork, setOpenToWork] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [visibility, setVisibility] = useState({
    bio: true,
    company: true,
    company_url: true,
    linkedin_url: true,
    contact_email: true,
    contact_phone: true,
    website_links: true,
    ai_skills: true,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
      setCompany(profile.company ?? "");
      setCompanyUrl(profile.company_url ?? "");
      setLinkedinUrl(profile.linkedin_url ?? "");
      setContactEmail(profile.contact_email ?? "");
      setContactPhone(profile.contact_phone ?? "");
      setWebsiteLinks(Array.isArray(profile.website_links) ? profile.website_links : []);
      setAiSkills(Array.isArray(profile.ai_skills) ? profile.ai_skills : []);
      setSkillsSummary(profile.skills_summary ?? "");
      setOpenToWork(profile.open_to_work ?? false);
      const vis = profile.profile_visibility;
      if (vis && typeof vis === "object") {
        setVisibility((prev) => ({ ...prev, ...vis }));
      }
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      toast({ title: "Avatar updated!" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Sanitize URLs: strip javascript:/data: and other unsafe schemes
    const cleanLinks = websiteLinks
      .map((l) => ({ ...l, url: safeUrl(l.url) ?? "" }))
      .filter((l) => l.url.trim());
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim(),
        bio: bio.trim(),
        company: company.trim(),
        company_url: safeUrl(companyUrl),
        linkedin_url: safeUrl(linkedinUrl) ?? "",
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        website_links: cleanLinks.length > 0 ? cleanLinks : [],
        profile_visibility: visibility,
      } as never);
      toast({ title: "Profile updated!" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Update failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handlePasswordChange = async () => {
    if (newPasswordVal.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPasswordVal !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPasswordVal });
      if (error) throw error;
      toast({ title: "Password updated successfully!" });
      setNewPasswordVal("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const addLink = () => setWebsiteLinks([...websiteLinks, { label: "", url: "" }]);
  const removeLink = (i: number) => setWebsiteLinks(websiteLinks.filter((_, idx) => idx !== i));
  const updateLink = (i: number, field: "label" | "url", val: string) => {
    const updated = [...websiteLinks];
    updated[i] = { ...updated[i], [field]: val };
    setWebsiteLinks(updated);
  };

  if (isLoading || authLoading) {
    return (
      <Layout>
        <section className="py-20 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageMeta title="Profile — <Good Vibes Café/>" description="Manage your <Good Vibes Café/> profile, view your membership status and badges, and update your builder details, links and visibility." />
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-foreground mb-8">Your Profile</h1>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-8">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-muted text-lg font-display">
                    {displayName?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Camera className="h-3.5 w-3.5" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-bold text-foreground">{displayName || "Set your name"}</p>
                  {isSuperAdmin && (
                    <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-[10px] px-1.5 py-0">SUPERADMIN</Badge>
                  )}
                  {!isSuperAdmin && profile?.membership_tier === "vibetor" && (
                    <Badge className="bg-vibetor/90 hover:bg-vibetor text-primary-foreground text-[10px] px-1.5 py-0">VIBETOR</Badge>
                  )}
                  {profile?.membership_tier === "viber" && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">VIBER</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-body">
                  {isSuperAdmin ? "SuperAdmin" : `${profile?.membership_tier} member`}
                </p>
                {isSuperAdmin && (
                  <Link
                    to="/admin/users"
                    className="inline-flex items-center gap-1.5 mt-1 text-xs font-body text-primary hover:underline"
                  >
                    <User className="h-3.5 w-3.5" />
                    User Management
                  </Link>
                )}
                {!isSuperAdmin && profile?.membership_tier === "starter" && (
                  <Link
                    to="/apply-viber"
                    className="inline-flex items-center gap-1.5 mt-1 text-xs font-body text-primary hover:underline"
                  >
                    Upgrade to Viber
                  </Link>
                )}
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name" className="font-body flex items-center gap-2">
                    <User className="h-4 w-4" /> Display Name
                  </Label>
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="font-body"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="font-body">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="font-body"
                    rows={3}
                    maxLength={500}
                    placeholder="Tell the community about yourself..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="font-body flex items-center gap-2">
                    <Building className="h-4 w-4" /> Company
                  </Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="font-body"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-url" className="font-body flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Company Website
                  </Label>
                  <Input
                    id="company-url"
                    type="url"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    className="font-body"
                    placeholder="https://company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="font-body flex items-center gap-2">
                    <Linkedin className="h-4 w-4" /> LinkedIn URL
                  </Label>
                  <Input
                    id="linkedin"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="font-body"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-t border-border pt-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-foreground">Contact Info</h2>
                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="font-body flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Contact Email
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="font-body"
                    placeholder="public@example.com"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground font-body">Visible to other members on your profile.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-phone" className="font-body flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Phone Number
                  </Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="font-body"
                    placeholder="+358 ..."
                    maxLength={30}
                  />
                </div>
              </div>

              {/* Website Links */}
              <div className="border-t border-border pt-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <Globe className="h-5 w-5" /> Projects & Websites
                </h2>
                <p className="text-sm text-muted-foreground font-body">Add links to your projects, portfolios, or websites.</p>

                {websiteLinks.map((link, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <Input
                        value={link.label}
                        onChange={(e) => updateLink(i, "label", e.target.value)}
                        placeholder="Label (e.g. My SaaS)"
                        className="font-body"
                        maxLength={80}
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(i, "url", e.target.value)}
                        placeholder="https://..."
                        type="url"
                        className="font-body"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink(i)}
                      className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button type="button" variant="outline" size="sm" onClick={addLink}>
                  <Plus className="mr-1 h-3 w-3" /> Add link
                </Button>
              </div>

              {/* Visibility Settings */}
              <div className="border-t border-border pt-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-foreground">Profile Visibility</h2>
                <p className="text-sm text-muted-foreground font-body">
                  Choose which fields are visible to other members on your public profile.
                </p>
                {([
                  { key: "bio", label: "Bio" },
                  { key: "company", label: "Company" },
                  { key: "company_url", label: "Company Website" },
                  { key: "linkedin_url", label: "LinkedIn" },
                  { key: "contact_email", label: "Contact Email" },
                  { key: "contact_phone", label: "Phone Number" },
                  { key: "website_links", label: "Projects & Websites" },
                ] as const).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="font-body text-sm">{label}</Label>
                    <Switch
                      checked={visibility[key]}
                      onCheckedChange={(checked) =>
                        setVisibility((prev) => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                className="bg-gradient-storm hover:opacity-90 font-body"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </form>

          {/* Change Password */}
          <div className="bg-card border border-border rounded-2xl p-6 mt-8">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <KeyRound className="h-5 w-5" /> Change Password
            </h2>
            <div className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="font-body">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  placeholder="Min 6 characters"
                  className="font-body"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="font-body">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="font-body"
                />
              </div>
              <Button
                onClick={handlePasswordChange}
                disabled={changingPassword || newPasswordVal.length < 6 || newPasswordVal !== confirmPassword}
                className="font-body"
              >
                {changingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>
          </div>

          {/* Forum Activity */}
          <div className="bg-card border border-border rounded-2xl p-6 mt-8">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5" /> Forum Activity
            </h2>
            {!forumTopics || forumTopics.length === 0 ? (
              <p className="text-muted-foreground text-sm font-body py-4 text-center">
                No forum posts yet.{" "}
                <Link to="/forum" className="text-primary hover:underline">Start a discussion →</Link>
              </p>
            ) : (
              <div className="space-y-2">
                {forumTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    to={`/forum/${topic.category?.slug ?? "general"}/${topic.id}`}
                    className="block p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors"
                  >
                    <p className="font-body text-sm font-medium text-foreground">{topic.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-body">
                      {topic.category && <span>{topic.category.name}</span>}
                      <span>{topic.reply_count} replies</span>
                      <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-card border border-border rounded-2xl p-6 mt-8">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5" /> Upcoming Events
            </h2>
            {!upcomingRsvps || upcomingRsvps.length === 0 ? (
              <p className="text-muted-foreground text-sm font-body py-4 text-center">
                No upcoming RSVPs.{" "}
                <Link to="/events" className="text-primary hover:underline">Browse events →</Link>
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingRsvps.map((event) => (
                  <Link
                    key={event.id}
                    to="/events"
                    className="block p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors"
                  >
                    <p className="font-body text-sm font-medium text-foreground">{event.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-body">
                      <span>{new Date(event.starts_at).toLocaleDateString()}</span>
                      {event.location && <span>{event.location}</span>}
                      {event.is_online && <Badge variant="secondary" className="text-[10px] px-1 py-0">Online</Badge>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Inbox */}
          <div className="bg-card border border-border rounded-2xl p-6 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <Inbox className="h-5 w-5" /> Inbox
                {unreadCount > 0 && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 ml-1">{unreadCount}</Badge>
                )}
              </h2>
            </div>

            {!contactRequests || contactRequests.length === 0 ? (
              <p className="text-muted-foreground text-sm font-body py-6 text-center">
                No messages yet. When someone contacts you from your profile, their messages will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {contactRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      req.is_read ? "border-border bg-muted/20" : "border-primary/30 bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Link to={`/members/${req.from_user_id}`}>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={req.sender?.avatar_url ?? undefined} />
                          <AvatarFallback className="bg-muted text-xs font-display">
                            {req.sender?.display_name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/members/${req.from_user_id}`} className="font-display font-semibold text-sm hover:underline">
                            {req.sender?.display_name || "A member"}
                          </Link>
                          <span className="text-xs text-muted-foreground font-body">
                            {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                          </span>
                          {!req.is_read && (
                            <Badge variant="default" className="text-[9px] px-1 py-0">NEW</Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground font-body mt-1 whitespace-pre-wrap">{req.message}</p>
                      </div>
                      {!req.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-muted-foreground hover:text-primary"
                          onClick={() => markReadMutation.mutate(req.id)}
                          disabled={markReadMutation.isPending}
                          title="Mark as read"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Profile;
