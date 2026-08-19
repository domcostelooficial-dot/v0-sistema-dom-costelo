export type UnidadeInsumo = "un" | "g" | "kg" | "ml" | "l" | "m" | "pacote" | "caixa" | "bobina" | "maço" | "fardo" | "saco" | "garrafa" | "lata" | "pct" | "aplicação"
export type CategoriaInsumo = "Carnes" | "Pães" | "Queijos" | "Molhos" | "Batatas/congelados" | "Bebidas" | "Embalagens" | "Mercearia" | "Laticínios" | "Padaria" | "Congelados" | "Temperos" | "Higiene/Limpeza" | "Outros"

export interface Item {
  id?: string
  insumoId?: string
  nome: string
  min: number
  atual: number
  categoria: string
  preco?: number
  unidade?: UnidadeInsumo
  unidadeEstoque?: string
  quantidadePorEmbalagem?: number
  unidadeConteudo?: string
  precoCompra?: number
  quantidadeEmbalagem?: number
  unidadeEmbalagem?: UnidadeInsumo
  custoUnitario?: number
  fornecedor?: string
  precoReferencia?: number
  unidadeReferencia?: string
  ultimaAtualizacaoPreco?: string
  ativo?: boolean
  naoVinculado?: boolean
  origem?: "estoque" | "central"
  ultimaAlteracao?: {
    usuario: string
    data: string
  }
}

export interface Insumo extends Item {
  categoria: CategoriaInsumo
  unidade: UnidadeInsumo
  unidadeCompra?: UnidadeInsumo
  unidadeBase?: "g" | "kg" | "ml" | "l" | "un"
  unidadeConteudo?: UnidadeInsumo
  precoCompra: number
  quantidadeEmbalagem: number
  quantidadeConteudo?: number
  unidadeEmbalagem: UnidadeInsumo
  custoUnitario: number
  aliases?: string[]
  revisaoUnidade?: boolean
}

export interface IngredienteFicha {
  insumoId?: string
  insumoNome: string
  quantidade: number
  unidade: UnidadeInsumo
}

export interface FichaTecnica {
  id: string
  nome: string
  precoVenda: number
  ingredientes: IngredienteFicha[]
  embalagem?: number
  categoria?: string
  ativo?: boolean
  metaCmv?: number
}

export interface HistoricoPrecoInsumo {
  id: string
  insumoNome: string
  precoAnterior: number
  precoNovo: number
  data: string
  usuario?: string
}

export interface ComboItem {
  tipo: "produto" | "insumo"
  referenciaId: string
  nome: string
  quantidade: number
  unidade?: UnidadeInsumo
}

export interface Combo {
  id: string
  nome: string
  precoVenda: number
  itens: ComboItem[]
  ativo: boolean
}

export interface VendaProduto {
  id: string
  produtoNome: string
  quantidade: number
  data: string
  fichaTecnicaId?: string
  statusBaixa?: "pendente" | "baixada" | "bloqueada" | "cancelada"
  baixaId?: string
  motivoBloqueio?: string
}

export interface ConsumoVenda {
  vendaId: string
  produtoNome: string
  fichaTecnicaId: string
  quantidadeVendida: number
  insumoId: string
  insumoNomeSnapshot: string
  quantidade: number
  unidade: UnidadeInsumo
  quantidadeBase: number
  unidadeBase: "g" | "kg" | "ml" | "l" | "un"
}

export interface PrevisaoVenda {
  produtoNome: string
  quantidade: number
}

export type TipoMovimentacaoEstoque = "entrada" | "estorno_entrada" | "saida" | "saida_venda" | "ajuste" | "ajuste_inventario"

