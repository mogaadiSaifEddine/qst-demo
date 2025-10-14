import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Question, Answer, MultiLanguageText, TreeNode, Breadcrumb } from './question-builder.models';

@Component({
  selector: 'app-question-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './question-builder.component.html',
  styleUrls: ['./question-builder.component.css']
})
export class QuestionBuilderComponent implements OnInit, OnDestroy {
  @ViewChild('breadcrumbDropdown') breadcrumbDropdownRef!: ElementRef;

  currentStep = 1;
  navigationStack: string[] = ['root'];
  currentLanguage: 'en' | 'fr' | 'is' = 'en';
  availableLanguages: Array<'en' | 'fr' | 'is'> = ['en', 'fr', 'is'];
  showTreeNavigation = false;
  treeWidth = 320;
  collapsedNodes = new Set<string>();
  showLinkDialog = false;
  linkingAnswerId: number | null = null;
  searchTerm = '';
  expandedMessages = new Set<number>();
  showHint = false;
  showTypeChangeConfirm = false;
  pendingTypeChange: string | null = null;
  showBreadcrumbChildren: { [key: string]: boolean } = {};

  existingQuestionsState: { [key: string]: Question } = {
    'existing-1': {
      id: '1',
      question: {
        en: 'What is the capital of France?',
        fr: 'Quelle est la capitale de la France?',
        is: 'Hvað er höfuðborg Frakklands?'
      },
      hint: {
        en: 'Think about the City of Light',
        fr: 'Pensez à la Ville Lumière',
        is: 'Hugsaðu um ljósaborgarinn'
      },
      question_type: 'multiple-choice',
      question_image: null,
      hint_image: null,
      answers: [
        {
          id: 1,
          res_answer: {
            en: 'Paris',
            fr: 'Paris',
            is: 'París'
          },
          res_explain: {
            en: 'Correct! Paris is the capital of France.',
            fr: 'Correct! Paris est la capitale de la France.',
            is: 'Rétt! París er höfuðborg Frakklands.'
          },
          is_correct: true,
          image: null,
          explain_image: null,
          next_question: null,
          order: 1
        }
      ],
      category: 'Geography',
      tags: { geography: true, europe: true },
      incorrect_feedback: { en: '', fr: '', is: '' }
    }
  };

  questions: { [key: string]: Question } = {
    root: {
      id: 'root',
      question: { en: '', fr: '', is: '' },
      hint: { en: '', fr: '', is: '' },
      question_type: 'multiple-choice',
      written_answer_format: null,
      incorrect_feedback: { en: '', fr: '', is: '' },
      question_image: null,
      hint_image: null,
      answers: [
        {
          id: 1,
          res_answer: { en: '', fr: '', is: '' },
          res_explain: { en: '', fr: '', is: '' },
          image: null,
          explain_image: null,
          next_question: null,
          is_correct: null,
          order: 1
        }
      ],
      category: 'Other',
      tags: {}
    }
  };

  currentQuestionId = 'root';
  currentQuestion!: Question;
  isRoot = true;

  private clickOutsideListener?: (event: MouseEvent) => void;

  constructor(
    public dialogRef: MatDialogRef<QuestionBuilderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.updateCurrentQuestion();
    this.setupClickOutsideListener();
  }

  ngOnDestroy(): void {
    this.removeClickOutsideListener();
  }

  private setupClickOutsideListener(): void {
    this.clickOutsideListener = (event: MouseEvent) => {
      if (Object.keys(this.showBreadcrumbChildren).length > 0) {
        if (this.breadcrumbDropdownRef &&
            !this.breadcrumbDropdownRef.nativeElement.contains(event.target)) {
          this.showBreadcrumbChildren = {};
        }
      }
    };
    document.addEventListener('mousedown', this.clickOutsideListener);
  }

  private removeClickOutsideListener(): void {
    if (this.clickOutsideListener) {
      document.removeEventListener('mousedown', this.clickOutsideListener);
    }
  }

