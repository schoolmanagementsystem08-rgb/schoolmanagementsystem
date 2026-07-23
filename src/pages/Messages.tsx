import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, User, Circle } from 'lucide-react';
import api from '../lib/api.ts';

interface Room {
  userId: number;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
}

interface Message {
  id: number;
  senderId: number;
  text: string;
  createdAt: string;
}

const CURRENT_USER_ID = 1;

export default function MessagesPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/messages/conversations/${CURRENT_USER_ID}`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setRooms(data);
        if (data.length > 0 && !activeRoom) {
          setActiveRoom(data[0]);
        }
      })
      .catch(err => console.error('Failed to load conversations', err));
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    api.get(`/messages/${CURRENT_USER_ID}/${activeRoom.userId}`)
      .then(res => {
        setMessages(Array.isArray(res.data) ? res.data.map((m: any) => ({
          ...m,
          text: m.text || m.body,
        })) : []);
      })
      .catch(err => console.error('Failed to load messages', err));
  }, [activeRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeRoom) return;
    try {
      await api.post('/messages', {
        senderId: CURRENT_USER_ID,
        receiverId: activeRoom.userId,
        body: input,
      });
      setInput('');
      const res = await api.get(`/messages/${CURRENT_USER_ID}/${activeRoom.userId}`);
      setMessages(Array.isArray(res.data) ? res.data.map((m: any) => ({
        ...m,
        text: m.text || m.body,
      })) : []);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const filteredRooms = rooms.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
      <div className="w-80 border-r border-neutral-100 flex flex-col">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input type="text" placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-50">
          {filteredRooms.length === 0 ? (
            <p className="text-center text-neutral-400 py-8 text-sm">No conversations yet.</p>
          ) : (
            filteredRooms.map((room) => (
              <div key={room.userId} onClick={() => setActiveRoom(room)}
                className={`p-4 cursor-pointer transition-all flex gap-3 relative ${
                  activeRoom?.userId === room.userId ? 'bg-neutral-50 shadow-inner' : 'hover:bg-neutral-50/50'
                }`}>
                <div className="w-12 h-12 rounded-full bg-neutral-200 flex-shrink-0 flex items-center justify-center text-neutral-400 font-bold">
                  {room.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm truncate">{room.name}</h3>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {room.time ? new Date(room.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">{room.lastMsg}</p>
                </div>
                {room.unread > 0 && (
                  <div className="w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {room.unread}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-neutral-50/30">
        {activeRoom ? (
          <>
            <div className="h-16 border-b border-neutral-100 bg-white px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-400">
                  {activeRoom.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-bold text-sm">{activeRoom.name}</p>
                  <p className="text-[10px] text-green-500 flex items-center gap-1 font-bold uppercase tracking-wider">
                    <Circle className="w-1.5 h-1.5 fill-current" /> Online
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-neutral-400 py-8 text-sm">No messages yet. Start a conversation!</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === CURRENT_USER_ID ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                      msg.senderId === CURRENT_USER_ID
                        ? 'bg-black text-white rounded-br-none'
                        : 'bg-white text-neutral-800 rounded-bl-none border border-neutral-100'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-neutral-400 mt-1 font-medium">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-6 bg-white border-t border-neutral-100">
              <form onSubmit={sendMessage} className="relative">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full pl-6 pr-14 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all" />
                <button type="submit" disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors shadow-lg shadow-black/10 disabled:opacity-50">
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
