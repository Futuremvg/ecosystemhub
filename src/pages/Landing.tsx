import { motion } from 'framer-motion';
import { Shield, Zap, Cpu, ArrowRight, Globe, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-transparent text-white font-light overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center space-y-8 max-w-4xl"
        >
          <div className="flex justify-center mb-6">
            <div className="px-4 py-1 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.4em] text-primary">The Silent Revolution</span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extralight tracking-tighter leading-none">
            Architecta <span className="text-primary">HUB</span>
          </h1>
          
          <p className="text-lg md:text-xl opacity-40 max-w-2xl mx-auto leading-relaxed font-extralight">
            O primeiro ecossistema de gestão autônoma. 8 agentes invisíveis trabalhando para que você nunca mais precise olhar para o back-office.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8">
            <button 
              onClick={() => navigate('/auth')}
              className="group relative px-8 py-4 bg-primary text-black text-xs uppercase tracking-[0.2em] font-medium rounded-full overflow-hidden transition-all hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                Iniciar Transfusão <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('features');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity"
            >
              Explorar Tecnologia
            </button>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20">
          <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll to explore</span>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-8 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Silent Engine",
                desc: "8 agentes de IA que processam, classificam e otimizam sua empresa em tempo real.",
                icon: Cpu
              },
              {
                title: "God Mode UI",
                desc: "Uma interface desenhada para o executivo moderno. Sem ruído, apenas clareza.",
                icon: Shield
              },
              {
                title: "CAD Financial",
                desc: "Motor financeiro nativo em CAD, pronto para o mercado global.",
                icon: Globe
              }
            ].map((feature, i) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <feature.icon className="w-8 h-8 text-primary mb-6 opacity-80" />
                <h3 className="text-xl font-light mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-sm opacity-40 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sales/Pricing Section */}
      <section className="py-32 px-8 relative">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <h2 className="text-4xl font-extralight tracking-tight">Acesso ao Olho de Deus</h2>
          
          <div className="glass-panel p-12 rounded-3xl border border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Lock className="w-4 h-4 opacity-20" />
            </div>
            
            <div className="space-y-6">
              <span className="text-[10px] uppercase tracking-[0.4em] text-primary">Plano Vitalício</span>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-sm opacity-40">CAD</span>
                <span className="text-7xl font-extralight tracking-tighter">997</span>
              </div>
              <p className="text-sm opacity-40">Pagamento único. Acesso total aos 8 agentes e atualizações futuras.</p>
              
              <div className="pt-8">
                <button 
                  onClick={() => navigate('/auth')}
                  className="w-full py-5 bg-white text-black text-xs uppercase tracking-[0.3em] font-bold rounded-xl hover:bg-primary transition-colors"
                >
                  Adquirir Licença Agora
                </button>
              </div>
            </div>
          </div>
          
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-20">
            Segurança de nível bancário • Criptografia AES-256
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-white/5 text-center">
        <span className="text-[10px] uppercase tracking-[0.3em] opacity-20">
          © 2026 Futuremvg • Architecta Ecosystem
        </span>
      </footer>
    </div>
  );
}
