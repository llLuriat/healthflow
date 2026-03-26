import { Link } from 'react-router';
import { 
  ArrowRight, 
  Calendar, 
  Bell, 
  Users, 
  TrendingUp,
  CheckCircle2,
  Clock,
  MessageSquare,
  Star,
  ChevronRight,
  Sparkles,
  Shield,
  Zap,
  BarChart3,
  Smartphone,
  Stethoscope,
  Activity
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hf-section bg-linear-to-b from-gray-50 to-white">
        <div className="hf-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mb-6"
                style={{ 
                  backgroundColor: 'var(--hf-primary-light)',
                  color: 'var(--hf-primary)'
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">Infraestrutura de previsibilidade</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Previsibilidade transforma a experiência do paciente
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                Reduza a ansiedade dos pacientes e melhore a organização da sua clínica com atualizações em tempo real sobre consultas e atrasos.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/primeiro-acesso">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto text-white"

                  >
                    Teste Grátis por 14 Dias
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/como-funciona">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Ver Como Funciona
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-gray-200">
                <div>
                  <div className="font-bold text-2xl text-gray-900">50K+</div>
                  <div className="text-sm text-gray-600">Atendimentos/mês</div>
                </div>
                <div className="h-12 w-px bg-gray-200" />
                <div>
                  <div className="font-bold text-2xl text-gray-900">98%</div>
                  <div className="text-sm text-gray-600">Satisfação</div>
                </div>
                <div className="h-12 w-px bg-gray-200" />
                <div>
                  <div className="font-bold text-2xl text-gray-900">15min</div>
                  <div className="text-sm text-gray-600">Economia média</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                <div className="bg-linear-to-br from-blue-500 to-blue-700 p-8 text-white">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold">Dashboard da Clínica</div>
                      <div className="text-sm text-blue-100">Tempo real</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="text-2xl font-bold">24</div>
                      <div className="text-sm text-blue-100">Consultas hoje</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="text-2xl font-bold">3</div>
                      <div className="text-sm text-blue-100">Atrasos ativos</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6">
                  <div className="space-y-3">
                    {[
                      { name: 'Ana Silva', status: 'in-progress', time: '14:00' },
                      { name: 'Carlos Santos', status: 'delayed', time: '14:30' },
                      { name: 'Maria Oliveira', status: 'scheduled', time: '15:00' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full" />
                          <div>
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.time}</div>
                          </div>
                        </div>
                        <div 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: item.status === 'in-progress' ? 'var(--hf-primary-light)' : 
                                           item.status === 'delayed' ? 'var(--hf-warning-light)' : 
                                           'var(--hf-gray-100)',
                            color: item.status === 'in-progress' ? 'var(--hf-primary)' : 
                                  item.status === 'delayed' ? 'var(--hf-warning)' : 
                                  'var(--hf-gray-600)'
                          }}
                        >
                          {item.status === 'in-progress' ? 'Em atendimento' : 
                           item.status === 'delayed' ? 'Atrasado' : 
                           'Agendado'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating Patient Card */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-64">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">Tela do Paciente</span>
                </div>
                <div className="font-semibold text-sm mb-2">Sua consulta em breve</div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Tempo estimado: 12 minutos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Problem Section */}
      <section className="hf-section bg-white">
        <div className="hf-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Problemas reais que afetam seu negócio
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A falta de comunicação gera frustração, avaliações negativas e sobrecarga operacional
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MessageSquare,
                title: 'Pacientes frustrados',
                description: 'Esperam sem informação sobre atrasos',
              },
              {
                icon: Users,
                title: 'Recepção sobrecarregada',
                description: 'Atende repetidas perguntas sobre tempo de espera',
              },
              {
                icon: Star,
                title: 'Avaliações negativas',
                description: 'Falta de comunicação gera insatisfação',
              },
              {
                icon: TrendingUp,
                title: 'Desorganização interna',
                description: 'Dificuldade em gerenciar fluxo de atendimentos',
              },
            ].map((problem, i) => (
              <Card key={i} className="border-gray-200">
                <CardContent className="p-6">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--hf-error-light)' }}
                  >
                    <problem.icon 
                      className="w-6 h-6"
                      style={{ color: 'var(--hf-error)' }}
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{problem.title}</h3>
                  <p className="text-sm text-gray-600">{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Solution Section */}
      <section className="hf-section bg-gray-50">
        <div className="hf-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como o HealthFlow funciona
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Três passos simples para transformar a experiência do seu paciente
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Calendar,
                title: 'Clínica atualiza',
                description: 'Sua equipe atualiza o status das consultas com um clique: +10min, em atendimento ou finalizado.',
              },
              {
                step: '02',
                icon: Zap,
                title: 'Sistema calcula',
                description: 'O HealthFlow processa automaticamente e recalcula o tempo de espera para todos os pacientes.',
              },
              {
                step: '03',
                icon: Bell,
                title: 'Paciente acompanha',
                description: 'Cada paciente recebe um link personalizado para acompanhar sua consulta em tempo real.',
              },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-gray-100 mb-4">{step.step}</div>
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white mb-6"
                  style={{ backgroundColor: 'var(--hf-primary)' }}
                >
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                {i < 2 && (
                  <ChevronRight 
                    className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-gray-300"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="hf-section bg-white">
        <div className="hf-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Benefícios para sua clínica
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: TrendingUp,
                    title: 'Melhore suas avaliações',
                    description: 'Pacientes informados são pacientes satisfeitos. Reduza reclamações sobre tempo de espera.',
                  },
                  {
                    icon: Users,
                    title: 'Libere sua recepção',
                    description: 'Elimine perguntas repetitivas sobre horários e tempo de espera. Sua equipe foca no que importa.',
                  },
                  {
                    icon: BarChart3,
                    title: 'Organize seu fluxo',
                    description: 'Visualize em tempo real o andamento das consultas e tome decisões mais informadas.',
                  },
                  {
                    icon: Shield,
                    title: 'Reduza ansiedade',
                    description: 'Transparência gera confiança. Pacientes tranquilos criam um ambiente melhor para todos.',
                  },
                ].map((benefit, i) => (
                  <div key={i} className="flex gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--hf-primary-light)' }}
                    >
                      <benefit.icon 
                        className="w-6 h-6"
                        style={{ color: 'var(--hf-primary)' }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Card className="border-gray-200 overflow-hidden">
                <div 
                  className="p-6 text-white"
                  style={{ backgroundColor: 'var(--hf-primary)' }}
                >
                  <h3 className="text-xl font-semibold mb-2">Para o paciente</h3>
                  <p className="text-blue-100">Experiência transparente e sem estresse</p>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[
                      'Acompanha sua posição na fila em tempo real',
                      'Recebe estimativa precisa de tempo de espera',
                      'Pode se organizar melhor durante a espera',
                      'Sente-se respeitado e valorizado',
                      'Acessa via link ou QR code, sem app',
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 
                          className="w-5 h-5 shrink-0 mt-0.5"
                          style={{ color: 'var(--hf-success)' }}
                        />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* Segments Section */}
      <section className="hf-section bg-gray-50">
        <div className="hf-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Para diversos segmentos da saúde
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Solução adaptável para diferentes tipos de estabelecimentos de saúde
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Clínica Médica',
                segment: 'medical',
                description: 'Gestão eficiente de consultórios e policlínicas',
                color: '#2563EB',
              },
              {
                name: 'Odontologia',
                segment: 'dental',
                description: 'Otimize o fluxo da sua clínica odontológica',
                color: '#0EA5E9',
              },
              {
                name: 'Veterinária',
                segment: 'veterinary',
                description: 'Atendimento pet com previsibilidade',
                color: '#059669',
              },
              {
                name: 'Hospital',
                segment: 'ophthalmology',
                description: 'Gestão de múltiplos especialistas e salas',
                color: '#1E40AF',
              },
            ].map((seg, i) => (
              <Card 
                key={i} 
                className="border-2 hover:shadow-lg transition-all cursor-pointer group"
                style={{ borderColor: seg.color + '20' }}
              >
                <CardContent className="p-6">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: seg.color + '15' }}
                  >
                    <Stethoscope 
                      className="w-6 h-6"
                      style={{ color: seg.color }}
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{seg.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{seg.description}</p>
                  <div 
                    className="text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                    style={{ color: seg.color }}
                  >
                    Saiba mais
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing Preview Section */}
      <section className="hf-section bg-white">
        <div className="hf-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planos para cada necessidade
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Escolha o plano ideal para o tamanho da sua operação
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Essencial',
                price: 'R$ 149',
                description: 'Para clínicas iniciantes',
                features: [
                  'Até 100 consultas/mês',
                  'Dashboard básico',
                  'Tela do paciente',
                  'Suporte por e-mail',
                ],
              },
              {
                name: 'Profissional',
                price: 'R$ 349',
                description: 'Para clínicas estabelecidas',
                features: [
                  'Até 500 consultas/mês',
                  'Dashboard completo',
                  'Múltiplos médicos',
                  'Relatórios avançados',
                  'Suporte prioritário',
                ],
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Personalizado',
                description: 'Para hospitais e redes',
                features: [
                  'Consultas ilimitadas',
                  'Múltiplas unidades',
                  'API e integrações',
                  'Gerente de conta dedicado',
                ],
              },
            ].map((plan, i) => (
              <Card 
                key={i}
                className={`relative ${plan.popular ? 'border-2' : ''}`}
                style={plan.popular ? { borderColor: 'var(--hf-primary)' } : {}}
              >
                {plan.popular && (
                  <div 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: 'var(--hf-primary)' }}
                  >
                    Mais Popular
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price.includes('R$') && (
                      <span className="text-gray-600">/mês</span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 
                          className="w-5 h-5 shrink-0"
                          style={{ color: 'var(--hf-success)' }}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/planos">
                    <Button 
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      style={plan.popular ? {
                        backgroundColor: 'var(--hf-primary)',
                        color: 'white'
                      } : {}}
                    >
                      {plan.popular ? 'Começar Agora' : 'Saiba Mais'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link 
              to="/planos"
              className="inline-flex items-center gap-2 font-medium"
              style={{ color: 'var(--hf-primary)' }}
            >
              Ver comparação completa de planos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="hf-section bg-gray-50">
        <div className="hf-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que dizem nossos clientes
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Dr. Paulo Mendes',
                role: 'Clínica Vida Saúde',
                text: 'Reduzimos em 70% as reclamações sobre tempo de espera. Nossos pacientes adoram saber exatamente quando serão atendidos.',
              },
              {
                name: 'Dra. Marina Costa',
                role: 'Odontologia Excellence',
                text: 'A recepção finalmente consegue focar no atendimento humanizado. O HealthFlow eliminou as perguntas sobre "quanto tempo falta".',
              },
              {
                name: 'Dr. Roberto Silva',
                role: 'Hospital Santa Cruz',
                text: 'Implementamos em 3 especialidades e o resultado foi imediato. Nossas avaliações no Google subiram de 3.8 para 4.7.',
              },
            ].map((testimonial, i) => (
              <Card key={i} className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star 
                        key={j}
                        className="w-5 h-5 fill-current"
                        style={{ color: 'var(--hf-warning)' }}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section 
        className="hf-section text-white"
        style={{ backgroundColor: 'var(--hf-primary)' }}
      >
        <div className="hf-container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Comece a transformar a experiência dos seus pacientes hoje
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Teste grátis por 14 dias. Não precisa cartão de crédito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/primeiro-acesso">
              <Button 
                size="lg" 
                variant="secondary"
                className="w-full sm:w-auto bg-white hover:bg-gray-100"
                style={{ color: 'var(--hf-primary)' }}
              >
                Começar Teste Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/como-funciona">
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white/10"
              >
                Agendar Demonstração
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}