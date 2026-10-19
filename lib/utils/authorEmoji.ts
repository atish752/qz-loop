/**
 * Dynamic Aspirant Emoji & Profile Utilities
 */

const ASPIRANT_EMOJIS = [
  "🎯", "👨‍🎓", "👩‍🎓", "🧑‍💻", "🚀", "⚡", "🌟", "📚", "🦁", "🦉", "🏆", "💡", "🔥", "✍️", "🎓"
];

export function getAuthorEmoji(identifier?: string): string {
  if (!identifier) return "👨‍🎓";
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0;
  }
  return ASPIRANT_EMOJIS[Math.abs(hash) % ASPIRANT_EMOJIS.length];
}

export function getAuthorFallbackUsername(authorName?: string, authorId?: string): string {
  if (authorId === "user-current") return "rahul_cgl";
  if (authorId === "user-amit") return "amit_ssc";
  if (authorId === "user-priya") return "priya_quant";
  if (authorId === "user-vikram") return "vikram_p";
  if (authorId === "user-ananya") return "ananya_r";
  if (authorName) {
    const clean = authorName.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/__+/g, "_").replace(/^_|_$/g, "");
    return clean || "aspirant";
  }
  return authorId ? `aspirant_${authorId.slice(0, 6)}` : "aspirant";
}
