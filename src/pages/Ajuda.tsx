import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, Building2, DollarSign, FileText, Sparkles, Settings,
  ChevronRight, ChevronDown, Play, BookOpen, Lightbulb, 
  Mic, MessageSquare, Upload, Search, Plus, BarChart3,
  Users, FolderOpen, Link2, HelpCircle, ArrowRight
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { cn } from "@/lib/utils";

interface FeatureSection {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  features: {
    title: string;
    description: string;
    steps?: string[];
    tip?: string;
  }[];
}

export default function Ajuda() {
  const { t, language } = useAppSettings();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<string[]>([]);

  const isPt = language.startsWith("pt");

  const sections: FeatureSection[] = [
    {
      id: "home",
      icon: Home,
      title: isPt ? "Página Inicial" : "Home",
      description: isPt 
        ? "Visão geral do seu negócio com resumo financeiro e atalhos rápidos" 
        : "Business overview with financial summary and quick shortcuts",
      color: "bg-blue-500/10 text-blue-500",
      features: [
        {
          title: isPt ? "Dashboard de Resumo" : "Summary Dashboard",
          description: isPt 
            ? "Veja receitas, despesas e saldo mensal em um só lugar" 
            : "View income, expenses and monthly balance in one place",
          steps: isPt ? [
            "Acesse a página inicial",
            "Veja os cards de resumo financeiro no topo",
            "Clique em qualquer card para mais detalhes"
          ] : [
            "Go to the home page",
            "View financial summary cards at the top",
            "Click any card for more details"
          ],
          tip: isPt 
            ? "O saldo é atualizado automaticamente conforme você adiciona transações" 
            : "Balance updates automatically as you add transactions"
        },
        {
          title: isPt ? "Cards de Empresas" : "Company Cards",
          description: isPt 
            ? "Visualize o lucro/prejuízo de cada empresa registrada" 
            : "View profit/loss for each registered company",
          steps: isPt ? [
            "Role para baixo na página inicial",
            "Veja os cards de P&L por empresa",
            "Clique para abrir detalhes da empresa"
          ] : [
            "Scroll down on home page",
            "View P&L cards per company",
            "Click to open company details"
          ]
        }
      ]
    },
    {
      id: "companies",
      icon: Building2,
      title: isPt ? "Empresas" : "Companies",
      description: isPt 
        ? "Gerencie seu ecossistema de empresas, subsidiárias e satélites" 
        : "Manage your ecosystem of companies, subsidiaries and satellites",
      color: "bg-purple-500/10 text-purple-500",
      features: [
        {
          title: isPt ? "Criar Empresa" : "Create Company",
          description: isPt 
            ? "Adicione empresas principais, subsidiárias ou satélites" 
            : "Add main companies, subsidiaries or satellites",
          steps: isPt ? [
            "Vá para Empresas no menu lateral",
            "Clique no botão '+' ou 'Adicionar'",
            "Preencha nome, tipo e descrição",
            "Selecione empresa-mãe se for subsidiária",
            "Clique em Salvar"
          ] : [
            "Go to Companies in sidebar",
            "Click '+' or 'Add' button",
            "Fill in name, type and description",
            "Select parent company if subsidiary",
            "Click Save"
          ],
          tip: isPt 
            ? "Use 'Satélite' para empresas parceiras sem vínculo direto" 
            : "Use 'Satellite' for partner companies without direct link"
        },
        {
          title: isPt ? "Gerenciar Funcionários e Clientes" : "Manage Employees & Clients",
          description: isPt 
            ? "Adicione equipe, clientes e fornecedores por empresa" 
            : "Add team, clients and providers per company",
          steps: isPt ? [
            "Clique em uma empresa para abrir detalhes",
            "Navegue pelas abas: Visão Geral, Gerenciar, Dicas",
            "Na aba Gerenciar, adicione funcionários, clientes ou fornecedores"
          ] : [
            "Click a company to open details",
            "Navigate tabs: Overview, Manage, Tips",
            "In Manage tab, add employees, clients or providers"
          ]
        },
        {
          title: isPt ? "Links do Ecossistema" : "Ecosystem Links",
          description: isPt 
            ? "Organize links importantes por categoria" 
            : "Organize important links by category",
          steps: isPt ? [
            "Dentro da empresa, vá para a seção Links",
            "Crie categorias (ex: Governo, Bancos, Ferramentas)",
            "Adicione links com nome, URL e prioridade"
          ] : [
            "Inside company, go to Links section",
            "Create categories (e.g., Government, Banks, Tools)",
            "Add links with name, URL and priority"
          ]
        }
      ]
    },
    {
      id: "money",
      icon: DollarSign,
      title: isPt ? "Dinheiro" : "Money",
      description: isPt 
        ? "Controle financeiro completo com receitas, despesas e relatórios" 
        : "Complete financial control with income, expenses and reports",
      color: "bg-green-500/10 text-green-500",
      features: [
        {
          title: isPt ? "Adicionar Transação" : "Add Transaction",
          description: isPt 
            ? "Registre receitas e despesas manualmente" 
            : "Register income and expenses manually",
          steps: isPt ? [
            "Vá para Dinheiro no menu",
            "Clique em '+ Transação'",
            "Escolha tipo: Receita ou Despesa",
            "Selecione fonte/categoria e valor",
            "Confirme para salvar"
          ] : [
            "Go to Money in menu",
            "Click '+ Transaction'",
            "Choose type: Income or Expense",
            "Select source/category and amount",
            "Confirm to save"
          ],
          tip: isPt 
            ? "Use notas para adicionar contexto às transações" 
            : "Use notes to add context to transactions"
        },
        {
          title: isPt ? "Escanear Recibo" : "Scan Receipt",
          description: isPt 
            ? "Use IA para extrair dados de recibos automaticamente" 
            : "Use AI to extract receipt data automatically",
          steps: isPt ? [
            "Clique em 'Escanear Recibo'",
            "Tire foto ou faça upload da imagem",
            "Aguarde a IA processar",
            "Revise e confirme os dados extraídos"
          ] : [
            "Click 'Scan Receipt'",
            "Take photo or upload image",
            "Wait for AI to process",
            "Review and confirm extracted data"
          ]
        },
        {
          title: isPt ? "Importar Extrato Bancário" : "Import Bank Statement",
          description: isPt 
            ? "Importe transações de arquivos CSV ou Excel" 
            : "Import transactions from CSV or Excel files",
          steps: isPt ? [
            "Clique em 'Importar Extrato'",
            "Faça upload do arquivo CSV/Excel",
            "Revise as transações detectadas",
            "Selecione quais importar e confirme"
          ] : [
            "Click 'Import Statement'",
            "Upload CSV/Excel file",
            "Review detected transactions",
            "Select which to import and confirm"
          ]
        },
        {
          title: isPt ? "Configurar Fontes e Categorias" : "Configure Sources & Categories",
          description: isPt 
            ? "Personalize fontes de receita e categorias de despesa" 
            : "Customize income sources and expense categories",
          steps: isPt ? [
            "Clique no ícone de engrenagem (⚙️)",
            "Adicione fontes de receita com % de imposto",
            "Crie categorias de despesa organizadas",
            "Defina cores e ícones se desejar"
          ] : [
            "Click the gear icon (⚙️)",
            "Add income sources with tax %",
            "Create organized expense categories",
            "Set colors and icons if desired"
          ]
        }
      ]
    },
    {
      id: "documents",
      icon: FileText,
      title: isPt ? "Documentos" : "Documents",
      description: isPt 
        ? "Armazene e organize documentos importantes por categoria" 
        : "Store and organize important documents by category",
      color: "bg-orange-500/10 text-orange-500",
      features: [
        {
          title: isPt ? "Upload de Documentos" : "Upload Documents",
          description: isPt 
            ? "Faça upload de contratos, notas fiscais e mais" 
            : "Upload contracts, invoices and more",
          steps: isPt ? [
            "Vá para Documentos no menu",
            "Clique em 'Adicionar'",
            "Escolha fazer upload ou adicionar link",
            "Selecione categoria e empresa",
            "Confirme para salvar"
          ] : [
            "Go to Documents in menu",
            "Click 'Add'",
            "Choose upload or add link",
            "Select category and company",
            "Confirm to save"
          ]
        },
        {
          title: isPt ? "Organizar por Categorias" : "Organize by Categories",
          description: isPt 
            ? "Crie categorias personalizadas para seus documentos" 
            : "Create custom categories for your documents",
          steps: isPt ? [
            "Clique em 'Gerenciar Categorias'",
            "Digite o nome da nova categoria",
            "Clique em Adicionar",
            "Arraste documentos para reorganizar"
          ] : [
            "Click 'Manage Categories'",
            "Type new category name",
            "Click Add",
            "Drag documents to reorganize"
          ]
        }
      ]
    },
    {
      id: "assistant",
      icon: Sparkles,
      title: isPt ? "Assistente IA" : "AI Assistant",
      description: isPt 
        ? "Converse por voz ou texto com sua assistente inteligente" 
        : "Chat by voice or text with your smart assistant",
      color: "bg-pink-500/10 text-pink-500",
      features: [
        {
          title: isPt ? "Conversar por Texto" : "Chat by Text",
          description: isPt 
            ? "Digite mensagens para obter respostas instantâneas" 
            : "Type messages to get instant responses",
          steps: isPt ? [
            "Clique no botão flutuante ✨ no canto inferior",
            "Digite sua pergunta ou comando",
            "Pressione Enter ou clique em enviar",
            "Aguarde a resposta da assistente"
          ] : [
            "Click the floating ✨ button in the corner",
            "Type your question or command",
            "Press Enter or click send",
            "Wait for assistant response"
          ],
          tip: isPt 
            ? "A assistente entende português e inglês automaticamente" 
            : "The assistant understands Portuguese and English automatically"
        },
        {
          title: isPt ? "Conversar por Voz" : "Chat by Voice",
          description: isPt 
            ? "Fale naturalmente e a assistente vai entender" 
            : "Speak naturally and the assistant will understand",
          steps: isPt ? [
            "Clique no ícone do microfone 🎤",
            "Fale sua pergunta naturalmente",
            "Aguarde 2-3 segundos de pausa",
            "A mensagem será enviada automaticamente"
          ] : [
            "Click the microphone icon 🎤",
            "Speak your question naturally",
            "Wait 2-3 seconds of pause",
            "Message will be sent automatically"
          ],
          tip: isPt 
            ? "Fale com calma e claramente para melhor reconhecimento" 
            : "Speak calmly and clearly for better recognition"
        },
        {
          title: isPt ? "Exemplos de Comandos" : "Example Commands",
          description: isPt 
            ? "Perguntas e comandos que você pode usar" 
            : "Questions and commands you can use",
          steps: isPt ? [
            "\"Qual meu saldo do mês?\"",
            "\"Quantas empresas eu tenho?\"",
            "\"Me mostre um resumo financeiro\"",
            "\"Quais são meus links mais importantes?\"",
            "\"Adicione uma despesa de R$100 em alimentação\""
          ] : [
            "\"What's my balance this month?\"",
            "\"How many companies do I have?\"",
            "\"Show me a financial summary\"",
            "\"What are my most important links?\"",
            "\"Add an expense of $100 for food\""
          ]
        }
      ]
    },
    {
      id: "settings",
      icon: Settings,
      title: isPt ? "Configurações" : "Settings",
      description: isPt 
        ? "Personalize o app com sua marca, idioma e preferências" 
        : "Customize the app with your brand, language and preferences",
      color: "bg-gray-500/10 text-gray-500",
      features: [
        {
          title: isPt ? "Identidade Visual" : "Branding",
          description: isPt 
            ? "Configure logo, nome e informações da empresa" 
            : "Set up logo, name and company information",
          steps: isPt ? [
            "Vá para Configurações no menu",
            "Clique em 'Identidade Visual'",
            "Adicione logo, nome e tipo de negócio",
            "Preencha contato e endereço",
            "Clique em Salvar"
          ] : [
            "Go to Settings in menu",
            "Click 'Branding'",
            "Add logo, name and business type",
            "Fill in contact and address",
            "Click Save"
          ]
        },
        {
          title: isPt ? "Idioma e Moeda" : "Language & Currency",
          description: isPt 
            ? "Altere idioma do app e formato de moeda" 
            : "Change app language and currency format",
          steps: isPt ? [
            "Em Configurações, vá para Preferências",
            "Selecione idioma: Português ou Inglês",
            "Escolha moeda: BRL, USD, CAD, EUR",
            "Alterações são aplicadas imediatamente"
          ] : [
            "In Settings, go to Preferences",
            "Select language: Portuguese or English",
            "Choose currency: BRL, USD, CAD, EUR",
            "Changes apply immediately"
          ]
        }
      ]
    }
  ];

  const markAsComplete = (sectionId: string) => {
    if (!completedSections.includes(sectionId)) {
      setCompletedSections([...completedSections, sectionId]);
    }
  };

  const progress = Math.round((completedSections.length / sections.length) * 100);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isPt ? "Central de Ajuda" : "Help Center"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isPt 
                  ? "Aprenda a usar todas as funcionalidades do app" 
                  : "Learn how to use all app features"}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {isPt ? "Seu progresso" : "Your progress"}
              </span>
              <Badge variant="secondary">
                {completedSections.length}/{sections.length} {isPt ? "seções" : "sections"}
              </Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Quick Tips */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {isPt ? "Dica Rápida" : "Quick Tip"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isPt 
                      ? "Use o assistente IA (botão ✨) para fazer qualquer pergunta sobre o app. Ele pode te ajudar a navegar e executar ações por voz ou texto!" 
                      : "Use the AI assistant (✨ button) to ask any question about the app. It can help you navigate and execute actions by voice or text!"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sections Grid */}
        <div className="space-y-4">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isCompleted = completedSections.includes(section.id);
            const isActive = activeSection === section.id;

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={cn(
                    "transition-all duration-300 cursor-pointer",
                    isActive && "ring-2 ring-primary",
                    isCompleted && "border-green-500/30 bg-green-500/5"
                  )}
                >
                  <CardHeader 
                    className="p-4 pb-2"
                    onClick={() => setActiveSection(isActive ? null : section.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          section.color
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {section.title}
                            {isCompleted && (
                              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-600">
                                ✓ {isPt ? "Completo" : "Complete"}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {section.description}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        {isActive ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardContent className="px-4 pb-4">
                          <div className="border-t pt-4 mt-2">
                            <Accordion type="single" collapsible className="space-y-2">
                              {section.features.map((feature, fIndex) => (
                                <AccordionItem 
                                  key={fIndex} 
                                  value={`feature-${fIndex}`}
                                  className="border rounded-lg px-4"
                                >
                                  <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                      <Play className="w-4 h-4 text-primary" />
                                      {feature.title}
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pb-4">
                                    <p className="text-sm text-muted-foreground mb-3">
                                      {feature.description}
                                    </p>
                                    
                                    {feature.steps && (
                                      <div className="bg-muted/50 rounded-lg p-3 mb-3">
                                        <p className="text-xs font-medium text-foreground mb-2">
                                          {isPt ? "Passo a passo:" : "Step by step:"}
                                        </p>
                                        <ol className="space-y-1.5">
                                          {feature.steps.map((step, sIndex) => (
                                            <li key={sIndex} className="flex items-start gap-2 text-sm">
                                              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
                                                {sIndex + 1}
                                              </span>
                                              <span className="text-muted-foreground">{step}</span>
                                            </li>
                                          ))}
                                        </ol>
                                      </div>
                                    )}

                                    {feature.tip && (
                                      <div className="flex items-start gap-2 text-sm bg-yellow-500/10 rounded-lg p-3">
                                        <Lightbulb className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                                        <span className="text-yellow-700 dark:text-yellow-400">
                                          {feature.tip}
                                        </span>
                                      </div>
                                    )}
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>

                            {/* Mark as complete button */}
                            {!isCompleted && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-4 w-full"
                                onClick={() => markAsComplete(section.id)}
                              >
                                {isPt ? "Marcar como concluído" : "Mark as complete"}
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Help */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">
                {isPt ? "Ainda tem dúvidas?" : "Still have questions?"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isPt 
                  ? "Use o assistente IA para tirar qualquer dúvida sobre o app" 
                  : "Use the AI assistant to ask any question about the app"}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">
                  {isPt ? "Clique no botão ✨ para começar" : "Click the ✨ button to start"}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
