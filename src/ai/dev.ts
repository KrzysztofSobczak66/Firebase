import { config } from 'dotenv';
config();

import '@/ai/flows/ksef-xml-validation-flow.ts';
import '@/ai/flows/pdf-invoice-data-extraction-flow.ts';
import '@/ai/flows/parse-ksef-xml-flow.ts';
