export type UnidadeInsumo = "un" | "g" | "kg" | "ml" | "l"
export type CategoriaInsumo = "Carnes" | "Pães" | "Queijos" | "Molhos" | "Batatas/congelados" | "Bebidas" | "Embalagens" | "Mercearia"

export interface Item {
  nome: string
  min: number
  atual: number
  categoria: string
  preco?: number
  unidade?: UnidadeInsumo
  precoCompra?: number
  quantidadeEmbalagem?: number
  unidadeEmbalagem?: UnidadeInsumo
  custoUnitario?: number
  fornecedor?: string
  ultimaAlteracao?: {
    usuario: string
    data: string
  }
}

export interface Insumo extends Item {
  categoria: CategoriaInsumo
  unidade: UnidadeInsumo
  precoCompra: number
  quantidadeEmbalagem: number
  unidadeEmbalagem: UnidadeInsumo
  custoUnitario: number
}

export interface IngredienteFicha {
  insumoNome: string
  quantidade: number
  unidade: UnidadeInsumo
}

export interface FichaTecnica {
  id: string
  nome: string
  precoVenda: number
  ingredientes: IngredienteFicha[]
  metaCmv?: number
}

export interface VendaProduto {
  id: string
  produtoNome: string
  quantidade: number
  data: string
}

export interface PrevisaoVenda {
  produtoNome: string
  quantidade: number
}

export interface CompraRegistro {
  id: string
  data: string
  fornecedor: string
  insumoNome: string
  quantidade: number
  unidade: UnidadeInsumo
  precoUnitario: number
  valorTotal: number
  precoAnterior: number
  variacao: number
  adicionadaAoEstoque?: boolean
}

