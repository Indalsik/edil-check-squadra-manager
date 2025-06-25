
import { Calendar, Clock, Home, MapPin, Users, Wallet, FileText, Settings } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Dashboard",
    section: "dashboard",
    icon: Home,
  },
  {
    title: "Operai",
    section: "workers",
    icon: Users,
  },
  {
    title: "Ore di Lavoro",
    section: "timetracking",
    icon: Clock,
  },
  {
    title: "Permessi",
    section: "permissions",
    icon: Calendar,
  },
  {
    title: "Cantieri",
    section: "sites",
    icon: MapPin,
  },
  {
    title: "Pagamenti",
    section: "payments",
    icon: Wallet,
  },
  {
    title: "Archivio",
    section: "archive",
    icon: FileText,
  },
  {
    title: "Impostazioni",
    section: "settings",
    icon: Settings,
  },
]

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Edil-check</h1>
            <p className="text-xs text-sidebar-foreground/70">Gestione Operai</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80 text-xs font-semibold uppercase tracking-wider">
            Menu Principale
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-4">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => onSectionChange(item.section)}
                    isActive={activeSection === item.section}
                    className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 px-3 py-2">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
