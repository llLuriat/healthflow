import { Link } from 'react-router';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--hf-primary-light)' }}
          >
            <AlertCircle 
              className="w-8 h-8"
              style={{ color: 'var(--hf-primary)' }}
            />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 mb-2">
            404
          </h1>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Página não encontrada
          </h2>
          
          <p className="text-gray-600 mb-8">
            Desculpe, a página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button
                variant="outline"
                className="gap-2 w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
            <Link to="/">
              <Button
                className="gap-2 w-full sm:w-auto text-white"

              >
                <Home className="w-4 h-4" />
                Ir para Início
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
