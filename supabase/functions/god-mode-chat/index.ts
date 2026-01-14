import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Você é o GOD MODE — o Sistema Central de Inteligência Empresarial do Architecta.

=== IDENTIDADE ===
Você NÃO é um chatbot. Você NÃO é apenas um assistente financeiro.
Você é um CONSELHEIRO EXECUTIVO OPERACIONAL — a segunda mente estratégica do dono da empresa.

Você age como:
• Estrategista de negócios
• Gestor operacional
• Analista financeiro
• Consultor contratual
• Orientador administrativo
• Decisor tático

=== IDIOMA (CRÍTICO) ===
• SEMPRE detecte o idioma da mensagem do usuário
• SEMPRE responda no MESMO idioma que o usuário usou
• Se o usuário fala português, responda em português brasileiro natural
• Se o usuário fala inglês, responda em inglês natural
• Use expressões naturais do idioma detectado

=== ESCOPO DE ATUAÇÃO ===
Seu foco é a GESTÃO COMPLETA da empresa:
• Operações e projetos
• Contratos e documentos legais
• Finanças e fluxo de caixa
• Clientes e fornecedores
• Equipe e recursos humanos
• Tarefas e cronogramas
• Decisões táticas e estratégicas

=== CAPACIDADES OBRIGATÓRIAS ===

INTERPRETAR CONTRATOS:
• Apontar riscos contratuais
• Resumir cláusulas importantes
• Sugerir ajustes e renegociações
• Alertar sobre problemas legais/financeiros

ANALISAR INVOICES E FINANCEIRO:
• Conferir valores e prazos
• Identificar erros e inconsistências
• Validar contra contratos e projetos
• Projetar fluxo de caixa

ORIENTAR DECISÕES OPERACIONAIS:
• Priorizar tarefas críticas
• Ajustar cronogramas
• Resolver gargalos
• Otimizar execução

GERENCIAR RISCOS:
• Riscos financeiros
• Riscos operacionais
• Riscos contratuais
• Riscos de prazo e equipe

=== COMPORTAMENTO OBRIGATÓRIO ===
• Seja PROATIVO — antecipe problemas
• Seja DIRETO — sem rodeios
• Seja DECISIVO — tome posição
• Seja ESTRATÉGICO — pense no longo prazo
• Seja ORIENTADO A SOLUÇÃO — sempre entregue ação

Você APONTA o que o usuário está ignorando.
Você CORRIGE erros antes que virem prejuízo.
Você NÃO pergunta "o que você quer fazer?".
Você DIZ o que PRECISA ser feito.

=== FORMATO DE RESPOSTA ===
Sempre estruture respostas complexas assim:

📊 INSIGHT ESTRATÉGICO
(O problema real identificado)

📈 ANÁLISE OBJETIVA
(O impacto operacional/financeiro/contratual)

✅ SOLUÇÃO DIRETA
(O que fazer)

⚡ AÇÃO IMEDIATA
(Passo prático agora)

⚠️ ALERTA
(O erro a evitar ou risco a monitorar)

Para conversas simples, seja natural e direto — não precisa do formato completo.

=== TOM DE COMUNICAÇÃO ===
• Firme e claro
• Sem linguagem robótica
• Sem respostas vagas
• Sem rodeios
• Direto ao ponto

O usuário deve sentir que está falando com um MENTOR EXECUTIVO, não com um sistema.

=== RESTRIÇÕES ===
• Não gere dúvidas — gere clareza
• Não seja passivo — seja decisivo
• Não simplifique demais — entregue profundidade quando necessário
• Não limite sugestões — pense grande
• Não responda superficialmente — vá ao ponto real

=== SISTEMA ARCHITECTA ===
Você tem acesso completo a:

1. EMPRESAS (Ecosystem)
   - Hubs e satellites
   - Clientes, fornecedores, funcionários
   - Links e recursos

2. FINANCEIRO (Dinheiro)
   - Fontes de receita com impostos
   - Categorias de despesa
   - Entradas por mês/ano
   - P&L consolidado

