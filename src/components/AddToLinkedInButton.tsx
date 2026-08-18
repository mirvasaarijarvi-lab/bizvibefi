import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { Button } from "@/components/ui/button";
import { linkedInAddToProfileUrl } from "@/lib/certificate";

interface Props {
  name: string;
  issueDate: string | Date;
  certUrl?: string;
  certId?: string;
  className?: string;
  size?: "sm" | "default";
  label?: string;
}

/**
 * "Add to LinkedIn Profile" button.
 * Sends the user to LinkedIn's certification add flow,
 * pre-filled with {"<Good Vibes Café/>"} as the issuing organization.
 */
const AddToLinkedInButton = ({ name, issueDate, certUrl, certId, className, size = "sm", label = "Add to LinkedIn" }: Props) => {
  const d = typeof issueDate === "string" ? new Date(issueDate) : issueDate;
  const url = linkedInAddToProfileUrl({
    name,
    organizationName: "<Good Vibes Café/>",
    issueYear: d.getFullYear(),
    issueMonth: d.getMonth() + 1,
    certUrl,
    certId,
  });
  return (
    <Button asChild variant="outline" size={size} className={className}>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <LinkedInIcon className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );
};

export default AddToLinkedInButton;
