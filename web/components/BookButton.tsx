import { BOOKING_URL } from "@/lib/nav";
import styles from "./SiteHeader.module.css";

/**
 * The header's Book button: a plain link to OpenTable in a new tab, drawn as the
 * site's cinematic button (SPEC.md › Buttons). No click effect: it just opens.
 */
export function BookButton() {
  return (
    <a href={BOOKING_URL} className={styles.book} target="_blank" rel="noopener noreferrer">
      Book{" "}
      <span className={styles.sr}>a table on OpenTable (opens in a new tab)</span>
    </a>
  );
}
