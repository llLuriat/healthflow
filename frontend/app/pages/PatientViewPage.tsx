import { Activity, Clock, MapPin, Phone, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function PatientViewPage() {
  const appointment = {
    clinicName: 'Clínica Saúde+',
    doctorName: 'Dr. Paulo Mendes',
    specialty: 'Cardiologia',
    originalTime: '14:30',
    estimatedTime: '14:45',
    currentTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    status: 'waiting',
    position: 3,
    estimatedWait: '12 minutos',
    address: 'Av. Paulista, 1000 - Bela Vista',
    phone: '(11) 3000-0000',
  };
  
  // Color from clinic settings (would come from database)
  const primaryColor = '#2563EB';
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="px-6 py-6 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-2xl mx-auto">
          <Link to="/">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/10 mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{appointment.clinicName}</h1>
              <p className="text-sm opacity-90">Acompanhe sua consulta</p>
            </div>
          </div>
          
          {/* Main Time Display */}
          <div className="text-center py-6">
            <div className="text-sm opacity-90 mb-2">Horário estimado</div>
            <div className="text-5xl font-bold mb-2">{appointment.estimatedTime}</div>
            {appointment.estimatedTime !== appointment.originalTime && (
              <div className="text-sm opacity-90">
                Original: {appointment.originalTime}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6 py-6 max-w-2xl mx-auto space-y-4">
        {/* Status Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Clock 
                  className="w-10 h-10 p-2 rounded-lg"
                  style={{ 
                    backgroundColor: primaryColor + '20',
                    color: primaryColor
                  }}
                />
                <div>
                  <div className="font-semibold text-gray-900">Tempo estimado</div>
                  <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {appointment.estimatedWait}
                  </div>
                </div>
              </div>
              <div 
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: primaryColor + '20',
                  color: primaryColor
                }}
              >
                {appointment.position}º na fila
              </div>
            </div>
            
            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: primaryColor + '10' }}
            >
              <p className="text-sm text-gray-700">
                Você está próximo de ser atendido. Mantenha-se disponível na recepção. Esta página é atualizada automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Appointment Details */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Detalhes da Consulta</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Médico</span>
                <span className="font-medium text-gray-900">{appointment.doctorName}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Especialidade</span>
                <span className="font-medium text-gray-900">{appointment.specialty}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Horário original</span>
                <span className="font-medium text-gray-900">{appointment.originalTime}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Data</span>
                <span className="font-medium text-gray-900">
                  Quarta-feira, 11 de Fevereiro
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Status</span>
                <span 
                  className="font-medium px-3 py-1 rounded-full text-sm"
                  style={{ 
                    backgroundColor: primaryColor + '20',
                    color: primaryColor
                  }}
                >
                  Aguardando
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Clinic Info */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Informações da Clínica</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin 
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: primaryColor }}
                />
                <div>
                  <div className="text-sm text-gray-600 mb-1">Endereço</div>
                  <div className="text-gray-900">{appointment.address}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone 
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: primaryColor }}
                />
                <div>
                  <div className="text-sm text-gray-600 mb-1">Telefone</div>
                  <a 
                    href={`tel:${appointment.phone}`}
                    className="text-gray-900 hover:underline"
                  >
                    {appointment.phone}
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar 
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: primaryColor }}
                />
                <div>
                  <div className="text-sm text-gray-600 mb-1">Horário atual</div>
                  <div className="text-gray-900">{appointment.currentTime}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Help Text */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-2">
            Esta página é atualizada automaticamente
          </p>
          <p className="text-xs text-gray-400">
            Não precisa recarregar. Mantenha a tela aberta.
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-center py-8 px-6 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <span>Powered by</span>
          <div className="flex items-center gap-1 font-semibold" style={{ color: primaryColor }}>
            <Activity className="w-4 h-4" />
            <span>HealthFlow</span>
          </div>
        </div>
      </div>
    </div>
  );
}