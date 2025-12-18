import { FC, useState } from "react";
import { Copy, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ENV } from "@/lib/get-env";

interface MinimalEventCardProps {
  id: string;
  title: string;
  slug: string;
  duration: number;
  username: string;
}

const MinimalEventCard: FC<MinimalEventCardProps> = ({
  title,
  duration,
  slug,
  username,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const event_link = `${ENV.VITE_APP_ORIGIN}/${username}/${slug}`;

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(event_link)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success("Link copied");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        
        {/* Duration */}
        <p className="text-sm text-gray-500">{duration} min</p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="h-9 gap-2"
          >
            <Copy className="h-4 w-4" />
            {isCopied ? "Copied!" : "Copy Link"}
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-9 gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MinimalEventCard;

