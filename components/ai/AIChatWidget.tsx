"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Bot, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { groupsApi, studentsApi } from "@/lib/api";
import { Group, Student } from "@/types";
import { useTranslation } from "@/contexts/LanguageContext";

interface Message {
  id: string;
  role: "ai" | "user";
  text: string;
}

type ChatState =
  | "IDLE"
  | "AWAITING_GROUP_NAME"
  | "AWAITING_STUDENTS"
  | "AWAITING_EXISTING_GROUP"
  | "AWAITING_NEW_STUDENTS"
  | "PROCESSING";

interface AIChatWidgetProps {
  groups: Group[];
  latestMonthId?: number;
  onGroupCreated: (group: Group, students: Student[]) => void;
  onStudentsAdded: (groupId: number, students: Student[]) => void;
}

const SUGGESTIONS: Partial<Record<ChatState, string[]>> = {
  IDLE: ["📚 Гурӯҳи нав сохт", "📋 Гурӯҳҳоям", "➕ Талаба илова кун", "🆘 Кӯмак"],
};

function parseStudentNames(raw: string): { firstName: string; lastName?: string }[] {
  return raw
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n.length > 0)
    .map((fullName) => {
      const parts = fullName.trim().split(/\s+/);
      return { firstName: parts[0], lastName: parts.slice(1).join(" ") || undefined };
    });
}

