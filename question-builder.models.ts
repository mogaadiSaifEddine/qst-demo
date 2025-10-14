export interface MultiLanguageText {
[key: string]: string;
}

export interface Answer {
  id: number;
  res_answer: MultiLanguageText;
  res_explain: MultiLanguageText;
  image: string | null;
  explain_image: string | null;
  next_question: Question | null;
  is_correct: boolean | null;
  order: number;
}

export interface Question {
  id: string;
  parentId?: string;
  parentAnswerId?: number;
  question: MultiLanguageText;
  hint: MultiLanguageText;
  question_type: 'multiple-choice' | 'written-answer' | 'decision-tree';
  written_answer_format?: 'free-form' | 'specific-format' | null;
  incorrect_feedback: MultiLanguageText;
  question_image: string | null;
  hint_image: string | null;
  answers: Answer[];
  category: string;
  tags: { [key: string]: boolean };
  isDeleted?: boolean;
}

export interface TreeNode {
  id: string;
  question: Question;
  children: Array<{
    answer: Answer;
    question: TreeNode;
  }>;
}

export interface Breadcrumb {
  id: string;
  label: string;
  children: Array<{
    id: string;
    label: string;
    answerLabel: string;
  }>;
  isLast: boolean;
}
