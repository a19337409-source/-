
import React, { useState, useEffect, useRef } from 'react';
import { EDUCATION_DATA, EducationLevel, Grade, Subject, Unit, Lesson, Message } from './types';
import { getAIExplanation } from './geminiService';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// --- Localization Dictionary ---
const translations: Record<string, Record<string, string>> = {
  ar: {
    welcome: 'أهلاً بك يا بطل! أنا البروفيسور الذكي، رفيقك في رحلة العلم. اختر مرحلتك الدراسية والمادة لنبدأ!',
    appTitle: 'البروفيسور الذكي',
    subtitle: 'تطبيق شامل لكل المنهج المصري، مدعوم بالقصص والذكاء الاصطناعي.',
    startBtn: 'ابدأ التعلم الآن',
    backToLevels: 'العودة للمراحل',
    changeGrade: 'تغيير الصف',
    changeSubject: 'تغيير المادة',
    selectLevel: 'اختر المرحلة التعليمية',
    selectGrade: 'اختر الصف الدراسي',
    selectSubject: 'اختر المادة',
    curriculumIndex: 'فهرس الكتاب والدروس',
    emptyUnits: 'عذراً، محتوى هذا الكتاب سيتم إضافته قريباً.',
    askDirectly: 'اسأل البروفيسور مباشرة',
    settings: 'الإعدادات',
    bgColor: 'لون الخلفية',
    fontSize: 'حجم الخط',
    customBg: 'خلفية مخصصة',
    uploadImg: 'رفع صورة',
    reset: 'إعادة ضبط',
    appLang: 'لغة التطبيق',
    explLang: 'لغة الشرح (AI)',
    voiceAssistant: 'مساعد صوتي',
    close: 'إغلاق',
    tutorTab: 'المعلم الذكي',
    solverTab: 'حل أي سؤال',
    homeTab: 'المناهج',
    placeholder: 'اسأل البروفيسور...',
    preparing: 'جاري تحضير القصة الافتتاحية والشرح...',
    voiceConnecting: 'جاري الاتصال بالبروفيسور...',
    voiceListening: 'تحدث الآن، أنا أسمعك...',
    back: 'عودة',
    memorial: 'صدقة جارية على روح المرحوم : على فج النور محمود',
    prayer: 'ﷺ اللهم صل وسلم على نبينا محمد ﷺ',
    solverIntro: 'أنا جاهز لحل أي سؤال في المنهج! يمكنك كتابة السؤال أو تصويره ورفعه هنا.'
  },
  en: {
    welcome: 'Welcome, Hero! I am the Smart Professor, your companion in the journey of knowledge. Choose your level and subject to start!',
    appTitle: 'Smart Professor',
    subtitle: 'Comprehensive app for the Egyptian curriculum, powered by stories and AI.',
    startBtn: 'Start Learning Now',
    backToLevels: 'Back to Levels',
    changeGrade: 'Change Grade',
    changeSubject: 'Change Subject',
    selectLevel: 'Select Educational Level',
    selectGrade: 'Select Grade',
    selectSubject: 'Select Subject',
    curriculumIndex: 'Book Index & Lessons',
    emptyUnits: 'Sorry, the content for this book will be added soon.',
    askDirectly: 'Ask the Professor Directly',
    settings: 'Settings',
    bgColor: 'Background Color',
    fontSize: 'Font Size',
    customBg: 'Custom Background',
    uploadImg: 'Upload Image',
    reset: 'Reset',
    appLang: 'App Language',
    explLang: 'Explanation Language (AI)',
    voiceAssistant: 'Voice Assistant',
    close: 'Close',
    tutorTab: 'AI Tutor',
    solverTab: 'Problem Solver',
    homeTab: 'Curriculum',
    placeholder: 'Ask the Professor...',
    preparing: 'Preparing the story and explanation...',
    voiceConnecting: 'Connecting to Professor...',
    voiceListening: 'Speak now, I am listening...',
    back: 'Back',
    memorial: 'Ongoing charity for the soul of the late: Ali Fajr Al-Noor Mahmoud',
    prayer: 'ﷺ O Allah, send blessings and peace upon our Prophet Muhammad ﷺ',
    solverIntro: 'I am ready to solve any question! You can type it or upload a photo of it here.'
  }
};