3. DOCUMENTOS
   - Contratos, notas fiscais, recibos
   - Organização por categoria e empresa

4. CONFIGURAÇÕES
   - Idioma, moeda, tema

5. ADMIN (Super Admin)
   - Gestão multi-tenant

=== EXEMPLOS DE ATUAÇÃO ===

Usuário: "quanto gastei esse mês?"
Você: [executa get_financial_summary]
"📊 Esse mês: R$ 15.000 em receitas vs R$ 12.500 em despesas.

⚠️ ALERTA: Suas despesas operacionais cresceram 18% vs mês passado. A categoria 'Marketing' sozinha representa 35% do total.

⚡ AÇÃO: Revisar ROI das campanhas de marketing antes do próximo ciclo. Quer que eu detalhe por categoria?"

Usuário: "cria uma empresa Acme Corp"
Você: [executa create_company]
"✅ Empresa 'Acme Corp' criada como hub.

📈 Próximos passos recomendados:
1. Definir fontes de receita
2. Configurar categorias de despesa
3. Vincular primeiros clientes

Quer que eu configure a estrutura financeira básica?"

Usuário: "tenho um contrato para analisar"
Você: "📊 Perfeito. Me envia o contrato ou cole as cláusulas principais aqui.

Vou analisar:
• Riscos contratuais
• Obrigações financeiras
• Prazos críticos
• Cláusulas de rescisão
• Pontos de negociação

Enquanto isso, me diz: é um contrato de prestação de serviço, fornecimento, ou parceria?"

=== OBJETIVO FINAL ===
Você existe para:
• Decifrar qualquer informação do sistema
• Interpretar qualquer documento
• Avaliar qualquer cenário
• Propor soluções imediatas
• Ajudar o dono a decidir rápido
• Evitar erros caros

Resultado: Um God Mode que funciona como a MENTE ESTRATÉGICA da empresa.

=== AVISO EXECUTIVO ===
Este sistema não apenas responde.
Ele ORIENTA, CORRIGE e DECIDE.

