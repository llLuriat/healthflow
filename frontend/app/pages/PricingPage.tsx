import { Link } from 'react-router';
import { Check, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

export default function PricingPage() {
  const plans = [
    {
      name: 'Essencial',
      price: '149',
      description: 'Ideal para clínicas iniciantes',
      features: [
        'Até 100 consultas/mês',
        'Dashboard básico',
        'Tela do paciente',
        '1 médico/profissional',
        'Suporte por e-mail',
        'Personalização de cores',
      ],
      limitations: [
        'Sem relatórios avançados',
        'Sem múltiplos usuários',
      ],
    },
    {
      name: 'Profissional',
      price: '349',
      description: 'Para clínicas estabelecidas',
      popular: true,
      features: [
        'Até 500 consultas/mês',
        'Dashboard completo',
        'Tela do paciente',
        'Até 5 médicos/profissionais',
        'Múltiplas salas',
        'Relatórios avançados',
        'Histórico de 6 meses',
        'Suporte prioritário',
        'Personalização completa',
        'Integração por API',
      ],
      limitations: [],
    },
    {
      name: 'Enterprise',
      price: 'custom',
      description: 'Para hospitais e redes',
      features: [
        'Consultas ilimitadas',
        'Médicos ilimitados',
        'Múltiplas unidades',
        'Dashboard executivo',
        'Relatórios personalizados',
        'Histórico ilimitado',
        'API e webhooks',
        'SLA garantido',
        'Gerente de conta dedicado',
        'Treinamento in loco',
        'White-label disponível',
      ],
      limitations: [],
    },
  ];
  
  const faqs = [
    {
      question: 'Posso cancelar a qualquer momento?',
      answer: 'Sim, você pode cancelar seu plano a qualquer momento sem multas ou taxas adicionais. O cancelamento entra em vigor no final do período de faturamento atual.',
    },
    {
      question: 'O que acontece se eu ultrapassar o limite de consultas?',
      answer: 'Você será notificado quando atingir 80% do limite. Caso ultrapasse, cobraremos R$ 0,50 por consulta adicional ou você pode fazer upgrade para um plano superior.',
    },
    {
      question: 'Existe período de teste?',
      answer: 'Sim! Oferecemos 14 dias de teste gratuito com acesso completo ao plano Profissional. Não é necessário cartão de crédito.',
    },
    {
      question: 'Os dados são seguros?',
      answer: 'Sim. Utilizamos criptografia de ponta a ponta, servidores seguros no Brasil e estamos em conformidade com a LGPD. Backups são realizados diariamente.',
    },
    {
      question: 'Posso mudar de plano depois?',
      answer: 'Sim, você pode fazer upgrade ou downgrade a qualquer momento. Mudanças entram em vigor imediatamente e ajustamos o valor proporcionalmente.',
    },
    {
      question: 'Preciso instalar algum software?',
      answer: 'Não. O HealthFlow é 100% baseado na web. Funciona em qualquer navegador moderno, desktop ou mobile.',
    },
  ];
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero */}
      <section className="hf-section bg-linear-to-b from-gray-50 to-white">
        <div className="hf-container text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Planos transparentes e sem surpresas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Escolha o plano ideal para o tamanho da sua operação. Todos incluem 14 dias de teste grátis.
          </p>
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ 
              backgroundColor: 'var(--hf-success-light)',
              color: 'var(--hf-success)'
            }}
          >
            <Check className="w-4 h-4" />
            Sem cartão de crédito no teste
          </div>
        </div>
      </section>
      
      {/* Pricing Cards */}
      <section className="hf-section bg-white">
        <div className="hf-container">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <Card 
                key={i}
                className={`relative ${plan.popular ? 'border-2 shadow-lg' : 'border'}`}
                style={plan.popular ? { borderColor: 'var(--hf-primary)' } : {}}
              >
                {plan.popular && (
                  <div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: 'var(--hf-primary)' }}
                  >
                    Mais Popular
                  </div>
                )}
                
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-8">
                    {plan.price === 'custom' ? (
                      <div>
                        <span className="text-3xl font-bold text-gray-900">Personalizado</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-gray-600">R$</span>
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-gray-600">/mês</span>
                      </div>
                    )}
                  </div>
                  
                  <Link to="/login">
                    <Button 
                      className="w-full mb-8"
                      size="lg"
                      variant={plan.popular ? 'default' : 'outline'}
                      style={plan.popular ? {
                        backgroundColor: 'var(--hf-primary)',
                        color: 'white'
                      } : {}}
                    >
                      {plan.price === 'custom' ? 'Falar com Vendas' : 'Começar Teste Grátis'}
                    </Button>
                  </Link>
                  
                  <div className="space-y-4 mb-6">
                    <div className="font-semibold text-sm text-gray-900 uppercase tracking-wide">
                      Incluído:
                    </div>
                    {plan.features.map((feature, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <Check 
                          className="w-5 h-5 shrink-0 mt-0.5"
                          style={{ color: 'var(--hf-success)' }}
                        />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {plan.limitations.length > 0 && (
                    <div className="pt-6 border-t border-gray-200">
                      <div className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-4">
                        Não incluído:
                      </div>
                      {plan.limitations.map((limitation, j) => (
                        <div key={j} className="flex items-start gap-3 mb-3">
                          <div className="w-5 h-5 shrink-0 mt-0.5 text-gray-400">×</div>
                          <span className="text-gray-500 text-sm">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Comparison Table */}
      <section className="hf-section bg-gray-50">
        <div className="hf-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comparação detalhada
            </h2>
          </div>
          
          <div className="max-w-5xl mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-6 font-semibold text-gray-900">Recurso</th>
                    <th className="text-center p-6 font-semibold text-gray-900">Essencial</th>
                    <th className="text-center p-6 font-semibold text-gray-900">Profissional</th>
                    <th className="text-center p-6 font-semibold text-gray-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Consultas mensais', values: ['100', '500', 'Ilimitado'] },
                    { name: 'Médicos/Profissionais', values: ['1', '5', 'Ilimitado'] },
                    { name: 'Tela do paciente', values: [true, true, true] },
                    { name: 'Dashboard', values: ['Básico', 'Completo', 'Executivo'] },
                    { name: 'Relatórios', values: [false, true, true] },
                    { name: 'Múltiplas unidades', values: [false, false, true] },
                    { name: 'API e integrações', values: [false, true, true] },
                    { name: 'Suporte', values: ['E-mail', 'Prioritário', 'Dedicado'] },
                    { name: 'White-label', values: [false, false, true] },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-6 text-gray-700">{row.name}</td>
                      {row.values.map((value, j) => (
                        <td key={j} className="text-center p-6">
                          {typeof value === 'boolean' ? (
                            value ? (
                              <Check 
                                className="w-5 h-5 mx-auto"
                                style={{ color: 'var(--hf-success)' }}
                              />
                            ) : (
                              <span className="text-gray-400">—</span>
                            )
                          ) : (
                            <span className="text-gray-700">{value}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ */}
      <section className="hf-section bg-white">
        <div className="hf-container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Perguntas frequentes
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem 
                  key={i} 
                  value={`item-${i}`}
                  className="border border-gray-200 rounded-lg px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                    <div className="flex items-start gap-3">
                      <HelpCircle 
                        className="w-5 h-5 shrink-0 mt-0.5"
                        style={{ color: 'var(--hf-primary)' }}
                      />
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pl-8">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
            Teste grátis por 14 dias. Sem compromisso.
          </p>
          <Link to="/dashboard">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white hover:bg-gray-100"
              style={{ color: 'var(--hf-primary)' }}
            >
              Começar Teste Grátis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}