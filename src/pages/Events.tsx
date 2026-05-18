import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin, useIsSuperadmin } from "@/hooks/useAdminShowcase";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import HeroAvatar from "@/components/HeroAvatar";
import { useTranslation } from "@/i18n/useTranslation";
import mascotEvents from "@/assets/mascot-events.png";
import { EventPresentationsManager, EventPresentationsViewer } from "@/components/EventPresentations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Mic, Building2, Handshake,
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

interface Speaker {
  name: string;
  title: string;
  company: string;
  image_url: string;
}

interface Sponsor {
  name: string;
  logo_url: string;
  url: string;
  kind: "sponsor" | "partner";
}

interface EventFormData {
  title: string;
  title_fi: string;
  title_sv: string;
  description: string;
  description_fi: string;
  description_sv: string;
  agenda: string;
  agenda_fi: string;
  agenda_sv: string;
  event_type: "meetup" | "webinar" | "workshop" | "hackathon";
  starts_at: string;
  ends_at: string;
  location: string;
  location_fi: string;
  location_sv: string;
  is_online: boolean;
  online_url: string;
  max_attendees: string;
  is_published: boolean;
  image_url: string;
  requires_signin: boolean;
  speakers: Speaker[];
  sponsors: Sponsor[];
}

type LocalizedEvent = Tables<"events"> & {
  title_fi?: string | null;
  title_sv?: string | null;
  description_fi?: string | null;
  description_sv?: string | null;
  location_fi?: string | null;
  location_sv?: string | null;
  agenda?: string | null;
  agenda_fi?: string | null;
  agenda_sv?: string | null;
  speakers?: unknown;
  sponsors?: unknown;
};

const parseSpeakers = (raw: unknown): Speaker[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    const o = (s ?? {}) as Record<string, unknown>;
    return {
      name: typeof o.name === "string" ? o.name : "",
      title: typeof o.title === "string" ? o.title : "",
      company: typeof o.company === "string" ? o.company : "",
      image_url: typeof o.image_url === "string" ? o.image_url : "",
    };
  }).filter((s) => s.name.trim().length > 0);
};

const parseSponsors = (raw: unknown): Sponsor[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    const o = (s ?? {}) as Record<string, unknown>;
    return {
      name: typeof o.name === "string" ? o.name : "",
      logo_url: typeof o.logo_url === "string" ? o.logo_url : "",
      url: typeof o.url === "string" ? o.url : "",
      kind: o.kind === "partner" ? "partner" : "sponsor",
    } as Sponsor;
  }).filter((s) => s.name.trim().length > 0);
};

const localizedEventValue = (
  event: LocalizedEvent,
  lang: string,
  field: "title" | "description" | "location" | "agenda",
) => {
  const localizedKey = `${field}_${lang}` as keyof LocalizedEvent;
  const localized = lang === "fi" || lang === "sv" ? event[localizedKey] : null;
  return typeof localized === "string" && localized.length > 0 ? localized : event[field];
};

