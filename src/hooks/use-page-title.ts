import { useEffect } from "react";

export default function usePageTitle(pageName: string) {
  useEffect(() => {
    document.title = `PrepBuddy | ${pageName}`;
  }, [pageName]);
}
