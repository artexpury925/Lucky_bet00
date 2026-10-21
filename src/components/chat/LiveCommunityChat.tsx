import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import confetti from 'canvas-confetti';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  CloudRain,
  Gift,
  Smile,
  Users,
  Flame,
  Rocket,
} from 'lucide-react';

interface LiveCommunityChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  onClaimRain: (amount: number) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'Kiprono_Eldoret',
    avatarSeed: 'kiprono',
    text: 'Round ya 8420 ilifika 45x! Nilitoa at 12x 🚀🔥',
    timestamp: Date.now() - 1000 * 60 * 4,
    badge: 'VIP',
  },
  {
    id: 'm2',
    sender: 'Wanjiku_NBO',
    avatarSeed: 'wanjiku',
    text: 'Arsenal game leo lazima GG & Over 2.5 ⚽',
    timestamp: Date.now() - 1000 * 60 * 3,
  },
  {
    id: 'm3',
    sender: 'Otieno_Kisumu',
    avatarSeed: 'otieno',
    text: 'Mines ni safi sana. Uncover 4 diamonds then cash out! 💎',
    timestamp: Date.now() - 1000 * 60 * 2,
    badge: 'Pro',
  },
  {
    id: 'm4',
    sender: 'Hassan_MSA',
    avatarSeed: 'hassan',
    text: 'Lucky Bet is paying fast kwa M-PESA. Walinipea 500 bonus!',
    timestamp: Date.now() - 1000 * 45,
  },
];

const SIMULATED_CHATTERS = [
  { name: 'Mwangi_254', text: 'Fly to the moon! 🚀🚀', badge: 'VIP' },
  { name: 'Chebet_Run', text: 'Cashed out 350 KES safely!', badge: 'Winner' },
  { name: 'Kamau_Apex', text: 'Real Madrid vs Barca leo ni moto 🔥' },
  { name: 'Nekesa_Star', text: 'Leo niko na luck ya wheel! Nimeshinda 50 KES' },
  { name: 'Barasa_KTL', text: 'Weka stake kidogo utoke mapema!' },
  { name: 'Mutua_Machakos', text: 'Big multiplier coming up boys! 100x loading...' },
];

export const LiveCommunityChat: React.FC<LiveCommunityChatProps> = ({
  isOpen,
  onClose,
  currentUsername,
  onClaimRain,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [onlineCount, setOnlineCount] = useState<number>(342);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Periodic simulated incoming messages
  useEffect(() => {
    const chatInterval = setInterval(() => {
      const chatter = SIMULATED_CHATTERS[Math.floor(Math.random() * SIMULATED_CHATTERS.length)];
      const newMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        sender: chatter.name,
        avatarSeed: chatter.name.toLowerCase(),
        text: chatter.text,
        timestamp: Date.now(),
        badge: chatter.badge,
      };

      setMessages(prev => [...prev.slice(-40), newMsg]);
      setOnlineCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 18000);

    return () => clearInterval(chatInterval);
  }, []);

  // Periodic Rain Drop event (every 75 seconds)
  useEffect(() => {
    const rainTimer = setInterval(() => {
      const rainMsg: ChatMessage = {
        id: 'rain-' + Date.now(),
        sender: '👑 HighRoller_VIP',
        avatarSeed: 'vip',
        text: '🌧️ RAIN DROP! 50 KES bonus drop for everyone in chat!',
        timestamp: Date.now(),
        isRain: true,
        rainAmount: 50,
        rainClaimed: false,
        badge: 'VIP Rain',
      };
      setMessages(prev => [...prev.slice(-40), rainMsg]);
    }, 75000);

    return () => clearInterval(rainTimer);
  }, []);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    soundEngine.playClick();
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: currentUsername || 'Player',
      avatarSeed: currentUsername || 'player',
      text: inputText.trim(),
      timestamp: Date.now(),
      isCurrentUser: true,
      badge: 'You',
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
  };

  const handleSendEmote = (emote: string) => {
    soundEngine.playClick();
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: currentUsername || 'Player',
      avatarSeed: currentUsername || 'player',
      text: emote,
      timestamp: Date.now(),
      isCurrentUser: true,
    };
    setMessages(prev => [...prev, userMsg]);
  };

  const handleClaimRainDrop = (msgId: string, amount: number) => {
    soundEngine.playFanfare();
    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    } catch {}

    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, rainClaimed: true } : m))
    );
    onClaimRain(amount);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-black text-sm text-white">Live Community Chat</h3>
            <div className="flex items-center space-x-1 text-[11px] text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{onlineCount} Kenyan Players Online</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/40">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col space-y-1 ${
              msg.isCurrentUser ? 'items-end' : 'items-start'
            }`}
          >
            {/* Sender & Badge */}
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="font-bold text-slate-300">{msg.sender}</span>
              {msg.badge && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-black text-[9px] uppercase border border-amber-500/30 font-mono">
                  {msg.badge}
                </span>
              )}
              <span className="text-[10px] text-slate-500">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Bubble */}
            {msg.isRain ? (
              <div className="bg-gradient-to-r from-blue-900/60 to-purple-900/60 border border-blue-500/50 p-3 rounded-2xl w-full text-center space-y-2 shadow-lg">
                <div className="flex items-center justify-center space-x-1.5 text-blue-300 font-bold text-xs">
                  <CloudRain className="w-4 h-4 text-blue-400 animate-bounce" />
                  <span>{msg.text}</span>
                </div>
                {!msg.rainClaimed ? (
                  <button
                    type="button"
                    onClick={() => handleClaimRainDrop(msg.id, msg.rainAmount || 50)}
                    className="w-full py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 font-black text-xs text-white uppercase rounded-xl shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>CLAIM +{msg.rainAmount} KES RAIN!</span>
                  </button>
                ) : (
                  <div className="text-emerald-400 font-bold text-[11px]">
                    ✓ You claimed this rain bonus!
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`p-2.5 rounded-2xl text-xs max-w-[85%] break-words leading-relaxed ${
                  msg.isCurrentUser
                    ? 'bg-red-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emote Bar */}
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-base">
        {['🔥', '🚀', '💰', '⚽', '💎', '👏'].map(emote => (
          <button
            key={emote}
            type="button"
            onClick={() => handleSendEmote(emote)}
            className="hover:scale-125 transition-transform p-1 cursor-pointer"
          >
            {emote}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          placeholder="Share tips, cheer or discuss odds..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          maxLength={140}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