export interface ListaCompraItem {
  insumoNome: string
  categoria: CategoriaInsumo
  unidade: UnidadeInsumo
  necessidade: number
  estoque: number
  quantidadeComprar: number
  quantidadeEmbalagem: number
  embalagens: number
  precoEmbalagem: number
  valorEstimado: number
  comprado?: boolean
  quantidadeReal?: number
  valorUnitarioReal?: number
  fornecedor?: string
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

export type UserRole = "admin" | "operador"

export type TabPermissao = "estoque" | "entrada" | "financeiro" | "dashboard" | "lista-compras" | "admin"

export type UserStatus = "pendente" | "aprovado" | "rejeitado"

export interface UsuarioSistema {
  login: string
  senha: string
  nome?: string
  email?: string
  role: UserRole
  permissoes: TabPermissao[]
  status: UserStatus
  dataCriacao?: string
}

export interface Receita {
  id: string
  nome: string
  inputItem: string
  inputQtd: number
  outputItem: string
  outputQtd: number
}

const defaultInsumoRows: Array<[string, UnidadeInsumo, number, number, UnidadeInsumo, CategoriaInsumo]> = [
  ["Pão brioche", "un", 2.07, 1, "un", "Pães"], ["Pão australiano", "un", 2.53, 1, "un", "Pães"], ["Blend bovino 180g", "un", 6.35, 1, "un", "Carnes"],
  ["Cheddar cremoso", "g", 50, 1500, "g", "Queijos"], ["Cream cheese", "g", 60, 1500, "g", "Queijos"], ["Bacon", "g", 32, 1000, "g", "Carnes"], ["Barbecue", "g", 40, 3500, "g", "Molhos"], ["Costela bovina desfiada", "g", 80, 1000, "g", "Carnes"], ["Mussarela", "g", 43, 1000, "g", "Queijos"], ["Batata frita", "g", 10, 1000, "g", "Batatas/congelados"], ["Anel de cebola", "g", 22, 1000, "g", "Batatas/congelados"], ["Farofa de bacon", "g", 55, 1000, "g", "Mercearia"], ["Cebolinha", "g", 30, 1000, "g", "Mercearia"], ["Embalagem H7", "un", 50, 100, "un", "Embalagens"], ["Saco Kraft", "un", 70, 100, "un", "Embalagens"], ["Papel acoplado", "un", 35, 200, "un", "Embalagens"]
]
export const defaultInsumos: Insumo[] = defaultInsumoRows.map(([nome, unidade, precoCompra, quantidadeEmbalagem, unidadeEmbalagem, categoria]) => ({ nome, unidade, precoCompra, quantidadeEmbalagem, unidadeEmbalagem, categoria, custoUnitario: precoCompra / quantidadeEmbalagem, min: 0, atual: 0 }))

export const defaultFichasTecnicas: FichaTecnica[] = [
  { id: "super-bacon-bbq", nome: "SUPER BACON BBQ", precoVenda: 35, ingredientes: [{ insumoNome: "Pão brioche", quantidade: 1, unidade: "un" }, { insumoNome: "Blend bovino 180g", quantidade: 1, unidade: "un" }, { insumoNome: "Cheddar cremoso", quantidade: 30, unidade: "g" }, { insumoNome: "Bacon", quantidade: 40, unidade: "g" }, { insumoNome: "Barbecue", quantidade: 20, unidade: "g" }, { insumoNome: "Saco Kraft", quantidade: 1, unidade: "un" }, { insumoNome: "Papel acoplado", quantidade: 1, unidade: "un" }] },
  { id: "costeloburguer", nome: "COSTELOBURGUER", precoVenda: 35, ingredientes: [{ insumoNome: "Pão australiano", quantidade: 1, unidade: "un" }, { insumoNome: "Blend bovino 180g", quantidade: 1, unidade: "un" }, { insumoNome: "Mussarela", quantidade: 25, unidade: "g" }, { insumoNome: "Cream cheese", quantidade: 30, unidade: "g" }, { insumoNome: "Costela bovina desfiada", quantidade: 40, unidade: "g" }, { insumoNome: "Anel de cebola", quantidade: 40, unidade: "g" }, { insumoNome: "Barbecue", quantidade: 20, unidade: "g" }, { insumoNome: "Saco Kraft", quantidade: 1, unidade: "un" }, { insumoNome: "Papel acoplado", quantidade: 1, unidade: "un" }] },
  { id: "dom-supreme", nome: "DOM SUPREME", precoVenda: 35, ingredientes: [{ insumoNome: "Pão australiano", quantidade: 1, unidade: "un" }, { insumoNome: "Blend bovino 180g", quantidade: 1, unidade: "un" }, { insumoNome: "Cheddar cremoso", quantidade: 30, unidade: "g" }, { insumoNome: "Farofa de bacon", quantidade: 40, unidade: "g" }, { insumoNome: "Anel de cebola", quantidade: 40, unidade: "g" }, { insumoNome: "Saco Kraft", quantidade: 1, unidade: "un" }, { insumoNome: "Papel acoplado", quantidade: 1, unidade: "un" }] },
  { id: "dom-cheddar", nome: "DOM CHEDDAR", precoVenda: 35, ingredientes: [{ insumoNome: "Pão brioche", quantidade: 1, unidade: "un" }, { insumoNome: "Blend bovino 180g", quantidade: 1, unidade: "un" }, { insumoNome: "Cheddar cremoso", quantidade: 30, unidade: "g" }, { insumoNome: "Farofa de bacon", quantidade: 40, unidade: "g" }, { insumoNome: "Anel de cebola", quantidade: 40, unidade: "g" }, { insumoNome: "Saco Kraft", quantidade: 1, unidade: "un" }, { insumoNome: "Papel acoplado", quantidade: 1, unidade: "un" }] },
  { id: "batata-dom-costelo", nome: "BATATA DOM COSTELO", precoVenda: 35, ingredientes: [{ insumoNome: "Batata frita", quantidade: 400, unidade: "g" }, { insumoNome: "Cream cheese", quantidade: 100, unidade: "g" }, { insumoNome: "Costela bovina desfiada", quantidade: 80, unidade: "g" }, { insumoNome: "Barbecue", quantidade: 50, unidade: "g" }, { insumoNome: "Embalagem H7", quantidade: 1, unidade: "un" }, { insumoNome: "Saco Kraft", quantidade: 1, unidade: "un" }] },
  { id: "batata-cheddar-bacon", nome: "BATATA CHEDDAR E BACON", precoVenda: 32, ingredientes: [{ insumoNome: "Batata frita", quantidade: 400, unidade: "g" }, { insumoNome: "Cheddar cremoso", quantidade: 100, unidade: "g" }, { insumoNome: "Farofa de bacon", quantidade: 80, unidade: "g" }, { insumoNome: "Embalagem H7", quantidade: 1, unidade: "un" }, { insumoNome: "Saco Kraft", quantidade: 1, unidade: "un" }] }
]

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
