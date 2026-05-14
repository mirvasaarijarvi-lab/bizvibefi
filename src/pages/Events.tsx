import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdminShowcase";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import HeroAvatar from "@/components/HeroAvatar";
import { useTranslation } from "@/i18n/useTranslation";
import mascotEvents from "@/assets/mascot-events.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, Globe, Users, Clock, CheckCircle, Zap,
  Video, Wrench, Rocket, Plus, Pencil, Trash2, ImagePlus, ExternalLink, X,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { fi, enUS, sv } from "date-fns/locale";

const googleMapsUrl = (location: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

const eventTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  meetup: { label: "Meetup", icon: Users, color: "bg-accent/10 text-accent" },
  webinar: { label: "Webinar", icon: Video, color: "bg-secondary/10 text-secondary" },
  workshop: { label: "Workshop", icon: Wrench, color: "bg-primary/10 text-primary" },
  hackathon: { label: "Hackathon", icon: Rocket, color: "bg-destructive/10 text-destructive" },
};

interface EventFormData {
  title: string;
  description: string;
  event_type: "meetup" | "webinar" | "workshop" | "hackathon";
  starts_at: string;
  ends_at: string;
  location: string;
  is_online: boolean;
  online_url: string;
  max_attendees: string;
  is_published: boolean;
  image_url: string;
}

const emptyForm: EventFormData = {
  title: "",
  description: "",
  event_type: "meetup" as const,
  starts_at: "",
  ends_at: "",
  location: "",
  is_online: false,
  online_url: "",
  max_attendees: "",
  is_published: true,
  image_url: "",
};

