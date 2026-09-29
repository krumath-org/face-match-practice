export type Locale = "en" | "km";

export const LOCALES: readonly Locale[] = ["en", "km"] as const;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  km: "ខ្មែរ",
};

/** `kruface` is kept deliberately: renaming this key would reset every saved choice. */
export const LOCALE_STORAGE_KEY = "kruface.locale";

const en = {
  "auth.checking": "Checking your KruMath account…",
  "auth.signOut": "Sign out",

  "account.label": "Account",
  "account.settings": "Account settings",

  "nav.practice": "Practice",
  "nav.items": "Items",
  "nav.language": "Language",

  "toolbar.home": "KruMath home",
  "toolbar.github": "Source on GitHub",
  "toolbar.pricing": "Pay me a coffee!",

  "home.status.loading": "Loading",
  "home.status.ready": "Ready to practice",
  "home.status.needMore": "{count} more to start",
  "home.title": "See the picture. Remember the name.",
  "home.subtitle":
    "Whatever you keep mixing up — faces, words, symbols, formulas — practise until nothing slips away.",
  "home.start": "Start practice",
  "home.addItems": "Add items",
  "home.accuracy": "accuracy",

  "collections.label": "Collections",
  "collections.addFirst": "Add your first item",

  "items.title": "Your items",
  "items.count": "{count} items in {collection}",
  "items.add": "Add item",
  "items.empty": "Add your first item",
  "items.remove": "Remove {name}",

  "add.back": "Back",
  "add.save": "Save",
  "add.saveAll": "Save all",
  "add.saving": "Saving…",
  "add.savingProgress": "Saving {done}/{total}…",
  "add.changePicture": "Change picture",
  "add.choosePicture": "Choose a picture",
  "add.dropHint": "Drop photos here, or click to choose",
  "add.uploadFolder": "Upload folder",
  "add.removePending": "Remove",
  "add.batchTooMany": "Too many photos (max {max}).",
  "add.batchNone": "No image files found.",
  "add.batchPartialFailed": "Saved {saved}, but {failed} failed. Fix and try again.",
  "add.selectedPicture": "Selected picture",
  "add.namePlaceholder": "Name or label",
  "add.collectionLabel": "Name list",
  "add.collectionPlaceholder": "e.g. Team roster or English verb group",
  "add.collectionNew": "New collection",
  "add.collectionEdit": "Edit collection",
  "add.collectionConfirm": "Use this name",
  "add.collectionCancel": "Cancel",
  "add.collectionRequired": "Choose a collection, or create one, to save this card.",
  "add.collectionExisting": "Already exists — this card joins {collection}.",

  "quiz.needMore_one": "Add 1 more item to practice",
  "quiz.needMore_other": "Add {count} more items to practice",
  "quiz.back": "Back",
  "quiz.question": "Question {number}",
  "quiz.progress": "{accuracy}% · {count} done",
  "quiz.correct": "Correct",
  "quiz.wrongPickName": "Not quite — the answer was {name}.",
  "quiz.wrongPickPhoto": "Not quite — that's not {name}.",
  "quiz.next": "Next",
  "quiz.prompt": "What is this?",

  "error.saveFailed": "Could not save that. Please try again.",
  "error.authBypass":
    "Local sign-in bypass is on, so saves cannot reach Supabase. Turn off VITE_AUTH_BYPASS and test while signed in on krumath.com.",
} as const;

export type TranslationKey = keyof typeof en;

/**
 * Khmer strings, reviewed and approved by the project owner. Keep the keys in the same
 * order as `en` so the two stay easy to diff. `{placeholders}` must match `en` exactly.
 */
