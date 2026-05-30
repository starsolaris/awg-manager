export type RecipeTint = 'accent' | 'success' | 'info';

export interface Recipe {
  id: string;
  tag: string;
  title: string;
  desc: string;
  count: string;
  tint: RecipeTint;
  templateIds: string[];
}

export const RECIPES: readonly Recipe[] = [
  {
    id: 'blocked',
    tag: 'Только заблокированное',
    title: 'VPN для запрещённых сервисов',
    desc: 'Через туннель пойдут только заблокированные в РФ сайты. Всё остальное — напрямую.',
    count: 'preset all-blocked',
    tint: 'success',
    templateIds: ['svc:all-blocked'],
  },
  {
    id: 'streaming',
    tag: 'Селективно',
    title: 'Только стриминги',
    desc: 'Netflix, YouTube, Twitch через зарубежный туннель. Остальное — обычный WAN.',
    count: '3 сервиса',
    tint: 'accent',
    templateIds: ['svc:netflix', 'svc:youtube', 'svc:twitch'],
  },
  {
    id: 'social',
    tag: 'Соцсети',
    title: 'Telegram + Discord',
    desc: 'Мессенджеры через туннель. Подходит когда блокируется один из них.',
    count: '2 сервиса',
    tint: 'info',
    templateIds: ['svc:telegram', 'svc:discord'],
  },
] as const;

export function getRecipeTemplateIds(id: string): string[] {
  const r = RECIPES.find((x) => x.id === id);
  if (!r) {
    throw new Error(`Recipe not found: ${id}`);
  }
  return [...r.templateIds];
}
