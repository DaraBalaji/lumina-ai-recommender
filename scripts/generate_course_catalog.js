import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const existingCourseIds = [
  'course-py-01','course-math-01','course-dl-01','course-nlp-01','course-rag-01','course-peft-01','course-agents-01','proj-ai-01',
  'course-linux-01','course-docker-01','course-k8s-01','course-tf-01','course-cicd-01',
  'course-sol-01','course-web3ui-01',
  'course-sql-01','course-ml-analyst-01',
  'course-rust-01','course-rust-async-01',
  'course-sec-01',
  'course-mlops-01','course-cv-01','course-ssd-01','course-react-adv-01','course-dataeng-01','course-gcp-data-01','proj-webapp-01','course-rl-01','course-obs-01','course-ci-advanced-01'
];

const categories = [
  { prefix: 'ml', title: 'Machine Learning', skills: ['PyTorch & Deep Learning','Model Deployment','Feature Engineering'] },
  { prefix: 'data', title: 'Data Engineering', skills: ['ETL & Data Pipelines','Kafka Streaming','dbt Modeling'] },
  { prefix: 'cloud', title: 'Cloud Engineering', skills: ['AWS/GCP Fundamentals','Infrastructure as Code','Serverless'] },
  { prefix: 'web', title: 'Web Development', skills: ['React & Next.js','TypeScript','Testing'] },
  { prefix: 'sec', title: 'Security', skills: ['Web App Security','Secure Coding','Threat Modeling'] },
  { prefix: 'devops', title: 'DevOps & SRE', skills: ['CI/CD','Observability','Kubernetes'] },
  { prefix: 'ai', title: 'AI Specialization', skills: ['RAG','LLM Fine-Tuning','Prompt Engineering'] },
  { prefix: 'mobile', title: 'Mobile', skills: ['React Native','Mobile Performance','App Distribution'] },
  { prefix: 'infra', title: 'Infrastructure', skills: ['Networking','Caching','Databases'] },
  { prefix: 'soft', title: 'Professional Skills', skills: ['System Design','Interview Prep','Career Growth'] }
];

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getCourseUrl(provider, title) {
  const query = encodeURIComponent(title);
  const urls = {
    Coursera: `https://www.coursera.org/search?query=${query}`,
    Udemy: `https://www.udemy.com/courses/search/?q=${query}`,
    Pluralsight: `https://www.pluralsight.com/search?q=${query}`,
    edX: `https://www.edx.org/search?q=${query}`,
    'fast.ai': 'https://course.fast.ai/',
    freeCodeCamp: `https://www.freecodecamp.org/news/search/?query=${query}`,
    'Lumina Labs': `https://github.com/search?q=${query}&type=repositories`,
  };
  return urls[provider] || `https://www.google.com/search?q=${query}`;
}

const generated = [];
let counter = 1;
const targetGenerated = 130; // produce ~130 generated to push total over 150

for (let i = 0; i < targetGenerated; i++) {
  const cat = pick(categories);
  const difficultyRoll = Math.random();
  const difficulty = difficultyRoll < 0.5 ? 'Beginner' : difficultyRoll < 0.85 ? 'Intermediate' : 'Advanced';
  const id = `gen-${cat.prefix}-${String(counter).padStart(3,'0')}`;
  const title = `${cat.title} Essentials ${counter}`;
  const provider = pick(['Coursera','Udemy','Pluralsight','edX','fast.ai','freeCodeCamp','Lumina Labs']);
  const durationHours = randInt(difficulty==='Beginner'?6:12, difficulty==='Advanced'?40:28);
  const rating = +( (4.5 + Math.random()*0.5).toFixed(2) );
  const cost = pick(['Free','Paid','Freemium']);
  const url = getCourseUrl(provider, title);
  const skillsCovered = [pick(cat.skills), pick(cat.skills)];
  const possiblePrereqs = existingCourseIds.concat(generated.map(g=>g.id));
  const prereqCount = Math.random() < 0.35 ? randInt(1,2) : 0;
  const prerequisites = [];
  for (let p=0;p<prereqCount;p++) {
    prerequisites.push(pick(possiblePrereqs));
  }
  const type = Math.random() < 0.12 ? 'Project' : 'Course';
  const course = {
    id,
    title,
    provider,
    description: `${title} — concise, practical training on ${cat.title.toLowerCase()} topics and hands-on labs.`,
    durationHours,
    difficulty,
    rating,
    reviewCount: randInt(100, 8000),
    cost,
    url,
    skillsCovered,
    prerequisites,
    type,
  };
  if (type==='Project') {
    course.projectMapping = {
      title: `${title} Project`,
      description: `Build a production-ready ${cat.title.toLowerCase()} demo as part of this capstone.`
    };
  }
  generated.push(course);
  counter++;
}

const outPath = path.join(__dirname, '..', 'src', 'data', 'courseCatalog.generated.ts');
const fileContent = `import { Course } from '../types';\n\nexport const GENERATED_COURSES: Course[] = ${JSON.stringify(generated, null, 2)};\n`;
fs.writeFileSync(outPath, fileContent, 'utf8');
console.log('Wrote', outPath, 'with', generated.length, 'entries');
