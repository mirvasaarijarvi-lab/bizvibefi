import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, Globe, Users, Clock, CheckCircle, Zap,
  Video, Wrench, Rocket
} from "lucide-react";
import { format, isPast } from "date-fns";

const eventTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  meetup: { label: "Meetup", icon: Users, color: "bg-accent/10 text-accent" },
  webinar: { label: "Webinar", icon: Video, color: "bg-secondary/10 text-secondary" },
  workshop: { label: "Workshop", icon: Wrench, color: "bg-primary/10 text-primary" },
  hackathon: { label: "Hackathon", icon: Rocket, color: "bg-destructive/10 text-destructive" },
};

const Events = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          const { error } = await supabase
            .from("event_rsvps")
            .delete()
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("event_rsvps")
            .update({ status })
            .eq("id", existing.id);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert({ event_id: eventId, user_id: user.id, status });
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

  const upcomingEvents = events?.filter((e) => !isPast(new Date(e.starts_at))) ?? [];
  const pastEvents = events?.filter((e) => isPast(new Date(e.starts_at))) ?? [];

  const getRsvpStatus = (eventId: string) => {
    return myRsvps?.find((r) => r.event_id === eventId)?.status;
  };

  return (
    <Layout>
      <PageMeta
        title="Events — BizVibe"
        description="Join BizVibe meetups, webinars, workshops, and hackathons. Connect with builders and grow together."
      />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-body text-sm font-semibold text-turquoise tracking-widest uppercase mb-3">
              Events
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground tracking-[-0.02em]">
              What's <span className="text-gradient-surge">happening</span>
            </h1>
            <p className="mt-4 text-muted-foreground font-body text-lg max-w-xl mx-auto">
              Meetups, webinars, workshops, and hackathons. Show up, build, connect.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Upcoming Events */}
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4 mb-12">
                  {upcomingEvents.map((event) => {
                    const config = eventTypeConfig[event.event_type] || eventTypeConfig.meetup;
                    const Icon = config.icon;
                    const rsvpStatus = getRsvpStatus(event.id);
                    const attendeeCount = rsvpCounts?.[event.id] ?? 0;
                    const isFull = event.max_attendees ? attendeeCount >= event.max_attendees : false;

                    return (
                      <div
                        key={event.id}
                        className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Date block */}
                          <div className="flex-shrink-0 w-20 text-center">
                            <div className="bg-muted rounded-xl p-3">
                              <p className="text-xs text-muted-foreground font-body uppercase">
                                {format(new Date(event.starts_at), "MMM")}
                              </p>
                              <p className="text-2xl font-display font-bold text-foreground">
                                {format(new Date(event.starts_at), "dd")}
                              </p>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className={`${config.color} border-0 font-body text-xs`}>
                                <Icon className="h-3 w-3 mr-1" />
                                {config.label}
                              </Badge>
                              {event.is_online && (
                                <Badge variant="outline" className="font-body text-xs">
                                  <Globe className="h-3 w-3 mr-1" /> Online
                                </Badge>
                              )}
                            </div>

                            <h2 className="font-display text-xl font-bold text-foreground mb-2">
                              {event.title}
                            </h2>
                            <p className="text-sm text-muted-foreground font-body mb-4">
                              {event.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-body mb-4">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {format(new Date(event.starts_at), "HH:mm")}
                                {event.ends_at && ` – ${format(new Date(event.ends_at), "HH:mm")}`}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {event.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {attendeeCount} going
                                {event.max_attendees && ` / ${event.max_attendees} spots`}
                              </span>
                            </div>

                            {/* RSVP buttons */}
                            {user ? (
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
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-card border border-border rounded-2xl mb-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-body">No upcoming events. Check back soon!</p>
                </div>
              )}

              {/* Past Events */}
              {pastEvents.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground mb-4">Past Events</h2>
                  <div className="space-y-3 opacity-60">
                    {pastEvents.map((event) => {
                      const config = eventTypeConfig[event.event_type] || eventTypeConfig.meetup;
                      const Icon = config.icon;
                      return (
                        <div key={event.id} className="bg-card border border-border rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className={`${config.color} border-0 font-body text-xs`}>
                              <Icon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                            <h3 className="font-display font-semibold text-foreground">{event.title}</h3>
                            <span className="text-xs text-muted-foreground font-body ml-auto">
                              {format(new Date(event.starts_at), "MMM dd, yyyy")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Events;
