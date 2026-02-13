import { GoogleGenerativeAI } from '@google/generative-ai';

interface ExtractedMarkData {
    rollNumber: string;
    marks: number;
}

export class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    private initialize(): void {
        if (this.genAI) return; // Already initialized

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async extractMarkSheetData(imageBuffer: Buffer, mimeType: string): Promise<ExtractedMarkData[]> {
        // Initialize only when actually needed
        this.initialize();

        try {
            const prompt = `
Analyze this mark sheet image and extract student data.
Return ONLY a valid JSON array with this exact structure:
[{"rollNumber": "12545001", "marks": 25.5}, {"rollNumber": "12545002", "marks": 18.0}]

Rules:
- Extract all visible roll numbers and their corresponding marks
- Roll numbers should be strings (preserve leading zeros)
- Marks should be numbers (can have decimals, e.g., 18.5)
- Skip any rows without clear roll numbers or marks
- Do not include any text before or after the JSON array
- Ensure the JSON is valid and parseable
            `.trim();

            const result = await this.model!.generateContent([
                prompt,
                {
                    inlineData: {
                        data: imageBuffer.toString('base64'),
                        mimeType: mimeType
                    }
                }
            ]);

            const response = await result.response;
            const text = response.text();

            // Extract JSON from response (remove markdown code blocks if present)
            let jsonText = text.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/g, '');
            }

            // Parse the JSON
            const extractedData: ExtractedMarkData[] = JSON.parse(jsonText);

            // Validate the data
            if (!Array.isArray(extractedData)) {
                throw new Error('Response is not an array');
            }

            // Validate each item
            const validatedData = extractedData.filter(item => {
                return (
                    item.rollNumber &&
                    typeof item.rollNumber === 'string' &&
                    typeof item.marks === 'number' &&
                    !isNaN(item.marks) &&
                    item.marks >= 0 &&
                    item.marks <= 28
                );
            });

            return validatedData;
        } catch (error: any) {
            console.error('Gemini OCR error:', error);
            throw new Error(`Failed to extract data from image: ${error.message}`);
        }
    }
}

// Export singleton instance
export const geminiService = new GeminiService();
