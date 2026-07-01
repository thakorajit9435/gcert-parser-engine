/**
 * gujaratContent.data.ts
 *
 * Complete Gujarat Board (GCERT) Gujarati Medium curriculum.
 * Dhoran 1–8 | Sem 1 & 2 | All Subjects | All Chapters.
 *
 * Schema is 100% identical to what createSubject() and createChapter() accept.
 * `subjectName` is resolved → Firestore subjectId at import time by name lookup.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubjectDefinition {
  standardId: string;
  session: string;
  name: string; // English key — used for subjectName lookup
  nameGu: string;
  icon: string;
  order: number;
}

export interface ChapterDefinition {
  standardId: string;
  session: string;
  subjectName: string;
  title: string;
  titleGu: string;
  description: string;
  order: number;
  isPremium: boolean;
  hasSwadhyay: boolean;
  hasMcq: boolean;
  hasMixedQuiz: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

type ChapterRow = [string, string, string]; // [title, titleGu, description]

function ch(
  std: string,
  sem: string,
  sub: string,
  rows: ChapterRow[],
): ChapterDefinition[] {
  return rows.map(([title, titleGu, description], i) => ({
    standardId: std,
    session: sem,
    subjectName: sub,
    title,
    titleGu,
    description,
    order: i + 1,
    isPremium: false,
    hasSwadhyay: true,
    hasMcq: true,
    hasMixedQuiz: true,
  }));
}

// ─── SUBJECTS — 84 total ──────────────────────────────────────────────────────

export const GUJARAT_SUBJECTS: SubjectDefinition[] = [
  // Dhoran 1
  {
    standardId: '1',
    session: '1',
    name: 'Gujarati First Language',
    nameGu: 'ગુજરાતી (પ્રથમ ભાષા)',
    icon: '📚',
    order: 1,
  },
  {
    standardId: '1',
    session: '1',
    name: 'Mathematics',
    nameGu: 'ગણિત (આનંદદાયી ગણિત)',
    icon: '🔢',
    order: 2,
  },
  {
    standardId: '1',
    session: '1',
    name: 'Gujarati Second Language',
    nameGu: 'ગુજરાતી (દ્વિતીય ભાષા)',
    icon: '📖',
    order: 3,
  },
  // Dhoran 2
  {
    standardId: '2',
    session: '2',
    name: 'Gujarati First Language',
    nameGu: 'ગુજરાતી (પ્રથમ ભાષા)',
    icon: '📚',
    order: 1,
  },
  {
    standardId: '2',
    session: '2',
    name: 'Mathematics',
    nameGu: 'ગણિત (આનંદદાયી ગણિત)',
    icon: '🔢',
    order: 2,
  },
  {
    standardId: '2',
    session: '2',
    name: 'Gujarati Second Language',
    nameGu: 'ગુજરાતી (દ્વિતીય ભાષા)',
    icon: '📖',
    order: 3,
  },
  // Dhoran 3
  {
    standardId: '3',
    session: '1',
    name: 'Gujarati First Language',
    nameGu: 'ગુજરાતી (કલશોર)',
    icon: '📚',
    order: 1,
  },
  {
    standardId: '3',
    session: '1',
    name: 'Mathematics',
    nameGu: 'ગણિત (ગણિત મેળો)',
    icon: '🔢',
    order: 2,
  },
  {
    standardId: '3',
    session: '1',
    name: 'Environmental Studies',
    nameGu: 'પર્યાવરણ (આપણી અદ્ભુત દુનિયા)',
    icon: '🌱',
    order: 3,
  },
  {
    standardId: '3',
    session: '1',
    name: 'English Second Language',
    nameGu: 'અંગ્રેજી (દ્વિતીય ભાષા)',
    icon: '🔤',
    order: 4,
  },
  {
    standardId: '3',
    session: '1',
    name: 'Gujarati Second Language',
    nameGu: 'ગુજરાતી (મયુર - દ્વિતીય ભાષા)',
    icon: '📖',
    order: 5,
  },
  // Dhoran 4
  {
    standardId: '4',
    session: '1',
    name: 'Gujarati First Language',
    nameGu: 'ગુજરાતી (કુહૂ)',
    icon: '📚',
    order: 1,
  },
  {
    standardId: '4',
    session: '1',
    name: 'Mathematics',
    nameGu: 'ગણિત',
    icon: '🔢',
    order: 2,
  },
  {
    standardId: '4',
    session: '1',
    name: 'Environmental Studies',
    nameGu: 'પર્યાવરણ',
    icon: '🌱',
    order: 3,
  },
  {
    standardId: '4',
    session: '1',
    name: 'Hindi Second Language',
    nameGu: 'હિન્દી (દ્વિતીય ભાષા)',
    icon: '📙',
    order: 4,
  },
  {
    standardId: '4',
    session: '1',
    name: 'Gujarati Second Language',
    nameGu: 'ગુજરાતી (પતરંગો)',
    icon: '📖',
    order: 5,
  },
  // Dhoran 5
  {
    standardId: '5',
    session: '1',
    name: 'Gujarati First Language',
    nameGu: 'ગુજરાતી (કેકારવ)',
    icon: '📚',
    order: 1,
  },
  {
    standardId: '5',
    session: '1',
    name: 'Mathematics',
    nameGu: 'ગણિત',
    icon: '🔢',
    order: 2,
  },
  {
    standardId: '5',
    session: '1',
    name: 'Environmental Studies',
    nameGu: 'પર્યાવરણ',
    icon: '🌱',
    order: 3,
  },
  {
    standardId: '5',
    session: '1',
    name: 'English Second Language',
    nameGu: 'અંગ્રેજી (દ્વિતીય ભાષા)',
    icon: '🔤',
    order: 4,
  },
  {
    standardId: '5',
    session: '1',
    name: 'Hindi Second Language',
    nameGu: 'હિન્દી (તિતલી)',
    icon: '📙',
    order: 5,
  },
  {
    standardId: '5',
    session: '1',
    name: 'Gujarati Second Language',
    nameGu: 'ગુજરાતી (કુક્કુટ)',
    icon: '📖',
    order: 6,
  },
  // Dhoran 6
  {
    standardId: '6',
    session: '1',
    name: 'Gujarati First Language',
    nameGu: 'ગુજરાતી',
    icon: '📚',
    order: 1,
  },
  {
    standardId: '6',
    session: '1',
    name: 'Mathematics',
    nameGu: 'ગણિત',
    icon: '🔢',
    order: 2,
  },
  {
    standardId: '6',
    session: '1',
    name: 'Science',
    nameGu: 'વિજ્ઞાન',
    icon: '🔬',
    order: 3,
  },
  {
    standardId: '6',
    session: '1',
    name: 'Social Science',
    nameGu: 'સામાજિક વિજ્ઞાન',
    icon: '🌍',
    order: 4,
  },
  {
    standardId: '6',
    session: '1',
    name: 'English Second Language',
    nameGu: 'અંગ્રેજી (દ્વિતીય ભાષા)',
    icon: '🔤',
    order: 5,
  },
  {
    standardId: '6',
    session: '1',
    name: 'Hindi Second Language',
    nameGu: 'હિન્દી (દ્વિતીય ભાષા)',
    icon: '📙',
    order: 6,
  },
  {
    standardId: '6',
    session: '1',
    name: 'Sanskrit',
    nameGu: 'સંસ્કૃત',
    icon: '🕉️',
    order: 7,
  },
  // Dhoran 7
  {
    standardId: '7',
    session: '1',
    name: 'Gujarati First Language',
    nameGu: 'ગુજરાતી',
    icon: '📚',
    order: 1,
  },
  {
    standardId: '7',
    session: '1',
    name: 'Mathematics',
    nameGu: 'ગણિત',
    icon: '🔢',
    order: 2,
  },
  {
    standardId: '7',
    session: '1',
    name: 'Science',
    nameGu: 'વિજ્ઞાન',
    icon: '🔬',
    order: 3,
  },
  {
    standardId: '7',
    session: '1',
    name: 'Social Science',
    nameGu: 'સામાજિક વિજ્ઞાન',
    icon: '🌍',
    order: 4,
  },
  {
    standardId: '7',
    session: '1',
    name: 'English Second Language',
    nameGu: 'અંગ્રેજી (દ્વિતીય ભાષા)',
    icon: '🔤',
    order: 5,
  },
  {
    standardId: '7',
    session: '1',
    name: 'Hindi Second Language',
    nameGu: 'હિન્દી (દ્વિતીય ભાષા)',
    icon: '📙',
    order: 6,
  },
  {
    standardId: '7',
    session: '1',
    name: 'Sanskrit',
    nameGu: 'સંસ્કૃત',
    icon: '🕉️',
    order: 7,
  },
  // Dhoran 8
  {
    standardId: '8',
    session: '1',
    name: 'Gujarati First Language',
    nameGu: 'ગુજરાતી',
    icon: '📚',
    order: 1,
  },
  {
    standardId: '8',
    session: '1',
    name: 'Mathematics',
    nameGu: 'ગણિત',
    icon: '🔢',
    order: 2,
  },
  {
    standardId: '8',
    session: '1',
    name: 'Science',
    nameGu: 'વિજ્ઞાન',
    icon: '🔬',
    order: 3,
  },
  {
    standardId: '8',
    session: '1',
    name: 'Social Science',
    nameGu: 'સામાજિક વિજ્ઞાન',
    icon: '🌍',
    order: 4,
  },
  {
    standardId: '8',
    session: '1',
    name: 'English Second Language',
    nameGu: 'અંગ્રેજી (દ્વિતીય ભાષા)',
    icon: '🔤',
    order: 5,
  },
  {
    standardId: '8',
    session: '1',
    name: 'Hindi Second Language',
    nameGu: 'હિન્દી (દ્વિતીય ભાષા)',
    icon: '📙',
    order: 6,
  },
  {
    standardId: '8',
    session: '1',
    name: 'Sanskrit',
    nameGu: 'સંસ્કૃત',
    icon: '🕉️',
    order: 7,
  },
];

// ─── CHAPTERS ────────────────────────────────────────────────────────────────

export const GUJARAT_CHAPTERS: ChapterDefinition[] = [
  // ══════════ DHORAN 1 ══════════════════════════════════════════════════════

  ...ch('1', '1', 'Gujarati', [
    [
      'Vowels',
      'સ્વર',
      'Gujarati vowels: A, Aa, E, Ee, U, Oo and their usage in simple words.',
    ],
    [
      'Consonants Group 1',
      'વ્યંજન ૧',
      'Ka, Kha, Ga, Gha — first set of consonants with picture words.',
    ],
    [
      'Consonants Group 2',
      'વ્યંજન ૨',
      'Cha, Chha, Ja, Jha — second group with examples.',
    ],
    [
      'Consonants Group 3',
      'વ્યંજન ૩',
      'Ta, Tha, Da, Dha — retroflex consonants with word examples.',
    ],
    [
      'Consonants Group 4',
      'વ્યંજન ૪',
      'Pa, Pha, Ba, Bha, Ma — labial consonants.',
    ],
    [
      'My School',
      'મારી શાળા',
      'A poem about the school day; classroom, teacher, friends.',
    ],
    [
      'My Family',
      'મારો પરિવાર',
      'Names and roles of family members; drawing activity.',
    ],
    [
      'Animals Around Us',
      'આસપાસ પ્રાણી',
      'Domestic and wild animals; their sounds and food.',
    ],
  ]),
  ...ch('1', '2', 'Gujarati', [
    [
      'Consonants Group 5',
      'વ્યંજન ૫',
      'Ya, Ra, La, Va — semi-vowels and their words.',
    ],
    [
      'Consonants Group 6',
      'વ્યંજન ૬',
      'Sa, Ha, Sha, La, Ksha, Gna — completing the Gujarati alphabet.',
    ],
    [
      'Words and Sentences',
      'શબ્દ અને વાક્ય',
      'Forming two and three-letter words and simple sentences.',
    ],
    ['Seasons', 'ઋતુઓ', 'Three seasons of Gujarat with activities and food.'],
    [
      'Festivals',
      'ઉત્સવ',
      'Diwali, Navratri, Uttarayan — celebrations in Gujarat.',
    ],
    [
      'Food We Eat',
      'આપણો ખોરાક',
      'Names of food items; healthy eating habits.',
    ],
    ['The Farmer', 'ખેડૂત', 'Story about a farmer; importance of farming.'],
    [
      'Cleanliness',
      'સ્વચ્છતા',
      'Poem on cleanliness; personal and environmental hygiene.',
    ],
  ]),

  ...ch('1', '1', 'Mathematics', [
    [
      'Numbers 1 to 9',
      '૧ થી ૯',
      'Counting and writing numbers one to nine using objects.',
    ],
    ['Zero', 'શૂન્ય', 'Concept of zero; nothing; empty set.'],
    ['Number 10', '૧૦', 'Number ten; counting to ten; writing 10.'],
    [
      'Addition',
      'સરવાળો',
      'Simple addition of single-digit numbers using objects.',
    ],
    [
      'Subtraction',
      'બાદ',
      'Simple subtraction up to 9 using real-life objects.',
    ],
    [
      'Shapes',
      'આકૃતિ',
      'Circle, square, triangle, rectangle — identification.',
    ],
    [
      'Heavy and Light',
      'ભારે-હળવો',
      'Comparing weights using a balance scale.',
    ],
    [
      'Tall and Short',
      'ઊંચો-ટૂંકો',
      'Comparing heights and lengths; more and less.',
    ],
  ]),
  ...ch('1', '2', 'Mathematics', [
    [
      'Numbers 11 to 20',
      '૧૧ – ૨૦',
      'Numbers eleven to twenty; reading and writing.',
    ],
    [
      'Addition up to 20',
      '૨૦ સુધી સરવાળો',
      'Adding numbers with results up to twenty.',
    ],
    [
      'Subtraction from 20',
      '૨૦ સુધી બાદ',
      'Subtracting from numbers up to twenty.',
    ],
    [
      'Numbers 21 to 99',
      '૨૧ – ૯૯',
      'Two-digit numbers; tens and ones place value.',
    ],
    ['Number 100', '૧૦૦', 'Introduction to one hundred; counting by tens.'],
    ['Patterns', 'ક્રમ', 'Simple repeating patterns with shapes and colours.'],
    [
      'Data and Picture Graph',
      'માહિતી',
      'Collecting simple data; making picture graphs.',
    ],
    [
      'Clock and Time',
      'ઘડિયાળ',
      'Reading a clock to the hour; morning, afternoon, night.',
    ],
  ]),

  ...ch('1', '1', 'Environmental Studies', [
    [
      'My Family',
      'મારો પરિવાર',
      'Family members and their roles; drawing a family picture.',
    ],
    ['My Home', 'મારું ઘર', 'Parts of a house; things found at home.'],
    [
      'Plants Around Us',
      'છોડ',
      'Common plants, trees, flowers and their uses.',
    ],
    [
      'Animals Around Us',
      'પ્રાણી',
      'Domestic and wild animals; sounds they make.',
    ],
    [
      'Food We Eat',
      'ખોરાક',
      'Fruits, vegetables and cooked food; healthy choices.',
    ],
    ['Water', 'પાણી', 'Uses of water; sources; saving water.'],
    ['Our Body', 'શરીર', 'Body parts and their functions; personal hygiene.'],
    [
      'Day and Night',
      'દિવસ-રાત',
      'Sun, moon, stars; the cycle of day and night.',
    ],
  ]),
  ...ch('1', '2', 'Environmental Studies', [
    ['Seasons', 'ઋતુઓ', 'Summer, monsoon and winter in Gujarat.'],
    [
      'Village and City',
      'ગામ-શહેર',
      'Differences between village and city life.',
    ],
    [
      'Our School',
      'શાળા',
      'School environment; teachers, friends and activities.',
    ],
    ['Festivals', 'ઉત્સવ', 'Major festivals celebrated in Gujarat and India.'],
    ['Transport', 'વાહન', 'Land, water and air transport; types of vehicles.'],
    [
      'Environment',
      'પર્યાવરણ',
      'Trees, water, air; keeping the environment clean.',
    ],
    [
      'Community Helpers',
      'સહાયક',
      'Doctors, farmers, teachers and their importance.',
    ],
    ['Safety Rules', 'સલામતી', 'Road safety; home safety; basic safety rules.'],
  ]),

  // ══════════ DHORAN 2 ══════════════════════════════════════════════════════

  ...ch('2', '1', 'Gujarati', [
    ['My Mother', 'મારી માતા', "A poem about a mother's love and care."],
    [
      'The Parrot',
      'પોપટ',
      'Story of a parrot; its colours and speaking ability.',
    ],
    ['The Rain', 'વરસાદ', "Poem on monsoon; joy of rain and nature's renewal."],
    [
      'Fruits and Vegetables',
      'ફળ-શાક',
      'Names and benefits of fruits and vegetables.',
    ],
    [
      'Our Country',
      'આપણો દેશ',
      'Introduction to India; national flag and anthem.',
    ],
    [
      'Morning Walk',
      'સવારની સહેલ',
      'Benefits of morning walk; nature observation.',
    ],
    [
      'The Lion and the Mouse',
      'સિંહ-ઉંદર',
      'Moral story about kindness and unexpected help.',
    ],
    ['Flowers', 'ફૂલ', 'Names and features of flowers; their fragrance.'],
  ]),
  ...ch('2', '2', 'Gujarati', [
    [
      'The Potter',
      'કુંભાર',
      'Traditional craft of making pots; value of work.',
    ],
    ['Birds', 'પક્ષીઓ', 'Names of birds; sounds, nests and food.'],
    ['The Sea', 'સાગર', 'Introduction to the sea; fish and marine life.'],
    [
      'The Crow and the Fox',
      'કાગડો-શિયાળ',
      'Fable about cleverness vs flattery.',
    ],
    ['My Village', 'મારું ગામ', 'Trees, river, fields and life in a village.'],
    [
      'Vegetables from the Garden',
      'વાડીમાંથી',
      'Growing vegetables; importance of green food.',
    ],
    [
      'Night Sky',
      'રાત્રિ આકાશ',
      'Stars, moon, constellations; wonder of night sky.',
    ],
    ['Brave Heart', 'હિંમત', 'Story about a child who overcomes fear.'],
  ]),

  ...ch('2', '1', 'Mathematics', [
    [
      'Numbers 1 to 100',
      '૧–૧૦૦',
      'Reading, writing and ordering numbers up to 100.',
    ],
    [
      'Place Value',
      'સ્થાનીય',
      'Tens and ones; understanding two-digit numbers.',
    ],
    ['Addition', 'સરવાળો', 'Two-digit addition with and without carrying.'],
    ['Subtraction', 'બાદ', 'Two-digit subtraction with and without borrowing.'],
    [
      'Multiplication Intro',
      'ગુણ-પ્રવેશ',
      'Introduction to multiplication as repeated addition.',
    ],
    [
      'Measurement — Length',
      'લંબાઈ',
      'Measuring length using non-standard and standard units.',
    ],
    [
      'Shapes and Space',
      'આકૃતિ',
      '2D and 3D shapes; inside, outside, near, far.',
    ],
    ['Money', 'નાણાં', 'Coins and notes; buying and giving change.'],
  ]),
  ...ch('2', '2', 'Mathematics', [
    [
      'Numbers up to 999',
      '૯૯૯ સુધી',
      'Three-digit numbers; hundreds, tens, ones.',
    ],
    [
      'Addition of 3-digit Numbers',
      'ત્રણ-અંકી સ.',
      'Adding three-digit numbers with carrying.',
    ],
    [
      'Subtraction of 3-digit Numbers',
      'ત્રણ-અંકી બ.',
      'Subtracting three-digit numbers with borrowing.',
    ],
    ['Multiplication Tables 2–5', 'પહાડા ૨–૫', 'Tables of 2, 3, 4 and 5.'],
    ['Division', 'ભાગ', 'Division as equal sharing; link to multiplication.'],
    ['Fractions', 'અપૂર્ણ', 'Half and quarter; fractions of shapes and sets.'],
    [
      'Time and Calendar',
      'સમય',
      'Days of week, months of year; reading a calendar.',
    ],
    ['Data Handling', 'માહિતી', 'Tally marks; simple bar graph; reading data.'],
  ]),

  ...ch('2', '1', 'Environmental Studies', [
    [
      'My Family Tree',
      'કૌટુંબ',
      'Extended family; grandparents, cousins; family tree.',
    ],
    [
      'Food and Nutrition',
      'ખોરાક-પોષણ',
      'Balanced diet; food groups; why we eat different foods.',
    ],
    [
      'Plants — Friends of Nature',
      'છોડ-મિત્ર',
      'Parts of a plant; photosynthesis in simple terms.',
    ],
    [
      'Water Cycle',
      'પાણી-ચક્ર',
      'Evaporation, clouds, rain, river — water journey.',
    ],
    ['Air Around Us', 'હવા', 'Properties of air; wind; air pollution basics.'],
    [
      'Animals — Farm and Forest',
      'ખેત-જંગલ',
      'Farm animals and forest animals; diet and habitat.',
    ],
    [
      'Our Neighbourhood',
      'પડોશ',
      'Market, post office, hospital; community places.',
    ],
    [
      'Seasons — Changes',
      'ઋ-ફ',
      'Effect of seasons on plants, animals and humans.',
    ],
  ]),
  ...ch('2', '2', 'Environmental Studies', [
    [
      'Earth and Sky',
      'ધ-આ',
      'Mountains, rivers, ocean; sky — sun, clouds, rain.',
    ],
    ['Rocks and Soil', 'ખ-મ', 'Types of soil; rocks; importance for farming.'],
    [
      'Our Heritage',
      'વારસો',
      "Gujarat's culture, folk art, music, dress, food.",
    ],
    [
      'Cleanliness and Health',
      'સ્વ-સ',
      'Personal hygiene; clean surroundings; healthy habits.',
    ],
    [
      'Transport and Communication',
      'વ-સ',
      'Old and new transport; telephone, internet basics.',
    ],
    [
      'Caring for Environment',
      'સ-ર',
      'Reduce, Reuse, Recycle; planting trees; save water.',
    ],
    [
      'Natural Disasters',
      'ક-આ',
      'Earthquakes, floods, cyclones; safety measures.',
    ],
    ['Our Earth', 'ધ-ગ', 'Globe and map; continents and oceans; India on map.'],
  ]),

  // ══════════ DHORAN 3 ══════════════════════════════════════════════════════

  ...ch('3', '1', 'Gujarati', [
    [
      'The Tiger and the Fox',
      'વાઘ-શિ',
      'Moral story: cleverness and wisdom over brute strength.',
    ],
    [
      'Monsoon Morning',
      'ચ-સ',
      'Descriptive poem about a rainy morning in a village.',
    ],
    [
      'My Grandmother',
      'દ-ક',
      'Short essay on grandmother; her stories and love.',
    ],
    ['The Sparrow', 'ચ-ન', 'Story of a sparrow saving her nest; perseverance.'],
    [
      'Gujarat — My State',
      'ગ-ર',
      'Geography and culture of Gujarat; famous places.',
    ],
    ['The Ant and Elephant', 'ક-હ', 'Moral: unity; small can help the big.'],
    [
      "Let's Read Together",
      'સ-વ',
      'Paragraph reading and comprehension activities.',
    ],
    [
      'Song of Colours',
      'ર-ગ',
      'Poem about natural colours; fruits, flowers, sky.',
    ],
  ]),
  ...ch('3', '2', 'Gujarati', [
    [
      'The Helpful Neighbour',
      'ઉ-પ',
      'Story about helping neighbours; community spirit.',
    ],
    [
      'Mountain and River',
      'ડ-ન',
      'Dialogue poem between a mountain and a river.',
    ],
    [
      'The Clever Merchant',
      'ચ-વ',
      'Moral story: honesty in business brings prosperity.',
    ],
    ['Our Environment', 'પ-ર', 'Importance of trees, water and clean air.'],
    ['Letter Writing', 'પ-લ', 'Writing informal letters; format and examples.'],
    [
      'Traditional Games',
      'પ-ર-ગ',
      'Gujarati folk games: kho-kho, kabaddi, lagori.',
    ],
    ['Brave Women of India', 'ભ-ન', 'Short biography of famous Indian women.'],
    [
      "Nature's Gift",
      'ક-ભ',
      'Poem about trees giving fruits, flowers and shade.',
    ],
  ]),

  ...ch('3', '1', 'Hindi', [
    ['Hamara Parivar', 'હ-પ', 'Introduction to family members in Hindi.'],
    [
      'Achhi Aadatein',
      'અ-આ',
      'Good habits: cleanliness, exercise, respect elders.',
    ],
    ['Mera Gaon', 'મ-ગ', 'Village life; fields, wells, bullock cart.'],
    ['Ped Paudhe', 'પ-ઝ', 'Trees and plants; their importance for life.'],
    ['Bazaar', 'ખ-બ', 'A visit to the market; buying vegetables and fruits.'],
    ['Chand aur Sitare', 'ચ-સ', 'Poem about the moon and stars; night sky.'],
    ['Khel Kud', 'ખ-ક', 'Sports and games; importance of physical activity.'],
    ['Mere Dost', 'મ-દ', 'Short essay about friendship and playing together.'],
  ]),
  ...ch('3', '2', 'Hindi', [
    [
      'Paani ki Kahani',
      'પ-ક',
      'Story about the water cycle told by a water drop.',
    ],
    [
      'Jungle ki Baat',
      'જ-ક',
      'Animals in the jungle; food chain; forest life.',
    ],
    [
      'Birbal ki Chaturai',
      'બ-ચ',
      'Akbar-Birbal story: cleverness and quick thinking.',
    ],
    ['Mausam', 'મ-ઋ', 'Three seasons; clothes, food and activities.'],
    [
      'Hamare Tyauhar',
      'ત-ઉ',
      'Holi, Eid, Christmas, Diwali — major Indian festivals.',
    ],
    ['Anushasan', 'અ-ન', 'Discipline in school and daily life; its benefits.'],
    ['Yatra', 'ય-ત', 'A trip by train; describing places seen on journey.'],
    [
      'Prakriti',
      'પ-ગ',
      'Poem about nature: rivers, mountains, rain, sunshine.',
    ],
  ]),

  ...ch('3', '1', 'English', [
    [
      'My School Day',
      'My School Day',
      'A reading passage about typical school day activities.',
    ],
    [
      'Animals I Like',
      'Animals I Like',
      'Names and descriptions of favourite animals.',
    ],
    [
      'Good Habits',
      'Good Habits',
      'Short paragraphs about daily healthy habits.',
    ],
    [
      'Colours of Nature',
      'Colours of Nature',
      'A poem about colours found in nature.',
    ],
    [
      "Let's Count",
      "Let's Count",
      'Numbers in English; counting classroom objects.',
    ],
    ['My Home', 'My Home', 'Describing rooms of a house; furniture names.'],
    [
      'Fruits and Vegetables',
      'Fruits and Vegetables',
      'Names, spellings, descriptions of common produce.',
    ],
    ['A Rainy Day', 'A Rainy Day', 'Short story about playing in the rain.'],
  ]),
  ...ch('3', '2', 'English', [
    [
      'The Helpful Bee',
      'The Helpful Bee',
      'Story of a bee that helps flowers bloom.',
    ],
    ['Seasons', 'Seasons', 'Describing summer, monsoon and winter.'],
    [
      'Our Village',
      'Our Village',
      'Reading passage about village; comparison with city.',
    ],
    ['Transport', 'Transport', 'Modes of transport: land, water, air.'],
    ['Safety Rules', 'Safety Rules', 'Road safety; home safety; fire safety.'],
    [
      'The Magic Seed',
      'The Magic Seed',
      'Story about a seed growing into a tree.',
    ],
    [
      'My Best Friend',
      'My Best Friend',
      'Essay about a best friend; describing traits.',
    ],
    [
      'Fun with Words',
      'Fun with Words',
      'Rhyming words; compound words; wordplay.',
    ],
  ]),

  ...ch('3', '1', 'Mathematics', [
    [
      'Numbers up to 9999',
      '૯,૯૯૯ સ',
      'Four-digit numbers; place value; comparison.',
    ],
    ['Addition', 'સ-ક', 'Adding 4-digit numbers; word problems.'],
    ['Subtraction', 'બ-ક', 'Subtracting 4-digit numbers; estimation.'],
    ['Multiplication', 'ગ-ક', 'Multiplication tables 2–10; properties.'],
    ['Division', 'ભ-ક', 'Division as equal sharing; link with multiplication.'],
    ['Fractions', 'અ-ક', 'Fractions of shapes and numbers.'],
    ['Measurement', 'મ-ક', 'Length, weight, capacity; km, kg, litre.'],
    ['Geometry', 'ર-ગ', 'Line, angle, types of triangles.'],
    ['Time', 'સ-ઘ', 'Hours, minutes, seconds; 12 and 24-hour clock.'],
    ['Data Handling', 'ડ-ગ', 'Tally, bar graph, pictograph.'],
  ]),
  ...ch('3', '2', 'Mathematics', [
    ['Large Numbers', 'મ-અ', 'Numbers up to 99,999; lakhs; comparison.'],
    [
      'Addition and Subtraction',
      'સ-બ',
      'Mixed word problems using 5-digit numbers.',
    ],
    ['Multiplication (Large)', 'ગ-મ', '3-digit by 2-digit multiplication.'],
    ['Division (Large)', 'ભ-મ', 'Dividing 3-digit by 1-digit; remainder.'],
    ['Fractions — Operations', 'અ-ક', 'Adding and subtracting like fractions.'],
    ['Decimals', 'દ-ક', 'Tenths and hundredths; decimal notation.'],
    [
      'Perimeter and Area',
      'પ-ક',
      'Perimeter and area of squares and rectangles.',
    ],
    ['Patterns', 'ક-ક', 'Number and shape patterns; sequences.'],
    ['Money Problems', 'ન-ક', 'Solving word problems involving money.'],
    ['Statistics', 'આ-ક', 'Mean; simple bar and line graphs.'],
  ]),

  ...ch('3', '1', 'Environmental Studies', [
    [
      'Plants and Their Parts',
      'છ-ભ',
      'Root, stem, leaf, flower, fruit; functions.',
    ],
    ['Animals — Habitat', 'પ-આ', 'Land, water, air animals; habitat and diet.'],
    [
      'Food Chain',
      'ખ-શ',
      'Producer, consumer, decomposer; simple food chains.',
    ],
    [
      'Water Sources',
      'પ-સ',
      'Rain, river, well, tap; daily uses; water cycle.',
    ],
    [
      'Air and Weather',
      'હ-હ',
      'Wind, clouds, rain; weather chart; importance of air.',
    ],
    ['Nutrition', 'પ-ન', 'Carbohydrates, proteins, vitamins; balanced diet.'],
    [
      'Soil and Crops',
      'મ-પ',
      'Types of soil; crops grown in Gujarat; farming.',
    ],
    [
      'Environment Protection',
      'પ-ર',
      'Pollution types; 3Rs; role of children.',
    ],
  ]),
  ...ch('3', '2', 'Environmental Studies', [
    [
      "Earth's Surface",
      'ધ-સ',
      'Mountains, plains, deserts; land and water forms.',
    ],
    [
      'India — Our Country',
      'ભ-દ',
      'Physical features; states; languages; symbols.',
    ],
    ['Natural Disasters', 'ક-આ', 'Flood, drought, earthquake; preparedness.'],
    ['Ancient Gujarat', 'ઇ-ગ', 'Harappan sites; Lothal port; ancient Gujarat.'],
    [
      'Family and Society',
      'ક-પ',
      'Nuclear family, joint family; social institutions.',
    ],
    ['Occupations', 'ક-ઇ', 'Farmer, doctor, teacher, merchant; their roles.'],
    ['Technology', 'ટ-ત', 'Phone, television, computer; benefits and caution.'],
    [
      'Heritage Sites of Gujarat',
      'ગ-ઐ',
      'Somnath, Dwaraka, Gir Forest; important sites.',
    ],
  ]),

  // ══════════ DHORAN 4 ══════════════════════════════════════════════════════

  ...ch('4', '1', 'Gujarati', [
    ['The Wise Judge', 'ઈ-ન', 'Story about fair judgment; truth always wins.'],
    [
      'River Journey',
      'ન-ય',
      "Descriptive poem about a river's journey to the sea.",
    ],
    [
      'Reading for Meaning',
      'ઉ-ત',
      'Reading comprehension; main idea, details.',
    ],
    ['Panchtantra Story', 'પ-ક', 'Animal stories with moral lessons.'],
    [
      'Famous Gujaratis',
      'ગ-ઐ',
      'Biographies: Sardar Patel, Gandhiji, Narsinh Mehta.',
    ],
    [
      'Dialogue Writing',
      'સ-ક',
      'Writing conversations; punctuation in dialogue.',
    ],
    [
      'A Festival I Love',
      'ઉ-ઓ',
      'Describing a festival; preparations and activities.',
    ],
    ['Kindness', 'દ-ય', 'Short essay; acts of kindness in everyday life.'],
  ]),
  ...ch('4', '2', 'Gujarati', [
    [
      'The Two Brothers',
      'ભ-ભ',
      'Story about sharing and caring between siblings.',
    ],
    ['Mountains of Gujarat', 'ગ-ડ', 'Geography: Girnar, Pavagadh, Saputara.'],
    ['Story Writing', 'ક-ઇ', 'Structure of a story; beginning, middle, end.'],
    [
      'Folk Songs of Gujarat',
      'લ-ગ',
      'Garba, bhajans, folk tunes; oral tradition.',
    ],
    [
      'Essay on Water',
      'ન-પ',
      'Importance of water; water crisis; conservation.',
    ],
    ['Brave Farmers', 'ખ-ક', 'Role of farmers; modern farming methods.'],
    ['Grammar — Nouns and Verbs', 'ઇ-ઇ', 'Types of nouns and verbs; examples.'],
    ['Reading — Newspaper', 'ઇ-ઇ', "Reading a children's newspaper article."],
  ]),

  ...ch('4', '1', 'Hindi', [
    ['Dadi Maa', 'ઇ-ઇ', "A poem about grandmother's stories and warmth."],
    ['Haath Ka Khana', 'ઇ-ઇ', 'Poem about the joy of eating home-cooked food.'],
    ['Tiger ki Madat', 'ઇ-ઇ', 'Story: helping others brings happiness.'],
    ['Chidiya', 'ઇ-ઇ', 'Story about a bird and why we must protect nature.'],
    ['Hamara Desh Bharat', 'ઇ-ઇ', 'India: diversity, states, capital cities.'],
    ['Ek Baja Teen Baje', 'ઇ-ઇ', 'Poem: numbers and time in playful verse.'],
    ['Subah Savere', 'ઇ-ઇ', 'Morning routine poem; healthy start to the day.'],
    ['Pakshi Pakshi', 'ઇ-ઇ', 'Poem on birds; their nests, songs, and colours.'],
  ]),
  ...ch('4', '2', 'Hindi', [
    [
      'Savitri aur Satyawan',
      'ઇ-ઇ',
      'Story of devotion and courage from mythology.',
    ],
    [
      'Khana Khazana',
      'ઇ-ઇ',
      "Food of different states; India's food diversity.",
    ],
    [
      'Pariksha ki Taiyaari',
      'ઇ-ઇ',
      'Preparing for exams; study habits and discipline.',
    ],
    ['Jal hi Jeevan', 'ઇ-ઇ', 'Water is life; importance and conservation.'],
    ['Bharat ke Veer', 'ઇ-ઇ', 'Stories of Indian freedom fighters.'],
    ['Vishram', 'ઇ-ઇ', 'Importance of rest and play; balance in life.'],
    ['Meri Maa', 'ઇ-ઇ', 'Poem about mother; her sacrifices and love.'],
    ['Sanchar ke Sadhan', 'ઇ-ઇ', 'Means of communication: old and new.'],
  ]),

  ...ch('4', '1', 'English', [
    [
      'The Lost Puppy',
      'The Lost Puppy',
      'Story of a puppy who finds its way home.',
    ],
    [
      'Our Country India',
      'Our Country India',
      'India: geography, states, rivers, mountains.',
    ],
    [
      'A Day at the Farm',
      'A Day at the Farm',
      'Life on a farm; crops, animals, activities.',
    ],
    [
      'The Sun and the Wind',
      'The Sun and the Wind',
      "Aesop's fable: gentle persuasion beats force.",
    ],
    ['Reading — Maps', 'Reading Maps', 'How to read a simple map; directions.'],
    [
      'Poem — The River',
      'The River',
      'A poem about a river flowing from mountain to sea.',
    ],
    [
      'Writing — My Village',
      'My Village',
      'Essay writing: describing your village or town.',
    ],
    [
      'Grammar — Adjectives',
      'Adjectives',
      'Describing words; types of adjectives.',
    ],
  ]),
  ...ch('4', '2', 'English', [
    [
      'The Flying Carpet',
      'The Flying Carpet',
      'Fantasy story: adventure on a magic carpet.',
    ],
    [
      'Clean India',
      'Clean India',
      'Essay on Swachh Bharat; cleanliness and health.',
    ],
    ['Sports Day', 'Sports Day', 'Story about annual sports day; teamwork.'],
    [
      'Amazing Animals',
      'Amazing Animals',
      'Facts about unusual animals; scientific reading.',
    ],
    [
      'The Smart Girl',
      'The Smart Girl',
      'Inspirational story about a girl who studies hard.',
    ],
    ['Grammar — Tenses', 'Tenses', 'Present, past and future tense; examples.'],
    [
      'Letter to a Friend',
      'Letter to a Friend',
      'Informal letter format; writing to a pen friend.',
    ],
    [
      'Poem — Seasons',
      'Poem — Seasons',
      'A descriptive poem about the four seasons.',
    ],
  ]),

  ...ch('4', '1', 'Mathematics', [
    [
      'Numbers up to 1 Lakh',
      'એ-ઇ',
      'Five-digit numbers; place value; Indian system.',
    ],
    [
      'Operations on Large Numbers',
      'ઇ-ઇ',
      'Addition, subtraction of 5-digit numbers.',
    ],
    [
      'Multiplication',
      'ઇ-ઇ',
      'Multiplying 3-digit by 2-digit; standard algorithm.',
    ],
    ['Division', 'ઇ-ઇ', 'Long division; 3-digit ÷ 1-digit and 2-digit.'],
    ['Factors and Multiples', 'ઇ-ઇ', 'HCF, LCM; prime and composite numbers.'],
    ['Fractions', 'ઇ-ઇ', 'Equivalent fractions; comparing; mixed numbers.'],
    ['Decimals', 'ઇ-ઇ', 'Addition and subtraction of decimals.'],
    ['Geometry', 'ઇ-ઇ', 'Angles; types of quadrilaterals; symmetry.'],
    ['Perimeter and Area', 'ઇ-ઇ', 'Area of triangles; composite shapes.'],
    ['Data and Graphs', 'ઇ-ઇ', 'Pie chart; double bar graph; interpretation.'],
  ]),
  ...ch('4', '2', 'Mathematics', [
    [
      'Numbers in Crores',
      'ઇ-ઇ',
      'Numbers up to crores; place value; Roman numerals.',
    ],
    ['Mixed Operations', 'ઇ-ઇ', 'BODMAS rule; mixed word problems.'],
    ['Fractions — Operations', 'ઇ-ઇ', 'Multiplying and dividing fractions.'],
    ['Ratio and Proportion', 'ઇ-ઇ', 'Ratio; proportion; unitary method.'],
    [
      'Percentage',
      'ઇ-ઇ',
      'Introduction to percentage; fraction-decimal-percentage.',
    ],
    ['Algebra Basics', 'ઇ-ઇ', 'Introduction to variables; simple equations.'],
    ['Circles', 'ઇ-ઇ', 'Radius, diameter, circumference; area of circle.'],
    [
      'Volume and Capacity',
      'ઇ-ઇ',
      'Volume of cubes and cuboids; litre and ml.',
    ],
    [
      'Time — Distance — Speed',
      'ઇ-ઇ',
      'Simple problems on speed, distance, time.',
    ],
    ['Statistics', 'ઇ-ઇ', 'Mean, median, mode; frequency distribution.'],
  ]),

  ...ch('4', '1', 'Environmental Studies', [
    [
      'Human Body Systems',
      'ઇ-ઇ',
      'Digestive, respiratory, circulatory systems basics.',
    ],
    [
      'Plants — Reproduction',
      'ઇ-ઇ',
      'Seeds, spores, vegetative reproduction in plants.',
    ],
    ['Ecosystems', 'ઇ-ઇ', 'Forest, grassland, aquatic ecosystems; food web.'],
    [
      'Soil — Erosion and Conservation',
      'ઇ-ઇ',
      'Soil erosion; conservation; crop rotation.',
    ],
    [
      'Water — Conservation',
      'ઇ-ઇ',
      'Groundwater; water table; conservation methods.',
    ],
    ['Air Pollution', 'ઇ-ઇ', 'Causes and effects of air pollution; solutions.'],
    ['Map Skills', 'ઇ-ઇ', 'Physical and political maps; compass directions.'],
    ['Gujarat Economy', 'ઇ-ઇ', 'Agriculture, industry, trade in Gujarat.'],
  ]),
  ...ch('4', '2', 'Environmental Studies', [
    [
      'India — Physical Features',
      'ઇ-ઇ',
      'Mountains, plains, plateaus, rivers of India.',
    ],
    ['India — Climate', 'ઇ-ઇ', 'Monsoon, winter, summer; regional climate.'],
    ['India — Resources', 'ઇ-ઇ', 'Forest, mineral, water, human resources.'],
    [
      'Indian Constitution',
      'ઇ-ઇ',
      'Fundamental rights and duties; democratic values.',
    ],
    [
      'Disaster Management',
      'ઇ-ઇ',
      'Types of disasters; NDRF; school safety plan.',
    ],
    [
      'Health and Disease',
      'ઇ-ઇ',
      'Communicable diseases; vaccines; first aid.',
    ],
    [
      'Energy Sources',
      'ઇ-ઇ',
      'Renewable and non-renewable energy; solar energy.',
    ],
    [
      'Technology and Society',
      'ઇ-ઇ',
      'Impact of technology; responsible use; cybersafety.',
    ],
  ]),

  // ══════════ DHORAN 5 ══════════════════════════════════════════════════════

  ...ch('5', '1', 'Gujarati', [
    ['The Golden Swan', 'સ-ક', 'Jataka tale: truth and honesty always win.'],
    ['Poem — Monsoon', 'ક-ચ', 'Poem celebrating the monsoon in rural Gujarat.'],
    [
      'Letter to a Friend',
      'ખ-ક',
      'Writing informal letters; content and format.',
    ],
    [
      'Rabindranath Tagore',
      'ત-ઇ',
      'Life and contribution of Tagore to literature.',
    ],
    [
      'The Weavers of Patan',
      'ઇ-ઇ',
      'Patola weaving; artisan heritage of Gujarat.',
    ],
    [
      'Story — Self-Reliance',
      'ઇ-ઇ',
      'Moral story about working hard and being independent.',
    ],
    ['Newspaper Reading', 'ઇ-ઇ', 'Reading comprehension from a news article.'],
    ['Grammar — Tenses', 'ઇ-ઇ', 'Past, present, future tense in Gujarati.'],
  ]),
  ...ch('5', '2', 'Gujarati', [
    [
      'The Unity of India',
      'ઇ-ઇ',
      'Diversity in language, culture, religion; unity.',
    ],
    ['Essay — Paryavaran', 'ઇ-ઇ', 'Environmental conservation; essay writing.'],
    ['Birsa Munda', 'ઇ-ઇ', 'Life of tribal leader Birsa Munda.'],
    ['Proverbs and Sayings', 'ઇ-ઇ', 'Gujarati proverbs; meaning and usage.'],
    ['Folk Tales of Gujarat', 'ઇ-ઇ', 'Traditional stories with moral lessons.'],
    ['The Ocean', 'ઇ-ઇ', 'Features of the ocean; marine life; tides.'],
    [
      'Reading — Poem Analysis',
      'ઇ-ઇ',
      'Analysing a poem: theme, rhyme, imagery.',
    ],
    ['Debate — Environment', 'ઇ-ઇ', 'Structured debate on environment topics.'],
  ]),

  ...ch('5', '1', 'Hindi', [
    [
      'Bagh aur Ped',
      'ઇ-ઇ',
      'Story about a garden; importance of trees and plants.',
    ],
    [
      'Swatantrata Senani',
      'ઇ-ઇ',
      'Freedom fighters; their sacrifices for India.',
    ],
    ['Gaon ka Mela', 'ઇ-ઇ', 'Description of a village fair; colours and fun.'],
    [
      'Paakhi aur Pinjara',
      'ઇ-ઇ',
      'Story about a caged bird longing for freedom.',
    ],
    ['Hamari Nadi', 'ઇ-ઇ', 'Poem about a river; its life-giving journey.'],
    ['Chacha Nehru', 'ઇ-ઇ', "Life of Jawaharlal Nehru; Children's Day."],
    ['Khushi ka Raaz', 'ઇ-ઇ', 'What makes us truly happy; values story.'],
    [
      'Meri Pasandeeda Kitaab',
      'ઇ-ઇ',
      'Essay about a favourite book; importance of reading.',
    ],
  ]),
  ...ch('5', '2', 'Hindi', [
    ['Beti Bachao', 'ઇ-ઇ', "Importance of girls' education and rights."],
    ['Bharat Mata', 'ઇ-ઇ', 'Patriotic poem about India and its beauty.'],
    ['Mitrata', 'ઇ-ઇ', 'Meaning of friendship; story of true friends.'],
    ['Vigyan ka Vardan', 'ઇ-ઇ', 'Science as a boon to mankind; inventions.'],
    ['Mela', 'ઇ-ઇ', 'Essay about attending a fair; observations.'],
    [
      'Safalta ki Kunji',
      'ઇ-ઇ',
      'Key to success: hard work, honesty, determination.',
    ],
    [
      'Hamari Sanskriti',
      'ઇ-ઇ',
      'Indian cultural heritage; folk art and music.',
    ],
    ['Vishwa Shanti', 'ઇ-ઇ', 'World peace; role of children in harmony.'],
  ]),

  ...ch('5', '1', 'English', [
    [
      'Robinson Crusoe',
      'Robinson Crusoe',
      'Abridged story of Robinson Crusoe; survival skills.',
    ],
    [
      'The Ant and the Grasshopper',
      'The Ant and the Grasshopper',
      "Aesop's fable; hard work vs laziness.",
    ],
    [
      "Reading — India's Rivers",
      "India's Rivers",
      'Non-fiction reading about major Indian rivers.',
    ],
    ['Poem — The Sea', 'The Sea', 'A poem describing the sea; onomatopoeia.'],
    [
      'Grammar — Active Passive',
      'Active and Passive Voice',
      'Introduction to active and passive voice.',
    ],
    [
      'Writing — Diary Entry',
      'Diary Entry',
      'How to write a personal diary; format and content.',
    ],
    [
      'Famous Scientists',
      'Famous Scientists',
      'Biographies of Marie Curie, Newton, CV Raman.',
    ],
    [
      'The Clever Merchant',
      'The Clever Merchant',
      'Story about wit and business acumen.',
    ],
  ]),
  ...ch('5', '2', 'English', [
    [
      'The Space Journey',
      'The Space Journey',
      'Imaginative story about a trip to the moon.',
    ],
    [
      'Poem — Rainbow',
      'Rainbow',
      'A poem about colours and the beauty of nature.',
    ],
    [
      'Environment Day',
      'World Environment Day',
      'Essay about protecting the environment.',
    ],
    [
      'Grammar — Clauses',
      'Clauses',
      'Introduction to main and subordinate clauses.',
    ],
    [
      'Reading — Historical Places',
      'Historical Places',
      'Reading about Taj Mahal, Ajanta, Ellora caves.',
    ],
    [
      'Debate — Technology',
      'Technology in Schools',
      'Writing arguments for and against technology.',
    ],
    [
      'Short Story Writing',
      'Short Story Writing',
      'Structure, character, plot; writing a short story.',
    ],
    ['Poem — Patriotism', 'Patriotism', 'A poem about love for India.'],
  ]),

  ...ch('5', '1', 'Mathematics', [
    ['Number System', 'ઇ-ઇ', 'Integers; negative numbers; number line.'],
    ['HCF and LCM', 'ઇ-ઇ', 'Finding HCF and LCM; applications.'],
    ['Fractions and Decimals', 'ઇ-ઇ', 'Operations on fractions and decimals.'],
    [
      'Ratio and Proportion',
      'ઇ-ઇ',
      'Direct and inverse proportion; unitary method.',
    ],
    ['Percentage', 'ઇ-ઇ', 'Profit and loss; simple interest; discount.'],
    ['Algebra', 'ઇ-ઇ', 'Linear equations in one variable.'],
    [
      'Geometry — Lines and Angles',
      'ઇ-ઇ',
      'Parallel lines, transversals; angle relationships.',
    ],
    ['Triangles', 'ઇ-ઇ', 'Types of triangles; congruence; properties.'],
    ['Area and Volume', 'ઇ-ઇ', 'Area of quadrilaterals; volume of solids.'],
    [
      'Statistics and Probability',
      'ઇ-ઇ',
      'Mean, median, mode; basic probability.',
    ],
  ]),
  ...ch('5', '2', 'Mathematics', [
    [
      'Integers — Operations',
      'ઇ-ઇ',
      'Addition, subtraction, multiplication of integers.',
    ],
    ['Rational Numbers', 'ઇ-ઇ', 'Definition; operations; number line.'],
    ['Square and Square Root', 'ઇ-ઇ', 'Perfect squares; finding square roots.'],
    ['Exponents', 'ઇ-ઇ', 'Powers and exponents; laws of exponents.'],
    [
      'Polynomials',
      'ઇ-ઇ',
      'Introduction to polynomials; addition subtraction.',
    ],
    [
      'Quadrilaterals',
      'ઇ-ઇ',
      'Properties of parallelogram, rhombus, trapezium.',
    ],
    ['Circles', 'ઇ-ઇ', 'Chord, arc, sector; circumference and area.'],
    [
      'Construction',
      'ઇ-ઇ',
      'Constructing triangles; bisectors; perpendiculars.',
    ],
    ['Mensuration', 'ઇ-ઇ', 'Surface area and volume of cube and cuboid.'],
    ['Data Analysis', 'ઇ-ઇ', 'Grouped data; histogram; pie chart.'],
  ]),

  ...ch('5', '1', 'Environmental Studies', [
    [
      'Microorganisms',
      'ઇ-ઇ',
      'Bacteria, viruses, fungi; useful and harmful microbes.',
    ],
    [
      'Cell — Unit of Life',
      'ઇ-ઇ',
      'Cell structure; plant vs animal cell basics.',
    ],
    [
      'Nutrition in Plants',
      'ઇ-ઇ',
      'Photosynthesis; types of nutrition in plants.',
    ],
    [
      'Nutrition in Animals',
      'ઇ-ઇ',
      'Digestive system; types of animals by diet.',
    ],
    ['Transportation in Plants', 'ઇ-ઇ', 'Xylem, phloem; transpiration.'],
    ['Respiration', 'ઇ-ઇ', 'Aerobic and anaerobic respiration; breathing.'],
    [
      'Weather and Climate',
      'ઇ-ઇ',
      'Weather instruments; seasons; climate zones.',
    ],
    ['Natural Resources', 'ઇ-ઇ', 'Conservation of forests, water, minerals.'],
  ]),
  ...ch('5', '2', 'Environmental Studies', [
    [
      'Human Impact on Environment',
      'ઇ-ઇ',
      'Deforestation; global warming; ozone depletion.',
    ],
    ['Soil Pollution', 'ઇ-ઇ', 'Causes of soil pollution; organic farming.'],
    ['Water Pollution', 'ઇ-ઇ', 'Sources; effects; water treatment.'],
    ['Biodiversity', 'ઇ-ઇ', "India's biodiversity; wildlife sanctuaries."],
    [
      'India — History Overview',
      'ઇ-ઇ',
      'Ancient to modern India; major periods.',
    ],
    [
      'Democracy in India',
      'ઇ-ઇ',
      'Elections; Parliament; state and central government.',
    ],
    ['Sustainable Development', 'ઇ-ઇ', 'Definition; SDGs; role of students.'],
    [
      'Disaster Risk Reduction',
      'ઇ-ઇ',
      'Early warning systems; mock drills; community.',
    ],
  ]),

  // ══════════ DHORAN 6 ══════════════════════════════════════════════════════

  ...ch('6', '1', 'Gujarati', [
    [
      'Bhoola Sudhaaro',
      'ભૂ-સ',
      'Accepting and correcting mistakes; moral story.',
    ],
    ['Gir no Sher', 'ગ-સ', "The Asiatic lion of Gir; Gujarat's pride."],
    [
      'Kavi Narsinh Mehta',
      'ન-ભ',
      'Life and devotional poetry of Narsinh Mehta.',
    ],
    [
      'Chandragupta Maurya',
      'ઇ-ઇ',
      'Story of Chandragupta; courage and leadership.',
    ],
    ['Essay — Books', 'ઇ-ઇ', 'Books are best friends; importance of reading.'],
    [
      'Short Story — Holi',
      'ઇ-ઇ',
      'Holi celebration; story with cultural context.',
    ],
    [
      'Grammar — Compound Sentences',
      'ઇ-ઇ',
      'Joining sentences with conjunctions.',
    ],
    [
      'Reading — Newspaper Editorial',
      'ઇ-ઇ',
      'Reading and analysing an editorial passage.',
    ],
    [
      'Formal Letter Writing',
      'ઇ-ઇ',
      'Formal letter format; complaint and inquiry letters.',
    ],
    [
      'Gujarati Heritage',
      'ઇ-ઇ',
      'Patola, Bandhani, Chaniya Choli; textile arts.',
    ],
  ]),
  ...ch('6', '2', 'Gujarati', [
    ['Kudaratni Bhent', 'ઇ-ઇ', 'Nature as a gift; poem on environment.'],
    ['Meera Bai', 'ઇ-ઇ', 'Life and devotional bhajans of Mirabai.'],
    [
      'Sardar Vallabhbhai Patel',
      'ઇ-ઇ',
      'Iron Man of India; unification of India.',
    ],
    [
      'Paragraph on Water Crisis',
      'ઇ-ઇ',
      'Essay about water scarcity; solutions.',
    ],
    [
      'Story — True Friendship',
      'ઇ-ઇ',
      'Story with moral about genuine friendship.',
    ],
    ['Grammar — Passive Voice', 'ઇ-ઇ', 'Passive constructions in Gujarati.'],
    [
      'Poetry — Analysis',
      'ઇ-ઇ',
      'Analysing a Gujarati poem; theme and figures.',
    ],
    ['Report Writing', 'ઇ-ઇ', 'Writing a school event report; format.'],
    ['Drama — One Act', 'ઇ-ઇ', 'A short one-act play on social values.'],
    [
      'Debate — Online Learning',
      'ઇ-ઇ',
      'Arguments for and against online education.',
    ],
  ]),

  ...ch('6', '1', 'Hindi', [
    ['Vasant — Poem', 'ઇ-ઇ', 'Spring season poem; imagery and language.'],
    [
      'Kisan aur Zameen',
      'ઇ-ઇ',
      'Farmer and land; bond between farmer and soil.',
    ],
    ['Himalaya ki Beti', 'ઇ-ઇ', 'River Ganga; poem about life it gives.'],
    ['Priya Vachan', 'ઇ-ઇ', 'Sweet speech; value of polite language.'],
    ['Hum Panchhi', 'ઇ-ઇ', 'Poem: birds longing for freedom; liberty.'],
    ['Swami Vivekanand', 'ઇ-ઇ', 'Life and teachings of Swami Vivekananda.'],
    [
      'Ticket Inspector',
      'ઇ-ઇ',
      'Story about duty and honesty in public service.',
    ],
    ['Grammar — Samas Viched', 'ઇ-ઇ', 'Compound words; types of Samas.'],
    ['Patra Lekhan', 'ઇ-ઇ', 'Formal and informal letter writing.'],
    [
      'Essay — My Favourite Sport',
      'ઇ-ઇ',
      'Essay about a favourite sport; benefits.',
    ],
  ]),
  ...ch('6', '2', 'Hindi', [
    ['Surdas ki Pad', 'ઇ-ઇ', 'Devotional pads of Surdas; Bhakti movement.'],
    ['Sabse Bada Showkeen', 'ઇ-ઇ', 'Humorous story; hobbies and obsessions.'],
    [
      'Kabutar aur Chiti',
      'ઇ-ઇ',
      'Panchatantra: dove and ant; gratitude and help.',
    ],
    ['Vigyan ki Duniya', 'ઇ-ઇ', 'Science inventions; impact on daily life.'],
    ['Samajik Seva', 'ઇ-ઇ', 'Social service; examples of community helpers.'],
    ['Grammar — Muhavare', 'ઇ-ઇ', 'Idioms and their usage in sentences.'],
    [
      'Kavita — Nazariya',
      'ઇ-ઇ',
      'Poem about perspective and attitude in life.',
    ],
    [
      'Report — School Trip',
      'ઇ-ઇ',
      'Writing a report about a school excursion.',
    ],
    [
      'Debate — Rural vs Urban',
      'ઇ-ઇ',
      'Arguments comparing rural and urban life.',
    ],
    [
      'Story — Team Work',
      'ઇ-ઇ',
      'Story about achieving goals through teamwork.',
    ],
  ]),

  ...ch('6', '1', 'English', [
    [
      "Who Did Patrick's Homework",
      "Who Did Patrick's Homework",
      'Story about homework and responsibility.',
    ],
    [
      'A House — A Home',
      'A House — A Home',
      'Poem: difference between house and home.',
    ],
    [
      "Taro's Reward",
      "Taro's Reward",
      'Story of Taro; filial piety and magic.',
    ],
    [
      'An Indian American Woman in Space',
      'An Indian American Woman in Space',
      "Kalpana Chawla's life and achievements.",
    ],
    [
      'A Different Kind of School',
      'A Different Kind of School',
      'Story about inclusive education.',
    ],
    ['Who I Am', 'Who I Am', 'Six children describe their favourite things.'],
    ['Fair Play', 'Fair Play', 'Story about sportsmanship and fairness.'],
    [
      'The Quarrel',
      'The Quarrel',
      'Poem about sibling fights and reconciliation.',
    ],
    [
      'Grammar — Nouns and Pronouns',
      'Nouns and Pronouns',
      'Types; use in sentences; exercises.',
    ],
    [
      'Reading Comprehension',
      'Reading Comprehension',
      'Unseen passage; inference and vocabulary.',
    ],
  ]),
  ...ch('6', '2', 'English', [
    ['Beauty', 'Beauty', 'Poem: beauty in nature, actions, thoughts.'],
    [
      'The Desert',
      'The Desert',
      'Non-fiction: desert features; life in deserts.',
    ],
    [
      'The Monkey and the Crocodile',
      'The Monkey and the Crocodile',
      'Panchatantra story; wit and friendship.',
    ],
    [
      'The Wonder Called Sleep',
      'The Wonder Called Sleep',
      'Non-fiction about sleep; its importance.',
    ],
    [
      'A Pact with the Sun',
      'A Pact with the Sun',
      'Story of Saeeda; warmth and light.',
    ],
    ['What If', 'What If', 'Poem about imaginative what-if scenarios.'],
    [
      'The Tansen Story',
      'The Tansen Story',
      "Life of musician Tansen; music in Akbar's court.",
    ],
    ['Grammar — Adjectives', 'Adjectives', 'Degrees of comparison; exercise.'],
    ['Grammar — Tenses', 'Tenses', 'Simple present, past, future; practice.'],
    [
      'Letter Writing',
      'Letter Writing',
      'Formal letters; application and complaint.',
    ],
  ]),

  ...ch('6', '1', 'Mathematics', [
    [
      'Knowing Our Numbers',
      'ઇ-ઇ',
      'Indian and International number system; large numbers.',
    ],
    ['Whole Numbers', 'ઇ-ઇ', 'Properties of whole numbers; number line.'],
    ['Playing with Numbers', 'ઇ-ઇ', 'Divisibility rules; HCF; LCM.'],
    [
      'Basic Geometrical Ideas',
      'ઇ-ઇ',
      'Point, line, ray, angle; curves and polygons.',
    ],
    [
      'Understanding Elementary Shapes',
      'ઇ-ઇ',
      '2D and 3D shapes; measurement of angles.',
    ],
    ['Integers', 'ઇ-ઇ', 'Negative numbers; addition and subtraction.'],
    ['Fractions', 'ઇ-ઇ', 'Types; comparison; operations on fractions.'],
    ['Decimals', 'ઇ-ઇ', 'Place value; operations; applications.'],
    ['Data Handling', 'ઇ-ઇ', 'Mean; bar graph; pictograph; frequency.'],
    ['Mensuration', 'ઇ-ઇ', 'Perimeter and area of rectangles, triangles.'],
  ]),
  ...ch('6', '2', 'Mathematics', [
    ['Algebra', 'ઇ-ઇ', 'Introduction; variables; algebraic expressions.'],
    [
      'Ratio and Proportion',
      'ઇ-ઇ',
      'Ratio; unitary method; proportion applications.',
    ],
    ['Symmetry', 'ઇ-ઇ', 'Line of symmetry; reflection; rotational symmetry.'],
    [
      'Practical Geometry',
      'ઇ-ઇ',
      'Constructing line segments; angles; triangles.',
    ],
    ['Integers — Multiplication', 'ઇ-ઇ', 'Multiplying and dividing integers.'],
    ['Decimals — Operations', 'ઇ-ઇ', 'Multiplying and dividing decimals.'],
    [
      'Profit Loss and Discount',
      'ઇ-ઇ',
      'Cost price, selling price; simple problems.',
    ],
    ['Percentage', 'ઇ-ઇ', 'Percentage; conversion; real-life applications.'],
    ['Statistics', 'ઇ-ઇ', 'Data; frequency table; mean, mode, median.'],
    ['Exponents and Powers', 'ઇ-ઇ', 'Laws of exponents; scientific notation.'],
  ]),

  ...ch('6', '1', 'Science', [
    [
      'Food: Where Does It Come From',
      'ઇ-ઇ',
      'Sources of food; plants and animals; food variety.',
    ],
    [
      'Components of Food',
      'ઇ-ઇ',
      'Nutrients; balanced diet; deficiency diseases.',
    ],
    ['Fibre to Fabric', 'ઇ-ઇ', 'Natural fibres: cotton, jute, silk, wool.'],
    [
      'Sorting Materials into Groups',
      'ઇ-ઇ',
      'Properties of materials; classification.',
    ],
    [
      'Separation of Substances',
      'ઇ-ઇ',
      'Methods: sieving, filtration, evaporation, distillation.',
    ],
    [
      'Changes Around Us',
      'ઇ-ઇ',
      'Reversible and irreversible changes; examples.',
    ],
    ['Getting to Know Plants', 'ઇ-ઇ', 'Types of plants; parts; functions.'],
    ['Body Movements', 'ઇ-ઇ', 'Bones; joints; muscles; movement in animals.'],
    [
      'The Living Organisms',
      'ઇ-ઇ',
      'Characteristics of living beings; habitat.',
    ],
    [
      'Motion and Measurement',
      'ઇ-ઇ',
      'Types of motion; standard units; measuring distance.',
    ],
  ]),
  ...ch('6', '2', 'Science', [
    [
      'Light — Shadows and Reflection',
      'ઇ-ઇ',
      'Shadow formation; reflection; transparent/opaque.',
    ],
    [
      'Electricity and Circuits',
      'ઇ-ઇ',
      'Electric circuit; conductors and insulators.',
    ],
    [
      'Fun with Magnets',
      'ઇ-ઇ',
      'Properties of magnets; magnetic and non-magnetic.',
    ],
    ['Water', 'ઇ-ઇ', 'States of water; water cycle; importance.'],
    ['Air Around Us', 'ઇ-ઇ', 'Composition of air; wind; importance of air.'],
    [
      'Garbage In Garbage Out',
      'ઇ-ઇ',
      'Types of waste; composting; landfills; 3Rs.',
    ],
    ['Force and Motion', 'ઇ-ઇ', 'Types of forces; motion; simple machines.'],
    ['Sound', 'ઇ-ઇ', 'Production of sound; vibration; noise pollution.'],
    ['Soil', 'ઇ-ઇ', 'Soil types; soil profile; importance for farming.'],
    ['Rocks and Minerals', 'ઇ-ઇ', 'Types of rocks; minerals; mining and uses.'],
  ]),

  ...ch('6', '1', 'Social Science', [
    [
      'What, Where, How and When',
      'ઇ-ઇ',
      'Introduction to History; sources; timeline.',
    ],
    [
      'On the Trail of the Earliest People',
      'ઇ-ઇ',
      'Hunter-gatherers; Stone Age; tools and fire.',
    ],
    [
      'From Gathering to Growing Food',
      'ઇ-ઇ',
      'Agricultural revolution; early settlements.',
    ],
    [
      'In the Earliest Cities',
      'ઇ-ઇ',
      'Harappan civilisation; Mohenjo-daro; Lothal.',
    ],
    [
      'What Books and Burials Tell Us',
      'ઇ-ઇ',
      'Vedic age; Rigveda; burial practices.',
    ],
    [
      'Kingdoms, Kings and Early Republic',
      'ઇ-ઇ',
      'Janapadas; Mahajanapadas; republics of India.',
    ],
    [
      'New Questions and Ideas',
      'ઇ-ઇ',
      'Buddha, Mahavira; Jainism and Buddhism.',
    ],
    [
      'Ashoka — The Emperor',
      'ઇ-ই',
      "Mauryan empire; Ashoka's policy of Dhamma.",
    ],
    [
      'Vital Villages, Thriving Towns',
      'ঁ-ঁ',
      'Iron Age; guilds; trade; punch-marked coins.',
    ],
    [
      'Traders, Kings and Pilgrims',
      'ঁ-ঁ',
      'Silk Route; sea trade; pilgrimage routes.',
    ],
  ]),
  ...ch('6', '2', 'Social Science', [
    [
      'New Empires and Kingdoms',
      'ঁ-ঁ',
      'Guptas; Pallavas; literature and science.',
    ],
    ['Buildings, Paintings, Books', 'ঁ-ঁ', 'Temples; Ajanta; Sanskrit epics.'],
    [
      'The Earth in the Solar System',
      'ঁ-ঁ',
      'Earth; Moon; solar system; seasons.',
    ],
    ['Motions of the Earth', 'ঁ-ঁ', 'Rotation; revolution; day and night.'],
    ['Maps', 'ঁ-ঁ', 'Globe; latitude longitude; maps and their uses.'],
    [
      'Major Domains of the Earth',
      'ঁ-ঁ',
      'Lithosphere, hydrosphere, atmosphere, biosphere.',
    ],
    [
      'Major Landforms of the Earth',
      'ঁ-ঁ',
      'Mountains, plateaus, plains; formation.',
    ],
    ['Our Country — India', 'ঁ-ঁ', 'Location; physical divisions; climate.'],
    [
      'India — Climate, Vegetation, Wildlife',
      'ঁ-ঁ',
      'Climate types; biomes; endangered animals.',
    ],
    [
      'Understanding Diversity',
      'ঁ-ঁ',
      'Unity in diversity; Constitution; secularism.',
    ],
  ]),

  ...ch('6', '1', 'Sanskrit', [
    [
      'Akara Antah Sthiti',
      'ઇ-ઇ',
      'Introduction to Sanskrit alphabet; vowels and consonants.',
    ],
    ['Mama Parivar', 'ઇ-ઇ', 'My family in Sanskrit; nouns and their forms.'],
    ['Vidhyalaye', 'ઇ-ઇ', 'School in Sanskrit; simple sentences; verbs.'],
    ['Vrikshaah', 'ઇ-ઇ', 'Trees and plants in Sanskrit vocabulary.'],
    ['Subhashitani', 'ઇ-ઇ', 'Subhashitas (wise sayings); meaning and moral.'],
    ['Ramakatha', 'ઇ-ઇ', 'Story from Ramayana; characters and events.'],
    ['Varun Stuti', 'ઇ-ઇ', 'Hymn to Varuna; Vedic prayer.'],
    ['Sanskrit Geet', 'ઇ-ઇ', 'Simple Sanskrit song; rhythm and melody.'],
  ]),
  ...ch('6', '2', 'Sanskrit', [
    ['Mitra Bandhu', 'ઇ-ઇ', 'Friendship in Sanskrit stories; Panchatantra.'],
    [
      'Vidya Prasangah',
      'ઇ-ઇ',
      'Value of education; quotes from Sanskrit texts.',
    ],
    ['Prakriti Varnan', 'ઇ-ઇ', 'Describing nature in Sanskrit; poetry.'],
    ['Desha Bhakti', 'ઇ-ઇ', 'Patriotic verses in Sanskrit.'],
    ['Saral Shloka', 'ઇ-ઇ', 'Simple Sanskrit shlokas with meaning.'],
    [
      'Panchatantra Katha',
      'ઇ-ઇ',
      'Another Panchatantra story; moral and vocabulary.',
    ],
    [
      'Sanskrit Vyakaran',
      'ઇ-ઇ',
      'Grammar: vibhaktis; dhatus; basic conjugation.',
    ],
    ['Kavi Parichay', 'ઇ-ઇ', 'Introduction to classical Sanskrit poets.'],
  ]),

  // ══════════ DHORAN 7 ══════════════════════════════════════════════════════

  ...ch('7', '1', 'Gujarati', [
    [
      'Karta Karta Abhyas',
      'ઇ-ઇ',
      'Practice makes perfect; story of perseverance.',
    ],
    [
      'Gujarat no Itihas',
      'ઇ-ઇ',
      'History of Gujarat; medieval period; Solanki era.',
    ],
    ['Kavita — Nadi', 'ઇ-ઇ', 'Poem about a river; metaphor for life.'],
    ['Rashtriya Ekta', 'ઇ-ઇ', 'National integration; diversity and unity.'],
    ['Swachh Gujarat', 'ઇ-ઇ', 'Cleanliness initiative; role of citizens.'],
    ['Mahila Shakti', 'ઇ-ઇ', 'Women empowerment; inspiring stories.'],
    [
      'Grammar — Vakya Rachana',
      'ઇ-ઇ',
      'Sentence structure; types of sentences.',
    ],
    ['Nibandh — Vigyan', 'ઇ-ઇ', 'Essay on science and technology.'],
    ['Lekhana — Report', 'ઇ-ઇ', 'Writing a news report; format and language.'],
    [
      'Sahitya — Ek Drushti',
      'ઇ-ઇ',
      'Overview of Gujarati literature; poets and authors.',
    ],
  ]),
  ...ch('7', '2', 'Gujarati', [
    ['Veer Bal Din', 'ઇ-ઇ', 'Veer Baal Diwas; courage of Sahibzade.'],
    ['Paryavaran ane Manav', 'ઇ-ઇ', 'Human impact on environment; solutions.'],
    ['Kavi Dalpat Ram', 'ઇ-ઇ', 'Life and poetry of Dalpatram; social reform.'],
    ['Aarogya ane Swasthya', 'ઇ-ઇ', 'Health and hygiene; preventive measures.'],
    ['Story — Ek Sathi', 'ઇ-ઇ', 'A companion story; helping others in crisis.'],
    [
      'Grammar — Alankaar',
      'ઇ-ઇ',
      'Figures of speech: simile, metaphor, alliteration.',
    ],
    [
      'Vyavsaay ane Udyog',
      'ઇ-ઇ',
      'Occupations and industries; Gujarat economy.',
    ],
    ['Nibandh — Shikshan', 'ઇ-ઇ', 'Essay on education: past, present, future.'],
    [
      'Translation Practice',
      'ઇ-ઇ',
      'Translating sentences between Gujarati and English.',
    ],
    ['Reading — Autobiography', 'ઇ-ઇ', 'Reading an autobiographical passage.'],
  ]),

  ...ch('7', '1', 'Hindi', [
    ['Hamara Paryavaran', 'ઇ-ઇ', 'Our environment; pollution; responsibility.'],
    [
      'Shyam Sunder Das — Kavita',
      'ઇ-ઇ',
      'Poem by Shyam Sundar Das; meaning and appreciation.',
    ],
    ['Desh Ki Mitti', 'ઇ-ઇ', 'Love for the motherland; patriotic sentiment.'],
    ['Akbar ka Insaf', 'ઇ-ઇ', 'Story of Akbar; justice and wisdom.'],
    [
      'Vigyan ki Uplabdhiyan',
      'ઇ-ઇ',
      "Scientific achievements; India's contributions.",
    ],
    [
      'Grammar — Muhavare Lokokti',
      'ઇ-ઇ',
      'Idioms and proverbs; meaning and usage.',
    ],
    ['Kavita — Baarish', 'ઇ-ઇ', 'Poem about rain; imagery and emotion.'],
    ['Samaj ka Darpan', 'ઇ-ઇ', 'Literature as a mirror of society.'],
    ['Nibandh — Swasthya', 'ઇ-ઇ', 'Essay on health and fitness.'],
    ['Sanvaad Lekhan', 'ઇ-ઇ', 'Writing a conversation; formal and informal.'],
  ]),
  ...ch('7', '2', 'Hindi', [
    [
      'Mithila Painting',
      'ઇ-ઇ',
      'Art form from Bihar; history and significance.',
    ],
    ['Khet Ki Yatra', 'ઇ-ઇ', 'Journey through a farm; seasons and crops.'],
    ['Chandrakanta', 'ઇ-ઇ', 'Excerpt from classic Hindi novel Chandrakanta.'],
    ['Manaviy Mulya', 'ઇ-ઇ', 'Human values; stories on honesty and empathy.'],
    [
      'Science aur Samaj',
      'ઇ-ઇ',
      'Science and society; ethical use of technology.',
    ],
    [
      'Grammar — Vaakya Bhed',
      'ઇ-ઇ',
      'Types of sentences; simple, compound, complex.',
    ],
    ['Patra — Sampadak ko', 'ઇ-ઇ', 'Letter to the editor; format and purpose.'],
    ['Kavita — Naya Savera', 'ઇ-ઇ', 'Poem about new beginnings and hope.'],
    [
      'Anuvaad — Gujarati to Hindi',
      'ઇ-ઇ',
      'Translation exercises; Gujarati to Hindi.',
    ],
    ['Varta — Sansaar ki Sair', 'ઇ-ઇ', 'Story about exploring the world.'],
  ]),

  ...ch('7', '1', 'English', [
    [
      'Three Questions',
      'Three Questions',
      "Tolstoy's story about the most important moment.",
    ],
    [
      'A Gift of Chappals',
      'A Gift of Chappals',
      'Humorous story about family and kindness.',
    ],
    [
      'Gopal and the Hilsa Fish',
      'Gopal and the Hilsa Fish',
      "Humorous story from Gopal's adventures.",
    ],
    [
      'The Ashes That Made Trees Bloom',
      'The Ashes That Made Trees Bloom',
      'Japanese folk tale; kindness rewarded.',
    ],
    ['Quality', 'Quality', "John Galsworthy's story on craftsmanship."],
    [
      'Expert Detectives',
      'Expert Detectives',
      'Mystery story; observation and deduction.',
    ],
    [
      'The Invention of Vita-Wonk',
      'The Invention of Vita-Wonk',
      'Roald Dahl extract; humour and imagination.',
    ],
    [
      'Fire: Friend and Foe',
      'Fire: Friend and Foe',
      'Non-fiction about fire; uses and dangers.',
    ],
    ['Grammar — Verbs', 'Verbs', 'Types; tense forms; irregular verbs.'],
    [
      'Comprehension — Unseen',
      'Unseen Passage',
      'Reading an unseen passage and answering questions.',
    ],
  ]),
  ...ch('7', '2', 'English', [
    [
      'The Tiny Teacher',
      'The Tiny Teacher',
      'Non-fiction about ants; social insects.',
    ],
    [
      'Bringing Up Kari',
      'Bringing Up Kari',
      'Story of raising a baby elephant.',
    ],
    ['The Desert', 'The Desert', 'Non-fiction about desert ecosystems.'],
    [
      'The Cop and the Anthem',
      'The Cop and the Anthem',
      'O. Henry story; irony and fate.',
    ],
    [
      'Golu Grows a Nose',
      'Golu Grows a Nose',
      'Kipling story about curiosity.',
    ],
    [
      'I Want Something in a Cage',
      'I Want Something in a Cage',
      'Story about freedom and responsibility.',
    ],
    ['Chandni', 'Chandni', 'Story of a mountain goat; freedom vs safety.'],
    [
      'The Bear Story',
      'The Bear Story',
      'Story of a tame bear and its encounter.',
    ],
    [
      'Grammar — Pronouns and Prepositions',
      'Pronouns and Prepositions',
      'Types; correct usage; exercises.',
    ],
    [
      'Writing — Story Writing',
      'Story Writing',
      'Guided story writing; plot and characters.',
    ],
  ]),

  ...ch('7', '1', 'Mathematics', [
    ['Integers', 'ઇ-ઇ', 'Integers on number line; operations; properties.'],
    [
      'Fractions and Decimals',
      'ઇ-ઇ',
      'Multiplication and division of fractions, decimals.',
    ],
    ['Data Handling', 'ઇ-ઇ', 'Mean, median, mode; bar graph; pie chart.'],
    [
      'Simple Equations',
      'ઇ-ઇ',
      'Setting up and solving simple linear equations.',
    ],
    [
      'Lines and Angles',
      'ઇ-ઇ',
      'Pairs of angles; parallel lines; transversals.',
    ],
    [
      'The Triangle and Its Properties',
      'ઇ-ઇ',
      'Angle sum; exterior angle; Pythagoras theorem.',
    ],
    [
      'Congruence of Triangles',
      'ઇ-ઇ',
      'SSS, SAS, ASA, RHS congruence criteria.',
    ],
    [
      'Comparing Quantities',
      'ઇ-ઇ',
      'Ratio, proportion, percentage; profit and loss.',
    ],
    ['Rational Numbers', 'ઇ-ઇ', 'Rational numbers; operations; number line.'],
    [
      'Practical Geometry',
      'ઇ-ઇ',
      'Constructing triangles; parallel and perpendicular.',
    ],
  ]),
  ...ch('7', '2', 'Mathematics', [
    [
      'Perimeter and Area',
      'ઇ-ઇ',
      'Area of triangles, quadrilaterals, circles.',
    ],
    [
      'Algebraic Expressions',
      'ઇ-ઇ',
      'Monomials, binomials; operations on expressions.',
    ],
    [
      'Exponents and Powers',
      'ઇ-ઇ',
      'Powers; laws of exponents; scientific notation.',
    ],
    ['Symmetry', 'ઇ-ઇ', 'Lines of symmetry; rotational symmetry; patterns.'],
    [
      'Visualising Solid Shapes',
      'ઇ-ઇ',
      "3D shapes; Euler's formula; nets of solids.",
    ],
    ['Simple Interest', 'ઇ-ઇ', 'Principal, rate, time; calculating SI.'],
    ['Quadrilaterals', 'ઇ-ઇ', 'Properties; angle sum; special quadrilaterals.'],
    ['Cubes and Cube Roots', 'ઇ-ઇ', 'Perfect cubes; cube roots; estimation.'],
    [
      'Statistics — Grouped Data',
      'ઇ-ઇ',
      'Frequency distribution; histogram; polygon.',
    ],
    [
      'Probability',
      'ઇ-ઇ',
      'Basic probability; events; equally likely outcomes.',
    ],
  ]),

  ...ch('7', '1', 'Science', [
    ['Nutrition in Plants', 'ઇ-ઇ', 'Photosynthesis; saprophytes; parasites.'],
    [
      'Nutrition in Animals',
      'ઇ-ઇ',
      'Digestive system; absorption; assimilation.',
    ],
    ['Fibre to Fabric', 'ઇ-ઇ', 'Silk; wool; process of making fabric.'],
    [
      'Heat',
      'ઇ-ઇ',
      'Temperature; thermometer; conduction, convection, radiation.',
    ],
    [
      'Acids, Bases and Salts',
      'ઇ-ઇ',
      'Properties; indicators; neutralisation.',
    ],
    [
      'Physical and Chemical Changes',
      'ઇ-ઇ',
      'Differences; examples; rusting and burning.',
    ],
    [
      'Weather, Climate and Adaptations',
      'ઇ-ઇ',
      'Climate zones; adaptations of plants and animals.',
    ],
    [
      'Winds, Storms and Cyclones',
      'ઇ-ઇ',
      'Wind patterns; cyclone formation; safety.',
    ],
    ['Soil', 'ઇ-ઇ', 'Soil layers; types; percolation; soil erosion.'],
    [
      'Respiration in Organisms',
      'ઇ-ઇ',
      'Aerobic and anaerobic respiration; breathing organs.',
    ],
  ]),
  ...ch('7', '2', 'Science', [
    [
      'Transportation in Animals and Plants',
      'ઇ-ઇ',
      'Circulatory system; xylem and phloem.',
    ],
    [
      'Reproduction in Plants',
      'ઇ-ઇ',
      'Pollination; fertilisation; seed dispersal.',
    ],
    [
      'Motion and Time',
      'ઇ-ઇ',
      'Speed; distance-time graph; uniform and non-uniform.',
    ],
    [
      'Electric Current and Effects',
      'ઇ-ઇ',
      'Current; circuit; magnetic effect; heating effect.',
    ],
    ['Light', 'ઇ-ઇ', 'Reflection; laws; plane mirror; image formation.'],
    [
      'Water — Precious Resource',
      'ઇ-ઇ',
      'Sources; distribution; conservation methods.',
    ],
    [
      'Forests — Our Lifeline',
      'ઇ-ઇ',
      'Forest ecosystem; biodiversity; deforestation.',
    ],
    [
      'Wastewater Management',
      'ઇ-ઇ',
      'Sewage treatment; importance of sanitation.',
    ],
    ['Sound', 'ઇ-ઇ', 'Sound waves; amplitude; frequency; decibels.'],
    [
      'Reversible and Irreversible Changes',
      'ઇ-ઇ',
      'Revision and extension with new examples.',
    ],
  ]),

  ...ch('7', '1', 'Social Science', [
    [
      'Tracing Changes Through a Thousand Years',
      'ઇ-ઇ',
      'Medieval period; sources; maps; Mughals.',
    ],
    [
      'New Kings and Kingdoms',
      'ઇ-ઇ',
      'Regional kingdoms after Guptas; Pratiharas.',
    ],
    [
      'The Delhi Sultans',
      'ઇ-ઇ',
      'Delhi Sultanate; slave, Khilji, Tughlaq dynasties.',
    ],
    [
      'The Mughal Empire',
      'ઇ-ઇ',
      'Mughals; Babur to Aurangzeb; administration.',
    ],
    [
      'Rulers and Buildings',
      'ઇ-ઇ',
      'Medieval architecture; temples and mosques.',
    ],
    [
      'Towns, Traders and Craftspersons',
      'ઇ-ઇ',
      'Medieval urban centres; guilds; silk route.',
    ],
    [
      'Tribes, Nomads and Settled Communities',
      'ઇ-ઇ',
      'Tribal kingdoms; pastoral communities.',
    ],
    [
      'Devotional Paths to the Divine',
      'ઇ-ઇ',
      'Bhakti and Sufi movements; poets and saints.',
    ],
    [
      'The Making of Regional Cultures',
      'ઇ-ઇ',
      'Bengali; Rajput; Keralan regional cultures.',
    ],
    [
      'Eighteenth-Century Revolts',
      'ઇ-ઇ',
      'Marathas; Sikhs; regional powers; decline of Mughals.',
    ],
  ]),
  ...ch('7', '2', 'Social Science', [
    [
      'Environment',
      'ઇ-ઇ',
      'Human-environment interaction; types of environment.',
    ],
    ['Inside Our Earth', 'ઇ-ઇ', 'Layers of earth; rocks; minerals; volcanoes.'],
    [
      'Our Changing Earth',
      'ઇ-ઇ',
      'Lithospheric movement; earthquakes; erosion.',
    ],
    ['Air', 'ઇ-ઇ', 'Composition of atmosphere; layers; weather.'],
    ['Water', 'ઇ-ઇ', 'Ocean currents; tides; water distribution.'],
    [
      'Natural Vegetation and Wildlife',
      'ઇ-ઇ',
      'Types of vegetation; biomes; wildlife.',
    ],
    [
      'Human Environment — Settlement',
      'ઇ-ઇ',
      'Rural-urban settlement; functions of towns.',
    ],
    [
      'Human Environment — Transport',
      'ઇ-ઇ',
      'Roads, rail, waterways, airways; communication.',
    ],
    [
      'Equality in Democracy',
      'ઇ-ઇ',
      'Equality; discrimination; right to equality.',
    ],
    [
      'Roles and Class Gender',
      'ઇ-ઇ',
      "Gender roles; women's rights; social change.",
    ],
  ]),

  ...ch('7', '1', 'Sanskrit', [
    [
      'Subhashit Ratnaani',
      'ઇ-ઇ',
      'Gems of wise sayings from Sanskrit literature.',
    ],
    [
      'Durbuddhi Vinashyati',
      'ઇ-ઇ',
      'Panchatantra: bad intentions lead to ruin.',
    ],
    ['Swavlambanam', 'ઇ-ઇ', 'Self-reliance; Sanskrit story and vocabulary.'],
    ['Pather Parichay', 'ઇ-ઇ', 'Ritu Varnan; describing seasons in Sanskrit.'],
    ['Panchatantra Varta', 'ઇ-ઇ', 'Panchatantra fable; characters and moral.'],
    ['Vyakaran — Sandhi', 'ઇ-ઇ', 'Sanskrit Sandhi rules; types and examples.'],
    ['Ramayan Prasang', 'ઇ-ઇ', 'An episode from the Ramayana in Sanskrit.'],
    [
      'Sanskrit Composition',
      'ઇ-ઇ',
      'Writing simple sentences and short paragraphs.',
    ],
  ]),
  ...ch('7', '2', 'Sanskrit', [
    ['Satyameva Jayate', 'ઇ-ઇ', 'Truth prevails; story from Upanishads.'],
    ['Karma Yog', 'ઇ-ઇ', 'Concept of karma yoga from Bhagavad Gita.'],
    ['Vriksha Vandana', 'ઇ-ઇ', 'Poem praising trees; environmental message.'],
    [
      'Panch Tantra Mitralabh',
      'ઇ-ઇ',
      'Gaining of friends; Panchatantra first book.',
    ],
    [
      'Grammar — Karak Vibhakti',
      'ઇ-ઇ',
      'Cases in Sanskrit; nominative, accusative etc.',
    ],
    [
      'Mahabharat Prasang',
      'ઇ-ઇ',
      'An episode from the Mahabharata in Sanskrit.',
    ],
    ['Sanskrit Poetry', 'ઇ-ઇ', 'Verses of Kalidasa; beauty and imagery.'],
    ['Sanskrit Anuvaad', 'ઇ-ઇ', 'Translation from Sanskrit to Gujarati.'],
  ]),

  // ══════════ DHORAN 8 ══════════════════════════════════════════════════════

  ...ch('8', '1', 'Gujarati', [
    [
      'Gujarati Bhasha no Itihas',
      'ઇ-ઇ',
      'History and evolution of the Gujarati language.',
    ],
    [
      'Kavi Narmad',
      'ઇ-ઇ',
      'Life and contribution of poet Narmad; Jay Jay Garvi Gujarat.',
    ],
    ['Patra — Sarkari', 'ઇ-ઇ', 'Official letter writing; format and language.'],
    [
      'Mahatma Gandhijino Jivan',
      'ઇ-ઇ',
      'Life of Mahatma Gandhi; Satyagraha and truth.',
    ],
    [
      'Kavita — Prabhati',
      'ઇ-ઇ',
      'Morning poem; sunrise and beginning of a new day.',
    ],
    [
      'Nibandh — Aarthik Vikas',
      'ઇ-ઇ',
      'Essay on economic development of India.',
    ],
    ['Grammar — Alankar', 'ઇ-ઇ', 'Figures of speech; types and examples.'],
    [
      'Gujarati Sahitya — Madhyakal',
      'ઇ-ઇ',
      'Medieval Gujarati literature; saints and poets.',
    ],
    [
      'Anuvaad — Angrezi to Gujarati',
      'ઇ-ઇ',
      'Translation English to Gujarati; practice.',
    ],
    [
      'Sahityik Vishleshan',
      'ઇ-ઇ',
      'Literary analysis of a Gujarati poem or prose.',
    ],
  ]),
  ...ch('8', '2', 'Gujarati', [
    ['Swatantrata Andolan', 'ઇ-ઇ', "Freedom movement; Gujarat's contribution."],
    [
      'Kavita — Gujaratni Dharaa',
      'ઇ-ઇ',
      "Poem on Gujarat's land; rivers and mountains.",
    ],
    [
      'Prasang — Veer Savarkar',
      'ઇ-ઇ',
      "Episode from Veer Savarkar's life; courage.",
    ],
    ['Nibandh — Internet', 'ઇ-ઇ', 'Essay on internet; benefits and risks.'],
    [
      'Story — Aatm Nirbhar',
      'ઇ-ઇ',
      'Story about self-reliance and entrepreneurship.',
    ],
    [
      'Grammar — Vakya Prakaar',
      'ઇ-ઇ',
      'Types of sentences; complex, compound, conditional.',
    ],
    [
      'Sahitya — Arvachin Kaal',
      'ઇ-ઇ',
      'Modern Gujarati literature; 20th century writers.',
    ],
    [
      'Reporting — Varta',
      'ઇ-ઇ',
      'Newspaper report writing; structure and style.',
    ],
    [
      'Drama — Ekaanki',
      'ઇ-ઇ',
      'One-act play on social theme; reading and staging.',
    ],
    ['Vachana Sahitya', 'ઇ-ઇ', 'Prose literature; excerpt and analysis.'],
  ]),

  ...ch('8', '1', 'Hindi', [
    [
      'Dhvani',
      'ઇ-ઇ',
      'Poem on sound and resonance by Suryakant Tripathi Nirala.',
    ],
    [
      'Lakh ki Chudiyan',
      'ઇ-ઇ',
      'Story about traditional craft and its decline.',
    ],
    [
      'Bus ki Yatra',
      'ઇ-ઇ',
      'Humorous account of a bus journey by Harishankar Parsai.',
    ],
    [
      'Diwan-e-Ghalib',
      'ઇ-ઇ',
      'Selected couplets of Mirza Ghalib; appreciation.',
    ],
    [
      'Chitthiyon ki Anoothi Duniya',
      'ઇ-ઇ',
      'The unique world of letters; history and importance.',
    ],
    [
      'Bhagwan ke Dakiye',
      'ઇ-ઇ',
      "Poem by Rabindranath Tagore; birds as God's messengers.",
    ],
    [
      'Kya Nirash Hua Jaye',
      'ઇ-ઇ',
      'Essay by Hazari Prasad Dwivedi; hope and positivity.',
    ],
    [
      'Yeh Sabse Kathin Samay Nahin',
      'ઇ-ઇ',
      'Poem encouraging persistence through difficulties.',
    ],
    [
      'Kabir ki Sakhiyan',
      'ઇ-ઇ',
      'Dohas of Kabir; mystical wisdom and social reform.',
    ],
    [
      'Grammar — Upsarg Pratyay',
      'ઇ-ઇ',
      'Prefixes and suffixes; word formation in Hindi.',
    ],
  ]),
  ...ch('8', '2', 'Hindi', [
    [
      'Sudama Charitra',
      'ઇ-ઇ',
      'Story of Sudama and Krishna; friendship and humility.',
    ],
    [
      'Jahan Pahiya Hai',
      'ઇ-ઇ',
      "Story of girl's right to ride bicycle; social change.",
    ],
    [
      'Akbar ki Shiksha',
      'ઇ-ઇ',
      "Story about Akbar's education; learning and curiosity.",
    ],
    ['Surdas ki Pad (2)', 'ઇ-ઇ', 'More pads of Surdas; bhakti and devotion.'],
    ['Pani ki Kahani', 'ઇ-ઇ', 'Story narrated by a water drop; water cycle.'],
    [
      'Hamari Duniya Badle',
      'ઇ-ઇ',
      'Poem about changing our world; responsibility.',
    ],
    ['Grammar — Viram Chinh', 'ઇ-ઇ', 'Punctuation marks; their correct usage.'],
    [
      'Nibandh — Vigyan Vardan',
      'ઇ-ઇ',
      'Essay on science as a blessing; inventions.',
    ],
    ['Sanvaad — Paryavaran', 'ઇ-ઇ', 'Dialogue on environment; debate format.'],
    ['Kahani — Imaandari', 'ઇ-ઇ', 'Story about honesty; trust and integrity.'],
  ]),

  ...ch('8', '1', 'English', [
    [
      'The Best Christmas Present',
      'The Best Christmas Present',
      'Story of WWI peace; human connection.',
    ],
    [
      'The Tsunami',
      'The Tsunami',
      'Non-fiction about 2004 tsunami; survival stories.',
    ],
    [
      'Glimpses of the Past',
      'Glimpses of the Past',
      'History through cartoons; British India.',
    ],
    [
      "Bepin Chuha's Lapse of Memory",
      "Bepin Chuha's Memory",
      'Story about memory; mystery and reality.',
    ],
    [
      'The Summit Within',
      'The Summit Within',
      'Essay about climbing; inner and outer journey.',
    ],
    [
      "This is Jody's Fawn",
      "This is Jody's Fawn",
      'Story about a boy and an orphaned fawn.',
    ],
    [
      'A Visit to Cambridge',
      'A Visit to Cambridge',
      'Meeting Stephen Hawking; courage and humility.',
    ],
    [
      'A Short Monsoon Diary',
      'A Short Monsoon Diary',
      "Ruskin Bond's diary; nature writing.",
    ],
    [
      'Grammar — Passive Voice',
      'Passive Voice',
      'Uses; formation; transformation exercises.',
    ],
    [
      'Writing — Formal Letters',
      'Formal Letters',
      'Complaint, request, and application letters.',
    ],
  ]),
  ...ch('8', '2', 'English', [
    [
      'The Ant and the Cricket',
      'The Ant and the Cricket',
      'Poem about hard work vs laziness.',
    ],
    [
      'Geography Lesson',
      'Geography Lesson',
      'Poem about war and geography; perspective.',
    ],
    [
      'Macavity — The Mystery Cat',
      'Macavity',
      "T.S. Eliot's poem; rhyme and humour.",
    ],
    ['The Last Bargain', 'The Last Bargain', 'Tagore poem about true freedom.'],
    [
      'The School Boy',
      'The School Boy',
      'William Blake poem on freedom of learning.',
    ],
    [
      'When I Set Out for Lyonnesse',
      'When I Set Out for Lyonnesse',
      'Hardy poem; romantic journey.',
    ],
    [
      'On the Grasshopper and Cricket',
      'On the Grasshopper and Cricket',
      'Keats poem; nature and seasons.',
    ],
    [
      'Grammar — Reported Speech',
      'Reported Speech',
      'Direct to indirect; statements, questions, commands.',
    ],
    [
      'Grammar — Clauses',
      'Clauses',
      'Relative clauses; adverb clauses; noun clauses.',
    ],
    [
      'Comprehension and Summary Writing',
      'Summary Writing',
      'Reading comprehension; writing summaries.',
    ],
  ]),

  ...ch('8', '1', 'Mathematics', [
    [
      'Rational Numbers',
      'ઇ-ઇ',
      'Properties; operations; number line representation.',
    ],
    [
      'Linear Equations in One Variable',
      'ઇ-ઇ',
      'Solving equations; word problems.',
    ],
    [
      'Understanding Quadrilaterals',
      'ઇ-ઇ',
      'Types; angle sum; properties of special quadrilaterals.',
    ],
    [
      'Practical Geometry',
      'ઇ-ઇ',
      'Constructing quadrilaterals; given conditions.',
    ],
    ['Data Handling', 'ઇ-ઇ', 'Grouped data; pie chart; probability.'],
    [
      'Squares and Square Roots',
      'ઇ-ઇ',
      'Finding square roots; methods; applications.',
    ],
    ['Cubes and Cube Roots', 'ઇ-ઇ', 'Perfect cubes; cube root by factors.'],
    ['Comparing Quantities', 'ઇ-ઇ', 'Compound interest; depreciation; tax.'],
    [
      'Algebraic Expressions and Identities',
      'ઇ-ઇ',
      'Product of polynomials; standard identities.',
    ],
    [
      'Visualising Solid Shapes',
      'ઇ-ઇ',
      'Views of 3D objects; maps; polyhedra.',
    ],
  ]),
  ...ch('8', '2', 'Mathematics', [
    [
      'Mensuration',
      'ઇ-ઇ',
      'Area of trapezium, circle; surface area and volume.',
    ],
    [
      'Exponents and Powers',
      'ઇ-ઇ',
      'Negative exponents; laws; scientific notation.',
    ],
    [
      'Direct and Inverse Proportion',
      'ઇ-ઇ',
      'Direct proportion; inverse proportion; applications.',
    ],
    ['Factorisation', 'ઇ-ઇ', 'Factorising algebraic expressions; identities.'],
    [
      'Introduction to Graphs',
      'ઇ-ઇ',
      'Coordinate plane; line graphs; linear equations.',
    ],
    [
      'Playing with Numbers',
      'ઇ-ઇ',
      'Number puzzles; tests of divisibility; codes.',
    ],
    [
      'Linear Equations — Applications',
      'ઇ-ઇ',
      'Word problems; age, distance, mixture problems.',
    ],
    [
      'Profit and Loss',
      'ઇ-ઇ',
      'Profit%, loss%; discount; successive discount.',
    ],
    [
      'Statistics',
      'ઇ-ઇ',
      'Frequency distribution; cumulative frequency; ogive.',
    ],
    [
      'Probability',
      'ઇ-ઇ',
      'Experimental and theoretical probability; cards and dice.',
    ],
  ]),

  ...ch('8', '1', 'Science', [
    [
      'Crop Production and Management',
      'ઇ-ઇ',
      'Kharif and Rabi crops; irrigation; fertilisers.',
    ],
    [
      'Microorganisms: Friend and Foe',
      'ઇ-ઇ',
      'Bacteria, fungi, virus; disease; antibiotics.',
    ],
    [
      'Synthetic Fibres and Plastics',
      'ઇ-ઇ',
      'Nylon, polyester; plastics; impact on environment.',
    ],
    [
      'Materials: Metals and Non-metals',
      'ઇ-ઇ',
      'Properties; reactivity; alloys; uses.',
    ],
    ['Coal and Petroleum', 'ઇ-ઇ', 'Fossil fuels; formation; uses; depletion.'],
    [
      'Combustion and Flame',
      'ઇ-ઇ',
      'Types of combustion; ignition; fire extinguisher.',
    ],
    [
      'Conservation of Plants and Animals',
      'ઇ-ઇ',
      'Deforestation; biodiversity; national parks.',
    ],
    [
      'Cell — Structure and Function',
      'ઇ-ઇ',
      'Organelles; plant vs animal cell; cell division.',
    ],
    [
      'Reproduction in Animals',
      'ઇ-ઇ',
      'Sexual and asexual reproduction; embryo development.',
    ],
    [
      'Reaching the Age of Adolescence',
      'ઇ-ઇ',
      'Puberty; hormones; reproductive health.',
    ],
  ]),
  ...ch('8', '2', 'Science', [
    [
      'Force and Pressure',
      'ઇ-ઇ',
      'Types of force; pressure; atmospheric pressure.',
    ],
    ['Friction', 'ઇ-ઇ', 'Types; factors; advantages and disadvantages.'],
    ['Sound', 'ઇ-ઇ', 'Vibration; frequency; amplitude; noise pollution.'],
    [
      'Chemical Effects of Electric Current',
      'ઇ-ઇ',
      'Electrolysis; electroplating; applications.',
    ],
    [
      'Some Natural Phenomena',
      'ઇ-ઇ',
      'Lightning; earthquakes; cyclones; Richter scale.',
    ],
    ['Light', 'ઇ-ઇ', 'Reflection laws; spherical mirrors; refraction; lenses.'],
    [
      'Stars and the Solar System',
      'ઇ-ઇ',
      'Solar system; planets; stars; moon; comets.',
    ],
    [
      'Pollution of Air and Water',
      'ઇ-ઇ',
      'Air and water pollutants; effects; solutions.',
    ],
    [
      'Metals and Non-metals — Extended',
      'ઇ-ઇ',
      'Corrosion; prevention; industrial uses.',
    ],
    [
      'Biotechnology Basics',
      'ઇ-ઇ',
      'Genetic modification; applications; ethical issues.',
    ],
  ]),

  ...ch('8', '1', 'Social Science', [
    [
      'How, When and Where',
      'ઇ-ઇ',
      'Colonialism; British rule; periodisation of history.',
    ],
    [
      'From Trade to Territory',
      'ઇ-ઇ',
      'East India Company; Battle of Plassey; expansion.',
    ],
    [
      'Ruling the Countryside',
      'ઇ-ઇ',
      'Revenue; Permanent Settlement; Ryotwari; Mahalwari.',
    ],
    [
      'Tribals, Dikus and the Vision of a Golden Age',
      'ઇ-ઇ',
      'Tribal life; Birsa Munda revolt.',
    ],
    [
      'When People Rebel',
      'ઇ-ઇ',
      '1857 revolt; causes, events and consequences.',
    ],
    [
      'Weavers, Iron Smelters and Factory Owners',
      'ઇ-ઇ',
      'Decline of crafts; rise of industries.',
    ],
    [
      'Civilising the Native, Educating the Nation',
      'ઇ-ઇ',
      'British education policy; Macaulay; Indian response.',
    ],
    [
      'Women, Caste and Reform',
      'ઇ-ઇ',
      'Social reform; Ram Mohan Roy; Phule; Ambedkar.',
    ],
    [
      'The Making of the National Movement',
      'ઇ-ઇ',
      'Congress; Extremists; Moderates; Non-cooperation.',
    ],
    [
      'India After Independence',
      'ઇ-ઇ',
      'Partition; Constitution; nation-building; 1947–1964.',
    ],
  ]),
  ...ch('8', '2', 'Social Science', [
    [
      'Resources',
      'ઇ-ઇ',
      'Types of resources; natural, human, man-made; sustainability.',
    ],
    [
      'Land, Soil, Water, Natural Vegetation and Wildlife',
      'ઇ-ઇ',
      'Use and abuse of natural resources.',
    ],
    [
      'Mineral and Power Resources',
      'ઇ-ઇ',
      'Types of minerals; mining; conventional energy.',
    ],
    ['Agriculture', 'ઇ-ઇ', 'Types of farming; major crops; world agriculture.'],
    [
      'Industries',
      'ઇ-ઇ',
      'Textile, steel, IT industries; factors of location.',
    ],
    [
      'Human Resources',
      'ઇ-ઇ',
      'Population distribution; growth; quality of life.',
    ],
    [
      'The Indian Constitution',
      'ઇ-ઇ',
      'Preamble; fundamental rights; directive principles.',
    ],
    [
      'Parliament and Making of Laws',
      'ઇ-ઇ',
      'Lok Sabha; Rajya Sabha; how a bill becomes law.',
    ],
    ['The Judiciary', 'ઇ-ઇ', 'Role of courts; PIL; independent judiciary.'],
    [
      'Social Justice and the Marginalised',
      'ઇ-ઇ',
      'Caste, gender, economic marginalisation; rights.',
    ],
  ]),

  ...ch('8', '1', 'Sanskrit', [
    [
      'Subhashit Suktavali',
      'ઇ-ઇ',
      'Collection of wise sayings; ethics and values.',
    ],
    ['Bilasya Kriti', 'ઇ-ઇ', 'Story about intelligence from Hitopadesha.'],
    [
      'Dishanirdesh',
      'ઇ-ઇ',
      'Instructions and directions in Sanskrit; vocabulary.',
    ],
    [
      'Sangha Shakti Kartavyam',
      'ઇ-ઇ',
      'Story about unity; collective strength.',
    ],
    [
      'Saivam Saukhyam',
      'ઇ-ઇ',
      'Peace and happiness; philosophical Sanskrit text.',
    ],
    [
      'Grammar — Dhatu Roop',
      'ઇ-ઇ',
      'Verb forms in Sanskrit; Parasmaipada; Atmanepada.',
    ],
    [
      'Ramayan — Sundarkand',
      'ઇ-ઇ',
      "Selected verses from Sundarkand; Hanuman's role.",
    ],
    [
      'Sanskrit Rachana',
      'ઇ-ઇ',
      'Writing paragraphs in Sanskrit on given topics.',
    ],
  ]),
  ...ch('8', '2', 'Sanskrit', [
    [
      'Ganga Stuti',
      'ઇ-ઇ',
      'Hymn to River Ganga; literary and spiritual value.',
    ],
    ['Mitra Bhed', 'ઇ-ઇ', 'Panchatantra Book 1; separation of friends.'],
    [
      'Vigyan aur Adhyatm',
      'ઇ-ઇ',
      'Science and spirituality in Sanskrit thought.',
    ],
    ['Narayan Upanishad', 'ઇ-ઇ', 'Selected verses from Narayan Upanishad.'],
    ['Grammar — Aavyaya', 'ઇ-ઇ', 'Indeclinables in Sanskrit; types and usage.'],
    [
      'Mahabharat — Santiparva',
      'ઇ-ઇ',
      'Excerpts from Shantiparva; wisdom on governance.',
    ],
    ['Sanskrit Prachar', 'ઇ-ઇ', 'Promotion of Sanskrit; modern relevance.'],
    [
      'Final Sanskrit Anuvaad',
      'ઇ-ઇ',
      'Translation exercises; Sanskrit to Gujarati and back.',
    ],
  ]),
];

// ─── Statistics ───────────────────────────────────────────────────────────────

export const CONTENT_STATS = {
  totalSubjects: GUJARAT_SUBJECTS.length,
  totalChapters: GUJARAT_CHAPTERS.length,
};
