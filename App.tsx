
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import { Menu, X, ChevronRight, MessageCircle, Send, ArrowRight, LogIn, LogOut, Plus, Trash2, ShieldCheck, FileText, ThumbsUp, RotateCcw, Search, Edit3, Megaphone, Mail, User as UserIcon, Bell, AlertCircle, Eye, Instagram, Camera, MailCheck, Gavel, Check, Ban, Calendar as CalIcon, AlertTriangle, ExternalLink, UserPlus, Clock, ClipboardCheck, XCircle, Info, Type, Bold, Italic, Palette, Maximize, Landmark, Users, MessageSquare, Award, Star, UserCheck } from 'lucide-react';
import { NAV_ITEMS, DUMMY_NOTICES, DUMMY_PETITIONS, EXECUTIVE_NOTICES, DEPARTMENTS } from './constants';
import { Button, Card, Badge, SectionTitle } from './components/KRDS_Components';
import { getAIResponse } from './services/geminiService';
import { ChatMessage, User, UserRole, Notice, Petition, Comment, Message, PetitionStatus, Appeal, CalendarEvent, RegistrationRequest, RegistrationStatus, Department, DepartmentInfo } from './types';

// --- Profanity Filter ---
const PROFANITY_LIST = ['시발', '씨발', '개새끼', '병신', '존나', '미친', '닥쳐', '지랄', '엠창', '한남', '김치녀', '니애미', '섹스', '호로', '쓰레기'];
const filterProfanity = (text: string): string => {
  let filtered = text;
  PROFANITY_LIST.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  return filtered;
};

// --- Rich Text Helper ---
const RichTextToolbar = ({ onApply }: { onApply: (tag: string, style?: string) => void }) => {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-slate-900 border-b border-slate-800 rounded-t-xl sticky top-0 z-10">
      <button type="button" onClick={() => onApply('b')} className="p-2 hover:bg-slate-800 rounded text-slate-300" title="굵게"><Bold size={18}/></button>
      <button type="button" onClick={() => onApply('i')} className="p-2 hover:bg-slate-800 rounded text-slate-300" title="기울기"><Italic size={18}/></button>
      <div className="h-6 w-px bg-slate-800 mx-1 self-center" />
      <button type="button" onClick={() => onApply('span', 'font-size: 24px')} className="px-2 py-1 hover:bg-slate-800 rounded text-slate-300 text-xs font-bold" title="크게">Large</button>
      <button type="button" onClick={() => onApply('span', 'font-size: 14px')} className="px-2 py-1 hover:bg-slate-800 rounded text-slate-300 text-xs font-bold" title="작게">Small</button>
      <div className="h-6 w-px bg-slate-800 mx-1 self-center" />
      <button type="button" onClick={() => onApply('span', 'color: #22c55e')} className="p-2 hover:bg-slate-800 rounded text-green-500" title="초록색"><Palette size={18}/></button>
      <button type="button" onClick={() => onApply('span', 'color: #ef4444')} className="p-2 hover:bg-slate-800 rounded text-red-500" title="빨간색"><Palette size={18}/></button>
      <button type="button" onClick={() => onApply('span', 'color: #3b82f6')} className="p-2 hover:bg-slate-800 rounded text-blue-500" title="파란색"><Palette size={18}/></button>
    </div>
  );
};

// --- Auth Utilities ---
const MOCK_ADMIN: User = { 
  id: 'admin-0', 
  username: 'admin', 
  name: '시스템관리자', 
  role: 'admin', 
  password: 'admin1234', 
  penaltyPoints: 0, 
  appeals: [] 
};

const getStoredUsers = (): User[] => {
  const users = localStorage.getItem('kumssc_users');
  return users ? JSON.parse(users) : [MOCK_ADMIN];
};

const saveUsers = (users: User[]) => localStorage.setItem('kumssc_users', JSON.stringify(users));

const getCurrentUser = (): User | null => {
  const user = localStorage.getItem('kumssc_session');
  return user ? JSON.parse(user) : null;
};

const useStore = <T,>(key: string, initialData: T): [T, (data: T) => void] => {
  const [data, setData] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialData;
  });
  const updateData = (newData: T) => {
    setData(newData);
    localStorage.setItem(key, JSON.stringify(newData));
  };
  return [data, updateData];
};

const LogoImage = ({ className = "" }: { className?: string }) => {
  const userLogoUrl = "https://img.notionusercontent.com/s3/prod-files-secure%2Fcc4be097-7e73-44d1-8053-ebcbf1099d63%2F3e77b606-6fb4-4d1b-9de2-a2af0085708f%2F%ED%95%99%EC%83%9D%ED%9A%8C_%EC%9B%8C%ED%84%B0%EB%A7%88%ED%81%AC.png/size/w=1420?exp=1770546639&sig=MdG4xHXSbvqZ37qVRFu3m4wb7Ym71GCsZeXINfp2DT4&id=3006e84c-9f8b-80ce-a069-f26edceed829&table=block";
  return <img src={userLogoUrl} className={`${className} object-contain brightness-0 invert`} alt="Logo" />;
};

// --- SIGNUP PAGE ---
const SignupPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useStore<RegistrationRequest[]>('kumssc_registration_requests', []);
  const [formData, setFormData] = useState({ studentId: '', name: '', username: '', password: '', confirmPassword: '', email: '' });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return alert('비밀번호가 일치하지 않습니다.');
    const newRequest: RegistrationRequest = { id: Date.now().toString(), studentId: formData.studentId, name: formData.name, username: formData.username, password: formData.password, email: formData.email, status: 'pending', createdAt: new Date().toISOString() };
    setRequests([newRequest, ...requests]);
    alert('가입 신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.');
    navigate('/login');
  };
  return (
    <div className="max-w-xl mx-auto py-10 px-4 animate-in fade-in duration-700">
      <SectionTitle title="학생 등록" subtitle="KUMSSC 포털 이용을 위해 학생 정보를 입력해주세요." />
      <Card className="p-10 bg-slate-900 border-slate-800 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-500 mb-2">학번 (5자리)</label><input name="studentId" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-green-500 outline-none" placeholder="예: 20517" onChange={handleChange} required maxLength={5} /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-2">성명</label><input name="name" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-green-500 outline-none" placeholder="실명을 입력하세요" onChange={handleChange} required /></div>
          </div>
          <div><label className="block text-xs font-bold text-slate-500 mb-2">희망 아이디</label><input name="username" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-green-500 outline-none" placeholder="로그인에 사용할 아이디" onChange={handleChange} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-500 mb-2">비밀번호</label><input name="password" type="password" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-green-500 outline-none" placeholder="비밀번호" onChange={handleChange} required /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-2">비밀번호 확인</label><input name="confirmPassword" type="password" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-green-500 outline-none" placeholder="비밀번호 재입력" onChange={handleChange} required /></div>
          </div>
          <div><label className="block text-xs font-bold text-slate-500 mb-2">학교 공식 계정 (Email)</label><input name="email" type="email" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-green-500 outline-none" placeholder="id@konkuk.ac.kr" onChange={handleChange} required /></div>
          <Button type="submit" className="w-full py-5 text-xl rounded-2xl shadow-green-900/40 mt-4">확인 및 가입 신청</Button>
        </form>
      </Card>
    </div>
  );
};

