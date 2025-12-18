import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CalendarRange, Copy, Edit } from "lucide-react";
import { ENV } from "@/lib/get-env";
import { cn } from "@/lib/utils";
import { FC, useState } from "react";
import { toast } from "sonner";

interface PropsType {
  id: string;
  title: string;
  slug: string;
  duration: number;
  isPrivate: boolean;
  username: string;
  isPending: boolean;
  onToggle: () => void;
}

const EventCard: FC<PropsType> = ({
  title,
  duration,
  slug,
  isPrivate = false,
  username,
  isPending,
  onToggle,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const event_link = `${ENV.VITE_APP_ORIGIN}/${username}/${slug}`;

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(event_link)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success("Event link copied");
      })
      .catch((error) => {
        console.error("Failed to copy link:", error);
      });
  };
  return (
    <Card className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900">
            {title}
          </h3>
          
          {/* Duration */}
          <p className="text-sm text-gray-500">
            {duration} min
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              disabled={isPrivate}
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
      </CardContent>
    </Card>
  );
};

export default EventCard;
