import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { useStore } from "@/store/store";
import { AUTH_ROUTES } from "@/routes/common/routePaths";
import { SidebarTrigger } from "./ui/sidebar";
import { ThemeToggle } from "./theme-toggle";

const Header = () => {
  const navigate = useNavigate();
  const { user, setAccessToken, setUser } = useStore();

  const onLogout = () => {
    setUser(null);
    setAccessToken(null);

    navigate(AUTH_ROUTES.SIGN_IN);
  };

  return (
    <header className="flex min-h-12 pt-3 pb-4 shrink-0 items-center transition-[width,height] ease-linear">
      <div className="w-full flex items-center justify-between !px-3 md:!px-4">
        <div className="flex items-center gap-2 md:gap-4">
          <SidebarTrigger
            className={`cursor-pointer hidden lg:flex
               bg-background border transform`}
          />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 !cursor-pointer">
              <Avatar className="!active:border-1 active:border-primary h-8 w-8 md:h-10 md:w-10">
                <AvatarFallback className="bg-muted uppercase text-sm md:text-base">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 !fill-foreground hidden md:block" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="!w-[280px] !rounded-lg !p-[8px_0] bg-card border-border"
          >
            <div
              role="menu"
              style={{
                maxHeight: "calc(100vh - 200px)",
                overflowY: "auto",
              }}
            >
              <div className="!pb-2">
                <div className="flex flex-col !p-[8px_16px]">
                  <h3 className="capitalize text-lg font-semibold">{user?.name}</h3>
                  <p className="text-muted-foreground !text-sm !font-normal">
                    Teams free trial
                  </p>
                </div>
              </div>
              <Separator />
              <div className="!pt-2">
                <div className="!p-[12px_16px_4px]">
                  <h3 className="text-xs font-semibold !tracking-[0.1em] text-muted-foreground uppercase">
                    Account setting
                  </h3>
                </div>

                <button
                  role="menuitem"
                  className="!p-[12px_16px] w-full cursor-pointer font-medium text-sm text-foreground 
                  flex items-center gap-2 hover:!bg-accent transition-colors"
                  onClick={onLogout}
                >
                  <LogOutIcon className="w-4 h-4 transform rotate-180 !stroke-2" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        </div>
      </div>
    </header>
  );
};

export default Header;
