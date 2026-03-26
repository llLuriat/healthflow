import { Link } from 'react-router';
import { 
  Calendar, 
  Bell, 
  Zap,
  Smartphone,
  Monitor,
  ArrowRight,
  Check,
  Settings,
  Users,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero */}
      <section className="hf-section bg-linear-to-b from-gray-50 to-white">
        <div className="hf-container text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Como o HealthFlow funciona
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Uma solução completa para gerenciar o fluxo de atendimentos e manter seus pacientes informados em tempo real
          </p>
        </div>
      </section>
      
      {/* Main Flow */}
      <section className="hf-section bg-white">
        <div className="hf-container">
          <div className="max-w-4xl mx-auto">
            {[
              {
                step: '1',
                icon: Calendar,
                title: 'Configure sua clínica',
                description: 'Cadastre seus médicos, especialidades e horários de atendimento. Personalize cores e logo para refletir sua marca.',
                image: 'dashboard',
              },
              {
                step: '2',
                icon: Monitor,
                title: 'Gerencie as consultas',
                description: 'Visualize todas as consultas do dia em um dashboard intuitivo. Atualize status com apenas um clique.',
                image: 'appointments',
              },
              {
                step: '3',
                icon: Smartphone,
                title: 'Compartilhe com pacientes',
                description: 'Cada paciente recebe um link único ou QR code para acompanhar sua consulta. Sem necessidade de instalar aplicativos.',
                image: 'patient',
              },
              {
                step: '4',
                icon: Bell,
                title: 'Atualizações automáticas',
                description: 'Quando você atualiza um status, todos os tempos são recalculados automaticamente. Pacientes veem mudanças em tempo real.',
                image: 'realtime',
              },
            ].map((step, i) => (
              <div key={i} className={`flex flex-col md:flex-row gap-8 items-center ${i > 0 ? 'mt-16 pt-16 border-t border-gray-200' : ''}`}>
                <div className={`flex-1 ${i % 2 === 1 ? 'md:order-2' : ''}`}>
                  <div 
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-xl mb-6"
                    style={{ 
                      backgroundColor: 'var(--hf-primary)',
                      color: 'white'
                    }}
                  >
                    {step.step}
                  </div>
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white mb-6"
                    style={{ backgroundColor: 'var(--hf-primary)' }}
                  >
                    <step.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{step.description}</p>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-2xl p-8 border border-gray-200">
                    <div className="aspect-video bg-linear-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white">
                      <step.icon className="w-16 h-16 opacity-50" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Deep Dive */}
      <section className="hf-section bg-gray-50">
        <div className="hf-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Recursos principais
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar o fluxo de atendimentos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Monitor,
                title: 'Dashboard em tempo real',
                description: 'Visualize todas as consultas, status e atrasos de forma clara e organizada.',
              },
              {
                icon: Zap,
                title: 'Atualização com 1 clique',
                description: 'Botões rápidos para adicionar 10 minutos, marcar em atendimento ou finalizar.',
              },
              {
                icon: Smartphone,
                title: 'Tela do paciente mobile-first',
                description: 'Interface otimizada para celular. Paciente não precisa instalar nada.',
              },
              {
                icon: Users,
                title: 'Múltiplos médicos',
                description: 'Gerencie vários profissionais e salas de atendimento simultaneamente.',
              },
              {
                icon: BarChart3,
                title: 'Relatórios e insights',
                description: 'Entenda padrões de atraso e otimize sua operação com dados.',
              },
              {
                icon: Settings,
                title: 'Personalização completa',
                description: 'Cores, logo e identidade visual da sua clínica em todo sistema.',
              },
            ].map((feature, i) => (
              <Card key={i} className="border-gray-200">
                <CardContent className="p-6">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--hf-primary-light)' }}
                  >
                    <feature.icon 
                      className="w-6 h-6"
                      style={{ color: 'var(--hf-primary)' }}
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Integration Flow */}
      <section className="hf-section bg-white">
        <div className="hf-container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Integração simples e rápida
              </h2>
              <p className="text-lg text-gray-600">
                Comece a usar em menos de 30 minutos
              </p>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  title: 'Crie sua conta',
                  description: 'Cadastro rápido com informações básicas da clínica',
                  time: '5 min',
                },
                {
                  title: 'Configure a estrutura',
                  description: 'Adicione médicos, especialidades e horários',
                  time: '10 min',
                },
                {
                  title: 'Personalize a identidade',
                  description: 'Logo, cores e informações da sua marca',
                  time: '5 min',
                },
                {
                  title: 'Comece a usar',
                  description: 'Importe consultas do dia e compartilhe links',
                  time: '10 min',
                },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold"
                    style={{ 
                      backgroundColor: 'var(--hf-primary)',
                      color: 'white'
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <span className="text-sm text-gray-500">{step.time}</span>
                    </div>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                  <Check 
                    className="w-6 h-6 shrink-0"
                    style={{ color: 'var(--hf-success)' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section 
        className="hf-section text-white"
        style={{ backgroundColor: 'var(--hf-primary)' }}
      >
        <div className="hf-container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Teste grátis por 14 dias. Configure em minutos.
          </p>
          <Link to="/login">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white hover:bg-gray-100"
              style={{ color: 'var(--hf-primary)' }}
            >
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}