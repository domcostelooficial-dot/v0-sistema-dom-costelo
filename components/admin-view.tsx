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
import { Users, Shield, Key, PlusCircle, Edit, Trash2, Save } from "lucide-react"
import { getUsuarios, saveUsuarios } from "@/lib/store"
import type { UsuarioSistema, UserRole, TabPermissao } from "@/lib/types"
import { toast } from "sonner"

interface AdminViewProps {
  currentUser: string
  onPasswordChange: () => void
}

const allPermissoes: { id: TabPermissao; label: string }[] = [
  { id: "estoque", label: "Estoque" },
  { id: "entrada", label: "Entrada" },
  { id: "producao", label: "Produção" },
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
  const [formData, setFormData] = useState({
    login: "",
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
    setUsuarios(getUsuarios())
  }, [])

  const handleAddUser = () => {
    if (!formData.login.trim() || !formData.senha.trim()) {
      toast.error("Preencha login e senha")
      return
    }

    if (usuarios.some((u) => u.login.toLowerCase() === formData.login.trim().toLowerCase())) {
      toast.error("Já existe um usuário com este login")
      return
    }

    const newUser: UsuarioSistema = {
      login: formData.login.trim(),
      senha: formData.senha,
      role: formData.role,
      permissoes: formData.permissoes,
    }

    const updated = [...usuarios, newUser]
    setUsuarios(updated)
    saveUsuarios(updated)
    setIsAddDialogOpen(false)
    setFormData({ login: "", senha: "", role: "operador", permissoes: [] })
    toast.success(`Usuário "${newUser.login}" criado com sucesso!`)
  }

  const handleEditUser = () => {
    if (!selectedUser) return

    if (!formData.login.trim() || !formData.senha.trim()) {
      toast.error("Preencha login e senha")
      return
    }

    const updated = usuarios.map((u) =>
      u.login === selectedUser.login
        ? {
            login: formData.login.trim(),
            senha: formData.senha,
            role: formData.role,
            permissoes: formData.permissoes,
          }
        : u
    )

    setUsuarios(updated)
    saveUsuarios(updated)
    setIsEditDialogOpen(false)
    setSelectedUser(null)
    toast.success(`Usuário "${formData.login}" atualizado com sucesso!`)
  }

  const handleDeleteUser = () => {
    if (!selectedUser) return

    if (selectedUser.login === currentUser) {
      toast.error("Você não pode remover seu próprio usuário!")
      return
    }

    const updated = usuarios.filter((u) => u.login !== selectedUser.login)
    setUsuarios(updated)
    saveUsuarios(updated)
    setIsDeleteDialogOpen(false)
    setSelectedUser(null)
    toast.success(`Usuário "${selectedUser.login}" removido com sucesso!`)
  }

  const openEditDialog = (user: UsuarioSistema) => {
    setSelectedUser(user)
    setFormData({
      login: user.login,
      senha: user.senha,
      role: user.role,
      permissoes: [...user.permissoes],
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (user: UsuarioSistema) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
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

  const handleBulkPermissionChange = (userId: string, permissao: TabPermissao, checked: boolean) => {
    const updated = usuarios.map((u) => {
      if (u.login === userId) {
        const newPermissoes = checked
          ? [...u.permissoes, permissao]
          : u.permissoes.filter((p) => p !== permissao)
        return { ...u, permissoes: newPermissoes }
      }
      return u
    })
    setUsuarios(updated)
    saveUsuarios(updated)
    toast.success("Permissões atualizadas!")
  }

  const handleChangePassword = () => {
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
    setPasswordForm({ senhaAtual: "", novaSenha: "", confirmarSenha: "" })
    toast.success("Senha alterada com sucesso!")
    
    // Notificar o componente pai para fazer logout ou atualizar
    onPasswordChange()
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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
                      <Label htmlFor="add-login">Login</Label>
                      <Input
                        id="add-login"
                        value={formData.login}
                        onChange={(e) =>
                          setFormData({ ...formData, login: e.target.value })
                        }
                        placeholder="Digite o login"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-senha">Senha</Label>
                      <Input
                        id="add-senha"
                        type="password"
                        value={formData.senha}
                        onChange={(e) =>
                          setFormData({ ...formData, senha: e.target.value })
                        }
                        placeholder="Digite a senha"
                      />
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
                        setFormData({ login: "", senha: "", role: "operador", permissoes: [] })
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
                    <TableHead className="text-muted-foreground">Login</TableHead>
                    <TableHead className="text-muted-foreground">Perfil</TableHead>
                    <TableHead className="text-muted-foreground">Permissões</TableHead>
                    <TableHead className="text-muted-foreground text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((user) => (
                    <TableRow key={user.login} className="border-border">
                      <TableCell className="font-medium">
                        {user.login}
                        {user.login === currentUser && (
                          <Badge variant="outline" className="ml-2">
                            Você
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.role === "admin" ? (
                          <Badge className="bg-primary">Administrador</Badge>
                        ) : (
                          <Badge variant="secondary">Operador</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.permissoes.slice(0, 3).map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {allPermissoes.find((p) => p.id === perm)?.label || perm}
                            </Badge>
                          ))}
                          {user.permissoes.length > 3 && (
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
                    {usuarios.map((user) => (
                      <TableRow key={user.login} className="border-border">
                        <TableCell className="font-medium">
                          {user.login}
                          {user.role === "admin" && (
                            <Badge className="ml-2 bg-primary text-xs">Admin</Badge>
                          )}
                        </TableCell>
                        {allPermissoes.map((perm) => (
                          <TableCell key={perm.id} className="text-center">
                            <Checkbox
                              checked={user.permissoes.includes(perm.id)}
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
              <Label htmlFor="edit-login">Login</Label>
              <Input
                id="edit-login"
                value={formData.login}
                onChange={(e) =>
                  setFormData({ ...formData, login: e.target.value })
                }
                placeholder="Digite o login"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-senha">Senha</Label>
              <Input
                id="edit-senha"
                type="password"
                value={formData.senha}
                onChange={(e) =>
                  setFormData({ ...formData, senha: e.target.value })
                }
                placeholder="Digite a senha"
              />
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
              <strong>{selectedUser?.login}</strong>? Esta ação não pode ser
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
