/**
 * Assessment bank — 5 MCQs per module, 4 options each, 80% pass (PRD 5.2).
 *
 * Content is bundled rather than fetched so the quiz still works when the
 * venue wifi dies. supabase/seed.sql inserts the same rows into the questions
 * table for the dashboard and for the finals build, and data.ts prefers the
 * remote copy when it is reachable.
 *
 * Text is stored per language here rather than as i18n keys: these are content
 * records that mirror a database table, not UI chrome.
 */

export interface Question {
  id: string
  moduleId: string
  text: Record<string, string>
  options: Record<string, string[]>
  correctIndex: number
  explain: Record<string, string>
}

export const PASS_PERCENT = 80

export const QUESTIONS: Question[] = [
  // ---------------- Module 1 — Fire & Explosion Response ----------------
  {
    id: 'fire-q1',
    moduleId: 'fire',
    correctIndex: 2,
    text: {
      en: 'An electrical control panel catches fire. Which extinguisher do you use?',
      hi: 'बिजली के कंट्रोल पैनल में आग लग जाती है। आप कौन सा अग्निशामक उपयोग करेंगे?',
    },
    options: {
      en: ['Water', 'Foam', 'CO₂', 'Sand bucket'],
      hi: ['पानी', 'फोम', 'CO₂', 'रेत की बाल्टी'],
    },
    explain: {
      en: 'Water and foam conduct electricity. CO₂ is non-conductive and leaves no residue on equipment.',
      hi: 'पानी और फोम बिजली का संचालन करते हैं। CO₂ संचालक नहीं है और उपकरण पर कोई अवशेष नहीं छोड़ता।',
    },
  },
  {
    id: 'fire-q2',
    moduleId: 'fire',
    correctIndex: 1,
    text: {
      en: 'You reach an exit and find it blocked by debris. What do you do?',
      hi: 'आप निकास पर पहुँचते हैं और वह मलबे से बंद मिलता है। आप क्या करेंगे?',
    },
    options: {
      en: [
        'Clear the debris yourself',
        'Go to the alternate marked exit',
        'Wait there for help',
        'Break a window',
      ],
      hi: [
        'खुद मलबा हटाएँ',
        'दूसरे चिह्नित निकास पर जाएँ',
        'वहीं मदद का इंतज़ार करें',
        'खिड़की तोड़ें',
      ],
    },
    explain: {
      en: 'Never spend time clearing a blocked exit during a fire. Move immediately to the alternate marked route.',
      hi: 'आग के समय बंद निकास साफ़ करने में समय न लगाएँ। तुरंत दूसरे चिह्नित रास्ते पर जाएँ।',
    },
  },
  {
    id: 'fire-q3',
    moduleId: 'fire',
    correctIndex: 0,
    text: {
      en: 'What is the correct order after evacuating?',
      hi: 'निकासी के बाद सही क्रम क्या है?',
    },
    options: {
      en: [
        'Assembly point → headcount → report missing',
        'Headcount → report missing → assembly point',
        'Report missing → assembly point → headcount',
        'Any order is fine',
      ],
      hi: [
        'एकत्रण स्थल → गिनती → लापता की सूचना',
        'गिनती → लापता की सूचना → एकत्रण स्थल',
        'लापता की सूचना → एकत्रण स्थल → गिनती',
        'कोई भी क्रम ठीक है',
      ],
    },
    explain: {
      en: 'You cannot count reliably until everyone has reached the assembly point, and you cannot report missing workers until you have counted.',
      hi: 'जब तक सब एकत्रण स्थल न पहुँचें, सही गिनती नहीं हो सकती, और गिनती के बिना लापता की सूचना नहीं दी जा सकती।',
    },
  },
  {
    id: 'fire-q4',
    moduleId: 'fire',
    correctIndex: 3,
    text: {
      en: 'Who may declare the all-clear after a fire emergency?',
      hi: 'आग की आपात स्थिति के बाद ऑल-क्लियर कौन घोषित कर सकता है?',
    },
    options: {
      en: [
        'Any worker who sees no flames',
        'The first person back inside',
        'The shift with the most experience',
        'The designated supervisor or fire officer',
      ],
      hi: [
        'कोई भी कर्मचारी जिसे आग न दिखे',
        'सबसे पहले अंदर लौटने वाला',
        'सबसे अनुभवी पाली',
        'नामित पर्यवेक्षक या अग्नि अधिकारी',
      ],
    },
    explain: {
      en: 'Only the designated supervisor or fire officer can declare all-clear. Absence of visible flame does not mean the area is safe.',
      hi: 'केवल नामित पर्यवेक्षक या अग्नि अधिकारी ऑल-क्लियर घोषित कर सकते हैं। आग न दिखने का मतलब क्षेत्र सुरक्षित होना नहीं है।',
    },
  },
  {
    id: 'fire-q5',
    moduleId: 'fire',
    correctIndex: 1,
    text: {
      en: 'What is the first thing you should do on discovering a fire?',
      hi: 'आग दिखने पर सबसे पहले क्या करना चाहिए?',
    },
    options: {
      en: [
        'Find an extinguisher',
        'Raise the alarm',
        'Photograph it for the report',
        'Switch off the main power',
      ],
      hi: [
        'अग्निशामक ढूँढें',
        'अलार्म बजाएँ',
        'रिपोर्ट के लिए फोटो लें',
        'मुख्य बिजली बंद करें',
      ],
    },
    explain: {
      en: 'Raise the alarm first so everyone else can start evacuating while you deal with the fire.',
      hi: 'पहले अलार्म बजाएँ ताकि बाकी सब निकलना शुरू कर सकें जबकि आप आग सँभालें।',
    },
  },

  // ---------------- Module 2 — Gas Leak & Confined Space ----------------
  {
    id: 'gas-q1',
    moduleId: 'gas',
    correctIndex: 2,
    text: {
      en: 'Your buddy collapses inside a confined space. What do you do?',
      hi: 'आपका साथी सीमित स्थान में गिर जाता है। आप क्या करेंगे?',
    },
    options: {
      en: [
        'Enter immediately and pull them out',
        'Hold your breath and go in',
        'Raise the alarm and wait for trained rescuers',
        'Enter wearing a dust mask',
      ],
      hi: [
        'तुरंत अंदर जाकर बाहर खींचें',
        'साँस रोककर अंदर जाएँ',
        'अलार्म बजाएँ और प्रशिक्षित बचावकर्मियों की प्रतीक्षा करें',
        'धूल का मास्क पहनकर अंदर जाएँ',
      ],
    },
    explain: {
      en: 'A majority of confined-space deaths are would-be rescuers. Never enter without breathing apparatus and training — raise the alarm.',
      hi: 'सीमित स्थान में अधिकांश मौतें बचाने वालों की होती हैं। साँस उपकरण और प्रशिक्षण के बिना कभी अंदर न जाएँ — अलार्म बजाएँ।',
    },
  },
  {
    id: 'gas-q2',
    moduleId: 'gas',
    correctIndex: 0,
    text: {
      en: 'Which PPE is required before approaching a toxic gas leak?',
      hi: 'ज़हरीली गैस रिसाव के पास जाने से पहले कौन सा पीपीई आवश्यक है?',
    },
    options: {
      en: [
        'SCBA mask and gas-rated gloves',
        'Dust mask and cotton gloves',
        'Ear muffs and safety shoes',
        'Face shield only',
      ],
      hi: [
        'SCBA मास्क और गैस-रेटेड दस्ताने',
        'धूल मास्क और सूती दस्ताने',
        'कान के कवर और सुरक्षा जूते',
        'केवल फेस शील्ड',
      ],
    },
    explain: {
      en: 'A dust mask filters particles, not gas. Only a self-contained breathing apparatus supplies safe air.',
      hi: 'धूल मास्क कण छानता है, गैस नहीं। केवल SCBA सुरक्षित हवा देता है।',
    },
  },
  {
    id: 'gas-q3',
    moduleId: 'gas',
    correctIndex: 3,
    text: {
      en: 'In the buddy system, what does the standby person do?',
      hi: 'बडी सिस्टम में स्टैंडबाय व्यक्ति क्या करता है?',
    },
    options: {
      en: [
        'Enters with the entrant to help',
        'Takes a break until called',
        'Supervises from the control room',
        'Stays outside, maintains contact, never enters',
      ],
      hi: [
        'मदद के लिए प्रवेशकर्ता के साथ अंदर जाता है',
        'बुलाए जाने तक आराम करता है',
        'कंट्रोल रूम से निगरानी करता है',
        'बाहर रहता है, संपर्क बनाए रखता है, कभी अंदर नहीं जाता',
      ],
    },
    explain: {
      en: 'The standby maintains continuous contact from outside and summons rescue. If they enter, there is nobody left to raise the alarm.',
      hi: 'स्टैंडबाय बाहर से लगातार संपर्क रखता है और बचाव बुलाता है। यदि वह अंदर जाए तो अलार्म बजाने वाला कोई नहीं बचता।',
    },
  },
  {
    id: 'gas-q4',
    moduleId: 'gas',
    correctIndex: 1,
    text: {
      en: 'A gas cloud is drifting across the site. Which way do you evacuate?',
      hi: 'गैस का बादल साइट पर फैल रहा है। आप किस दिशा में निकलेंगे?',
    },
    options: {
      en: ['Downwind, with the gas', 'Upwind, against the wind', 'Straight to the nearest exit', 'Downhill'],
      hi: ['हवा की दिशा में, गैस के साथ', 'हवा के विपरीत', 'सीधे निकटतम निकास की ओर', 'ढलान की ओर'],
    },
    explain: {
      en: 'Move upwind so the wind carries the gas away from you. The nearest exit is wrong if it is downwind.',
      hi: 'हवा के विपरीत जाएँ ताकि हवा गैस को आपसे दूर ले जाए। यदि निकटतम निकास हवा की दिशा में है तो वह गलत है।',
    },
  },
  {
    id: 'gas-q5',
    moduleId: 'gas',
    correctIndex: 2,
    text: {
      en: 'Before anyone enters a confined space, what must be done first?',
      hi: 'किसी के सीमित स्थान में प्रवेश से पहले सबसे पहले क्या करना चाहिए?',
    },
    options: {
      en: [
        'Switch on the lights',
        'Open all the valves',
        'Test the atmosphere and issue a work permit',
        'Inform the family',
      ],
      hi: [
        'रोशनी चालू करें',
        'सभी वाल्व खोलें',
        'वातावरण की जाँच करें और कार्य अनुमति जारी करें',
        'परिवार को सूचित करें',
      ],
    },
    explain: {
      en: 'Atmospheric testing for oxygen, flammables and toxics, plus a signed entry permit, are mandatory before entry.',
      hi: 'प्रवेश से पहले ऑक्सीजन, ज्वलनशील और विषैली गैसों की जाँच तथा हस्ताक्षरित प्रवेश अनुमति अनिवार्य है।',
    },
  },
]

export function questionsFor(moduleId: string): Question[] {
  return QUESTIONS.filter((q) => q.moduleId === moduleId)
}

/** Localised view of a question, falling back to English for partial locales. */
export function localised(q: Question, lang: string) {
  const pick = <T,>(rec: Record<string, T>): T => rec[lang] ?? rec.hi ?? rec.en
  return {
    text: pick(q.text),
    options: pick(q.options),
    explain: pick(q.explain),
  }
}
