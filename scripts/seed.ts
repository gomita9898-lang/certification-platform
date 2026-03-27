/**
 * Seed script — populates the database with demo data for development.
 *
 * Run with: npm run db:seed
 *
 * Prerequisites:
 * - Supabase project running (local or cloud)
 * - SUPABASE_SERVICE_ROLE_KEY set in .env.local
 * - NEXT_PUBLIC_SUPABASE_URL set in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("🌱 Seeding database...\n");

  // 1. Create demo course
  console.log("📚 Creating demo course...");
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .insert({
      title_pt: "Fundamentos de Oncologia Clínica",
      title_en: "Fundamentals of Clinical Oncology",
      description_pt:
        "Este curso aborda os conceitos fundamentais da oncologia clínica, incluindo diagnóstico, estadiamento, tratamento e cuidados paliativos. Destinado a estudantes de medicina e profissionais de saúde.",
      description_en:
        "This course covers the fundamental concepts of clinical oncology, including diagnosis, staging, treatment, and palliative care. Designed for medical students and healthcare professionals.",
      is_published: true,
      pass_threshold: 80,
    })
    .select()
    .single();

  if (courseError) {
    console.error("Error creating course:", courseError);
    return;
  }
  console.log(`  ✓ Course created: ${course.id}\n`);

  // 2. Create modules
  console.log("📖 Creating modules...");
  const modulesData = [
    {
      course_id: course.id,
      title_pt: "Introdução à Oncologia",
      title_en: "Introduction to Oncology",
      description_pt: "Visão geral da oncologia como especialidade médica.",
      description_en: "Overview of oncology as a medical specialty.",
      content_pt:
        "<h2>Bem-vindo ao Módulo 1</h2><p>Neste módulo, iremos explorar os conceitos fundamentais da oncologia, incluindo a definição de cancro, a sua prevalência global e os princípios básicos da biologia tumoral.</p><h3>Objetivos de Aprendizagem</h3><ul><li>Definir oncologia e as suas subdisciplinas</li><li>Compreender a epidemiologia do cancro a nível global</li><li>Identificar os princípios básicos da carcinogénese</li></ul><p>O cancro é uma das principais causas de morbilidade e mortalidade em todo o mundo. A compreensão dos seus mecanismos fundamentais é essencial para qualquer profissional de saúde.</p>",
      content_en:
        "<h2>Welcome to Module 1</h2><p>In this module, we will explore the fundamental concepts of oncology, including the definition of cancer, its global prevalence, and the basic principles of tumour biology.</p><h3>Learning Objectives</h3><ul><li>Define oncology and its subdisciplines</li><li>Understand the global epidemiology of cancer</li><li>Identify the basic principles of carcinogenesis</li></ul><p>Cancer is one of the leading causes of morbidity and mortality worldwide. Understanding its fundamental mechanisms is essential for any healthcare professional.</p>",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      order_index: 0,
      is_published: true,
    },
    {
      course_id: course.id,
      title_pt: "Diagnóstico e Estadiamento",
      title_en: "Diagnosis and Staging",
      description_pt: "Métodos de diagnóstico e sistemas de estadiamento do cancro.",
      description_en: "Cancer diagnosis methods and staging systems.",
      content_pt:
        "<h2>Diagnóstico e Estadiamento</h2><p>O diagnóstico preciso e o estadiamento adequado são fundamentais para o planeamento terapêutico em oncologia.</p><h3>Objetivos de Aprendizagem</h3><ul><li>Conhecer os métodos de diagnóstico em oncologia</li><li>Compreender o sistema TNM de estadiamento</li><li>Interpretar exames de imagem oncológicos</li></ul>",
      content_en:
        "<h2>Diagnosis and Staging</h2><p>Accurate diagnosis and proper staging are fundamental for therapeutic planning in oncology.</p><h3>Learning Objectives</h3><ul><li>Know the diagnostic methods in oncology</li><li>Understand the TNM staging system</li><li>Interpret oncological imaging exams</li></ul>",
      video_url: null,
      order_index: 1,
      is_published: true,
    },
    {
      course_id: course.id,
      title_pt: "Modalidades de Tratamento",
      title_en: "Treatment Modalities",
      description_pt: "Cirurgia, quimioterapia, radioterapia e imunoterapia.",
      description_en: "Surgery, chemotherapy, radiotherapy, and immunotherapy.",
      content_pt:
        "<h2>Modalidades de Tratamento</h2><p>O tratamento do cancro é multidisciplinar e pode incluir diversas modalidades terapêuticas.</p><h3>Objetivos de Aprendizagem</h3><ul><li>Descrever as principais modalidades de tratamento oncológico</li><li>Compreender os princípios da quimioterapia</li><li>Conhecer os avanços em imunoterapia</li></ul>",
      content_en:
        "<h2>Treatment Modalities</h2><p>Cancer treatment is multidisciplinary and may include various therapeutic modalities.</p><h3>Learning Objectives</h3><ul><li>Describe the main modalities of cancer treatment</li><li>Understand the principles of chemotherapy</li><li>Know the advances in immunotherapy</li></ul>",
      video_url: null,
      order_index: 2,
      is_published: true,
    },
  ];

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .insert(modulesData)
    .select();

  if (modulesError) {
    console.error("Error creating modules:", modulesError);
    return;
  }
  console.log(`  ✓ ${modules.length} modules created\n`);

  // 3. Create questions for each module
  console.log("❓ Creating questions...");

  const moduleQuestions = [
    // Module 1 questions
    {
      module_id: modules[0].id,
      course_id: course.id,
      question_pt: "Qual é a definição mais abrangente de oncologia?",
      question_en: "What is the most comprehensive definition of oncology?",
      explanation_pt:
        "A oncologia é o ramo da medicina que estuda, diagnostica e trata as neoplasias (tumores).",
      explanation_en:
        "Oncology is the branch of medicine that studies, diagnoses, and treats neoplasms (tumours).",
      is_exam_question: false,
      order_index: 0,
      options: [
        {
          text_pt: "Estudo das doenças infecciosas",
          text_en: "Study of infectious diseases",
          is_correct: false,
        },
        {
          text_pt: "Ramo da medicina que estuda, diagnostica e trata neoplasias",
          text_en: "Branch of medicine that studies, diagnoses, and treats neoplasms",
          is_correct: true,
        },
        {
          text_pt: "Tratamento exclusivo com quimioterapia",
          text_en: "Treatment exclusively with chemotherapy",
          is_correct: false,
        },
        {
          text_pt: "Estudo das doenças cardiovasculares",
          text_en: "Study of cardiovascular diseases",
          is_correct: false,
        },
      ],
    },
    {
      module_id: modules[0].id,
      course_id: course.id,
      question_pt: "Qual é a principal causa de mortalidade relacionada com o cancro a nível global?",
      question_en: "What is the leading cause of cancer-related mortality globally?",
      explanation_pt: "O cancro do pulmão é a principal causa de mortalidade oncológica a nível mundial.",
      explanation_en: "Lung cancer is the leading cause of cancer-related mortality worldwide.",
      is_exam_question: false,
      order_index: 1,
      options: [
        { text_pt: "Cancro do pulmão", text_en: "Lung cancer", is_correct: true },
        { text_pt: "Cancro da mama", text_en: "Breast cancer", is_correct: false },
        { text_pt: "Cancro colorretal", text_en: "Colorectal cancer", is_correct: false },
        { text_pt: "Cancro da próstata", text_en: "Prostate cancer", is_correct: false },
      ],
    },
    // Module 2 questions
    {
      module_id: modules[1].id,
      course_id: course.id,
      question_pt: "O que significa a sigla TNM no estadiamento oncológico?",
      question_en: "What does the acronym TNM stand for in cancer staging?",
      explanation_pt: "TNM refere-se a Tumor, Nódulos (linfáticos) e Metástases.",
      explanation_en: "TNM refers to Tumour, Nodes (lymph), and Metastases.",
      is_exam_question: false,
      order_index: 0,
      options: [
        {
          text_pt: "Tumor, Nódulos, Metástases",
          text_en: "Tumour, Nodes, Metastases",
          is_correct: true,
        },
        {
          text_pt: "Tratamento, Nutrição, Medicação",
          text_en: "Treatment, Nutrition, Medication",
          is_correct: false,
        },
        {
          text_pt: "Tipo, Número, Magnitude",
          text_en: "Type, Number, Magnitude",
          is_correct: false,
        },
        {
          text_pt: "Tecido, Neoplasia, Marcador",
          text_en: "Tissue, Neoplasm, Marker",
          is_correct: false,
        },
      ],
    },
    // Module 3 questions
    {
      module_id: modules[2].id,
      course_id: course.id,
      question_pt: "Qual das seguintes é uma modalidade de tratamento oncológico sistémico?",
      question_en: "Which of the following is a systemic cancer treatment modality?",
      explanation_pt:
        "A quimioterapia é um tratamento sistémico que atua em todo o organismo, ao contrário da cirurgia e da radioterapia que são tratamentos locais.",
      explanation_en:
        "Chemotherapy is a systemic treatment that acts throughout the body, unlike surgery and radiotherapy which are local treatments.",
      is_exam_question: false,
      order_index: 0,
      options: [
        { text_pt: "Cirurgia", text_en: "Surgery", is_correct: false },
        { text_pt: "Quimioterapia", text_en: "Chemotherapy", is_correct: true },
        { text_pt: "Radioterapia local", text_en: "Local radiotherapy", is_correct: false },
        { text_pt: "Biópsia", text_en: "Biopsy", is_correct: false },
      ],
    },
  ];

  // Final exam questions
  const examQuestions = [
    {
      module_id: null,
      course_id: course.id,
      question_pt: "A carcinogénese é um processo que envolve:",
      question_en: "Carcinogenesis is a process that involves:",
      explanation_pt:
        "A carcinogénese é um processo multi-etapas que envolve mutações genéticas acumuladas ao longo do tempo.",
      explanation_en:
        "Carcinogenesis is a multi-step process involving accumulated genetic mutations over time.",
      is_exam_question: true,
      order_index: 0,
      options: [
        {
          text_pt: "Uma única mutação genética",
          text_en: "A single genetic mutation",
          is_correct: false,
        },
        {
          text_pt: "Múltiplas mutações genéticas acumuladas",
          text_en: "Multiple accumulated genetic mutations",
          is_correct: true,
        },
        {
          text_pt: "Apenas factores ambientais",
          text_en: "Only environmental factors",
          is_correct: false,
        },
        {
          text_pt: "Apenas factores hereditários",
          text_en: "Only hereditary factors",
          is_correct: false,
        },
      ],
    },
    {
      module_id: null,
      course_id: course.id,
      question_pt: "Qual é o objetivo principal do estadiamento tumoral?",
      question_en: "What is the main objective of tumour staging?",
      explanation_pt:
        "O estadiamento permite determinar a extensão da doença e orientar as decisões terapêuticas.",
      explanation_en:
        "Staging allows determining the extent of the disease and guiding therapeutic decisions.",
      is_exam_question: true,
      order_index: 1,
      options: [
        {
          text_pt: "Determinar a extensão da doença e orientar o tratamento",
          text_en: "Determine the extent of disease and guide treatment",
          is_correct: true,
        },
        {
          text_pt: "Apenas classificar o tipo de tumor",
          text_en: "Only classify the type of tumour",
          is_correct: false,
        },
        {
          text_pt: "Definir o prognóstico exacto do doente",
          text_en: "Define the exact prognosis of the patient",
          is_correct: false,
        },
        {
          text_pt: "Determinar o custo do tratamento",
          text_en: "Determine the cost of treatment",
          is_correct: false,
        },
      ],
    },
    {
      module_id: null,
      course_id: course.id,
      question_pt: "A imunoterapia oncológica funciona através de:",
      question_en: "Cancer immunotherapy works through:",
      explanation_pt:
        "A imunoterapia utiliza ou estimula o sistema imunitário do próprio doente para combater o cancro.",
      explanation_en:
        "Immunotherapy uses or stimulates the patient's own immune system to fight cancer.",
      is_exam_question: true,
      order_index: 2,
      options: [
        {
          text_pt: "Destruição direta das células tumorais por agentes químicos",
          text_en: "Direct destruction of tumour cells by chemical agents",
          is_correct: false,
        },
        {
          text_pt: "Radiação ionizante dirigida ao tumor",
          text_en: "Ionising radiation directed at the tumour",
          is_correct: false,
        },
        {
          text_pt: "Estimulação do sistema imunitário para combater o cancro",
          text_en: "Stimulation of the immune system to fight cancer",
          is_correct: true,
        },
        {
          text_pt: "Remoção cirúrgica do tumor",
          text_en: "Surgical removal of the tumour",
          is_correct: false,
        },
      ],
    },
    {
      module_id: null,
      course_id: course.id,
      question_pt:
        "Qual dos seguintes é um princípio fundamental da abordagem multidisciplinar em oncologia?",
      question_en:
        "Which of the following is a fundamental principle of the multidisciplinary approach in oncology?",
      explanation_pt:
        "A decisão terapêutica em oncologia deve envolver uma equipa multidisciplinar para garantir o melhor plano de tratamento.",
      explanation_en:
        "Therapeutic decisions in oncology should involve a multidisciplinary team to ensure the best treatment plan.",
      is_exam_question: true,
      order_index: 3,
      options: [
        {
          text_pt: "O tratamento é decidido apenas pelo oncologista",
          text_en: "Treatment is decided only by the oncologist",
          is_correct: false,
        },
        {
          text_pt: "Diferentes especialistas colaboram na decisão terapêutica",
          text_en: "Different specialists collaborate in the therapeutic decision",
          is_correct: true,
        },
        {
          text_pt: "O doente não deve participar na decisão",
          text_en: "The patient should not participate in the decision",
          is_correct: false,
        },
        {
          text_pt: "Apenas se utiliza uma modalidade de tratamento",
          text_en: "Only one treatment modality is used",
          is_correct: false,
        },
      ],
    },
    {
      module_id: null,
      course_id: course.id,
      question_pt: "O rastreio oncológico tem como principal objetivo:",
      question_en: "The main objective of cancer screening is:",
      explanation_pt:
        "O rastreio visa detetar o cancro numa fase precoce, quando o tratamento é mais eficaz.",
      explanation_en:
        "Screening aims to detect cancer at an early stage, when treatment is most effective.",
      is_exam_question: true,
      order_index: 4,
      options: [
        {
          text_pt: "Tratar o cancro em fase avançada",
          text_en: "Treat cancer at an advanced stage",
          is_correct: false,
        },
        {
          text_pt: "Detetar o cancro numa fase precoce",
          text_en: "Detect cancer at an early stage",
          is_correct: true,
        },
        {
          text_pt: "Prevenir todas as formas de cancro",
          text_en: "Prevent all forms of cancer",
          is_correct: false,
        },
        {
          text_pt: "Substituir os métodos de diagnóstico",
          text_en: "Replace diagnostic methods",
          is_correct: false,
        },
      ],
    },
  ];

  const allQuestions = [...moduleQuestions, ...examQuestions];

  for (const q of allQuestions) {
    const { options, ...questionData } = q;

    const { data: question, error: qError } = await supabase
      .from("questions")
      .insert(questionData)
      .select()
      .single();

    if (qError) {
      console.error("Error creating question:", qError);
      continue;
    }

    const optionsWithQuestionId = options.map((opt, index) => ({
      ...opt,
      question_id: question.id,
      order_index: index,
    }));

    const { error: optError } = await supabase.from("question_options").insert(optionsWithQuestionId);

    if (optError) {
      console.error("Error creating options:", optError);
    }
  }

  console.log(
    `  ✓ ${moduleQuestions.length} module questions + ${examQuestions.length} exam questions created\n`,
  );

  // 4. Create admin user (if not exists)
  console.log("👤 Creating admin user...");
  const adminEmail = "admin@certificacao.local";
  const adminPassword = "admin123456";

  const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: "Administrador",
      role: "admin",
      locale: "pt",
    },
  });

  if (adminError) {
    if (adminError.message?.includes("already")) {
      console.log("  ℹ Admin user already exists");
    } else {
      console.error("  Error creating admin:", adminError);
    }
  } else {
    console.log(`  ✓ Admin created: ${adminEmail} / ${adminPassword}`);
  }

  // 5. Create demo student
  console.log("\n👨‍🎓 Creating demo student...");
  const studentEmail = "aluno@certificacao.local";
  const studentPassword = "aluno123456";

  const { data: studentUser, error: studentError } = await supabase.auth.admin.createUser({
    email: studentEmail,
    password: studentPassword,
    email_confirm: true,
    user_metadata: {
      full_name: "Maria Silva",
      role: "student",
      locale: "pt",
    },
  });

  if (studentError) {
    if (studentError.message?.includes("already")) {
      console.log("  ℹ Student user already exists");
    } else {
      console.error("  Error creating student:", studentError);
    }
  } else {
    console.log(`  ✓ Student created: ${studentEmail} / ${studentPassword}`);

    // Enroll student in course
    const { error: enrollError } = await supabase.from("enrollments").insert({
      user_id: studentUser.user.id,
      course_id: course.id,
    });

    if (enrollError) {
      console.error("  Error enrolling student:", enrollError);
    } else {
      console.log("  ✓ Student enrolled in demo course");
    }
  }

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📋 Demo credentials:");
  console.log(`  Admin:   ${adminEmail} / ${adminPassword}`);
  console.log(`  Student: ${studentEmail} / ${studentPassword}`);
}

seed().catch(console.error);