  private updateCurrentQuestion(): void {
    this.currentQuestionId = this.navigationStack[this.navigationStack.length - 1];
    this.currentQuestion = this.questions[this.currentQuestionId] || this.questions['root'];
    this.isRoot = this.currentQuestionId === 'root';
  }

  getExistingQuestions(): { [key: string]: Question } {
    return this.existingQuestionsState;
  }

  hasDecisionTreeQuestions(): boolean {
    return Object.values(this.questions).some(q => q.question_type === 'decision-tree') ||
      Object.values(this.getExistingQuestions()).some(q => q.question_type === 'decision-tree');
  }

  getQuestionTypeDisplay(type: string): string {
    const types: { [key: string]: string } = {
      'decision-tree': 'Decision Tree',
      'multiple-choice': 'Multiple Choice',
      'written-answer': 'Written Answer'
    };
    return types[type] || type;
  }

  getActualQuestionType(question: Question): string {
    if (!question || !question.answers) return question?.question_type || 'multiple-choice';
    if (question.question_type === 'written-answer') return 'written-answer';
    const hasNestedQuestions = question.answers.some(answer => answer.next_question);
    return hasNestedQuestions ? 'decision-tree' : 'multiple-choice';
  }

  handleQuestionTypeChange(newType: string): void {
    const currentType = this.getActualQuestionType(this.currentQuestion);
    if ((currentType === 'decision-tree' && newType === 'multiple-choice') ||
        (currentType === 'multiple-choice' && newType === 'decision-tree')) {
      this.pendingTypeChange = newType;
      this.showTypeChangeConfirm = true;
    } else {
      this.updateQuestion({ question_type: newType as any });
    }
  }

  confirmTypeChange(): void {
    if (this.pendingTypeChange === 'multiple-choice') {
      const updatedAnswers = this.currentQuestion.answers.map(a => ({
        ...a,
        next_question: null,
        is_correct: null
      }));
      this.updateQuestion({
        question_type: this.pendingTypeChange as any,
        answers: updatedAnswers
      });
    } else {
      this.updateQuestion({ question_type: this.pendingTypeChange as any });
    }
    this.showTypeChangeConfirm = false;
    this.pendingTypeChange = null;
  }

  updateQuestion(updates: Partial<Question>): void {
    const finalUpdates = this.updateQuestionTypeBasedOnContent(updates);
    this.questions[this.currentQuestionId] = {
      ...this.currentQuestion,
      ...finalUpdates
    };
    this.currentQuestion = this.questions[this.currentQuestionId];
  }

  private updateQuestionTypeBasedOnContent(questionUpdates: Partial<Question>): Partial<Question> {
    const updatedQuestion = { ...this.currentQuestion, ...questionUpdates };
    if (updatedQuestion.question_type === 'written-answer') {
      return questionUpdates;
    }
    const actualType = this.getActualQuestionType(updatedQuestion as Question);
    if (actualType !== updatedQuestion.question_type && actualType === 'decision-tree') {
      return { ...questionUpdates, question_type: 'decision-tree' };
    }
    if (updatedQuestion.question_type === 'decision-tree' && actualType === 'multiple-choice') {
      return { ...questionUpdates, question_type: 'multiple-choice' };
    }
    return questionUpdates;
  }

  navigateToQuestion(questionId: string): void {
    const targetQuestion = this.questions[questionId] || this.getExistingQuestions()[questionId];
    if (!targetQuestion) {
      alert('This question no longer exists. It may have been deleted.');
      return;
    }
    if (this.getExistingQuestions()[questionId] && !this.questions[questionId]) {
      this.questions[questionId] = this.getExistingQuestions()[questionId];
    }
    this.navigationStack.push(questionId);
    this.currentStep = 2;
    this.updateCurrentQuestion();
  }

