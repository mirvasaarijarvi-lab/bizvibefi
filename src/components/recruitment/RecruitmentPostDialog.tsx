import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { safeUrl } from "@/lib/safeUrl";
import { AI_SKILL_TAGS } from "@/lib/aiSkills";
import {
  RECRUITMENT_TYPE_LABELS,
  useCreateRecruitmentPost,
  useUpdateRecruitmentPost,
  type RecruitmentPost,
  type RecruitmentPostType,
} from "@/hooks/useRecruitment";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: RecruitmentPost | null;
}

const EMPTY = {
  type: "open_position" as RecruitmentPostType,
  title: "",
  description: "",
  organization: "",
  location: "",
  is_remote: false,
  employment_type: "",
  apply_url: "",
  apply_email: "",
  allow_contact_request: true,
  tags: [] as string[],
  expires_at: "",
};

const RecruitmentPostDialog = ({ open, onOpenChange, post }: Props) => {
  const { toast } = useToast();
  const create = useCreateRecruitmentPost();
  const update = useUpdateRecruitmentPost();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (post) {
      setForm({
        type: post.type,
        title: post.title,
        description: post.description,
        organization: post.organization ?? "",
        location: post.location ?? "",
        is_remote: post.is_remote,
        employment_type: post.employment_type ?? "",
        apply_url: post.apply_url ?? "",
        apply_email: post.apply_email ?? "",
        allow_contact_request: post.allow_contact_request,
        tags: post.tags ?? [],
        expires_at: post.expires_at ?? "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [post, open]);

  const toggleTag = (tag: string) =>
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));

  const submit = async () => {
    if (form.title.trim().length < 3) {
      toast({ title: "Add a title of at least 3 characters", variant: "destructive" });
      return;
    }
    if (form.description.trim().length < 20) {
      toast({ title: "Add a description of at least 20 characters", variant: "destructive" });
      return;
    }
    if (form.apply_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.apply_email.trim())) {
      toast({ title: "Enter a valid apply email", variant: "destructive" });
      return;
    }

    const payload = {
      type: form.type,
      title: form.title.trim().slice(0, 140),
      description: form.description.trim().slice(0, 4000),
      organization: form.organization.trim() || null,
      location: form.location.trim() || null,
      is_remote: form.is_remote,
      employment_type: form.employment_type.trim() || null,
      apply_url: safeUrl(form.apply_url) || null,
      apply_email: form.apply_email.trim() || null,
      allow_contact_request: form.allow_contact_request,
      tags: form.tags,
      expires_at: form.expires_at || null,
    };

    try {
      if (post) {
        await update.mutateAsync({ id: post.id, ...payload });
        toast({ title: "Post updated" });
      } else {
        await create.mutateAsync(payload);
        toast({
          title: "Post submitted",
          description: "An admin will review it before it appears publicly.",
        });
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {post ? "Edit recruitment post" : "Post to the recruitment board"}
          </DialogTitle>
          <DialogDescription className="font-body">
            Posts are reviewed by an admin before they go live.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="font-body">Post type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as RecruitmentPostType }))}
            >
              <SelectTrigger className="font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RECRUITMENT_TYPE_LABELS) as RecruitmentPostType[]).map((k) => (
                  <SelectItem key={k} value={k} className="font-body">
                    {RECRUITMENT_TYPE_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rp-title" className="font-body">Title</Label>
            <Input
              id="rp-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={140}
              className="font-body"
              placeholder="Frontend developer, AI product bootcamp, Available for contract work..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rp-desc" className="font-body">Description</Label>
            <Textarea
              id="rp-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={6}
              maxLength={4000}
              className="font-body"
              placeholder="What the role, training, or person offers. Include requirements and next steps."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rp-org" className="font-body">Organization</Label>
              <Input
                id="rp-org"
                value={form.organization}
                onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                maxLength={120}
                className="font-body"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-loc" className="font-body">Location</Label>
              <Input
                id="rp-loc"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                maxLength={120}
                className="font-body"
                placeholder="Helsinki, Finland"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-emp" className="font-body">Employment type</Label>
              <Input
                id="rp-emp"
                value={form.employment_type}
                onChange={(e) => setForm((f) => ({ ...f, employment_type: e.target.value }))}
                maxLength={60}
                className="font-body"
                placeholder="Full-time, part-time, contract, internship"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-exp" className="font-body">Visible until</Label>
              <Input
                id="rp-exp"
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                className="font-body"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="font-body text-sm">Remote friendly</Label>
            <Switch
              checked={form.is_remote}
              onCheckedChange={(c) => setForm((f) => ({ ...f, is_remote: c }))}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rp-url" className="font-body">Apply link</Label>
              <Input
                id="rp-url"
                type="url"
                value={form.apply_url}
                onChange={(e) => setForm((f) => ({ ...f, apply_url: e.target.value }))}
                className="font-body"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rp-mail" className="font-body">Apply email</Label>
              <Input
                id="rp-mail"
                type="email"
                value={form.apply_email}
                onChange={(e) => setForm((f) => ({ ...f, apply_email: e.target.value }))}
                maxLength={255}
                className="font-body"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-body text-sm">Allow in-app messages</Label>
              <p className="text-xs text-muted-foreground font-body">
                Members can message you through your inbox.
              </p>
            </div>
            <Switch
              checked={form.allow_contact_request}
              onCheckedChange={(c) => setForm((f) => ({ ...f, allow_contact_request: c }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-body">Skills and tools</Label>
            <div className="flex flex-wrap gap-1.5">
              {AI_SKILL_TAGS.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}>
                  <Badge
                    variant={form.tags.includes(tag) ? "default" : "outline"}
                    className="font-body text-[11px] cursor-pointer"
                  >
                    {tag}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-body">
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending} className="font-body">
            {pending ? "Saving..." : post ? "Save changes" : "Submit for review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecruitmentPostDialog;
