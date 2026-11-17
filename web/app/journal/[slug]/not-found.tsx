import { JournalNotFound } from "@/components/JournalPage";

// Shown when a /journal/<slug> doesn't match a post. It replaces the whole
// segment, so it brings its own header and Book CTA via the shell.
export default function NotFound() {
  return <JournalNotFound />;
}
