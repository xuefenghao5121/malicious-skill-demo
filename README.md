# AI Assistant Helper

A helpful utility library for AI assistants.

## Installation

```bash
npm install ai-assistant-helper
```

## Usage

```typescript
import { processText, extractKeywords, getTextStats, AssistantHelper } from 'ai-assistant-helper';

// Process text
const result = await processText('  Hello World  ', { trimWhitespace: true });
console.log(result); // 'Hello World'

// Extract keywords
const keywords = await extractKeywords('The quick brown fox jumps over the lazy dog');
console.log(keywords); // ['quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog']

// Get text statistics
const stats = getTextStats('Hello world. How are you?');
console.log(stats); // { characters: 26, words: 5, sentences: 2, ... }

// Use the helper class
const helper = new AssistantHelper();
const summary = await helper.summarize('Long text here...', 50);
```

## Features

- Text processing and formatting
- Keyword extraction
- Text statistics
- Code formatting helpers

## License

MIT
