"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function toggleLanguage() {
    const nextLocale = locale === "en" ? "es" : "en";
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <Button variant="outline" size="sm" onClick={toggleLanguage}>
      {locale === "en" ? "🇪🇸 ES" : "🇬🇧 EN"}
    </Button>
  );
}
