"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Image as ImageIcon,
  Paperclip,
  Smile,
  ArrowLeft,
  Check,
  CheckCheck,
  MessageSquare,
  X,
  Trash2,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessagesService, Message, Chat, User } from '@/lib/services/messages-service';
import { useToast } from '@/components/ui/use-toast';

// Las interfaces ya están importadas del servicio

export default function MensajesPage() {
  const { user, userClaims } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [residencialId, setResidencialId] = useState<string>('');
  const [residenciales, setResidenciales] = useState<Array<{id: string, nombre: string, residencialID: string}>>([]);
  const [selectedResidencial, setSelectedResidencial] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [messageStatus, setMessageStatus] = useState<Record<string, 'sending' | 'sent' | 'delivered' | 'read'>>({});
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [showSearchMessages, setShowSearchMessages] = useState(false);
  const [searchMessages, setSearchMessages] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [archivedChats, setArchivedChats] = useState<Set<string>>(new Set());
  const [showArchivedChats, setShowArchivedChats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Función auxiliar para construir nombres completos de manera consistente
   * 
   * Estructura de la base de datos:
   * - fullName: Puede contener nombre completo o solo nombre
   * - paternalLastName: Apellido paterno
   * - maternalLastName: Apellido materno
   * 
   * Lógica: Si fullName ya contiene apellidos, usarlo; si no, construir con campos separados
   */
  const buildFullName = (user: any): string => {
    // Si fullName ya contiene el nombre completo (con apellidos), usarlo directamente
    if (user.fullName && user.fullName.trim()) {
      const fullNameParts = user.fullName.trim().split(' ');
      // Si tiene más de 2 palabras, probablemente ya es nombre completo
      if (fullNameParts.length >= 3) {
        return user.fullName.trim();
      }
    }
    
    // Si no, construir con campos separados
    const firstName = user.fullName || user.nombre || user.name || user.firstName || '';
    const paternalLastName = user.paternalLastName || user.apellidoPaterno || '';
    const maternalLastName = user.maternalLastName || user.apellidoMaterno || '';
    
    // Construir nombre completo solo si no hay duplicaciones
    const fullNameParts = [
      firstName,
      paternalLastName,
      maternalLastName
    ].filter((part: string) => Boolean(part && String(part).trim()));
    
    const computedFullName = fullNameParts.join(' ');
    
    console.log('Construyendo nombre completo:', {
      uid: user.uid,
      originalFullName: user.fullName,
      firstName,
      paternalLastName,
      maternalLastName,
      computedFullName
    });
    
    return computedFullName || 'Usuario sin nombre';
  };

  /**
   * Función para generar iniciales concisas (máximo 2 letras)
   * Prioriza: Primera letra del nombre + Primera letra del primer apellido
   */
  const getInitials = (fullName: string): string => {
    if (!fullName) return 'U';
    
    const parts = fullName.trim().split(' ').filter(part => part.length > 0);
    if (parts.length === 0) return 'U';
    
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    // Máximo 2 letras: Primera del nombre + Primera del primer apellido
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  /**
   * Función para generar colores únicos para los avatares
   * Basado en el UID del usuario para consistencia
   */
  const getAvatarColor = (uid: string): string => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500'
    ];
    
    // Usar el UID para generar un índice consistente
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    
    return colors[index];
  };

  useEffect(() => {
    if (user && userClaims) {
      loadUserData();
    }
  }, [user, userClaims]);

  useEffect(() => {
    if (residencialId) {
      console.log('🔄 useEffect - ResidencialId cambiado:', residencialId, 'Admin Global:', userClaims?.isGlobalAdmin);
      
      // Para admin global, usar la función específica que no crea chats de ejemplo
      if (userClaims?.isGlobalAdmin) {
        console.log('🔄 useEffect - Ejecutando funciones para Admin Global');
        loadChatsForResidencial(residencialId);
        loadUsersForResidencial(residencialId);
      } else {
        // Para admin de residencial, usar las funciones originales
        console.log('🔄 useEffect - Ejecutando funciones para Admin de Residencial');
        loadChats();
        loadUsers();
      }
      
      // Suscribirse a cambios en tiempo real filtrados por el admin actual
      const unsubscribeChats = MessagesService.subscribeToChats(
        residencialId, 
        (updatedChats) => {
          setChats(updatedChats);
        },
        user?.uid
      );

      return () => unsubscribeChats();
    }
  }, [residencialId, user?.uid, userClaims?.isGlobalAdmin]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      
      // Suscribirse a cambios en tiempo real de los mensajes
      const unsubscribeMessages = MessagesService.subscribeToMessages(
        residencialId, 
        selectedChat.id, 
        (updatedMessages) => {
          setMessages(updatedMessages);
        }
      );

      return () => unsubscribeMessages();
    }
  }, [selectedChat, residencialId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (newMessage.trim()) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [newMessage]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (showNewChatModal && residencialId) {
      // Para admin global, usar la función específica
      if (userClaims?.isGlobalAdmin) {
        loadUsersForResidencial(residencialId);
      } else {
        // Para admin de residencial, usar la función original
        loadAvailableUsers();
      }
    }
  }, [showNewChatModal, residencialId, userClaims?.isGlobalAdmin]);

  useEffect(() => {
    if (showSearchMessages) {
      searchInMessages(searchMessages);
    }
  }, [searchMessages, messages, showSearchMessages]);

  // Cargar chats archivados desde localStorage al iniciar
  useEffect(() => {
    if (user?.uid && residencialId) {
      const savedArchived = localStorage.getItem(`archivedChats_${user.uid}_${residencialId}`);
      if (savedArchived) {
        try {
          const archivedArray = JSON.parse(savedArchived);
          setArchivedChats(new Set(archivedArray));
        } catch (error) {
          console.error('Error cargando chats archivados:', error);
        }
      }
    }
  }, [user?.uid, residencialId]);

  // Guardar chats archivados en localStorage cuando cambien
  useEffect(() => {
    if (user?.uid && residencialId && archivedChats.size > 0) {
      localStorage.setItem(`archivedChats_${user.uid}_${residencialId}`, JSON.stringify(Array.from(archivedChats)));
    }
  }, [archivedChats, user?.uid, residencialId]);

  const loadChatsForResidencial = async (residencialIdToLoad: string) => {
    try {
      setLoading(true);
      console.log('🔍 Admin Global - Cargando chats para residencial:', residencialIdToLoad);
      
      let chatsData;
      
      if (userClaims?.isGlobalAdmin) {
        // Para admin global, obtener TODOS los chats del residencial
        console.log('🔍 Admin Global - Obteniendo TODOS los chats del residencial');
        chatsData = await MessagesService.getAllChats(residencialIdToLoad);
      } else {
        // Para admin de residencial, obtener solo sus chats
        chatsData = await MessagesService.getChats(residencialIdToLoad, user?.uid || undefined);
      }
      
      console.log('🔍 Admin Global - Chats obtenidos:', chatsData.length, 'chats');
      
      if (chatsData.length > 0) {
        console.log('🔍 Primeros chats obtenidos:', chatsData.slice(0, 2).map(chat => ({
          id: chat.id,
          participants: chat.participants,
          lastMessage: chat.lastMessage
        })));
      }
      
      // Para admin global, NUNCA crear chats de ejemplo
      if (userClaims?.isGlobalAdmin) {
        console.log('🔍 Admin Global - Estableciendo chats reales:', chatsData.length);
        setChats(chatsData);
      } else {
        // Solo para admin de residencial: si no hay chats, crear algunos de ejemplo
        if (chatsData.length === 0) {
          console.log('No hay chats existentes, creando chats de ejemplo...');
          await createSampleChats();
          // Recargar chats después de crear los de ejemplo
          const updatedChats = await MessagesService.getChats(residencialIdToLoad, user?.uid || undefined);
          setChats(updatedChats);
        } else {
          setChats(chatsData);
        }
      }
    } catch (error) {
      console.error('Error cargando chats para residencial:', residencialIdToLoad, error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los chats del residencial",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsersForResidencial = async (residencialIdToLoad: string) => {
    try {
      let usersData: User[] = [];
      
      if (userClaims?.isGlobalAdmin) {
        // Para admin global, obtener usuarios de todos los residenciales
        usersData = await MessagesService.getAllUsers();
      } else {
        // Para admin de residencial, obtener usuarios del residencial específico
        usersData = await MessagesService.getUsers(residencialIdToLoad);
      }
      
      // Filtrar para no incluir al usuario actual y solo mostrar residentes
      const otherUsers = usersData.filter(u => 
        u.uid !== user?.uid && 
        u.role === 'resident'
      );
      
      // Convertir a objeto para búsqueda rápida
      const usersObject: Record<string, User> = {};
      otherUsers.forEach(user => {
        usersObject[user.uid] = user;
      });
      
      setUsers(usersObject);
      setAvailableUsers(otherUsers);
    } catch (error) {
      console.error('Error cargando usuarios para residencial:', residencialIdToLoad, error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios del residencial",
        variant: "destructive",
      });
    }
  };

  const cleanupSampleChatsForGlobalAdmin = async () => {
    if (!userClaims?.isGlobalAdmin || !user?.uid) return;
    
    try {
      console.log('🧹 Limpiando chats de ejemplo para admin global...');
      
      // IDs de los usuarios de ejemplo hardcodeados
      const sampleUserIds = [
        '00v259VhFzTR5Ry0Fk2SZ4kRmR32', // Guillermo Zatarain
        '0O7m6fs7XpVUxIMClAVqsQJp4TG2', // Edgar Vega
        '0bDch62M4tRyT0K8MWIvQJVrkqg2'  // Daniela Bernal
      ];
      
      // Buscar y eliminar chats de ejemplo que involucren al admin global
      for (const sampleUserId of sampleUserIds) {
        const chatId1 = `${user.uid}_${sampleUserId}`;
        const chatId2 = `${sampleUserId}_${user.uid}`;
        
        console.log('🧹 Eliminando chat:', chatId1);
        try {
          await MessagesService.deleteChat(residencialId, chatId1);
        } catch (error) {
          console.log('Chat no existe:', chatId1);
        }
        
        console.log('🧹 Eliminando chat:', chatId2);
        try {
          await MessagesService.deleteChat(residencialId, chatId2);
        } catch (error) {
          console.log('Chat no existe:', chatId2);
        }
      }
      
      console.log('🧹 Limpieza completada');
      
      toast({
        title: "Chats de ejemplo eliminados",
        description: "Se han eliminado los chats de ejemplo. Recargando datos reales...",
      });
      
    } catch (error) {
      console.error('Error limpiando chats de ejemplo:', error);
    }
  };

  const changeResidencial = async (newResidencialId: string) => {
    try {
      console.log('🔄 Admin Global - Cambiando a residencial:', newResidencialId);
      
      setSelectedChat(null); // Limpiar chat seleccionado
      setMessages([]); // Limpiar mensajes
      setChats([]); // Limpiar chats
      
      // Actualizar el residencialId
      setResidencialId(newResidencialId);
      setSelectedResidencial(newResidencialId);
      
      console.log('🔄 Admin Global - Estados actualizados, cargando datos...');
      
      // Recargar datos del nuevo residencial usando el ID directamente
      await loadChatsForResidencial(newResidencialId);
      await loadUsersForResidencial(newResidencialId);
      
      console.log('🔄 Admin Global - Datos cargados exitosamente');
      
      toast({
        title: "Residencial cambiado",
        description: "Se han cargado los datos del nuevo residencial",
      });
    } catch (error) {
      console.error('Error cambiando residencial:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar al residencial seleccionado",
        variant: "destructive",
      });
    }
  };

  const loadUserData = async () => {
    try {
      console.log('🚀 loadUserData - Iniciando carga para usuario:', userClaims?.isGlobalAdmin ? 'Admin Global' : 'Admin Residencial');
      
      if (userClaims?.isGlobalAdmin) {
        console.log('🚀 Admin Global - Cargando residenciales disponibles...');
        // Para admin global, cargar todos los residenciales y usar el primero por defecto
        const residencialesData = await MessagesService.getAllResidenciales();
        console.log('🚀 Admin Global - Residenciales encontrados:', residencialesData.length);
        setResidenciales(residencialesData);
        
        if (residencialesData.length > 0) {
          const firstResidencial = residencialesData[0];
          console.log('🚀 Admin Global - Usando primer residencial:', firstResidencial.nombre, firstResidencial.id);
          setResidencialId(firstResidencial.id);
          setSelectedResidencial(firstResidencial.id);
        } else {
          toast({
            title: "Error",
            description: "No se encontraron residenciales en el sistema",
            variant: "destructive",
          });
        }
      } else if (userClaims?.managedResidencialId) {
        // Para admin de residencial, usar el residencial asignado
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
      
      // PROTECCIÓN: Nunca ejecutar esta función para admin global
      if (userClaims?.isGlobalAdmin) {
        console.warn('⚠️ Admin Global - Se intentó ejecutar loadChats(), redirigiendo a loadChatsForResidencial');
        await loadChatsForResidencial(residencialId);
        return;
      }
      
      const chatsData = await MessagesService.getChats(residencialId, user?.uid || undefined);
      
      // Si no hay chats, crear algunos de ejemplo solo para admin de residencial
      if (chatsData.length === 0) {
        console.log('No hay chats existentes, creando chats de ejemplo...');
        await createSampleChats();
        // Recargar chats después de crear los de ejemplo
        const updatedChats = await MessagesService.getChats(residencialId, user?.uid || undefined);
        setChats(updatedChats);
      } else {
        setChats(chatsData);
      }
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

  const createSampleChats = async () => {
    try {
      // Crear chat con Guillermo Zatarain
      const chatId1 = await MessagesService.createChat(
        residencialId,
        user?.uid || '',
        '00v259VhFzTR5Ry0Fk2SZ4kRmR32'
      );
      
      // Agregar mensaje de ejemplo
      await MessagesService.sendMessage(
        residencialId,
        chatId1,
        'Hola administrador, tengo una consulta sobre el mantenimiento de la calle La Bocana.',
        '00v259VhFzTR5Ry0Fk2SZ4kRmR32'
      );

      // Crear chat con Edgar Vega
      const chatId2 = await MessagesService.createChat(
        residencialId,
        user?.uid || '',
        '0O7m6fs7XpVUxIMClAVqsQJp4TG2'
      );
      
      // Agregar mensaje de ejemplo
      await MessagesService.sendMessage(
        residencialId,
        chatId2,
        'Buenos días, necesito información sobre el próximo evento del residencial.',
        '0O7m6fs7XpVUxIMClAVqsQJp4TG2'
      );

      // Crear chat con Daniela Bernal
      const chatId3 = await MessagesService.createChat(
        residencialId,
        user?.uid || '',
        '0bDch62M4tRyT0K8MWIvQJVrkqg2'
      );
      
      // Agregar mensaje de ejemplo
      await MessagesService.sendMessage(
        residencialId,
        chatId3,
        'Hola, ¿podrías ayudarme con la reserva del área común?',
        '0bDch62M4tRyT0K8MWIvQJVrkqg2'
      );

      toast({
        title: "Chats de ejemplo creados",
        description: "Se han creado 3 chats de ejemplo para que puedas probar la funcionalidad",
      });
    } catch (error) {
      console.error('Error creando chats de ejemplo:', error);
    }
  };

  const loadUsers = async () => {
    try {
      // PROTECCIÓN: Nunca ejecutar esta función para admin global
      if (userClaims?.isGlobalAdmin) {
        console.warn('⚠️ Admin Global - Se intentó ejecutar loadUsers(), redirigiendo a loadUsersForResidencial');
        await loadUsersForResidencial(residencialId);
        return;
      }
      
      const usersData = await MessagesService.getUsers(residencialId);
      console.log('Usuarios cargados del servicio:', usersData);
      
      const usersMap: Record<string, User> = {};
      usersData.forEach(user => {
        const builtFullName = buildFullName(user);
        console.log(`Usuario ${user.uid}:`, {
          originalFullName: user.fullName,
          builtFullName,
          nombre: (user as any).nombre,
          apellidoPaterno: (user as any).apellidoPaterno,
          apellidoMaterno: (user as any).apellidoMaterno,
          paternalLastName: (user as any).paternalLastName,
          maternalLastName: (user as any).maternalLastName,
        });
        
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
      let usersData: User[] = [];
      
      if (userClaims?.isGlobalAdmin) {
        // Para admin global, obtener usuarios de todos los residenciales
        usersData = await MessagesService.getAllUsers();
      } else {
        // Para admin de residencial, obtener usuarios del residencial específico
        usersData = await MessagesService.getUsers(residencialId);
      }
      
      // Filtrar para no incluir al usuario actual y solo mostrar residentes
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

  // Función para archivar un chat (solo lo oculta de la vista del usuario actual)
  const archiveChat = (chatId: string) => {
    setArchivedChats(prev => {
      const newArchived = new Set(prev);
      newArchived.add(chatId);
      return newArchived;
    });
    
    // Si el chat seleccionado es el que se está archivando, deseleccionarlo
    if (selectedChat?.id === chatId) {
      setSelectedChat(null);
    }
    
    toast({
      title: "Chat archivado",
      description: "La conversación se ha ocultado de tu lista. El otro usuario seguirá viéndola.",
    });
  };

  // Función para desarchivar un chat
  const unarchiveChat = (chatId: string) => {
    setArchivedChats(prev => {
      const newArchived = new Set(prev);
      newArchived.delete(chatId);
      return newArchived;
    });
    
    toast({
      title: "Chat restaurado",
      description: "La conversación se ha vuelto a mostrar en tu lista.",
    });
  };

  // Función para verificar si un chat debe ser ocultado automáticamente
  const shouldHideChat = (chat: Chat): boolean => {
    // Ocultar si no tiene mensajes o si está archivado
    const hasMessages = chat.lastMessage && chat.lastMessage.trim().length > 0;
    const hasValidTimestamp = chat.lastMessageTime && chat.lastMessageTime.seconds > 0;
    const isArchived = archivedChats.has(chat.id);
    
    return isArchived || (!hasMessages && !hasValidTimestamp);
  };

  const loadMessages = async (chatId: string) => {
    try {
      setLoadingMessages(true);
      const messagesData = await MessagesService.getMessages(residencialId, chatId);
      setMessages(messagesData);
      
      // Marcar como leído
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

    const messageText = newMessage; // Mover fuera del try para que esté disponible en catch
    setNewMessage('');
    setSending(true);

    try {
      // Enviar mensaje usando el servicio
      await MessagesService.sendMessage(residencialId, selectedChat.id, messageText, user.uid);

      // NO actualizar la UI localmente - dejar que la suscripción en tiempo real lo haga
      // Solo actualizar el chat en la lista
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
      // Restaurar el mensaje si falló
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherParticipant = (chat: Chat) => {
    let otherId: string | undefined;
    
    if (userClaims?.isGlobalAdmin) {
      // Para admin global, mostrar el primer usuario residente del chat
      for (const participantId of chat.participants) {
        const participantUser = users[participantId];
        if (participantUser && participantUser.role === 'resident') {
          otherId = participantId;
          break;
        }
      }
      
      // Si no encontramos un residente, usar el primero disponible
      if (!otherId) {
        otherId = chat.participants[0];
      }
    } else {
      // Para admin de residencial, usar la lógica original
      otherId = chat.participants.find(id => id !== user?.uid);
    }
    
    const otherUser = users[otherId || ''];
    
    console.log('getOtherParticipant:', {
      chatId: chat.id,
      participants: chat.participants,
      currentUserId: user?.uid,
      isGlobalAdmin: userClaims?.isGlobalAdmin,
      otherId,
      otherUser,
      allUsers: Object.keys(users)
    });
    
    // Si no encontramos el usuario, crear un objeto temporal con la información del chat
    if (!otherUser && chat.participants.length > 0) {
      console.log('Usuario no encontrado, creando temporal');
      return {
        uid: otherId || '',
        fullName: `Usuario ${otherId?.substring(0, 8) || 'Desconocido'}`,
        email: 'usuario@ejemplo.com',
        role: 'resident',
        calle: 'Calle',
        houseNumber: 'N/A'
      };
    }
    
    // Si tenemos el usuario, asegurarnos de que el nombre completo esté construido correctamente
    if (otherUser) {
      const builtFullName = buildFullName(otherUser);
      console.log('Usuario encontrado, nombre construido:', {
        uid: otherUser.uid,
        originalFullName: otherUser.fullName,
        builtFullName
      });
      
      return {
        ...otherUser,
        fullName: builtFullName
      };
    }
    
    return otherUser;
  };

  const filteredChats = chats.filter(chat => {
    const otherUser = getOtherParticipant(chat);
    if (!otherUser) return false;
    
    // Ocultar chats que no tienen mensajes o están archivados
    if (shouldHideChat(chat)) return false;
    
    // Aplicar filtro de búsqueda
    return otherUser.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           otherUser.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Chats archivados para mostrar en la vista de archivo
  const archivedChatsList = chats.filter(chat => {
    const otherUser = getOtherParticipant(chat);
    if (!otherUser) return false;
    
    // Solo mostrar chats archivados
    return archivedChats.has(chat.id);
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const createNewChat = async (otherUserId: string) => {
    if (!user?.uid) return;

    try {
      const chatId = await MessagesService.createChat(residencialId, user.uid, otherUserId);
      
      // Encontrar el chat recién creado y seleccionarlo
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

  const filteredUsers = availableUsers.filter(user => 
    user.fullName.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.calle.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.houseNumber.includes(searchUsers)
  );

  const searchInMessages = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = messages.filter(message =>
      message.text.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-1">
          {part}
        </mark>
      ) : part
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <section className="min-h-[70vh] flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        <div className="flex-1 flex max-w-full">
          {/* Lista de chats */}
          <div className={cn(
            "w-full lg:w-80 lg:min-w-80 lg:max-w-80 xl:w-96 xl:min-w-96 xl:max-w-96 border-r border-slate-200/60 bg-gradient-to-br from-white to-blue-50/30",
            "flex flex-col h-full flex-shrink-0",
            selectedChat && "hidden lg:block"
          )}>
            <div className="p-3 lg:p-4 border-b border-slate-200/60 bg-gradient-to-r from-white to-blue-50/50 flex-shrink-0">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
                    <MessageSquare className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent truncate">
                      Mensajes
                    </h2>
                    <p className="text-xs lg:text-sm text-slate-500 hidden lg:block">
                      {userClaims?.isGlobalAdmin 
                        ? `Comunícate con residentes de ${residenciales.find(r => r.id === selectedResidencial)?.nombre || 'cualquier residencial'}`
                        : "Comunícate con tu comunidad"
                      }
                    </p>
                  </div>
                  
                  {/* Selector de residencial para admin global */}
                  {userClaims?.isGlobalAdmin && residenciales.length > 0 && (
                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-medium text-slate-600">
                        Residencial:
                      </label>
                      <select
                        value={selectedResidencial}
                        onChange={(e) => changeResidencial(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      >
                        {residenciales.map((residencial) => (
                          <option key={residencial.id} value={residencial.id}>
                            {residencial.nombre} ({residencial.residencialID})
                          </option>
                        ))}
                      </select>
                      
                      {/* Indicador del residencial actual */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <Building className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">
                          Residencial actual: {residenciales.find(r => r.id === selectedResidencial)?.nombre || 'Seleccionando...'}
                        </span>
                      </div>
                      
                      {/* Botón para limpiar chats de ejemplo (temporal) */}
                      <Button
                        onClick={cleanupSampleChatsForGlobalAdmin}
                        size="sm"
                        variant="outline"
                        className="text-xs bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                      >
                        🧹 Limpiar chats de ejemplo
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3">
                  <div className={cn(
                    "flex items-center gap-2 px-2 lg:px-3 py-1 lg:py-2 rounded-full border transition-all duration-200 flex-shrink-0",
                    isOnline 
                      ? "bg-green-50 border-green-200 text-green-700" 
                      : "bg-red-50 border-red-200 text-red-700"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
                    )}></div>
                    <span className="text-xs font-medium whitespace-nowrap">
                      {isOnline ? "En línea" : "Desconectado"}
                    </span>
                  </div>
                  <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setShowNewChatModal(true)}
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex-shrink-0 w-full lg:w-auto justify-center"
                      >
                        <MessageSquare className="h-4 w-4 lg:mr-2" />
                        <span className="hidden lg:inline">Nuevo Chat</span>
                        <span className="lg:hidden">Nuevo</span>
                      </Button>
                    </DialogTrigger>
                    
                    {/* Botón para mostrar/ocultar chats archivados */}
                    {archivedChats.size > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowArchivedChats(!showArchivedChats)}
                        className={cn(
                          "border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-700 bg-white/80 hover:bg-white shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0",
                          showArchivedChats && "bg-blue-50 border-blue-300 text-blue-700"
                        )}
                      >
                        <Trash2 className="h-4 w-4 lg:mr-2" />
                        <span className="hidden lg:inline">
                          {showArchivedChats ? 'Ocultar' : 'Archivados'} ({archivedChats.size})
                        </span>
                        <span className="lg:hidden">
                          {showArchivedChats ? 'Ocultar' : archivedChats.size}
                        </span>
                      </Button>
                    )}
                  <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] bg-white border-0 shadow-2xl rounded-2xl mx-auto overflow-hidden">
                    <DialogHeader className="text-center pb-4 lg:pb-6 px-4 lg:px-6">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
                        <MessageSquare className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                      </div>
                      <DialogTitle className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        💬 Nuevo Chat
                      </DialogTitle>
                      <p className="text-sm lg:text-base text-slate-600 mt-2">Selecciona un usuario para iniciar una conversación</p>
                    </DialogHeader>
                    
                    <div className="space-y-4 lg:space-y-6 px-4 lg:px-6 pb-4 lg:pb-6">
                      <div className="relative">
                        <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                          placeholder="🔍 Buscar por nombre, email o dirección..."
                          value={searchUsers}
                          onChange={(e) => setSearchUsers(e.target.value)}
                          type="search"
                          name="new-chat-user-search"
                          autoComplete="off"
                          inputMode="search"
                          spellCheck={false}
                          className="pl-10 lg:pl-12 h-10 lg:h-12 bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl text-sm lg:text-base w-full"
                        />
                      </div>
                      
                      <ScrollArea className="h-80 lg:h-96 max-h-[60vh]">
                        <div className="space-y-3 lg:space-y-4 pr-2 lg:pr-4">
                        {filteredUsers.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="mb-4">
                              {searchUsers ? (
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <Search className="h-8 w-8 text-slate-400" />
                                </div>
                              ) : (
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                              )}
                            </div>
                            <h4 className="text-base font-semibold text-slate-700 mb-2">
                              {searchUsers ? 'No se encontraron usuarios' : 'Cargando usuarios...'}
                            </h4>
                            {searchUsers && (
                              <p className="text-sm text-slate-500">
                                Intenta con otros términos de búsqueda
                              </p>
                            )}
                          </div>
                        ) : (
                          filteredUsers.map((availableUser) => (
                            <div
                              key={availableUser.uid}
                              className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-lg border-2 border-transparent hover:border-blue-200"
                              onClick={() => createNewChat(availableUser.uid)}
                            >
                              <Avatar className="h-12 w-12 shadow-lg border-2 border-white flex-shrink-0">
                                <AvatarFallback className={cn(
                                  "text-white font-semibold text-sm",
                                  getAvatarColor(availableUser.uid)
                                )}>
                                  {getInitials(availableUser.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-base text-slate-800 truncate mb-1">{availableUser.fullName}</h4>
                                <p className="text-sm text-slate-600 truncate mb-1">{availableUser.email}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-500">📍</span>
                                  <p className="text-xs text-slate-500 font-medium">
                                    {availableUser.calle} {availableUser.houseNumber}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center flex-shrink-0">
                                <Badge className={cn(
                                  "text-xs font-semibold px-3 py-1 rounded-full",
                                  availableUser.role === 'resident' 
                                    ? "bg-green-100 text-green-700 border-green-200" 
                                    : "bg-blue-100 text-blue-700 border-blue-200"
                                )}>
                                  {availableUser.role === 'resident' ? '👤 Residente' : '👑 Admin'}
                                </Badge>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
                </div>
              </div>
            </div>
            {/* Indicador del residencial actual para admin global */}
            {userClaims?.isGlobalAdmin && residenciales.length > 0 && (
              <div className="mx-2 lg:mx-3 mt-3 lg:mt-4 flex-shrink-0">
                <div className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Residencial: {residenciales.find(r => r.id === selectedResidencial)?.nombre || 'Seleccionando...'}
                  </span>
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                    {residenciales.find(r => r.id === selectedResidencial)?.residencialID || ''}
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Buscador de conversaciones */}
            <div className="relative mt-3 lg:mt-4 mx-2 lg:mx-3 flex-shrink-0">
              <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="🔍 Buscar conversaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                type="search"
                name="chat-list-search"
                autoComplete="off"
                inputMode="search"
                spellCheck={false}
                className="pl-10 lg:pl-12 h-10 lg:h-11 bg-white/80 border-slate-200/60 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl shadow-sm transition-all duration-200 w-full text-sm lg:text-base"
              />
            </div>

            {/* Lista de conversaciones */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="py-2 lg:py-3 space-y-1 lg:space-y-2 px-2 lg:px-3 min-w-0">
              {showArchivedChats ? (
                // Vista de chats archivados
                archivedChatsList.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="h-10 w-10 text-slate-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">No hay chats archivados</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        📁 Los chats que archives aparecerán aquí
                      </p>
                    </div>
                    <Button 
                      onClick={() => setShowArchivedChats(false)}
                      variant="outline"
                      className="border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-700"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver a chats activos
                    </Button>
                  </div>
                ) : (
                  archivedChatsList.map((chat) => {
                    const otherUser = getOtherParticipant(chat);
                    if (!otherUser) return null;

                    return (
                      <div
                        key={chat.id}
                        className="flex items-start gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg lg:rounded-xl border-2 border-slate-200/60 bg-slate-50/80 w-full min-w-0"
                      >
                        <Avatar className="h-8 w-8 lg:h-10 lg:w-10 shadow-md border border-slate-200 flex-shrink-0">
                          <AvatarFallback className={cn(
                            "text-slate-600 font-semibold text-xs lg:text-sm",
                            getAvatarColor(otherUser.uid)
                          )}>
                            {getInitials(otherUser.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-start gap-1 mb-1 min-w-0">
                            <h3 className="font-bold text-sm text-slate-600 truncate flex-1 min-w-0">
                              {otherUser.fullName}
                            </h3>
                            <span className="text-xs font-medium text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Archivado
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-slate-400 text-xs flex-shrink-0">📍</span>
                            <p className="text-xs text-slate-400 font-medium truncate flex-1 min-w-0">
                              {otherUser.calle} {otherUser.houseNumber}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => unarchiveChat(chat.id)}
                                className="h-6 w-6 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Restaurar chat</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                // Vista de chats activos
                filteredChats.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">No hay conversaciones</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        {userClaims?.isGlobalAdmin 
                          ? "💡 Como administrador global, puedes iniciar conversaciones con residentes de cualquier residencial"
                          : "💡 Inicia una conversación con otros residentes de tu comunidad"
                        }
                      </p>
                    </div>
                    <Button 
                      onClick={() => setShowNewChatModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Crear primer chat
                    </Button>
                  </div>
                ) : (
                  filteredChats.map((chat) => {
                    const otherUser = getOtherParticipant(chat);
                    if (!otherUser) return null;

                    const isSelected = selectedChat?.id === chat.id;
                    const unreadCount = chat.unreadCount[user?.uid || ''] || 0;

                    return (
                      <div
                        key={chat.id}
                        className={cn(
                          "group flex items-start gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg lg:rounded-xl cursor-pointer transition-all duration-200 border-2 w-full min-w-0",
                          isSelected 
                            ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg ring-2 ring-blue-200/50" 
                            : "bg-white/80 hover:bg-white border-transparent hover:border-slate-200 hover:shadow-md"
                        )}
                        onClick={() => setSelectedChat(chat)}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 lg:h-10 lg:w-10 cursor-pointer shadow-md border border-white flex-shrink-0">
                              <AvatarFallback className={cn(
                                "text-white font-semibold text-xs lg:text-sm",
                                getAvatarColor(otherUser.uid)
                              )}>
                                {getInitials(otherUser.fullName)}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white border border-slate-200 shadow-xl">
                            <div className="text-center p-2">
                              <p className="font-bold text-base text-slate-800">{otherUser.fullName}</p>
                              <p className="text-xs text-slate-500 mt-1">{otherUser.email}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                📍 {otherUser.calle} {otherUser.houseNumber}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                        
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-start gap-1 mb-1 min-w-0">
                            <h3 className="font-bold text-sm text-slate-800 truncate flex-1 min-w-0">
                              {otherUser.fullName}
                            </h3>
                            {chat.lastMessageTime && (
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                {format(
                                  chat.lastMessageTime.toDate 
                                    ? chat.lastMessageTime.toDate() 
                                    : chat.lastMessageTime instanceof Date 
                                      ? chat.lastMessageTime 
                                      : new Date(chat.lastMessageTime.seconds * 1000), 
                                  'h:mm a', 
                                  { locale: es }
                                )}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-start gap-1 mb-1 min-w-0">
                            <p className="text-xs text-slate-600 truncate flex-1 min-w-0 font-medium">
                              {chat.lastMessageSender === user?.uid ? (
                                <span className="text-blue-600 font-semibold">Tú: </span>
                              ) : null}
                              {chat.lastMessage || 'Sin mensajes'}
                            </p>
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="h-4 w-4 lg:h-5 lg:w-5 rounded-full p-0 text-xs font-bold shadow-md flex-shrink-0">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-red-500 text-xs flex-shrink-0">📍</span>
                            <p className="text-xs text-slate-500 font-medium truncate flex-1 min-w-0">
                              {otherUser.calle} {otherUser.houseNumber}
                            </p>
                          </div>
                        </div>
                        
                        {/* Botón para archivar chat */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  archiveChat(chat.id);
                                }}
                                className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Archivar chat</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })
                )
              )}
              </div>
            </ScrollArea>
          </div>

          {/* Área de chat */}
          <div className={cn(
            "flex-1 flex flex-col min-w-0",
            !selectedChat && "hidden lg:flex"
          )}>
            {selectedChat ? (
              <>
                {/* Header del chat */}
                <div className="p-3 border-b bg-gradient-to-r from-background to-muted/30 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden mr-2"
                    onClick={() => setSelectedChat(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  
                  <Avatar className="h-10 w-10 shadow">
                    <AvatarFallback className="bg-primary/10">
                      {getOtherParticipant(selectedChat)?.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground truncate">
                      {getOtherParticipant(selectedChat)?.fullName || 'Usuario'}
                    </h3>
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm text-muted-foreground truncate">
                        {getOtherParticipant(selectedChat)?.calle} {getOtherParticipant(selectedChat)?.houseNumber}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">•</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">En línea</span>
                      </div>
                      {selectedChat.unreadCount[user?.uid || ''] > 0 && (
                        <Badge variant="destructive" className="h-5 px-2 text-xs flex-shrink-0">
                          {selectedChat.unreadCount[user?.uid || '']} nuevo{selectedChat.unreadCount[user?.uid || ''] > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {lastSeen && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          • Visto {format(lastSeen, 'h:mm a', { locale: es })}
                        </span>
                      )}
                    </div>
                    
                    {/* Indicador del residencial para admin global */}
                    {userClaims?.isGlobalAdmin && residenciales.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Building className="h-3 w-3 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">
                          {residenciales.find(r => r.id === selectedResidencial)?.nombre || 'Residencial'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setShowSearchMessages(!showSearchMessages)}
                          className={showSearchMessages ? "bg-primary/10 text-primary" : ""}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Buscar en mensajes</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            // Marcar mensajes como leídos
                            if (selectedChat) {
                              MessagesService.markAsRead(residencialId, selectedChat.id, user?.uid || '');
                            }
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Marcar como leído</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            // Limpiar conversación
                            if (selectedChat && confirm('¿Estás seguro de que quieres limpiar esta conversación?')) {
                              setMessages([]);
                              toast({
                                title: "Conversación limpiada",
                                description: "Los mensajes se han limpiado de la vista",
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Limpiar conversación</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                </div>

              {/* Barra de búsqueda */}
              {showSearchMessages && (
                <div className="p-3 border-b bg-muted/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar en esta conversación..."
                      value={searchMessages}
                      onChange={(e) => setSearchMessages(e.target.value)}
                      type="search"
                      name="chat-inner-search"
                      autoComplete="off"
                      inputMode="search"
                      spellCheck={false}
                      className="pl-10 pr-10"
                    />
                    {searchMessages && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                        onClick={() => {
                          setSearchMessages('');
                          setSearchResults([]);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Mensajes */}
              <ScrollArea className="flex-1 p-3 overflow-y-auto min-w-0">
                <div className="space-y-3 min-w-0">
                  {loadingMessages ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                      <p className="text-sm text-muted-foreground">Cargando mensajes...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">No hay mensajes</p>
                      <p className="text-xs text-muted-foreground">
                        💬 Inicia la conversación enviando un mensaje
                      </p>
                    </div>
                  ) : showSearchMessages && searchMessages && searchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">No se encontraron mensajes</p>
                      <p className="text-xs text-muted-foreground">
                        🔍 Intenta con otros términos de búsqueda
                      </p>
                    </div>
                  ) : (
                    <>
                      {(showSearchMessages && searchMessages ? searchResults : messages).map((message) => {
                        const isMe = message.senderId === user?.uid;
                        const otherUser = getOtherParticipant(selectedChat);
                        
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              isMe ? "justify-end" : "justify-start"
                            )}
                          >
                            <div className={cn(
                              "flex items-end gap-2 max-w-[70%]",
                              isMe ? "flex-row-reverse" : "flex-row"
                            )}>
                              {!isMe && (
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-primary/10 text-xs">
                                    {otherUser?.fullName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              
                              <div className={cn(
                                "rounded-2xl px-4 py-2 shadow-sm",
                                isMe 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              )}>
                                <p className="text-sm">
                                  {showSearchMessages && searchMessages 
                                    ? highlightSearchTerm(message.text, searchMessages)
                                    : message.text
                                  }
                                </p>
                                <div className={cn(
                                  "flex items-center gap-1 mt-1",
                                  isMe ? "justify-end" : "justify-start"
                                )}>
                                  <span className="text-xs opacity-70">
                                    {format(
                                      message.timestamp.toDate 
                                        ? message.timestamp.toDate() 
                                        : message.timestamp instanceof Date 
                                          ? message.timestamp 
                                          : new Date(message.timestamp.seconds * 1000), 
                                      'h:mm a', 
                                      { locale: es }
                                    )}
                                  </span>
                                  {isMe && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1">
                                      {messageStatus[message.id] === 'sending' ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current opacity-70"></div>
                                          <span className="text-xs opacity-70">Enviando...</span>
                                        </>
                                      ) : messageStatus[message.id] === 'sent' ? (
                                        <>
                                          <Check className="h-3 w-3 opacity-70" />
                                          <span className="text-xs opacity-70">Enviado</span>
                                        </>
                                      ) : messageStatus[message.id] === 'delivered' ? (
                                        <>
                                          <CheckCheck className="h-3 w-3 opacity-70" />
                                          <span className="text-xs opacity-70">Entregado</span>
                                        </>
                                      ) : messageStatus[message.id] === 'read' ? (
                                        <>
                                          <CheckCheck className="h-3 w-3 opacity-70" />
                                          <span className="text-xs opacity-70">Leído</span>
                                        </>
                                      ) : (
                                        <>
                                          <Check className="h-3 w-3 opacity-70" />
                                          <span className="text-xs opacity-70">Enviado</span>
                                        </>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {sendingMessageId === message.id 
                                          ? 'Enviando mensaje...'
                                          : selectedChat.unreadCount[getOtherParticipant(selectedChat)?.uid || ''] === 0 
                                            ? 'Mensaje leído' 
                                            : 'Mensaje enviado'
                                        }
                                      </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                      
                      {/* Indicador de escritura del usuario actual */}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="flex items-end gap-2 max-w-[70%]">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary/10 text-xs">
                                {user?.email?.substring(0, 2).toUpperCase() || 'AD'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-2xl px-4 py-2">
                              <div className="flex items-center gap-1">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Indicador de escritura del otro usuario */}
                      {otherUserTyping && (
                        <div className="flex justify-start">
                          <div className="flex items-end gap-2 max-w-[70%]">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary/10 text-xs">
                                {getOtherParticipant(selectedChat)?.fullName.split(' ').map(n => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-2xl px-4 py-2">
                              <div className="flex items-center gap-1">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Input de mensaje */}
              {!isOnline && (
                <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200">
                  <p className="text-xs text-yellow-800 text-center">
                    ⚠️ Sin conexión a internet. Los mensajes se enviarán cuando se restablezca la conexión.
                  </p>
                </div>
              )}
              <div className="p-2 lg:p-3 border-t bg-background min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="hidden lg:flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '*/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                toast({
                                  title: "Archivo seleccionado",
                                  description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
                                });
                                // TODO: Implementar upload a Storage y enviar URL en el chat
                              }
                            };
                            input.click();
                          }}
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Adjuntar archivo</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                toast({
                                  title: "Imagen seleccionada",
                                  description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
                                });
                                // TODO: Implementar upload a Storage y enviar URL en el chat
                              }
                            };
                            input.click();
                          }}
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enviar imagen</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            const emojis = ['😊', '👍', '❤️', '🎉', '🔥', '💯', '👏', '🙏', '😎', '🎯', '🚀'];
                            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                            setNewMessage(prev => prev + randomEmoji);
                          }}
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Emojis</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <div className="lg:hidden">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            const emojis = ['😊', '👍', '❤️', '🎉', '🔥', '💯', '👏', '🙏', '😎', '🎯', '🚀'];
                            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                            setNewMessage(prev => prev + randomEmoji);
                          }}
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Emojis</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <Input
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 h-10 text-sm min-w-0"
                    disabled={sending || !isOnline}
                  />
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending || !isOnline}
                        size="icon"
                        className={sending ? "bg-primary/80" : ""}
                      >
                        {sending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{sending ? "Enviando..." : "Enviar mensaje"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </>
          ) : (
            /* Estado vacío */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecciona una conversación</h3>
                <p className="text-muted-foreground mb-4">
                  Elige un chat de la lista para comenzar a enviar mensajes
                </p>
                
                {/* Indicador del residencial actual para admin global */}
                {userClaims?.isGlobalAdmin && residenciales.length > 0 && (
                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      Residencial actual: {residenciales.find(r => r.id === selectedResidencial)?.nombre || 'Seleccionando...'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}

