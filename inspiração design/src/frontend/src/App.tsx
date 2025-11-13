import { useState } from "react";
import { LandingPage } from "./pages/LandingPage";
import { AuthLogin } from "./pages/AuthLogin";
import { Checkout } from "./pages/Checkout";
import { SetupWizard } from "./pages/SetupWizard";
import { Dashboard } from "./pages/Dashboard";
import { ChapterView } from "./pages/ChapterView";
import { MomentForm } from "./pages/MomentForm";
import { HealthModule } from "./pages/HealthModule";
import { Guestbook } from "./pages/Guestbook";
import { Settings } from "./pages/Settings";
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
          chapterTitle={getChapterTitle(selectedChapter)}
          babyName={babyData.name}
          onBack={handleBackToDashboard}
          onAddMoment={handleAddMoment}
        />
      )}

      {currentScreen === 'moment' && babyData && (
        <MomentForm 
          momentTitle={getMomentTitle(selectedMoment)}
          babyName={babyData.name}
          onBack={handleBackToChapter}
          onSave={handleMomentSaved}
        />
      )}

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
