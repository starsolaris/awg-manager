import { describe, it, expect } from 'vitest';
import { RECIPES, getRecipeTemplateIds, type RecipeTint } from './recipes';

describe('recipes', () => {
  it('RECIPES has 3 entries', () => {
    expect(RECIPES).toHaveLength(3);
  });

  it('each recipe has required fields', () => {
    for (const r of RECIPES) {
      expect(r.id).toBeTruthy();
      expect(r.tag).toBeTruthy();
      expect(r.title).toBeTruthy();
      expect(r.desc).toBeTruthy();
      expect(r.count).toBeTruthy();
      expect(r.tint).toBeTruthy();
      expect(Array.isArray(r.templateIds)).toBe(true);
      expect(r.templateIds.length).toBeGreaterThan(0);
      for (const id of r.templateIds) {
        expect(id.startsWith('svc:') || id.startsWith('rs:')).toBe(true);
      }
    }
  });

  it('all tints are valid', () => {
    const valid: RecipeTint[] = ['accent', 'success', 'info'];
    for (const r of RECIPES) {
      expect(valid).toContain(r.tint);
    }
  });

  it('getRecipeTemplateIds returns ids', () => {
    const ids = getRecipeTemplateIds('streaming');
    expect(ids).toEqual(['svc:netflix', 'svc:youtube', 'svc:twitch']);
  });

  it('getRecipeTemplateIds throws for unknown id', () => {
    expect(() => getRecipeTemplateIds('zzzzz')).toThrow();
  });
});
