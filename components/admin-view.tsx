"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Shield, Key, PlusCircle, Edit, Trash2, Save, UserCheck, UserX, Clock, Eye, EyeOff, RefreshCw } from "lucide-react"
import { getUsuarios, saveUsuarios } from "@/lib/store"
import { 
  getAllUsuarios, 
  saveUsuariosFirebase, 
  subscribeToUsuarios,
  createUsuarioProfile,
  updateUsuarioProfile,
  deleteUsuario as deleteUsuarioFirebase
} from "@/lib/firebase-db"
import type { UsuarioSistema, UserRole, TabPermissao, UserStatus } from "@/lib/types"
import { toast } from "sonner"

interface AdminViewProps {
  currentUser: string
  onPasswordChange: () => void
}

const allPermissoes: { id: TabPermissao; label: string }[] = [
  { id: "estoque", label: "Estoque" },
  { id: "entrada", label: "Entrada" },
  { id: "financeiro", label: "Financeiro" },
  { id: "dashboard", label: "Dashboard" },
  { id: "lista-compras", label: "Lista de Compras" },
]

export function AdminView({ currentUser, onPasswordChange }: AdminViewProps) {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsuarioSistema | null>(null)
  const [showFormPassword, setShowFormPassword] = useState(false)
  const [formData, setFormData] = useState({
    login: "",
    nome: "",
    email: "",
    senha: "",
    role: "operador" as UserRole,
    permissoes: [] as TabPermissao[],
  })

  // Form para alterar senha do usuário logado
  const [passwordForm, setPasswordForm] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  })
  useEffect(() => {
    // Carregar usuários locais primeiro
    setUsuarios(getUsuarios())
    
    // Tentar carregar do Firebase e configurar listener em tempo real
    const loadFromFirebase = async () => {
      try {
        const { data, error } = await getAllUsuarios()
        if (!error && data && data.length > 0) {
          setUsuarios(data)
          saveUsuarios(data) // Sincronizar com localStorage
        }
      } catch (err) {
        console.error("[Firebase] Erro ao carregar usuários:", err)
      }
    }
    
    loadFromFirebase()
    
    // Listener em tempo real para sincronização
    const unsubscribe = subscribeToUsuarios((firebaseUsuarios) => {
      if (firebaseUsuarios.length > 0) {
        setUsuarios(firebaseUsuarios)
        saveUsuarios(firebaseUsuarios)
      }
    })
    
    return () => unsubscribe()
  }, [])

  const handleAddUser = async () => {
    if (!formData.nome.trim() || !formData.email.trim() || !formData.senha.trim()) {
      toast.error("Preencha nome, email e senha")
      return
    }

    if (formData.senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres")
      return
    }

    if (usuarios.some((u) => u.email?.toLowerCase() === formData.email.trim().toLowerCase())) {
      toast.error("Já existe um usuário com este email")
      return
    }

    const newUser: UsuarioSistema = {
      login: formData.email.split("@")[0],
      nome: formData.nome.trim(),
      email: formData.email.trim().toLowerCase(),
      senha: formData.senha,
      role: formData.role,
      permissoes: formData.permissoes,
      status: "aprovado",
      dataCriacao: new Date().toLocaleString("pt-BR"),
    }

    const updated = [...usuarios, newUser]
    setUsuarios(updated)
    saveUsuarios(updated)
    
    // Salvar no Firebase
    const { login, ...userData } = newUser
    await createUsuarioProfile(login, userData)
    
    setIsAddDialogOpen(false)
    setFormData({ login: "", nome: "", email: "", senha: "", role: "operador", permissoes: [] })
    toast.success(`Usuário "${newUser.nome}" criado e sincronizado na nuvem!`)
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    if (!formData.nome.trim() || !formData.email.trim()) {
      toast.error("Preencha nome e email")
      return
    }

    if (formData.senha && formData.senha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres")
      return
    }

    const updatedUserData: Partial<UsuarioSistema> = {
      nome: formData.nome.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      permissoes: formData.permissoes,
    }
    if (formData.senha) updatedUserData.senha = formData.senha

    const updated = usuarios.map((u) =>
      u.login === selectedUser.login
        ? {
            ...u,
            ...updatedUserData,
          }
        : u
    )

    setUsuarios(updated)
    saveUsuarios(updated)
    
    // Atualizar no Firebase
    await updateUsuarioProfile(selectedUser.login, updatedUserData)
    
    setIsEditDialogOpen(false)
    setSelectedUser(null)
    toast.success(`Usuário "${formData.nome}" atualizado e sincronizado na nuvem!`)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    if (selectedUser.login === currentUser) {
      toast.error("Você não pode remover seu próprio usuário!")
      return
    }

    const updated = usuarios.filter((u) => u.login !== selectedUser.login)
    setUsuarios(updated)
    saveUsuarios(updated)
    
    // Remover do Firebase
    await deleteUsuarioFirebase(selectedUser.login)
    
    setIsDeleteDialogOpen(false)
    setSelectedUser(null)
    toast.success(`Usuário "${selectedUser.login}" removido e sincronizado na nuvem!`)
  }

  const openEditDialog = (user: UsuarioSistema) => {
    setSelectedUser(user)
    setFormData({
      login: user.login,
      nome: user.nome || "",
      email: user.email || "",
      senha: "",
      role: user.role,
      permissoes: user.permissoes ? [...user.permissoes] : [],
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (user: UsuarioSistema) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
    const values = new Uint32Array(10)
    crypto.getRandomValues(values)
    const senha = Array.from(values, (value) => chars[value % chars.length]).join("")
    setFormData((prev) => ({ ...prev, senha }))
    setShowFormPassword(true)
  }

  const handlePermissaoToggle = (permissao: TabPermissao) => {
    setFormData((prev) => {
      const hasPermissao = prev.permissoes.includes(permissao)
      return {
        ...prev,
        permissoes: hasPermissao
          ? prev.permissoes.filter((p) => p !== permissao)
          : [...prev.permissoes, permissao],
      }
    })
  }

  const handleBulkPermissionChange = async (userId: string, permissao: TabPermissao, checked: boolean) => {
    const newPermissoes = checked
      ? [...(usuarios.find(u => u.login === userId)?.permissoes || []), permissao]
      : (usuarios.find(u => u.login === userId)?.permissoes || []).filter((p) => p !== permissao)
    
    const updated = usuarios.map((u) => {
      if (u.login === userId) {
        return { ...u, permissoes: newPermissoes }
      }
      return u
    })
    setUsuarios(updated)
    saveUsuarios(updated)
    
    // Atualizar no Firebase
    await updateUsuarioProfile(userId, { permissoes: newPermissoes })
    
    toast.success("Permissões atualizadas e sincronizadas na nuvem!")
  }

  const handleChangePassword = async () => {
    const { senhaAtual, novaSenha, confirmarSenha } = passwordForm

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast.error("Preencha todos os campos")
      return
    }

    const currentUserData = usuarios.find((u) => u.login === currentUser)
    if (!currentUserData || currentUserData.senha !== senhaAtual) {
      toast.error("Senha atual incorreta")
      return
    }

    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem")
      return
    }

    if (novaSenha.length < 3) {
      toast.error("A senha deve ter pelo menos 3 caracteres")
      return
    }

    const updated = usuarios.map((u) =>
      u.login === currentUser ? { ...u, senha: novaSenha } : u
    )

    setUsuarios(updated)
    saveUsuarios(updated)
    
    // Atualizar no Firebase
    await updateUsuarioProfile(currentUser, { senha: novaSenha })
    
    setPasswordForm({ senhaAtual: "", novaSenha: "", confirmarSenha: "" })
    toast.success("Senha alterada e sincronizada na nuvem!")
    
    // Notificar o componente pai para fazer logout ou atualizar
    onPasswordChange()
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pendentes" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendentes
            {usuarios.filter(u => u.status === "pendente").length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {usuarios.filter(u => u.status === "pendente").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="gap-2">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="minha-conta" className="gap-2">
            <Key className="h-4 w-4" />
            Minha Conta
          </TabsTrigger>
        </TabsList>

        {/* Tab Pendentes */}
        <TabsContent value="pendentes" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Solicitações Pendentes</CardTitle>
              <CardDescription>
                Aprove ou rejeite novos usuários que criaram conta no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usuarios.filter(u => u.status === "pendente").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma solicitação pendente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Nome</TableHead>
                      <TableHead className="text-muted-foreground">Email</TableHead>
                      <TableHead className="text-muted-foreground">Data de Criação</TableHead>
                      <TableHead className="text-muted-foreground text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.filter(u => u.status === "pendente").map((user) => (
                      <TableRow key={user.email || user.login} className="border-border">
                        <TableCell className="font-medium">{user.nome || user.login}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{user.dataCriacao || "-"}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              className="gap-1 bg-success hover:bg-success/90"
                              onClick={async () => {
                                const newData = { 
                                  status: "aprovado" as UserStatus, 
                                  permissoes: ["estoque", "entrada", "dashboard", "lista-compras"] as TabPermissao[] 
                                }
                                const updated = usuarios.map(u => 
                                  u.login === user.login ? { ...u, ...newData } : u
                                )
                                setUsuarios(updated)
                                saveUsuarios(updated)
                                await updateUsuarioProfile(user.login, newData)
                                toast.success(`Usuário "${user.login}" aprovado e sincronizado na nuvem!`)
                              }}
                            >
                              <UserCheck className="h-4 w-4" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={async () => {
                                const newData = { status: "rejeitado" as UserStatus }
                                const updated = usuarios.map(u => 
                                  u.login === user.login ? { ...u, ...newData } : u
                                )
                                setUsuarios(updated)
                                saveUsuarios(updated)
                                await updateUsuarioProfile(user.login, newData)
                                toast.success(`Usuário "${user.login}" rejeitado.`)
                              }}
                            >
                              <UserX className="h-4 w-4" />
                              Rejeitar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Usuários */}
        <TabsContent value="usuarios" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciar Usuários</CardTitle>
                <CardDescription>
                  Crie, edite e remova usuários do sistema
                </CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Adicionar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Preencha as informações do novo usuário do sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-nome">Nome</Label>
                      <Input
                        id="add-nome"
                        value={formData.nome}
                        onChange={(e) =>
                          setFormData({ ...formData, nome: e.target.value })
                        }
                        placeholder="Digite o nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-email">Email</Label>
                      <Input
                        id="add-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="Digite o email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-senha">Senha de acesso</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="add-senha"
                            type={showFormPassword ? "text" : "password"}
                            value={formData.senha}
                            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                            placeholder="Digite ou gere uma senha"
                            className="pr-10"
                          />
                          <button type="button" aria-label={showFormPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowFormPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showFormPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <Button type="button" variant="outline" size="icon" onClick={generatePassword} aria-label="Gerar senha">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres. Você pode gerar uma senha segura.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-role">Perfil</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: UserRole) =>
                          setFormData({ ...formData, role: value })
                        }
                      >
                        <SelectTrigger id="add-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="operador">Operador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Permissões</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {allPermissoes.map((perm) => (
                          <div key={perm.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={formData.permissoes.includes(perm.id)}
                              onCheckedChange={() => handlePermissaoToggle(perm.id)}
                            />
                            <Label className="text-sm font-normal cursor-pointer">
                              {perm.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false)
                        setFormData({ login: "", nome: "", email: "", senha: "", role: "operador", permissoes: [] })
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleAddUser}>Criar Usuário</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Nome</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Perfil</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Permissões</TableHead>
                    <TableHead className="text-muted-foreground text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.filter(u => u.status !== "pendente").map((user) => (
                    <TableRow key={user.email || user.login} className="border-border">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.nome || user.login}
                            {user.login === currentUser && (
                              <Badge variant="outline" className="ml-2">
                                Você
                              </Badge>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || "-"}
                      </TableCell>
                      <TableCell>
                        {user.role === "admin" ? (
                          <Badge className="bg-primary">Administrador</Badge>
                        ) : (
                          <Badge variant="secondary">Operador</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.status === "aprovado" ? (
                          <Badge className="bg-success text-success-foreground">Aprovado</Badge>
                        ) : user.status === "rejeitado" ? (
                          <Badge variant="destructive">Rejeitado</Badge>
                        ) : (
                          <Badge variant="outline">-</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.permissoes && user.permissoes.slice(0, 3).map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {allPermissoes.find((p) => p.id === perm)?.label || perm}
                            </Badge>
                          ))}
                          {user.permissoes && user.permissoes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.permissoes.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(user)}
                            disabled={user.login === currentUser}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Permissões */}
        <TabsContent value="permissoes" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Matriz de Permissões</CardTitle>
              <CardDescription>
                Controle granular de acesso aos módulos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Usuário</TableHead>
                      {allPermissoes.map((perm) => (
                        <TableHead key={perm.id} className="text-muted-foreground text-center">
                          {perm.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.filter(u => u.status === "aprovado").map((user) => (
                      <TableRow key={user.email || user.login} className="border-border">
                        <TableCell className="font-medium">
                          {user.nome || user.login}
                          {user.role === "admin" && (
                            <Badge className="ml-2 bg-primary text-xs">Admin</Badge>
                          )}
                        </TableCell>
                        {allPermissoes.map((perm) => (
                          <TableCell key={perm.id} className="text-center">
                            <Checkbox
                              checked={user.permissoes?.includes(perm.id) || false}
                              onCheckedChange={(checked) =>
                                handleBulkPermissionChange(user.login, perm.id, checked as boolean)
                              }
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Minha Conta */}
        <TabsContent value="minha-conta" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Atualize sua senha de acesso ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="senha-atual">Senha Atual</Label>
                  <Input
                    id="senha-atual"
                    type="password"
                    value={passwordForm.senhaAtual}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, senhaAtual: e.target.value })
                    }
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nova-senha">Nova Senha</Label>
                  <Input
                    id="nova-senha"
                    type="password"
                    value={passwordForm.novaSenha}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, novaSenha: e.target.value })
                    }
                    placeholder="Digite a nova senha"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmar-senha"
                    type="password"
                    value={passwordForm.confirmarSenha}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmarSenha: e.target.value })
                    }
                    placeholder="Confirme a nova senha"
                  />
                </div>
                <Button onClick={handleChangePassword} className="gap-2">
                  <Save className="h-4 w-4" />
                  Alterar Senha
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Login:</span>
                  <span className="font-medium">{currentUser}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Perfil:</span>
                  {usuarios.find((u) => u.login === currentUser)?.role === "admin" ? (
                    <Badge className="bg-primary">Administrador</Badge>
                  ) : (
                    <Badge variant="secondary">Operador</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Digite o nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Digite o email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-senha">Nova senha</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="edit-senha"
                    type={showFormPassword ? "text" : "password"}
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder="Deixe vazio para manter a senha atual"
                    className="pr-10"
                  />
                  <button type="button" aria-label={showFormPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowFormPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showFormPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={generatePassword} aria-label="Gerar nova senha">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Deixe vazio para não alterar a senha atual.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Perfil</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="operador">Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permissões</Label>
              <div className="grid grid-cols-2 gap-2">
                {allPermissoes.map((perm) => (
                  <div key={perm.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.permissoes.includes(perm.id)}
                      onCheckedChange={() => handlePermissaoToggle(perm.id)}
                    />
                    <Label className="text-sm font-normal cursor-pointer">
                      {perm.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedUser(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditUser}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o usuário{" "}
              <strong>{selectedUser?.nome || selectedUser?.login}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedUser(null)
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover Usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
