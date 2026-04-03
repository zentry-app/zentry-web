"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MessageSquare,
  Search,
  Plus,
  ArrowLeft,
  Send,
  MoreVertical,
  Trash2,
  Users,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { MessagesService, Message as MessageType, Chat as ChatType, User } from '@/lib/services/messages-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function MensajesPageV2() {
  const { user, userClaims } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estados principales
  const [chats, setChats] = useState<ChatType[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [residencialId, setResidencialId] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchUsers, setSearchUsers] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Utilidades
  const buildFullName = (userData: any): string => {
    if (userData.fullName && userData.fullName.trim()) {
      const p = userData.fullName.trim().split(' ');
      if (p.length >= 3) return userData.fullName.trim();
    }
    const f = userData.fullName || userData.nombre || userData.name || userData.firstName || '';
    const p = userData.paternalLastName || userData.apellidoPaterno || '';
    const m = userData.maternalLastName || userData.apellidoMaterno || '';
    const full = [f, p, m].filter((part: string) => Boolean(part && String(part).trim())).join(' ');
    return full || 'Usuario sin nombre';
  };

  const getInitials = (fullName: string): string => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(' ').filter(part => part.length > 0);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  const getOtherParticipant = (chat: ChatType) => {
    const otherId = chat.participants.find(id => id !== user?.uid);
    const otherUser = users[otherId || ''];
    if (!otherUser && chat.participants.length > 0) {
      return {
        uid: otherId || '',
        fullName: `Usuario ${otherId?.substring(0, 8) || 'Desconocido'}`,
        email: '---',
        role: 'resident',
        calle: '---',
        houseNumber: ''
      };
    }
    if (otherUser) {
      return { ...otherUser, fullName: buildFullName(otherUser) };
    }
    return otherUser;
  };

  // Cargar datos
  useEffect(() => {
    if (user && userClaims) {
      const loadUserData = async () => {
        try {
          if (userClaims?.managedResidencialId) {
            const resDoc = await MessagesService.getResidencialDocId(userClaims.managedResidencialId);
            if (resDoc) setResidencialId(resDoc);
          }
        } catch (error) {
          toast({ title: "Error", description: "No se pudo cargar la información del usuario", variant: "destructive" });
        }
      };
      loadUserData();
    }
  }, [user, userClaims, toast]);

  useEffect(() => {
    if (residencialId) {
      const initChatsUsers = async () => {
        setLoading(true);
        try {
          const c = await MessagesService.getChats(residencialId, user?.uid || undefined);
          setChats(c);
          const u = await MessagesService.getUsers(residencialId);
          const uMap: Record<string, User> = {};
          u.forEach(ux => { uMap[ux.uid] = { ...ux, fullName: buildFullName(ux) }; });
          setUsers(uMap);
        } catch (e) {
          toast({ title: "Error", description: "No se pudieron cargar los chats", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      initChatsUsers();

      const unsubsChats = MessagesService.subscribeToChats(residencialId, (updated) => setChats(updated), user?.uid);
      return () => unsubsChats();
    }
  }, [residencialId, user?.uid, toast]);

  useEffect(() => {
    if (selectedChat) {
      const initMsgs = async () => {
        setLoadingMessages(true);
        try {
          const m = await MessagesService.getMessages(residencialId, selectedChat.id);
          setMessages(m);
          if (user?.uid) await MessagesService.markAsRead(residencialId, selectedChat.id, user.uid);
        } catch (e) {
          toast({ title: "Error", description: "No se pudieron cargar los mensajes", variant: "destructive" });
        } finally {
          setLoadingMessages(false);
        }
      };
      initMsgs();

      const unsubMsgs = MessagesService.subscribeToMessages(residencialId, selectedChat.id, (m) => setMessages(m));
      return () => unsubMsgs();
    }
  }, [selectedChat, residencialId, user?.uid, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (showNewChatModal && residencialId) {
      MessagesService.getUsers(residencialId).then(usrs => {
        setAvailableUsers(usrs.filter(u => u.uid !== user?.uid).map(u => ({ ...u, fullName: buildFullName(u) })));
      });
    }
  }, [showNewChatModal, residencialId, user?.uid]);

  useEffect(() => {
    const chatId = searchParams.get('chatId');
    if (chatId && chats.length > 0 && !selectedChat) {
      const chatToSelect = chats.find(c => c.id === chatId);
      if (chatToSelect) {
        setSelectedChat(chatToSelect);
        router.replace('/dashboard/mensajes', { scroll: false });
      }
    }
  }, [searchParams, chats, selectedChat, router]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user?.uid) return;
    const text = newMessage;
    setNewMessage('');
    setSending(true);
    try {
      const senderName = users[user.uid] ? buildFullName(users[user.uid]) : (user.displayName || user.email || 'Usuario');
      await MessagesService.sendMessage(residencialId, selectedChat.id, text, user.uid, senderName);
    } catch (e) {
      toast({ title: "Error", description: "No se pudo enviar", variant: "destructive" });
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const createNewChat = async (otherUserId: string) => {
    if (!user?.uid) return;
    try {
      const newId = await MessagesService.createChat(residencialId, user.uid, otherUserId);
      const newChat = chats.find(c => c.id === newId);
      if (newChat) setSelectedChat(newChat);
      setShowNewChatModal(false);
      setSearchUsers('');
    } catch (e) {
      toast({ title: "Error", description: "No se pudo crear la conversación", variant: "destructive" });
    }
  };

  const handleDeleteChat = async () => {
    if (!chatToDelete || !residencialId) return;
    try {
      await MessagesService.deleteChat(residencialId, chatToDelete);
      if (selectedChat?.id === chatToDelete) {
        setSelectedChat(null);
        setMessages([]);
      }
      toast({ title: "Conversación eliminada" });
      setShowDeleteDialog(false);
      setChatToDelete(null);
    } catch (e) {
      toast({ title: "Error", description: "No se pudo borrar", variant: "destructive" });
    }
  };

  const filteredChats = chats.filter(chat => {
    const otherUser = getOtherParticipant(chat);
    if (!otherUser) return false;
    if (!searchTerm) return true;
    return otherUser.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      otherUser.email.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => {
    const timeA = a.lastMessageTime?.seconds || 0;
    const timeB = b.lastMessageTime?.seconds || 0;
    return timeB - timeA;
  });

  const filteredUsers = availableUsers.filter(u =>
    u.fullName.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-premium">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="font-black text-primary tracking-widest uppercase animate-pulse">Sincronizando Mensajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-premium p-4 lg:p-10 pb-20 overflow-hidden flex flex-col">
      {/* Header General */}
      <div className="flex justify-between items-start gap-6 mb-8 shrink-0">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1 rounded-full flex gap-2 w-fit items-center shadow-sm">
            <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
            Bandeja Unificada
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tighter text-slate-900">
            Centro de <span className="text-gradient-zentry">Mensajes</span>
          </h1>
          <p className="text-slate-600 font-bold max-w-lg">
            Mantente en contacto directo con la administración y los residentes del complejo.
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-[600px] h-full max-h-[calc(100vh-250px)]">

        {/* Sidebar */}
        <div className={cn(
          "lg:col-span-4 rounded-[2.5rem] bg-white/70 backdrop-blur-xl shadow-zentry border border-white/50 flex flex-col overflow-hidden",
          selectedChat ? "hidden lg:flex" : "flex"
        )}>
          <div className="p-6 pb-4 border-b border-slate-100/50 space-y-4 shrink-0 bg-white/50">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900">Conversaciones</h2>
              <Button
                onClick={() => setShowNewChatModal(true)}
                size="icon"
                className="h-10 w-10 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover-lift"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar chat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white border border-slate-200 shadow-inner rounded-2xl font-bold focus-visible:ring-primary/20 text-slate-900"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-2">
              {filteredChats.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="h-16 w-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <MessageSquare className="h-8 w-8" />
                  </div>
                  <p className="text-slate-500 font-bold text-sm">No tienes conversaciones activas aún.</p>
                  <Button onClick={() => setShowNewChatModal(true)} variant="link" className="text-primary font-black">Empezar nuevo chat</Button>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredChats.map(chat => {
                    const otherUser = getOtherParticipant(chat);
                    if (!otherUser) return null;
                    const isSelected = selectedChat?.id === chat.id;
                    const unreadCount = chat.unreadCount[user?.uid || ''] || 0;

                    const fmtTime = chat.lastMessageTime?.toDate
                      ? format(chat.lastMessageTime.toDate(), 'HH:mm')
                      : (chat.lastMessageTime?.seconds ? format(new Date(chat.lastMessageTime.seconds * 1000), 'HH:mm') : '');

                    return (
                      <motion.div
                        layout
                        key={chat.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedChat(chat)}
                        className={cn(
                          "p-3 rounded-[1.5rem] cursor-pointer transition-all border group",
                          isSelected
                            ? "bg-primary text-white border-primary shadow-lg"
                            : "bg-white hover:bg-slate-50 border-transparent hover:border-slate-200"
                        )}
                      >
                        <div className="flex gap-4 items-center">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 flex shadow-inner items-center justify-center shrink-0">
                            <span className={cn("font-black text-xl", isSelected ? "text-slate-600" : "text-slate-500")}>
                              {getInitials(otherUser.fullName)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <h4 className={cn("font-black text-sm truncate", isSelected ? "text-white" : "text-slate-900")}>
                                {otherUser.fullName}
                              </h4>
                              <span className={cn("text-[10px] font-bold shrink-0", isSelected ? "text-primary-100" : "text-slate-400")}>
                                {fmtTime}
                              </span>
                            </div>
                            <p className={cn("text-xs font-semibold truncate", isSelected ? "text-primary-50" : "text-slate-500")}>
                              {chat.lastMessageSender === user?.uid ? <span className="opacity-70">Tú: </span> : null}
                              {chat.lastMessage || 'Nuevo chat'}
                            </p>
                          </div>

                          <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                            {unreadCount > 0 && !isSelected && (
                              <Badge className="bg-emerald-500 text-white font-black px-1.5 min-w-[1.5rem] border-none shadow-sm rounded-full h-5 flex items-center justify-center">
                                {unreadCount}
                              </Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className={cn("h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100", isSelected ? "hover:bg-primary-foreground/20 text-white" : "")} onClick={e => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl shadow-xl border-none">
                                <DropdownMenuItem className="text-destructive font-bold focus:text-destructive focus:bg-destructive/5 rounded-xl cursor-pointer" onClick={(e) => { e.stopPropagation(); setChatToDelete(chat.id); setShowDeleteDialog(true); }}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </div>


        {/* Chat Area */}
        <div className={cn(
          "lg:col-span-8 rounded-[2.5rem] bg-white/70 backdrop-blur-xl shadow-zentry border border-white/50 flex flex-col overflow-hidden",
          !selectedChat ? "hidden lg:flex" : "flex"
        )}>
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
              <div className="h-24 w-24 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Comienza a Interactuar</h2>
              <p className="text-slate-500 font-bold max-w-sm">Selecciona una conversación del lateral izquierdo o crea una nueva para enviar mensajes.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-slate-100/50 flex items-center justify-between shrink-0 bg-white/50">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="lg:hidden shrink-0 h-10 w-10 rounded-2xl" onClick={() => setSelectedChat(null)}>
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                  </Button>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-[1.5rem] bg-slate-200 flex shadow-inner items-center justify-center shrink-0">
                      <span className="font-black text-xl text-slate-500">
                        {getInitials(getOtherParticipant(selectedChat)?.fullName || '')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900 leading-tight">{getOtherParticipant(selectedChat)?.fullName}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Residente</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl shrink-0 text-slate-400 hover:text-primary hover:bg-primary/5">
                  <Info className="h-5 w-5" />
                </Button>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-6 bg-slate-50/30">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <Badge variant="outline" className="bg-white border-slate-200 text-slate-400 font-black px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px] mb-4">
                      NUEVO CHAT
                    </Badge>
                    <p className="text-slate-500 font-bold">Sé el primero en decir hola 👋</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((m, idx) => {
                      const isMe = m.senderId === user?.uid;
                      const fmtDate = m.timestamp?.toDate
                        ? format(m.timestamp.toDate(), 'HH:mm')
                        : (m.timestamp?.seconds ? format(new Date(m.timestamp.seconds * 1000), 'HH:mm') : '');
                      return (
                        <motion.div
                          key={m.id || idx}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
                        >
                          <div className={cn(
                            "max-w-[75%] md:max-w-[60%] flex flex-col gap-1",
                            isMe ? "items-end" : "items-start"
                          )}>
                            <div className={cn(
                              "px-5 py-3.5 rounded-[1.5rem] shadow-sm text-[15px] font-medium leading-relaxed drop-shadow-sm",
                              isMe
                                ? "bg-slate-900 text-white rounded-tr-sm"
                                : "bg-white text-slate-800 border border-slate-100 rounded-tl-sm"
                            )}>
                              {m.text}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 px-2">{fmtDate}</span>
                          </div>
                        </motion.div>
                      )
                    })}
                    <div ref={messagesEndRef} className="h-2" />
                  </div>
                )}
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 bg-white/50 border-t border-slate-100/50 shrink-0">
                <div className="relative flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder="Escribe tu mensaje aquí..."
                    className="h-14 rounded-2xl bg-white border-none shadow-md font-medium px-6 pr-14 focus-visible:ring-primary/20 text-[15px]"
                    disabled={sending}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                    className="absolute right-1 top-1 h-12 w-12 rounded-[1.2rem] bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4 ml-1" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Nuevo Chat Dialog */}
      <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-[3rem] bg-white p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4 bg-slate-900 text-white">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">Nuevo Chat</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold">Busca a un residente para enviar mensaje.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 space-y-6 bg-slate-50 min-h-[400px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                value={searchUsers}
                onChange={e => setSearchUsers(e.target.value)}
                placeholder="Nombre, email o dirección..."
                className="pl-12 h-14 bg-white border-none shadow-inner rounded-[1.5rem] font-bold focus:ring-primary/20"
              />
            </div>
            <ScrollArea className="h-[280px] rounded-[1.5rem] pr-4">
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-slate-400 font-bold py-10">No se encontraron usuarios.</p>
                ) : (
                  filteredUsers.map(u => (
                    <div
                      key={u.uid}
                      onClick={() => createNewChat(u.uid)}
                      className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-white border border-slate-100 hover:shadow-md hover:border-primary/20 cursor-pointer transition-all"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="font-black text-slate-500">{getInitials(u.fullName)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-900 truncate">{u.fullName}</h4>
                        <p className="text-[10px] font-bold text-slate-500 truncate">{u.email} • Casa {u.houseNumber}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Eliminar Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl rounded-[2.5rem] bg-white p-8">
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
            <Trash2 className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-black text-center mb-2 text-slate-900">¿Eliminar chat?</DialogTitle>
          <DialogDescription className="text-center text-slate-500 font-bold mb-8">
            Se borrarán todos los mensajes. Esta acción es irreversible.
          </DialogDescription>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="ghost" className="rounded-2xl h-14 font-black" onClick={() => setShowDeleteDialog(false)}>CANCELAR</Button>
            <Button variant="destructive" className="rounded-2xl h-14 font-black hover-lift shadow-lg" onClick={handleDeleteChat}>ELIMINAR</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