const km: Record<TranslationKey, string> = {
  "auth.checking": "កំពុងពិនិត្យគណនី KruMath…",
  "auth.signOut": "ចាកចេញ",

  "account.label": "គណនី",
  "account.settings": "ការកំណត់គណនី",

  "nav.practice": "អនុវត្ត",
  "nav.items": "បញ្ជី",
  "nav.language": "ភាសា",

  "toolbar.home": "ទំព័រដើម KruMath",
  "toolbar.github": "កូដនៅលើ GitHub",
  "toolbar.pricing": "ទិញកាហ្វេឱ្យខ្ញុំមួយកែវហេ៎?",

  "home.status.loading": "កំពុងផ្ទុក…",
  "home.status.ready": "រួចរាល់ក្នុងការអនុវត្ត",
  "home.status.needMore": "ត្រូវការ {count} ទៀតដើម្បីចាប់ផ្ដើម",
  "home.title": "មើលរូបភាព ចាំឈ្មោះ",
  "home.subtitle":
    "អ្វីៗដែលអ្នកច្រើនច្រឡំ — មុខមនុស្ស ពាក្យថ្មី សញ្ញា រូបមន្ត — ហ្វឹកហាត់រហូតដល់មិនភ្លេចទៀត។",
  "home.start": "ចាប់ផ្ដើមអនុវត្ត",
  "home.addItems": "បន្ថែមរបស់",
  "home.accuracy": "ភាពត្រឹមត្រូវ",

  "collections.label": "បញ្ជី",
  "collections.addFirst": "បន្ថែមរបស់ដំបូងរបស់អ្នក",

  "items.title": "បញ្ជីរបស់អ្នក",
  "items.count": "មាន {count} ក្នុង {collection}",
  "items.add": "បន្ថែមរបស់",
  "items.empty": "បន្ថែមរបស់ដំបូងរបស់អ្នក",
  "items.remove": "លុប {name}",

  "add.back": "ត្រលប់ក្រោយ",
  "add.save": "រក្សាទុក",
  "add.saveAll": "រក្សាទុកទាំងអស់",
  "add.saving": "កំពុងរក្សាទុក…",
  "add.savingProgress": "កំពុងរក្សាទុក {done}/{total}…",
  "add.changePicture": "ប្ដូររូបភាព",
  "add.choosePicture": "ជ្រើសរើសរូបភាព",
  "add.dropHint": "ទាញរូបភាពមកទីនេះ ឬចុចដើម្បីជ្រើស",
  "add.uploadFolder": "ផ្ទុកថតឯកសារ",
  "add.removePending": "លុប",
  "add.batchTooMany": "រូបភាពច្រើនពេក (អតិបរមា {max})។",
  "add.batchNone": "រកមិនឃើញឯកសាររូបភាព។",
  "add.batchPartialFailed": "រក្សាទុកបាន {saved} ប៉ុន្តែ {failed} បរាជ័យ។ សូមកែហើយព្យាយាមម្ដងទៀត។",
  "add.selectedPicture": "រូបភាពដែលបានជ្រើសរើស",
  "add.namePlaceholder": "ឈ្មោះ ឬស្លាក",
  "add.collectionLabel": "បញ្ជីឈ្មោះ",
  "add.collectionPlaceholder": "ឧទាហរណ៍៖ បញ្ជីឈ្មោះក្រុមការងារ ឬ ក្រុមពាក្យកិរិយាអង់គ្លេស",
  "add.collectionNew": "បញ្ជីថ្មី",
  "add.collectionEdit": "កែបញ្ជី",
  "add.collectionConfirm": "ប្រើឈ្មោះនេះ",
  "add.collectionCancel": "បោះបង់",
  "add.collectionRequired": "សូមជ្រើសរើសបញ្ជី ឬបង្កើតបញ្ជីថ្មី ដើម្បីរក្សាទុករបស់នេះ។",
  "add.collectionExisting": "បញ្ជីនេះមានរួចហើយ — របស់នេះនឹងចូលក្នុង {collection}។",

  "quiz.needMore_one": "បន្ថែម {count} ទៀតដើម្បីអនុវត្ត",
  "quiz.needMore_other": "បន្ថែម {count} ទៀតដើម្បីអនុវត្ត",
  "quiz.back": "ត្រឡប់ក្រោយ",
  "quiz.question": "សំណួរទី {number}",
  "quiz.progress": "{accuracy}% · ឆ្លើយបាន {count}",
  "quiz.correct": "ត្រឹមត្រូវ",
  "quiz.wrongPickName": "មិនទាន់ត្រូវទេ — ចម្លើយគឺ {name}។",
  "quiz.wrongPickPhoto": "មិនទាន់ត្រូវទេ — នេះមិនមែន {name} ទេ។",
  "quiz.next": "បន្ទាប់",
  "quiz.prompt": "នេះជាអ្វី?",

  "error.saveFailed": "មិនអាចរក្សាទុកបានទេ។ សូមព្យាយាមម្ដងទៀត។",
  "error.authBypass":
    "កំពុងប្រើការឆ្លងកាត់ចូលក្នុងមូលដ្ឋាន ដូច្នេះមិនអាចរក្សាទុកទៅ Supabase បានទេ។ បិទ VITE_AUTH_BYPASS ហើយសាកល្បងពេលចូលគណនីនៅលើ krumath.com។",
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
