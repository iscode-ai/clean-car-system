import { Suspense } from "react";
import AcompanharConteudo from "./conteudo";

export default function AcompanharPage() {
  return (
    <Suspense fallback={null}>
      <AcompanharConteudo />
    </Suspense>
  );
}