// --- ADMIN PAGE ---
const AdminPage = ({ currentUser }: { currentUser: User | null }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('requests');
  const [users, setUsers] = useStore<User[]>('kumssc_users', [MOCK_ADMIN]);
  const [requests, setRequests] = useStore<RegistrationRequest[]>('kumssc_registration_requests', []);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleUpdateRole = (userId: string, role: UserRole) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
  };

  const handleUpdateDepartment = (userId: string, dept: Department | undefined) => {
    setUsers(users.map(u => u.id === userId ? { ...u, department: dept } : u));
  };

  const handleUpdatePosition = (userId: string, position: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, position } : u));
  };

  const handleProcessRequest = (reqId: string, action: 'approved' | 'hold' | 'rejected') => {
    const request = requests.find(r => r.id === reqId);
    if (!request) return;
    let reason = '';
    if (action === 'hold' || action === 'rejected') { reason = prompt(`${action === 'hold' ? '보류' : '반려'} 사유를 입력해주세요:`) || ''; if (!reason) return alert('사유를 입력해야 합니다.'); }
    if (action === 'approved') {
      const newUser: User = { id: `user-${Date.now()}`, username: request.username, name: request.name, password: request.password, role: 'student', studentId: request.studentId, grade: parseInt(request.studentId.substring(0, 1)), class: parseInt(request.studentId.substring(1, 3)), number: parseInt(request.studentId.substring(3, 5)), email: request.email, penaltyPoints: 0, appeals: [] };
      setUsers([...users, newUser]);
    }
    const updatedRequests = requests.map(r => r.id === reqId ? { ...r, status: action as RegistrationStatus, reason } : r);
    setRequests(updatedRequests);
    alert(`신청건이 ${action === 'approved' ? '승인' : action === 'hold' ? '보류' : '반려'} 처리되었습니다.`);
  };
  return (
    <div className="max-w-6xl mx-auto space-y-10 px-4">
      <div className="flex justify-between items-end"><SectionTitle title="관리자 센터" subtitle="사용자 및 가입 신청을 관리합니다." /><div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800"><button onClick={() => setActiveTab('requests')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'requests' ? 'bg-green-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>가입 신청 ({requests.filter(r => r.status === 'pending').length})</button><button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-green-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>전체 사용자</button></div></div>
      {activeTab === 'requests' ? (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm"><thead className="bg-slate-800/50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-800"><tr><th className="p-5">일시</th><th className="p-5">학번/성명</th><th className="p-5">아이디/이메일</th><th className="p-5">상태</th><th className="p-5 text-center">조치</th></tr></thead>
            <tbody className="divide-y divide-slate-800 text-slate-100">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/20"><td className="p-5 text-slate-500 font-mono">{new Date(r.createdAt).toLocaleDateString()}</td><td className="p-5"><p className="font-black">{r.name}</p><p className="text-xs text-slate-500">{r.studentId}</p></td><td className="p-5"><p className="font-bold">{r.username}</p><p className="text-xs text-slate-500">{r.email}</p></td><td className="p-5"><Badge variant={r.status === 'pending' ? 'gray' : r.status === 'approved' ? 'green' : r.status === 'hold' ? 'blue' : 'red'}>{r.status === 'pending' ? '승인 대기' : r.status === 'approved' ? '승인됨' : r.status === 'hold' ? '보류' : '반려'}</Badge>{r.reason && <p className="text-[10px] text-red-400 mt-1 max-w-[150px] truncate">{r.reason}</p>}</td><td className="p-5 text-center">{r.status === 'pending' && <div className="flex justify-center gap-2"><button onClick={() => handleProcessRequest(r.id, 'approved')} className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded-lg transition-all" title="승인"><Check size={18}/></button><button onClick={() => handleProcessRequest(r.id, 'hold')} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all" title="보류"><Clock size={18}/></button><button onClick={() => handleProcessRequest(r.id, 'rejected')} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="반려"><Ban size={18}/></button></div>}</td></tr>
              ))}
              {requests.length === 0 && <tr><td colSpan={5} className="p-20 text-center text-slate-700 font-bold">새로운 가입 신청이 없습니다.</td></tr>}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden shadow-2xl"><div className="p-5 border-b border-slate-800 flex gap-4"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18}/><input className="w-full pl-12 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white" placeholder="이름 또는 학번 검색" value={search} onChange={e => setSearch(e.target.value)} /></div></div><table className="w-full text-left text-sm"><thead className="bg-slate-800/50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-800"><tr><th className="p-5">학번</th><th className="p-5">이름</th><th className="p-5">역할 및 부서</th><th className="p-5">직급</th><th className="p-5 text-center">조회</th></tr></thead><tbody className="divide-y divide-slate-800 text-slate-100">{users.filter(u => u.name.includes(search) || u.studentId?.includes(search)).map(u => (<tr key={u.id} className="hover:bg-slate-800/20">
          <td className="p-5 font-mono text-slate-500">{u.studentId || '-'}</td>
          <td className="p-5 font-black">{u.name}</td>
          <td className="p-5 space-y-2">
            <select className="bg-slate-950 border border-slate-800 text-[10px] font-black rounded p-1 text-slate-400 outline-none" value={u.role} onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}>
              <option value="student">학생</option>
              <option value="executive">임원</option>
              <option value="teacher">교사</option>
              <option value="admin">관리자</option>
            </select>
            {u.role === 'executive' && (
              <select className="bg-slate-950 border border-slate-800 text-[10px] font-black rounded p-1 text-green-400 outline-none block" value={u.department || ''} onChange={(e) => handleUpdateDepartment(u.id, e.target.value as Department || undefined)}>
                <option value="">부서 미지정</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
          </td>
          <td className="p-5">
            {u.role === 'executive' ? (
              <select className="bg-slate-950 border border-slate-800 text-[10px] font-black rounded p-1 text-slate-400 outline-none" value={u.position || ''} onChange={(e) => handleUpdatePosition(u.id, e.target.value)}>
                <option value="">미정</option>
                {u.department === '회장부' ? (
                  <>
                    <option value="회장">회장</option>
                    <option value="부회장">부회장</option>
                  </>
                ) : (
                  <>
                    <option value="부장">부장</option>
                    <option value="차장">차장</option>
                    <option value="부원">부원</option>
                  </>
                )}
              </select>
            ) : '-'}
          </td>
          <td className="p-5 text-center"><button onClick={() => setSelectedUser(u)} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"><Eye size={18}/></button></td></tr>))}</tbody></table></Card>
      )}
      {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
};

