# HealthFlow - Gestão Inteligente de Fluxo para Saúde

Plataforma SaaS B2B completa de previsibilidade e gestão de fluxo para clínicas e hospitais que reduz a ansiedade do paciente através de atualizações em tempo real sobre consultas e atrasos.

## 🚀 Tecnologias

- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite 6** - Build tool
- **React Router 7** - Roteamento
- **Tailwind CSS v4** - Estilização
- **shadcn/ui + Radix** - Componentes UI
- **React Hook Form** - Gerenciamento de formulários
- **Lucide React** - Ícones

## 🏗️ Estrutura do Projeto

```
/src
  /app
    /components      # Componentes reutilizáveis
      /ui           # Componentes shadcn/ui
    /layouts        # Layouts (Public, Institution, Admin)
    /pages          # Páginas da aplicação
    App.tsx         # Componente raiz
  /styles
    index.css       # Estilos principais
    theme.css       # Tema shadcn/ui
    healthflow-theme.css  # Sistema de temas HealthFlow
  main.tsx          # Entry point
```

## 🎨 Sistema de Temas

O HealthFlow possui um sistema de temas escalável que permite trocar cores sem alterar o layout:

- **Medical** (Médico) - Azul #2563EB
- **Dental** (Odontologia) - Ciano #0EA5E9
- **Veterinary** (Veterinária) - Verde #059669
- **Ophthalmology** (Oftalmologia) - Azul Escuro #1E40AF

## 🔐 RBAC (Role-Based Access Control)

- **Admin** - Acesso total à plataforma HealthFlow
- **Cliente** - Acesso ao dashboard da instituição
- **Usuário** - Acesso limitado

## 📱 Rotas

### Site Institucional
- `/` - Home
- `/como-funciona` - Como Funciona
- `/segmentos` - Segmentos
- `/planos` - Planos e Preços

### Área da Instituição
- `/dashboard` - Dashboard da clínica
- `/consultas` - Gestão de consultas
- `/profissionais` - Gestão de profissionais
- `/configuracoes` - Configurações

### Área Admin
- `/admin` - Login Admin
- `/admin/clientes` - Gestão de clientes
- `/admin/assinaturas` - Gestão de assinaturas

### Área Pública (Paciente)
- `/paciente/:id` - Visualização do status da consulta

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📄 Licença

Copyright © 2026 HealthFlow. Todos os direitos reservados.
