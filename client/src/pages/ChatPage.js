import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Wifi, WifiOff } from 'lucide-react';
import { io } from 'socket.io-client';
import Sidebar from '../components/layout/Sidebar';
// import Topbar from '../components/layout/Topbar';
import useAuthStore from '../store/authStore';
import useProjectStore from '../store/projectStore';
import api from '../api/axios';

export default function ChatPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { fetchProjectById, currentProject } = useProjectStore();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    fetchProjectById(projectId);

    // Load old messages
    api.get('/chat/' + projectId + '/messages').then(({ data }) => {
      setMessages(data.messages);
    });

    // Connect socket
    const socket = io('http://localhost:5000', {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_project', projectId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('user_typing', ({ name, isTyping }) => {
      if (name === user.name) return;
      setTypingUser(isTyping ? name : '');
    });

    return () => {
      socket.emit('leave_project', projectId);
      socket.disconnect();
    };
  }, [projectId]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !connected) return;
    socketRef.current.emit('send_message', { projectId, text: text.trim() });
    setText('');
    socketRef.current.emit('typing', { projectId, isTyping: false });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socketRef.current) return;
    socketRef.current.emit('typing', { projectId, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing', { projectId, isTyping: false });
    }, 1500);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{
          height: 60, background: 'white', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0,
        }}>
          <button className="btn-icon" onClick={() => navigate('/projects/' + projectId)}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              💬 {currentProject?.name || 'Project'} — Team Chat
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {currentProject?.members?.length || 0} members
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            {connected
              ? <><Wifi size={14} color="#10b981" /><span style={{ color: '#10b981' }}>Connected</span></>
              : <><WifiOff size={14} color="#ef4444" /><span style={{ color: '#ef4444' }}>Disconnected</span></>}
          </div>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f8fafc' }}>
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date divider */}
              <div style={{ textAlign: 'center', margin: '16px 0 12px' }}>
                <span style={{ background: '#e2e8f0', color: 'var(--text-muted)', fontSize: 11, padding: '3px 12px', borderRadius: 999, fontWeight: 600 }}>
                  {date}
                </span>
              </div>

              {msgs.map((msg, i) => {
                const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                const prevMsg = msgs[i - 1];
                const showAvatar = !prevMsg || prevMsg.sender?._id !== msg.sender?._id;

                return (
                  <div key={msg._id} style={{
                    display: 'flex',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 8,
                    marginBottom: 6,
                  }}>
                    {/* Avatar */}
                    {!isMe && (
                      <div style={{ width: 32, flexShrink: 0 }}>
                        {showAvatar && (
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: 13, background: '#6366f1' }}>
                            {msg.sender?.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ maxWidth: '65%' }}>
                      {/* Sender name */}
                      {!isMe && showAvatar && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3, marginLeft: 4 }}>
                          {msg.sender?.name}
                        </div>
                      )}

                      {/* Bubble */}
                      <div style={{
                        background: isMe ? 'var(--primary)' : 'white',
                        color: isMe ? 'white' : 'var(--text)',
                        padding: '10px 14px',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        fontSize: 14, lineHeight: 1.5,
                        boxShadow: 'var(--shadow)',
                        wordBreak: 'break-word',
                      }}>
                        {msg.text}
                      </div>

                      {/* Time */}
                      <div style={{
                        fontSize: 10, color: 'var(--text-muted)',
                        marginTop: 3,
                        textAlign: isMe ? 'right' : 'left',
                        marginLeft: isMe ? 0 : 4,
                      }}>
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Typing indicator */}
          {typingUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: '#6366f1' }}>
                {typingUser[0]}
              </div>
              <div style={{ background: 'white', padding: '8px 14px', borderRadius: '18px 18px 18px 4px', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 7, height: 7, borderRadius: '50%', background: '#94a3b8',
                      animation: 'bounce 1.2s infinite',
                      animationDelay: i * 0.2 + 's',
                      display: 'inline-block',
                    }} />
                  ))}
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{typingUser} is typing...</span>
            </div>
          )}

          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <h3 style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No messages yet</h3>
              <p>Start the conversation with your team!</p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: '12px 20px', background: 'white',
          borderTop: '1px solid var(--border)', flexShrink: 0,
        }}>
          {!connected && (
            <div style={{ textAlign: 'center', color: '#ef4444', fontSize: 12, marginBottom: 8 }}>
              ⚠️ Server se connect nahi — messages send nahi honge
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              value={text}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Message likho... (Enter = send, Shift+Enter = new line)"
              rows={1}
              disabled={!connected}
              style={{
                flex: 1, padding: '10px 14px', border: '1px solid var(--border)',
                borderRadius: 22, resize: 'none', outline: 'none',
                fontFamily: 'inherit', fontSize: 14,
                maxHeight: 100, lineHeight: 1.5,
                background: connected ? 'white' : '#f8fafc',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim() || !connected}
              style={{
                width: 42, height: 42, borderRadius: '50%', border: 'none',
                background: text.trim() && connected ? 'var(--primary)' : '#e2e8f0',
                color: text.trim() && connected ? 'white' : '#94a3b8',
                cursor: text.trim() && connected ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s',
              }}>
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