// --- LOGIN PAGE ---
const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getStoredUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) { localStorage.setItem('kumssc_session', JSON.stringify(user)); onLogin(user); navigate('/'); }
    else {
      const requests: RegistrationRequest[] = JSON.parse(localStorage.getItem('kumssc_registration_requests') || '[]');
      const myRequest = requests.find(r => r.username === username && r.password === password);
      if (myRequest) {
        if (myRequest.status === 'pending') alert('승인 대기 중입니다. 잠시만 기다려주세요.');
        else if (myRequest.status === 'hold') alert(`보류 상태입니다.\n사유: ${myRequest.reason}`);
        else if (myRequest.status === 'rejected') alert(`가입이 반려되었습니다.\n사유: ${myRequest.reason}`);
      } else alert('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  };
  return (
    <div className="max-w-md mx-auto py-20 px-4 animate-in zoom-in duration-500">
      <Card className="p-12 bg-slate-900 border-slate-800 shadow-2xl text-center"><LogoImage className="w-20 h-20 mx-auto mb-10" /><h2 className="text-3xl font-black text-white mb-10 tracking-tighter">KUMSSC 로그인</h2><form onSubmit={handleLogin} className="space-y-6"><input className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-green-500 transition-all" placeholder="아이디" value={username} onChange={e => setUsername(e.target.value)} required /><input className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-green-500 transition-all" type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} required /><Button type="submit" className="w-full py-5 text-xl rounded-2xl mt-4">로그인하기</Button></form><div className="mt-10 flex flex-col gap-4"><p className="text-xs text-slate-500 font-bold">아직 계정이 없으신가요?</p><Link to="/signup"><Button variant="outline" className="w-full py-3 rounded-xl gap-2"><UserPlus size={18}/> 학생 등록 신청</Button></Link></div></Card>
    </div>
  );
};

// --- PAGES ---