export default function AIChatWidget({ groups, latestMonthId, onGroupCreated, onStudentsAdded }: AIChatWidgetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatState, setChatState] = useState<ChatState>("IDLE");
  const [pendingGroupName, setPendingGroupName] = useState("");
  const [pendingGroupId, setPendingGroupId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addAiMessage = useCallback((text: string, delay = 700): Promise<void> => {
    setIsTyping(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: `${Date.now()}-${Math.random()}`, role: "ai", text },
        ]);
        resolve();
      }, delay);
    });
  }, []);

  const addUserMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, role: "user", text },
    ]);
  }, []);

  // Greet on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      addAiMessage(t("ai.welcome"), 500);
    }
  }, [open, messages.length, addAiMessage, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const resetToIdle = useCallback(() => {
    setChatState("IDLE");
    setPendingGroupName("");
    setPendingGroupId(null);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping || chatState === "PROCESSING") return;
      setInput("");
      addUserMessage(trimmed);
      const lower = trimmed.toLowerCase();

      // ──────────────────────── IDLE ────────────────────────
      if (chatState === "IDLE") {
        // Greeting
        if (/салом|salom|hello|hi|хай/.test(lower)) {
          await addAiMessage("Салом! 😊 Хурсандам ки дидам. Чӣ ёрдам карда метавонам?");
          return;
        }

        // Create group intent
        if (/гурӯҳ.*нав|нав.*гурӯҳ|guruh|create|сохт/.test(lower)) {
          if (!latestMonthId) {
            await addAiMessage("Шумо ягон контейнер (давраи омӯзишӣ) надоред. Лутфан аввал аз панели чап Давраи нав созед.");
            return;
          }
          await addAiMessage("Хуб! Номи гурӯҳро чӣ мондан мехоҳед?");
          setChatState("AWAITING_GROUP_NAME");
          return;
        }

        // Add students to existing group
        if (/талаба.*илова|илова.*талаба|add.*student/.test(lower)) {
          if (groups.length === 0) {
            await addAiMessage("Шумо ҳанӯз ягон гурӯҳ надоред. Аввал гурӯҳ созед.");
            return;
          }
          const list = groups.map((g, i) => `${i + 1}. ${g.name} (${g.students?.length ?? 0} талаба)`).join("\n");
          await addAiMessage(`Ба кадом гурӯҳ талаба илова кардан мехоҳед? Рақами гурӯҳро нависед:\n\n${list}`);
          setChatState("AWAITING_EXISTING_GROUP");
          return;
        }

        // List groups
        if (/рӯйхат|список|list|гурӯҳҳо|гурӯҳҳои/.test(lower)) {
          if (groups.length === 0) {
            await addAiMessage("Шумо ҳанӯз ягон гурӯҳ надоред.\n\nМехоҳед гурӯҳи нав созед? Бинависед «Гурӯҳи нав сохт»");
          } else {
            const total = groups.reduce((a, g) => a + (g.students?.length ?? 0), 0);
            const list = groups.map((g) => `📚 **${g.name}** — ${g.students?.length ?? 0} талаба`).join("\n");
            await addAiMessage(`Гурӯҳҳои шумо (${groups.length} гурӯҳ, ${total} талаба):\n\n${list}`);
          }
          return;
        }

        // Help
        if (/кӯмак|help|чи карда|чи кор/.test(lower)) {
          await addAiMessage(
            "Ман метавонам инҳоро кунам:\n\n" +
              "📚 **Гурӯҳи нав сохт** — гурӯҳ ва талабагонро якбора илова мекунам\n" +
              "➕ **Талаба илова кун** — ба гурӯҳи мавҷуда талаба мезанам\n" +
              "📋 **Гурӯҳҳоям** — рӯйхати ҳамаи гурӯҳҳоятро нишон медиҳам\n\n" +
              "Барои ҳар кадом аз тугмаҳо пахш кунед ё бинависед."
          );
          return;
        }

        await addAiMessage('Нафаҳмидам. Бинависед «Кӯмак» то бубинем ки чӣ карда метавонам 😊');
        return;
      }

      // ──────────────────── AWAITING_GROUP_NAME ────────────────────
      if (chatState === "AWAITING_GROUP_NAME") {
        if (trimmed.length < 1) {
          await addAiMessage("Номи гурӯҳ хеле кӯтоҳ аст. Лутфан номи дигаре нависед.");
          return;
        }
        setPendingGroupName(trimmed);
        await addAiMessage(
          `Хуб! Гурӯҳ бо номи «${trimmed}» сохта мешавад. 🎉\n\n` +
            "Акнун номи ҳамаи донишҷӯёнро бо вергул (,) ҷудо карда нависед:\n\n" +
            "Мисол:\nАлӣ Ализода, Сино Раҳимов, Нилуфар Каримова"
        );
        setChatState("AWAITING_STUDENTS");
        return;
      }

      // ──────────────────── AWAITING_STUDENTS ────────────────────
      if (chatState === "AWAITING_STUDENTS") {
        const parsed = parseStudentNames(trimmed);
        if (parsed.length === 0) {
          await addAiMessage("Ягон ном ёфт нашуд. Лутфан номҳоро бо вергул ҷудо кунед.");
          return;
        }

        setChatState("PROCESSING");
        setIsTyping(true);

        try {
          if (!latestMonthId) throw new Error("Контейнер интихоб нашудааст");
          const group = await groupsApi.create({ name: pendingGroupName, courseMonthId: latestMonthId });
          const createdStudents = await Promise.all(
            parsed.map((s) => studentsApi.create({ ...s, groupId: group.id }))
          );

          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}`,
              role: "ai",
              text:
                `✅ Гурӯҳи «${group.name}» бомуваффақият сохта шуд!\n\n` +
                `👥 ${createdStudents.length} талаба илова карда шуд:\n` +
                parsed.map((s, i) => `${i + 1}. ${s.firstName}${s.lastName ? " " + s.lastName : ""}`).join("\n") +
                "\n\nМехоҳед боз гурӯҳи нав созед?",
            },
          ]);

          onGroupCreated(group, createdStudents);
          resetToIdle();
        } catch (err: unknown) {
          setIsTyping(false);
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Хатогӣ рух дод. Шояд ин ном аллакай мавҷуд бошад.";
          setMessages((prev) => [
            ...prev,
            { id: `${Date.now()}`, role: "ai", text: `❌ ${msg}\n\nМехоҳед боз кӯшиш кунед?` },
          ]);
          resetToIdle();
        }
        return;
      }

      // ──────────────────── AWAITING_EXISTING_GROUP ────────────────────
      if (chatState === "AWAITING_EXISTING_GROUP") {
        const num = parseInt(trimmed, 10);
        if (isNaN(num) || num < 1 || num > groups.length) {
          await addAiMessage(`Рақами дуруст нависед (1 то ${groups.length}):`);
          return;
        }
        const chosen = groups[num - 1];
        setPendingGroupId(chosen.id);
        await addAiMessage(
          `Гурӯҳи «${chosen.name}» интихоб шуд.\n\n` +
            "Номи талабагони навро бо вергул нависед:\n\nМисол:\nДилшод Назаров, Малика Усмонова"
        );
        setChatState("AWAITING_NEW_STUDENTS");
        return;
      }

      // ──────────────────── AWAITING_NEW_STUDENTS ────────────────────
      if (chatState === "AWAITING_NEW_STUDENTS") {
        const parsed = parseStudentNames(trimmed);
        if (parsed.length === 0) {
          await addAiMessage("Ягон ном ёфт нашуд. Лутфан номҳоро бо вергул ҷудо кунед.");
          return;
        }
        if (pendingGroupId === null) { resetToIdle(); return; }

        setChatState("PROCESSING");
        setIsTyping(true);

        try {
          const createdStudents = await Promise.all(
            parsed.map((s) => studentsApi.create({ ...s, groupId: pendingGroupId! }))
          );
          const chosenGroup = groups.find((g) => g.id === pendingGroupId);

          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}`,
              role: "ai",
              text:
                `✅ ${createdStudents.length} талаба ба гурӯҳи «${chosenGroup?.name ?? ""}» илова шуд!\n\n` +
                parsed.map((s, i) => `${i + 1}. ${s.firstName}${s.lastName ? " " + s.lastName : ""}`).join("\n") +
                "\n\nБоз чӣ кор карданӣ ҳастед?",
            },
          ]);

          onStudentsAdded(pendingGroupId!, createdStudents);
          resetToIdle();
        } catch (err: unknown) {
          setIsTyping(false);
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Хатогӣ рух дод.";
          setMessages((prev) => [
            ...prev,
            { id: `${Date.now()}`, role: "ai", text: `❌ ${msg}` },
          ]);
          resetToIdle();
        }
      }
    },
    [chatState, isTyping, pendingGroupName, pendingGroupId, groups, addAiMessage, addUserMessage, onGroupCreated, onStudentsAdded, resetToIdle]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const suggestions = SUGGESTIONS[chatState] ?? [];
  const isDisabled = isTyping || chatState === "PROCESSING";

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="AI чат"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl transition-all duration-200 flex items-center justify-center ${
          open
            ? "bg-slate-700 dark:bg-slate-600 rotate-0"
            : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
        } text-white`}
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden"
          style={{ width: 360, maxWidth: "calc(100vw - 3rem)", height: 500 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 dark:bg-indigo-700 flex-shrink-0">
            <div className="flex items-center gap-2 text-white">
              <Bot size={20} />
              <span className="font-bold text-sm">{t("ai.title")}</span>
            </div>
            <Sparkles size={16} className="text-indigo-200 flex-shrink-0 ml-auto" />
            <button
              onClick={() => {
                setMessages([]);
                resetToIdle();
              }}
              title="Тоза кардан"
              className="p-1.5 rounded-lg hover:bg-white/10 text-indigo-200 hover:text-white transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center flex-shrink-0 mb-0.5">
                    <Bot size={13} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 text-xs px-2 mb-2 animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                {t("ai.typing").replace("{{name}}", "AI")}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestion chips */}
          {suggestions.length > 0 && !isDisabled && (
            <div className="px-4 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend(input);
              }}
              placeholder={t("ai.placeholder")}
              disabled={chatState === "PROCESSING" || isTyping}
              className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isDisabled}
              className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-md shadow-indigo-500/20"
              title={t("ai.send")}
            >
              {chatState === "PROCESSING" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