  navigateToQuestionFromTree(questionId: string): void {
    const targetQuestion = this.questions[questionId] || this.getExistingQuestions()[questionId];
    if (!targetQuestion) {
      alert('This question no longer exists. It may have been deleted.');
      return;
    }
    if (this.getExistingQuestions()[questionId] && !this.questions[questionId]) {
      this.questions[questionId] = this.getExistingQuestions()[questionId];
    }

    const pathToQuestion = this.findPathToQuestion(questionId);
    if (pathToQuestion) {
      this.navigationStack = pathToQuestion;
    } else {
      this.navigationStack = [questionId];
    }
    this.currentStep = 2;
    this.updateCurrentQuestion();
  }

  private findPathToQuestion(targetId: string, currentId = 'root', path: string[] = ['root']): string[] | null {
    if (currentId === targetId) return path;
    const currentQ = this.questions[currentId] || this.getExistingQuestions()[currentId];
    if (!currentQ || !currentQ.answers) return null;

    for (const answer of currentQ.answers) {
      if (answer.next_question && answer.next_question.id) {
        const foundPath = this.findPathToQuestion(targetId, answer.next_question.id, [...path, answer.next_question.id]);
        if (foundPath) return foundPath;
      }
    }
    return null;
  }

  navigateBack(): void {
    if (this.navigationStack.length > 1) {
      this.navigationStack = this.navigationStack.slice(0, -1);
      this.currentStep = 2;
      this.updateCurrentQuestion();
    }
  }

  navigateToRoot(): void {
    this.navigationStack = ['root'];
    this.currentStep = 2;
    this.updateCurrentQuestion();
  }

  updateQuestionText(value: string): void {
    this.updateQuestion({
      question: {
        ...this.currentQuestion.question,
        [this.currentLanguage]: value
      }
    });
  }

  updateAnswerText(answerId: number, value: string): void {
    const updatedAnswers = this.currentQuestion.answers.map(a => {
      if (a.id === answerId) {
        return {
          ...a,
          res_answer: {
            ...a.res_answer,
            [this.currentLanguage]: value
          }
        };
      }
      return a;
    });
    this.updateQuestion({ answers: updatedAnswers });
  }

  getQuestionText(): string {
    return this.currentQuestion.question?.[this.currentLanguage] || '';
  }

  getAnswerText(answer: Answer): string {
    return answer.res_answer?.[this.currentLanguage] || '';
  }

  updateAnswer(answerId: number, field: keyof Answer, value: any): void {
    const updatedAnswers = this.currentQuestion.answers.map(a =>
      a.id === answerId ? { ...a, [field]: value } : a
    );
    this.updateQuestion({ answers: updatedAnswers });
  }

