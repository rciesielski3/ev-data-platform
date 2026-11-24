import { getTranslations } from "next-intl/server";

import Button from "@/components/ui/Button";

export const buildShareLinks = (url: string, title: string) => {
  const encodedUrl = encodeURIComponent(url);

  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(title)}`,
  };
};

const ShareLinks = async ({
  url,
  title,
  className = "",
}: {
  url: string;
  title: string;
  className?: string;
}) => {
  const t = await getTranslations("share");
  const links = buildShareLinks(url, title);
  const targets = [
    { key: "linkedin", label: t("linkedin"), href: links.linkedin },
    { key: "facebook", label: t("facebook"), href: links.facebook },
    { key: "x", label: t("x"), href: links.x },
  ];

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      <span className="muted text-sm">{t("label")}</span>
      {targets.map(({ key, label, href }) => (
        <Button
          key={key}
          as="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          size="sm"
          aria-label={t("ariaLabel", { network: label })}
        >
          {label}
        </Button>
      ))}
    </div>
  );
};

export default ShareLinks;
