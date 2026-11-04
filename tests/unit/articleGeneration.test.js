import { describe, expect, it, vi } from 'vitest';
import { generateArticleFromKeyword } from '../../src/services/articleService';
import { KEYWORDS, SEO_PAGES } from '../../src/pages/AdminSEO/seoData';

vi.mock('../../src/supabaseClient', () => ({ supabase: {} }));

describe('SEO Radar location', () => {
  it('uses Hanoi for local keyword suggestions and homepage metadata', () => {
    const localKeywords = KEYWORDS.filter(({ keyword }) => /Hà Nội|Hanoi/.test(keyword));

    expect(localKeywords).toHaveLength(5);
    expect(KEYWORDS.some(({ keyword }) => /HCM|Hồ Chí Minh/i.test(keyword))).toBe(false);
    expect(SEO_PAGES[0].title.value).toContain('Hà Nội');
    expect(SEO_PAGES[0].meta.value).toContain('Hà Nội');
  });

  it('generates recommended and custom articles for Hanoi', () => {
    for (const keyword of ['khách sạn mèo Hà Nội', 'chủ đề tùy chỉnh']) {
      const article = generateArticleFromKeyword(keyword);
      const content = [
        article.title,
        article.excerpt,
        article.meta_title,
        article.meta_description,
        ...article.tags,
        ...article.sections.flatMap(({ heading, content: sectionContent }) => [heading, sectionContent]),
      ].join('\n');

      expect(content).toContain('Hà Nội');
      expect(content).not.toMatch(/HCM|Hồ Chí Minh|TP\.\s?HCM/i);
    }
  });
});