// --- Voice Helpers ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'tutor' | 'solver' | 'voice' | 'settings'>('home');
  
  const [appLang, setAppLang] = useState<'ar' | 'en'>(() => (localStorage.getItem('app-lang') as any) || 'ar');
  const [explLang, setExplLang] = useState<string>(() => localStorage.getItem('expl-lang') || 'ar');
  const [bgColor, setBgColor] = useState<string>(() => localStorage.getItem('app-bg-color') || '#f8fafc');
  const [bgImage, setBgImage] = useState<string | null>(() => localStorage.getItem('app-bg-image'));
  const [fontSize, setFontSize] = useState<number>(() => Number(localStorage.getItem('app-font-size')) || 16);

  const [selectedLevel, setSelectedLevel] = useState<EducationLevel | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const t = translations[appLang];

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([{ role: 'model', text: t.welcome }]);
    }
  }, [t.welcome, chatMessages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  useEffect(() => {
    localStorage.setItem('app-lang', appLang);
    localStorage.setItem('expl-lang', explLang);
    localStorage.setItem('app-bg-color', bgColor);
    localStorage.setItem('app-font-size', fontSize.toString());
    if (bgImage) localStorage.setItem('app-bg-image', bgImage);
    else localStorage.removeItem('app-bg-image');
    
    document.documentElement.dir = appLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = appLang;
  }, [appLang, explLang, bgColor, bgImage, fontSize]);

  useEffect(() => {
    if (activeTab === 'solver' && chatMessages.length === 1 && (chatMessages[0].text === translations.ar.welcome || chatMessages[0].text === translations.en.welcome)) {
        setChatMessages([{ role: 'model', text: t.solverIntro }]);
    }
  }, [activeTab, t.solverIntro, chatMessages]);

  const handleSendMessage = async (text?: string, image?: string) => {
    const messageText = text || userInput;
    if (!messageText.trim() && !image) return;

    const newUserMessage: Message = { role: 'user', text: messageText, image };
    setChatMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    const gradeName = selectedGrade?.name || 'General';
    const subjectName = selectedSubject?.name || 'General';

    const aiResponse = await getAIExplanation(messageText, gradeName, subjectName, explLang, image);
    setChatMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    setIsLoading(false);
  };

  const startLesson = (unit: Unit, lesson: Lesson) => {
    setActiveTab('tutor');
    setChatMessages([
      { role: 'model', text: t.preparing }
    ]);
    const prompt = appLang === 'ar' 
      ? `اشرح لي درس (${lesson.title}) من وحدة (${unit.title}). ابدأ بالقصة الخيالية المشوقة أولاً ثم اشرح المفاهيم الأساسية: ${lesson.description}`
      : `Explain the lesson (${lesson.title}) from the unit (${unit.title}). Start with the fictional story first then explain the key concepts: ${lesson.description}`;
    handleSendMessage(prompt);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSendMessage(appLang === 'ar' ? "إليك هذه الصورة لمساعدتي في حلها أو شرحها:" : "Here is an image for you to help me solve or explain:", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startVoiceAssistant = async () => {
    try {
      setIsVoiceActive(true);
      setActiveTab('voice');
      setVoiceTranscription(t.voiceConnecting);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const gradeName = selectedGrade?.name || 'General';
      const subjectName = selectedSubject?.name || 'General';

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setVoiceTranscription(t.voiceListening);
            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) setVoiceTranscription(prev => prev + message.serverContent!.outputTranscription!.text);
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioCtxRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current.currentTime);
              const audioBuffer = await decodeAudioData(decode(audioData), outputAudioCtxRef.current, 24000, 1);
              const source = outputAudioCtxRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioCtxRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current.values()) { source.stop(); sourcesRef.current.delete(source); }
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsVoiceActive(false),
          onerror: (e: any) => console.error("Live API Error:", e),
        },
        config: {
          // Correct property name
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          systemInstruction: `You are the Smart Professor for (${subjectName}) for (${gradeName}). Always respond in ${explLang === 'ar' ? 'Arabic' : 'English'}. Start with a story when explaining. Be helpful and professional.`,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsVoiceActive(false);
    }
  };

  const stopVoiceAssistant = () => {
    if (sessionRef.current) sessionRef.current.close();
    inputAudioCtxRef.current?.close();
    outputAudioCtxRef.current?.close();
    setIsVoiceActive(false);
    setActiveTab('home');
  };

  const resetSelection = () => {
    setSelectedSubject(null);
    setSelectedGrade(null);
    setSelectedLevel(null);
    setActiveTab('home');
    setChatMessages([{ role: 'model', text: t.welcome }]);
  };

  const backgroundStyles: React.CSSProperties = {
    ...(bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : { backgroundColor: bgColor }),
    fontSize: `${fontSize}px`
  };

  if (showSplash) {
    return (
      <div className="science-gradient h-screen flex flex-col items-center justify-center text-white relative overflow-hidden">
        <div className="absolute top-10 left-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="z-10 text-center px-6">
          <div className="mb-8 flex justify-center">
            <div className="w-32 h-32 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">{t.appTitle}</h1>
          <p className="text-lg md:text-xl text-blue-200 mb-10 max-w-md mx-auto font-light leading-relaxed">{t.subtitle}</p>
          <button onClick={() => setShowSplash(false)} className="group bg-indigo-600 px-10 py-4 font-bold text-white rounded-full shadow-xl hover:bg-indigo-500 transition-all flex items-center gap-3 mx-auto">
            {t.startBtn}
            <svg className={`w-5 h-5 mx-3 ${appLang === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
        <div className="absolute bottom-8 text-sm opacity-40 font-light italic">{t.memorial}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden transition-all duration-500" style={backgroundStyles}>
      <header className="bg-indigo-700 text-white p-4 shadow-lg flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <button onClick={resetSelection} className="bg-white/10 p-2 rounded-xl hover:bg-white/20">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </button>
          <h1 className="text-xl font-bold truncate max-w-[150px] md:max-w-none">
            {selectedSubject ? `${selectedSubject.name}` : t.appTitle}
          </h1>
        </div>
        {selectedSubject && (
          <button onClick={() => activeTab === 'voice' ? stopVoiceAssistant() : startVoiceAssistant()} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === 'voice' ? 'bg-red-500 animate-pulse' : 'bg-white/20 hover:bg-white/30'}`}>
            {activeTab === 'voice' ? t.close : t.voiceAssistant}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z" /></svg>
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto relative z-10">
        {activeTab === 'voice' ? (
           <div className="h-full science-gradient flex flex-col items-center justify-center p-6 text-white text-center">
            <div className="relative mb-8">
               <div className="absolute inset-0 bg-indigo-500 rounded-full animate-pulse-ring opacity-50 scale-150"></div>
               <div className="relative w-32 h-32 bg-white/10 rounded-full flex items-center justify-center glass-panel border-white/30 backdrop-blur-xl shadow-2xl">
                    <svg className={`w-12 h-12 ${isVoiceActive ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z" /></svg>
               </div>
            </div>
            <h2 className="text-xl font-bold mb-4">{selectedSubject?.name} - {selectedGrade?.name}</h2>
            <div className="max-w-md glass-panel p-6 rounded-3xl min-h-[80px] flex items-center justify-center italic text-blue-100/80">{voiceTranscription || (appLang === 'ar' ? "أنا أسمعك الآن..." : "I am listening...")}</div>
            <button onClick={stopVoiceAssistant} className="mt-10 bg-white/10 hover:bg-white/20 border border-white/20 px-8 py-3 rounded-full">{t.back}</button>
          </div>
        ) : activeTab === 'home' ? (
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="space-y-3">
                <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-indigo-100 text-center shadow-sm"><p className="text-indigo-800 font-bold text-lg">{t.prayer}</p></div>
                <div className="bg-amber-50/90 backdrop-blur-md p-2 rounded-2xl border border-amber-100 text-center shadow-sm"><p className="text-amber-900 font-medium text-xs">{t.memorial}</p></div>
            </div>

            {!selectedLevel ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                <h2 className="md:col-span-3 text-2xl font-black text-slate-800 text-center mb-4">{t.selectLevel}</h2>
                {EDUCATION_DATA.map(level => (
                  <button key={level.id} onClick={() => setSelectedLevel(level)} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-all text-center group">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                    <span className="text-xl font-bold text-slate-800">{level.name}</span>
                  </button>
                ))}
              </div>
            ) : !selectedGrade ? (
              <div className="animate-fadeIn">
                <button onClick={() => setSelectedLevel(null)} className="text-indigo-600 font-bold flex items-center gap-2 mb-4 hover:underline"><svg className={`w-4 h-4 ${appLang === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>{t.backToLevels}</button>
                <h2 className="text-2xl font-black text-slate-800 text-center mb-6">{t.selectGrade}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedLevel.grades.map(grade => (
                    <button key={grade.id} onClick={() => setSelectedGrade(grade)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all font-bold text-slate-700">{grade.name}</button>
                  ))}
                </div>
              </div>
            ) : !selectedSubject ? (
              <div className="animate-fadeIn">
                <button onClick={() => setSelectedGrade(null)} className="text-indigo-600 font-bold flex items-center gap-2 mb-4 hover:underline"><svg className={`w-4 h-4 ${appLang === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>{t.changeGrade}</button>
                <h2 className="text-2xl font-black text-slate-800 mb-6">{selectedGrade.name} - {t.selectSubject}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedGrade.subjects.map(subject => (
                    <button key={subject.id} onClick={() => setSelectedSubject(subject)} className="flex flex-col items-center p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                      <div className={`w-16 h-16 ${subject.color} text-white rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>{subject.icon}</div>
                      <span className="font-bold text-slate-800 text-center">{subject.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-fadeIn pb-20">
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setSelectedSubject(null)} className="text-indigo-600 font-bold flex items-center gap-2 hover:underline"><svg className={`w-4 h-4 ${appLang === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>{t.changeSubject}</button>
                  <div className="bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full text-sm font-bold border border-indigo-100">{selectedSubject.name}</div>
                </div>
                
                <h2 className="text-2xl font-black text-slate-800 mb-6">{t.curriculumIndex}</h2>
                <div className="space-y-4">
                  {selectedSubject.units?.map(unit => (
                    <div key={unit.id} className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className={`bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-3 ${appLang === 'en' ? 'flex-row' : 'flex-row-reverse'}`}>
                        <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                        <h3 className="font-black text-slate-800 flex-1">{unit.title}</h3>
                      </div>
                      <div className="p-2">
                        {unit.lessons.map(lesson => (
                          <button key={lesson.id} onClick={() => startLesson(unit, lesson)} className={`w-full p-4 rounded-2xl hover:bg-indigo-600 hover:text-white group flex justify-between items-center transition-all ${appLang === 'ar' ? 'text-right flex-row' : 'text-left flex-row-reverse'}`}>
                             <svg className={`w-5 h-5 opacity-30 group-hover:opacity-100 ${appLang === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                             <div className={`flex items-center gap-4 ${appLang === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
                              <div className={`${appLang === 'ar' ? 'text-right' : 'text-left'}`}>
                                <div className="font-bold">{lesson.title}</div>
                                <div className="text-xs opacity-60 line-clamp-1">{lesson.description}</div>
                              </div>
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-indigo-600 group-hover:bg-white/20 group-hover:text-white">{lesson.id.replace('l','')}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {(!selectedSubject.units || selectedSubject.units.length === 0) && (
                     <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="text-4xl mb-4">📚</div>
                        <p className="text-slate-500 font-medium">{t.emptyUnits}</p>
                        <button onClick={() => setActiveTab('tutor')} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-full font-bold">{t.askDirectly}</button>
                     </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'settings' ? (
          <div className="p-6 max-w-2xl mx-auto space-y-6">
             <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-slate-200">
                <h2 className="text-2xl font-black text-slate-800 mb-8 border-b pb-4">{t.settings}</h2>
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-slate-700 font-bold mb-3">{t.appLang}</label>
                            <select value={appLang} onChange={(e) => setAppLang(e.target.value as any)} className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="ar">العربية</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-700 font-bold mb-3">{t.explLang}</label>
                            <select value={explLang} onChange={(e) => setExplLang(e.target.value)} className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="ar">العربية</option>
                                <option value="en">English</option>
                                <option value="fr">Français</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div>
                          <label className="block text-slate-700 font-bold mb-3">{t.bgColor}</label>
                          <input type="color" value={bgColor} onChange={(e) => { setBgColor(e.target.value); setBgImage(null); }} className="w-16 h-16 rounded-xl cursor-pointer border-2 border-slate-200 p-1" />
                      </div>
                      <div>
                          <label className="block text-slate-700 font-bold mb-3">{t.fontSize} ({fontSize}px)</label>
                          <input type="range" min="12" max="28" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full h-2 bg-indigo-100 rounded-lg accent-indigo-600" />
                      </div>
                    </div>
                    <div>
                        <label className="block text-slate-700 font-bold mb-3">{t.customBg}</label>
                        <label className="block w-full bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-indigo-100 transition-colors">
                            <span className="text-indigo-600 font-medium">{t.uploadImg}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setBgImage(reader.result as string);
                                    reader.readAsDataURL(file);
                                }
                            }} />
                        </label>
                    </div>
                    <button onClick={() => { setBgColor('#f8fafc'); setBgImage(null); setFontSize(16); setAppLang('ar'); setExplLang('ar'); }} className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">{t.reset}</button>
                </div>
             </div>
          </div>
        ) : (
          <div className="h-full flex flex-col max-w-4xl mx-auto bg-white/80 backdrop-blur-md shadow-inner">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? (appLang === 'ar' ? 'justify-start' : 'justify-end') : (appLang === 'ar' ? 'justify-end' : 'justify-start')}`}>
                  <div className={`max-w-[85%] rounded-3xl p-5 ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-800 border border-slate-200 shadow-sm'} ${msg.role === 'user' ? (appLang === 'ar' ? 'rounded-tr-none' : 'rounded-tl-none') : (appLang === 'ar' ? 'rounded-tl-none' : 'rounded-tr-none')}`}>
                    {msg.image && <img src={msg.image} className="mb-3 rounded-2xl max-h-60 w-auto shadow-sm" alt="attachment" />}
                    <div className={`prose prose-sm whitespace-pre-wrap leading-relaxed ${appLang === 'en' ? 'text-left' : 'text-right'}`}>{msg.text}</div>
                  </div>
                </div>
              ))}
              {isLoading && <div className={`flex ${appLang === 'ar' ? 'justify-end' : 'justify-start'}`}><div className="bg-white border p-4 rounded-2xl flex gap-1"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div></div></div>}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-white/50 border-t border-slate-200 backdrop-blur-sm">
              <div className="flex gap-2 items-center bg-white p-2 rounded-2xl border border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <label className="p-3 text-slate-400 hover:text-indigo-600 cursor-pointer">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={t.placeholder} className={`flex-1 bg-transparent border-none focus:outline-none px-2 text-slate-700 font-medium ${appLang === 'en' ? 'text-left' : 'text-right'}`} />
                <button onClick={() => handleSendMessage()} disabled={isLoading || !userInput.trim()} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95"><svg className={`w-5 h-5 ${appLang === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></button>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around p-3 md:p-4 z-20 shadow-up">
        {[
          { id: 'home', name: t.homeTab, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
          { id: 'tutor', name: t.tutorTab, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />, disabled: !selectedSubject },
          { id: 'solver', name: t.solverTab, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />, disabled: !selectedSubject },
          { id: 'settings', name: t.settings, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-indigo-600 scale-110' : 'text-slate-400'} ${tab.disabled ? 'opacity-30 cursor-not-allowed' : 'hover:text-slate-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{tab.icon}</svg>
            <span className="text-[10px] font-bold">{tab.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
