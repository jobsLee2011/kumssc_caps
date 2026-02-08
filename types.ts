
export type UserRole = 'student' | 'executive' | 'teacher' | 'admin';
export type RegistrationStatus = 'pending' | 'approved' | 'hold' | 'rejected';

export type Department = '회장부' | '과학정보부' | '안전질서부' | '체육보건부' | '총무부' | '학습부' | '상담부' | '홍보부' | '환경봉사부' | '도서부';

export interface DepartmentInfo {
  name: Department;
  description: string;
  updatedAt: string;
}

export interface Appeal {
  id: string;
  studentId: string;
  studentName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  studentId?: string;
  grade?: number;
  class?: number;
  number?: number;
  gender?: 'male' | 'female';
  bio?: string;
  instagramId?: string;
  profileImage?: string;
  email?: string;
  penaltyPoints: number;
  appeals: Appeal[];
  department?: Department;
  position?: string; // 직급 (예: 부장, 차장, 부원)
}

export interface RegistrationRequest {
  id: string;
  studentId: string;
  name: string;
  username: string;
  password?: string;
  email: string;
  status: RegistrationStatus;
  reason?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Notice {
  id: number;
  title: string;
  category: string;
  date: string;
  content: string;
  author: string;
  isImportant?: boolean;
  isExecutiveOnly?: boolean;
  comments: Comment[];
}

export type PetitionStatus = 'ongoing' | 'waiting' | 'answered' | 'rejected';

export interface Petition {
  id: number;
  title: string;
  category: string;
  status: PetitionStatus;
  agreementCount: number;
  startDate: string;
  endDate: string;
  author: string;
  authorId?: string;
  content: string;
  agreedUserIds: string[];
  withdrawnUserIds: string[];
  comments: Comment[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  category: '학사' | '행사' | '시험' | '공휴일';
  description: string;
  authorId: string;
}