const emptyForm: EventFormData = {
  title: "",
  title_fi: "",
  title_sv: "",
  description: "",
  description_fi: "",
  description_sv: "",
  agenda: "",
  agenda_fi: "",
  agenda_sv: "",
  event_type: "meetup" as const,
  starts_at: "",
  ends_at: "",
  location: "",
  location_fi: "",
  location_sv: "",
  is_online: false,
  online_url: "",
  max_attendees: "",
  is_published: true,
  image_url: "",
  requires_signin: true,
  speakers: [],
  sponsors: [],
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
  const { t, lang } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isSuperadmin = useIsSuperadmin();

  const [form, setForm] = useState<EventFormData>(() => {
    if (editEvent) {
      const event = editEvent as LocalizedEvent;
      return {
        title: event.title || "",
        title_fi: event.title_fi || "",
        title_sv: event.title_sv || "",
        description: event.description || "",
        description_fi: event.description_fi || "",
        description_sv: event.description_sv || "",
        agenda: event.agenda || "",
        agenda_fi: event.agenda_fi || "",
        agenda_sv: event.agenda_sv || "",
        event_type: editEvent.event_type,
        starts_at: editEvent.starts_at ? format(new Date(editEvent.starts_at), "yyyy-MM-dd'T'HH:mm") : "",
        ends_at: editEvent.ends_at ? format(new Date(editEvent.ends_at), "yyyy-MM-dd'T'HH:mm") : "",
        location: event.location || "",
        location_fi: event.location_fi || "",
        location_sv: event.location_sv || "",
        is_online: editEvent.is_online,
        online_url: editEvent.online_url || "",
        max_attendees: editEvent.max_attendees?.toString() || "",
        is_published: editEvent.is_published,
        image_url: editEvent.image_url || "",
        requires_signin: (editEvent as { requires_signin?: boolean | null }).requires_signin ?? true,
        speakers: parseSpeakers((editEvent as LocalizedEvent).speakers),
        sponsors: parseSponsors((editEvent as LocalizedEvent).sponsors),
      };
    }
    return emptyForm;
  });
  const [uploading, setUploading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanSpeakers = form.speakers
        .map((s) => ({
          name: s.name.trim(),
          title: s.title.trim(),
          company: s.company.trim(),
          image_url: s.image_url.trim(),
        }))
        .filter((s) => s.name.length > 0);
      const normalizeUrl = (raw: string) => {
        const v = raw.trim();
        if (!v) return "";
        return /^https?:\/\//i.test(v) ? v : `https://${v}`;
      };
      const cleanSponsors = form.sponsors
        .map((s) => ({
          name: s.name.trim(),
          logo_url: s.logo_url.trim(),
          url: normalizeUrl(s.url),
          kind: s.kind,
        }))
        .filter((s) => s.name.length > 0);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        agenda: form.agenda.trim() || null,
        event_type: form.event_type,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        location: form.location.trim() || null,
        is_online: form.is_online,
        online_url: form.online_url.trim() || null,
        max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
        is_published: form.is_published,
        image_url: form.image_url.trim() || null,
        requires_signin: form.requires_signin,
        speakers: cleanSpeakers,
        sponsors: cleanSponsors,
        title_fi: form.title_fi.trim() || null,
        title_sv: form.title_sv.trim() || null,
        description_fi: form.description_fi.trim() || null,
        description_sv: form.description_sv.trim() || null,
        location_fi: form.location_fi.trim() || null,
        location_sv: form.location_sv.trim() || null,
        agenda_fi: form.agenda_fi.trim() || null,
        agenda_sv: form.agenda_sv.trim() || null,
      };

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/manage-event`;
      const requestBody = editEvent
        ? { action: "update", id: editEvent.id, data: payload }
        : { action: "create", data: payload };

      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(requestBody),
        });
      } catch (networkErr) {
        throw new Error(`Network error: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`);
      }

      const rawText = await res.text();
      if (!res.ok) {
        // Surface the exact status + body
        let pretty = rawText;
        try {
          const parsed = JSON.parse(rawText);
          pretty = JSON.stringify(parsed, null, 2);
        } catch { /* keep raw */ }
        throw new Error(`HTTP ${res.status} ${res.statusText}\n${pretty}`);
      }

      let result: { error?: string } = {};
      try { result = JSON.parse(rawText); } catch { /* ignore */ }
      if (result?.error) {
        throw new Error(`HTTP ${res.status}\n${result.error}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: editEvent ? "Event updated!" : "Event created!" });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      console.error("[manage-event] error:", err);
      toast({
        title: "Error",
        description: (
          <pre className="whitespace-pre-wrap text-xs font-mono max-h-64 overflow-auto">
            {err.message}
          </pre>
        ),
        variant: "destructive",
        duration: 15000,
      });
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
        .upload(path, file, { upsert: false });
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

  const uploadFileToBucket = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("event-images")
      .upload(path, file, { upsert: false });
    if (uploadErr) throw uploadErr;
    const { data: { publicUrl } } = supabase.storage
      .from("event-images")
      .getPublicUrl(path);
    return publicUrl;
  };

  const updateSpeaker = (i: number, patch: Partial<Speaker>) =>
    setForm((p) => ({ ...p, speakers: p.speakers.map((s, idx) => idx === i ? { ...s, ...patch } : s) }));
  const addSpeaker = () =>
    setForm((p) => ({ ...p, speakers: [...p.speakers, { name: "", title: "", company: "", image_url: "" }] }));
  const removeSpeaker = (i: number) =>
    setForm((p) => ({ ...p, speakers: p.speakers.filter((_, idx) => idx !== i) }));

  const updateSponsor = (i: number, patch: Partial<Sponsor>) =>
    setForm((p) => ({ ...p, sponsors: p.sponsors.map((s, idx) => idx === i ? { ...s, ...patch } : s) }));
  const addSponsor = (kind: "sponsor" | "partner" = "sponsor") =>
    setForm((p) => ({ ...p, sponsors: [...p.sponsors, { name: "", logo_url: "", url: "", kind }] }));
  const removeSponsor = (i: number) =>
    setForm((p) => ({ ...p, sponsors: p.sponsors.filter((_, idx) => idx !== i) }));

  const speakersLabels = {
    section: lang === "fi" ? "Puhujat" : lang === "sv" ? "Talare" : "Speakers",
    add: lang === "fi" ? "Lisää puhuja" : lang === "sv" ? "Lägg till talare" : "Add speaker",
    name: lang === "fi" ? "Nimi" : lang === "sv" ? "Namn" : "Name",
    title: lang === "fi" ? "Titteli" : lang === "sv" ? "Titel" : "Title",
    company: lang === "fi" ? "Yritys" : lang === "sv" ? "Företag" : "Company",
    photo: lang === "fi" ? "Kuva" : lang === "sv" ? "Foto" : "Photo",
    upload: lang === "fi" ? "Lataa kuva" : lang === "sv" ? "Ladda upp" : "Upload",
  };
  const sponsorsLabels = {
    section: lang === "fi" ? "Yhteistyökumppanit & sponsorit" : lang === "sv" ? "Samarbetspartners & sponsorer" : "Cooperation & sponsors",
    addSponsor: lang === "fi" ? "Lisää sponsori" : lang === "sv" ? "Lägg till sponsor" : "Add sponsor",
    addPartner: lang === "fi" ? "Lisää kumppani" : lang === "sv" ? "Lägg till partner" : "Add partner",
    name: lang === "fi" ? "Yrityksen nimi" : lang === "sv" ? "Företagsnamn" : "Company name",
    url: lang === "fi" ? "Verkkosivu (valinnainen)" : lang === "sv" ? "Webbplats (valfritt)" : "Website (optional)",
    logo: lang === "fi" ? "Logo" : lang === "sv" ? "Logo" : "Logo",
    sponsor: lang === "fi" ? "Sponsori" : lang === "sv" ? "Sponsor" : "Sponsor",
    partner: lang === "fi" ? "Kumppani" : lang === "sv" ? "Partner" : "Partner",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editEvent ? (lang === "fi" ? "Muokkaa tapahtumaa" : lang === "sv" ? "Redigera evenemang" : "Edit Event") : t("events.createEvent")}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <Tabs defaultValue="en" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="en">EN</TabsTrigger>
              <TabsTrigger value="fi">FI</TabsTrigger>
              <TabsTrigger value="sv">SV</TabsTrigger>
            </TabsList>
            {(["en", "fi", "sv"] as const).map((lc) => {
              const sfx = lc === "en" ? "" : `_${lc}`;
              const titleKey = `title${sfx}` as keyof EventFormData;
              const descKey = `description${sfx}` as keyof EventFormData;
              const agendaKey = `agenda${sfx}` as keyof EventFormData;
              return (
                <TabsContent key={lc} value={lc} className="space-y-4 mt-4">
                  <div>
                    <Label className="font-body text-sm">Title {lc === "en" ? "*" : `(${lc.toUpperCase()})`}</Label>
                    <Input
                      value={form[titleKey] as string}
                      onChange={(e) => set(titleKey, e.target.value)}
                      required={lc === "en"}
                      maxLength={200}
                      className="font-body"
                    />
                  </div>
                  <div>
                    <Label className="font-body text-sm">Description {lc !== "en" && `(${lc.toUpperCase()})`}</Label>
                    <Textarea
                      value={form[descKey] as string}
                      onChange={(e) => set(descKey, e.target.value)}
                      rows={3}
                      maxLength={2000}
                      className="font-body"
                    />
                  </div>
                  <div>
                    <Label className="font-body text-sm">{t("events.agenda")} {lc !== "en" && `(${lc.toUpperCase()})`}</Label>
                    <Textarea
                      value={form[agendaKey] as string}
                      onChange={(e) => set(agendaKey, e.target.value)}
                      rows={5}
                      maxLength={5000}
                      placeholder={t("events.agendaPlaceholder")}
                      className="font-body"
                    />
                    {lc === "en" && (
                      <p className="text-xs text-muted-foreground font-body mt-1">{t("events.agendaHint")}</p>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
          <p className="text-xs text-muted-foreground font-body">
            Leave FI/SV empty to auto-translate from English on save.
          </p>
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
          <div className="space-y-2">
            <Label className="font-body text-sm">Location</Label>
            <Input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Venue or address (EN)"
              className="font-body"
            />
            <Input
              value={form.location_fi}
              onChange={(e) => set("location_fi", e.target.value)}
              placeholder="Sijainti (FI) - optional, auto-translated if empty"
              className="font-body"
            />
            <Input
              value={form.location_sv}
              onChange={(e) => set("location_sv", e.target.value)}
              placeholder="Plats (SV) - optional, auto-translated if empty"
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

          {/* Speakers */}
          <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-display text-sm font-semibold flex items-center gap-2">
                <Mic className="h-4 w-4 text-turquoise" /> {speakersLabels.section}
              </Label>
              <Button type="button" size="sm" variant="outline" className="font-body h-7" onClick={addSpeaker}>
                <Plus className="h-3.5 w-3.5 mr-1" /> {speakersLabels.add}
              </Button>
            </div>
            {form.speakers.map((sp, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-3 space-y-2">
                <div className="flex items-start gap-3">
                  <label className="relative shrink-0 cursor-pointer group">
                    {sp.image_url ? (
                      <img src={sp.image_url} alt={sp.name} className="w-14 h-14 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-muted border border-dashed border-border flex items-center justify-center">
                        <ImagePlus className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const url = await uploadFileToBucket(file);
                          updateSpeaker(i, { image_url: url });
                        } catch (err) {
                          toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                  </label>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder={speakersLabels.name + " *"}
                      value={sp.name}
                      onChange={(e) => updateSpeaker(i, { name: e.target.value })}
                      maxLength={120}
                      className="font-body"
                    />
                    <Input
                      placeholder={speakersLabels.title}
                      value={sp.title}
                      onChange={(e) => updateSpeaker(i, { title: e.target.value })}
                      maxLength={200}
                      className="font-body"
                    />
                    <Input
                      placeholder={speakersLabels.company}
                      value={sp.company}
                      onChange={(e) => updateSpeaker(i, { company: e.target.value })}
                      maxLength={200}
                      className="font-body sm:col-span-2"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeSpeaker(i)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Sponsors & Partners */}
          <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="font-display text-sm font-semibold flex items-center gap-2">
                <Handshake className="h-4 w-4 text-turquoise" /> {sponsorsLabels.section}
              </Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" className="font-body h-7" onClick={() => addSponsor("partner")}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> {sponsorsLabels.addPartner}
                </Button>
                <Button type="button" size="sm" variant="outline" className="font-body h-7" onClick={() => addSponsor("sponsor")}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> {sponsorsLabels.addSponsor}
                </Button>
              </div>
            </div>
            {form.sponsors.map((sp, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-3 space-y-2">
                <div className="flex items-start gap-3">
                  <label className="relative shrink-0 cursor-pointer group">
                    {sp.logo_url ? (
                      <img src={sp.logo_url} alt={sp.name} className="w-14 h-14 rounded-md object-contain bg-background border border-border p-1" />
                    ) : (
                      <div className="w-14 h-14 rounded-md bg-muted border border-dashed border-border flex items-center justify-center">
                        <ImagePlus className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const url = await uploadFileToBucket(file);
                          updateSponsor(i, { logo_url: url });
                        } catch (err) {
                          toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                  </label>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder={sponsorsLabels.name + " *"}
                      value={sp.name}
                      onChange={(e) => updateSponsor(i, { name: e.target.value })}
                      maxLength={200}
                      className="font-body"
                    />
                    <Select value={sp.kind} onValueChange={(v) => updateSponsor(i, { kind: v as "sponsor" | "partner" })}>
                      <SelectTrigger className="font-body">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sponsor">{sponsorsLabels.sponsor}</SelectItem>
                        <SelectItem value="partner">{sponsorsLabels.partner}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={sponsorsLabels.url}
                      value={sp.url}
                      onChange={(e) => updateSponsor(i, { url: e.target.value })}
                      maxLength={500}
                      className="font-body sm:col-span-2"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeSponsor(i)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <EventPresentationsManager eventId={editEvent?.id} lang={lang} />

          <div className="flex items-center gap-3">
            <Switch
              checked={form.is_published}
              onCheckedChange={(v) => set("is_published", v)}
            />
            <Label className="font-body text-sm">Published (visible to everyone)</Label>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-3">
              <Switch
                checked={form.requires_signin}
                onCheckedChange={(v) => set("requires_signin", v)}
              />
              <Label className="font-body text-sm">
                {lang === "fi"
                  ? "Vaadi kirjautuminen ilmoittautumiseen"
                  : lang === "sv"
                  ? "Kräv inloggning för anmälan"
                  : "Require sign-in to sign up"}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground font-body">
              {form.requires_signin
                ? (lang === "fi"
                    ? "Vain kirjautuneet jäsenet voivat ilmoittautua. Sopii kollektiivin sisäisille tapahtumille."
                    : lang === "sv"
                    ? "Endast inloggade medlemmar kan anmäla sig. Lämpligt för kollektivets interna evenemang."
                    : "Only signed-in members can sign up. Best for collective-only events.")
                : (lang === "fi"
                    ? "Kuka tahansa voi ilmoittautua nimellä ja sähköpostilla. Avoin tapahtuma."
                    : lang === "sv"
                    ? "Vem som helst kan anmäla sig med namn och e-post. Öppet evenemang."
                    : "Anyone can sign up with name and email. Open event.")}
            </p>
          </div>
          {(() => {
            const isCreator = !!editEvent && editEvent.created_by === user?.id;
            const canSave = isSuperadmin || (editEvent ? isCreator : false);
            return (
              <>
                {!canSave && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm font-body text-destructive">
                    {editEvent
                      ? (lang === "fi"
                          ? "Vain pääylläpitäjät tai tapahtuman luoja voivat muokata tätä tapahtumaa."
                          : lang === "sv"
                          ? "Endast superadministratörer eller evenemangets skapare kan redigera detta evenemang."
                          : "Only superadmins or the event creator can edit this event.")
                      : (lang === "fi"
                          ? "Vain pääylläpitäjät voivat luoda tapahtumia."
                          : lang === "sv"
                          ? "Endast superadministratörer kan skapa evenemang."
                          : "Only superadmins can create events.")}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="bg-gradient-storm hover:opacity-90 font-body"
                    disabled={saveMutation.isPending || !canSave}
                    title={!canSave ? "You don't have permission to save this event" : undefined}
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
              </>
            );
          })()}
        </form>
      </DialogContent>
    </Dialog>
  );
};

const GuestSignupDialog = ({
  event,
  onOpenChange,
}: {
  event: Tables<"events"> | null;
  onOpenChange: (open: boolean) => void;
}) => {
  const { lang } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const labels = {
    title: lang === "fi" ? "Ilmoittaudu tapahtumaan" : lang === "sv" ? "Anmäl dig till evenemanget" : "Sign up for the event",
    name: lang === "fi" ? "Nimi" : lang === "sv" ? "Namn" : "Name",
    company: lang === "fi" ? "Yritys" : lang === "sv" ? "Företag" : "Company",
    email: lang === "fi" ? "Sähköposti" : lang === "sv" ? "E-post" : "Email",
    phone: lang === "fi" ? "Puhelin (valinnainen)" : lang === "sv" ? "Telefon (valfritt)" : "Phone (optional)",
    submit: lang === "fi" ? "Ilmoittaudu" : lang === "sv" ? "Anmäl" : "Sign up",
    cancel: lang === "fi" ? "Peruuta" : lang === "sv" ? "Avbryt" : "Cancel",
    success: lang === "fi" ? "Kiitos ilmoittautumisesta!" : lang === "sv" ? "Tack för din anmälan!" : "Thanks for signing up!",
    invalidEmail: lang === "fi" ? "Virheellinen sähköposti" : lang === "sv" ? "Ogiltig e-post" : "Invalid email",
    invalidCompany: lang === "fi" ? "Anna yrityksen nimi (1-160 merkkiä)" : lang === "sv" ? "Ange företagsnamn (1-160 tecken)" : "Please enter a company (1-160 chars)",
  };

  const signupMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("No event selected");
      const trimmedName = fullName.trim();
      const trimmedCompany = company.trim();
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedName.length < 1 || trimmedName.length > 120) {
        throw new Error(lang === "fi" ? "Anna nimi (1-120 merkkiä)" : lang === "sv" ? "Ange namn (1-120 tecken)" : "Please enter a name (1-120 chars)");
      }
      if (trimmedCompany.length < 1 || trimmedCompany.length > 160) {
        throw new Error(labels.invalidCompany);
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) || trimmedEmail.length > 255) {
        throw new Error(labels.invalidEmail);
      }
      const trimmedPhone = phone.trim();
      const { error } = await supabase.from("event_signups").insert({
        event_id: event.id,
        full_name: trimmedName,
        company: trimmedCompany,
        email: trimmedEmail,
        phone: trimmedPhone || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: labels.success });
      queryClient.invalidateQueries({ queryKey: ["rsvp-counts"] });
      setFullName("");
      setCompany("");
      setEmail("");
      setPhone("");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={!!event} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{labels.title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            signupMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Label className="font-body text-sm">{labels.name} *</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={120}
              className="font-body"
            />
          </div>
          <div>
            <Label className="font-body text-sm">{labels.company} *</Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              maxLength={160}
              className="font-body"
            />
          </div>
          <div>
            <Label className="font-body text-sm">{labels.email} *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="font-body"
            />
          </div>
          <div>
            <Label className="font-body text-sm">{labels.phone}</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={40}
              className="font-body"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="bg-gradient-storm hover:opacity-90 font-body"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? "..." : labels.submit}
            </Button>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="font-body">
              {labels.cancel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Events = () => {
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const isAdmin = useIsAdmin();
  const isSuperadmin = useIsSuperadmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Tables<"events"> | null>(null);
  const [guestSignupEvent, setGuestSignupEvent] = useState<Tables<"events"> | null>(null);

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
      const { data: result, error } = await supabase.functions.invoke("manage-event", {
        body: { action: "delete", id: eventId },
      });
      if (error) throw error;
      if ((result as { error?: string })?.error) throw new Error((result as { error: string }).error);
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
  const pastEvents = (events?.filter((e) => isPast(new Date(e.starts_at))) ?? [])
    .slice()
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

  const upcomingLabel = lang === "fi" ? "Tulevat" : lang === "sv" ? "Kommande" : "Upcoming";
  const pastLabel = lang === "fi" ? "Menneet" : lang === "sv" ? "Tidigare" : "Past";
  const noPastLabel = lang === "fi"
    ? "Ei aiempia tapahtumia vielä."
    : lang === "sv"
      ? "Inga tidigare evenemang ännu."
      : "No past events yet.";

  const getRsvpStatus = (eventId: string) => {
    return myRsvps?.find((r) => r.event_id === eventId)?.status;
  };

  const renderEventCard = (event: Tables<"events">, isPastEvent = false) => {
    const config = eventTypeConfig[event.event_type] || eventTypeConfig.meetup;
    const Icon = config.icon;
    const rsvpStatus = getRsvpStatus(event.id);
    const attendeeCount = rsvpCounts?.[event.id] ?? 0;
    const isFull = event.max_attendees ? attendeeCount >= event.max_attendees : false;
    const e = event as LocalizedEvent;
    const localizedTitle = localizedEventValue(e, lang, "title");
    const localizedDescription = localizedEventValue(e, lang, "description");
    const localizedLocation = localizedEventValue(e, lang, "location");
    const localizedAgenda = localizedEventValue(e, lang, "agenda");
    const speakers = parseSpeakers(e.speakers);
    const sponsors = parseSponsors(e.sponsors);
    const partnerCompanies = sponsors.filter((s) => s.kind === "partner");
    const sponsorCompanies = sponsors.filter((s) => s.kind === "sponsor");
    const speakersLabel = lang === "fi" ? "Puhujat" : lang === "sv" ? "Talare" : "Speakers";
    const partnersLabel = lang === "fi" ? "Yhteistyössä" : lang === "sv" ? "I samarbete med" : "In cooperation with";
    const sponsorsLabel = lang === "fi" ? "Sponsorit" : lang === "sv" ? "Sponsorer" : "Sponsors";

    return (
      <div
        key={event.id}
        className={`bg-card border border-border rounded-2xl overflow-hidden transition-colors ${
          isPastEvent ? "" : "hover:border-primary/30"
        }`}
      >
        {/* Cover image */}
        {event.image_url && !isPastEvent && (
          <div className="w-full aspect-video bg-muted">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Date block */}
          {!isPastEvent && (
            <div className="flex-shrink-0 w-20 text-center">
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground font-body uppercase">
                  {format(new Date(event.starts_at), "MMM", { 
                    locale: lang === "fi" ? fi : 
                            lang === "sv" ? sv : enUS 
                  })}
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
              {(isSuperadmin || event.created_by === user?.id) && (
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
              {localizedTitle}
            </h2>
            {!isPastEvent && localizedDescription && (
              <p className="text-sm text-muted-foreground font-body mb-4">
                {localizedDescription}
              </p>
            )}
            {!isPastEvent && localizedAgenda && (
              <div className="mb-4 bg-muted/40 border border-border rounded-lg p-3">
                <p className="text-xs font-display font-semibold uppercase tracking-wider text-foreground mb-2">
                  {t("events.agenda")}
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground font-body">
                  {localizedAgenda.split("\n").filter((l) => l.trim()).map((line, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-turquoise shrink-0">•</span>
                      <span>{line.replace(/^[-*•]\s*/, "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!isPastEvent && speakers.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-display font-semibold uppercase tracking-wider text-foreground mb-2 flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-turquoise" /> {speakersLabel}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {speakers.map((sp, i) => (
                    <div key={i} className="flex items-center gap-3 bg-muted/40 border border-border rounded-lg p-2">
                      {sp.image_url ? (
                        <img src={sp.image_url} alt={sp.name} className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-display text-sm font-semibold text-foreground truncate">{sp.name}</p>
                        {(sp.title || sp.company) && (
                          <p className="text-xs text-muted-foreground font-body truncate flex items-center gap-1">
                            {sp.title}
                            {sp.title && sp.company && <span aria-hidden>·</span>}
                            {sp.company && (
                              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{sp.company}</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isPastEvent && (partnerCompanies.length > 0 || sponsorCompanies.length > 0) && (
              <div className="mb-4 space-y-3">
                {[
                  { label: partnersLabel, list: partnerCompanies },
                  { label: sponsorsLabel, list: sponsorCompanies },
                ].filter((g) => g.list.length > 0).map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {group.list.map((sp, i) => {
                        const inner = sp.logo_url ? (
                          <img
                            src={sp.logo_url}
                            alt={sp.name}
                            title={sp.name}
                            className="h-10 max-w-[140px] object-contain"
                          />
                        ) : (
                          <span className="font-display text-sm font-semibold text-foreground">{sp.name}</span>
                        );
                        return sp.url ? (
                          <a
                            key={i}
                            href={sp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-background border border-border rounded-md px-3 py-2 hover:border-primary/40 transition-colors"
                          >
                            {inner}
                          </a>
                        ) : (
                          <div key={i} className="bg-background border border-border rounded-md px-3 py-2">
                            {inner}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-body mb-4">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {isPastEvent
                  ? format(new Date(event.starts_at), "MMM dd, yyyy", { 
                      locale: lang === "fi" ? fi : 
                              lang === "sv" ? sv : enUS 
                    })
                  : (
                    <>
                      {format(new Date(event.starts_at), "HH:mm")}
                      {event.ends_at && ` – ${format(new Date(event.ends_at), "HH:mm")}`}
                    </>
                  )}
              </span>
              {localizedLocation && (
                <a
                  href={googleMapsUrl(localizedLocation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {localizedLocation}
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

            {/* Sign up CTAs - upcoming only */}
            {!isPastEvent && (() => {
              const requiresSignin = (event as { requires_signin?: boolean | null }).requires_signin ?? true;
              const signUpLabel = lang === "fi"
                ? "Ilmoittaudu tapahtumaan"
                : lang === "sv"
                ? "Anmäl dig till evenemanget"
                : "Sign up for the event";
              const signedUpLabel = lang === "fi"
                ? "Olet ilmoittautunut"
                : lang === "sv"
                ? "Du är anmäld"
                : "You're signed up";
              const fullLabel = lang === "fi" ? "Täynnä" : lang === "sv" ? "Fullt" : "Full";

              // Open event: anyone can sign up via guest form
              if (!requiresSignin) {
                return (
                  <Button
                    size="sm"
                    className="bg-gradient-storm hover:opacity-90 font-body"
                    onClick={() => setGuestSignupEvent(event)}
                    disabled={isFull}
                  >
                    {isFull ? fullLabel : signUpLabel}
                  </Button>
                );
              }

              // Members-only: must sign in
              if (!user) {
                return (
                  <Button asChild size="sm" className="bg-gradient-storm hover:opacity-90 font-body">
                    <Link to="/auth">
                      {lang === "fi"
                        ? "Kirjaudu ilmoittautuaksesi"
                        : lang === "sv"
                        ? "Logga in för att anmäla dig"
                        : "Sign in to sign up"}
                    </Link>
                  </Button>
                );
              }

              if (rsvpStatus === "going") {
                return (
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="bg-accent text-accent-foreground font-body" disabled>
                      <CheckCircle className="h-4 w-4 mr-1" /> {signedUpLabel}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="font-body text-xs"
                      onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "cancelled" })}
                      disabled={rsvpMutation.isPending}
                    >
                      {t("events.cancel")}
                    </Button>
                  </div>
                );
              }

              return (
                <Button
                  size="sm"
                  className="bg-gradient-storm hover:opacity-90 font-body"
                  onClick={() => rsvpMutation.mutate({ eventId: event.id, status: "going" })}
                  disabled={rsvpMutation.isPending || isFull}
                >
                  {isFull ? fullLabel : signUpLabel}
                </Button>
              );
            })()}

            {isPastEvent && (
              <EventPresentationsViewer
                eventId={event.id}
                lang={lang}
                hasAccess={!!user}
              />
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
        title={`${t("events.tag")} — <Good Vibes Café/>`}
        description={t("events.subtitle")}
      />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <HeroAvatar src={mascotEvents} alt="<Good Vibes Café/> events mascot" />
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-3">
              {t("events.tag")}
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground tracking-[-0.02em]">
              {t("events.title")} <span className="text-gradient-surge">{t("events.titleHighlight")}</span>
            </h1>
            <p className="mt-4 text-muted-foreground font-body text-lg max-w-xl mx-auto">
              {t("events.subtitle")}
            </p>
            {isSuperadmin && (
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
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto mb-6">
                <TabsTrigger value="upcoming">
                  {upcomingLabel} {upcomingEvents.length > 0 && `(${upcomingEvents.length})`}
                </TabsTrigger>
                <TabsTrigger value="past">
                  {pastLabel} {pastEvents.length > 0 && `(${pastEvents.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => renderEventCard(event))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card border border-border rounded-2xl">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground font-body">No upcoming events. Check back soon!</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past">
                {pastEvents.length > 0 ? (
                  <div className="space-y-4 opacity-80">
                    {pastEvents.map((event) => renderEventCard(event, true))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-card border border-border rounded-2xl">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground font-body">{noPastLabel}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            </>
          )}
        </div>
      </section>

      {/* Create dialog */}
      {createOpen && (
        <EventFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}

      {/* Guest signup dialog (open events) */}
      <GuestSignupDialog
        event={guestSignupEvent}
        onOpenChange={(open) => { if (!open) setGuestSignupEvent(null); }}
      />
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
