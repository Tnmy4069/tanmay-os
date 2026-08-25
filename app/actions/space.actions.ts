"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import SpaceConfig from "@/models/SpaceConfig";
import SpaceNote from "@/models/SpaceNote";
import {
  customItemHref,
  defaultCores,
  type SpaceCore,
  uniqueSlug,
} from "@/lib/spaces";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

function toCores(doc: { cores?: SpaceCore[] } | null): SpaceCore[] {
  if (!doc?.cores?.length) return defaultCores();
  return doc.cores.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    builtIn: Boolean(c.builtIn),
    hidden: Boolean(c.hidden),
    order: c.order ?? 0,
    items: (c.items || []).map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      icon: i.icon,
      href: i.href,
      builtIn: Boolean(i.builtIn),
      hidden: Boolean(i.hidden),
      order: i.order ?? 0,
    })),
  }));
}

async function loadOrCreate(userId: string) {
  await connectToDatabase();
  let doc = await SpaceConfig.findOne({ userId });
  if (!doc) {
    doc = await SpaceConfig.create({ userId, cores: defaultCores() });
  }
  return doc;
}

async function save(userId: string, cores: SpaceCore[]) {
  await connectToDatabase();
  await SpaceConfig.findOneAndUpdate({ userId }, { cores }, { upsert: true });
  revalidatePath("/", "layout");
}

export async function getSpaceNav(): Promise<SpaceCore[]> {
  const userId = await requireUser();
  const doc = await loadOrCreate(userId);
  return toCores(doc);
}

export async function renameCoreAction(coreId: string, name: string) {
  const userId = await requireUser();
  const cores = toCores(await loadOrCreate(userId));
  const core = cores.find((c) => c.id === coreId);
  if (!core) throw new Error("Category not found");
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name required");
  core.name = trimmed;
  await save(userId, cores);
}

export async function renameItemAction(coreId: string, itemId: string, name: string) {
  const userId = await requireUser();
  const cores = toCores(await loadOrCreate(userId));
  const item = cores.find((c) => c.id === coreId)?.items.find((i) => i.id === itemId);
  if (!item) throw new Error("Subcategory not found");
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name required");
  item.name = trimmed;
  await save(userId, cores);
}

export async function setItemHiddenAction(coreId: string, itemId: string, hidden: boolean) {
  const userId = await requireUser();
  const cores = toCores(await loadOrCreate(userId));
  const item = cores.find((c) => c.id === coreId)?.items.find((i) => i.id === itemId);
  if (!item) throw new Error("Subcategory not found");
  item.hidden = hidden;
  await save(userId, cores);
}

export async function addCoreAction(name: string, icon: string) {
  const userId = await requireUser();
  const cores = toCores(await loadOrCreate(userId));
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name required");
  const slug = uniqueSlug(trimmed, cores.map((c) => c.slug));
  cores.push({
    id: randomUUID(),
    slug,
    name: trimmed,
    icon: icon || "Folder",
    builtIn: false,
    hidden: false,
    order: cores.length,
    items: [],
  });
  await save(userId, cores);
}

export async function addItemAction(coreId: string, name: string, icon: string) {
  const userId = await requireUser();
  const cores = toCores(await loadOrCreate(userId));
  const core = cores.find((c) => c.id === coreId);
  if (!core) throw new Error("Category not found");
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name required");
  const slug = uniqueSlug(trimmed, core.items.map((i) => i.slug));
  core.items.push({
    id: randomUUID(),
    slug,
    name: trimmed,
    icon: icon || "Folder",
    href: customItemHref(core.slug, slug),
    builtIn: false,
    hidden: false,
    order: core.items.length,
  });
  await save(userId, cores);
}

export async function deleteCoreAction(coreId: string) {
  const userId = await requireUser();
  const cores = toCores(await loadOrCreate(userId));
  const core = cores.find((c) => c.id === coreId);
  if (!core) throw new Error("Category not found");
  if (core.builtIn) throw new Error("Built-in categories cannot be deleted");
  await save(userId, cores.filter((c) => c.id !== coreId));
}

export async function deleteItemAction(coreId: string, itemId: string) {
  const userId = await requireUser();
  const cores = toCores(await loadOrCreate(userId));
  const core = cores.find((c) => c.id === coreId);
  if (!core) throw new Error("Category not found");
  const item = core.items.find((i) => i.id === itemId);
  if (!item) throw new Error("Subcategory not found");
  if (item.builtIn) throw new Error("Built-in pages cannot be deleted. Hide them instead.");
  core.items = core.items.filter((i) => i.id !== itemId);
  await save(userId, cores);
}

export async function getCustomSpace(coreSlug: string, itemSlug: string) {
  const userId = await requireUser();
  const cores = toCores(await loadOrCreate(userId));
  const core = cores.find((c) => c.slug === coreSlug && !c.hidden);
  const item = core?.items.find((i) => i.slug === itemSlug && !i.hidden);
  if (!core || !item || item.builtIn) return null;
  await connectToDatabase();
  const note = await SpaceNote.findOne({ userId, coreSlug, itemSlug }).lean();
  return {
    coreName: core.name,
    itemName: item.name,
    icon: item.icon,
    notes: note?.notes || "",
  };
}

export async function saveSpaceNoteAction(coreSlug: string, itemSlug: string, notes: string) {
  const userId = await requireUser();
  await connectToDatabase();
  await SpaceNote.findOneAndUpdate(
    { userId, coreSlug, itemSlug },
    { notes },
    { upsert: true }
  );
  revalidatePath(`/s/${coreSlug}/${itemSlug}`);
}