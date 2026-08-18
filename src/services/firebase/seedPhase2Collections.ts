import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';
import { ServiceResult } from '../../types';

async function verifyOrSeedDoc(collectionName: string, docId: string, payload: any): Promise<void> {
  const docRef = firestore().collection(collectionName).doc(docId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    await docRef.set({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
      created_by: 'seed_script_admin'
    });
    console.log(`[SeedPhase2] Seeded document ${docId} in ${collectionName}`);
  } else {
    console.log(`[SeedPhase2] Document ${docId} already exists in ${collectionName}`);
  }
}

export async function seedPhase2Collections(): Promise<ServiceResult<void>> {
  try {
    // 1. Seed Topics
    await verifyOrSeedDoc(COLLECTIONS.TOPICS, 'sci_std_10_ch1_tp1', {
      topic_id: 'sci_std_10_ch1_tp1',
      topic_number: 1,
      chapter_id: 'sci_std_10_ch1',
      subject_id: 'sci_std_10',
      standard_id: 'std_10',
      standard_number: 10,
      title_gu: 'રાસાયણિક સમીકરણો લખવા',
      title_en: 'Writing Chemical Equations',
      content_type: 'text',
      content_gu: 'રાસાયણિક પ્રક્રિયાને વધુ સંક્ષિપ્ત અને ઉપયોગી બનાવવા માટે રાસાયણિક સમીકરણો સંજ્ઞાઓ દ્વારા લખાય છે...',
      is_active: true,
      is_premium: false,
      display_order: 1
    });

    // 2. Seed Sub Topics
    await verifyOrSeedDoc(COLLECTIONS.SUB_TOPICS, 'sci_std_10_ch1_tp1_sub1', {
      sub_topic_id: 'sci_std_10_ch1_tp1_sub1',
      topic_id: 'sci_std_10_ch1_tp1',
      title_en: 'Introduction to Chemical Symbols',
      title_gu: 'રાસાયણિક સંજ્ઞાઓ પરિચય',
      display_order: 1,
      is_active: true
    });

    // 3. Seed Learning Outcomes
    await verifyOrSeedDoc(COLLECTIONS.LEARNING_OUTCOMES, 'lo_sci_10_ch1_tp1_1', {
      outcome_id: 'lo_sci_10_ch1_tp1_1',
      topic_id: 'sci_std_10_ch1_tp1',
      chapter_id: 'sci_std_10_ch1',
      subject_id: 'sci_std_10',
      standard_id: 'std_10',
      outcome_text_gu: 'વિદ્યાર્થી સંતુલિત રાસાયણિક સમીકરણો લખી શકે છે અને તેનું મહત્વ સમજાવી શકે છે.',
      bloom_level: 'apply',
      measurable_verb_gu: 'લખી અને સંતુલિત કરી શકે',
      linked_question_ids: ['q_sci_10_ch1_1'],
      is_active: true,
      display_order: 1
    });

    // 4. Seed Chapter Summaries
    await verifyOrSeedDoc(COLLECTIONS.CHAPTER_SUMMARIES, 'sum_sci_10_ch1', {
      summary_id: 'sum_sci_10_ch1',
      chapter_id: 'sci_std_10_ch1',
      standard_id: 'std_10',
      subject_id: 'sci_std_10',
      summary_en: 'Summary of Chemical Reactions and Equations including balanced equations.',
      summary_gu: 'રાસાયણિક પ્રક્રિયાઓ અને સંતુલિત સમીકરણોની સમજૂતી આપતું પ્રકરણ સારાંશ.',
      key_points: [
        { text_en: 'Chemical changes produce new substances.', text_gu: 'રાસાયણિક ફેરફારો નવા પદાર્થો ઉત્પન્ન કરે છે.' }
      ],
      important_formulas: [
        { formula: '2H_2 + O_2 -> 2H_2O', description_en: 'Water synthesis equation', description_gu: 'પાણી સંશ્લેષણ સમીકરણ' }
      ],
      diagram_references: [
        { imageUrl: 'https://cdn.gyandeep.com/diagrams/water_electrolysis.png', caption_en: 'Electrolysis of Water', caption_gu: 'પાણીનું વિદ્યુત વિભાજન' }
      ],
      revision_notes_en: 'Always balance atoms on both sides of the equation.',
      revision_notes_gu: 'સમીકરણની બંને બાજુ પરમાણુઓ હંમેશા સંતુલિત કરો.',
      is_active: true
    });

    // 5. Seed Question Bank
    await verifyOrSeedDoc(COLLECTIONS.QUESTION_BANK, 'q_sci_10_ch1_1', {
      question_id: 'q_sci_10_ch1_1',
      topic_id: 'sci_std_10_ch1_tp1',
      chapter_id: 'sci_std_10_ch1',
      subject_id: 'sci_std_10',
      standard_id: 'std_10',
      standard_number: 10,
      question_text_gu: 'સંતુલિત રાસાયણિક સમીકરણ એટલે શું? દળ સંચયનો નિયમ સમજાવો.',
      question_type: 'short_answer',
      answer_gu: 'જે રાસાયણિક સમીકરણમાં પ્રક્રિયકો અને નીપજો બંને તરફ દરેક તત્વના પરમાણુઓની સંખ્યા સમાન હોય તેને સંતુલિત સમીકરણ કહેવાય. દળ સંચયના નિયમ મુજબ કોઈપણ રાસાયણિક પ્રક્રિયામાં દ્રવ્યનું સર્જન કે વિનાશ થતો નથી.',
      bloom_level: 'understand',
      difficulty_level: 'medium',
      marks: 2,
      is_verified: true,
      is_active: true,
      is_premium: false,
      usage_count: 0
    });

    // 6. Seed MCQ Bank
    await verifyOrSeedDoc(COLLECTIONS.MCQ_BANK, 'mcq_sci_10_ch1_1', {
      mcq_id: 'mcq_sci_10_ch1_1',
      topic_id: 'sci_std_10_ch1_tp1',
      chapter_id: 'sci_std_10_ch1',
      subject_id: 'sci_std_10',
      standard_id: 'std_10',
      standard_number: 10,
      question_text_gu: 'મેગ્નેશિયમ પટ્ટીને હવામાં સળગાવતા કયા રંગની જ્યોત જોવા મળે છે?',
      options: [
        { id: 'A', text_gu: 'લાલ' },
        { id: 'B', text_gu: 'લીલી' },
        { id: 'C', text_gu: 'જગારા મારતી સફેદ' },
        { id: 'D', text_gu: 'પીળી' }
      ],
      correct_option_id: 'C',
      explanation_gu: 'મેગ્નેશિયમ હવામાં ઓક્સિજન સાથે પ્રક્રિયા કરીને મેગ્નેશિયમ ઓક્સાઇડ બનાવે છે અને જગારા મારતી સફેદ જ્યોતથી સળગે છે.',
      bloom_level: 'remember',
      difficulty_level: 'easy',
      marks: 1,
      is_verified: true,
      is_active: true,
      is_premium: false,
      usage_count: 0
    });

    // 7. Seed Worksheets
    await verifyOrSeedDoc(COLLECTIONS.WORKSHEETS, 'ws_sci_std_10_ch1_1', {
      worksheet_id: 'ws_sci_std_10_ch1_1',
      chapter_id: 'sci_std_10_ch1',
      subject_id: 'sci_std_10',
      standard_id: 'std_10',
      standard_number: 10,
      title_gu: 'રાસાયણિક પ્રક્રિયાઓ સંતુલન સ્વાધ્યાય પત્રક',
      worksheet_type: 'practice',
      difficulty_level: 'medium',
      pdf_url: 'https://cdn.gyandeep.com/worksheets/sci_std_10_ch1_ws1.pdf',
      total_questions: 10,
      total_marks: 20,
      is_downloadable: true,
      is_active: true,
      is_premium: false,
      download_count: 0
    });

    // 8. Seed Lesson Plans
    await verifyOrSeedDoc(COLLECTIONS.LESSON_PLANS, 'lp_sci_std_10_ch1', {
      lesson_plan_id: 'lp_sci_std_10_ch1',
      chapter_id: 'sci_std_10_ch1',
      subject_id: 'sci_std_10',
      standard_id: 'std_10',
      title_gu: 'રાસાયણિક પ્રક્રિયાઓ અને સમીકરણો અધ્યાપન આયોજન',
      total_periods: 6,
      period_duration_min: 45,
      periods: [
        {
          period_number: 1,
          topic_title_gu: 'ભૌતિક અને રાસાયણિક પ્રક્રિયાઓ વચ્ચેનો તફાવત',
          activities_gu: ['શાળા સ્તરે મેગ્નેશિયમ પટ્ટી સળગાવવાના પ્રયોગનું નિદર્શન કરવું']
        }
      ],
      learning_outcomes: ['વિદ્યાર્થી ભૌતિક અને રાસાયણિક ફેરફાર વચ્ચે ભેદ પારખી શકે.'],
      is_active: true,
      is_ai_generated: false
    });

    // 9. Seed Flashcards
    await verifyOrSeedDoc(COLLECTIONS.FLASHCARDS, 'fc_sci_10_ch1_1', {
      flashcard_id: 'fc_sci_10_ch1_1',
      topic_id: 'sci_std_10_ch1_tp1',
      chapter_id: 'sci_std_10_ch1',
      subject_id: 'sci_std_10',
      standard_id: 'std_10',
      front_text_gu: 'દ્રવ્યમાન સંચયનો નિયમ શું દર્શાવે છે?',
      back_text_gu: 'કોઈપણ રાસાયણિક પ્રક્રિયામાં દ્રવ્યનું સર્જન કે વિનાશ થઈ શકતો નથી.',
      card_type: 'concept',
      difficulty_level: 'easy',
      is_active: true,
      is_premium: false,
      is_ai_generated: true,
      review_count: 0
    });

    // 10. Seed Glossary
    await verifyOrSeedDoc(COLLECTIONS.GLOSSARY, 'gl_sci_10_catalyst', {
      glossary_id: 'gl_sci_10_catalyst',
      subject_id: 'sci_std_10',
      topic_id: 'sci_std_10_ch1_tp1',
      standard_id: 'std_10',
      standard_number: 10,
      subject_code: 'SCI10',
      word_gu: 'ઉદ્દીપક',
      word_en: 'Catalyst',
      definition_gu: 'જે પદાર્થ રાસાયણિક પ્રક્રિયામાં ભાગ લીધા વિના પ્રક્રિયાનો વેગ વધારે છે તેને ઉદ્દીપક કહે છે.',
      is_active: true
    });

    // 11. Seed Videos
    await verifyOrSeedDoc(COLLECTIONS.VIDEOS, 'vid_sci_std_10_ch1_1', {
      video_id: 'vid_sci_std_10_ch1_1',
      chapter_id: 'sci_std_10_ch1',
      subject_id: 'sci_std_10',
      standard_id: 'std_10',
      standard_number: 10,
      title_gu: 'રાસાયણિક પ્રક્રિયાઓ પરિચય પ્રયોગ',
      video_source: 'youtube',
      video_url: 'https://www.youtube.com/watch?v=sci10ch1',
      thumbnail_url: 'https://img.youtube.com/vi/sci10ch1/0.jpg',
      duration_seconds: 480,
      language: 'Gujarati',
      content_type: 'experiment',
      view_count: 0,
      like_count: 0,
      is_active: true,
      is_premium: false,
      ai_indexed: false
    });

    // 12. Seed Textbooks
    await verifyOrSeedDoc(COLLECTIONS.TEXTBOOKS, 'tb_sci_std_10', {
      textbook_id: 'tb_sci_std_10',
      subject_id: 'sci_std_10',
      standard_id: 'std_10',
      standard_number: 10,
      title_gu: 'ધોરણ ૧૦ વિજ્ઞાન પાઠ્યપુસ્તક',
      title_en: 'Standard 10 Science Textbook',
      publisher: 'GSEB',
      edition_year: 2024,
      total_pages: 280,
      total_chapters: 16,
      pdf_url: 'https://cdn.gyandeep.com/textbooks/std_10_science.pdf',
      chapter_page_map: [
        { chapter_number: 1, chapter_title_gu: 'રાસાયણિક પ્રક્રિયાઓ', start_page: 1, end_page: 18 }
      ],
      language: 'Gujarati',
      is_downloadable: true,
      is_active: true,
      is_premium: false,
      ocr_processed: false,
      ai_indexed: false
    });

    // 13. Seed Activities
    await verifyOrSeedDoc(COLLECTIONS.ACTIVITIES, 'act_sci_10_ch1_tp1_1', {
      activity_id: 'act_sci_10_ch1_tp1_1',
      topic_id: 'sci_std_10_ch1_tp1',
      chapter_id: 'sci_std_10_ch1',
      subject_id: 'sci_std_10',
      standard_id: 'std_10',
      title_en: 'Magnesium Ribbon Burning Experiment',
      title_gu: 'મેગ્નેશિયમ પટ્ટી સળગાવવાનો પ્રયોગ',
      instructions_en: 'Hold a magnesium ribbon with a pair of tongs and burn it over a burner.',
      instructions_gu: 'ચીપિયા વડે મેગ્નેશિયમ પટ્ટી પકડો અને બર્નર પર સળગાવો.',
      materials_needed: ['magnesium ribbon', 'tongs', 'burner', 'watch glass'],
      duration_minutes: 15,
      activity_type: 'experiment',
      is_active: true
    });

    // 14. Seed Keywords
    await verifyOrSeedDoc(COLLECTIONS.KEYWORDS, 'kw_sci_10_ch1_tp1_1', {
      keyword_id: 'kw_sci_10_ch1_tp1_1',
      topic_id: 'sci_std_10_ch1_tp1',
      chapter_id: 'sci_std_10_ch1',
      subject_id: 'sci_std_10',
      standard_id: 'std_10',
      keyword_en: 'Reactants',
      keyword_gu: 'પ્રક્રિયકો',
      meaning_en: 'Substances that take part in a chemical reaction.',
      meaning_gu: 'રાસાયણિક પ્રક્રિયામાં ભાગ લેતા પદાર્થો.',
      is_active: true
    });

    return { success: true };
  } catch (error) {
    console.error('[SeedPhase2] Seeding failed:', error);
    return { success: false, error: (error as Error).message };
  }
}