const EventFormDialog = ({
  open,
  onOpenChange,
  editEvent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEvent?: Tables<"events"> | null;
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<EventFormData>(() => {
    if (editEvent) {
      return {
        title: editEvent.title,
        description: editEvent.description || "",
        event_type: editEvent.event_type,
        starts_at: editEvent.starts_at ? format(new Date(editEvent.starts_at), "yyyy-MM-dd'T'HH:mm") : "",
        ends_at: editEvent.ends_at ? format(new Date(editEvent.ends_at), "yyyy-MM-dd'T'HH:mm") : "",
        location: editEvent.location || "",
        is_online: editEvent.is_online,
        online_url: editEvent.online_url || "",
        max_attendees: editEvent.max_attendees?.toString() || "",
        is_published: editEvent.is_published,
        image_url: editEvent.image_url || "",
      };
    }
    return emptyForm;
  });
  const [uploading, setUploading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_type: form.event_type,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        location: form.location.trim() || null,
        is_online: form.is_online,
        online_url: form.online_url.trim() || null,
        max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
        is_published: form.is_published,
        image_url: form.image_url.trim() || null,
      };

      if (editEvent) {
        const { error } = await supabase
          .from("events")
          .update(payload)
          .eq("id", editEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("events")
          .insert([{ ...payload, created_by: user!.id }] as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: editEvent ? "Event updated!" : "Event created!" });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const set = (field: keyof EventFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("event-images")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage
        .from("event-images")
        .getPublicUrl(path);
      set("image_url", publicUrl);
      toast({ title: "Image uploaded!" });
    } catch (err: unknown) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editEvent ? "Edit Event" : t("events.createEvent")}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Label className="font-body text-sm">Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              maxLength={200}
              className="font-body"
            />
          </div>
          <div>
            <Label className="font-body text-sm">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              maxLength={2000}
              className="font-body"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-body text-sm">Type</Label>
              <Select value={form.event_type} onValueChange={(v) => set("event_type", v)}>
                <SelectTrigger className="font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meetup">Meetup</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-body text-sm">Max Attendees</Label>
              <Input
                type="number"
                value={form.max_attendees}
                onChange={(e) => set("max_attendees", e.target.value)}
                min={1}
                placeholder="Unlimited"
                className="font-body"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-body text-sm">Starts At *</Label>
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => set("starts_at", e.target.value)}
                required
                className="font-body"
              />
            </div>
            <div>
              <Label className="font-body text-sm">Ends At</Label>
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => set("ends_at", e.target.value)}
                className="font-body"
              />
            </div>
          </div>
          <div>
            <Label className="font-body text-sm">Location</Label>
            <Input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Venue or address"
              className="font-body"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.is_online}
              onCheckedChange={(v) => set("is_online", v)}
            />
            <Label className="font-body text-sm">Online event</Label>
          </div>
          {form.is_online && (
            <div>
              <Label className="font-body text-sm">Online URL</Label>
              <Input
                value={form.online_url}
                onChange={(e) => set("online_url", e.target.value)}
                placeholder="https://meet.google.com/..."
                className="font-body"
              />
            </div>
          )}
          {/* Cover Image */}
          <div>
            <Label className="font-body text-sm">Cover Image</Label>
            {form.image_url ? (
              <div className="relative mt-1">
                <img
                  src={form.image_url}
                  alt="Event cover"
                  className="w-full h-40 object-cover rounded-lg border border-border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-7 w-7 p-0"
                  onClick={() => set("image_url", "")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center gap-2 mt-1 px-4 py-3 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-body">
                  {uploading ? "Uploading..." : "Click to upload cover image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.is_published}
              onCheckedChange={(v) => set("is_published", v)}
            />
            <Label className="font-body text-sm">Published (visible to everyone)</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="bg-gradient-storm hover:opacity-90 font-body"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending
                ? "Saving..."
                : editEvent
                ? "Update Event"
                : t("events.createEvent")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="font-body"
            >
              {t("events.cancel")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Events = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Tables<"events"> | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("starts_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: myRsvps } = useQuery({
    queryKey: ["my-rsvps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: rsvpCounts } = useQuery({
    queryKey: ["rsvp-counts", events?.map((e) => e.id)],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      if (!events) return counts;
      for (const event of events) {
        const { data } = await supabase.rpc("get_event_rsvp_count", { _event_id: event.id });
        counts[event.id] = data ?? 0;
      }
      return counts;
    },
    enabled: !!events && events.length > 0,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: "going" | "maybe" | "cancelled" }) => {
      if (!user) throw new Error("Not authenticated");
      const existing = myRsvps?.find((r) => r.event_id === eventId);
      if (existing) {
        if (status === "cancelled") {
          const { error } = await supabase.from("event_rsvps").delete().eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("event_rsvps").update({ status }).eq("id", existing.id);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: user.id, status });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-rsvps"] });
      queryClient.invalidateQueries({ queryKey: ["rsvp-counts"] });
      toast({ title: "RSVP updated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const upcomingEvents = events?.filter((e) => !isPast(new Date(e.starts_at))) ?? [];
  const pastEvents = events?.filter((e) => isPast(new Date(e.starts_at))) ?? [];

  const getRsvpStatus = (eventId: string) => {
    return myRsvps?.find((r) => r.event_id === eventId)?.status;
  };

  const renderEventCard = (event: Tables<"events">, isPastEvent = false) => {
    const config = eventTypeConfig[event.event_type] || eventTypeConfig.meetup;
    const Icon = config.icon;
    const rsvpStatus = getRsvpStatus(event.id);
    const attendeeCount = rsvpCounts?.[event.id] ?? 0;
    const isFull = event.max_attendees ? attendeeCount >= event.max_attendees : false;

    return (
      <div
        key={event.id}
        className={`bg-card border border-border rounded-2xl overflow-hidden transition-colors ${
          isPastEvent ? "" : "hover:border-primary/30"
        }`}
      >
        {/* Cover image */}
        {event.image_url && !isPastEvent && (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Date block */}
          {!isPastEvent && (
            <div className="flex-shrink-0 w-20 text-center">
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground font-body uppercase">
                  {format(new Date(event.starts_at), "MMM") === "Jun" ? "Kesä" : format(new Date(event.starts_at), "MMM")}
                </p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {format(new Date(event.starts_at), "dd")}
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className={`${config.color} border-0 font-body text-xs`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
              {event.is_online && (
                <Badge variant="outline" className="font-body text-xs">
                  <Globe className="h-3 w-3 mr-1" /> Online
                </Badge>
              )}
              {!event.is_published && (
                <Badge variant="outline" className="font-body text-xs text-muted-foreground">
                  Draft
                </Badge>
              )}
              {/* Admin actions */}
              {isAdmin && (
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setEditEvent(event)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this event?")) {
                        deleteMutation.mutate(event.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <h2 className={`font-display font-bold text-foreground mb-2 ${isPastEvent ? "text-base" : "text-xl"}`}>
              {event.title}
            </h2>
            {!isPastEvent && event.description && (
              <p className="text-sm text-muted-foreground font-body mb-4">
                {event.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-body mb-4">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {isPastEvent
                  ? format(new Date(event.starts_at), "MMM dd, yyyy")
                  : (
                    <>
                      {format(new Date(event.starts_at), "HH:mm")}
                      {event.ends_at && ` – ${format(new Date(event.ends_at), "HH:mm")}`}
                    </>
                  )}
              </span>
              {event.location && (
                <a
                  href={googleMapsUrl(event.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {!isPastEvent && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {attendeeCount} {attendeeCount === 1 ? t("events.going") : t("events.goingPlural")}
                  {event.max_attendees && ` / ${event.max_attendees} ${t("events.spots")}`}
                </span>
              )}
            </div>

            {/* RSVP buttons - upcoming only */}
            {!isPastEvent && (
              user ? (
                <div className="flex items-center gap-2">
                  {rsvpStatus === "going" ? (
                    <>
                      <Button size="sm" className="bg-accent text-accent-foreground font-body" disabled>
                        <CheckCircle className="h-4 w-4 mr-1" /> Going
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="font-body text-xs"
                        onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "cancelled" })}
                        disabled={rsvpMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : rsvpStatus === "maybe" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-body"
                        onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "going" })}
                        disabled={rsvpMutation.isPending || isFull}
                      >
                        <Zap className="h-4 w-4 mr-1" /> Switch to Going
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="font-body text-xs"
                        onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "cancelled" })}
                        disabled={rsvpMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        className="bg-gradient-storm hover:opacity-90 font-body"
                        onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "going" })}
                        disabled={rsvpMutation.isPending || isFull}
                      >
                        {isFull ? "Full" : "I'm Going"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-body"
                        onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "maybe" })}
                        disabled={rsvpMutation.isPending}
                      >
                        Maybe
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <Button asChild size="sm" className="bg-gradient-storm hover:opacity-90 font-body">
                  <Link to="/auth">Sign in to RSVP</Link>
                </Button>
              )
            )}
          </div>
        </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <PageMeta
        title={`${t("events.tag")} — BizVibe`}
        description={t("events.subtitle")}
      />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <HeroAvatar src={mascotEvents} alt="BizVibe events mascot" />
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-3">
              {t("events.tag")}
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground tracking-[-0.02em]">
              {t("events.title")} <span className="text-gradient-surge">{t("events.titleHighlight")}</span>
            </h1>
            <p className="mt-4 text-muted-foreground font-body text-lg max-w-xl mx-auto">
              {t("events.subtitle")}
            </p>
            {isAdmin && (
              <Button
                className="mt-6 bg-gradient-storm hover:opacity-90 font-body"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> {t("events.createEvent")}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4 mb-12">
                  {upcomingEvents.map((event) => renderEventCard(event))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card border border-border rounded-2xl mb-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-body">No upcoming events. Check back soon!</p>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground mb-4">Past Events</h2>
                  <div className="space-y-3 opacity-60">
                    {pastEvents.map((event) => renderEventCard(event, true))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Create dialog */}
      {createOpen && (
        <EventFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}

      {/* Edit dialog */}
      {editEvent && (
        <EventFormDialog
          open={!!editEvent}
          onOpenChange={(open) => { if (!open) setEditEvent(null); }}
          editEvent={editEvent}
        />
      )}
    </Layout>
  );
};

export default Events;
