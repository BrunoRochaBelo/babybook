import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
const SCREEN_SEQUENCE = [
    { id: 'landing', label: 'Landing' },
    { id: 'login', label: 'Login' },
    { id: 'checkout', label: 'Checkout' },
    { id: 'setup', label: 'Onboarding' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'chapter', label: 'Capítulo' },
    { id: 'moment', label: 'Momento' },
    { id: 'health', label: 'Saúde' },
    { id: 'guestbook', label: 'Visitas' },
    { id: 'settings', label: 'Configurações' }
];
export function CaraCrachaExperience() {
    const [currentScreen, setCurrentScreen] = useState('landing');
    const [babyData, setBabyData] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState('');
    const [selectedMoment, setSelectedMoment] = useState('');
    const handleGetStarted = () => {
        setCurrentScreen('login');
    };
    const handleLogin = () => {
        setCurrentScreen('checkout');
    };
    const handleCheckoutComplete = () => {
        setCurrentScreen('setup');
    };
    const handleSetupComplete = (data) => {
        setBabyData(data);
        setCurrentScreen('dashboard');
    };
    const handleSelectChapter = (chapterId) => {
        setSelectedChapter(chapterId);
        setCurrentScreen('chapter');
    };
    const handleAddMoment = (momentId) => {
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
    const handleNavigate = (section) => {
        if (section === 'memories') {
            setCurrentScreen('dashboard');
        }
        else if (section === 'health') {
            setCurrentScreen('health');
        }
        else if (section === 'guestbook' || section === 'visits') {
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
    const getChapterTitle = (chapterId) => {
        const chapters = {
            'great-day': 'O Grande Dia',
            'first-month': 'Primeiro Mês',
            'milestones': 'Marcos de Desenvolvimento',
            'first-times': 'Primeiras Vezes',
            'celebrations': 'Celebrações',
            'adventures': 'Aventuras'
        };
        return chapters[chapterId] || 'Capítulo';
    };
    const getMomentTitle = (momentId) => {
        const moments = {
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
    const getMomentData = (momentId) => {
        const momentsData = {
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
    return (_jsxs(ThemeProvider, { children: [_jsx("div", { className: "pointer-events-none fixed right-4 top-4 z-[60] hidden xl:block", children: _jsxs("div", { className: "pointer-events-auto rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-2xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/80", children: [_jsx("p", { className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300", children: "Cara-crach\u00E1" }), _jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: SCREEN_SEQUENCE.map((screen) => (_jsx("button", { type: "button", onClick: () => setCurrentScreen(screen.id), className: `rounded-full border px-3 py-1 text-xs font-medium transition hover:shadow ${currentScreen === screen.id
                                    ? 'border-brand-500 bg-brand-500/10 text-brand-600'
                                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-brand-200'}`, children: screen.label }, screen.id))) })] }) }), _jsxs("div", { className: "fixed inset-x-4 bottom-4 z-[60] xl:hidden", children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300", children: "Cara-crach\u00E1 - escolha uma tela" }), _jsx("div", { className: "flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 shadow-lg backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90", children: _jsx("select", { value: currentScreen, onChange: (event) => setCurrentScreen(event.target.value), className: "flex-1 rounded-xl border border-transparent bg-transparent text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none dark:text-slate-200", children: SCREEN_SEQUENCE.map((screen) => (_jsx("option", { value: screen.id, children: screen.label }, screen.id))) }) })] }), currentScreen === 'landing' && (_jsx(LandingPage, { onGetStarted: handleGetStarted })), currentScreen === 'login' && (_jsx(AuthLogin, { onLogin: handleLogin })), currentScreen === 'checkout' && (_jsx(Checkout, { onComplete: handleCheckoutComplete })), currentScreen === 'setup' && (_jsx(SetupWizard, { onComplete: handleSetupComplete })), currentScreen === 'dashboard' && babyData && (_jsx(Dashboard, { babyName: babyData.name, onSelectChapter: handleSelectChapter, onNavigate: handleNavigate, onSettings: handleSettings })), currentScreen === 'chapter' && babyData && (_jsx(ChapterView, { chapterId: selectedChapter, chapterTitle: getChapterTitle(selectedChapter), babyName: babyData.name, onBack: handleBackToDashboard, onAddMoment: handleAddMoment })), currentScreen === 'moment' && babyData && (() => {
                const momentData = getMomentData(selectedMoment);
                return (_jsx(MomentForm, { momentTitle: momentData.title, momentDescription: momentData.description, babyName: babyData.name, isRecurrent: momentData.isRecurrent, existingRecordsCount: momentData.existingCount, onBack: handleBackToChapter, onSave: handleMomentSaved }));
            })(), currentScreen === 'health' && babyData && (_jsx(HealthModule, { babyName: babyData.name, onBack: handleBackToDashboard })), currentScreen === 'guestbook' && babyData && (_jsx(Guestbook, { babyName: babyData.name, onBack: handleBackToDashboard })), currentScreen === 'settings' && (_jsx(Settings, { onBack: handleBackToDashboard, onLogout: handleLogout })), _jsx(Toaster, { position: "top-center" })] }));
}
