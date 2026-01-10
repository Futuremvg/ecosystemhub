CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: get_user_tenant_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_tenant_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT tenant_id FROM public.user_tenants 
  WHERE user_id = auth.uid() 
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: has_role(public.app_role, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_role public.app_role, _user_id uuid DEFAULT auth.uid()) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = COALESCE(_user_id, auth.uid()) 
    AND user_id = auth.uid() -- Only allow checking own roles
    AND role = _role
  )
$$;


--
-- Name: is_super_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;


--
-- Name: is_tenant_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_tenant_admin(_tenant_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_tenants
    WHERE user_id = auth.uid() 
      AND tenant_id = _tenant_id 
      AND role = 'admin'
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: user_belongs_to_tenant(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_belongs_to_tenant(_tenant_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_tenants
    WHERE user_id = auth.uid() AND tenant_id = _tenant_id
  )
$$;


SET default_table_access_method = heap;

--
-- Name: command_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.command_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    command text NOT NULL,
    result text,
    success boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    logo_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    parent_id uuid,
    company_type text DEFAULT 'hub'::text NOT NULL,
    tenant_id uuid
);


--
-- Name: company_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    user_id uuid NOT NULL,
    name text NOT NULL,
    account_type text DEFAULT 'checking'::text,
    has_tax boolean DEFAULT false,
    description text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid
);


--
-- Name: company_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    user_id uuid NOT NULL,
    name text NOT NULL,
    company_name text,
    email text,
    phone text,
    address text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid
);


--
-- Name: company_employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    user_id uuid NOT NULL,
    name text NOT NULL,
    role text,
    email text,
    phone text,
    hourly_rate numeric DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid
);


--
-- Name: company_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    user_id uuid NOT NULL,
    name text NOT NULL,
    category text,
    contact_name text,
    email text,
    phone text,
    address text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid,
    CONSTRAINT conversations_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    file_url text,
    file_type text,
    category text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid,
    tenant_id uuid
);


--
-- Name: ecosystem_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecosystem_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    icon text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid,
    tenant_id uuid
);


--
-- Name: ecosystem_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecosystem_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category_id uuid,
    name text NOT NULL,
    url text NOT NULL,
    description text,
    priority text DEFAULT 'medium'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid,
    tenant_id uuid,
    CONSTRAINT ecosystem_links_priority_check CHECK ((priority = ANY (ARRAY['critical'::text, 'high'::text, 'medium'::text, 'low'::text])))
);


--
-- Name: financial_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'expense'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid,
    parent_id uuid,
    icon text DEFAULT 'folder'::text,
    color text DEFAULT '#808080'::text,
    sort_order integer DEFAULT 0,
    tenant_id uuid,
    CONSTRAINT financial_categories_type_check CHECK ((type = ANY (ARRAY['income'::text, 'expense'::text])))
);


--
-- Name: financial_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    source_id uuid,
    category_id uuid,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid,
    tenant_id uuid,
    CONSTRAINT financial_entries_month_check CHECK (((month >= 1) AND (month <= 12)))
);


--
-- Name: financial_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    tax_percentage numeric(5,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    company_id uuid,
    description text,
    color text DEFAULT '#22c55e'::text,
    sort_order integer DEFAULT 0,
    tenant_id uuid
);


--
-- Name: income_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.income_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    custom_domain text,
    logo_url text,
    primary_color text DEFAULT '#d4af37'::text,
    owner_name text,
    owner_email text,
    phone text,
    address text,
    business_type text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: command_logs command_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.command_logs
    ADD CONSTRAINT command_logs_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_accounts company_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_accounts
    ADD CONSTRAINT company_accounts_pkey PRIMARY KEY (id);


--
-- Name: company_clients company_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_clients
    ADD CONSTRAINT company_clients_pkey PRIMARY KEY (id);


--
-- Name: company_employees company_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_employees
    ADD CONSTRAINT company_employees_pkey PRIMARY KEY (id);


--
-- Name: company_providers company_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_providers
    ADD CONSTRAINT company_providers_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: ecosystem_categories ecosystem_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecosystem_categories
    ADD CONSTRAINT ecosystem_categories_pkey PRIMARY KEY (id);


--
-- Name: ecosystem_links ecosystem_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecosystem_links
    ADD CONSTRAINT ecosystem_links_pkey PRIMARY KEY (id);


--
-- Name: financial_categories financial_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_categories
    ADD CONSTRAINT financial_categories_pkey PRIMARY KEY (id);


--
-- Name: financial_entries financial_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_pkey PRIMARY KEY (id);


--
-- Name: financial_sources financial_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_sources
    ADD CONSTRAINT financial_sources_pkey PRIMARY KEY (id);


--
-- Name: income_types income_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_types
    ADD CONSTRAINT income_types_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_custom_domain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_custom_domain_key UNIQUE (custom_domain);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_key UNIQUE (slug);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_tenants user_tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tenants
    ADD CONSTRAINT user_tenants_pkey PRIMARY KEY (id);


