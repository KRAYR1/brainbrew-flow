export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  description: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
}
