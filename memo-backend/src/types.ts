export type TaskFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'weekdays';
export type MasteryLevel = 'good' | 'fair' | 'poor';
export type TaskKind = 'standard' | 'learning_source' | 'learning_review';

export interface Task {
  id: string;
  userId: string;
  title: string;
  frequency: TaskFrequency;
  reminderTime?: string | null;
  isLearning: boolean;
  notes?: string;
  completed: boolean;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  taskKind: TaskKind;
  parentTaskId?: string | null;
  seriesId?: string;
  reviewStep?: number;
  completedAt?: string;
  learningContent?: string;
  mastery?: MasteryLevel;
}

export interface TaskDatabase {
  tasks: Task[];
  users: User[];
  loginRecords: LoginRecord[];
  sessions: Session[];
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface LoginRecord {
  id: string;
  userId: string;
  username: string;
  loggedInAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface RegisterInput {
  username: string;
  password: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface PublicUser {
  id: string;
  username: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateTaskInput {
  title: string;
  frequency: TaskFrequency;
  reminderTime?: string | null;
  isLearning: boolean;
  notes?: string;
  dueDate: string;
}

export interface UpdateTaskInput {
  title?: string;
  frequency?: TaskFrequency;
  reminderTime?: string | null;
  isLearning?: boolean;
  notes?: string;
  dueDate?: string;
}

export interface CompleteTaskInput {
  learnedContent?: string;
  mastery?: MasteryLevel;
}

export interface CompleteTaskResult {
  task: Task;
  createdReviews: Task[];
  adjustedReviews: Task[];
  nextRecurringTask?: Task;
}
