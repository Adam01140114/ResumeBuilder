// AI Resume Generator Configuration
const AI_CONFIG = {
    apiKey: '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',
    model: 'gpt-4', // Using GPT-4 for better resume generation
    maxTokens: 2000,
    temperature: 0.7,
    systemPrompt: `You are an AI Resume Generator that creates professional, tailored resumes based on job descriptions. 

Your task is to generate a complete resume JSON structure that matches the provided job description. The resume should be:
- Professional and well-structured
- Tailored to the specific job requirements
- Include relevant skills, experience, and achievements
- Use industry-appropriate language and terminology
- Include realistic but impressive accomplishments

Return ONLY a valid JSON object in this exact format:
{
  "contact": {
    "name": "Generated Name",
    "address": "City, State",
    "email": "email@example.com",
    "phone": "(555) 123-4567"
  },
  "jobs": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "Month Year",
      "endDate": "Present or Month Year",
      "duties": ["Achievement 1", "Achievement 2", "Achievement 3"]
    }
  ],
  "skills": {
    "Technical Skills": ["Skill 1", "Skill 2", "Skill 3"],
    "Soft Skills": ["Skill 1", "Skill 2", "Skill 3"]
  },
  "certificates": [
    {"name": "Relevant Certificate 1"},
    {"name": "Relevant Certificate 2"}
  ]
}

Generate 3-4 relevant job experiences that build up to the target position. Make the resume compelling and professional.`
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AI_CONFIG;
}
