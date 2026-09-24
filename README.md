# UDF Parking — Campus 3D

**Engenharia de Software | UDF · Análise e Projeto de Sistemas**

Protótipo interativo para explorar a disponibilidade de estacionamento, comparar planos e apresentar propostas de benefícios noturnos. O projeto aplica técnicas de análise e projeto de sistemas à mobilidade dos estudantes.

[Ver protótipo no Figma](https://www.figma.com/design/8sZfS0XjwaMhVcZYGXSvJT/UDF-PARKING) · [Board MoSCoW](https://miro.com/app/board/uXjVHowYrAk=/)

## Problema e proposta

A incerteza sobre encontrar vagas dificulta o planejamento da ida à universidade. O pagamento diário também pode elevar os custos de quem utiliza o estacionamento com frequência. À noite, estacionar longe amplia o percurso a pé e a preocupação com a segurança de homens e mulheres.

A proposta reúne consulta de vagas, planos mensais, bimestrais e semestrais com desconto, descontos noturnos para estudantes e **isenção noturna especificamente para mulheres**. Os benefícios são propostas acadêmicas sujeitas à avaliação e aprovação institucional.

## Funcionalidades

- Maquete 3D com rotação, zoom, passeio automático e foco por setor.
- Alternância entre dia e noite, com iluminação do campus.
- 72 vagas demonstrativas, divididas entre setores A, B e visitantes.
- Seleção de vagas pela maquete ou pela grade de botões.
- Simulação de ocupação com contadores e controle de pausa.
- Comparação de planos conforme a frequência mensal de uso.
- Aba de segurança com percurso ilustrativo e benefícios propostos.
- Interface responsiva e respeito à preferência por movimento reduzido.

## Tecnologias utilizadas

| Tecnologia | Aplicação |
| --- | --- |
| Next.js 16 e React 19 | Estrutura da aplicação e interface interativa |
| TypeScript | Tipagem dos componentes e da lógica |
| Three.js | Cena, geometrias, câmera, materiais e animação 3D |
| WebGL | Renderização acelerada da maquete |
| Canvas 2D | Renderização alternativa quando WebGL não está disponível |
| Tailwind CSS 4 e CSS | Estilos, estados e layout responsivo |
| shadcn/ui e primitivas de interface | Abas, controles e seletores |
| Lucide React | Ícones da interface |
| Figma | Referência visual e prototipação das telas |
| Vercel | Configuração de publicação do projeto |

## Como a maquete 3D foi construída

A cena foi modelada diretamente em código com Three.js. Geometrias básicas formam os blocos do campus, telhados, janelas, vias, árvores, postes, veículos e vagas. Os elementos são organizados em grupos para facilitar posicionamento e atualização.

Uma câmera em perspectiva e o **OrbitControls** permitem girar e aproximar a vista. A seleção usa **raycasting**: a posição do ponteiro é projetada sobre a cena para identificar a vaga ou o veículo clicado. O painel mantém os detalhes e os contadores sincronizados com o estado da aplicação.

O ciclo de animação usa `requestAnimationFrame` para movimentar veículos e suavizar a câmera. Os modos dia e noite ajustam iluminação e materiais; o percurso ilustrativo é destacado por marcadores. A ocupação muda por uma simulação local, que pode ser pausada.

Quando WebGL não está disponível, um renderizador alternativo projeta as geometrias da mesma cena em Canvas 2D. O tamanho acompanha o contêiner, e os recursos gráficos são liberados ao desmontar a cena.

**A maquete é uma representação aproximada, sem precisão de levantamento arquitetônico. Vagas, preços e percursos são demonstrativos. Não há reserva, pagamento, sensores ou consulta de ocupação real.**

## Arquivos principais

| Arquivo | Responsabilidade |
| --- | --- |
| `app/page.tsx` | Painéis, seleção de vagas, simulação e cálculo dos planos |
| `app/scene.tsx` | Construção e interação da cena Three.js |
| `app/software-renderer.ts` | Alternativa de renderização em Canvas 2D |
| `app/parking.css` | Identidade visual e responsividade |
| `components/ui/` | Componentes de interface |
| `vercel.json` | Configuração de publicação |

## Executar localmente

Requisito: Node.js 22.13 ou superior e npm.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Para verificar e executar a versão de produção:

```bash
npm run build
npm start
```

## Publicar na Vercel

1. Acesse a Vercel e escolha **Add New → Project**.
2. Importe `pietroviannadeveloper/Analise_Projeto_Sistemas_UDF`.
3. Mantenha a raiz do repositório como **Root Directory** e selecione **Next.js**.
4. Use `npm install` para instalação e `npm run build` para compilação; deixe o diretório de saída padrão.
5. Escolha o nome `udfparking` e clique em **Deploy**.

O protótipo não exige variáveis de ambiente. O endereço `udfparking.vercel.app` depende de disponibilidade na plataforma.

## Materiais da disciplina

- [Aula inaugural](Aula_Inaugural.md)
- [Projeto APS](ProjetoAPS/Readme.md)
- [Unidade 1](Unidade1/Atividade.md)
- [Unidade 2](Unidade2/Atividade2.md)
