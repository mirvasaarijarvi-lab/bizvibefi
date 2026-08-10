import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { safeUrl } from "@/lib/safeUrl";
import {
  RECRUITMENT_TYPE_LABELS,
  type RecruitmentPost,
} from "@/hooks/useRecruitment";
import {
  Briefcase,
  GraduationCap,
  UserSearch,
  MapPin,
  Globe,
  Mail,
  ExternalLink,
  MessageSquare,
  Clock,
} from "lucide-react";

const TYPE_ICON = {
  open_position: Briefcase,
  training: GraduationCap,
  seeking_work: UserSearch,
} as const;

interface Props {
  post: RecruitmentPost;
  authorName?: string | null;
}

const RecruitmentPostCard = ({ post, authorName }: Props) => {
  const Icon = TYPE_ICON[post.type];
  const { user } = useAuth();
  const { toast } = useToast();
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const applyHref = safeUrl(post.apply_url ?? "");

  const sendContact = async () => {
    if (!user) return;
    if (message.trim().length < 5) {
      toast({ title: "Please write a short message", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_requests").insert({
      from_user_id: user.id,
      to_user_id: post.user_id,
      message: `[${RECRUITMENT_TYPE_LABELS[post.type]}: ${post.title}] ${message.trim()}`,
    } as never);
    setSending(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Message sent", description: "The poster has received your message." });
    setContactOpen(false);
    setMessage("");
  };

  return (
    <article className="bg-card border border-border rounded-xl p-6 flex flex-col hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-5 w-5 text-primary shrink-0" />
          <Badge variant="secondary" className="font-body text-xs">
            {RECRUITMENT_TYPE_LABELS[post.type]}
          </Badge>
        </div>
        {post.expires_at && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-body shrink-0">
            <Clock className="h-3 w-3" /> until {post.expires_at}
          </span>
        )}
      </div>

      <h3 className="font-display text-lg font-bold tracking-[-0.01em] break-words">
        {post.title}
      </h3>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground font-body">
        {post.organization && <span className="break-words">{post.organization}</span>}
        {post.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {post.location}
          </span>
        )}
        {post.is_remote && (
          <span className="inline-flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" /> Remote
          </span>
        )}
        {post.employment_type && <span>{post.employment_type}</span>}
      </div>

      <p className="mt-3 text-sm text-muted-foreground font-body whitespace-pre-line break-words">
        {post.description}
      </p>

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="font-body text-[11px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center gap-2">
        {applyHref && (
          <Button size="sm" variant="default" asChild className="font-body">
            <a href={applyHref} target="_blank" rel="noopener noreferrer">
              Apply <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}
        {post.apply_email && (
          <Button size="sm" variant="outline" asChild className="font-body">
            <a href={`mailto:${post.apply_email}`}>
              <Mail className="mr-1 h-3.5 w-3.5" /> Email
            </a>
          </Button>
        )}
        {post.allow_contact_request &&
          (user ? (
            user.id !== post.user_id && (
              <Button
                size="sm"
                variant="outline"
                className="font-body"
                onClick={() => setContactOpen(true)}
              >
                <MessageSquare className="mr-1 h-3.5 w-3.5" /> Message poster
              </Button>
            )
          ) : (
            <Button size="sm" variant="outline" asChild className="font-body">
              <Link to="/auth">Sign in to contact</Link>
            </Button>
          ))}
        {authorName && (
          <Link
            to={`/members/${post.user_id}`}
            className="ml-auto text-xs font-body text-muted-foreground hover:text-foreground"
          >
            Posted by {authorName}
          </Link>
        )}
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Message the poster</DialogTitle>
            <DialogDescription className="font-body">
              Your message is delivered to their <Good Vibes Café/> inbox along with the post title.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Introduce yourself and explain why you are a fit."
            rows={5}
            maxLength={1000}
            className="font-body"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactOpen(false)} className="font-body">
              Cancel
            </Button>
            <Button onClick={sendContact} disabled={sending} className="font-body">
              {sending ? "Sending..." : "Send message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
};

export default RecruitmentPostCard;
