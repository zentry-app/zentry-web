"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MessageSquare, Search, Plus, ArrowLeft, Send, MoreVertical, Trash2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const buildFullName = (user: any): string => {
    if (user.fullName && user.fullName.trim()) {
      const fullNameParts = user.fullName.trim().split(' ');
      if (fullNameParts.length >= 3) {
        return user.fullName.trim();
      }
    }
    
    const firstName = user.fullName || user.nombre || user.name || user.firstName || '';
    const paternalLastName = user.paternalLastName || user.apellidoPaterno || '';
    const maternalLastName = user.maternalLastName || user.apellidoMaterno || '';
    
    const fullNameParts = [firstName, paternalLastName, maternalLastName]
      .filter((part: string) => Boolean(part && String(part).trim()));
    
    return fullNameParts.join(' ') || 'Usuario sin nombre';
  };

  const getInitials = (fullName: string): string => {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(' ').filter(part => part.length > 0);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  const getAvatarColor = (uid: string): string => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getOtherParticipant = (chat: ChatType) => {
    const otherId = chat.participants.find(id => id !== user?.uid);
    const otherUser = users[otherId || ''];
    
    if (!otherUser && chat.participants.length > 0) {
      return {
        uid: otherId || '',
        fullName: `Usuario ${otherId?.substring(0, 8) || 'Desconocido'}`,
        email: 'usuario@ejemplo.com',
        role: 'resident',
        calle: 'Calle',
        houseNumber: 'N/A'
      };
    }
    
    if (otherUser) {
      const builtFullName = buildFullName(otherUser);
      return {
        ...otherUser,
        fullName: builtFullName
      };
    }
    
    return otherUser;
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (user && userClaims) {
      loadUserData();
    }
  }, [user, userClaims]);

  useEffect(() => {
    if (residencialId) {
        loadChats();
        loadUsers();
      
      const unsubscribeChats = MessagesService.subscribeToChats(
        residencialId, 
        (updatedChats) => setChats(updatedChats),
        user?.uid
      );

      return () => unsubscribeChats();
    }
  }, [residencialId, user?.uid]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      
      const unsubscribeMessages = MessagesService.subscribeToMessages(
        residencialId, 
        selectedChat.id, 
        (updatedMessages) => setMessages(updatedMessages)
      );

      return () => unsubscribeMessages();
    }
  }, [selectedChat, residencialId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (showNewChatModal && residencialId) {
        loadAvailableUsers();
      }
  }, [showNewChatModal, residencialId]);

  // Seleccionar automáticamente un chat desde la URL
  useEffect(() => {
    const chatId = searchParams.get('chatId');
    if (chatId && chats.length > 0 && !selectedChat) {
      const chatToSelect = chats.find(c => c.id === chatId);
      if (chatToSelect) {
        setSelectedChat(chatToSelect);
        // Limpiar el parámetro de la URL
        router.replace('/dashboard/mensajes', { scroll: false });
        }
      }
  }, [searchParams, chats, selectedChat, router]);

  const loadUserData = async () => {
    try {
      if (userClaims?.managedResidencialId) {
        const residencialDoc = await MessagesService.getResidencialDocId(userClaims.managedResidencialId);
        if (residencialDoc) {
          setResidencialId(residencialDoc);
        } else {
          toast({
            title: "Error",
            description: "No se pudo obtener la información del residencial",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "No tienes permisos para administrar ningún residencial",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del usuario",
        variant: "destructive",
      });
    }
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const chatsData = await MessagesService.getChats(residencialId, user?.uid || undefined);
        setChats(chatsData);
    } catch (error) {
      console.error('Error cargando chats:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los chats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await MessagesService.getUsers(residencialId);
      const usersMap: Record<string, User> = {};
      usersData.forEach(user => {
        const builtFullName = buildFullName(user);
        usersMap[user.uid] = {
          ...user,
          fullName: builtFullName
        };
      });
      setUsers(usersMap);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const usersData = await MessagesService.getUsers(residencialId);
      const otherUsers = usersData.filter(u => 
        u.uid !== user?.uid && 
        u.role === 'resident'
      ).map(user => ({
        ...user,
        fullName: buildFullName(user)
      }));
      setAvailableUsers(otherUsers);
    } catch (error) {
      console.error('Error cargando usuarios disponibles:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios disponibles",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      setLoadingMessages(true);
      const messagesData = await MessagesService.getMessages(residencialId, chatId);
      setMessages(messagesData);
      
      if (user?.uid) {
        await MessagesService.markAsRead(residencialId, chatId, user.uid);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user?.uid) return;

    const messageText = newMessage;
    setNewMessage('');
    setSending(true);

    try {
      // Obtener el nombre del usuario actual
      const currentUserData = users[user.uid];
      const senderName = currentUserData ? buildFullName(currentUserData) : (user.displayName || user.email || 'Usuario');

      await MessagesService.sendMessage(residencialId, selectedChat.id, messageText, user.uid, senderName);

      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { 
              ...chat, 
              lastMessage: messageText, 
              lastMessageTime: new Date() as any, 
              lastMessageSender: user.uid 
            }
          : chat
      ));

      toast({
        title: "Mensaje enviado",
        description: "El mensaje se envió correctamente",
      });
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const createNewChat = async (otherUserId: string) => {
    if (!user?.uid) return;

    try {
      const chatId = await MessagesService.createChat(residencialId, user.uid, otherUserId);
      const newChat = chats.find(chat => chat.id === chatId);
      if (newChat) {
        setSelectedChat(newChat);
      }
      
      setShowNewChatModal(false);
      setSearchUsers('');
      
      toast({
        title: "Chat creado",
        description: "El nuevo chat se ha creado exitosamente",
      });
    } catch (error) {
      console.error('Error creando chat:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el chat",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDeleteChat = async () => {
    if (!chatToDelete || !residencialId) return;
    
    try {
      await MessagesService.deleteChat(residencialId, chatToDelete);
      
      // Si el chat eliminado era el seleccionado, limpiar selección
      if (selectedChat?.id === chatToDelete) {
        setSelectedChat(null);
        setMessages([]);
      }
      
      // Actualizar lista de chats
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatToDelete));
      
      toast({
        title: "✓ Chat eliminado",
        description: "La conversación se eliminó correctamente",
      });
      
      setShowDeleteDialog(false);
      setChatToDelete(null);
    } catch (error: any) {
      console.error('Error eliminando chat:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la conversación",
        variant: "destructive",
      });
    }
  };

  const filteredChats = chats.filter(chat => {
    const otherUser = getOtherParticipant(chat);
    if (!otherUser) return false;
    
    const hasMessages = chat.lastMessage && chat.lastMessage.trim().length > 0;
    if (!hasMessages) return false;
    
    return otherUser.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           otherUser.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredUsers = availableUsers.filter(user => 
    user.fullName.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.calle.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.houseNumber.includes(searchUsers)
  );

  // #region agent log
  useEffect(() => {
    if (loading) return;
    const mainContainer = document.querySelector('[data-main-container]') as HTMLElement;
    const chatArea = document.querySelector('[data-chat-area]') as HTMLElement;
    const inputArea = document.querySelector('[data-input-area]') as HTMLElement;
    const sidebarScroll = document.querySelector('[data-sidebar-scroll]') as HTMLElement;
    const messagesScroll = document.querySelector('[data-messages-scroll]') as HTMLElement;
    
    const logDimensions = () => {
      if (mainContainer) {
        fetch('http://127.0.0.1:7242/ingest/7d6b0ea0-66f9-4c1a-9f4d-ec225594d5e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:430',message:'Main container dimensions',data:{offsetHeight:mainContainer.offsetHeight,scrollHeight:mainContainer.scrollHeight,clientHeight:mainContainer.clientHeight,computedHeight:window.getComputedStyle(mainContainer).height,computedMaxHeight:window.getComputedStyle(mainContainer).maxHeight,computedOverflow:window.getComputedStyle(mainContainer).overflow,computedFlex:window.getComputedStyle(mainContainer).flex,parentHeight:mainContainer.parentElement?.offsetHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,E'})}).catch(()=>{});
      }
      if (chatArea) {
        fetch('http://127.0.0.1:7242/ingest/7d6b0ea0-66f9-4c1a-9f4d-ec225594d5e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:460',message:'Chat area container dimensions',data:{offsetHeight:chatArea.offsetHeight,scrollHeight:chatArea.scrollHeight,clientHeight:chatArea.clientHeight,computedHeight:window.getComputedStyle(chatArea).height,computedZIndex:window.getComputedStyle(chatArea).zIndex,computedPosition:window.getComputedStyle(chatArea).position,computedDisplay:window.getComputedStyle(chatArea).display,computedFlex:window.getComputedStyle(chatArea).flex,isVisible:chatArea.offsetParent!==null,selectedChatExists:!!selectedChat},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,D'})}).catch(()=>{});
      }
      if (inputArea) {
        fetch('http://127.0.0.1:7242/ingest/7d6b0ea0-66f9-4c1a-9f4d-ec225594d5e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:787',message:'Input area dimensions',data:{offsetHeight:inputArea.offsetHeight,scrollHeight:inputArea.scrollHeight,clientHeight:inputArea.clientHeight,computedHeight:window.getComputedStyle(inputArea).height,computedDisplay:window.getComputedStyle(inputArea).display,computedVisibility:window.getComputedStyle(inputArea).visibility,computedOpacity:window.getComputedStyle(inputArea).opacity,isVisible:inputArea.offsetParent!==null,parentHeight:inputArea.parentElement?.offsetHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
      }
      if (sidebarScroll) {
        fetch('http://127.0.0.1:7242/ingest/7d6b0ea0-66f9-4c1a-9f4d-ec225594d5e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:635',message:'Sidebar ScrollArea dimensions',data:{offsetHeight:sidebarScroll.offsetHeight,scrollHeight:sidebarScroll.scrollHeight,clientHeight:sidebarScroll.clientHeight,computedHeight:window.getComputedStyle(sidebarScroll).height,computedMaxHeight:window.getComputedStyle(sidebarScroll).maxHeight,computedOverflow:window.getComputedStyle(sidebarScroll).overflow,computedFlex:window.getComputedStyle(sidebarScroll).flex,parentHeight:sidebarScroll.parentElement?.offsetHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
      }
      if (messagesScroll) {
        fetch('http://127.0.0.1:7242/ingest/7d6b0ea0-66f9-4c1a-9f4d-ec225594d5e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:824',message:'Messages ScrollArea dimensions',data:{offsetHeight:messagesScroll.offsetHeight,scrollHeight:messagesScroll.scrollHeight,clientHeight:messagesScroll.clientHeight,computedHeight:window.getComputedStyle(messagesScroll).height,computedMaxHeight:window.getComputedStyle(messagesScroll).maxHeight,computedOverflow:window.getComputedStyle(messagesScroll).overflow,computedFlex:window.getComputedStyle(messagesScroll).flex,parentHeight:messagesScroll.parentElement?.offsetHeight,messagesCount:messages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
      }
    };
    
    const timeout1 = setTimeout(logDimensions, 100);
    const timeout2 = setTimeout(logDimensions, 500);
    const timeout3 = setTimeout(logDimensions, 1000);
    const observer = new MutationObserver(logDimensions);
    if (mainContainer) observer.observe(mainContainer, {attributes:true,attributeFilter:['style','class'],childList:true,subtree:true});
    return () => {clearTimeout(timeout1);clearTimeout(timeout2);clearTimeout(timeout3);observer.disconnect();};
  }, [loading, selectedChat, messages.length]);
  // #endregion

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div data-main-container className="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
      {/* Sidebar */}
          <div className={cn(
        "lg:col-span-4 border-r border-border flex flex-col h-full bg-card/80 backdrop-blur-sm",
        selectedChat && "hidden lg:flex"
          )}>
        <ChatSidebar
          chats={filteredChats}
          selectedChat={selectedChat}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSelectChat={setSelectedChat}
          showNewChatModal={showNewChatModal}
          setShowNewChatModal={setShowNewChatModal}
          availableUsers={filteredUsers}
          searchUsers={searchUsers}
          setSearchUsers={setSearchUsers}
          onCreateChat={createNewChat}
          getOtherParticipant={getOtherParticipant}
          getInitials={getInitials}
          getAvatarColor={getAvatarColor}
          user={user}
          onDeleteChat={(chatId) => {
            setChatToDelete(chatId);
            setShowDeleteDialog(true);
          }}
        />
                  </div>
      
      {/* Chat Area */}
      <div data-chat-area className={cn(
        "lg:col-span-8 flex flex-col h-full w-full",
        !selectedChat && "hidden lg:flex"
      )}>
        {selectedChat ? (
          <ChatArea
            chat={selectedChat}
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sending={sending}
            loadingMessages={loadingMessages}
            onBack={() => setSelectedChat(null)}
            onSendMessage={sendMessage}
            onKeyPress={handleKeyPress}
            getOtherParticipant={getOtherParticipant}
            getInitials={getInitials}
            getAvatarColor={getAvatarColor}
            messagesEndRef={messagesEndRef}
            user={user}
          />
        ) : (
          <EmptyState />
        )}
                  </div>
                  
      {/* Diálogo de confirmación para eliminar chat */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los mensajes de esta conversación permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
                      </div>
  );
}

// Sidebar Component
interface ChatSidebarProps {
  chats: ChatType[];
  selectedChat: ChatType | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSelectChat: (chat: ChatType) => void;
  showNewChatModal: boolean;
  setShowNewChatModal: (show: boolean) => void;
  availableUsers: User[];
  searchUsers: string;
  setSearchUsers: (term: string) => void;
  onCreateChat: (userId: string) => void;
  getOtherParticipant: (chat: ChatType) => any;
  getInitials: (name: string) => string;
  getAvatarColor: (uid: string) => string;
  user: any;
  onDeleteChat: (chatId: string) => void;
}

function ChatSidebar({
  chats,
  selectedChat,
  searchTerm,
  setSearchTerm,
  onSelectChat,
  showNewChatModal,
  setShowNewChatModal,
  availableUsers,
  searchUsers,
  setSearchUsers,
  onCreateChat,
  getOtherParticipant,
  getInitials,
  getAvatarColor,
  user,
  onDeleteChat
}: ChatSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-card to-muted/30">
      {/* Header Fijo */}
      <div className="h-[70px] px-4 flex items-center gap-3 border-b border-border bg-gradient-to-r from-card to-muted/30 flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2.5 bg-primary rounded-xl shadow-lg flex-shrink-0">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
                    </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg truncate text-foreground">Mensajes</h2>
            <p className="text-xs text-muted-foreground">Tus conversaciones</p>
                  </div>
                  <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
                    <DialogTrigger asChild>
              <Button size="icon" className="flex-shrink-0 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
            <DialogContent className="max-w-2xl border-0 shadow-2xl rounded-2xl">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-primary rounded-xl">
                    <MessageSquare className="h-6 w-6 text-primary-foreground" />
                      </div>
                  <DialogTitle className="text-2xl font-bold text-foreground">Nuevo Chat</DialogTitle>
                </div>
                <p className="text-sm text-muted-foreground">Selecciona un residente para iniciar una conversación</p>
                    </DialogHeader>
              <div className="space-y-4">
                      <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                    placeholder="🔍 Buscar usuarios..."
                          value={searchUsers}
                          onChange={(e) => setSearchUsers(e.target.value)}
                    className="pl-10 bg-muted border-input focus:border-primary focus:ring-primary/20 rounded-xl"
                        />
                      </div>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                  {availableUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No se encontraron usuarios</p>
                                </div>
                              ) : (
                    availableUsers.map((availableUser) => (
                            <div
                              key={availableUser.uid}
                        onClick={() => onCreateChat(availableUser.uid)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all duration-200 hover:shadow-md"
                            >
                        <Avatar className="h-12 w-12 shadow-md border-2 border-background">
                          <AvatarFallback className={cn("text-white font-semibold", getAvatarColor(availableUser.uid))}>
                                  {getInitials(availableUser.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 truncate">{availableUser.fullName}</h4>
                          <p className="text-xs text-slate-500 truncate">{availableUser.email}</p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            📍 {availableUser.calle} {availableUser.houseNumber}
                                  </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                  </div>
                </DialogContent>
              </Dialog>
                </div>
              </div>
      
      {/* Buscador */}
      <div className="px-4 py-3 bg-gradient-to-r from-card to-muted/30 border-b border-border flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="🔍 Buscar conversaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-input focus:border-primary focus:ring-primary/20 rounded-xl shadow-sm transition-all duration-200"
              />
            </div>
                      </div>

      {/* Lista con scroll */}
            <ScrollArea data-sidebar-scroll className="flex-1 min-h-0">
        <div className="pr-4">
        {chats.length === 0 ? (
                  <div className="text-center py-12 px-4">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-20"></div>
              <div className="relative p-4 bg-primary/10 rounded-full">
                <MessageSquare className="h-12 w-12 text-primary" />
                      </div>
                    </div>
            <h3 className="text-base font-bold text-foreground mb-2">No hay conversaciones</h3>
            <p className="text-sm text-muted-foreground mb-4">Inicia una conversación con otros residentes</p>
                    <Button 
                      onClick={() => setShowNewChatModal(true)}
              className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Chat
                    </Button>
                  </div>
                ) : (
          chats.map((chat) => {
                    const otherUser = getOtherParticipant(chat);
                    if (!otherUser) return null;

                    const isSelected = selectedChat?.id === chat.id;
                    const unreadCount = chat.unreadCount[user?.uid || ''] || 0;

                    return (
                      <div
                        key={chat.id}
                        className={cn(
                  "mx-2 mb-1 px-3 py-3 rounded-xl border-2 transition-all duration-200 group",
                          isSelected 
                    ? "bg-primary/5 border-primary/30 shadow-lg" 
                    : "bg-card/60 border-transparent hover:bg-card hover:border-border hover:shadow-md"
                        )}
              >
                <div className="flex gap-3 items-center">
                  <div 
                    onClick={() => onSelectChat(chat)}
                    className="flex gap-3 items-center flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12 shadow-md border-2 border-background">
                        <AvatarFallback className={cn("text-white font-semibold", getAvatarColor(otherUser.uid))}>
                                {getInitials(otherUser.fullName)}
                              </AvatarFallback>
                            </Avatar>
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                            </div>
                          
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm text-foreground truncate flex-1 mr-2">
                              {otherUser.fullName}
                        </h4>
                            {chat.lastMessageTime && (() => {
                              try {
                                let date: Date;
                                if (typeof chat.lastMessageTime.toDate === 'function') {
                                  date = chat.lastMessageTime.toDate();
                                } else if (chat.lastMessageTime.seconds) {
                                  date = new Date(chat.lastMessageTime.seconds * 1000);
                                } else if (chat.lastMessageTime instanceof Date) {
                                  date = chat.lastMessageTime;
                                } else {
                                  return null;
                                }
                                
                                if (isNaN(date.getTime())) {
                                  return null;
                                }
                                
                                return (
                                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
                                    {format(date, 'h:mm a', { locale: es })}
                              </span>
                                );
                              } catch (error) {
                                return null;
                              }
                            })()}
                          </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 font-medium">
                        {chat.lastMessageSender === user?.uid && <span className="text-primary font-semibold">Tú: </span>}
                              {chat.lastMessage || 'Sin mensajes'}
                            </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                            {unreadCount > 0 && (
                      <Badge className="rounded-full h-6 min-w-[24px] flex items-center justify-center px-2 bg-primary text-primary-foreground font-bold shadow-lg">
                                {unreadCount}
                              </Badge>
                            )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar conversación
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                        </div>
                      </div>
                    );
                  })
              )}
              </div>
            </ScrollArea>
          </div>
  );
}

// Chat Area Component
interface ChatAreaProps {
  chat: ChatType;
  messages: MessageType[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  sending: boolean;
  loadingMessages: boolean;
  onBack: () => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  getOtherParticipant: (chat: ChatType) => any;
  getInitials: (name: string) => string;
  getAvatarColor: (uid: string) => string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  user: any;
}

function ChatArea({
  chat,
  messages,
  newMessage,
  setNewMessage,
  sending,
  loadingMessages,
  onBack,
  onSendMessage,
  onKeyPress,
  getOtherParticipant,
  getInitials,
  getAvatarColor,
  messagesEndRef,
  user
}: ChatAreaProps) {
  const otherUser = getOtherParticipant(chat);
  
  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-background via-muted/20 to-primary-50/10">
      {/* Header Fijo */}
      <div className="h-[70px] px-4 flex items-center gap-3 border-b border-border bg-gradient-to-r from-card to-muted/30 shadow-sm flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
          onClick={onBack}
          className="lg:hidden flex-shrink-0"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  
        <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12 shadow-md border-2 border-background">
            <AvatarFallback className={cn("text-white font-semibold", getAvatarColor(otherUser?.uid || ''))}>
              {getInitials(otherUser?.fullName || 'U')}
                    </AvatarFallback>
                  </Avatar>
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
        </div>
                  
                  <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground truncate">{otherUser?.fullName || 'Usuario'}</h3>
          <p className="text-xs text-muted-foreground truncate font-medium">
            📍 {otherUser?.calle} {otherUser?.houseNumber}
          </p>
                    </div>
                    
        <Button variant="ghost" size="icon" className="flex-shrink-0">
          <Search className="h-5 w-5" />
                        </Button>
                </div>

      {/* Área de mensajes con scroll */}
      <ScrollArea data-messages-scroll className="flex-1 min-h-0">
        <div className="p-4 bg-gradient-to-b from-transparent to-muted/20">
                  {loadingMessages ? (
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-card rounded-xl shadow-lg mb-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <p className="text-sm text-foreground font-medium">Cargando mensajes...</p>
                    </div>
                  ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-20"></div>
              <div className="relative p-4 bg-primary/10 rounded-full">
                <MessageSquare className="h-12 w-12 text-primary" />
                    </div>
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">No hay mensajes</h3>
            <p className="text-sm text-muted-foreground">💬 Inicia la conversación enviando un mensaje</p>
                    </div>
                  ) : (
          <div className="space-y-4">
            {messages.map((message) => {
                        const isMe = message.senderId === user?.uid;
                        return (
                          <div
                            key={message.id}
                            className={cn(
                    "flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                              isMe ? "justify-end" : "justify-start"
                            )}
                          >
                              {!isMe && (
                    <Avatar className="h-8 w-8 flex-shrink-0 shadow-md border-2 border-white">
                      <AvatarFallback className={cn("text-xs text-white font-semibold", getAvatarColor(message.senderId))}>
                        {getInitials(otherUser?.fullName || 'U')}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              
                              <div className={cn(
                    "max-w-[65%] rounded-2xl px-4 py-3 break-words shadow-md transition-all duration-200 hover:shadow-lg",
                                isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-card border border-border rounded-tl-none"
                              )}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    <span className={cn(
                      "text-xs mt-2 block font-medium",
                      isMe ? "opacity-80 text-right" : "text-muted-foreground text-left"
                    )}>
                                    {format(
                                      message.timestamp.toDate 
                                        ? message.timestamp.toDate() 
                                          : new Date(message.timestamp.seconds * 1000), 
                                      'h:mm a', 
                                      { locale: es }
                                    )}
                                  </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                        </div>
                  )}
                </div>
              </ScrollArea>

      {/* Input Fijo */}
      <div data-input-area className="h-[80px] w-full px-4 py-3 border-t border-border bg-gradient-to-r from-card to-muted/30 shadow-lg flex-shrink-0 flex items-center">
        <div className="flex gap-2 items-end w-full">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="💬 Escribe un mensaje..."
            className="flex-1 bg-background border-input focus:border-primary focus:ring-primary/20 rounded-xl shadow-sm transition-all duration-200 py-3"
            disabled={sending}
                  />
                      <Button 
            onClick={onSendMessage}
            disabled={!newMessage.trim() || sending}
                        size="icon"
            className="flex-shrink-0 h-11 w-11 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                      >
                        {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                        ) : (
              <Send className="h-5 w-5" />
                        )}
                      </Button>
                </div>
              </div>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary-50/10 w-full">
      <div className="text-center px-6">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-primary rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative p-6 bg-primary/10 rounded-3xl">
            <MessageSquare className="h-20 w-20 text-primary" />
                  </div>
              </div>
        <h3 className="text-2xl font-bold mb-3 text-foreground">
          Selecciona una conversación
        </h3>
        <p className="text-muted-foreground text-base max-w-md">
          💬 Elige un chat de la lista para comenzar a enviar mensajes
        </p>
            </div>
          </div>
  );
}