export interface MovimentacaoEstoque {
  id: string
  tipo: TipoMovimentacaoEstoque
  insumoId: string
  insumoNomeSnapshot: string
  quantidade: number
  unidadeSnapshot: UnidadeInsumo
  quantidadeBase: number
  unidadeBase: UnidadeInsumo
  quantidadeBaixadaEstoque?: number
  precoUnitarioSnapshot: number
  valorTotal: number
  fornecedor?: string
  observacao?: string
  produtoId?: string
  quantidadeVendida?: number
  quantidadeFicha?: number
  unidadeFicha?: UnidadeInsumo
  unidadeEstoque?: UnidadeInsumo
  canalVenda?: string
  baixaId?: string
  estoquePosterior?: number
  vendaId?: string
  produtoNomeSnapshot?: string
  saldoAnterior?: number
  saldoPosterior?: number
  motivo?: "consumo" | "consumo_interno" | "perda" | "descarte" | "vencimento" | "avaria" | "uso_operacional" | "cortesia" | "contagem_fisica" | "correcao_cadastro" | "perda_nao_registrada" | "entrada_nao_registrada" | "erro_operacional" | "ajuste_manual" | "outro"
  estoqueAnterior?: number
  estoqueContado?: number
  diferenca?: number
  origem: "compras" | "estoque" | "venda_automatica"
  movimentacaoOrigemId?: string
  movimentacaoOriginalId?: string
  status: "efetivada" | "estornada" | "ativa"
  usuarioId: string
  usuarioEmail: string
  criadoEm: string
  dataMovimentacao?: string
  criadoPorUid?: string
  criadoPorEmail?: string
  criadoPorNome?: string
  estornadoEm?: string
  estornadoPor?: string
  estornadaPorUid?: string
  precoTotal?: number
  unidade?: UnidadeInsumo
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

export type UserRole = "owner" | "admin" | "operador"

export type TabPermissao = "estoque" | "entrada" | "financeiro" | "dashboard" | "lista-compras" | "cmv" | "admin"

export type UserStatus = "pendente" | "aprovado" | "rejeitado"

export interface UsuarioSistema {
  uid?: string
  login: string
  nome?: string
  email?: string
  role: UserRole
  permissoes: TabPermissao[]
  status: UserStatus
  ativo?: boolean
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

export type { CanalVenda, FinanceConfig, VendaFinanceira, DespesaFinanceira } from "./finance-engine"

const defaultInsumoRows: Array<[string, UnidadeInsumo, number, number, UnidadeInsumo, CategoriaInsumo]> = [
  ["Pão brioche 4CT", "un", 2.07, 1, "un", "Pães"], ["Pão Australiano Aussie", "un", 2.53, 1, "un", "Pães"], ["Carne de hambúrguer / Blend 180g", "un", 6.35, 180, "g", "Carnes"],
  ["Cheddar Polenghi profissional", "pacote", 60, 1.5, "kg", "Queijos"], ["Cream cheese", "pacote", 60, 1.5, "kg", "Queijos"], ["Bacon em cubos", "kg", 32, 1, "kg", "Carnes"], ["Bacon fatiado", "kg", 32, 1, "kg", "Carnes"], ["Barbecue", "kg", 40, 3.5, "kg", "Molhos"], ["Costela Desfiada", "kg", 80, 1, "kg", "Carnes"], ["Mussarela", "kg", 43, 1, "kg", "Queijos"], ["Batata frita", "pacote", 20, 2, "kg", "Batatas/congelados"], ["Anel de cebola", "kg", 22, 1, "kg", "Batatas/congelados"], ["Farofa", "kg", 55, 1, "kg", "Mercearia"], ["Cebolinha", "maço", 3, 100, "g", "Mercearia"], ["Embalagem H7", "un", 50, 100, "un", "Embalagens"], ["Saco Kraft", "un", 70, 100, "un", "Embalagens"], ["Papel acoplado", "un", 35, 200, "un", "Embalagens"], ["Sacola para Refrigerante", "un", 0, 1, "un", "Embalagens"]
]
const aliasesPorInsumo: Record<string, string[]> = {
  "Carne de hambúrguer / Blend 180g": ["Carne de hambúrguer", "Blend bovino 180g", "Blend 180g"],
  "Pão Australiano Aussie": ["Pão australiano", "Pão de Australiano Aussie", "Pão Australiano"],
  "Pão brioche 4CT": ["Pão brioche", "Pão Brioche"],
  "Bacon em cubos": ["Bacon", "Bacon cubos"],
  "Costela Desfiada": ["Costela bovina desfiada", "Costela desfiada"],
  "Cheddar Polenghi profissional": ["Cheddar cremoso", "Cheddar Polengui profissional"],
}
export const defaultInsumos: Insumo[] = defaultInsumoRows.map(([nome, unidade, precoCompra, quantidadeEmbalagem, unidadeEmbalagem, categoria]) => ({ nome, unidade, unidadeCompra: unidade, precoCompra, quantidadeEmbalagem, quantidadeConteudo: quantidadeEmbalagem, unidadeEmbalagem, unidadeConteudo: unidadeEmbalagem, unidadeBase: ["kg", "g"].includes(unidadeEmbalagem) ? "g" : unidadeEmbalagem === "l" ? "ml" : "un", aliases: aliasesPorInsumo[nome], categoria, custoUnitario: precoCompra / quantidadeEmbalagem, min: 0, atual: 0 }))

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

export const catalogoEmbalagens: Array<[string, string, number, string, string]> = [
  ["Carne de hambúrguer", "Unidade", 180, "g", "Carnes"], ["Costela Pronta", "Unidade", 1, "kg", "Carnes"], ["Costela Desfiada", "Kg", 1, "kg", "Carnes"], ["Bacon em cubos", "Kg", 1, "kg", "Carnes"], ["Bacon Fatiado", "Kg", 1, "kg", "Carnes"], ["Pão Australiano Aussie", "Unidade", 1, "un", "Padaria"], ["Pão brioche 4CT", "Unidade", 1, "un", "Padaria"], ["Batata", "Pacote", 2, "kg", "Insumos"], ["Anel de cebola", "Pacote", 1, "kg", "Insumos"], ["Mussarela", "Kg", 1, "kg", "Insumos"], ["Cream cheese", "Pacote", 1.5, "kg", "Insumos"], ["Cheddar Polenghi profissional", "Pacote", 1.5, "kg", "Insumos"], ["Molho de Cheddar", "Pacote", 1.5, "kg", "Insumos"], ["Óleo", "Unidade", 800, "ml", "Insumos"], ["Sal", "Pacote", 1, "kg", "Insumos"], ["Barbecue", "Unidade", 3.5, "kg", "Insumos"], ["Alho torrado", "Pacote", 1, "kg", "Insumos"], ["Cebolinha", "Unidade/maço", 100, "g", "Insumos"], ["Temperos", "Pacote", 1.9, "kg", "Insumos"], ["Pimenta Biquinho", "Pacote", 2, "kg", "Insumos"],
  ["Embalagem H7", "Unidade", 1, "un", "Embalagens"], ["Embalagem H2", "Unidade", 1, "un", "Embalagens"], ["Embalagem de prato feito", "Unidade", 1, "un", "Embalagens"], ["Embalagem para talher", "Pacote", 100, "un", "Embalagens"], ["Embalagem de farofa", "Unidade", 1, "un", "Embalagens"], ["Lacre para delivery", "Bobina", 500, "un", "Embalagens"], ["Lacre para o forno", "Pacote", 100, "un", "Embalagens"], ["Guardanapo", "Pacote", 100, "un", "Embalagens"], ["Saco Kraft G", "Unidade", 1, "un", "Embalagens"], ["Saco Kraft GG (extra)", "Unidade", 1, "un", "Embalagens"], ["Papel acoplado metalizado", "Pacote", 200, "un", "Embalagens"], ["Papel acoplado (comum)", "Pacote", 200, "un", "Embalagens"], ["Palito para hambúrguer", "Pacote", 200, "un", "Embalagens"], ["Grampo da embalagem", "Pacote", 1000, "un", "Embalagens"], ["Copo descartável", "Pacote", 100, "un", "Embalagens"], ["Garfo descartável", "Pacote", 50, "un", "Embalagens"], ["Saco de embalar batata", "Bobina", 500, "un", "Embalagens"], ["Papel Celofane", "Bobina", 65, "metro", "Embalagens"], ["Sacola para Refrigerante", "Bobina", 100, "un", "Embalagens"],
  ["Água para consumo", "Unidade", 1.5, "L", "Bebidas"], ["Água com gás", "Unidade", 500, "ml", "Bebidas"], ["Água normal", "Unidade", 500, "ml", "Bebidas"], ["Coca Zero 1,5L", "Unidade", 1.5, "L", "Bebidas"], ["Coca-Cola 1,5L", "Unidade", 1.5, "L", "Bebidas"], ["Del Valle 1,5L", "Unidade", 1.5, "L", "Bebidas"], ["Guaraná 1L", "Unidade", 1, "L", "Bebidas"], ["Coca Lata 350ml", "Unidade", 350, "ml", "Bebidas"], ["Guaraná lata 350ml", "Unidade", 350, "ml", "Bebidas"], ["Arroz", "Pacote", 5, "kg", "Cozinha"], ["Farofa", "Pacote", 900, "g", "Cozinha"], ["Veja multiuso", "Unidade", 500, "ml", "Limpeza"], ["Perfex", "Pacote", 100, "un", "Limpeza"], ["Detergente", "Unidade", 5, "L", "Limpeza"], ["Esponja de louça", "Pacote", 4, "un", "Limpeza"], ["Saco de lixo 30L", "Bobina", 25, "sacos", "Limpeza"], ["Saco de lixo 100L", "Bobina", 25, "sacos", "Limpeza"], ["Desinfetante", "Unidade", 1, "L", "Limpeza"], ["Touca", "Pacote", 100, "un", "Operacional"], ["Gás 13kg", "Unidade", 13, "kg", "Operacional"], ["Gás de maçarico", "Unidade", 300, "g", "Operacional"], ["Bobina térmica 80mm", "Bobina", 30, "metro", "Operacional"],
]

export const defaultItens: Item[] = [
  { nome: "Carne de hambúrguer", min: 12, atual: 12, categoria: "Carnes" },
  { nome: "Costela Pronta", min: 2, atual: 2, categoria: "Carnes" },
  { nome: "Costela Desfiada", min: 2, atual: 2, categoria: "Carnes" },
  { nome: "Bacon em cubos", min: 2, atual: 2, categoria: "Carnes" },
  { nome: "Bacon Fatiado", min: 2, atual: 2, categoria: "Carnes" },

  { nome: "Pão de Australiano Aussie", min: 12, atual: 12, categoria: "Padaria" },
  { nome: "Pão brioche 4CT", min: 12, atual: 12, categoria: "Padaria" },

  { nome: "Batata", min: 7, atual: 7, categoria: "Insumos" },
  { nome: "Anel de cebola", min: 2, atual: 2, categoria: "Insumos" },
  { nome: "Mussarela", min: 1, atual: 1, categoria: "Insumos" },
  { nome: "Cream cheese", min: 1, atual: 1, categoria: "Insumos" },
  { nome: "Cheddar Polengui profissional", min: 1, atual: 1, categoria: "Insumos" },
  { nome: "Molho de Cheddar", min: 1, atual: 1, categoria: "Insumos" },
  { nome: "Óleo", min: 3, atual: 3, categoria: "Insumos" },
  { nome: "Sal", min: 1, atual: 1, categoria: "Insumos" },
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
  { nome: "Sacola para Refrigerante", min: 1, atual: 1, categoria: "Embalagens" },

  { nome: "Água para consumo", min: 2, atual: 2, categoria: "Bebidas" },
  { nome: "Água com gás", min: 6, atual: 6, categoria: "Bebidas" },
  { nome: "Água normal", min: 6, atual: 6, categoria: "Bebidas" },
  { nome: "Coca zero 1,5L", min: 10, atual: 10, categoria: "Bebidas" },
  { nome: "Coca cola 1,5L", min: 10, atual: 10, categoria: "Bebidas" },
  { nome: "Dell vale 1,5L", min: 6, atual: 6, categoria: "Bebidas" },
  { nome: "Guaraná 1L", min: 10, atual: 10, categoria: "Bebidas" },
  { nome: "Coca Lata 350ml", min: 12, atual: 12, categoria: "Bebidas" },
  { nome: "Guaraná lata 350ml", min: 12, atual: 12, categoria: "Bebidas" },

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
