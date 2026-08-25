export type SpaceItem = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  href: string;
  builtIn: boolean;
  hidden: boolean;
  order: number;
};

export type SpaceCore = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  builtIn: boolean;
  hidden: boolean;
  order: number;
  items: SpaceItem[];
};

export const SPACE_ICONS = [
  "Briefcase",
  "GraduationCap",
  "Box",
  "Heart",
  "Folder",
  "Code2",
  "Calculator",
  "TrendingUp",
  "ShieldAlert",
  "Dumbbell",
  "CalendarCheck2",
  "BookOpen",
  "Wallet",
  "Users",
  "Sparkles",
  "Target",
  "Globe",
  "PenLine",
] as const;

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "item";
}

export function customItemHref(coreSlug: string, itemSlug: string) {
  return `/s/${coreSlug}/${itemSlug}`;
}

export function defaultCores(): SpaceCore[] {
  return [
    {
      id: "core-career",
      slug: "career",
      name: "Career",
      icon: "Briefcase",
      builtIn: true,
      hidden: false,
      order: 0,
      items: [
        { id: "career-jobs", slug: "jobs", name: "Job Hunt", icon: "Briefcase", href: "/career/jobs", builtIn: true, hidden: false, order: 0 },
        { id: "career-dsa", slug: "dsa", name: "DSA", icon: "Code2", href: "/career/dsa", builtIn: true, hidden: false, order: 1 },
        { id: "career-aptitude", slug: "aptitude", name: "Aptitude", icon: "Calculator", href: "/career/aptitude", builtIn: true, hidden: false, order: 2 },
      ],
    },
    {
      id: "core-education",
      slug: "education",
      name: "Education",
      icon: "GraduationCap",
      builtIn: true,
      hidden: false,
      order: 1,
      items: [
        { id: "edu-iitm", slug: "iitm", name: "IIT Madras", icon: "GraduationCap", href: "/education/iitm", builtIn: true, hidden: false, order: 0 },
        { id: "edu-upskill", slug: "upskilling", name: "Upskilling", icon: "TrendingUp", href: "/education/upskilling", builtIn: true, hidden: false, order: 1 },
      ],
    },
    {
      id: "core-leadership",
      slug: "leadership",
      name: "Leadership",
      icon: "Box",
      builtIn: true,
      hidden: false,
      order: 2,
      items: [
        { id: "lead-apthex", slug: "apthex", name: "Apthex", icon: "Box", href: "/leadership/apthex", builtIn: true, hidden: false, order: 0 },
        { id: "lead-cyberx", slug: "cyberx", name: "CyberX", icon: "ShieldAlert", href: "/leadership/cyberx", builtIn: true, hidden: false, order: 1 },
      ],
    },
    {
      id: "core-personal",
      slug: "personal",
      name: "Personal",
      icon: "Heart",
      builtIn: true,
      hidden: false,
      order: 3,
      items: [
        { id: "per-fitness", slug: "fitness", name: "Fitness", icon: "Dumbbell", href: "/personal/fitness", builtIn: true, hidden: false, order: 0 },
        { id: "per-life", slug: "life", name: "Personal Life", icon: "Heart", href: "/personal/life", builtIn: true, hidden: false, order: 1 },
        { id: "per-checklist", slug: "checklist", name: "Checklist", icon: "CalendarCheck2", href: "/personal/checklist", builtIn: true, hidden: false, order: 2 },
      ],
    },
  ];
}

export function uniqueSlug(base: string, existing: string[]) {
  let slug = slugify(base);
  if (!existing.includes(slug)) return slug;
  let n = 2;
  while (existing.includes(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
}