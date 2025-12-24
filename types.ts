
export interface Lesson {
  id: string;
  title: string;
  description: string;
}

export interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  units?: Unit[];
}

export interface Grade {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface EducationLevel {
  id: string;
  name: string;
  grades: Grade[];
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

// --- CURRICULUM DATA GENERATORS ---

const getScienceUnits = (grade: string): Unit[] => {
  switch (grade) {
    case 'p4': return [
      { id: 'u1', title: 'الوحدة الأولى: الأنظمة', lessons: [{id:'l1', title:'الأجهزة والطاقة', description:'تحولات الطاقة في الأجهزة.'}, {id:'l2', title:'الوقود', description:'أنواع الوقود والحفاظ عليه.'}] },
      { id: 'u2', title: 'الوحدة الثانية: الحركة', lessons: [{id:'l3', title:'السرعة', description:'مفهوم السرعة وحسابها.'}, {id:'l4', title:'الطاقة والتصادم', description:'انتقال الطاقة عند التصادم.'}] }
    ];
    case 'p5': return [
      { id: 'u1', title: 'الوحدة الأولى: العلاقات الغذائية', lessons: [{id:'l1', title:'احتياجات النبات', description:'عملية البناء الضوئي.'}, {id:'l2', title:'انتقال الطاقة في النظام البيئي', description:'السلاسل والشبكات الغذائية.'}] },
      { id: 'u2', title: 'الوحدة الثانية: حركة الجزيئات', lessons: [{id:'l3', title:'المادة في العالم من حولنا', description:'حالات المادة الثلاث.'}, {id:'l4', title:'وصف وقياس المادة', description:'الخصائص الفيزيائية والكيميائية.'}] }
    ];
    case 'g1': return [
      { id: 'u1', title: 'الوحدة الأولى: المادة وتركيبها', lessons: [{id:'l1', title:'المادة وخواصها', description:'الكثافة، درجة الانصهار، والنشاط الكيميائي.'}, {id:'l2', title:'تركيب المادة', description:'الجزيئات والذرات.'}] },
      { id: 'u2', title: 'الوحدة الثانية: الطاقة', lessons: [{id:'l3', title:'الطاقة: مصادرها وصورها', description:'طاقة الوضع والحركة.'}, {id:'l4', title:'تحولات الطاقة', description:'قانون بقاء الطاقة.'}] }
    ];
    case 'g2': return [
      { id: 'u1', title: 'الوحدة الأولى: الحركة الدورية', lessons: [{id:'l1', title:'الحركة الاهتزازية', description:'خصائص الحركة الاهتزازية.'}, {id:'l2', title:'الحركة الموجية', description:'أنواع الموجات وخصائصها.'}] },
      { id: 'u2', title: 'الوحدة الثانية: الصوت والضوء', lessons: [{id:'l3', title:'خصائص الموجات الصوتية', description:'درجة الصوت وشدته.'}, {id:'l4', title:'الطبيعة الموجية للضوء', description:'انعكاس وانكسار الضوء.'}] }
    ];
    case 'g3': return [
      { id: 'u1', title: 'الوحدة الأولى: القوى والحركة', lessons: [{id:'l1', title:'الحركة في اتجاه واحد', description:'السرعة والسرعة النسبية.'}, {id:'l2', title:'التمثيل البياني للحركة', description:'العجلة المنتظمة.'}] },
      { id: 'u2', title: 'الوحدة الثانية: الطاقة الضوئية', lessons: [{id:'l3', title:'المرايا', description:'المرايا الكرية والعدسات.'}, {id:'l4', title:'العدسات', description:'عيوب الإبصار.'}] }
    ];
    default: return [{ id: 'u1', title: 'الوحدة الأولى', lessons: [{id:'l1', title:'مقدمة المنهج', description:'نظرة عامة على دروس الترم الأول.'}] }];
  }
};

const getMathUnits = (grade: string): Unit[] => {
  switch (grade) {
    case 'g3': return [
      { id: 'u1', title: 'الوحدة الأولى: العلاقات والدوال', lessons: [{id:'l1', title:'حاصل الضرب الديكارتي', description:'المجموعات والأزواج المرتبة.'}, {id:'l2', title:'الدالة (التطبيق)', description:'مجال ومدى الدالة.'}] },
      { id: 'u2', title: 'الوحدة الثانية: النسب والتناسب', lessons: [{id:'l3', title:'النسبة والتناسب', description:'خواص التناسب.'}, {id:'l4', title:'التغير الطردي والعكسي', description:'العلاقات الرياضية.'}] }
    ];
    default: return [{ id: 'u1', title: 'الوحدة الأولى: الجبر', lessons: [{id:'l1', title:'الأعداد والعمليات', description:'شرح القواعد الأساسية.'}] }];
  }
};

const getArabicUnits = (grade: string): Unit[] => [
  { id: 'u1', title: 'الوحدة الأولى: نصوص وقراءة', lessons: [{id:'l1', title:'درس القراءة الأول', description:'تحليل النص اللغوي.'}, {id:'l2', title:'النصوص الشعرية', description:'مواطن الجمال.'}] },
  { id: 'u2', title: 'الوحدة الثانية: القواعد النحوية', lessons: [{id:'l3', title:'دروس النحو', description:'الإعراب والبناء.'}] }
];

// --- MAIN DATA STRUCTURE ---

export const EDUCATION_DATA: EducationLevel[] = [
  {
    id: 'primary',
    name: 'المرحلة الابتدائية',
    grades: [4, 5, 6].map(n => ({
      id: `p${n}`,
      name: `الصف ${n === 4 ? 'الرابع' : n === 5 ? 'الخامس' : 'السادس'} الابتدائي`,
      subjects: [
        { id: `sci_p${n}`, name: 'العلوم', icon: '🔬', color: 'bg-purple-500', units: getScienceUnits(`p${n}`) },
        { id: `math_p${n}`, name: 'الرياضيات', icon: '🔢', color: 'bg-blue-500', units: getMathUnits(`p${n}`) },
        { id: `arb_p${n}`, name: 'اللغة العربية', icon: '📖', color: 'bg-emerald-500', units: getArabicUnits(`p${n}`) },
        { id: `eng_p${n}`, name: 'اللغة الإنجليزية', icon: '🔤', color: 'bg-pink-500' },
        { id: `soc_p${n}`, name: 'الدراسات الاجتماعية', icon: '🌍', color: 'bg-orange-500' }
      ]
    }))
  },
  {
    id: 'prep',
    name: 'المرحلة الإعدادية',
    grades: [1, 2, 3].map(n => ({
      id: `g${n}`,
      name: `الصف ${n === 1 ? 'الأول' : n === 2 ? 'الثاني' : 'الثالث'} الإعدادي`,
      subjects: [
        { id: `sci_g${n}`, name: 'العلوم', icon: '🧪', color: 'bg-indigo-600', units: getScienceUnits(`g${n}`) },
        { id: `math_g${n}`, name: 'الرياضيات', icon: '📐', color: 'bg-blue-600', units: getMathUnits(`g${n}`) },
        { id: `arb_g${n}`, name: 'اللغة العربية', icon: '📖', color: 'bg-emerald-600', units: getArabicUnits(`g${n}`) },
        { id: `eng_g${n}`, name: 'اللغة الإنجليزية', icon: '🔤', color: 'bg-pink-600' },
        { id: `soc_g${n}`, name: 'الدراسات الاجتماعية', icon: '🌍', color: 'bg-orange-600' }
      ]
    }))
  },
  {
    id: 'secondary',
    name: 'المرحلة الثانوية',
    grades: [
      { id: 's1', name: 'الصف الأول الثانوي', subjects: [
        { id: 'physics', name: 'الفيزياء', icon: '⚡', color: 'bg-sky-700', units: [{id:'u1', title:'القياس الفيزيائي', lessons:[{id:'l1', title:'الكميات الفيزيائية', description:'أدوات القياس ووحدات القياس.'}]}] },
        { id: 'chemistry', name: 'الكيمياء', icon: '🧪', color: 'bg-red-700', units: [{id:'u1', title:'الكيمياء والقياس', lessons:[{id:'l1', title:'أهمية القياس في الكيمياء', description:'المختبرات الكيميائية.'}]}] },
        // Fix: Removed 'description' from Unit object as it only expects 'id', 'title', and 'lessons'
        { id: 'biology', name: 'الأحياء', icon: '🧬', color: 'bg-lime-700', units: [{id:'u1', title:'الأساس الكيميائي للحياة', lessons: [{id:'l1', title:'الجزيئات البيولوجية', description:'الجزيئات الكبيرة والصغيرة.'}]}] },
        { id: 'arabic', name: 'اللغة العربية', icon: '📖', color: 'bg-emerald-700', units: getArabicUnits('s1') },
        { id: 'math', name: 'الرياضيات', icon: '📐', color: 'bg-blue-700' }
      ]},
      { id: 's3_sci', name: 'الثالث الثانوي (علمي)', subjects: [
        { id: 'physics_3', name: 'الفيزياء الحديثة', icon: '⚛️', color: 'bg-slate-900', units: [{id:'u1', title:'الكهربية التيارية', lessons:[{id:'l1', title:'قانون أوم', description:'المقاومة والجهد.'}]}] },
        { id: 'chem_3', name: 'الكيمياء العضوية', icon: '⚗️', color: 'bg-red-900', units: [{id:'u1', title:'الكيمياء العضوية', lessons:[{id:'l1', title:'الهيدروكربونات', description:'شرح الألكانات والألكينات.'}]}] },
        { id: 'math_3', name: 'الرياضيات البحتة', icon: '♾️', color: 'bg-blue-900' }
      ]}
    ]
  }
];