import React, { useState } from 'react';
import { GradeLevel, Term, Subject, UserInput } from './types';
import LoadingSpinner from './components/LoadingSpinner';
import LandingPage from './components/LandingPage';
import LessonPlanner from './components/LessonPlanner';
import FlashcardMaker from './components/FlashcardMaker';
import AssessmentGenerator from './components/AssessmentGenerator';
import ExamGenerator from './components/ExamGenerator';
import LibraryManager from './components/LibraryManager';
import ChatAssistant from './components/ChatAssistant';

type ViewState = 'landing' | 'lessons' | 'flashcards' | 'assessment' | 'exams' | 'library';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  
  const [formData, setFormData] = useState<UserInput>({
    teacherName: '',
    grade: GradeLevel.Grade3,
    term: Term.Term1,
    year: new Date().getFullYear().toString(),
    startDate: new Date().toISOString().split('T')[0]
  });

  if (currentView === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentView('lessons')} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans select-none">
      {/* Header - Fixed on top for mobile */}
      <header className="bg-zim-green text-white shadow-lg sticky top-0 z-50 shrink-0">
        <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
          <div 
            className="flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity" 
            onClick={() => setCurrentView('landing')}
          >
            <div className="flex items-center space-x-2">
              <i className="fas fa-book-open text-xl text-zim-yellow"></i>
              <h1 className="text-lg font-bold tracking-tight">ZimEd Planner</h1>
            </div>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded uppercase text-zim-yellow">Heritage Pro</span>
          </div>

          <nav className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide -mx-2 px-2">
            {[
              { id: 'lessons', icon: 'chalkboard-teacher', label: 'Plans' },
              { id: 'flashcards', icon: 'clone', label: 'Study' },
              { id: 'assessment', icon: 'file-alt', label: 'Tests' },
              { id: 'exams', icon: 'scroll', label: 'Exams' },
              { id: 'library', icon: 'book-reader', label: 'Lib' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setCurrentView(tab.id as ViewState)} 
                className={`text-[11px] font-bold py-2 px-4 rounded-full transition-all whitespace-nowrap flex items-center shadow-sm active:scale-95 ${currentView === tab.id ? 'bg-zim-yellow text-zim-black' : 'bg-green-800/50 text-white hover:bg-green-700'}`}
              >
                <i className={`fas fa-${tab.icon} mr-1.5`}></i> {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 py-6 flex-grow overflow-x-hidden">
        
        {currentView === 'library' && <LibraryManager />}
        {currentView === 'exams' && <ExamGenerator />}
        {currentView === 'assessment' && <AssessmentGenerator />}
        {currentView === 'flashcards' && <FlashcardMaker />}
        {currentView === 'lessons' && <LessonPlanner initialTeacherName={formData.teacherName} />}

      </main>

      <ChatAssistant />

      <footer className="bg-gray-800 text-white py-6 shrink-0 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ZimEd Planner &bull; Heritage-Based Tool</p>
        </div>
      </footer>
    </div>
  );
};

export default App;