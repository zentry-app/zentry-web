"use client";

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Search, Plus, ArrowLeft, Send } from 'lucide-react';
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

export default function MensajesPageV2() {
  const { user, userClaims } = useAuth();
  const { toast } = useToast();
  
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
      await MessagesService.sendMessage(residencialId, selectedChat.id, messageText, user.uid);
      
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden bg-background">
      {/* Sidebar */}
      <div className={cn(
        "lg:col-span-4 border-r border-border flex flex-col h-full",
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
        />
      </div>
      
      {/* Chat Area */}
      <div className={cn(
        "lg:col-span-8 flex flex-col h-full",
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
  user
}: ChatSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Header Fijo */}
      <div className="h-[70px] px-4 flex items-center gap-3 border-b bg-background flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-primary rounded-lg flex-shrink-0">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">Mensajes</h2>
          </div>
          <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="flex-shrink-0">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nuevo Chat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuarios..."
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {availableUsers.map((availableUser) => (
                    <div
                      key={availableUser.uid}
                      onClick={() => onCreateChat(availableUser.uid)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={cn("text-white font-semibold", getAvatarColor(availableUser.uid))}>
                          {getInitials(availableUser.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{availableUser.fullName}</h4>
                        <p className="text-xs text-muted-foreground truncate">{availableUser.email}</p>
                        <p className="text-xs text-muted-foreground">
                          📍 {availableUser.calle} {availableUser.houseNumber}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Buscador */}
      <div className="px-4 py-3 bg-background border-b flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Lista con scroll */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="pr-4">
        {chats.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground px-4">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1">No hay conversaciones</p>
            <p className="text-xs">Inicia una conversación con otros residentes</p>
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
                onClick={() => onSelectChat(chat)}
                className={cn(
                  "px-4 py-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 transition-colors",
                  isSelected && "bg-muted"
                )}
              >
                <div className="flex gap-3 items-center">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={cn("text-white font-semibold", getAvatarColor(otherUser.uid))}>
                        {getInitials(otherUser.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-sm truncate flex-1 mr-2">
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
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {format(date, 'h:mm a', { locale: es })}
                            </span>
                          );
                        } catch (error) {
                          return null;
                        }
                      })()}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {chat.lastMessageSender === user?.uid && <span className="font-semibold">Tú: </span>}
                      {chat.lastMessage || 'Sin mensajes'}
                    </p>
                  </div>
                  
                  {unreadCount > 0 && (
                    <Badge variant="default" className="rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5 flex-shrink-0">
                      {unreadCount}
                    </Badge>
                  )}
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
    <div className="flex flex-col h-full bg-background w-full">
      {/* Header Fijo */}
      <div className="h-[70px] px-4 flex items-center gap-3 border-b flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="lg:hidden flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="relative flex-shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarFallback className={cn("text-white font-semibold", getAvatarColor(otherUser?.uid || ''))}>
              {getInitials(otherUser?.fullName || 'U')}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{otherUser?.fullName || 'Usuario'}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {otherUser?.calle} {otherUser?.houseNumber}
          </p>
        </div>
        
        <Button variant="ghost" size="icon" className="flex-shrink-0">
          <Search className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Área de mensajes con scroll */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 bg-muted/20">
        {loadingMessages ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Cargando mensajes...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium mb-1">No hay mensajes</p>
            <p className="text-xs">Inicia la conversación enviando un mensaje</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isMe = message.senderId === user?.uid;
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    isMe ? "justify-end" : "justify-start"
                  )}
                >
                  {!isMe && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={cn("text-xs", getAvatarColor(message.senderId))}>
                        {getInitials(otherUser?.fullName || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={cn(
                    "max-w-[65%] rounded-2xl px-4 py-2 break-words",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted rounded-tl-none"
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <span className={cn(
                      "text-xs opacity-70 mt-1 block",
                      isMe ? "text-right" : "text-left"
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
      <div className="h-[80px] px-4 py-3 border-t bg-background flex-shrink-0 flex items-center">
        <div className="flex gap-2 items-end">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            disabled={sending}
          />
          <Button
            onClick={onSendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background w-full">
      <div className="text-center">
        <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Selecciona una conversación</h3>
        <p className="text-muted-foreground">
          Elige un chat de la lista para comenzar a enviar mensajes
        </p>
      </div>
    </div>
  );
}