const CouncilPage = ({ currentUser }: { currentUser: User | null }) => {
  const [users, setUsers] = useStore<User[]>('kumssc_users', [MOCK_ADMIN]);
  const [deptInfos, setDeptInfos] = useStore<DepartmentInfo[]>('kumssc_department_info', []);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editingUserBio, setEditingUserBio] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');

  const executiveMembers = users.filter(u => u.role === 'executive');

  const handleSaveDeptDesc = () => {
    if (!editingDept) return;
    const existing = deptInfos.find(di => di.name === editingDept);
    const updated: DepartmentInfo = {
      name: editingDept,
      description: editDesc,
      updatedAt: new Date().toISOString()
    };
    if (existing) {
      setDeptInfos(deptInfos.map(di => di.name === editingDept ? updated : di));
    } else {
      setDeptInfos([...deptInfos, updated]);
    }
    setEditingDept(null);
    alert('부서 소개가 저장되었습니다.');
  };

  const handleSaveUserBio = (userId: string) => {
    if (editingUserBio === null) return;
    const updatedUsers = users.map(u => u.id === userId ? { ...u, bio: editingUserBio } : u);
    setUsers(updatedUsers);
    
    // 세션 정보도 업데이트
    if (currentUser?.id === userId) {
      const updatedSession = { ...currentUser, bio: editingUserBio };
      localStorage.setItem('kumssc_session', JSON.stringify(updatedSession));
    }
    
    setEditingUserBio(null);
    alert('소개가 저장되었습니다.');
  };

  const startEditingDept = (dept: Department, currentDesc: string) => {
    setEditingDept(dept);
    setEditDesc(currentDesc);
  };
  
  const presidentOffice = executiveMembers.filter(u => u.department === '회장부').sort((a, b) => {
    const ranks: any = { '회장': 1, '부회장': 2 };
    return (ranks[a.position || ''] || 3) - (ranks[b.position || ''] || 3);
  });

  const otherDepts = DEPARTMENTS.filter(d => d !== '회장부');

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-24 pb-20">
      <div className="text-center animate-in fade-in slide-in-from-top-12 duration-1000">
        <SectionTitle title="학생회 조직도" subtitle="건대부중 학생을 위해 헌신하는 학생자치기구의 구조를 안내합니다." />
      </div>
      
      {/* Level 0: 전체 학생 (자치권의 주체) */}
      <div className="flex flex-col items-center gap-8">
        <div className="p-8 md:p-12 bg-gradient-to-br from-green-500/20 to-blue-500/20 border-2 border-green-500/30 rounded-[3rem] shadow-2xl text-center max-w-2xl w-full relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Users size={64} className="mx-auto mb-6 text-green-400" />
          <h2 className="text-4xl font-black text-white mb-4">건국대학교 사대부중 학생</h2>
          <p className="text-slate-400 font-bold leading-relaxed">
            건대부중의 모든 권력은 학생으로부터 나옵니다.<br/>
            학생자치회는 학생 여러분의 목소리를 대변하고 더 나은 학교를 만듭니다.
          </p>
          <div className="w-1 h-12 bg-gradient-to-b from-green-500/50 to-transparent mx-auto mt-8"></div>
        </div>
      </div>

      {/* Level 1: 회장부 (회장 & 부회장) */}
      <div className="space-y-12">
        <div className="flex items-center gap-4 justify-center">
          <div className="h-px bg-slate-800 flex-1"></div>
          <h3 className="text-2xl font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
             <Star size={24} className="text-yellow-500" /> 회장부 (Council Board)
          </h3>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {['회장', '부회장'].map(pos => {
            const member = presidentOffice.find(m => m.position === pos);
            const isMe = currentUser?.id === member?.id;
            
            return (
              <Card key={pos} className={`p-10 bg-slate-900 border-slate-800 shadow-2xl border-t-4 ${pos === '회장' ? 'border-t-yellow-500' : 'border-t-blue-500'} relative overflow-hidden group`}>
                {member ? (
                  <>
                    <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-3xl bg-slate-800 overflow-hidden border-2 border-slate-700 shadow-xl group-hover:border-green-500 transition-all">
                          {member.profileImage ? <img src={member.profileImage} className="w-full h-full object-cover" /> : <UserIcon size={48} className="mx-auto mt-10 text-slate-600" />}
                        </div>
                        <Badge variant={pos === '회장' ? 'green' : 'blue'} className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 shadow-lg">
                          {pos}
                        </Badge>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-3xl font-black text-white">{member.name}</h4>
                            <p className="text-slate-500 font-mono text-sm">{member.studentId}</p>
                          </div>
                          {isMe && editingUserBio === null && (
                            <button onClick={() => setEditingUserBio(member.bio || '')} className="p-2 text-slate-600 hover:text-green-400 transition-colors">
                              <Edit3 size={18} />
                            </button>
                          )}
                        </div>
                        
                        <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800/50 min-h-[120px]">
                          {editingUserBio !== null && isMe ? (
                            <div className="space-y-4">
                              <textarea 
                                className="w-full bg-transparent text-slate-300 text-sm outline-none leading-relaxed min-h-[100px]"
                                value={editingUserBio}
                                onChange={e => setEditingUserBio(e.target.value)}
                                placeholder={`${pos}으로서의 포부나 소감을 적어주세요...`}
                              />
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setEditingUserBio(null)}>취소</Button>
                                <Button size="sm" onClick={() => handleSaveUserBio(member.id)}>저장</Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap italic font-medium">
                              {member.bio || `아직 등록된 ${pos}의 소개글이 없습니다.`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <UserCheck size={48} className="mx-auto text-slate-800" />
                    <p className="text-slate-700 font-black text-xl">{pos} 미선출</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Level 2: 일반 부서 (Grid) */}
      <div className="space-y-12">
        <div className="flex items-center gap-4 justify-center">
          <div className="h-px bg-slate-800 flex-1"></div>
          <h3 className="text-2xl font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
             <Landmark size={24} className="text-green-500" /> 자치 기구 부서 (Departments)
          </h3>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherDepts.map(dept => {
            const deptMembers = executiveMembers.filter(u => u.department === dept).sort((a, b) => {
              const ranks: any = { '부장': 1, '차장': 2, '부원': 3 };
              return (ranks[a.position || '부원'] || 4) - (ranks[b.position || '부원'] || 4);
            });
            const info = deptInfos.find(di => di.name === dept);
            const isDeptHead = currentUser?.role === 'executive' && currentUser?.department === dept && currentUser?.position === '부장';
            
            return (
              <Card key={dept} className="p-8 bg-slate-900 border-slate-800 shadow-xl border-l-4 border-l-green-500 group flex flex-col hover:bg-slate-800/50 transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="text-green-500 group-hover:scale-110 transition-transform" size={24} />
                  <h3 className="text-xl font-black text-white">{dept}</h3>
                  <Badge variant="gray" className="ml-auto">{deptMembers.length}명</Badge>
                </div>

                {/* 부서 소개 섹션 */}
                <div className="mb-8 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50 min-h-[80px] relative">
                  {editingDept === dept ? (
                    <div className="space-y-3">
                      <textarea 
                        className="w-full bg-transparent text-sm text-slate-300 outline-none border-b border-green-500/50 min-h-[100px]"
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        placeholder="부서 활동 및 소개를 입력하세요..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingDept(null)}>취소</Button>
                        <Button size="sm" onClick={handleSaveDeptDesc}>저장</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-400 leading-relaxed italic">
                        {info?.description || "등록된 부서 소개가 없습니다."}
                      </p>
                      {isDeptHead && (
                        <button 
                          onClick={() => startEditingDept(dept, info?.description || '')}
                          className="absolute top-2 right-2 p-1 text-slate-600 hover:text-green-400 transition-colors"
                          title="소개글 수정"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
                
                <div className="space-y-3 flex-1">
                  {deptMembers.length > 0 ? (
                    deptMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-green-500/50 cursor-pointer transition-all" onClick={() => setSelectedUser(member)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                            {member.profileImage ? <img src={member.profileImage} className="w-full h-full object-cover" /> : <UserIcon size={14} className="text-slate-600" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-200 text-sm">{member.name}</span>
                            <p className="text-[9px] text-slate-600 font-mono leading-none">{member.studentId}</p>
                          </div>
                        </div>
                        {member.position && (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                            member.position === '부장' ? 'border-green-500/50 text-green-400 bg-green-500/5' : 
                            member.position === '차장' ? 'border-blue-500/50 text-blue-400 bg-blue-500/5' : 
                            'border-slate-800 text-slate-500'
                          }`}>
                            {member.position}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-700 font-bold text-center py-4 border border-dashed border-slate-800 rounded-xl italic">구성원이 없습니다.</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      
      {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
};

const MessagesPage = ({ user }: { user: User | null }) => {
  const [messages, setMessages] = useStore<Message[]>('kumssc_messages', []);
  const [newMessage, setNewMessage] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [users] = useStore<User[]>('kumssc_users', [MOCK_ADMIN]);
  
  if (!user) return <Navigate to="/login" />;

  const isTeacher = user.role === 'teacher';
  const userMessages = messages.filter(m => m.receiverId === user.id || m.senderId === user.id);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTeacher) {
      alert('쪽지 발송 권한이 없습니다. (교사용 기능)');
      return;
    }
    const receiver = users.find(u => u.id === receiverId || u.username === receiverId || u.studentId === receiverId);
    if (!receiver) return alert('수신자를 찾을 수 없습니다.');
    const msg: Message = { 
      id: Date.now().toString(), 
      senderId: user.id, 
      senderName: user.name, 
      receiverId: receiver.id, 
      receiverName: receiver.name, 
      content: filterProfanity(newMessage), 
      createdAt: new Date().toISOString(), 
      isRead: false 
    };
    setMessages([msg, ...messages]); 
    setNewMessage(''); 
    setReceiverId(''); 
    alert('쪽지를 보냈습니다.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-10">
      <SectionTitle 
        title="쪽지함" 
        subtitle={isTeacher ? "학생 및 교직원에게 쪽지를 보낼 수 있습니다." : "선생님께서 보내신 쪽지를 확인하고 관리합니다."} 
      />
      
      {isTeacher && (
        <Card className="p-8 bg-slate-900 border-slate-800 shadow-xl border-green-500/20">
          <div className="flex items-center gap-2 mb-6">
            <Send size={20} className="text-green-500" />
            <h3 className="text-xl font-black text-white">새 쪽지 작성</h3>
            <Badge variant="green" className="ml-2">교사 전용</Badge>
          </div>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <input 
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-green-500 transition-all" 
              placeholder="수신자 아이디 또는 학번을 입력하세요" 
              value={receiverId} 
              onChange={e => setReceiverId(e.target.value)} 
              required 
            />
            <textarea 
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white min-h-[120px] outline-none focus:border-green-500 transition-all leading-relaxed" 
              placeholder="전달하실 내용을 입력하세요" 
              value={newMessage} 
              onChange={e => setNewMessage(e.target.value)} 
              required 
            />
            <Button type="submit" className="w-full py-4 text-lg rounded-xl shadow-green-900/20">쪽지 발송하기</Button>
          </form>
        </Card>
      )}

      {!isTeacher && userMessages.length === 0 && (
        <Card className="p-20 text-center bg-slate-900/50 border-slate-800 border-dashed">
          <Mail size={48} className="mx-auto mb-6 text-slate-700" />
          <p className="text-slate-500 font-bold">도착한 쪽지가 없습니다.</p>
        </Card>
      )}

      <div className="space-y-4">
        {userMessages.map(m => (
          <Card key={m.id} className={`p-6 bg-slate-900 border-slate-800 hover:bg-slate-800/50 transition-all ${m.senderId === user.id ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-blue-500'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${m.senderId === user.id ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {m.senderName.charAt(0)}
                </div>
                <div>
                  <span className="font-black text-slate-100 text-sm">{m.senderId === user.id ? `To. ${m.receiverName}` : `From. ${m.senderName}`}</span>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{m.senderId === user.id ? 'Outgoing Message' : 'Incoming Message'}</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-bold font-mono">{new Date(m.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-slate-300 text-base whitespace-pre-wrap leading-relaxed pl-10">{m.content}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

const CalendarPage = ({ user }: { user: User | null }) => {
  const [events, setEvents] = useStore<CalendarEvent[]>('kumssc_calendar', []);
  const [isWriteMode, setIsWriteMode] = useState(false);
  const [formData, setFormData] = useState({ title: '', date: '', category: '학사' as any, description: '' });
  const canManage = user && (user.role === 'teacher' || user.role === 'admin' || user.role === 'executive');
  const handleAddEvent = (e: React.FormEvent) => { e.preventDefault(); if (!user) return; const newEvent: CalendarEvent = { id: Date.now().toString(), ...formData, authorId: user.id }; setEvents([...events, newEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())); setIsWriteMode(false); setFormData({ title: '', date: '', category: '학사', description: '' }); };
  return (
    <div className="max-w-4xl mx-auto px-4"><div className="flex justify-between items-end mb-10"><SectionTitle title="학사 일정" subtitle="학교의 주요 일정을 확인하세요." />{canManage && <Button onClick={() => setIsWriteMode(!isWriteMode)}>{isWriteMode ? '취소' : '일정 등록'}</Button>}</div>{isWriteMode && <Card className="p-8 mb-10 bg-slate-900 border-slate-800"><form onSubmit={handleAddEvent} className="space-y-4"><div className="grid grid-cols-2 gap-4"><input className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-white" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required /><select className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-white" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}><option>학사</option><option>행사</option><option>시험</option><option>공휴일</option></select></div><input className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white" placeholder="일정 제목" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /><textarea className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white" placeholder="설명" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /><Button type="submit" className="w-full py-4">등록</Button></form></Card>}<div className="space-y-4">{events.map(e => <Card key={e.id} className="p-6 bg-slate-900 border-slate-800 flex items-center gap-8 group"><div className="text-center min-w-[60px]"><p className="text-2xl font-black text-green-400">{e.date.split('-')[2]}</p><p className="text-[10px] text-slate-500 font-bold uppercase">{e.date.split('-')[1]}월</p></div><div className="flex-1"><div className="flex items-center gap-2 mb-1"><Badge variant={e.category === '시험' ? 'red' : 'green'}>{e.category}</Badge><h4 className="font-black text-white">{e.title}</h4></div><p className="text-slate-400 text-sm">{e.description}</p></div></Card>)}</div></div>
  );
};

const ProfilePage = ({ user, onUpdate }: { user: User, onUpdate: (user: User) => void }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [insta, setInsta] = useState(user.instagramId || '');
  const [gender, setGender] = useState<'male' | 'female'>(user.gender || 'male');
  const [profileImg, setProfileImg] = useState(user.profileImage || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleSave = () => { const users = getStoredUsers(); const updatedUser = { ...user, bio, instagramId: insta, profileImage: profileImg, gender }; saveUsers(users.map(u => u.id === user.id ? updatedUser : u)); localStorage.setItem('kumssc_session', JSON.stringify(updatedUser)); onUpdate(updatedUser); alert('프로필이 저장되었습니다.'); };
  return (
    <div className="max-w-2xl mx-auto px-4 space-y-10"><SectionTitle title="내 프로필" subtitle="정보를 최신으로 유지하세요." /><Card className="p-10 bg-slate-900 border-slate-800 text-center"><div className="relative inline-block mb-8"><div className="w-32 h-32 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border-4 border-slate-700">{profileImg ? <img src={profileImg} className="w-full h-full object-cover" /> : <UserIcon size={48} className="text-slate-600" />}</div><button onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 p-2 bg-green-500 rounded-full text-white"><Camera size={18}/></button><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => { const reader = new FileReader(); reader.onload = () => setProfileImg(reader.result as string); if (e.target.files?.[0]) reader.readAsDataURL(e.target.files[0]); }} /></div><div className="grid gap-6 text-left"><div><label className="text-xs font-bold text-slate-500">성별</label><div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 mt-2"><button onClick={() => setGender('male')} className={`flex-1 py-2 text-sm font-bold rounded-md ${gender === 'male' ? 'bg-green-500 text-white' : 'text-slate-500'}`}>남</button><button onClick={() => setGender('female')} className={`flex-1 py-2 text-sm font-bold rounded-md ${gender === 'female' ? 'bg-green-500 text-white' : 'text-slate-500'}`}>여</button></div></div><input className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none" placeholder="자기소개" value={bio} onChange={e => setBio(e.target.value)} /><input className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none" placeholder="Instagram ID" value={insta} onChange={e => setInsta(e.target.value)} /><Button onClick={handleSave} className="w-full py-4">저장하기</Button></div></Card></div>
  );
};

const UserDetailModal = ({ user, onClose }: { user: User, onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
    <Card className="max-w-md w-full p-8 bg-slate-900 border-slate-800 relative shadow-2xl">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
      <div className="text-center mb-8">
        <div className="w-24 h-24 rounded-full bg-slate-800 m-auto mb-4 overflow-hidden border-4 border-slate-700">
          {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <UserIcon size={40} className="m-auto mt-4 text-slate-600"/>}
        </div>
        <h2 className="text-2xl font-black text-white">{user.name}</h2>
        <div className="flex flex-col items-center gap-1 mt-1">
          <p className="text-green-400 font-bold text-sm">{user.studentId || user.role}</p>
          <div className="flex gap-2">
            {user.department && <Badge variant="blue" className="text-[10px]">{user.department}</Badge>}
            {user.position && <Badge variant="gray" className="text-[10px]">{user.position}</Badge>}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
          <p className="text-xs text-slate-500 font-bold uppercase mb-2">자기소개</p>
          <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{user.bio || '자기소개가 없습니다.'}</div>
        </div>
        <div className="flex gap-2">
          <Badge variant="gray">{user.gender === 'male' ? '남성' : '여성'}</Badge>
          <Badge variant="red">벌점 {user.penaltyPoints}점</Badge>
          {user.instagramId && (
            <a href={`https://instagram.com/${user.instagramId}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black border border-pink-500/20 bg-pink-500/10 text-pink-500 rounded-md hover:bg-pink-500 hover:text-white transition-all">
              <Instagram size={10} /> {user.instagramId}
            </a>
          )}
        </div>
      </div>
    </Card>
  </div>
);

// --- UPDATED CREATE/DETAIL PAGES WITH FORMATTING ---

const CreateNoticePage = ({ user }: { user: User | null }) => {
  const navigate = useNavigate();
  const [notices, setNotices] = useStore<Notice[]>('kumssc_notices', []);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isExecutiveOnly, setIsExecutiveOnly] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (tag: string, style?: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    const before = content.substring(0, start);
    const after = content.substring(end);
    
    let formattedText = '';
    if (tag === 'span' && style) formattedText = `<${tag} style="${style}">${selectedText || '텍스트'}</${tag}>`;
    else formattedText = `<${tag}>${selectedText || '텍스트'}</${tag}>`;
    
    setContent(before + formattedText + after);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const newNotice: Notice = { id: Date.now(), title, content, author: user.name, date: new Date().toISOString().split('T')[0], category: '공지', isExecutiveOnly, comments: [] };
    setNotices([newNotice, ...notices]);
    navigate(isExecutiveOnly ? '/executive-board' : '/notices');
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <SectionTitle title="공지사항 작성" subtitle="디자인 도구를 사용하여 중요한 내용을 강조하세요." />
      <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-visible">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <input className="w-full p-6 bg-slate-900 border-b border-slate-800 text-2xl font-black text-white outline-none focus:bg-slate-800 transition-all" placeholder="제목을 입력하세요" value={title} onChange={e => setTitle(e.target.value)} required />
          <RichTextToolbar onApply={applyFormatting} />
          <textarea ref={textareaRef} className="w-full p-8 bg-slate-950 text-slate-300 min-h-[500px] outline-none font-mono text-sm leading-relaxed" placeholder="내용을 입력하세요. 상단 도구를 사용하여 스타일을 입힐 수 있습니다." value={content} onChange={e => setContent(e.target.value)} required />
          <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="exec-only" checked={isExecutiveOnly} onChange={e => setIsExecutiveOnly(e.target.checked)} className="w-5 h-5 accent-green-500" />
              <label htmlFor="exec-only" className="text-sm font-bold text-slate-400">임원 전용 게시물</label>
            </div>
            <Button type="submit" size="lg" className="rounded-xl">공지사항 게시</Button>
          </div>
        </form>
      </Card>
      <div className="mt-8">
        <p className="text-xs text-slate-600 font-bold mb-2">실시간 미리보기</p>
        <div className="p-8 bg-slate-900/50 rounded-2xl border border-slate-800 min-h-[100px] text-slate-300 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
      </div>
    </div>
  );
};

const NoticesPage = ({ user, isExecutiveOnly }: { user: User | null, isExecutiveOnly: boolean }) => {
  const [notices] = useStore<Notice[]>('kumssc_notices', []);
  const navigate = useNavigate();
  const filtered = notices.filter(n => isExecutiveOnly ? n.isExecutiveOnly : !n.isExecutiveOnly);
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <SectionTitle title={isExecutiveOnly ? "임원 게시판" : "공지사항"} subtitle="중요한 학교 소식과 공지를 확인하세요." />
        {user && (user.role === 'teacher' || user.role === 'admin' || user.role === 'executive') && <Button onClick={() => navigate('/notices/new')} className="gap-2 rounded-xl px-8"><Plus size={18}/> 새 글 작성</Button>}
      </div>
      <div className="grid grid-cols-1 gap-6">
        {filtered.map(n => (
          <Link key={n.id} to={`/notices/${n.id}`}>
            <Card className="p-8 bg-slate-900 border-slate-800 hover:border-green-500 hover:scale-[1.01] transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Megaphone size={80} /></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant={n.isExecutiveOnly ? 'blue' : 'green'}>{n.isExecutiveOnly ? '임원전용' : '일반공지'}</Badge>
                  {n.comments && n.comments.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                      <MessageSquare size={10} /> {n.comments.length}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-600 font-bold">{n.date}</span>
              </div>
              <h3 className="font-black text-white text-3xl mb-4 group-hover:text-green-400 transition-colors leading-tight">{n.title}</h3>
              <p className="text-slate-500 text-sm font-bold flex items-center gap-2"><UserIcon size={14}/> {n.author}</p>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && <div className="py-40 text-center text-slate-700 font-black text-xl border-2 border-dashed border-slate-900 rounded-[3rem]">게시된 소식이 없습니다.</div>}
      </div>
    </div>
  );
};

const NoticeDetailPage = ({ user }: { user: User | null }) => {
  const { id } = useParams();
  const [notices, setNotices] = useStore<Notice[]>('kumssc_notices', []);
  const [commentText, setCommentText] = useState('');
  
  const notice = notices.find(n => n.id === Number(id));
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('로그인 후 이용 가능합니다.');
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      text: filterProfanity(commentText),
      createdAt: new Date().toISOString()
    };

    const updatedNotices = notices.map(n => 
      n.id === Number(id) ? { ...n, comments: [...(n.comments || []), newComment] } : n
    );

    setNotices(updatedNotices);
    setCommentText('');
  };

  if (!notice) return <div className="py-40 text-center font-bold text-2xl">게시글이 존재하지 않습니다.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="p-12 md:p-20 bg-slate-900 border-slate-800 shadow-2xl relative mb-12">
        <div className="flex justify-between items-center mb-12">
          <Badge variant={notice.isExecutiveOnly ? "blue" : "green"} className="py-2 px-6 rounded-full text-sm">
            {notice.isExecutiveOnly ? "임원 게시판" : "공지사항"}
          </Badge>
          <div className="text-right">
             <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mb-1">Created At</p>
             <p className="text-sm text-slate-400 font-mono">{notice.date}</p>
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-16 leading-[1.1] tracking-tight">{notice.title}</h1>
        <div className="h-px bg-slate-800 w-full mb-16" />
        <div className="text-slate-200 text-xl leading-[1.9] prose prose-invert max-w-none min-h-[300px]" dangerouslySetInnerHTML={{ __html: notice.content.replace(/\n/g, '<br/>') }} />
        <div className="mt-20 pt-10 border-t border-slate-800 flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-black">{notice.author.charAt(0)}</div>
           <div><p className="text-xs text-slate-500 font-bold">작성자</p><p className="text-white font-bold">{notice.author}</p></div>
        </div>
      </Card>

      {/* 댓글 섹션 */}
      <Card className="p-8 md:p-12 bg-slate-900 border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare size={24} className="text-green-500" />
          <h3 className="text-2xl font-black text-white">댓글 <span className="text-slate-600 text-lg ml-1">{(notice.comments || []).length}</span></h3>
        </div>

        {user ? (
          <form onSubmit={handleAddComment} className="mb-12">
            <div className="relative group">
              <textarea 
                className="w-full p-6 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 outline-none focus:border-green-500 transition-all min-h-[100px] text-sm leading-relaxed"
                placeholder="의견을 남겨주세요 (욕설 및 비방글은 예고 없이 삭제될 수 있습니다.)"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                required
              />
              <div className="absolute bottom-4 right-4">
                <Button type="submit" size="sm" className="rounded-xl shadow-lg shadow-green-900/10">등록</Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-8 bg-slate-950 rounded-2xl border border-dashed border-slate-800 text-center mb-12">
            <p className="text-slate-500 font-bold text-sm">댓글을 작성하려면 로그인이 필요합니다.</p>
          </div>
        )}

        <div className="space-y-6">
          {(notice.comments || []).length > 0 ? (
            notice.comments.map(comment => (
              <div key={comment.id} className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800/50 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                  {comment.authorName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-100 text-sm">{comment.authorName}</span>
                      <Badge variant="gray" className="text-[8px] py-0">{comment.authorRole}</Badge>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 opacity-20">
              <MessageSquare size={40} className="mx-auto mb-2" />
              <p className="font-bold text-sm">첫 댓글을 작성해보세요.</p>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-12 text-center">
        <Link to={notice.isExecutiveOnly ? "/executive-board" : "/notices"}>
          <Button variant="outline" className="px-12 py-4 rounded-2xl font-black">목록으로 돌아가기</Button>
        </Link>
      </div>
    </div>
  );
};

const CreatePetitionPage = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const [petitions, setPetitions] = useStore<Petition[]>('kumssc_petitions', []);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('기타');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (tag: string, style?: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    const before = content.substring(0, start);
    const after = content.substring(end);
    let formattedText = tag === 'span' && style ? `<${tag} style="${style}">${selectedText || '텍스트'}</${tag}>` : `<${tag}>${selectedText || '텍스트'}</${tag}>`;
    setContent(before + formattedText + after);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPetition: Petition = { id: Date.now(), title, category, content, status: 'ongoing', agreementCount: 1, author: user.name, authorId: user.id, startDate: new Date().toISOString().split('T')[0], endDate: '2026.12.31', agreedUserIds: [user.id], withdrawnUserIds: [], comments: [] };
    setPetitions([newPetition, ...petitions]);
    navigate('/petitions');
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <SectionTitle title="학생청원 등록" subtitle="학교의 긍정적인 변화를 위한 여러분의 생각을 멋지게 꾸며보세요." />
      <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-visible">
        <form onSubmit={handleSubmit}>
          <div className="p-6 bg-slate-900 border-b border-slate-800">
            <select className="mb-4 p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 font-bold text-xs" value={category} onChange={e => setCategory(e.target.value)}>
              <option>급식/시설</option><option>교칙/인권</option><option>문화/행사</option><option>기타</option>
            </select>
            <input className="w-full bg-transparent text-3xl font-black text-white outline-none" placeholder="청원 제목을 입력하세요" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <RichTextToolbar onApply={applyFormatting} />
          <textarea ref={textareaRef} className="w-full p-8 bg-slate-950 text-slate-300 min-h-[400px] outline-none font-mono text-sm leading-relaxed" placeholder="청원 내용을 입력하세요. 스타일 도구를 사용하여 강조할 수 있습니다." value={content} onChange={e => setContent(e.target.value)} required />
          <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-end">
            <Button type="submit" size="lg" className="rounded-xl shadow-green-900/20">청원 신청하기</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const PetitionsPage = ({ user }: { user: User | null }) => {
  const [petitions] = useStore<Petition[]>('kumssc_petitions', []);
  const navigate = useNavigate();
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <SectionTitle title="학생청원" subtitle="200명 이상이 동의하면 학생회와 학교의 답변을 들을 수 있습니다." />
        {user && <Button onClick={() => navigate('/petitions/new')} className="gap-2 rounded-xl px-8 shadow-green-900/10"><Plus size={18}/> 청원 시작</Button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {petitions.map(p => (
          <Link key={p.id} to={`/petitions/${p.id}`}>
            <Card className="p-10 bg-slate-900 border-slate-800 hover:border-green-500/50 hover:bg-slate-900/80 transition-all group flex flex-col h-full shadow-xl">
              <div className="flex justify-between items-center mb-8">
                 <Badge variant="blue" className="px-4 py-1.5 rounded-full">{p.category}</Badge>
                 <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{p.startDate}</span>
              </div>
              <h3 className="font-black text-white text-2xl mb-10 group-hover:text-green-400 transition-colors leading-tight flex-1">{p.title}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <p className="text-xs text-slate-500 font-bold">동의 현황</p>
                   <p className="text-xl font-black text-green-400">{p.agreementCount}명 <span className="text-[10px] text-slate-600">/ 200명</span></p>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.3)]" style={{ width: `${Math.min(100, (p.agreementCount/200)*100)}%` }}></div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {petitions.length === 0 && <div className="md:col-span-2 py-40 text-center text-slate-700 font-black text-xl border-2 border-dashed border-slate-900 rounded-[3rem]">진행 중인 청원이 없습니다.</div>}
      </div>
    </div>
  );
};

const PetitionDetailPage = ({ user }: { user: User | null }) => {
  const { id } = useParams();
  const [petitions, setPetitions] = useStore<Petition[]>('kumssc_petitions', []);
  const petition = petitions.find(p => p.id === Number(id));
  if (!petition) return <div className="py-40 text-center font-bold text-2xl">청원을 찾을 수 없습니다.</div>;
  const handleAgree = () => {
    if (!user) return alert('로그인 후 동의하실 수 있습니다.');
    if (petition.agreedUserIds.includes(user.id)) return alert('이미 동의한 청원입니다.');
    const updated = petitions.map(p => p.id === petition.id ? { ...p, agreementCount: p.agreementCount + 1, agreedUserIds: [...p.agreedUserIds, user.id] } : p);
    setPetitions(updated); alert('청원에 동의하셨습니다.');
  };
  const progress = Math.min(100, (petition.agreementCount / 200) * 100);

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in zoom-in duration-500">
      <Card className="p-12 md:p-20 bg-slate-900 border-slate-800 shadow-2xl overflow-visible">
        <div className="flex flex-wrap gap-4 mb-10">
          <Badge variant="blue" className="px-6 py-2 rounded-full text-sm">{petition.category}</Badge>
          <Badge variant="gray" className="px-6 py-2 rounded-full text-sm">진행중</Badge>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-16 leading-[1.2]">{petition.title}</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 bg-slate-950 rounded-3xl border border-slate-800 mb-20 text-center">
           <div><p className="text-[10px] font-black text-slate-600 uppercase mb-2">청원인</p><p className="font-bold text-slate-200">{petition.author}</p></div>
           <div><p className="text-[10px] font-black text-slate-600 uppercase mb-2">청원기간</p><p className="font-bold text-slate-200">{petition.startDate} ~ 12.31</p></div>
           <div><p className="text-[10px] font-black text-slate-600 uppercase mb-2">동의수</p><p className="font-black text-green-400 text-xl">{petition.agreementCount}명</p></div>
           <div><p className="text-[10px] font-black text-slate-600 uppercase mb-2">청원번호</p><p className="font-bold text-slate-200">#{petition.id}</p></div>
        </div>

        <div className="prose prose-invert max-w-none text-slate-300 text-lg leading-[1.8] min-h-[300px] mb-20" dangerouslySetInnerHTML={{ __html: petition.content.replace(/\n/g, '<br/>') }} />

        <div className="p-12 bg-slate-950 rounded-[3rem] border-2 border-green-500/20 text-center relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"><div className="h-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all duration-1000" style={{width: `${progress}%`}} /></div>
           <p className="text-slate-400 font-bold mb-4">현재 <span className="text-green-400 text-4xl font-black mx-2">{petition.agreementCount}명</span> 동의 중</p>
           <p className="text-xs text-slate-600 font-bold mb-10 uppercase tracking-widest">200명 달성 시 학생회 답변 게시</p>
           <Button onClick={handleAgree} size="lg" className="w-full py-8 text-3xl rounded-[2rem] shadow-[0_20px_40px_rgba(34,197,94,0.2)] hover:scale-[1.02] active:scale-95 transition-all">청원 동의하기</Button>
        </div>
      </Card>
      <div className="mt-12 text-center"><Link to="/petitions"><Button variant="outline" className="px-10 py-3 rounded-xl font-bold">청원 목록으로</Button></Link></div>
    </div>
  );
};

// --- REMAINING APP WRAPPER ---
export default function App() {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem('kumssc_session'); setUser(null); navigate('/'); };
  const handleUpdateUser = (updated: User) => setUser(updated);
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-green-500/30">
      <Header user={user} onLogout={handleLogout} />
      <main className="flex-1 container mx-auto py-16 px-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/notices" element={<NoticesPage user={user} isExecutiveOnly={false} />} />
          <Route path="/executive-board" element={user && (user.role === 'executive' || user.role === 'admin' || user.role === 'teacher') ? <NoticesPage user={user} isExecutiveOnly={true} /> : <Navigate to="/login" />} />
          <Route path="/notices/new" element={<CreateNoticePage user={user} />} />
          <Route path="/notices/:id" element={<NoticeDetailPage user={user} />} />
          <Route path="/petitions" element={<PetitionsPage user={user} />} />
          <Route path="/petitions/new" element={user ? <CreatePetitionPage user={user} /> : <Navigate to="/login" />} />
          <Route path="/petitions/:id" element={<PetitionDetailPage user={user} />} />
          <Route path="/council" element={<CouncilPage currentUser={user} />} />
          <Route path="/messages" element={<MessagesPage user={user} />} />
          <Route path="/calendar" element={<CalendarPage user={user} />} />
          <Route path="/profile" element={user ? <ProfilePage user={user} onUpdate={handleUpdateUser} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && (user.role === 'admin' || user.role === 'teacher') ? <AdminPage currentUser={user} /> : <Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage onLogin={setUser} />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<div className="text-center py-40 font-bold text-3xl">페이지를 찾을 수 없습니다.</div>} />
        </Routes>
      </main>
      <footer className="bg-slate-900 py-16 border-t border-slate-800 text-center"><LogoImage className="w-12 h-12 mx-auto mb-4 opacity-40 grayscale" /><p className="text-slate-500 text-xs font-bold tracking-tight">© 2026 건국대학교 사범대학 부속중학교 학생자치회 (KUMSSC). All rights reserved.</p></footer>
    </div>
  );
}

const Header = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const visibleNavItems = useMemo(() => {
    const items = [...NAV_ITEMS];
    if (user && !items.find(i => i.id === 'profile')) items.push({ id: 'profile', label: '프로필', icon: <UserIcon size={20}/>, path: '/profile' });
    return items.filter(item => !item.roles || (user && item.roles.includes(user.role)));
  }, [user]);
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 shadow-2xl shadow-black/50">
      <div className="container mx-auto px-6 h-24 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group"><div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center shadow-lg group-hover:border-green-500 transition-colors"><LogoImage className="w-10 h-10" /></div><div className="hidden md:block"><span className="block text-2xl font-black text-white tracking-tighter leading-none mb-1">KUMSSC <span className="text-green-500">CAPS</span></span><span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] leading-none">KONKUK MS COUNCIL</span></div></Link>
        <nav className="hidden lg:flex items-center gap-2">{visibleNavItems.map(item => <Link key={item.id} to={item.path} className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${location.pathname === item.path ? 'text-green-400 bg-green-500/10 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]' : 'text-slate-500 hover:text-green-400 hover:bg-slate-900'}`}>{item.label}</Link>)}<div className="w-px h-8 bg-slate-800 mx-4" />{user ? <div className="flex items-center gap-4 text-white"><div className="text-right"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{user.role}</p><p className="text-sm font-bold">{user.name} 님</p></div><Button variant="secondary" size="sm" onClick={onLogout} className="rounded-xl"><LogOut size={16}/></Button></div> : <Link to="/login"><Button variant="primary" className="rounded-xl px-8">로그인</Button></Link>}</nav>
        <button className="lg:hidden p-3 text-slate-400" onClick={() => setMobileMenuOpen(true)}><Menu size={28} /></button>
      </div>
      {mobileMenuOpen && <div className="fixed inset-0 z-50 bg-slate-950 p-8 text-white flex flex-col animate-in slide-in-from-right-full duration-500"><div className="flex justify-between items-center mb-16"><LogoImage className="w-16 h-16"/><button onClick={() => setMobileMenuOpen(false)} className="p-4"><X size={40}/></button></div><div className="space-y-6 flex-1">{visibleNavItems.map(item => <Link key={item.id} to={item.path} className="block text-5xl font-black hover:text-green-500 transition-colors" onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>)}</div>{user && <Button variant="outline" onClick={onLogout} className="w-full py-5 text-xl rounded-2xl">로그아웃</Button>}</div>}
    </header>
  );
};

const HomePage = () => {
  const [notices] = useStore<Notice[]>('kumssc_notices', []);
  return (
    <div className="space-y-24 px-4 pb-20">
      <div className="h-[600px] rounded-[3rem] overflow-hidden shadow-2xl bg-[#008248] text-white p-12 md:p-24 flex items-center relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl animate-in fade-in slide-in-from-left-8 duration-1000">
          <Badge variant="green" className="bg-white/20 text-white border-white/20 px-4 py-2 text-sm font-black mb-10">제2026학년도 학생자치회</Badge>
          <h1 className="text-5xl md:text-8xl font-black mb-12 leading-[1.1] tracking-tighter">
            학생의 목소리를<br/>
            우리가 대신 내어 드립니다!
          </h1>
          <div className="flex gap-4">
            <Link to="/notices"><Button variant="outline" className="border-white/40 text-white px-10 py-4 rounded-2xl text-lg hover:bg-white hover:text-black">공지사항</Button></Link>
            <Link to="/petitions">
              <Button className="!bg-white !text-black px-10 py-4 rounded-2xl text-lg shadow-xl hover:scale-105 transition-transform">
                학생청원 참여하기 <ArrowRight size={22} className="ml-2"/>
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute right-[-5%] bottom-[-5%] opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-1000 hidden lg:block"><LogoImage className="w-[500px] h-[500px] grayscale brightness-200" /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10"><Card className="p-10 bg-slate-900 border-slate-800 lg:col-span-2 shadow-2xl"><div className="flex justify-between items-center mb-10"><h3 className="text-2xl font-black text-white flex items-center gap-3"><Megaphone size={28} className="text-green-500"/> 최근 소식</h3><Link to="/notices" className="text-slate-500 hover:text-green-400 font-bold transition-colors">전체보기 <ChevronRight size={18} className="inline"/></Link></div><div className="space-y-4">{notices.slice(0, 4).map(n => <Link key={n.id} to={`/notices/${n.id}`} className="block p-6 bg-slate-800/30 rounded-2xl border border-slate-800/50 hover:border-green-500/50 hover:bg-slate-800/50 transition-all"><div className="flex justify-between items-center"><h4 className="font-bold text-lg text-slate-100">{n.title}</h4><span className="text-xs text-slate-600 font-bold">{n.date}</span></div></Link>)}</div></Card><Card className="p-10 bg-slate-900 border-slate-800 flex flex-col justify-center text-center shadow-2xl relative overflow-hidden group"><div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl group-hover:bg-green-500/30 transition-all duration-500"></div><FileText size={48} className="mx-auto mb-8 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]"/><h3 className="text-3xl font-black text-white mb-4">학생 청원</h3><p className="text-slate-500 mb-10 leading-relaxed text-sm">여러분의 작은 목소리가<br/>건대부중을 바꿀 수 있습니다.</p><Link to="/petitions"><Button className="w-full py-5 text-xl rounded-2xl" variant="primary">청원 제안하기</Button></Link></Card></div>
    </div>
  );
};
