import * as React from "react";
import { NavLink, useMatch, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Laptop,
    Users,
    UserRoundCog,
    ClipboardList,
    LogOut,
    Settings,
    ChevronRight,
    Building2,
    Tag,
    Truck,
    Upload,
    FileSpreadsheet,
    List,
    Receipt,
    FileText,
    Building,
} from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    SidebarSeparator,
    useSidebar,
} from "@/components/ui/sidebar";
import ManageDepartmentsModal from "@/layouts/menu/ManageDepartmentsModal";
import ManageBrandsModelsModal from "@/layouts/menu/ManageBrandsModelsModal";
import ManageSuppliersModal from "@/layouts/menu/ManageSuppliersModal";
import ManageEmployeesModal from "@/layouts/menu/ManageEmployeesModal";
import ManageBranchesModal from "@/layouts/menu/ManageBranchesModal";

const SECTIONS_STORAGE_KEY = "sidebar-sections";
const DEFAULT_SECTIONS = {
    equipment: false,
    maintenance: false,
    bulkActions: false,
    reports: false,
};

function readStoredSections() {
    try {
        const raw = localStorage.getItem(SECTIONS_STORAGE_KEY);
        if (!raw) return DEFAULT_SECTIONS;
        return { ...DEFAULT_SECTIONS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_SECTIONS;
    }
}

function NavItem({ to, end, icon: Icon, label, onNavigate }) {
    const match = useMatch({ path: to, end: !!end });

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={!!match}
                className="gap-1.5 py-2 data-[active=true]:bg-[var(--sidebar-active-bg)]">
                <NavLink to={to} end={end} onClick={onNavigate}>
                    <Icon />
                    <span>{label}</span>
                </NavLink>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

function NavSubItem({ to, end, icon: Icon, label, onNavigate }) {
    const match = useMatch({ path: to, end: !!end });

    return (
        <SidebarMenuSubItem>
            <SidebarMenuSubButton asChild isActive={!!match}
                className="gap-1.5 py-2 data-[active=true]:bg-[var(--sidebar-active-bg)]">
                <NavLink to={to} end={end} onClick={onNavigate}>
                    <Icon />
                    <span>{label}</span>
                </NavLink>
            </SidebarMenuSubButton>
        </SidebarMenuSubItem>
    );
}

// Sub-items that trigger an action (e.g. opening a modal) instead of navigating.
// Renders a real <button>, not an <a> — SidebarMenuSubButton defaults to an
// anchor tag, and an anchor with no href isn't keyboard-focusable and isn't
// announced as interactive by assistive tech.
function NavSubAction({ icon: Icon, label, onClick }) {
    return (
        <SidebarMenuSubItem>
            <SidebarMenuSubButton asChild className="w-full gap-1.5 py-2 cursor-pointer">
                <button type="button" onClick={onClick}>
                    <Icon />
                    <span>{label}</span>
                </button>
            </SidebarMenuSubButton>
        </SidebarMenuSubItem>
    );
}

function NavSection({ icon: Icon, label, open, onOpenChange, children }) {
    return (
        <Collapsible
            open={open}
            onOpenChange={onOpenChange}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                        <Icon />
                        <span>{label}</span>
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>{children}</SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

export function AppSidebar(props) {
    const navigate = useNavigate();
    const { setOpenMobile } = useSidebar();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.role_id === 1;

    const [sections, setSections] = React.useState(readStoredSections);
    const toggleSection = (key) => (open) => {
        setSections((prev) => {
            const next = { ...prev, [key]: open };
            localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    const [showBranchesModal, setShowBranchesModal] = React.useState(false);
    const [showDepartmentsModal, setShowDepartmentsModal] = React.useState(false);
    const [showBrandsModelsModal, setShowBrandsModelsModal] = React.useState(false);
    const [showSuppliersModal, setShowSuppliersModal] = React.useState(false);
    const [showEmployeesModal, setShowEmployeesModal] = React.useState(false);

    const closeMobile = () => setOpenMobile(false);

    const handleLogout = async () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <div className="px-2 py-1.5 overflow-hidden">
                    <h1 className="text-sm font-bold whitespace-nowrap">
                        IT Inventory
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                        {user.first_name} {user.last_name}
                    </p>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        <NavItem
                            to="/dashboard"
                            icon={LayoutDashboard}
                            label="Dashboard"
                            onNavigate={closeMobile}
                        />

                        <NavSection
                            icon={Laptop}
                            label="Equipment"
                            open={sections.equipment}
                            onOpenChange={toggleSection("equipment")}
                        >
                            <NavSubItem
                                to="/equipment"
                                end
                                icon={List}
                                label="List"
                                onNavigate={closeMobile}
                            />
                            <NavSubItem
                                to="/equipment/receipts"
                                icon={Receipt}
                                label="Receipts"
                                onNavigate={closeMobile}
                            />
                            <NavSubItem
                                to="/assignments"
                                icon={ClipboardList}
                                label="Assignments"
                                onNavigate={closeMobile}
                            />
                        </NavSection>

                        <NavItem
                            to="/employees"
                            icon={Users}
                            label="Employees"
                            onNavigate={closeMobile}
                        />

                        {isAdmin && (
                            <NavSection
                                icon={Settings}
                                label="Maintenance"
                                open={sections.maintenance}
                                onOpenChange={toggleSection("maintenance")}
                            >
                                <NavSubAction icon={Building} label="Branches" onClick={() => setShowBranchesModal(true)} />
                                <NavSubAction icon={Building2} label="Departments" onClick={() => setShowDepartmentsModal(true)} />
                                <NavSubAction icon={Tag} label="Brands & Models" onClick={() => setShowBrandsModelsModal(true)} />
                                <NavSubAction icon={Truck} label="Suppliers" onClick={() => setShowSuppliersModal(true)} />
                                <NavSubAction icon={UserRoundCog} label="Employees" onClick={() => setShowEmployeesModal(true)} />
                            </NavSection>
                        )}

                        {isAdmin && (
                            <NavSection
                                icon={Upload}
                                label="Bulk Actions"
                                open={sections.bulkActions}
                                onOpenChange={toggleSection("bulkActions")}
                            >
                                <NavSubItem
                                    to="/bulk-import"
                                    icon={FileSpreadsheet}
                                    label="Bulk Import"
                                    onNavigate={closeMobile}
                                />
                            </NavSection>
                        )}

                        {isAdmin && (
                            <NavSection
                                icon={FileText}
                                label="Generate Reports"
                                open={sections.reports}
                                onOpenChange={toggleSection("reports")}
                            >
                                <NavSubItem
                                    to="/reports-equipment"
                                    icon={Laptop}
                                    label="Equipment Reports"
                                    onNavigate={closeMobile}
                                />
                            </NavSection>
                        )}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarSeparator />
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleLogout}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 active:text-destructive active:bg-destructive/10"
                        >
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />

            {showBranchesModal && (
                <ManageBranchesModal onClose={() => setShowBranchesModal(false)} />
            )}
            {showDepartmentsModal && (
                <ManageDepartmentsModal
                    onClose={() => setShowDepartmentsModal(false)}
                />
            )}
            {showBrandsModelsModal && (
                <ManageBrandsModelsModal
                    onClose={() => setShowBrandsModelsModal(false)}
                />
            )}
            {showSuppliersModal && (
                <ManageSuppliersModal onClose={() => setShowSuppliersModal(false)} />
            )}
            {showEmployeesModal && (
                <ManageEmployeesModal onClose={() => setShowEmployeesModal(false)} />
            )}
        </Sidebar>
    );
}
