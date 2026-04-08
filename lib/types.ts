export interface Item {
  nome: string
  min: number
  atual: number
  categoria: string
  preco?: number
  ultimaAlteracao?: {
    usuario: string
    data: string
  }
}

export interface HistoricoEntry {
  nome: string
  qtd: number
  custo: number
  data: string
}

export interface Usuario {
  user: string
  pass: string
}

export interface Receita {
  id: string
  nome: string
  inputItem: string
  inputQtd: number
  outputItem: string
  outputQtd: number
}

export const defaultReceitas: Receita[] = [
  {
    id: "1",
    nome: "Costela Pronta",
    inputItem: "Costela Crua",
    inputQtd: 1,
    outputItem: "Costela Pronta",
    outputQtd: 1,
  },
]

export const categorias = [
  "Carnes",
  "Padaria",
  "Insumos",
  "Embalagens",
  "Bebidas",
  "Cozinha",
  "Limpeza",
  "Operacional",
] as const

export type Categoria = (typeof categorias)[number]

export const defaultItens: Item[] = [
  { nome: "Costela Crua", min: 12, atual: 12, categoria: "Carnes" },
  { nome: "Contra filé", min: 6, atual: 6, categoria: "Carnes" },
  { nome: "Carne de hambúrguer", min: 12, atual: 12, categoria: "Carnes" },
  { nome: "Costela Pronta", min: 2, atual: 2, categoria: "Carnes" },
  { nome: "Costela Desfiada", min: 2, atual: 2, categoria: "Carnes" },
  { nome: "Bacon em cubos", min: 2, atual: 2, categoria: "Carnes" },

  { nome: "Pão de Australiano Aussie", min: 12, atual: 12, categoria: "Padaria" },
  { nome: "Pão brioche 4CT", min: 12, atual: 12, categoria: "Padaria" },

  { nome: "Batata", min: 7, atual: 7, categoria: "Insumos" },
  { nome: "Anel de cebola", min: 2, atual: 2, categoria: "Insumos" },
  { nome: "Mussarela", min: 1, atual: 1, categoria: "Insumos" },
  { nome: "Cream cheese", min: 1, atual: 1, categoria: "Insumos" },
  { nome: "Cheddar Polengui profissional", min: 1, atual: 1, categoria: "Insumos" },
  { nome: "Molho de Cheddar", min: 1, atual: 1, categoria: "Insumos" },
  { nome: "Manteiga de Garrafa", min: 1, atual: 1, categoria: "Insumos" },
  { nome: "Óleo", min: 3, atual: 3, categoria: "Insumos" },
  { nome: "Aji Sal para churrasco", min: 1, atual: 1, categoria: "Insumos" },
  { nome: "Barbecue", min: 2, atual: 2, categoria: "Insumos" },
  { nome: "Alho torrado", min: 1, atual: 1, categoria: "Insumos" },
  { nome: "Cebolinha", min: 1, atual: 1, categoria: "Insumos" },
  { nome: "Temperos", min: 1, atual: 1, categoria: "Insumos" },
  { nome: "Pimenta Biquinho", min: 1, atual: 1, categoria: "Insumos" },

  { nome: "Embalagem H7", min: 50, atual: 50, categoria: "Embalagens" },
  { nome: "Embalagem H2", min: 50, atual: 50, categoria: "Embalagens" },
  { nome: "Embalagem de prato feito", min: 20, atual: 20, categoria: "Embalagens" },
  { nome: "Embalagem para talher", min: 1, atual: 1, categoria: "Embalagens" },
  { nome: "Embalagem de farofa", min: 10, atual: 10, categoria: "Embalagens" },
  { nome: "Lacre para delivery", min: 1, atual: 1, categoria: "Embalagens" },
  { nome: "Lacre para o forno", min: 1, atual: 1, categoria: "Embalagens" },
  { nome: "Guardanapo", min: 1, atual: 1, categoria: "Embalagens" },
  { nome: "Saco Kraft G", min: 50, atual: 50, categoria: "Embalagens" },
  { nome: "Saco Kraft GG (extra)", min: 50, atual: 50, categoria: "Embalagens" },
  { nome: "Papel acoplado metalizado", min: 50, atual: 50, categoria: "Embalagens" },
  { nome: "Papel acoplado (comum)", min: 50, atual: 50, categoria: "Embalagens" },
  { nome: "Palito para hambúrguer", min: 50, atual: 50, categoria: "Embalagens" },
  { nome: "Grampo da embalagem", min: 1, atual: 1, categoria: "Embalagens" },
  { nome: "Copo descartável", min: 1, atual: 1, categoria: "Embalagens" },
  { nome: "Garfo descartável", min: 1, atual: 1, categoria: "Embalagens" },
  { nome: "Saco de embalar batata", min: 1, atual: 1, categoria: "Embalagens" },
  { nome: "Papel Celofane", min: 1, atual: 1, categoria: "Embalagens" },

  { nome: "Água para consumo", min: 2, atual: 2, categoria: "Bebidas" },
  { nome: "Água com gás", min: 6, atual: 6, categoria: "Bebidas" },
  { nome: "Água normal", min: 6, atual: 6, categoria: "Bebidas" },
  { nome: "Coca zero 1,5L", min: 10, atual: 10, categoria: "Bebidas" },
  { nome: "Coca cola 1,5L", min: 10, atual: 10, categoria: "Bebidas" },
  { nome: "Dell vale 1,5L", min: 6, atual: 6, categoria: "Bebidas" },
  { nome: "Guaraná 1L", min: 10, atual: 10, categoria: "Bebidas" },
  { nome: "Coca Lata 350ml", min: 12, atual: 12, categoria: "Bebidas" },
  { nome: "Limoneto", min: 1, atual: 1, categoria: "Bebidas" },

  { nome: "Arroz", min: 1, atual: 1, categoria: "Cozinha" },
  { nome: "Farofa", min: 1, atual: 1, categoria: "Cozinha" },

  { nome: "Veja multiuso", min: 1, atual: 1, categoria: "Limpeza" },
  { nome: "Perfex", min: 1, atual: 1, categoria: "Limpeza" },
  { nome: "Detergente", min: 1, atual: 1, categoria: "Limpeza" },
  { nome: "Esponja de louça", min: 1, atual: 1, categoria: "Limpeza" },
  { nome: "Saco de lixo 30L", min: 1, atual: 1, categoria: "Limpeza" },
  { nome: "Saco de lixo 110L", min: 1, atual: 1, categoria: "Limpeza" },
  { nome: "Desinfetante", min: 1, atual: 1, categoria: "Limpeza" },

  { nome: "Touca", min: 1, atual: 1, categoria: "Operacional" },
  { nome: "Gás 13kg", min: 1, atual: 1, categoria: "Operacional" },
  { nome: "Gás de maçarico", min: 2, atual: 2, categoria: "Operacional" },
  { nome: "Bobina térmica 80mm", min: 2, atual: 2, categoria: "Operacional" },
]
