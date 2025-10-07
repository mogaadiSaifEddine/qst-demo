import React, { useState } from 'react';
import { X, Plus, GitBranch, ChevronDown, Edit, Home, CheckCircle, Trash2, Upload, Link, Search } from 'lucide-react';
import './App.css'
const QuestionBuilder = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [navigationStack, setNavigationStack] = useState(['root']);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState(['en', 'fr', 'is']);
  const [showTreeNavigation, setShowTreeNavigation] = useState(false);
  const [treeWidth, setTreeWidth] = useState(320);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkingAnswerId, setLinkingAnswerId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [existingQuestionsState, setExistingQuestionsState] = useState({
    'existing-1': {
      id: 1,
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
          order: 1
        },
        {
          id: 2,
          res_answer: {
            en: 'London',
            fr: 'Londres',
            is: 'London'
          },
          res_explain: {
            en: 'Incorrect. London is the capital of England.',
            fr: 'Incorrect. Londres est la capitale de l\'Angleterre.',
            is: 'Rangt. London er höfuðborg Englands.'
          },
          is_correct: false,
          image: null,
          explain_image: null,
          order: 2
        }
      ],
      category: 'Geography',
      tags: { geography: true, europe: true }
    }
  });

  const getExistingQuestions = () => existingQuestionsState;

  const [questions, setQuestions] = useState({
    root: {
      id: 'root',
      question: {
        en: '',
        fr: '',
        is: ''
      },
      hint: {
        en: '',
        fr: '',
        is: ''
      },
      question_type: 'multiple-choice',
      question_image: null,
      hint_image: null,
      answers: [
        {
          id: 1,
          res_answer: {
            en: '',
            fr: '',
            is: ''
          },
          res_explain: {
            en: '',
            fr: '',
            is: ''
          },
          image: null,
          explain_image: null,
          next_question: null,
          is_correct: null,
          order: 1
        },
        {
          id: 2,
          res_answer: {
            en: '',
            fr: '',
            is: ''
          },
          res_explain: {
            en: '',
            fr: '',
            is: ''
          },
          image: null,
          explain_image: null,
          next_question: null,
          is_correct: null,
          order: 2
        }
      ],
      category: 'Other',
      tags: {}
    }
  });

  const currentQuestionId = navigationStack[navigationStack.length - 1];
  const currentQuestion = questions[currentQuestionId] || questions['root'];
  const isRoot = currentQuestionId === 'root';

  const hasDecisionTreeQuestions = () => {
    return Object.values(questions).some(q => q.question_type === 'decision-tree') ||
      Object.values(getExistingQuestions()).some(q => q.question_type === 'decision-tree');
  };

  const getQuestionTypeDisplay = (type) => {
    const types = {
      'decision-tree': 'Decision Tree',
      'multiple-choice': 'Multiple Choice',
      'written-answer': 'Written Answer'
    };
    return types[type] || type;
  };

  const getActualQuestionType = (question) => {
    console.log(question);

    if (!question || !question.answers) return question?.question_type || 'multiple-choice';

    if (question.question_type === 'written-answer') {
      return 'written-answer';
    }

    const hasNestedQuestions = question.answers.some(answer => answer.next_question);
    return hasNestedQuestions ? 'decision-tree' : 'multiple-choice';
  };

  const updateQuestionTypeBasedOnContent = (questionUpdates) => {
    const updatedQuestion = { ...currentQuestion, ...questionUpdates };

    if (updatedQuestion.question_type === 'written-answer') {
      return questionUpdates;
    }

    const actualType = getActualQuestionType(updatedQuestion);
    if (actualType !== updatedQuestion.question_type && actualType === 'decision-tree') {
      return { ...questionUpdates, question_type: 'decision-tree' };
    }

    if (updatedQuestion.question_type === 'decision-tree' && actualType === 'multiple-choice') {
      return { ...questionUpdates, question_type: 'multiple-choice' };
    }

    return questionUpdates;
  };

  const updateCurrentQuestion = (updates) => {
    const finalUpdates = updateQuestionTypeBasedOnContent(updates);
    setQuestions(prev => ({
      ...prev,
      [currentQuestionId]: {
        ...currentQuestion,
        ...finalUpdates
      }
    }));
  };

  const navigateToQuestion = (questionId) => {
    const targetQuestion = questions[questionId] || getExistingQuestions()[questionId];

    if (!targetQuestion) {
      alert('This question no longer exists. It may have been deleted.');
      return;
    }

    if (getExistingQuestions()[questionId] && !questions[questionId]) {
      setQuestions(prev => ({
        ...prev,
        [questionId]: getExistingQuestions()[questionId]
      }));
    }
    setNavigationStack([...navigationStack, questionId]);
    setCurrentStep(2);
  };

  const navigateToQuestionFromTree = (questionId) => {
    const targetQuestion = questions[questionId] || getExistingQuestions()[questionId];

    if (!targetQuestion) {
      alert('This question no longer exists. It may have been deleted.');
      return;
    }

    if (getExistingQuestions()[questionId] && !questions[questionId]) {
      setQuestions(prev => ({
        ...prev,
        [questionId]: getExistingQuestions()[questionId]
      }));
    }

    // For tree navigation, we need to build the correct navigation stack
    const findPathToQuestion = (targetId, currentId = 'root', path = ['root']) => {
      if (currentId === targetId) {
        return path;
      }

      const currentQ = questions[currentId] || getExistingQuestions()[currentId];
      if (!currentQ || !currentQ.answers) {
        return null;
      }

      for (const answer of currentQ.answers) {
        if (answer.next_question && answer.next_question.id) {
          const foundPath = findPathToQuestion(targetId, answer.next_question.id, [...path, answer.next_question.id]);
          if (foundPath) {
            return foundPath;
          }
        }
      }

      return null;
    };

    const pathToQuestion = findPathToQuestion(questionId);
    if (pathToQuestion) {
      setNavigationStack(pathToQuestion);
    } else {
      setNavigationStack([questionId]);
    }

    setCurrentStep(2);
  };

  const navigateBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack(navigationStack.slice(0, -1));
      setCurrentStep(2);
    }
  };

  const navigateToRoot = () => {
    setNavigationStack(['root']);
    setCurrentStep(2);
  };

  const updateQuestionText = (value) => {
    const updatedQuestion = {
      ...currentQuestion.question,
      [currentLanguage]: value
    };
    updateCurrentQuestion({ question: updatedQuestion });
  };

  const updateAnswerText = (answerId, value) => {
    const updatedAnswers = currentQuestion.answers.map(a => {
      if (a.id === answerId) {
        return {
          ...a,
          res_answer: {
            ...a.res_answer,
            [currentLanguage]: value
          }
        };
      }
      return a;
    });
    updateCurrentQuestion({ answers: updatedAnswers });
  };

  const getQuestionText = () => {
    return currentQuestion.question?.[currentLanguage] || '';
  };

  const getAnswerText = (answer) => {
    return answer.res_answer?.[currentLanguage] || '';
  };

  const updateAnswer = (answerId, field, value) => {
    const updatedAnswers = currentQuestion.answers.map(a =>
      a.id === answerId ? { ...a, [field]: value } : a
    );
    updateCurrentQuestion({ answers: updatedAnswers });
  };

  const addAnswer = () => {
    const newId = Math.max(...currentQuestion.answers.map(a => a.id), 0) + 1;
    const newOrder = Math.max(...currentQuestion.answers.map(a => a.order || 0), 0) + 1;

    const newAnswer = {
      id: newId,
      res_answer: availableLanguages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {}),
      res_explain: availableLanguages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {}),
      image: null,
      explain_image: null,
      order: newOrder,
      next_question: null,
      is_correct: null
    };

    updateCurrentQuestion({
      answers: [...currentQuestion.answers, newAnswer]
    });
  };

  const removeAnswer = (answerId) => {
    if (currentQuestion.answers.length > 1) {
      updateCurrentQuestion({
        answers: currentQuestion.answers.filter(a => a.id !== answerId)
      });
    }
  };

  const createBranchQuestion = (answerId) => {
    const newQuestionId = `q-${Date.now()}`;

    const newQuestion = {
      id: newQuestionId,
      parentId: currentQuestionId,
      parentAnswerId: answerId,
      question: availableLanguages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {}),
      hint: availableLanguages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {}),
      question_type: 'multiple-choice',
      question_image: null,
      hint_image: null,
      answers: [
        {
          id: 1,
          res_answer: availableLanguages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {}),
          res_explain: availableLanguages.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {}),
          image: null,
          explain_image: null,
          next_question: null,
          is_correct: null,
          order: 1
        },

      ],
      category: 'Other',
      tags: {}
    };

    setQuestions(prev => ({
      ...prev,
      [newQuestionId]: newQuestion,
      [currentQuestionId]: {
        ...currentQuestion,
        question_type: 'decision-tree',
        answers: currentQuestion.answers.map(a =>
          a.id === answerId
            ? { ...a, next_question: newQuestion, is_correct: null }
            : a
        )
      }
    }));

    setNavigationStack([...navigationStack, newQuestionId]);
    setCurrentStep(1);
  };

  const linkExistingQuestion = (answerId, existingQuestionId) => {
    const existingQuestion = getExistingQuestions()[existingQuestionId];
    const linkedQuestion = {
      ...existingQuestion,
      parentId: currentQuestionId,
      parentAnswerId: answerId
    };

    setQuestions(prev => ({
      ...prev,
      [existingQuestionId]: linkedQuestion,
      [currentQuestionId]: {
        ...currentQuestion,
        question_type: 'decision-tree',
        answers: currentQuestion.answers.map(a =>
          a.id === answerId
            ? { ...a, next_question: linkedQuestion, is_correct: null }
            : a
        )
      }
    }));

    setShowLinkDialog(false);
    setLinkingAnswerId(null);
    setSearchTerm('');
  };

  const getFilteredExistingQuestions = () => {
    return Object.values(getExistingQuestions()).filter(q =>
      q.question[currentLanguage]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.keys(q.tags || {}).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getBranchQuestion = (answer) => {
    if (!answer.next_question) return null;

    const questionId = answer.next_question.id;

    if (questions[questionId]) {
      return questions[questionId];
    }

    if (getExistingQuestions()[questionId]) {
      return getExistingQuestions()[questionId];
    }

    return {
      id: questionId,
      question_type: 'deleted',
      question: {
        [currentLanguage]: '⚠️ Question Deleted'
      },
      answers: [],
      isDeleted: true
    };
  };

  const getBreadcrumbs = () => {
    return navigationStack.map(qId => {
      if (qId === 'root') return { id: 'root', label: 'Main Question' };

      const q = questions[qId] || getExistingQuestions()[qId];
      if (!q) {
        return { id: qId, label: '⚠️ Deleted Question' };
      }

      if (q.parentId && q.parentAnswerId) {
        const parentQuestion = questions[q.parentId] || getExistingQuestions()[q.parentId];
        if (parentQuestion) {
          const parentAnswer = parentQuestion.answers?.find(a => a.id === q.parentAnswerId);
          if (parentAnswer && parentAnswer.res_answer?.[currentLanguage]) {
            return {
              id: qId,
              label: parentAnswer.res_answer[currentLanguage]
            };
          }
        }
      }

      return {
        id: qId,
        label: q.question?.[currentLanguage] || 'Untitled Question'
      };
    });
  };

  // Tree navigation helper functions
  const buildQuestionTree = (questionId = 'root', visited = new Set()) => {
    if (visited.has(questionId)) return null;
    visited.add(questionId);

    const question = questions[questionId] || getExistingQuestions()[questionId];
    if (!question) return null;

    const children = [];
    if (question.answers && question.answers.length > 0) {
      question.answers.forEach(answer => {
        if (answer.next_question && answer.next_question.id) {
          const childTree = buildQuestionTree(answer.next_question.id, new Set(visited));
          if (childTree) {
            children.push({
              answer,
              question: childTree
            });
          }
        }
      });
    }

    return {
      id: questionId,
      question,
      children
    };
  };

  const toggleNodeCollapse = (nodeId) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const renderTreeNode = (node, level = 0) => {
    if (!node) return null;

    const { id, question, children } = node;
    const isCurrentQuestion = id === currentQuestionId;
    const isDeleted = question.isDeleted || (!questions[id] && !getExistingQuestions()[id]);
    const isCollapsed = collapsedNodes.has(id);
    const hasChildren = children.length > 0;

    return (
      <div key={id} className="tree-node">
        {level > 0 && (
          <div
            className="absolute w-px bg-gray-300"
            style={{
              left: `${level * 20 - 10}px`,
              top: '-12px',
              height: '12px'
            }}
          />
        )}

        <div
          className={`relative flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${isCurrentQuestion
            ? 'bg-blue-100 border-l-4'
            : 'hover:bg-gray-50'
            } ${isDeleted ? 'bg-red-50' : ''}`}
          style={{
            marginLeft: `${level * 20}px`,
            borderLeftColor: isCurrentQuestion ? '#688cd5' : 'transparent',
            borderLeftWidth: isCurrentQuestion ? '4px' : '0px'
          }}
        >
          {level > 0 && (
            <div
              className="absolute w-3 h-px bg-gray-300"
              style={{ left: '-12px', top: '50%' }}
            />
          )}

          {level > 0 && (
            <div className="absolute -left-4 top-1/2 transform -translate-y-1/2">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-1" onClick={() => navigateToQuestionFromTree(id)}>
            <div className="w-4 flex justify-center">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNodeCollapse(id);
                  }}
                  className="hover:bg-gray-200 rounded p-0.5 transition-colors"
                >
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                  />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: level }, (_, i) => (
                <div
                  key={i}
                  className="w-1 h-4 rounded-full"
                  style={{ backgroundColor: level === 0 ? '#688cd5' : level === 1 ? '#94a3b8' : '#cbd5e1' }}
                />
              ))}
            </div>

            <div className={`text-xs px-2 py-1 rounded font-semibold ${isDeleted ? 'bg-red-100 text-red-600' :
              level === 0 ? 'bg-blue-100 text-blue-700' :
                level === 1 ? 'bg-pink-100 text-pink-700' :
                  'bg-gray-100 text-gray-600'
              }`}>
              {isDeleted ? 'DELETED' : getQuestionTypeDisplay(getActualQuestionType(question)).toUpperCase()}
            </div>

            <span className={`text-sm flex-1 ${isDeleted ? 'text-red-600' :
              isCurrentQuestion ? 'font-semibold text-blue-700' :
                level === 0 ? 'font-medium text-gray-800' :
                  'text-gray-700'
              }`} style={{
                maxWidth: `${treeWidth - 180}px`,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
              {id === 'root'
                ? 'Main Question'
                : question.question?.[currentLanguage] || 'Untitled Question'
              }
            </span>
          </div>
        </div>

        {!isCollapsed && children.map((child, index) => (
          <div key={`${id}-${index}`} className="relative">
            <div
              className="flex items-center gap-2 py-2 text-xs text-gray-500 relative"
              style={{ marginLeft: `${(level + 1) * 20}px` }}
            >
              <div
                className="absolute w-px bg-gray-300"
                style={{
                  left: '-10px',
                  top: '-8px',
                  height: '16px'
                }}
              />

              <div className="w-4 h-px bg-gray-300"></div>

              <span className={`px-3 py-1.5 rounded-full border-2 text-xs font-medium ${level === 0 ? 'bg-pink-50 border-pink-200 text-pink-700' :
                level === 1 ? 'bg-pink-50 border-pink-200 text-pink-700' :
                  'bg-gray-50 border-gray-200 text-gray-600'
                }`} style={{
                  maxWidth: `${treeWidth - 100}px`,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                {child.answer.res_answer?.[currentLanguage] || 'Empty Answer'}
              </span>
            </div>
            {renderTreeNode(child.question, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .tree-node { position: relative; }
      `}</style>

      <div className="flex gap-6">
        {showTreeNavigation && (
          <div
            className="bg-white rounded-lg shadow-lg animate-fadeIn relative flex"
            style={{ width: `${treeWidth}px`, minWidth: '250px', maxWidth: '600px' }}
          >
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <GitBranch size={16} style={{ color: '#688cd5' }} />
                    Question Tree
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCollapsedNodes(new Set())}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      title="Expand All"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={() => setShowTreeNavigation(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto flex-1">
                {renderTreeNode(buildQuestionTree())}
              </div>
            </div>

            {/* Resize Handle */}
            <div
              className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors flex-shrink-0"
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = treeWidth;

                const handleMouseMove = (e) => {
                  const newWidth = startWidth + (e.clientX - startX);
                  setTreeWidth(Math.max(250, Math.min(600, newWidth)));
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-0.5 h-8 bg-gray-400 rounded"></div>
              </div>
            </div>
          </div>
        )}

        <div className={`bg-white rounded-lg shadow-lg transition-all duration-300 ${showTreeNavigation ? 'flex-1' : 'max-w-4xl mx-auto w-full'
          }`} style={showTreeNavigation ? { width: `calc(100% - ${treeWidth + 24}px)` } : {}}>
          <div className="p-6 border-b" style={{ backgroundColor: '#688cd5' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-white">Create Question</h2>
              <div className="flex items-center gap-2">
                {hasDecisionTreeQuestions() && (
                  <button
                    onClick={() => setShowTreeNavigation(!showTreeNavigation)}
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${showTreeNavigation
                      ? 'bg-white'
                      : 'text-white hover:bg-white/20'
                      }`}
                    style={showTreeNavigation ? { color: '#688cd5' } : {}}
                  >
                    <GitBranch size={16} />
                    Tree View
                  </button>
                )}
                <button className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {!isRoot && (
              <div className="flex items-center gap-2 flex-wrap">
                {getBreadcrumbs().map((crumb, index) => (
                  <div key={crumb.id} className="flex items-center gap-2">
                    {index > 0 && <ChevronDown className="rotate-[-90deg] text-white/60" size={16} />}
                    <button
                      onClick={() => {
                        if (crumb.id === 'root') {
                          navigateToRoot();
                        } else {
                          const targetIndex = navigationStack.indexOf(crumb.id);
                          setNavigationStack(navigationStack.slice(0, targetIndex + 1));
                          setCurrentStep(2);
                        }
                      }}
                      className={`text-sm px-3 py-1 rounded transition-colors ${index === getBreadcrumbs().length - 1
                        ? 'bg-white font-semibold'
                        : 'text-white/80 hover:bg-white/20'
                        }`}
                      style={index === getBreadcrumbs().length - 1 ? { color: '#688cd5' } : {}}
                    >
                      {index === 0 && <Home size={14} className="inline mr-1" />}
                      {crumb.label.substring(0, 25)}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2 flex-wrap">
              {availableLanguages.map((lang) => {
                const langNames = {
                  en: 'English', fr: 'French', is: 'Icelandic'
                };

                return (
                  <button
                    key={lang}
                    onClick={() => setCurrentLanguage(lang)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${currentLanguage === lang
                      ? 'bg-white border-b-2 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    style={currentLanguage === lang ? { borderBottomColor: '#688cd5', color: '#688cd5' } : {}}
                  >
                    <span>{langNames[lang] || lang}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex border-b">
            <div
              className={`flex-1 p-4 text-center border-r cursor-pointer transition-colors ${currentStep === 1 ? 'bg-blue-50 border-b-2' : 'hover:bg-gray-50'
                }`}
              onClick={() => setCurrentStep(1)}
              style={currentStep === 1 ? { borderBottomColor: '#688cd5' } : {}}
            >
              <div
                className={`text-xs font-semibold mb-1 ${currentStep === 1 ? '' : 'text-gray-500'}`}
                style={currentStep === 1 ? { color: '#688cd5' } : {}}
              >
                STEP 1
              </div>
              <div className={`text-sm font-medium ${currentStep === 1 ? 'text-gray-900' : 'text-gray-600'}`}>
                Write Question
              </div>
            </div>
            <div
              className={`flex-1 p-4 text-center cursor-pointer transition-colors ${currentStep === 2 ? 'bg-blue-50 border-b-2' : 'hover:bg-gray-50'
                }`}
              onClick={() => setCurrentStep(2)}
              style={currentStep === 2 ? { borderBottomColor: '#688cd5' } : {}}
            >
              <div
                className={`text-xs font-semibold mb-1 ${currentStep === 2 ? '' : 'text-gray-500'}`}
                style={currentStep === 2 ? { color: '#688cd5' } : {}}
              >
                STEP 2
              </div>
              <div className={`text-sm font-medium ${currentStep === 2 ? 'text-gray-900' : 'text-gray-600'}`}>
                Configure Answers
              </div>
            </div>
          </div>

          <div className="p-8">
            {currentStep === 1 ? (
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Question Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['multiple-choice', 'written-answer'].map(type => (
                      <button
                        key={type}
                        onClick={() => updateCurrentQuestion({ question_type: type })}
                        className={`p-4 border-2 rounded-lg text-center transition-all ${currentQuestion.question_type === type
                          ? 'text-white border-transparent shadow-md'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        style={currentQuestion.question_type === type ? { backgroundColor: '#688cd5' } : {}}
                      >
                        <div className="font-semibold text-sm mb-1">
                          {getQuestionTypeDisplay(type)}
                        </div>
                        <div className="text-xs opacity-80">
                          {type === 'multiple-choice' && 'Select from multiple options'}
                          {type === 'written-answer' && 'Open text response'}
                        </div>
                      </button>
                    ))}
                  </div>
                  {getActualQuestionType(currentQuestion) === 'decision-tree' && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-blue-700">
                        <strong>Auto-detected as Decision Tree:</strong> This multiple choice question has nested questions, making it a decision tree.
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Question Text</label>
                  <div className="flex gap-3 items-start">
                    <textarea
                      placeholder="Type your question here..."
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent text-lg"
                      rows={4}
                      value={getQuestionText()}
                      onChange={(e) => updateQuestionText(e.target.value)}
                    />
                    <button className="flex-shrink-0 w-24 h-24 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex flex-col items-center justify-center gap-1 bg-white">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8eef7' }}>
                        <Upload size={24} style={{ color: '#688cd5' }} />
                      </div>
                      <span className="text-xs text-gray-600">Select Image</span>
                    </button>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!getQuestionText().trim()}
                    className="w-full px-6 py-4 hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors text-lg"
                    style={{ backgroundColor: '#688cd5' }}
                  >
                    Continue to Answers →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="px-6 py-4 border rounded-lg" style={{ backgroundColor: '#e8eef7' }}>
                  <div className="text-xs font-semibold mb-1 uppercase" style={{ color: '#688cd5' }}>
                    {getQuestionTypeDisplay(getActualQuestionType(currentQuestion))}:
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {getQuestionText() || <span className="text-gray-400 italic">No question text yet</span>}
                  </div>
                </div>

                {getActualQuestionType(currentQuestion) === 'written-answer' ? (
                  <div className="text-center text-gray-600 py-8">
                    <div className="text-lg font-semibold mb-2">Written Answer Question</div>
                    <p>This question will collect open-text responses from users.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentQuestion.answers.map((answer, index) => (
                      <div key={answer.id} className="border-2 border-gray-200 rounded-lg p-5">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-sm"
                            style={{ backgroundColor: '#688cd5' }}>
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex gap-3 items-start">
                              <textarea
                                placeholder="Answer text"
                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent"
                                rows={3}
                                value={getAnswerText(answer)}
                                onChange={(e) => updateAnswerText(answer.id, e.target.value)}
                              />
                              <button className="flex-shrink-0 w-24 h-24 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex flex-col items-center justify-center gap-1 bg-white">
                                <Upload size={24} style={{ color: '#688cd5' }} />
                                <span className="text-xs text-gray-600">Select Image</span>
                              </button>
                            </div>

                            {!answer.next_question && (

                              <div className="border-2 rounded-lg p-4" style={{ backgroundColor: '#f5f7fb', borderColor: '#d0dbed' }}>
                                <div className="flex items-center gap-2 mb-3 font-semibold text-sm" style={{ color: '#688cd5' }}>
                                  <CheckCircle size={16} />
                                  <span>Answer Status</span>
                                </div>
                                <div className="flex items-center gap-6">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`answer-${answer.id}`}
                                      checked={answer.is_correct === true}
                                      onChange={() => updateAnswer(answer.id, 'is_correct', true)}
                                      className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Correct</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`answer-${answer.id}`}
                                      checked={answer.is_correct === false}
                                      onChange={() => updateAnswer(answer.id, 'is_correct', false)}
                                      className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Incorrect</span>
                                  </label>
                                </div>
                              </div>
                            )}

                            {currentQuestion.question_type !== 'written-answer' && answer.is_correct == null && (
                              <div className="border-2 rounded-lg p-4" style={{ backgroundColor: '#f5f7fb', borderColor: '#d0dbed' }}>
                                <div className="flex items-center gap-2 mb-3 font-semibold text-sm" style={{ color: '#688cd5' }}>
                                  <GitBranch size={16} />
                                  <span>What happens next?</span>
                                </div>

                                <div className="space-y-3">
                                  {answer.next_question && (
                                    <div className="bg-white border rounded-lg p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold px-2 py-1 rounded"
                                              style={{ backgroundColor: '#e8eef7', color: '#688cd5' }}>
                                              {getQuestionTypeDisplay(getBranchQuestion(answer)?.question_type || 'unknown')}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              {getExistingQuestions()[answer.next_question.id] ? 'Linked' : 'Created'}
                                            </span>
                                          </div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {getBranchQuestion(answer)?.question?.[currentLanguage] || 'Untitled Question'}
                                          </div>
                                        </div>
                                       
                                      </div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => answer.next_question
                                        ? navigateToQuestion(answer.next_question.id)
                                        : createBranchQuestion(answer.id)
                                      }
                                      className="px-4 py-2.5 hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                                      style={{ backgroundColor: '#688cd5' }}
                                    >
                                      {answer.next_question ? (
                                        <>
                                          <Edit size={18} />
                                          Edit Question
                                        </>
                                      ) : (
                                        <>
                                          <Plus size={18} />
                                          New Question
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (answer.next_question) {
                                          const updatedAnswers = currentQuestion.answers.map(a =>
                                            a.id === answer.id
                                              ? { ...a, next_question: null, is_correct: null }
                                              : a
                                          );
                                          updateCurrentQuestion({ answers: updatedAnswers });
                                        } else {
                                          setLinkingAnswerId(answer.id);
                                          setShowLinkDialog(true);
                                        }
                                      }}
                                      className="px-4 py-2.5 hover:opacity-90 border-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                                      style={{
                                        borderColor: '#688cd5',
                                        color: '#688cd5'
                                      }}
                                    >
                                      {answer.next_question ? (
                                        <>
                                          <X size={18} />
                                          Unlink
                                        </>
                                      ) : (
                                        <>
                                          <Link size={18} />
                                          Link Existing
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {currentQuestion.answers.length > 1 && (
                            <button
                              onClick={() => removeAnswer(answer.id)}
                              className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addAnswer}
                      className="w-full px-4 py-3 border-2 border-dashed hover:opacity-90 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
                      style={{ borderColor: '#688cd5', color: '#688cd5', backgroundColor: 'transparent' }}
                    >
                      <Plus size={20} />
                      Add Another Answer
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="flex items-center gap-3">
                    {!isRoot && (
                      <button
                        onClick={navigateBack}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                      >
                        ← Back
                      </button>
                    )}
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">{Object.keys(questions).length}</span> questions in tree
                    </div>
                  </div>

                  <button
                    onClick={navigateToRoot}
                    className="px-8 py-3 hover:opacity-90 text-white rounded-lg font-semibold transition-colors"
                    style={{ backgroundColor: '#688cd5' }}
                  >
                    Save Question
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Link Existing Question</h3>
                <button
                  onClick={() => {
                    setShowLinkDialog(false);
                    setLinkingAnswerId(null);
                    setSearchTerm('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search questions..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {getFilteredExistingQuestions().map(question => (
                  <div key={question.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-1 rounded"
                            style={{ backgroundColor: '#e8eef7', color: '#688cd5' }}>
                            {getQuestionTypeDisplay(question.question_type)}
                          </span>
                          <span className="text-xs text-gray-500">{question.category}</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {question.question[currentLanguage] || 'Untitled Question'}
                        </div>
                      </div>
                      <button
                        onClick={() => linkExistingQuestion(linkingAnswerId, question.id)}
                        className="px-3 py-1.5 hover:opacity-80 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
                        style={{ backgroundColor: '#688cd5' }}
                      >
                        <Link size={14} />
                        Link
                      </button>
                    </div>
                  </div>
                ))}

                {getFilteredExistingQuestions().length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p>No questions found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBuilder;