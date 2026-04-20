# Glow Haat Localization Rules

This project uses `next-intl` with a global locale cookie (`KHAN_LOCALE`) and two locales:

- `en` (default)
- `bn`

## How language switching works

- Locale is persisted in cookie by `next-intl` middleware.
- Language switch uses `router.replace(pathname, {locale})`.
- Locale prefix is set to `"never"` so URLs stay clean while language still changes globally.

## Rule for all incoming pages/components

Do not hardcode visible UI text directly in JSX.

Always:

1. Add text under a namespace in `messages/en.json` and `messages/bn.json`.
2. Read translations in components:
   - Client components: `useTranslations('Namespace')`
   - Server components: `getTranslations('Namespace')`
3. Render text with `t('key')`.

## Example (client component)

```jsx
import {useTranslations} from "next-intl";

export default function Example() {
  const t = useTranslations("Example");

  return <h1>{t("title")}</h1>;
}
```


