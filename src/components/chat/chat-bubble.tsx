"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, X, Send, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: "user" | "advisor";
  timestamp: Date;
}

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "¡Hola! Soy el asistente virtual de Zentry. ¿En qué puedo ayudarte hoy?",
      sender: "advisor",
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    // Simular respuesta del asesor (esto se reemplazaría con la lógica real)
    setTimeout(() => {
      const advisorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Gracias por tu mensaje. Un representante de Zentry te responderá en breve.",
        sender: "advisor",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, advisorMessage]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-10 lg:right-16 z-50">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 w-[350px] bg-background border rounded-lg shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-primary-600 to-accent-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarImage src="/images/advisor-avatar.png" />
                    <AvatarFallback>ZA</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-medium text-white">Asistente Zentry</h3>
                    <p className="text-xs text-primary-100">Disponible</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white hover:bg-white/20"
                    onClick={() => setIsMinimized(true)}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white hover:bg-white/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2",
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.sender === "advisor" && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/images/advisor-avatar.png" />
                        <AvatarFallback>ZA</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "rounded-lg p-3 max-w-[80%]",
                        msg.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className="text-[10px] opacity-70">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {msg.sender === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>TU</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-background/95">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Chat */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0"
          >
            <Button
              variant="outline"
              className="bg-background shadow-lg"
              onClick={() => setIsMinimized(false)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Asistente Zentry
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          className={cn(
            "relative h-14 w-14 rounded-full shadow-lg",
            isOpen 
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
              : "bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 shadow-primary-500/20",
            "transition-all duration-300"
          )}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              setIsMinimized(false);
            } else {
              setIsOpen(true);
            }
          }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <div className="relative">
                <MessageCircle className="h-6 w-6 text-white" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
            )}
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
} 