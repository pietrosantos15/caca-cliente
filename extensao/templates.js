/* gerado a partir do app.js do Garimpo Local */
const NICHES_EXT = [
 {
  "l": "Restaurantes",
  "m": "comida",
  "q": "restaurante"
 },
 {
  "l": "Lanchonetes",
  "m": "comida",
  "q": "lanchonete"
 },
 {
  "l": "Cafeterias",
  "m": "comida",
  "q": "cafe"
 },
 {
  "l": "Bares",
  "m": "comida",
  "q": "bar"
 },
 {
  "l": "Padarias",
  "m": "comida",
  "q": "padaria"
 },
 {
  "l": "Salão de beleza",
  "m": "beleza",
  "q": "salao"
 },
 {
  "l": "Academias",
  "m": "academia",
  "q": "academia"
 },
 {
  "l": "Clínicas / médicos",
  "m": "clinica",
  "q": "clinica"
 },
 {
  "l": "Dentista",
  "m": "clinica",
  "q": "dentista"
 },
 {
  "l": "Veterinária",
  "m": "pet",
  "q": "veterinaria"
 },
 {
  "l": "Pet shops",
  "m": "pet",
  "q": "pet shop"
 },
 {
  "l": "Oficina mecânica",
  "m": "auto",
  "q": "oficina"
 },
 {
  "l": "Autopeças",
  "m": "auto",
  "q": "autopecas"
 },
 {
  "l": "Imobiliária",
  "m": "imoveis",
  "q": "imobiliaria"
 },
 {
  "l": "Advogado",
  "m": "profissional",
  "q": "advogado"
 },
 {
  "l": "Contabilidade",
  "m": "profissional",
  "q": "contabilidade"
 },
 {
  "l": "Loja de roupas",
  "m": "loja",
  "q": "roupa"
 },
 {
  "l": "Floricultura",
  "m": "loja",
  "q": "floricultura"
 },
 {
  "l": "Farmácia",
  "m": "loja",
  "q": "farmacia"
 },
 {
  "l": "Pousada / hotel",
  "m": "hospedagem",
  "q": "pousada"
 },
 {
  "l": "Autoescola",
  "m": "ensino",
  "q": "autoescola"
 },
 {
  "l": "Escola de idiomas",
  "m": "ensino",
  "q": "idiomas"
 },
 {
  "l": "Eletricista / encanador",
  "m": "servicos",
  "q": "eletricista"
 },
 {
  "l": "Estúdio de tatuagem",
  "m": "tatuagem",
  "q": "tatuagem"
 },
 {
  "l": "Energia solar",
  "m": "solar",
  "q": "energia solar"
 },
 {
  "l": "Pilates",
  "m": "pilates",
  "q": "pilates"
 },
 {
  "l": "Personal trainer",
  "m": "personal",
  "q": "personal trainer"
 },
 {
  "l": "Marcenaria / móveis planejados",
  "m": "marcenaria",
  "q": "marcenaria"
 },
 {
  "l": "Ótica",
  "m": "loja",
  "q": "otica"
 },
 {
  "l": "Supermercado / mercado",
  "m": "loja",
  "q": "mercado"
 },
 {
  "l": "Material de construção",
  "m": "loja",
  "q": "material de construcao"
 },
 {
  "l": "Lavanderia",
  "m": "servicos",
  "q": "lavanderia"
 }
];
const NICHE_TPL = {
 "clinica": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para clínicas e consultórios aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site próprio. Hoje, antes de escolher onde se consultar, muita gente pesquisa no celular: quer ver os serviços, o horário, o endereço e como marcar. Quem não aparece direito acaba perdendo esse paciente para outra clínica.\n\nEu faço uma página simples e organizada para a sua clínica, com:\n• especialidades, serviços e equipe;\n• horário de atendimento e endereço no mapa;\n• um botão para o paciente marcar a consulta direto no seu WhatsApp.\n\nAssim você passa mais confiança e recebe mais pedidos de consulta, sem a secretária precisar explicar tudo toda vez.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "comida": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para restaurantes, padarias e lanchonetes aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente decide onde comer olhando o celular: quer ver o cardápio, o horário e como chegar. Quem não aparece direito acaba perdendo cliente para o concorrente.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• cardápio com fotos e preços;\n• horário de funcionamento e endereço no mapa;\n• um botão para o cliente fazer o pedido ou a reserva direto no seu WhatsApp.\n\nAssim você recebe mais pedidos, sem depender só de indicação ou de aplicativo de entrega.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "beleza": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para salões e estúdios aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente escolhe onde se cuidar olhando fotos dos trabalhos no celular. Quem não aparece direito acaba perdendo cliente para outro lugar.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• fotos dos seus trabalhos;\n• serviços e preços;\n• horário e endereço no mapa;\n• um botão para a cliente agendar direto no seu WhatsApp.\n\nAssim sua agenda enche mais, sem você precisar responder as mesmas perguntas toda hora.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "academia": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para academias e estúdios de treino aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente escolhe onde treinar pesquisando no celular: quer ver as aulas, os horários e os planos. Quem não aparece direito acaba perdendo aluno para outra academia.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• modalidades, aulas e horários;\n• planos e preços;\n• fotos do espaço e endereço no mapa;\n• um botão para o aluno marcar uma aula experimental direto no seu WhatsApp.\n\nAssim você recebe mais alunos novos, sem depender só de indicação ou de rede social.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "pet": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para pet shops e clínicas veterinárias aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente procura um lugar de confiança para o pet pelo celular, antes de ir até o local. Quem não aparece direito acaba perdendo cliente para outro.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• serviços como banho e tosa, consultas e produtos;\n• horário e endereço no mapa;\n• um botão para o cliente agendar direto no seu WhatsApp.\n\nAssim você recebe mais clientes novos, sem depender só de indicação ou de rede social.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "auto": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para oficinas e lojas de autopeças aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, quando o carro dá problema, muita gente procura no celular alguém de confiança perto de casa. Quem não aparece direito acaba perdendo cliente para outra oficina.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• serviços, marcas atendidas e fotos do espaço;\n• horário e endereço no mapa;\n• um botão para o cliente pedir orçamento direto no seu WhatsApp.\n\nAssim você recebe mais pedidos de orçamento, sem depender só de indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "profissional": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para escritórios e profissionais aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de contratar alguém, muita gente pesquisa no celular para ver se pode confiar. Quem não aparece direito acaba perdendo esse cliente para outro profissional.\n\nEu faço uma página simples e bonita para o seu escritório, com:\n• apresentação e áreas de atuação;\n• endereço e horário de atendimento;\n• um botão para o cliente falar direto com você no WhatsApp.\n\nAssim você passa mais confiança e recebe mais pedidos de contato.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "imoveis": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para imobiliárias e corretores aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje quem procura imóvel começa a busca pelo celular, olhando fotos e valores. Quem não aparece direito acaba perdendo cliente para outra imobiliária.\n\nEu faço uma página simples e bonita para a sua imobiliária, com:\n• imóveis com fotos e valores;\n• apresentação da equipe e endereço no mapa;\n• um botão para o cliente pedir uma visita direto no seu WhatsApp.\n\nAssim você recebe mais contatos de interessados, sem depender só de portais e indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "loja": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para lojas aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente pesquisa no celular antes de ir comprar: quer ver os produtos, o horário e onde fica. Quem não aparece direito acaba perdendo cliente para outra loja.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• produtos com fotos e preços;\n• horário de funcionamento e endereço no mapa;\n• um botão para o cliente consultar ou encomendar direto no seu WhatsApp.\n\nAssim você recebe mais clientes e encomendas, sem depender só de quem passa na porta.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "hospedagem": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para pousadas e hotéis aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje quem vai viajar escolhe onde ficar olhando fotos e preços no celular. Quem não aparece direito acaba perdendo hóspede para outro lugar.\n\nEu faço uma página simples e bonita para a sua pousada, com:\n• fotos dos quartos e da estrutura;\n• valores, localização e como chegar;\n• um botão para o hóspede reservar direto no seu WhatsApp.\n\nAssim você recebe mais reservas diretas, sem pagar comissão para site de reservas.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "ensino": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para escolas e cursos aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de se matricular, muita gente pesquisa no celular: quer ver os cursos, os horários e os valores. Quem não aparece direito acaba perdendo aluno para outra escola.\n\nEu faço uma página simples e bonita para a sua escola, com:\n• cursos, turmas e horários;\n• valores e endereço no mapa;\n• um botão para o aluno pedir informações ou uma aula experimental direto no seu WhatsApp.\n\nAssim você recebe mais matrículas, sem depender só de indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "solar": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para empresas de energia solar aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de investir em energia solar, a pessoa pesquisa muito no celular: quer entender como funciona, ver projetos feitos e confiar na empresa. Quem não aparece direito acaba perdendo esse orçamento para outra empresa.\n\nEu faço uma página simples e profissional para a sua empresa, com:\n• como funciona a energia solar e quanto o cliente pode economizar;\n• projetos já instalados, com fotos;\n• um botão para o cliente pedir um orçamento direto no seu WhatsApp.\n\nAssim você recebe mais pedidos de orçamento de pessoas realmente interessadas, sem depender só de indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "pilates": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para estúdios de pilates aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente escolhe o estúdio pelo celular: quer ver as aulas, os horários, os planos e o espaço. Quem não aparece direito acaba perdendo aluna para outro estúdio.\n\nEu faço uma página simples e bonita para o seu estúdio, com:\n• modalidades, aulas e horários;\n• planos e valores;\n• fotos do espaço e endereço no mapa;\n• um botão para marcar uma aula experimental direto no seu WhatsApp.\n\nAssim você recebe mais alunos novos, sem depender só de indicação ou de rede social.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "personal": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para personal trainers e estúdios de treino aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de contratar um personal, muita gente pesquisa no celular: quer conhecer o profissional, o método e ver resultados de alunos. Quem não aparece direito acaba perdendo esse aluno para outro profissional.\n\nEu faço uma página simples e profissional para o seu trabalho, com:\n• sua apresentação, formação e método de treino;\n• planos, horários e locais de atendimento;\n• um botão para o aluno marcar uma avaliação direto no seu WhatsApp.\n\nAssim você passa mais confiança e recebe mais alunos novos, sem depender só de indicação ou do Instagram.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "marcenaria": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para marcenarias e empresas de móveis planejados aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de fechar um projeto sob medida, o cliente pesquisa muito no celular: quer ver fotos de ambientes prontos e saber se pode confiar. Quem não aparece direito acaba perdendo esse orçamento para outra marcenaria.\n\nEu faço uma página simples e bonita para a sua empresa, com:\n• galeria de projetos (cozinhas, quartos, closets, escritórios);\n• como funciona o atendimento, do projeto à instalação;\n• um botão para o cliente pedir orçamento direto no seu WhatsApp.\n\nAssim você recebe mais pedidos de orçamento, sem depender só de indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "tatuagem": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para estúdios de tatuagem aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de escolher o estúdio, a pessoa olha o portfólio e a higiene do lugar pelo celular. Quem não aparece direito acaba perdendo esse cliente para outro estúdio.\n\nEu faço uma página simples e bonita para o seu estúdio, com:\n• portfólio dos tatuadores e estilos;\n• como funciona o orçamento e o agendamento;\n• endereço no mapa e cuidados pós-tatuagem;\n• um botão para o cliente pedir orçamento direto no seu WhatsApp.\n\nAssim você recebe mais pedidos de orçamento, sem depender só do Instagram.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
 "servicos": "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para prestadores de serviço aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, quando alguém precisa de um serviço, procura no celular e chama quem parece mais confiável. Quem não aparece direito acaba perdendo esse cliente.\n\nEu faço uma página simples e bonita para o seu trabalho, com:\n• serviços e fotos de trabalhos feitos;\n• região atendida e horário;\n• um botão para o cliente pedir orçamento direto no seu WhatsApp.\n\nAssim você recebe mais pedidos de orçamento, sem depender só de indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂"
};
const DEFAULT_TPL = "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para negócios aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente procura {nicho} pelo celular antes de ir até o local, e quem não aparece acaba perdendo cliente.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• fotos, serviços e preços;\n• horário de funcionamento e endereço no mapa;\n• um botão para o cliente chamar direto no seu WhatsApp.\n\nAssim você recebe mais clientes novos, sem depender só de indicação ou redes sociais.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂";
