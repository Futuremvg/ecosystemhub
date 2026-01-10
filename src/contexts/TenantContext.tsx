import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string | null;
  owner_name: string | null;
  owner_email: string | null;
  phone: string | null;
  address: string | null;
  business_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  tenantId: string | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  userTenantRole: string | null;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Function to detect tenant from current domain
function detectTenantFromDomain(): { slug?: string; customDomain?: string } {
  const hostname = window.location.hostname;
  
  // Skip tenant detection for localhost and lovable domains
  if (hostname === "localhost" || hostname.includes("lovable.app") || hostname.includes("lovable.dev")) {
    return {};
  }
  
  // Check if it's a subdomain (e.g., tenant.yourapp.com)
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    // Subdomain pattern
    return { slug: parts[0] };
  }
  
  // Custom domain (e.g., tenant.com)
  return { customDomain: hostname };
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userTenantRole, setUserTenantRole] = useState<string | null>(null);

  const fetchTenant = async () => {
    if (!user) {
      setTenant(null);
      setTenantId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Check if user is super admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsSuperAdmin(!!roleData);

      // Try to detect tenant from domain first
      const { slug, customDomain } = detectTenantFromDomain();
      
      let tenantData: Tenant | null = null;

      if (slug) {
        // Fetch tenant by slug
        const { data } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", slug)
          .eq("is_active", true)
          .maybeSingle();
        tenantData = data;
      } else if (customDomain) {
        // Fetch tenant by custom domain
        const { data } = await supabase
          .from("tenants")
          .select("*")
          .eq("custom_domain", customDomain)
          .eq("is_active", true)
          .maybeSingle();
        tenantData = data;
      } else {
        // Fallback: get tenant from user_tenants
        const { data: userTenantData } = await supabase
          .from("user_tenants")
          .select("tenant_id, role, tenants(*)")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (userTenantData) {
          setUserTenantRole(userTenantData.role);
          // Cast the tenants data properly
          const tenantsData = userTenantData.tenants as unknown as Tenant;
          tenantData = tenantsData;
        }
      }

      if (tenantData) {
        setTenant(tenantData);
        setTenantId(tenantData.id);
        
        // Get user role in this tenant if not already set
        if (!userTenantRole) {
          const { data: roleInTenant } = await supabase
            .from("user_tenants")
            .select("role")
            .eq("user_id", user.id)
            .eq("tenant_id", tenantData.id)
            .maybeSingle();
          
          setUserTenantRole(roleInTenant?.role || null);
        }
      }
    } catch (error) {
      console.error("Error fetching tenant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [user]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantId,
        isLoading,
        isSuperAdmin,
        userTenantRole,
        refreshTenant: fetchTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