--
-- Name: user_tenants user_tenants_user_id_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tenants
    ADD CONSTRAINT user_tenants_user_id_tenant_id_key UNIQUE (user_id, tenant_id);


--
-- Name: idx_companies_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_parent_id ON public.companies USING btree (parent_id);


--
-- Name: idx_companies_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_tenant_id ON public.companies USING btree (tenant_id);


--
-- Name: idx_companies_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_user_id ON public.companies USING btree (user_id);


--
-- Name: idx_documents_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_company_id ON public.documents USING btree (company_id);


--
-- Name: idx_documents_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_tenant_id ON public.documents USING btree (tenant_id);


--
-- Name: idx_ecosystem_links_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ecosystem_links_company_id ON public.ecosystem_links USING btree (company_id);


--
-- Name: idx_financial_categories_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_categories_parent_id ON public.financial_categories USING btree (parent_id);


--
-- Name: idx_financial_entries_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_entries_company_id ON public.financial_entries USING btree (company_id);


--
-- Name: idx_financial_entries_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_entries_tenant_id ON public.financial_entries USING btree (tenant_id);


--
-- Name: idx_tenants_custom_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenants_custom_domain ON public.tenants USING btree (custom_domain);


--
-- Name: idx_tenants_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenants_slug ON public.tenants USING btree (slug);


--
-- Name: idx_user_tenants_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tenants_tenant_id ON public.user_tenants USING btree (tenant_id);


--
-- Name: idx_user_tenants_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tenants_user_id ON public.user_tenants USING btree (user_id);


--
-- Name: companies update_companies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tenants update_tenants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: command_logs command_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.command_logs
    ADD CONSTRAINT command_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: command_logs command_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.command_logs
    ADD CONSTRAINT command_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: companies companies_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: companies companies_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: companies companies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: company_accounts company_accounts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_accounts
    ADD CONSTRAINT company_accounts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_accounts company_accounts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_accounts
    ADD CONSTRAINT company_accounts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: company_clients company_clients_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_clients
    ADD CONSTRAINT company_clients_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_clients company_clients_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_clients
    ADD CONSTRAINT company_clients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: company_employees company_employees_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_employees
    ADD CONSTRAINT company_employees_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_employees company_employees_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_employees
    ADD CONSTRAINT company_employees_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: company_providers company_providers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_providers
    ADD CONSTRAINT company_providers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_providers company_providers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_providers
    ADD CONSTRAINT company_providers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: documents documents_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: documents documents_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ecosystem_categories ecosystem_categories_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecosystem_categories
    ADD CONSTRAINT ecosystem_categories_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: ecosystem_categories ecosystem_categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecosystem_categories
    ADD CONSTRAINT ecosystem_categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ecosystem_categories ecosystem_categories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecosystem_categories
    ADD CONSTRAINT ecosystem_categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ecosystem_links ecosystem_links_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecosystem_links
    ADD CONSTRAINT ecosystem_links_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.ecosystem_categories(id) ON DELETE CASCADE;


--
-- Name: ecosystem_links ecosystem_links_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecosystem_links
    ADD CONSTRAINT ecosystem_links_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: ecosystem_links ecosystem_links_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecosystem_links
    ADD CONSTRAINT ecosystem_links_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: ecosystem_links ecosystem_links_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecosystem_links
    ADD CONSTRAINT ecosystem_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: financial_categories financial_categories_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_categories
    ADD CONSTRAINT financial_categories_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: financial_categories financial_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_categories
    ADD CONSTRAINT financial_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.financial_categories(id) ON DELETE CASCADE;


--
-- Name: financial_categories financial_categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_categories
    ADD CONSTRAINT financial_categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: financial_categories financial_categories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_categories
    ADD CONSTRAINT financial_categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: financial_entries financial_entries_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.financial_categories(id) ON DELETE SET NULL;


--
-- Name: financial_entries financial_entries_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: financial_entries financial_entries_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.financial_sources(id) ON DELETE SET NULL;


--
-- Name: financial_entries financial_entries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: financial_entries financial_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_entries
    ADD CONSTRAINT financial_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: financial_sources financial_sources_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_sources
    ADD CONSTRAINT financial_sources_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: financial_sources financial_sources_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_sources
    ADD CONSTRAINT financial_sources_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: financial_sources financial_sources_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_sources
    ADD CONSTRAINT financial_sources_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: income_types income_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_types
    ADD CONSTRAINT income_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: income_types income_types_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.income_types
    ADD CONSTRAINT income_types_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_tenants user_tenants_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tenants
    ADD CONSTRAINT user_tenants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenants Super admins can do everything on tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can do everything on tenants" ON public.tenants USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());


