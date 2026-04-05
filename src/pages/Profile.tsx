import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Linkedin, Building, User } from "lucide-react";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [company, setCompany] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
      setCompany(profile.company ?? "");
      setLinkedinUrl(profile.linkedin_url ?? "");
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
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim(),
        bio: bio.trim(),
        company: company.trim(),
        linkedin_url: linkedinUrl.trim(),
      });
      toast({ title: "Profile updated!" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Update failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
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
      <PageMeta title="Profile — BizVibe" description="Manage your BizVibe profile." />
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
                <p className="font-display font-bold text-foreground">{displayName || "Set your name"}</p>
                <p className="text-sm text-muted-foreground font-body capitalize">
                  {profile?.membership_tier} member
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
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

              <Button
                type="submit"
                className="bg-gradient-storm hover:opacity-90 font-body"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Profile;