Navegação: home, empresas, dinheiro, documentos, assistente, configuracoes, admin (super admin only)`;

// Tool definitions for function calling
const tools = [
  {
    type: "function",
    function: {
      name: "create_company",
      description: "Cria uma nova empresa ou hub no sistema",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da empresa" },
          description: { type: "string", description: "Descrição opcional da empresa" },
          company_type: { type: "string", enum: ["hub", "satellite"], description: "Tipo: hub (principal) ou satellite (vinculada)" },
          parent_id: { type: "string", description: "ID do hub pai, se for satellite" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_income_source",
      description: "Adiciona uma fonte de receita (cliente, projeto, etc)",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da fonte de receita" },
          tax_percentage: { type: "number", description: "Porcentagem de imposto (0-100)" },
          description: { type: "string", description: "Descrição opcional" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_expense_category",
      description: "Adiciona uma categoria de despesa",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da categoria" },
          parent_id: { type: "string", description: "ID da categoria pai, se for subcategoria" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_income_category",
      description: "Adiciona uma categoria de receita",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da categoria" },
          parent_id: { type: "string", description: "ID da categoria pai, se for subcategoria" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_financial_entry",
      description: "Adiciona uma entrada financeira (receita ou despesa) para um mês específico",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["income", "expense"], description: "Tipo: income (receita) ou expense (despesa)" },
          amount: { type: "number", description: "Valor em reais" },
          category_name: { type: "string", description: "Nome da categoria" },
          source_name: { type: "string", description: "Nome da fonte de receita (para income)" },
          month: { type: "number", description: "Mês (1-12), padrão é o mês atual" },
          year: { type: "number", description: "Ano, padrão é o ano atual" },
          notes: { type: "string", description: "Observações opcionais" }
        },
        required: ["type", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "navigate_to",
      description: "Navega para uma página do aplicativo",
      parameters: {
        type: "object",
        properties: {
          page: { 
            type: "string", 
            enum: ["home", "empresas", "dinheiro", "documentos", "assistente", "configuracoes", "admin"],
            description: "Página de destino (admin requer permissão de super admin)"
          }
        },
        required: ["page"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_financial_summary",
      description: "Obtém um resumo financeiro do mês ou ano",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", enum: ["month", "year"], description: "Período do resumo" },
          month: { type: "number", description: "Mês específico (1-12)" },
          year: { type: "number", description: "Ano específico" }
        },
        required: ["period"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_companies",
      description: "Lista todas as empresas do usuário",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_company",
      description: "Deleta uma empresa pelo nome",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da empresa para deletar" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_ecosystem_category",
      description: "Cria uma categoria do ecossistema para organizar links",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da categoria" },
          icon: { type: "string", description: "Nome do ícone (folder, link, globe, code, palette, etc)" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_ecosystem_link",
      description: "Cria um link no ecossistema (ferramenta, site, recurso)",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do link/ferramenta" },
          url: { type: "string", description: "URL do link" },
          category_name: { type: "string", description: "Nome da categoria onde adicionar" },
          description: { type: "string", description: "Descrição opcional do link" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Prioridade: low, medium ou high" }
        },
        required: ["name", "url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_ecosystem",
      description: "Lista categorias e links do ecossistema",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_document_reference",
      description: "Cria uma referência de documento no sistema (sem upload de arquivo)",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do documento" },
          category: { type: "string", description: "Categoria: contrato, nota_fiscal, recibo, relatorio, outro" },
          file_type: { type: "string", description: "Tipo do arquivo: pdf, doc, xls, img, outro" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_documents",
      description: "Lista todos os documentos do usuário",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Filtrar por categoria (opcional)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_tenants",
      description: "Lista todos os tenants/clientes (apenas super admin)",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_tenant",
      description: "Cria um novo tenant/cliente (apenas super admin)",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do tenant/empresa" },
          slug: { type: "string", description: "Slug único (ex: empresa-abc)" },
          owner_name: { type: "string", description: "Nome do proprietário" },
          owner_email: { type: "string", description: "Email do proprietário" },
          phone: { type: "string", description: "Telefone (WhatsApp)" },
          business_type: { type: "string", description: "Tipo de negócio: cleaning, restaurant, construction, retail, tech, health, education, other" },
          primary_color: { type: "string", description: "Cor principal em hex (ex: #d4af37)" }
        },
        required: ["name", "slug"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_tenant_info",
      description: "Obtém informações de um tenant específico (apenas super admin)",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do tenant para buscar" }
        },
        required: ["name"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client with service role for executing actions
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Call AI with tool calling enabled
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    
    // Check if AI wants to call tools
    if (message?.tool_calls && message.tool_calls.length > 0) {
      const toolResults = [];
      const executedActions = [];
      
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${functionName}`, args);
        
        let result: Record<string, any> = { success: false, message: "Ação não implementada" };
        
        
        
        try {
          switch (functionName) {
            case "create_company": {
              // If parent_id is a name (not UUID), find the hub by name
              let parentId = args.parent_id || null;
              if (parentId && !parentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                const { data: parentCompany } = await supabase
                  .from("companies")
                  .select("id")
                  .eq("user_id", userId)
                  .ilike("name", `%${parentId}%`)
                  .eq("company_type", "hub")
                  .maybeSingle();
                
                if (parentCompany) {
                  parentId = parentCompany.id;
                } else {
                  result = { success: false, message: `Hub "${args.parent_id}" não encontrado. Crie primeiro o hub ou verifique o nome.` };
                  break;
                }
              }
              
              const { data: company, error } = await supabase
                .from("companies")
                .insert({
                  user_id: userId,
                  name: args.name,
                  description: args.description || null,
                  company_type: args.company_type || "hub",
                  parent_id: parentId,
                })
                .select()
                .single();
              
              if (error) throw error;
              result = { success: true, message: `Empresa "${args.name}" criada!`, data: company };
              executedActions.push({ type: "company_created", data: company });
              break;
            }
            
            case "add_income_source": {
              const { data: source, error } = await supabase
                .from("financial_sources")
                .insert({
                  user_id: userId,
                  name: args.name,
                  tax_percentage: args.tax_percentage || 0,
                  description: args.description || null,
                })
                .select()
                .single();
              
              if (error) throw error;
              result = { success: true, message: `Fonte "${args.name}" adicionada!`, data: source };
              executedActions.push({ type: "source_created", data: source });
              break;
            }
            
            case "add_expense_category": {
              const { data: category, error } = await supabase
                .from("financial_categories")
                .insert({
                  user_id: userId,
                  name: args.name,
                  type: "expense",
                  parent_id: args.parent_id || null,
                })
                .select()
                .single();
              
              if (error) throw error;
              result = { success: true, message: `Categoria "${args.name}" criada!`, data: category };
              executedActions.push({ type: "category_created", data: category });
              break;
            }
            
            case "add_income_category": {
              const { data: category, error } = await supabase
                .from("financial_categories")
                .insert({
                  user_id: userId,
                  name: args.name,
                  type: "income",
                  parent_id: args.parent_id || null,
                })
                .select()
                .single();
              
              if (error) throw error;
              result = { success: true, message: `Categoria "${args.name}" criada!`, data: category };
              executedActions.push({ type: "category_created", data: category });
              break;
            }
            
            case "add_financial_entry": {
              const now = new Date();
              const month = args.month || (now.getMonth() + 1);
              const year = args.year || now.getFullYear();
              
              let categoryId = null;
              let sourceId = null;
              
              // Find or create category/source
              if (args.type === "expense" && args.category_name) {
                const { data: existing } = await supabase
                  .from("financial_categories")
                  .select("id")
                  .eq("user_id", userId)
                  .eq("name", args.category_name)
                  .eq("type", "expense")
                  .maybeSingle();
                
                if (existing) {
                  categoryId = existing.id;
                } else {
                  const { data: newCat } = await supabase
                    .from("financial_categories")
                    .insert({ user_id: userId, name: args.category_name, type: "expense" })
                    .select()
                    .single();
                  categoryId = newCat?.id;
                }
              }
              
              if (args.type === "income" && args.source_name) {
                const { data: existing } = await supabase
                  .from("financial_sources")
                  .select("id")
                  .eq("user_id", userId)
                  .eq("name", args.source_name)
                  .maybeSingle();
                
                if (existing) {
                  sourceId = existing.id;
                } else {
                  const { data: newSource } = await supabase
                    .from("financial_sources")
                    .insert({ user_id: userId, name: args.source_name })
                    .select()
                    .single();
                  sourceId = newSource?.id;
                }
              }
              
              const { data: entry, error } = await supabase
                .from("financial_entries")
                .insert({
                  user_id: userId,
                  amount: args.amount,
                  month,
                  year,
                  category_id: categoryId,
                  source_id: sourceId,
                  notes: args.notes || null,
                })
                .select()
                .single();
              
              if (error) throw error;
              
              const typeLabel = args.type === "income" ? "Receita" : "Despesa";
              result = { 
                success: true, 
                message: `${typeLabel} de R$ ${args.amount.toFixed(2)} adicionada!`, 
                data: entry 
              };
              executedActions.push({ type: "entry_created", data: entry });
              break;
            }
            
            case "navigate_to": {
              const pageMap: Record<string, string> = {
                home: "/",
                empresas: "/empresas",
                dinheiro: "/dinheiro",
                documentos: "/documentos",
                assistente: "/assistente",
                configuracoes: "/configuracoes",
                admin: "/admin/tenants",
              };
              result = { 
                success: true, 
                message: `Navigating to ${args.page}...`,
                navigate: pageMap[args.page] || "/"
              };
              executedActions.push({ type: "navigate", path: pageMap[args.page] });
              break;
            }
            
            case "get_financial_summary": {
              const now = new Date();
              const year = args.year || now.getFullYear();
              const month = args.month || (now.getMonth() + 1);
              
              let query = supabase
                .from("financial_entries")
                .select("*, financial_sources(name), financial_categories(name, type)")
                .eq("user_id", userId)
                .eq("year", year);
              
              if (args.period === "month") {
                query = query.eq("month", month);
              }
              
              const { data: entries } = await query;
              
              const income = entries?.filter(e => e.source_id)?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
              const expenses = entries?.filter(e => e.category_id)?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
              
              result = {
                success: true,
                message: `Resumo ${args.period === "month" ? `de ${month}/${year}` : `do ano ${year}`}: Receitas R$ ${income.toFixed(2)}, Despesas R$ ${expenses.toFixed(2)}, Saldo R$ ${(income - expenses).toFixed(2)}`,
                data: { income, expenses, balance: income - expenses }
              };
              break;
            }
            
            case "list_companies": {
              const { data: companies } = await supabase
                .from("companies")
                .select("*")
                .eq("user_id", userId);
              
              const companyList = companies?.map(c => `${c.name} (${c.company_type})`).join(", ") || "Nenhuma empresa";
              result = { success: true, message: `Suas empresas: ${companyList}`, data: companies };
              break;
            }
            
            case "delete_company": {
              const { data: company } = await supabase
                .from("companies")
                .select("id")
                .eq("user_id", userId)
                .ilike("name", args.name)
                .maybeSingle();
              
              if (!company) {
                result = { success: false, message: `Empresa "${args.name}" não encontrada.` };
              } else {
                await supabase.from("companies").delete().eq("id", company.id);
                result = { success: true, message: `Empresa "${args.name}" deletada!` };
                executedActions.push({ type: "company_deleted", name: args.name });
              }
              break;
            }
            
            case "create_ecosystem_category": {
              const { data: category, error } = await supabase
                .from("ecosystem_categories")
                .insert({
                  user_id: userId,
                  name: args.name,
                  icon: args.icon || "folder",
                })
                .select()
                .single();
              
              if (error) throw error;
              result = { success: true, message: `Categoria "${args.name}" criada!`, data: category };
              executedActions.push({ type: "ecosystem_category_created", data: category });
              break;
            }
            
            case "create_ecosystem_link": {
              let categoryId = null;
              
              if (args.category_name) {
                const { data: existing } = await supabase
                  .from("ecosystem_categories")
                  .select("id")
                  .eq("user_id", userId)
                  .ilike("name", `%${args.category_name}%`)
                  .maybeSingle();
                
                if (existing) {
                  categoryId = existing.id;
                } else {
                  // Create the category if it doesn't exist
                  const { data: newCat } = await supabase
                    .from("ecosystem_categories")
                    .insert({ user_id: userId, name: args.category_name })
                    .select()
                    .single();
                  categoryId = newCat?.id;
                }
              }
              
              const { data: link, error } = await supabase
                .from("ecosystem_links")
                .insert({
                  user_id: userId,
                  name: args.name,
                  url: args.url,
                  category_id: categoryId,
                  description: args.description || null,
                  priority: args.priority || "medium",
                })
                .select()
                .single();
              
              if (error) throw error;
              result = { success: true, message: `Link "${args.name}" adicionado!`, data: link };
              executedActions.push({ type: "ecosystem_link_created", data: link });
              break;
            }
            
            case "list_ecosystem": {
              const { data: categories } = await supabase
                .from("ecosystem_categories")
                .select("*, ecosystem_links(*)")
                .eq("user_id", userId);
              
              const { data: uncategorizedLinks } = await supabase
                .from("ecosystem_links")
                .select("*")
                .eq("user_id", userId)
                .is("category_id", null);
              
              const summary = categories?.map(c => {
                const linkCount = (c.ecosystem_links as any[])?.length || 0;
                return `${c.name} (${linkCount} links)`;
              }).join(", ") || "Nenhuma categoria";
              
              result = { 
                success: true, 
                message: `Categorias: ${summary}. ${uncategorizedLinks?.length || 0} links sem categoria.`,
                data: { categories, uncategorizedLinks }
              };
              break;
            }
            
            case "create_document_reference": {
              const { data: doc, error } = await supabase
                .from("documents")
                .insert({
                  user_id: userId,
                  name: args.name,
                  category: args.category || "outro",
                  file_type: args.file_type || "outro",
                })
                .select()
                .single();
              
              if (error) throw error;
              result = { success: true, message: `Documento "${args.name}" registrado!`, data: doc };
              executedActions.push({ type: "document_created", data: doc });
              break;
            }
            
            case "list_documents": {
              let query = supabase
                .from("documents")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });
              
              if (args.category) {
                query = query.eq("category", args.category);
              }
              
              const { data: docs } = await query;
              
              const docList = docs?.map(d => `${d.name} (${d.category})`).join(", ") || "No documents";
              result = { success: true, message: `Documents: ${docList}`, data: docs };
              break;
            }
            
            // ===== ADMIN TOOLS (Super Admin only) =====
            case "list_tenants": {
              // Check if user is super admin
              const { data: roleData } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", userId)
                .eq("role", "admin")
                .maybeSingle();
              
              if (!roleData) {
                result = { success: false, message: "Access denied. Only super admins can list tenants." };
                break;
              }
              
              const { data: tenants } = await supabase
                .from("tenants")
                .select("*")
                .order("created_at", { ascending: false });
              
              const tenantList = tenants?.map(t => `${t.name} (${t.is_active ? 'active' : 'inactive'})`).join(", ") || "No tenants";
              result = { 
                success: true, 
                message: `Tenants: ${tenantList}`,
                data: tenants
              };
              break;
            }
            
            case "create_tenant": {
              // Check if user is super admin
              const { data: roleData } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", userId)
                .eq("role", "admin")
                .maybeSingle();
              
              if (!roleData) {
                result = { success: false, message: "Access denied. Only super admins can create tenants." };
                break;
              }
              
              const { data: tenant, error } = await supabase
                .from("tenants")
                .insert({
                  name: args.name,
                  slug: args.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  owner_name: args.owner_name || null,
                  owner_email: args.owner_email || null,
                  phone: args.phone || null,
                  business_type: args.business_type || null,
                  primary_color: args.primary_color || "#d4af37",
                })
                .select()
                .single();
              
              if (error) {
                if (error.code === "23505") {
                  result = { success: false, message: "Slug or domain already exists" };
                } else {
                  throw error;
                }
              } else {
                result = { success: true, message: `Tenant "${args.name}" created!`, data: tenant };
                executedActions.push({ type: "tenant_created", data: tenant });
              }
              break;
            }
            
            case "get_tenant_info": {
              // Check if user is super admin
              const { data: roleData } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", userId)
                .eq("role", "admin")
                .maybeSingle();
              
              if (!roleData) {
                result = { success: false, message: "Access denied. Only super admins can view tenant info." };
                break;
              }
              
              const { data: tenant } = await supabase
                .from("tenants")
                .select("*")
                .ilike("name", `%${args.name}%`)
                .maybeSingle();
              
              if (!tenant) {
                result = { success: false, message: `Tenant "${args.name}" not found.` };
              } else {
                result = { 
                  success: true, 
                  message: `Tenant: ${tenant.name} | Owner: ${tenant.owner_name || 'N/A'} | Email: ${tenant.owner_email || 'N/A'} | Phone: ${tenant.phone || 'N/A'} | Status: ${tenant.is_active ? 'Active' : 'Inactive'}`,
                  data: tenant
                };
              }
              break;
            }
          }
        } catch (error) {
          console.error(`Error executing ${functionName}:`, error);
          result = { success: false, message: `Erro ao executar: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: JSON.stringify(result),
        });
      }
      
      // Call AI again with tool results to get natural response
      const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            message,
            ...toolResults,
          ],
        }),
      });
      
      const followUpData = await followUpResponse.json();
      const finalResponse = followUpData.choices?.[0]?.message?.content || "Pronto!";
      
      return new Response(
        JSON.stringify({ 
          response: finalResponse,
          actions: executedActions,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No tool calls, just return the message
    const assistantMessage = message?.content || "Desculpe, não consegui processar sua mensagem.";

    return new Response(
      JSON.stringify({ response: assistantMessage, actions: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("God Mode chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        response: "Desculpe, tive um problema. Tente novamente.",
        actions: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
