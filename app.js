/* ====== utilidades ====== */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = {get(k,d){try{return JSON.parse(localStorage.getItem(k)) ?? d}catch{return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
const hav = (a,b,c,d) => {const R=6371,r=Math.PI/180,dx=(c-a)*r,dy=(d-b)*r,x=Math.sin(dx/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(dy/2)**2;return 2*R*Math.asin(Math.sqrt(x))};

/* ====== nichos -> tags OSM ====== */
const NICHES = [
 {l:"Restaurantes",k:["restaurante","restaurant"],f:["amenity=restaurant"],m:"comida"},
 {l:"Lanchonetes",k:["lanchonete","fast food","hamburgueria","pizzaria"],f:["amenity=fast_food"],m:"comida"},
 {l:"Cafeterias",k:["cafe","cafeteria"],f:["amenity=cafe"],m:"comida"},
 {l:"Bares",k:["bar","pub","boteco"],f:["amenity=bar|pub"],m:"comida"},
 {l:"Padarias",k:["padaria","confeitaria"],f:["shop=bakery"],m:"comida"},
 {l:"Salão de beleza",k:["salao","beleza","cabeleireiro","cabeleireira","barbearia","barbeiro","manicure","estetica"],f:["shop=hairdresser|beauty"],g:["salão de beleza","barbearia"],m:"beleza"},
 {l:"Academias",k:["academia","fitness","crossfit"],f:["leisure=fitness_centre"],m:"academia"},
 {l:"Clínicas / médicos",k:["clinica","medico","consultorio","fisioterapia","psicologo","psicologia","nutricionista","saude"],f:["amenity=clinic|doctors","healthcare=clinic|doctor|centre|physiotherapist|psychotherapist|alternative|audiologist|podiatrist|speech_therapist|occupational_therapist|nutrition_counselling"],z:["clínica","consultório","médico"],m:"clinica"},
 {l:"Dentista",k:["dentista","odontologia","dentist"],f:["amenity=dentist","healthcare=dentist"],z:["dentista","odontologia"],m:"clinica"},
 {l:"Veterinária",k:["veterinaria","veterinario","vet"],f:["amenity=veterinary"],m:"pet"},
 {l:"Pet shops",k:["pet shop","petshop","pet"],f:["shop=pet"],m:"pet"},
 {l:"Oficina mecânica",k:["oficina","mecanica","mecanico","auto center"],f:["shop=car_repair"],m:"auto"},
 {l:"Autopeças",k:["autopecas","auto pecas","pecas"],f:["shop=car_parts"],m:"auto"},
 {l:"Imobiliária",k:["imobiliaria","corretor","imoveis"],f:["office=estate_agent"],m:"imoveis"},
 {l:"Advogado",k:["advogado","advocacia","escritorio de advocacia"],f:["office=lawyer"],m:"profissional"},
 {l:"Contabilidade",k:["contabilidade","contador"],f:["office=accountant"],m:"profissional"},
 {l:"Loja de roupas",k:["roupa","moda","boutique","loja de roupas"],f:["shop=clothes"],m:"loja"},
 {l:"Floricultura",k:["floricultura","flores"],f:["shop=florist"],m:"loja"},
 {l:"Farmácia",k:["farmacia","drogaria"],f:["amenity=pharmacy"],m:"loja"},
 {l:"Pousada / hotel",k:["pousada","hotel","hostel"],f:["tourism=hotel|guest_house|hostel"],m:"hospedagem"},
 {l:"Autoescola",k:["autoescola","auto escola","cfc"],f:["amenity=driving_school"],m:"ensino"},
 {l:"Escola de idiomas",k:["idiomas","ingles","curso de ingles"],f:["amenity=language_school"],m:"ensino"},
 {l:"Eletricista / encanador",k:["eletricista","encanador","pintor","serviços","servicos"],f:["craft=electrician|plumber|painter|hvac"],m:"servicos"},
 {l:"Estúdio de tatuagem",k:["tatuagem","tatuador","tattoo","estudio de tatuagem","estudio de tattoo"],f:["shop=tattoo"],n:"tattoo|tatuagem|tatuador",z:["tatuagem","tattoo"],m:"tatuagem"},
 {l:"Energia solar",k:["energia solar","solar","fotovoltaica","fotovoltaico","placa solar","paineis solares"],f:["craft=photovoltaic_installer","office=energy_supplier"],n:"solar|fotovoltaic|photovoltaic",z:["energia solar","solar"],m:"solar"},
 {l:"Pilates",k:["pilates","studio de pilates","estudio de pilates"],f:["sport=pilates"],n:"pilates",z:["pilates"],m:"pilates"},
 {l:"Personal trainer",k:["personal trainer","personal","personal training","treino personalizado","treinador"],n:"personal (trainer|training|fitness)|treinamento personalizado|studio de treino|est[úu]dio de treino",z:["personal trainer","treinamento personalizado"],m:"personal"},
 {l:"Marcenaria / móveis planejados",k:["marcenaria","marceneiro","moveis planejados","planejados","moveis sob medida","marcenaria planejada"],f:["craft=carpenter|joiner","shop=kitchen"],n:"marcenaria|marceneiro|planejad|sob medida",z:["marcenaria","móveis planejados"],m:"marcenaria"},
 {l:"Ótica",k:["otica","oculos"],f:["shop=optician"],m:"loja"},
 {l:"Supermercado / mercado",k:["mercado","supermercado","mercearia"],f:["shop=supermarket|convenience"],m:"loja"},
 {l:"Material de construção",k:["material de construcao","construcao","ferragens"],f:["shop=hardware|doityourself"],m:"loja"},
 {l:"Lavanderia",k:["lavanderia","lava rapido","lavagem"],f:["shop=laundry","amenity=car_wash"],m:"servicos"},
];
$("nl").innerHTML = NICHES.map(n => `<option value="${esc(n.l)}">`).join("");
function resolveNiche(q){
  const t = norm(q);
  const direct = q.trim().match(/^([\w:]+)=([\w|:-]+)$/);
  if(direct) return {f:[q.trim()], label:q.trim()};
  const hit = NICHES.find(n => norm(n.l) === t) || NICHES.find(n => n.k.some(k => k === t)) || NICHES.find(n => n.k.some(k => t.includes(k) && k.length > 3));
  if(hit) return {f:hit.f, n:hit.n, z:hit.z || [hit.k[0]], label:hit.l.toLowerCase(), m:hit.m, g:hit.g};
  return {name:t, label:q.trim().toLowerCase()};
}

/* ====== telefones ====== */
function normPhone(raw, cc){
  const first = String(raw).split(/[;,\/]| ou /)[0];
  let d = first.replace(/\D/g, "");
  if(first.trim().startsWith("00")) d = d.slice(2);
  if(!d) return null;
  if(cc === "55"){
    if(d.startsWith("55") && (d.length === 12 || d.length === 13)) return d;
    d = d.replace(/^0+/, "");
    if(d.length === 10 || d.length === 11) return "55" + d;
    return null;
  }
  return d.startsWith(cc) ? d : cc + d;
}
function fmtPhone(n, cc){
  if(cc === "55" && n.startsWith("55")){
    const l = n.slice(2), r = l.slice(2);
    return `(${l.slice(0,2)}) ${r.length === 9 ? r.slice(0,5)+"-"+r.slice(5) : r.slice(0,4)+"-"+r.slice(4)}`;
  }
  return "+" + n;
}
const isBRMobile = n => n.startsWith("55") && n.length === 13 && n[4] === "9";

/* ====== estado ====== */
const STAGES = [["novo","Novo"],["contactado","Contactado"],["respondeu","Respondeu"],["reuniao","Reunião"],["fechado","Fechado ✅"],["perdido","Perdido"]];
const stageName = k => STAGES.find(s => s[0] === k)[1];
let S = store.get("gc_state", {});           // id -> {stage, notes, manual, snap}
const NICHE_TPL = {clinica: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para clínicas e consultórios aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site próprio. Hoje, antes de escolher onde se consultar, muita gente pesquisa no celular: quer ver os serviços, o horário, o endereço e como marcar. Quem não aparece direito acaba perdendo esse paciente para outra clínica.\n\nEu faço uma página simples e organizada para a sua clínica, com:\n• especialidades, serviços e equipe;\n• horário de atendimento e endereço no mapa;\n• um botão para o paciente marcar a consulta direto no seu WhatsApp.\n\nAssim você passa mais confiança e recebe mais pedidos de consulta, sem a secretária precisar explicar tudo toda vez.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  comida: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para restaurantes, padarias e lanchonetes aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente decide onde comer olhando o celular: quer ver o cardápio, o horário e como chegar. Quem não aparece direito acaba perdendo cliente para o concorrente.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• cardápio com fotos e preços;\n• horário de funcionamento e endereço no mapa;\n• um botão para o cliente fazer o pedido ou a reserva direto no seu WhatsApp.\n\nAssim você recebe mais pedidos, sem depender só de indicação ou de aplicativo de entrega.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  beleza: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para salões e estúdios aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente escolhe onde se cuidar olhando fotos dos trabalhos no celular. Quem não aparece direito acaba perdendo cliente para outro lugar.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• fotos dos seus trabalhos;\n• serviços e preços;\n• horário e endereço no mapa;\n• um botão para a cliente agendar direto no seu WhatsApp.\n\nAssim sua agenda enche mais, sem você precisar responder as mesmas perguntas toda hora.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  academia: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para academias e estúdios de treino aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente escolhe onde treinar pesquisando no celular: quer ver as aulas, os horários e os planos. Quem não aparece direito acaba perdendo aluno para outra academia.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• modalidades, aulas e horários;\n• planos e preços;\n• fotos do espaço e endereço no mapa;\n• um botão para o aluno marcar uma aula experimental direto no seu WhatsApp.\n\nAssim você recebe mais alunos novos, sem depender só de indicação ou de rede social.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  pet: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para pet shops e clínicas veterinárias aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente procura um lugar de confiança para o pet pelo celular, antes de ir até o local. Quem não aparece direito acaba perdendo cliente para outro.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• serviços como banho e tosa, consultas e produtos;\n• horário e endereço no mapa;\n• um botão para o cliente agendar direto no seu WhatsApp.\n\nAssim você recebe mais clientes novos, sem depender só de indicação ou de rede social.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  auto: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para oficinas e lojas de autopeças aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, quando o carro dá problema, muita gente procura no celular alguém de confiança perto de casa. Quem não aparece direito acaba perdendo cliente para outra oficina.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• serviços, marcas atendidas e fotos do espaço;\n• horário e endereço no mapa;\n• um botão para o cliente pedir orçamento direto no seu WhatsApp.\n\nAssim você recebe mais pedidos de orçamento, sem depender só de indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  profissional: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para escritórios e profissionais aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de contratar alguém, muita gente pesquisa no celular para ver se pode confiar. Quem não aparece direito acaba perdendo esse cliente para outro profissional.\n\nEu faço uma página simples e bonita para o seu escritório, com:\n• apresentação e áreas de atuação;\n• endereço e horário de atendimento;\n• um botão para o cliente falar direto com você no WhatsApp.\n\nAssim você passa mais confiança e recebe mais pedidos de contato.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  imoveis: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para imobiliárias e corretores aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje quem procura imóvel começa a busca pelo celular, olhando fotos e valores. Quem não aparece direito acaba perdendo cliente para outra imobiliária.\n\nEu faço uma página simples e bonita para a sua imobiliária, com:\n• imóveis com fotos e valores;\n• apresentação da equipe e endereço no mapa;\n• um botão para o cliente pedir uma visita direto no seu WhatsApp.\n\nAssim você recebe mais contatos de interessados, sem depender só de portais e indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  loja: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para lojas aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente pesquisa no celular antes de ir comprar: quer ver os produtos, o horário e onde fica. Quem não aparece direito acaba perdendo cliente para outra loja.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• produtos com fotos e preços;\n• horário de funcionamento e endereço no mapa;\n• um botão para o cliente consultar ou encomendar direto no seu WhatsApp.\n\nAssim você recebe mais clientes e encomendas, sem depender só de quem passa na porta.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  hospedagem: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para pousadas e hotéis aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje quem vai viajar escolhe onde ficar olhando fotos e preços no celular. Quem não aparece direito acaba perdendo hóspede para outro lugar.\n\nEu faço uma página simples e bonita para a sua pousada, com:\n• fotos dos quartos e da estrutura;\n• valores, localização e como chegar;\n• um botão para o hóspede reservar direto no seu WhatsApp.\n\nAssim você recebe mais reservas diretas, sem pagar comissão para site de reservas.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  ensino: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para escolas e cursos aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de se matricular, muita gente pesquisa no celular: quer ver os cursos, os horários e os valores. Quem não aparece direito acaba perdendo aluno para outra escola.\n\nEu faço uma página simples e bonita para a sua escola, com:\n• cursos, turmas e horários;\n• valores e endereço no mapa;\n• um botão para o aluno pedir informações ou uma aula experimental direto no seu WhatsApp.\n\nAssim você recebe mais matrículas, sem depender só de indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  solar: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para empresas de energia solar aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de investir em energia solar, a pessoa pesquisa muito no celular: quer entender como funciona, ver projetos feitos e confiar na empresa. Quem não aparece direito acaba perdendo esse orçamento para outra empresa.\n\nEu faço uma página simples e profissional para a sua empresa, com:\n• como funciona a energia solar e quanto o cliente pode economizar;\n• projetos já instalados, com fotos;\n• um botão para o cliente pedir um orçamento direto no seu WhatsApp.\n\nAssim você recebe mais pedidos de orçamento de pessoas realmente interessadas, sem depender só de indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  pilates: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para estúdios de pilates aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente escolhe o estúdio pelo celular: quer ver as aulas, os horários, os planos e o espaço. Quem não aparece direito acaba perdendo aluna para outro estúdio.\n\nEu faço uma página simples e bonita para o seu estúdio, com:\n• modalidades, aulas e horários;\n• planos e valores;\n• fotos do espaço e endereço no mapa;\n• um botão para marcar uma aula experimental direto no seu WhatsApp.\n\nAssim você recebe mais alunos novos, sem depender só de indicação ou de rede social.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  personal: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para personal trainers e estúdios de treino aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de contratar um personal, muita gente pesquisa no celular: quer conhecer o profissional, o método e ver resultados de alunos. Quem não aparece direito acaba perdendo esse aluno para outro profissional.\n\nEu faço uma página simples e profissional para o seu trabalho, com:\n• sua apresentação, formação e método de treino;\n• planos, horários e locais de atendimento;\n• um botão para o aluno marcar uma avaliação direto no seu WhatsApp.\n\nAssim você passa mais confiança e recebe mais alunos novos, sem depender só de indicação ou do Instagram.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  marcenaria: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para marcenarias e empresas de móveis planejados aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de fechar um projeto sob medida, o cliente pesquisa muito no celular: quer ver fotos de ambientes prontos e saber se pode confiar. Quem não aparece direito acaba perdendo esse orçamento para outra marcenaria.\n\nEu faço uma página simples e bonita para a sua empresa, com:\n• galeria de projetos (cozinhas, quartos, closets, escritórios);\n• como funciona o atendimento, do projeto à instalação;\n• um botão para o cliente pedir orçamento direto no seu WhatsApp.\n\nAssim você recebe mais pedidos de orçamento, sem depender só de indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  tatuagem: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para estúdios de tatuagem aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de escolher o estúdio, a pessoa olha o portfólio e a higiene do lugar pelo celular. Quem não aparece direito acaba perdendo esse cliente para outro estúdio.\n\nEu faço uma página simples e bonita para o seu estúdio, com:\n• portfólio dos tatuadores e estilos;\n• como funciona o orçamento e o agendamento;\n• endereço no mapa e cuidados pós-tatuagem;\n• um botão para o cliente pedir orçamento direto no seu WhatsApp.\n\nAssim você recebe mais pedidos de orçamento, sem depender só do Instagram.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  servicos: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para prestadores de serviço aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, quando alguém precisa de um serviço, procura no celular e chama quem parece mais confiável. Quem não aparece direito acaba perdendo esse cliente.\n\nEu faço uma página simples e bonita para o seu trabalho, com:\n• serviços e fotos de trabalhos feitos;\n• região atendida e horário;\n• um botão para o cliente pedir orçamento direto no seu WhatsApp.\n\nAssim você recebe mais pedidos de orçamento, sem depender só de indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂"};
const PREV_TPL = "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para negócios aqui da região de {cidade}.\n\nPesquisei a {nome} no Google e no mapa e vi que vocês ainda não têm um site ou página própria. Hoje muita gente procura {nicho} pelo celular antes de ir ao local, e quem não aparece direito acaba perdendo cliente para o concorrente.\n\nEu crio páginas simples e profissionais (landing pages) para negócios locais, com:\n• fotos, serviços e preços;\n• horário e localização no mapa;\n• botão direto para o seu WhatsApp, para o cliente já chamar e agendar.\n\nA ideia é você receber mais contatos de clientes novos, sem depender só de indicação ou rede social.\n\nPosso te mandar um exemplo rápido, sem compromisso? Se não fizer sentido, sem problema nenhum 🙂";
const DEFAULT_TPL = "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para negócios aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente procura {nicho} pelo celular antes de ir até o local, e quem não aparece acaba perdendo cliente.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• fotos, serviços e preços;\n• horário de funcionamento e endereço no mapa;\n• um botão para o cliente chamar direto no seu WhatsApp.\n\nAssim você recebe mais clientes novos, sem depender só de indicação ou redes sociais.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂";
const PREV3_TPL = "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para negócios aqui da região de {cidade}.\n\nPesquisei a {nome} no Google e no mapa e vi que vocês ainda não têm um site ou página própria. Hoje muita gente procura {nicho} pelo celular antes de ir ao local, e quem não aparece direito acaba perdendo cliente para o concorrente.\n\nEu crio páginas simples e profissionais (landing pages) para negócios locais, com:\n• fotos, serviços e preços;\n• horário e localização no mapa;\n• botão direto para o seu WhatsApp, para o cliente já chamar e agendar.\n\nA ideia é você receber mais contatos de clientes novos, sem depender só de indicação ou rede social.\n\nPosso te mandar um exemplo rápido, sem compromisso? Se não fizer sentido, sem problema nenhum 🙂";
const OLD_TPL = "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para negócios aqui da região de {cidade}.\n\nPesquisei a {nome} no Google e no mapa e vi que vocês ainda não têm um site ou página própria. Hoje muita gente procura {nicho} pelo celular antes de ir ao local, e quem não aparece direito acaba perdendo cliente para o concorrente.\n\nEu crio páginas simples e profissionais (landing pages) para negócios locais, com:\n• fotos, serviços e preços;\n• horário e localização no mapa;\n• botão direto para o seu WhatsApp, para o cliente já chamar e agendar.\n\nA ideia é você receber mais contatos de clientes novos, sem depender só de indicação ou rede social.\n\nPosso te mandar um exemplo rápido, sem compromisso? Se não fizer sentido, sem problema nenhum 🙂";
let cfg = store.get("gc_cfg", {me:"Pietro", cc:"55", tpl:DEFAULT_TPL});
if(!cfg.me) cfg.me = "Pietro";
if(cfg.tpl === OLD_TPL || cfg.tpl === PREV_TPL || cfg.tpl === PREV3_TPL){ cfg.tpl = DEFAULT_TPL; store.set("gc_cfg", cfg); }
let leads = [], ctx = null, selId = null, filt = {wa:false, ig:false, em:false, site:false}, tempSel = {hot:false, warm:false, cold:false}, view = "map";
const stageOf = l => S[l.id]?.stage || "novo";
const saveS = () => { store.set("gc_state", S); cloudSoon(); };
const saveCfg = () => { cfg.t = Date.now(); store.set("gc_cfg", cfg); cloudSoon(); };
const tplFor = l => (cfg.tpl === DEFAULT_TPL && NICHE_TPL[l.tplKey]) || cfg.tpl;
const msgFor = l => tplFor(l).replaceAll("{nome}", l.name).replaceAll("{nicho}", l.nicho || "comércios").replaceAll("{cidade}", l.city || "sua cidade").replaceAll("{eu}", cfg.me || "Pietro");
const waLink = l => l.whatsapp ? `https://wa.me/${l.whatsapp}?text=${encodeURIComponent(msgFor(l))}` : "";
function setStage(l, stage){
  S[l.id] = Object.assign(S[l.id] || {}, {stage, snap:l, u:Date.now()}); delete S[l.id].del;
  if(stage === "novo" && !S[l.id].notes && !S[l.id].manual) S[l.id] = {stage:"novo", del:1, u:Date.now()};   // marca como apagado (e não some) para o apagar também valer no banco online
  saveS();
}
function applyManual(l){
  const m = S[l.id]?.manual; if(!m) return l;
  const n = normPhone(m, cfg.cc); if(n){ l.phone = n; l.whatsapp = n; l.waKind = "informado por você"; }
  return l;
}

/* ====== mapa ====== */
const map = L.map("map", {zoomControl:true}).setView([-15.78,-47.93], 4);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:19, attribution:"© OpenStreetMap"}).addTo(map);
const layer = L.layerGroup().addTo(map); let circle = null; const markers = {};
const COLORS = {hot:"#ef6a3c", warm:"#f0a020", cold:"#8593a3"};

function toast(t, err){ const m = $("msgbar"); m.textContent = t; m.className = err ? "err" : ""; m.hidden = !t; }


/* ====== buscas salvas (IndexedDB): guarda a lista inteira de cada busca para reabrir depois, sem consultar de novo ====== */
const DB = {
  db: null,
  open(){ return this.db || (this.db = new Promise((ok, no) => {
    try{
      const r = indexedDB.open("garimpo", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("buscas", {keyPath:"id"});
      r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
    }catch(e){ no(e); }
  })); },
  async run(mode, fn){ const db = await this.open(); return new Promise((ok, no) => { const t = db.transaction("buscas", mode), st = t.objectStore("buscas"), rq = fn(st); t.oncomplete = () => ok(rq && rq.result); t.onerror = t.onabort = () => no(t.error); }); },
  all(){ return this.run("readonly", st => st.getAll()).then(a => a || []); },
  get(id){ return this.run("readonly", st => st.get(id)); },
  put(rec){ return this.run("readwrite", st => st.put(rec)); },
  del(id){ return this.run("readwrite", st => st.delete(id)); },
};
const searchId = (niche, city, rad) => norm(niche)+"|"+norm(city)+"|"+rad;
let curSearch = null, savePartial = false;   // busca em exibição (para salvar de novo quando os números de rua chegarem)
async function saveSearch(){
  if(!curSearch || !leads.length) return;
  try{
    const old = await DB.get(curSearch.id);
    if(savePartial && old && old.leads.length > leads.length) return;   // lista parcial não substitui uma completa
    const rec = {...curSearch, ctx, leads, t:Date.now()};
    await DB.put(rec); cloudPutSearch(rec);
  }catch(e){ if(!saveSearch.warned){ saveSearch.warned = 1; toast("Não foi possível guardar esta busca neste navegador (armazenamento bloqueado ou cheio).", true); } }
}
function openSaved(rec){
  numTok++;
  $("niche").value = rec.niche; $("city").value = rec.city; $("radius").value = rec.rad; $("rv").textContent = rec.rad;
  ctx = rec.ctx; leads = rec.leads; selId = null; curSearch = {id:rec.id, niche:rec.niche, city:rec.city, rad:rec.rad}; savePartial = false;
  if(circle){ circle.remove(); circle = null; }
  if(ctx.lat != null){
    map.setView([ctx.lat, ctx.lon], rec.rad > 15 ? 10 : rec.rad > 8 ? 11 : rec.rad > 3 ? 12 : 13);
    circle = L.circle([ctx.lat, ctx.lon], {radius:rec.rad*1000, color:"#3b82f6", weight:1.5, fillOpacity:.03}).addTo(map);
  }
  toast("Busca salva em "+new Date(rec.t).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})+" — mesmos dados de quando você pesquisou. Use “Atualizar” em Buscas salvas para pesquisar de novo.");
  renderAll(); fillNumbers().then(saveSearch);
}


/* ====== banco online (api/db.js): salva buscas e estado para acessar de qualquer computador ====== */
const pack = async obj => {
  const txt = JSON.stringify(obj);
  if(typeof CompressionStream === "undefined") return "j:" + txt;
  const buf = await new Response(new Blob([txt]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
  let bin = ""; const u = new Uint8Array(buf); for(let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return "z:" + btoa(bin);
};
const unpack = async str => {
  if(str.startsWith("j:")) return JSON.parse(str.slice(2));
  const bin = atob(str.slice(2)), u = Uint8Array.from(bin, c => c.charCodeAt(0));
  return JSON.parse(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream("gzip"))).text());
};
const Cloud = {
  key: store.get("gc_key", ""), state: "off", err: "",
  on(){ return !!this.key; },
  async call(op, body){
    const r = await fetchT("/api/db", {method:"POST", headers:{"Content-Type":"application/json", "x-garimpo-key":this.key}, body:JSON.stringify({op, ...body})}, 25000);
    const j = await r.json().catch(() => ({}));
    if(!r.ok){ const e = new Error(j.error || ("Servidor respondeu "+r.status)); e.status = r.status; throw e; }
    return j;
  },
  set(state, err){ this.state = state; this.err = err ? (err.message || String(err)) : ""; const b = $("cloud"); if(b) b.textContent = state === "ok" ? "☁️ Banco online: sincronizado" : state === "err" ? "⚠️ Banco online: erro (clique)" : state === "busy" ? "☁️ Sincronizando…" : "☁️ Conectar banco online"; },
};
const metaOf = r => ({id:r.id, niche:r.niche, city:r.city, rad:r.rad, t:r.t, label:r.ctx?.label || r.niche, n:r.leads.length, nsite:r.leads.filter(l => !l.hasSite).length});
async function cloudPutSearch(rec){
  if(!Cloud.on()) return;
  try{ Cloud.set("busy"); await Cloud.call("put", {id:rec.id, meta:metaOf(rec), blob:await pack({ctx:rec.ctx, leads:rec.leads})}); Cloud.set("ok"); }
  catch(e){ Cloud.set("err", e); if(e.status === 413) toast(e.message, true); }
}
const mergeS = (a, b) => { const o = {}; for(const id of new Set([...Object.keys(a), ...Object.keys(b)])){ const x = a[id], y = b[id]; o[id] = !x ? y : !y ? x : ((y.u||0) > (x.u||0) ? y : x); } return o; };
let syncTimer = null;
function cloudSoon(){ if(!Cloud.on()) return; clearTimeout(syncTimer); syncTimer = setTimeout(syncState, 1500); }
async function syncState(){
  if(!Cloud.on()) return;
  try{
    Cloud.set("busy");
    const r = await Cloud.call("state_get"); let rem = {S:{}};
    if(r.blob) rem = await unpack(r.blob);
    const merged = mergeS(S, rem.S || {}), changed = JSON.stringify(merged) !== JSON.stringify(S);
    S = merged; store.set("gc_state", S);
    let cfgChanged = false;
    if((rem.cfgT || 0) > (cfg.t || 0) && rem.cfg){ cfg = {...rem.cfg, t:rem.cfgT}; store.set("gc_cfg", cfg); cfgChanged = true; }
    await Cloud.call("state_put", {blob: await pack({S, cfg:{me:cfg.me, cc:cfg.cc, tpl:cfg.tpl}, cfgT:cfg.t || 0})});
    Cloud.set("ok");
    if((changed || cfgChanged) && leads.length) renderAll(); else if(changed) { renderKanban(); renderDash(); }
  }catch(e){ Cloud.set("err", e); }
}
async function cloudUploadLocal(){   // envia ao banco online as buscas que só existem neste computador
  if(!Cloud.on()) return;
  try{
    const have = new Map((await Cloud.call("list")).items.map(m => [m.id, m.t]));
    for(const r of await DB.all()) if(!have.has(r.id) || have.get(r.id) < r.t) await cloudPutSearch(r);
  }catch(e){ Cloud.set("err", e); }
}
function cloudDialog(){
  const m = modal(""), box = m.firstChild;
  const draw = (msg) => {
    box.innerHTML = `<h3>☁️ Banco online</h3>
      <div class="addr">${Cloud.on() ? "Conectado. Suas buscas salvas, status, notas e modelo de mensagem ficam sincronizados entre todos os computadores onde você entrar com a mesma senha." : "Digite a senha do banco para acessar suas buscas salvas de qualquer computador."}</div>
      ${Cloud.state === "err" ? `<div class="addr" style="color:#ef4444">Último erro: ${esc(Cloud.err)}</div>` : ""}
      ${msg ? `<div class="addr" style="color:#ef4444;white-space:pre-line">${esc(msg)}</div>` : ""}
      <label>Senha (a mesma da variável GARIMPO_SENHA na Vercel)<input id="cKey" type="password" autocomplete="current-password" value="${Cloud.on() ? "••••••••" : ""}" ${Cloud.on() ? "disabled" : ""}></label>
      <div class="acts">${Cloud.on() ? `<button class="pri btn" id="cSync" type="button">Sincronizar agora</button><button class="btn" id="cOff" type="button">Desconectar</button>` : `<button class="pri btn" id="cOn" type="button">Conectar</button>`}<button class="btn" id="cX" type="button">Fechar</button></div>`;
    box.querySelector("#cX").onclick = () => m.remove();
    if(box.querySelector("#cOff")) box.querySelector("#cOff").onclick = () => { Cloud.key = ""; store.set("gc_key", ""); Cloud.set("off"); draw(); };
    if(box.querySelector("#cSync")) box.querySelector("#cSync").onclick = async () => { await syncState(); await cloudUploadLocal(); draw(); };
    if(box.querySelector("#cOn")) box.querySelector("#cOn").onclick = async () => {
      const k = box.querySelector("#cKey").value; if(!k) return;
      Cloud.key = k;
      try{
        Cloud.set("busy"); const pg = await Cloud.call("ping");
        if(store.get("gc_uid", pg.user) !== pg.user){   // outra pessoa neste computador: não mistura os dados dela com os da anterior
          try{ const all = await DB.all(); for(const r of all) await DB.del(r.id); }catch{}
          ["gc_state","gc_hist","gc_rev"].forEach(k2 => localStorage.removeItem(k2)); S = {}; leads = []; renderAll();
        }
        store.set("gc_uid", pg.user); store.set("gc_key", k); Cloud.set("ok"); m.remove(); toast("Conectado ao banco online."); await syncState(); await cloudUploadLocal(); }
      catch(e){ Cloud.key = ""; Cloud.set("off"); draw(e.status === 501 ? e.message + "\n\nNa Vercel: Storage > Create > Upstash Redis (conectar ao projeto) e Settings > Environment Variables > GARIMPO_SENHA. Depois faça Redeploy." : e.message); }
    };
  };
  draw();
}

/* ====== busca ====== */
async function geocode(q){
  const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=pt-BR" + (cfg.cc === "55" ? "&countrycodes=br" : "") + "&q=" + encodeURIComponent(q));
  if(!r.ok) throw new Error("Falha ao localizar a cidade (Nominatim).");
  const j = await r.json(); if(!j.length) throw new Error("Cidade não encontrada. Tente 'Cidade, Estado'.");
  return {lat:+j[0].lat, lon:+j[0].lon, name:(j[0].display_name||"").split(",").slice(0,3).join(",").trim()};
}
function buildQuery(nq, lat, lon, rad){
  const around = `(around:${Math.round(rad*1000)},${lat},${lon})`;
  const parts = [];
  if(nq.f) nq.f.forEach(f => { const [k,v] = f.split("="); const c = v.includes("|") ? `["${k}"~"^(${v})$"]` : `["${k}"="${v}"]`; parts.push(`nwr${c}["name"]${around};`); });
  if(nq.n) parts.push(`nwr["name"~"${nq.n.replace(/["\\]/g, "")}",i]${around};`);   // negócios cujo nome indica o ramo (muitos não têm a etiqueta certa no OSM)
  if(!nq.f && !nq.n) parts.push(`nwr["name"~"${nq.name.replace(/[^a-z0-9 ]/g,"")}",i]${around};`);
  return `[out:json][timeout:25][maxsize:67108864];(${parts.join("")});out center tags qt;`;
}
const OVERPASS_EPS = ["https://overpass-api.de/api/interpreter","https://lz4.overpass-api.de/api/interpreter","https://overpass.openstreetmap.fr/api/interpreter","https://overpass.kumi.systems/api/interpreter","https://overpass.private.coffee/api/interpreter","https://z.overpass-api.de/api/interpreter","https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
const BROWSER_EPS = [OVERPASS_EPS[0], OVERPASS_EPS[1], OVERPASS_EPS[5]];   // os que aceitam chamada direta do navegador (CORS) mesmo em *.vercel.app
const qCache = new Map();   // consulta -> {t, j}: repetir a mesma busca não consulta os servidores de novo
// fetch com limite de tempo próprio: servidor travado não segura a busca inteira
function fetchT(url, o, ms, outer){
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms), on = () => c.abort();
  outer?.addEventListener("abort", on);
  return fetch(url, {...o, signal:c.signal}).finally(() => { clearTimeout(t); outer?.removeEventListener("abort", on); });
}
// Tenta os caminhos em sequência: o próximo só entra se o atual falhar ou demorar mais que `stagger`.
// Evita estourar o limite por IP dos servidores públicos (429/504). Resultado vazio só vale se 2 caminhos concordarem.
function hedged(fns, stagger){
  return new Promise((resolve, reject) => {
    let started = 0, pending = fns.length, empties = 0, empty = null, lastErr, done = false, timer;
    const finish = (fn, v) => { if(done) return; done = true; clearTimeout(timer); fn(v); };
    const next = () => {
      if(done || started >= fns.length) return;
      const run = fns[started++];
      clearTimeout(timer);
      if(started < fns.length) timer = setTimeout(next, stagger);
      run().then(j => {
        if(j.elements.length) return finish(resolve, j);
        empty = empty || j; empties++;
        if(empties >= 2 || --pending === 0) finish(resolve, empty); else next();
      }, e => {
        lastErr = e;
        if(--pending === 0) empty ? finish(resolve, empty) : finish(reject, lastErr); else next();
      });
    };
    next();
  });
}
async function overpassOnce(q, ctl){
  let downErr = null;   // o proxy já viu todos os espelhos caírem há poucos minutos
  const tryEp = ep => async () => {
    // servidores "fora" segundo o proxy: tenta só um caminho direto, rápido, em vez de 3 × 15 s
    if(downErr && ep !== BROWSER_EPS[0]) throw downErr;
    const r = await fetchT(ep, {method:"POST", body:"data="+encodeURIComponent(q), headers:{"Content-Type":"application/x-www-form-urlencoded"}}, downErr ? 8000 : 15000, ctl.signal);
    if(!r.ok) throw new Error(new URL(ep).host+" respondeu "+r.status);
    const j = await r.json(); if(!j || !Array.isArray(j.elements)) throw new Error("Resposta inválida do Overpass");
    // 200 + lista vazia + "remark" = servidor estourou tempo/memória (falha, não "sem resultados")
    if(j.remark && /runtime error|timed out|out of memory/i.test(j.remark)) throw new Error(new URL(ep).host+" sobrecarregado: "+j.remark);
    return j;
  };
  // proxy do próprio site (IP da Vercel) e navegador do usuário (IP dele) são "filas" diferentes nos servidores públicos
  const viaProxy = async () => {
    const r = await fetchT("/api/overpass", {method:"POST", body:q, headers:{"Content-Type":"text/plain"}}, 30000, ctl.signal);
    const j = await r.json().catch(() => null);
    if(!r.ok){ const e = new Error((j && j.error) || "Proxy respondeu "+r.status); if(j && j.down) downErr = e; throw e; }
    if(!j || !Array.isArray(j.elements)) throw new Error("Resposta inválida do proxy");
    return j;   // pode vir com j.stale = true (resultado salvo no banco porque os servidores caíram)
  };
  const web = location.protocol.startsWith("http") && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  try{ return await hedged(web ? [viaProxy, ...BROWSER_EPS.map(tryEp)] : OVERPASS_EPS.map(tryEp), 2500); }
  catch(e){ throw downErr || e; }
}
let ovStale = false;   // true quando a lista veio do cache salvo no navegador (servidores fora do ar)
const qKey = q => { let h = 5381; for(let i = 0; i < q.length; i++) h = ((h*33) ^ q.charCodeAt(i)) >>> 0; return "gc_ov_"+h.toString(36); };
async function overpass(q){
  ovStale = false;
  const hit = qCache.get(q);
  if(hit && Date.now() - hit.t < 15*60*1000) return hit.j;
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 32000);
  try{
    const j = await overpassOnce(q, ctl);
    if(j.stale){ ovStale = true; return j; }   // veio do banco porque os servidores caíram: não grava como "novo"
    if(j.elements.length){
      if(qCache.size >= 20) qCache.delete(qCache.keys().next().value); qCache.set(q, {t:Date.now(), j});
      try{   // guarda também no navegador (até 6 buscas) para não ficar na mão se os servidores caírem
        const idx = store.get("gc_ov_idx", []).filter(k => k !== qKey(q)); idx.unshift(qKey(q));
        idx.splice(6).forEach(k => localStorage.removeItem(k));
        store.set(qKey(q), {t:Date.now(), j}); store.set("gc_ov_idx", idx);
      }catch(e){ /* sem espaço: ignora */ }
    }
    return j;
  }catch(e){
    const old = store.get(qKey(q), null);   // servidores fora: usa o resultado salvo desta mesma busca
    if(old && old.j && old.j.elements.length){ ovStale = true; return old.j; }
    throw e;
  }finally{ clearTimeout(timer); ctl.abort(); }   // cancela os caminhos que sobraram
}
// Fonte reserva/complementar: busca por nome no Nominatim (outro serviço do OSM, não depende do Overpass).
// Devolve no mesmo formato dos elementos do Overpass para reaproveitar o build().
async function nominatimPlaces(nq, lat, lon, rad){
  const terms = nq.z || (nq.f ? null : [nq.label]);
  if(!terms) return [];
  const dLat = rad/111.32, dLon = rad/(111.32*Math.cos(lat*Math.PI/180));
  const vb = [lon-dLon, lat+dLat, lon+dLon, lat-dLat].map(x => x.toFixed(5)).join(",");
  const OK = ["amenity","healthcare","shop","office","tourism","leisure","craft"], out = [], seen = new Set();
  for(let i = 0; i < terms.length; i++){
    if(i) await new Promise(r => setTimeout(r, 1100));   // política do Nominatim: no máximo 1 requisição por segundo
    const r = await fetchT("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=40&bounded=1&extratags=1&addressdetails=1&accept-language=pt-BR&viewbox="+vb+"&q="+encodeURIComponent(terms[i]), {}, 12000);
    if(!r.ok) throw new Error("Nominatim respondeu "+r.status);
    for(const p of await r.json()){
      const name = p.name || p.namedetails?.name, key = p.osm_type+p.osm_id;
      if(!name || seen.has(key) || !OK.includes(p.category)) continue;
      if(nq.m === "clinica" && (p.type === "veterinary" || p.type === "pet")) continue;
      seen.add(key);
      const a = p.address || {};
      out.push({type:p.osm_type, id:p.osm_id, lat:+p.lat, lon:+p.lon, tags:Object.assign({}, p.extratags, {name,
        "addr:street":a.road, "addr:housenumber":a.house_number, "addr:suburb":a.suburb || a.neighbourhood, "addr:city":a.city || a.town || a.village})});
    }
  }
  return out;
}
function build(el){
  const t = el.tags || {}, lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon; if(lat == null) return null;
  const cc = cfg.cc || "55";
  const hasSite = !!(t.website || t["contact:website"] || t.url || t["contact:url"]);
  const waTag = t["contact:whatsapp"] || t.whatsapp;
  const phones = [t.phone, t["contact:phone"], t.mobile, t["contact:mobile"]].filter(Boolean).map(p => normPhone(p, cc)).filter(Boolean);
  const wa = waTag ? normPhone(waTag, cc) : null;
  let phone = phones[0] || null, whatsapp = null, waKind = "";
  if(wa){ whatsapp = wa; waKind = "confirmado"; phone = phone || wa; }
  else { const m = phones.find(isBRMobile); if(m){ whatsapp = m; waKind = "provável (celular)"; } }
  const ig = t["contact:instagram"] || t.instagram, fb = t["contact:facebook"] || t.facebook;
  const insta = ig ? (ig.startsWith("http") ? ig : "https://instagram.com/" + ig.replace(/^@/,"")) : "";
  const face = fb ? (fb.startsWith("http") ? fb : "https://facebook.com/" + fb) : "";
  const email = t.email || t["contact:email"] || "";
  const addr = [[t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", "), t["addr:suburb"] || t["addr:neighbourhood"], t["addr:city"]].filter(Boolean).join(" · ");
  const dist = hav(ctx.lat, ctx.lon, lat, lon);
  let score = 20;
  if(phone) score += 25; if(whatsapp) score += waKind === "confirmado" ? 25 : 15;
  if(insta || face) score += 8; if(email) score += 5; if(t.opening_hours) score += 5; if(addr) score += 5; if(dist <= ctx.rad/2) score += 5;
  if(hasSite) score -= 40;
  score = Math.max(0, Math.min(100, score));
  const l = {id: el.type[0]+el.id, name:t.name, lat, lon, dist, addr, street:t["addr:street"]||"", hn:!!t["addr:housenumber"], phone, whatsapp, waKind, insta, face, email, hours:t.opening_hours||"", hasSite, site:t.website||t["contact:website"]||t.url||"",
    score, temp: score >= 70 ? "hot" : score >= 45 ? "warm" : "cold", city:ctx.cityShort, nicho:ctx.label, tplKey:ctx.m,
    osm: el.type === "ext" ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=19/${lat}/${lon}` : `https://www.openstreetmap.org/${el.type}/${el.id}`, google:"https://www.google.com/search?q="+encodeURIComponent(`"${t.name}" ${ctx.cityShort}`)};
  return applyManual(l);
}
// descarta WhatsApp com DDD diferente do predominante na região (evita número de outra cidade/homônimo)
function checkDDD(arr){
  const dd = l => l.phone && l.phone.startsWith("55") ? l.phone.slice(2,4) : null;
  const cnt = {}; arr.forEach(l => { const d = dd(l); if(d) cnt[d] = (cnt[d]||0)+1; });
  const top = Object.entries(cnt).sort((a,b) => b[1]-a[1])[0];
  if(!top || top[1] < 3) return;
  arr.forEach(l => { const d = dd(l);
    if(d && d !== top[0] && l.waKind !== "informado por você"){ l.dddWarn = d; l.whatsapp = null; l.waKind = ""; } });
}

/* ====== fonte complementar: Google Places (via /api/places, opcional) ====== */
async function fetchPlaces(nq, g, rad){
  if(!location.protocol.startsWith("http")) return [];
  try{
    const r = await fetch("/api/places", {method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({queries: nq.g || [nq.label || nq.name], lat:g.lat, lon:g.lon, radius: Math.round(rad*1000)})});
    if(!r.ok) return [];
    return (await r.json()).places || [];
  }catch{ return []; }
}
const slug = s => norm(s).replace(/[^a-z0-9]/g, "");
// junta os resultados do Google aos do OSM: completa quem já existe e acrescenta quem faltava
function mergePlaces(osmLeads, places){
  const added = [];
  places.forEach(p => {
    const el = {type:"google", id:p.id, lat:p.lat, lon:p.lon, tags:{name:p.name, phone:p.phone, website:p.site}};
    const l = build(el); if(!l || l.dist > ctx.rad) return;
    const key = slug(p.name);
    const twin = osmLeads.find(o => slug(o.name) === key || (hav(o.lat,o.lon,l.lat,l.lon) < 0.05 && (slug(o.name).includes(key) || key.includes(slug(o.name)))));
    if(twin){
      if(l.hasSite && !twin.hasSite){ twin.hasSite = true; twin.site = p.site; }
      if(!twin.hn && /\d/.test(p.addr||'')){ twin.addr = (p.addr||'').replace(/, Brasil$/, '').replace(/, \d{5}-\d{3}/, ''); twin.hn = true; }
      if(!twin.phone && l.phone){ twin.phone = l.phone; twin.whatsapp = l.whatsapp; twin.waKind = l.waKind; }
      return;
    }
    l.src = "google"; l.hn = true; l.osm = p.maps || l.google; l.addr = (p.addr || "").replace(/, Brasil$/, "").replace(/, \d{5}-\d{3}/, "");
    added.push(l);
  });
  return osmLeads.concat(added);
}
const hasContact = l => !!(l.phone || l.whatsapp || l.insta || l.face || l.email);

async function search(niche, city, rad){
  const btn = $("go"); btn.disabled = true; toast("Localizando cidade…");
  try{
    const nq = resolveNiche(niche);
    const g = await geocode(city);
    ctx = {lat:g.lat, lon:g.lon, rad, label:nq.label, m:nq.m, cityShort:city.split(",")[0].trim()};
    map.setView([g.lat,g.lon], rad > 15 ? 10 : rad > 8 ? 11 : rad > 3 ? 12 : 13);
    if(circle) circle.remove(); circle = L.circle([g.lat,g.lon], {radius:rad*1000, color:"#3b82f6", weight:1.5, fillOpacity:.03}).addTo(map);
    toast("Buscando em "+(g.name||city)+"… pode levar alguns segundos");
    let elements = [], ovErr = null;
    try{ elements = (await overpass(buildQuery(nq, g.lat, g.lon, rad))).elements || []; }
    catch(e){ ovErr = e; }
    if(ovErr || elements.length < 10) toast(ovErr ? "Servidor principal ocupado, usando a fonte reserva…" : "Poucos resultados, buscando na fonte reserva…");
    // Overpass falhou ou trouxe pouco? tenta o Nominatim (outro serviço do OSM, independente do Overpass)
    if(ovErr || elements.length < 10){
      try{
        const extra = await nominatimPlaces(nq, g.lat, g.lon, rad), ids = new Set(elements.map(e => e.type+e.id));
        elements = elements.concat(extra.filter(e => !ids.has(e.type+e.id)));
      }catch(e){ /* sem a fonte reserva, segue só com o que já veio */ }
    }
    const seen = new Set();
    leads = elements.map(build).filter(Boolean).filter(l => l.dist <= rad).filter(l => !seen.has(l.id) && seen.add(l.id));
    toast("Buscando também no Google…");
    leads = mergePlaces(leads, await fetchPlaces(nq, g, rad));
    // OSM fora do ar e sem nada do Google (chave não configurada): aí sim avisa
    if(ovErr && !leads.length) throw new Error("Os servidores do OpenStreetMap estão sobrecarregados e a fonte do Google não está ativa. Tente de novo em alguns minutos. ("+(ovErr.message||"sem resposta")+")");
    checkDDD(leads);
    selId = null;
    const h = store.get("gc_hist", []).filter(x => !(x.niche===niche && x.city===city));
    h.unshift({niche, city, rad}); store.set("gc_hist", h.slice(0,10));
    toast(ovStale ? "Servidores do OpenStreetMap fora do ar: mostrando o resultado salvo desta busca (pode estar desatualizado)." : ovErr && leads.length ? "Servidor principal ocupado: lista parcial (fonte reserva). Busque de novo em alguns minutos para completar." : leads.length ? "" : "Nada encontrado. Aumente o raio ou tente outro nicho (o OSM pode ter poucos dados aí).", !leads.length);
    curSearch = {id:searchId(niche, city, rad), niche, city, rad}; savePartial = !!(ovErr || ovStale);
    renderAll();
    saveSearch();
    fillNumbers().then(saveSearch);
  }catch(e){ toast(e.message || String(e), true); }
  finally{ btn.disabled = false; }
}

/* ====== listas e render ====== */
function visible(){
  let a = leads.filter(l => filt.site || !l.hasSite);
  if(filt.wa) a = a.filter(l => l.whatsapp);
  if(filt.ig) a = a.filter(l => l.insta || l.face);
  if(filt.em) a = a.filter(l => l.email);
  // temperatura: sem nenhuma marcada mostra todas; marcando, mostra só as escolhidas
  if(tempSel.hot || tempSel.warm || tempSel.cold) a = a.filter(l => tempSel[l.temp]);
  const by = $("sort").value;
  return a.sort((x,y) => by==="dist" ? (x.dist ?? 1e9)-(y.dist ?? 1e9) : by==="name" ? x.name.localeCompare(y.name) : y.score-x.score);
}
/* ====== completa o número da rua (OSM às vezes não tem) ====== */
let numTok = 0;
const revCache = store.get("gc_rev", {});
async function fillNumbers(){
  const tok = ++numTok;
  const todo = leads.filter(l => !l.hn && l.dist != null);
  for(const l of todo){
    if(tok !== numTok) return;
    const key = l.lat.toFixed(5)+","+l.lon.toFixed(5);
    if(!(key in revCache)){
      try{
        const r = await fetchT("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=pt-BR&lat="+l.lat+"&lon="+l.lon, {}, 10000);
        if(!r.ok) throw 0;
        const a = (await r.json()).address || {};
        revCache[key] = a.house_number ? {n:a.house_number, road:a.road||"", sub:a.suburb||a.neighbourhood||"", city:a.city||a.town||a.village||""} : null;
        store.set("gc_rev", revCache);
      }catch{ await new Promise(r => setTimeout(r, 2500)); continue; }
      await new Promise(r => setTimeout(r, 1100));
    }
    const c = revCache[key];
    if(!c || tok !== numTok) continue;
    // só aceita se a rua bate com a do cadastro (ou se o cadastro não tinha rua)
    if(l.street && norm(l.street) !== norm(c.road)) continue;
    const city = l.addr.split(" · ").pop();
    l.addr = [[c.road || l.street, c.n].filter(Boolean).join(", "), c.sub, l.street ? "" : c.city].filter(Boolean).join(" · ") + (l.street && l.addr.includes(" · ") ? " · " + l.addr.split(" · ").slice(1).join(" · ") : "") + " (nº aprox.)";
    l.hn = true;
    const el = document.querySelector('.card[data-id="'+l.id+'"] .addr'); if(el) el.textContent = (l.addr || "Endereço não informado") + " · " + l.dist.toFixed(1) + " km";
  }
}
function renderAll(){ renderList(); renderMap(); renderKanban(); renderDash(); }

function renderList(){
  const has = leads.length > 0;
  ["exp","filters","chips","tempChips","fireWrap"].forEach(i => $(i).hidden = !has);
  if(!has){ $("list").innerHTML = ""; return; }
  const base = leads.filter(l => filt.site || !l.hasSite);
  document.querySelectorAll("#tempChips .chip").forEach(c => c.querySelector("span").textContent = base.filter(l => l.temp === c.dataset.t).length);
  const vis = visible(), noSite = leads.filter(l => !l.hasSite);
  const rich = noSite.filter(hasContact).length;
  $("stats").innerHTML = `<b>${noSite.length}</b> sem site (de ${leads.length} ${ctx?.import ? "na lista" : "no raio"}) · <b>${rich}/${noSite.length}</b> com contato`;
  const q = vis.filter(l => l.whatsapp && stageOf(l) === "novo").length;
  $("fire").textContent = `🚀 Modo disparo (${q})`; $("fire").disabled = !q;
  $("list").innerHTML = vis.map(l => `<div class="card ${l.id===selId?"sel":""} ${stageOf(l)!=="novo"?"done":""}" data-id="${l.id}">
    <div class="row1"><b>${esc(l.name)}</b><span class="temp"><span class="tb ${l.temp}">${{hot:"Quente",warm:"Morno",cold:"Frio"}[l.temp]}</span>${l.score}</span></div>
    <div class="addr">${esc(l.addr || "Endereço não informado")}${l.addr && !l.hn ? " <i title='O mapa não tem o número deste endereço. Use o botão Buscar para ver no Google.'>(sem nº)</i>" : ""}${l.dist != null ? " · " + l.dist.toFixed(1) + " km" : ""}</div>
    ${l.extra ? `<div class="addr">${esc(l.extra)}</div>` : ""}
    ${l.phone ? `<div>📞 ${esc(fmtPhone(l.phone, cfg.cc))}${l.dddWarn ? ` <span class="tag" title="O DDD deste número é diferente do predominante na região. Confira antes de ligar.">⚠ DDD ${esc(l.dddWarn)} diferente da região</span>` : ""}</div>` : ""}
    <div class="acts">
      ${l.whatsapp ? `<a class="btn wa" data-act="wa" href="${esc(waLink(l))}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ""}
      <button class="btn" data-act="det" type="button">📝 Detalhes</button>
      <a class="btn" href="${esc(l.google)}" target="_blank" rel="noopener">🔍 Buscar</a>
    </div>
    <div class="acts">
      ${hasContact(l) ? `${l.whatsapp?`<span class="tag">WhatsApp ${esc(l.waKind)}</span>`:""}${l.insta?`<a class="tag" href="${esc(l.insta)}" target="_blank" rel="noopener">Instagram</a>`:""}${l.face?`<a class="tag" href="${esc(l.face)}" target="_blank" rel="noopener">Facebook</a>`:""}${l.email?`<span class="tag">${esc(l.email)}</span>`:""}` : `<span class="tag">nenhum contato encontrado</span>`}
      ${l.hasSite ? `<span class="tag site">tem site</span>` : ""}
      ${stageOf(l)!=="novo" ? `<span class="tag stg">${stageName(stageOf(l))}</span>` : ""}
    </div></div>`).join("") || `<div class="addr">Nenhum lead com esses filtros.</div>`;
}

function renderMap(){
  layer.clearLayers(); for(const k in markers) delete markers[k];
  visible().forEach(l => {
    if(l.lat == null) return;   // lista importada: sem coordenadas
    const mk = L.circleMarker([l.lat,l.lon], {radius:l.id===selId?10:7, color:l.id===selId?"#16a34a":"#fff", weight:2, fillColor:stageOf(l)!=="novo"?"#8593a3":COLORS[l.temp], fillOpacity:.95})
      .bindPopup(`<b>${esc(l.name)}</b><br>${l.phone ? esc(fmtPhone(l.phone,cfg.cc))+"<br>" : ""}${l.whatsapp ? `<a href="${esc(waLink(l))}" target="_blank" rel="noopener">💬 Chamar no WhatsApp</a>` : "<i>sem WhatsApp</i>"}`)
      .on("click", () => select(l.id, false)).addTo(layer);
    markers[l.id] = mk;
  });
}
function select(id, fly){
  selId = id; renderList(); renderMap();
  const l = leads.find(x => x.id === id);
  if(fly && l && l.lat != null){ map.flyTo([l.lat,l.lon], Math.max(map.getZoom(),15), {duration:.6}); setTimeout(() => markers[id]?.openPopup(), 650); }
  document.querySelector(`.card[data-id="${id}"]`)?.scrollIntoView({block:"nearest", behavior:"smooth"});
}

function allTracked(){
  const m = new Map();
  leads.filter(l => !l.hasSite || filt.site).forEach(l => m.set(l.id, l));
  Object.entries(S).forEach(([id, v]) => { if(v.snap && !m.has(id)) m.set(id, applyManual(v.snap)); });
  return [...m.values()];
}
function renderKanban(){
  const all = allTracked();
  $("kanban").innerHTML = `<div class="kan">${STAGES.map(([k,n]) => {
    const items = all.filter(l => stageOf(l) === k);
    return `<div class="col" data-stage="${k}"><h4>${n}<span>${items.length}</span></h4>${items.map(l => `<div class="kc" draggable="true" data-id="${l.id}">
      <b>${esc(l.name)}</b><span class="addr">${esc(l.city||"")} · ${esc(l.nicho||"")}</span>
      ${l.phone ? `<span>📞 ${esc(fmtPhone(l.phone,cfg.cc))}</span>` : ""}
      <div class="acts">${l.whatsapp?`<a class="btn wa" href="${esc(waLink(l))}" target="_blank" rel="noopener" data-act="wa">💬</a>`:""}<button class="btn" data-act="det" type="button">📝</button></div></div>`).join("")}</div>`;
  }).join("")}</div>`;
}
function renderDash(){
  const all = allTracked(), n = all.length || 1;
  const cnt = k => all.filter(l => stageOf(l) === k).length;
  const bar = (label, v, max, color) => `<div class="bar"><span>${label}</span><div><i style="width:${max?Math.round(v/max*100):0}%;${color?`background:${color}`:""}"></i></div><b>${v}</b></div>`;
  const worked = all.length - cnt("novo");
  $("dash").innerHTML = `
    <div class="grid">
      <div class="kpi"><b>${all.length}</b><span>Leads rastreados</span></div>
      <div class="kpi"><b>${all.filter(l=>l.whatsapp).length}</b><span>Com WhatsApp</span></div>
      <div class="kpi"><b>${all.filter(l=>l.temp==="hot").length}</b><span>Leads quentes</span></div>
      <div class="kpi"><b>${worked}</b><span>Já abordados</span></div>
      <div class="kpi"><b>${cnt("fechado")}</b><span>Fechados (${Math.round(cnt("fechado")/Math.max(worked,1)*100)}% dos abordados)</span></div>
    </div>
    <div class="box"><h3>Funil</h3>${STAGES.map(([k,nm]) => bar(nm, cnt(k), n)).join("")}</div>
    <div class="box"><h3>Temperatura</h3>${bar("Quente",all.filter(l=>l.temp==="hot").length,n,COLORS.hot)}${bar("Morno",all.filter(l=>l.temp==="warm").length,n,COLORS.warm)}${bar("Frio",all.filter(l=>l.temp==="cold").length,n,COLORS.cold)}</div>
    <div class="box"><h3>Contatos disponíveis</h3>${bar("Telefone",all.filter(l=>l.phone).length,n)}${bar("WhatsApp",all.filter(l=>l.whatsapp).length,n)}${bar("Instagram/FB",all.filter(l=>l.insta||l.face).length,n)}${bar("E-mail",all.filter(l=>l.email).length,n)}</div>`;
}

/* ====== modais ====== */
function modal(html){ const d = document.createElement("div"); d.className = "modal"; d.innerHTML = `<div class="mbox">${html}</div>`; d.onclick = e => { if(e.target === d) d.remove(); }; document.body.appendChild(d); return d; }
const findLead = id => leads.find(l => l.id === id) || (S[id] && applyManual(S[id].snap));

function detail(id){
  const l = findLead(id); if(!l) return;
  const m = modal(`<h3>${esc(l.name)}</h3>
    <div class="addr">${esc(l.addr || "Endereço não informado")} · ${esc(l.nicho||"")} · ${esc(l.city||"")}</div>
    <div class="two"><label>Etapa<select id="dSt">${STAGES.map(([k,n]) => `<option value="${k}" ${stageOf(l)===k?"selected":""}>${n}</option>`).join("")}</select></label>
    <label>WhatsApp/telefone encontrado por você<input id="dMan" value="${esc(S[l.id]?.manual||"")}" placeholder="(11) 91234-5678"></label></div>
    <label>Anotações<textarea id="dNotes" rows="3">${esc(S[l.id]?.notes||"")}</textarea></label>
    <div>Mensagem sugerida:</div><pre>${esc(msgFor(l))}</pre>
    <div class="acts">${l.whatsapp?`<a class="btn wa" href="${esc(waLink(l))}" target="_blank" rel="noopener">💬 Abrir WhatsApp</a>`:""}
      <button class="btn" id="dCp" type="button">Copiar mensagem</button>
      <a class="btn" href="${esc(l.google)}" target="_blank" rel="noopener">🔍 Google</a>
      <a class="btn" href="${esc(l.osm)}" target="_blank" rel="noopener">${l.src === "google" ? "Google" : "OSM"}</a>
      ${l.insta?`<a class="btn" href="${esc(l.insta)}" target="_blank" rel="noopener">Instagram</a>`:""}${l.face?`<a class="btn" href="${esc(l.face)}" target="_blank" rel="noopener">Facebook</a>`:""}
      ${l.site?`<a class="btn" href="${esc(l.site)}" target="_blank" rel="noopener">Site atual</a>`:""}</div>
    <div class="acts"><button class="pri btn" id="dSave" type="button">Salvar</button><button class="btn" id="dClose" type="button">Fechar</button></div>`);
  m.querySelector("#dClose").onclick = () => m.remove();
  m.querySelector("#dCp").onclick = e => navigator.clipboard.writeText(msgFor(l)).then(() => e.target.textContent = "Copiado ✓");
  m.querySelector("#dSave").onclick = () => {
    const st = m.querySelector("#dSt").value, man = m.querySelector("#dMan").value.trim(), notes = m.querySelector("#dNotes").value.trim();
    S[l.id] = Object.assign(S[l.id] || {}, {stage:st, manual:man, notes, snap:l, u:Date.now()}); delete S[l.id].del;
    if(st === "novo" && !man && !notes) S[l.id] = {stage:"novo", del:1, u:Date.now()};
    saveS();
    const live = leads.find(x => x.id === l.id); if(live) applyManual(live);
    m.remove(); renderAll();
  };
}
function editMsg(){
  const m = modal(`<h3>Mensagem do WhatsApp</h3>
    <div class="two"><label>Seu nome / marca<input id="cMe" value="${esc(cfg.me)}" placeholder="Seu nome"></label><label>DDI do país<input id="cCc" value="${esc(cfg.cc)}"></label></div>
    <label>Modelo — variáveis: {nome} {nicho} {cidade} {eu}<textarea id="cTpl" rows="6">${esc(cfg.tpl)}</textarea></label>
    <div class="addr">Dica: deixando o modelo igual ao padrão, o app usa um texto diferente para cada tipo de negócio (clínica, salão, restaurante…). Se você alterar o texto, ele vale para todos.</div>
    <div class="acts"><button class="pri btn" id="cSave" type="button">Salvar</button><button class="btn" id="cReset" type="button">Restaurar modelo padrão</button><button class="btn" id="cClose" type="button">Cancelar</button></div>`);
  m.querySelector("#cClose").onclick = () => m.remove();
  m.querySelector("#cReset").onclick = () => { m.querySelector("#cTpl").value = DEFAULT_TPL; };
  m.querySelector("#cSave").onclick = () => { cfg = {me:m.querySelector("#cMe").value.trim(), cc:m.querySelector("#cCc").value.trim()||"55", tpl:m.querySelector("#cTpl").value}; saveCfg(); m.remove(); renderAll(); };
}
async function history(){
  const m = modal("<h3>📁 Buscas salvas</h3><div class='addr'>Carregando…</div>"); const box = m.firstChild; box.style.width = "min(680px,100%)";
  let locals = []; try{ locals = await DB.all(); }catch(e){ /* sem IndexedDB */ }
  const items = new Map();
  locals.forEach(r => items.set(r.id, {...metaOf(r), local:true}));
  let cloudErr = null;
  if(Cloud.on()){
    try{
      const list = (await Cloud.call("list")).items;
      list.forEach(c => { const o = items.get(c.id); items.set(c.id, o && o.t > c.t ? {...o, cloud:false} : {...c, local:!!o, cloud:true}); });
      locals.filter(r => !list.some(c => c.id === r.id && c.t >= r.t)).forEach(r => cloudPutSearch(r));   // só existia aqui: sobe para o banco
      Cloud.set("ok");
    }catch(e){ cloudErr = e; Cloud.set("err", e); }
  }
  const have = new Set(items.keys());
  const legacy = store.get("gc_hist", []).filter(x => !have.has(searchId(x.niche, x.city, x.rad)));   // buscas antigas, de antes de existir o salvamento
  const fmt = t => new Date(t).toLocaleString("pt-BR", {dateStyle:"short", timeStyle:"short"});
  const getRec = async it => {
    const loc = it.local ? await DB.get(it.id) : null;
    if(loc && (!it.cloud || loc.t >= it.t)) return loc;
    const {blob} = await Cloud.call("get", {id:it.id}); const d = await unpack(blob);
    const rec = {id:it.id, niche:it.niche, city:it.city, rad:it.rad, t:it.t, ctx:d.ctx, leads:d.leads};
    try{ await DB.put(rec); }catch{}
    return rec;
  };
  const draw = () => {
    const q = norm(box.querySelector("#sq")?.value || "");
    const rows = [...items.values()].filter(r => !q || norm(r.niche+" "+r.city+" "+r.label).includes(q)).sort((a,b) => b.t - a.t);
    const groups = {}; rows.forEach(r => (groups[r.label] ||= []).push(r));
    const html = Object.keys(groups).sort((a,b) => a.localeCompare(b,"pt-BR")).map(g => `<div class="sg"><b>${esc(g.charAt(0).toUpperCase()+g.slice(1))}</b> <span class="addr">${groups[g].length} busca${groups[g].length>1?"s":""}</span>
      ${groups[g].map(r => `<div class="hist" data-id="${esc(r.id)}"><span><b>${esc(r.city)}</b> · ${r.rad ? r.rad+" km" : "lista importada"}<br><span class="addr">${r.nsite} sem site (de ${r.n}) · salva em ${fmt(r.t)}${r.cloud ? " · ☁️" : ""}</span></span>
        <span class="acts"><button class="btn" data-a="open" type="button">Abrir</button>${r.rad ? `<button class="btn" data-a="upd" type="button" title="Pesquisar de novo">Atualizar</button>` : ""}<button class="btn" data-a="del" type="button" title="Excluir">✕</button></span></div>`).join("")}</div>`).join("");
    const old = !q && legacy.length ? `<div class="sg"><b>Sem dados salvos</b> <span class="addr">pesquisadas antes do salvamento existir; busque de novo para guardar</span>${legacy.map((x,i) => `<div class="hist" data-l="${i}"><span><b>${esc(x.niche)}</b> · ${esc(x.city)} · ${x.rad} km</span><span class="acts"><button class="btn" type="button">Buscar de novo</button></span></div>`).join("")}</div>` : "";
    const aviso = !Cloud.on() ? `<div class="addr">Salvas só neste computador. <a href="#" id="goCloud">Conecte o banco online</a> para acessar de qualquer lugar.</div>` : cloudErr ? `<div class="addr" style="color:#ef4444">Banco online indisponível agora (${esc(cloudErr.message)}); mostrando só o que está neste computador.</div>` : "";
    box.querySelector("#sl").innerHTML = (html + old || "<div class='addr'>Nenhuma busca salva ainda. Cada busca que você fizer aparece aqui, com a lista completa.</div>") + aviso;
    const gc = box.querySelector("#goCloud"); if(gc) gc.onclick = e => { e.preventDefault(); m.remove(); cloudDialog(); };
    box.querySelectorAll(".hist[data-id]").forEach(el => el.onclick = async e => {
      const it = items.get(el.dataset.id), a = e.target.dataset?.a || "open"; if(!it) return;
      if(a === "del"){
        e.stopPropagation(); if(!confirm("Excluir esta busca salva ("+it.niche+" em "+it.city+")"+(Cloud.on() ? " de todos os computadores" : "")+"?")) return;
        try{ await DB.del(it.id); }catch{}
        if(Cloud.on()) try{ await Cloud.call("del", {id:it.id}); }catch(err){ toast("Não consegui excluir do banco online: "+err.message, true); }
        items.delete(it.id); draw(); return;
      }
      if(a === "upd"){ m.remove(); search(it.niche, it.city, it.rad); return; }
      el.style.opacity = .5;
      try{ const rec = await getRec(it); m.remove(); openSaved(rec); }catch(err){ el.style.opacity = 1; toast("Não consegui abrir esta busca: "+err.message, true); }
    });
    box.querySelectorAll(".hist[data-l]").forEach(el => el.onclick = () => { const x = legacy[+el.dataset.l]; $("niche").value = x.niche; $("city").value = x.city; $("radius").value = x.rad; $("rv").textContent = x.rad; m.remove(); search(x.niche, x.city, x.rad); });
  };
  box.innerHTML = `<h3>📁 Buscas salvas</h3><input id="sq" placeholder="Filtrar por nicho ou cidade…" autocomplete="off"><div id="sl"></div><button class="btn" id="hClose" type="button">Fechar</button>`;
  box.querySelector("#hClose").onclick = () => m.remove(); box.querySelector("#sq").oninput = draw; draw();
}
function fireMode(){
  const queue = visible().filter(l => l.whatsapp && stageOf(l) === "novo"); let i = 0;
  const m = modal(""); const box = m.firstChild;
  const draw = () => {
    if(i >= queue.length){ box.innerHTML = `<h3>Fila concluída 🎉</h3><div>Você abordou ${queue.filter(l=>stageOf(l)!=="novo").length} leads. Acompanhe as respostas no Kanban.</div><button class="btn" id="fx" type="button">Fechar</button>`; box.querySelector("#fx").onclick = () => { m.remove(); renderAll(); }; return; }
    const l = queue[i];
    box.innerHTML = `<h3>🚀 Modo disparo · ${i+1}/${queue.length}</h3><b style="font-size:16px">${esc(l.name)}</b>
      <div class="addr">${esc(l.addr||"")} · ${esc(fmtPhone(l.whatsapp,cfg.cc))} · WhatsApp ${esc(l.waKind)}</div><pre>${esc(msgFor(l))}</pre>
      <div class="acts"><button class="btn wa" id="fGo" type="button">💬 Abrir WhatsApp e marcar contactado</button><button class="btn" id="fSkip" type="button">Pular</button><button class="btn" id="fX" type="button">Parar</button></div>
      <div class="addr">Você confirma e envia cada mensagem manualmente no WhatsApp — nada é enviado automaticamente.</div>`;
    box.querySelector("#fGo").onclick = () => { window.open(waLink(l), "_blank", "noopener"); setStage(l, "contactado"); i++; draw(); };
    box.querySelector("#fSkip").onclick = () => { i++; draw(); };
    box.querySelector("#fX").onclick = () => { m.remove(); renderAll(); };
  };
  draw();
}

/* ====== exportação ====== */
function rows(){
  return visible().map(l => ({"Nome":l.name,"Score":l.score,"Temperatura":{hot:"Quente",warm:"Morno",cold:"Frio"}[l.temp],"Etapa":stageName(stageOf(l)),"Telefone":l.phone?fmtPhone(l.phone,cfg.cc):"","WhatsApp":l.whatsapp?"+"+l.whatsapp:"","Status WhatsApp":l.waKind,"Link WhatsApp":waLink(l),"Endereço":l.addr,"Distância (km)":l.dist != null ? +l.dist.toFixed(2) : "","CNPJ":l.cnpj||"","Observações da base":l.extra||"","Instagram":l.insta,"Facebook":l.face,"E-mail":l.email,"Tem site":l.hasSite?"sim":"não","Anotações":S[l.id]?.notes||"","Mensagem":msgFor(l),"Google":l.google,"OSM":l.osm}));
}
const fname = ext => `leads-${norm(ctx?.cityShort||"busca").replace(/\W+/g,"-")}-${norm(ctx?.label||"").replace(/\W+/g,"-")}.${ext}`;
$("csv").onclick = () => {
  const r = rows(); if(!r.length) return;
  const q = v => `"${String(v ?? "").replace(/"/g,'""')}"`, cols = Object.keys(r[0]);
  const blob = new Blob(["﻿" + cols.map(q).join(";") + "\r\n" + r.map(x => cols.map(c => q(x[c])).join(";")).join("\r\n")], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fname("csv"); a.click(); URL.revokeObjectURL(a.href);
};
$("xlsx").onclick = () => {
  if(typeof XLSX === "undefined"){ toast("Biblioteca do Excel não carregou (sem internet?). Use o CSV.", true); return; }
  const ws = XLSX.utils.json_to_sheet(rows()), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Leads"); XLSX.writeFile(wb, fname("xlsx"));
};

/* ====== eventos ====== */
$("f").onsubmit = e => { e.preventDefault(); search($("niche").value.trim(), $("city").value.trim(), +$("radius").value); };
$("radius").oninput = () => $("rv").textContent = $("radius").value;
$("sort").onchange = renderAll;
$("editMsg").onclick = editMsg; $("hist").onclick = history; $("cloud").onclick = cloudDialog; $("fire").onclick = fireMode;
$("theme").onclick = () => { const d = document.documentElement.dataset.theme !== "dark"; document.documentElement.dataset.theme = d ? "dark" : "light"; $("theme").textContent = d ? "☀️" : "🌙"; store.set("gc_theme", d ? "dark" : "light"); };
if(store.get("gc_theme") === "dark") $("theme").click();
document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => {
  view = b.dataset.v; $("app").dataset.view = view;
  document.querySelectorAll(".tabs button").forEach(x => x.classList.toggle("on", x === b));
  if(view === "map") setTimeout(() => map.invalidateSize(), 50); else { renderKanban(); renderDash(); }
});
document.querySelectorAll("#tempChips .chip").forEach(c => c.onclick = () => { tempSel[c.dataset.t] = !tempSel[c.dataset.t]; c.classList.toggle("on", tempSel[c.dataset.t]); renderAll(); });
document.querySelectorAll(".chip[data-f]").forEach(c => c.onclick = () => { filt[c.dataset.f] = !filt[c.dataset.f]; c.classList.toggle("on", filt[c.dataset.f]); renderAll(); });
$("list").addEventListener("click", e => {
  const card = e.target.closest(".card"); if(!card) return;
  const id = card.dataset.id, act = e.target.closest("[data-act]")?.dataset.act;
  if(act === "det"){ detail(id); return; }
  if(act === "wa"){ const l = leads.find(x => x.id === id); if(l && stageOf(l) === "novo"){ setStage(l, "contactado"); setTimeout(renderAll, 0); } return; }
  if(e.target.closest("a")) return;
  select(id, true);
});
$("kanban").addEventListener("click", e => {
  const kc = e.target.closest(".kc"); if(!kc) return; const act = e.target.closest("[data-act]")?.dataset.act;
  if(act === "det") detail(kc.dataset.id);
});
let dragId = null;
$("kanban").addEventListener("dragstart", e => { const kc = e.target.closest(".kc"); if(kc){ dragId = kc.dataset.id; e.dataTransfer.effectAllowed = "move"; } });
$("kanban").addEventListener("dragover", e => { const c = e.target.closest(".col"); if(c){ e.preventDefault(); document.querySelectorAll(".col.over").forEach(x => x.classList.remove("over")); c.classList.add("over"); } });
$("kanban").addEventListener("drop", e => {
  const c = e.target.closest(".col"); if(!c || !dragId) return; e.preventDefault();
  const l = findLead(dragId); if(l){ setStage(l, c.dataset.stage); renderAll(); } dragId = null;
});

/* ====== importar lista (CNPJ / CSV / Excel): sem depender de nenhuma API ====== */
function parseCSV(text){
  const nl = text.indexOf("\n"), first = text.slice(0, nl > 0 ? nl : text.length);
  const delim = [";", ",", "\t"].map(d => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cur = "", q = false;
  for(let i = 0; i < text.length; i++){
    const c = text[i];
    if(q){ if(c === '"'){ if(text[i+1] === '"'){ cur += '"'; i++; } else q = false; } else cur += c; }
    else if(c === '"') q = true;
    else if(c === delim){ row.push(cur); cur = ""; }
    else if(c === "\n" || c === "\r"){ if(c === "\r" && text[i+1] === "\n") i++; row.push(cur); cur = ""; if(row.some(x => x.trim())) rows.push(row); row = []; }
    else cur += c;
  }
  row.push(cur); if(row.some(x => x.trim())) rows.push(row);
  return rows;
}
async function readTable(file){
  let rows;
  if(/\.xlsx?$/i.test(file.name)){
    if(typeof XLSX === "undefined") throw new Error("A biblioteca do Excel não carregou (sem internet?). Salve a planilha como CSV e tente de novo.");
    const wb = XLSX.read(await file.arrayBuffer(), {type:"array"});
    rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, raw:false, defval:""});
  }else{
    const buf = await file.arrayBuffer(); let txt = new TextDecoder("utf-8").decode(buf);
    if(txt.includes("�")) txt = new TextDecoder("windows-1252").decode(buf);   // CSV antigo em Latin-1
    rows = parseCSV(txt.replace(/^﻿/, ""));
  }
  rows = rows.map(r => r.map(c => String(c ?? "").trim())).filter(r => r.some(Boolean));
  const hi = rows.findIndex(r => r.filter(Boolean).length >= 3);   // cabeçalho = primeira linha com pelo menos 3 colunas
  if(hi < 0 || rows.length < hi + 2) throw new Error("Não encontrei uma tabela com cabeçalho e linhas nesse arquivo.");
  return {headers: rows[hi].map((h, i) => h || "Coluna " + (i+1)), data: rows.slice(hi + 1)};
}
const hnorm = s => norm(s).replace(/[^a-z0-9]/g, "");
const IMP_FIELDS = [["fantasia","Nome fantasia"],["razao","Razão social / nome"],["cnpj","CNPJ"],["phone1","Telefone"],["phone2","Telefone 2 (opcional)"],["ddd","DDD (se estiver separado)"],["email","E-mail"],["city","Cidade"],["uf","UF"],["street","Rua"],["number","Número"],["district","Bairro"],["cnae","Atividade (CNAE)"],["opened","Data de abertura"],["site","Site (se houver)"],["status","Situação cadastral"]];
function detectCols(headers){
  const H = headers.map(hnorm), used = new Set(), out = {};
  const pick = (key, ...res) => { for(const re of res){ const i = H.findIndex((h, j) => !used.has(j) && re.test(h)); if(i >= 0){ used.add(i); out[key] = i; return; } } };
  pick("fantasia", /nomefantasia|^fantasia/); pick("razao", /razaosocial|^razao|nomeempresarial|^empresa$|^nome$/);
  pick("cnpj", /^cnpj$/, /^cnpj(?!basico)/, /cnpj/);
  const phones = H.map((h, i) => /(tel|fone|celular|whats)/.test(h) && !/ddd/.test(h) ? i : -1).filter(i => i >= 0 && !used.has(i));
  if(phones[0] != null){ out.phone1 = phones[0]; used.add(phones[0]); } if(phones[1] != null){ out.phone2 = phones[1]; used.add(phones[1]); }
  pick("ddd", /^ddd/);
  pick("email", /mail|correioeletronico/); pick("city", /^(municipio|cidade)/); pick("uf", /^(uf|estado|sigla)$/); pick("street", /^(logradouro|endereco|rua)$/);
  pick("number", /^(numero|num|nro)$/); pick("district", /bairro/); pick("cnae", /cnae.*(descr|principal)|atividadeprincipal|cnaefiscalprincipal|^cnae/);
  pick("opened", /dataabertura|inicioatividade|datainicio|datadeinicio|abertura/); pick("site", /^(site|website|url|paginaweb)$/); pick("status", /situacao/);
  return out;
}
const MAIL_COMUNS = /@(gmail|hotmail|outlook|yahoo|icloud|live|msn|uol|bol|terra|ig|globo|protonmail)\./i;
const titleCase = s => /[a-zà-ú]/.test(s) ? s : s.toLowerCase().replace(/(^|[\s\-\/(])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/ (Da|De|Do|Das|Dos|E) /g, w => w.toLowerCase()).replace(/\b(Ii|Iii|Iv|Vi|Vii|Viii|Ix|Xi|Xii|Xiii|Xiv|Xv|Xvi|Xvii|Xviii|Xix|Xx|Xxi)\b/g, w => w.toUpperCase());
function parseDate(v){
  v = String(v || "").trim(); let m;
  if((m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return new Date(+m[3], +m[2]-1, +m[1]);
  if((m = v.match(/^(\d{4})-(\d{2})-(\d{2})/))) return new Date(+m[1], +m[2]-1, +m[3]);
  if((m = v.match(/^(\d{4})(\d{2})(\d{2})$/))) return new Date(+m[1], +m[2]-1, +m[3]);
  return null;
}
const fmtCnpj = d => d.length === 14 ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : d;
function importLeads(tbl, map, o){
  const get = (r, k) => map[k] != null && map[k] !== "" ? String(r[+map[k]] ?? "").trim() : "";
  const seen = new Set(), out = [], now = Date.now(), cities = {};
  for(const r of tbl.data){
    const status = get(r, "status"); if(o.activeOnly && status && !/ativ|^02$|^2$/i.test(status)) continue;
    const city = get(r, "city"), uf = get(r, "uf");
    if(o.cityFilter && !norm(city + " " + uf).includes(norm(o.cityFilter))) continue;
    const dt = parseDate(get(r, "opened")), days = dt ? Math.floor((now - dt.getTime()) / 864e5) : null;
    if(o.maxDays && (days == null || days > o.maxDays || days < 0)) continue;
    const nm = get(r, "fantasia") || get(r, "razao"); if(!nm) continue;
    const cnpj = get(r, "cnpj").replace(/\D/g, ""), cc = cfg.cc || "55", ddd = get(r, "ddd");
    const phones = ["phone1","phone2"].map(k => { let d = get(r, k).replace(/[^\d;,\/ ]/g, " ").split(/[;,\/]/)[0].replace(/\D/g, ""); if(d && d.length <= 9 && ddd) d = ddd.replace(/\D/g, "") + d; return d ? normPhone(d, cc) : null; }).filter(Boolean);
    const mob = phones.find(isBRMobile), phone = phones[0] || null, whatsapp = mob || null, waKind = mob ? "provável (celular)" : "";
    const email = get(r, "email").toLowerCase(), site = get(r, "site"), hasSite = !!site && !/^(n\/?a|-|não|nao)$/i.test(site);
    const ownDomain = email.includes("@") && !MAIL_COMUNS.test(email);
    const addr = [titleCase([get(r, "street"), get(r, "number")].filter(Boolean).join(", ")), titleCase(get(r, "district")), [titleCase(city), uf.toUpperCase()].filter(Boolean).join("/")].filter(Boolean).join(" · ");
    let score = 20; if(phone) score += 25; if(whatsapp) score += 15; if(email) score += 5; if(addr) score += 5;
    if(days != null && days >= 0) score += days <= 45 ? 25 : days <= 90 ? 20 : days <= 180 ? 10 : days <= 365 ? 5 : 0;
    if(ownDomain) score -= 10; if(hasSite) score -= 40;
    score = Math.max(0, Math.min(100, score));
    const extra = [dt ? "Aberta em " + dt.toLocaleDateString("pt-BR") + (days >= 0 ? " (há " + (days < 60 ? days + " dias" : Math.round(days/30) + " meses") + ")" : "") : "", cnpj ? "CNPJ " + fmtCnpj(cnpj) : "", get(r, "cnae"), ownDomain ? "e-mail com domínio próprio: confira se já tem site" : ""].filter(Boolean).join(" · ");
    const name = titleCase(nm), id = "c" + (cnpj || hnorm(nm + (phone || addr)));
    if(seen.has(id)) continue; seen.add(id);
    const cname = titleCase(city); if(cname) cities[cname] = (cities[cname] || 0) + 1;
    out.push({id, name, lat:null, lon:null, dist:null, addr, street:"", hn:true, phone, whatsapp, waKind, insta:"", face:"", email, hours:"", hasSite, site: hasSite ? site : "", score,
      temp: score >= 70 ? "hot" : score >= 45 ? "warm" : "cold", city:cname || o.city || "sua cidade", nicho:o.label, tplKey:o.tpl, extra, cnpj, src:"import", osm:"", google:"https://www.google.com/search?q=" + encodeURIComponent(`"${name}" ${cname || o.city || ""}`)});
  }
  const top = Object.entries(cities).sort((a, b) => b[1] - a[1])[0];
  return {leads: out, city: top ? top[0] : (o.city || "")};
}
const TPL_OPTS = [["","Mensagem padrão (genérica)"],["clinica","Clínica / saúde"],["comida","Restaurante / bar / padaria"],["beleza","Salão / beleza"],["academia","Academia"],["pilates","Pilates"],["personal","Personal trainer"],["pet","Pet / veterinária"],["auto","Oficina / autopeças"],["profissional","Advogado / contador / escritório"],["imoveis","Imobiliária"],["loja","Loja"],["hospedagem","Hotel / pousada"],["ensino","Escola / curso"],["servicos","Serviços (eletricista etc.)"],["solar","Energia solar"],["marcenaria","Marcenaria / planejados"],["tatuagem","Estúdio de tatuagem"]];
function importDialog(){
  const m = modal(""), box = m.firstChild; box.style.width = "min(720px,100%)";
  let tbl = null;
  const step1 = (msg) => {
    box.innerHTML = `<h3>📥 Importar lista de empresas</h3>
      <div class="addr">Use uma planilha (CSV ou Excel) exportada de uma base de CNPJ, como o Casa dos Dados, ou de qualquer outra lista. O app reconhece as colunas sozinho e você confere antes de importar. A lista ganha nota quente/morno/frio, mensagem de WhatsApp e entra no Kanban como as buscas do mapa. Empresas abertas há pouco tempo ganham mais pontos.</div>
      ${msg ? `<div class="addr" style="color:#ef4444">${esc(msg)}</div>` : ""}
      <label>Arquivo<input id="iFile" type="file" accept=".csv,.txt,.xlsx,.xls"></label>
      <div class="acts"><button class="btn" id="iX" type="button">Fechar</button></div>`;
    box.querySelector("#iX").onclick = () => m.remove();
    box.querySelector("#iFile").onchange = async e => {
      const f = e.target.files[0]; if(!f) return;
      try{ tbl = await readTable(f); step2(f.name); }catch(err){ step1(err.message || String(err)); }
    };
  };
  const step2 = (fname0) => {
    const det = detectCols(tbl.headers), opts = sel => `<option value="">—</option>` + tbl.headers.map((h, i) => `<option value="${i}" ${sel === i ? "selected" : ""}>${esc(h)}</option>`).join("");
    const label0 = (fname0 || "").replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " ").trim();
    box.innerHTML = `<h3>📥 Conferir colunas</h3>
      <div class="addr">${tbl.data.length} linhas encontradas. Ajuste o que estiver errado.</div>
      <div class="two">${IMP_FIELDS.map(([k, n]) => `<label>${n}<select data-k="${k}">${opts(det[k])}</select></label>`).join("")}</div>
      <div class="two"><label>Nome do nicho<input id="iLabel" value="${esc(label0)}" placeholder="ex.: advogados novos"></label>
        <label>Modelo de mensagem<select id="iTpl">${TPL_OPTS.map(([v, n]) => `<option value="${v}">${n}</option>`).join("")}</select></label></div>
      <div class="two"><label>Só desta cidade (opcional)<input id="iCity" placeholder="ex.: Sorocaba"></label>
        <label>Abertas há no máximo<select id="iDays"><option value="0">qualquer data</option><option value="30">30 dias</option><option value="90">90 dias</option><option value="180">6 meses</option><option value="365">1 ano</option></select></label></div>
      <label style="grid-template-columns:auto 1fr;align-items:center;gap:8px"><input id="iAct" type="checkbox" ${det.status != null ? "checked" : ""}> Só empresas ativas (se houver coluna de situação)</label>
      <div class="addr" id="iPrev"></div>
      <div class="acts"><button class="pri btn" id="iGo" type="button">Importar</button><button class="btn" id="iBack" type="button">Voltar</button></div>`;
    const read = () => { const mp = {}; box.querySelectorAll("select[data-k]").forEach(s => mp[s.dataset.k] = s.value); return mp; };
    const opt = () => ({label: box.querySelector("#iLabel").value.trim() || "importada", tpl: box.querySelector("#iTpl").value, cityFilter: box.querySelector("#iCity").value.trim(), maxDays: +box.querySelector("#iDays").value, activeOnly: box.querySelector("#iAct").checked, city: ""});
    const prev = () => {
      const mp = read(), r = importLeads(tbl, mp, opt());
      const c = {hot: 0, warm: 0, cold: 0}; r.leads.forEach(l => c[l.temp]++);
      box.querySelector("#iPrev").innerHTML = (mp.fantasia || mp.razao) ? `<b>${r.leads.length}</b> empresas para importar (🔥 ${c.hot} · 🌤️ ${c.warm} · ❄️ ${c.cold}), <b>${r.leads.filter(l => l.phone).length}</b> com telefone, <b>${r.leads.filter(l => l.whatsapp).length}</b> com celular.${r.leads[0] ? "<br>Exemplo: " + esc(r.leads[0].name) + (r.leads[0].phone ? " · " + esc(fmtPhone(r.leads[0].phone, cfg.cc)) : "") : ""}` : `<span style="color:#ef4444">Escolha a coluna do nome (fantasia ou razão social).</span>`;
      return r;
    };
    box.querySelectorAll("select,input").forEach(el => el.onchange = el.oninput = prev);
    box.querySelector("#iTpl").value = (resolveNiche(label0).m) || ""; prev();
    box.querySelector("#iBack").onclick = () => step1();
    box.querySelector("#iGo").onclick = async () => {
      const mp = read(); if(!mp.fantasia && !mp.razao) return prev();
      const o = opt(), r = importLeads(tbl, mp, o);
      if(!r.leads.length){ box.querySelector("#iPrev").innerHTML = `<span style="color:#ef4444">Nenhuma empresa passou nos filtros. Afrouxe a cidade, a data ou o filtro de ativas.</span>`; return; }
      numTok++;
      leads = r.leads; selId = null; if(circle){ circle.remove(); circle = null; }
      ctx = {lat:null, lon:null, rad:0, label:o.label.toLowerCase(), m:o.tpl, cityShort:r.city, import:true};
      const stamp = new Date().toISOString().slice(0, 10);
      curSearch = {id:"imp|" + norm(o.label) + "|" + norm(r.city) + "|" + stamp, niche:"Importação: " + o.label, city:r.city || "várias cidades", rad:0}; savePartial = false;
      m.remove(); renderAll(); await saveSearch();
      toast(r.leads.length + " empresas importadas e salvas em Buscas salvas. Elas não aparecem no mapa (a lista não traz coordenadas); use a lista ao lado.");
    };
  };
  step1();
}

$("imp").onclick = importDialog;

/* ====== Leads prontos: lista pesquisada previamente (leads-prontos.json), só para consulta ====== */
let readyCache = null;
async function readyDialog(){
  const m = modal("<h3>📚 Leads prontos</h3><div class='addr'>Carregando…</div>"), box = m.firstChild; box.style.width = "min(640px,100%)";
  try{ if(!readyCache){ const r = await fetch("leads-prontos.json?v=1"); if(!r.ok) throw 0; readyCache = await r.json(); } }
  catch(e){ box.innerHTML = "<h3>📚 Leads prontos</h3><div class='addr'>Não consegui carregar leads-prontos.json.</div>"; return; }
  const by = {}; readyCache.forEach(l => (by[l.nicho] = by[l.nicho] || []).push(l));
  const names = Object.keys(by).sort((a, b) => a.localeCompare(b, "pt-BR"));
  box.innerHTML = `<h3>📚 Leads prontos — Sorocaba/SP</h3>
    <div class="addr">${readyCache.length} empresas pesquisadas na web (diretórios públicos). <b>“Quente” = nenhum site próprio apareceu</b>; não foi confirmado um a um. Confira no Google/Instagram antes de chamar.</div>
    <label>Nicho <select id="rN" style="width:100%"><option value="">Todos os nichos (${readyCache.length})</option>${names.map(n => `<option value="${esc(n)}">${esc(n)} (${by[n].length})</option>`).join("")}</select></label>
    <div style="margin:10px 0;display:flex;gap:14px;flex-wrap:wrap"><label><input type="checkbox" id="rH" checked> 🔥 Quentes</label><label><input type="checkbox" id="rW" checked> 🌤️ Mornos</label><label><input type="checkbox" id="rC" checked> ❄️ Frios</label><label><input type="checkbox" id="rT"> só com telefone</label></div>
    <div class="addr" id="rP"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="pill" id="rX" type="button">Fechar</button><button class="pill on" id="rGo" type="button">Abrir lista</button></div>`;
  const pick = () => readyCache.filter(l => (!box.querySelector("#rN").value || l.nicho === box.querySelector("#rN").value) && ((l.temp === "hot" && box.querySelector("#rH").checked) || (l.temp === "warm" && box.querySelector("#rW").checked) || (l.temp === "cold" && box.querySelector("#rC").checked)) && (!box.querySelector("#rT").checked || l.phone || l.whatsapp));
  const prev = () => { box.querySelector("#rP").textContent = pick().length + " leads com esses filtros."; };
  box.querySelectorAll("select,input").forEach(e => e.onchange = prev); prev();
  box.querySelector("#rX").onclick = () => m.remove();
  box.querySelector("#rGo").onclick = () => {
    const sel = box.querySelector("#rN").value, cc = cfg.cc || "55";
    leads = pick().map(r => {
      const phone = r.phone ? normPhone(r.phone, cc) : null, mob = phone && isBRMobile(phone) ? phone : null, wa = r.whatsapp || mob || null;
      const addr = [r.addr, r.bairro, r.city + "/SP"].filter(Boolean).join(" · ");
      return {id:r.id, name:r.name, lat:null, lon:null, dist:null, addr, street:"", hn:true, phone, whatsapp:wa, waKind:r.whatsapp ? "confirmado" : mob ? "provável (celular)" : "",
        insta:r.instagram || "", face:"", email:"", hours:"", hasSite:!!r.site, site:r.site || "", score:r.score, temp:r.temp, city:r.city, nicho:r.nicho, tplKey:resolveNiche(r.nicho).m,
        extra:r.reason, src:"pronto", osm:"", google:"https://www.google.com/search?q=" + encodeURIComponent(`"${r.name}" ${r.city}`)};
    });
    if(!leads.length) return prev();
    numTok++; selId = null; if(circle){ circle.remove(); circle = null; }
    ctx = {lat:null, lon:null, rad:0, label:(sel || "vários nichos").toLowerCase(), m:sel ? resolveNiche(sel).m : "", cityShort:"Sorocaba", import:true};
    curSearch = null; savePartial = false; m.remove(); renderAll();
    toast(leads.length + " leads prontos abertos. Os status e anotações que você marcar ficam salvos normalmente.");
  };
}
$("ready").onclick = readyDialog;
Cloud.set(Cloud.on() ? "busy" : "off"); if(Cloud.on()) syncState();
