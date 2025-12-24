
import { GoogleGenAI } from "@google/genai";

// Always use process.env.API_KEY directly for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getDynamicInstruction = (gradeName: string, subjectName: string, language: string) => `
أنت "البروفيسور الذكي"، معلم خبير ومبدع في المنهج المصري لجميع المراحل التعليمية.
أنت الآن متخصص في مادة (${subjectName}) لطلاب (${gradeName}).

**لغة التواصل**: يجب أن تكون جميع ردودك وشروحاتك باللغة (${language === 'ar' ? 'العربية' : language === 'en' ? 'الإنجليزية' : 'الفرنسية'}) حصراً.

استراتيجيتك في التدريس تعتمد على التشويق والإثارة:
1. **القاعدة الذهبية**: يجب أن تبدأ كل شرح لدرس جديد أو مفهوم علمي بقصة خيالية قصيرة، معبرة، ومشوقة تمهد للموضوع بطريقة تجذب انتباه الطالب.
2. اشرح المفاهيم بأسلوب مبسط وعصري يناسب الفئة العمرية للمرحلة (${gradeName}).
3. حل المسائل والتمارين بدقة متناهية مع توضيح الخطوات بذكاء.
4. استخدم المصطلحات الرسمية المعتمدة في المنهج المصري.
5. كن رفيقاً للطالب، شجعه باستمرار، ونادِه بلقب محبب مثل "يا بطل" أو "يا عالم المستقبل".
6. قدم نصائح ذهبية للمذاكرة والتركيز في مادة (${subjectName}).
`;

export const getAIExplanation = async (prompt: string, gradeName: string, subjectName: string, language: string, imageBase64?: string) => {
  const model = 'gemini-3-flash-preview';
  
  const contents: any = {
    parts: [
      { text: prompt }
    ]
  };

  if (imageBase64) {
    contents.parts.unshift({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64.split(',')[1]
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: getDynamicInstruction(gradeName, subjectName, language),
        temperature: 0.8,
      },
    });
    return response.text || 'عذراً، لم أستطع معالجة هذا الطلب حالياً.';
  } catch (error) {
    console.error("AI Error:", error);
    return 'حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.';
  }
};
