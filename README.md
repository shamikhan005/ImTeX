# ImTeX - Image to LaTeX converter

ImTeX is a web application that converts images containing mathematical equations, tables, and other structured content into LaTeX code.

![Screenshot 2025-03-25 143729](https://github.com/user-attachments/assets/3b281e83-c4f0-49d7-9add-f524b969afca) ![Screenshot 2025-03-25 143747](https://github.com/user-attachments/assets/f6ff0f20-aea7-4d66-b271-1845715946f9)



## features

- **intelligent structure detection**: automatically detects equations, tables, lists, and other document structures
- **document type optimization**: specify document types (equations, tables, resumes, etc.) for improved conversion accuracy
- **high-quality LaTeX output**: generates well-formatted LaTeX code with appropriate packages
- **detailed conversion insights**: provides information about detected structures and conversion confidence

## tech stack

- **frontend**: next.js, typescript, tailwindCSS
- **image processing**: cloudinary for image storage and management
- **OCR**: mistral OCR 2503 for high-accuracy text and structure recognition
- **AI**: google gemini API for advanced document structure analysis
- **LaTeX conversion**: custom processing pipeline with specialized handling for different document types and pandoc integration

## getting started

### prerequisites

- node.js (v18 or higher)
- npm or yarn
- pandoc (for markdown to LaTeX conversion)
- mistral AI API key
- google gemini API key
- cloudinary

### installation

1. clone the repository

```bash
git clone https://github.com/shamikhan005/ImTeX.git
cd ImTeX
```

2. install dependencies

```bash
npm install
# or
yarn install
```

3. create a `.env` file in the root directory with the following variables:

```
MISTRAL_API_KEY=your_mistral_api_key
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

4. start the development server

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. upload an image containing equations, tables, or other structured content using drag-and-drop or file browser
2. select the appropriate document type for better conversion results (Auto-detect, Mathematical Equations, Table/Structured Data, Resume/CV, or General Document)
3. click "Convert to LaTeX" to process the image
4. view the generated LaTeX code, copy it to your clipboard, or download it as a .tex file
5. use the "Show Details" button to see information about detected document structures and conversion confidence
