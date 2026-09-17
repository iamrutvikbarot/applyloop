export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export interface JobOpportunity {
  title: string;
  company?: string;
  location?: string;
  experience?: string;
  url?: string;
}

export interface EmailItem {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
  htmlBody?: string;
  textBody?: string;
  gmailUrl?: string;
  extractedJobs?: JobOpportunity[];
}

