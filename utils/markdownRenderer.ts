import MarkdownIt from 'markdown-it';
import mdKatex from 'markdown-it-katex';
import hljs from 'highlight.js';

const md = new MarkdownIt({
  html: false, // Do not allow HTML tags in Markdown
  xhtmlOut: false,
  breaks: true, // Convert '\n' in paragraphs into <br>
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable some language-neutral replacement + quotes beautification
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {/* no-op */}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'; // use escapeHtml for unknown languages
  }
});

// Use KaTeX for math rendering
md.use(mdKatex, { "throwOnError": false, "errorColor": " #cc0000" });

export const renderMarkdown = (markdownText: string): string => {
  if (typeof markdownText !== 'string') {
    return '';
  }
  return md.render(markdownText);
};