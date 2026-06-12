# OficinaPRO - Front-end

Front-end do sistema de gestão de oficina mecânica.

## Tecnologias

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (componentes baseados em Radix UI)
- [Axios](https://axios-http.com/) para requisições à API
- [Sonner](https://sonner.emilkowal.ski/) para notificações (toast)

## Estrutura de pastas

```
front/
├── api/            # instância do Axios e configuração de requisições
├── app/            # rotas (App Router)
│   ├── login/
│   ├── cadastro/
│   └── (app)/      # rotas protegidas
│       ├── clientes/
│       ├── produtos/
│       ├── comandas/
│       ├── pagamentos/
│       └── loja/
├── components/     # componentes reutilizáveis (ui/, clientes/, produtos/, etc.)
├── services/        # camada de serviço (chamadas à API por entidade)
├── types/           # tipos TypeScript das entidades
├── hooks/           # hooks customizados
├── lib/             # funções utilitárias
└── middleware.ts    # proteção de rotas via JWT
```

## Funcionalidades

- Autenticação (login e cadastro) com JWT
- Gestão de clientes (CRUD, busca e filtros)
- Gestão de produtos (CRUD, filtros por tipo e status)
- Comandas/vendas (criação, listagem e detalhes)
- Pagamentos
- Cadastro inicial da loja 
