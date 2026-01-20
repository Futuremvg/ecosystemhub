# 👁️ OLHO DE DEUS - MASTER IMPLEMENTATION BLUEPRINT V2.0
"The Omnipotent Silent Engine"

Este documento consolida a visão estratégica, a estética de elite e a arquitetura técnica total para a plataforma Olho de Deus (MV Group).

## 1. 🎨 DESIGN SYSTEM: "ELITE COCKPIT" (Visual Refinement)
Baseado nas referências cinematográficas, o sistema deve ser minimalista, mas com impacto visual de alta tecnologia.

*   **Estética Geral:** "Clean Dark Mode". Fundo Slate 950 (#020617) com profundidade.
*   **Tipografia:** Inter ou SF Pro. Pesos: 200 (Extra Light) para títulos, 300 (Light) para corpo. Espaçamento entre letras (tracking) aumentado.
*   **Menu Lateral:**
    *   Efeito Glassmorphism (backdrop-blur-xl).
    *   Bordas finíssimas (0.5px) com brilho âmbar sutil (#F59E0B) a 10% de opacidade.
    *   Ícones ultra-finos que "respiram" luz quando ativos.
*   **O Cérebro Neural:**
    *   Elemento central no Dashboard que representa o "God Mode".
    *   Animação de pulsação em Cyan (#06B6D4) quando os agentes estão processando dados.
*   **A Engrenagem de Conexão:**
    *   Layout circular na aba de Integrações, mostrando a MV Group no centro conectando-se a Stripe, Bancos e n8n.

## 2. 🤖 THE 8 SILENT AGENTS (Backend Architecture)
Os agentes operam em segundo plano. A UI apenas reflete seus resultados através do "Pulse".

1.  **Normalization Agent:** Padroniza entradas de Stripe, Bancos e CSVs.
2.  **Deduplication Agent:** Usa o Master Transaction ID para garantir integridade total.
3.  **Classification Agent:** Categoriza domínios de negócio automaticamente.
4.  **Policy Agent:** Verifica conformidade com regras de negócio e contratos.
5.  **Anomaly Agent:** Detecta riscos financeiros e operacionais em tempo real.
6.  **Action Agent:** Dispara documentos (Gamma) e automações (n8n).
7.  **Briefing Agent:** Gera o resumo executivo em linguagem natural.
8.  **Growth Agent:** Cria estratégias de marketing, funis e scripts de conteúdo.

## 3. 🔌 FULL TECHNICAL INTEGRATIONS
O sistema deve ser o HUB central de dados da empresa.

*   **Stripe Integration:**
    *   Sincronização de Webhooks para pagamentos e assinaturas.
    *   Cálculo automático de MRR, Churn e LTV no Dashboard.
*   **Banking Connect (Plaid/Open Banking):**
    *   Leitura de extratos para conciliação bancária automática via Deduplication Agent.
*   **n8n/Make Bridge:**
    *   O Action Agent envia payloads para webhooks do n8n para executar tarefas externas (e-mails, CRM, Slack).
*   **Gamma.app Automation:**
    *   Mapeamento de campos do Supabase para as chaves {{VAR}} nos templates de Proposta, Contrato e Tax Pack.

## 4. 📊 MASTER DASHBOARD (The Clean View)
Foco total em clareza e tomada de decisão.

*   **Top Bar:** "Executive Morning Briefing" (Texto curto gerado pelo Briefing Agent).
*   **Main Metrics:** Revenue (CAD), Profit, Business Health Score (0-100).
*   **The Pulse (Footer):** Uma linha de texto minimalista com as últimas ações dos agentes.
*   **Marketing Command:** Aba dedicada ao Growth Agent com calendário de conteúdo e scripts de carrossel.

## 5. 🛠 LOVABLE MASTER PROMPT (Copy & Paste)
Use este prompt para restaurar ou atualizar o sistema com a nova visão:

> "Implement the Olho de Deus V2.0 'Silent Engine'.
> 1. UI: Clean Dark Mode, Inter Light font, Glassmorphism sidebar with amber glow borders. Central Neural Brain animation for processing states.
> 2. Agents: 8 background agents (Normalization to Growth). Hide them from the main UI; show only a minimal 'Activity Pulse' at the bottom.
> 3. Integrations: Setup hooks for Stripe (payments), Banking (Plaid), and n8n (actions). Base currency: CAD with local conversion.
> 4. Features: Business Health Score (0-100), Executive Briefing text, and Document Center for Gamma.app templates.
> 5. Aesthetic: High-end executive cockpit. Minimalist, sophisticated, no heavy neon or radar effects."

MV Group - Omnipotence through Intelligence.
