"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { Send, CheckCircle2, Clock, Filter } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import TypingIndicator from "@/components/ui/TypingIndicator";

interface Ticket {
  id: number;
  subject: string;
  type: string;
  status: string;
  createdAt: string;
  user: { id: number; firstName: string; lastName: string; email: string };
  messages: any[];
}

export default function AdminSupportPage() {
  const { user } = useAuth();
  const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
  const { socket, connected } = useSocket(token);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [typingState, setTypingState] = useState<{ isTyping: boolean; name?: string }>({ isTyping: false });
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (socket) {
      // Listen for new tickets or activity globally
      socket.on("new_ticket_activity", (data) => {
        // Find if ticket exists
        setTickets((prev) => {
          const exists = prev.find(t => t.id === data.ticketId);
          if (exists) {
            // we will let the room handler add the message if active
            return prev; 
          }
          // otherwise fetch tickets again to get the new one
          fetchTickets();
          return prev;
        });
        toast("Муроҷиати нав / Паёми нав", { icon: "🔔" });
      });
    }
    return () => {
      socket?.off("new_ticket_activity");
    };
  }, [socket]);

  useEffect(() => {
    if (socket && activeTicket) {
      socket.emit("join_ticket", activeTicket.id);

      socket.on("receive_message", (message) => {
        setActiveTicket((prev) => {
          if (!prev) return prev;
          // Avoid duplicate if sent by me (though typically handled by fast state)
          if ((prev.messages || []).find(m => m.id === message.id)) return prev;
          return { ...prev, messages: [...(prev.messages || []), message] };
        });
        setTypingState({ isTyping: false });
      });

      socket.on("user_typing", (data: { userId: number; role: string; isTyping: boolean }) => {
        if (data.isTyping && data.role !== 'ADMIN') {
          // Find user's name if we have it in activeTicket
          const name = activeTicket.user?.firstName || 'Корбар';
          setTypingState({ isTyping: true, name });
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingState({ isTyping: false });
          }, 3000);
        } else {
          setTypingState({ isTyping: false });
        }
      });

      return () => {
        socket.emit("leave_ticket", activeTicket.id);
        socket.off("receive_message");
        socket.off("user_typing");
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      };
    }
  }, [socket, activeTicket?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket?.messages, typingState.isTyping]);

  async function fetchTickets() {
    try {
      const res = await api.get("/tickets");
      setTickets(res.data);
    } catch (e) {
      toast.error("Хатогӣ ҳангоми боркунии тикетҳо");
    } finally {
      setLoading(false);
    }
  }

  async function loadTicketDetails(id: number) {
    try {
      const res = await api.get(`/tickets/${id}`);
      setActiveTicket(res.data);
    } catch (e) {
      toast.error("Хатогӣ дар гирифтани маълумот");
    }
  }

  function sendMessage() {
    if (!msg.trim() || !activeTicket || !socket) return;
    socket.emit("send_message", { ticketId: activeTicket.id, content: msg });
    socket.emit("typing", { ticketId: activeTicket.id, isTyping: false });
    setMsg("");
  }

  function handleTyping(e: React.ChangeEvent<HTMLInputElement>) {
    setMsg(e.target.value);
    if (!activeTicket || !socket) return;
    socket.emit("typing", { ticketId: activeTicket.id, isTyping: e.target.value.length > 0 });
  }

  async function markAsResolved() {
    if (!activeTicket) return;
    try {
      await api.put(`/tickets/${activeTicket.id}/status`, { status: "RESOLVED" });
      setActiveTicket(prev => prev ? { ...prev, status: "RESOLVED" } : null);
      setTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, status: "RESOLVED" } : t));
      toast.success("Муроҷиат ҳал карда шуд");
    } catch (e) {
      toast.error("Хатогӣ рӯй дод");
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Боркунӣ...</div>;
  }

  const filteredTickets = tickets.filter(t => filter === "ALL" || t.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Дастгирии Корбарон</h1>
        <p className="text-slate-500 text-sm">Идоракунии муроҷиатҳо ва фидбекҳо дар вақти воқеӣ</p>
      </div>

      <div className="flex h-[70vh] bg-white dark:bg-[#0f172a] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-[#020617]/50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#0f172a]">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="ALL" className="bg-white dark:bg-[#0f172a]">Ҳамаи тикетҳо</option>
                <option value="OPEN" className="bg-white dark:bg-[#0f172a]">Кушода</option>
                <option value="RESOLVED" className="bg-white dark:bg-[#0f172a]">Ҳалшуда</option>
              </select>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredTickets.map(t => (
              <div 
                key={t.id}
                onClick={() => loadTicketDetails(t.id)}
                className={`p-3 rounded-xl cursor-pointer transition border ${
                  activeTicket?.id === t.id 
                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/30' 
                    : 'bg-white border-transparent hover:border-slate-200 dark:bg-[#0f172a] dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-200 truncate pr-2">{t.subject}</span>
                  {t.status === 'OPEN' ? <Clock size={14} className="text-amber-500 shrink-0"/> : <CheckCircle2 size={14} className="text-emerald-500 shrink-0"/>}
                </div>
                <div className="flex justify-between items-center text-xs opacity-70 mb-1">
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">{t.user?.firstName} {t.user?.lastName}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] opacity-60">
                  <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">{t.type}</span>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="text-center text-slate-400 text-sm p-4">Тикет ёфт нашуд.</div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative bg-white dark:bg-[#020617]">
          {activeTicket ? (
            <>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{activeTicket.subject}</h3>
                  <p className="text-xs text-slate-500">Муаллиф: {activeTicket.user?.firstName} {activeTicket.user?.lastName}</p>
                </div>
                {activeTicket.status === 'OPEN' && (
                  <button 
                    onClick={markAsResolved}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 rounded-lg text-sm font-bold transition"
                  >
                    <CheckCircle2 size={16} /> Ҳал шуд
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-transparent">
                {activeTicket.messages?.map((m: any) => {
                  const isAdmin = m.sender?.role === 'ADMIN';
                  return (
                    <div key={m.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        isAdmin 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm'
                      }`}>
                        {!isAdmin && <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">{m.sender?.firstName}</div>}
                        {m.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  )
                })}
                
                <TypingIndicator isTyping={typingState.isTyping} name={typingState.name} isAdmin={false} />
              
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={msg}
                    onChange={handleTyping}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Ҷавоби худро нависед..."
                    disabled={activeTicket.status === 'RESOLVED' || !connected}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-5 py-2.5 text-sm outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={!msg.trim() || activeTicket.status === 'RESOLVED' || !connected}
                    className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white disabled:opacity-50 hover:bg-indigo-700 transition"
                  >
                    <Send size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <CheckCircle2 size={48} className="mb-4 opacity-20" />
              <p>Як тикетро интихоб кунед то ҷавоб диҳед</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
