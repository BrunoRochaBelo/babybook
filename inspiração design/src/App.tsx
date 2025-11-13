import { useState } from "react";
import { LandingPage } from "./components/LandingPage";
import { AuthLogin } from "./components/AuthLogin";
import { Checkout } from "./components/Checkout";
import { SetupWizard } from "./components/SetupWizard";
import { Dashboard } from "./components/Dashboard";
import { ChapterView } from "./components/ChapterView";
import { MomentForm } from "./components/MomentForm";
import { HealthModule } from "./components/HealthModule";
import { Guestbook } from "./components/Guestbook";
import { Settings } from "./components/Settings";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";

type Screen = 
  | 'landing' 
  | 'login' 
  | 'checkout' 
  | 'setup' 
  | 'dashboard' 
  | 'chapter' 
  | 'moment' 
  | 'health' 
  | 'guestbook' 
  | 'settings';

interface BabyData {
  name: string;
  birthDate: string;
  mode: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [babyData, setBabyData] = useState<BabyData | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedMoment, setSelectedMoment] = useState<string>('');

  const handleGetStarted = () => {
    setCurrentScreen('login');
  };

  const handleLogin = () => {
    setCurrentScreen('checkout');
  };

  const handleCheckoutComplete = () => {
    setCurrentScreen('setup');
  };

  const handleSetupComplete = (data: BabyData) => {
    setBabyData(data);
    setCurrentScreen('dashboard');
  };

  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapter(chapterId);
    setCurrentScreen('chapter');
  };

  const handleAddMoment = (momentId: string) => {
    setSelectedMoment(momentId);
    setCurrentScreen('moment');
  };

  const handleMomentSaved = () => {
    setCurrentScreen('chapter');
  };

  const handleBackToDashboard = () => {
    setSelectedChapter('');
    setCurrentScreen('dashboard');
  };

  const handleBackToChapter = () => {
    setSelectedMoment('');
    setCurrentScreen('chapter');
  };

  const handleNavigate = (section: 'memories' | 'health' | 'visits') => {
    if (section === 'memories') {
      setCurrentScreen('dashboard');
    } else if (section === 'health') {
      setCurrentScreen('health');
    } else if (section === 'guestbook' || section === 'visits') {
      setCurrentScreen('guestbook');
    }
  };

  const handleSettings = () => {
    setCurrentScreen('settings');
  };

  const handleLogout = () => {
    setBabyData(null);
    setCurrentScreen('landing');
  };

  const getChapterTitle = (chapterId: string): string => {
    const chapters: { [key: string]: string } = {
      'great-day': 'O Grande Dia',
      'first-month': 'Primeiro Mês',
      'milestones': 'Marcos de Desenvolvimento',
      'first-times': 'Primeiras Vezes',
      'celebrations': 'Celebrações',
      'adventures': 'Aventuras'
    };
    return chapters[chapterId] || 'Capítulo';
  };

  const getMomentTitle = (momentId: string): string => {
    const moments: { [key: string]: string } = {
      'birth-moment': 'O momento do nascimento',
      'first-photo': 'Primeira foto',
      'first-cry': 'Primeiro choro',
      'skin-to-skin': 'Primeiro contato pele a pele',
      'first-bath': 'Primeiro banho',
      'going-home': 'Chegada em casa',
      'visitors': 'Primeiras visitas',
      'feeding': 'Primeira mamada'
    };
    return moments[momentId] || 'Momento Especial';
  };

  const getMomentData = (momentId: string) => {
    const momentsData: { [key: string]: { title: string; description: string; isRecurrent: boolean; existingCount: number } } = {
      'birth-moment': { 
        title: 'O momento do nascimento', 
        description: 'Data, hora, peso e medida',
        isRecurrent: false,
        existingCount: 0
      },
      'first-photo': { 
        title: 'Primeira foto', 
        description: 'A primeira imagem de vida',
        isRecurrent: false,
        existingCount: 0
      },
      'first-cry': { 
        title: 'Primeiro choro', 
        description: 'Grave o som mais especial',
        isRecurrent: false,
        existingCount: 0
      },
      'skin-to-skin': { 
        title: 'Primeiro contato pele a pele', 
        description: 'O primeiro abraço',
        isRecurrent: false,
        existingCount: 0
      },
      'first-bath': { 
        title: 'Primeiro banho', 
        description: 'O momento da limpeza',
        isRecurrent: false,
        existingCount: 0
      },
      'going-home': { 
        title: 'Chegada em casa', 
        description: 'O primeiro dia no lar',
        isRecurrent: false,
        existingCount: 0
      },
      'visitors': { 
        title: 'Primeiras visitas', 
        description: 'Família e amigos conhecendo',
        isRecurrent: true,
        existingCount: 3
      },
      'feeding': { 
        title: 'Primeira mamada', 
        description: 'O início da nutrição',
        isRecurrent: false,
        existingCount: 0
      }
    };
    return momentsData[momentId] || { 
      title: 'Momento Especial', 
      description: '',
      isRecurrent: false,
      existingCount: 0
    };
  };

  return (
    <ThemeProvider>
      {currentScreen === 'landing' && (
        <LandingPage onGetStarted={handleGetStarted} />
      )}

      {currentScreen === 'login' && (
        <AuthLogin onLogin={handleLogin} />
      )}

      {currentScreen === 'checkout' && (
        <Checkout onComplete={handleCheckoutComplete} />
      )}

      {currentScreen === 'setup' && (
        <SetupWizard onComplete={handleSetupComplete} />
      )}

      {currentScreen === 'dashboard' && babyData && (
        <Dashboard 
          babyName={babyData.name}
          onSelectChapter={handleSelectChapter}
          onNavigate={handleNavigate}
          onSettings={handleSettings}
        />
      )}

      {currentScreen === 'chapter' && babyData && (
        <ChapterView 
          chapterId={selectedChapter}
          chapterTitle={getChapterTitle(selectedChapter)}
          babyName={babyData.name}
          onBack={handleBackToDashboard}
          onAddMoment={handleAddMoment}
        />
      )}

      {currentScreen === 'moment' && babyData && (() => {
        const momentData = getMomentData(selectedMoment);
        return (
          <MomentForm 
            momentTitle={momentData.title}
            momentDescription={momentData.description}
            babyName={babyData.name}
            isRecurrent={momentData.isRecurrent}
            existingRecordsCount={momentData.existingCount}
            onBack={handleBackToChapter}
            onSave={handleMomentSaved}
          />
        );
      })()}

      {currentScreen === 'health' && babyData && (
        <HealthModule 
          babyName={babyData.name}
          onBack={handleBackToDashboard}
        />
      )}

      {currentScreen === 'guestbook' && babyData && (
        <Guestbook 
          babyName={babyData.name}
          onBack={handleBackToDashboard}
        />
      )}

      {currentScreen === 'settings' && (
        <Settings 
          onBack={handleBackToDashboard}
          onLogout={handleLogout}
        />
      )}

      <Toaster position="top-center" />
    </ThemeProvider>
  );
}
