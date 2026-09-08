export const siteConfig = {
  name: "WhisperKL",
  collegeName: "KL University",
  emailDomain: "kluniversity.in",
  adminEmail: "practicemore98@gmail.com",
  primaryColor: "#0d6b5f",
  description: "Anonymous conversations for KL University students.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export function isCollegeEmail(email: string) {
  return email.trim().toLowerCase().endsWith(`@${siteConfig.emailDomain}`);
}
