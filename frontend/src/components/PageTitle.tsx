import { HelpCircleIcon } from "lucide-react";

const PageTitle = (props: { title: string; subtitle?: string }) => {
  const { title, subtitle } = props;
  return (
    <div className="space-y-1">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm md:text-base text-gray-500">{subtitle}</p>}
    </div>
  );
};

export default PageTitle;