--
-- Name: user_tenants Super admins can do everything on user_tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can do everything on user_tenants" ON public.user_tenants USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());


--
-- Name: user_tenants Tenant admins can manage users in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant admins can manage users in their tenant" ON public.user_tenants USING (public.is_tenant_admin(tenant_id)) WITH CHECK (public.is_tenant_admin(tenant_id));


--
-- Name: tenants Tenant admins can update their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tenant admins can update their tenant" ON public.tenants FOR UPDATE USING (public.is_tenant_admin(id));


--
-- Name: company_accounts Users can delete own accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own accounts" ON public.company_accounts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ecosystem_categories Users can delete own categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own categories" ON public.ecosystem_categories FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: company_clients Users can delete own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own clients" ON public.company_clients FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: companies Users can delete own companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own companies" ON public.companies FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: conversations Users can delete own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own conversations" ON public.conversations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: documents Users can delete own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: company_employees Users can delete own employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own employees" ON public.company_employees FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: financial_entries Users can delete own entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own entries" ON public.financial_entries FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: financial_categories Users can delete own financial categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own financial categories" ON public.financial_categories FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: income_types Users can delete own income types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own income types" ON public.income_types FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ecosystem_links Users can delete own links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own links" ON public.ecosystem_links FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: command_logs Users can delete own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own logs" ON public.command_logs FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: company_providers Users can delete own providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own providers" ON public.company_providers FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: financial_sources Users can delete own sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own sources" ON public.financial_sources FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: company_accounts Users can insert own accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own accounts" ON public.company_accounts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ecosystem_categories Users can insert own categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own categories" ON public.ecosystem_categories FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: company_clients Users can insert own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own clients" ON public.company_clients FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: companies Users can insert own companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own companies" ON public.companies FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: conversations Users can insert own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own conversations" ON public.conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: documents Users can insert own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: company_employees Users can insert own employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own employees" ON public.company_employees FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: financial_entries Users can insert own entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own entries" ON public.financial_entries FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: financial_categories Users can insert own financial categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own financial categories" ON public.financial_categories FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: income_types Users can insert own income types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own income types" ON public.income_types FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ecosystem_links Users can insert own links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own links" ON public.ecosystem_links FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: command_logs Users can insert own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own logs" ON public.command_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: company_providers Users can insert own providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own providers" ON public.company_providers FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: financial_sources Users can insert own sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own sources" ON public.financial_sources FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: company_accounts Users can update own accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own accounts" ON public.company_accounts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ecosystem_categories Users can update own categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own categories" ON public.ecosystem_categories FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: company_clients Users can update own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own clients" ON public.company_clients FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: companies Users can update own companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own companies" ON public.companies FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: conversations Users can update own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: documents Users can update own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: company_employees Users can update own employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own employees" ON public.company_employees FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: financial_entries Users can update own entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own entries" ON public.financial_entries FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: financial_categories Users can update own financial categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own financial categories" ON public.financial_categories FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: income_types Users can update own income types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own income types" ON public.income_types FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ecosystem_links Users can update own links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own links" ON public.ecosystem_links FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: command_logs Users can update own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own logs" ON public.command_logs FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: company_providers Users can update own providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own providers" ON public.company_providers FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: financial_sources Users can update own sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own sources" ON public.financial_sources FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: company_accounts Users can view own accounts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own accounts" ON public.company_accounts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ecosystem_categories Users can view own categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own categories" ON public.ecosystem_categories FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: company_clients Users can view own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own clients" ON public.company_clients FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: companies Users can view own companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own companies" ON public.companies FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: conversations Users can view own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: documents Users can view own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: company_employees Users can view own employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own employees" ON public.company_employees FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: financial_entries Users can view own entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own entries" ON public.financial_entries FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: financial_categories Users can view own financial categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own financial categories" ON public.financial_categories FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: income_types Users can view own income types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own income types" ON public.income_types FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ecosystem_links Users can view own links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own links" ON public.ecosystem_links FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: command_logs Users can view own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own logs" ON public.command_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: company_providers Users can view own providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own providers" ON public.company_providers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: financial_sources Users can view own sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own sources" ON public.financial_sources FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tenants Users can view their own tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tenant" ON public.tenants FOR SELECT USING (public.user_belongs_to_tenant(id));


--
-- Name: user_tenants Users can view their own tenant memberships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tenant memberships" ON public.user_tenants FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: command_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.command_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: company_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: company_clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_clients ENABLE ROW LEVEL SECURITY;

--
-- Name: company_employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_employees ENABLE ROW LEVEL SECURITY;

--
-- Name: company_providers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: ecosystem_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ecosystem_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: ecosystem_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ecosystem_links ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_sources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_sources ENABLE ROW LEVEL SECURITY;

--
-- Name: income_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.income_types ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;