  addAnswer(): void {
    const newId = Math.max(...this.currentQuestion.answers.map(a => a.id), 0) + 1;
    const newOrder = Math.max(...this.currentQuestion.answers.map(a => a.order || 0), 0) + 1;

    const newAnswer: Answer = {
      id: newId,
      res_answer: this.availableLanguages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {} as MultiLanguageText),
      res_explain: this.availableLanguages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {} as MultiLanguageText),
      image: null,
      explain_image: null,
      order: newOrder,
      next_question: null,
      is_correct: null
    };

    this.updateQuestion({
      answers: [...this.currentQuestion.answers, newAnswer]
    });
  }

  removeAnswer(answerId: number): void {
    if (this.currentQuestion.answers.length > 1) {
      this.updateQuestion({
        answers: this.currentQuestion.answers.filter(a => a.id !== answerId)
      });
    }
  }

  createBranchQuestion(answerId: number): void {
    const newQuestionId = `q-${Date.now()}`;
    const newQuestion: Question = {
      id: newQuestionId,
      parentId: this.currentQuestionId,
      parentAnswerId: answerId,
      question: this.availableLanguages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {} as MultiLanguageText),
      hint: this.availableLanguages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {} as MultiLanguageText),
      question_type: 'multiple-choice',
      written_answer_format: null,
      incorrect_feedback: this.availableLanguages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {} as MultiLanguageText),
      question_image: null,
      hint_image: null,
      answers: [{
        id: 1,
        res_answer: this.availableLanguages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {} as MultiLanguageText),
        res_explain: this.availableLanguages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {} as MultiLanguageText),
        image: null,
        explain_image: null,
        next_question: null,
        is_correct: null,
        order: 1
      }],
      category: 'Other',
      tags: {}
    };

    this.questions[newQuestionId] = newQuestion;
    this.questions[this.currentQuestionId] = {
      ...this.currentQuestion,
      question_type: 'decision-tree',
      answers: this.currentQuestion.answers.map(a =>
        a.id === answerId
          ? { ...a, next_question: newQuestion, is_correct: null }
          : a
      )
    };

    this.navigationStack.push(newQuestionId);
    this.currentStep = 1;
    this.updateCurrentQuestion();
  }

  linkExistingQuestion(answerId: number, existingQuestionId: string): void {
    const existingQuestion = this.getExistingQuestions()[existingQuestionId];
    const linkedQuestion: Question = {
      ...existingQuestion,
      parentId: this.currentQuestionId,
      parentAnswerId: answerId
    };

    this.questions[existingQuestionId] = linkedQuestion;
    this.questions[this.currentQuestionId] = {
      ...this.currentQuestion,
      question_type: 'decision-tree',
      answers: this.currentQuestion.answers.map(a =>
        a.id === answerId
          ? { ...a, next_question: linkedQuestion, is_correct: null }
          : a
      )
    };

    this.showLinkDialog = false;
    this.linkingAnswerId = null;
    this.searchTerm = '';
    this.updateCurrentQuestion();
  }

  getFilteredExistingQuestions(): Question[] {
    return Object.values(this.getExistingQuestions()).filter(q =>
      q.question[this.currentLanguage]?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      q.category?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      Object.keys(q.tags || {}).some(tag => tag.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  getBranchQuestion(answer: Answer): Question | null {
    if (!answer.next_question) return null;
    const questionId = answer.next_question.id;

    if (this.questions[questionId]) return this.questions[questionId];
    if (this.getExistingQuestions()[questionId]) return this.getExistingQuestions()[questionId];

    return {
      id: questionId,
      question_type: 'multiple-choice',
      question: { [this.currentLanguage]: '⚠️ Question Deleted' } as MultiLanguageText,
      answers: [],
      isDeleted: true,
      hint: { en: '', fr: '', is: '' },
      incorrect_feedback: { en: '', fr: '', is: '' },
      question_image: null,
      hint_image: null,
      category: 'Other',
      tags: {}
    };
  }

  getQuestionChildren(questionId: string): Array<{ id: string; label: string; answerLabel: string }> {
    const q = this.questions[questionId] || this.getExistingQuestions()[questionId];
    if (!q || !q.answers) return [];

    return q.answers
      .filter(answer => answer.next_question && answer.next_question.id)
      .map(answer => ({
        id: answer.next_question!.id,
        label: answer.next_question!.question?.[this.currentLanguage] ||
               (this.questions[answer.next_question!.id] || this.getExistingQuestions()[answer.next_question!.id])?.question?.[this.currentLanguage] ||
               'Untitled Question',
        answerLabel: answer.res_answer?.[this.currentLanguage] || 'Empty Answer'
      }));
  }

  getBreadcrumbs(): Breadcrumb[] {
    return this.navigationStack.map((qId, index) => {
      if (qId === 'root') return {
        id: 'root',
        label: 'Main Question',
        children: this.getQuestionChildren('root'),
        isLast: index === this.navigationStack.length - 1
      };

      const q = this.questions[qId] || this.getExistingQuestions()[qId];
      if (!q) {
        return {
          id: qId,
          label: '⚠️ Deleted Question',
          children: [],
          isLast: index === this.navigationStack.length - 1
        };
      }

      if (q.parentId && q.parentAnswerId) {
        const parentQuestion = this.questions[q.parentId] || this.getExistingQuestions()[q.parentId];
        if (parentQuestion) {
          const parentAnswer = parentQuestion.answers?.find(a => a.id === q.parentAnswerId);
          if (parentAnswer && parentAnswer.res_answer?.[this.currentLanguage]) {
            return {
              id: qId,
              label: parentAnswer.res_answer[this.currentLanguage],
              children: this.getQuestionChildren(qId),
              isLast: index === this.navigationStack.length - 1
            };
          }
        }
      }

      return {
        id: qId,
        label: q.question?.[this.currentLanguage] || 'Untitled Question',
        children: this.getQuestionChildren(qId),
        isLast: index === this.navigationStack.length - 1
      };
    });
  }

  buildQuestionTree(questionId = 'root', visited = new Set<string>()): TreeNode | null {
    if (visited.has(questionId)) return null;
    visited.add(questionId);

    const question = this.questions[questionId] || this.getExistingQuestions()[questionId];
    if (!question) return null;

    const children: Array<{ answer: Answer; question: TreeNode }> = [];
    if (question.answers && question.answers.length > 0) {
      question.answers.forEach(answer => {
        if (answer.next_question && answer.next_question.id) {
          const childTree = this.buildQuestionTree(answer.next_question.id, new Set(visited));
          if (childTree) {
            children.push({ answer, question: childTree });
          }
        }
      });
    }

    return { id: questionId, question, children };
  }

  toggleNodeCollapse(nodeId: string): void {
    if (this.collapsedNodes.has(nodeId)) {
      this.collapsedNodes.delete(nodeId);
    } else {
      this.collapsedNodes.add(nodeId);
    }
  }

  toggleMessageExpand(answerId: number): void {
    if (this.expandedMessages.has(answerId)) {
      this.expandedMessages.delete(answerId);
    } else {
      this.expandedMessages.add(answerId);
    }
  }

  isNodeCollapsed(nodeId: string): boolean {
    return this.collapsedNodes.has(nodeId);
  }

  isMessageExpanded(answerId: number): boolean {
    return this.expandedMessages.has(answerId);
  }

  toggleBreadcrumbChildren(crumbId: string): void {
    this.showBreadcrumbChildren = {
      ...this.showBreadcrumbChildren,
      [crumbId]: !this.showBreadcrumbChildren[crumbId]
    };
  }

  navigateToBreadcrumb(crumb: Breadcrumb, index: number): void {
    if (crumb.id === 'root') {
      this.navigateToRoot();
    } else {
      const targetIndex = this.navigationStack.indexOf(crumb.id);
      this.navigationStack = this.navigationStack.slice(0, targetIndex + 1);
      this.currentStep = 2;
      this.updateCurrentQuestion();
    }
  }

  deleteQuestion(crumbId: string, index: number): void {
    const crumb = this.getBreadcrumbs()[index];
    if (confirm(`Delete question "${crumb.label}"? This will remove it from the tree.`)) {
      delete this.questions[crumbId];

      // Find and unlink from parent
      const parentQuestion = this.questions[this.navigationStack[index - 1]];
      if (parentQuestion) {
        const updatedAnswers = parentQuestion.answers.map(a =>
          a.next_question?.id === crumbId
            ? { ...a, next_question: null, is_correct: null }
            : a
        );
        this.questions[this.navigationStack[index - 1]] = {
          ...parentQuestion,
          answers: updatedAnswers
        };
      }

      // Navigate back to the previous question
      this.navigationStack = this.navigationStack.slice(0, index);
      this.currentStep = 2;
      this.updateCurrentQuestion();
    }
  }

  deleteTreeNode(id: string, question: Question): void {
    if (confirm(`Delete question "${question.question?.[this.currentLanguage] || 'Untitled Question'}"? This will remove it from the tree.`)) {
      delete this.questions[id];

      // Find and unlink from parent
      if (question.parentId) {
        const parentQuestion = this.questions[question.parentId];
        if (parentQuestion) {
          const updatedAnswers = parentQuestion.answers.map(a =>
            a.next_question?.id === id
              ? { ...a, next_question: null, is_correct: null }
              : a
          );
          this.questions[question.parentId] = {
            ...parentQuestion,
            answers: updatedAnswers
          };
        }
      }

      // If the deleted question was in the navigation stack, navigate back
      if (this.navigationStack.includes(id)) {
        const indexInStack = this.navigationStack.indexOf(id);
        this.navigationStack = this.navigationStack.slice(0, indexInStack);
        this.currentStep = 2;
        this.updateCurrentQuestion();
      }
    }
  }

  getLangName(lang: string): string {
    const langNames: { [key: string]: string } = {
      en: 'English',
      fr: 'French',
      is: 'Icelandic'
    };
    return langNames[lang] || lang;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  expandAllNodes(): void {
    this.collapsedNodes.clear();
  }

  getChildrenCount(branchQ: Question | null): number {
    return branchQ?.answers?.filter(a => a.next_question).length || 0;
  }

  updateHint(value: string): void {
    this.updateQuestion({
      hint: {
        ...this.currentQuestion.hint,
        [this.currentLanguage]: value
      }
    });
  }

  updateIncorrectFeedback(value: string): void {
    this.updateQuestion({
      incorrect_feedback: {
        ...this.currentQuestion.incorrect_feedback,
        [this.currentLanguage]: value
      }
    });
  }

  updateCategory(value: string): void {
    this.updateQuestion({ category: value });
  }

  updateTags(value: string): void {
    const tagArray = value.split(',').map(t => t.trim()).filter(t => t);
    const tagObj = tagArray.reduce((acc, tag) => ({ ...acc, [tag]: true }), {});
    this.updateQuestion({ tags: tagObj });
  }

  getTagsString(): string {
    return Object.keys(this.currentQuestion.tags || {}).join(', ');
  }

  getTags(): string[] {
    return Object.keys(this.currentQuestion.tags || {});
  }

  updateAnswerExplain(answerId: number, value: string): void {
    const updatedAnswers = this.currentQuestion.answers.map(a =>
      a.id === answerId
        ? {
            ...a,
            res_explain: {
              ...a.res_explain,
              [this.currentLanguage]: value
            }
          }
        : a
    );
    this.updateQuestion({ answers: updatedAnswers });
  }

  unlinkQuestion(answerId: number): void {
    const updatedAnswers = this.currentQuestion.answers.map(a =>
      a.id === answerId
        ? { ...a, next_question: null, is_correct: null }
        : a
    );
    this.updateQuestion({ answers: updatedAnswers });
  }

  setCorrectAnswer(answerId: number): void {
    const answer = this.currentQuestion.answers.find(a => a.id === answerId);
    if (answer?.next_question) {
      const updatedAnswers = this.currentQuestion.answers.map(a =>
        a.id === answerId
          ? { ...a, next_question: null, is_correct: true }
          : a
      );
      this.updateQuestion({ answers: updatedAnswers });
    } else {
      this.updateAnswer(answerId, 'is_correct', true);
    }
  }

  setIncorrectAnswer(answerId: number): void {
    const answer = this.currentQuestion.answers.find(a => a.id === answerId);
    if (answer?.next_question) {
      const updatedAnswers = this.currentQuestion.answers.map(a =>
        a.id === answerId
          ? { ...a, next_question: null, is_correct: false }
          : a
      );
      this.updateQuestion({ answers: updatedAnswers });
    } else {
      this.updateAnswer(answerId, 'is_correct', false);
    }
  }
}
