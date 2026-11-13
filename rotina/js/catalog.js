// Rotina inicial e catálogo de atividades prontas para adicionar.
// Cada item: [nome, ícone, horário sugerido]

export const DEFAULT_TASKS = [
  ['Acordar', 'sunrise', '07:00'],
  ['Arrumar a cama', 'bed', '07:10'],
  ['Escovar os dentes', 'toothbrush', '07:20'],
  ['Café da manhã', 'coffee', '07:30'],
  ['Beber água', 'glass-water', '10:00'],
  ['Almoço', 'utensils', '12:00'],
  ['Estudar', 'book-open', '14:00'],
  ['Exercício', 'dumbbell', '17:00'],
  ['Jantar', 'utensils-crossed', '19:30'],
  ['Ler um livro', 'book', '21:00'],
  ['Escovar os dentes (noite)', 'toothbrush-sparkles', '22:00'],
  ['Dormir', 'moon', '22:30'],
];

export const CATEGORIES = [
  {
    id: 'manha-noite', name: 'Manhã & Noite', items: [
      ['Acordar', 'sunrise', '07:00'], ['Arrumar a cama', 'bed', '07:10'],
      ['Separar a roupa', 'shirt', '21:30'], ['Desligar as telas', 'smartphone', '22:00'],
      ['Dormir', 'moon', '22:30'], ['Despertador', 'alarm-clock', '06:30'],
    ],
  },
  {
    id: 'cuidados', name: 'Cuidados pessoais', items: [
      ['Escovar os dentes', 'toothbrush', '07:20'], ['Tomar banho', 'shower-head', '07:00'],
      ['Lavar as mãos', 'soap-dispenser-droplet', '11:50'], ['Fio dental', 'toothbrush-sparkles', '22:00'],
      ['Cuidar da pele', 'sparkles', '22:10'], ['Cortar o cabelo', 'scissors', '10:00'],
    ],
  },
  {
    id: 'saude', name: 'Saúde & Bem-estar', items: [
      ['Tomar remédio', 'pill', '08:00'], ['Vitaminas', 'pill-bottle', '08:00'],
      ['Beber água', 'glass-water', '10:00'], ['Exercício', 'dumbbell', '17:00'],
      ['Caminhada', 'footprints', '18:00'], ['Pedalar', 'bike', '18:00'],
      ['Alongamento', 'person-standing', '07:15'], ['Meditar', 'brain', '21:30'],
      ['Consulta médica', 'stethoscope', '09:00'], ['Medir pressão', 'heart-pulse', '08:00'],
    ],
  },
  {
    id: 'refeicoes', name: 'Refeições', items: [
      ['Café da manhã', 'coffee', '07:30'], ['Lanche da manhã', 'apple', '10:00'],
      ['Almoço', 'utensils', '12:00'], ['Lanche da tarde', 'sandwich', '16:00'],
      ['Jantar', 'utensils-crossed', '19:30'], ['Cozinhar', 'chef-hat', '11:00'],
      ['Salada', 'salad', '12:00'], ['Tomar leite', 'milk', '21:00'],
    ],
  },
  {
    id: 'estudos', name: 'Estudos', items: [
      ['Escola', 'school', '07:00'], ['Estudar', 'book-open', '14:00'],
      ['Lição de casa', 'notebook-pen', '15:00'], ['Arrumar a mochila', 'backpack', '21:00'],
      ['Ler um livro', 'book', '21:00'], ['Curso online', 'laptop', '19:00'],
      ['Idiomas', 'languages', '18:30'], ['Faculdade', 'graduation-cap', '19:00'],
      ['Revisar matéria', 'pencil-line', '16:00'], ['Programar', 'code', '20:00'],
    ],
  },
  {
    id: 'trabalho', name: 'Trabalho & Finanças', items: [
      ['Trabalho', 'briefcase', '08:00'], ['Reunião', 'users', '10:00'],
      ['Responder e-mails', 'mail', '09:00'], ['Pagar contas', 'receipt', '09:00'],
      ['Conferir finanças', 'wallet', '20:00'], ['Guardar dinheiro', 'piggy-bank', '20:00'],
      ['Fechamento do mês', 'calculator', '09:00'], ['Relatório', 'file-text', '16:00'],
      ['Planejar o dia', 'clipboard-list', '08:00'], ['Ligar para cliente', 'phone', '10:00'],
    ],
  },
  {
    id: 'casa', name: 'Casa', items: [
      ['Arrumar o quarto', 'sofa', '09:00'], ['Lavar a louça', 'spray-can', '20:00'],
      ['Lavar roupa', 'washing-machine', '09:00'], ['Tirar o lixo', 'trash', '20:00'],
      ['Limpar a casa', 'brush-cleaning', '10:00'], ['Fazer compras', 'shopping-cart', '18:00'],
      ['Regar as plantas', 'sprout', '08:00'], ['Cuidar do pet', 'paw-print', '08:00'],
      ['Passear com o cachorro', 'dog', '18:30'],
    ],
  },
  {
    id: 'lazer', name: 'Lazer & Família', items: [
      ['Brincar', 'puzzle', '16:00'], ['Videogame', 'gamepad-2', '19:00'],
      ['Ver TV', 'tv', '20:00'], ['Tocar violão', 'guitar', '18:00'],
      ['Desenhar', 'palette', '16:00'], ['Ligar para a família', 'phone', '19:00'],
      ['Igreja', 'church', '19:00'], ['Passeio', 'tent', '10:00'],
      ['Música', 'headphones', '18:00'], ['Filme', 'film', '20:30'],
    ],
  },
];

// Ícones disponíveis no seletor da atividade
export const ICON_CHOICES = [
  'sunrise', 'sun', 'moon', 'moon-star', 'bed', 'alarm-clock', 'coffee', 'utensils', 'utensils-crossed',
  'sandwich', 'apple', 'salad', 'soup', 'croissant', 'chef-hat', 'pizza', 'cake', 'glass-water', 'droplets',
  'milk', 'pill', 'pill-bottle', 'heart-pulse', 'stethoscope', 'dumbbell', 'bike', 'footprints',
  'person-standing', 'activity', 'brain', 'toothbrush', 'toothbrush-sparkles', 'shower-head', 'bath',
  'soap-dispenser-droplet', 'scissors', 'shirt', 'washing-machine', 'trash', 'spray-can', 'brush-cleaning',
  'sofa', 'house', 'bed-single', 'paw-print', 'dog', 'cat', 'sprout', 'flower-2', 'book-open', 'book',
  'notebook-pen', 'pencil-line', 'graduation-cap', 'backpack', 'school', 'laptop', 'briefcase', 'calculator',
  'file-text', 'receipt', 'wallet', 'piggy-bank', 'hand-coins', 'banknote', 'chart-line', 'mail', 'phone',
  'users', 'handshake', 'presentation', 'clipboard-list', 'calendar-check', 'sticky-note', 'baby', 'car',
  'bus', 'shopping-cart', 'shopping-bag', 'guitar', 'piano', 'gamepad-2', 'tv', 'film', 'headphones',
  'palette', 'camera', 'puzzle', 'tent', 'plane', 'church', 'hand-heart', 'heart', 'timer', 'target',
  'trophy', 'star', 'globe', 'languages', 'code', 'smartphone', 'lightbulb', 'key', 'sparkles',
];

export const ALL_CATALOG = CATEGORIES.flatMap((c) => c.items.map(([name, icon, time]) => ({ name, icon, time, cat: c.id })));
