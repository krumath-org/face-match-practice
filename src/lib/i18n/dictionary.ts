export type Locale = "en" | "km";

export const LOCALES: readonly Locale[] = ["en", "km"] as const;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  km: "ខ្មែរ",
};

export const LOCALE_STORAGE_KEY = "kruface.locale";

const en = {
  "auth.checking": "Checking your KruMath account…",
  "auth.signOut": "Sign out",

  "nav.practice": "Practice",
  "nav.people": "People",
  "nav.language": "Language",

  "toolbar.home": "KruMath home",
  "toolbar.github": "Source on GitHub",
  "toolbar.pricing": "Pay me a coffee!",

  "home.status.loading": "Loading",
  "home.status.ready": "Ready to practice",
  "home.status.needMore": "{count} more to start",
  "home.title": "See the face. Remember the name.",
  "home.subtitle":
    "Good with faces but keep forgetting names? Come on — practice until you never forget a name again.",
  "home.start": "Start practice",
  "home.addPeople": "Add people",
  "home.accuracy": "accuracy",

  "people.title": "Your people",
  "people.count": "{count} faces in your collection",
  "people.add": "Add person",
  "people.empty": "Add your first face",
  "people.remove": "Remove {name}",

  "add.back": "Back",
  "add.save": "Save",
  "add.saving": "Saving…",
  "add.changePhoto": "Change photo",
  "add.choosePhoto": "Choose a photo",
  "add.selectedPortrait": "Selected portrait",
  "add.namePlaceholder": "Name",

  "quiz.needMore_one": "Add 1 more person to practice",
  "quiz.needMore_other": "Add {count} more people to practice",
  "quiz.back": "Back",
  "quiz.question": "Question {number}",
  "quiz.progress": "{accuracy}% · {count} done",
  "quiz.correct": "Correct",
  "quiz.wrongPickName": "Not quite — the answer was {name}.",
  "quiz.wrongPickPhoto": "Not quite — that's not {name}.",
  "quiz.next": "Next",
  "quiz.prompt": "Who is this?",

  "error.saveFailed": "Could not save that. Please try again.",
} as const;

export type TranslationKey = keyof typeof en;

/**
 * Khmer strings, reviewed and approved by the project owner. Keep the keys in the same
 * order as `en` so the two stay easy to diff. `{placeholders}` must match `en` exactly.
 */
const km: Record<TranslationKey, string> = {
  "auth.checking": "កំពុងពិនិត្យគណនី KruMath…",
  "auth.signOut": "ចាកចេញ",

  "nav.practice": "អនុវត្ត",
  "nav.people": "មនុស្ស",
  "nav.language": "ភាសា",

  "toolbar.home": "ទំព័រដើម KruMath",
  "toolbar.github": "កូដនៅលើ GitHub",
  "toolbar.pricing": "ទិញកាហ្វេឱ្យខ្ញុំមួយកែវហេ៎?",

  "home.status.loading": "កំពុងផ្ទុក…",
  "home.status.ready": "រួចរាល់ក្នុងការអនុវត្ត",
  "home.status.needMore": "ត្រូវការ {count} ទៀតដើម្បីចាប់ផ្ដើម",
  "home.title": "មើលមុខ ចាំឈ្មោះ",
  "home.subtitle":
    "ពូកែចាំមុខ តែភ្លេចឈ្មោះមែន? តស់! ហ្វឹកហាត់មើលមុខ ចាំឈ្មោះ កុំឱ្យភ្លេចឈ្មោះគេទៀត។",
  "home.start": "ចាប់ផ្ដើមអនុវត្ត",
  "home.addPeople": "បន្ថែមមនុស្ស",
  "home.accuracy": "ភាពត្រឹមត្រូវ",

  "people.title": "បញ្ជីមនុស្សរបស់អ្នក",
  "people.count": "មាន {count} នាក់ក្នុងបញ្ជីរបស់អ្នក",
  "people.add": "បន្ថែមមនុស្ស",
  "people.empty": "បន្ថែមមនុស្សដំបូងរបស់អ្នក",
  "people.remove": "លុប {name}",

  "add.back": "ត្រឡប់ក្រោយ",
  "add.save": "រក្សាទុក",
  "add.saving": "កំពុងរក្សាទុក…",
  "add.changePhoto": "ប្ដូររូបថត",
  "add.choosePhoto": "ជ្រើសរើសរូបថត",
  "add.selectedPortrait": "រូបថតដែលបានជ្រើសរើស",
  "add.namePlaceholder": "ឈ្មោះ",

  "quiz.needMore_one": "បន្ថែម {count} នាក់ទៀតដើម្បីអនុវត្ត",
  "quiz.needMore_other": "បន្ថែម {count} នាក់ទៀតដើម្បីអនុវត្ត",
  "quiz.back": "ត្រឡប់ក្រោយ",
  "quiz.question": "សំណួរទី {number}",
  "quiz.progress": "{accuracy}% · ឆ្លើយបាន {count}",
  "quiz.correct": "ត្រឹមត្រូវ",
  "quiz.wrongPickName": "មិនទាន់ត្រូវទេ — ចម្លើយគឺ {name}។",
  "quiz.wrongPickPhoto": "មិនទាន់ត្រូវទេ — នេះមិនមែន {name} ទេ។",
  "quiz.next": "បន្ទាប់",
  "quiz.prompt": "នេះជាអ្នកណា?",

  "error.saveFailed": "មិនអាចរក្សាទុកបានទេ។ សូមព្យាយាមម្ដងទៀត។",
};

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, km };

export type TranslationParams = Record<string, string | number>;

/** Replace `{placeholder}` tokens, leaving unknown ones untouched. */
export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

export function translate(locale: Locale, key: TranslationKey, params?: TranslationParams): string {
  const dictionary = dictionaries[locale] ?? dictionaries.en;
  return interpolate(dictionary[key] ?? dictionaries.en[key] ?? key, params);
}
