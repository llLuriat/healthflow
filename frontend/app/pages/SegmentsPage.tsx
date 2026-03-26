import { Link } from 'react-router';
import { 
  Stethoscope, 
  Heart, 
  Syringe, 
  Eye,
  Check,
  ArrowRight,
  Clock,
  Users,
  Star
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export default function SegmentsPage() {
  const segments = [
    {
      id: 'medico',
      name: 'Clínica Médica',
      icon: Stethoscope,
      color: '#2563EB',
      description: 'Reduza ligações e melhore a experiência do paciente em consultas médicas.',
      stats: {
        avgAppointments: '85',
        satisfaction: '96%',
        timeReduction: '40%'
      },
      features: [
        'Gestão de múltiplos consultórios',
        'Especialidades personalizáveis',
        'Integração com prontuário eletrônico',
        'Notificações automáticas',
        'Dashboard de atrasos em tempo real',
        'Relatórios de desempenho'
      ],
      testimonial: {
        quote: 'Reduziu em 70% as ligações perguntando sobre atrasos. Nossos pacientes estão muito mais satisfeitos.',
        author: 'Dr. Carlos Mendes',
        role: 'Clínica Saúde Integral',
        rating: 5
      },
      useCases: [
        'Clínicas de medicina geral',
        'Consultórios especializados',
        'Centros médicos'
      ]
    },
    {
      id: 'odonto',
      name: 'Odontologia',
      icon: Heart,
      color: '#0EA5E9',
      description: 'Organize procedimentos odontológicos e mantenha pacientes informados.',
      stats: {
        avgAppointments: '120',
        satisfaction: '98%',
        timeReduction: '45%'
      },
      features: [
        'Gestão de cadeiras odontológicas',
        'Procedimentos com tempos variáveis',
        'Alertas de atraso preventivos',
        'Comunicação com acompanhantes',
        'Controle de tempo por procedimento',
        'Histórico de pontualidade'
      ],
      testimonial: {
        quote: 'Nossos pacientes adoram saber quando vão ser chamados. A ansiedade diminuiu drasticamente.',
        author: 'Dra. Mariana Costa',
        role: 'Odonto Excellence',
        rating: 5
      },
      useCases: [
        'Clínicas odontológicas',
        'Consultórios ortodônticos',
        'Centros de implantes'
      ]
    },
    {
      id: 'veterinaria',
      name: 'Veterinária',
      icon: Syringe,
      color: '#059669',
      description: 'Gestão de atendimentos veterinários com foco no bem-estar animal e tutores.',
      stats: {
        avgAppointments: '95',
        satisfaction: '97%',
        timeReduction: '38%'
      },
      features: [
        'Identificação por tipo de animal',
        'Emergências priorizadas',
        'Comunicação com tutores',
        'Gestão de vacinas e retornos',
        'Tempo de espera por porte',
        'Alertas de ansiedade animal'
      ],
      testimonial: {
        quote: 'Os tutores ficam mais tranquilos sabendo que vão ser avisados. Menos estresse para os animais.',
        author: 'Dr. Roberto Silva',
        role: 'Clínica Veterinária Vida',
        rating: 5
      },
      useCases: [
        'Clínicas veterinárias',
        'Hospitais veterinários',
        'Pet shops com atendimento'
      ]
    },
    {
      id: 'oftalmo',
      name: 'Oftalmologia',
      icon: Eye,
      color: '#1E40AF',
      description: 'Controle preciso de exames e consultas oftalmológicas.',
      stats: {
        avgAppointments: '65',
        satisfaction: '95%',
        timeReduction: '42%'
      },
      features: [
        'Gestão de salas de exame',
        'Tempo por tipo de procedimento',
        'Fila de dilação pupilar',
        'Controle de equipamentos',
        'Agendamento de retornos',
        'Alertas para exames especiais'
      ],
      testimonial: {
        quote: 'Agora conseguimos otimizar o tempo de dilação e reduzir significativamente a espera.',
        author: 'Dra. Patrícia Almeida',
        role: 'Centro Oftalmológico Norte',
        rating: 5
      },
      useCases: [
        'Clínicas oftalmológicas',
        'Centros de cirurgia ocular',
        'Consultórios de optometria'
      ]
    }
  ];
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero */}
      <section className="hf-section bg-linear-to-b from-blue-50 to-white">
        <div className="hf-container text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Segmentos que confiaram no HealthFlow
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Infraestrutura de previsibilidade adaptada para cada especialidade da saúde.
          </p>
        </div>
      </section>
      
      {/* Segments */}
      {segments.map((segment, index) => (
        <section 
          key={segment.id}
          className="hf-section"
          style={{ backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB' }}
        >
          <div className="hf-container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: segment.color }}
                >
                  <segment.icon className="w-9 h-9 text-white" />
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {segment.name}
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  {segment.description}
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {segment.stats.avgAppointments}
                    </div>
                    <div className="text-sm text-gray-600">
                      Consultas/dia
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {segment.stats.satisfaction}
                    </div>
                    <div className="text-sm text-gray-600">
                      Satisfação
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      -{segment.stats.timeReduction}
                    </div>
                    <div className="text-sm text-gray-600">
                      Tempo espera
                    </div>
                  </div>
                </div>
                
                {/* Features */}
                <div className="space-y-3 mb-8">
                  {segment.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check 
                        className="w-5 h-5 shrink-0 mt-0.5"
                        style={{ color: segment.color }}
                      />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link to="/login">
                  <Button 
                    size="lg"
                    className="text-white"
                    style={{ backgroundColor: segment.color }}
                  >
                    Começar Teste Grátis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              
              {/* Testimonial & Use Cases */}
              <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                {/* Testimonial */}
                <Card className="mb-6 border-2" style={{ borderColor: segment.color }}>
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4">
                      {[...Array(segment.testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-lg text-gray-700 mb-6 italic">
                      "{segment.testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: segment.color }}
                      >
                        <segment.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {segment.testimonial.author}
                        </div>
                        <div className="text-sm text-gray-600">
                          {segment.testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Use Cases */}
                <Card className="border-gray-200">
                  <CardContent className="p-8">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" style={{ color: segment.color }} />
                      Ideal para:
                    </h3>
                    <ul className="space-y-3">
                      {segment.useCases.map((useCase, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div 
                            className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                            style={{ backgroundColor: segment.color }}
                          />
                          <span className="text-gray-700">{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      ))}
      
      {/* CTA */}
      <section className="hf-section bg-linear-to-br from-blue-600 to-blue-700 text-white">
        <div className="hf-container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Não encontrou seu segmento?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            O HealthFlow é adaptável para qualquer área da saúde. Entre em contato para uma solução personalizada.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button 
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto bg-white hover:bg-gray-100 text-blue-600"
              >
                Começar Teste Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button 
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-white text-white hover:bg-white/10"
            >
              Falar com Especialista
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
