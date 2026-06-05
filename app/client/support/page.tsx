"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import { Send, Plus, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import TypingIndicator from "@/components/ui/TypingIndicator";

interface Ticket {
  id: number;
  subject: string;
  type: string;
  status: string;
  createdAt: string;
  messages: any[];
}

export default function ClientSupportPage() {
  const { user } = useAuth();
  const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
  const { socket, connected } = useSocket(token);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  
  // New ticket state
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newType, setNewType] = useState("HELP");

  const [typingState, setTypingState] = useState<{ isTyping: boolean; name?: string }>({ isTyping: false });
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (socket && activeTicket) {
      socket.emit("join_ticket", activeTicket.id);

      socket.on("receive_message", (message) => {
        setActiveTicket((prev) => {
          if (!prev) return prev;
          return { ...prev, messages: [...(prev.messages || []), message] };
        });
        setTypingState({ isTyping: false });
      });

      socket.on("user_typing", (data: { userId: number; role: string; isTyping: boolean }) => {
        if (data.isTyping) {
          setTypingState({ isTyping: true, name: data.role === 'ADMIN' ? 'Админ' : undefined });
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
      if (res.data.length > 0 && !activeTicket) {
        loadTicketDetails(res.data[0].id);
      }
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
      setIsCreating(false);
    } catch (e) {
      toast.error("Хатогӣ дар гирифтани маълумот");
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim()) return;
    try {
      const res = await api.post("/tickets", { subject: newSubject, type: newType });
      const newTicket = { ...res.data, messages: [] };
      setTickets([newTicket, ...tickets]);
      setActiveTicket(newTicket);
      setIsCreating(false);
      setNewSubject("");
      toast.success("Тикети нав сохта шуд");
    } catch (e) {
      toast.error("Хатогӣ ҳангоми сохтани тикет");
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

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Боркунӣ...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[500px] bg-white dark:bg-[#0f172a] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 dark:text-white">Муроҷиатҳои ман</h2>
          <button 
            onClick={() => setIsCreating(true)}
            className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition"
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {tickets.map(t => (
            <div 
              key={t.id}
              onClick={() => loadTicketDetails(t.id)}
              className={`p-3 rounded-xl cursor-pointer transition border ${
                activeTicket?.id === t.id && !isCreating
                  ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/30' 
                  : 'bg-white border-transparent hover:border-slate-200 dark:bg-transparent dark:hover:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-200 truncate pr-2">{t.subject}</span>
                {t.status === 'OPEN' ? <Clock size={14} className="text-amber-500 shrink-0"/> : <CheckCircle2 size={14} className="text-emerald-500 shrink-0"/>}
              </div>
              <div className="flex justify-between items-center text-xs opacity-70">
                <span>{t.type}</span>
                <span>{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {tickets.length === 0 && (
            <div className="text-center text-slate-400 text-sm p-4">Шумо то ҳол ягон муроҷиат накардаед.</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-[#020617]/50 relative">
        {isCreating ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
            <form onSubmit={handleCreateTicket} className="w-full max-w-md bg-white dark:bg-[#0f172a] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Муроҷиати нав</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Мавзӯъ</label>
                  <input 
                    required
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 text-sm"
                    placeholder="Масалан: Хатогӣ дар саҳифаи гурӯҳ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Навъи муроҷиат</label>
                  <select 
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="HELP" className="bg-white dark:bg-[#0f172a]">Кӯмак / Савол</option>
                    <option value="BUG" className="bg-white dark:bg-[#0f172a]">Хатогии система (Bug)</option>
                    <option value="FEEDBACK" className="bg-white dark:bg-[#0f172a]">Пешниҳод</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition">
                  Сохтан
                </button>
              </div>
            </form>
          </div>
        ) : activeTicket ? (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md flex justify-between items-center z-10">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{activeTicket.subject}</h3>
                <p className="text-xs text-slate-500">Статус: <span className="font-semibold">{activeTicket.status}</span></p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTicket.messages?.map((m: any) => {
                const isMine = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMine 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700'
                    }`}>
                      {!isMine && <div className="text-[10px] font-bold text-indigo-500 mb-1">{m.sender?.firstName} (Админ)</div>}
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
                  placeholder="Паёми худро нависед..."
                  disabled={activeTicket.status === 'RESOLVED' || !connected}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-5 py-2.5 text-sm outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <button 
                  onClick={sendMessage}
                  disabled={!msg.trim() || activeTicket.status === 'RESOLVED' || !connected}
                  className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white disabled:opacity-50 hover:bg-indigo-700 transition"
                >
                  <Send size={16} className="ml-1" />
                </button>
              </div>
              {activeTicket.status === 'RESOLVED' && (
                <p className="text-xs text-center text-slate-500 mt-2">Ин муроҷиат ҳал шудааст ва пушида шудааст.</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Як муроҷиатро интихоб кунед ё навашро созед</p>
          </div>
        )}
      </div>
    </div>
  );
}
