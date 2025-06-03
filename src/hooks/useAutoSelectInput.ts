import { useEffect } from "react";

export function useAutoSelectInput(
  ref: React.RefObject<HTMLInputElement>,
  shouldSelect: boolean,
) {
  useEffect(() => {
    if (shouldSelect && ref.current) {
      ref.current.select();
    }
  }, [shouldSelect, ref]);
}
