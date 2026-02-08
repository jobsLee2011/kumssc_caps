
import React from 'react';
import { LayoutDashboard, Megaphone, FileText, Calendar, Users, ShieldCheck, Settings, Mail, Landmark } from 'lucide-react';
import { UserRole, Notice, Petition, Department } from './types';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: UserRole[];
}

export const DEPARTMENTS: Department[] = [
  '회장부', '과학정보부', '안전질서부', '체육보건부', '총무부', 
  '학습부', '상담부', '홍보부', '환경봉사부', '도서부'
];

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: '홈', icon: <LayoutDashboard size={20} />, path: '/' },
  { id: 'notices', label: '공지사항', icon: <Megaphone size={20} />, path: '/notices' },
  { id: 'petitions', label: '학생청원', icon: <FileText size={20} />, path: '/petitions' },
  { id: 'council', label: '학생회 조직', icon: <Landmark size={20} />, path: '/council' },
  { id: 'messages', label: '쪽지함', icon: <Mail size={20} />, path: '/messages' },
  { id: 'calendar', label: '일정안내', icon: <Calendar size={20} />, path: '/calendar' },
  { id: 'executive', label: '임원게시판', icon: <ShieldCheck size={20} />, path: '/executive-board', roles: ['executive', 'admin'] },
  { id: 'admin', label: '계정관리', icon: <Settings size={20} />, path: '/admin', roles: ['admin'] },
];

// 예시 데이터 삭제
export const DUMMY_NOTICES: Notice[] = [];
export const EXECUTIVE_NOTICES: Notice[] = [];
export const DUMMY_PETITIONS: Petition[] = [];
